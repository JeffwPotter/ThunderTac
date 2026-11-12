package oodle

import (
	"math/rand"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// Corrupted streams must give an error, never a crash.
func TestCorrupt(t *testing.T) {
	dir := os.Getenv("OODLE_TESTDATA")
	if dir == "" {
		t.Skip("OODLE_TESTDATA not set")
	}
	base := filepath.Join(dir, "air_grand_canyon_lts4")
	src, _ := os.ReadFile(base + ".raw")
	szb, _ := os.ReadFile(base + ".size")
	n, _ := strconv.Atoi(strings.TrimSpace(string(szb)))
	big, _ := os.ReadFile(filepath.Join(dir, "spain_lts4.raw"))
	big = big[:200000]
	rng := rand.New(rand.NewSource(1))
	panics := 0
	for i := 0; i < 3000; i++ {
		s := src
		size := n
		if i%2 == 1 {
			s, size = big, 7479040
		}
		c := append([]byte(nil), s...)
		for k := 0; k < 1+rng.Intn(4); k++ {
			c[2+rng.Intn(len(c)-2)] ^= byte(1 << rng.Intn(8))
		}
		if rng.Intn(4) == 0 {
			c = c[:rng.Intn(len(c))]
		}
		func() {
			defer func() {
				if r := recover(); r != nil {
					panics++
					if panics <= 5 {
						t.Logf("panic: %v", r)
					}
				}
			}()
			_, _ = Decompress(c, size)
		}()
	}
	if panics > 0 {
		t.Errorf("%d of 3000 corrupted inputs crashed", panics)
	}
}
