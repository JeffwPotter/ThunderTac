// OURS (not from the upstream snapshot).
//
// Additions to the session file:
//   - terrain lookup (.wtt) so aircraft tracks end when they hit the ground
//   - an "aircraft never underground" self-check
//   - launches.json: one record per missile launch with launch conditions and
//     an outcome. Outcomes other than "kill" are inferred, never recorded by
//     the game, and carry a confidence.
package main

import (
	"archive/zip"
	"encoding/binary"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"unicode"

	"github.com/maxsupermanhd/wrpl-inspector/v3/wrpl/packet/parser/projectiles"
)

var wtrTerrainDir = flag.String("terrain", "", "with -wtr: folder with terrain files (.wtt); default <program folder>/../assets/terrain")

type wtrTerrain struct {
	n                    int
	x0, z0, cell         float64
	hMin, hMax, water    float64
	h                    []uint16
	level, source, fname string
	// optional 2 m grid of the tank battle area (terrain schema 2)
	dn, dm          int
	dx0, dz0, dcell float64
	dhMin, dhMax    float64
	dh              []uint16
	// hand-placed buildings, walls and rocks (terrain schema 3): shells stop at them
	obstacles *obstacleIndex
}

func wtrLoadTerrain(level string) *wtrTerrain {
	dir := *wtrTerrainDir
	if dir == "" {
		exe, err := os.Executable()
		if err != nil {
			return nil
		}
		dir = filepath.Join(filepath.Dir(filepath.Dir(exe)), "assets", "terrain")
	}
	base := filepath.Base(strings.ReplaceAll(level, "\\", "/"))
	base = strings.TrimSuffix(base, filepath.Ext(base))
	if base == "" || base == "." {
		return nil
	}
	path := filepath.Join(dir, base+".wtt")
	zr, err := zip.OpenReader(path)
	if err != nil {
		return nil
	}
	defer zr.Close()
	t := &wtrTerrain{level: base, fname: path}
	var meta struct {
		GridSize   int     `json:"gridSize"`
		X0         float64 `json:"x0"`
		Z0         float64 `json:"z0"`
		CellM      float64 `json:"cellM"`
		HMin       float64 `json:"hMin"`
		HMax       float64 `json:"hMax"`
		WaterLevel float64 `json:"waterLevel"`
		Objects    *struct {
			Types []struct {
				Name string     `json:"name"`
				Kind string     `json:"kind"`
				Min  [3]float64 `json:"min"`
				Max  [3]float64 `json:"max"`
			} `json:"types"`
		} `json:"objects"`
		Detail *struct {
			W, H          int
			X0, Z0, CellM float64
			HMin, HMax    float64
		} `json:"detail"`
	}
	var detailRaw, objectsRaw []byte
	for _, f := range zr.File {
		rc, err := f.Open()
		if err != nil {
			return nil
		}
		raw, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			return nil
		}
		switch f.Name {
		case "terrain.json":
			if json.Unmarshal(raw, &meta) != nil {
				return nil
			}
		case "detail.u16":
			detailRaw = raw
		case "objects.bin":
			objectsRaw = raw
		case "height.u16":
			t.h = make([]uint16, len(raw)/2)
			for i := range t.h {
				t.h[i] = binary.LittleEndian.Uint16(raw[i*2:])
			}
		}
	}
	t.n, t.x0, t.z0, t.cell, t.hMin, t.hMax, t.water = meta.GridSize, meta.X0, meta.Z0, meta.CellM, meta.HMin, meta.HMax, meta.WaterLevel
	if t.n <= 1 || len(t.h) != t.n*t.n || t.cell <= 0 {
		return nil
	}
	if d := meta.Detail; d != nil && d.W > 1 && d.H > 1 && d.CellM > 0 && len(detailRaw) == 2*d.W*d.H {
		t.dn, t.dm, t.dx0, t.dz0, t.dcell, t.dhMin, t.dhMax = d.W, d.H, d.X0, d.Z0, d.CellM, d.HMin, d.HMax
		t.dh = make([]uint16, d.W*d.H)
		for i := range t.dh {
			t.dh[i] = binary.LittleEndian.Uint16(detailRaw[i*2:])
		}
	}
	if meta.Objects != nil && len(objectsRaw) >= 52 {
		var types []obstacleType
		for _, ty := range meta.Objects.Types {
			types = append(types, obstacleType{Kind: ty.Kind, Min: ty.Min, Max: ty.Max})
		}
		t.obstacles = newObstacleIndex(types, objectsRaw)
	}
	return t
}

