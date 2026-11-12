// blk_dict.go — OURS (not upstream). Adds the dictionary-compressed BLK type
// (0x05, SLIM_ZSTD_DICT), which most game data blocks inside the game's
// vromfs archives use.
package wrpl

import (
	"errors"
	"fmt"

	"github.com/klauspost/compress/zstd"
)

// ParseBlkAny parses any current BLK type. nameMap comes from the archive's
// name-map entry; dict is the archive's zstd dictionary (the *.dict entry).
// Either may be nil when the BLK does not need it.
func ParseBlkAny(input []byte, nameMap []string, dict []byte) (map[string]any, error) {
	if len(input) == 0 {
		return nil, errors.New("empty BLK buffer")
	}
	if input[0] != 0x05 {
		return ParseBlkWithNameMap(input, nameMap)
	}
	if nameMap == nil {
		return nil, errors.New("SLIM_ZSTD_DICT BLK needs the archive name map")
	}
	if len(dict) == 0 {
		return nil, errors.New("SLIM_ZSTD_DICT BLK needs the archive dictionary")
	}
	dec, err := zstd.NewReader(nil, zstd.WithDecoderDicts(dict))
	if err != nil {
		return nil, fmt.Errorf("SLIM_ZSTD_DICT: new zstd reader: %w", err)
	}
	defer dec.Close()
	out, err := dec.DecodeAll(input[1:], nil)
	if err != nil {
		return nil, fmt.Errorf("SLIM_ZSTD_DICT: decode: %w", err)
	}
	return parseFatBlk(out, nameMap)
}
