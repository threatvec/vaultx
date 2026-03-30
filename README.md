# VAULTX
### One tool. Zero blind spots.
> by threatvec & talkdedsec

![Platform: Windows/Linux/macOS](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-blue?style=flat-square) ![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-brightgreen?style=flat-square) ![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

---

## What is VaultX?
VaultX is a native desktop cybersecurity toolkit built for security professionals, researchers, journalists, and power users. It combines 40+ OSINT, network analysis, threat intelligence, and security tools in a single, fast, offline-capable application.

Built with Go + React (Wails v2). No browser required. No cloud dependency. Your data stays on your machine.

---

## Features

### 🌐 Domain & Web
- **ShadowScan** — Complete attack surface scan (subdomains + ports + CVE + PDF)
- **URL Scanner** — Phishing/malware detection, redirect chain analysis
- **WHOIS Lookup** — Domain registration, owner, dates
- **DNS Analyzer** — A/MX/NS/TXT/CNAME/SOA records
- **SSL Inspector** — Certificate analysis, security score, expiry
- **HTTP Headers** — CSP/HSTS/X-Frame security analysis
- **Web Fingerprint** — CMS/framework/CDN/analytics detection
- **Phishing Detector** — Typosquatting, lookalike domain detection

### 🛡️ Cyber Threat
- **NightWatch** — 24/7 breach monitoring daemon
- **IP Reputation** — Blacklist/abuse/botnet check
- **CVE Search** — Vulnerability database, CVSS scores
- **Threat Feed** — AbuseIPDB + AlienVault OTX live feed

### 🌍 Network & IP
- **IP Intelligence** — Location/ISP/ASN/VPN/Tor/proxy detection
- **IP Geolocation Map** — Visual map location
- **Port Scanner** — Async fast port + service detection
- **Network Tools** — Ping/traceroute/DNS resolution
- **My IP Info** — Your IP + DNS leak + WebRTC
- **BGP Lookup** — BGP/ASN/prefix info

### 📁 File & Analysis
- **Metadata Extractor** — PDF/Word/Excel/image metadata
- **Image EXIF** — GPS/camera/date/device data
- **Hash Lookup** — MD5/SHA → VirusTotal malware check
- **Hash Generator** — MD5/SHA1/SHA256/SHA512
- **QR Analyzer** — QR → URL extract → security check
- **Document Analyzer** — Hidden text/macros/tracking pixels

### 👤 Identity & OSINT
- **Username Search** — Search across 100+ platforms
- **Email Breach** — HaveIBeenPwned check
- **Phone Lookup** — Country/operator/spam check
- **Wayback Viewer** — Historical site archives
- **Google Dorks** — Automated dork query generator
- **OSINT Dashboard** — Everything about a target in one place

### 🔐 Password & Security
- **Password Analyzer** — Strength/crack time/breach check
- **Password Generator** — Customizable strong passwords
- **Email Header** — SPF/DKIM/DMARC/phishing detection
- **2FA Generator** — TOTP code (Google Auth compatible)
- **Encoder/Decoder** — Base64/URL/HTML/Hex/Binary
- **Paste Monitor** — Pastebin/Ghostbin leak monitoring

### 🤖 AI Tools
- **AI Assistant** — Natural language security questions
- **AI Risk Analysis** — AI-powered scan result analysis
- **AI Report** — Weekly security report generation

---

## Installation

### Download (Recommended)
1. Go to [Releases](https://github.com/threatvec/vaultx/releases)
2. Download the binary for your platform
3. Run it — no installation needed

### Build from Source
```bash
# Prerequisites: Go 1.22+, Node.js 18+, Wails v2
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Clone and build
git clone https://github.com/threatvec/vaultx
cd vaultx
wails build
```

---

## API Keys (Optional)

VaultX works without any API keys for most features. For enhanced functionality:

| Service | Used By | Free? | Get Key |
|---------|---------|-------|---------|
| AbuseIPDB | IP Reputation, NightWatch | ✅ Free | [abuseipdb.com](https://www.abuseipdb.com/account/plans) |
| AlienVault OTX | Threat Feed | ✅ Free | [otx.alienvault.com](https://otx.alienvault.com/api) |
| HaveIBeenPwned | Email Breach, NightWatch | 💰 $3.50/mo | [haveibeenpwned.com](https://haveibeenpwned.com/API/Key) |
| VirusTotal | Hash Lookup, URL Scanner | ✅ Free | [virustotal.com](https://www.virustotal.com/gui/my-apikey) |

---

## AI Support

VaultX supports both local and cloud AI:

- **Ollama (Local)** — 100% offline, install [ollama.ai](https://ollama.ai) and run `ollama pull llama3.2`
- **OpenAI GPT-4o** — Enter your API key in Settings
- **Anthropic Claude** — Enter your API key in Settings
- **Google Gemini** — Enter your API key in Settings

---

## Screenshots

> Screenshots will be added upon first public release.

---

## License

Copyright © 2026 threatvec & talkdedsec. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or modification is prohibited.

---

## Made with ❤️ by threatvec & talkdedsec