// heightFine uses the 2 m tank-area grid where there is one and the whole-map
// grid elsewhere. Aircraft rules keep using height (unchanged behaviour).
func (t *wtrTerrain) heightFine(x, z float64) float64 {
	if t.dh != nil {
		fx := (x - t.dx0) / t.dcell
		fz := (z - t.dz0) / t.dcell
		if fx >= 0 && fz >= 0 && fx < float64(t.dn-1) && fz < float64(t.dm-1) {
			ix, iz := int(fx), int(fz)
			ax, az := fx-float64(ix), fz-float64(iz)
			at := func(c, r int) float64 { return t.dhMin + float64(t.dh[r*t.dn+c])*(t.dhMax-t.dhMin)/65535 }
			v := (at(ix, iz)*(1-ax)+at(ix+1, iz)*ax)*(1-az) + (at(ix, iz+1)*(1-ax)+at(ix+1, iz+1)*ax)*az
			return math.Max(v, t.water)
		}
	}
	return t.height(x, z)
}

func (t *wtrTerrain) height(x, z float64) float64 {
	fx := (x-t.x0)/t.cell - 0.5
	fz := (z-t.z0)/t.cell - 0.5
	lim := float64(t.n) - 1.001
	fx = math.Max(0, math.Min(lim, fx))
	fz = math.Max(0, math.Min(lim, fz))
	ix, iz := int(fx), int(fz)
	ax, az := fx-float64(ix), fz-float64(iz)
	at := func(c, r int) float64 { return t.hMin + float64(t.h[r*t.n+c])*(t.hMax-t.hMin)/65535 }
	v := (at(ix, iz)*(1-ax)+at(ix+1, iz)*ax)*(1-az) + (at(ix, iz+1)*(1-ax)+at(ix+1, iz+1)*ax)*az
	return math.Max(v, t.water)
}

// wtrGroundCut ends an aircraft track where it goes into the ground and stays
// there (three samples in a row more than 25 m below the terrain). The replay
// keeps reporting a destroyed AI aircraft for a while as it sinks.
func wtrGroundCut(s []acmiSample, t *wtrTerrain) (int, bool) {
	if t == nil {
		return len(s), false
	}
	under := make([]float64, len(s)) // metres below the terrain (negative = above)
	for i, p := range s {
		under[i] = t.height(p.x, p.z) - p.y
	}
	// Rule 1: three samples in a row more than 25 m below the terrain.
	// Rule 2 (v0.7.0): three samples in a row more than 15 m below, and within
	// 15 s the aircraft slows below 30 m/s while still at the ground (a wreck
	// sliding to a stop). The 128 m terrain grid smooths slopes by tens of
	// metres, so a crash on a slope can stay just short of rule 1.
	run1, run2 := 0, 0
	for i := range s {
		if under[i] > 25 {
			run1++
		} else {
			run1 = 0
		}
		if under[i] > 15 {
			run2++
		} else {
			run2 = 0
		}
		start := i - 2
		if start < 1 {
			start = 1
		}
		if run1 == 3 {
			return start, true
		}
		if run2 == 3 {
			for j := i; j+1 < len(s) && s[j].t-s[i-2].t <= 15000 && under[j] > -30; j++ {
				dt := float64(s[j+1].t-s[j].t) / 1000
				if dt > 0 && math.Hypot(s[j+1].x-s[j].x, s[j+1].z-s[j].z)/dt < 30 {
					return start, true
				}
			}
		}
	}
	return len(s), false
}

// wtrCleanName removes the game's private nation-flag glyphs from a name.
func wtrCleanName(s string) string {
	out := strings.Map(func(r rune) rune {
		if (r >= 0x2400 && r <= 0x27BF) || (r >= 0xE000 && r <= 0xF8FF) || unicode.Is(unicode.Co, r) {
			return -1
		}
		return r
	}, s)
	return strings.TrimSpace(out)
}

