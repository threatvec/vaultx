// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package identity

import (
	"fmt"
	"net/url"
)

// DorkEntry is a single Google dork with its search URL.
type DorkEntry struct {
	Title       string `json:"title"`
	Query       string `json:"query"`
	SearchURL   string `json:"search_url"`
	Description string `json:"description"`
}

// DorkGroup groups related dorks under a category.
type DorkGroup struct {
	Category string      `json:"category"`
	Icon     string      `json:"icon"`
	Dorks    []DorkEntry `json:"dorks"`
}

// DorkResult holds all generated dork groups for a domain.
type DorkResult struct {
	Domain string      `json:"domain"`
	Groups []DorkGroup `json:"groups"`
	Total  int         `json:"total"`
}

type dorkTemplate struct {
	title       string
	query       string
	description string
}

var dorkCategories = []struct {
	category  string
	icon      string
	templates []dorkTemplate
}{
	{
		"Exposed Files",
		"📁",
		[]dorkTemplate{
			{"Config Files", `site:{domain} ext:env OR ext:cfg OR ext:conf OR ext:ini`, "Configuration files that may contain secrets"},
			{"Backup Files", `site:{domain} ext:bak OR ext:backup OR ext:old OR ext:orig`, "Backup files left on server"},
			{"Log Files", `site:{domain} ext:log`, "Server log files"},
			{"SQL Database Dumps", `site:{domain} ext:sql OR ext:db OR ext:dump`, "Database exports"},
			{"Spreadsheets", `site:{domain} ext:xls OR ext:xlsx OR ext:csv`, "Spreadsheet files with potential data"},
			{"Office Docs", `site:{domain} ext:doc OR ext:docx OR ext:pdf filetype:pdf`, "Office documents"},
			{"PHP Info Files", `site:{domain} inurl:phpinfo.php OR inurl:info.php`, "PHP info pages exposing server config"},
		},
	},
	{
		"Admin & Login",
		"🔐",
		[]dorkTemplate{
			{"Admin Panels", `site:{domain} inurl:admin OR inurl:administrator OR inurl:wp-admin`, "Administration interfaces"},
			{"Login Pages", `site:{domain} inurl:login OR inurl:signin OR inurl:auth`, "Authentication pages"},
			{"Control Panels", `site:{domain} inurl:cpanel OR inurl:dashboard OR inurl:panel`, "Control panel pages"},
			{"phpMyAdmin", `site:{domain} inurl:phpmyadmin`, "phpMyAdmin database interface"},
			{"WordPress Admin", `site:{domain} inurl:wp-login.php`, "WordPress login page"},
		},
	},
	{
		"Credentials & Secrets",
		"🔑",
		[]dorkTemplate{
			{"Passwords in Pages", `site:{domain} intext:password OR intext:passwd filetype:txt`, "Text files containing passwords"},
			{"API Keys", `site:{domain} intext:"api_key" OR intext:"api_secret" OR intext:"access_token"`, "Exposed API credentials"},
			{"Connection Strings", `site:{domain} intext:"connectionstring" OR intext:"mongodb://" OR intext:"mysql://"`, "Database connection strings"},
			{"AWS Keys", `site:{domain} intext:"AKIA" intext:"aws_secret"`, "Amazon AWS credentials"},
			{"Private Keys", `site:{domain} intext:"BEGIN RSA PRIVATE KEY" OR intext:"BEGIN OPENSSH PRIVATE KEY"`, "Exposed private key files"},
		},
	},
	{
		"Error Messages",
		"⚠️",
		[]dorkTemplate{
			{"PHP Errors", `site:{domain} "PHP Parse error" OR "PHP Fatal error" OR "Warning: mysql"`, "PHP error messages revealing code"},
			{"ASP Errors", `site:{domain} "Microsoft OLE DB" OR "ASP.NET" "Exception Details"`, "ASP.NET error details"},
			{"Stack Traces", `site:{domain} intext:"stack trace" OR intext:"Traceback (most recent"`, "Application stack traces"},
			{"SQL Errors", `site:{domain} intext:"mysql_fetch" OR intext:"sql syntax"`, "SQL error messages"},
			{"Debug Pages", `site:{domain} inurl:debug OR inurl:test OR inurl:dev intext:"debug"`, "Debug/test pages"},
		},
	},
	{
		"Exposed Directories",
		"📂",
		[]dorkTemplate{
			{"Index Of", `site:{domain} "Index of /" intitle:"Index of"`, "Open directory listings"},
			{"Uploads Folder", `site:{domain} intitle:"Index of" "/uploads" OR "/files" OR "/images"`, "Exposed upload directories"},
			{"Backup Directories", `site:{domain} intitle:"Index of" "/backup" OR "/bak"`, "Backup directories"},
			{"Git Exposed", `site:{domain} inurl:.git/config OR inurl:.git/HEAD`, "Exposed Git repositories"},
			{"SVN Exposed", `site:{domain} inurl:.svn/entries`, "Exposed SVN repositories"},
		},
	},
	{
		"Subdomains & Infrastructure",
		"🌐",
		[]dorkTemplate{
			{"Dev/Staging Sites", `site:{domain} inurl:dev OR inurl:staging OR inurl:test OR inurl:beta`, "Development and staging environments"},
			{"Internal Tools", `site:{domain} inurl:internal OR inurl:intranet OR inurl:corp`, "Internal company tools"},
			{"API Endpoints", `site:{domain} inurl:api OR inurl:swagger OR inurl:graphql`, "API documentation and endpoints"},
			{"Subdomains", `site:*.{domain}`, "All indexed subdomains"},
			{"Old Subdomains", `site:{domain} inurl:old OR inurl:legacy OR inurl:archive`, "Archived or legacy pages"},
		},
	},
	{
		"Cameras & IoT",
		"📷",
		[]dorkTemplate{
			{"IP Cameras", `site:{domain} inurl:view.shtml OR inurl:ViewerFrame?Mode=`, "Exposed IP cameras"},
			{"CCTV", `site:{domain} intitle:"Network Camera" OR intitle:"webcam"`, "Network-connected cameras"},
			{"IoT Devices", `site:{domain} intitle:"Router" OR intitle:"Cisco" inurl:login`, "Exposed IoT and router pages"},
			{"Printers", `site:{domain} intitle:"HP LaserJet" OR intitle:"RICOH"`, "Network-connected printers"},
		},
	},
	{
		"People & Employees",
		"👥",
		[]dorkTemplate{
			{"Employee Names", `site:{domain} intext:"@{domain}" filetype:pdf OR filetype:doc`, "Documents with employee email addresses"},
			{"Staff Directory", `site:{domain} inurl:staff OR inurl:team OR inurl:employees`, "Staff/team pages"},
			{"Email Addresses", `site:{domain} intext:"@{domain}"`, "Pages with company email addresses"},
			{"LinkedIn Employees", `site:linkedin.com "{domain}"`, "LinkedIn profiles mentioning the company"},
			{"Resume/CV", `site:{domain} filetype:pdf intext:"resume" OR intext:"curriculum vitae"`, "Resumes posted on site"},
		},
	},
	{
		"Sensitive Info",
		"🔍",
		[]dorkTemplate{
			{"SSN/Credit Cards", `site:{domain} intext:"ssn" OR intext:"social security" filetype:txt`, "Documents with sensitive personal data"},
			{"Medical Records", `site:{domain} intext:"patient" OR intext:"medical record" filetype:pdf`, "Medical documents"},
			{"Financial Docs", `site:{domain} intext:"invoice" OR intext:"credit card" filetype:pdf`, "Financial documents"},
			{"Legal Docs", `site:{domain} intext:"confidential" OR intext:"attorney" filetype:pdf`, "Legal and confidential documents"},
		},
	},
	{
		"Cloud Storage",
		"☁️",
		[]dorkTemplate{
			{"S3 Buckets", `site:s3.amazonaws.com "{domain}"`, "Amazon S3 bucket files mentioning the domain"},
			{"GCS Buckets", `site:storage.googleapis.com "{domain}"`, "Google Cloud Storage files"},
			{"Azure Blobs", `site:blob.core.windows.net "{domain}"`, "Azure Blob Storage files"},
			{"Pastebin Leaks", `site:pastebin.com "{domain}"`, "Pastebin mentions of the domain"},
			{"GitHub Leaks", `site:github.com "{domain}" password OR secret OR key`, "GitHub code mentioning the domain"},
		},
	},
	{
		"Technology Stack",
		"⚙️",
		[]dorkTemplate{
			{"WordPress", `site:{domain} inurl:wp-content OR inurl:wp-includes`, "WordPress installation files"},
			{"Joomla", `site:{domain} inurl:index.php?option=com_`, "Joomla component pages"},
			{"Drupal", `site:{domain} inurl:node OR inurl:sites/all`, "Drupal installation pages"},
			{"Laravel", `site:{domain} intext:"Whoops!" OR intext:"laravel" "debug"`, "Laravel debug pages"},
			{"Django", `site:{domain} intext:"Django" "OperationalError"`, "Django error pages"},
		},
	},
	{
		"Cached & Archived",
		"📦",
		[]dorkTemplate{
			{"Google Cache", `cache:{domain}`, "Google's cached version of the site"},
			{"Wayback Machine", `web.archive.org/web/*/{domain}`, "All archived versions"},
			{"Cached Docs", `cache:{domain} filetype:pdf`, "Cached PDF documents"},
			{"Old Content", `site:{domain} before:2020`, "Content indexed before 2020"},
			{"Recent Content", `site:{domain} after:2024`, "Recently indexed content"},
		},
	},
}

