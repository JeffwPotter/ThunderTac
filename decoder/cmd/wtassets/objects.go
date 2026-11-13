// objects.go — ours. Hand-placed map objects (buildings, rocks, trees, walls…)
// from a level file's RIGz block ("rendinst generator" data).
//
// Layout from Gaijin's published DagorEngine source (BSD-3-Clause):
// prog/gameLibs/rendInst/rendInstGen.cpp (RendInstGenData::create,
// precomputeCell, processRiGenFromPregenData) and riGen/riGenData.h,
// riGen/genObjUtil.h (unpack_tm_full, unpack_tm_pos).
//
// The RIGz block holds two Dagor blocks:
//  1. a compressed memory image of RendInstGenData (64-bit layout, pointers
//     stored as offsets from the image start), followed by bitmaps we skip;
//  2. the "pregenerated" instance data: one compressed block per map cell at
//     block-2 start + cell.riDataRelOfs.
//
// Objects the game generates at load time from land-class density maps
// (forests, grass, scattered bushes) are not in this data.
package main

import (
	"bytes"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"encoding/binary"
	"errors"
	"fmt"
	"github.com/maxsupermanhd/wrpl-inspector/v3/wrpl"
	"math"

	"github.com/maxsupermanhd/wrpl-inspector/v3/oodle"
)

const riSubcellDiv = 8

// placedObject is one object instance in world coordinates.
type placedObject struct {
	Type int        // index into the type list
	Pos  [3]float64 // x east, y up, z north
	// Rot is the 3×3 transform (columns = local x, y, z axes in world space),
	// including scale. For position-only instances it is scale × identity.
	Rot [9]float64
}

type rigzData struct {
	Types          []string
	PosInst        []bool
	Objects        []placedObject
	CellsW, CellsH int
	CellSize       float64
	X0, Z0         float64
	TM32           bool
	SkippedCells   int
}

func findRIGz(b []byte) (int, error) {
	// the tag table at the start also lists "RIGz"; the real block is the one
	// preceded by its size and followed by a Dagor block header
	for o := 0; ; {
		i := bytes.Index(b[o:], []byte("RIGz"))
		if i < 0 {
			return 0, errors.New("no RIGz block")
		}
		p := o + i
		if p >= 4 {
			sz := int(binary.LittleEndian.Uint32(b[p-4:]))
			if sz > 16 && p+sz <= len(b)+8 && p+8 <= len(b) {
				h := binary.LittleEndian.Uint32(b[p+4:])
				if int(h&0x3fffffff)+8 <= sz {
					return p + 4, nil
				}
			}
		}
		o = p + 1
	}
}

