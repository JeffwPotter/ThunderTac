// OURS. wtassets terrain: builds a .wtt terrain file for every map from the
// level files of a local War Thunder install.
//
//	wtassets terrain -game <War Thunder folder> -out <folder> [-match substring] [-grid 1024]
//
// Height source per level (see docs/terrain-notes.md):
//   - HM2 heightmap, when the level has one that covers the whole map;
//   - otherwise the LTS4 collision mesh: its triangles (from the BVH leaves)
//     are rasterised at every cell centre; any cell no triangle covers takes
//     the nearest covered cell's height, then is smoothed.
//
// Each level is built until two builds are identical (see safeBuild).
//
// Map corners and water level come from levels/<level>.blk in aces.vromfs.bin.
package main

import (
	"archive/zip"
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/klauspost/compress/zstd"
	"github.com/maxsupermanhd/wrpl-inspector/v3/oodle"
	"github.com/maxsupermanhd/wrpl-inspector/v3/wrpl"
	"github.com/maxsupermanhd/wrpl-inspector/v3/wtcontent"
)

type levelInfo struct {
	x0, z0, x1, z1 float64
	water          float64
	hasCoords      bool
}

func terrainCmd(args []string) error {
	fs := flag.NewFlagSet("terrain", flag.ExitOnError)
	game := fs.String("game", "", "War Thunder install folder")
	out := fs.String("out", "", "output folder for .wtt files")
	match := fs.String("match", "", "only levels whose file name contains this text")
	gridN := fs.Int("grid", 1024, "grid size (cells per side)")
	workers := fs.Int("workers", 0, "levels processed at once (0 = automatic)")
	_ = fs.Parse(args)
	if *game == "" || *out == "" {
		return fmt.Errorf("-game and -out are required")
	}
	if err := os.MkdirAll(*out, 0755); err != nil {
		return err
	}
	infos, err := readLevelBlks(filepath.Join(*game, "aces.vromfs.bin"))
	if err != nil {
		fmt.Fprintln(os.Stderr, "warning: map corners not available:", err)
		infos = map[string]levelInfo{}
	}
	files, _ := filepath.Glob(filepath.Join(*game, "levels", "*.bin"))
	sort.Strings(files)
	var todo []string
	for _, f := range files {
		stem := strings.ToLower(strings.TrimSuffix(filepath.Base(f), ".bin"))
		if *match != "" && !strings.Contains(stem, strings.ToLower(*match)) {
			continue
		}
		todo = append(todo, f)
	}
	if len(todo) == 0 {
		return fmt.Errorf("no level files found in %s", filepath.Join(*game, "levels"))
	}
	n := *workers
	if n <= 0 {
		n = runtime.NumCPU()
		if n > 4 {
			n = 4 // each level needs up to a few hundred MB while it is processed
		}
	}
	type result struct {
		stem, msg string
		ok        bool
	}
	jobs := make(chan string)
	results := make(chan result)
	var wg sync.WaitGroup
	for w := 0; w < n; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for f := range jobs {
				stem := strings.ToLower(strings.TrimSuffix(filepath.Base(f), ".bin"))
				msg, err := safeBuild(f, stem, infos[stem], *gridN, *out)
				if err != nil {
					results <- result{stem, err.Error(), false}
				} else {
					results <- result{stem, msg, true}
				}
			}
		}()
	}
	go func() {
		for _, f := range todo {
			jobs <- f
		}
		close(jobs)
		wg.Wait()
		close(results)
	}()
	ok, skipped := 0, 0
	for r := range results {
		if r.ok {
			ok++
			fmt.Printf("%-32s %s\n", r.stem, r.msg)
		} else {
			skipped++
			fmt.Printf("%-32s skipped: %s\n", r.stem, r.msg)
		}
	}
	fmt.Printf("terrain: %d written, %d skipped\n", ok, skipped)
	return nil
}

// builtLevel is one finished terrain, ready to write.
type builtLevel struct {
	meta map[string]any
	raw  []byte
	msg  string
}