type wtrLaunch struct {
	T              uint32   `json:"t"`
	Missile        int      `json:"missile"`
	Model          string   `json:"model"`
	Guidance       string   `json:"guidance,omitempty"`
	Shooter        *int     `json:"shooter,omitempty"`
	ShooterPlayer  *int     `json:"shooterPlayer,omitempty"`
	ShooterSpeed   *float64 `json:"shooterSpeedMs,omitempty"`
	ShooterAlt     *float64 `json:"shooterAltM,omitempty"`
	ShooterHeading *float64 `json:"shooterHeadingDeg,omitempty"`
	ShooterPitch   *float64 `json:"shooterPitchDeg,omitempty"`
	Target         *int     `json:"target,omitempty"`
	TargetPlayer   *int     `json:"targetPlayer,omitempty"`
	TargetSource   string   `json:"targetSource,omitempty"` // kill | seeker | designation
	Range          *float64 `json:"rangeM,omitempty"`
	TargetSpeed    *float64 `json:"targetSpeedMs,omitempty"`
	TargetAlt      *float64 `json:"targetAltM,omitempty"`
	Aspect         *float64 `json:"aspectDeg,omitempty"`       // 0 = target flying straight at the shooter, 180 = flying away
	OffBoresight   *float64 `json:"offBoresightDeg,omitempty"` // angle between shooter's nose and the target
	Closure        *float64 `json:"closureMs,omitempty"`
	Outcome        string   `json:"outcome"`          // kill | close | miss | unknown
	Reason         string   `json:"reason,omitempty"` // target_down | decoyed | out_of_energy | no_lock | lost_lock
	Confidence     string   `json:"confidence"`       // high | medium | low
	MissDistance   *int     `json:"missDistanceM,omitempty"`
	TClosest       *uint32  `json:"tClosest,omitempty"`
	FlightTime     float64  `json:"flightTimeS"`
	EndSpeed       float64  `json:"endSpeedMs"`
	TrackedSamples int      `json:"seekerTrackSamples"`
	ShooterMach    *float64 `json:"shooterMach,omitempty"`
	TargetMach     *float64 `json:"targetMach,omitempty"`
	ShooterInArea  *bool    `json:"shooterInsideMap,omitempty"`
	TargetInArea   *bool    `json:"targetInsideMap,omitempty"`
}

func wtrRound(v float64, digits int) *float64 {
	p := math.Pow(10, float64(digits))
	r := math.Round(v*p) / p
	return &r
}

// velocity (m/s) of a track around time t
func wtrVelocity(s []acmiSample, t uint32) ([3]float64, bool) {
	if len(s) < 2 {
		return [3]float64{}, false
	}
	i := 0
	for i < len(s)-1 && s[i+1].t <= t {
		i++
	}
	a, b := i-1, i+1
	if a < 0 {
		a = 0
	}
	if b > len(s)-1 {
		b = len(s) - 1
	}
	dt := float64(s[b].t-s[a].t) / 1000
	if dt <= 0 {
		return [3]float64{}, false
	}
	return [3]float64{(s[b].x - s[a].x) / dt, (s[b].y - s[a].y) / dt, (s[b].z - s[a].z) / dt}, true
}

func wtrNorm(v [3]float64) float64 { return math.Sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) }
func wtrAngle(a, b [3]float64) float64 {
	na, nb := wtrNorm(a), wtrNorm(b)
	if na == 0 || nb == 0 {
		return 0
	}
	c := (a[0]*b[0] + a[1]*b[1] + a[2]*b[2]) / (na * nb)
	return math.Acos(math.Max(-1, math.Min(1, c))) * 180 / math.Pi
}

