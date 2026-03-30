// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package scanner

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// SelfScanResult holds the complete self-scan result.
type SelfScanResult struct {
	PublicIP       string   `json:"public_ip"`
	ISP            string   `json:"isp"`
	Country        string   `json:"country"`
	City           string   `json:"city"`
	IsVPN          bool     `json:"is_vpn"`
	IsTor          bool     `json:"is_tor"`
	IsProxy        bool     `json:"is_proxy"`
	DNSLeak        []string `json:"dns_leak"`
	WebRTCLeak     []string `json:"webrtc_leak"`
	OpenPorts      []int    `json:"open_ports"`
	SecurityScore  int      `json:"security_score"`
	Issues         []string `json:"issues"`
	Suggestions    []string `json:"suggestions"`
	ScanDuration   string   `json:"scan_duration"`
}

// ScanStep represents a scan step with status for live progress.
type ScanStep struct {
	Name    string `json:"name"`
	Status  string `json:"status"` // running, done, error
	Message string `json:"message"`
}

// RunSelfScan performs a comprehensive self-scan.
func RunSelfScan(ctx context.Context, progressFn func(ScanStep)) (*SelfScanResult, error) {
	start := time.Now()
	result := &SelfScanResult{}

	// Step 1: Detect public IP
	progressFn(ScanStep{Name: "IP Detection", Status: "running", Message: "Detecting your public IP..."})
	ip, ipInfo, err := detectPublicIP(ctx)
	if err != nil {
		progressFn(ScanStep{Name: "IP Detection", Status: "error", Message: err.Error()})
		result.PublicIP = "Unknown"
	} else {
		result.PublicIP = ip
		result.ISP = ipInfo.ISP
		result.Country = ipInfo.Country
		result.City = ipInfo.City
		result.IsVPN = ipInfo.Proxy
		result.IsTor = ipInfo.Hosting
		result.IsProxy = ipInfo.Proxy
		progressFn(ScanStep{Name: "IP Detection", Status: "done", Message: fmt.Sprintf("IP: %s (%s)", ip, ipInfo.Country)})
	}

	// Step 2: DNS Leak Check
	progressFn(ScanStep{Name: "DNS Leak Check", Status: "running", Message: "Checking for DNS leaks..."})
	dnsServers := checkDNSLeak(ctx)
	result.DNSLeak = dnsServers
	if len(dnsServers) > 0 {
		progressFn(ScanStep{Name: "DNS Leak Check", Status: "done", Message: fmt.Sprintf("%d DNS servers detected", len(dnsServers))})
	} else {
		progressFn(ScanStep{Name: "DNS Leak Check", Status: "done", Message: "No DNS leaks detected"})
	}

	// Step 3: WebRTC Leak Check
	progressFn(ScanStep{Name: "WebRTC Check", Status: "running", Message: "Checking for WebRTC leaks..."})
	webrtcLeaks := checkWebRTCLeak(ctx)
	result.WebRTCLeak = webrtcLeaks
	if len(webrtcLeaks) > 0 {
		progressFn(ScanStep{Name: "WebRTC Check", Status: "done", Message: fmt.Sprintf("%d WebRTC leaks found", len(webrtcLeaks))})
	} else {
		progressFn(ScanStep{Name: "WebRTC Check", Status: "done", Message: "No WebRTC leaks"})
	}

	// Step 4: Port Scan (localhost common ports)
	progressFn(ScanStep{Name: "Port Scan", Status: "running", Message: "Scanning local open ports..."})
	openPorts := scanLocalPorts(ctx)
	result.OpenPorts = openPorts
	progressFn(ScanStep{Name: "Port Scan", Status: "done", Message: fmt.Sprintf("%d open ports found", len(openPorts))})

	// Step 5: Calculate Security Score
	progressFn(ScanStep{Name: "Scoring", Status: "running", Message: "Calculating security score..."})
	result.SecurityScore, result.Issues, result.Suggestions = calculateSecurityScore(result)
	progressFn(ScanStep{Name: "Scoring", Status: "done", Message: fmt.Sprintf("Score: %d/100", result.SecurityScore)})

	result.ScanDuration = time.Since(start).Round(time.Millisecond).String()
	return result, nil
}

