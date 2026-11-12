// OURS (v0.8.0). wtassets tables: regenerates the decoder's game-data tables
// from the local install (unpacked with wtassets unpack).
//
//	wtassets tables -data <unpacked folder> -out <folder>
//
// Go translations of the snapshot's Python generators (decoder/tools/...):
//
//	aam_models.json, agm_models.json   tools/agm/build_catalog.py --role AAM / AGM
//	missile_carriers.json              tools/agm/build_carrier_catalog.py
//	bomb_models.json                   tools/bombs/build_catalog.py
//	countermeasure_ammo.json           tools/countermeasures/build_catalog.py
//	radar_modes.json                   tools/radar-modes/build_radar_modes.py
//
// Keys and paths are written in the datamine form the decoder looks up
// ("aces.vromfs.bin_u/gamedata/weapons/rocketguns/x.blkx"). With -datamine the
// input is a War-Thunder-Datamine checkout instead; this is used to check the
// translation against the built-in tables, which were made that way.
// Not regenerated (see docs/decoder-tables.md): SAM and ground-threat tables,
// airfields, the hand-reviewed missile_models / missile_guidance lists, and
// the ECS component table.
package main

import (
	"bytes"
	"crypto/sha1"
	_ "embed"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

// ---------------------------------------------------------------- ordered JSON

// oMap is a JSON object with its keys in file order.
type oMap struct {
	keys []string
	vals map[string]any
}

func (m *oMap) get(k string) (any, bool) {
	if m == nil {
		return nil, false
	}
	v, ok := m.vals[k]
	return v, ok
}
func (m *oMap) str(k string) string {
	v, _ := m.get(k)
	s, _ := v.(string)
	return s
}
func (m *oMap) obj(k string) *oMap {
	v, _ := m.get(k)
	o, _ := v.(*oMap)
	return o
}

func decodeOrdered(raw []byte) (any, error) {
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.UseNumber()
	v, err := decodeValue(dec)
	if err != nil {
		return nil, err
	}
	return v, nil
}

func decodeValue(dec *json.Decoder) (any, error) {
	tok, err := dec.Token()
	if err != nil {
		return nil, err
	}
	switch t := tok.(type) {
	case json.Delim:
		switch t {
		case '{':
			m := &oMap{vals: map[string]any{}}
			for dec.More() {
				kt, err := dec.Token()
				if err != nil {
					return nil, err
				}
				k, _ := kt.(string)
				v, err := decodeValue(dec)
				if err != nil {
					return nil, err
				}
				if _, dup := m.vals[k]; !dup {
					m.keys = append(m.keys, k)
				}
				m.vals[k] = v // Python json: the last duplicate wins
			}
			_, err := dec.Token()
			return m, err
		case '[':
			l := []any{}
			for dec.More() {
				v, err := decodeValue(dec)
				if err != nil {
					return nil, err
				}
				l = append(l, v)
			}
			_, err := dec.Token()
			return l, err
		}
	case json.Number:
		f, err := t.Float64()
		return f, err
	}
	return tok, nil // string, bool, nil
}

// walkDicts visits every object, parent before children (Python walk()).
func walkDicts(v any, fn func(*oMap)) {
	switch x := v.(type) {
	case *oMap:
		fn(x)
		for _, k := range x.keys {
			walkDicts(x.vals[k], fn)
		}
	case []any:
		for _, e := range x {
			walkDicts(e, fn)
		}
	}
}

// number reports Python's isinstance(v, (int, float)), which includes bool.
func number(v any) (float64, bool) {
	switch x := v.(type) {
	case float64:
		return x, true
	case bool:
		if x {
			return 1, true
		}
		return 0, true
	}
	return 0, false
}

// ---------------------------------------------------------------- game data tree

// gameTree reads game files by their datamine path
// ("aces.vromfs.bin_u/gamedata/..../x.blkx", "lang.vromfs.bin_u/lang/x.csv").
type gameTree struct {
	root     string
	datamine bool
	files    []string // datamine paths, sorted
	local    map[string]string
	mu       sync.Mutex
	cache    map[string]any
}

func openTree(root string, datamine bool) (*gameTree, error) {
	t := &gameTree{root: root, datamine: datamine, local: map[string]string{}, cache: map[string]any{}}
	err := filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if d.Name() == ".git" {
				return filepath.SkipDir
			}
			return nil
		}
		rel, _ := filepath.Rel(root, p)
		rel = filepath.ToSlash(rel)
		var dm string
		if datamine {
			dm = rel
		} else {
			i := strings.IndexByte(rel, '/')
			if i < 0 {
				return nil
			}
			archive, rest := rel[:i], rel[i+1:]
			if strings.HasSuffix(rest, ".blk.json") {
				rest = strings.TrimSuffix(rest, ".json") + "x"
			}
			dm = archive + ".vromfs.bin_u/" + rest
		}
		t.files = append(t.files, dm)
		t.local[dm] = p
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Strings(t.files)
	if len(t.files) == 0 {
		return nil, fmt.Errorf("no files in %s", root)
	}
	return t, nil
}

func (t *gameTree) has(p string) bool { _, ok := t.local[p]; return ok }

func (t *gameTree) raw(p string) ([]byte, error) {
	lp, ok := t.local[p]
	if !ok {
		return nil, fmt.Errorf("missing %s", p)
	}
	return os.ReadFile(lp)
}