func (a *builtLevel) same(b *builtLevel) bool {
	if a == nil || b == nil || !bytes.Equal(a.raw, b.raw) {
		return false
	}
	for _, k := range []string{"x0", "z0", "x1", "z1", "hMin", "hMax", "source"} {
		if fmt.Sprint(a.meta[k]) != fmt.Sprint(b.meta[k]) {
			return false
		}
	}
	return true
}

// safeBuild builds a level until two builds agree exactly (at most six
// tries), then writes it. On a machine that makes occasional calculation
// errors (seen on the development PC) a single build can fail or, rarely,
// be silently wrong; two identical builds rule that out. A crash on
// unexpected data counts as a failed try.
func safeBuild(path, stem string, li levelInfo, n int, outDir string) (string, error) {
	try := func() (bl *builtLevel, err error) {
		defer func() {
			if r := recover(); r != nil {
				err = fmt.Errorf("unexpected data (%v)", r)
			}
		}()
		return buildTerrain(path, stem, li, n)
	}
	var good []*builtLevel
	var lastErr error
	fails := 0
	for attempt := 0; attempt < 6; attempt++ {
		bl, err := try()
		if err != nil {
			lastErr = err
			fails++
			continue
		}
		for _, g := range good {
			if g.same(bl) {
				if err := writeWTT(outDir, stem, bl); err != nil {
					return "", err
				}
				msg := bl.msg
				if fails > 0 || len(good) > 1 {
					msg += fmt.Sprintf(" (needed %d builds to get two identical ones)", attempt+1)
				}
				return msg, nil
			}
		}
		good = append(good, bl)
	}
	if len(good) == 0 && lastErr != nil {
		return "", lastErr
	}
	return "", fmt.Errorf("no two of six builds agreed (%d failed: %v) - the computer may be making calculation errors", fails, lastErr)
}

func writeWTT(outDir, stem string, bl *builtLevel) error {
	js, _ := json.MarshalIndent(bl.meta, "", " ")
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, e := range []struct {
		name string
		data []byte
	}{{"terrain.json", js}, {"height.u16", bl.raw}} {
		w, err := zw.Create(e.name)
		if err != nil {
			return err
		}
		if _, err := w.Write(e.data); err != nil {
			return err
		}
	}
	if err := zw.Close(); err != nil {
		return err
	}
	tmp := filepath.Join(outDir, stem+".wtt.tmp")
	if err := os.WriteFile(tmp, buf.Bytes(), 0644); err != nil {
		return err
	}
	return os.Rename(tmp, filepath.Join(outDir, stem+".wtt"))
}

// readLevelBlks reads map corners and water level for every level from aces.vromfs.bin.
func readLevelBlks(path string) (map[string]levelInfo, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	vrom, err := wtcontent.ReadVROMFS(data)
	if err != nil {
		return nil, err
	}
	var nameMap []string
	var dict []byte
	for entry, content := range vrom.Files {
		if strings.HasSuffix(entry, "nm") && strings.Contains(entry, "?") {
			if nm, err := wrpl.ParseNameMap(content); err == nil {
				nameMap = nm
			}
		}
		if strings.HasSuffix(entry, ".dict") {
			dict = content
		}
	}
	out := map[string]levelInfo{}
	for entry, content := range vrom.Files {
		e := strings.ToLower(strings.ReplaceAll(entry, "\\", "/"))
		if !strings.HasPrefix(e, "levels/") || !strings.HasSuffix(e, ".blk") || strings.Count(e, "/") != 1 {
			continue
		}
		parsed, err := wrpl.ParseBlkAny(content, nameMap, dict)
		if err != nil {
			continue
		}
		js, err := json.Marshal(jsonSafe(parsed))
		if err != nil {
			continue
		}
		var m map[string]any
		if json.Unmarshal(js, &m) != nil {
			continue
		}
		var li levelInfo
		if v := num2(m["mapCoord0"]); v != nil {
			if w := num2(m["mapCoord1"]); w != nil {
				li.x0, li.z0, li.x1, li.z1 = v[0], v[1], w[0], w[1]
				li.hasCoords = li.x1 > li.x0 && li.z1 > li.z0
			}
		}
		if w, ok := m["water_level"].(float64); ok {
			li.water = w
		}
		out[strings.TrimSuffix(strings.TrimPrefix(e, "levels/"), ".blk")] = li
	}
	return out, nil
}

