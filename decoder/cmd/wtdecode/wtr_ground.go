// wtr_ground.go — ours. Ground-battle data in the .wtr file:
//   - per-sample hull attitude and gun direction for ground vehicles;
//   - shots.json: every weapon firing of every ground vehicle, with the shell's
//     ballistic arc computed from the gun direction at the moment of firing and
//     the shell's figures from the local game install (assets/catalog/ground.json).
//
// What the replay records (docs/ground.md): hull yaw (16-bit angle), world gun
// bearing and elevation, and per weapon the time it last fired, the time it is
// ready again and the rounds left per ammunition type. Shell flight is NOT
// recorded; arcs are computed here (gravity + drag, standard atmosphere, no wind).
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"

	packetmovement "github.com/maxsupermanhd/wrpl-inspector/v3/wrpl/packet/parser/movement"
)

const (
	shotPathDtMs     = 40    // spacing of stored arc points
	shotIntegrateDt  = 0.005 // s
	shotGunHeightM   = 2.0   // gun above the vehicle's reported position (approximation)
	shotHitRadiusM   = 3.5   // shell passing this close to a vehicle centre counts as hitting it
	shotAirRadiusM   = 10.0  // and this close to an aircraft
	shotMaxCannonS   = 8.0
	shotMaxMGS       = 3.0
	shotKillWindowMs = 6000 // a kill up to this long after a shot can be that shot's
)

type wtrShot struct {
	T           uint32  `json:"t"` // fire time, ms on the replay clock
	Unit        int     `json:"unit"`
	Weapon      int     `json:"weapon"` // index in the vehicle's weapon list
	Class       string  `json:"class"`  // cannon | mg | atgm | smoke | unknown
	CaliberMm   float64 `json:"caliberMm,omitempty"`
	WeaponName  string  `json:"weaponName,omitempty"`
	Shell       string  `json:"shell,omitempty"`
	ShellType   string  `json:"shellType,omitempty"`
	ShellSource string  `json:"shellSource,omitempty"` // kill | slot | guess
	AmmoSlot    int     `json:"ammoSlot"`              // ammunition type whose count dropped; -1 unknown
	AmmoLeft    int     `json:"ammoLeft"`              // rounds of that type left; -1 unknown
	ReloadS     float64 `json:"reloadS"`               // time until the weapon was ready again
	SpeedMs     float64 `json:"speedMs,omitempty"`     // muzzle velocity
	BearingDeg  float64 `json:"bearingDeg"`            // NaN-free: -1 when the gun direction is unknown
	ElevDeg     float64 `json:"elevDeg"`
	P0          int     `json:"p0"` // first arc point in the shot path columns
	N           int     `json:"n"`  // number of arc points, every shotPathDtMs from T
	TEnd        uint32  `json:"tEnd"`
	End         string  `json:"end"` // vehicle | aircraft | ground | range | none
	Hit         *int    `json:"hit,omitempty"`
	Kill        bool    `json:"kill,omitempty"`
	MissM       *int    `json:"missM,omitempty"` // kill shots: closest approach of the arc to the victim
	// ElevAdjDeg: kill shots only. The recorded gun elevation is accurate to
	// about ±0.3° (where on the target the shell struck); the arc of a shot
	// known to have killed is aimed at the victim by changing the elevation by
	// this much (never more than shotMaxAdjDeg).
	ElevAdjDeg float64 `json:"elevAdjDeg,omitempty"`
}

const shotMaxAdjDeg = 1.5

type wtrShotFile struct {
	Note     string               `json:"note"`
	PathDtMs int                  `json:"pathDtMs"`
	Summary  map[string]int       `json:"summary"` // shots by class, arcs and how they ended
	Columns  map[string]wtrColumn `json:"columns"` // x, y, z of all arc points, in tracks.bin
	Shots    []wtrShot            `json:"shots"`
}

// ---------------------------------------------------------------- catalogue

