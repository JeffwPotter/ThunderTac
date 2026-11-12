// Package oodle decodes Oodle Leviathan data, the compression the Dagor
// engine uses for blocks inside War Thunder level files (terrain collision
// mesh LTS4, heightmap HM2).
//
// OURS, written for this project: a Go translation of the Kraken-family
// decoder in "ooz" by Powzix (https://github.com/powzix/ooz, GPL-3.0). Only
// what Leviathan needs is translated: the shared entropy layer (raw, tANS,
// Huffman, RLE, recursive and multi-array blocks) and the Leviathan match
// copier. Kraken (type 6) and Mermaid (type 10) LZ are not translated and
// return ErrUnsupported.
//
// Licence note: because this is a translation of GPL-3.0 code, any copy of
// the tool that is shared must be shared under GPL-3.0 (or AGPL-3.0, which
// the rest of the decoder already uses). For private use there is no
// obligation.
//
// The C code reads and writes past buffer ends in places; here every read is
// bounds-checked (bytes outside a buffer read as zero) and copies are done
// byte by byte, which gives the same result for valid data.
package oodle

import (
	"errors"
	"fmt"
	"math/bits"
)

var (
	ErrCorrupt     = errors.New("oodle: corrupt or unsupported data")
	ErrUnsupported = errors.New("oodle: compressor not supported (only Leviathan is)")
)

func rd8(b []byte, i int) uint32 {
	if i < 0 || i >= len(b) {
		return 0
	}
	return uint32(b[i])
}
func rd16(b []byte, i int) uint32 { return rd8(b, i) | rd8(b, i+1)<<8 }
func rd32(b []byte, i int) uint32 {
	if i >= 0 && i+4 <= len(b) {
		return uint32(b[i]) | uint32(b[i+1])<<8 | uint32(b[i+2])<<16 | uint32(b[i+3])<<24
	}
	return rd8(b, i) | rd8(b, i+1)<<8 | rd8(b, i+2)<<16 | rd8(b, i+3)<<24
}
func rd32be(b []byte, i int) uint32 { return bits.ReverseBytes32(rd32(b, i)) }

// bsr: index of the highest set bit (x != 0)
func bsr(x uint32) int { return 31 - bits.LeadingZeros32(x) }
func bsf(x uint32) int { return bits.TrailingZeros32(x) }

// ---------------------------------------------------------------- bit reader

type bitReader struct {
	b      []byte
	p      int
	pEnd   int // forward: end; backward: lower bound
	bits   uint32
	bitpos int
}

func (br *bitReader) refill() {
	for br.bitpos > 0 {
		var v uint32
		if br.p < br.pEnd {
			v = rd8(br.b, br.p)
		}
		br.bits |= v << uint(br.bitpos)
		br.bitpos -= 8
		br.p++
	}
}
func (br *bitReader) refillBack() {
	for br.bitpos > 0 {
		br.p--
		var v uint32
		if br.p >= br.pEnd {
			v = rd8(br.b, br.p)
		}
		br.bits |= v << uint(br.bitpos)
		br.bitpos -= 8
	}
}
func (br *bitReader) readBit() int {
	br.refill()
	return br.readBitNoRefill()
}
func (br *bitReader) readBitNoRefill() int {
	r := int(br.bits >> 31)
	br.bits <<= 1
	br.bitpos++
	return r
}
func (br *bitReader) readBitsNoRefill(n int) int {
	r := int(br.bits >> uint(32-n))
	br.bits <<= uint(n)
	br.bitpos += n
	return r
}
func (br *bitReader) readBitsNoRefillZero(n int) int {
	r := int(br.bits >> 1 >> uint(31-n))
	br.bits <<= uint(n)
	br.bitpos += n
	return r
}
func (br *bitReader) readMoreThan24(n int, back bool) uint32 {
	var rv uint32
	if n <= 24 {
		rv = uint32(br.readBitsNoRefillZero(n))
	} else {
		rv = uint32(br.readBitsNoRefill(24)) << uint(n-24)
		if back {
			br.refillBack()
		} else {
			br.refill()
		}
		rv += uint32(br.readBitsNoRefill(n - 24))
	}
	if back {
		br.refillBack()
	} else {
		br.refill()
	}
	return rv
}
func (br *bitReader) readDistance(v uint32, back bool) uint32 {
	var rv uint32
	if v < 0xF0 {
		n := (v >> 4) + 4
		w := bits.RotateLeft32(br.bits|1, int(n))
		br.bitpos += int(n)
		m := uint32(2<<n) - 1
		br.bits = w &^ m
		rv = ((w & m) << 4) + (v & 0xF) - 248
	} else {
		n := v - 0xF0 + 4
		w := bits.RotateLeft32(br.bits|1, int(n))
		br.bitpos += int(n)
		m := uint32(2<<n) - 1
		br.bits = w &^ m
		rv = 8322816 + ((w & m) << 12)
		if back {
			br.refillBack()
		} else {
			br.refill()
		}
		rv += br.bits >> 20
		br.bitpos += 12
		br.bits <<= 12
	}
	if back {
		br.refillBack()
	} else {
		br.refill()
	}
	return rv
}
func (br *bitReader) readLength(back bool) (uint32, bool) {
	if br.bits == 0 {
		return 0, false
	}
	n := 31 - bsr(br.bits)
	if n > 12 {
		return 0, false
	}
	br.bitpos += n
	br.bits <<= uint(n)
	if back {
		br.refillBack()
	} else {
		br.refill()
	}
	n += 7
	br.bitpos += n
	rv := (br.bits >> uint(32-n)) - 64
	br.bits <<= uint(n)
	if back {
		br.refillBack()
	} else {
		br.refill()
	}
	return rv, true
}
func (br *bitReader) readFluff(numSymbols int) int {
	if numSymbols == 256 {
		return 0
	}
	x := 257 - numSymbols
	if x > numSymbols {
		x = numSymbols
	}
	x *= 2
	y := bsr(uint32(x-1)) + 1
	v := br.bits >> uint(32-y)
	z := uint32(1<<uint(y)) - uint32(x)
	if (v >> 1) >= z {
		br.bits <<= uint(y)
		br.bitpos += y
		return int(v - z)
	}
	br.bits <<= uint(y - 1)
	br.bitpos += y - 1
	return int(v >> 1)
}

// ---------------------------------------------------------------- Huffman

type bitReader2 struct {
	b      []byte
	p      int
	pEnd   int
	bitpos uint32
}

func decodeGolombRiceLengths(dst []byte, size int, br *bitReader2) bool {
	p, pEnd := br.p, br.pEnd
	d, dEnd := 0, size
	if p >= pEnd {
		return false
	}
	count := -int(br.bitpos)
	v := rd8(br.b, p) & (255 >> br.bitpos)
	p++
	for {
		if v == 0 {
			count += 8
		} else {
			x := kRiceCodeBits2Value[v]
			w0 := uint32(count) + (x & 0x0f0f0f0f)
			w1 := (x >> 4) & 0x0f0f0f0f
			for k := 0; k < 4; k++ {
				dst[d+k] = byte(w0 >> (8 * k))
				dst[d+4+k] = byte(w1 >> (8 * k))
			}
			d += int(kRiceCodeBits2Len[v])
			if d >= dEnd {
				break
			}
			count = int(x >> 28)
		}
		if p >= pEnd {
			return false
		}
		v = rd8(br.b, p)
		p++
	}
	if d > dEnd {
		n := d - dEnd
		for ; n > 0; n-- {
			v &= v - 1
		}
	}
	bitpos := uint32(0)
	if v&1 == 0 {
		p--
		bitpos = uint32(8 - bsf(v))
	}
	br.p = p
	br.bitpos = bitpos
	return true
}

