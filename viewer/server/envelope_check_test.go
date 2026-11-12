package main

// Checks the fly-out model against real matches. Runs only when
// WTRV_SESSIONS names a folder of converted matches (.wtr), e.g.
//
//	WTRV_SESSIONS=../../sessions go test -run Check -v .
//
// 1. Distance flown 10/20/30/40 s after launch, model vs recording (radar
//    missiles), separately for one- and two-stage motors: median ratio must
//    be within 5 % of 1.
// 2. Outcomes by zone: share of kills inside the estimated max range, kill
//    rate inside no-escape range, between it and 85 % of max, and beyond.

import (
	"math"
	"os"
	"path/filepath"
	"sort"
	"testing"
)

func checkSessions(t *testing.T) ([]*wSession, *wCatalog) {
	dir := os.Getenv("WTRV_SESSIONS")
	if dir == "" {
		t.Skip("set WTRV_SESSIONS to a folder of .wtr files")
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*.wtr"))
	if len(files) == 0 {
		t.Skip("no .wtr files in " + dir)
	}
	var out []*wSession
	for _, f := range files {
		s, err := loadWTR(f)
		if err != nil {
			t.Fatal(err)
		}
		out = append(out, s)
	}
	return out, loadCatalog("../../assets/catalog")
}

// distance along the path after each time in upTo, flying the recorded climb profile
func flyDistance(m *missilePhys, u *wUnit, upTo []float64) []float64 {
	t0 := u.T[0]
	v := math.Max(u.vel(t0).norm(), 50)
	A := math.Pi * m.Caliber * m.Caliber / 4
	s, t, k := 0.0, 0.0, 0
	var out []float64
	for k < len(upTo) {
		F, mass := m.motor(t)
		rho, snd := atmosphere(u.pos(t0 + t*1000)[1])
		sinG := math.Max(-1, math.Min(1, u.vel(t0 + t*1000)[1]/math.Max(v, 1)))
		D := dragFit * 0.5 * rho * v * v * A * m.CxK * dragRatio(v/snd)
		v += ((F-D)/mass - 9.81*sinG) * 0.1
		if m.MachMax > 0 {
			v = math.Min(v, m.MachMax*snd)
		}
		v = math.Max(v, 1)
		s += v * 0.1
		t += 0.1
		if t >= upTo[k]-1e-9 {
			out = append(out, s)
			k++
		}
	}
	return out
}

func median(x []float64) float64 {
	if len(x) == 0 {
		return math.NaN()
	}
	y := append([]float64{}, x...)
	sort.Float64s(y)
	return y[len(y)/2]
}

func TestCheckFlyoutVsRecording(t *testing.T) {
	ss, cat := checkSessions(t)
	ratios := map[bool][]float64{}
	for _, s := range ss {
		for _, u := range s.Units {
			if u.Missile == nil || u.n() < 8 {
				continue
			}
			m := cat.physics(u)
			if !m.Known || (m.Guidance != "SARH" && m.Guidance != "ARH" && m.Guidance != "radar") {
				continue
			}
			t0 := u.T[0]
			var want []float64
			for _, tt := range []float64{10, 20, 30, 40} {
				if u.T[u.n()-1] >= t0+tt*1000 {
					want = append(want, tt)
				}
			}
			if len(want) == 0 {
				continue
			}
			rec := make([]float64, len(want))
			d, k := 0.0, 0
			for j := 1; j < u.n() && k < len(want); j++ {
				d += vec3{u.X[j] - u.X[j-1], u.Y[j] - u.Y[j-1], u.Z[j] - u.Z[j-1]}.norm()
				if u.T[j]-t0 >= want[k]*1000 {
					rec[k] = d
					k++
				}
			}
			model := flyDistance(m, u, want)
			for k := range want {
				if rec[k] > 0 {
					ratios[m.Burn1 > 0] = append(ratios[m.Burn1 > 0], model[k]/rec[k])
				}
			}
		}
	}
	for _, two := range []bool{false, true} {
		med := median(ratios[two])
		t.Logf("two-stage=%v samples=%d median model/recorded %.3f", two, len(ratios[two]), med)
		if len(ratios[two]) >= 50 && math.Abs(med-1) > 0.05 {
			t.Errorf("two-stage=%v: model is off by %.0f%%", two, (med-1)*100)
		}
	}
}

func TestCheckOutcomeZones(t *testing.T) {
	ss, cat := checkSessions(t)
	var kills, killsIn int
	zone := map[string][2]int{}
	for _, s := range ss {
		for _, sh := range analyse(s, nil, cat).Shots {
			if sh.RmaxM == nil || sh.RneM == nil || sh.RangeM == nil || sh.Reason == "target_down" ||
				(sh.Outcome != "kill" && sh.Outcome != "miss" && sh.Outcome != "close") {
				continue
			}
			R, rmax, rne := *sh.RangeM, *sh.RmaxM, *sh.RneM
			z := "beyond"
			if R <= rne {
				z = "inside NEZ"
			} else if R <= 0.85*rmax {
				z = "NEZ-85% max"
			}
			c := zone[z]
			c[0]++
			if sh.Outcome == "kill" {
				c[1]++
				kills++
				if R <= rmax {
					killsIn++
				}
			}
			zone[z] = c
		}
	}
	if kills == 0 {
		t.Skip("no kills")
	}
	t.Logf("kills inside estimated max range: %.0f%% of %d", 100*float64(killsIn)/float64(kills), kills)
	for _, z := range []string{"inside NEZ", "NEZ-85% max", "beyond"} {
		c := zone[z]
		if c[0] > 0 {
			t.Logf("  %-12s %4d shots, kill rate %.0f%%", z, c[0], 100*float64(c[1])/float64(c[0]))
		}
	}
}