func num2(v any) []float64 {
	l, ok := v.([]any)
	if !ok || len(l) < 2 {
		return nil
	}
	a, ok1 := l[0].(float64)
	b, ok2 := l[1].(float64)
	if !ok1 || !ok2 {
		return nil
	}
	return []float64{a, b}
}

// ---------------------------------------------------------------- level file

// dagorBlock reads one engine block at p: u32 (codec<<30 | length), payload.
func dagorBlock(b []byte, p int) (codec int, payload []byte, next int, err error) {
	if p < 0 || p+4 > len(b) {
		return 0, nil, 0, errors.New("block header out of range")
	}
	h := binary.LittleEndian.Uint32(b[p:])
	codec = int(h >> 30)
	ln := int(h & 0x3fffffff)
	if p+4+ln > len(b) {
		return 0, nil, 0, errors.New("block runs past the end of the file")
	}
	return codec, b[p+4 : p+4+ln], p + 4 + ln, nil
}

var zstdDec, _ = zstd.NewReader(nil, zstd.WithDecoderMaxMemory(1<<31))

// unpackBlock decompresses a block payload to exactly size bytes.
func unpackBlock(codec int, payload []byte, size int) ([]byte, error) {
	switch codec {
	case 0:
		if len(payload) < size {
			return nil, errors.New("stored block too short")
		}
		return payload[:size], nil
	case 1:
		d, err := zstdDec.DecodeAll(payload, make([]byte, 0, size))
		if err != nil {
			return nil, err
		}
		if len(d) != size {
			return nil, fmt.Errorf("zstd block is %d bytes, expected %d", len(d), size)
		}
		return d, nil
	case 2:
		return oodle.Decompress(payload, size)
	}
	return nil, fmt.Errorf("unknown block codec %d", codec)
}

// ---------------------------------------------------------------- LTS4 mesh

type lts4 struct {
	cellsX, cellsY int
	cellSize       float64
	ox, oz         float64
	xs, ys, zs     []float64
	tris           []int32 // vertex index triples (into xs/ys/zs)
}

func sx13(v uint32) int32 { return int32(v<<19) >> 19 }

// leafTris expands one BVH leaf (W0..W3, W1 low 24 bits = apex vertex index)
// into its 1-4 triangles. Layout from DagorEngine swBLASLeafDefs.hlsli /
// dag_swBLAS_leaf.h (expandQuadLeafTris), BSD-3-Clause.
func leafTris(w0, w1, w2, w3 uint32, base, nv int32, emit func(a, b, c int32)) {
	apex := int32(w1 & 0xFFFFFF)
	o1 := sx13(w0)
	o2 := sx13(w0 >> 13)
	o3 := sx13(((w0 >> 26) & 0x1F) | ((w1 >> 24) << 5))
	deltaB := int32(w2 & 0xFFFF)
	o1b := sx13(w2 >> 16)
	o2b := sx13(w3)
	o3b := sx13(w3 >> 13)
	flipA := w2&(1<<29) != 0
	flipB := w2&(1<<30) != 0
	ok := func(i int32) bool { return i >= 0 && i < nv }
	tri := func(a, b, c int32) {
		if ok(a) && ok(b) && ok(c) {
			emit(base+a, base+b, base+c)
		}
	}
	tri(apex, apex+o1, apex+o2)
	if o3 != o2 {
		if flipA {
			tri(apex+o2, apex+o1, apex+o3)
		} else {
			tri(apex+o1, apex+o2, apex+o3)
		}
	}
	if o1b != o2b {
		b := apex + deltaB
		tri(b, b+o1b, b+o2b)
		if o3b != o2b {
			if flipB {
				tri(b+o2b, b+o1b, b+o3b)
			} else {
				tri(b+o1b, b+o2b, b+o3b)
			}
		}
	}
}

func findLTS4(b []byte) (body []byte, codec int, ok bool) {
	best := -1
	o := 0
	for {
		i := bytes.Index(b[o:], []byte("LTS4"))
		if i < 0 {
			break
		}
		o += i
		if o+8 <= len(b) {
			h := binary.LittleEndian.Uint32(b[o+4:])
			c, ln := int(h>>30), int(h&0x3fffffff)
			if (c == 1 || c == 2) && ln > 16 && ln < len(b)-o-8 && ln > best {
				best = ln
				body, codec, ok = b[o+8:o+8+ln], c, true
			}
		}
		o++
	}
	return
}