func decodeGolombRiceBits(dst []byte, size int, bitcount int, br *bitReader2) bool {
	if bitcount == 0 {
		return true
	}
	bitpos := int(br.bitpos)
	bitsRequired := bitpos + bitcount*size
	bytesRequired := (bitsRequired + 7) >> 3
	if bytesRequired > br.pEnd-br.p {
		return false
	}
	base := br.p
	br.p = base + (bitsRequired >> 3)
	br.bitpos = uint32(bitsRequired & 7)
	for i := 0; i < size; i++ {
		var v uint32
		for k := 0; k < bitcount; k++ {
			pos := bitpos + i*bitcount + k
			bit := (rd8(br.b, base+pos>>3) >> uint(7-pos&7)) & 1
			v = v<<1 | bit
		}
		dst[i] = byte(uint32(dst[i])<<uint(bitcount) + v)
	}
	return true
}

type huffRange struct{ symbol, num int }

func huffConvertToRanges(rng []huffRange, numSymbols, P int, symlen []byte, br *bitReader) int {
	numRanges := P >> 1
	symIdx := 0
	si := 0
	if P&1 != 0 {
		br.refill()
		v := int(symlen[si])
		si++
		if v >= 8 {
			return -1
		}
		symIdx = br.readBitsNoRefill(v+1) + (1 << uint(v+1)) - 1
	}
	symsUsed := 0
	for i := 0; i < numRanges; i++ {
		br.refill()
		v := int(symlen[si])
		if v >= 9 {
			return -1
		}
		num := br.readBitsNoRefillZero(v) + (1 << uint(v))
		v = int(symlen[si+1])
		if v >= 8 {
			return -1
		}
		space := br.readBitsNoRefill(v+1) + (1 << uint(v+1)) - 1
		rng[i] = huffRange{symIdx, num}
		symsUsed += num
		symIdx += num + space
		si += 2
	}
	if symIdx >= 256 || symsUsed >= numSymbols || symIdx+numSymbols-symsUsed > 256 {
		return -1
	}
	rng[numRanges] = huffRange{symIdx, numSymbols - symsUsed}
	return numRanges + 1
}

func huffReadCodeLengthsOld(br *bitReader, syms []byte, codePrefix *[12]uint32) int {
	if br.readBitNoRefill() != 0 {
		sym, numSymbols := 0, 0
		avgBitsX4 := 32
		forcedBits := br.readBitsNoRefill(2)
		thres := uint32(1) << uint(31-(20>>uint(forcedBits)))
		skip := br.readBit() != 0
		for {
			if !skip {
				if br.bits&0xff000000 == 0 {
					return -1
				}
				sym += br.readBitsNoRefill(2*(bits.LeadingZeros32(br.bits)+1)) - 2 + 1
				if sym >= 256 {
					break
				}
			}
			skip = false
			br.refill()
			if br.bits&0xff000000 == 0 {
				return -1
			}
			n := br.readBitsNoRefill(2*(bits.LeadingZeros32(br.bits)+1)) - 2 + 1
			if sym+n > 256 {
				return -1
			}
			br.refill()
			numSymbols += n
			for ; n > 0; n-- {
				if br.bits < thres {
					return -1
				}
				lz := bits.LeadingZeros32(br.bits)
				v := br.readBitsNoRefill(lz+forcedBits+1) + ((lz - 1) << uint(forcedBits))
				codelen := (-(v & 1) ^ (v >> 1)) + ((avgBitsX4 + 2) >> 2)
				if codelen < 1 || codelen > 11 {
					return -1
				}
				avgBitsX4 = codelen + ((3*avgBitsX4 + 2) >> 2)
				br.refill()
				syms[codePrefix[codelen]] = byte(sym)
				codePrefix[codelen]++
				sym++
			}
			if sym == 256 {
				break
			}
		}
		if sym == 256 && numSymbols >= 2 {
			return numSymbols
		}
		return -1
	}
	numSymbols := br.readBitsNoRefill(8)
	if numSymbols == 0 {
		return -1
	}
	if numSymbols == 1 {
		syms[0] = byte(br.readBitsNoRefill(8))
	} else {
		codelenBits := br.readBitsNoRefill(3)
		if codelenBits > 4 {
			return -1
		}
		for i := 0; i < numSymbols; i++ {
			br.refill()
			sym := br.readBitsNoRefill(8)
			codelen := br.readBitsNoRefillZero(codelenBits) + 1
			if codelen > 11 {
				return -1
			}
			syms[codePrefix[codelen]] = byte(sym)
			codePrefix[codelen]++
		}
	}
	return numSymbols
}

func huffReadCodeLengthsNew(br *bitReader, syms []byte, codePrefix *[12]uint32) int {
	forcedBits := br.readBitsNoRefill(2)
	numSymbols := br.readBitsNoRefill(8) + 1
	fluff := br.readFluff(numSymbols)
	var codeLen [512 + 32]byte
	br2 := bitReader2{b: br.b, pEnd: br.pEnd}
	br2.bitpos = uint32((br.bitpos - 24) & 7)
	br2.p = br.p - ((24 - br.bitpos + 7) >> 3)
	if !decodeGolombRiceLengths(codeLen[:], numSymbols+fluff, &br2) {
		return -1
	}
	for i := 0; i < 16; i++ {
		codeLen[numSymbols+fluff+i] = 0
	}
	if !decodeGolombRiceBits(codeLen[:], numSymbols, forcedBits, &br2) {
		return -1
	}
	br.bitpos = 24
	br.p = br2.p
	br.bits = 0
	br.refill()
	br.bits <<= br2.bitpos
	br.bitpos += int(br2.bitpos)
	runningSum := uint32(0x1e)
	for i := 0; i < numSymbols; i++ {
		v := int(codeLen[i])
		v = -(v & 1) ^ (v >> 1)
		cl := v + int(runningSum>>2) + 1
		if cl < 1 || cl > 11 {
			return -1
		}
		codeLen[i] = byte(cl)
		runningSum += uint32(v)
	}
	var rng [128]huffRange
	ranges := huffConvertToRanges(rng[:], numSymbols, fluff, codeLen[numSymbols:], br)
	if ranges <= 0 {
		return -1
	}
	cp := 0
	for i := 0; i < ranges; i++ {
		sym := rng[i].symbol
		for n := rng[i].num; n > 0; n-- {
			syms[codePrefix[codeLen[cp]]] = byte(sym)
			codePrefix[codeLen[cp]]++
			cp++
			sym++
		}
	}
	return numSymbols
}

type huffLut struct{ bits2len, bits2sym [2048 + 16]byte }

func huffMakeLut(prefixOrg, prefixCur *[12]uint32, lut *huffLut, syms []byte) bool {
	currslot := uint32(0)
	for i := uint32(1); i < 11; i++ {
		start := prefixOrg[i]
		count := prefixCur[i] - start
		if count != 0 {
			stepsize := uint32(1) << (11 - i)
			numToSet := count << (11 - i)
			if currslot+numToSet > 2048 {
				return false
			}
			for k := uint32(0); k < numToSet; k++ {
				lut.bits2len[currslot+k] = byte(i)
			}
			p := currslot
			for j := uint32(0); j != count; j, p = j+1, p+stepsize {
				for k := uint32(0); k < stepsize; k++ {
					lut.bits2sym[p+k] = syms[start+j]
				}
			}
			currslot += numToSet
		}
	}
	if prefixCur[11]-prefixOrg[11] != 0 {
		numToSet := prefixCur[11] - prefixOrg[11]
		if currslot+numToSet > 2048 {
			return false
		}
		for k := uint32(0); k < numToSet; k++ {
			lut.bits2len[currslot+k] = 11
			lut.bits2sym[currslot+k] = syms[prefixOrg[11]+k]
		}
		currslot += numToSet
	}
	return currslot == 2048
}

var rev11 [2048]uint16

func init() {
	for i := range rev11 {
		rev11[i] = uint16(bits.Reverse16(uint16(i)) >> 5)
	}
}

type huffRevLut struct{ len, sym [2048]byte }

type huffReader struct {
	out                                   []byte
	o, oEnd                               int
	b                                     []byte
	src, srcMid, srcEnd, srcMidOrg        int
	srcBitpos, srcMidBitpos, srcEndBitpos int
	srcBits, srcMidBits, srcEndBits       uint32
}

