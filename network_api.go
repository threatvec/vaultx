// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"vaultx/internal/network"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// LookupIPIntel fetches comprehensive intelligence for an IP address.
func (a *App) LookupIPIntel(ip string) (*network.IPIntelResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()

	result, err := network.LookupIPIntel(ctx, ip)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("ipintelligence", ip, string(raw))
	}
	return result, nil
}

// LookupGeoMap resolves multiple IPs to geolocations for the map view.
func (a *App) LookupGeoMap(ips []string) (*network.GeoMapResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()
	return network.LookupGeoMap(ctx, ips)
}

// ScanPorts performs an async port scan on the target with progress events.
func (a *App) ScanPorts(target, portRange string) (*network.PortScanResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 120*time.Second)
	defer cancel()

	var ports []int
	if strings.TrimSpace(portRange) != "" {
		ports = network.ParsePortRange(portRange)
	}

	progressCh := make(chan network.PortScanProgress, 50)
	go func() {
		for p := range progressCh {
			wailsRuntime.EventsEmit(a.ctx, "portscan:progress", p)
		}
	}()

	result, err := network.ScanPorts(ctx, target, ports, progressCh)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("portscanner", target, string(raw))
	}
	return result, nil
}

// PingHost runs a TCP ping to the target host.
func (a *App) PingHost(host string, count int) (*network.PingResult, error) {
	if count <= 0 || count > 20 {
		count = 4
	}
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	return network.PingHost(ctx, host, count)
}

// Traceroute performs a traceroute to the target.
func (a *App) Traceroute(target string) (*network.TracerouteResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	return network.Traceroute(ctx, target)
}

// LookupDNSForward resolves a hostname to IP addresses.
func (a *App) LookupDNSForward(host string) (*network.DNSLookupResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return network.LookupDNSForward(ctx, host)
}

// LookupDNSReverse resolves an IP address to hostnames.
func (a *App) LookupDNSReverse(ip string) (*network.ReverseDNSResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return network.LookupDNSReverse(ctx, ip)
}

// GetMyIP fetches the user's public IP and DNS leak information.
func (a *App) GetMyIP() (*network.MyIPResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	return network.GetMyIP(ctx)
}

// LookupBGP performs BGP/ASN lookup for an IP or ASN string.
func (a *App) LookupBGP(query string) (*network.BGPResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()

	result, err := network.LookupBGP(ctx, query)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("bgplookup", query, string(raw))
	}
	return result, nil
}