func readLTS4(b []byte) (*lts4, error) {
	body, codec, ok := findLTS4(b)
	if !ok {
		return nil, errors.New("no LTS4 mesh")
	}
	var s []byte
	var err error
	if codec == 2 {
		if len(body) < 4 {
			return nil, errors.New("LTS4 block too short")
		}
		size := int(binary.LittleEndian.Uint32(body))
		if size <= 0 || size > 1<<30 {
			return nil, errors.New("LTS4 size out of range")
		}
		s, err = oodle.Decompress(body[4:], size)
	} else {
		s, err = zstdDec.DecodeAll(body, nil)
	}
	if err != nil {
		return nil, fmt.Errorf("LTS4: %w", err)
	}
	if len(s) < 56 || string(s[:4]) != "LTS4" {
		return nil, errors.New("LTS4 stream has wrong magic")
	}
	le := binary.LittleEndian
	f32 := func(p int) float64 { return float64(math.Float32frombits(le.Uint32(s[p:]))) }
	m := &lts4{cellsX: int(int32(le.Uint32(s[8:]))), cellsY: int(int32(le.Uint32(s[12:]))), cellSize: f32(16), ox: f32(20), oz: f32(28)}
	if m.cellsX <= 0 || m.cellsY <= 0 || m.cellsX*m.cellsY > 1<<20 {
		return nil, errors.New("LTS4 grid out of range")
	}
	p := 56
	emit := func(a, b, c int32) { m.tris = append(m.tris, a, b, c) }
	need := func(n int) error {
		if p+n > len(s) {
			return errors.New("LTS4 stream ends early")
		}
		return nil
	}
	for ci := 0; ci < m.cellsX*m.cellsY; ci++ {
		if err := need(4); err != nil {
			return nil, err
		}
		has := le.Uint32(s[p:])
		p += 4
		if has == 0 {
			continue
		}
		if err := need(32 + 40); err != nil {
			return nil, err
		}
		var scale, ofs [3]float64
		for k := 0; k < 3; k++ {
			scale[k] = f32(p + 4*k)
			ofs[k] = f32(p + 16 + 4*k)
		}
		p += 32
		if string(s[p:p+4]) != "dBLi" {
			return nil, fmt.Errorf("LTS4 cell %d: missing mesh blob", ci)
		}
		version := le.Uint16(s[p+4:])
		stride := int(s[p+6])
		leafSize := int(s[p+7])
		treeBytes := int(le.Uint32(s[p+8:]))
		nv := int(le.Uint32(s[p+12:]))
		p += 40
		ioFlags := uint32(0)
		if version >= 2 {
			if err := need(4); err != nil {
				return nil, err
			}
			ioFlags = le.Uint32(s[p:])
			p += 4
		}
		// stride 8: packed "vert21" (21 bits per axis, 1/32 units); stride 12: plain float3
		if stride != 8 && stride != 12 {
			return nil, fmt.Errorf("LTS4 cell %d: vertex size %d not supported", ci, stride)
		}
		if err := need(nv * stride); err != nil {
			return nil, err
		}
		vbase := int32(len(m.xs))
		for k := 0; k < nv; k++ {
			var x, y, z float64
			if stride == 8 {
				raw := le.Uint64(s[p+8*k:])
				const mask = (1 << 21) - 1
				x = float64(raw&mask) / 32
				y = float64((raw>>21)&mask) / 32
				z = float64((raw>>42)&mask) / 32
			} else {
				x, y, z = f32(p+12*k), f32(p+12*k+4), f32(p+12*k+8)
			}
			m.xs = append(m.xs, (x-ofs[0])/scale[0])
			m.ys = append(m.ys, (y-ofs[1])/scale[1])
			m.zs = append(m.zs, (z-ofs[2])/scale[2])
		}
		p += nv * stride
		// tree stream (skipped; only its length matters)
		dst, leaves := 0, 0
		for dst < treeBytes {
			pending := 1
			for pending > 0 {
				if err := need(1); err != nil {
					return nil, err
				}
				cc := s[p]
				p++
				pending--
				switch {
				case cc == 0 || cc == 0xFF:
					if err := need(16); err != nil {
						return nil, err
					}
					if cc == 0 {
						leafTris(le.Uint32(s[p:]), le.Uint32(s[p+4:]), le.Uint32(s[p+8:]), le.Uint32(s[p+12:]), vbase, int32(nv), emit)
					}
					p += 16
					dst += leafSize
					leaves++
				case cc == 0xFE || cc == 0xFD:
					if err := need(8); err != nil {
						return nil, err
					}
					w2 := uint32(0)
					if cc == 0xFD {
						w2 = 1 << 29
					}
					leafTris(le.Uint32(s[p:]), le.Uint32(s[p+4:]), w2, 0, vbase, int32(nv), emit)
					p += 8
					dst += leafSize
					leaves++
				default:
					dst += 16
					pending += int(cc)
				}
			}
		}
		if dst != treeBytes {
			return nil, fmt.Errorf("LTS4 cell %d: tree size mismatch", ci)
		}
		if ioFlags&1 != 0 {
			p += leaves * 2
		}
	}
	if p != len(s) {
		return nil, fmt.Errorf("LTS4: %d bytes left over", len(s)-p)
	}
	if len(m.xs) == 0 {
		return nil, errors.New("LTS4 mesh has no vertices")
	}
	return m, nil
}

