// Reading our own .wtr session files and .wtt terrain files (standard library only).
package main

import (
	"archive/zip"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type wColumn struct {
	Name   string `json:"name"`
	Type   string `json:"type"`
	Offset int    `json:"offset"`
	Count  int    `json:"count"`
}

type wMissileInfo struct {
	Model        string         `json:"model"`
	Family       string         `json:"family"`
	InternalName string         `json:"internalName"`
	Guidance     string         `json:"guidance"`
	Spec         map[string]any `json:"spec"`
}

type wUnit struct {
	ID        int           `json:"id"`
	Kind      string        `json:"kind"`
	Name      string        `json:"name"`
	Class     string        `json:"class"`
	Player    *int          `json:"player"`
	AI        bool          `json:"ai"`
	Team      int           `json:"team"`
	Parent    *int          `json:"parent"`
	TStart    float64       `json:"tStart"`
	TEnd      float64       `json:"tEnd"`
	Destroyed bool          `json:"destroyed"`
	EndReason string        `json:"endReason"`
	Samples   int           `json:"samples"`
	Columns   []wColumn     `json:"columns"`
	Missile   *wMissileInfo `json:"missile"`
	CM        *struct {
		Type string `json:"type"`
	} `json:"countermeasure"`

	// filled after loading
	T              []float64
	X, Y, Z        []float64
	Heading, Pitch []float64
	SeekerMode     []uint8
	TEX, TEY, TEZ  []float64
	Owner          int // player slot or -1
}

type wPlayer struct {
	Slot    int            `json:"slot"`
	Name    string         `json:"name"`
	Clan    string         `json:"clan"`
	Team    int            `json:"team"`
	Units   []int          `json:"units"`
	Results map[string]any `json:"results"`
}

type wEvent struct {
	T            float64 `json:"t"`
	Type         string  `json:"type"`
	Killer       *int    `json:"killer"`
	Victim       *int    `json:"victim"`
	KillerPlayer *int    `json:"killerPlayer"`
	Weapon       string  `json:"weapon"`
	TeamKill     bool    `json:"teamKill"`
	Missile      *int    `json:"missile"`
	Unit         *int    `json:"unit"`
	Parent       *int    `json:"parent"`
}

type wState struct {
	T    float64           `json:"t"`
	Unit int               `json:"unit"`
	Set  map[string]string `json:"set"`
}

type wLaunch struct {
	T             float64  `json:"t"`
	Missile       int      `json:"missile"`
	Model         string   `json:"model"`
	Guidance      string   `json:"guidance"`
	Shooter       *int     `json:"shooter"`
	ShooterPlayer *int     `json:"shooterPlayer"`
	Target        *int     `json:"target"`
	TargetPlayer  *int     `json:"targetPlayer"`
	TargetSource  string   `json:"targetSource"`
	Range         *float64 `json:"rangeM"`
	Aspect        *float64 `json:"aspectDeg"`
	OffBoresight  *float64 `json:"offBoresightDeg"`
	Closure       *float64 `json:"closureMs"`
	Outcome       string   `json:"outcome"`
	Reason        string   `json:"reason"`
	Confidence    string   `json:"confidence"`
	MissDistance  *float64 `json:"missDistanceM"`
	TClosest      *float64 `json:"tClosest"`
}

type wManifest struct {
	Decoder struct {
		Version string `json:"version"`
	} `json:"decoder"`
	Match struct {
		Level     string  `json:"level"`
		Mission   string  `json:"mission"`
		StartUTC  string  `json:"startTimeUtc"`
		StartUnix float64 `json:"startTimeUnix"`
		TFirst    float64 `json:"tFirstMs"`
		TLast     float64 `json:"tLastMs"`
		PlayedS   float64 `json:"timePlayedS"`
	} `json:"match"`
}

type wSession struct {
	ID        string
	Manifest  wManifest
	Players   []wPlayer
	Units     []*wUnit
	Events    []wEvent
	States    []wState
	Launches  []wLaunch
	HasLaunch bool
	Level     string
	bySlot    map[int]*wPlayer
}

func levelBase(level string) string {
	b := filepath.Base(strings.ReplaceAll(level, "\\", "/"))
	return strings.TrimSuffix(b, filepath.Ext(b))
}

func readZipEntries(path string, want map[string]bool) (map[string][]byte, error) {
	zr, err := zip.OpenReader(path)
	if err != nil {
		return nil, err
	}
	defer zr.Close()
	out := map[string][]byte{}
	for _, f := range zr.File {
		if !want[f.Name] {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return nil, err
		}
		b, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			return nil, err
		}
		out[f.Name] = b
	}
	return out, nil
}

