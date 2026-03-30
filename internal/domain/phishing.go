// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"context"
	"fmt"
	"net"
	"strings"
	"sync"
	"unicode/utf8"
)

// PhishingResult holds phishing detection results.
type PhishingResult struct {
	Domain       string            `json:"domain"`
	Variants     []DomainVariant   `json:"variants"`
	ActiveCount  int               `json:"active_count"`
	RiskScore    int               `json:"risk_score"`
	IsPunycode   bool              `json:"is_punycode"`
	Error        string            `json:"error,omitempty"`
}

// DomainVariant represents a potential typosquatting domain.
type DomainVariant struct {
	Domain   string `json:"domain"`
	Type     string `json:"type"`
	Active   bool   `json:"active"`
	IP       string `json:"ip,omitempty"`
}

// homoglyphMap contains visually similar characters used in IDN homograph attacks.
var homoglyphMap = map[rune][]rune{
	'a': {'а', 'ä', '@'},
	'e': {'е', 'ê', '3'},
	'i': {'і', 'l', '1', '|'},
	'o': {'о', '0', 'ø'},
	'u': {'ü', 'µ'},
	'l': {'1', 'I', '|'},
	'c': {'с', 'ç'},
	'n': {'ñ'},
	's': {'$', '5'},
	'g': {'9'},
	'b': {'6'},
	'q': {'9'},
}

// AnalyzePhishing generates typosquatting variants and checks which are active.
func AnalyzePhishing(ctx context.Context, domain string) (*PhishingResult, error) {
	result := &PhishingResult{Domain: domain}

	parts := strings.SplitN(domain, ".", 2)
	if len(parts) < 2 {
		result.Error = "invalid domain format"
		return result, nil
	}
	name := parts[0]
	tld := parts[1]

	result.IsPunycode = strings.HasPrefix(domain, "xn--") || !utf8.ValidString(domain)

	variants := generateVariants(name, tld)

	type job struct{ v DomainVariant }
	jobs := make(chan job, len(variants))
	results := make(chan DomainVariant, len(variants))
	var wg sync.WaitGroup

	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
				}
				v := j.v
				ips, err := net.DefaultResolver.LookupHost(ctx, v.Domain)
				if err == nil && len(ips) > 0 {
					v.Active = true
					v.IP = ips[0]
				}
				results <- v
			}
		}()
	}

	for _, v := range variants {
		jobs <- job{v: v}
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	for v := range results {
		result.Variants = append(result.Variants, v)
		if v.Active {
			result.ActiveCount++
		}
	}

	result.RiskScore = result.ActiveCount * 10
	if result.RiskScore > 100 {
		result.RiskScore = 100
	}

	return result, nil
}

// generateVariants creates typosquatting, character swap, and homoglyph variants.
func generateVariants(name, tld string) []DomainVariant {
	seen := make(map[string]bool)
	var variants []DomainVariant

	add := func(d, varType string) {
		if d == name+"."+tld || seen[d] || d == "" {
			return
		}
		seen[d] = true
		variants = append(variants, DomainVariant{
			Domain: d,
			Type:   varType,
		})
	}

	for i := 0; i < len(name); i++ {
		deleted := name[:i] + name[i+1:]
		add(deleted+"."+tld, "deletion")
	}

	qwerty := map[byte]string{
		'a': "qsz", 'b': "vghn", 'c': "xdfv", 'd': "serfcx", 'e': "wsdr",
		'f': "drtgvc", 'g': "ftyhnb", 'h': "gyujnm", 'i': "ujko", 'j': "huikm",
		'k': "jiol", 'l': "kop", 'm': "njk", 'n': "bhjm", 'o': "iklp",
		'p': "ol", 'q': "wa", 'r': "edft", 's': "awedxz", 't': "rfgy",
		'u': "yhji", 'v': "cfgb", 'w': "qase", 'x': "zsdc", 'y': "tghu",
		'z': "asx",
	}
	for i := 0; i < len(name); i++ {
		if neighbors, ok := qwerty[name[i]]; ok {
			for _, n := range neighbors {
				typo := name[:i] + string(n) + name[i+1:]
				add(typo+"."+tld, "typo")
			}
		}
	}

	for i := 0; i < len(name)-1; i++ {
		swapped := name[:i] + string(name[i+1]) + string(name[i]) + name[i+2:]
		add(swapped+"."+tld, "swap")
	}

	tlds := []string{"com", "net", "org", "io", "co", "info", "biz", "us", "uk", "de", "ru"}
	for _, t := range tlds {
		if t != tld {
			add(name+"."+t, "tld-variation")
		}
	}

	add(name+name+"."+tld, "repetition")
	add(name+"-secure."+tld, "keyword")
	add(name+"-login."+tld, "keyword")
	add(name+"-account."+tld, "keyword")
	add(name+"-verify."+tld, "keyword")
	add(name+"-support."+tld, "keyword")
	add(name+"-official."+tld, "keyword")
	add(name+"-update."+tld, "keyword")
	add("secure-"+name+"."+tld, "keyword")
	add("login-"+name+"."+tld, "keyword")
	add("account-"+name+"."+tld, "keyword")
	add("my"+name+"."+tld, "prefix")
	add("the"+name+"."+tld, "prefix")
	add("get"+name+"."+tld, "prefix")
	add(name+"1."+tld, "suffix")
	add(name+"2."+tld, "suffix")
	add(name+"-1."+tld, "suffix")

	for i, ch := range name {
		if variants2, ok := homoglyphMap[ch]; ok {
			for _, homoglyph := range variants2 {
				punyName := name[:i] + string(homoglyph) + name[i+utf8.RuneLen(ch):]
				punydomain := fmt.Sprintf("%s.%s", punyName, tld)
				add(punydomain, "homoglyph")
			}
		}
	}

	if len(variants) > 200 {
		variants = variants[:200]
	}

	return variants
}