// ---------------------------------------------------------------- HM2 heightmap

type hm2 struct {
	cell, ofsX, ofsZ float64
	w, h             int
	height           []float32 // rows z (south→north), columns x (west→east)
}

var hierGridOffsets = []int{0, 1, 5, 21, 85, 341, 1365, 5461, 21845, 87381, 349525, 1398101, 5592405, 22369621, 89478485}

type hm2Header struct {
	o                          int
	cell, hMin, hScale, ox, oz float64
	w, h, ver                  int
	chunkSz                    uint32
	p                          int
}

func findHM2(b []byte) []hm2Header {
	var out []hm2Header
	le := binary.LittleEndian
	o := 0
	for {
		i := bytes.Index(b[o:], []byte("HM2"))
		if i < 0 {
			break
		}
		o += i
		q := o + 3
		if q+48 <= len(b) {
			f := func(k int) float64 { return float64(math.Float32frombits(le.Uint32(b[q+4*k:]))) }
			hd := hm2Header{o: o, cell: f(0), hMin: f(1), hScale: f(2), ox: f(3), oz: f(4)}
			w := le.Uint32(b[q+20:])
			h := le.Uint32(b[q+24:])
			hd.ver = int(w >> 24 & 0xff)
			hd.w = int(w & 0xffffff)
			hd.h = int(h & 0x7fffffff)
			hd.p = q + 44
			if hd.cell > 0 && hd.cell < 1e4 && hd.w > 0 && hd.w <= 16384 && hd.h > 0 && hd.h <= 16384 && (hd.ver == 1 || hd.ver == 2) &&
				!math.IsNaN(hd.hMin) && !math.IsNaN(hd.hScale) && hd.hScale > 0 {
				if hd.ver == 2 {
					hd.chunkSz = le.Uint32(b[hd.p:])
					hd.p += 4
				}
				out = append(out, hd)
			}
		}
		o++
	}
	return out
}