func wtrBuildLaunches(units []wtrUnit, events []wtrEvent, states []wtrStateChange, live, full map[int][]acmiSample, mp *wtrMap) []wtrLaunch {
	killByMissile := map[int]wtrEvent{}
	for _, e := range events {
		if e.Type == "kill" && e.Missile != nil {
			killByMissile[*e.Missile] = e
		}
	}
	var aircraft []int
	cmByParent := map[int][]int{}
	for _, u := range units {
		switch u.Kind {
		case "aircraft":
			aircraft = append(aircraft, u.ID)
		case "countermeasure":
			if u.Parent != nil {
				cmByParent[*u.Parent] = append(cmByParent[*u.Parent], u.ID)
			}
		}
	}
	// designated target of each aircraft over time
	type des struct {
		t      uint32
		target int
	}
	desOf := map[int][]des{}
	for _, s := range states {
		v, ok := s.Set["target1"]
		if !ok {
			continue
		}
		id := -1
		if v != "" {
			fmt.Sscan(v, &id)
		}
		desOf[s.Unit] = append(desOf[s.Unit], des{s.T, id})
	}
	dist := func(a [3]float64, x, y, z float64) float64 {
		return math.Sqrt((a[0]-x)*(a[0]-x) + (a[1]-y)*(a[1]-y) + (a[2]-z)*(a[2]-z))
	}

	out := []wtrLaunch{}
	for _, u := range units {
		if u.Kind != "missile" {
			continue
		}
		ms := live[u.ID]
		if len(ms) == 0 {
			continue
		}
		l := wtrLaunch{T: u.TStart, Missile: u.ID, Model: u.Name, Shooter: u.Parent, Outcome: "unknown", Confidence: "low",
			FlightTime: math.Round(float64(u.TEnd-u.TStart)/100) / 10}
		if u.Missile != nil {
			l.Guidance = u.Missile.Guidance
		}
		if v, ok := wtrVelocity(ms, u.TEnd); ok {
			l.EndSpeed = math.Round(wtrNorm(v))
		}
		var shooterPos [3]float64
		var shooterFwd [3]float64
		haveShooter := false
		if u.Parent != nil && units[*u.Parent].Kind == "aircraft" {
			sh := units[*u.Parent]
			l.ShooterPlayer = sh.Player
			if p, ok := wtrInterpolate(full[sh.ID], u.TStart); ok {
				shooterPos, haveShooter = p, true
				l.ShooterAlt = wtrRound(p[1], 0)
				if in, ok := mp.inArea(p[0], p[2]); ok {
					l.ShooterInArea = &in
				}
				if v, ok := wtrVelocity(full[sh.ID], u.TStart); ok {
					l.ShooterSpeed = wtrRound(wtrNorm(v), 0)
					l.ShooterMach = wtrRound(wtrNorm(v)/wtrSoundSpeed(p[1]), 2)
					shooterFwd = v
				}
				// attitude from the nearest sample
				fs := full[sh.ID]
				bi := 0
				for i := range fs {
					if absDiffU32(fs[i].t, u.TStart) < absDiffU32(fs[bi].t, u.TStart) {
						bi = i
					}
				}
				if len(fs) > 0 {
					hd, pt := fs[bi].yaw, fs[bi].pitch
					l.ShooterHeading, l.ShooterPitch = wtrRound(math.Mod(hd+360, 360), 0), wtrRound(pt, 0)
					h, p := hd*math.Pi/180, pt*math.Pi/180
					shooterFwd = [3]float64{math.Sin(h) * math.Cos(p), math.Sin(p), math.Cos(h) * math.Cos(p)}
				}
			}
		}

		// --- which aircraft was it fired at? ---
		target := -1
		if e, ok := killByMissile[u.ID]; ok && e.Victim != nil {
			target, l.TargetSource = *e.Victim, "kill"
		}
		// seeker track samples and what they point at
		type est struct {
			t uint32
			p [3]float64
		}
		var ests []est
		for _, s := range ms {
			st, ok := missileSeekerStateForSample(s)
			if !ok || st.Mode != projectiles.SeekerModeTrack || !st.HasTargetEstimate {
				continue
			}
			ests = append(ests, est{s.t, [3]float64{float64(st.TargetEstimate[0]), float64(st.TargetEstimate[1]), float64(st.TargetEstimate[2])}})
		}
		l.TrackedSamples = len(ests)
		nearCount := map[int]int{}
		for _, e := range ests {
			for _, aid := range aircraft {
				if u.Parent != nil && aid == *u.Parent {
					continue
				}
				if p, ok := wtrInterpolate(full[aid], e.t); ok && dist(p, e.p[0], e.p[1], e.p[2]) < 250 {
					nearCount[aid]++
				}
			}
		}
		if target < 0 {
			best, bestN := -1, 0
			for aid, n := range nearCount {
				if n > bestN || (n == bestN && aid < best) {
					best, bestN = aid, n
				}
			}
			if bestN >= 5 {
				target, l.TargetSource = best, "seeker"
			}
		}
		if target < 0 && u.Parent != nil {
			cur := -1
			for _, d := range desOf[*u.Parent] {
				if d.t > u.TStart+500 {
					break
				}
				cur = d.target
			}
			if cur >= 0 && cur < len(units) && units[cur].Kind == "aircraft" {
				target, l.TargetSource = cur, "designation"
			}
		}
		if target < 0 {
			l.Reason = "no_target_identified"
			out = append(out, l)
			continue
		}
		tu := units[target]
		l.Target, l.TargetPlayer = &target, tu.Player

		// --- launch geometry ---
		var tSpeedAtLaunch float64
		if haveShooter {
			if tp, ok := wtrInterpolate(full[target], u.TStart); ok {
				los := [3]float64{tp[0] - shooterPos[0], tp[1] - shooterPos[1], tp[2] - shooterPos[2]}
				l.Range = wtrRound(wtrNorm(los), 0)
				l.TargetAlt = wtrRound(tp[1], 0)
				if in, ok := mp.inArea(tp[0], tp[2]); ok {
					l.TargetInArea = &in
				}
				l.OffBoresight = wtrRound(wtrAngle(shooterFwd, los), 0)
				if tv, ok := wtrVelocity(full[target], u.TStart); ok {
					tSpeedAtLaunch = wtrNorm(tv)
					l.TargetSpeed = wtrRound(tSpeedAtLaunch, 0)
					l.TargetMach = wtrRound(tSpeedAtLaunch/wtrSoundSpeed(tp[1]), 2)
					back := [3]float64{-los[0], -los[1], -los[2]}
					l.Aspect = wtrRound(wtrAngle(tv, back), 0)
					if sv, ok := wtrVelocity(full[*u.Parent], u.TStart); ok {
						n := wtrNorm(los)
						if n > 0 {
							rel := [3]float64{tv[0] - sv[0], tv[1] - sv[1], tv[2] - sv[2]}
							l.Closure = wtrRound(-(rel[0]*los[0]+rel[1]*los[1]+rel[2]*los[2])/n, 0)
						}
					}
				}
			}
		}

		// --- closest approach ---
		best, bestT := math.Inf(1), uint32(0)
		var prevRel [3]float64
		var prevT uint32
		havePrev := false
		for _, s := range ms {
			tp, ok := wtrInterpolate(full[target], s.t)
			if !ok {
				havePrev = false
				continue
			}
			rel := [3]float64{s.x - tp[0], s.y - tp[1], s.z - tp[2]}
			if d := wtrNorm(rel); d < best {
				best, bestT = d, s.t
			}
			if havePrev {
				// closest point on the straight segment between two samples
				dv := [3]float64{rel[0] - prevRel[0], rel[1] - prevRel[1], rel[2] - prevRel[2]}
				den := dv[0]*dv[0] + dv[1]*dv[1] + dv[2]*dv[2]
				if den > 0 {
					f := -(prevRel[0]*dv[0] + prevRel[1]*dv[1] + prevRel[2]*dv[2]) / den
					if f > 0 && f < 1 {
						c := [3]float64{prevRel[0] + dv[0]*f, prevRel[1] + dv[1]*f, prevRel[2] + dv[2]*f}
						if d := wtrNorm(c); d < best {
							best, bestT = d, prevT+uint32(f*float64(s.t-prevT))
						}
					}
				}
			}
			prevRel, prevT, havePrev = rel, s.t, true
		}
		if !math.IsInf(best, 1) {
			d := int(math.Round(best))
			l.MissDistance, l.TClosest = &d, &bestT
		}

		// --- outcome ---
		if _, ok := killByMissile[u.ID]; ok {
			l.Outcome, l.Confidence = "kill", "high"
			out = append(out, l)
			continue
		}
		if !math.IsInf(best, 1) && best < 25 {
			// passed within fuse distance but the game recorded no kill for it
			l.Outcome, l.Confidence = "close", "low"
			out = append(out, l)
			continue
		}
		l.Outcome = "miss"
		// seeker behaviour relative to the chosen target
		onTarget, offTarget, nearDecoy := 0, 0, 0
		for _, e := range ests {
			tp, ok := wtrInterpolate(full[target], e.t)
			if !ok {
				continue
			}
			if dist(tp, e.p[0], e.p[1], e.p[2]) < 250 {
				onTarget++
				continue
			}
			offTarget++
			for _, cid := range cmByParent[target] {
				cs := live[cid]
				if len(cs) == 0 || e.t+200 < cs[0].t || e.t > cs[len(cs)-1].t+3000 {
					continue
				}
				ct := e.t
				if ct > cs[len(cs)-1].t {
					ct = cs[len(cs)-1].t
				}
				if cp, ok := wtrInterpolate(cs, ct); ok && dist(cp, e.p[0], e.p[1], e.p[2]) < 200 {
					nearDecoy++
					break
				}
			}
		}
		var speedAtClosest, targetSpeedAtClosest float64
		if v, ok := wtrVelocity(ms, bestT); ok {
			speedAtClosest = wtrNorm(v)
		}
		if v, ok := wtrVelocity(full[target], bestT); ok {
			targetSpeedAtClosest = wtrNorm(v)
		}
		switch {
		case tu.Destroyed && tu.TEnd+300 < u.TEnd && (math.IsInf(best, 1) || bestT+300 >= tu.TEnd):
			l.Reason, l.Confidence = "target_down", "medium"
		case nearDecoy >= 3:
			l.Reason, l.Confidence = "decoyed", "medium"
		case speedAtClosest > 0 && (speedAtClosest < 1.15*targetSpeedAtClosest || l.EndSpeed < 250) && best > 150:
			l.Reason, l.Confidence = "out_of_energy", "low"
		case len(ests) > 0 && onTarget == 0:
			l.Reason, l.Confidence = "no_lock", "low"
		case onTarget > 0 && offTarget > onTarget/2:
			l.Reason, l.Confidence = "lost_lock", "low"
		default:
			l.Confidence = "low"
		}
		out = append(out, l)
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].T < out[j].T })
	return out
}