func (t *gameTree) json(p string) (any, error) {
	t.mu.Lock()
	if v, ok := t.cache[p]; ok {
		t.mu.Unlock()
		return v, nil
	}
	t.mu.Unlock()
	raw, err := t.raw(p)
	if err != nil {
		return nil, err
	}
	v, err := decodeOrdered(raw)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", p, err)
	}
	return v, nil
}

// cached keeps small shared documents (containers) in memory.
func (t *gameTree) cached(p string) (any, error) {
	v, err := t.json(p)
	if err == nil {
		t.mu.Lock()
		t.cache[p] = v
		t.mu.Unlock()
	}
	return v, err
}

func (t *gameTree) blobSHA(p string) string {
	raw, err := t.raw(p)
	if err != nil {
		return ""
	}
	h := sha1.New()
	fmt.Fprintf(h, "blob %d\x00", len(raw))
	h.Write(raw)
	return hex.EncodeToString(h.Sum(nil))
}

func stem(p string) string {
	b := path.Base(p)
	return strings.TrimSuffix(b, path.Ext(b))
}

const langWeaponry = "lang.vromfs.bin_u/lang/units_weaponry.csv"

// englishNames reads units_weaponry.csv: first column key, <English> column name.
func englishNames(t *gameTree) (map[string]string, error) {
	raw, err := t.raw(langWeaponry)
	if err != nil {
		return nil, err
	}
	raw = bytes.TrimPrefix(raw, []byte("\xef\xbb\xbf"))
	r := csv.NewReader(bytes.NewReader(raw))
	r.Comma = ';'
	r.FieldsPerRecord = -1
	r.LazyQuotes = true
	header, err := r.Read()
	if err != nil {
		return nil, err
	}
	eng := -1
	for i, h := range header {
		if h == "<English>" {
			eng = i
		}
	}
	if eng < 0 {
		return nil, errors.New("units_weaponry.csv has no <English> column")
	}
	names := map[string]string{}
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}
		if len(rec) > eng {
			if v := strings.TrimSpace(rec[eng]); v != "" {
				names[rec[0]] = v
			}
		}
	}
	return names, nil
}

// ---------------------------------------------------------------- output helpers

// kv writes JSON objects with a fixed key order.
type kv []struct {
	k string
	v any
}

func (o kv) MarshalJSON() ([]byte, error) {
	var b bytes.Buffer
	b.WriteByte('{')
	for i, e := range o {
		if i > 0 {
			b.WriteByte(',')
		}
		kb, _ := json.Marshal(e.k)
		b.Write(kb)
		b.WriteByte(':')
		vb, err := marshalNoEscape(e.v)
		if err != nil {
			return nil, err
		}
		b.Write(vb)
	}
	b.WriteByte('}')
	return b.Bytes(), nil
}

func obj(pairs ...any) kv {
	o := kv{}
	for i := 0; i+1 < len(pairs); i += 2 {
		o = append(o, struct {
			k string
			v any
		}{pairs[i].(string), pairs[i+1]})
	}
	return o
}

// sortedObj turns a map into an object with sorted keys.
func sortedObj[V any](m map[string]V) kv {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	o := kv{}
	for _, k := range keys {
		o = append(o, struct {
			k string
			v any
		}{k, m[k]})
	}
	return o
}

func marshalNoEscape(v any) ([]byte, error) {
	var b bytes.Buffer
	enc := json.NewEncoder(&b)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return nil, err
	}
	return bytes.TrimRight(b.Bytes(), "\n"), nil
}

func writeTable(dir, name string, v any) error {
	raw, err := marshalNoEscape(v)
	if err != nil {
		return err
	}
	var pretty bytes.Buffer
	if err := json.Indent(&pretty, raw, "", "  "); err != nil {
		return err
	}
	pretty.WriteByte('\n')
	tmp := filepath.Join(dir, name+".tmp")
	if err := os.WriteFile(tmp, pretty.Bytes(), 0644); err != nil {
		return err
	}
	return os.Rename(tmp, filepath.Join(dir, name))
}

// ---------------------------------------------------------------- AAM / AGM

type wRow struct{ bullet, model, guidance, key string }

func lookupName(names map[string]string, keys ...string) string {
	for _, k := range keys {
		if names[k] != "" {
			return k
		}
	}
	return ""
}