type groundCatShell struct {
	Set      string  `json:"set"`
	Name     string  `json:"name"`
	Type     string  `json:"type"`
	Speed    float64 `json:"speed"`
	MassKg   float64 `json:"massKg"`
	Cx       float64 `json:"cx"`
	CaliberM float64 `json:"caliberM"`
	DragCalM float64 `json:"dragCaliberM"`
	MaxDistM float64 `json:"maxDistM"`
}

// dragArea: cross-section the drag acts on (the dart, not the bore, for APFSDS).
func (sh *groundCatShell) dragArea() float64 {
	d := sh.CaliberM
	if sh.DragCalM > 0 {
		d = sh.DragCalM
	}
	return math.Pi * d * d / 4
}

type groundCatWeapon struct {
	Blk       string           `json:"blk"`
	Class     string           `json:"class"`
	CaliberMm float64          `json:"caliberMm"`
	Shells    []groundCatShell `json:"shells"`
}

type groundCatVehicle struct {
	Weapons []groundCatWeapon `json:"weapons"`
}

func wtrLoadGroundCatalog() map[string]groundCatVehicle {
	dir := *wtrCatalogDir
	if dir == "" {
		exe, err := os.Executable()
		if err != nil {
			return nil
		}
		dir = filepath.Join(filepath.Dir(filepath.Dir(exe)), "assets", "catalog")
	}
	raw, err := os.ReadFile(filepath.Join(dir, "ground.json"))
	if err != nil {
		return nil
	}
	var v struct {
		Vehicles map[string]groundCatVehicle `json:"vehicles"`
	}
	if json.Unmarshal(raw, &v) != nil {
		return nil
	}
	return v.Vehicles
}

// groundClassKey turns "tankModels/us_m1a2_sep3_abrams" into the catalogue key.
func groundClassKey(class string) string {
	c := strings.ToLower(strings.ReplaceAll(class, "\\", "/"))
	if i := strings.LastIndex(c, "/"); i >= 0 {
		c = c[i+1:]
	}
	return strings.TrimSuffix(c, ".blk")
}

// ---------------------------------------------------------------- attitude

// wtrGroundPoseColumns returns hull heading/pitch/roll and gun bearing/elevation
// for each sample (NaN where not sent), and whether any value was present.
func wtrGroundPoseColumns(samples []acmiSample, poses []packetmovement.GroundPose) (cols [5][]float32, any bool) {
	byT := make(map[uint32]packetmovement.GroundPose, len(poses))
	for _, p := range poses {
		byT[p.Time] = p
	}
	for k := range cols {
		cols[k] = make([]float32, len(samples))
	}
	for i, s := range samples {
		for k := range cols {
			cols[k][i] = wtrNaN()
		}
		p, ok := byT[s.t]
		if !ok {
			continue
		}
		if !isNaN32(p.Yaw) {
			cols[0][i], cols[1][i], cols[2][i] = p.Yaw, p.Pitch, p.Roll
			any = true
		}
		if !isNaN32(p.GunYaw) {
			cols[3][i] = float32(math.Mod(90-float64(p.GunYaw)+720, 360))
			cols[4][i] = p.GunPitch
			any = true
		}
	}
	return cols, any
}

func isNaN32(v float32) bool { return v != v }

// ---------------------------------------------------------------- shots

type shotCtx struct {
	units   []wtrUnit
	live    map[int][]acmiSample
	terrain *wtrTerrain
	cat     map[string]groundCatVehicle
	poses   map[int][]packetmovement.GroundPose // by unit id, sorted by time
}

