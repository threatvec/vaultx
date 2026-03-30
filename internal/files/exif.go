// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package files

import (
	"fmt"
	"io"
	"math"
	"os"

	"github.com/rwcarlsen/goexif/exif"
	"github.com/rwcarlsen/goexif/mknote"
)

// EXIFResult holds extracted EXIF data from an image.
type EXIFResult struct {
	FileName string      `json:"file_name"`
	Fields   []MetaField `json:"fields"`
	HasGPS   bool        `json:"has_gps"`
	GPSLat   float64     `json:"gps_lat"`
	GPSLon   float64     `json:"gps_lon"`
	GPSAlt   float64     `json:"gps_alt,omitempty"`
	Make     string      `json:"make"`
	Model    string      `json:"model"`
	DateTime string      `json:"date_time"`
	Error    string      `json:"error,omitempty"`
}

func init() {
	exif.RegisterParsers(mknote.All...)
}

// ExtractEXIFFromPath extracts EXIF from an image file path.
func ExtractEXIFFromPath(filePath string) (*EXIFResult, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot open file: %w", err)
	}
	defer f.Close()

	result, err := ExtractEXIF(f)
	if err != nil {
		return result, err
	}
	if result != nil {
		result.FileName = filePath
	}
	return result, nil
}

// ExtractEXIF extracts EXIF metadata from an io.Reader.
func ExtractEXIF(r io.Reader) (*EXIFResult, error) {
	result := &EXIFResult{}

	x, err := exif.Decode(r)
	if err != nil {
		result.Error = fmt.Sprintf("No EXIF data found: %v", err)
		return result, nil
	}

	// Camera info
	if make, err := x.Get(exif.Make); err == nil {
		result.Make, _ = make.StringVal()
		result.Fields = append(result.Fields, MetaField{Label: "Camera Make", Value: result.Make, Risk: "low"})
	}
	if model, err := x.Get(exif.Model); err == nil {
		result.Model, _ = model.StringVal()
		result.Fields = append(result.Fields, MetaField{Label: "Camera Model", Value: result.Model, Risk: "medium"})
	}
	if sw, err := x.Get(exif.Software); err == nil {
		v, _ := sw.StringVal()
		if v != "" {
			result.Fields = append(result.Fields, MetaField{Label: "Software", Value: v, Risk: "medium"})
		}
	}

	// Dates
	if dt, err := x.DateTime(); err == nil {
		result.DateTime = dt.Format("2006-01-02 15:04:05")
		result.Fields = append(result.Fields, MetaField{Label: "Date/Time Original", Value: result.DateTime, Risk: "low"})
	}
	if dtorig, err := x.Get(exif.DateTimeOriginal); err == nil {
		v, _ := dtorig.StringVal()
		if v != "" && v != result.DateTime {
			result.Fields = append(result.Fields, MetaField{Label: "Date Digitized", Value: v, Risk: "low"})
		}
	}

	// Camera settings
	if iso, err := x.Get(exif.ISOSpeedRatings); err == nil {
		v, _ := iso.Int(0)
		result.Fields = append(result.Fields, MetaField{Label: "ISO", Value: fmt.Sprintf("%d", v), Risk: "low"})
	}
	if exp, err := x.Get(exif.ExposureTime); err == nil {
		if r, err2 := exp.Rat(0); err2 == nil && r != nil {
			result.Fields = append(result.Fields, MetaField{Label: "Exposure Time", Value: r.RatString() + " s", Risk: "low"})
		}
	}
	if fnum, err := x.Get(exif.FNumber); err == nil {
		if r, err2 := fnum.Rat(0); err2 == nil && r != nil {
			f64, _ := r.Float64()
			result.Fields = append(result.Fields, MetaField{Label: "F-Number", Value: fmt.Sprintf("f/%.1f", f64), Risk: "low"})
		}
	}
	if fl, err := x.Get(exif.FocalLength); err == nil {
		if r, err2 := fl.Rat(0); err2 == nil && r != nil {
			f64, _ := r.Float64()
			result.Fields = append(result.Fields, MetaField{Label: "Focal Length", Value: fmt.Sprintf("%.0f mm", f64), Risk: "low"})
		}
	}
	if flash, err := x.Get(exif.Flash); err == nil {
		v, _ := flash.Int(0)
		fired := (v & 0x1) == 1
		result.Fields = append(result.Fields, MetaField{Label: "Flash", Value: boolStr(fired, "Fired", "Did not fire"), Risk: "low"})
	}
	if ow, err := x.Get(exif.PixelXDimension); err == nil {
		w, _ := ow.Int(0)
		if oh, err2 := x.Get(exif.PixelYDimension); err2 == nil {
			h, _ := oh.Int(0)
			result.Fields = append(result.Fields, MetaField{Label: "Image Size", Value: fmt.Sprintf("%d × %d px", w, h), Risk: "low"})
		}
	}
	if orient, err := x.Get(exif.Orientation); err == nil {
		v, _ := orient.Int(0)
		result.Fields = append(result.Fields, MetaField{Label: "Orientation", Value: orientationStr(v), Risk: "low"})
	}
	if lens, err := x.Get(exif.LensModel); err == nil {
		v, _ := lens.StringVal()
		if v != "" {
			result.Fields = append(result.Fields, MetaField{Label: "Lens", Value: v, Risk: "low"})
		}
	}
	if artist, err := x.Get(exif.Artist); err == nil {
		v, _ := artist.StringVal()
		if v != "" {
			result.Fields = append(result.Fields, MetaField{Label: "Artist/Author", Value: v, Risk: "high"})
		}
	}
	if copyright, err := x.Get(exif.Copyright); err == nil {
		v, _ := copyright.StringVal()
		if v != "" {
			result.Fields = append(result.Fields, MetaField{Label: "Copyright", Value: v, Risk: "medium"})
		}
	}

	// GPS
	lat, lon, err := x.LatLong()
	if err == nil {
		result.HasGPS = true
		result.GPSLat = lat
		result.GPSLon = lon
		result.Fields = append(result.Fields, MetaField{
			Label: "GPS Coordinates",
			Value: fmt.Sprintf("%.6f, %.6f", lat, lon),
			Risk:  "high",
		})
		result.Fields = append(result.Fields, MetaField{
			Label: "Google Maps",
			Value: fmt.Sprintf("https://maps.google.com/?q=%.6f,%.6f", lat, lon),
			Risk:  "high",
		})
	}

	if alt, err := x.Get(exif.GPSAltitude); err == nil {
		if r, err2 := alt.Rat(0); err2 == nil && r != nil {
			f64, _ := r.Float64()
			result.GPSAlt = math.Round(f64*100) / 100
			result.Fields = append(result.Fields, MetaField{
				Label: "GPS Altitude",
				Value: fmt.Sprintf("%.2f m", result.GPSAlt),
				Risk:  "high",
			})
		}
	}

	return result, nil
}

func boolStr(v bool, t, f string) string {
	if v {
		return t
	}
	return f
}

func orientationStr(v int) string {
	switch v {
	case 1:
		return "Normal"
	case 2:
		return "Flipped Horizontal"
	case 3:
		return "Rotated 180°"
	case 4:
		return "Flipped Vertical"
	case 5:
		return "Transposed"
	case 6:
		return "Rotated 90° CW"
	case 7:
		return "Transverse"
	case 8:
		return "Rotated 90° CCW"
	}
	return fmt.Sprintf("Unknown (%d)", v)
}