func weaponRows(p string, data any, names map[string]string, role string) []wRow {
	set := map[wRow]bool{}
	walkDicts(data, func(o *oMap) {
		rocket := o.obj("rocket")
		if rocket == nil {
			return
		}
		gv, _ := rocket.get("guidanceType")
		if !truthy(gv) {
			if cs, ok := number(rocket.vals["controlSensitivity"]); ok && cs > 0 {
				gv = "manual"
			}
		}
		guidance, isStr := gv.(string)
		if !isStr || guidance == "" {
			return
		}
		bt, ok := rocket.get("bulletType")
		if !ok {
			bt = o.vals["bulletType"]
		}
		types := []any{bt}
		if l, isList := bt.([]any); isList {
			types = l
		}
		groundOnly := false
		if sb := rocket.obj("guidance"); sb != nil {
			for _, k := range sb.keys {
				if s, ok := sb.vals[k].(*oMap); ok && strings.HasSuffix(k, "Seeker") {
					if g, _ := s.get("groundVehiclesAsTarget"); g == true {
						if a, _ := s.get("aircraftAsTarget"); a == false {
							groundOnly = true
						}
					}
				}
			}
		}
		has := func(s string) bool {
			for _, t := range types {
				if t == s {
					return true
				}
			}
			return false
		}
		isAAM := has("aam") && !groundOnly
		if has("sam_tank") || (role == "AAM") != isAAM {
			return
		}
		bv, ok := rocket.get("bulletName")
		if !ok {
			bv = o.vals["bulletName"]
		}
		bullet, _ := bv.(string)
		if bullet == "" {
			return
		}
		key := lookupName(names, "weapons/"+bullet+"/short", bullet, "weapons/"+bullet)
		set[wRow{bullet, names[key], guidance, key}] = true
	})
	rows := make([]wRow, 0, len(set))
	for r := range set {
		rows = append(rows, r)
	}
	sort.Slice(rows, func(i, j int) bool {
		a, b := rows[i], rows[j]
		if a.bullet != b.bullet {
			return a.bullet < b.bullet
		}
		if a.model != b.model {
			return a.model < b.model
		}
		if a.guidance != b.guidance {
			return a.guidance < b.guidance
		}
		return a.key < b.key
	})
	if len(rows) == 1 && rows[0].model == "" {
		st := stem(p)
		key := lookupName(names, "weapons/"+st+"/short", st, "weapons/"+st)
		rows = []wRow{{rows[0].bullet, names[key], rows[0].guidance, key}}
	}
	return rows
}

func aamRadarSource(data any) string {
	var seekers []*oMap
	walkDicts(data, func(o *oMap) {
		if s := o.obj("radarSeeker"); s != nil {
			seekers = append(seekers, s)
		}
	})
	if len(seekers) == 0 {
		return ""
	}
	allTrue, allFalse := true, true
	for _, s := range seekers {
		a, ok := s.get("active")
		if a != true {
			allTrue = false
		}
		if ok && a != false {
			allFalse = false
		}
	}
	if allTrue {
		return ", radarSeeker.active=true"
	}
	if allFalse {
		return ", radarSeeker.active=false/default (SARH)"
	}
	return ""
}

type aliasEntry struct {
	Model, InternalName, Confidence, Source, Role string
}

func (e aliasEntry) MarshalJSON() ([]byte, error) {
	o := obj("model", e.Model, "internal_name", e.InternalName, "confidence", e.Confidence, "source", e.Source)
	if e.Role != "" {
		o = append(o, obj("role", e.Role)...)
	}
	return o.MarshalJSON()
}

func (g *tableGen) missiles(role string) (map[string]aliasEntry, error) {
	t := g.tree
	var paths []string
	for _, p := range t.files {
		if strings.Contains(p, "/weapons/rocketguns/") && strings.HasSuffix(p, ".blkx") {
			paths = append(paths, p)
		}
	}
	type res struct {
		rows []wRow
		data any
	}
	results := make([]res, len(paths))
	err := parallel(len(paths), func(i int) error {
		d, err := t.json(paths[i])
		if err != nil {
			return err
		}
		results[i] = res{weaponRows(paths[i], d, g.names, role), d}
		return nil
	})
	if err != nil {
		return nil, err
	}
	aliases := map[string][]aliasEntry{}
	add := func(key, bullet, model, guidance, p, langKey string, data any) {
		key = strings.ToLower(key)
		gs := "guidanceType=" + guidance
		if guidance == "manual" {
			gs = "manual controlSensitivity>0"
		}
		if role == "AAM" && guidance == "radar" {
			gs += aamRadarSource(data)
		}
		ls := "untranslated internal identifier (no English localization)"
		if langKey != "" {
			ls = fmt.Sprintf("%s blob=%s key=%s", langWeaponry, g.langBlob, langKey)
		}
		e := aliasEntry{Model: model, InternalName: bullet, Confidence: "confirmed",
			Source: fmt.Sprintf("%s %s blob=%s; %s; %s", g.label, p, t.blobSHA(p), gs, ls)}
		if role == "AGM" {
			e.Role = "AGM"
		}
		aliases[key] = append(aliases[key], e)
	}
	for i, p := range paths {
		rows := results[i].rows
		for _, r := range rows {
			m := r.model
			if m == "" {
				m = r.bullet
			}
			add(r.bullet, r.bullet, m, r.guidance, p, r.key, results[i].data)
		}
		if len(rows) == 1 {
			r := rows[0]
			m := r.model
			if m == "" {
				m = r.bullet
			}
			for _, alias := range []string{stem(p), p, strings.TrimSuffix(strings.TrimPrefix(p, "aces.vromfs.bin_u/"), "x")} {
				add(alias, r.bullet, m, r.guidance, p, r.key, results[i].data)
			}
		}
	}
	out := map[string]aliasEntry{}
	for k, vs := range aliases {
		ids := map[[2]string]bool{}
		for _, v := range vs {
			ids[[2]string{v.Model, v.InternalName}] = true
		}
		if len(ids) == 1 {
			sort.Slice(vs, func(i, j int) bool { return vs[i].Source < vs[j].Source })
			out[k] = vs[0]
		}
	}
	return out, nil
}