func wtrUndergroundCheck(units []wtrUnit, live map[int][]acmiSample, terr *wtrTerrain) wtrCheck {
	c := wtrCheck{ID: "underground", Name: "No aircraft flies underground", Expected: "0 samples more than 50 m below the terrain"}
	if terr == nil {
		c.Status, c.Value = "skipped", "no terrain file for this map"
		c.Hint = "Terrain files live in assets\\terrain. Without one, aircraft that crash are not ended at the ground."
		return c
	}
	bad, worst, total := 0, 0.0, 0
	for _, u := range units {
		if u.Kind != "aircraft" {
			continue
		}
		for _, s := range live[u.ID] {
			total++
			if d := terr.height(s.x, s.z) - s.y; d > 50 {
				bad++
				if d > worst {
					worst = d
				}
			}
		}
	}
	c.Value = fmt.Sprintf("%d of %d samples (deepest %.0f m)", bad, total, worst)
	c.Status = "pass"
	if bad > 0 {
		c.Status = "warn"
		c.Hint = "Positions or terrain may be wrong for this map. Check the map's .wtt file and the aircraft position decoding (packet type 2)."
	}
	return c
}

// ---------------------------------------------------------------------------
// Catalogue from the local game install (assets\catalog, built by wtassets).

var wtrCatalogDir = flag.String("catalog", "", "with -wtr: folder with catalogue files; default <program folder>/../assets/catalog")