func readRIGz(b []byte) (*rigzData, error) {
	p, err := findRIGz(b)
	if err != nil {
		return nil, err
	}
	le := binary.LittleEndian
	codec, payload, next, err := dagorBlock(b, p)
	if err != nil {
		return nil, err
	}
	var img []byte
	switch codec {
	case 2: // Oodle: u32 unpacked size first
		if len(payload) < 4 {
			return nil, errors.New("RIGz: short block")
		}
		img, err = oodle.Decompress(payload[4:], int(le.Uint32(payload)))
	case 1:
		img, err = zstdDec.DecodeAll(payload, nil)
	default:
		return nil, fmt.Errorf("RIGz: unsupported codec %d", codec)
	}
	if err != nil {
		return nil, fmt.Errorf("RIGz image: %w", err)
	}
	if len(img) < 4 {
		return nil, errors.New("RIGz: empty image")
	}
	dumpSz := int(le.Uint32(img))
	if dumpSz < 152 || 4+dumpSz > len(img) {
		return nil, fmt.Errorf("RIGz: bad image size %d", dumpSz)
	}
	d := img[4 : 4+dumpSz]
	if os.Getenv("RIGZ_DUMP") != "" {
		for i := 0; i < 160; i += 16 {
			fmt.Printf("%3d: % x\n", i, d[i:i+16])
		}
	}
	// second block: pregenerated instances
	if next+4 > len(b) {
		return nil, errors.New("RIGz: no instance block")
	}
	pregenBase := next + 4

	u32 := func(o int) uint32 { return le.Uint32(d[o:]) }
	i32 := func(o int) int32 { return int32(le.Uint32(d[o:])) }
	f32 := func(o int) float64 { return float64(math.Float32frombits(le.Uint32(d[o:]))) }
	ptr := func(o int) int { return int(le.Uint32(d[o:])) } // offsets from the image start (low 32 bits)
	cstr := func(o int) string {
		if o <= 0 || o >= len(d) {
			return ""
		}
		e := bytes.IndexByte(d[o:], 0)
		if e < 0 {
			return ""
		}
		return string(d[o : o+e])
	}

	// Tabs are {u32 offset, u32 count, 8 bytes unused}
	cellsOfs, nCells := ptr(8), int(u32(12))
	cw, ch := int(i32(24)), int(i32(28))
	cellSz := int(int16(le.Uint16(d[32:])))
	flags := d[34]
	perInst := int(d[35])
	world0x, world0z := f32(64), f32(68)
	grid2world := f32(112)
	pregenOfs, nPregen := ptr(128), int(u32(132))
	if nCells != cw*ch || nCells <= 0 || nCells > 1<<20 || nPregen < 0 || nPregen > 1<<16 || cellsOfs+nCells*552 > len(d) || pregenOfs+nPregen*32 > len(d) {
		return nil, fmt.Errorf("RIGz: unexpected header (cells %d = %d×%d, types %d)", nCells, cw, ch, nPregen)
	}
	r := &rigzData{CellsW: cw, CellsH: ch, CellSize: grid2world * float64(cellSz), X0: world0x, Z0: world0z}
	for i := 0; i < nPregen; i++ {
		o := pregenOfs + i*32
		r.Types = append(r.Types, cstr(ptr(o+8)))
		r.PosInst = append(r.PosInst, u32(o+24)&1 != 0)
	}
	zeroSeeds := make([]bool, nPregen)
	palRot := make([]bool, nPregen)
	for i := 0; i < nPregen; i++ {
		bits := u32(pregenOfs + i*32 + 24)
		palRot[i] = bits&2 != 0
		zeroSeeds[i] = bits&4 != 0
	}
	// counters: new format = {u32 idx, u32 count}; old = packed u32
	newFmt := flags&1 != 0
	cntSize := 4
	if newFmt {
		cntSize = 8
	}
	counter := func(o int) (idx, cnt int) {
		if newFmt {
			return int(u32(o)), int(u32(o + 4))
		}
		v := u32(o)
		return int(v&0x3ff) + int(v>>30)<<10, int(v >> 10 & 0xfffff)
	}

	// Decide the instance layout (16- or 32-bit transforms) on the first cell
	// with transform instances: the rotation part must be a scaled rotation.
	type cellJob struct {
		x, z, htMin, htDelta, rel int
		cnts                      [][2]int // per subcell list flattened: (type, count)
		sub                       []int
	}
	var jobs []cellJob
	for ci := 0; ci < nCells; ci++ {
		o := cellsOfs + ci*552
		htMin := int(int16(le.Uint16(d[o+24:])))
		htDelta := int(int16(le.Uint16(d[o+26:])))
		rel := int(i32(o + 28))
		if rel < 0 {
			continue
		}
		j := cellJob{x: ci % cw, z: ci / cw, htMin: htMin, htDelta: htDelta, rel: rel}
		for s := 0; s < riSubcellDiv*riSubcellDiv; s++ {
			a, e := ptr(o+32+s*8), ptr(o+32+(s+1)*8)
			if a < 0 || e < a || e > len(d) {
				break
			}
			for q := a; q < e; q += cntSize {
				idx, cnt := counter(q)
				if idx < nPregen && cnt > 0 {
					j.cnts = append(j.cnts, [2]int{idx, cnt})
					j.sub = append(j.sub, s)
				}
			}
		}
		if len(j.cnts) > 0 {
			jobs = append(jobs, j)
		}
	}

	stride := func(t int, tm32 bool) int {
		s := 24
		if r.PosInst[t] {
			s = 8
		} else if tm32 {
			s = 48
		}
		if !zeroSeeds[t] {
			s += 4 * perInst
		}
		return s
	}
	unpackCell := func(j cellJob) ([]byte, error) {
		q := pregenBase + j.rel
		c, pl, _, err := dagorBlock(b, q)
		if err != nil {
			return nil, err
		}
		switch c {
		case 1:
			return zstdDec.DecodeAll(pl, nil)
		case 2:
			if len(pl) < 4 {
				return nil, errors.New("short block")
			}
			return oodle.Decompress(pl[4:], int(le.Uint32(pl)))
		case 0:
			return pl, nil
		}
		return nil, fmt.Errorf("codec %d", c)
	}
	need := func(j cellJob, tm32 bool) int {
		n := 0
		for _, c := range j.cnts {
			n += c[1] * stride(c[0], tm32)
		}
		return n
	}
	// pick the layout whose total size matches the unpacked cell data
	decided, tm32 := false, false
	for _, j := range jobs {
		raw, err := unpackCell(j)
		if err != nil {
			r.SkippedCells++
			continue
		}
		if !decided {
			a, bb := need(j, false), need(j, true)
			switch {
			case len(raw) == a && a != bb:
				tm32, decided = false, true
			case len(raw) == bb && a != bb:
				tm32, decided = true, true
			case len(raw) == a:
				// all position-only: either works
			default:
				r.SkippedCells++
				continue
			}
		}
		if len(raw) < need(j, tm32) {
			r.SkippedCells++
			continue
		}
		cellXZ := r.CellSize
		ox := world0x + float64(j.x)*cellXZ
		oz := world0z + float64(j.z)*cellXZ
		dy := float64(j.htDelta)
		if dy == 0 {
			dy = 8192
		}
		mx, my := cellXZ/32767, dy/32767
		ofs := 0
		for _, c := range j.cnts {
			t, cnt := c[0], c[1]
			st := stride(t, tm32)
			for k := 0; k < cnt; k++ {
				e := raw[ofs : ofs+st]
				ofs += st
				s16 := func(i int) float64 { return float64(int16(le.Uint16(e[2*i:]))) }
				s32 := func(i int) float64 { return float64(int32(le.Uint32(e[4*i:]))) }
				var obj placedObject
				obj.Type = t
				if r.PosInst[t] {
					if le.Uint16(e[6:]) == 0 {
						continue // removed instance (scale word 0)
					}
					sc := 0.0
					w := le.Uint16(e[6:])
					if palRot[t] {
						sc = float64(w&^riPaletteMask) / 256
					} else {
						sc = float64(int16(w)) / 256
					}
					obj.Pos = [3]float64{s16(0)*mx + ox, s16(1)*my + float64(j.htMin), s16(2)*mx + oz}
					obj.Rot = [9]float64{sc, 0, 0, 0, sc, 0, 0, 0, sc}
				} else if tm32 {
					k8 := 1.0 / 256 / 65536
					obj.Rot = [9]float64{s32(0) * k8, s32(4) * k8, s32(8) * k8, s32(1) * k8, s32(5) * k8, s32(9) * k8, s32(2) * k8, s32(6) * k8, s32(10) * k8}
					obj.Pos = [3]float64{s32(3)*mx/65536 + ox, s32(7)*my/65536 + float64(j.htMin), s32(11)*mx/65536 + oz}
				} else {
					obj.Rot = [9]float64{s16(0) / 256, s16(4) / 256, s16(8) / 256, s16(1) / 256, s16(5) / 256, s16(9) / 256, s16(2) / 256, s16(6) / 256, s16(10) / 256}
					obj.Pos = [3]float64{s16(3)*mx + ox, s16(7)*my + float64(j.htMin), s16(11)*mx + oz}
				}
				if obj.Rot == ([9]float64{}) {
					continue
				}
				r.Objects = append(r.Objects, obj)
			}
		}
	}
	r.TM32 = tm32
	return r, nil
}