// ---------------------------------------------------------------- bombs

func (g *tableGen) bombs() (map[string]aliasEntry, error) {
	t := g.tree
	out := map[string]aliasEntry{}
	conflicts := 0
	for _, p := range t.files {
		if !strings.Contains(p, "/weapons/bombguns/") || !strings.HasSuffix(p, ".blkx") {
			continue
		}
		d, err := t.json(p)
		if err != nil {
			return nil, err
		}
		o, _ := d.(*oMap)
		if bg, _ := o.get("bombGun"); bg != true || o.obj("bomb") == nil {
			continue
		}
		internal := stem(p)
		key := lookupName(g.names, "weapons/"+internal+"/short", "weapons/"+internal, internal)
		if key == "" {
			continue
		}
		e := aliasEntry{Model: g.names[key], InternalName: internal, Confidence: "confirmed",
			Source: fmt.Sprintf("%s %s blob=%s bombGun=true; %s blob=%s key=%s", g.label, p, t.blobSHA(p), langWeaponry, g.langBlob, key)}
		for _, alias := range []string{internal, p, strings.TrimSuffix(strings.TrimPrefix(p, "aces.vromfs.bin_u/"), "x")} {
			alias = strings.ToLower(alias)
			if ex, ok := out[alias]; ok && ex != e {
				conflicts++ // the Python generator stops here; we keep the first
				continue
			}
			out[alias] = e
		}
	}
	if conflicts > 0 {
		fmt.Printf("  bombs: %d conflicting aliases kept their first entry\n", conflicts)
	}
	return out, nil
}

// ---------------------------------------------------------------- missile carriers

var familyRe = regexp.MustCompile(`^(AIM-\d+|AGM-\d+|R-\d+|Kh-\d+|PL-\d+|SD-\d+|AAM-\d+|RB \d+|AS\.\d+)`)

func familyName(model string) string {
	if m := familyRe.FindStringSubmatchIndex(model); m != nil {
		end := m[3]
		if end == len(model) || !(model[end] >= '0' && model[end] <= '9') {
			return model[m[2]:m[3]]
		}
		// the regex grabbed all digits, so the next char is never a digit
	}
	return model
}

func assetPath(v any) string {
	s, ok := v.(string)
	if !ok {
		return ""
	}
	s = strings.ToLower(strings.ReplaceAll(s, "\\", "/"))
	for _, part := range strings.Split(s, "/") {
		if part == ".." {
			return ""
		}
	}
	if strings.HasPrefix(s, "gamedata/") {
		s = "aces.vromfs.bin_u/" + s
	}
	if strings.HasSuffix(s, ".blk") {
		s += "x"
	}
	return s
}

// lowerFiles maps lower-cased paths to real ones (asset references are lower-cased).
func (t *gameTree) lowerIndex() map[string]string {
	m := make(map[string]string, len(t.files))
	for _, f := range t.files {
		m[strings.ToLower(f)] = f
	}
	return m
}

type carrierRow struct {
	Weapons         []string
	Complete        map[string]bool
	Unresolved      map[string][]string
	Source          string
	ContainerInputs map[string]string
	Blob            string
}

func (r carrierRow) MarshalJSON() ([]byte, error) {
	return obj("weapons", r.Weapons,
		"complete", obj("AAM", r.Complete["AAM"], "AGM", r.Complete["AGM"]),
		"unresolved", obj("AAM", r.Unresolved["AAM"], "AGM", r.Unresolved["AGM"]),
		"source", r.Source, "container_inputs", sortedObj(r.ContainerInputs),
		"scope", "DeclaredWeaponSlotsAndCommonWeapons", "blob_sha1", r.Blob).MarshalJSON()
}

