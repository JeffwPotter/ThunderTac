// OURS. "wtassets catalog": builds small lookup files from the unpacked game
// data (the output of "wtassets unpack"), so names and specifications come
// from the user's own install and follow game updates:
//
//	vehicles.json       internal vehicle name -> display name
//	weapons.json        guided missiles: display name, guidance, performance figures
//	radars.json         radars: scan patterns (width, bars), and which aircraft carry which radar
//	mission_areas.json  named areas of every mission file (battle area, border, zones)
package main

import (
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

func catalog(args []string) error {
	fl := flag.NewFlagSet("catalog", flag.ExitOnError)
	data := fl.String("data", "", "folder written by 'wtassets unpack'")
	out := fl.String("out", "", "output folder (assets\\catalog)")
	_ = fl.Parse(args)
	if *data == "" || *out == "" {
		return fmt.Errorf("-data and -out are required")
	}
	if err := os.MkdirAll(*out, 0755); err != nil {
		return err
	}
	stamp := time.Now().UTC().Format("2006-01-02")
	write := func(name string, v map[string]any) error {
		v["format"] = "wt-catalog"
		v["schema"] = 1
		v["generated"] = stamp
		raw, err := json.Marshal(v)
		if err != nil {
			return err
		}
		return os.WriteFile(filepath.Join(*out, name), raw, 0644)
	}

	units := readLang(filepath.Join(*data, "lang", "lang", "units.csv"))
	weaponry := readLang(filepath.Join(*data, "lang", "lang", "units_weaponry.csv"))

	// vehicles
	vehicles := map[string]string{}
	for k, v := range units {
		if strings.HasSuffix(k, "_shop") && v != "" {
			vehicles[strings.TrimSuffix(k, "_shop")] = cleanGlyphs(v)
		}
	}
	for _, suffix := range []string{"_1", "_0"} {
		for k, v := range units {
			if strings.HasSuffix(k, suffix) && v != "" {
				if c := strings.TrimSuffix(k, suffix); vehicles[c] == "" {
					vehicles[c] = cleanGlyphs(v)
				}
			}
		}
	}
	if err := write("vehicles.json", map[string]any{"vehicles": vehicles}); err != nil {
		return err
	}

	// weapons
	weapons := map[string]any{}
	rg := filepath.Join(*data, "aces", "gamedata", "weapons", "rocketguns")
	for _, p := range globJSON(rg) {
		d := readJSON(p)
		r, _ := d["rocket"].(map[string]any)
		if r == nil {
			continue
		}
		g, _ := r["guidance"].(map[string]any)
		if g == nil {
			continue // unguided
		}
		stem := blkStem(p)
		w := map[string]any{}
		name := weaponry["weapons/"+stem+"/short"]
		if name == "" {
			name = weaponry["weapons/"+stem]
		}
		if name == "" {
			name = stem
		}
		w["name"] = cleanGlyphs(name)
		if full := weaponry["weapons/"+stem]; full != "" {
			w["fullName"] = cleanGlyphs(full)
		}
		copyKeys(w, r, map[string]string{"bulletType": "type", "guidanceType": "guidanceType", "loadFactorMax": "maxG", "machMax": "machMax",
			"rangeMax": "rangeMaxM", "timeLife": "lifeS", "timeFire": "burnS", "mass": "massKg", "warheadMass": "warheadKg", "hasProximityFuse": "proximityFuse", "endSpeed": "endSpeedMs"})
		guid := ""
		if rs, ok := g["radarSeeker"].(map[string]any); ok {
			guid = "SARH"
			if b, _ := rs["active"].(bool); b {
				guid = "ARH"
			}
			copyKeys(w, rs, map[string]string{"angleMax": "seekerAngleMaxDeg"})
		} else if is, ok := g["irSeeker"].(map[string]any); ok {
			guid = "IR"
			copyKeys(w, is, map[string]string{"rangeBand0": "irRangeRearM", "fov": "seekerFovDeg", "gateWidth": "seekerGateDeg", "angleMax": "seekerAngleMaxDeg"})
		} else if _, ok := g["beamRider"]; ok {
			guid = "BeamRiding"
		} else if _, ok := g["opticalFlowSeeker"]; ok {
			guid = "TV"
		} else if t, _ := r["guidanceType"].(string); t != "" {
			guid = t
		}
		if guid == "optical" || guid == "ir" {
			guid = "IR"
		}
		w["guidance"] = guid
		copyKeys(w, g, map[string]string{"lockDistance": "seekerLockRangeM", "lockAfterLaunch": "lockAfterLaunch", "workTime": "guidanceTimeS"})
		if ig, ok := g["inertialGuidance"].(map[string]any); ok {
			if b, _ := ig["datalink"].(bool); b {
				w["datalink"] = true
			}
		}
		// physics for the fly-out estimate (viewer analysis)
		ph := map[string]any{}
		copyKeys(ph, r, map[string]string{"caliber": "caliberM", "CxK": "cxK", "dragCx": "dragCx", "force": "thrustN", "timeFire": "burnS",
			"mass": "massKg", "massEnd": "massEndKg", "machMax": "machMax", "timeLife": "lifeS", "loadFactorMax": "maxG",
			// second (sustainer) motor stage, where the game file has one
			"timeFire1": "burn1S", "force1": "thrust1N", "massEnd1": "massEnd1Kg"})
		copyKeys(ph, g, map[string]string{"workTime": "guidanceTimeS"})
		if ap, ok := g["guidanceAutopilot"].(map[string]any); ok {
			copyKeys(ph, ap, map[string]string{"loftEnabled": "loft", "loftElevation": "loftElevationDeg"})
		}
		if rs, ok := g["radarSeeker"].(map[string]any); ok {
			if mp := asList(rs["multipathEffect"]); len(mp) >= 4 {
				tab := []float64{}
				for _, v := range mp[:4] {
					if f, ok := v.(float64); ok {
						tab = append(tab, f)
					}
				}
				if len(tab) == 4 {
					ph["multipath"] = tab // [x0, effect0, x1, effect1]; x read as height above ground, metres
				}
			}
			if rc, ok := rs["receiver"].(map[string]any); ok {
				copyKeys(ph, rc, map[string]string{"range": "seekerRangeM"})
			}
		}
		w["physics"] = ph
		weapons[stem] = w
	}
	if err := write("weapons.json", map[string]any{"missiles": weapons}); err != nil {
		return err
	}

	// radars
	sensors := map[string]any{}
	for _, p := range globJSON(filepath.Join(*data, "aces", "gamedata", "sensors")) {
		d := readJSON(p)
		if t, _ := d["type"].(string); t != "radar" {
			continue
		}
		pats := map[string]any{}
		if sp, ok := d["scanPatterns"].(map[string]any); ok {
			for id, raw := range sp {
				m, _ := raw.(map[string]any)
				if m == nil {
					continue
				}
				e := map[string]any{}
				copyKeys(e, m, map[string]string{"type": "type", "width": "azHalfDeg", "barHeight": "barHeightDeg", "barsCount": "bars",
					"centerElevation": "centerElevationDeg", "period": "periodS", "rollStabLimit": "rollStabDeg", "pitchStabLimit": "pitchStabDeg", "tws": "tws", "hmd": "hmd",
					"azimuthLimits": "azLimitsDeg", "elevationLimits": "elLimitsDeg"})
				bh, _ := m["barHeight"].(float64)
				bc, _ := m["barsCount"].(float64)
				if bh > 0 && bc > 0 {
					e["elHalfDeg"] = math.Round(bh*bc*50) / 100
				}
				pats[id] = e
			}
		}
		name, _ := d["name"].(string)
		ent := map[string]any{"name": name, "patterns": pats}
		// main-beam clutter notch: smallest width and largest look-down angle over the radar's signals
		if sg, ok := d["signals"].(map[string]any); ok {
			nw, ne := 0.0, 0.0
			for _, raw := range sg {
				m, _ := raw.(map[string]any)
				if w, ok := m["mainBeamNotchWidth"].(float64); ok && (nw == 0 || w < nw) {
					nw = w
				}
				if e, ok := m["mainBeamNotchMaxElevation"].(float64); ok && e > ne {
					ne = e
				}
			}
			if nw > 0 {
				ent["notchWidthMs"] = nw
			}
			if ne > 0 {
				ent["notchMaxElevationDeg"] = ne
			}
		}
		sensors[blkStem(p)] = ent
	}
	byAircraft := map[string][]string{}
	for _, p := range globJSON(filepath.Join(*data, "aces", "gamedata", "flightmodels")) {
		d := readJSON(p)
		s, _ := d["sensors"].(map[string]any)
		if s == nil {
			continue
		}
		var list []string
		for _, it := range asList(s["sensor"]) {
			m, _ := it.(map[string]any)
			b, _ := m["blk"].(string)
			stem := strings.TrimSuffix(strings.ToLower(filepath.Base(strings.ReplaceAll(b, "\\", "/"))), ".blk")
			if _, ok := sensors[stem]; ok {
				list = append(list, stem)
			}
		}
		if len(list) > 0 {
			byAircraft[blkStem(p)] = list
		}
	}
	if err := write("radars.json", map[string]any{"sensors": sensors, "byAircraft": byAircraft}); err != nil {
		return err
	}

	// mission areas
	keep := regexp.MustCompile(`(?i)(mission_border|airfields?_.*area|battle_?zone|capture|_zone|air_spawn|battle_area)`)
	missions := map[string]any{}
	root := filepath.Join(*data, "mis")
	nAreas := 0
	_ = filepath.WalkDir(filepath.Join(root, "gamedata", "missions"), func(p string, de fs.DirEntry, err error) error {
		if err != nil || de.IsDir() || !strings.HasSuffix(p, ".blk.json") {
			return nil
		}
		d := readJSON(p)
		ar, _ := d["areas"].(map[string]any)
		var list []any
		names := make([]string, 0, len(ar))
		for n := range ar {
			names = append(names, n)
		}
		sort.Strings(names)
		for _, n := range names {
			a, _ := ar[n].(map[string]any)
			typ, _ := a["type"].(string)
			if a == nil || typ == "Point" || !keep.MatchString(n) {
				continue
			}
			tm := asMatrix(a["tm"])
			if tm == nil {
				continue
			}
			norm := func(v []float64) float64 { return math.Sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) }
			e := map[string]any{"name": n, "type": typ, "x": r1(tm[3][0]), "y": r1(tm[3][1]), "z": r1(tm[3][2]),
				"sizeX": r1(norm(tm[0])), "sizeY": r1(norm(tm[1])), "sizeZ": r1(norm(tm[2]))}
			if typ == "Box" {
				// direction of the box's x axis on the map, degrees clockwise from north
				e["rotationDeg"] = r1(math.Mod(math.Atan2(tm[0][0], tm[0][2])*180/math.Pi+360, 360))
			}
			list = append(list, e)
		}
		if len(list) > 0 {
			rel, _ := filepath.Rel(root, p)
			key := strings.ToLower(strings.TrimSuffix(filepath.ToSlash(rel), ".json"))
			missions[key] = list
			nAreas += len(list)
		}
		return nil
	})
	if err := write("mission_areas.json", map[string]any{"missions": missions}); err != nil {
		return err
	}
	tanks, nWeapons := groundCatalog(*data)
	if len(tanks) > 0 {
		if err := write("ground.json", map[string]any{"vehicles": tanks}); err != nil {
			return err
		}
	}
	fmt.Printf("catalog: %d ground vehicles with %d weapon mounts\n", len(tanks), nWeapons)
	fmt.Printf("catalog: %d vehicles, %d guided weapons, %d radars on %d aircraft, %d areas in %d mission files\n",
		len(vehicles), len(weapons), len(sensors), len(byAircraft), nAreas, len(missions))
	return nil
}

