// Missile fly-out estimate ("launch envelope").
//
// A point-mass model: thrust for the burn time, mass falling linearly to the
// burnt-out mass (then a second, sustainer stage with its own thrust, burn time
// and burnt-out mass, when the game file has one), drag = k·½ρv²·A·CxK·r(M).
// r(M) is one Mach-dependent shape and k = dragFit a single scale, fitted to
// missile flights recorded in the reference replays: distance flown after
// 10–40 s, median model/recorded 1.00 for both one- and two-stage radar
// missiles (1,417 samples, 438 missiles, v0.8.2). k absorbs the drag of
// manoeuvring, which the model does not simulate.
// The same model is in viewer/web/src/envelope.ts; keep the two identical.
package main

import "math"

type missilePhys struct {
	Name                       string
	Caliber, CxK, Thrust, Burn float64
	Thrust1, Burn1, MassEnd1   float64 // second (sustainer) stage; Burn1 = 0 for one-stage motors
	Mass, MassEnd, MachMax     float64
	Life, GuidanceTime         float64
	Loft                       bool
	Multipath                  []float64 // [h0, effect0, h1, effect1]
	SeekerRange                float64
	MaxG                       float64
	Guidance                   string
	Known                      bool // true when found in the catalogue
}

// drag shape r(M) = Cd / CxK
var dragShape = [][2]float64{{0, 0.30}, {0.8, 0.32}, {1.0, 0.55}, {1.2, 0.62}, {1.4, 0.58}, {1.8, 0.48}, {2.2, 0.43}, {2.7, 0.37}, {3.2, 0.34}, {3.7, 0.32}, {5, 0.29}}

// dragFit scales the drag shape (see the comment at the top).
const dragFit = 1.4

func dragRatio(m float64) float64 {
	for i := 0; i < len(dragShape)-1; i++ {
		if m <= dragShape[i+1][0] {
			a, b := dragShape[i], dragShape[i+1]
			return a[1] + (b[1]-a[1])*(m-a[0])/(b[0]-a[0])
		}
	}
	return dragShape[len(dragShape)-1][1]
}

// standard atmosphere: density kg/m³ and speed of sound m/s
func atmosphere(h float64) (float64, float64) {
	h = math.Max(0, h)
	var T, p float64
	if h <= 11000 {
		T = 288.15 - 0.0065*h
		p = 101325 * math.Pow(T/288.15, 5.2559)
	} else {
		T = 216.65
		p = 22632 * math.Exp(-(h-11000)/6341.6)
	}
	return p / (287.05 * T), math.Sqrt(1.4 * 287.05 * T)
}

func (m *missilePhys) multipathAt(agl float64) float64 {
	if len(m.Multipath) != 4 {
		return 0
	}
	x0, e0, x1, e1 := m.Multipath[0], m.Multipath[1], m.Multipath[2], m.Multipath[3]
	if x1 <= x0 {
		return 0
	}
	if agl <= x0 {
		return e0
	}
	if agl >= x1 {
		return e1
	}
	return e0 + (e1-e0)*(agl-x0)/(x1-x0)
}

// motor returns thrust (N) and mass (kg) at time t after launch.
func (m *missilePhys) motor(t float64) (float64, float64) {
	if m.Burn <= 0 && m.Burn1 <= 0 {
		return 0, m.Mass
	}
	if t < m.Burn {
		return m.Thrust, m.Mass - (m.Mass-m.MassEnd)*t/m.Burn
	}
	if m.Burn1 > 0 && t < m.Burn+m.Burn1 {
		return m.Thrust1, m.MassEnd - (m.MassEnd-m.MassEnd1)*(t-m.Burn)/m.Burn1
	}
	if m.Burn1 > 0 {
		return 0, m.MassEnd1
	}
	return 0, m.MassEnd
}

// burnTotal is the time until the motor (both stages) has burnt out.
func (m *missilePhys) burnTotal() float64 { return m.Burn + m.Burn1 }

// reaches: can the missile reach a target that starts at horizontal range r,
// with velocity (vx toward the shooter is negative x), before it is too slow
// or out of time?
func (m *missilePhys) reaches(r, h0, h1, v0, tvx, tvz, tSpeed float64) bool {
	A := math.Pi * m.Caliber * m.Caliber / 4
	hEff := (h0 + h1) / 2
	if m.Loft {
		hEff += math.Min(5000, 0.08*r)
	}
	rho, snd := atmosphere(hEff)
	dh := h1 - h0
	sinG := 0.0
	if d := math.Hypot(r, dh); d > 0 {
		sinG = dh / d
	}
	vMin := math.Max(280, 1.1*tSpeed)
	tMax := math.Min(m.Life, m.GuidanceTime)
	if tMax <= 0 {
		tMax = 60
	}
	v, s, t := math.Max(v0, 50), 0.0, 0.0
	const dt = 0.1
	for t < tMax {
		F, mass := m.motor(t)
		D := dragFit * 0.5 * rho * v * v * A * m.CxK * dragRatio(v/snd)
		v += ((F-D)/mass - 9.81*sinG) * dt
		if m.MachMax > 0 {
			v = math.Min(v, m.MachMax*snd)
		}
		s += v * dt
		t += dt
		px, pz := r+tvx*t, tvz*t
		need := math.Sqrt(px*px + pz*pz + dh*dh)
		if s >= need {
			return v >= vMin || t < m.burnTotal()
		}
		if v < vMin && t > m.burnTotal() {
			return false
		}
	}
	return false
}

