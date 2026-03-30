import type { ToolContent } from "./guideTools";

const en: Record<string, ToolContent> = {
  "shadow-scan": {
    tagline: "Discover your target's entire digital surface in one scan",
    description: "Automates the reconnaissance process security professionals do manually for hours, completing it in minutes. Collects subdomains, open ports, DNS records, SSL certificates, and known vulnerabilities into a single report.",
    useCases: [
      "I want to learn what my company's internet-facing surface looks like",
      "I'm evaluating the security posture of a website",
      "I'm doing reconnaissance for a bug bounty program",
    ],
    steps: [
      "Enter the target domain name",
      "Select the scanning modules you want (subdomain, port, CVE...)",
      "Click Scan and wait for results",
      "Review results and download as a PDF report",
    ],
    faq: [
      { q: "Can I use it on sites I don't own?", a: "Only scan systems you have permission for. Unauthorized scanning may be illegal." },
      { q: "How long does port scanning take?", a: "Average 2-5 minutes for the top 1000 ports." },
    ],
    tips: [
      "Run in Plan mode first to preview what data will be returned, then do a full scan.",
      "The PDF report can be presented directly to clients or team members.",
      "Send scan results to AI Risk Analysis to get a prioritized action list.",
    ],
  },
  "url-scanner": {
    tagline: "Safely check suspicious links before clicking",
    description: "Find out within seconds whether a link you copied or received is actually safe, a phishing site, or distributing malware. Full analysis is done without you having to click.",
    useCases: [
      "There's a suspicious link in an email and I want to check if it's safe",
      "I want to verify the safety of a link shared on social media",
      "I want to know if a payment link from a customer is legitimate",
    ],
    steps: [
      "Paste the URL into the input box",
      "Click Scan",
      "Check the result card — safe / risky / dangerous",
      "If safe, you can proceed to the link",
    ],
    faq: [
      { q: "Should I scan every URL?", a: "Always scan URLs from unknown or unexpected sources." },
    ],
    tips: [
      "If the clipboard monitor is enabled (Settings → Clipboard Monitor), you'll get an automatic notification when copying a URL.",
      "Run shortened links (bit.ly, tinyurl) through here first — they might redirect to a dangerous destination.",
    ],
  },
  "whois-lookup": {
    tagline: "Who owns this domain, when was it registered, when does it expire?",
    description: "Find the real owner, registration date, expiration date, and registrar of any domain name. Fake sites are usually newly registered — you'll know immediately.",
    useCases: [
      "I'm wondering if this site is trustworthy and how long it's been around",
      "I'm investigating a fake website and want to see registration details",
      "I want to check the history and past owners before buying a domain",
    ],
    steps: [
      "Enter the domain name (e.g.: example.com)",
      "Click Query",
      "Review registration date, expiration date, and owner",
    ],
    faq: [
      { q: "Why are registration details private?", a: "Many registrars offer a WHOIS Privacy service. In this case, the real owner information is hidden." },
    ],
    tips: [
      "Be cautious if a domain was registered less than 30 days ago — it might be a phishing site.",
      "Risk increases if the registrar appears to be a suspicious or cheap registration company.",
    ],
  },
  "dns-analyzer": {
    tagline: "See all DNS records of a domain on one screen",
    description: "Analyzes all DNS record types including A, MX, NS, TXT, CNAME, and SOA. Checks whether SPF and DMARC settings are correctly configured.",
    useCases: [
      "I want to verify that my email security settings (SPF/DMARC) are correctly set up",
      "I'm inspecting my DNS configuration for troubleshooting",
      "I want to understand the entire service structure of a domain",
    ],
    steps: [
      "Enter the domain name",
      "All DNS record types are automatically queried",
      "Filter and inspect the record type you want",
    ],
    faq: [
      { q: "What is an SPF record?", a: "SPF specifies which servers can send email on behalf of that domain. Without proper setup, you're vulnerable to email spoofing." },
    ],
    tips: [
      "From MX records, you can tell which email service a company uses (Google, Microsoft, Proton).",
      "Domain verification tokens and Google Search Console entries may appear in TXT records.",
    ],
  },
  "ssl-inspector": {
    tagline: "Is the certificate secure? When does it expire?",
    description: "Analyzes SSL/TLS certificate details, security level, and expiration date of a website. Warns if the certificate has less than 30 days remaining.",
    useCases: [
      "I want to track when my own site's SSL certificate expires",
      "I want to verify that the connection to a site I'm visiting is genuinely secure",
    ],
    steps: [
      "Enter the domain name (without https://)",
      "Click Query",
      "Certificate details, expiration date, and security score are shown",
    ],
    faq: [
      { q: "What does SSL A+ mean?", a: "It represents the highest security configuration according to SSL Labs standards." },
    ],
    tips: [
      "Let's Encrypt certificates are valid for 90 days — keep auto-renewal active.",
      "Sites using TLS 1.0 and 1.1 have security vulnerabilities; TLS 1.2+ is required.",
    ],
  },
  "http-headers": {
    tagline: "Are your site's security headers properly configured?",
    description: "Checks critical HTTP security headers like CSP, HSTS, and X-Frame-Options. Missing headers can lead to serious security vulnerabilities.",
    useCases: [
      "I want to identify missing security headers on my site",
      "I want to validate my header configuration before a security audit",
    ],
    steps: [
      "Enter the URL",
      "All HTTP response headers are analyzed",
      "Missing or misconfigured headers are highlighted",
      "Apply the suggested values",
    ],
    faq: [
      { q: "Why is Content-Security-Policy important?", a: "CSP prevents XSS attacks on your site. It's the most critical security header." },
      { q: "What is HSTS?", a: "HTTP Strict Transport Security — tells the browser the site should always be opened with HTTPS." },
    ],
    tips: [
      "Optimize until SecurityHeaders.com gives you an A+ rating.",
      "X-Frame-Options DENY protects against clickjacking attacks.",
    ],
  },
  "web-fingerprint": {
    tagline: "What technologies is this site running on?",
    description: "Detects the CMS (WordPress, Drupal...), framework, CDN, analytics tools, and server software used by a website.",
    useCases: [
      "I want to understand what technology my competitor uses",
      "I want to check if this site is running an outdated WordPress version",
    ],
    steps: [
      "Enter the domain name",
      "Click Scan",
      "View the detected CMS, framework, CDN, and analytics tools",
    ],
    faq: [
      { q: "What should I do if WordPress is detected?", a: "Check if the version is up to date. If not, search for known CVEs using CVE Search." },
    ],
    tips: [
      "A powerful tool for competitor analysis — find out what hosting, CDN, and third-party services they use.",
      "Old plugin/theme versions are the biggest WordPress attack vector.",
    ],
  },
  "phishing-detector": {
    tagline: "Is this domain a copycat site?",
    description: "Analyzes the similarity of the domain you enter to known brands. Detects typosquatting (misspelled domains) and visually similar domains.",
    useCases: [
      "I want to check if paypal-secure.com is the real PayPal",
      "I want to find out if a fake site similar to my brand has been set up",
    ],
    steps: [
      "Enter the suspicious domain name",
      "Click Analyze",
      "Similarity score, detected brand, and phishing indicators are displayed",
    ],
    faq: [
      { q: "What should I do if my score is high?", a: "Don't visit the site. Always type the official site address yourself or open it from bookmarks." },
    ],
    tips: [
      "Domains written with Unicode characters (homograph attack) can't be distinguished by eye — this tool detects them.",
      "Add suspicious domains you find to your NightWatch monitoring list.",
    ],
  },
  "night-watch": {
    tagline: "Watching over you while you sleep — 24/7 breach monitoring",
    description: "Continuously checks in the background whether your email address, domain, or username appears in any data breach. Sends a Discord or system notification when a new breach is found.",
    useCases: [
      "I want to be notified immediately if my email address appears in a data breach",
      "I want to continuously monitor my company's domain",
      "I want to track multiple email addresses from one place",
    ],
    steps: [
      "Add the email, domain, or username you want to monitor",
      "Choose your notification method (Discord webhook or system notification)",
      "Activate NightWatch",
      "It runs in the background — you don't need to keep the app open",
    ],
    faq: [
      { q: "How many targets can I monitor?", a: "As many as you want — there's no limit." },
      { q: "What should I do when a breach is found?", a: "Change your password immediately, set up 2FA on the breached service, and change it anywhere else you've used that password." },
    ],
    tips: [
      "For corporate domains, you can set up automatic Discord notifications to the IT team.",
      "Check the breach date — old breaches are already in known databases; new breaches are more critical.",
    ],
  },
  "ip-reputation": {
    tagline: "Is this IP address safe or dangerous?",
    description: "Shows whether an IP address is on blacklists, whether it's a botnet member, whether it's a VPN/proxy/Tor exit node, and its abuse score.",
    useCases: [
      "I want to check a suspicious IP hitting my site",
      "I want to see if the source IP of an email I received is trustworthy",
    ],
    steps: [
      "Enter the IP address",
      "Click Query",
      "Review reputation score, blacklist status, and detected activities",
    ],
    faq: [
      { q: "When is an abuse score considered dangerous?", a: "Above 25 is suspicious; above 75 is considered high risk." },
    ],
    tips: [
      "Check the IP here before writing firewall rules.",
      "The clipboard monitor can offer an automatic query option when you copy an IP.",
    ],
  },
  "cve-search": {
    tagline: "Are there known vulnerabilities in the software you use?",
    description: "Search the NVD (National Vulnerability Database) by software name or CVE ID. Shows CVSS score, description, affected versions, and available patches.",
    useCases: [
      "I'm researching whether there's a known vulnerability in my Apache version",
      "I want to understand if CVE-2024-XXXXX affects me",
    ],
    steps: [
      "Search by software name or CVE ID",
      "View CVSS score and severity level",
      "Check the affected version range",
      "Apply the available patch or workaround",
    ],
    faq: [
      { q: "What does CVSS 9+ mean?", a: "Critical level — patch immediately. Remotely exploitable with high impact potential." },
    ],
    tips: [
      "List the software versions on your servers and regularly search for CVEs.",
      "Also check the EPSS (Exploit Prediction Scoring) score — if there's an active exploit, it's more urgent.",
    ],
  },
  "ip-intelligence": {
    tagline: "Where is this IP, who does it belong to, what is it doing?",
    description: "Shows detailed geographic location, internet service provider, autonomous system number, and whether a VPN/proxy/Tor is being used for an IP address.",
    useCases: [
      "I want to see where the IP attacking me is located",
      "I want to verify that incoming traffic is really from the country it claims to be from",
    ],
    steps: [
      "Enter the IP address",
      "Click Query",
      "Review location, ISP, ASN, and risk indicators",
    ],
    faq: [
      { q: "What does this tool show when I use a VPN?", a: "It shows the VPN server's IP and location, not your real location." },
    ],
    tips: [
      "If the clipboard monitor is on, a query option pops up immediately when you copy an IP.",
      "Use the IP Geolocation Map tool to analyze multiple IPs at once.",
    ],
  },
  "ip-geolocation": {
    tagline: "Visualize IP locations on an interactive map",
    description: "Marks the locations of multiple IP addresses on a world map. Analyze large IP lists with cluster view and detailed info bubbles.",
    useCases: [
      "I want to see the geographic distribution of IPs from log files on a map",
      "I want to visualize which countries my users come from",
    ],
    steps: [
      "Enter or paste IP addresses (comma-separated or line by line)",
      "Click Map",
      "See locations on the interactive map; click markers for details",
    ],
    faq: [],
    tips: [
      "For bulk analysis, you can paste an IP list from a CSV file.",
      "Zoom in on cluster view to inspect individual IPs.",
    ],
  },
  "port-scanner": {
    tagline: "Which ports are open on the target, which services are running?",
    description: "Performs async port scanning on a target IP or domain to detect open ports and running services. An essential tool for security assessment.",
    useCases: [
      "I want to check if my server has ports exposed to the internet that shouldn't be",
      "I'm discovering services on a target system during a pentest",
    ],
    steps: [
      "Enter the target IP or hostname",
      "Set the port range (e.g.: 1-1000) or select common ports",
      "Click Scan",
      "Open ports and detected services are listed",
    ],
    faq: [
      { q: "Can I do unauthorized port scanning?", a: "Absolutely not. Only scan your own systems or systems you have written permission for." },
    ],
    tips: [
      "If ports 22 (SSH), 3389 (RDP), or 5900 (VNC) are open to the internet, add firewall rules immediately.",
      "Do banner grabbing to get service versions and search them in CVE Search.",
    ],
  },
  "network-tools": {
    tagline: "Ping, traceroute, DNS — all network tools in one place",
    description: "Use basic network diagnostic tools like ping, traceroute, forward DNS, and reverse DNS from a single interface. Quickly diagnose connectivity issues.",
    useCases: [
      "I'm using traceroute to find out why I can't reach a server",
      "I'm testing whether DNS resolution is working correctly",
    ],
    steps: [
      "Select the tool you want to use (Ping, Traceroute, DNS...)",
      "Enter the target IP or domain",
      "Click Run and review the results",
    ],
    faq: [],
    tips: [
      "With traceroute, you can see where packets are dropped and which routers they pass through.",
      "With reverse DNS, you can look up the hostname of an IP address.",
    ],
  },
  "my-ip-info": {
    tagline: "How do you appear on the internet? Is data leaking?",
    description: "Checks your own public IP address, DNS leaks, and WebRTC leaks. If you're using a VPN, you'll know if your real IP is leaking.",
    useCases: [
      "I'm using a VPN — I want to check if my real IP is leaking",
      "I want to test if my DNS queries are really going through the VPN",
      "I'm curious about how I appear on the internet",
    ],
    steps: [
      "Open the page — your information is automatically gathered",
      "Public IP, DNS server, and WebRTC leak status are shown",
      "If using a VPN, compare results with VPN on and off",
    ],
    faq: [
      { q: "What is a WebRTC leak?", a: "The browser's WebRTC feature can expose your real IP even with a VPN active." },
    ],
    tips: [
      "Come here with VPN on and check whether your real IP is visible.",
      "If there's a DNS leak, consider switching VPN providers or enabling DNS-over-HTTPS.",
    ],
  },
  "bgp-lookup": {
    tagline: "ASN details, prefix announcements, and BGP routing",
    description: "Shows BGP routing information, prefix announcements, and autonomous system details for an IP address or ASN.",
    useCases: [
      "I want to see which ASN a specific IP belongs to and its routing information",
      "I'm researching a network's upstream connections",
    ],
    steps: [
      "Enter an IP address or ASN number",
      "Review BGP routing data and the prefix list",
    ],
    faq: [],
    tips: [
      "Perform regular routing checks to detect BGP hijacking attacks.",
    ],
  },
  "metadata-extractor": {
    tagline: "What's hidden in the file? Find concealed data",
    description: "Extracts hidden metadata from PDF, Word, Excel, or image files. Shows who created the file, on which computer, when, and GPS location if available.",
    useCases: [
      "I want to find the real author or organization behind an anonymously sent document",
      "I want to clean my personal information from a document before sharing it",
      "I want to find out where a photo was actually taken",
    ],
    steps: [
      "Drop or select the file in the drag-and-drop area",
      "Analysis starts automatically",
      "Review author, creation date, software, and location information",
      "Download the cleaned version if needed",
    ],
    faq: [
      { q: "Which file formats are supported?", a: "PDF, DOCX, XLSX, PPTX, JPEG, PNG, and other common formats." },
    ],
    tips: [
      "Clean metadata before sharing documents — you may not want to leak author name or company name.",
      "For journalists: anonymously leaked documents often contain identity information in metadata.",
    ],
  },
  "image-exif": {
    tagline: "Where was this photo taken? What camera was used?",
    description: "Reads EXIF data from photos. Shows GPS coordinates, camera model, lens, ISO settings, and shooting date and time. If location is available, marks it on a map.",
    useCases: [
      "I want to verify whether a photo was actually taken at the claimed location",
      "I want to check if my own photos contain location data",
    ],
    steps: [
      "Select or drag-and-drop the image file",
      "EXIF data is automatically read",
      "If GPS is available, the location is shown on a map",
    ],
    faq: [
      { q: "Do all photos have GPS data?", a: "No. Some platforms (Instagram, Twitter) and some cameras delete or never record GPS data." },
    ],
    tips: [
      "Clean EXIF data before uploading to social media — your private location could be exposed.",
      "WhatsApp images are compressed and most EXIF data is removed.",
    ],
  },
  "hash-lookup": {
    tagline: "Is this file malicious? Check with VirusTotal",
    description: "Calculates a file's hash value and queries it against 70+ antivirus engines on VirusTotal. You'll instantly know if it's malware or clean.",
    useCases: [
      "I want to verify that a file I downloaded is safe",
      "I want to check a suspicious .exe file before running it",
    ],
    steps: [
      "Enter the hash value or select a file (hash is calculated automatically)",
      "Click Query",
      "Review 70+ antivirus results and the detector list",
    ],
    faq: [
      { q: "If no antivirus detects it, is it safe?", a: "Most likely yes, but not 100% guaranteed. New malware may not be detected initially." },
    ],
    tips: [
      "Send only the hash instead of uploading the file — it's more privacy-friendly.",
      "Use SHA256 — MD5 and SHA1 are more prone to collisions.",
    ],
  },
  "hash-generator": {
    tagline: "Generate MD5, SHA256, SHA512 hash values instantly",
    description: "Instantly generates MD5, SHA1, SHA256, and SHA512 hash values for text or files. Used for file integrity verification and data identification.",
    useCases: [
      "I want to verify a downloaded file's authenticity by comparing hashes",
      "I need to generate a hash value for password storage",
    ],
    steps: [
      "Enter text or select a file",
      "Select the desired hash algorithm",
      "Copy and use the hash value",
    ],
    faq: [],
    tips: [
      "Compare SHA256 hashes to prove two files are identical.",
      "MD5 is no longer recommended for cryptographic security — use it only for checksums.",
    ],
  },
  "qr-analyzer": {
    tagline: "See the content of a QR code before scanning",
    description: "Upload a QR code image — it extracts the URL or text inside. If it's a URL, it automatically sends it for a security check. Protection against QR phishing attacks.",
    useCases: [
      "I don't know where this QR code actually redirects to",
      "I want to check if a QR code I saw at a restaurant or on a poster is safe",
    ],
    steps: [
      "Upload the QR code image",
      "Content is automatically decoded",
      "If it contains a URL, a security check is performed",
    ],
    faq: [
      { q: "What is QR phishing?", a: "Malicious URLs hidden inside QR codes. It's important to see the content before scanning." },
    ],
    tips: [
      "Be careful with QR codes in public places — a fake sticker may have been placed over the original.",
    ],
  },
  "document-analyzer": {
    tagline: "Does the document contain hidden content, macros, or malicious objects?",
    description: "Detects hidden text, macros, tracking pixels, and embedded objects in document files. Analyze malicious Word or PDF files without opening them.",
    useCases: [
      "I want to check if a suspicious Word file contains macros",
      "I want to see if a PDF contains hidden JavaScript or embedded objects",
    ],
    steps: [
      "Select the document file",
      "Analysis begins",
      "Macros, embedded objects, and suspicious content are listed",
    ],
    faq: [],
    tips: [
      "Analyze Word (.docx/.doc) files from unknown sources before opening them.",
      "Documents with macros are the most common corporate malware distribution vector.",
    ],
  },
  "username-search": {
    tagline: "Who is this username across 100+ platforms?",
    description: "Searches the username you enter simultaneously on GitHub, Twitter, Reddit, Instagram, TikTok, and 100+ other platforms. Maps a person's digital footprint.",
    useCases: [
      "I'm researching which platforms a person has accounts on",
      "I want to check if my own username is being used on other platforms",
    ],
    steps: [
      "Enter the username",
      "Click Search",
      "Found profiles are listed with platform icons",
      "Click profile links to verify",
    ],
    faq: [
      { q: "Is this tool legal?", a: "It collects publicly available information. Use within ethical and legal boundaries. Using it for harassment or stalking is prohibited." },
    ],
    tips: [
      "Try different variations: username, user_name, username123, etc.",
      "Combine with OSINT Dashboard, Email Breach, and Wayback Viewer to build a comprehensive profile.",
    ],
  },
  "email-breach": {
    tagline: "Is your email address in a data breach?",
    description: "Queries the email address in the HaveIBeenPwned database. Shows which services were breached, when, and what type of data was leaked.",
    useCases: [
      "I want to find out if my email address is in any data breach",
      "I want to know which platform's password I should change",
    ],
    steps: [
      "Enter the email address",
      "Click Query",
      "If a breach record exists, which services, when, and what type of data was leaked is shown",
    ],
    faq: [
      { q: "Is my email safe?", a: "If no breach appears, it hasn't shown up in known breaches so far. Monitor for future breaches with NightWatch." },
    ],
    tips: [
      "Check all email addresses regularly — work, personal, and old addresses.",
      "If a breach appears, change your password on that platform immediately and add 2FA.",
    ],
  },
  "phone-lookup": {
    tagline: "Where is this phone number from, which carrier?",
    description: "Validates phone numbers and shows country, carrier, and line type (mobile, landline, VoIP) information.",
    useCases: [
      "I want to find out which country and carrier an unknown number is from",
      "I want to know if it's a fake number (VoIP) or a real line",
    ],
    steps: [
      "Enter the phone number in international format (+1xxxxxxxxxx)",
      "Click Query",
      "View country, carrier, and line type information",
    ],
    faq: [],
    tips: [
      "VoIP numbers (Skype, Google Voice, TextNow) are often used in scams.",
    ],
  },
  "wayback-viewer": {
    tagline: "Go back in time — see old versions of any site",
    description: "Views past versions of a site using the Web.archive.org archive. Inspect deleted content, old page designs, and historical information.",
    useCases: [
      "I want to find a page or statement deleted from a company's site",
      "I'm researching how long this site has existed and how it has changed",
    ],
    steps: [
      "Enter the domain name",
      "Select a date or list all archives",
      "View the old site version",
    ],
    faq: [
      { q: "Is every site in the archive?", a: "No. The Wayback Machine doesn't archive all sites. Sites blocked by robots.txt are not archived." },
    ],
    tips: [
      "A company's old 'about' page may contain activities or personnel information.",
      "Deleted forum posts or blog entries may also be in the archive.",
    ],
  },
  "google-dorks-identity": {
    tagline: "Use Google like a weapon — advanced search queries",
    description: "Automatically generates Google Dork queries in 30+ categories for a target domain. Ready-made queries for exposed files, admin panels, open directories, and sensitive data.",
    useCases: [
      "I want to see how much information about my own site is indexed on Google",
      "I'm doing OSINT research on a target",
    ],
    steps: [
      "Enter the target domain name",
      "Select the categories you want (admin, files, login, backup...)",
      "Run the generated dork queries on Google",
    ],
    faq: [
      { q: "Are these queries legal?", a: "Doing a Google search is legal. You only access publicly indexed information. What matters is how you use what you find." },
    ],
    tips: [
      "Run it against your own company domain to see how much sensitive information appears on Google.",
      "site:example.com filetype:pdf finds documents; inurl:admin finds admin panels.",
    ],
  },
  "osint-dashboard": {
    tagline: "Run all OSINT tools for one target in a single interface",
    description: "Runs Username Search, Email Breach, Wayback Viewer, and Google Dorks simultaneously for a single target. Creates a comprehensive OSINT report.",
    useCases: [
      "I want to prepare a comprehensive OSINT report about a person or domain",
      "I want to build a digital profile for investigative journalism",
    ],
    steps: [
      "Enter the target email, username, or domain",
      "Select the modules you want to run",
      "All results are combined in a single report",
    ],
    faq: [],
    tips: [
      "Do a quick preliminary scan with this tool before starting a deeper investigation.",
    ],
  },
  "password-analyzer": {
    tagline: "How strong is your password? How long would it take to crack?",
    description: "Analyzes password strength, calculates cracking time, and safely checks if it's appeared in previous breaches via HaveIBeenPwned using k-anonymity.",
    useCases: [
      "I want to see how strong my current password is",
      "I want to test the security of a password before using it",
    ],
    steps: [
      "Type the password — live analysis begins",
      "Strength score, cracking time, and suggestions appear",
      "Review the HIBP check result",
    ],
    faq: [
      { q: "Is my password sent to a server?", a: "No. Analysis is completely local. For HIBP checks, only the first 5 characters of the hash are sent (k-anonymity)." },
    ],
    tips: [
      "Use a combination of 12+ characters, uppercase/lowercase letters, numbers, and symbols.",
      "Use a different password for every service — if there's a breach, your other accounts stay safe.",
    ],
  },
  "password-generator": {
    tagline: "Generate uncrackable passwords — fully customizable",
    description: "Generates cryptographically secure random passwords. Create strong passwords in any format with length, character set, and memorable mode options.",
    useCases: [
      "I want to generate a strong password for a new account",
      "I need to generate passwords in bulk (50 at a time)",
    ],
    steps: [
      "Select the length and character set",
      "Click Generate",
      "Copy the password you like",
    ],
    faq: [],
    tips: [
      "Save generated passwords in a password manager (Bitwarden, 1Password).",
      "Memorable mode (words separated by hyphens) generates strong passwords that are easier to remember.",
    ],
  },
  "email-header": {
    tagline: "Did this email really come from that person?",
    description: "Paste the email header — performs SPF, DKIM, and DMARC checks, finds the real source IP, and warns if phishing is suspected.",
    useCases: [
      "I want to verify if an email claiming to be from my bank actually came from them",
      "I want to verify the source of an email allegedly from a company official",
    ],
    steps: [
      "Click 'Show original' or 'View source' in your email client",
      "Copy the entire header text",
      "Paste it here and analyze",
      "Review SPF/DKIM/DMARC results and phishing score",
    ],
    faq: [
      { q: "How do I get the raw email header?", a: "Gmail: three dots → Show original. Outlook: File → Properties. Thunderbird: View → Source." },
    ],
    tips: [
      "If SPF passes, the email address isn't fake — but the content can still be misleading.",
      "Emails with many hops have passed through multiple servers.",
    ],
  },
  "2fa-generator": {
    tagline: "Generate TOTP codes without Google Authenticator",
    description: "Enter a secret key to generate Google Authenticator-compatible 6-digit TOTP codes. Works completely offline — no internet required.",
    useCases: [
      "My phone isn't with me and I need my 2FA code",
      "I need to test TOTP infrastructure",
    ],
    steps: [
      "Enter the secret key or generate a new one",
      "View the QR code and scan it with Google Authenticator",
      "Copy the code that refreshes every 30 seconds",
    ],
    faq: [
      { q: "What is TOTP?", a: "Time-based One-Time Password — changes every 30 seconds." },
    ],
    tips: [
      "Store the secret key in a safe place — if your phone is lost, you can regenerate codes with this key.",
      "Always print backup codes and store them physically.",
    ],
  },
  "encoder-decoder": {
    tagline: "Base64, Hex, URL — convert between all formats",
    description: "Performs instant conversion between 8 different formats including Base64, URL encoding, HTML entities, Hex, Binary, ROT13, and Morse code.",
    useCases: [
      "I need to decode an obfuscated payload",
      "I want to read the payload section of a JWT token",
    ],
    steps: [
      "Select the format type (Base64, Hex, URL...)",
      "Select Encode or Decode mode",
      "Enter the text",
      "Result is displayed instantly",
    ],
    faq: [
      { q: "Is Base64 encryption?", a: "No. Base64 is just encoding, not encryption. It can easily be decoded." },
    ],
    tips: [
      "Use the 'Encode All Formats' button to see the entered text in all formats simultaneously.",
      "You can set the shift value between 0-25 for Caesar cipher.",
    ],
  },
  "ai-assistant": {
    tagline: "Ask like a security expert, get instant answers",
    description: "Ask security questions in natural language using local Ollama or cloud AI (OpenAI/Claude/Gemini). Have AI analyze scan results and get risk assessments.",
    useCases: [
      "I can't understand my ShadowScan results — let AI explain them",
      "Tell me if this IP is dangerous",
      "I want to ask how to improve my security",
    ],
    steps: [
      "Write your question",
      "Press Enter or click Send",
      "Read the AI response",
      "You can ask follow-up questions",
    ],
    faq: [
      { q: "Which AI is used?", a: "If Ollama is installed, free local AI. Otherwise, enter OpenAI/Claude/Gemini API key in Settings to use cloud AI." },
      { q: "Is my data sent to AI?", a: "If using Ollama, no — it's completely local. If using cloud AI, it's sent to the respective provider." },
    ],
    tips: [
      "Paste scan results and ask 'Analyze these results — what should I do?'",
      "Ask specific questions like 'What is CVE-2024-1234?'",
    ],
  },
  "ai-risk-analysis": {
    tagline: "Let AI interpret scan results and tell you what to do",
    description: "Send any scan result to AI — it generates a risk assessment, prioritized action list, and detailed explanations.",
    useCases: [
      "I ran ShadowScan but can't interpret the results",
      "I want to know which findings to focus on first",
    ],
    steps: [
      "Select what you want to analyze from recent scans",
      "Click Analyze",
      "AI creates a risk assessment and action list",
    ],
    faq: [],
    tips: [
      "Select multiple scan results — AI evaluates them together and calculates your overall risk score.",
    ],
  },
  "ai-report": {
    tagline: "Automatically generate your weekly security report",
    description: "Analyzes your scan history to generate a comprehensive weekly security report. In a format ready to present to managers or clients.",
    useCases: [
      "I need to present a weekly security summary to my manager",
      "I want to prepare regular security reports for a client",
    ],
    steps: [
      "Click Generate Report",
      "AI analyzes your scan history",
      "Report is generated in Markdown format",
      "Copy or export as .md",
    ],
    faq: [],
    tips: [
      "Paste the report into a Markdown editor and export as PDF.",
    ],
  },
};

export default en;