func (g *tableGen) carriers(aliases map[string]aliasEntry, reviewed []string) (kv, kv, error) {
	t := g.tree
	lower := t.lowerIndex()
	const prefix = "aces.vromfs.bin_u/gamedata/flightmodels/"
	var paths []string
	for _, p := range t.files {
		if strings.HasPrefix(p, prefix) && !strings.Contains(p[len(prefix):], "/") && strings.HasSuffix(p, ".blkx") {
			paths = append(paths, p)
		}
	}
	var containerWeapons func(ref string, visiting []string) ([]string, []string, map[string]string)
	containerWeapons = func(ref string, visiting []string) ([]string, []string, map[string]string) {
		for _, v := range visiting {
			if v == ref {
				return nil, []string{ref}, map[string]string{}
			}
		}
		if len(visiting) >= 8 {
			return nil, []string{ref}, map[string]string{}
		}
		real, ok := lower[ref]
		if !ok || !strings.Contains(ref, "/weapons/containers/") {
			return nil, []string{ref}, map[string]string{}
		}
		d, err := t.cached(real)
		inputs := map[string]string{ref: t.blobSHA(real)}
		o, _ := d.(*oMap)
		if err != nil || o == nil {
			return nil, []string{ref}, inputs
		}
		if c, _ := o.get("container"); c != true {
			return nil, []string{ref}, inputs
		}
		refSet := map[string]bool{}
		walkDicts(d, func(x *oMap) {
			if s, ok := x.vals["blk"].(string); ok {
				refSet[assetPath(s)] = true
			}
		})
		if len(refSet) == 0 || len(refSet) > 64 {
			return nil, []string{ref}, inputs
		}
		refs := make([]string, 0, len(refSet))
		for r := range refSet {
			refs = append(refs, r)
		}
		sort.Strings(refs)
		leaves, missing := map[string]bool{}, map[string]bool{}
		for _, r := range refs {
			if _, ok := aliases[r]; ok {
				leaves[r] = true
			} else if strings.Contains(r, "/weapons/containers/") {
				nl, nm, dep := containerWeapons(r, append(append([]string{}, visiting...), ref))
				for _, x := range nl {
					leaves[x] = true
				}
				for _, x := range nm {
					missing[x] = true
				}
				for k, v := range dep {
					inputs[k] = v
				}
			} else {
				missing[r] = true
			}
		}
		return sortedKeys(leaves), sortedKeys(missing), inputs
	}
	rows := make([]*carrierRow, len(paths))
	err := parallel(len(paths), func(i int) error {
		d, err := t.json(paths[i])
		if err != nil {
			return err
		}
		data, _ := d.(*oMap)
		slots := data.obj("WeaponSlots")
		if slots == nil {
			return nil
		}
		if ws, ok := slots.get("WeaponSlot"); !ok || !truthy(ws) {
			return nil
		}
		weapons := map[string]bool{}
		unresolved := map[string]map[string]bool{"AAM": {}, "AGM": {}}
		inputs := map[string]string{}
		var common any = &oMap{vals: map[string]any{}}
		if c, ok := data.get("commonWeapons"); ok {
			common = c
		}
		for _, container := range []any{slots, common} {
			walkDicts(container, func(o *oMap) {
				role, _ := o.vals["trigger"].(string)
				if role == "atgm" {
					role = "agm"
				}
				if role != "aam" && role != "agm" {
					return
				}
				if b, ok := o.get("bullets"); ok {
					if n, isNum := number(b); isNum && n == 0 {
						return
					}
				}
				ref := assetPath(o.vals["blk"])
				leaves := []string{ref}
				R := strings.ToUpper(role)
				if strings.Contains(ref, "/weapons/containers/") {
					var missing []string
					var dep map[string]string
					leaves, missing, dep = containerWeapons(ref, nil)
					for _, m := range missing {
						unresolved[R][m] = true
					}
					for k, v := range dep {
						inputs[k] = v
					}
				}
				want := ""
				if role == "agm" {
					want = "AGM"
				}
				for _, leaf := range leaves {
					if a, ok := aliases[leaf]; ok && a.Role == want {
						weapons[leaf] = true
					} else {
						label := leaf
						if label == "" {
							if s, ok := o.vals["blk"].(string); ok {
								label = s
							} else if _, present := o.vals["blk"]; !present {
								label = "missing missile blk"
							} else {
								label = fmt.Sprint(o.vals["blk"])
							}
						}
						unresolved[R][label] = true
					}
				}
			})
		}
		if len(weapons) == 0 && len(unresolved["AAM"]) == 0 && len(unresolved["AGM"]) == 0 {
			return nil
		}
		rows[i] = &carrierRow{Weapons: sortedKeys(weapons),
			Complete:   map[string]bool{"AAM": len(unresolved["AAM"]) == 0, "AGM": len(unresolved["AGM"]) == 0},
			Unresolved: map[string][]string{"AAM": sortedKeys(unresolved["AAM"]), "AGM": sortedKeys(unresolved["AGM"])},
			Source:     paths[i], ContainerInputs: inputs, Blob: t.blobSHA(paths[i])}
		return nil
	})
	if err != nil {
		return nil, nil, err
	}
	carriers := map[string]*carrierRow{}
	for i, r := range rows {
		if r != nil {
			carriers[stem(paths[i])] = r
		}
	}
	families := map[string]string{}
	for _, e := range aliases {
		if !strings.Contains(e.Source, "untranslated internal identifier") {
			families[e.Model] = familyName(e.Model)
		}
	}
	for _, m := range reviewed {
		families[m] = familyName(m)
	}
	return sortedObj(families), sortedObj(carriers), nil
}

func truthy(v any) bool {
	switch x := v.(type) {
	case nil:
		return false
	case bool:
		return x
	case float64:
		return x != 0
	case string:
		return x != ""
	case []any:
		return len(x) > 0
	case *oMap:
		return len(x.keys) > 0
	}
	return true
}

func sortedKeys(m map[string]bool) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

// ---------------------------------------------------------------- countermeasures

var cmTypes = map[string]string{"flr": "Flare", "chff": "Chaff"}

func classifyBullets(v any) string {
	bullets := []any{v}
	if l, ok := v.([]any); ok {
		bullets = l
	}
	if len(bullets) == 0 {
		return ""
	}
	kinds := map[string]bool{}
	for _, b := range bullets {
		o, ok := b.(*oMap)
		if !ok {
			return ""
		}
		bt, _ := o.vals["bulletType"].(string)
		k, ok := cmTypes[bt]
		if !ok {
			return ""
		}
		kinds[k] = true
	}
	if len(kinds) != 1 {
		return ""
	}
	for k := range kinds {
		return k
	}
	return ""
}