// wtrBuildShots turns the recorded weapon firings into shots with arcs.
// unitKey maps a unit id to its ground replay key (1<<63 | uid).
func wtrBuildShots(in wtrInput, units []wtrUnit, unitKey map[int]uint64, live map[int][]acmiSample, events []wtrEvent, terrain *wtrTerrain, bin *wtrBin) (*wtrShotFile, map[string]int) {
	stats := map[string]int{}
	// ground battles only: in air battles the replay also carries anti-aircraft
	// gun firings, which are out of scope (air output stays as it was)
	if len(in.groundShots) == 0 || !wtrHasPlayerVehicles(units) {
		return nil, stats
	}
	ctx := shotCtx{units: units, live: live, terrain: terrain, cat: wtrLoadGroundCatalog(), poses: map[int][]packetmovement.GroundPose{}}
	type raw struct {
		unit int
		s    packetmovement.GroundShot
	}
	var all []raw
	for id, key := range unitKey {
		u := units[id]
		ps := in.groundPoses[key]
		ctx.poses[id] = ps
		for _, s := range in.groundShots[key] {
			ft := uint32(math.Round(float64(s.FiredAtS) * 1000))
			// a vehicle's replay id can be reused by a later spawn: keep the
			// shots inside this unit's lifetime
			if ft+200 < u.TStart || ft > u.TEnd+200 {
				continue
			}
			all = append(all, raw{id, s})
		}
	}
	sort.Slice(all, func(i, j int) bool {
		if all[i].s.FiredAtS != all[j].s.FiredAtS {
			return all[i].s.FiredAtS < all[j].s.FiredAtS
		}
		return all[i].unit < all[j].unit
	})

	weaponOf := func(unit, idx int) *groundCatWeapon {
		v, ok := ctx.cat[groundClassKey(units[unit].Class)]
		if !ok || idx < 0 || idx >= len(v.Weapons) {
			return nil
		}
		return &v.Weapons[idx]
	}

	// Learn which ammunition slot holds which shell from kills: the kill names
	// the shell, the killer's last shot before it names the slot.
	// Slots follow the player's own loadout order, so what is learned for one
	// spawn holds for the same player's later spawns in the same vehicle.
	type slotKey struct {
		owner  string // player slot + vehicle class, or unit id for AI
		weapon int
		slot   int
	}
	ownerOf := func(unit int) string {
		u := units[unit]
		if u.Player != nil {
			return fmt.Sprintf("p%d/%s", *u.Player, groundClassKey(u.Class))
		}
		return fmt.Sprintf("u%d", unit)
	}
	slotShell := map[slotKey]string{}
	killShot := map[int]int{} // index in all -> kill event index
	for ei, ev := range events {
		if ev.Type != "kill" || ev.Killer == nil || ev.Weapon == "" {
			continue
		}
		k := *ev.Killer
		best := -1
		for i := range all {
			if all[i].unit != k {
				continue
			}
			ft := uint32(math.Round(float64(all[i].s.FiredAtS) * 1000))
			if ft > ev.T || ev.T-ft > shotKillWindowMs {
				continue
			}
			w := weaponOf(k, int(all[i].s.Weapon))
			if w == nil || !weaponHasShell(w, ev.Weapon) {
				continue
			}
			best = i
		}
		if best < 0 {
			continue
		}
		killShot[best] = ei
		if all[best].s.AmmoSlot >= 0 {
			slotShell[slotKey{ownerOf(k), int(all[best].s.Weapon), all[best].s.AmmoSlot}] = strings.ToLower(ev.Weapon)
		}
	}

	file := &wtrShotFile{
		Note:     "Arcs are computed, not recorded: gun direction at firing, shell speed/mass/drag from the game files, gravity, standard atmosphere, no wind.",
		PathDtMs: shotPathDtMs,
	}
	var xs, ys, zs []float32
	for i, r := range all {
		s := r.s
		shot := wtrShot{
			T: uint32(math.Round(float64(s.FiredAtS) * 1000)), Unit: r.unit, Weapon: int(s.Weapon), Class: "unknown",
			AmmoSlot: s.AmmoSlot, AmmoLeft: s.AmmoLeft, ReloadS: wtrRound2(float64(s.ReadyAtS - s.FiredAtS)),
			BearingDeg: -1, P0: len(xs), End: "none",
		}
		w := weaponOf(r.unit, int(s.Weapon))
		var shell *groundCatShell
		if w != nil {
			shot.Class, shot.CaliberMm, shot.WeaponName = w.Class, w.CaliberMm, w.Blk
			if name, ok := slotShell[slotKey{ownerOf(r.unit), int(s.Weapon), s.AmmoSlot}]; ok && s.AmmoSlot >= 0 {
				shell = findShell(w, name)
				shot.ShellSource = "slot"
			}
			if ei, ok := killShot[i]; ok {
				if sh := findShell(w, events[ei].Weapon); sh != nil {
					shell, shot.ShellSource = sh, "kill"
				}
			}
			if shell == nil && len(w.Shells) > 0 {
				shell, shot.ShellSource = guessShell(w, s.AmmoSlot), "guess"
			}
		}
		if ei, ok := killShot[i]; ok {
			shot.Kill = true
			if events[ei].Victim != nil {
				v := *events[ei].Victim
				shot.Hit = &v
			}
		}
		if shell != nil {
			shot.Shell, shot.ShellType, shot.SpeedMs = shell.Name, shell.Type, shell.Speed
		}
		stats["shots"]++
		stats["shots_"+shot.Class]++
		pose, okPose := poseAt(ctx.poses[r.unit], shot.T)
		pos, okPos := wtrInterpolate(live[r.unit], shot.T)
		if okPose && !isNaN32(pose.GunYaw) {
			shot.BearingDeg = wtrRound2(math.Mod(90-float64(pose.GunYaw)+720, 360))
			shot.ElevDeg = wtrRound2(float64(pose.GunPitch))
		}
		if (shot.Class == "cannon" || shot.Class == "mg") && shell != nil && shell.Speed > 0 && okPos && shot.BearingDeg >= 0 {
			victim := -1
			if shot.Kill && shot.Hit != nil {
				victim = *shot.Hit
			}
			elev := shot.ElevDeg
			if victim >= 0 {
				if q, ok := wtrInterpolate(live[victim], shot.T); ok && units[victim].Kind == "ground" {
					if adj, ok := solveElevation(pos, q, elev, shell); ok {
						elev += adj
						shot.ElevAdjDeg = wtrRound2(adj)
					}
				}
			}
			pts, end, hit, tEnd, miss := ctx.fly(r.unit, shot.T, pos, shot.BearingDeg, elev, shell, shot.Class, victim)
			for _, p := range pts {
				xs, ys, zs = append(xs, float32(p[0])), append(ys, float32(p[1])), append(zs, float32(p[2]))
			}
			shot.N, shot.End, shot.TEnd = len(pts), end, tEnd
			if hit >= 0 && shot.Hit == nil {
				h := hit
				shot.Hit = &h
			}
			if miss >= 0 {
				m := int(math.Round(miss))
				shot.MissM = &m
			}
			stats["arcs"]++
			stats["end_"+end]++
		}
		file.Shots = append(file.Shots, shot)
	}
	file.Columns = map[string]wtrColumn{"x": bin.f32("shotX", xs), "y": bin.f32("shotY", ys), "z": bin.f32("shotZ", zs)}
	file.Summary = stats
	return file, map[string]int{"shots": stats["shots"], "shotsCannon": stats["shots_cannon"], "shotsMG": stats["shots_mg"]}
}

