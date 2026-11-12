// OURS (v0.9.0). Own-ship telemetry from the game's local web server
// (http://127.0.0.1:8111) while you play, matched afterwards to your aircraft in
// the converted server replay.
//
// Recording: while switched on, the viewer polls /state and /indicators about
// 10 times a second. Each flight (from spawning until the game reports "not
// valid" for 5 s, i.e. back in the hangar) becomes one file
// sessions/live/<start unix ms>_<aircraft>.wtlive.json, saved every 30 s while
// flying and at the end.
//
// Matching: for a match, every log whose wall-clock time overlaps the match is
// tried against the aircraft of the same internal type (the replay's unit
// "class" is the same name the game reports as "type"), preferring the player
// named in "Me". The start guess comes from the clocks (log start time vs the
// match start time); a search of ±120 s, refined to 25 ms, maximises the
// correlation of climb rate, speed and altitude. Accepted when the composite
// correlation is at least 0.7 over at least 15 s.
//
// The result is saved next to the match as <id>.ownship.json; the .wtr itself is
// never changed, so reconverting a replay keeps the telemetry (it is matched
// again). Based on a draft by another reviewer (Gemini), rewritten.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

// liveBase is the game's local web server (a variable so tests can point it elsewhere).
var liveBase = "http://127.0.0.1:8111"

const (
	liveIdlePoll      = 2 * time.Second
	liveActivePoll    = 100 * time.Millisecond
	liveHTTPTimeout   = 400 * time.Millisecond
	liveEndAfter      = 5 * time.Second  // this long without valid data ends a flight
	liveSaveEvery     = 30 * time.Second // checkpoint while flying
	liveMinSamples    = 100              // ~10 s; shorter flights are not kept
	alignStepMs       = 200.0
	alignCoarseMs     = 120000.0
	alignCoarseStepMs = 500.0
	alignFineMs       = 1000.0
	alignFineStepMs   = 25.0
	alignMinCorr      = 0.70
	alignMinOverlapS  = 15.0
	ownshipVersion    = 1
)

// liveSample is one poll. T is wall-clock unix time in ms. Fields the game does
// not report stay 0 (see Keys in the log for the names it did report).
type liveSample struct {
	T         float64 `json:"t"`
	IASKmh    float64 `json:"ias"`
	TASKmh    float64 `json:"tas"`
	Mach      float64 `json:"m"`
	AltM      float64 `json:"h"`
	VyMs      float64 `json:"vy"`
	AoA       float64 `json:"aoa"`
	AoS       float64 `json:"aos"`
	Ny        float64 `json:"ny"`
	WxDegS    float64 `json:"wx"`
	Throttle  float64 `json:"thr"`
	FuelKg    float64 `json:"fuel"`
	FuelMaxKg float64 `json:"fuel0"`
	Compass   float64 `json:"hdg"`
	Pitch     float64 `json:"pitch"`
	Roll      float64 `json:"roll"`
	StickElev float64 `json:"se"`
	StickAil  float64 `json:"sa"`
	Pedals    float64 `json:"ped"`
}

type liveLog struct {
	Schema   int          `json:"schema"`
	Aircraft string       `json:"aircraft"` // internal name, e.g. "f_15c"
	StartMs  float64      `json:"startUnixMs"`
	EndMs    float64      `json:"endUnixMs"`
	Done     bool         `json:"done"` // false while still being recorded
	Keys     []string     `json:"keys"` // field names the game reported (first sample)
	Samples  []liveSample `json:"samples"`
}

type liveRecorder struct {
	dir    string
	client *http.Client

	mu        sync.Mutex
	on        bool
	cancel    context.CancelFunc
	cur       *liveLog
	lastValid time.Time
	lastSave  time.Time
	lastErr   string
	saved     int
}

func newLiveRecorder(dir string) *liveRecorder {
	return &liveRecorder{dir: dir, client: &http.Client{Timeout: liveHTTPTimeout}}
}

func (lr *liveRecorder) setOn(on bool) {
	lr.mu.Lock()
	defer lr.mu.Unlock()
	if on == lr.on {
		return
	}
	lr.on = on
	if on {
		ctx, cancel := context.WithCancel(context.Background())
		lr.cancel = cancel
		go lr.loop(ctx)
		return
	}
	lr.cancel()
	lr.finishLocked()
}