func readHM2(b []byte, H hm2Header) (*hm2, error) {
	w, h := H.w, H.h
	shift := int(H.chunkSz & 0xFF)
	if shift == 0 {
		shift = 3
	}
	if shift > 8 {
		return nil, errors.New("HM2 block size out of range")
	}
	hrb := 1 << ((H.chunkSz >> 8) & 0xF)
	chunkBytes := int(H.chunkSz &^ 0xFFF)
	bw, bh := w>>shift, h>>shift
	bsz := 1 << (2 * shift)
	nblocks := bw * bh
	if nblocks == 0 {
		return nil, errors.New("HM2 empty")
	}
	levels := 0
	if hrb > 1 {
		levels = bitsLen(w/hrb) - 1
	}
	if levels < 0 || levels >= len(hierGridOffsets) {
		return nil, errors.New("HM2 range levels out of range")
	}
	hrbBytes := 0
	if levels > 0 {
		hrbBytes = hierGridOffsets[levels] * 16
	}
	p := H.p
	var info, vari []byte
	if chunkBytes == 0 {
		total := ((nblocks*(4+bsz) + 0xF) &^ 0xF) + hrbBytes
		codec, pay, _, err := dagorBlock(b, p)
		if err != nil {
			return nil, err
		}
		d, err := unpackBlock(codec, pay, total)
		if err != nil {
			return nil, fmt.Errorf("HM2: %w", err)
		}
		info = d[:nblocks*4]
		vari = d[nblocks*4 : nblocks*4+nblocks*bsz]
	} else {
		codec, pay, next, err := dagorBlock(b, p)
		if err != nil {
			return nil, err
		}
		d, err := unpackBlock(codec, pay, nblocks*4+hrbBytes)
		if err != nil {
			return nil, fmt.Errorf("HM2 block info: %w", err)
		}
		info = d[:nblocks*4]
		p = next
		bpc := chunkBytes >> (2 * shift)
		if bpc <= 0 {
			return nil, errors.New("HM2 chunk size out of range")
		}
		vari = make([]byte, 0, nblocks*bsz)
		for c := 0; c*bpc < nblocks; c++ {
			n := bpc
			if nblocks-c*bpc < n {
				n = nblocks - c*bpc
			}
			codec, pay, next, err := dagorBlock(b, p)
			if err != nil {
				return nil, err
			}
			dc, err := unpackBlock(codec, pay, n*bsz)
			if err != nil {
				return nil, fmt.Errorf("HM2 chunk %d: %w", c, err)
			}
			vari = append(vari, dc...)
			p = next
		}
	}
	m := &hm2{cell: H.cell, ofsX: H.ox, ofsZ: H.oz, w: w, h: h, height: make([]float32, w*h)}
	bs := 1 << shift
	le := binary.LittleEndian
	for bi := 0; bi < nblocks; bi++ {
		mn := uint32(le.Uint16(info[4*bi:]))
		dl := uint32(le.Uint16(info[4*bi+2:]))
		by, bx := bi/bw, bi%bw
		run := byte(0)
		for k := 0; k < bsz; k++ {
			run += vari[bi*bsz+k]
			raw := mn
			if dl != 0 {
				raw = mn + (uint32(run)*dl+127)/255
			}
			r, c := by*bs+k/bs, bx*bs+k%bs
			if r < h && c < w {
				m.height[r*w+c] = float32(H.hMin + float64(raw)*H.hScale/65535)
			}
		}
	}
	return m, nil
}

func bitsLen(x int) int {
	n := 0
	for x > 0 {
		n++
		x >>= 1
	}
	return n
}

// ---------------------------------------------------------------- grid

type grid struct {
	n      int
	x0, z0 float64
	cell   float64
	sum, w []float64
}

func newGrid(n int, x0, z0, cell float64) *grid {
	return &grid{n: n, x0: x0, z0: z0, cell: cell, sum: make([]float64, n*n), w: make([]float64, n*n)}
}

func (g *grid) add(x, z, y float64) {
	c := int(math.Floor((x - g.x0) / g.cell))
	r := int(math.Floor((z - g.z0) / g.cell))
	if c < 0 || r < 0 || c >= g.n || r >= g.n {
		return
	}
	g.sum[r*g.n+c] += y
	g.w[r*g.n+c]++
}

// raster sets cell centres covered by a triangle to the interpolated height
// (the highest one where triangles overlap).
type raster struct {
	g   *grid
	set []bool
	val []float64
}

func newRaster(g *grid) *raster {
	return &raster{g: g, set: make([]bool, g.n*g.n), val: make([]float64, g.n*g.n)}
}

