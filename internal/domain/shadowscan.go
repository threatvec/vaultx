// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"bytes"
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jung-kurt/gofpdf"
)

// ScanConfig controls which scan modules are enabled.
type ScanConfig struct {
	Target     string `json:"target"`
	Subdomains bool   `json:"subdomains"`
	Ports      bool   `json:"ports"`
	DNS        bool   `json:"dns"`
	SSL        bool   `json:"ssl"`
	Dorks      bool   `json:"dorks"`
}

// ScanProgress reports real-time scan status.
type ScanProgress struct {
	Module  string `json:"module"`
	Message string `json:"message"`
	Percent int    `json:"percent"`
}

// ShadowScanResult is the full combined result of all scan modules.
type ShadowScanResult struct {
	Target     string            `json:"target"`
	StartedAt  time.Time         `json:"started_at"`
	FinishedAt time.Time         `json:"finished_at"`
	RiskScore  int               `json:"risk_score"`
	Subdomains []SubdomainResult `json:"subdomains,omitempty"`
	Ports      []PortResult      `json:"ports,omitempty"`
	DNS        *DNSResult        `json:"dns,omitempty"`
	SSL        *SSLResult        `json:"ssl,omitempty"`
	Dorks      []DorkCategory    `json:"dorks,omitempty"`
}

// RunShadowScan orchestrates all domain scan modules in parallel.
// Progress updates are sent to the progress channel.
func RunShadowScan(ctx context.Context, cfg ScanConfig, progress chan<- ScanProgress) (*ShadowScanResult, error) {
	result := &ShadowScanResult{
		Target:    cfg.Target,
		StartedAt: time.Now(),
	}

	var mu sync.Mutex
	var wg sync.WaitGroup

	sendProgress := func(module, msg string, pct int) {
		if progress != nil {
			select {
			case progress <- ScanProgress{Module: module, Message: msg, Percent: pct}:
			default:
			}
		}
	}

	if cfg.DNS {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sendProgress("dns", "Resolving DNS records...", 0)
			dnsResult, _ := LookupDNS(ctx, cfg.Target)
			sendProgress("dns", "DNS scan complete", 100)
			mu.Lock()
			result.DNS = dnsResult
			mu.Unlock()
		}()
	}

	if cfg.SSL {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sendProgress("ssl", "Analyzing SSL certificate...", 0)
			sslResult, _ := InspectSSL(cfg.Target)
			sendProgress("ssl", "SSL analysis complete", 100)
			mu.Lock()
			result.SSL = sslResult
			mu.Unlock()
		}()
	}

	if cfg.Subdomains {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sendProgress("subdomains", "Enumerating subdomains...", 0)
			subProgress := make(chan int, 100)
			go func() {
				for pct := range subProgress {
					sendProgress("subdomains", fmt.Sprintf("Probing subdomains... %d%%", pct), pct)
				}
			}()
			subs, _ := EnumerateSubdomains(ctx, cfg.Target, subProgress)
			sendProgress("subdomains", fmt.Sprintf("Found %d subdomains", len(subs)), 100)
			mu.Lock()
			result.Subdomains = subs
			mu.Unlock()
		}()
	}

	if cfg.Ports {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sendProgress("ports", "Scanning ports...", 0)
			portProgress := make(chan int, 100)
			go func() {
				for pct := range portProgress {
					sendProgress("ports", fmt.Sprintf("Scanning ports... %d%%", pct), pct)
				}
			}()
			ports, _ := ScanPorts(ctx, cfg.Target, portProgress)
			sendProgress("ports", fmt.Sprintf("Found %d open ports", len(ports)), 100)
			mu.Lock()
			result.Ports = ports
			mu.Unlock()
		}()
	}

	if cfg.Dorks {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sendProgress("dorks", "Generating Google Dorks...", 0)
			dorks := GenerateDorks(cfg.Target)
			sendProgress("dorks", "Dorks generated", 100)
			mu.Lock()
			result.Dorks = dorks
			mu.Unlock()
		}()
	}

	wg.Wait()
	result.FinishedAt = time.Now()
	result.RiskScore = calculateShadowRisk(result)

	sendProgress("complete", "Scan complete", 100)
	return result, nil
}

