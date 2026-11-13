// ground_catalog.go — ours. Weapons of every ground vehicle, in the order the
// replay numbers them (the vehicle's commonWeapons list), with each shell's
// ballistic figures. Used by wtdecode to draw shell arcs.
package main

import (
	"math"
	"path/filepath"
	"sort"
	"strings"
)

// Weapons of 14.7 mm and smaller are machine guns; larger ones are cannon.
const groundMGMaxCaliberM = 0.0147 + 1e-6

type groundShell struct {
	Set      string  `json:"set"`
	Name     string  `json:"name"`
	Type     string  `json:"type"`
	SpeedMs  float64 `json:"speed"`
	MassKg   float64 `json:"massKg"`
	Cx       float64 `json:"cx"`
	CaliberM float64 `json:"caliberM"`
	// DragCaliberM is the diameter the drag acts on (the game's
	// ballisticCaliber): 25 mm for a 120 mm dart, else the calibre.
	DragCaliberM float64 `json:"dragCaliberM,omitempty"`
	MaxDistM     float64 `json:"maxDistM,omitempty"`
}

type groundWeapon struct {
	Blk       string        `json:"blk"`
	Trigger   string        `json:"trigger,omitempty"`
	Class     string        `json:"class"` // cannon | mg | atgm | smoke | other
	CaliberMm float64       `json:"caliberMm"`
	Shells    []groundShell `json:"shells,omitempty"`
}

type groundVehicle struct {
	Weapons []groundWeapon `json:"weapons"`
}

func groundCatalog(data string) (map[string]groundVehicle, int) {
	out := map[string]groundVehicle{}
	weaponDir := filepath.Join(data, "aces", "gamedata", "weapons", "groundmodels_weapons")
	cache := map[string]*groundWeapon{}
	n := 0
	for _, p := range globJSON(filepath.Join(data, "aces", "gamedata", "units", "tankmodels")) {
		d := readJSON(p)
		cw, _ := d["commonWeapons"].(map[string]any)
		if cw == nil {
			continue
		}
		var v groundVehicle
		for _, raw := range asList(cw["Weapon"]) {
			w, _ := raw.(map[string]any)
			if w == nil {
				continue
			}
			blk, _ := w["blk"].(string)
			trig, _ := w["trigger"].(string)
			stem := strings.ToLower(strings.TrimSuffix(filepath.Base(strings.ReplaceAll(blk, "\\", "/")), ".blk"))
			gw, ok := cache[stem]
			if !ok {
				gw = readGroundWeapon(filepath.Join(weaponDir, stem+".blk.json"), stem)
				cache[stem] = gw
			}
			entry := *gw
			entry.Trigger = trig
			v.Weapons = append(v.Weapons, entry)
			n++
		}
		if len(v.Weapons) > 0 {
			out[blkStem(p)] = v
		}
	}
	return out, n
}

func readGroundWeapon(path, stem string) *groundWeapon {
	gw := &groundWeapon{Blk: stem, Class: "other"}
	d := readJSON(path)
	if len(d) == 0 {
		return gw
	}
	seen := map[string]bool{}
	add := func(set string, b map[string]any) {
		name, _ := b["bulletName"].(string)
		typ, _ := b["bulletType"].(string)
		if name == "" {
			name = typ
		}
		if name == "" || seen[name] {
			return
		}
		f := func(k string) float64 { x, _ := b[k].(float64); return x }
		sh := groundShell{Set: set, Name: name, Type: typ, SpeedMs: f("speed"), MassKg: f("mass"), Cx: f("Cx"), CaliberM: f("caliber"), DragCaliberM: f("ballisticCaliber"), MaxDistM: f("maxDistance")}
		seen[name] = true
		gw.Shells = append(gw.Shells, sh)
	}
	bulletsOf := func(v any) []map[string]any {
		var out []map[string]any
		for _, b := range asList(v) {
			if m, ok := b.(map[string]any); ok {
				out = append(out, m)
			}
		}
		return out
	}
	for _, b := range bulletsOf(d["bullet"]) {
		add("bullet", b)
	}
	keys := make([]string, 0, len(d))
	for k := range d {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		if m, ok := d[k].(map[string]any); ok {
			for _, b := range bulletsOf(m["bullet"]) {
				add(k, b)
			}
			if r, ok := m["rocket"].(map[string]any); ok {
				add(k, r)
			}
		}
	}
	if r, ok := d["rocket"].(map[string]any); ok {
		add("rocket", r)
	}
	cal := 0.0
	nATGM, nSmoke := 0, 0
	for _, sh := range gw.Shells {
		cal = math.Max(cal, sh.CaliberM)
		t := strings.ToLower(sh.Type + " " + sh.Name)
		switch {
		case strings.Contains(t, "smoke"):
			nSmoke++
		case strings.Contains(t, "atgm") || strings.Contains(t, "sam_") || strings.Contains(t, "rocket"):
			nATGM++
		}
	}
	gw.CaliberMm = math.Round(cal*10000) / 10
	all := len(gw.Shells)
	switch {
	case strings.Contains(stem, "smoke") || (all > 0 && nSmoke == all):
		gw.Class = "smoke"
	case all > 0 && nATGM == all:
		// a launcher; a gun that can also fire a gun-launched missile stays a cannon
		gw.Class = "atgm"
	case cal > 0 && cal <= groundMGMaxCaliberM:
		gw.Class = "mg"
	case cal > 0:
		gw.Class = "cannon"
	}
	return gw
}