func (r *raster) tri(ax, az, ay, bx, bz, by, cx, cz, cy float64) {
	g := r.g
	// to cell units, centres at integer + 0.5
	ax, az = (ax-g.x0)/g.cell-0.5, (az-g.z0)/g.cell-0.5
	bx, bz = (bx-g.x0)/g.cell-0.5, (bz-g.z0)/g.cell-0.5
	cx, cz = (cx-g.x0)/g.cell-0.5, (cz-g.z0)/g.cell-0.5
	area := (bx-ax)*(cz-az) - (bz-az)*(cx-ax)
	if math.Abs(area) < 1e-12 {
		return
	}
	c0 := int(math.Ceil(math.Min(ax, math.Min(bx, cx)) - 1e-9))
	c1 := int(math.Floor(math.Max(ax, math.Max(bx, cx)) + 1e-9))
	r0 := int(math.Ceil(math.Min(az, math.Min(bz, cz)) - 1e-9))
	r1 := int(math.Floor(math.Max(az, math.Max(bz, cz)) + 1e-9))
	if c0 < 0 {
		c0 = 0
	}
	if r0 < 0 {
		r0 = 0
	}
	if c1 >= g.n {
		c1 = g.n - 1
	}
	if r1 >= g.n {
		r1 = g.n - 1
	}
	const eps = -1e-9
	for row := r0; row <= r1; row++ {
		pz := float64(row)
		for col := c0; col <= c1; col++ {
			px := float64(col)
			wa := ((bx-px)*(cz-pz) - (bz-pz)*(cx-px)) / area
			wb := ((cx-px)*(az-pz) - (cz-pz)*(ax-px)) / area
			wc := 1 - wa - wb
			if wa < eps || wb < eps || wc < eps {
				continue
			}
			y := wa*ay + wb*by + wc*cy
			i := row*g.n + col
			if !r.set[i] || y > r.val[i] {
				r.set[i] = true
				r.val[i] = y
			}
		}
	}
}

// fill returns the cell values. Cells without data take the value of the
// nearest cell with data (so the edge of the data continues outward: seabed
// stays seabed around an island, mountains stay mountains), then the filled
// area is smoothed. Returns the values and the number of filled cells.
func (g *grid) fill() ([]float64, int) {
	n := g.n
	val := make([]float64, n*n)
	known := make([]bool, n*n)
	queue := make([]int32, 0, n*n)
	for i := range val {
		if g.w[i] > 0 {
			val[i] = g.sum[i] / g.w[i]
			known[i] = true
			queue = append(queue, int32(i))
		}
	}
	if len(queue) == 0 {
		return val, n * n
	}
	empty := n*n - len(queue)
	if empty == 0 {
		return val, 0
	}
	// breadth-first spread from all known cells (8 neighbours)
	src := make([]int32, n*n)
	for i := range src {
		src[i] = -1
	}
	for _, i := range queue {
		src[i] = i
	}
	for q := 0; q < len(queue); q++ {
		i := int(queue[q])
		r, c := i/n, i%n
		for dr := -1; dr <= 1; dr++ {
			for dc := -1; dc <= 1; dc++ {
				rr, cc := r+dr, c+dc
				if rr < 0 || cc < 0 || rr >= n || cc >= n {
					continue
				}
				j := rr*n + cc
				if src[j] < 0 {
					src[j] = src[i]
					val[j] = val[src[i]]
					queue = append(queue, int32(j))
				}
			}
		}
	}
	// smooth the filled cells only (known cells stay as they are)
	tmp := make([]float64, n*n)
	for it := 0; it < 24; it++ {
		copy(tmp, val)
		for r := 0; r < n; r++ {
			for c := 0; c < n; c++ {
				i := r*n + c
				if known[i] {
					continue
				}
				sum, cnt := 0.0, 0.0
				for dr := -1; dr <= 1; dr++ {
					for dc := -1; dc <= 1; dc++ {
						rr, cc := r+dr, c+dc
						if rr < 0 || cc < 0 || rr >= n || cc >= n {
							continue
						}
						sum += tmp[rr*n+cc]
						cnt++
					}
				}
				val[i] = sum / cnt
			}
		}
	}
	return val, empty
}

// ---------------------------------------------------------------- build

