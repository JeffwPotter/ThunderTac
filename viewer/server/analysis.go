// Match analysis: shot scorecards, missiles fired at each player, deaths,
// threat timeline, altitude bands, teammates, terrain masking, engagements
// and a report card with the biggest mistakes. Computed for every player of a
// match from the .wtr file, then cached next to it (<id>.analysis.json).
//
// Everything here is an estimate built from positions, radar states and the
// missiles' seeker states. Thresholds are constants at the top of this file.
package main

import (
	"fmt"
	"math"
	"sort"
	"strings"
)

const analysisVersion = "a6" // a6: ground victims and SAM killers now linked to kills (v0.10.0); a5: SARH dropped lock, guessed targets (v0.9.0)

const (
	nearKm          = 40.0 // "enemy nearby"
	losKm           = 60.0 // terrain line-of-sight checked up to this range
	aloneKm         = 20.0 // nearest teammate further than this = flying alone
	threatStepMs    = 2000.0
	reactTurnDeg    = 30.0    // heading change counted as a reaction
	reactDiveM      = 600.0   // altitude loss counted as a reaction
	reactWindowMs   = 30000.0 // a reaction must come within this time of the launch
	notchHalfStrict = 20.0    // m/s, half of the radar's main-beam notch width (40 m/s in game data)
	notchHalfLoose  = 40.0
	notchElevDefDeg = 3.5 // look-down angle needed for the notch (game data, most radars)
)

type opt = *float64

func of(v float64) opt {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return nil
	}
	r := math.Round(v*10) / 10
	return &r
}
func ofp(v float64) opt {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return nil
	}
	r := math.Round(v*100) / 100
	return &r
}
func ofi(v float64) opt {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return nil
	}
	r := math.Round(v)
	return &r
}

type factor struct {
	Key   string `json:"key"`
	Grade string `json:"grade"` // good | fair | poor
	Text  string `json:"text"`
}

type shotA struct {
	Missile, Shooter, Target     int
	ShooterPlayer, TargetPlayer  int
	T                            float64
	Model, Guidance              string
	RangeM, AspectDeg, ClosureMs opt
	OffBoresightDeg              opt
	ShooterAltM, TargetAltM      opt
	TargetAglM, TargetAglMinM    opt
	ShooterMach, TargetMach      opt
	RmaxM, RneM                  opt
	RangeRatio                   opt
	EnvelopeKnown                bool
	MultipathLaunch              float64
	MultipathTerminal            float64
	TargetRadialMs               opt
	NotchAtLaunch                bool
	LockedAtLaunch               bool
	SupportShare                 opt
	MaxOffAngleDeg               opt
	ActiveT                      opt
	DistAtActiveM, DistAtEndM    opt
	ShooterTurnedColdT           opt
	LockDroppedT                 opt    // SARH: when the shooter's lock on the target ended for good before the missile arrived
	LockDroppedWhy               string
	TargetGuessed                bool // the replay names no target; guessed from the flight path (inferTarget) // "defensive" (turned away or a missile was coming at the shooter) or ""
	EndSpeedMs, EndClosureMs     opt
	Outcome, Reason, Confidence  string
	MissDistanceM                opt
	Grade                        string
	Score                        int
	Factors                      []factor
}

type cmA struct {
	T    float64 `json:"t"`
	Type string  `json:"type"`
}

type incomingA struct {
	Missile, Shooter, ShooterPlayer, Unit int
	T, TEnd                               float64
	Model, Guidance                       string
	RangeM, AspectDeg                     opt
	ShooterLOS                            *bool
	ReactionS                             opt
	ReactionKind                          string
	CMs                                   []cmA `json:"cms"`
	ChaffInNotch                          int
	NotchShare, NotchShareLoose           opt
	NotchApplies                          bool
	NotchSeries                           [][4]float64 // t, radial m/s, look-down 1/0, angle to beam (0 = on the beam)
	ActiveT, LostT                        opt
	Outcome, Reason                       string
	KilledMe                              bool
	Grade                                 string
	Factors                               []factor
}

type deathA struct {
	T                          float64
	Unit, Killer, KillerPlayer int
	KillerName, Weapon         string
	Missile                    int
	Crash, TeamKill            bool
	AltM, AglM, SpeedMs, Mach  opt
	AltLost30M, SpeedLost30Ms  opt
	LockedBy                   []string
	MissilesAt60               int
	ReactionS, NotchShare      opt
	FixatedOn                  string
	NearestTeammateKm          opt
	EnemiesWithin20            int
	Tags                       []string
	Series                     [][3]float64 // t, alt, speed (last 30 s)
}

type killA struct {
	T                 float64 `json:"t"`
	Victim            int     `json:"victim"`
	VictimName        string  `json:"victimName"`
	Weapon            string  `json:"weapon"`
	Missile           int     `json:"missile"`
	TeamKill          bool    `json:"teamKill"`
	AltM              opt     `json:"altM"`
	NearestTeammateKm opt     `json:"nearestTeammateKm"`
}

type engagementA struct {
	Start, End       float64
	Opponents        []int
	OpponentNames    []string
	FirstShotT       opt
	FirstShotByMe    bool
	FirstShotRangeM  opt
	FirstShotMissile int
	MyShots          []int
	TheirShots       []int
	MyEnergyM        opt // specific energy h + v²/2g at the first shot
	TheirEnergyM     opt
	AltDiffM         opt
	SpeedDiffMs      opt
	Kills, Deaths    int
	Result           string
}

type threatA struct {
	T                 []float64
	EnemiesNear       []int
	EnemiesLOS        []int
	RadarsOnMe        []int
	MissilesAtMe      []int
	AltM              []float64
	SpeedMs           []float64
	NearestTeammateKm []float64 // -1 = none alive
	NearestEnemyKm    []float64
}

type bandsA struct {
	EdgesM []float64
	TimeS  []float64
	Shots  []int
	Kills  []int
	Deaths []int
}

type mistakeA struct {
	T        float64 `json:"t"`
	Severity int     `json:"severity"`
	Kind     string  `json:"kind"`
	Text     string  `json:"text"`
	Select   int     `json:"select"`
}

type playerA struct {
	Slot        int
	Name        string
	Team        int
	Vehicles    []string
	Shots       []int // indices into analysis.Shots
	Incoming    []incomingA
	Deaths      []deathA
	Kills       []killA
	Engagements []engagementA
	Threat      threatA
	Bands       bandsA
	AloneShare  opt
	MaskedShare opt
	Summary     map[string]float64
	Mistakes    []mistakeA
}

type analysis struct {
	Version  string
	Session  string
	Level    string
	Terrain  bool
	HasShots bool
	T0, T1   float64
	Shots    []shotA
	Players  []playerA
	Notes    []string
}

// ---------------------------------------------------------------------------

type radarSnap struct {
	t       float64
	on      bool
	targets []int
	sensor  string
}

type ctx struct {
	s        *wSession
	terr     *wTerrain
	cat      *wCatalog
	radar    map[int][]radarSnap
	cmBy     map[int][]*wUnit // countermeasures by parent unit
	phys     map[int]*missilePhys
	shotByM  map[int]int
	notchFor map[int][2]float64 // aircraft unit -> notch half width, max elevation
}

func (c *ctx) radarAt(unit int, t float64) *radarSnap {
	r := c.radar[unit]
	i := sort.Search(len(r), func(i int) bool { return r[i].t > t }) - 1
	if i < 0 {
		return nil
	}
	return &r[i]
}

func (c *ctx) designates(unit, target int, t float64) bool {
	r := c.radarAt(unit, t)
	if r == nil {
		return false
	}
	for _, x := range r.targets {
		if x == target {
			return true
		}
	}
	return false
}

