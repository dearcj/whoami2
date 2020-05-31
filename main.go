package main

import (
	"github.com/h8gi/canvas"
	"image/color"
	"math/rand"
	"os"
	"strconv"
	"time"
)

type PixelInfo struct {
	Color color.RGBA
}

const CANVAS_W = 300
const CANVAS_H = 200

type PixelsToRender [CANVAS_W][CANVAS_H]*PixelInfo

func Filename(it int) string {
	return time.Now().Format("20060102150405") + "_it_" + strconv.Itoa(it)
}

func (renders PixelsToRender) FromField(field *Field) {
	for x := field.OffsetX; x < field.OffsetX+CANVAS_W; x++ {
		for y := field.OffsetY; y < field.OffsetY+CANVAS_H; y++ {
			renders[x-field.OffsetX][y-field.OffsetY].Color = field.FieldToColor(field.Points[x][y])
		}

	}
}

var dataToRender = PixelsToRender{}

func Render(ctx *canvas.Context, d PixelsToRender) {
	for xpos, x := range d {
		for ypos, y := range x {
			ctx.SetColor(y.Color)
			ctx.SetPixel(xpos, ypos)
		}
	}
	ctx.Fill()
}

var drawed = false

func main() {

	var lastIteration int
	pixels := Init()
	f := CreateField()
	for lastIteration := 0; lastIteration < 1; lastIteration++ {
		println("Iteration", lastIteration)
		f.Iterate()
	}
	f.UpdateNormalizeVec()
	pixels.FromField(f)

	c := canvas.NewCanvas(&canvas.CanvasConfig{
		Width:     CANVAS_W,
		Height:    CANVAS_H,
		FrameRate: 1,
		Title:     "Hello Canvas!",
	})

	c.Setup(func(ctx *canvas.Context) {
		ctx.Clear()
	})

	c.Draw(func(ctx *canvas.Context) {

		ctx.Push()
		if !drawed {
			Render(ctx, pixels)
		}
		ctx.Pop()

		if !drawed {
			rand.Seed(time.Now().UnixNano())
			ctx.SavePNG("./images/img" + Filename(lastIteration) + ".png")
		}
		drawed = true
		os.Exit(0)
	})
}