// Close saves a flight in progress (called when the viewer quits).
func (lr *liveRecorder) Close() { lr.setOn(false) }

func (lr *liveRecorder) loop(ctx context.Context) {
	for {
		lr.mu.Lock()
		wait := liveIdlePoll
		if lr.cur != nil {
			wait = liveActivePoll
		}
		lr.mu.Unlock()
		select {
		case <-ctx.Done():
			return
		case <-time.After(wait):
		}
		st, err1 := lr.get("/state")
		ind, err2 := lr.get("/indicators")
		now := time.Now()
		lr.mu.Lock()
		if ctx.Err() != nil { // switched off meanwhile
			lr.mu.Unlock()
			return
		}
		switch {
		case err1 != nil || err2 != nil:
			lr.lastErr = "game not running or not answering on 127.0.0.1:8111"
		default:
			lr.lastErr = ""
		}
		typ := strings.TrimSpace(jStr(ind, "type"))
		valid := err1 == nil && err2 == nil && jBool(st, "valid") && jBool(ind, "valid") && typ != "" && typ != "dummy_plane"
		if valid {
			if lr.cur != nil && lr.cur.Aircraft != typ { // changed aircraft without a gap
				lr.finishLocked()
			}
			if lr.cur == nil {
				lr.cur = &liveLog{Schema: 1, Aircraft: typ, StartMs: float64(now.UnixMilli()), Keys: keysOf(st, ind)}
				lr.lastSave = now
			}
			lr.lastValid = now
			lr.cur.Samples = append(lr.cur.Samples, liveSample{
				T: float64(now.UnixMilli()), IASKmh: jNum(st, "IAS, km/h"), TASKmh: jNum(st, "TAS, km/h"), Mach: jNum(st, "M"),
				AltM: jNum(st, "H, m"), VyMs: jNum(st, "Vy, m/s"), AoA: jNum(st, "AoA, deg"), AoS: jNum(st, "AoS, deg"),
				Ny: jNum(st, "Ny"), WxDegS: jNum(st, "Wx, deg/s"), Throttle: jNum(st, "throttle 1, %"),
				FuelKg: jNum(st, "Mfuel, kg"), FuelMaxKg: jNum(st, "Mfuel0, kg"), Compass: jNum(ind, "compass"),
				Pitch: jNum(ind, "aviahorizon_pitch"), Roll: jNum(ind, "aviahorizon_roll"),
				StickElev: jNum(ind, "stick_elevator"), StickAil: jNum(ind, "stick_ailerons"), Pedals: jNum(ind, "pedals"),
			})
			if now.Sub(lr.lastSave) >= liveSaveEvery {
				lr.saveLocked(false)
				lr.lastSave = now
			}
		} else if lr.cur != nil && now.Sub(lr.lastValid) >= liveEndAfter {
			lr.finishLocked()
		}
		lr.mu.Unlock()
	}
}

func (lr *liveRecorder) finishLocked() {
	if lr.cur == nil {
		return
	}
	if len(lr.cur.Samples) >= liveMinSamples {
		lr.saveLocked(true)
		lr.saved++
	} else {
		_ = os.Remove(lr.pathOf(lr.cur)) // drop a short checkpoint
	}
	lr.cur = nil
}

func (lr *liveRecorder) pathOf(l *liveLog) string {
	return filepath.Join(lr.dir, fmt.Sprintf("%d_%s.wtlive.json", int64(l.StartMs), fileSafe(l.Aircraft)))
}

func (lr *liveRecorder) saveLocked(done bool) {
	l := lr.cur
	l.Done = done
	if n := len(l.Samples); n > 0 {
		l.EndMs = l.Samples[n-1].T
	}
	if err := os.MkdirAll(lr.dir, 0o755); err != nil {
		lr.lastErr = err.Error()
		return
	}
	b, err := json.Marshal(l)
	if err != nil {
		return
	}
	p := lr.pathOf(l)
	if err := os.WriteFile(p+".tmp", b, 0o644); err == nil {
		_ = os.Rename(p+".tmp", p)
	}
}

