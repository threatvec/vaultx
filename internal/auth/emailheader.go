// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package auth

import (
	"fmt"
	"net"
	"strings"
)

// EmailHeaderResult holds the analysis of raw email headers.
type EmailHeaderResult struct {
	From         string            `json:"from"`
	To           string            `json:"to"`
	Subject      string            `json:"subject"`
	Date         string            `json:"date"`
	MessageID    string            `json:"message_id"`
	SPF          SPFResult         `json:"spf"`
	DKIM         DKIMResult        `json:"dkim"`
	DMARC        DMARCResult       `json:"dmarc"`
	IPChain      []HopInfo         `json:"ip_chain"`
	PhishScore   int               `json:"phish_score"`
	PhishReasons []string          `json:"phish_reasons"`
	RawHeaders   map[string]string `json:"raw_headers"`
}

// SPFResult holds SPF authentication result.
type SPFResult struct {
	Present bool   `json:"present"`
	Pass    bool   `json:"pass"`
	Result  string `json:"result"`
	Domain  string `json:"domain"`
}

// DKIMResult holds DKIM authentication result.
type DKIMResult struct {
	Present bool   `json:"present"`
	Pass    bool   `json:"pass"`
	Result  string `json:"result"`
	Domain  string `json:"domain"`
	Selector string `json:"selector"`
}

// DMARCResult holds DMARC policy information.
type DMARCResult struct {
	Present bool   `json:"present"`
	Pass    bool   `json:"pass"`
	Policy  string `json:"policy"`
	Result  string `json:"result"`
}

// HopInfo describes a single mail hop.
type HopInfo struct {
	From      string `json:"from"`
	By        string `json:"by"`
	IP        string `json:"ip"`
	Timestamp string `json:"timestamp"`
	Delay     string `json:"delay"`
	IsPublic  bool   `json:"is_public"`
}

// ParseEmailHeader parses raw email headers and returns analysis.
func ParseEmailHeader(raw string) (*EmailHeaderResult, error) {
	result := &EmailHeaderResult{
		RawHeaders: make(map[string]string),
	}

	headers := parseHeaders(raw)
	for k, v := range headers {
		result.RawHeaders[k] = v
	}

	result.From = headers["from"]
	result.To = headers["to"]
	result.Subject = headers["subject"]
	result.Date = headers["date"]
	result.MessageID = headers["message-id"]

	result.SPF = parseSPF(headers)
	result.DKIM = parseDKIM(headers)
	result.DMARC = parseDMARC(headers)
	result.IPChain = parseIPChain(raw)
	result.PhishScore, result.PhishReasons = calculatePhishScore(result)

	return result, nil
}

func parseHeaders(raw string) map[string]string {
	headers := make(map[string]string)
	lines := strings.Split(raw, "\n")

	var currentKey string
	var currentVal strings.Builder

	for _, line := range lines {
		if line == "" || line == "\r" {
			break
		}
		// Continuation line
		if len(line) > 0 && (line[0] == ' ' || line[0] == '\t') {
			currentVal.WriteString(" ")
			currentVal.WriteString(strings.TrimSpace(line))
			continue
		}
		// Save previous
		if currentKey != "" {
			headers[strings.ToLower(currentKey)] = strings.TrimSpace(currentVal.String())
		}
		// New header
		idx := strings.Index(line, ":")
		if idx > 0 {
			currentKey = strings.TrimSpace(line[:idx])
			currentVal.Reset()
			currentVal.WriteString(strings.TrimSpace(line[idx+1:]))
		}
	}
	if currentKey != "" {
		headers[strings.ToLower(currentKey)] = strings.TrimSpace(currentVal.String())
	}
	return headers
}

func parseSPF(headers map[string]string) SPFResult {
	spf := SPFResult{}

	// Check Authentication-Results first
	authResults := headers["authentication-results"]
	if authResults != "" {
		lower := strings.ToLower(authResults)
		if strings.Contains(lower, "spf=") {
			spf.Present = true
			if strings.Contains(lower, "spf=pass") {
				spf.Pass = true
				spf.Result = "pass"
			} else if strings.Contains(lower, "spf=fail") {
				spf.Result = "fail"
			} else if strings.Contains(lower, "spf=softfail") {
				spf.Result = "softfail"
			} else if strings.Contains(lower, "spf=neutral") {
				spf.Result = "neutral"
			} else if strings.Contains(lower, "spf=none") {
				spf.Result = "none"
			} else {
				spf.Result = "unknown"
			}

			// Extract domain
			idx := strings.Index(lower, "smtp.mailfrom=")
			if idx >= 0 {
				rest := authResults[idx+14:]
				end := strings.IndexAny(rest, " \t;")
				if end > 0 {
					spf.Domain = rest[:end]
				} else {
					spf.Domain = rest
				}
				// Get @domain part
				if atIdx := strings.Index(spf.Domain, "@"); atIdx >= 0 {
					spf.Domain = spf.Domain[atIdx+1:]
				}
			}
		}
	}

	// Fallback: Received-SPF header
	if !spf.Present {
		receivedSPF := headers["received-spf"]
		if receivedSPF != "" {
			spf.Present = true
			lower := strings.ToLower(receivedSPF)
			if strings.HasPrefix(lower, "pass") {
				spf.Pass = true
				spf.Result = "pass"
			} else if strings.HasPrefix(lower, "fail") {
				spf.Result = "fail"
			} else if strings.HasPrefix(lower, "softfail") {
				spf.Result = "softfail"
			} else if strings.HasPrefix(lower, "neutral") {
				spf.Result = "neutral"
			} else {
				spf.Result = strings.Fields(receivedSPF)[0]
			}
		}
	}

	if !spf.Present {
		spf.Result = "none"
	}

	return spf
}

