// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"context"
	"fmt"
	"net"
	"strings"
	"sync"
	"time"
)

// PortResult holds information about a scanned port.
type PortResult struct {
	Port    int    `json:"port"`
	Open    bool   `json:"open"`
	Service string `json:"service"`
	Banner  string `json:"banner,omitempty"`
}

// serviceNames maps common ports to service names.
var serviceNames = map[int]string{
	21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
	80: "HTTP", 110: "POP3", 111: "RPCBind", 119: "NNTP", 123: "NTP",
	135: "MSRPC", 139: "NetBIOS", 143: "IMAP", 194: "IRC", 389: "LDAP",
	443: "HTTPS", 445: "SMB", 465: "SMTPS", 514: "Syslog", 587: "SMTP/TLS",
	631: "IPP", 636: "LDAPS", 993: "IMAPS", 995: "POP3S", 1080: "SOCKS",
	1433: "MSSQL", 1521: "Oracle", 1723: "PPTP", 2049: "NFS", 2181: "Zookeeper",
	2375: "Docker", 2376: "Docker TLS", 3000: "NodeJS", 3306: "MySQL",
	3389: "RDP", 3690: "SVN", 4444: "Metasploit", 4848: "GlassFish",
	5000: "Flask/UPnP", 5432: "PostgreSQL", 5601: "Kibana", 5672: "AMQP",
	5900: "VNC", 5984: "CouchDB", 6000: "X11", 6379: "Redis", 6443: "Kubernetes",
	7001: "WebLogic", 7077: "Spark", 7474: "Neo4j", 8000: "HTTP-Alt",
	8008: "HTTP-Alt", 8080: "HTTP-Proxy", 8081: "HTTP-Alt", 8082: "HTTP-Alt",
	8083: "HTTP-Alt", 8084: "HTTP-Alt", 8085: "HTTP-Alt", 8086: "InfluxDB",
	8087: "Riak", 8088: "HTTP-Alt", 8089: "Splunk", 8090: "HTTP-Alt",
	8091: "Couchbase", 8092: "Couchbase", 8093: "Couchbase", 8094: "Couchbase",
	8095: "HTTP-Alt", 8096: "Jellyfin", 8123: "Home Assistant", 8181: "HTTP-Alt",
	8443: "HTTPS-Alt", 8444: "HTTPS-Alt", 8500: "Consul", 8545: "Ethereum",
	8888: "Jupyter", 9000: "PHP-FPM/Portainer", 9001: "Tor/Supervisor",
	9042: "Cassandra", 9090: "Prometheus", 9092: "Kafka", 9200: "Elasticsearch",
	9300: "Elasticsearch Cluster", 9418: "Git", 9443: "HTTPS-Alt",
	10000: "Webmin", 10250: "Kubelet", 11211: "Memcached", 15672: "RabbitMQ Mgmt",
	25565: "Minecraft", 27017: "MongoDB", 27018: "MongoDB", 27019: "MongoDB",
	28017: "MongoDB Web", 50000: "Jenkins", 50070: "Hadoop NameNode",
}

// top1000Ports contains the most commonly scanned ports.
var top1000Ports = []int{
	1, 3, 4, 6, 7, 9, 13, 17, 19, 20, 21, 22, 23, 24, 25, 26, 30, 32, 33, 37,
	42, 43, 49, 53, 70, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 99, 100, 106,
	109, 110, 111, 113, 119, 125, 135, 139, 143, 144, 146, 161, 163, 179, 199,
	211, 212, 222, 254, 255, 256, 259, 264, 280, 301, 306, 311, 340, 366, 389,
	406, 407, 416, 417, 425, 427, 443, 444, 445, 458, 464, 465, 481, 497, 500,
	512, 513, 514, 515, 524, 541, 543, 544, 545, 548, 554, 555, 563, 587, 593,
	616, 617, 625, 631, 636, 646, 648, 666, 667, 668, 683, 687, 691, 700, 705,
	711, 714, 720, 722, 726, 749, 765, 777, 783, 787, 800, 801, 808, 843, 873,
	880, 888, 898, 900, 901, 902, 903, 911, 912, 981, 987, 990, 992, 993, 995,
	999, 1000, 1001, 1002, 1007, 1009, 1010, 1011, 1021, 1022, 1023, 1024,
	1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033, 1034, 1035, 1036,
	1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048,
	1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1060,
	1061, 1062, 1063, 1064, 1065, 1066, 1067, 1068, 1069, 1070, 1071, 1072,
	1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1110, 1234, 1433, 1434,
	1521, 1720, 1723, 1755, 1900, 2000, 2001, 2049, 2121, 2181, 2375, 2376,
	3000, 3128, 3306, 3389, 3690, 4000, 4444, 4848, 5000, 5432, 5601, 5672,
	5900, 5984, 6000, 6379, 6443, 7001, 7077, 7474, 8000, 8008, 8080, 8081,
	8086, 8088, 8089, 8090, 8091, 8123, 8443, 8500, 8545, 8888, 9000, 9001,
	9042, 9090, 9092, 9200, 9300, 9418, 9443, 10000, 10250, 11211, 15672,
	27017, 27018, 27019, 28017, 50000, 50070,
}

// ScanPorts scans the top 1000 ports on the given host concurrently.
func ScanPorts(ctx context.Context, host string, progress chan<- int) ([]PortResult, error) {
	type job struct{ port int }

	jobs := make(chan job, len(top1000Ports))
	results := make(chan PortResult, 100)
	var wg sync.WaitGroup

	workers := 200
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
				}
				addr := fmt.Sprintf("%s:%d", host, j.port)
				conn, err := net.DialTimeout("tcp", addr, 2*time.Second)
				if err != nil {
					continue
				}

				banner := ""
				conn.SetReadDeadline(time.Now().Add(500 * time.Millisecond))
				buf := make([]byte, 256)
				n, _ := conn.Read(buf)
				if n > 0 {
					banner = strings.TrimSpace(string(buf[:n]))
					banner = strings.Map(func(r rune) rune {
						if r < 32 || r > 126 {
							return ' '
						}
						return r
					}, banner)
				}
				conn.Close()

				svc := serviceNames[j.port]
				if svc == "" {
					svc = "unknown"
				}

				results <- PortResult{
					Port:    j.port,
					Open:    true,
					Service: svc,
					Banner:  banner,
				}
			}
		}()
	}

	total := len(top1000Ports)
	go func() {
		for i, port := range top1000Ports {
			select {
			case <-ctx.Done():
				close(jobs)
				return
			case jobs <- job{port: port}:
				if progress != nil {
					pct := (i + 1) * 100 / total
					select {
					case progress <- pct:
					default:
					}
				}
			}
		}
		close(jobs)
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	var found []PortResult
	for r := range results {
		found = append(found, r)
	}

	return found, nil
}