func decodeBytesCore(hr *huffReader, lut *huffRevLut) bool {
	b := hr.b
	src, srcBits, srcBitpos := hr.src, hr.srcBits, hr.srcBitpos
	mid, midBits, midBitpos := hr.srcMid, hr.srcMidBits, hr.srcMidBitpos
	end, endBits, endBitpos := hr.srcEnd, hr.srcEndBits, hr.srcEndBitpos
	dst, dstEnd := hr.o, hr.oEnd
	out := hr.out
	if src > mid {
		return false
	}
	if hr.srcEnd-mid >= 4 && dstEnd-dst >= 6 {
		dstEnd -= 5
		end -= 4
		for dst < dstEnd && src <= mid && mid <= end {
			srcBits |= rd32(b, src) << uint(srcBitpos)
			src += (31 - srcBitpos) >> 3
			endBits |= rd32be(b, end) << uint(endBitpos)
			end -= (31 - endBitpos) >> 3
			midBits |= rd32(b, mid) << uint(midBitpos)
			mid += (31 - midBitpos) >> 3
			srcBitpos |= 0x18
			endBitpos |= 0x18
			midBitpos |= 0x18
			for r := 0; r < 2; r++ {
				k := srcBits & 0x7FF
				n := int(lut.len[k])
				srcBits >>= uint(n)
				srcBitpos -= n
				out[dst+3*r] = lut.sym[k]
				k = endBits & 0x7FF
				n = int(lut.len[k])
				endBits >>= uint(n)
				endBitpos -= n
				out[dst+3*r+1] = lut.sym[k]
				k = midBits & 0x7FF
				n = int(lut.len[k])
				midBits >>= uint(n)
				midBitpos -= n
				out[dst+3*r+2] = lut.sym[k]
			}
			dst += 6
		}
		dstEnd += 5
		src -= srcBitpos >> 3
		srcBitpos &= 7
		end += 4 + (endBitpos >> 3)
		endBitpos &= 7
		mid -= midBitpos >> 3
		midBitpos &= 7
	}
	for {
		if dst >= dstEnd {
			break
		}
		if mid-src <= 1 {
			if mid-src == 1 {
				srcBits |= rd8(b, src) << uint(srcBitpos)
			}
		} else {
			srcBits |= rd16(b, src) << uint(srcBitpos)
		}
		k := srcBits & 0x7FF
		n := int(lut.len[k])
		srcBitpos -= n
		srcBits >>= uint(n)
		out[dst] = lut.sym[k]
		dst++
		src += (7 - srcBitpos) >> 3
		srcBitpos &= 7
		if dst < dstEnd {
			if end-mid <= 1 {
				if end-mid == 1 {
					endBits |= rd8(b, mid) << uint(endBitpos)
					midBits |= rd8(b, mid) << uint(midBitpos)
				}
			} else {
				v := rd16(b, end-2)
				endBits |= (((v >> 8) | (v << 8)) & 0xffff) << uint(endBitpos)
				midBits |= rd16(b, mid) << uint(midBitpos)
			}
			n = int(lut.len[endBits&0x7FF])
			out[dst] = lut.sym[endBits&0x7FF]
			dst++
			endBitpos -= n
			endBits >>= uint(n)
			end -= (7 - endBitpos) >> 3
			endBitpos &= 7
			if dst < dstEnd {
				n = int(lut.len[midBits&0x7FF])
				out[dst] = lut.sym[midBits&0x7FF]
				dst++
				midBitpos -= n
				midBits >>= uint(n)
				mid += (7 - midBitpos) >> 3
				midBitpos &= 7
			}
		}
		if src > mid || mid > end {
			return false
		}
	}
	return src == hr.srcMidOrg && end == mid
}

var codePrefixOrg = [12]uint32{0x0, 0x0, 0x2, 0x6, 0xE, 0x1E, 0x3E, 0x7E, 0xFE, 0x1FE, 0x2FE, 0x3FE}

// decodeHuff: chunk types 2 and 4 (one or two halves, three streams each)
func decodeHuff(src []byte, out []byte, typ int) int {
	br := bitReader{b: src, p: 0, pEnd: len(src), bitpos: 24}
	br.refill()
	codePrefix := codePrefixOrg
	var syms [1280]byte
	var numSyms int
	if br.readBitNoRefill() == 0 {
		numSyms = huffReadCodeLengthsOld(&br, syms[:], &codePrefix)
	} else if br.readBitNoRefill() == 0 {
		numSyms = huffReadCodeLengthsNew(&br, syms[:], &codePrefix)
	} else {
		return -1
	}
	if numSyms < 1 {
		return -1
	}
	s := br.p - (24-br.bitpos)/8
	srcEnd := len(src)
	if numSyms == 1 {
		for i := range out {
			out[i] = syms[0]
		}
		return s - srcEnd // as in the C code (never equals the source size)
	}
	var lut huffLut
	if !huffMakeLut(&codePrefixOrg, &codePrefix, &lut, syms[:]) {
		return -1
	}
	var rl huffRevLut
	for i := 0; i < 2048; i++ {
		rl.len[i] = lut.bits2len[rev11[i]]
		rl.sym[i] = lut.bits2sym[rev11[i]]
	}
	if typ == 1 {
		if s+3 > srcEnd {
			return -1
		}
		splitMid := int(rd16(src, s))
		s += 2
		hr := huffReader{out: out, o: 0, oEnd: len(out), b: src, src: s, srcEnd: srcEnd, srcMid: s + splitMid, srcMidOrg: s + splitMid}
		if !decodeBytesCore(&hr, &rl) {
			return -1
		}
	} else {
		if s+6 > srcEnd {
			return -1
		}
		half := (len(out) + 1) >> 1
		splitMid := int(rd32(src, s) & 0xFFFFFF)
		s += 3
		if splitMid > srcEnd-s {
			return -1
		}
		mid := s + splitMid
		splitLeft := int(rd16(src, s))
		s += 2
		if mid-s < splitLeft+2 || srcEnd-mid < 3 {
			return -1
		}
		splitRight := int(rd16(src, mid))
		if srcEnd-(mid+2) < splitRight+2 {
			return -1
		}
		hr := huffReader{out: out, o: 0, oEnd: half, b: src, src: s, srcEnd: mid, srcMid: s + splitLeft, srcMidOrg: s + splitLeft}
		if !decodeBytesCore(&hr, &rl) {
			return -1
		}
		hr = huffReader{out: out, o: half, oEnd: len(out), b: src, src: mid + 2, srcEnd: srcEnd, srcMid: mid + 2 + splitRight, srcMidOrg: mid + 2 + splitRight}
		if !decodeBytesCore(&hr, &rl) {
			return -1
		}
	}
	return len(src)
}

// ---------------------------------------------------------------- tANS

type tansData struct {
	aUsed, bUsed int
	a            [256]byte
	b            [256]uint32
}

