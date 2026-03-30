// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"strings"
	"time"
)

// SSLResult holds SSL/TLS certificate analysis results.
type SSLResult struct {
	Domain         string    `json:"domain"`
	Valid          bool      `json:"valid"`
	Subject        string    `json:"subject"`
	Issuer         string    `json:"issuer"`
	NotBefore      time.Time `json:"not_before"`
	NotAfter       time.Time `json:"not_after"`
	DaysUntilExpiry int      `json:"days_until_expiry"`
	ExpiryWarning  bool      `json:"expiry_warning"`
	SANs           []string  `json:"sans"`
	Protocol       string    `json:"protocol"`
	CipherSuite    string    `json:"cipher_suite"`
	SecurityScore  int       `json:"security_score"`
	Issues         []string  `json:"issues"`
	Error          string    `json:"error,omitempty"`
}

// InspectSSL performs SSL/TLS certificate analysis on the given domain.
func InspectSSL(domain string) (*SSLResult, error) {
	result := &SSLResult{Domain: domain}

	host := domain
	port := "443"
	if strings.Contains(domain, ":") {
		var err error
		host, port, err = net.SplitHostPort(domain)
		if err != nil {
			result.Error = fmt.Sprintf("invalid domain: %v", err)
			return result, nil
		}
	}

	conn, err := tls.DialWithDialer(
		&net.Dialer{Timeout: 15 * time.Second},
		"tcp",
		net.JoinHostPort(host, port),
		&tls.Config{
			ServerName:         host,
			InsecureSkipVerify: false,
		},
	)
	if err != nil {
		insecureConn, insecureErr := tls.DialWithDialer(
			&net.Dialer{Timeout: 15 * time.Second},
			"tcp",
			net.JoinHostPort(host, port),
			&tls.Config{
				ServerName:         host,
				InsecureSkipVerify: true,
			},
		)
		if insecureErr != nil {
			result.Error = fmt.Sprintf("TLS connection failed: %v", err)
			return result, nil
		}
		defer insecureConn.Close()
		result.Valid = false
		result.Issues = append(result.Issues, "Certificate verification failed: "+err.Error())
		analyzeCert(result, insecureConn)
		return result, nil
	}
	defer conn.Close()
	result.Valid = true
	analyzeCert(result, conn)
	return result, nil
}

// analyzeCert extracts and scores the certificate from an established TLS connection.
func analyzeCert(result *SSLResult, conn *tls.Conn) {
	state := conn.ConnectionState()
	result.SecurityScore = 100

	switch state.Version {
	case tls.VersionTLS13:
		result.Protocol = "TLS 1.3"
	case tls.VersionTLS12:
		result.Protocol = "TLS 1.2"
		result.SecurityScore -= 5
	case tls.VersionTLS11:
		result.Protocol = "TLS 1.1"
		result.SecurityScore -= 30
		result.Issues = append(result.Issues, "TLS 1.1 is deprecated")
	default:
		result.Protocol = fmt.Sprintf("TLS (unknown: 0x%04x)", state.Version)
		result.SecurityScore -= 40
		result.Issues = append(result.Issues, "Weak TLS version")
	}

	result.CipherSuite = tls.CipherSuiteName(state.CipherSuite)
	weakCiphers := []string{"RC4", "DES", "3DES", "EXPORT", "NULL"}
	for _, weak := range weakCiphers {
		if strings.Contains(result.CipherSuite, weak) {
			result.Issues = append(result.Issues, "Weak cipher suite: "+result.CipherSuite)
			result.SecurityScore -= 20
			break
		}
	}

	if len(state.PeerCertificates) == 0 {
		result.Error = "no certificates found"
		return
	}

	cert := state.PeerCertificates[0]
	result.Subject = cert.Subject.CommonName
	result.Issuer = cert.Issuer.CommonName
	result.NotBefore = cert.NotBefore
	result.NotAfter = cert.NotAfter

	for _, san := range cert.DNSNames {
		result.SANs = append(result.SANs, san)
	}
	for _, ip := range cert.IPAddresses {
		result.SANs = append(result.SANs, ip.String())
	}

	now := time.Now()
	result.DaysUntilExpiry = int(cert.NotAfter.Sub(now).Hours() / 24)
	if result.DaysUntilExpiry < 0 {
		result.Issues = append(result.Issues, "Certificate is expired")
		result.SecurityScore -= 50
		result.ExpiryWarning = true
	} else if result.DaysUntilExpiry < 30 {
		result.Issues = append(result.Issues, fmt.Sprintf("Certificate expires in %d days", result.DaysUntilExpiry))
		result.SecurityScore -= 15
		result.ExpiryWarning = true
	}

	if cert.PublicKeyAlgorithm == x509.RSA {
		if cert.PublicKey != nil {
			type rsaKey interface{ Size() int }
			if rk, ok := cert.PublicKey.(rsaKey); ok && rk.Size()*8 < 2048 {
				result.Issues = append(result.Issues, "Weak RSA key size (< 2048 bits)")
				result.SecurityScore -= 20
			}
		}
	}

	if result.SecurityScore < 0 {
		result.SecurityScore = 0
	}
}