func r1(v float64) float64 { return math.Round(v*10) / 10 }

func cleanGlyphs(s string) string {
	return strings.TrimSpace(strings.Map(func(r rune) rune {
		if (r >= 0x2400 && r <= 0x27BF) || (r >= 0xE000 && r <= 0xF8FF) {
			return -1
		}
		return r
	}, s))
}

func blkStem(p string) string {
	return strings.ToLower(strings.TrimSuffix(filepath.Base(p), ".blk.json"))
}

func globJSON(dir string) []string {
	l, _ := filepath.Glob(filepath.Join(dir, "*.blk.json"))
	sort.Strings(l)
	return l
}

func readJSON(p string) map[string]any {
	raw, err := os.ReadFile(p)
	if err != nil {
		return map[string]any{}
	}
	var d map[string]any
	if json.Unmarshal(raw, &d) != nil || d == nil {
		return map[string]any{}
	}
	return d
}

func asList(v any) []any {
	switch t := v.(type) {
	case []any:
		return t
	case nil:
		return nil
	default:
		return []any{t}
	}
}

func asMatrix(v any) [][]float64 {
	rows, _ := v.([]any)
	if len(rows) != 4 {
		return nil
	}
	out := make([][]float64, 4)
	for i, r := range rows {
		c, _ := r.([]any)
		if len(c) != 3 {
			return nil
		}
		out[i] = make([]float64, 3)
		for j := range c {
			f, ok := c[j].(float64)
			if !ok {
				return nil
			}
			out[i][j] = f
		}
	}
	return out
}

func copyKeys(dst, src map[string]any, keys map[string]string) {
	for from, to := range keys {
		if v, ok := src[from]; ok {
			if f, isF := v.(float64); isF {
				v = math.Round(f*1000) / 1000
			}
			dst[to] = v
		}
	}
}

// readLang reads a game language table: key ; English ; other languages…
func readLang(p string) map[string]string {
	out := map[string]string{}
	f, err := os.Open(p)
	if err != nil {
		return out
	}
	defer f.Close()
	r := csv.NewReader(f)
	r.Comma = ';'
	r.LazyQuotes = true
	r.FieldsPerRecord = -1
	for {
		rec, err := r.Read()
		if err != nil {
			if rec == nil {
				break
			}
			continue
		}
		if len(rec) >= 2 {
			out[rec[0]] = rec[1]
		}
	}
	return out
}