func tansDecodeTable(br *bitReader, lBits int, td *tansData) bool {
	br.refill()
	if br.readBitNoRefill() != 0 {
		Q := br.readBitsNoRefill(3)
		numSymbols := br.readBitsNoRefill(8) + 1
		if numSymbols < 2 {
			return false
		}
		fluff := br.readFluff(numSymbols)
		total := fluff + numSymbols
		var rice [512 + 32]byte
		br2 := bitReader2{b: br.b, pEnd: br.pEnd}
		br2.p = br.p - ((24 - br.bitpos + 7) >> 3)
		br2.bitpos = uint32((br.bitpos - 24) & 7)
		if !decodeGolombRiceLengths(rice[:], total, &br2) {
			return false
		}
		for i := 0; i < 16; i++ {
			rice[total+i] = 0
		}
		br.bitpos = 24
		br.p = br2.p
		br.bits = 0
		br.refill()
		br.bits <<= br2.bitpos
		br.bitpos += int(br2.bitpos)
		var rng [133]huffRange
		fluff = huffConvertToRanges(rng[:], numSymbols, fluff, rice[numSymbols:], br)
		if fluff < 0 {
			return false
		}
		br.refill()
		L := 1 << uint(lBits)
		ri := 0
		average := 6
		somesum := 0
		ai, bi := 0, 0
		for r := 0; r < fluff; r++ {
			symbol := rng[r].symbol
			for num := rng[r].num; num > 0; num-- {
				br.refill()
				nextra := Q + int(rice[ri])
				ri++
				if nextra > 15 {
					return false
				}
				v := br.readBitsNoRefillZero(nextra) + (1 << uint(nextra)) - (1 << uint(Q))
				avgDiv4 := average >> 2
				limit := 2 * avgDiv4
				if v <= limit {
					v = avgDiv4 + (-(v & 1) ^ int(uint32(v)>>1))
				}
				if limit > v {
					limit = v
				}
				v++
				average += limit - avgDiv4
				if ai < 256 {
					td.a[ai] = byte(symbol)
				}
				if bi < 256 {
					td.b[bi] = uint32(symbol<<16 + v)
				}
				if v == 1 {
					ai++
				}
				if v >= 2 {
					bi++
				}
				somesum += v
				symbol++
			}
		}
		td.aUsed, td.bUsed = ai, bi
		return somesum == L
	}
	var seen [256]bool
	L := 1 << uint(lBits)
	count := br.readBitsNoRefill(3) + 1
	bitsPerSym := bsr(uint32(lBits)) + 1
	maxDeltaBits := br.readBitsNoRefill(bitsPerSym)
	if maxDeltaBits == 0 || maxDeltaBits > lBits {
		return false
	}
	ai, bi := 0, 0
	weight, total := 0, 0
	for ; count > 0; count-- {
		br.refill()
		sym := br.readBitsNoRefill(8)
		if seen[sym] {
			return false
		}
		delta := br.readBitsNoRefill(maxDeltaBits)
		weight += delta
		if weight == 0 {
			return false
		}
		seen[sym] = true
		if weight == 1 {
			td.a[ai] = byte(sym)
			ai++
		} else {
			td.b[bi] = uint32(sym<<16 + weight)
			bi++
		}
		total += weight
	}
	br.refill()
	sym := br.readBitsNoRefill(8)
	if seen[sym] {
		return false
	}
	if L-total < weight || L-total <= 1 {
		return false
	}
	td.b[bi] = uint32(sym<<16 + (L - total))
	bi++
	td.aUsed, td.bUsed = ai, bi
	sortBytes(td.a[:ai])
	sortU32(td.b[:bi])
	return true
}

func sortBytes(p []byte) {
	for l := 1; l < len(p); l++ {
		t := p[l]
		r := l
		for ; r > 0 && t < p[r-1]; r-- {
			p[r] = p[r-1]
		}
		p[r] = t
	}
}
func sortU32(p []uint32) {
	for l := 1; l < len(p); l++ {
		t := p[l]
		r := l
		for ; r > 0 && t < p[r-1]; r-- {
			p[r] = p[r-1]
		}
		p[r] = t
	}
}

type tansLutEnt struct {
	x     uint32
	bitsX uint8
	sym   uint8
	w     uint16
}

func tansInitLut(td *tansData, lBits int, lut []tansLutEnt) {
	L := 1 << uint(lBits)
	aUsed := td.aUsed
	left := L - aUsed
	sa := left >> 2
	var ptr [4]int
	ptr[0] = 0
	sb := sa
	if left&3 > 0 {
		sb++
	}
	ptr[1] = sb
	sb += sa
	if left&3 > 1 {
		sb++
	}
	ptr[2] = sb
	sb += sa
	if left&3 > 2 {
		sb++
	}
	ptr[3] = sb
	for i := 0; i < aUsed; i++ {
		lut[left+i] = tansLutEnt{x: uint32(1<<uint(lBits)) - 1, bitsX: uint8(lBits), sym: td.a[i], w: 0}
	}
	weightsSum := 0
	for i := 0; i < td.bUsed; i++ {
		weight := int(td.b[i] & 0xffff)
		symbol := uint8(td.b[i] >> 16)
		if weight > 4 {
			symBits := bsr(uint32(weight))
			Z := lBits - symBits
			le := tansLutEnt{sym: symbol, bitsX: uint8(Z), x: uint32(1<<uint(Z)) - 1, w: uint16((L - 1) & (weight << uint(Z)))}
			add := 1 << uint(Z)
			X := (1 << uint(symBits+1)) - weight
			for j := 0; j < 4; j++ {
				d := ptr[j]
				Y := (weight + ((weightsSum - j - 1) & 3)) >> 2
				if X >= Y {
					for n := Y; n > 0; n-- {
						lut[d] = le
						d++
						le.w += uint16(add)
					}
					X -= Y
				} else {
					for n := X; n > 0; n-- {
						lut[d] = le
						d++
						le.w += uint16(add)
					}
					Z--
					add >>= 1
					le.bitsX = uint8(Z)
					le.w = 0
					le.x >>= 1
					for n := Y - X; n > 0; n-- {
						lut[d] = le
						d++
						le.w += uint16(add)
					}
					X = weight
				}
				ptr[j] = d
			}
		} else {
			b := uint32((1<<uint(weight))-1) << uint(weightsSum&3)
			b |= b >> 4
			ww := weight
			for n := weight; n > 0; n-- {
				idx := bsf(b)
				b &= b - 1
				d := ptr[idx]
				ptr[idx]++
				wb := bsr(uint32(ww))
				lut[d] = tansLutEnt{sym: symbol, bitsX: uint8(lBits - wb), x: uint32(1<<uint(lBits-wb)) - 1, w: uint16((L - 1) & (ww << uint(lBits-wb)))}
				ww++
			}
		}
		weightsSum += weight
	}
}

func decodeTans(src []byte, dst []byte) int {
	srcSize, dstSize := len(src), len(dst)
	if srcSize < 8 || dstSize < 5 {
		return -1
	}
	srcEnd := srcSize
	br := bitReader{b: src, p: 0, pEnd: srcEnd, bitpos: 24}
	br.refill()
	if br.readBitNoRefill() != 0 {
		return -1
	}
	lBits := br.readBitsNoRefill(2) + 8
	var td tansData
	if !tansDecodeTable(&br, lBits, &td) {
		return -1
	}
	s := br.p - (24-br.bitpos)/8
	if s >= srcEnd {
		return -1
	}
	lut := make([]tansLutEnt, 1<<uint(lBits))
	tansInitLut(&td, lBits, lut)
	lMask := uint32(1<<uint(lBits)) - 1
	bitsF := rd32(src, s)
	s += 4
	bitsB := rd32be(src, srcEnd-4)
	srcEnd -= 4
	bitposF, bitposB := 32, 32
	st := [5]uint32{}
	st[0] = bitsF & lMask
	st[1] = bitsB & lMask
	bitsF >>= uint(lBits)
	bitposF -= lBits
	bitsB >>= uint(lBits)
	bitposB -= lBits
	st[2] = bitsF & lMask
	st[3] = bitsB & lMask
	bitsF >>= uint(lBits)
	bitposF -= lBits
	bitsB >>= uint(lBits)
	bitposB -= lBits
	bitsF |= rd32(src, s) << uint(bitposF)
	s += (31 - bitposF) >> 3
	bitposF |= 24
	st[4] = bitsF & lMask
	bitsF >>= uint(lBits)
	bitposF -= lBits
	ptrF := s - (bitposF >> 3)
	bitposF &= 7
	ptrB := srcEnd + (bitposB >> 3)
	bitposB &= 7
	d, dEnd := 0, dstSize-5
	if ptrF > ptrB {
		return -1
	}
	// rounds: forward states 0,1 | 2,3 | 4 then backward 0,1 | 2,3 | 4
	if d < dEnd {
	loop:
		for {
			for grp := 0; grp < 2; grp++ {
				for _, pair := range [3][]int{{0, 1}, {2, 3}, {4}} {
					if grp == 0 {
						bitsF |= rd32(src, ptrF) << uint(bitposF)
						ptrF += (31 - bitposF) >> 3
						bitposF |= 24
					} else {
						bitsB |= rd32be(src, ptrB-4) << uint(bitposB)
						ptrB -= (31 - bitposB) >> 3
						bitposB |= 24
					}
					for _, si := range pair {
						e := lut[st[si]]
						dst[d] = e.sym
						d++
						if grp == 0 {
							bitposF -= int(e.bitsX)
							st[si] = (bitsF & e.x) + uint32(e.w)
							bitsF >>= e.bitsX
						} else {
							bitposB -= int(e.bitsX)
							st[si] = (bitsB & e.x) + uint32(e.w)
							bitsB >>= e.bitsX
						}
						if d >= dEnd {
							break loop
						}
					}
				}
			}
		}
	}
	if ptrB-ptrF+(bitposF>>3)+(bitposB>>3) != 0 {
		return -1
	}
	if (st[0]|st[1]|st[2]|st[3]|st[4])&^0xFF != 0 {
		return -1
	}
	for i := 0; i < 5; i++ {
		dst[dEnd+i] = byte(st[i])
	}
	return srcSize
}