// calculateShadowRisk computes an overall risk score from scan findings.
func calculateShadowRisk(r *ShadowScanResult) int {
	score := 0

	if len(r.Ports) > 20 {
		score += 20
	} else if len(r.Ports) > 5 {
		score += 10
	}

	if r.SSL != nil {
		if !r.SSL.Valid {
			score += 30
		} else if len(r.SSL.Issues) > 0 {
			score += len(r.SSL.Issues) * 5
		}
	}

	if r.DNS != nil {
		if r.DNS.SPF == "" {
			score += 5
		}
		if r.DNS.DMARC == "" {
			score += 5
		}
		if !r.DNS.HasDKIM {
			score += 5
		}
	}

	if score > 100 {
		score = 100
	}
	return score
}

// GeneratePDFReport generates a PDF report from the scan result.
func GeneratePDFReport(result *ShadowScanResult) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 20)
	pdf.CellFormat(190, 15, "VAULTX Security Report", "0", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 12)
	pdf.CellFormat(190, 8, fmt.Sprintf("Target: %s", result.Target), "0", 1, "L", false, 0, "")
	pdf.CellFormat(190, 8, fmt.Sprintf("Scan Date: %s", result.StartedAt.Format("2006-01-02 15:04:05")), "0", 1, "L", false, 0, "")
	pdf.CellFormat(190, 8, fmt.Sprintf("Risk Score: %d/100", result.RiskScore), "0", 1, "L", false, 0, "")
	pdf.Ln(5)

	if result.DNS != nil {
		pdf.SetFont("Arial", "B", 14)
		pdf.CellFormat(190, 10, "DNS Records", "0", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		for _, a := range result.DNS.A {
			pdf.CellFormat(190, 6, fmt.Sprintf("  A: %s", a.Value), "0", 1, "L", false, 0, "")
		}
		for _, mx := range result.DNS.MX {
			pdf.CellFormat(190, 6, fmt.Sprintf("  MX: %s", mx.Value), "0", 1, "L", false, 0, "")
		}
		pdf.Ln(3)
	}

	if result.SSL != nil {
		pdf.SetFont("Arial", "B", 14)
		pdf.CellFormat(190, 10, "SSL Certificate", "0", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		pdf.CellFormat(190, 6, fmt.Sprintf("  Valid: %v", result.SSL.Valid), "0", 1, "L", false, 0, "")
		pdf.CellFormat(190, 6, fmt.Sprintf("  Issuer: %s", result.SSL.Issuer), "0", 1, "L", false, 0, "")
		pdf.CellFormat(190, 6, fmt.Sprintf("  Expires: %s (%d days)", result.SSL.NotAfter.Format("2006-01-02"), result.SSL.DaysUntilExpiry), "0", 1, "L", false, 0, "")
		pdf.CellFormat(190, 6, fmt.Sprintf("  Score: %d/100", result.SSL.SecurityScore), "0", 1, "L", false, 0, "")
		pdf.Ln(3)
	}

	if len(result.Ports) > 0 {
		pdf.SetFont("Arial", "B", 14)
		pdf.CellFormat(190, 10, "Open Ports", "0", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		for _, p := range result.Ports {
			pdf.CellFormat(190, 6, fmt.Sprintf("  Port %d: %s", p.Port, p.Service), "0", 1, "L", false, 0, "")
		}
		pdf.Ln(3)
	}

	if len(result.Subdomains) > 0 {
		pdf.SetFont("Arial", "B", 14)
		pdf.CellFormat(190, 10, fmt.Sprintf("Subdomains (%d found)", len(result.Subdomains)), "0", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		for _, s := range result.Subdomains {
			pdf.CellFormat(190, 6, fmt.Sprintf("  %s -> %s", s.Subdomain, s.IPs), "0", 1, "L", false, 0, "")
		}
		pdf.Ln(3)
	}

	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(190, 8, "Generated by VAULTX — by threatvec & talkdedsec", "0", 1, "C", false, 0, "")

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}
	return buf.Bytes(), nil
}