func (g *tableGen) countermeasures() (kv, error) {
	t := g.tree
	launchers := map[string]kv{}
	unclassified := map[string][]string{}
	sources := map[string]kv{}
	for _, p := range t.files {
		if !strings.HasPrefix(p, "aces.vromfs.bin_u/gamedata/weapons/rocketguns/countermeasure") || !strings.HasSuffix(p, ".blkx") {
			continue
		}
		d, err := t.json(p)
		if err != nil {
			return nil, err
		}
		src, _ := d.(*oMap)
		if src == nil {
			continue
		}
		names := append([]string{}, src.keys...)
		sort.Strings(names)
		entries := map[string]string{}
		var skipped []string
		for _, name := range names {
			value := src.vals[name]
			var bullets any
			switch {
			case name == "bullet":
				bullets = value
			case func() bool { o, ok := value.(*oMap); _, has := o.get("bullet"); return ok && has }():
				bullets = value.(*oMap).vals["bullet"]
			default:
				if l, ok := value.([]any); ok {
					rep := false
					for _, e := range l {
						if o, ok := e.(*oMap); ok {
							if _, has := o.get("bullet"); has {
								rep = true
							}
						}
					}
					if rep {
						skipped = append(skipped, name)
					}
				}
				continue
			}
			if k := classifyBullets(bullets); k == "" {
				skipped = append(skipped, name)
			} else {
				entries[name] = k
			}
		}
		st := stem(p)
		launchers[st] = sortedObj(entries)
		raw, _ := t.raw(p)
		sources[st] = obj("bytes", len(raw), "path", p, "sha1", t.blobSHA(p))
		if len(skipped) > 0 {
			unclassified[st] = skipped
		}
	}
	return obj("schema", 1, "commit", g.commit, "launchers", sortedObj(launchers),
		"provenance", obj("builder", "wtassets tables (from tools/countermeasures/build_catalog.py)",
			"classification", "Outer bulletType only: flr=Flare; chff=Chaff. Mixed or unknown entries omitted.",
			"source", g.label, "sources", sortedObj(sources)),
		"unclassified", sortedObj(unclassified)), nil
}

// ---------------------------------------------------------------- radar modes

func sensorReference(spec any) string {
	o, ok := spec.(*oMap)
	if !ok {
		return ""
	}
	v, _ := o.vals["blk"].(string)
	if strings.TrimSpace(v) == "" {
		return ""
	}
	n := strings.TrimSpace(strings.ReplaceAll(v, "\\", "/"))
	at := strings.Index(strings.ToLower(n), "gamedata/sensors/")
	if at < 0 {
		return ""
	}
	return n[at+len("gamedata/sensors/"):]
}

func sensorSourceName(ref string) string {
	name := ref
	if i := strings.LastIndex(ref, "/"); i >= 0 {
		name = ref[i+1:]
	}
	l := strings.ToLower(name)
	if strings.HasSuffix(l, ".blk") {
		return name[:len(name)-4] + ".blkx"
	}
	if !strings.HasSuffix(l, ".blkx") {
		return name + ".blkx"
	}
	return name
}

func compactSensor(p string, d any) kv {
	data, _ := d.(*oMap)
	tr, _ := data.vals["transivers"].(*oMap)
	sp, _ := data.vals["scanPatterns"].(*oMap)
	sg, _ := data.vals["signals"].(*oMap)
	trs, sps, sgs := []any{}, []any{}, []string{}
	if tr != nil {
		for _, k := range tr.keys {
			v, _ := tr.vals[k].(*oMap)
			vis := ""
			if v != nil {
				if s, ok := v.vals["visibilityType"].(string); ok {
					vis = s
				}
			}
			active := true
			if v != nil {
				if a, ok := v.get("active"); ok && a == false {
					active = false
				}
			}
			trs = append(trs, obj("id", k, "visibility_type", vis, "active", active))
		}
	}
	if sp != nil {
		for _, k := range sp.keys {
			v, _ := sp.vals[k].(*oMap)
			types := []string{}
			if v != nil {
				switch x := v.vals["type"].(type) {
				case string:
					if strings.TrimSpace(x) != "" {
						types = []string{x}
					}
				case []any:
					for _, it := range x {
						if s, ok := it.(string); ok && strings.TrimSpace(s) != "" {
							types = append(types, s)
						}
					}
				}
			}
			rec := obj("id", k, "types", types)
			if v != nil {
				if w, ok := v.vals["width"].(float64); ok {
					rec = append(rec, obj("width_deg", w)...)
				}
				if h, ok := v.vals["barHeight"].(float64); ok {
					rec = append(rec, obj("bar_height_deg", h)...)
				}
			}
			sps = append(sps, rec)
		}
	}
	if sg != nil {
		sgs = append(sgs, sg.keys...)
	}
	name, _ := data.vals["name"].(string)
	typ, _ := data.vals["type"].(string)
	return obj("path", p, "name", name, "type", typ, "transceivers", trs, "scan_patterns", sps, "signals", sgs)
}