func loadWTR(path string) (*wSession, error) {
	ent, err := readZipEntries(path, map[string]bool{"manifest.json": true, "players.json": true, "units.json": true,
		"events.json": true, "states.json": true, "launches.json": true, "tracks.bin": true})
	if err != nil {
		return nil, err
	}
	s := &wSession{ID: strings.TrimSuffix(filepath.Base(path), ".wtr")}
	for name, dst := range map[string]any{"manifest.json": &s.Manifest, "players.json": &s.Players, "units.json": &s.Units,
		"events.json": &s.Events, "states.json": &s.States} {
		if err := json.Unmarshal(ent[name], dst); err != nil {
			return nil, fmt.Errorf("%s: %w", name, err)
		}
	}
	if b, ok := ent["launches.json"]; ok {
		if json.Unmarshal(b, &s.Launches) == nil {
			s.HasLaunch = true
		}
	}
	tb := ent["tracks.bin"]
	f32 := func(c wColumn) []float64 {
		out := make([]float64, c.Count)
		for i := range out {
			o := c.Offset + i*4
			if o+4 > len(tb) {
				break
			}
			out[i] = float64(math.Float32frombits(binary.LittleEndian.Uint32(tb[o:])))
		}
		return out
	}
	for _, u := range s.Units {
		u.Owner = -1
		for _, c := range u.Columns {
			switch c.Name {
			case "t":
				u.T = make([]float64, c.Count)
				for i := range u.T {
					o := c.Offset + i*4
					if o+4 <= len(tb) {
						u.T[i] = float64(binary.LittleEndian.Uint32(tb[o:]))
					}
				}
			case "x":
				u.X = f32(c)
			case "y":
				u.Y = f32(c)
			case "z":
				u.Z = f32(c)
			case "heading":
				u.Heading = f32(c)
			case "pitch":
				u.Pitch = f32(c)
			case "targetEstX":
				u.TEX = f32(c)
			case "targetEstY":
				u.TEY = f32(c)
			case "targetEstZ":
				u.TEZ = f32(c)
			case "seekerMode":
				if c.Offset+c.Count <= len(tb) {
					u.SeekerMode = tb[c.Offset : c.Offset+c.Count]
				}
			}
		}
		if u.Kind == "aircraft" && u.Player != nil {
			u.Owner = *u.Player
		}
	}
	for _, u := range s.Units {
		if u.Kind != "aircraft" && u.Parent != nil && *u.Parent >= 0 && *u.Parent < len(s.Units) {
			p := s.Units[*u.Parent]
			u.Owner = p.Owner
			if u.Team == 0 {
				u.Team = p.Team
			}
		}
	}
	s.bySlot = map[int]*wPlayer{}
	for i := range s.Players {
		s.bySlot[s.Players[i].Slot] = &s.Players[i]
	}
	sort.SliceStable(s.Launches, func(i, j int) bool { return s.Launches[i].T < s.Launches[j].T })
	s.Level = levelBase(s.Manifest.Match.Level)
	return s, nil
}

// ---- track helpers ----

func (u *wUnit) n() int { return len(u.T) }

func (u *wUnit) alive(t float64) bool { return u.n() > 0 && t >= u.T[0] && t <= u.T[u.n()-1] }

func (u *wUnit) idx(t float64) int {
	n := u.n()
	if n == 0 || t <= u.T[0] {
		return 0
	}
	if t >= u.T[n-1] {
		return n - 1
	}
	return sort.Search(n, func(i int) bool { return u.T[i] > t }) - 1
}

