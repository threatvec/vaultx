// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package network

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// PortResult represents a single scanned port.
type PortResult struct {
	Port    int    `json:"port"`
	State   string `json:"state"`
	Service string `json:"service"`
	Banner  string `json:"banner,omitempty"`
}

// PortScanResult holds the full port scan output.
type PortScanResult struct {
	Target    string       `json:"target"`
	OpenPorts []PortResult `json:"open_ports"`
	Total     int          `json:"total"`
	Scanned   int          `json:"scanned"`
	StartTime time.Time    `json:"start_time"`
	EndTime   time.Time    `json:"end_time"`
	Error     string       `json:"error,omitempty"`
}

// PortScanProgress is emitted during scanning.
type PortScanProgress struct {
	Scanned int `json:"scanned"`
	Total   int `json:"total"`
	Found   int `json:"found"`
}

var top1000Ports = []int{
	1, 3, 4, 6, 7, 9, 13, 17, 19, 20, 21, 22, 23, 24, 25, 26, 30, 32, 33, 37,
	42, 43, 49, 53, 70, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 99, 100, 106, 109, 110,
	111, 113, 119, 125, 135, 139, 143, 144, 146, 161, 163, 179, 199, 211, 212, 222, 254, 255, 256, 259,
	264, 280, 301, 306, 311, 340, 366, 389, 406, 407, 416, 417, 425, 427, 443, 444, 445, 458, 464, 465,
	481, 497, 500, 512, 513, 514, 515, 524, 541, 543, 544, 545, 548, 554, 555, 563, 587, 593, 616, 617,
	625, 631, 636, 646, 648, 666, 667, 668, 683, 687, 691, 700, 705, 711, 714, 720, 722, 726, 749, 765,
	777, 783, 787, 800, 801, 808, 843, 873, 880, 888, 898, 900, 901, 902, 903, 911, 912, 981, 987, 990,
	992, 993, 995, 999, 1000, 1001, 1002, 1007, 1009, 1010, 1011, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029,
	1030, 1031, 1032, 1033, 1034, 1035, 1036, 1037, 1038, 1039, 1040, 1041, 1044, 1048, 1049, 1050, 1053, 1054, 1056, 1058,
	1059, 1064, 1065, 1066, 1069, 1071, 1074, 1080, 1110, 1234, 1433, 1443, 1494, 1521, 1720, 1723, 1755, 1900,
	2000, 2001, 2049, 2082, 2083, 2086, 2087, 2095, 2096, 2100, 2121, 2181, 2222, 2375, 2376, 2379, 2380, 2404,
	3000, 3001, 3128, 3268, 3269, 3306, 3389, 3690, 4000, 4040, 4243, 4444, 4567, 4848, 5000, 5001, 5432,
	5601, 5900, 5984, 6000, 6379, 6443, 7001, 7474, 8000, 8001, 8008, 8080, 8081, 8082, 8083, 8084, 8085,
	8086, 8087, 8088, 8089, 8090, 8091, 8092, 8093, 8094, 8095, 8096, 8097, 8098, 8099, 8100, 8180, 8181,
	8222, 8333, 8443, 8500, 8888, 9000, 9001, 9042, 9090, 9091, 9092, 9093, 9094, 9100, 9200, 9300, 9418,
	9999, 10000, 10001, 10080, 11211, 15672, 16010, 16992, 16993, 27017, 27018, 27019, 28017, 50070, 50075,
}

var serviceNames = map[int]string{
	21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS", 80: "HTTP",
	81: "HTTP-Alt", 110: "POP3", 111: "RPCBind", 119: "NNTP", 135: "MSRPC",
	139: "NetBIOS", 143: "IMAP", 161: "SNMP", 179: "BGP", 199: "SMUX",
	389: "LDAP", 443: "HTTPS", 445: "SMB", 465: "SMTPS", 500: "ISAKMP",
	512: "rexec", 513: "rlogin", 514: "rsh/syslog", 515: "LPD", 548: "AFP",
	554: "RTSP", 587: "SMTP-Sub", 636: "LDAPS", 993: "IMAPS", 995: "POP3S",
	1080: "SOCKS", 1433: "MSSQL", 1521: "Oracle", 1723: "PPTP", 2049: "NFS",
	2082: "cPanel", 2083: "cPanel-SSL", 2086: "WHM", 2087: "WHM-SSL",
	2375: "Docker", 2376: "Docker-TLS", 2379: "etcd", 2380: "etcd-peer",
	3000: "Dev-Server", 3306: "MySQL", 3389: "RDP", 3690: "SVN",
	4444: "Metasploit", 5000: "Flask/UPnP", 5432: "PostgreSQL",
	5601: "Kibana", 5900: "VNC", 5984: "CouchDB", 6379: "Redis",
	6443: "k8s-API", 7001: "WebLogic", 7474: "Neo4j", 8080: "HTTP-Proxy",
	8443: "HTTPS-Alt", 8888: "Jupyter", 9000: "PHP-FPM/SonarQube",
	9042: "Cassandra", 9090: "Prometheus", 9092: "Kafka", 9200: "Elasticsearch",
	9300: "Elasticsearch-Node", 9418: "Git", 10000: "Webmin",
	11211: "Memcached", 15672: "RabbitMQ", 27017: "MongoDB", 28017: "MongoDB-Web",
	50070: "Hadoop-NameNode",
}