func weaponHasShell(w *groundCatWeapon, name string) bool { return findShell(w, name) != nil }

func findShell(w *groundCatWeapon, name string) *groundCatShell {
	n := strings.ToLower(strings.TrimSpace(name))
	for i := range w.Shells {
		if strings.ToLower(w.Shells[i].Name) == n {
			return &w.Shells[i]
		}
	}
	return nil
}

// poseAt returns the first pose at or after t (the firing is reported in the
// sample that follows it), else the last one before, within 300 ms.
func poseAt(ps []packetmovement.GroundPose, t uint32) (packetmovement.GroundPose, bool) {
	i := sort.Search(len(ps), func(i int) bool { return ps[i].Time >= t })
	for j := i; j < len(ps) && ps[j].Time <= t+300; j++ {
		if !isNaN32(ps[j].GunYaw) {
			return ps[j], true
		}
	}
	for j := i - 1; j >= 0 && ps[j].Time+300 >= t; j-- {
		if !isNaN32(ps[j].GunYaw) {
			return ps[j], true
		}
	}
	return packetmovement.GroundPose{}, false
}

func wtrRound2(v float64) float64 { return math.Round(v*100) / 100 }

// shellAirDensity: ISA troposphere, kg/m^3.
func shellAirDensity(h float64) float64 {
	h = math.Max(-500, math.Min(11000, h))
	return 1.225 * math.Pow(1-2.25577e-5*h, 4.25588)
}