// palette id bits in the scale word of position-only instances
// (PALETTE_ID_BIT_COUNT in the engine; the scale keeps the upper bits).
const riPaletteMask = 0x7

// objectsDebug: wtassets objects-debug <level.bin> — summary of the decoded objects.
func objectsDebug(args []string) error {
	if len(args) < 1 {
		return errors.New("usage: wtassets objects-debug <level.bin>")
	}
	b, err := os.ReadFile(args[0])
	if err != nil {
		return err
	}
	r, err := readRIGz(b)
	if err != nil {
		return err
	}
	fmt.Printf("cells %d x %d of %.1f m, origin %.0f,%.0f, types %d, objects %d, tm32 %v, skipped cells %d\n",
		r.CellsW, r.CellsH, r.CellSize, r.X0, r.Z0, len(r.Types), len(r.Objects), r.TM32, r.SkippedCells)
	cnt := map[int]int{}
	for _, o := range r.Objects {
		cnt[o.Type]++
	}
	type kv struct{ n, c int }
	var l []kv
	for k, v := range cnt {
		l = append(l, kv{k, v})
	}
	sort.Slice(l, func(i, j int) bool { return l[i].c > l[j].c })
	for i, e := range l {
		if i >= 25 {
			break
		}
		fmt.Printf("%6d  %s (posInst %v)\n", e.c, r.Types[e.n], r.PosInst[e.n])
	}
	for i := 0; i < len(r.Objects) && i < 8; i++ {
		o := r.Objects[i*len(r.Objects)/8]
		fmt.Printf("  %s at %.1f %.1f %.1f rot %.2f %.2f %.2f | %.2f %.2f %.2f | %.2f %.2f %.2f\n", r.Types[o.Type], o.Pos[0], o.Pos[1], o.Pos[2],
			o.Rot[0], o.Rot[1], o.Rot[2], o.Rot[3], o.Rot[4], o.Rot[5], o.Rot[6], o.Rot[7], o.Rot[8])
	}
	return nil
}