// ---------------------------------------------------------------- RLE

func decodeRLE(src []byte, dst []byte) int {
	srcSize := len(src)
	if srcSize <= 1 {
		if srcSize != 1 {
			return -1
		}
		for i := range dst {
			dst[i] = src[0]
		}
		return 1
	}
	cmd := src[1:]
	if src[0] != 0 {
		dec, n, err := decodeBytes(make([]byte, 0x40000), src, true)
		if err != nil || n <= 0 {
			return -1
		}
		c := make([]byte, 0, len(dec)+srcSize-n)
		c = append(c, dec...)
		c = append(c, src[n:]...)
		cmd = c
	}
	cp, ce := 0, len(cmd)
	d := 0
	rle := byte(0)
	for cp < ce {
		c := uint32(cmd[ce-1])
		if c-1 >= 0x2f {
			ce--
			copyN := int((^c) & 0xF)
			rleN := int(c >> 4)
			if len(dst)-d < copyN+rleN || ce-cp < copyN {
				return -1
			}
			copy(dst[d:], cmd[cp:cp+copyN])
			cp += copyN
			d += copyN
			for i := 0; i < rleN; i++ {
				dst[d+i] = rle
			}
			d += rleN
		} else if c >= 0x10 {
			data := int(rd16(cmd, ce-2)) - 4096
			ce -= 2
			copyN := data & 0x3F
			rleN := data >> 6
			if len(dst)-d < copyN+rleN || ce-cp < copyN {
				return -1
			}
			copy(dst[d:], cmd[cp:cp+copyN])
			cp += copyN
			d += copyN
			for i := 0; i < rleN; i++ {
				dst[d+i] = rle
			}
			d += rleN
		} else if c == 1 {
			rle = cmd[cp]
			cp++
			ce--
		} else if c >= 9 {
			rleN := (int(rd16(cmd, ce-2)) - 0x8ff) * 128
			ce -= 2
			if len(dst)-d < rleN {
				return -1
			}
			for i := 0; i < rleN; i++ {
				dst[d+i] = rle
			}
			d += rleN
		} else {
			copyN := (int(rd16(cmd, ce-2)) - 511) * 64
			ce -= 2
			if ce-cp < copyN || len(dst)-d < copyN {
				return -1
			}
			copy(dst[d:], cmd[cp:cp+copyN])
			d += copyN
			cp += copyN
		}
	}
	if ce != cp || d != len(dst) {
		return -1
	}
	return srcSize
}

// ---------------------------------------------------------------- block layer

// blockSize: size of the decoded block that starts at src (without decoding it).
func blockSize(src []byte, capacity int) (int, bool) {
	if len(src) < 2 {
		return 0, false
	}
	ct := (src[0] >> 4) & 7
	if ct == 0 {
		var sz, hdr int
		if src[0] >= 0x80 {
			sz, hdr = int(src[0])<<8|int(src[1])&0xFFF, 2
			sz &= 0xFFF
		} else {
			if len(src) < 3 {
				return 0, false
			}
			sz, hdr = int(src[0])<<16|int(src[1])<<8|int(src[2]), 3
			if sz&^0x3ffff != 0 {
				return 0, false
			}
		}
		if sz > capacity || len(src)-hdr < sz {
			return 0, false
		}
		return sz, true
	}
	if ct >= 6 {
		return 0, false
	}
	var srcSize, dstSize, hdr int
	if src[0] >= 0x80 {
		if len(src) < 3 {
			return 0, false
		}
		b := uint32(src[0])<<16 | uint32(src[1])<<8 | uint32(src[2])
		srcSize = int(b & 0x3ff)
		dstSize = srcSize + int((b>>10)&0x3ff) + 1
		hdr = 3
	} else {
		if len(src) < 5 {
			return 0, false
		}
		b := uint32(src[1])<<24 | uint32(src[2])<<16 | uint32(src[3])<<8 | uint32(src[4])
		srcSize = int(b & 0x3ffff)
		dstSize = int(((b>>18)|uint32(src[0])<<14)&0x3FFFF) + 1
		if srcSize >= dstSize {
			return 0, false
		}
		hdr = 5
	}
	if len(src)-hdr < srcSize || dstSize > capacity {
		return 0, false
	}
	return dstSize, true
}

// decodeBytes decodes one entropy block from the start of src. dst gives the
// capacity (and storage). With forceMemmove false a stored block may be
// returned as a view into src. Returns the data and the bytes of src used.
func decodeBytes(dst []byte, src []byte, forceMemmove bool) ([]byte, int, error) {
	if len(src) < 2 {
		return nil, 0, ErrCorrupt
	}
	ct := (src[0] >> 4) & 7
	if ct == 0 {
		var sz, hdr int
		if src[0] >= 0x80 {
			sz, hdr = (int(src[0])<<8|int(src[1]))&0xFFF, 2
		} else {
			if len(src) < 3 {
				return nil, 0, ErrCorrupt
			}
			sz, hdr = int(src[0])<<16|int(src[1])<<8|int(src[2]), 3
			if sz&^0x3ffff != 0 {
				return nil, 0, ErrCorrupt
			}
		}
		if sz > len(dst) || len(src)-hdr < sz {
			return nil, 0, ErrCorrupt
		}
		if forceMemmove {
			copy(dst, src[hdr:hdr+sz])
			return dst[:sz], hdr + sz, nil
		}
		return src[hdr : hdr+sz], hdr + sz, nil
	}
	var srcSize, dstSize, hdr int
	if src[0] >= 0x80 {
		if len(src) < 3 {
			return nil, 0, ErrCorrupt
		}
		b := uint32(src[0])<<16 | uint32(src[1])<<8 | uint32(src[2])
		srcSize = int(b & 0x3ff)
		dstSize = srcSize + int((b>>10)&0x3ff) + 1
		hdr = 3
	} else {
		if len(src) < 5 {
			return nil, 0, ErrCorrupt
		}
		b := uint32(src[1])<<24 | uint32(src[2])<<16 | uint32(src[3])<<8 | uint32(src[4])
		srcSize = int(b & 0x3ffff)
		dstSize = int(((b>>18)|uint32(src[0])<<14)&0x3FFFF) + 1
		if srcSize >= dstSize {
			return nil, 0, ErrCorrupt
		}
		hdr = 5
	}
	if len(src)-hdr < srcSize || dstSize > len(dst) {
		return nil, 0, ErrCorrupt
	}
	body := src[hdr : hdr+srcSize]
	out := dst[:dstSize]
	used := -1
	switch ct {
	case 2, 4:
		used = decodeHuff(body, out, int(ct>>1))
	case 5:
		used = decodeRecursive(body, out)
	case 3:
		used = decodeRLE(body, out)
	case 1:
		used = decodeTans(body, out)
	}
	if used != srcSize {
		return nil, 0, fmt.Errorf("%w (entropy block type %d)", ErrCorrupt, ct)
	}
	return out, hdr + srcSize, nil
}

func decodeRecursive(src []byte, out []byte) int {
	if len(src) < 6 {
		return -1
	}
	n := int(src[0] & 0x7f)
	if n < 2 {
		return -1
	}
	if src[0]&0x80 == 0 {
		s, o := 1, 0
		for ; n > 0; n-- {
			dec, used, err := decodeBytes(out[o:], src[s:], true)
			if err != nil {
				return -1
			}
			o += len(dec)
			s += used
		}
		if o != len(out) {
			return -1
		}
		return s
	}
	arrays, total, used, err := decodeMultiArray(src, len(out), 1, true)
	if err != nil || total != len(out) {
		return -1
	}
	copy(out, arrays[0])
	return used
}