// fly integrates the shell's flight. Returns arc points every shotPathDtMs,
// how it ended, the unit it hit (-1), the end time and, when victim >= 0, the
// closest approach to the victim (-1 otherwise).
func (c shotCtx) fly(shooter int, t0 uint32, pos [3]float64, bearingDeg, elevDeg float64, sh *groundCatShell, class string, victim int) ([][3]float64, string, int, uint32, float64) {
	b, e := bearingDeg*math.Pi/180, elevDeg*math.Pi/180
	p := [3]float64{pos[0], pos[1] + shotGunHeightM, pos[2]}
	v := [3]float64{sh.Speed * math.Cos(e) * math.Sin(b), sh.Speed * math.Sin(e), sh.Speed * math.Cos(e) * math.Cos(b)}
	area := sh.dragArea()
	kd := 0.0
	if sh.MassKg > 0 && sh.Cx > 0 {
		kd = 0.5 * sh.Cx * area / sh.MassKg
	}
	maxT := shotMaxCannonS
	if class == "mg" {
		maxT = shotMaxMGS
	}
	maxD := sh.MaxDistM
	if maxD <= 0 {
		maxD = 10000
	}
	// candidate targets: everything alive and within reach at the start
	type cand struct {
		id  int
		air bool
	}
	var cands []cand
	reach := sh.Speed*maxT + 500
	for id, u := range c.units {
		if id == shooter || (u.Kind != "ground" && u.Kind != "aircraft") || u.Static {
			continue
		}
		if t0 < u.TStart || t0 > u.TEnd {
			continue
		}
		q, ok := wtrInterpolate(c.live[id], t0)
		if !ok || math.Hypot(q[0]-p[0], q[2]-p[2]) > reach {
			continue
		}
		cands = append(cands, cand{id, u.Kind == "aircraft"})
	}
	pts := [][3]float64{p}
	travelled := 0.0
	miss := -1.0
	stepsPerPoint := int(math.Round(float64(shotPathDtMs) / 1000 / shotIntegrateDt))
	for step := 1; ; step++ {
		sp := math.Sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])
		k := kd * shellAirDensity(p[1]) * sp
		v[0] -= k * v[0] * shotIntegrateDt
		v[1] -= (k*v[1] + 9.81) * shotIntegrateDt
		v[2] -= k * v[2] * shotIntegrateDt
		prev := p
		p = [3]float64{p[0] + v[0]*shotIntegrateDt, p[1] + v[1]*shotIntegrateDt, p[2] + v[2]*shotIntegrateDt}
		travelled += sp * shotIntegrateDt
		tt := float64(step) * shotIntegrateDt
		tms := t0 + uint32(math.Round(tt*1000))
		if c.terrain != nil {
			if g := c.terrain.heightFine(p[0], p[2]); p[1] < g {
				// back up to the surface along the last step
				gp := c.terrain.heightFine(prev[0], prev[2])
				f := 1.0
				if d := (prev[1] - gp) - (p[1] - g); d > 0 {
					f = math.Max(0, math.Min(1, (prev[1]-gp)/d))
				}
				p = [3]float64{prev[0] + (p[0]-prev[0])*f, prev[1] + (p[1]-prev[1])*f, prev[2] + (p[2]-prev[2])*f}
				pts = append(pts, p)
				return pts, "ground", -1, tms, miss
			}
		}
		if step%2 == 0 { // vehicle checks every 10 ms (a 1,700 m/s round moves 17 m)
			for _, cd := range cands {
				q, ok := wtrInterpolate(c.live[cd.id], tms)
				if !ok {
					continue
				}
				q[1] += 1.2 // vehicle centre above its reported position
				r := shotHitRadiusM
				if cd.air {
					q[1] -= 1.2
					r = shotAirRadiusM
				}
				d := segPointDist(prev, p, q)
				if cd.id == victim && (miss < 0 || d < miss) {
					miss = d
				}
				if d <= r {
					pts = append(pts, p)
					end := "vehicle"
					if cd.air {
						end = "aircraft"
					}
					return pts, end, cd.id, tms, miss
				}
			}
		}
		if step%stepsPerPoint == 0 {
			pts = append(pts, p)
		}
		if tt >= maxT || travelled >= maxD {
			pts = append(pts, p)
			return pts, "range", -1, tms, miss
		}
	}
}

