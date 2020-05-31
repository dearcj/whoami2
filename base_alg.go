package main

import (
	"github.com/skelterjohn/go.matrix"
	"image/color"
	"math"
	"math/rand"
	"sync"
)

const offsetX = 20
const offsetY = 20

type Field struct {
	Diffs   [CANVAS_W + offsetX*2][CANVAS_H + offsetY*2]*matrix.DenseMatrix
	Points  [CANVAS_W + offsetX*2][CANVAS_H + offsetY*2]*FieldPoint
	OffsetX int
	OffsetY int
	PointsX int
	PointsY int

	MinValues *matrix.DenseMatrix
	MaxValues *matrix.DenseMatrix
}

type FieldPoint struct {
	Charge *matrix.DenseMatrix
	Rule   *matrix.DenseMatrix
}

const DIMENSIONS = 3

func Normalize(value, min, max float64) float64 {
	return (value - min) / (max - min)
}

func (field *Field) FieldToColor(f *FieldPoint) color.RGBA {
	r := f.Charge.Get(0, 0)
	g := f.Charge.Get(1, 0)
	b := f.Charge.Get(2, 0)
	r = 256. * Normalize(r, field.MinValues.Get(0, 0), field.MaxValues.Get(0, 0))
	g = 256 * Normalize(g, field.MinValues.Get(1, 0), field.MaxValues.Get(1, 0))
	b = 256 * Normalize(b, field.MinValues.Get(2, 0), field.MaxValues.Get(2, 0))

	return color.RGBA{uint8(r), uint8(g), uint8(b), 255}
}

func CreateDefaultRule(charge *matrix.DenseMatrix) *matrix.DenseMatrix {
	power := charge.Get(1, 0)

	var elems = []float64{
		power * 0.6, 0.9, 0.3, 1, 0,
		0, 0.7, power * 1, 0.6, 0,
		1.3, 1, power * 0.5, 0, 0.3,
		0.5, 1.2, 0, power * 2, 0,
		0, 0, 1.7, 0, power * 1.5,
	}
	return matrix.MakeDenseMatrix(elems, DIMENSIONS+2, DIMENSIONS+2)
}

func CreateDefaultCharge() *matrix.DenseMatrix {
	return matrix.MakeDenseMatrix([]float64{
		math.Pow(rand.Float64(), 9) * 10.,
		math.Pow(rand.Float64(), 3)*100 - 50,
		math.Pow(rand.Float64(), 15) * 100.,
	}, DIMENSIONS, 1)
}

func (f *Field) UpdateNormalizeVec() {

	var elemsMin []float64
	var elemsMax []float64
	rows := f.Points[0][0].Charge.Rows()
	for i := 0; i < rows; i++ {
		elemsMin = append(elemsMin, math.MaxFloat64)
		elemsMax = append(elemsMax, -math.MaxFloat64)
	}
	min := matrix.MakeDenseMatrix(elemsMin, rows, 1)
	max := matrix.MakeDenseMatrix(elemsMax, rows, 1)

	for x := 0; x < f.PointsX; x++ {
		for y := 0; y < f.PointsY; y++ {
			for d := 0; d < rows; d++ {
				dd := f.Points[x][y].Charge.Get(d, 0)
				if dd > max.Get(d, 0) {
					max.Set(d, 0, dd)
				}
				if dd < min.Get(d, 0) {
					min.Set(d, 0, dd)
				}
			}
		}
	}

	f.MinValues = min
	f.MaxValues = max
}

func CreateField() *Field {
	f := &Field{
		OffsetX: offsetX,
		OffsetY: offsetY,
		PointsX: CANVAS_W + 2*offsetX,
		PointsY: CANVAS_H + 2*offsetY,
	}

	for x := 0; x < f.PointsX; x++ {
		for y := 0; y < f.PointsY; y++ {
			c := CreateDefaultCharge()
			f.Points[x][y] = &FieldPoint{
				Rule:   CreateDefaultRule(c),
				Charge: c,
			}

			f.Diffs[x][y] = matrix.Zeros(DIMENSIONS+2, 1)
		}

	}

	return f
}

func (f *Field) OperateOn(x1, y1, x2, y2 int) *matrix.DenseMatrix {
	dist1 := math.Sqrt(float64((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2)))
	distInv := 1 / dist1

	p1 := f.Points[x1][y1]
	p2 := f.Points[x2][y2]
	p2charge := p2.Charge
	cp := p2charge.Copy()
	elements := cp.ColCopy(0)
	elements = append(elements, dist1, distInv)
	ff := matrix.MakeDenseMatrix(elements, len(elements), 1)

	return matrix.Product(ff, p1.Rule)
}

func (f *Field) Iterate() {
	ox := 20
	oy := 20
	var wg sync.WaitGroup
	for x := f.OffsetX; x < f.PointsX-f.OffsetX; x++ {
		wg.Add(1)
		go func(x int, wg *sync.WaitGroup) {
			defer wg.Done()
			for y := f.OffsetY; y < f.PointsY-f.OffsetY; y++ {
				if rand.Float64() < 0.5 {
					continue
				}
				for xx := x - ox; xx < x+ox; xx++ {
					for yy := y - oy; yy < y+oy; yy++ {
						if rand.Float64() < 0.5 {
							continue
						}
						if xx == x && yy == y {
							continue
						}

						change := f.OperateOn(x, y, xx, yy)
						if f.Diffs[x][y] == nil {
							f.Diffs[x][y] = matrix.Zeros(DIMENSIONS+2, 1)
						}

						f.Diffs[x][y].Add(change)

						change.Scale(-1)

						f.Diffs[xx][yy].Add(change)

					}
				}

			}
		}(x, &wg)

		wg.Wait()
	}

	for x := f.OffsetX; x < f.PointsX-f.OffsetX; x++ {
		for y := f.OffsetY; y < f.PointsY-f.OffsetY; y++ {
			arr := f.Diffs[x][y].Array()
			toAdd := arr[:DIMENSIONS]
			f.Points[x][y].Charge.Add(matrix.MakeDenseMatrix(toAdd, DIMENSIONS, 1))

			arrr := f.Diffs[x][y].Array()
			d := 0.
			for _, v := range arrr {
				d += v * v
			}
			f.Points[x][y].Rule.Scale(1 + d/1000)

			f.Diffs[x][y] = matrix.Zeros(DIMENSIONS+2, 1)

		}
	}

}
