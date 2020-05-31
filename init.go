package main

import (
	"image/color"
	"math/rand"
)

func Init() PixelsToRender {
	px := PixelsToRender{}

	for inxx, x := range px {
		for inxy, _ := range x {
			px[inxx][inxy] = &PixelInfo{
				color.RGBA{
					A: 255,
					R: uint8(rand.Intn(256)),
					G: uint8(rand.Intn(256)),
					B: uint8(rand.Intn(256)),
				},
			}
		}
	}

	return px
}