func (c *ctx) unitOf(slot int, t float64) *wUnit {
	p := c.s.bySlot[slot]
	if p == nil {
		return nil
	}
	for _, id := range p.Units {
		if id >= 0 && id < len(c.s.Units) && c.s.Units[id].alive(t) {
			return c.s.Units[id]
		}
	}
	return nil
}

func (c *ctx) name(u *wUnit) string {
	if u == nil {
		return "?"
	}
	if u.Owner >= 0 {
		if p := c.s.bySlot[u.Owner]; p != nil {
			return p.Name
		}
	}
	if u.AI {
		return u.Name + " (AI)"
	}
	return u.Name
}

func (c *ctx) agl(p vec3) float64 {
	if c.terr == nil {
		return math.NaN()
	}
	return p[1] - c.terr.height(p[0], p[2])
}

func headingOf(u *wUnit, t float64) float64 {
	if u.Heading != nil && u.n() > 0 {
		return u.Heading[u.idx(t)]
	}
	v := u.vel(t)
	return math.Atan2(v[0], v[2]) * 180 / math.Pi
}

func angDiff(a, b float64) float64 {
	d := math.Mod(a-b+540, 360) - 180
	return math.Abs(d)
}

func machAt(v float64, h float64) float64 {
	_, a := atmosphere(h)
	return v / a
}

func (c *ctx) notchParams(radarUnit int) (float64, float64) {
	if v, ok := c.notchFor[radarUnit]; ok {
		return v[0], v[1]
	}
	half, elev := notchHalfStrict, notchElevDefDeg
	if c.cat != nil && radarUnit >= 0 && radarUnit < len(c.s.Units) {
		u := c.s.Units[radarUnit]
		for _, sid := range c.cat.Radars.ByAircraft[strings.ToLower(u.Class)] {
			if s, ok := c.cat.Radars.Sensors[sid]; ok && s.NotchWidth > 0 {
				half = s.NotchWidth / 2
				if s.NotchMaxElev > 0 {
					elev = s.NotchMaxElev
				}
				break
			}
		}
	}
	c.notchFor[radarUnit] = [2]float64{half, elev}
	return half, elev
}

// radial: target velocity component along the line from the threat to the
// target (what a Doppler radar sees), and whether the threat looks down on it.
func radial(threat, tgt vec3, tv vec3, maxElev float64) (float64, bool, float64) {
	los := tgt.sub(threat)
	u := los.unit()
	vr := tv.dot(u)
	elev := math.Atan2(los[1], los.hnorm()) * 180 / math.Pi
	beam := math.Abs(90 - angleDeg(tv, los))
	return vr, elev < maxElev, beam
}

func gradeRank(g string) int {
	switch g {
	case "poor":
		return 1
	case "fair":
		return 2
	}
	return 3
}

func worst(fs []factor) (string, int) {
	if len(fs) == 0 {
		return "unknown", 0
	}
	w, sum := "good", 0
	for _, f := range fs {
		if gradeRank(f.Grade) < gradeRank(w) {
			w = f.Grade
		}
		sum += gradeRank(f.Grade)
	}
	return w, int(math.Round(float64(sum-len(fs)) / float64(2*len(fs)) * 100))
}

func km(m float64) string {
	if m >= 10000 {
		return fmt.Sprintf("%.0f km", m/1000)
	}
	return fmt.Sprintf("%.1f km", m/1000)
}

// ---------------------------------------------------------------------------

func analyse(s *wSession, terr *wTerrain, cat *wCatalog) *analysis {
	c := &ctx{s: s, terr: terr, cat: cat, radar: map[int][]radarSnap{}, cmBy: map[int][]*wUnit{},
		phys: map[int]*missilePhys{}, shotByM: map[int]int{}, notchFor: map[int][2]float64{}}
	a := &analysis{Version: analysisVersion, Session: s.ID, Level: s.Level, Terrain: terr != nil, HasShots: s.HasLaunch,
		T0: s.Manifest.Match.TFirst, T1: s.Manifest.Match.TLast, Shots: []shotA{}, Players: []playerA{}}
	if terr == nil {
		a.Notes = append(a.Notes, "No terrain file for this map: height above ground, multipath and terrain masking are not available.")
	}
	if !s.HasLaunch {
		a.Notes = append(a.Notes, "This match was converted before shot records existed. Convert it again for shot analysis.")
	}

	// radar timelines
	cur := map[int]map[string]string{}
	for _, st := range s.States {
		m := cur[st.Unit]
		if m == nil {
			m = map[string]string{}
			cur[st.Unit] = m
		}
		for k, v := range st.Set {
			m[k] = v
		}
		snap := radarSnap{t: st.T, on: m["radarOn"] == "1", sensor: m["radarSensor"]}
		for i := 1; i <= 8; i++ {
			if v := m[fmt.Sprintf("target%d", i)]; v != "" {
				var id int
				if _, err := fmt.Sscan(v, &id); err == nil {
					snap.targets = append(snap.targets, id)
				}
			}
		}
		r := c.radar[st.Unit]
		if len(r) > 0 && r[len(r)-1].t == st.T {
			r[len(r)-1] = snap
		} else {
			r = append(r, snap)
		}
		c.radar[st.Unit] = r
	}
	for _, u := range s.Units {
		if u.Kind == "countermeasure" && u.Parent != nil {
			c.cmBy[*u.Parent] = append(c.cmBy[*u.Parent], u)
		}
	}

	// ---- shots ----
	for _, l := range s.Launches {
		if l.Missile < 0 || l.Missile >= len(s.Units) {
			continue
		}
		c.shotByM[l.Missile] = len(a.Shots)
		a.Shots = append(a.Shots, c.shot(l))
	}

	// ---- players ----
	for _, p := range s.Players {
		if len(p.Units) == 0 {
			continue
		}
		a.Players = append(a.Players, c.player(a, p))
	}
	return a
}

func (c *ctx) physOf(id int) *missilePhys {
	if p, ok := c.phys[id]; ok {
		return p
	}
	p := c.cat.physics(c.s.Units[id])
	c.phys[id] = p
	return p
}

func isRadar(g string) bool { return g == "ARH" || g == "SARH" }