type ipAPIResponse struct {
	IP      string `json:"ip"`
	ISP     string `json:"isp"`
	Org     string `json:"org"`
	Country string `json:"country"`
	City    string `json:"city"`
	Proxy   bool   `json:"proxy"`
	Hosting bool   `json:"hosting"`
}

func detectPublicIP(ctx context.Context) (string, *ipAPIResponse, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	// Try ip-api.com first (no key needed)
	req, err := http.NewRequestWithContext(ctx, "GET", "http://ip-api.com/json/?fields=query,isp,org,country,city,proxy,hosting", nil)
	if err != nil {
		return "", nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		// Fallback to ipify
		return detectIPFallback(ctx, client)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, err
	}

	var data struct {
		Query   string `json:"query"`
		ISP     string `json:"isp"`
		Org     string `json:"org"`
		Country string `json:"country"`
		City    string `json:"city"`
		Proxy   bool   `json:"proxy"`
		Hosting bool   `json:"hosting"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return "", nil, err
	}

	return data.Query, &ipAPIResponse{
		IP:      data.Query,
		ISP:     data.ISP,
		Org:     data.Org,
		Country: data.Country,
		City:    data.City,
		Proxy:   data.Proxy,
		Hosting: data.Hosting,
	}, nil
}

func detectIPFallback(ctx context.Context, client *http.Client) (string, *ipAPIResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.ipify.org?format=json", nil)
	if err != nil {
		return "", nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", nil, fmt.Errorf("failed to detect public IP: %w", err)
	}
	defer resp.Body.Close()

	var data struct {
		IP string `json:"ip"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", nil, err
	}
	return data.IP, &ipAPIResponse{IP: data.IP, ISP: "Unknown", Country: "Unknown"}, nil
}

func checkDNSLeak(ctx context.Context) []string {
	var servers []string

	// Try resolving a known domain and check which DNS servers respond
	resolver := &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{Timeout: 5 * time.Second}
			return d.DialContext(ctx, "udp", address)
		},
	}

	// Query whoami services to detect DNS resolver IP
	client := &http.Client{Timeout: 8 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET", "https://1.1.1.1/cdn-cgi/trace", nil)
	if err == nil {
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			lines := strings.Split(string(body), "\n")
			for _, line := range lines {
				if strings.HasPrefix(line, "ip=") {
					ip := strings.TrimPrefix(line, "ip=")
					ip = strings.TrimSpace(ip)
					if ip != "" {
						// This is the user's IP as seen by Cloudflare DNS
						// Not necessarily a leak unless different from expected
					}
				}
			}
		}
	}

	// Check system DNS resolver
	addrs, err := resolver.LookupHost(ctx, "myip.opendns.com")
	if err == nil {
		for _, addr := range addrs {
			if addr != "" {
				servers = append(servers, addr)
			}
		}
	}

	// Check NS resolution to detect if ISP DNS
	nss, err := resolver.LookupNS(ctx, "resolver-identity.cloudflare.com")
	if err == nil {
		for _, ns := range nss {
			if ns.Host != "" {
				servers = append(servers, ns.Host)
			}
		}
	}

	return servers
}

func checkWebRTCLeak(ctx context.Context) []string {
	// WebRTC leak detection needs browser-side JS
	// From Go backend, we can check local interfaces for potential leak sources
	var leaks []string

	ifaces, err := net.Interfaces()
	if err != nil {
		return leaks
	}

	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			ip, _, err := net.ParseCIDR(addr.String())
			if err != nil {
				continue
			}
			// Skip IPv6 link-local
			if ip.IsLinkLocalUnicast() || ip.IsLoopback() {
				continue
			}
			// Private IPs that could leak via WebRTC
			if ip.IsPrivate() {
				leaks = append(leaks, fmt.Sprintf("%s (%s)", ip.String(), iface.Name))
			}
		}
	}

	return leaks
}