func (lr *liveRecorder) status() map[string]any {
	lr.mu.Lock()
	defer lr.mu.Unlock()
	s := map[string]any{"on": lr.on, "recording": lr.cur != nil, "savedThisSession": lr.saved, "error": lr.lastErr, "folder": lr.dir}
	if lr.cur != nil {
		s["aircraft"], s["samples"] = lr.cur.Aircraft, len(lr.cur.Samples)
	}
	return s
}

func (lr *liveRecorder) get(path string) (map[string]any, error) {
	resp, err := lr.client.Get(liveBase + path)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}
	var m map[string]any
	return m, json.NewDecoder(resp.Body).Decode(&m)
}

// ---------------------------------------------------------------- matching

type ownshipLife struct {
	Unit        int     `json:"unit"`
	Aircraft    string  `json:"aircraft"`
	Log         string  `json:"log"`
	OffsetMs    float64 `json:"offsetMs"` // replay t = unix ms − match start unix ms + OffsetMs
	Correlation float64 `json:"correlation"`
	RMSEAltM    float64 `json:"rmseAltM"`
	RMSESpeedMs float64 `json:"rmseSpeedMs"`
	OverlapS    float64 `json:"overlapS"`
	// columns, replay clock (ms)
	T, IAS, TAS, Mach, Alt, Vy, AoA, AoS, Ny, Wx, Throttle, Fuel, FuelMax []float64
}

type ownshipFile struct {
	Version int           `json:"version"`
	Stamp   string        `json:"stamp"`
	Lives   []ownshipLife `json:"lives"`
	Tried   []string      `json:"tried,omitempty"` // logs that overlapped but did not match, with why
}

type gpt struct{ t, alt, vy, spd float64 }

func resample(p []gpt, step float64) []gpt {
	if len(p) < 2 {
		return nil
	}
	var out []gpt
	j := 0
	for t := p[0].t; t <= p[len(p)-1].t; t += step {
		for j+1 < len(p)-1 && p[j+1].t < t {
			j++
		}
		a, b := p[j], p[j+1]
		f := 0.0
		if b.t > a.t {
			f = math.Max(0, math.Min(1, (t-a.t)/(b.t-a.t)))
		}
		out = append(out, gpt{t, a.alt + f*(b.alt-a.alt), a.vy + f*(b.vy-a.vy), a.spd + f*(b.spd-a.spd)})
	}
	return out
}

// server track on a uniform 200 ms grid: positions are interpolated first, then
// climb rate and speed are centred differences over ±0.6 s of that grid (time-based,
// so uneven replay sample spacing does not shift them).
func unitGrid(u *wUnit) []gpt {
	n := u.n()
	if n < 5 {
		return nil
	}
	const half = 3 // grid steps each side
	var ts []float64
	var ps []vec3
	for t := u.T[0]; t <= u.T[n-1]; t += alignStepMs {
		ts = append(ts, t)
		ps = append(ps, u.pos(t))
	}
	var out []gpt
	for i := half; i < len(ts)-half; i++ {
		d := ps[i+half].sub(ps[i-half])
		dt := (ts[i+half] - ts[i-half]) / 1000
		out = append(out, gpt{ts[i], ps[i][1], d[1] / dt, d.norm() / dt})
	}
	return out
}

func logGrid(l *liveLog, t0 float64) []gpt {
	raw := make([]gpt, 0, len(l.Samples))
	for _, s := range l.Samples {
		raw = append(raw, gpt{s.T - t0, s.AltM, s.VyMs, s.TASKmh / 3.6})
	}
	return resample(raw, alignStepMs)
}

func pearson(a, b []float64) float64 {
	n := float64(len(a))
	var ma, mb float64
	for i := range a {
		ma += a[i]
		mb += b[i]
	}
	ma, mb = ma/n, mb/n
	var c, va, vb float64
	for i := range a {
		c += (a[i] - ma) * (b[i] - mb)
		va += (a[i] - ma) * (a[i] - ma)
		vb += (b[i] - mb) * (b[i] - mb)
	}
	if va < 1e-9 || vb < 1e-9 {
		return 0
	}
	return c / math.Sqrt(va*vb)
}

