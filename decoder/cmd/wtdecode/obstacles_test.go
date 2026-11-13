package main

import (
	"encoding/binary"
	"math"
	"testing"
)

// A 10×6×20 m building rotated 90° and doubled in height: points inside the
// inner 80% of its box are inside, points just outside are not.
func TestObstacleInside(t *testing.T) {
	types := []obstacleType{{Kind: "building", Min: [3]float64{-5, 0, -10}, Max: [3]float64{5, 3, 10}}}
	raw := make([]byte, 52)
	le := binary.LittleEndian
	put := func(i int, v float64) { le.PutUint32(raw[4+4*i:], math.Float32bits(float32(v))) }
	put(0, 100)
	put(1, 50)
	put(2, 200)
	// columns: local x -> world z, local y -> world y (×2), local z -> world -x
	for i, v := range []float64{0, 0, 1, 0, 2, 0, -1, 0, 0} {
		put(3+i, v)
	}
	ix := newObstacleIndex(types, raw)
	for _, c := range []struct {
		p    [3]float64
		want bool
	}{
		{[3]float64{100, 51, 200}, true},
		{[3]float64{100 + 7, 51, 200 + 3}, true}, // local z = -7 (x long side), local x = 3
		{[3]float64{100 + 9.5, 51, 200}, false},  // beyond 80% of 10 m
		{[3]float64{100, 51, 200 + 4.5}, false},  // local x 4.5 > 4
		{[3]float64{100, 50 + 5.5, 200}, false},  // above 80% of 6 m
	} {
		if got := ix.inside(c.p); got != c.want {
			t.Errorf("inside(%v) = %v, want %v", c.p, got, c.want)
		}
	}
}