func (c *ctx) shot(l wLaunch) shotA {
	s := c.s
	m := s.Units[l.Missile]
	ph := c.physOf(l.Missile)
	sh := shotA{Missile: l.Missile, Shooter: -1, Target: -1, ShooterPlayer: -1, TargetPlayer: -1, T: l.T, Model: m.Name,
		Guidance: l.Guidance, Outcome: l.Outcome, Reason: l.Reason, Confidence: l.Confidence, MissDistanceM: l.MissDistance,
		RangeM: l.Range, AspectDeg: l.Aspect, ClosureMs: l.Closure, OffBoresightDeg: l.OffBoresight, Factors: []factor{}}
	if sh.Guidance == "" {
		sh.Guidance = ph.Guidance
	}
	if l.ShooterPlayer != nil {
		sh.ShooterPlayer = *l.ShooterPlayer
	}
	if l.TargetPlayer != nil {
		sh.TargetPlayer = *l.TargetPlayer
	}
	guessed := false
	if l.Shooter != nil && *l.Shooter >= 0 && (l.Target == nil || *l.Target < 0) {
		if g, _ := inferTarget(s, l.Missile, *l.Shooter, l.T); g >= 0 {
			gg := g
			l.Target = &gg
			if s.Units[g].Owner >= 0 {
				sh.TargetPlayer = s.Units[g].Owner
			}
			guessed = true
		}
	}
	if l.Shooter == nil || l.Target == nil || *l.Shooter < 0 || *l.Target < 0 {
		sh.Grade = "unknown"
		if l.Shooter != nil {
			sh.Shooter = *l.Shooter
		}
		return sh
	}
	sh.Shooter, sh.Target = *l.Shooter, *l.Target
	sh.TargetGuessed = guessed
	S, T := s.Units[sh.Shooter], s.Units[sh.Target]
	t0 := l.T
	ps, pt := S.pos(t0), T.pos(t0)
	vs, vt := S.vel(t0), T.vel(t0)
	los := pt.sub(ps)
	R := los.norm()
	sh.RangeM = ofi(R)
	sh.ShooterAltM, sh.TargetAltM = ofi(ps[1]), ofi(pt[1])
	sh.ShooterMach, sh.TargetMach = of(machAt(vs.norm(), ps[1])), of(machAt(vt.norm(), pt[1]))
	asp := angleDeg(vt, los.mul(-1))
	sh.AspectDeg = ofi(asp)
	radar := isRadar(sh.Guidance)

	// envelope
	rmax, rne := ph.envelope(ps[1], vs.norm(), pt[1], vt.norm(), asp)
	sh.EnvelopeKnown = ph.Known && rmax > 0
	if sh.EnvelopeKnown {
		sh.RmaxM, sh.RneM = ofi(rmax), ofi(rne)
		sh.RangeRatio = ofp(R / rmax)
		g, txt := "good", ""
		switch {
		case rne > 0 && R <= rne:
			txt = fmt.Sprintf("Inside the estimated no-escape range (%s of %s)", km(R), km(rne))
		case R <= 0.85*rmax:
			g, txt = "fair", fmt.Sprintf("Outside no-escape range (%s): the target could still outrun it by turning away", km(rne))
		case R <= rmax:
			g, txt = "poor", fmt.Sprintf("At the edge of the estimated max range (%s of %s)", km(R), km(rmax))
		default:
			g, txt = "poor", fmt.Sprintf("Beyond the estimated max range (%s, max about %s)", km(R), km(rmax))
		}
		sh.Factors = append(sh.Factors, factor{"range", g, txt})
	}
	if asp > 120 {
		sh.Factors = append(sh.Factors, factor{"aspect", map[bool]string{true: "good", false: "fair"}[rne > 0 && R <= rne],
			fmt.Sprintf("Target flying away (aspect %.0f°)", asp)})
	}

	// multipath (radar missiles vs low targets)
	aglL := c.agl(pt)
	sh.TargetAglM = ofi(aglL)
	if c.terr != nil {
		minA := math.Inf(1)
		tEnd := m.TEnd
		if l.TClosest != nil {
			tEnd = *l.TClosest
		}
		for t := math.Max(t0, tEnd-10000); t <= tEnd; t += 250 {
			if T.alive(t) {
				minA = math.Min(minA, c.agl(T.pos(t)))
			}
		}
		if !math.IsInf(minA, 1) {
			sh.TargetAglMinM = ofi(minA)
		}
		if radar && len(ph.Multipath) == 4 {
			sh.MultipathLaunch = math.Round(ph.multipathAt(aglL)*100) / 100
			if !math.IsInf(minA, 1) {
				sh.MultipathTerminal = math.Round(ph.multipathAt(minA)*100) / 100
			}
			lim := ph.Multipath[2]
			switch {
			case sh.MultipathLaunch >= 0.5:
				sh.Factors = append(sh.Factors, factor{"multipath", "poor", fmt.Sprintf("Target only %.0f m above the ground: radar missile suffers multipath below about %.0f m", aglL, lim)})
			case sh.MultipathLaunch > 0:
				sh.Factors = append(sh.Factors, factor{"multipath", "fair", fmt.Sprintf("Target %.0f m above the ground: some multipath (below about %.0f m)", aglL, lim)})
			case sh.MultipathTerminal >= 0.5:
				sh.Factors = append(sh.Factors, factor{"multipath", "fair", fmt.Sprintf("Target dropped to %.0f m above the ground before the missile arrived (multipath)", minA)})
			default:
				sh.Factors = append(sh.Factors, factor{"multipath", "good", fmt.Sprintf("Target high enough for no multipath (%.0f m above ground)", aglL)})
			}
		}
	}

	// notch at launch, lock, support
	if radar {
		half, elev := c.notchParams(sh.Shooter)
		vr, down, _ := radial(ps, pt, vt, elev)
		sh.TargetRadialMs = ofi(vr)
		sh.NotchAtLaunch = down && math.Abs(vr) < half
		if sh.NotchAtLaunch {
			sh.Factors = append(sh.Factors, factor{"notch", "poor", fmt.Sprintf("Target was beaming you (notching) at launch: %.0f m/s toward/away from you", math.Abs(vr))})
		}
	}
	sh.LockedAtLaunch = c.designates(sh.Shooter, sh.Target, t0+500)
	end := m.TEnd
	if l.TClosest != nil && *l.TClosest > t0 {
		end = math.Min(end, *l.TClosest)
	}
	// missile seeker active
	activeT := math.NaN()
	for i := range m.T {
		if m.SeekerMode != nil && i < len(m.SeekerMode) && m.SeekerMode[i] == 2 {
			activeT = m.T[i]
			break
		}
	}
	if !math.IsNaN(activeT) {
		sh.ActiveT = of(activeT)
	}
	supEnd := end
	if sh.Guidance == "ARH" && !math.IsNaN(activeT) {
		supEnd = activeT
	}
	if radar && sh.Guidance != "IR" {
		n, on := 0, 0
		maxOff := 0.0
		for t := t0 + 500; t <= supEnd; t += 500 {
			if !S.alive(t) {
				break
			}
			n++
			if c.designates(sh.Shooter, sh.Target, t) {
				on++
			}
			if T.alive(t) {
				off := angleDeg(S.fwd(t), T.pos(t).sub(S.pos(t)))
				maxOff = math.Max(maxOff, off)
			}
		}
		if n > 0 {
			share := float64(on) / float64(n)
			sh.SupportShare = ofp(share)
			sh.MaxOffAngleDeg = ofi(maxOff)
			switch {
			case sh.Guidance == "SARH" && !sh.LockedAtLaunch:
				sh.Factors = append(sh.Factors, factor{"lock", "poor", "Semi-active missile fired without a radar lock on this target"})
			case sh.Guidance == "SARH" && share < 0.8:
				sh.Factors = append(sh.Factors, factor{"support", "poor", fmt.Sprintf("Radar lock held only %.0f%% of the missile's flight (semi-active needs it all the way)", share*100)})
			case sh.Guidance == "ARH" && !sh.LockedAtLaunch:
				sh.Factors = append(sh.Factors, factor{"lock", "fair", "Fired without a radar lock on this target (no mid-course updates)"})
			case sh.Guidance == "ARH" && share < 0.8:
				sh.Factors = append(sh.Factors, factor{"support", "fair", fmt.Sprintf("Lock held only %.0f%% of the time until the missile went active", share*100)})
			default:
				sh.Factors = append(sh.Factors, factor{"support", "good", "Lock held while the missile needed it"})
			}
		}
	}
	// SARH: did the shooter drop the lock before the missile arrived, and was it to defend?
	if radar && sh.Guidance == "SARH" && sh.LockedAtLaunch && sh.Outcome != "kill" {
		lost := math.NaN()
		for t := t0 + 1000; t <= end-500; t += 250 {
			if !S.alive(t) {
				lost = t
				break
			}
			if !c.designates(sh.Shooter, sh.Target, t) && !c.designates(sh.Shooter, sh.Target, t+1000) && !c.designates(sh.Shooter, sh.Target, t+2000) {
				lost = t
				break
			}
		}
		if !math.IsNaN(lost) && S.alive(lost) {
			why := ""
			// turned well away from the target around the moment the lock went
			for t := lost - 6000; t <= lost+2000; t += 500 {
				if S.alive(t) && T.alive(t) && angleDeg(S.fwd(t), T.pos(t).sub(S.pos(t))) > 60 {
					why = "defensive"
					break
				}
			}
			// or a missile was in the air against the shooter
			for _, o := range c.s.Launches {
				if o.Target != nil && *o.Target == sh.Shooter && o.T > lost-20000 && o.T < lost+1000 && o.Missile >= 0 && o.Missile < len(c.s.Units) {
					if c.s.Units[o.Missile].TEnd > lost-2000 {
						why = "defensive"
					}
				}
			}
			sh.LockDroppedT = of(lost)
			sh.LockDroppedWhy = why
			txt := fmt.Sprintf("Lock dropped %.0f s after launch, before the missile arrived: a semi-active missile cannot guide without it", (lost-t0)/1000)
			if why == "defensive" {
				txt = fmt.Sprintf("Lock dropped %.0f s after launch while you were defending (turned away or a missile was coming at you): the semi-active missile lost its guidance", (lost-t0)/1000)
			}
			sh.Factors = append(sh.Factors, factor{"dropped", "poor", txt})
		}
	}
	if !math.IsNaN(activeT) && S.alive(activeT) && T.alive(activeT) {
		sh.DistAtActiveM = ofi(T.pos(activeT).sub(S.pos(activeT)).norm())
	}
	if S.alive(end) && T.alive(end) {
		sh.DistAtEndM = ofi(T.pos(end).sub(S.pos(end)).norm())
	}
	// shooter turned away: angle between shooter heading and line to target > 120°
	for t := t0 + 1000; t <= m.TEnd+10000; t += 500 {
		if !S.alive(t) || !T.alive(t) {
			break
		}
		if angleDeg(S.fwd(t), T.pos(t).sub(S.pos(t))) > 120 {
			sh.ShooterTurnedColdT = of(t)
			break
		}
	}
	// missile energy at the end
	if m.n() > 2 {
		vm := m.vel(end)
		sh.EndSpeedMs = ofi(vm.norm())
		if T.alive(end) {
			d := T.pos(end).sub(m.pos(end)).unit()
			sh.EndClosureMs = ofi(vm.sub(T.vel(end)).dot(d))
		}
	}
	if sh.Guidance == "IR" && ph.Known {
		if l.OffBoresight != nil && *l.OffBoresight > 45 {
			sh.Factors = append(sh.Factors, factor{"boresight", "fair", fmt.Sprintf("Fired %.0f° off the nose", *l.OffBoresight)})
		}
	}
	sh.Grade, sh.Score = worst(sh.Factors)
	return sh
}