// score of the log shifted by off (ms) against the unit grid
func shiftScore(lg, ug []gpt, off float64) (corr, rmseAlt, rmseSpd, overlapS float64) {
	if len(lg) < 2 || len(ug) < 2 {
		return -1, 0, 0, 0
	}
	lo := math.Max(lg[0].t+off, ug[0].t)
	hi := math.Min(lg[len(lg)-1].t+off, ug[len(ug)-1].t)
	overlapS = (hi - lo) / 1000
	if overlapS < alignMinOverlapS {
		return -1, 0, 0, overlapS
	}
	var la, ua, lv, uv, ls, us []float64
	var sa, ss float64
	for t := lo; t <= hi; t += alignStepMs {
		x := (t - off - lg[0].t) / alignStepMs // fractional position in the log grid
		i := int(math.Floor(x))
		k := int(math.Round((t - ug[0].t) / alignStepMs))
		if i < 0 || k < 0 || i+1 >= len(lg) || k >= len(ug) {
			continue
		}
		f := x - float64(i)
		a, c := lg[i], lg[i+1]
		l := gpt{t, a.alt + f*(c.alt-a.alt), a.vy + f*(c.vy-a.vy), a.spd + f*(c.spd-a.spd)}
		u := ug[k]
		la, ua, lv, uv, ls, us = append(la, l.alt), append(ua, u.alt), append(lv, l.vy), append(uv, u.vy), append(ls, l.spd), append(us, u.spd)
		sa += (l.alt - u.alt) * (l.alt - u.alt)
		ss += (l.spd - u.spd) * (l.spd - u.spd)
	}
	n := float64(len(la))
	if n < 50 {
		return -1, 0, 0, overlapS
	}
	corr = 0.45*pearson(lv, uv) + 0.35*pearson(ls, us) + 0.20*pearson(la, ua)
	return corr, math.Sqrt(sa / n), math.Sqrt(ss / n), overlapS
}

// alignLog finds the shift of a log against one unit. t0 is the match start (unix ms).
func alignLog(l *liveLog, u *wUnit, t0 float64) (off, corr, rA, rS, ov float64, ok bool) {
	lg, ug := logGrid(l, t0), unitGrid(u)
	if len(lg) < 75 || len(ug) < 75 {
		return
	}
	best, bc := 0.0, -2.0
	for s := -alignCoarseMs; s <= alignCoarseMs; s += alignCoarseStepMs {
		if c, _, _, _ := shiftScore(lg, ug, s); c > bc {
			best, bc = s, c
		}
	}
	if bc < 0 {
		return
	}
	off = best
	corr, rA, rS, ov = shiftScore(lg, ug, best)
	for s := best - alignFineMs; s <= best+alignFineMs; s += alignFineStepMs {
		if c, a, sp, o := shiftScore(lg, ug, s); c > corr {
			off, corr, rA, rS, ov = s, c, a, sp, o
		}
	}
	return off, corr, rA, rS, ov, true
}

func readLiveLogs(dir string) ([]*liveLog, []string) {
	files, _ := filepath.Glob(filepath.Join(dir, "*.wtlive.json"))
	sort.Strings(files)
	var out []*liveLog
	var names []string
	for _, f := range files {
		b, err := os.ReadFile(f)
		if err != nil {
			continue
		}
		var l liveLog
		if json.Unmarshal(b, &l) != nil || len(l.Samples) < liveMinSamples {
			continue
		}
		out = append(out, &l)
		names = append(names, filepath.Base(f))
	}
	return out, names
}