func segPointDist(a, b, q [3]float64) float64 {
	ab := [3]float64{b[0] - a[0], b[1] - a[1], b[2] - a[2]}
	aq := [3]float64{q[0] - a[0], q[1] - a[1], q[2] - a[2]}
	l2 := ab[0]*ab[0] + ab[1]*ab[1] + ab[2]*ab[2]
	f := 0.0
	if l2 > 0 {
		f = math.Max(0, math.Min(1, (aq[0]*ab[0]+aq[1]*ab[1]+aq[2]*ab[2])/l2))
	}
	d := [3]float64{a[0] + ab[0]*f - q[0], a[1] + ab[1]*f - q[1], a[2] + ab[2]*f - q[2]}
	return math.Sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2])
}

func wtrHasPlayerVehicles(units []wtrUnit) bool {
	for _, u := range units {
		if u.Kind == "ground" && u.Player != nil {
			return true
		}
	}
	return false
}

// wtrGroundChecks: self-checks for ground battles; none when the match has no
// player-driven ground vehicles (air battles are unchanged).
func wtrGroundChecks(units []wtrUnit, live map[int][]acmiSample, shots *wtrShotFile, headings map[int][]float32) []wtrCheck {
	if !wtrHasPlayerVehicles(units) {
		return nil
	}
	var out []wtrCheck
	add := func(id, name, status, value, expected, hint string) {
		if status == "pass" {
			hint = ""
		}
		out = append(out, wtrCheck{ID: id, Name: name, Status: status, Value: value, Expected: expected, Hint: hint})
	}
	// 1. hull heading agrees with the direction of travel
	var good, n int
	for _, u := range units {
		if u.Kind != "ground" || u.Player == nil {
			continue
		}
		hd := headings[u.ID]
		s := live[u.ID]
		if hd == nil || len(hd) != len(s) {
			continue
		}
		for i := 1; i+1 < len(s); i += 6 {
			dt := float64(s[i+1].t-s[i-1].t) / 1000
			if dt <= 0 || dt > 0.3 || isNaN32(hd[i]) {
				continue
			}
			dx, dz := s[i+1].x-s[i-1].x, s[i+1].z-s[i-1].z
			if math.Hypot(dx, dz)/dt < 3 {
				continue
			}
			course := math.Atan2(dx, dz) * 180 / math.Pi
			d := math.Abs(math.Mod(float64(hd[i])-course+540, 360) - 180)
			n++
			if d < 15 || d > 165 { // driving backwards also agrees
				good++
			}
		}
	}
	status := "pass"
	frac := float64(good) / math.Max(1, float64(n))
	if n == 0 {
		status = "fail"
	} else if frac < 0.9 {
		status = "warn"
		if frac < 0.7 {
			status = "fail"
		}
	}
	add("ground_heading", "Tank hull heading agrees with direction of travel", status, fmt.Sprintf("%.0f%% of %d moving samples within 15°", 100*frac, n), "at least 90%",
		"Hull attitude in the ground vehicle record changed (wrpl/packet/parser/movement/ground.go: parseVehiclePositionPose).")

	// 2. at kill shots the gun points at the victim
	if shots != nil {
		var on, tot, arcs, close5 int
		for _, sh := range shots.Shots {
			if !sh.Kill || sh.Hit == nil || sh.BearingDeg < 0 || units[*sh.Hit].Kind != "ground" {
				continue
			}
			a, ok1 := wtrInterpolate(live[sh.Unit], sh.T)
			b, ok2 := wtrInterpolate(live[*sh.Hit], sh.T)
			if !ok1 || !ok2 || math.Hypot(b[0]-a[0], b[2]-a[2]) < 20 {
				continue
			}
			brg := math.Atan2(b[0]-a[0], b[2]-a[2]) * 180 / math.Pi
			tot++
			if math.Abs(math.Mod(sh.BearingDeg-brg+540, 360)-180) <= 3 {
				on++
			}
			if sh.MissM != nil {
				arcs++
				if *sh.MissM <= 5 {
					close5++
				}
			}
		}
		status = "pass"
		frac = float64(on) / math.Max(1, float64(tot))
		if tot == 0 {
			status = "skipped"
		} else if frac < 0.8 {
			status = "warn"
			if frac < 0.6 {
				status = "fail"
			}
		}
		add("ground_gun_on_target", "Gun points at the victim when a kill shot is fired", status, fmt.Sprintf("%d of %d kill shots within 3°", on, tot), "at least 80%",
			"Gun direction in the ground vehicle record changed (ground.go: hasPoint4 block), or kills are linked to the wrong shot (wtr_ground.go).")
		status = "pass"
		frac = float64(close5) / math.Max(1, float64(arcs))
		if arcs == 0 {
			status = "skipped"
		} else if frac < 0.6 {
			status = "warn"
		}
		add("ground_kill_arcs", "Computed shell arcs of kill shots reach the victim", status, fmt.Sprintf("%d of %d within 5 m", close5, arcs), "at least 60%",
			"Shell figures (assets/catalog/ground.json), gun elevation or the gun height used in wtr_ground.go are off.")
	}
	return out
}