func (c *ctx) incoming(a *analysis, si int, victim *wUnit) incomingA {
	s := c.s
	sh := a.Shots[si]
	m := s.Units[sh.Missile]
	in := incomingA{Missile: sh.Missile, Shooter: sh.Shooter, ShooterPlayer: sh.ShooterPlayer, Unit: victim.ID, T: sh.T, TEnd: m.TEnd,
		Model: sh.Model, Guidance: sh.Guidance, RangeM: sh.RangeM, AspectDeg: sh.AspectDeg, Outcome: sh.Outcome, Reason: sh.Reason,
		CMs: []cmA{}, NotchSeries: [][4]float64{}, Factors: []factor{}}
	t0, t1 := sh.T, m.TEnd
	if victim.n() > 0 {
		t1 = math.Min(t1, victim.T[victim.n()-1])
	}
	var S *wUnit
	if sh.Shooter >= 0 {
		S = s.Units[sh.Shooter]
		if c.terr != nil && S.alive(t0) && victim.alive(t0) {
			b := c.terr.lineOfSight(S.pos(t0), victim.pos(t0))
			in.ShooterLOS = &b
		}
	}
	// countermeasures
	for _, cm := range c.cmBy[victim.ID] {
		if cm.TStart >= t0-1000 && cm.TStart <= t1 {
			typ := "chaff"
			if cm.CM != nil && strings.EqualFold(cm.CM.Type, "flare") {
				typ = "flare"
			}
			in.CMs = append(in.CMs, cmA{cm.TStart, typ})
		}
	}
	sort.Slice(in.CMs, func(i, j int) bool { return in.CMs[i].T < in.CMs[j].T })
	// reaction
	h0, alt0 := headingOf(victim, t0), victim.pos(t0)[1]
	react := math.NaN()
	tReact := math.Min(t1, t0+reactWindowMs)
	for t := t0 + 250; t <= tReact; t += 250 {
		if angDiff(headingOf(victim, t), h0) > reactTurnDeg {
			react, in.ReactionKind = t, "turn"
			break
		}
		if alt0-victim.pos(t)[1] > reactDiveM {
			react, in.ReactionKind = t, "dive"
			break
		}
	}
	for _, cm := range in.CMs {
		if cm.T >= t0 && cm.T <= tReact && (math.IsNaN(react) || cm.T < react) {
			react, in.ReactionKind = cm.T, "countermeasures"
			break
		}
	}
	if !math.IsNaN(react) {
		in.ReactionS = of((react - t0) / 1000)
	}
	// seeker active / lost
	activeT, lostT := math.NaN(), math.NaN()
	for i := range m.T {
		if m.SeekerMode == nil || i >= len(m.SeekerMode) {
			break
		}
		if m.SeekerMode[i] == 2 && math.IsNaN(activeT) {
			activeT = m.T[i]
		}
		if !math.IsNaN(activeT) && m.SeekerMode[i] != 2 && math.IsNaN(lostT) && m.T[i] < m.TEnd-300 {
			lostT = m.T[i]
		}
	}
	if !math.IsNaN(activeT) {
		in.ActiveT = of(activeT)
	}
	if !math.IsNaN(lostT) {
		in.LostT = of(lostT)
	}
	// notch meter
	in.NotchApplies = isRadar(sh.Guidance)
	if in.NotchApplies {
		half, elev := notchHalfStrict, notchElevDefDeg
		if sh.Shooter >= 0 {
			half, elev = c.notchParams(sh.Shooter)
		}
		n, strict, loose := 0, 0, 0
		windowStart := t0
		if !math.IsNaN(activeT) {
			windowStart = math.Max(t0, activeT-8000)
		}
		for t := t0; t <= t1; t += 250 {
			if !victim.alive(t) {
				break
			}
			var threat vec3
			switch {
			case sh.Guidance == "ARH" && !math.IsNaN(activeT) && t >= activeT:
				threat = m.pos(t)
			case S != nil && S.alive(t):
				threat = S.pos(t)
			default:
				threat = m.pos(t)
			}
			tp := victim.pos(t)
			vr, down, beam := radial(threat, tp, victim.vel(t), elev)
			d := 0.0
			if down {
				d = 1
			}
			in.NotchSeries = append(in.NotchSeries, [4]float64{t, math.Round(vr), d, math.Round(beam)})
			if t >= windowStart {
				n++
				if down && math.Abs(vr) < half {
					strict++
				}
				if down && math.Abs(vr) < notchHalfLoose {
					loose++
				}
			}
			for _, cm := range in.CMs {
				if cm.Type == "chaff" && cm.T >= t && cm.T < t+250 && down && math.Abs(vr) < notchHalfLoose {
					in.ChaffInNotch++
				}
			}
		}
		if n > 0 {
			in.NotchShare = ofp(float64(strict) / float64(n))
			in.NotchShareLoose = ofp(float64(loose) / float64(n))
		}
	}
	in.KilledMe = sh.Outcome == "kill"
	// grade the defence; against long shots a later reaction is acceptable
	flight := (in.TEnd - in.T) / 1000
	late, slow := math.Max(8, 0.5*flight), math.Max(4, 0.25*flight)
	switch {
	case in.ReactionS == nil:
		in.Factors = append(in.Factors, factor{"reaction", "poor", "No defensive reaction found within 30 s (no turn, dive or countermeasures)"})
	case *in.ReactionS > late:
		in.Factors = append(in.Factors, factor{"reaction", "poor", fmt.Sprintf("Reacted after %.0f s (missile flew %.0f s)", *in.ReactionS, flight)})
	case *in.ReactionS > slow:
		in.Factors = append(in.Factors, factor{"reaction", "fair", fmt.Sprintf("Reacted after %.0f s", *in.ReactionS)})
	default:
		in.Factors = append(in.Factors, factor{"reaction", "good", fmt.Sprintf("Reacted after %.1f s (%s)", *in.ReactionS, in.ReactionKind)})
	}
	if in.NotchApplies && in.NotchShare != nil {
		sh := *in.NotchShare
		lo := 0.0
		if in.NotchShareLoose != nil {
			lo = *in.NotchShareLoose
		}
		switch {
		case sh >= 0.4:
			in.Factors = append(in.Factors, factor{"notch", "good", fmt.Sprintf("Held the notch %.0f%% of the critical time", sh*100)})
		case lo >= 0.4:
			in.Factors = append(in.Factors, factor{"notch", "fair", fmt.Sprintf("Near the beam but rarely inside the notch (%.0f%% strict, %.0f%% loose)", sh*100, lo*100)})
		default:
			in.Factors = append(in.Factors, factor{"notch", "poor", fmt.Sprintf("Not notching: inside the notch only %.0f%% of the critical time", sh*100)})
		}
	}
	if in.KilledMe {
		in.Factors = append(in.Factors, factor{"result", "poor", "This missile killed you"})
	} else if in.LostT != nil && !in.KilledMe {
		in.Factors = append(in.Factors, factor{"result", "good", "The missile's seeker lost you"})
	}
	in.Grade, _ = worst(in.Factors)
	return in
}