// GenerateDorks generates all Google dork queries for a given domain.
func GenerateDorks(domain string) *DorkResult {
	result := &DorkResult{Domain: domain}
	total := 0

	for _, cat := range dorkCategories {
		group := DorkGroup{
			Category: cat.category,
			Icon:     cat.icon,
		}
		for _, t := range cat.templates {
			query := replaceDomain(t.query, domain)
			searchURL := fmt.Sprintf("https://www.google.com/search?q=%s", url.QueryEscape(query))
			group.Dorks = append(group.Dorks, DorkEntry{
				Title:       t.title,
				Query:       query,
				SearchURL:   searchURL,
				Description: t.description,
			})
			total++
		}
		result.Groups = append(result.Groups, group)
	}

	result.Total = total
	return result
}

func replaceDomain(template, domain string) string {
	result := template
	for i := 0; i < len(result); i++ {
		result = replaceFirst(result, "{domain}", domain)
	}
	return result
}

func replaceFirst(s, old, new string) string {
	idx := 0
	for {
		found := false
		for j := idx; j <= len(s)-len(old); j++ {
			if s[j:j+len(old)] == old {
				s = s[:j] + new + s[j+len(old):]
				idx = j + len(new)
				found = true
				break
			}
		}
		if !found {
			break
		}
	}
	return s
}