func (g *tableGen) radars() (kv, error) {
	t := g.tree
	const fmPrefix = "aces.vromfs.bin_u/gamedata/flightmodels/"
	const snPrefix = "aces.vromfs.bin_u/gamedata/sensors/"
	type config struct {
		model, stem, source string
		refs                []string
	}
	var configs []config
	referenced := map[string]bool{}
	sensorByName := map[string]string{}
	for _, p := range t.files {
		if strings.HasPrefix(p, snPrefix) && !strings.Contains(p[len(snPrefix):], "/") && strings.HasSuffix(p, ".blkx") {
			sensorByName[strings.ToLower(path.Base(p))] = p
		}
	}
	var fm []string
	for _, p := range t.files {
		if strings.HasPrefix(p, fmPrefix) && !strings.Contains(p[len(fmPrefix):], "/") && strings.HasSuffix(p, ".blkx") {
			fm = append(fm, p)
		}
	}
	parsed := make([]*config, len(fm))
	err := parallel(len(fm), func(i int) error {
		d, err := t.json(fm[i])
		if err != nil {
			return err
		}
		data, _ := d.(*oMap)
		sensors := data.obj("sensors")
		if sensors == nil {
			return nil
		}
		var entries []any
		switch x := sensors.vals["sensor"].(type) {
		case *oMap:
			entries = []any{x}
		case []any:
			entries = x
		default:
			return nil
		}
		var refs []string
		for _, e := range entries {
			if r := sensorReference(e); r != "" {
				refs = append(refs, r)
			}
		}
		if len(refs) == 0 {
			return nil
		}
		model, _ := data.vals["model"].(string)
		if strings.TrimSpace(model) == "" {
			model = stem(fm[i])
		}
		parsed[i] = &config{model: model, stem: stem(fm[i]), source: fm[i], refs: refs}
		return nil
	})
	if err != nil {
		return nil, err
	}
	dropped := 0
	for _, c := range parsed {
		if c == nil {
			continue
		}
		ok := true
		canon := make([]string, len(c.refs))
		for j, r := range c.refs {
			p, found := sensorByName[strings.ToLower(sensorSourceName(r))]
			if !found {
				ok = false // the Python generator stops; we drop this aircraft
				break
			}
			canon[j] = path.Base(p)
		}
		if !ok {
			dropped++
			continue
		}
		c.refs = canon
		configs = append(configs, *c)
		for _, r := range canon {
			referenced[r] = true
		}
	}
	if dropped > 0 {
		fmt.Printf("  radars: %d aircraft skipped (sensor file not found)\n", dropped)
	}
	sensors := map[string]kv{}
	for name := range referenced {
		p := sensorByName[strings.ToLower(name)]
		d, err := t.json(p)
		if err != nil {
			return nil, err
		}
		sensors[name] = compactSensor(p, d)
	}
	cands := map[string]map[string]map[string]bool{} // alias -> refs joined -> sources
	refsOf := map[string][]string{}
	for _, c := range configs {
		rk := strings.Join(c.refs, "\x00")
		refsOf[rk] = c.refs
		for _, root := range []string{c.model, c.stem} {
			for _, a := range []string{root, strings.ReplaceAll(root, "_", "-"), strings.ReplaceAll(root, "-", "_")} {
				a = strings.ToLower(strings.TrimSpace(a))
				if a == "" {
					continue
				}
				if cands[a] == nil {
					cands[a] = map[string]map[string]bool{}
				}
				if cands[a][rk] == nil {
					cands[a][rk] = map[string]bool{}
				}
				cands[a][rk][c.source] = true
			}
		}
	}
	models := map[string][]string{}
	ambiguous := map[string][]any{}
	for a, choices := range cands {
		if len(choices) == 1 {
			for rk := range choices {
				models[a] = refsOf[rk]
			}
			continue
		}
		rks := make([]string, 0, len(choices))
		for rk := range choices {
			rks = append(rks, rk)
		}
		sort.Slice(rks, func(i, j int) bool { return tupleLess(refsOf[rks[i]], refsOf[rks[j]]) })
		for _, rk := range rks {
			ambiguous[a] = append(ambiguous[a], obj("sensors", refsOf[rk], "sources", sortedKeys(choices[rk])))
		}
	}
	return obj("schema", 1,
		"source", obj("repository", g.label, "commit", g.commit, "flightmodels_tree", "", "sensors_tree", "",
			"flightmodels_path", strings.TrimSuffix(fmPrefix, "/"), "sensors_path", strings.TrimSuffix(snPrefix, "/"),
			"generator", "wtassets tables (from tools/radar-modes/build_radar_modes.py)",
			"note", "Sensor lists preserve the game-file list order, including RWR placeholders; ambiguous model aliases are omitted and listed separately."),
		"ambiguous_aliases", sortedObj(ambiguous), "models", sortedObj(models), "sensors", sortedObj(sensors)), nil
}

// tupleLess is Python's tuple ordering for lists of strings.
func tupleLess(a, b []string) bool {
	for i := 0; i < len(a) && i < len(b); i++ {
		if a[i] != b[i] {
			return a[i] < b[i]
		}
	}
	return len(a) < len(b)
}

// ---------------------------------------------------------------- driver

type tableGen struct {
	tree     *gameTree
	names    map[string]string
	langBlob string
	label    string // "Datamine <commit>" or "Local install <date>"
	commit   string // 40 hex digits (the decoder checks the length)
}