func parseDKIM(headers map[string]string) DKIMResult {
	dkim := DKIMResult{}

	authResults := headers["authentication-results"]
	if authResults != "" {
		lower := strings.ToLower(authResults)
		if strings.Contains(lower, "dkim=") {
			dkim.Present = true
			if strings.Contains(lower, "dkim=pass") {
				dkim.Pass = true
				dkim.Result = "pass"
			} else if strings.Contains(lower, "dkim=fail") {
				dkim.Result = "fail"
			} else if strings.Contains(lower, "dkim=none") {
				dkim.Result = "none"
			} else {
				dkim.Result = "unknown"
			}

			// Extract domain
			dIdx := strings.Index(lower, "header.d=")
			if dIdx >= 0 {
				rest := authResults[dIdx+9:]
				end := strings.IndexAny(rest, " \t;")
				if end > 0 {
					dkim.Domain = rest[:end]
				} else {
					dkim.Domain = rest
				}
			}

			// Extract selector
			sIdx := strings.Index(lower, "header.s=")
			if sIdx >= 0 {
				rest := authResults[sIdx+9:]
				end := strings.IndexAny(rest, " \t;")
				if end > 0 {
					dkim.Selector = rest[:end]
				} else {
					dkim.Selector = rest
				}
			}
		}
	}

	// Check for DKIM-Signature header
	if headers["dkim-signature"] != "" {
		dkim.Present = true
		if dkim.Result == "" {
			dkim.Result = "signature present (unverified)"
		}
		sig := headers["dkim-signature"]
		// Extract d= and s=
		parts := strings.Split(sig, ";")
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if strings.HasPrefix(p, "d=") {
				dkim.Domain = strings.TrimSpace(p[2:])
			} else if strings.HasPrefix(p, "s=") {
				dkim.Selector = strings.TrimSpace(p[2:])
			}
		}
	}

	if !dkim.Present {
		dkim.Result = "none"
	}

	return dkim
}

func parseDMARC(headers map[string]string) DMARCResult {
	dmarc := DMARCResult{}

	authResults := headers["authentication-results"]
	if authResults != "" {
		lower := strings.ToLower(authResults)
		if strings.Contains(lower, "dmarc=") {
			dmarc.Present = true
			if strings.Contains(lower, "dmarc=pass") {
				dmarc.Pass = true
				dmarc.Result = "pass"
			} else if strings.Contains(lower, "dmarc=fail") {
				dmarc.Result = "fail"
			} else if strings.Contains(lower, "dmarc=none") {
				dmarc.Result = "none"
			} else {
				dmarc.Result = "unknown"
			}

			// Extract policy
			pIdx := strings.Index(lower, "policy=")
			if pIdx >= 0 {
				rest := authResults[pIdx+7:]
				end := strings.IndexAny(rest, " \t;")
				if end > 0 {
					dmarc.Policy = strings.ToLower(rest[:end])
				} else {
					dmarc.Policy = strings.ToLower(rest)
				}
			}
		}
	}

	if !dmarc.Present {
		dmarc.Result = "none"
	}

	return dmarc
}