func (c *ctx) player(a *analysis, p wPlayer) playerA {
	s := c.s
	pa := playerA{Slot: p.Slot, Name: p.Name, Team: p.Team, Shots: []int{}, Incoming: []incomingA{}, Deaths: []deathA{}, Kills: []killA{},
		Engagements: []engagementA{}, Summary: map[string]float64{}, Mistakes: []mistakeA{}}
	mine := map[int]bool{}
	seenV := map[string]bool{}
	tFirst, tLast := math.Inf(1), math.Inf(-1)
	for _, id := range p.Units {
		if id < 0 || id >= len(s.Units) {
			continue
		}
		u := s.Units[id]
		mine[id] = true
		if !seenV[u.Name] {
			seenV[u.Name] = true
			pa.Vehicles = append(pa.Vehicles, u.Name)
		}
		if u.n() > 0 {
			tFirst = math.Min(tFirst, u.T[0])
			tLast = math.Max(tLast, u.T[u.n()-1])
		}
	}
	if math.IsInf(tFirst, 1) {
		return pa
	}
	enemy := func(u *wUnit) bool { return u.Kind == "aircraft" && u.Team != 0 && u.Team != p.Team }
	friend := func(u *wUnit) bool { return u.Kind == "aircraft" && u.Team == p.Team && !mine[u.ID] }

	nearestTeammate := func(t float64, me vec3) float64 {
		best := -1.0
		for _, u := range s.Units {
			if friend(u) && u.alive(t) {
				d := u.pos(t).sub(me).norm() / 1000
				if best < 0 || d < best {
					best = d
				}
			}
		}
		return best
	}

	// shots fired
	for i, sh := range a.Shots {
		if sh.ShooterPlayer == p.Slot || (sh.Shooter >= 0 && mine[sh.Shooter]) {
			pa.Shots = append(pa.Shots, i)
		}
	}
	// missiles at me
	for i, sh := range a.Shots {
		if sh.Target >= 0 && mine[sh.Target] {
			pa.Incoming = append(pa.Incoming, c.incoming(a, i, s.Units[sh.Target]))
		}
	}
	incByMissile := map[int]*incomingA{}
	for i := range pa.Incoming {
		incByMissile[pa.Incoming[i].Missile] = &pa.Incoming[i]
	}

	// threat timeline
	th := &pa.Threat
	aloneN, nAll, maskedN, threatN := 0, 0, 0, 0
	for t := tFirst; t <= tLast; t += threatStepMs {
		var me *wUnit
		for id := range mine {
			if s.Units[id].alive(t) {
				me = s.Units[id]
				break
			}
		}
		if me == nil {
			continue
		}
		mp := me.pos(t)
		near, losN, radars, missiles := 0, 0, 0, 0
		nearestE := -1.0
		for _, u := range s.Units {
			if !enemy(u) || !u.alive(t) {
				continue
			}
			up := u.pos(t)
			d := up.sub(mp).norm() / 1000
			if nearestE < 0 || d < nearestE {
				nearestE = d
			}
			if d <= nearKm {
				near++
			}
			if d <= losKm && (c.terr == nil || c.terr.lineOfSight(up, mp)) {
				losN++
			}
			if c.designates(u.ID, me.ID, t) {
				radars++
			}
		}
		for _, inc := range pa.Incoming {
			if t >= inc.T && t <= inc.TEnd {
				missiles++
			}
		}
		nt := nearestTeammate(t, mp)
		th.T = append(th.T, t)
		th.EnemiesNear = append(th.EnemiesNear, near)
		th.EnemiesLOS = append(th.EnemiesLOS, losN)
		th.RadarsOnMe = append(th.RadarsOnMe, radars)
		th.MissilesAtMe = append(th.MissilesAtMe, missiles)
		th.AltM = append(th.AltM, math.Round(mp[1]))
		th.SpeedMs = append(th.SpeedMs, math.Round(me.vel(t).norm()))
		th.NearestTeammateKm = append(th.NearestTeammateKm, math.Round(nt*10)/10)
		th.NearestEnemyKm = append(th.NearestEnemyKm, math.Round(nearestE*10)/10)
		nAll++
		if nt < 0 || nt > aloneKm {
			aloneN++
		}
		if near > 0 {
			threatN++
			if c.terr != nil && losN == 0 {
				maskedN++
			}
		}
	}
	if nAll > 0 {
		pa.AloneShare = ofp(float64(aloneN) / float64(nAll))
	}
	if threatN > 0 && c.terr != nil {
		pa.MaskedShare = ofp(float64(maskedN) / float64(threatN))
	}

	// altitude bands
	b := &pa.Bands
	b.EdgesM = []float64{0, 1000, 3000, 6000, 9000}
	b.TimeS, b.Shots, b.Kills, b.Deaths = make([]float64, 5), make([]int, 5), make([]int, 5), make([]int, 5)
	band := func(h float64) int {
		i := 0
		for i < 4 && h >= b.EdgesM[i+1] {
			i++
		}
		return i
	}
	for _, h := range th.AltM {
		b.TimeS[band(h)] += threatStepMs / 1000
	}
	for _, si := range pa.Shots {
		if a.Shots[si].ShooterAltM != nil {
			b.Shots[band(*a.Shots[si].ShooterAltM)]++
		}
	}

	// kills and deaths
	for _, e := range s.Events {
		if e.Type != "kill" {
			continue
		}
		var killerU, victimU *wUnit
		if e.Killer != nil && *e.Killer >= 0 && *e.Killer < len(s.Units) {
			killerU = s.Units[*e.Killer]
		}
		if e.Victim != nil && *e.Victim >= 0 && *e.Victim < len(s.Units) {
			victimU = s.Units[*e.Victim]
		}
		byMe := (e.KillerPlayer != nil && *e.KillerPlayer == p.Slot) || (killerU != nil && mine[killerU.ID])
		if byMe && victimU != nil && victimU.Kind == "aircraft" && !mine[victimU.ID] {
			k := killA{T: e.T, Victim: victimU.ID, VictimName: c.name(victimU), Weapon: e.Weapon, Missile: -1, TeamKill: e.TeamKill || victimU.Team == p.Team}
			if e.Missile != nil {
				k.Missile = *e.Missile
				k.Weapon = s.Units[*e.Missile].Name
			}
			if me := c.unitOf(p.Slot, e.T-100); me != nil {
				mp := me.pos(e.T - 100)
				k.AltM = ofi(mp[1])
				k.NearestTeammateKm = of(nearestTeammate(e.T, mp))
				if !k.TeamKill {
					b.Kills[band(mp[1])]++
				}
			}
			pa.Kills = append(pa.Kills, k)
		}
		if victimU != nil && mine[victimU.ID] {
			pa.Deaths = append(pa.Deaths, c.death(e, victimU, killerU, pa, incByMissile, nearestTeammate, enemy))
		}
	}
	// crashes without a kill event
	for id := range mine {
		u := s.Units[id]
		if !u.Destroyed || u.n() == 0 {
			continue
		}
		found := false
		for _, d := range pa.Deaths {
			if d.Unit == id {
				found = true
			}
		}
		if !found {
			e := wEvent{T: u.T[u.n()-1], Type: "kill"}
			pa.Deaths = append(pa.Deaths, c.death(e, u, nil, pa, incByMissile, nearestTeammate, enemy))
		}
	}
	sort.Slice(pa.Deaths, func(i, j int) bool { return pa.Deaths[i].T < pa.Deaths[j].T })
	for _, d := range pa.Deaths {
		if d.AltM != nil {
			b.Deaths[band(*d.AltM)]++
		}
	}

	pa.Engagements = c.engagements(a, p, pa, mine)
	c.summarise(a, &pa)
	return pa
}