type wtrArea struct {
	Name     string  `json:"name"`
	Type     string  `json:"type"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Z        float64 `json:"z"`
	SizeX    float64 `json:"sizeX"`
	SizeY    float64 `json:"sizeY"`
	SizeZ    float64 `json:"sizeZ"`
	Rotation float64 `json:"rotationDeg,omitempty"`
	Role     string  `json:"role,omitempty"` // airfieldArea | reloadArea | missionBorder | airSpawn | zone
	File     string  `json:"missionFile,omitempty"`
}

type wtrCatalog struct {
	vehicles map[string]string
	missiles map[string]map[string]any
	areas    map[string][]wtrArea
	date     string
}

func wtrLoadCatalog() *wtrCatalog {
	dir := *wtrCatalogDir
	if dir == "" {
		exe, err := os.Executable()
		if err != nil {
			return nil
		}
		dir = filepath.Join(filepath.Dir(filepath.Dir(exe)), "assets", "catalog")
	}
	c := &wtrCatalog{}
	var v struct {
		Generated string            `json:"generated"`
		Vehicles  map[string]string `json:"vehicles"`
	}
	if raw, err := os.ReadFile(filepath.Join(dir, "vehicles.json")); err == nil && json.Unmarshal(raw, &v) == nil {
		c.vehicles, c.date = v.Vehicles, v.Generated
	}
	var w struct {
		Missiles map[string]map[string]any `json:"missiles"`
	}
	if raw, err := os.ReadFile(filepath.Join(dir, "weapons.json")); err == nil && json.Unmarshal(raw, &w) == nil {
		c.missiles = w.Missiles
	}
	var a struct {
		Missions map[string][]wtrArea `json:"missions"`
	}
	if raw, err := os.ReadFile(filepath.Join(dir, "mission_areas.json")); err == nil && json.Unmarshal(raw, &a) == nil {
		c.areas = a.Missions
	}
	if c.vehicles == nil && c.missiles == nil && c.areas == nil {
		return nil
	}
	return c
}

type wtrAirfieldOut struct {
	Name       string       `json:"name"`
	Team       int          `json:"team"`
	X          float64      `json:"x"`
	Y          float64      `json:"y"`
	Z          float64      `json:"z"`
	Heading    float64      `json:"headingDeg"`
	Length     float64      `json:"lengthM"`
	Width      float64      `json:"widthM"`
	Ends       [][2]float64 `json:"ends,omitempty"` // runway ends as [x, z]
	Confidence string       `json:"confidence,omitempty"`
	File       string       `json:"missionFile,omitempty"`
}

type wtrExtent struct {
	X0     float64 `json:"x0"`
	Z0     float64 `json:"z0"`
	X1     float64 `json:"x1"`
	Z1     float64 `json:"z1"`
	Source string  `json:"source"`
}

type wtrMap struct {
	Airfields []wtrAirfieldOut `json:"airfields"`
	Areas     []wtrArea        `json:"areas"`
	Extent    *wtrExtent       `json:"mapExtent,omitempty"` // the map square of the level (same as the terrain file)
	Note      string           `json:"note,omitempty"`
}

func wtrMissionKey(source string) string {
	s := strings.ToLower(strings.ReplaceAll(source, "\\", "/"))
	if i := strings.Index(s, "gamedata/missions/"); i >= 0 {
		s = s[i:]
	}
	s = strings.TrimSuffix(s, ".blkx")
	if !strings.HasSuffix(s, ".blk") {
		s += ".blk"
	}
	return s
}

func wtrBuildMap(in wtrInput, cat *wtrCatalog, terr *wtrTerrain) *wtrMap {
	m := &wtrMap{Airfields: []wtrAirfieldOut{}, Areas: []wtrArea{}}
	if terr != nil {
		m.Extent = &wtrExtent{terr.x0, terr.z0, terr.x0 + float64(terr.n)*terr.cell, terr.z0 + float64(terr.n)*terr.cell, "terrain file"}
	}
	files := []string{}
	seen := map[string]bool{}
	addFile := func(k string) {
		if k != "" && !seen[k] {
			seen[k] = true
			files = append(files, k)
		}
	}
	addFile(wtrMissionKey(wtrHeaderString(in.header.Raw_LevelSettings[:])))
	index := map[string]int{}
	for _, a := range in.airfields {
		switch a.Role {
		case "Airport":
			conf := a.Confidence
			if i := strings.Index(conf, ";"); i >= 0 {
				conf = conf[:i]
			}
			f := wtrMissionKey(a.Source)
			addFile(f)
			index[a.Key] = len(m.Airfields)
			m.Airfields = append(m.Airfields, wtrAirfieldOut{Name: a.Name, Team: int(a.Team), X: r1f(a.X), Y: r1f(a.Y), Z: r1f(a.Z),
				Heading: r1f(a.Heading), Length: r1f(a.Length), Width: r1f(a.Width), Confidence: conf, File: f})
		case "RunwayEndpoint":
			if i, ok := index[a.ParentKey]; ok {
				m.Airfields[i].Ends = append(m.Airfields[i].Ends, [2]float64{r1f(a.X), r1f(a.Z)})
			}
		}
	}
	if cat == nil || cat.areas == nil {
		m.Note = "no catalogue: mission areas not available"
		return m
	}
	for _, f := range files {
		for _, a := range cat.areas[f] {
			n := strings.ToLower(a.Name)
			switch {
			case n == "mission_border":
				a.Role = "missionBorder"
			case strings.Contains(n, "reload") && strings.Contains(n, "area"):
				a.Role = "reloadArea"
			case strings.HasPrefix(n, "airfields_area") || strings.HasPrefix(n, "airfield_area"):
				a.Role = "airfieldArea"
			case strings.Contains(n, "air_spawn"):
				a.Role = "airSpawn"
			default:
				a.Role = "zone"
			}
			a.File = f
			m.Areas = append(m.Areas, a)
		}
	}
	return m
}

func r1f(v float64) float64 { return math.Round(v*10) / 10 }

// inArea reports whether a position is inside the level's map square.
func (m *wtrMap) inArea(x, z float64) (bool, bool) {
	if m == nil || m.Extent == nil {
		return false, false
	}
	e := m.Extent
	return x >= e.X0 && x <= e.X1 && z >= e.Z0 && z <= e.Z1, true
}

// speed of sound in the standard atmosphere, m/s
func wtrSoundSpeed(alt float64) float64 {
	t := 288.15 - 0.0065*math.Max(0, math.Min(alt, 11000))
	return math.Sqrt(1.4 * 287.05 * t)
}

type wtrDerivedCols struct{ speed, mach, g, climb, agl []float32 }

// wtrDerive computes values the replay does not store, from positions and time.
func wtrDerive(s []acmiSample, terr *wtrTerrain) wtrDerivedCols {
	n := len(s)
	d := wtrDerivedCols{make([]float32, n), make([]float32, n), make([]float32, n), make([]float32, n), make([]float32, n)}
	vx, vy, vz := make([]float64, n), make([]float64, n), make([]float64, n)
	for i := range s {
		a, b := i-1, i+1
		if a < 0 {
			a = 0
		}
		if b > n-1 {
			b = n - 1
		}
		if dt := float64(s[b].t-s[a].t) / 1000; dt > 0 {
			vx[i], vy[i], vz[i] = (s[b].x-s[a].x)/dt, (s[b].y-s[a].y)/dt, (s[b].z-s[a].z)/dt
		}
		sp := math.Sqrt(vx[i]*vx[i] + vy[i]*vy[i] + vz[i]*vz[i])
		d.speed[i], d.climb[i] = float32(sp), float32(vy[i])
		d.mach[i] = float32(sp / wtrSoundSpeed(s[i].y))
		d.agl[i] = wtrNaN()
		if terr != nil {
			d.agl[i] = float32(s[i].y - terr.height(s[i].x, s[i].z))
		}
	}
	for i := range s {
		a, b := i-2, i+2
		if a < 0 {
			a = 0
		}
		if b > n-1 {
			b = n - 1
		}
		d.g[i] = 1
		if dt := float64(s[b].t-s[a].t) / 1000; dt > 0 {
			ax, ay, az := (vx[b]-vx[a])/dt, (vy[b]-vy[a])/dt+9.81, (vz[b]-vz[a])/dt
			d.g[i] = float32(math.Sqrt(ax*ax+ay*ay+az*az) / 9.81)
		}
	}
	return d
}

type wtrPlayerStats struct {
	Slot           int      `json:"slot"`
	Flights        int      `json:"flights"`
	FlightTime     float64  `json:"flightTimeS"`
	Distance       float64  `json:"distanceKm"`
	MaxAlt         float64  `json:"maxAltM"`
	MeanAlt        float64  `json:"meanAltM"`
	MaxSpeed       float64  `json:"maxSpeedMs"`
	MaxMach        float64  `json:"maxMach"`
	MaxG           float64  `json:"maxG"`
	Missiles       int      `json:"missilesFired"`
	MissileKills   int      `json:"missileKills"`
	MissilesAtMe   int      `json:"missilesFiredAtPlayer"`
	OutsideAreaS   *float64 `json:"timeOutsideMapS,omitempty"`
	CountermeasCnt int      `json:"countermeasuresReleased"`
}

func wtrBuildStats(units []wtrUnit, players []wtrPlayer, launches []wtrLaunch, live map[int][]acmiSample, m *wtrMap) []wtrPlayerStats {
	out := []wtrPlayerStats{}
	cmByParent := map[int]int{}
	for _, u := range units {
		if u.Kind == "countermeasure" && u.Parent != nil {
			cmByParent[*u.Parent]++
		}
	}
	for _, p := range players {
		st := wtrPlayerStats{Slot: p.Slot, Flights: len(p.Units)}
		var altSum, outside float64
		var nAlt int
		haveArea := false
		for _, id := range p.Units {
			s := live[id]
			st.CountermeasCnt += cmByParent[id]
			if len(s) < 2 {
				continue
			}
			st.FlightTime += float64(s[len(s)-1].t-s[0].t) / 1000
			d := wtrDerive(s, nil)
			for i := range s {
				if i > 0 {
					dt := float64(s[i].t-s[i-1].t) / 1000
					if dt < 5 {
						st.Distance += math.Sqrt(math.Pow(s[i].x-s[i-1].x, 2)+math.Pow(s[i].y-s[i-1].y, 2)+math.Pow(s[i].z-s[i-1].z, 2)) / 1000
						if in, ok := m.inArea(s[i].x, s[i].z); ok {
							haveArea = true
							if !in {
								outside += dt
							}
						}
					}
				}
				st.MaxAlt = math.Max(st.MaxAlt, s[i].y)
				altSum += s[i].y
				nAlt++
				// ignore the first and last second: differences there are noisy
				if i > 3 && i < len(s)-4 {
					st.MaxSpeed = math.Max(st.MaxSpeed, float64(d.speed[i]))
					st.MaxMach = math.Max(st.MaxMach, float64(d.mach[i]))
					st.MaxG = math.Max(st.MaxG, float64(d.g[i]))
				}
			}
		}
		if nAlt > 0 {
			st.MeanAlt = math.Round(altSum / float64(nAlt))
		}
		if haveArea {
			o := math.Round(outside*10) / 10
			st.OutsideAreaS = &o
		}
		for _, l := range launches {
			if l.ShooterPlayer != nil && *l.ShooterPlayer == p.Slot {
				st.Missiles++
				if l.Outcome == "kill" {
					st.MissileKills++
				}
			}
			if l.TargetPlayer != nil && *l.TargetPlayer == p.Slot {
				st.MissilesAtMe++
			}
		}
		st.FlightTime, st.Distance = math.Round(st.FlightTime*10)/10, math.Round(st.Distance*10)/10
		st.MaxAlt, st.MaxSpeed = math.Round(st.MaxAlt), math.Round(st.MaxSpeed)
		st.MaxMach, st.MaxG = math.Round(st.MaxMach*100)/100, math.Round(st.MaxG*10)/10
		out = append(out, st)
	}
	return out
}