type vec3 [3]float64

func (a vec3) sub(b vec3) vec3    { return vec3{a[0] - b[0], a[1] - b[1], a[2] - b[2]} }
func (a vec3) add(b vec3) vec3    { return vec3{a[0] + b[0], a[1] + b[1], a[2] + b[2]} }
func (a vec3) mul(k float64) vec3 { return vec3{a[0] * k, a[1] * k, a[2] * k} }
func (a vec3) dot(b vec3) float64 { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] }
func (a vec3) norm() float64      { return math.Sqrt(a.dot(a)) }
func (a vec3) hnorm() float64     { return math.Hypot(a[0], a[2]) }
func (a vec3) unit() vec3 {
	n := a.norm()
	if n == 0 {
		return a
	}
	return a.mul(1 / n)
}
func angleDeg(a, b vec3) float64 {
	na, nb := a.norm(), b.norm()
	if na == 0 || nb == 0 {
		return 0
	}
	c := a.dot(b) / (na * nb)
	return math.Acos(math.Max(-1, math.Min(1, c))) * 180 / math.Pi
}

// position at time t (clamped to the track)
func (u *wUnit) pos(t float64) vec3 {
	n := u.n()
	if n == 0 {
		return vec3{}
	}
	i := u.idx(t)
	j := i + 1
	if j >= n {
		return vec3{u.X[i], u.Y[i], u.Z[i]}
	}
	f := 0.0
	if d := u.T[j] - u.T[i]; d > 0 {
		f = math.Max(0, math.Min(1, (t-u.T[i])/d))
	}
	return vec3{u.X[i] + (u.X[j]-u.X[i])*f, u.Y[i] + (u.Y[j]-u.Y[i])*f, u.Z[i] + (u.Z[j]-u.Z[i])*f}
}

// velocity at time t, m/s, from a window of about ±0.5 s (aircraft: neighbouring samples)
func (u *wUnit) vel(t float64) vec3 {
	n := u.n()
	if n < 2 {
		return vec3{}
	}
	i := u.idx(t)
	a, b := i, i+1
	// Aircraft: one sample step. Measured on the reference matches (v0.9.0):
	// samples every 249 ± 14 ms and speed changes of only 1.8 m/s rms per step,
	// so the replay tracks are already smooth; a wider window only blurs turns.
	span := 1
	if u.Kind == "missile" {
		span = 6
	}
	a, b = i-span+1, i+span
	if a < 0 {
		a = 0
	}
	if b > n-1 {
		b = n - 1
	}
	if a >= b {
		a = b - 1
	}
	if a < 0 {
		return vec3{}
	}
	dt := (u.T[b] - u.T[a]) / 1000
	if dt <= 0 {
		return vec3{}
	}
	return vec3{(u.X[b] - u.X[a]) / dt, (u.Y[b] - u.Y[a]) / dt, (u.Z[b] - u.Z[a]) / dt}
}

// unit forward vector from heading/pitch (aircraft), or velocity direction
func (u *wUnit) fwd(t float64) vec3 {
	if u.Heading != nil && u.n() > 0 {
		i := u.idx(t)
		h, p := u.Heading[i]*math.Pi/180, u.Pitch[i]*math.Pi/180
		return vec3{math.Sin(h) * math.Cos(p), math.Sin(p), math.Cos(h) * math.Cos(p)}
	}
	return u.vel(t).unit()
}

// ---- terrain ----

type wTerrain struct {
	n                 int
	x0, z0, cell      float64
	hMin, hMax, water float64
	h                 []float32
}

