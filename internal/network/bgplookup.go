// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package network

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// BGPResult holds ASN and routing information for an IP or ASN.
type BGPResult struct {
	Query       string     `json:"query"`
	ASN         string     `json:"asn"`
	ASName      string     `json:"as_name"`
	ASDescription string  `json:"as_description"`
	Country     string     `json:"country"`
	Prefixes    []string   `json:"prefixes"`
	PrefixCount int        `json:"prefix_count"`
	IPv6Prefixes []string  `json:"ipv6_prefixes"`
	Peers       []BGPPeer  `json:"peers"`
	Allocated   string     `json:"allocated"`
	Registry    string     `json:"registry"`
	Error       string     `json:"error,omitempty"`
}

// BGPPeer represents a BGP peer relationship.
type BGPPeer struct {
	ASN     string `json:"asn"`
	Name    string `json:"name"`
	Country string `json:"country"`
}

type ripeStatusResponse struct {
	Data struct {
		Prefixes []struct {
			Prefix   string `json:"prefix"`
			MaxLength int   `json:"max_length"`
		} `json:"prefixes"`
		ASNs []struct {
			ASN   int    `json:"asn"`
			Name  string `json:"name"`
			Country string `json:"country"`
		} `json:"asns"`
	} `json:"data"`
}

type ripeASNResponse struct {
	Data struct {
		ASN     int    `json:"asn"`
		Name    string `json:"name"`
		Country string `json:"country"`
		Holder  string `json:"holder"`
		Announced []struct {
			Prefix string `json:"prefix"`
		} `json:"announced"`
	} `json:"data"`
}

// LookupBGP performs BGP/ASN lookup for an IP address or ASN.
func LookupBGP(ctx context.Context, query string) (*BGPResult, error) {
	result := &BGPResult{Query: query}
	client := &http.Client{Timeout: 15 * time.Second}

	// Determine if query is an ASN (e.g. "AS15169" or "15169") or an IP
	isASN := false
	asnNum := ""
	q := strings.TrimSpace(query)
	if strings.HasPrefix(strings.ToUpper(q), "AS") {
		isASN = true
		asnNum = strings.TrimPrefix(strings.ToUpper(q), "AS")
	}

	if !isASN {
		// Lookup IP → ASN via ip-api.com
		intel, err := LookupIPIntel(ctx, q)
		if err == nil && intel != nil {
			result.Country = intel.CountryCode
			// Parse ASN from intel.AS field "AS15169 Google LLC"
			parts := strings.SplitN(intel.AS, " ", 2)
			if len(parts) >= 1 {
				asnNum = strings.TrimPrefix(strings.ToUpper(parts[0]), "AS")
				result.ASN = parts[0]
			}
			if len(parts) >= 2 {
				result.ASName = parts[1]
				result.ASDescription = parts[1]
			}
		}
	} else {
		result.ASN = "AS" + asnNum
	}

	if asnNum == "" {
		result.Error = "Could not determine ASN for query"
		return result, nil
	}

	// Fetch prefixes from RIPE stat
	prefixURL := fmt.Sprintf("https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS%s", asnNum)
	req, err := http.NewRequestWithContext(ctx, "GET", prefixURL, nil)
	if err == nil {
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			var ripeResp struct {
				Data struct {
					Prefixes []struct {
						Prefix string `json:"prefix"`
					} `json:"prefixes"`
				} `json:"data"`
			}
			if json.Unmarshal(body, &ripeResp) == nil {
				for _, p := range ripeResp.Data.Prefixes {
					if strings.Contains(p.Prefix, ":") {
						result.IPv6Prefixes = append(result.IPv6Prefixes, p.Prefix)
					} else {
						result.Prefixes = append(result.Prefixes, p.Prefix)
					}
				}
			}
		}
	}

	result.PrefixCount = len(result.Prefixes) + len(result.IPv6Prefixes)

	// Fetch ASN details from RIPE stat
	asnURL := fmt.Sprintf("https://stat.ripe.net/data/as-overview/data.json?resource=AS%s", asnNum)
	req2, err := http.NewRequestWithContext(ctx, "GET", asnURL, nil)
	if err == nil {
		resp2, err := client.Do(req2)
		if err == nil {
			defer resp2.Body.Close()
			body2, _ := io.ReadAll(resp2.Body)
			var asnResp struct {
				Data struct {
					ASN     int    `json:"asn"`
					Holder  string `json:"holder"`
					Block   struct {
						Resource  string `json:"resource"`
						Name      string `json:"name"`
						Desc      string `json:"desc"`
						Country   string `json:"country"`
						Allocated string `json:"allocated"`
					} `json:"block"`
				} `json:"data"`
			}
			if json.Unmarshal(body2, &asnResp) == nil {
				if result.ASName == "" {
					result.ASName = asnResp.Data.Holder
				}
				if result.ASDescription == "" {
					result.ASDescription = asnResp.Data.Block.Desc
				}
				if result.Country == "" {
					result.Country = asnResp.Data.Block.Country
				}
				result.Allocated = asnResp.Data.Block.Allocated
			}
		}
	}

	// Fetch peers from RIPE stat
	peersURL := fmt.Sprintf("https://stat.ripe.net/data/asn-neighbours/data.json?resource=AS%s", asnNum)
	req3, err := http.NewRequestWithContext(ctx, "GET", peersURL, nil)
	if err == nil {
		resp3, err := client.Do(req3)
		if err == nil {
			defer resp3.Body.Close()
			body3, _ := io.ReadAll(resp3.Body)
			var peersResp struct {
				Data struct {
					Neighbours []struct {
						ASN      int    `json:"asn"`
						Label    string `json:"label"`
						Country  string `json:"country"`
						NeighType string `json:"neighbour_type"`
					} `json:"neighbours"`
				} `json:"data"`
			}
			if json.Unmarshal(body3, &peersResp) == nil {
				for i, n := range peersResp.Data.Neighbours {
					if i >= 20 {
						break
					}
					result.Peers = append(result.Peers, BGPPeer{
						ASN:     fmt.Sprintf("AS%d", n.ASN),
						Name:    n.Label,
						Country: n.Country,
					})
				}
			}
		}
	}

	return result, nil
}