func scanLocalPorts(ctx context.Context) []int {
	commonPorts := []int{
		21, 22, 23, 25, 53, 80, 110, 135, 139, 143,
		443, 445, 993, 995, 1433, 1434, 3306, 3389,
		5432, 5900, 6379, 8080, 8443, 8888, 9090, 27017,
	}

	var openPorts []int
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, 10)

	for _, port := range commonPorts {
		wg.Add(1)
		sem <- struct{}{}
		go func(p int) {
			defer wg.Done()
			defer func() { <-sem }()

			select {
			case <-ctx.Done():
				return
			default:
			}

			addr := fmt.Sprintf("127.0.0.1:%d", p)
			conn, err := net.DialTimeout("tcp", addr, 500*time.Millisecond)
			if err == nil {
				conn.Close()
				mu.Lock()
				openPorts = append(openPorts, p)
				mu.Unlock()
			}
		}(port)
	}

	wg.Wait()
	return openPorts
}

func calculateSecurityScore(r *SelfScanResult) (int, []string, []string) {
	score := 100
	var issues []string
	var suggestions []string

	// DNS Leak penalty
	if len(r.DNSLeak) > 2 {
		score -= 10
		issues = append(issues, fmt.Sprintf("DNS resolver information exposed (%d servers detected)", len(r.DNSLeak)))
		suggestions = append(suggestions, "Use a trusted DNS provider (Cloudflare 1.1.1.1 or Google 8.8.8.8)")
	}

	// WebRTC Leak penalty
	if len(r.WebRTCLeak) > 0 {
		score -= 15
		issues = append(issues, fmt.Sprintf("WebRTC may leak local IP addresses (%d interfaces exposed)", len(r.WebRTCLeak)))
		suggestions = append(suggestions, "Disable WebRTC in browser settings or use a WebRTC leak blocker extension")
	}

	// Open Ports penalty
	riskyPorts := map[int]string{
		21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 135: "RPC",
		139: "NetBIOS", 445: "SMB", 1433: "MSSQL", 3306: "MySQL",
		3389: "RDP", 5432: "PostgreSQL", 5900: "VNC", 6379: "Redis", 27017: "MongoDB",
	}
	for _, port := range r.OpenPorts {
		if name, risky := riskyPorts[port]; risky {
			score -= 5
			issues = append(issues, fmt.Sprintf("Port %d (%s) is open — potential attack surface", port, name))
		}
	}
	if len(r.OpenPorts) > 5 {
		score -= 10
		suggestions = append(suggestions, "Review and close unnecessary open ports")
	}
	if len(r.OpenPorts) > 0 {
		suggestions = append(suggestions, fmt.Sprintf("Found %d open ports — ensure they are intentional", len(r.OpenPorts)))
	}

	// VPN/Proxy check
	if !r.IsVPN && !r.IsProxy {
		score -= 5
		issues = append(issues, "Not using a VPN or proxy — your real IP is exposed")
		suggestions = append(suggestions, "Consider using a VPN for better privacy")
	}

	// Tor check (bonus)
	if r.IsTor {
		score += 5
		suggestions = append(suggestions, "Tor detected — good for anonymity but may cause issues with some services")
	}

	// IP exposed
	if r.PublicIP != "" && r.PublicIP != "Unknown" {
		issues = append(issues, fmt.Sprintf("Your public IP (%s) is visible to all websites you visit", r.PublicIP))
	}

	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	if len(issues) == 0 {
		suggestions = append(suggestions, "Your security posture looks good! Keep monitoring regularly.")
	}

	return score, issues, suggestions
}
