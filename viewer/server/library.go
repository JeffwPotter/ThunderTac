// Analysis cache and the replay library.
//
// For each match the analysis and a compact library entry are written next to
// the .wtr file (<id>.analysis.json, <id>.library.json). They are rebuilt when
// the .wtr file or the analysis version changes.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"sync"
	"unicode"
)

type store struct {
	sessDir, terrDir, catDir string
	mu                       sync.Mutex
	locks                    map[string]*sync.Mutex
	catOnce                  sync.Once
	cat                      *wCatalog
}

func (st *store) lock(id string) *sync.Mutex {
	st.mu.Lock()
	defer st.mu.Unlock()
	if st.locks == nil {
		st.locks = map[string]*sync.Mutex{}
	}
	l := st.locks[id]
	if l == nil {
		l = &sync.Mutex{}
		st.locks[id] = l
	}
	return l
}

func (st *store) catalog() *wCatalog {
	st.catOnce.Do(func() { st.cat = loadCatalog(st.catDir) })
	return st.cat
}

// lowerKeys turns Go field names into lowerCamel JSON keys ("RangeM" -> "rangeM", "TEnd" -> "tEnd").
func lowerKeys(v any) any {
	switch t := v.(type) {
	case map[string]any:
		out := make(map[string]any, len(t))
		for k, x := range t {
			r := []rune(k)
			if len(r) > 0 && unicode.IsUpper(r[0]) {
				r[0] = unicode.ToLower(r[0])
			}
			out[string(r)] = lowerKeys(x)
		}
		return out
	case []any:
		for i := range t {
			t[i] = lowerKeys(t[i])
		}
		return t
	}
	return v
}

func toJSON(v any) ([]byte, error) {
	raw, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	var gen any
	if err := json.Unmarshal(raw, &gen); err != nil {
		return nil, err
	}
	return json.Marshal(lowerKeys(gen))
}

func stamp(path string) string {
	fi, err := os.Stat(path)
	if err != nil {
		return ""
	}
	return fmt.Sprintf("%s|%d|%d", analysisVersion, fi.Size(), fi.ModTime().UnixNano())
}

// dirStamp: newest modification time and count of the matching files in dir.
func dirStamp(dir, pattern string) string {
	files, _ := filepath.Glob(filepath.Join(dir, pattern))
	var newest int64
	for _, f := range files {
		if fi, err := os.Stat(f); err == nil && fi.ModTime().UnixNano() > newest {
			newest = fi.ModTime().UnixNano()
		}
	}
	return fmt.Sprintf("%d/%d", len(files), newest)
}

type cached struct {
	Stamp string          `json:"stamp"`
	Data  json.RawMessage `json:"data"`
}

func readCache(path, want string) []byte {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	var c cached
	if json.Unmarshal(b, &c) != nil || c.Stamp != want {
		return nil
	}
	return c.Data
}

func writeCache(path, stampV string, data []byte) {
	b, err := json.Marshal(cached{stampV, data})
	if err == nil {
		_ = os.WriteFile(path, b, 0644) // a read-only folder only costs speed
	}
}

// build computes (or reads from cache) the analysis and library entry of one match.
func (st *store) build(id string) (anaJSON, libJSON []byte, err error) {
	l := st.lock(id)
	l.Lock()
	defer l.Unlock()
	wtr := filepath.Join(st.sessDir, id+".wtr")
	sv := stamp(wtr)
	if sv == "" {
		return nil, nil, fmt.Errorf("no such match")
	}
	sv += "|" + dirStamp(st.terrDir, "*.wtt") // new terrain redoes the analysis (line of sight, AGL)
	aPath, lPath := filepath.Join(st.sessDir, id+".analysis.json"), filepath.Join(st.sessDir, id+".library.json")
	anaJSON, libJSON = readCache(aPath, sv), readCache(lPath, sv)
	if anaJSON != nil && libJSON != nil {
		return anaJSON, libJSON, nil
	}
	s, err := loadWTR(wtr)
	if err != nil {
		return nil, nil, err
	}
	terr := loadTerrain(st.terrDir, s.Level)
	a := analyse(s, terr, st.catalog())
	if anaJSON, err = toJSON(a); err != nil {
		return nil, nil, err
	}
	if libJSON, err = toJSON(libraryEntry(s, a)); err != nil {
		return nil, nil, err
	}
	writeCache(aPath, sv, anaJSON)
	writeCache(lPath, sv, libJSON)
	return anaJSON, libJSON, nil
}

// ---- library entry ----

type libShot struct {
	T, Range, Aspect, Closure, ShooterAlt, TargetAlt, ShooterMach, TargetMach, TargetAgl, RangeRatio, Rmax, Rne opt
	Model, Guidance, Outcome, Reason, Grade                                                                     string
	ShooterSlot, TargetSlot                                                                                     int
	Multipath                                                                                                   float64
	Notch, Locked                                                                                               bool
	ShooterX, ShooterZ                                                                                          opt
}

