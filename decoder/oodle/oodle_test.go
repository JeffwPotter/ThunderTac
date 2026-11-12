package oodle

import (
	"bytes"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// Reference blocks: OODLE_TESTDATA=<dir> with <name>.raw (stream), .size, .ref
func TestReference(t *testing.T) {
	dir := os.Getenv("OODLE_TESTDATA")
	if dir == "" {
		t.Skip("OODLE_TESTDATA not set")
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*.raw"))
	for _, f := range files {
		base := strings.TrimSuffix(f, ".raw")
		src, _ := os.ReadFile(f)
		szb, _ := os.ReadFile(base + ".size")
		n, _ := strconv.Atoi(strings.TrimSpace(string(szb)))
		ref, _ := os.ReadFile(base + ".ref")
		out, err := Decompress(src, n)
		name := filepath.Base(base)
		if err != nil {
			t.Errorf("%s: %v", name, err)
			continue
		}
		if !bytes.Equal(out, ref) {
			i := 0
			for i < len(out) && i < len(ref) && out[i] == ref[i] {
				i++
			}
			t.Errorf("%s: differs at byte %d of %d", name, i, len(ref))
			continue
		}
		t.Logf("%s: OK (%d bytes)", name, n)
	}
}