func parallel(n int, fn func(i int) error) error {
	var wg sync.WaitGroup
	var mu sync.Mutex
	var first error
	next := 0
	workers := 8
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				mu.Lock()
				i := next
				next++
				stop := first != nil
				mu.Unlock()
				if i >= n || stop {
					return
				}
				if err := fn(i); err != nil {
					mu.Lock()
					if first == nil {
						first = err
					}
					mu.Unlock()
				}
			}
		}()
	}
	wg.Wait()
	return first
}

func tablesCmd(args []string) error {
	fs := flag.NewFlagSet("tables", flag.ExitOnError)
	data := fs.String("data", "", "unpacked game data folder (from wtassets unpack)")
	out := fs.String("out", "", "output folder")
	datamine := fs.Bool("datamine", false, "-data is a War-Thunder-Datamine checkout (for checking the translation)")
	commit := fs.String("commit", "", "with -datamine: the checkout's commit")
	reviewed := fs.String("reviewed", "", "missile_models.json with hand-reviewed names (default: the decoder's copy next to the program, if any)")
	_ = fs.Parse(args)
	if *data == "" || *out == "" {
		return errors.New("-data and -out are required")
	}
	t, err := openTree(*data, *datamine)
	if err != nil {
		return err
	}
	if !t.has(langWeaponry) {
		return fmt.Errorf("%s not found in %s (unpack the lang archive too)", langWeaponry, *data)
	}
	names, err := englishNames(t)
	if err != nil {
		return err
	}
	g := &tableGen{tree: t, names: names, langBlob: t.blobSHA(langWeaponry)}
	if *datamine {
		g.label = "Datamine " + *commit
		g.commit = *commit
	} else {
		stamp := time.Now().UTC().Format("2006-01-02")
		g.label = "Local install " + stamp
		h := sha1.Sum([]byte("local install " + *data + " " + time.Now().UTC().Format(time.RFC3339)))
		g.commit = hex.EncodeToString(h[:])
	}
	if len(g.commit) != 40 {
		return errors.New("-commit must be the 40-character commit id")
	}
	if err := os.MkdirAll(*out, 0755); err != nil {
		return err
	}
	gen := []string{g.label}
	aam, err := g.missiles("AAM")
	if err != nil {
		return err
	}
	agm, err := g.missiles("AGM")
	if err != nil {
		return err
	}
	for _, x := range []struct {
		name, role string
		m          map[string]aliasEntry
	}{{"aam_models.json", "AAM", aam}, {"agm_models.json", "AGM", agm}} {
		models := map[string]bool{}
		for _, e := range x.m {
			models[e.Model] = true
		}
		if err := writeTable(*out, x.name, obj("schema", 1, "generated_from", append(gen,
			"wtassets tables --role "+x.role+" (from tools/agm/build_catalog.py); all rocketguns; explicit guided fields and English CSV"),
			"aliases", sortedObj(x.m), "replays", obj())); err != nil {
			return err
		}
		fmt.Printf("%-24s %d aliases, %d models\n", x.name, len(x.m), len(models))
	}
	bombs, err := g.bombs()
	if err != nil {
		return err
	}
	if err := writeTable(*out, "bomb_models.json", obj("schema", 1, "generated_from", append(gen,
		"wtassets tables (from tools/bombs/build_catalog.py); explicit BombGun and English CSV"),
		"aliases", sortedObj(bombs), "replays", obj())); err != nil {
		return err
	}
	fmt.Printf("%-24s %d aliases\n", "bomb_models.json", len(bombs))

	all := map[string]aliasEntry{}
	for k, v := range aam {
		all[k] = v
	}
	for k, v := range agm {
		all[k] = v
	}
	rev, err := reviewedModels(*reviewed)
	if err != nil {
		return err
	}
	families, carriers, err := g.carriers(all, rev)
	if err != nil {
		return err
	}
	if err := writeTable(*out, "missile_carriers.json", obj("schema", 1, "commit", g.commit, "families", families, "carriers", carriers)); err != nil {
		return err
	}
	fmt.Printf("%-24s %d aircraft, %d families\n", "missile_carriers.json", len(carriers), len(families))

	cm, err := g.countermeasures()
	if err != nil {
		return err
	}
	if err := writeTable(*out, "countermeasure_ammo.json", cm); err != nil {
		return err
	}
	fmt.Printf("%-24s written\n", "countermeasure_ammo.json")

	rm, err := g.radars()
	if err != nil {
		return err
	}
	if err := writeTable(*out, "radar_modes.json", rm); err != nil {
		return err
	}
	fmt.Printf("%-24s written\n", "radar_modes.json")
	return nil
}

//go:embed reviewed_missile_models.json
var embeddedReviewedMissiles []byte

// reviewedModels returns the model names of the hand-reviewed missile list,
// which the carrier table's family list also covers.
func reviewedModels(p string) ([]string, error) {
	var raw []byte
	if p != "" {
		b, err := os.ReadFile(p)
		if err != nil {
			return nil, err
		}
		raw = b
	} else {
		raw = embeddedReviewedMissiles
	}
	var t struct {
		Aliases map[string]struct {
			Model string `json:"model"`
		} `json:"aliases"`
	}
	if err := json.Unmarshal(raw, &t); err != nil {
		return nil, err
	}
	var out []string
	for _, a := range t.Aliases {
		out = append(out, a.Model)
	}
	return out, nil
}