// ---------------------------------------------------------------- object types

// objType is what we keep of an object type from riDesc.bin.
type objType struct {
	Name string     `json:"name"`
	Kind string     `json:"kind"` // building | wall | rock | tree
	Min  [3]float64 `json:"min"`  // local bounding box (x right, y up, z forward)
	Max  [3]float64 `json:"max"`
}

// riDescs holds the object type descriptions of the game install (filled by
// loadRiDescs before levels are built; read-only afterwards).
var riDescs map[string]map[string]any

// loadRiDescs reads every content*/**/res/riDesc.bin under the game folder.
// riDesc.bin: u8 type (2 = FAT_ZSTD), u24 packed size, zstd stream of a FAT BLK.
func loadRiDescs(game string) (int, error) {
	var files []string
	for _, pat := range []string{"content/*/res/riDesc.bin", "content.hq/*/res/riDesc.bin"} {
		l, _ := filepath.Glob(filepath.Join(game, filepath.FromSlash(pat)))
		files = append(files, l...)
	}
	if len(files) == 0 {
		return 0, errors.New("no riDesc.bin found under content\\*\\res")
	}
	out := map[string]map[string]any{}
	for _, f := range files {
		b, err := os.ReadFile(f)
		if err != nil || len(b) < 8 {
			continue
		}
		raw, err := zstdDec.DecodeAll(b[4:], nil)
		if err != nil {
			continue
		}
		m, err := wrpl.ParseBlk(raw)
		if err != nil {
			continue
		}
		for k, v := range m {
			if d, ok := v.(map[string]any); ok {
				if _, seen := out[k]; !seen {
					out[k] = d
				}
			}
		}
	}
	if len(out) == 0 {
		return 0, errors.New("riDesc.bin could not be read")
	}
	riDescs = out
	return len(out), nil
}

func vec3(v any) ([3]float64, bool) {
	l, ok := v.([]any)
	if !ok || len(l) < 3 {
		return [3]float64{}, false
	}
	var r [3]float64
	for i := 0; i < 3; i++ {
		f, ok := l[i].(float64)
		if !ok {
			return r, false
		}
		r[i] = f
	}
	return r, true
}