func (c *ctx) death(e wEvent, victimU, killerU *wUnit, pa playerA, incByMissile map[int]*incomingA,
	nearestTeammate func(float64, vec3) float64, enemy func(*wUnit) bool) deathA {
	s := c.s
	t := e.T
	d := deathA{T: t, Unit: victimU.ID, Killer: -1, KillerPlayer: -1, Missile: -1, Weapon: e.Weapon, TeamKill: e.TeamKill, Tags: []string{}, LockedBy: []string{}}
	if killerU != nil {
		d.Killer, d.KillerName = killerU.ID, c.name(killerU)
		if killerU.Kind != "aircraft" && killerU.Parent != nil && *killerU.Parent >= 0 {
			d.Killer = *killerU.Parent
			d.KillerName = c.name(s.Units[*killerU.Parent])
		}
	}
	if e.KillerPlayer != nil {
		d.KillerPlayer = *e.KillerPlayer
		if p := s.bySlot[*e.KillerPlayer]; p != nil {
			d.KillerName = p.Name
		}
	}
	if e.Missile != nil {
		d.Missile = *e.Missile
		d.Weapon = s.Units[*e.Missile].Name
	}
	d.Crash = killerU == nil && e.KillerPlayer == nil
	tt := math.Min(t, victimU.T[victimU.n()-1]) - 50
	mp := victimU.pos(tt)
	v := victimU.vel(tt).norm()
	d.AltM, d.AglM, d.SpeedMs, d.Mach = ofi(mp[1]), ofi(c.agl(mp)), ofi(v), of(machAt(v, mp[1]))
	t30 := math.Max(victimU.T[0], tt-30000)
	p30 := victimU.pos(t30)
	d.AltLost30M = ofi(p30[1] - mp[1])
	d.SpeedLost30Ms = ofi(victimU.vel(t30).norm() - v)
	for x := t30; x <= tt; x += 1000 {
		pp := victimU.pos(x)
		d.Series = append(d.Series, [3]float64{x, math.Round(pp[1]), math.Round(victimU.vel(x).norm())})
	}
	seen := map[string]bool{}
	near20 := 0
	for _, u := range s.Units {
		if !enemy(u) || !u.alive(tt) {
			continue
		}
		if u.pos(tt).sub(mp).norm() <= 20000 {
			near20++
		}
		for x := tt - 30000; x <= tt; x += 1000 {
			if c.designates(u.ID, victimU.ID, x) && !seen[c.name(u)] {
				seen[c.name(u)] = true
				d.LockedBy = append(d.LockedBy, c.name(u))
				break
			}
		}
	}
	d.EnemiesWithin20 = near20
	for _, inc := range pa.Incoming {
		if inc.T >= tt-60000 && inc.T <= tt {
			d.MissilesAt60++
		}
	}
	d.NearestTeammateKm = of(nearestTeammate(tt, mp))
	if inc, ok := incByMissile[d.Missile]; ok {
		d.ReactionS, d.NotchShare = inc.ReactionS, inc.NotchShare
	}
	// target fixation: my radar was locked on someone else when the killing missile was fired
	refT := tt - 10000
	if inc, ok := incByMissile[d.Missile]; ok {
		refT = inc.T
	}
	if r := c.radarAt(victimU.ID, refT); r != nil && len(r.targets) > 0 {
		tg := r.targets[0]
		if tg >= 0 && tg < len(s.Units) && tg != d.Killer {
			d.FixatedOn = c.name(s.Units[tg])
		}
	}
	// tags
	switch {
	case d.Crash:
		d.Tags = append(d.Tags, "Crashed or no recorded killer")
	case d.TeamKill:
		d.Tags = append(d.Tags, "Killed by a teammate")
	}
	if d.Missile >= 0 {
		if d.ReactionS == nil {
			d.Tags = append(d.Tags, "No reaction to the missile")
		} else if *d.ReactionS > 6 {
			d.Tags = append(d.Tags, fmt.Sprintf("Late reaction (%.0f s)", *d.ReactionS))
		}
		if inc, ok := incByMissile[d.Missile]; ok && inc.NotchApplies && inc.NotchShare != nil && *inc.NotchShare < 0.3 {
			d.Tags = append(d.Tags, "Not notching")
		}
	}
	if d.FixatedOn != "" {
		d.Tags = append(d.Tags, "Radar locked on "+d.FixatedOn+" (target fixation)")
	}
	if d.NearestTeammateKm == nil || *d.NearestTeammateKm < 0 || *d.NearestTeammateKm > 15 {
		d.Tags = append(d.Tags, "Alone (no teammate within 15 km)")
	}
	if near20 >= 3 {
		d.Tags = append(d.Tags, fmt.Sprintf("Outnumbered (%d enemies within 20 km)", near20))
	}
	if d.Mach != nil && *d.Mach < 0.7 {
		d.Tags = append(d.Tags, fmt.Sprintf("Slow (Mach %.2f)", *d.Mach))
	}
	if d.SpeedLost30Ms != nil && *d.SpeedLost30Ms > 120 {
		d.Tags = append(d.Tags, fmt.Sprintf("Lost %.0f km/h in the last 30 s", *d.SpeedLost30Ms*3.6))
	}
	if d.MissilesAt60 >= 2 {
		d.Tags = append(d.Tags, fmt.Sprintf("%d missiles fired at you in the last minute", d.MissilesAt60))
	}
	return d
}