// solveElevation finds the change of gun elevation that puts the arc through
// the target's centre (1.2 m above its reported position). ok is false when
// the needed change is larger than shotMaxAdjDeg.
func solveElevation(from, to [3]float64, elevDeg float64, sh *groundCatShell) (float64, bool) {
	d := math.Hypot(to[0]-from[0], to[2]-from[2])
	if d < 5 || sh.Speed <= 0 {
		return 0, false
	}
	ty := to[1] + 1.2
	area := sh.dragArea()
	kd := 0.0
	if sh.MassKg > 0 && sh.Cx > 0 {
		kd = 0.5 * sh.Cx * area / sh.MassKg
	}
	heightAt := func(e float64) (float64, bool) {
		er := e * math.Pi / 180
		h, y := 0.0, from[1]+shotGunHeightM
		vh, vy := sh.Speed*math.Cos(er), sh.Speed*math.Sin(er)
		for t := 0.0; t < shotMaxCannonS; t += shotIntegrateDt {
			sp := math.Hypot(vh, vy)
			k := kd * shellAirDensity(y) * sp
			vh -= k * vh * shotIntegrateDt
			vy -= (k*vy + 9.81) * shotIntegrateDt
			nh := h + vh*shotIntegrateDt
			ny := y + vy*shotIntegrateDt
			if nh >= d {
				f := (d - h) / (nh - h)
				return y + (ny-y)*f, true
			}
			h, y = nh, ny
		}
		return 0, false
	}
	e := elevDeg
	for i := 0; i < 6; i++ {
		y, ok := heightAt(e)
		if !ok {
			return 0, false
		}
		e += math.Atan2(ty-y, d) * 180 / math.Pi
	}
	adj := e - elevDeg
	if math.Abs(adj) > shotMaxAdjDeg {
		return 0, false
	}
	return adj, true
}

// guessShell: slot 0 is nearly always the player's main armour-piercing round
// (seen on 3 Ground RB matches); take the fastest dart/AP shell. Otherwise the
// weapon's default shell.
func guessShell(w *groundCatWeapon, slot int) *groundCatShell {
	if slot == 0 || slot < 0 {
		var best *groundCatShell
		for i := range w.Shells {
			t := strings.ToLower(w.Shells[i].Type)
			if strings.Contains(t, "apds") || strings.HasPrefix(t, "ap") {
				if best == nil || w.Shells[i].Speed > best.Speed {
					best = &w.Shells[i]
				}
			}
		}
		if best != nil {
			return best
		}
	}
	return &w.Shells[0]
}
