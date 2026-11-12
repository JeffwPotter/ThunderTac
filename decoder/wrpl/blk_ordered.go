// blk_ordered.go — OURS (not upstream). An order-keeping BLK tree.
//
// Some game data is indexed by position (a radar's transceivers, scan
// patterns and signals are numbered in file order in replays), so the
// unpacked JSON must keep the BLK key order. Repeated keys become a list at
// the position of their first occurrence, like the community datamine.
package wrpl

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"

	"github.com/klauspost/compress/zstd"
)

// OMap is a BLK block with its keys in file order.
type OMap struct {
	Keys []string
	Vals map[string]any
}

func (m *OMap) put(k string, v any) {
	if ex, ok := m.Vals[k]; ok {
		if l, isList := ex.(blkList); isList {
			m.Vals[k] = append(l, v)
		} else {
			m.Vals[k] = blkList{ex, v}
		}
		return
	}
	m.Keys = append(m.Keys, k)
	m.Vals[k] = v
}

// blkList marks a list made from repeated keys (as opposed to a vector value).
type blkList []any

// ParseBlkAnyOrdered is ParseBlkAny keeping key order.
func ParseBlkAnyOrdered(input []byte, nameMap []string, dict []byte) (*OMap, error) {
	body, err := blkBody(input, nameMap, dict)
	if err != nil {
		return nil, err
	}
	flat, err := parseFatBlkFlat(body, nameMap)
	if err != nil {
		return nil, err
	}
	var build func(idx int) *OMap
	build = func(idx int) *OMap {
		fb := flat[idx]
		m := &OMap{Vals: map[string]any{}}
		for _, f := range fb.fields {
			m.put(f.name, f.value)
		}
		for c := fb.firstChild; fb.childCount > 0 && c < fb.firstChild+fb.childCount; c++ {
			m.put(flat[c].name, build(c))
		}
		return m
	}
	return build(0), nil
}

// blkBody returns the FAT body (after the type byte) of any supported BLK.
func blkBody(input []byte, nameMap []string, dict []byte) ([]byte, error) {
	if len(input) == 0 {
		return nil, errors.New("empty BLK buffer")
	}
	switch input[0] {
	case 0x01, 0x03:
		if input[0] == 0x03 && nameMap == nil {
			return nil, errors.New("SLIM BLK needs the archive name map")
		}
		return input[1:], nil
	case 0x02:
		if len(input) < 4 {
			return nil, errors.New("FAT_ZSTD: truncated header")
		}
		l := int(input[1])<<16 | int(input[2])<<8 | int(input[3])
		if len(input) < 4+l {
			return nil, errors.New("FAT_ZSTD: payload truncated")
		}
		out, err := zstdDecode(input[4:4+l], nil)
		if err != nil {
			return nil, err
		}
		if len(out) == 0 || out[0] != 0x01 {
			return nil, errors.New("FAT_ZSTD: decoded payload missing FAT header")
		}
		return out[1:], nil
	case 0x04:
		if nameMap == nil {
			return nil, errors.New("SLIM_ZSTD BLK needs the archive name map")
		}
		return zstdDecode(input[1:], nil)
	case 0x05:
		if nameMap == nil || len(dict) == 0 {
			return nil, errors.New("SLIM_ZSTD_DICT BLK needs the archive name map and dictionary")
		}
		return zstdDecode(input[1:], dict)
	}
	return nil, fmt.Errorf("unsupported BLK header 0x%02x", input[0])
}

func zstdDecode(b, dict []byte) ([]byte, error) {
	opts := []zstd.DOption{}
	if dict != nil {
		opts = append(opts, zstd.WithDecoderDicts(dict))
	}
	dec, err := zstd.NewReader(nil, opts...)
	if err != nil {
		return nil, err
	}
	defer dec.Close()
	return dec.DecodeAll(b, nil)
}

// MarshalJSON writes the block with keys in file order. Float values that are
// exact float32 numbers (all BLK reals) are written in their shortest float32
// form (1.425, not 1.4249999523162842); NaN and infinities become null.
func (m *OMap) MarshalJSON() ([]byte, error) {
	var b bytes.Buffer
	if err := writeOrdered(&b, m); err != nil {
		return nil, err
	}
	return b.Bytes(), nil
}

func writeOrdered(b *bytes.Buffer, v any) error {
	switch x := v.(type) {
	case *OMap:
		b.WriteByte('{')
		for i, k := range x.Keys {
			if i > 0 {
				b.WriteByte(',')
			}
			kb, _ := json.Marshal(k)
			b.Write(kb)
			b.WriteByte(':')
			if err := writeOrdered(b, x.Vals[k]); err != nil {
				return err
			}
		}
		b.WriteByte('}')
	case blkList:
		return writeList(b, x)
	case []any:
		return writeList(b, x)
	case float32:
		writeFloat(b, float64(x))
	case float64:
		writeFloat(b, x)
	default:
		// vectors and other values: let encoding/json handle them, but keep
		// float32 formatting for float slices
		switch y := v.(type) {
		case []float32:
			l := make([]any, len(y))
			for i := range y {
				l[i] = y[i]
			}
			return writeList(b, l)
		case []float64:
			l := make([]any, len(y))
			for i := range y {
				l[i] = y[i]
			}
			return writeList(b, l)
		}
		raw, err := json.Marshal(v)
		if err != nil {
			return err
		}
		b.Write(raw)
	}
	return nil
}

func writeList(b *bytes.Buffer, l []any) error {
	b.WriteByte('[')
	for i, e := range l {
		if i > 0 {
			b.WriteByte(',')
		}
		if err := writeOrdered(b, e); err != nil {
			return err
		}
	}
	b.WriteByte(']')
	return nil
}

func writeFloat(b *bytes.Buffer, f float64) {
	if math.IsNaN(f) || math.IsInf(f, 0) {
		b.WriteString("null")
		return
	}
	if float64(float32(f)) == f {
		b.WriteString(strconv.FormatFloat(f, 'g', -1, 32))
		return
	}
	b.WriteString(strconv.FormatFloat(f, 'g', -1, 64))
}