// classifyObject decides what to draw. Small props (jugs, windows, shutters,
// barrels, benches, sleepers) are dropped: they would only clutter the map.
func classifyObject(name string, d map[string]any) (objType, bool) {
	t := objType{Name: name}
	mn, ok1 := vec3(d["bbox0"])
	mx, ok2 := vec3(d["bbox1"])
	if !ok1 || !ok2 {
		return t, false
	}
	t.Min, t.Max = mn, mx
	n := strings.ToLower(name)
	// not solid, or drawn by something else: destruction pieces ("_dp_"),
	// things vehicles drive over or through
	for _, skip := range []string{"_dp_", "_dmg_part", "snowdrift", "trench", "awning", "tent", "camo_net", "sunshade", "canopy",
		"decal", "soil", "debris", "bridge", "pontoon", "road_", "rails", "sleeper", "puddle", "crater", "grass", "flower"} {
		if strings.Contains(n, skip) {
			return t, false
		}
	}
	tree := strings.Contains(n, "tree") || strings.Contains(n, "bush") || strings.Contains(n, "palm") || strings.Contains(n, "pine") || strings.Contains(n, "spruce")
	if !tree {
		if _, ok := d["hasImpostor"]; ok {
			tree = true
		}
	}
	if !tree {
		if mm, ok := d["mat"].(map[string]any); ok {
			for _, x := range asList(mm["mat"]) {
				if m, ok := x.(map[string]any); ok {
					if c, _ := m["cls"].(string); strings.Contains(c, "tree") {
						tree = true
					}
				}
			}
		}
	}
	w, h, l := mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]
	long, short := math.Max(w, l), math.Min(w, l)
	switch {
	case tree:
		if h < 1.2 {
			return t, false
		}
		t.Kind = "tree"
	case strings.Contains(n, "rock") || strings.Contains(n, "stone") || strings.Contains(n, "cliff") || strings.Contains(n, "boulder"):
		if long < 1.5 || h < 0.8 {
			return t, false
		}
		t.Kind = "rock"
	case h >= 1.0 && long >= 2.5 && short < 1.0:
		t.Kind = "wall" // fences, walls, barricades: long and thin
	case h >= 2.0 && short >= 2.0:
		t.Kind = "building"
	default:
		return t, false
	}
	return t, true
}

// buildObjects returns the objects.bin and objects.json entries of a .wtt for
// one level, or nil when the level has no placed objects or riDesc is missing.
// objects.bin: per object u16 type, u16 0, then f32 x, y, z and the 3×3
// transform columns (local x, y, z axes in world space, scale included) = 52 bytes.
func buildObjects(level []byte) ([]byte, map[string]any, string) {
	if riDescs == nil {
		return nil, nil, ""
	}
	r, err := readRIGz(level)
	if err != nil || len(r.Objects) == 0 {
		return nil, nil, ""
	}
	typeOf := map[int]int{} // RIGz type -> output type (-1 = dropped)
	var types []objType
	missing := 0
	var raw bytes.Buffer
	kinds := map[string]int{}
	le := binary.LittleEndian
	var tmp [52]byte
	for _, o := range r.Objects {
		oi, seen := typeOf[o.Type]
		if !seen {
			oi = -1
			if d, ok := riDescs[r.Types[o.Type]]; ok {
				if t, keep := classifyObject(r.Types[o.Type], d); keep {
					oi = len(types)
					types = append(types, t)
				}
			} else {
				missing++
			}
			typeOf[o.Type] = oi
		}
		if oi < 0 {
			continue
		}
		if types[oi].Kind == "rock" {
			// Terrain-scale formations (scaled to 60 m and more, often hundreds
			// of metres and mostly buried) are left out: the terrain already
			// has their shape, and a box or blob would badly overstate them.
			big := 0.0
			for a := 0; a < 3; a++ {
				ln := math.Sqrt(o.Rot[3*a]*o.Rot[3*a] + o.Rot[3*a+1]*o.Rot[3*a+1] + o.Rot[3*a+2]*o.Rot[3*a+2])
				big = math.Max(big, ln*(types[oi].Max[a]-types[oi].Min[a]))
			}
			if big > 60 {
				kinds["rockTooLarge"]++
				continue
			}
		}
		le.PutUint16(tmp[0:], uint16(oi))
		le.PutUint16(tmp[2:], 0)
		for i := 0; i < 3; i++ {
			le.PutUint32(tmp[4+4*i:], math.Float32bits(float32(o.Pos[i])))
		}
		for i := 0; i < 9; i++ {
			le.PutUint32(tmp[16+4*i:], math.Float32bits(float32(o.Rot[i])))
		}
		raw.Write(tmp[:])
		kinds[types[oi].Kind]++
	}
	if raw.Len() == 0 {
		return nil, nil, ""
	}
	n := raw.Len() / 52
	meta := map[string]any{"count": n, "types": types, "byKind": kinds, "placedInLevel": len(r.Objects), "typesWithoutDescription": missing,
		"note": "hand-placed objects only (forests generated from land-class density maps are not included); boxes from riDesc.bin"}
	return raw.Bytes(), meta, fmt.Sprintf("%d objects (%d buildings, %d walls, %d rocks, %d trees)", n, kinds["building"], kinds["wall"], kinds["rock"], kinds["tree"])
}