// matchOwnship aligns every overlapping log with the session.
func matchOwnship(s *wSession, logs []*liveLog, names []string, me string) ownshipFile {
	of := ownshipFile{Version: ownshipVersion}
	t0 := float64(s.Manifest.Match.StartUnix) * 1000
	if t0 <= 0 {
		return of
	}
	mStart, mEnd := t0+s.Manifest.Match.TFirst-120000, t0+s.Manifest.Match.TLast+120000
	used := map[int]bool{}
	for li, l := range logs {
		if l.EndMs < mStart || l.StartMs > mEnd {
			continue
		}
		var bestU *wUnit
		var best ownshipLife
		best.Correlation = -2
		for _, u := range s.Units {
			if u.Kind != "aircraft" || u.AI || used[u.ID] || !strings.EqualFold(u.Class, l.Aircraft) {
				continue
			}
			off, c, rA, rS, ov, ok := alignLog(l, u, t0)
			if !ok {
				continue
			}
			if me != "" && u.Owner >= 0 {
				if p := s.bySlot[u.Owner]; p != nil && strings.EqualFold(p.Name, me) {
					c += 0.05 // prefer my own aircraft when two are alike
				}
			}
			if c > best.Correlation {
				bestU = u
				best = ownshipLife{Unit: u.ID, Aircraft: l.Aircraft, Log: names[li], OffsetMs: math.Round(off), Correlation: c, RMSEAltM: rA, RMSESpeedMs: rS, OverlapS: ov}
			}
		}
		if bestU == nil {
			of.Tried = append(of.Tried, names[li]+": no aircraft of type "+l.Aircraft+" in this match")
			continue
		}
		if best.Correlation < alignMinCorr {
			of.Tried = append(of.Tried, fmt.Sprintf("%s: best match %.2f below %.2f", names[li], best.Correlation, alignMinCorr))
			continue
		}
		best.Correlation = math.Min(1, best.Correlation)
		used[bestU.ID] = true
		for _, x := range l.Samples {
			t := x.T - t0 + best.OffsetMs
			if t < bestU.TStart-2000 || t > bestU.TEnd+2000 {
				continue
			}
			best.T = append(best.T, math.Round(t))
			best.IAS, best.TAS, best.Mach, best.Alt = append(best.IAS, x.IASKmh), append(best.TAS, x.TASKmh), append(best.Mach, x.Mach), append(best.Alt, x.AltM)
			best.Vy, best.AoA, best.AoS, best.Ny = append(best.Vy, x.VyMs), append(best.AoA, x.AoA), append(best.AoS, x.AoS), append(best.Ny, x.Ny)
			best.Wx, best.Throttle, best.Fuel, best.FuelMax = append(best.Wx, x.WxDegS), append(best.Throttle, x.Throttle), append(best.Fuel, x.FuelKg), append(best.FuelMax, x.FuelMaxKg)
		}
		of.Lives = append(of.Lives, best)
	}
	return of
}

// ownship returns the telemetry for a match, matching again when the match or the logs changed.
func (st *store) ownship(id, me string, logDir string, force bool) ([]byte, error) {
	wtr := filepath.Join(st.sessDir, id+".wtr")
	fi, err := os.Stat(wtr)
	if err != nil {
		return nil, err
	}
	stamp := fmt.Sprintf("%d|%d|%s|%s", ownshipVersion, fi.ModTime().UnixNano(), dirStamp(logDir, "*.wtlive.json"), strings.ToLower(me))
	side := filepath.Join(st.sessDir, id+".ownship.json")
	m := st.lock(id + ".own")
	m.Lock()
	defer m.Unlock()
	if !force {
		if b, err := os.ReadFile(side); err == nil {
			var head struct{ Stamp string }
			if json.Unmarshal(b, &head) == nil && head.Stamp == stamp {
				return b, nil
			}
		}
	}
	logs, names := readLiveLogs(logDir)
	if len(logs) == 0 {
		return nil, errors.New("no recorded flights")
	}
	s, err := loadWTR(wtr)
	if err != nil {
		return nil, err
	}
	of := matchOwnship(s, logs, names, me)
	of.Stamp = stamp
	b, err := json.Marshal(of)
	if err != nil {
		return nil, err
	}
	_ = os.WriteFile(side, b, 0o644)
	return b, nil
}

// ---------------------------------------------------------------- helpers

func keysOf(ms ...map[string]any) []string {
	var k []string
	for _, m := range ms {
		for n := range m {
			k = append(k, n)
		}
	}
	sort.Strings(k)
	return k
}

func jNum(m map[string]any, k string) float64 {
	if f, ok := m[k].(float64); ok && !math.IsNaN(f) && !math.IsInf(f, 0) {
		return f
	}
	return 0
}
func jBool(m map[string]any, k string) bool  { b, _ := m[k].(bool); return b }
func jStr(m map[string]any, k string) string { s, _ := m[k].(string); return s }

func fileSafe(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r < 128 && (r == '_' || r == '-' || r >= '0' && r <= '9' || r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z') {
			b.WriteRune(r)
		} else {
			b.WriteByte('_')
		}
	}
	return b.String()
}