var riskyPorts = map[int]bool{
	21: true, 23: true, 69: true, 135: true, 139: true, 161: true, 445: true,
	512: true, 513: true, 514: true, 1080: true, 1433: true, 1521: true, 2375: true,
	3389: true, 4444: true, 5900: true, 5984: true, 6379: true, 7001: true,
	8888: true, 9200: true, 11211: true, 27017: true, 50070: true,
}

// ScanPorts scans a target's ports with a 200-worker goroutine pool.
func ScanPorts(ctx context.Context, target string, customPorts []int, progressCh chan<- PortScanProgress) (*PortScanResult, error) {
	ports := top1000Ports
	if len(customPorts) > 0 {
		ports = customPorts
	}

	result := &PortScanResult{
		Target:    target,
		StartTime: time.Now(),
	}

	jobs := make(chan int, len(ports))
	type portRes struct {
		port   int
		open   bool
		banner string
	}
	results := make(chan portRes, len(ports))

	var scanned int64
	var mu sync.Mutex
	var openPorts []PortResult

	const workers = 200
	var wg sync.WaitGroup

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for port := range jobs {
				select {
				case <-ctx.Done():
					results <- portRes{port: port}
					continue
				default:
				}
				open, banner := scanPort(ctx, target, port)
				results <- portRes{port: port, open: open, banner: banner}
				cnt := atomic.AddInt64(&scanned, 1)
				if progressCh != nil && int(cnt)%50 == 0 {
					mu.Lock()
					found := len(openPorts)
					mu.Unlock()
					select {
					case progressCh <- PortScanProgress{Scanned: int(cnt), Total: len(ports), Found: found}:
					default:
					}
				}
			}
		}()
	}

	for _, p := range ports {
		jobs <- p
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	for r := range results {
		if r.open {
			svc := serviceNames[r.port]
			if svc == "" {
				svc = "unknown"
			}
			mu.Lock()
			openPorts = append(openPorts, PortResult{
				Port:    r.port,
				State:   "open",
				Service: svc,
				Banner:  r.banner,
			})
			mu.Unlock()
		}
	}

	sort.Slice(openPorts, func(i, j int) bool {
		return openPorts[i].Port < openPorts[j].Port
	})

	result.OpenPorts = openPorts
	result.Total = len(openPorts)
	result.Scanned = len(ports)
	result.EndTime = time.Now()
	return result, nil
}

// scanPort attempts a TCP connection and optional banner grab.
func scanPort(ctx context.Context, target string, port int) (bool, string) {
	addr := fmt.Sprintf("%s:%d", target, port)
	d := net.Dialer{Timeout: 2 * time.Second}

	conn, err := d.DialContext(ctx, "tcp", addr)
	if err != nil {
		return false, ""
	}
	defer conn.Close()

	// Banner grab
	conn.SetDeadline(time.Now().Add(500 * time.Millisecond))
	scanner := bufio.NewScanner(conn)
	var banner string
	if scanner.Scan() {
		banner = strings.TrimSpace(scanner.Text())
		if len(banner) > 100 {
			banner = banner[:100]
		}
	}
	return true, banner
}

// ParsePortRange parses a port range string like "80,443,1000-2000" into individual ports.
func ParsePortRange(s string) []int {
	var ports []int
	seen := map[int]bool{}
	parts := strings.Split(s, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if strings.Contains(part, "-") {
			rangeParts := strings.SplitN(part, "-", 2)
			if len(rangeParts) == 2 {
				start, err1 := strconv.Atoi(strings.TrimSpace(rangeParts[0]))
				end, err2 := strconv.Atoi(strings.TrimSpace(rangeParts[1]))
				if err1 == nil && err2 == nil && start <= end {
					for p := start; p <= end && p <= 65535; p++ {
						if !seen[p] {
							ports = append(ports, p)
							seen[p] = true
						}
					}
				}
			}
		} else {
			p, err := strconv.Atoi(part)
			if err == nil && p > 0 && p <= 65535 && !seen[p] {
				ports = append(ports, p)
				seen[p] = true
			}
		}
	}
	return ports
}

// IsRiskyPort returns true if the port is associated with dangerous services.
func IsRiskyPort(port int) bool {
	return riskyPorts[port]
}