var bitmasks [32]uint32

func init() {
	for i := range bitmasks {
		bitmasks[i] = uint32((uint64(1) << uint(i+1)) - 1)
	}
}

// decodeMultiArray: several output arrays built from intervals of a few entropy-coded arrays.
// Returns the arrays, the total of the entropy arrays and the bytes of src used.
func decodeMultiArray(src []byte, capacity int, arrayCount int, forceMemmove bool) ([][]byte, int, int, error) {
	if len(src) < 4 {
		return nil, 0, 0, ErrCorrupt
	}
	s := 0
	numInFile := int(src[s])
	s++
	if numInFile&0x80 == 0 {
		return nil, 0, 0, ErrCorrupt
	}
	numInFile &= 0x3f
	arrays := make([][]byte, arrayCount)
	total := 0
	if numInFile == 0 {
		buf := make([]byte, capacity)
		o := 0
		for i := 0; i < arrayCount; i++ {
			dec, used, err := decodeBytes(buf[o:], src[s:], forceMemmove)
			if err != nil {
				return nil, 0, 0, err
			}
			if forceMemmove {
				o += len(dec)
			}
			arrays[i] = dec
			s += used
			total += len(dec)
		}
		return arrays, total, s, nil
	}
	ent := make([][]byte, numInFile)
	for i := 0; i < numInFile; i++ {
		dec, used, err := decodeBytes(make([]byte, 0x40000), src[s:], forceMemmove)
		if err != nil {
			return nil, 0, 0, err
		}
		ent[i] = dec
		total += len(dec)
		s += used
	}
	if len(src)-s < 3 {
		return nil, 0, 0, ErrCorrupt
	}
	Q := int(rd16(src, s))
	s += 2
	numIndexes, ok := blockSize(src[s:], total)
	if !ok {
		return nil, 0, 0, ErrCorrupt
	}
	numLens := numIndexes - arrayCount
	if numLens < 1 {
		return nil, 0, 0, ErrCorrupt
	}
	var lenlog2, indexes []byte
	if Q&0x8000 != 0 {
		dec, used, err := decodeBytes(make([]byte, numIndexes), src[s:], true)
		if err != nil || len(dec) != numIndexes {
			return nil, 0, 0, ErrCorrupt
		}
		s += used
		lenlog2 = make([]byte, numIndexes)
		indexes = make([]byte, numIndexes)
		for i := 0; i < numIndexes; i++ {
			lenlog2[i] = dec[i] >> 4
			indexes[i] = dec[i] & 0xF
		}
		numLens = numIndexes
	} else {
		chunk := numIndexes - arrayCount
		dec, used, err := decodeBytes(make([]byte, numIndexes), src[s:], false)
		if err != nil || len(dec) != numIndexes {
			return nil, 0, 0, ErrCorrupt
		}
		indexes = dec
		s += used
		dec, used, err = decodeBytes(make([]byte, chunk), src[s:], false)
		if err != nil || len(dec) != chunk {
			return nil, 0, 0, ErrCorrupt
		}
		lenlog2 = dec
		s += used
		for i := 0; i < chunk; i++ {
			if lenlog2[i] > 16 {
				return nil, 0, 0, ErrCorrupt
			}
		}
	}
	varbits := Q & 0x3FFF
	if len(src)-s < varbits {
		return nil, 0, 0, ErrCorrupt
	}
	f := s
	endActual := s + varbits
	b := endActual
	var bitsF, bitsB uint32
	bitposF, bitposB := 24, 24
	ivals := make([]uint32, numLens)
	i := 0
	for ; i+2 <= numLens; i += 2 {
		bitsF |= rd32be(src, f) >> uint(24-bitposF)
		f += (bitposF + 7) >> 3
		bitsB |= rd32(src, b-4) >> uint(24-bitposB)
		b -= (bitposB + 7) >> 3
		nf, nb := int(lenlog2[i]), int(lenlog2[i+1])
		bitsF = bits.RotateLeft32(bitsF|1, nf)
		bitposF += nf - 8*((bitposF+7)>>3)
		bitsB = bits.RotateLeft32(bitsB|1, nb)
		bitposB += nb - 8*((bitposB+7)>>3)
		ivals[i] = bitsF & bitmasks[nf]
		bitsF &^= bitmasks[nf]
		ivals[i+1] = bitsB & bitmasks[nb]
		bitsB &^= bitmasks[nb]
	}
	if i < numLens {
		bitsF |= rd32be(src, f) >> uint(24-bitposF)
		nf := int(lenlog2[i])
		bitsF = bits.RotateLeft32(bitsF|1, nf)
		ivals[i] = bitsF & bitmasks[nf]
	}
	if indexes[numIndexes-1] != 0 {
		return nil, 0, 0, ErrCorrupt
	}
	out := make([]byte, 0, total)
	pos := make([]int, numInFile)
	indi, leni := 0, 0
	inc := 0
	if Q&0x8000 != 0 {
		inc = 1
	}
	for a := 0; a < arrayCount; a++ {
		start := len(out)
		if indi >= numIndexes {
			return nil, 0, 0, ErrCorrupt
		}
		for {
			srcIdx := int(indexes[indi])
			indi++
			if srcIdx == 0 {
				break
			}
			if srcIdx > numInFile || leni >= numLens {
				return nil, 0, 0, ErrCorrupt
			}
			cur := int(ivals[leni])
			leni++
			e := ent[srcIdx-1]
			if cur > len(e)-pos[srcIdx-1] || len(out)+cur > capacity {
				return nil, 0, 0, ErrCorrupt
			}
			out = append(out, e[pos[srcIdx-1]:pos[srcIdx-1]+cur]...)
			pos[srcIdx-1] += cur
		}
		leni += inc
		arrays[a] = out[start:len(out):len(out)]
	}
	if indi != numIndexes || leni != numLens {
		return nil, 0, 0, ErrCorrupt
	}
	for k := 0; k < numInFile; k++ {
		if pos[k] != len(ent[k]) {
			return nil, 0, 0, ErrCorrupt
		}
	}
	return arrays, total, endActual, nil
}

// ---------------------------------------------------------------- Leviathan LZ

type levLz struct {
	offs   []int32
	lens   []int32
	lit    [][]byte
	cmd    []byte   // single command stream, or nil
	multi  [][]byte // eight command streams
	cmdLen int
}

func unpackOffsets(src []byte, packedOffs, packedExtra []byte, scale int, packedLen []byte, offs, lens []int32) bool {
	a := bitReader{b: src, p: 0, pEnd: len(src), bitpos: 24}
	a.refill()
	bb := bitReader{b: src, p: len(src), pEnd: 0, bitpos: 24}
	bb.refillBack()
	if bb.bits < 0x2000 {
		return false
	}
	n := 31 - bsr(bb.bits)
	bb.bitpos += n
	bb.bits <<= uint(n)
	bb.refillBack()
	n++
	u32Size := int(bb.bits>>uint(32-n)) - 1
	bb.bitpos += n
	bb.bits <<= uint(n)
	bb.refillBack()
	oi := 0
	if scale == 0 {
		for k := 0; k < len(packedOffs); {
			offs[oi] = -int32(a.readDistance(uint32(packedOffs[k]), false))
			oi++
			k++
			if k == len(packedOffs) {
				break
			}
			offs[oi] = -int32(bb.readDistance(uint32(packedOffs[k]), true))
			oi++
			k++
		}
	} else {
		for k := 0; k < len(packedOffs); {
			cmd := uint32(packedOffs[k])
			k++
			if cmd>>3 > 26 {
				return false
			}
			o := ((8 + (cmd & 7)) << (cmd >> 3)) | a.readMoreThan24(int(cmd>>3), false)
			offs[oi] = 8 - int32(o)
			oi++
			if k == len(packedOffs) {
				break
			}
			cmd = uint32(packedOffs[k])
			k++
			if cmd>>3 > 26 {
				return false
			}
			o = ((8 + (cmd & 7)) << (cmd >> 3)) | bb.readMoreThan24(int(cmd>>3), true)
			offs[oi] = 8 - int32(o)
			oi++
		}
		if scale != 1 {
			for i := 0; i < oi; i++ {
				offs[i] = int32(scale)*offs[i] - int32(packedExtra[i])
			}
		}
	}
	if u32Size > 512 || u32Size < 0 {
		return false
	}
	u32 := make([]uint32, u32Size)
	i := 0
	for ; i+1 < u32Size; i += 2 {
		v, ok := a.readLength(false)
		if !ok {
			return false
		}
		u32[i] = v
		v, ok = bb.readLength(true)
		if !ok {
			return false
		}
		u32[i+1] = v
	}
	if i < u32Size {
		v, ok := a.readLength(false)
		if !ok {
			return false
		}
		u32[i] = v
	}
	a.p -= (24 - a.bitpos) >> 3
	bb.p += (24 - bb.bitpos) >> 3
	if a.p != bb.p {
		return false
	}
	ui := 0
	for k := range packedLen {
		v := uint32(packedLen[k])
		if v == 255 {
			if ui >= len(u32) {
				return false
			}
			v = u32[ui] + 255
			ui++
		}
		lens[k] = int32(v + 3)
	}
	return ui == len(u32)
}