func loadTerrain(dir, level string) *wTerrain {
	if level == "" {
		return nil
	}
	ent, err := readZipEntries(filepath.Join(dir, level+".wtt"), map[string]bool{"terrain.json": true, "height.u16": true})
	if err != nil {
		return nil
	}
	var m struct {
		GridSize   int     `json:"gridSize"`
		X0         float64 `json:"x0"`
		Z0         float64 `json:"z0"`
		CellM      float64 `json:"cellM"`
		HMin       float64 `json:"hMin"`
		HMax       float64 `json:"hMax"`
		WaterLevel float64 `json:"waterLevel"`
	}
	if json.Unmarshal(ent["terrain.json"], &m) != nil || m.GridSize < 2 {
		return nil
	}
	raw := ent["height.u16"]
	if len(raw) != m.GridSize*m.GridSize*2 {
		return nil
	}
	t := &wTerrain{n: m.GridSize, x0: m.X0, z0: m.Z0, cell: m.CellM, hMin: m.HMin, hMax: m.HMax, water: m.WaterLevel}
	t.h = make([]float32, m.GridSize*m.GridSize)
	k := (m.HMax - m.HMin) / 65535
	for i := range t.h {
		t.h[i] = float32(m.HMin + float64(binary.LittleEndian.Uint16(raw[i*2:]))*k)
	}
	return t
}

func (t *wTerrain) height(x, z float64) float64 {
	if t == nil {
		return 0
	}
	fx := (x-t.x0)/t.cell - 0.5
	fz := (z-t.z0)/t.cell - 0.5
	lim := float64(t.n) - 1.001
	fx = math.Max(0, math.Min(lim, fx))
	fz = math.Max(0, math.Min(lim, fz))
	ix, iz := int(fx), int(fz)
	ax, az := fx-float64(ix), fz-float64(iz)
	at := func(c, r int) float64 { return float64(t.h[r*t.n+c]) }
	v := (at(ix, iz)*(1-ax)+at(ix+1, iz)*ax)*(1-az) + (at(ix, iz+1)*(1-ax)+at(ix+1, iz+1)*ax)*az
	return math.Max(v, t.water)
}

// lineOfSight: true when the straight line between a and b stays above the terrain (with 30 m margin).
func (t *wTerrain) lineOfSight(a, b vec3) bool {
	if t == nil {
		return true
	}
	d := b.sub(a)
	steps := int(d.hnorm()/(t.cell*1.5)) + 1
	for i := 1; i < steps; i++ {
		f := float64(i) / float64(steps)
		p := a.add(d.mul(f))
		if p[1] < t.height(p[0], p[2])-30 {
			return false
		}
	}
	return true
}

// ---- catalogue (assets/catalog) ----

type wCatalog struct {
	Missiles map[string]struct {
		Name     string         `json:"name"`
		Guidance string         `json:"guidance"`
		Physics  map[string]any `json:"physics"`
	} `json:"missiles"`
	Radars struct {
		Sensors map[string]struct {
			Name         string                    `json:"name"`
			Patterns     map[string]map[string]any `json:"patterns"`
			NotchWidth   float64                   `json:"notchWidthMs"`
			NotchMaxElev float64                   `json:"notchMaxElevationDeg"`
		} `json:"sensors"`
		ByAircraft map[string][]string `json:"byAircraft"`
	}
	byName map[string]string // display name -> catalogue key
}

func loadCatalog(dir string) *wCatalog {
	c := &wCatalog{byName: map[string]string{}}
	if b, err := os.ReadFile(filepath.Join(dir, "weapons.json")); err == nil {
		_ = json.Unmarshal(b, c)
	}
	if b, err := os.ReadFile(filepath.Join(dir, "radars.json")); err == nil {
		_ = json.Unmarshal(b, &c.Radars)
	}
	keys := make([]string, 0, len(c.Missiles))
	for k := range c.Missiles {
		keys = append(keys, k)
	}
	sort.Strings(keys) // stable choice; "_default" variants sort after the base name
	for _, k := range keys {
		n := strings.ToLower(c.Missiles[k].Name)
		if _, ok := c.byName[n]; !ok && c.Missiles[k].Physics != nil {
			c.byName[n] = k
		}
	}
	return c
}

func numOf(m map[string]any, k string, def float64) float64 {
	if v, ok := m[k].(float64); ok {
		return v
	}
	return def
}
