// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"context"
	"fmt"
	"net"
	"sync"
)

// SubdomainResult holds the result of a single subdomain probe.
type SubdomainResult struct {
	Subdomain string   `json:"subdomain"`
	IPs       []string `json:"ips"`
}

// subdomainWordlist is a built-in list of common subdomains to probe.
var subdomainWordlist = []string{
	"www", "mail", "ftp", "localhost", "webmail", "smtp", "pop", "ns1", "ns2",
	"webdisk", "ns", "cpanel", "whm", "autodiscover", "autoconfig", "m",
	"imap", "test", "ns3", "dev", "www2", "admin", "forum", "news", "vpn",
	"ns4", "mail2", "new", "mysql", "old", "lists", "support", "mobile", "mx",
	"static", "docs", "beta", "shop", "sql", "secure", "demo", "cp", "calendar",
	"wiki", "web", "media", "email", "images", "img", "www1", "intranet",
	"portal", "video", "sip", "dns2", "api", "cdn", "stats", "dns1", "ns5",
	"blog", "mail3", "home", "server", "chat", "app", "apps", "helpdesk",
	"gateway", "auth", "sso", "login", "remote", "vpn2", "monitor", "dashboard",
	"git", "gitlab", "github", "jenkins", "jira", "confluence", "sonar",
	"prometheus", "grafana", "kibana", "elasticsearch", "redis", "mongo", "db",
	"database", "postgres", "mysql2", "mariadb", "backup", "backups", "storage",
	"cdn2", "download", "upload", "assets", "files", "data", "reporting",
	"services", "service", "microservice", "internal", "office", "ws", "wss",
	"streaming", "stream", "live", "events", "scheduler", "jobs", "queue",
	"broker", "mq", "rabbitmq", "kafka", "zookeeper", "consul", "vault",
	"kubernetes", "k8s", "docker", "registry", "harbor", "nexus", "artifactory",
	"dev2", "staging", "stage", "prod", "production", "qa", "uat", "testing",
	"preprod", "sandbox", "canary", "preview", "release", "v2", "v1", "api2",
	"api3", "rest", "graphql", "grpc", "rpc", "webhook", "hooks", "events2",
	"notify", "notifications", "push", "alerts", "logging", "logs", "metrics",
	"trace", "tracing", "debug", "health", "healthz", "ready", "live2",
	"status", "ping", "echo", "feedback", "search", "elastic", "solr",
	"cache", "memcache", "memcached", "session", "token", "oauth", "saml",
	"oidc", "id", "identity", "account", "accounts", "billing", "payment",
	"payments", "checkout", "cart", "store", "marketplace", "ecommerce",
	"crm", "erp", "hr", "finance", "legal", "compliance", "security",
	"soc", "iam", "ldap", "ad", "dc", "dc1", "dc2", "exchange", "sharepoint",
	"skype", "teams", "zoom", "meet", "conference", "webconf", "wireless",
	"wifi", "network", "router", "switch", "firewall", "proxy", "loadbalancer",
	"lb", "haproxy", "nginx", "apache", "iis", "tomcat", "wildfly",
	"glassfish", "weblogic", "websphere", "jboss", "spring", "node", "nodejs",
	"php", "python", "ruby", "go", "rust", "java", "dotnet", "net", "ms",
	"microsoft", "google", "aws", "azure", "gcp", "oracle", "ibm", "vmware",
	"citrix", "sap", "salesforce", "servicenow", "workday", "okta", "duo",
	"crowdstrike", "sentinelone", "splunk", "sumo", "datadog", "newrelic",
	"pagerduty", "opsgenie", "victorops", "pingdom", "uptime", "nagios",
	"zabbix", "icinga", "cacti", "munin", "ganglia", "graphite", "influxdb",
	"telegraf", "fluentd", "logstash", "beats", "filebeat", "metricbeat",
	"packetbeat", "winlogbeat", "auditbeat", "heartbeat", "apm", "otel",
	"opentelemetry", "jaeger", "zipkin", "skywalking", "pinpoint", "dynatrace",
	"appdynamics", "instana", "lightstep", "honeycomb", "signoz", "tempo",
	"loki", "cortex", "thanos", "victoriametrics", "mimir", "pyroscope",
	"faro", "k6", "locust", "gatling", "jmeter", "blazemeter", "loadrunner",
	"artillery", "vegeta", "hey", "wrk", "siege", "ab", "autocert", "cert",
	"certs", "certificate", "pki", "ca", "acme", "certbot", "letsencrypt",
	"mail4", "mail5", "mx1", "mx2", "mx3", "spam", "antispam", "filter",
	"relay", "smarthost", "outbound", "inbound", "exchange2", "ews", "owa",
	"autodiscover2", "mobileconfig", "update", "updates", "patch", "patches",
	"repo", "repository", "packages", "pkg", "apt", "yum", "pip", "npm",
	"gradle", "maven", "composer", "cargo", "gem", "pub", "nuget", "conda",
	"anaconda", "jupyter", "notebook", "lab", "rstudio", "spyder",
	"colab", "databricks", "mlflow", "kubeflow", "airflow", "luigi", "prefect",
	"dagster", "metaflow", "bentoml", "seldon", "mlserver", "triton",
	"torchserve", "tfserving", "onnx", "ray", "dask", "spark", "hadoop",
	"hive", "pig", "sqoop", "flume", "oozie", "zeppelin", "hbase", "cassandra",
	"couchdb", "couchbase", "dynamodb", "cosmosdb", "bigtable", "spanner",
	"aurora", "rds", "redshift", "bigquery", "snowflake", "dbt", "fivetran",
	"stitch", "airbyte", "debezium", "kafka2", "kinesis", "pubsub", "eventbridge",
	"sns", "sqs", "nats", "stan", "pulsar", "activemq", "solace", "tibco",
	"ibmmq", "hornetq", "zeromq", "nanomsg", "nanomsg2", "grpc2", "thrift",
	"avro", "protobuf", "flatbuffers", "capnproto", "msgpack", "cbor", "bson",
	"json2", "xml", "yaml", "toml", "ini", "csv", "parquet", "orc", "avro2",
	"hdf5", "netcdf", "zarr", "geotiff", "shapefile", "geojson", "topojson",
	"wms", "wfs", "wcs", "wmts", "ogc", "gis", "geoserver", "mapserver",
	"leaflet", "mapbox", "cesium", "openlayers", "arcgis", "qgis", "gdal",
	"proj", "postgis", "spatialite", "h3", "geohash", "s2", "tiles", "mbtiles",
	"tippecanoe", "pmtiles", "vector", "raster", "dem", "lidar", "pointcloud",
	"slam", "ros", "gazebo", "rviz", "moveit", "navigation", "nav2", "rtab",
	"cartographer", "orb", "vins", "colmap", "meshroom", "blender", "unity",
	"unreal", "godot", "cocos", "phaser", "threejs", "babylonjs", "playcanvas",
	"aframe", "webxr", "ar", "vr", "mr", "xr", "metaverse", "web3", "blockchain",
	"ethereum", "solana", "polygon", "avalanche", "cosmos", "polkadot", "near",
	"algorand", "tezos", "cardano", "eos", "tron", "binance", "chainlink",
	"ipfs", "filecoin", "arweave", "storj", "sia", "swarm", "ceramic",
	"orbit", "gundb", "textile", "fleek", "pinata", "nftstorage", "web3storage",
	"infura", "alchemy", "moralis", "quicknode", "ankr", "chainstack",
	"getblock", "publicnode", "thegraph", "covalent", "dune", "nansen",
	"chainalysis", "elliptic", "cipher", "ciphertrace", "crystalblockchain",
}

// EnumerateSubdomains probes a wordlist of subdomains concurrently.
// Progress is reported via the progress channel as percentage (0-100).
func EnumerateSubdomains(ctx context.Context, domain string, progress chan<- int) ([]SubdomainResult, error) {
	type job struct {
		sub string
	}

	jobs := make(chan job, len(subdomainWordlist))
	results := make(chan SubdomainResult, 100)
	var wg sync.WaitGroup

	workers := 50
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
				fqdn := fmt.Sprintf("%s.%s", j.sub, domain)
				ips, err := net.DefaultResolver.LookupHost(ctx, fqdn)
				if err == nil && len(ips) > 0 {
					results <- SubdomainResult{
						Subdomain: fqdn,
						IPs:       ips,
					}
				}
			}
		}()
	}

	total := len(subdomainWordlist)
	go func() {
		for i, sub := range subdomainWordlist {
			select {
			case <-ctx.Done():
				close(jobs)
				return
			case jobs <- job{sub: sub}:
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

	var found []SubdomainResult
	for r := range results {
		found = append(found, r)
	}

	return found, nil
}