func parseIPChain(raw string) []HopInfo {
	var hops []HopInfo
	lines := strings.Split(raw, "\n")

	var receivedHeaders []string
	var currentReceived strings.Builder
	inReceived := false

	for _, line := range lines {
		line = strings.TrimRight(line, "\r")
		lowerLine := strings.ToLower(line)

		if strings.HasPrefix(lowerLine, "received:") {
			if inReceived && currentReceived.Len() > 0 {
				receivedHeaders = append(receivedHeaders, currentReceived.String())
				currentReceived.Reset()
			}
			inReceived = true
			currentReceived.WriteString(line[9:])
		} else if inReceived && (line[0:1] == " " || line[0:1] == "\t") {
			currentReceived.WriteString(" ")
			currentReceived.WriteString(strings.TrimSpace(line))
		} else if inReceived {
			if currentReceived.Len() > 0 {
				receivedHeaders = append(receivedHeaders, currentReceived.String())
				currentReceived.Reset()
			}
			inReceived = false
		}
	}
	if inReceived && currentReceived.Len() > 0 {
		receivedHeaders = append(receivedHeaders, currentReceived.String())
	}

	for _, rcv := range receivedHeaders {
		hop := HopInfo{}
		lower := strings.ToLower(rcv)

		// Extract FROM
		fromIdx := strings.Index(lower, "from ")
		if fromIdx >= 0 {
			rest := rcv[fromIdx+5:]
			end := strings.IndexAny(rest, " \t\n")
			if end > 0 {
				hop.From = strings.Trim(rest[:end], "[]")
			}
		}

		// Extract BY
		byIdx := strings.Index(lower, " by ")
		if byIdx >= 0 {
			rest := rcv[byIdx+4:]
			end := strings.IndexAny(rest, " \t\n")
			if end > 0 {
				hop.By = strings.Trim(rest[:end], "[]")
			}
		}

		// Extract IP from brackets
		bracketStart := strings.Index(rcv, "[")
		bracketEnd := strings.Index(rcv, "]")
		if bracketStart >= 0 && bracketEnd > bracketStart {
			candidate := rcv[bracketStart+1 : bracketEnd]
			if net.ParseIP(candidate) != nil {
				hop.IP = candidate
				hop.IsPublic = isPublicIP(candidate)
			}
		}

		// Extract timestamp (after semicolon)
		semiIdx := strings.LastIndex(rcv, ";")
		if semiIdx >= 0 {
			hop.Timestamp = strings.TrimSpace(rcv[semiIdx+1:])
		}

		if hop.From != "" || hop.IP != "" {
			hops = append(hops, hop)
		}
	}

	return hops
}

func isPublicIP(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}

	privateRanges := []string{
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"127.0.0.0/8",
		"::1/128",
		"fc00::/7",
		"fe80::/10",
	}

	for _, cidr := range privateRanges {
		_, network, err := net.ParseCIDR(cidr)
		if err == nil && network.Contains(ip) {
			return false
		}
	}
	return true
}

func calculatePhishScore(result *EmailHeaderResult) (int, []string) {
	score := 0
	var reasons []string

	// SPF fail
	if !result.SPF.Pass && result.SPF.Result != "none" {
		score += 25
		reasons = append(reasons, fmt.Sprintf("SPF check failed (%s)", result.SPF.Result))
	} else if !result.SPF.Present {
		score += 15
		reasons = append(reasons, "No SPF record found")
	}

	// DKIM fail
	if !result.DKIM.Pass && result.DKIM.Present {
		score += 25
		reasons = append(reasons, fmt.Sprintf("DKIM check failed (%s)", result.DKIM.Result))
	} else if !result.DKIM.Present {
		score += 10
		reasons = append(reasons, "No DKIM signature found")
	}

	// DMARC fail
	if !result.DMARC.Pass && result.DMARC.Present {
		score += 20
		reasons = append(reasons, fmt.Sprintf("DMARC check failed (%s)", result.DMARC.Result))
	} else if !result.DMARC.Present {
		score += 10
		reasons = append(reasons, "No DMARC policy found")
	}

	// Check display name vs actual email mismatch
	from := result.From
	if from != "" {
		atIdx := strings.Index(from, "@")
		angleIdx := strings.Index(from, "<")
		if angleIdx >= 0 && atIdx > angleIdx {
			// Has display name
			displayName := strings.TrimSpace(from[:angleIdx])
			emailPart := strings.Trim(from[angleIdx+1:], "<>")
			emailDomain := ""
			if atIdx2 := strings.Index(emailPart, "@"); atIdx2 >= 0 {
				emailDomain = emailPart[atIdx2+1:]
				emailDomain = strings.Trim(emailDomain, ">")
			}
			// Check if display name looks like a different domain
			if strings.Contains(displayName, "@") || strings.Contains(displayName, ".com") {
				if emailDomain != "" && !strings.Contains(strings.ToLower(displayName), strings.ToLower(emailDomain)) {
					score += 20
					reasons = append(reasons, "Display name domain mismatch with actual sender")
				}
			}
		}
	}

	// Check for suspicious keywords in subject
	subject := strings.ToLower(result.Subject)
	suspicious := []string{"urgent", "verify", "suspended", "click here", "confirm", "account", "password", "update required", "limited time", "won", "prize", "lottery"}
	susCount := 0
	for _, kw := range suspicious {
		if strings.Contains(subject, kw) {
			susCount++
		}
	}
	if susCount >= 2 {
		score += 15
		reasons = append(reasons, fmt.Sprintf("Subject contains %d suspicious keywords", susCount))
	}

	// Check if external IPs are present in chain
	publicCount := 0
	for _, hop := range result.IPChain {
		if hop.IsPublic {
			publicCount++
		}
	}
	if publicCount > 3 {
		score += 10
		reasons = append(reasons, fmt.Sprintf("Unusually long routing chain (%d public hops)", publicCount))
	}

	if score > 100 {
		score = 100
	}
	return score, reasons
}