func levReadLzTable(mode int, src []byte, win []byte, dstPos, dstSize int) (*levLz, error) {
	if mode > 5 || len(src) < 13 {
		return nil, ErrCorrupt
	}
	s := 0
	if dstPos == 0 {
		copy(win[0:8], src[0:8])
		s = 8
	}
	scaling := 0
	var packedOffs, packedExtra []byte
	offsLimit := dstSize / 3
	var err error
	var used int
	if src[s]&0x80 == 0 {
		packedOffs, used, err = decodeBytes(make([]byte, offsLimit), src[s:], false)
		if err != nil {
			return nil, err
		}
		s += used
	} else {
		scaling = int(src[s]) - 127
		s++
		packedOffs, used, err = decodeBytes(make([]byte, offsLimit), src[s:], false)
		if err != nil {
			return nil, err
		}
		s += used
		if scaling != 1 {
			packedExtra, used, err = decodeBytes(make([]byte, offsLimit), src[s:], false)
			if err != nil || len(packedExtra) != len(packedOffs) {
				return nil, ErrCorrupt
			}
			s += used
		}
	}
	packedLen, used, err := decodeBytes(make([]byte, dstSize/5), src[s:], false)
	if err != nil {
		return nil, err
	}
	s += used
	lz := &levLz{offs: make([]int32, len(packedOffs)), lens: make([]int32, len(packedLen))}
	if mode <= 1 {
		lit, used, err := decodeBytes(make([]byte, dstSize), src[s:], true)
		if err != nil {
			return nil, err
		}
		s += used
		lz.lit = [][]byte{lit}
	} else {
		count := 16
		if mode == 2 {
			count = 2
		} else if mode == 3 {
			count = 4
		}
		arrays, _, used, err := decodeMultiArray(src[s:], 0x40000, count, true)
		if err != nil {
			return nil, err
		}
		s += used
		lz.lit = arrays
	}
	if s >= len(src) {
		return nil, ErrCorrupt
	}
	if src[s]&0x80 == 0 {
		cmd, used, err := decodeBytes(make([]byte, dstSize), src[s:], true)
		if err != nil {
			return nil, err
		}
		s += used
		lz.cmd, lz.cmdLen = cmd, len(cmd)
	} else {
		if src[s] != 0x83 {
			return nil, ErrCorrupt
		}
		s++
		arrays, total, used, err := decodeMultiArray(src[s:], 0x40000, 8, true)
		if err != nil {
			return nil, err
		}
		s += used
		lz.multi, lz.cmdLen = arrays, total
	}
	if !unpackOffsets(src[s:], packedOffs, packedExtra, scaling, packedLen, lz.offs, lz.lens) {
		return nil, fmt.Errorf("%w (offsets)", ErrCorrupt)
	}
	return lz, nil
}

// levProcessLz runs the match copier for one chunk: win[chunk : chunk+size],
// starting at dst (chunk, or chunk+8 for the very first chunk).
func levProcessLz(mode int, lz *levLz, win []byte, dst, chunk, dstEnd int) error {
	bad := func(what string) error { return fmt.Errorf("%w (%s)", ErrCorrupt, what) }
	matchZoneEnd := chunk
	if dstEnd-chunk >= 16 {
		matchZoneEnd = dstEnd - 16
	}
	var recent [16]int32
	for i := 8; i < 15; i++ {
		recent[i] = -8
	}
	offset := -8
	li, lenEnd := 0, len(lz.lens)
	oi := 0
	// literal streams
	nl := len(lz.lit)
	lpos := make([]int, nl)
	litAt := func(s, i int) (byte, bool) {
		if s >= nl || i < 0 || i >= len(lz.lit[s]) {
			return 0, false
		}
		return lz.lit[s][i], true
	}
	var nextLit [16]byte
	if mode == 4 {
		if nl < 16 {
			return bad("literal streams")
		}
		for i := 0; i < 16; i++ {
			nextLit[i], _ = litAt(i, 0)
			lpos[i] = 1
		}
	}
	put := func(p int, v byte) bool {
		if p < 0 || p >= len(win) {
			return false
		}
		win[p] = v
		return true
	}
	// one literal at dst for the "sub" family: literal + byte at the last offset
	sub := func(stream int) bool {
		l, ok := litAt(stream, lpos[stream])
		if !ok || dst+offset < 0 {
			return false
		}
		lpos[stream]++
		if !put(dst, l+win[dst+offset]) {
			return false
		}
		dst++
		return true
	}
	o1 := func() bool {
		if dst-1 < 0 {
			return false
		}
		slot := int(win[dst-1] >> 4)
		if !put(dst, nextLit[slot]) {
			return false
		}
		dst++
		nextLit[slot], _ = litAt(slot, lpos[slot])
		lpos[slot]++
		return true
	}
	copyLits := func(cmd uint32) bool {
		litCmd := cmd & 0x18
		switch mode {
		case 0, 1:
			litlen := int((cmd >> 3) & 3)
			if litlen == 3 {
				if li >= len(lz.lens) {
					return false
				}
				litlen = int(lz.lens[li] & 0xffffff)
				li++
			}
			if litlen > 24 && litlen > matchZoneEnd-dst {
				return false
			}
			for k := 0; k < litlen; k++ {
				if mode == 1 {
					l, ok := litAt(0, lpos[0])
					if !ok || !put(dst, l) {
						return false
					}
					lpos[0]++
					dst++
				} else if !sub(0) {
					return false
				}
			}
		case 2:
			if litCmd == 0 {
				return true
			}
			litlen := int(litCmd >> 3)
			if litlen == 3 {
				if li >= len(lz.lens) {
					return false
				}
				litlen = int(lz.lens[li] & 0xffffff)
				li++
			}
			if litlen == 0 {
				return false
			}
			litlen--
			if !sub(1) {
				return false
			}
			if litlen > 24 && litlen > matchZoneEnd-dst {
				return false
			}
			for k := 0; k < litlen; k++ {
				if !sub(0) {
					return false
				}
			}
		case 3, 5:
			mask := 3
			if mode == 5 {
				mask = 15
			}
			n := 0
			if litCmd == 0x18 {
				if li >= len(lz.lens) {
					return false
				}
				n = int(lz.lens[li] & 0xffffff)
				li++
				if n > matchZoneEnd-dst {
					return false
				}
			} else if litCmd != 0 {
				n = int(litCmd >> 3)
			}
			for k := 0; k < n; k++ {
				if !sub((dst - chunk) & mask) {
					return false
				}
			}
		case 4:
			n := 0
			if litCmd == 0x18 {
				if li >= len(lz.lens) {
					return false
				}
				n = int(lz.lens[li])
				li++
				if n <= 0 {
					return false
				}
			} else if litCmd != 0 {
				n = int(litCmd >> 3)
			}
			for k := 0; k < n; k++ {
				if !o1() {
					return false
				}
			}
		}
		return true
	}
	finalLits := func(n int) bool {
		switch mode {
		case 1:
			for ; n > 0; n-- {
				l, ok := litAt(0, lpos[0])
				if !ok || !put(dst, l) {
					return false
				}
				lpos[0]++
				dst++
			}
		case 0:
			for ; n > 0; n-- {
				if !sub(0) {
					return false
				}
			}
		case 2:
			if !sub(1) {
				return false
			}
			for n--; n > 0; n-- {
				if !sub(0) {
					return false
				}
			}
		case 3, 5:
			mask := 3
			if mode == 5 {
				mask = 15
			}
			for ; n > 0; n-- {
				if !sub((dst - chunk) & mask) {
					return false
				}
			}
		case 4:
			for ; n > 0; n-- {
				if !o1() {
					return false
				}
			}
		}
		return true
	}

	multi := lz.cmd == nil
	var mpos [8]int
	ci := 0
	left := lz.cmdLen
	cp := 0
	if multi {
		if len(lz.multi) != 8 {
			return bad("command streams")
		}
		ci = (dst - chunk) & 7
	}
	for {
		var cmd uint32
		if !multi {
			if cp >= len(lz.cmd) {
				break
			}
			cmd = uint32(lz.cmd[cp])
			cp++
		} else {
			if left == 0 {
				break
			}
			left--
			if mpos[ci] >= len(lz.multi[ci]) {
				return bad("command stream overrun")
			}
			cmd = uint32(lz.multi[ci][mpos[ci]])
			mpos[ci]++
		}
		offsIndex := int(cmd >> 5)
		matchlen := int(cmd&7) + 2
		if oi < len(lz.offs) {
			recent[15] = lz.offs[oi]
		} else {
			recent[15] = 0
		}
		if !copyLits(cmd) {
			return bad("literals")
		}
		offset = int(recent[offsIndex+8])
		copy(recent[offsIndex+1:offsIndex+9], recent[offsIndex:offsIndex+8])
		recent[8] = int32(offset)
		if offsIndex == 7 {
			oi++
		}
		if offset >= 0 || dst+offset < 0 {
			return bad("match offset")
		}
		if matchlen == 9 {
			if li >= lenEnd {
				return bad("length stream empty")
			}
			lenEnd--
			matchlen = int(lz.lens[lenEnd]) + 6
			if matchlen > 16 && matchlen > dstEnd-8-dst {
				return bad("match length")
			}
		}
		if dst+matchlen > len(win) {
			return bad("match past end")
		}
		for k := 0; k < matchlen; k++ {
			win[dst+k] = win[dst+offset+k]
		}
		dst += matchlen
		if multi {
			ci = (dst - chunk) & 7
		}
	}
	if oi != len(lz.offs) || li != lenEnd {
		return bad("streams not fully used")
	}
	if dst < dstEnd {
		if !finalLits(dstEnd - dst) {
			return bad("final literals")
		}
	} else if dst != dstEnd {
		return bad("chunk overrun")
	}
	return nil
}

