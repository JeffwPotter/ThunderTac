package main

import (
	"math"
	"testing"
)

// A 120 mm dart (M829A3 figures) fired level drops about 1.5–2 m over 1 km;
// a slow HE round drops far more. Checks gravity and drag act as expected.
func TestShellArcDrop(t *testing.T) {
	dart := &groundCatShell{Name: "120mm_m829a3", Speed: 1555, MassKg: 6.5, Cx: 0.75, CaliberM: 0.12, DragCalM: 0.025, MaxDistM: 10000}
	he := &groundCatShell{Name: "120mm_m908", Speed: 1410, MassKg: 11.4, Cx: 0.634, CaliberM: 0.12, MaxDistM: 8500}
	slow := &groundCatShell{Name: "75mm", Speed: 600, MassKg: 6, Cx: 0.3, CaliberM: 0.075, MaxDistM: 8000}
	c := shotCtx{}
	drop := func(sh *groundCatShell) float64 {
		pts, _, _, _, _ := c.fly(-1, 0, [3]float64{0, 0, 0}, 0, 0, sh, "cannon", -1)
		for i := 1; i < len(pts); i++ {
			if pts[i][2] >= 1000 {
				a, b := pts[i-1], pts[i]
				f := (1000 - a[2]) / (b[2] - a[2])
				return shotGunHeightM - (a[1] + (b[1]-a[1])*f)
			}
		}
		t.Fatalf("%s did not reach 1 km", sh.Name)
		return 0
	}
	d1, d2, d3 := drop(dart), drop(he), drop(slow)
	if d1 < 1.5 || d1 > 2.5 {
		t.Errorf("dart drop at 1 km = %.2f m, want 1.5-2.5", d1)
	}
	if !(d2 > d1 && d3 > 10) {
		t.Errorf("drops dart %.2f, HE %.2f, slow %.2f: slower rounds must drop more", d1, d2, d3)
	}
}

// solveElevation must put the arc through the target centre.
func TestSolveElevation(t *testing.T) {
	sh := &groundCatShell{Speed: 1650, MassKg: 4.3, Cx: 0.46, CaliberM: 0.12, MaxDistM: 10000}
	from, to := [3]float64{0, 100, 0}, [3]float64{0, 103, 1500}
	adj, ok := solveElevation(from, to, 0, sh)
	if !ok {
		t.Fatal("no solution")
	}
	pts, _, _, _, _ := shotCtx{}.fly(-1, 0, from, 0, adj, sh, "cannon", -1)
	for i := 1; i < len(pts); i++ {
		if pts[i][2] >= 1500 {
			a, b := pts[i-1], pts[i]
			y := a[1] + (b[1]-a[1])*(1500-a[2])/(b[2]-a[2])
			if math.Abs(y-(to[1]+1.2)) > 0.3 {
				t.Errorf("arc at target %.2f m, want %.2f", y, to[1]+1.2)
			}
			return
		}
	}
	t.Fatal("arc did not reach the target")
}

func TestGroundClassKey(t *testing.T) {
	for in, want := range map[string]string{"tankModels/us_m1a2_sep3_abrams": "us_m1a2_sep3_abrams", "US_M1A1_HC_ABRAMS": "us_m1a1_hc_abrams", `tankmodels\x.blk`: "x"} {
		if got := groundClassKey(in); got != want {
			t.Errorf("groundClassKey(%q) = %q, want %q", in, got, want)
		}
	}
}
