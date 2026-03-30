// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"context"
	"fmt"
	"net"
	"strings"
)

// DNSRecord holds a single DNS record.
type DNSRecord struct {
	Type  string `json:"type"`
	Value string `json:"value"`
	TTL   uint32 `json:"ttl,omitempty"`
}

// DNSResult holds all DNS records for a domain.
type DNSResult struct {
	Domain  string      `json:"domain"`
	A       []DNSRecord `json:"a"`
	AAAA    []DNSRecord `json:"aaaa"`
	MX      []DNSRecord `json:"mx"`
	NS      []DNSRecord `json:"ns"`
	TXT     []DNSRecord `json:"txt"`
	CNAME   []DNSRecord `json:"cname"`
	SPF     string      `json:"spf"`
	DMARC   string      `json:"dmarc"`
	HasDKIM bool        `json:"has_dkim"`
	Error   string      `json:"error,omitempty"`
}

// LookupDNS performs a full DNS enumeration for the given domain.
func LookupDNS(ctx context.Context, domain string) (*DNSResult, error) {
	result := &DNSResult{Domain: domain}
	resolver := &net.Resolver{}

	aRecords, err := resolver.LookupHost(ctx, domain)
	if err == nil {
		for _, r := range aRecords {
			ip := net.ParseIP(r)
			if ip == nil {
				continue
			}
			if ip.To4() != nil {
				result.A = append(result.A, DNSRecord{Type: "A", Value: r})
			} else {
				result.AAAA = append(result.AAAA, DNSRecord{Type: "AAAA", Value: r})
			}
		}
	}

	cnameRecords, err := resolver.LookupCNAME(ctx, domain)
	if err == nil && cnameRecords != domain+"." {
		result.CNAME = append(result.CNAME, DNSRecord{Type: "CNAME", Value: cnameRecords})
	}

	mxRecords, err := resolver.LookupMX(ctx, domain)
	if err == nil {
		for _, mx := range mxRecords {
			result.MX = append(result.MX, DNSRecord{
				Type:  "MX",
				Value: fmt.Sprintf("%s (priority %d)", mx.Host, mx.Pref),
			})
		}
	}

	nsRecords, err := resolver.LookupNS(ctx, domain)
	if err == nil {
		for _, ns := range nsRecords {
			result.NS = append(result.NS, DNSRecord{Type: "NS", Value: ns.Host})
		}
	}

	txtRecords, err := resolver.LookupTXT(ctx, domain)
	if err == nil {
		for _, txt := range txtRecords {
			result.TXT = append(result.TXT, DNSRecord{Type: "TXT", Value: txt})
			if strings.HasPrefix(txt, "v=spf1") {
				result.SPF = txt
			}
		}
	}

	dmarcRecords, err := resolver.LookupTXT(ctx, "_dmarc."+domain)
	if err == nil && len(dmarcRecords) > 0 {
		for _, r := range dmarcRecords {
			if strings.HasPrefix(r, "v=DMARC1") {
				result.DMARC = r
			}
		}
	}

	dkimSelectors := []string{"default", "google", "mail", "k1", "dkim", "selector1", "selector2"}
	for _, sel := range dkimSelectors {
		dkimHost := fmt.Sprintf("%s._domainkey.%s", sel, domain)
		dkimRecords, err := resolver.LookupTXT(ctx, dkimHost)
		if err == nil && len(dkimRecords) > 0 {
			result.HasDKIM = true
			break
		}
	}

	return result, nil
}
