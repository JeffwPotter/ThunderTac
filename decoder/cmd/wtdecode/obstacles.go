// obstacles.go — ours. Buildings, walls and rocks from the terrain file
// (objects.bin, built by wtassets from the level's placed objects): an oriented
// box per object in a 2D grid, for "does this point lie inside something solid".
package main

import (
	"encoding/binary"
	"math"
)

type obstacleType struct {
	Kind     string
	Min, Max [3]float64
}

type obstacle struct {
	pos      [3]float64
	inv      [9]float64 // inverse of the 3×3 transform (row-major)
	min, max [3]float64
}

type obstacleIndex struct {
	cell  float64
	cells map[[2]int][]int32
	obs   []obstacle
}

const obstacleCell = 32.0

func newObstacleIndex(types []obstacleType, raw []byte) *obstacleIndex {
	le := binary.LittleEndian
	ix := &obstacleIndex{cell: obstacleCell, cells: map[[2]int][]int32{}}
	for o := 0; o+52 <= len(raw); o += 52 {
		ti := int(le.Uint16(raw[o:]))
		if ti >= len(types) {
			continue
		}
		ty := types[ti]
		if ty.Kind != "building" && ty.Kind != "rock" {
			continue // trees, walls and fences: shells often pass through or break them
		}
		f := func(k int) float64 { return float64(math.Float32frombits(le.Uint32(raw[o+4+4*k:]))) }
		var ob obstacle
		ob.pos = [3]float64{f(0), f(1), f(2)}
		// columns c0 = (f3,f4,f5), c1 = (f6,f7,f8), c2 = (f9,f10,f11); M = [c0 c1 c2]
		m := [9]float64{f(3), f(6), f(9), f(4), f(7), f(10), f(5), f(8), f(11)} // row-major
		inv, ok := inv3(m)
		if !ok {
			continue
		}
		// the box overstates the real shape (roofs, L-shapes, rounded rocks): use the inner 80%
		for a := 0; a < 3; a++ {
			c, h := (ty.Min[a]+ty.Max[a])/2, (ty.Max[a]-ty.Min[a])/2*0.8
			ob.min[a], ob.max[a] = c-h, c+h
		}
		ob.inv = inv
		// footprint radius for the grid
		r := 0.0
		for _, x := range []float64{ty.Min[0], ty.Max[0]} {
			for _, z := range []float64{ty.Min[2], ty.Max[2]} {
				wx := m[0]*x + m[2]*z
				wz := m[6]*x + m[8]*z
				r = math.Max(r, math.Hypot(wx, wz))
			}
		}
		id := int32(len(ix.obs))
		ix.obs = append(ix.obs, ob)
		x0, x1 := int(math.Floor((ob.pos[0]-r)/ix.cell)), int(math.Floor((ob.pos[0]+r)/ix.cell))
		z0, z1 := int(math.Floor((ob.pos[2]-r)/ix.cell)), int(math.Floor((ob.pos[2]+r)/ix.cell))
		for cx := x0; cx <= x1; cx++ {
			for cz := z0; cz <= z1; cz++ {
				k := [2]int{cx, cz}
				ix.cells[k] = append(ix.cells[k], id)
			}
		}
	}
	if len(ix.obs) == 0 {
		return nil
	}
	return ix
}

// inside reports whether world point p lies inside any obstacle.
func (ix *obstacleIndex) inside(p [3]float64) bool {
	if ix == nil {
		return false
	}
	k := [2]int{int(math.Floor(p[0] / ix.cell)), int(math.Floor(p[2] / ix.cell))}
	for _, id := range ix.cells[k] {
		ob := &ix.obs[id]
		d := [3]float64{p[0] - ob.pos[0], p[1] - ob.pos[1], p[2] - ob.pos[2]}
		for a := 0; a < 3; a++ {
			l := ob.inv[3*a]*d[0] + ob.inv[3*a+1]*d[1] + ob.inv[3*a+2]*d[2]
			if l < ob.min[a] || l > ob.max[a] {
				goto next
			}
		}
		return true
	next:
	}
	return false
}

func inv3(m [9]float64) ([9]float64, bool) {
	a, b, c, d, e, f, g, h, i := m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]
	det := a*(e*i-f*h) - b*(d*i-f*g) + c*(d*h-e*g)
	if math.Abs(det) < 1e-9 {
		return [9]float64{}, false
	}
	k := 1 / det
	return [9]float64{
		(e*i - f*h) * k, (c*h - b*i) * k, (b*f - c*e) * k,
		(f*g - d*i) * k, (a*i - c*g) * k, (c*d - a*f) * k,
		(d*h - e*g) * k, (b*g - a*h) * k, (a*e - b*d) * k,
	}, true
}
