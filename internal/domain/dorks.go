// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import "fmt"

// DorkCategory holds a named group of Google dork queries.
type DorkCategory struct {
	Name  string   `json:"name"`
	Dorks []string `json:"dorks"`
}

// GenerateDorks produces 30+ categories of Google dork queries for the target domain.
func GenerateDorks(domain string) []DorkCategory {
	return []DorkCategory{
		{
			Name: "Sensitive Files",
			Dorks: []string{
				fmt.Sprintf("site:%s filetype:pdf", domain),
				fmt.Sprintf("site:%s filetype:xls OR filetype:xlsx", domain),
				fmt.Sprintf("site:%s filetype:doc OR filetype:docx", domain),
				fmt.Sprintf("site:%s filetype:sql", domain),
				fmt.Sprintf("site:%s filetype:log", domain),
				fmt.Sprintf("site:%s filetype:env", domain),
				fmt.Sprintf("site:%s filetype:bak OR filetype:backup", domain),
				fmt.Sprintf("site:%s filetype:conf OR filetype:config", domain),
			},
		},
		{
			Name: "Login Pages",
			Dorks: []string{
				fmt.Sprintf("site:%s inurl:login", domain),
				fmt.Sprintf("site:%s inurl:signin", domain),
				fmt.Sprintf("site:%s inurl:admin", domain),
				fmt.Sprintf("site:%s inurl:dashboard", domain),
				fmt.Sprintf("site:%s inurl:portal", domain),
				fmt.Sprintf("site:%s intitle:login OR intitle:sign in", domain),
			},
		},
		{
			Name: "Error Messages",
			Dorks: []string{
				fmt.Sprintf("site:%s \"sql syntax\" OR \"mysql error\"", domain),
				fmt.Sprintf("site:%s \"Warning: mysqli\" OR \"Warning: mysql\"", domain),
				fmt.Sprintf("site:%s \"Exception\" intext:\"stack trace\"", domain),
				fmt.Sprintf("site:%s intext:\"Fatal error\"", domain),
				fmt.Sprintf("site:%s intext:\"Uncaught exception\"", domain),
			},
		},
		{
			Name: "Exposed Directories",
			Dorks: []string{
				fmt.Sprintf("site:%s intitle:\"Index of /\"", domain),
				fmt.Sprintf("site:%s intitle:\"Directory listing\"", domain),
				fmt.Sprintf("site:%s inurl:/backup/", domain),
				fmt.Sprintf("site:%s inurl:/uploads/", domain),
				fmt.Sprintf("site:%s inurl:/.git/", domain),
				fmt.Sprintf("site:%s inurl:/.svn/", domain),
				fmt.Sprintf("site:%s inurl:/.env", domain),
			},
		},
		{
			Name: "API & Endpoints",
			Dorks: []string{
				fmt.Sprintf("site:%s inurl:/api/", domain),
				fmt.Sprintf("site:%s inurl:/v1/ OR inurl:/v2/", domain),
				fmt.Sprintf("site:%s inurl:swagger", domain),
				fmt.Sprintf("site:%s inurl:graphql", domain),
				fmt.Sprintf("site:%s inurl:/api/docs", domain),
				fmt.Sprintf("site:%s filetype:json inurl:api", domain),
			},
		},
		{
			Name: "Credentials & Secrets",
			Dorks: []string{
				fmt.Sprintf("site:%s intext:\"password\" filetype:log", domain),
				fmt.Sprintf("site:%s intext:\"api_key\" OR intext:\"apikey\"", domain),
				fmt.Sprintf("site:%s intext:\"secret_key\" OR intext:\"secret\"", domain),
				fmt.Sprintf("site:%s intext:\"access_token\" OR intext:\"auth_token\"", domain),
				fmt.Sprintf("site:%s intext:\"BEGIN RSA PRIVATE KEY\"", domain),
			},
		},
		{
			Name: "Cloud Storage",
			Dorks: []string{
				fmt.Sprintf("site:s3.amazonaws.com \"%s\"", domain),
				fmt.Sprintf("site:blob.core.windows.net \"%s\"", domain),
				fmt.Sprintf("site:storage.googleapis.com \"%s\"", domain),
				fmt.Sprintf("\"%s\" site:pastebin.com", domain),
				fmt.Sprintf("\"%s\" site:github.com password OR secret OR key", domain),
			},
		},
		{
			Name: "Subdomains",
			Dorks: []string{
				fmt.Sprintf("site:*.%s", domain),
				fmt.Sprintf("site:*.%s -site:www.%s", domain, domain),
				fmt.Sprintf("inurl:%s -site:%s", domain, domain),
			},
		},
		{
			Name: "Technology Stack",
			Dorks: []string{
				fmt.Sprintf("site:%s intext:\"Powered by\"", domain),
				fmt.Sprintf("site:%s intext:\"Built with\"", domain),
				fmt.Sprintf("site:%s intitle:\"phpMyAdmin\"", domain),
				fmt.Sprintf("site:%s inurl:wp-login.php", domain),
				fmt.Sprintf("site:%s inurl:administrator/index.php", domain),
			},
		},
		{
			Name: "Security Issues",
			Dorks: []string{
				fmt.Sprintf("site:%s intext:\"Cross-Site Request Forgery\"", domain),
				fmt.Sprintf("site:%s intext:\"sql injection\"", domain),
				fmt.Sprintf("site:%s intext:\"XSS\" OR intext:\"cross-site scripting\"", domain),
				fmt.Sprintf("site:%s intitle:\"403 Forbidden\" OR intitle:\"404 Not Found\"", domain),
			},
		},
		{
			Name: "Email & Users",
			Dorks: []string{
				fmt.Sprintf("site:%s intext:\"@%s\" filetype:pdf OR filetype:doc", domain, domain),
				fmt.Sprintf("\"%s\" intext:\"email\" intext:\"password\"", domain),
				fmt.Sprintf("intext:\"@%s\" site:linkedin.com", domain),
				fmt.Sprintf("\"@%s\" site:pastebin.com", domain),
			},
		},
		{
			Name: "Cached & Archived",
			Dorks: []string{
				fmt.Sprintf("cache:%s", domain),
				fmt.Sprintf("info:%s", domain),
				fmt.Sprintf("related:%s", domain),
				fmt.Sprintf("link:%s", domain),
			},
		},
	}
}