type libPlayer struct {
	Slot     int
	Name     string
	Team     int
	Vehicles []string
	Results  map[string]any
	Summary  map[string]float64
	BandsS   []float64
	Track    []float64 // x, z pairs in km, every 5 s
	Kills    []float64 // x, z pairs in km (my position at the kill)
	Deaths   []float64
	Launches []float64
}

type libEntry struct {
	ID                       string `json:"id"`
	Level, StartUTC, Decoder string
	PlayedS                  float64
	Terrain                  bool
	Players                  []libPlayer
	Shots                    []libShot
}

func r1km(v float64) float64 { return math.Round(v/100) / 10 }

func libraryEntry(s *wSession, a *analysis) libEntry {
	e := libEntry{ID: s.ID, Level: s.Level, StartUTC: s.Manifest.Match.StartUTC, Decoder: s.Manifest.Decoder.Version,
		PlayedS: s.Manifest.Match.PlayedS, Terrain: a.Terrain, Players: []libPlayer{}, Shots: []libShot{}}
	for _, sh := range a.Shots {
		ls := libShot{T: of(sh.T), Range: sh.RangeM, Aspect: sh.AspectDeg, Closure: sh.ClosureMs, ShooterAlt: sh.ShooterAltM, TargetAlt: sh.TargetAltM,
			ShooterMach: sh.ShooterMach, TargetMach: sh.TargetMach, TargetAgl: sh.TargetAglM, RangeRatio: sh.RangeRatio, Rmax: sh.RmaxM, Rne: sh.RneM,
			Model: sh.Model, Guidance: sh.Guidance, Outcome: sh.Outcome, Reason: sh.Reason, Grade: sh.Grade,
			ShooterSlot: sh.ShooterPlayer, TargetSlot: sh.TargetPlayer, Multipath: sh.MultipathLaunch, Notch: sh.NotchAtLaunch, Locked: sh.LockedAtLaunch}
		if sh.Shooter >= 0 {
			p := s.Units[sh.Shooter].pos(sh.T)
			ls.ShooterX, ls.ShooterZ = of(r1km(p[0])), of(r1km(p[2]))
		}
		e.Shots = append(e.Shots, ls)
	}
	byName := map[int]*playerA{}
	for i := range a.Players {
		byName[a.Players[i].Slot] = &a.Players[i]
	}
	for _, p := range s.Players {
		pa := byName[p.Slot]
		if pa == nil {
			continue
		}
		lp := libPlayer{Slot: p.Slot, Name: p.Name, Team: p.Team, Vehicles: pa.Vehicles, Results: p.Results, Summary: pa.Summary, BandsS: pa.Bands.TimeS,
			Track: []float64{}, Kills: []float64{}, Deaths: []float64{}, Launches: []float64{}}
		for _, id := range p.Units {
			u := s.Units[id]
			if u.n() == 0 {
				continue
			}
			for t := u.T[0]; t <= u.T[u.n()-1]; t += 5000 {
				q := u.pos(t)
				lp.Track = append(lp.Track, r1km(q[0]), r1km(q[2]))
			}
		}
		for _, k := range pa.Kills {
			if u := (&ctx{s: s}).unitOf(p.Slot, k.T-100); u != nil {
				q := u.pos(k.T - 100)
				lp.Kills = append(lp.Kills, r1km(q[0]), r1km(q[2]))
			}
		}
		for _, d := range pa.Deaths {
			q := s.Units[d.Unit].pos(d.T)
			lp.Deaths = append(lp.Deaths, r1km(q[0]), r1km(q[2]))
		}
		for _, si := range pa.Shots {
			if sh := a.Shots[si]; sh.Shooter >= 0 {
				q := s.Units[sh.Shooter].pos(sh.T)
				lp.Launches = append(lp.Launches, r1km(q[0]), r1km(q[2]))
			}
		}
		e.Players = append(e.Players, lp)
	}
	return e
}

// library builds every match's entry, several at a time.
func (st *store) library() []json.RawMessage {
	files, _ := filepath.Glob(filepath.Join(st.sessDir, "*.wtr"))
	sort.Strings(files)
	out := make([]json.RawMessage, len(files))
	sem := make(chan struct{}, max(1, runtime.NumCPU()-1))
	var wg sync.WaitGroup
	for i, f := range files {
		id := strings.TrimSuffix(filepath.Base(f), ".wtr")
		if !safeName.MatchString(id) {
			continue
		}
		wg.Add(1)
		go func(i int, id string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			if _, lib, err := st.build(id); err == nil {
				out[i] = lib
			}
		}(i, id)
	}
	wg.Wait()
	res := []json.RawMessage{}
	for _, b := range out {
		if b != nil {
			res = append(res, b)
		}
	}
	return res
}