func specificEnergy(u *wUnit, t float64) float64 {
	p := u.pos(t)
	v := u.vel(t).norm()
	return p[1] + v*v/(2*9.81)
}

// engagements: one per enemy and stretch of time. Shots, kills and deaths
// between the player and one enemy, with a gap of more than 60 s (radar locks
// keep it going) starting a new one. Fights with several enemies at once show
// as overlapping engagements.
func (c *ctx) engagements(a *analysis, p wPlayer, pa playerA, mine map[int]bool) []engagementA {
	s := c.s
	type ev struct {
		t    float64
		kind string
		shot int
	}
	oppKey := func(u *wUnit) int {
		if u.Owner >= 0 {
			return u.Owner
		}
		return -1000 - u.ID
	}
	isEnemy := func(u *wUnit) bool { return u.Kind == "aircraft" && u.Team != 0 && u.Team != p.Team }
	byOpp := map[int][]ev{}
	for _, si := range pa.Shots {
		sh := a.Shots[si]
		if sh.Target >= 0 && isEnemy(s.Units[sh.Target]) {
			k := oppKey(s.Units[sh.Target])
			byOpp[k] = append(byOpp[k], ev{sh.T, "myShot", si})
		}
	}
	for _, in := range pa.Incoming {
		if in.Shooter >= 0 && isEnemy(s.Units[in.Shooter]) {
			k := oppKey(s.Units[in.Shooter])
			byOpp[k] = append(byOpp[k], ev{in.T, "theirShot", c.shotByM[in.Missile]})
		}
	}
	for _, k := range pa.Kills {
		if !k.TeamKill {
			key := oppKey(s.Units[k.Victim])
			byOpp[key] = append(byOpp[key], ev{k.T, "kill", -1})
		}
	}
	for _, d := range pa.Deaths {
		if d.Killer >= 0 && isEnemy(s.Units[d.Killer]) {
			key := oppKey(s.Units[d.Killer])
			byOpp[key] = append(byOpp[key], ev{d.T, "death", -1})
		}
	}
	for key := range byOpp {
		// radar locks either way extend an engagement that has a shot
		for id := range mine {
			for _, r := range c.radar[id] {
				for _, tg := range r.targets {
					if tg >= 0 && tg < len(s.Units) && isEnemy(s.Units[tg]) && oppKey(s.Units[tg]) == key {
						byOpp[key] = append(byOpp[key], ev{r.t, "lock", -1})
					}
				}
			}
		}
		for _, u := range s.Units {
			if isEnemy(u) && oppKey(u) == key {
				for _, r := range c.radar[u.ID] {
					for _, tg := range r.targets {
						if mine[tg] {
							byOpp[key] = append(byOpp[key], ev{r.t, "lock", -1})
						}
					}
				}
			}
		}
	}
	out := []engagementA{}
	for key, evs := range byOpp {
		sort.Slice(evs, func(i, j int) bool { return evs[i].t < evs[j].t })
		var cur *engagementA
		flush := func() {
			if cur != nil && len(cur.MyShots)+len(cur.TheirShots)+cur.Kills+cur.Deaths > 0 {
				cur.Opponents = []int{key}
				if key >= 0 {
					if pp := s.bySlot[key]; pp != nil {
						cur.OpponentNames = []string{pp.Name}
					}
				} else {
					cur.OpponentNames = []string{c.name(s.Units[-1000-key])}
				}
				switch {
				case cur.Deaths > 0 && cur.Kills > 0:
					cur.Result = "traded"
				case cur.Deaths > 0:
					cur.Result = "lost"
				case cur.Kills > 0:
					cur.Result = "won"
				default:
					cur.Result = "no result"
				}
				out = append(out, *cur)
			}
			cur = nil
		}
		for _, e := range evs {
			if cur != nil && e.t-cur.End > 60000 {
				flush()
			}
			if cur == nil {
				cur = &engagementA{Start: e.t, End: e.t, FirstShotMissile: -1, MyShots: []int{}, TheirShots: []int{}}
			}
			cur.End = math.Max(cur.End, e.t)
			switch e.kind {
			case "myShot", "theirShot":
				sh := a.Shots[e.shot]
				if e.kind == "myShot" {
					cur.MyShots = append(cur.MyShots, sh.Missile)
				} else {
					cur.TheirShots = append(cur.TheirShots, sh.Missile)
				}
				if cur.FirstShotT == nil {
					cur.FirstShotT, cur.FirstShotByMe, cur.FirstShotRangeM, cur.FirstShotMissile = of(sh.T), e.kind == "myShot", sh.RangeM, sh.Missile
					if sh.Shooter >= 0 && sh.Target >= 0 {
						me, them := s.Units[sh.Shooter], s.Units[sh.Target]
						if e.kind == "theirShot" {
							me, them = them, me
						}
						cur.MyEnergyM, cur.TheirEnergyM = ofi(specificEnergy(me, sh.T)), ofi(specificEnergy(them, sh.T))
						cur.AltDiffM = ofi(me.pos(sh.T)[1] - them.pos(sh.T)[1])
						cur.SpeedDiffMs = ofi(me.vel(sh.T).norm() - them.vel(sh.T).norm())
					}
				}
			case "kill":
				cur.Kills++
			case "death":
				cur.Deaths++
			}
		}
		flush()
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Start < out[j].Start })
	return out
}

