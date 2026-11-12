package main

// Checks that the fly-out model in envelope.go and viewer/web/src/envelope.ts
// give the same launch envelopes. Needs Node.js 22.18+ (runs the .ts file
// directly); skipped when node is not installed.

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

type parityCase struct {
	P                                  map[string]any `json:"p"`
	SAlt, SSpd, TAlt, TSpd, Aspect     float64
	Rmax, Rne                          float64
}

func parityPhys() []*missilePhys {
	one := &missilePhys{Name: "one-stage", Known: true, Caliber: 0.203, CxK: 1.413, Thrust: 21480, Burn: 4.5, Mass: 231.3, MassEnd: 188.5, MachMax: 4, Life: 75, GuidanceTime: 100}
	two := *one
	two.Name, two.Thrust, two.Burn, two.Thrust1, two.Burn1, two.MassEnd, two.MassEnd1 = "two-stage", 30000, 2.5, 8000, 8, 205, 175
	loft := *one
	loft.Name, loft.Loft, loft.Caliber, loft.CxK, loft.Thrust, loft.Burn, loft.Mass, loft.MassEnd, loft.Life = "loft", true, 0.2, 1.425, 23000, 6, 175, 115, 90
	for _, m := range []*missilePhys{one, &two, &loft} {
		if m.MassEnd1 <= 0 {
			m.MassEnd1 = m.MassEnd
		}
	}
	return []*missilePhys{one, &two, &loft}
}

func TestEnvelopeParityWithTS(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("node not installed")
	}
	var cases []parityCase
	for _, m := range parityPhys() {
		p := map[string]any{"name": m.Name, "caliber": m.Caliber, "cxK": m.CxK, "thrust": m.Thrust, "burn": m.Burn, "mass": m.Mass, "massEnd": m.MassEnd,
			"thrust1": m.Thrust1, "burn1": m.Burn1, "massEnd1": m.MassEnd1, "machMax": m.MachMax, "life": m.Life, "guidanceTime": m.GuidanceTime,
			"loft": m.Loft, "multipath": nil, "guidance": "SARH"}
		for _, g := range [][5]float64{{8000, 280, 8000, 280, 0}, {10000, 400, 6000, 300, 90}, {3000, 250, 9000, 350, 180}, {12000, 500, 12000, 450, 45}, {500, 200, 50, 220, 135}} {
			rmax, rne := m.envelope(g[0], g[1], g[2], g[3], g[4])
			cases = append(cases, parityCase{p, g[0], g[1], g[2], g[3], g[4], rmax, rne})
		}
	}
	dir := t.TempDir()
	in := filepath.Join(dir, "cases.json")
	b, _ := json.Marshal(cases)
	if err := os.WriteFile(in, b, 0o644); err != nil {
		t.Fatal(err)
	}
	script := filepath.Join(dir, "run.mts")
	src, _ := filepath.Abs("../web/src/envelope.ts")
	os.WriteFile(script, []byte(`import { envelope } from '`+filepath.ToSlash(src)+`';
import { readFileSync } from 'node:fs';
const cs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
console.log(JSON.stringify(cs.map((c: any) => envelope(c.p, c.SAlt, c.SSpd, c.TAlt, c.TSpd, c.Aspect))));
`), 0o644)
	out, err := exec.Command(node, "--experimental-strip-types", "--no-warnings", script, in).Output()
	if err != nil {
		t.Skipf("node could not run the TypeScript file (needs Node 22.18+): %v", err)
	}
	var ts [][2]float64
	if err := json.Unmarshal(out, &ts); err != nil || len(ts) != len(cases) {
		t.Fatalf("bad node output: %v %s", err, out)
	}
	for i, c := range cases {
		if ts[i][0] != c.Rmax || ts[i][1] != c.Rne {
			t.Errorf("%s case %d: Go %v/%v, TS %v/%v", c.P["name"], i%5, c.Rmax, c.Rne, ts[i][0], ts[i][1])
		}
	}
	t.Logf("%d cases identical", len(cases))
}

func TestTwoStageHelps(t *testing.T) {
	ms := parityPhys()
	one, two := ms[0], *ms[0]
	two.Thrust1, two.Burn1, two.MassEnd1 = 5000, 10, one.MassEnd-20
	r1, _ := one.envelope(8000, 280, 8000, 280, 0)
	r2, _ := two.envelope(8000, 280, 8000, 280, 0)
	if r2 <= r1 {
		t.Errorf("adding a sustainer stage should add range: %v vs %v", r1, r2)
	}
}