// envelope returns the estimated maximum launch range (target keeps flying as it is)
// and no-escape range (target turns away at launch and runs at its speed), metres.
// aspect: 0 = target flying straight at the shooter, 180 = flying away.
func (m *missilePhys) envelope(shooterAlt, shooterSpeed, targetAlt, targetSpeed, aspectDeg float64) (float64, float64) {
	if !m.Known || m.Thrust <= 0 || m.Caliber <= 0 || m.Mass <= 0 {
		return 0, 0
	}
	a := aspectDeg * math.Pi / 180
	search := func(tvx, tvz float64) float64 {
		lo, hi := 1000.0, 250000.0
		if !m.reaches(lo, shooterAlt, targetAlt, shooterSpeed, tvx, tvz, targetSpeed) {
			return 0
		}
		for i := 0; i < 22 && hi-lo > 100; i++ {
			mid := (lo + hi) / 2
			if m.reaches(mid, shooterAlt, targetAlt, shooterSpeed, tvx, tvz, targetSpeed) {
				lo = mid
			} else {
				hi = mid
			}
		}
		return lo
	}
	rmax := search(-targetSpeed*math.Cos(a), targetSpeed*math.Sin(a))
	rne := search(targetSpeed, 0)
	return math.Round(rmax), math.Round(rne)
}

func (c *wCatalog) physics(u *wUnit) *missilePhys {
	m := &missilePhys{}
	if u == nil || u.Missile == nil {
		return m
	}
	m.Name, m.Guidance = u.Name, u.Missile.Guidance
	if c == nil {
		return m
	}
	key := ""
	if u.Missile.InternalName != "" {
		if _, ok := c.Missiles[u.Missile.InternalName]; ok {
			key = u.Missile.InternalName
		}
	}
	if key == "" {
		key = c.byName[lowerTrim(u.Name)]
	}
	if key == "" {
		// family name only (e.g. "AIM-120"): take the first catalogue entry of that family
		fam := lowerTrim(u.Name)
		best := ""
		for n, k := range c.byName {
			if len(n) > len(fam) && n[:len(fam)] == fam && (best == "" || n < best) {
				best, key = n, k
			}
		}
	}
	e, ok := c.Missiles[key]
	if !ok || e.Physics == nil {
		return m
	}
	p := e.Physics
	m.Known = true
	m.Caliber, m.CxK, m.Thrust, m.Burn = numOf(p, "caliberM", 0), numOf(p, "cxK", 1), numOf(p, "thrustN", 0), numOf(p, "burnS", 0)
	m.Mass, m.MassEnd, m.MachMax = numOf(p, "massKg", 0), numOf(p, "massEndKg", 0), numOf(p, "machMax", 0)
	m.Thrust1, m.Burn1, m.MassEnd1 = numOf(p, "thrust1N", 0), numOf(p, "burn1S", 0), numOf(p, "massEnd1Kg", 0)
	m.Life, m.GuidanceTime, m.SeekerRange, m.MaxG = numOf(p, "lifeS", 60), numOf(p, "guidanceTimeS", 60), numOf(p, "seekerRangeM", 0), numOf(p, "maxG", 0)
	m.Loft, _ = p["loft"].(bool)
	if mp, ok := p["multipath"].([]any); ok && len(mp) == 4 {
		for _, v := range mp {
			f, _ := v.(float64)
			m.Multipath = append(m.Multipath, f)
		}
	}
	if m.Guidance == "" {
		m.Guidance = e.Guidance
	}
	if m.MassEnd <= 0 {
		m.MassEnd = m.Mass
	}
	if m.MassEnd1 <= 0 {
		m.MassEnd1 = m.MassEnd
	}
	return m
}

func lowerTrim(s string) string {
	b := []rune{}
	for _, r := range s {
		if r >= 'A' && r <= 'Z' {
			r += 'a' - 'A'
		}
		b = append(b, r)
	}
	out := string(b)
	for len(out) > 0 && out[len(out)-1] == ' ' {
		out = out[:len(out)-1]
	}
	return out
}
