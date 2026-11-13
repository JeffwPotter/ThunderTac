package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

// 14.7 mm and smaller is a machine gun; anything larger is a cannon; a gun
// that can also fire a gun-launched missile stays a cannon.
func TestGroundWeaponClass(t *testing.T) {
	dir := t.TempDir()
	write := func(name string, v any) string {
		p := filepath.Join(dir, name+".blk.json")
		raw, _ := json.Marshal(v)
		if err := os.WriteFile(p, raw, 0644); err != nil {
			t.Fatal(err)
		}
		return p
	}
	b := func(name, typ string, cal float64) map[string]any {
		return map[string]any{"bulletName": name, "bulletType": typ, "caliber": cal, "speed": 900.0, "mass": 0.05, "Cx": 0.3}
	}
	cases := []struct {
		name string
		blk  map[string]any
		want string
	}{
		{"kpvt", map[string]any{"bullet": b("b32", "api_t", 0.0145)}, "mg"},
		{"vladimirov_147", map[string]any{"bullet": b("x", "api", 0.0147)}, "mg"},
		{"twenty", map[string]any{"bullet": b("y", "he_i", 0.020)}, "cannon"},
		{"gun_with_atgm", map[string]any{"bullet": b("125mm_3bm60", "apds_fs_long_tank", 0.125), "set2": map[string]any{"bullet": b("125mm_9m119", "atgm_tank", 0.125)}}, "cannon"},
		{"launcher", map[string]any{"bullet": b("tow", "atgm_tank", 0.152)}, "atgm"},
		{"smoke_grenades", map[string]any{"bullet": b("smk", "smoke_grenade", 0.066)}, "smoke"},
	}
	for _, c := range cases {
		gw := readGroundWeapon(write(c.name, c.blk), c.name)
		if gw.Class != c.want {
			t.Errorf("%s: class %q, want %q", c.name, gw.Class, c.want)
		}
	}
}