func levDecodeQuantum(win []byte, dst, dstEnd int, src []byte) (int, error) {
	s := 0
	for dstEnd-dst != 0 {
		count := dstEnd - dst
		if count > 0x20000 {
			count = 0x20000
		}
		if len(src)-s < 4 {
			return -1, ErrCorrupt
		}
		hdr := int(src[s+2]) | int(src[s+1])<<8 | int(src[s])<<16
		var used int
		if hdr&0x800000 == 0 {
			dec, u, err := decodeBytes(win[dst:dst+count], src[s:], false)
			if err != nil {
				return -1, err
			}
			if len(dec) != count {
				return -1, ErrCorrupt
			}
			copy(win[dst:dst+count], dec)
			used = u
		} else {
			s += 3
			used = hdr & 0x7FFFF
			mode := (hdr >> 19) & 0xF
			if len(src)-s < used {
				return -1, ErrCorrupt
			}
			if used < count {
				lz, err := levReadLzTable(mode, src[s:s+used], win, dst, count)
				if err != nil {
					return -1, err
				}
				start := dst
				if dst == 0 {
					start = 8
				}
				if err := levProcessLz(mode, lz, win, start, dst, dst+count); err != nil {
					return -1, err
				}
			} else if used > count || mode != 0 {
				return -1, ErrCorrupt
			} else {
				copy(win[dst:dst+count], src[s:s+count])
			}
		}
		s += used
		dst += count
	}
	return s, nil
}

// ---------------------------------------------------------------- frame

// Decompress decodes a complete Oodle stream into exactly dstLen bytes.
func Decompress(src []byte, dstLen int) ([]byte, error) {
	win := make([]byte, dstLen+64)
	var decType int
	var uncompressed, checksums bool
	off, s := 0, 0
	for off < dstLen {
		if off&0x3FFFF == 0 {
			if len(src)-s < 2 {
				return nil, ErrCorrupt
			}
			b := src[s]
			if b&0xF != 0xC || (b>>4)&3 != 0 {
				return nil, fmt.Errorf("%w (block header)", ErrCorrupt)
			}
			uncompressed = (b>>6)&1 != 0
			decType = int(src[s+1] & 0x7F)
			checksums = src[s+1]>>7 != 0
			s += 2
		}
		if decType != 12 {
			return nil, fmt.Errorf("%w: type %d", ErrUnsupported, decType)
		}
		left := dstLen - off
		if left > 0x40000 {
			left = 0x40000
		}
		if uncompressed {
			if len(src)-s < left {
				return nil, ErrCorrupt
			}
			copy(win[off:], src[s:s+left])
			s += left
			off += left
			continue
		}
		if len(src)-s < 3 {
			return nil, ErrCorrupt
		}
		v := uint32(src[s])<<16 | uint32(src[s+1])<<8 | uint32(src[s+2])
		size := v & 0x3FFFF
		var comp int
		var fill byte
		if size != 0x3ffff {
			comp = int(size) + 1
			s += 3
			if checksums {
				s += 3
			}
		} else if v>>18 == 1 {
			if len(src)-s < 4 {
				return nil, ErrCorrupt
			}
			fill = src[s+3]
			comp = 0
			s += 4
		} else {
			return nil, ErrCorrupt
		}
		if len(src)-s < comp || comp > left {
			return nil, ErrCorrupt
		}
		switch {
		case comp == 0:
			for i := 0; i < left; i++ {
				win[off+i] = fill
			}
		case comp == left:
			copy(win[off:], src[s:s+left])
		default:
			n, err := levDecodeQuantum(win, off, off+left, src[s:s+comp])
			if err != nil {
				return nil, fmt.Errorf("at output byte %d: %w", off, err)
			}
			if n != comp {
				return nil, fmt.Errorf("%w (quantum size)", ErrCorrupt)
			}
		}
		s += comp
		off += left
	}
	if s != len(src) {
		return nil, fmt.Errorf("%w (trailing data)", ErrCorrupt)
	}
	return win[:dstLen], nil
}

// Golomb-Rice unary tables (the C code has them as literal tables; computed
// here). For a byte read MSB first, each set bit ends one value whose size is
// the number of zero bits before it. Values are packed as nibbles in the
// order 0,4,1,5,2,6,3,7 so that x&0x0f0f0f0f gives values 0-3 as bytes and
// (x>>4)&0x0f0f0f0f gives values 4-7; the top nibble holds the zero bits left
// after the last set bit (when there are fewer than eight values).
var kRiceCodeBits2Value [256]uint32
var kRiceCodeBits2Len [256]uint8

func init() {
	for v := 1; v < 256; v++ {
		var vals []uint32
		run := uint32(0)
		for b := 7; b >= 0; b-- {
			if v>>uint(b)&1 != 0 {
				vals = append(vals, run)
				run = 0
			} else {
				run++
			}
		}
		var x uint32
		for k, val := range vals {
			nib := 2 * k
			if k >= 4 {
				nib = 2*(k-4) + 1
			}
			x |= val << uint(4*nib)
		}
		if len(vals) < 8 {
			x = x&0x0FFFFFFF | run<<28
		}
		kRiceCodeBits2Value[v] = x
		kRiceCodeBits2Len[v] = uint8(len(vals))
	}
}