func buildTerrain(path, stem string, li levelInfo, n int) (*builtLevel, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	st, _ := os.Stat(path)
	// HM2 candidates; choose the one covering the most ground
	var best *hm2Header
	for _, h := range findHM2(b) {
		h := h
		if best == nil || h.cell*float64(h.w) > best.cell*float64(best.w) {
			best = &h
		}
	}
	var mesh *lts4
	var meshErr error
	// map corners: from the level .blk, else from the data itself
	x0, z0, x1, z1 := li.x0, li.z0, li.x1, li.z1
	if !li.hasCoords {
		if best != nil {
			x0, z0 = best.ox, best.oz
			x1, z1 = x0+best.cell*float64(best.w), z0+best.cell*float64(best.h)
		} else {
			mesh, meshErr = readLTS4(b)
			if meshErr != nil {
				return nil, meshErr
			}
			x0, z0 = mesh.ox, mesh.oz
			x1, z1 = x0+float64(mesh.cellsX)*mesh.cellSize, z0+float64(mesh.cellsY)*mesh.cellSize
		}
	}
	side := math.Max(x1-x0, z1-z0)
	x1, z1 = x0+side, z0+side
	cell := side / float64(n)
	g := newGrid(n, x0, z0, cell)
	source := ""
	useHM2 := best != nil && best.cell*float64(best.w) >= 0.9*side && best.cell*float64(best.h) >= 0.9*side
	if useHM2 {
		hm, err := readHM2(b, *best)
		if err != nil {
			useHM2 = false
			source = "HM2 failed (" + err.Error() + "); "
		} else {
			for r := 0; r < hm.h; r++ {
				z := hm.ofsZ + float64(r)*hm.cell
				for c := 0; c < hm.w; c++ {
					g.add(hm.ofsX+float64(c)*hm.cell, z, float64(hm.height[r*hm.w+c]))
				}
			}
			source += fmt.Sprintf("HM2 heightmap %d x %d at %g m", hm.w, hm.h, hm.cell)
		}
	}
	if !useHM2 {
		if mesh == nil {
			mesh, meshErr = readLTS4(b)
		}
		if meshErr != nil {
			if source != "" {
				return nil, fmt.Errorf("%s%v", source, meshErr)
			}
			return nil, meshErr
		}
		// vertices give the averages used to fill gaps; triangles give the
		// exact surface at every cell centre they cover
		for i := range mesh.xs {
			g.add(mesh.xs[i], mesh.zs[i], mesh.ys[i])
		}
		rs := newRaster(g)
		t := mesh.tris
		for i := 0; i+2 < len(t); i += 3 {
			a, b, c := t[i], t[i+1], t[i+2]
			rs.tri(mesh.xs[a], mesh.zs[a], mesh.ys[a], mesh.xs[b], mesh.zs[b], mesh.ys[b], mesh.xs[c], mesh.zs[c], mesh.ys[c])
		}
		for i, ok := range rs.set {
			if ok {
				g.sum[i], g.w[i] = rs.val[i], 1
			}
		}
		source += fmt.Sprintf("LTS4 collision mesh, %d points, %d triangles", len(mesh.xs), len(t)/3)
	}
	val, empty := g.fill()
	hMin, hMax := math.Inf(1), math.Inf(-1)
	for _, v := range val {
		hMin = math.Min(hMin, v)
		hMax = math.Max(hMax, v)
	}
	if hMax <= hMin {
		hMax = hMin + 1
	}
	raw := make([]byte, 2*n*n)
	for i, v := range val {
		q := math.Round((v - hMin) / (hMax - hMin) * 65535)
		binary.LittleEndian.PutUint16(raw[2*i:], uint16(math.Max(0, math.Min(65535, q))))
	}
	meta := map[string]any{
		"format": "wtt", "schema": 1, "level": "levels/" + stem + ".bin", "gridSize": n,
		"x0": x0, "z0": z0, "x1": x1, "z1": z1, "cellM": cell, "hMin": hMin, "hMax": hMax,
		"waterLevel": li.water, "source": source, "emptyCellsFilled": empty,
		"gameFilesDate": st.ModTime().Format("2006-01-02"), "builtBy": "wtassets terrain",
		"builtAt": time.Now().UTC().Format(time.RFC3339),
	}
	if !li.hasCoords {
		meta["note"] = "map corners not in the level .blk; taken from the terrain data"
	}
	return &builtLevel{meta: meta, raw: raw, msg: fmt.Sprintf("%s; heights %.0f..%.0f m; %d of %d cells filled from neighbours", source, hMin, hMax, empty, n*n)}, nil
}
