// mksyso turns an .ico file (and an optional manifest) into a Windows COFF
// resource object (.syso) that "go build" links into the exe, so the program
// gets its icon in Explorer, the taskbar and the window title bar.
//
//	go run ./tools/mksyso -ico res/app.ico -manifest res/app.manifest -o server/rsrc_windows_amd64.syso
//
// Written by hand because the usual tool (github.com/akavel/rsrc) could not be
// downloaded in the build environment. Icon group id is 1 (use IconId: 1).
package main

import (
	"bytes"
	"encoding/binary"
	"flag"
	"fmt"
	"os"
	"sort"
)

type res struct {
	typ, id uint16
	data    []byte
}

func main() {
	ico := flag.String("ico", "", "input .ico")
	man := flag.String("manifest", "", "optional application manifest (xml)")
	out := flag.String("o", "rsrc_windows_amd64.syso", "output")
	flag.Parse()
	if *ico == "" {
		fmt.Fprintln(os.Stderr, "need -ico")
		os.Exit(2)
	}
	d, err := os.ReadFile(*ico)
	if err != nil {
		panic(err)
	}
	if len(d) < 6 || binary.LittleEndian.Uint16(d[2:]) != 1 {
		panic("not an .ico")
	}
	n := int(binary.LittleEndian.Uint16(d[4:]))
	var rs []res
	grp := new(bytes.Buffer)
	binary.Write(grp, binary.LittleEndian, [3]uint16{0, 1, uint16(n)})
	for i := 0; i < n; i++ {
		e := d[6+16*i : 22+16*i]
		size := binary.LittleEndian.Uint32(e[8:])
		off := binary.LittleEndian.Uint32(e[12:])
		id := uint16(i + 1)
		rs = append(rs, res{3, id, d[off : off+size]}) // RT_ICON
		grp.Write(e[:12])                                // w h colors rsvd planes bits bytes
		binary.Write(grp, binary.LittleEndian, id)
	}
	rs = append(rs, res{14, 1, grp.Bytes()}) // RT_GROUP_ICON
	if *man != "" {
		m, err := os.ReadFile(*man)
		if err != nil {
			panic(err)
		}
		rs = append(rs, res{24, 1, m}) // RT_MANIFEST
	}
	b, relocs := build(rs)
	if err := os.WriteFile(*out, wrapCOFF(b, relocs), 0o644); err != nil {
		panic(err)
	}
	fmt.Printf("wrote %s (%d resources)\n", *out, len(rs))
}

// build lays out the resource tree: type -> name(id) -> language -> data entry.
func build(rs []res) ([]byte, []uint32) {
	types := map[uint16][]res{}
	var tkeys []int
	for _, r := range rs {
		if _, ok := types[r.typ]; !ok {
			tkeys = append(tkeys, int(r.typ))
		}
		types[r.typ] = append(types[r.typ], r)
	}
	sort.Ints(tkeys)
	for _, t := range tkeys {
		l := types[uint16(t)]
		sort.Slice(l, func(i, j int) bool { return l[i].id < l[j].id })
	}
	// sizes
	dir := func(entries int) int { return 16 + 8*entries }
	size := dir(len(tkeys))
	for _, t := range tkeys {
		size += dir(len(types[uint16(t)]))
		size += len(types[uint16(t)]) * dir(1) // language dirs
	}
	deOff := size // data entries (16 bytes each)
	size += 16 * len(rs)
	dataOff := size
	buf := make([]byte, size)
	le := binary.LittleEndian
	putDir := func(at, n int) { le.PutUint16(buf[at+14:], uint16(n)) }
	putEntry := func(at int, id uint32, target uint32, isDir bool) {
		le.PutUint32(buf[at:], id)
		if isDir {
			target |= 0x80000000
		}
		le.PutUint32(buf[at+4:], target)
	}
	var relocs []uint32
	var raw bytes.Buffer
	pos := dir(len(tkeys))
	putDir(0, len(tkeys))
	// first pass: assign positions
	typeDirAt := map[int]int{}
	cur := pos
	for _, t := range tkeys {
		typeDirAt[t] = cur
		cur += dir(len(types[uint16(t)]))
	}
	langAt := cur // language dirs follow all name dirs
	deIdx := 0
	for ti, t := range tkeys {
		putEntry(16+8*ti, uint32(t), uint32(typeDirAt[t]), true)
		l := types[uint16(t)]
		td := typeDirAt[t]
		putDir(td, len(l))
		for ni, r := range l {
			putEntry(td+16+8*ni, uint32(r.id), uint32(langAt), true)
			putDir(langAt, 1)
			putEntry(langAt+16, 0x409, uint32(deOff+16*deIdx), false)
			de := deOff + 16*deIdx
			for raw.Len()%8 != 0 {
				raw.WriteByte(0)
			}
			le.PutUint32(buf[de:], uint32(dataOff+raw.Len())) // RVA within section; fixed up by relocation
			le.PutUint32(buf[de+4:], uint32(len(r.data)))
			le.PutUint32(buf[de+8:], 0) // code page
			relocs = append(relocs, uint32(de))
			raw.Write(r.data)
			langAt += dir(1)
			deIdx++
		}
	}
	return append(buf, raw.Bytes()...), relocs
}

func wrapCOFF(sec []byte, relocs []uint32) []byte {
	le := binary.LittleEndian
	const hdr, shdr = 20, 40
	secOff := hdr + shdr
	relOff := secOff + len(sec)
	symOff := relOff + 10*len(relocs)
	var o bytes.Buffer
	// file header: AMD64, 1 section, symbols at symOff, 1 symbol
	binary.Write(&o, le, struct {
		Machine, NSec  uint16
		Time, SymPtr   uint32
		NSym           uint32
		OptSize, Flags uint16
	}{0x8664, 1, 0, uint32(symOff), 1, 0, 0})
	var name [8]byte
	copy(name[:], ".rsrc")
	binary.Write(&o, le, struct {
		Name                                  [8]byte
		VSize, VAddr, RawSize, RawPtr, RelPtr uint32
		LinePtr                               uint32
		NReloc, NLine                         uint16
		Flags                                 uint32
	}{name, 0, 0, uint32(len(sec)), uint32(secOff), uint32(relOff), 0, uint16(len(relocs)), 0, 0x40000040})
	o.Write(sec)
	for _, r := range relocs {
		binary.Write(&o, le, struct {
			Addr, Sym uint32
			Type      uint16
		}{r, 0, 3}) // IMAGE_REL_AMD64_ADDR32NB
	}
	// symbol 0: the .rsrc section
	binary.Write(&o, le, struct {
		Name    [8]byte
		Value   uint32
		Section int16
		Type    uint16
		Class   uint8
		NAux    uint8
	}{name, 0, 1, 0, 3, 0})
	binary.Write(&o, le, uint32(4)) // empty string table
	return o.Bytes()
}