func (c *ctx) summarise(a *analysis, pa *playerA) {
	s := c.s
	sm := pa.Summary
	tk := 0.0
	for _, k := range pa.Kills {
		if k.TeamKill {
			tk++
		}
	}
	sm["kills"], sm["teamKills"] = float64(len(pa.Kills))-tk, tk
	sm["deaths"] = float64(len(pa.Deaths))
	sm["shots"] = float64(len(pa.Shots))
	sm["missilesAtMe"] = float64(len(pa.Incoming))
	var good, fair, poor, missileKills, rangeRatioSum, rrN, rangeSum float64
	for _, si := range pa.Shots {
		sh := a.Shots[si]
		switch sh.Grade {
		case "good":
			good++
		case "fair":
			fair++
		case "poor":
			poor++
		}
		if sh.Outcome == "kill" && (sh.Target < 0 || s.Units[sh.Target].Team != pa.Team) {
			missileKills++
		}
		if sh.RangeRatio != nil {
			rangeRatioSum += math.Min(2, *sh.RangeRatio)
			rrN++
		}
		if sh.RangeM != nil {
			rangeSum += *sh.RangeM
		}
	}
	sm["shotsGood"], sm["shotsFair"], sm["shotsPoor"], sm["missileKills"] = good, fair, poor, missileKills
	if rrN > 0 {
		sm["avgRangeRatio"] = math.Round(rangeRatioSum/rrN*100) / 100
	}
	if len(pa.Shots) > 0 {
		sm["avgShotRangeM"] = math.Round(rangeSum / float64(len(pa.Shots)))
	}
	var notchSum, notchN, survived float64
	reacts := []float64{}
	for _, in := range pa.Incoming {
		if in.ReactionS != nil {
			reacts = append(reacts, *in.ReactionS)
		}
		if in.NotchApplies && in.NotchShare != nil {
			notchSum += *in.NotchShare
			notchN++
		}
		if !in.KilledMe {
			survived++
		}
	}
	if len(reacts) > 0 {
		// median: one odd case should not dominate
		sort.Float64s(reacts)
		sm["avgReactionS"] = math.Round(reacts[len(reacts)/2]*10) / 10
	}
	sm["noReaction"] = float64(len(pa.Incoming) - len(reacts))
	if notchN > 0 {
		sm["avgNotchShare"] = math.Round(notchSum/notchN*100) / 100
	}
	if len(pa.Incoming) > 0 {
		sm["missilesSurvivedShare"] = math.Round(survived/float64(len(pa.Incoming))*100) / 100
	}
	if pa.AloneShare != nil {
		sm["aloneShare"] = *pa.AloneShare
	}
	if pa.MaskedShare != nil {
		sm["maskedShare"] = *pa.MaskedShare
	}
	var alt, n float64
	for _, h := range pa.Threat.AltM {
		alt += h
		n++
	}
	if n > 0 {
		sm["meanAltM"] = math.Round(alt / n)
		sm["flightTimeS"] = n * threatStepMs / 1000
	}
	won, lost, firstShots := 0.0, 0.0, 0.0
	for _, e := range pa.Engagements {
		if e.Result == "won" {
			won++
		}
		if e.Result == "lost" || e.Result == "traded" {
			lost++
		}
		if e.FirstShotT != nil && e.FirstShotByMe {
			firstShots++
		}
	}
	sm["engagements"], sm["engagementsWon"], sm["engagementsLost"], sm["firstShotShare"] = float64(len(pa.Engagements)), won, lost, 0
	if len(pa.Engagements) > 0 {
		sm["firstShotShare"] = math.Round(firstShots/float64(len(pa.Engagements))*100) / 100
	}

	// mistakes
	add := func(t float64, sev int, kind, text string, sel int) {
		pa.Mistakes = append(pa.Mistakes, mistakeA{t, sev, kind, text, sel})
	}
	for _, si := range pa.Shots {
		sh := a.Shots[si]
		if sh.Grade != "poor" {
			continue
		}
		parts := []string{}
		for _, f := range sh.Factors {
			if f.Grade == "poor" {
				parts = append(parts, f.Text)
			}
		}
		tgt := "?"
		if sh.Target >= 0 {
			tgt = c.name(s.Units[sh.Target])
		}
		sev := 2
		if sh.MultipathLaunch >= 0.5 || (sh.RangeRatio != nil && *sh.RangeRatio > 1) {
			sev = 3
		}
		if sh.Outcome == "kill" {
			sev = 1
		}
		add(sh.T, sev, "shot", fmt.Sprintf("Low-chance shot: %s at %s — %s", sh.Model, tgt, strings.Join(parts, "; ")), sh.Missile)
		if sh.Reason == "target_down" {
			add(sh.T, 1, "wasted", fmt.Sprintf("%s fired at %s, who was destroyed before it arrived", sh.Model, tgt), sh.Missile)
		}
	}
	for _, k := range pa.Kills {
		if k.TeamKill {
			sel := k.Victim
			if k.Missile >= 0 {
				sel = k.Missile
			}
			add(k.T, 3, "teamkill", fmt.Sprintf("Team kill: %s hit %s", k.Weapon, k.VictimName), sel)
		}
	}
	for _, d := range pa.Deaths {
		txt := "Died"
		if d.KillerName != "" {
			txt += " to " + d.KillerName
		}
		if d.Weapon != "" {
			txt += " (" + d.Weapon + ")"
		}
		if len(d.Tags) > 0 {
			txt += ": " + strings.Join(d.Tags, "; ")
		}
		sel := d.Unit
		if d.Missile >= 0 {
			sel = d.Missile
		}
		add(d.T, 4, "death", txt, sel)
	}
	for _, in := range pa.Incoming {
		if in.KilledMe || in.Grade != "poor" {
			continue
		}
		parts := []string{}
		for _, f := range in.Factors {
			if f.Grade == "poor" {
				parts = append(parts, f.Text)
			}
		}
		shooter := "?"
		if in.Shooter >= 0 {
			shooter = c.name(s.Units[in.Shooter])
		}
		add(in.T, 2, "defence", fmt.Sprintf("Weak defence against %s from %s — %s", in.Model, shooter, strings.Join(parts, "; ")), in.Missile)
	}
	if pa.AloneShare != nil && *pa.AloneShare > 0.5 {
		add(pa.Threat.T[0], 1, "alone", fmt.Sprintf("Flew without a teammate within %.0f km for %.0f%% of the match", aloneKm, *pa.AloneShare*100), -1)
	}
	sort.SliceStable(pa.Mistakes, func(i, j int) bool {
		if pa.Mistakes[i].Severity != pa.Mistakes[j].Severity {
			return pa.Mistakes[i].Severity > pa.Mistakes[j].Severity
		}
		return pa.Mistakes[i].T < pa.Mistakes[j].T
	})
}

// inferTarget guesses the target of a missile whose target the replay does not
// name (v0.9.0). A guided missile flies toward the point where it will meet
// its target (proportional navigation settles on that collision course). For
// each enemy aircraft alive at launch within 80 km, the horizontal angle between
// the missile's heading and the collision course to that aircraft (constant
// velocities) is averaged from 2 s after launch to 1 s before the missile's end
// (at most 20 s; ignoring height keeps lofting missiles readable). Accepted when
// the best average is under maxDeg and the next candidate is at least marginDeg
// worse. Checked on launches whose target is known (TestInferTarget).
func inferTarget(s *wSession, missile, shooter int, t0 float64) (int, float64) {
	maxDeg, marginDeg := inferMaxDeg, inferMarginDeg
	m := s.Units[missile]
	if m.n() < 12 || shooter < 0 {
		return -1, 0
	}
	S := s.Units[shooter]
	tEnd := math.Min(m.TEnd-1000, t0+20000)
	best, bestA, second := -1, math.Inf(1), math.Inf(1)
	for _, u := range s.Units {
		if u.Kind != "aircraft" || u.ID == shooter || u.Team == S.Team || !u.alive(t0) {
			continue
		}
		if u.pos(t0).sub(S.pos(t0)).norm() > 80000 {
			continue
		}
		sum, n := 0.0, 0
		for t := t0 + 2000; t <= tEnd && u.alive(t); t += 500 {
			vm, pm := m.vel(t), m.pos(t)
			sp := math.Hypot(vm[0], vm[2])
			if sp < 100 {
				continue
			}
			pt, vt := u.pos(t), u.vel(t)
			rx, rz := pt[0]-pm[0], pt[2]-pm[2]
			// time to collision: |r + vt·τ| = sp·τ
			a := vt[0]*vt[0] + vt[2]*vt[2] - sp*sp
			b := 2 * (rx*vt[0] + rz*vt[2])
			c := rx*rx + rz*rz
			tau := -1.0
			if math.Abs(a) < 1e-6 {
				if b < 0 {
					tau = -c / b
				}
			} else if d := b*b - 4*a*c; d >= 0 {
				for _, x := range []float64{(-b - math.Sqrt(d)) / (2 * a), (-b + math.Sqrt(d)) / (2 * a)} {
					if x > 0 && (tau < 0 || x < tau) {
						tau = x
					}
				}
			}
			if tau < 0 {
				continue // cannot catch it: this pair says nothing
			}
			cx, cz := rx+vt[0]*tau, rz+vt[2]*tau
			ang := math.Abs(math.Mod(math.Atan2(cx, cz)-math.Atan2(vm[0], vm[2])+3*math.Pi, 2*math.Pi)-math.Pi) * 180 / math.Pi
			sum += ang
			n++
		}
		if n < 4 {
			continue
		}
		a := sum / float64(n)
		if a < bestA {
			best, bestA, second = u.ID, a, bestA
		} else if a < second {
			second = a
		}
	}
	if best < 0 || bestA > maxDeg || second-bestA < marginDeg {
		return -1, bestA
	}
	return best, bestA
}

// Thresholds from TestInferTarget on the reference matches: right 90% of the time
// on launches whose target is known (v0.9.0).
var inferMaxDeg, inferMarginDeg = 12.0, 6.0
