// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package network

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// IPIntelResult holds comprehensive IP intelligence data.
type IPIntelResult struct {
	IP          string  `json:"ip"`
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	Region      string  `json:"region"`
	RegionName  string  `json:"region_name"`
	City        string  `json:"city"`
	Zip         string  `json:"zip"`
	Lat         float64 `json:"lat"`
	Lon         float64 `json:"lon"`
	Timezone    string  `json:"timezone"`
	ISP         string  `json:"isp"`
	Org         string  `json:"org"`
	AS          string  `json:"as"`
	ASName      string  `json:"as_name"`
	IsProxy     bool    `json:"is_proxy"`
	IsHosting   bool    `json:"is_hosting"`
	IsTor       bool    `json:"is_tor"`
	Mobile      bool    `json:"mobile"`
	Query       string  `json:"query"`
	Error       string  `json:"error,omitempty"`
}

type ipAPIResponse struct {
	Status      string  `json:"status"`
	Message     string  `json:"message"`
	Country     string  `json:"country"`
	CountryCode string  `json:"countryCode"`
	Region      string  `json:"region"`
	RegionName  string  `json:"regionName"`
	City        string  `json:"city"`
	Zip         string  `json:"zip"`
	Lat         float64 `json:"lat"`
	Lon         float64 `json:"lon"`
	Timezone    string  `json:"timezone"`
	ISP         string  `json:"isp"`
	Org         string  `json:"org"`
	AS          string  `json:"as"`
	Mobile      bool    `json:"mobile"`
	Proxy       bool    `json:"proxy"`
	Hosting     bool    `json:"hosting"`
	Query       string  `json:"query"`
}

// LookupIPIntel fetches comprehensive intelligence for an IP address.
func LookupIPIntel(ctx context.Context, ip string) (*IPIntelResult, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query", ip)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var raw ipAPIResponse
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	if raw.Status == "fail" {
		return &IPIntelResult{IP: ip, Error: raw.Message}, nil
	}

	// Parse ASN name from AS field (format: "AS1234 Company Name")
	asName := raw.AS
	if len(raw.AS) > 0 {
		parts := splitASName(raw.AS)
		if len(parts) > 1 {
			asName = parts[1]
		}
	}

	result := &IPIntelResult{
		IP:          raw.Query,
		Country:     raw.Country,
		CountryCode: raw.CountryCode,
		Region:      raw.Region,
		RegionName:  raw.RegionName,
		City:        raw.City,
		Zip:         raw.Zip,
		Lat:         raw.Lat,
		Lon:         raw.Lon,
		Timezone:    raw.Timezone,
		ISP:         raw.ISP,
		Org:         raw.Org,
		AS:          raw.AS,
		ASName:      asName,
		IsProxy:     raw.Proxy,
		IsHosting:   raw.Hosting,
		Mobile:      raw.Mobile,
		Query:       ip,
	}

	return result, nil
}

// splitASName splits "AS1234 Name Here" into ["AS1234", "Name Here"].
func splitASName(s string) []string {
	for i, c := range s {
		if c == ' ' && i > 0 {
			return []string{s[:i], s[i+1:]}
		}
	}
	return []string{s}
}

// GeoPoint represents a single IP geolocation point for the map.
type GeoPoint struct {
	IP          string  `json:"ip"`
	Lat         float64 `json:"lat"`
	Lon         float64 `json:"lon"`
	City        string  `json:"city"`
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	ISP         string  `json:"isp"`
	AS          string  `json:"as"`
	IsProxy     bool    `json:"is_proxy"`
	IsHosting   bool    `json:"is_hosting"`
	IsTor       bool    `json:"is_tor"`
	Error       string  `json:"error,omitempty"`
}

// GeoMapResult holds multiple IP geolocation points.
type GeoMapResult struct {
	Points []GeoPoint `json:"points"`
	Total  int        `json:"total"`
}

// LookupGeoMap resolves multiple IPs to geolocations concurrently.
func LookupGeoMap(ctx context.Context, ips []string) (*GeoMapResult, error) {
	if len(ips) == 0 {
		return &GeoMapResult{Points: []GeoPoint{}}, nil
	}

	type batchItem struct {
		Query string `json:"query"`
	}

	// Use batch API for efficiency (max 100 per batch)
	points := make([]GeoPoint, 0, len(ips))

	for start := 0; start < len(ips); start += 100 {
		end := start + 100
		if end > len(ips) {
			end = len(ips)
		}
		batch := ips[start:end]

		batchItems := make([]batchItem, len(batch))
		for i, ip := range batch {
			batchItems[i] = batchItem{Query: ip}
		}

		bodyBytes, err := json.Marshal(batchItems)
		if err != nil {
			continue
		}

		client := &http.Client{Timeout: 20 * time.Second}
		req, err := http.NewRequestWithContext(ctx, "POST",
			"http://ip-api.com/batch?fields=status,message,country,countryCode,city,lat,lon,isp,org,as,proxy,hosting,query",
			io.NopCloser(bytesReader(bodyBytes)))
		if err != nil {
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			continue
		}

		var results []map[string]interface{}
		data, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err := json.Unmarshal(data, &results); err != nil {
			continue
		}

		for _, r := range results {
			pt := GeoPoint{}
			if v, ok := r["query"].(string); ok {
				pt.IP = v
			}
			if v, ok := r["lat"].(float64); ok {
				pt.Lat = v
			}
			if v, ok := r["lon"].(float64); ok {
				pt.Lon = v
			}
			if v, ok := r["city"].(string); ok {
				pt.City = v
			}
			if v, ok := r["country"].(string); ok {
				pt.Country = v
			}
			if v, ok := r["countryCode"].(string); ok {
				pt.CountryCode = v
			}
			if v, ok := r["isp"].(string); ok {
				pt.ISP = v
			}
			if v, ok := r["as"].(string); ok {
				pt.AS = v
			}
			if v, ok := r["proxy"].(bool); ok {
				pt.IsProxy = v
			}
			if v, ok := r["hosting"].(bool); ok {
				pt.IsHosting = v
			}
			points = append(points, pt)
		}

		if start+100 < len(ips) {
			time.Sleep(1500 * time.Millisecond)
		}
	}

	return &GeoMapResult{Points: points, Total: len(points)}, nil
}

// bytesReader wraps a byte slice as an io.Reader.
type bytesReaderImpl struct {
	data []byte
	pos  int
}

func (b *bytesReaderImpl) Read(p []byte) (n int, err error) {
	if b.pos >= len(b.data) {
		return 0, io.EOF
	}
	n = copy(p, b.data[b.pos:])
	b.pos += n
	return
}

func bytesReader(data []byte) io.Reader {
	return &bytesReaderImpl{data: data}
}
