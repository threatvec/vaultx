export namespace ai {
	
	export class OllamaModelInfo {
	    name: string;
	    size: string;
	
	    static createFrom(source: any = {}) {
	        return new OllamaModelInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.size = source["size"];
	    }
	}
	export class ProviderStatus {
	    provider: string;
	    available: boolean;
	    model: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.provider = source["provider"];
	        this.available = source["available"];
	        this.model = source["model"];
	        this.error = source["error"];
	    }
	}

}

export namespace auth {
	
	export class DKIMResult {
	    present: boolean;
	    pass: boolean;
	    result: string;
	    domain: string;
	    selector: string;
	
	    static createFrom(source: any = {}) {
	        return new DKIMResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.present = source["present"];
	        this.pass = source["pass"];
	        this.result = source["result"];
	        this.domain = source["domain"];
	        this.selector = source["selector"];
	    }
	}
	export class DMARCResult {
	    present: boolean;
	    pass: boolean;
	    policy: string;
	    result: string;
	
	    static createFrom(source: any = {}) {
	        return new DMARCResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.present = source["present"];
	        this.pass = source["pass"];
	        this.policy = source["policy"];
	        this.result = source["result"];
	    }
	}
	export class HopInfo {
	    from: string;
	    by: string;
	    ip: string;
	    timestamp: string;
	    delay: string;
	    is_public: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HopInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.from = source["from"];
	        this.by = source["by"];
	        this.ip = source["ip"];
	        this.timestamp = source["timestamp"];
	        this.delay = source["delay"];
	        this.is_public = source["is_public"];
	    }
	}
	export class SPFResult {
	    present: boolean;
	    pass: boolean;
	    result: string;
	    domain: string;
	
	    static createFrom(source: any = {}) {
	        return new SPFResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.present = source["present"];
	        this.pass = source["pass"];
	        this.result = source["result"];
	        this.domain = source["domain"];
	    }
	}
	export class EmailHeaderResult {
	    from: string;
	    to: string;
	    subject: string;
	    date: string;
	    message_id: string;
	    spf: SPFResult;
	    dkim: DKIMResult;
	    dmarc: DMARCResult;
	    ip_chain: HopInfo[];
	    phish_score: number;
	    phish_reasons: string[];
	    raw_headers: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new EmailHeaderResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.from = source["from"];
	        this.to = source["to"];
	        this.subject = source["subject"];
	        this.date = source["date"];
	        this.message_id = source["message_id"];
	        this.spf = this.convertValues(source["spf"], SPFResult);
	        this.dkim = this.convertValues(source["dkim"], DKIMResult);
	        this.dmarc = this.convertValues(source["dmarc"], DMARCResult);
	        this.ip_chain = this.convertValues(source["ip_chain"], HopInfo);
	        this.phish_score = source["phish_score"];
	        this.phish_reasons = source["phish_reasons"];
	        this.raw_headers = source["raw_headers"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EncoderResult {
	    input: string;
	    format: string;
	    mode: string;
	    output: string;
	    error?: string;
	    all_formats?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new EncoderResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.input = source["input"];
	        this.format = source["format"];
	        this.mode = source["mode"];
	        this.output = source["output"];
	        this.error = source["error"];
	        this.all_formats = source["all_formats"];
	    }
	}
	export class GeneratedPassword {
	    password: string;
	    strength: string;
	    score: number;
	    entropy: number;
	
	    static createFrom(source: any = {}) {
	        return new GeneratedPassword(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.password = source["password"];
	        this.strength = source["strength"];
	        this.score = source["score"];
	        this.entropy = source["entropy"];
	    }
	}
	export class GeneratorOptions {
	    length: number;
	    use_lower: boolean;
	    use_upper: boolean;
	    use_digits: boolean;
	    use_symbols: boolean;
	    use_space: boolean;
	    memorable: boolean;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new GeneratorOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.length = source["length"];
	        this.use_lower = source["use_lower"];
	        this.use_upper = source["use_upper"];
	        this.use_digits = source["use_digits"];
	        this.use_symbols = source["use_symbols"];
	        this.use_space = source["use_space"];
	        this.memorable = source["memorable"];
	        this.count = source["count"];
	    }
	}
	
	export class PasswordAnalysisResult {
	    password: string;
	    strength: string;
	    score: number;
	    entropy: number;
	    crack_time: string;
	    crack_time_offline: string;
	    length: number;
	    has_upper: boolean;
	    has_lower: boolean;
	    has_digit: boolean;
	    has_symbol: boolean;
	    has_space: boolean;
	    unique_chars: number;
	    charset_size: number;
	    breach_count: number;
	    is_breached: boolean;
	    suggestions: string[];
	    patterns: string[];
	
	    static createFrom(source: any = {}) {
	        return new PasswordAnalysisResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.password = source["password"];
	        this.strength = source["strength"];
	        this.score = source["score"];
	        this.entropy = source["entropy"];
	        this.crack_time = source["crack_time"];
	        this.crack_time_offline = source["crack_time_offline"];
	        this.length = source["length"];
	        this.has_upper = source["has_upper"];
	        this.has_lower = source["has_lower"];
	        this.has_digit = source["has_digit"];
	        this.has_symbol = source["has_symbol"];
	        this.has_space = source["has_space"];
	        this.unique_chars = source["unique_chars"];
	        this.charset_size = source["charset_size"];
	        this.breach_count = source["breach_count"];
	        this.is_breached = source["is_breached"];
	        this.suggestions = source["suggestions"];
	        this.patterns = source["patterns"];
	    }
	}
	export class PasteResult {
	    title: string;
	    url: string;
	    date: string;
	    snippet: string;
	    match_type: string;
	
	    static createFrom(source: any = {}) {
	        return new PasteResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.url = source["url"];
	        this.date = source["date"];
	        this.snippet = source["snippet"];
	        this.match_type = source["match_type"];
	    }
	}
	export class PasteMonitorResult {
	    target: string;
	    found: boolean;
	    count: number;
	    pastes: PasteResult[];
	    error?: string;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new PasteMonitorResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.found = source["found"];
	        this.count = source["count"];
	        this.pastes = this.convertValues(source["pastes"], PasteResult);
	        this.error = source["error"];
	        this.source = source["source"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class TOTPCode {
	    code: string;
	    remaining: number;
	    timestamp: number;
	    valid: boolean;
	
	    static createFrom(source: any = {}) {
	        return new TOTPCode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.code = source["code"];
	        this.remaining = source["remaining"];
	        this.timestamp = source["timestamp"];
	        this.valid = source["valid"];
	    }
	}
	export class TOTPSecret {
	    secret: string;
	    account_name: string;
	    issuer: string;
	    url: string;
	    qr_code_b64: string;
	
	    static createFrom(source: any = {}) {
	        return new TOTPSecret(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.secret = source["secret"];
	        this.account_name = source["account_name"];
	        this.issuer = source["issuer"];
	        this.url = source["url"];
	        this.qr_code_b64 = source["qr_code_b64"];
	    }
	}

}

export namespace db {
	
	export class Badge {
	    ID: number;
	    Name: string;
	    Description: string;
	    Icon: string;
	    // Go type: time
	    EarnedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Badge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.Icon = source["Icon"];
	        this.EarnedAt = this.convertValues(source["EarnedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QueryHistory {
	    ID: number;
	    Tool: string;
	    Query: string;
	    Result: string;
	    // Go type: time
	    CreatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new QueryHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Tool = source["Tool"];
	        this.Query = source["Query"];
	        this.Result = source["Result"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace domain {
	
	export class DNSRecord {
	    type: string;
	    value: string;
	    ttl?: number;
	
	    static createFrom(source: any = {}) {
	        return new DNSRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.value = source["value"];
	        this.ttl = source["ttl"];
	    }
	}
	export class DNSResult {
	    domain: string;
	    a: DNSRecord[];
	    aaaa: DNSRecord[];
	    mx: DNSRecord[];
	    ns: DNSRecord[];
	    txt: DNSRecord[];
	    cname: DNSRecord[];
	    spf: string;
	    dmarc: string;
	    has_dkim: boolean;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new DNSResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.a = this.convertValues(source["a"], DNSRecord);
	        this.aaaa = this.convertValues(source["aaaa"], DNSRecord);
	        this.mx = this.convertValues(source["mx"], DNSRecord);
	        this.ns = this.convertValues(source["ns"], DNSRecord);
	        this.txt = this.convertValues(source["txt"], DNSRecord);
	        this.cname = this.convertValues(source["cname"], DNSRecord);
	        this.spf = source["spf"];
	        this.dmarc = source["dmarc"];
	        this.has_dkim = source["has_dkim"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DomainVariant {
	    domain: string;
	    type: string;
	    active: boolean;
	    ip?: string;
	
	    static createFrom(source: any = {}) {
	        return new DomainVariant(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.type = source["type"];
	        this.active = source["active"];
	        this.ip = source["ip"];
	    }
	}
	export class DorkCategory {
	    name: string;
	    dorks: string[];
	
	    static createFrom(source: any = {}) {
	        return new DorkCategory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.dorks = source["dorks"];
	    }
	}
	export class FingerprintResult {
	    url: string;
	    server: string;
	    powered_by: string;
	    cms: string[];
	    framework: string[];
	    cdn: string[];
	    analytics: string[];
	    javascript: string[];
	    headers: Record<string, string>;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new FingerprintResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.server = source["server"];
	        this.powered_by = source["powered_by"];
	        this.cms = source["cms"];
	        this.framework = source["framework"];
	        this.cdn = source["cdn"];
	        this.analytics = source["analytics"];
	        this.javascript = source["javascript"];
	        this.headers = source["headers"];
	        this.error = source["error"];
	    }
	}
	export class PhishingResult {
	    domain: string;
	    variants: DomainVariant[];
	    active_count: number;
	    risk_score: number;
	    is_punycode: boolean;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new PhishingResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.variants = this.convertValues(source["variants"], DomainVariant);
	        this.active_count = source["active_count"];
	        this.risk_score = source["risk_score"];
	        this.is_punycode = source["is_punycode"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PortResult {
	    port: number;
	    open: boolean;
	    service: string;
	    banner?: string;
	
	    static createFrom(source: any = {}) {
	        return new PortResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.port = source["port"];
	        this.open = source["open"];
	        this.service = source["service"];
	        this.banner = source["banner"];
	    }
	}
	export class SSLResult {
	    domain: string;
	    valid: boolean;
	    subject: string;
	    issuer: string;
	    // Go type: time
	    not_before: any;
	    // Go type: time
	    not_after: any;
	    days_until_expiry: number;
	    expiry_warning: boolean;
	    sans: string[];
	    protocol: string;
	    cipher_suite: string;
	    security_score: number;
	    issues: string[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new SSLResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.valid = source["valid"];
	        this.subject = source["subject"];
	        this.issuer = source["issuer"];
	        this.not_before = this.convertValues(source["not_before"], null);
	        this.not_after = this.convertValues(source["not_after"], null);
	        this.days_until_expiry = source["days_until_expiry"];
	        this.expiry_warning = source["expiry_warning"];
	        this.sans = source["sans"];
	        this.protocol = source["protocol"];
	        this.cipher_suite = source["cipher_suite"];
	        this.security_score = source["security_score"];
	        this.issues = source["issues"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScanConfig {
	    target: string;
	    subdomains: boolean;
	    ports: boolean;
	    dns: boolean;
	    ssl: boolean;
	    dorks: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ScanConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.subdomains = source["subdomains"];
	        this.ports = source["ports"];
	        this.dns = source["dns"];
	        this.ssl = source["ssl"];
	        this.dorks = source["dorks"];
	    }
	}
	export class SubdomainResult {
	    subdomain: string;
	    ips: string[];
	
	    static createFrom(source: any = {}) {
	        return new SubdomainResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.subdomain = source["subdomain"];
	        this.ips = source["ips"];
	    }
	}
	export class ShadowScanResult {
	    target: string;
	    // Go type: time
	    started_at: any;
	    // Go type: time
	    finished_at: any;
	    risk_score: number;
	    subdomains?: SubdomainResult[];
	    ports?: PortResult[];
	    dns?: DNSResult;
	    ssl?: SSLResult;
	    dorks?: DorkCategory[];
	
	    static createFrom(source: any = {}) {
	        return new ShadowScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.started_at = this.convertValues(source["started_at"], null);
	        this.finished_at = this.convertValues(source["finished_at"], null);
	        this.risk_score = source["risk_score"];
	        this.subdomains = this.convertValues(source["subdomains"], SubdomainResult);
	        this.ports = this.convertValues(source["ports"], PortResult);
	        this.dns = this.convertValues(source["dns"], DNSResult);
	        this.ssl = this.convertValues(source["ssl"], SSLResult);
	        this.dorks = this.convertValues(source["dorks"], DorkCategory);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class URLScanResult {
	    url: string;
	    final_url: string;
	    redirect_chain: string[];
	    status_code: number;
	    content_type: string;
	    security_headers: Record<string, string>;
	    vt_malicious: number;
	    vt_suspicious: number;
	    vt_total: number;
	    vt_permalink: string;
	    is_safe: boolean;
	    risk_score: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new URLScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.final_url = source["final_url"];
	        this.redirect_chain = source["redirect_chain"];
	        this.status_code = source["status_code"];
	        this.content_type = source["content_type"];
	        this.security_headers = source["security_headers"];
	        this.vt_malicious = source["vt_malicious"];
	        this.vt_suspicious = source["vt_suspicious"];
	        this.vt_total = source["vt_total"];
	        this.vt_permalink = source["vt_permalink"];
	        this.is_safe = source["is_safe"];
	        this.risk_score = source["risk_score"];
	        this.error = source["error"];
	    }
	}
	export class WHOISResult {
	    domain: string;
	    registrar: string;
	    created_date: string;
	    updated_date: string;
	    expiry_date: string;
	    status: string[];
	    nameservers: string[];
	    raw_text: string;
	    days_until_expiry: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new WHOISResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.registrar = source["registrar"];
	        this.created_date = source["created_date"];
	        this.updated_date = source["updated_date"];
	        this.expiry_date = source["expiry_date"];
	        this.status = source["status"];
	        this.nameservers = source["nameservers"];
	        this.raw_text = source["raw_text"];
	        this.days_until_expiry = source["days_until_expiry"];
	        this.error = source["error"];
	    }
	}

}

export namespace files {
	
	export class CompareResult {
	    hash_a: string;
	    hash_b: string;
	    match: boolean;
	    type_a: string;
	    type_b: string;
	
	    static createFrom(source: any = {}) {
	        return new CompareResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash_a = source["hash_a"];
	        this.hash_b = source["hash_b"];
	        this.match = source["match"];
	        this.type_a = source["type_a"];
	        this.type_b = source["type_b"];
	    }
	}
	export class RevisionEntry {
	    author: string;
	    timestamp: string;
	    action: string;
	
	    static createFrom(source: any = {}) {
	        return new RevisionEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.author = source["author"];
	        this.timestamp = source["timestamp"];
	        this.action = source["action"];
	    }
	}
	export class EmbeddedURL {
	    url: string;
	    context: string;
	    is_suspicious: boolean;
	
	    static createFrom(source: any = {}) {
	        return new EmbeddedURL(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.context = source["context"];
	        this.is_suspicious = source["is_suspicious"];
	    }
	}
	export class DocumentAnalysisResult {
	    file_name: string;
	    file_type: string;
	    has_macros: boolean;
	    has_hidden_text: boolean;
	    has_tracking_pixel: boolean;
	    has_embedded_urls: boolean;
	    embedded_urls: EmbeddedURL[];
	    hidden_texts: string[];
	    macro_indicators: string[];
	    revisions: RevisionEntry[];
	    risk_score: number;
	    risk_level: string;
	    warnings: string[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new DocumentAnalysisResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.file_name = source["file_name"];
	        this.file_type = source["file_type"];
	        this.has_macros = source["has_macros"];
	        this.has_hidden_text = source["has_hidden_text"];
	        this.has_tracking_pixel = source["has_tracking_pixel"];
	        this.has_embedded_urls = source["has_embedded_urls"];
	        this.embedded_urls = this.convertValues(source["embedded_urls"], EmbeddedURL);
	        this.hidden_texts = source["hidden_texts"];
	        this.macro_indicators = source["macro_indicators"];
	        this.revisions = this.convertValues(source["revisions"], RevisionEntry);
	        this.risk_score = source["risk_score"];
	        this.risk_level = source["risk_level"];
	        this.warnings = source["warnings"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MetaField {
	    label: string;
	    value: string;
	    risk?: string;
	
	    static createFrom(source: any = {}) {
	        return new MetaField(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.label = source["label"];
	        this.value = source["value"];
	        this.risk = source["risk"];
	    }
	}
	export class EXIFResult {
	    file_name: string;
	    fields: MetaField[];
	    has_gps: boolean;
	    gps_lat: number;
	    gps_lon: number;
	    gps_alt?: number;
	    make: string;
	    model: string;
	    date_time: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new EXIFResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.file_name = source["file_name"];
	        this.fields = this.convertValues(source["fields"], MetaField);
	        this.has_gps = source["has_gps"];
	        this.gps_lat = source["gps_lat"];
	        this.gps_lon = source["gps_lon"];
	        this.gps_alt = source["gps_alt"];
	        this.make = source["make"];
	        this.model = source["model"];
	        this.date_time = source["date_time"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class EngineResult {
	    engine: string;
	    category: string;
	    result: string;
	
	    static createFrom(source: any = {}) {
	        return new EngineResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.engine = source["engine"];
	        this.category = source["category"];
	        this.result = source["result"];
	    }
	}
	export class HashLookupResult {
	    hash: string;
	    hash_type: string;
	    found: boolean;
	    malicious: number;
	    suspicious: number;
	    undetected: number;
	    total_engines: number;
	    malware_family: string;
	    threat_label: string;
	    file_type: string;
	    file_name: string;
	    file_size: number;
	    engines: EngineResult[];
	    tags: string[];
	    first_seen: string;
	    last_seen: string;
	    permalink: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new HashLookupResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.hash_type = source["hash_type"];
	        this.found = source["found"];
	        this.malicious = source["malicious"];
	        this.suspicious = source["suspicious"];
	        this.undetected = source["undetected"];
	        this.total_engines = source["total_engines"];
	        this.malware_family = source["malware_family"];
	        this.threat_label = source["threat_label"];
	        this.file_type = source["file_type"];
	        this.file_name = source["file_name"];
	        this.file_size = source["file_size"];
	        this.engines = this.convertValues(source["engines"], EngineResult);
	        this.tags = source["tags"];
	        this.first_seen = source["first_seen"];
	        this.last_seen = source["last_seen"];
	        this.permalink = source["permalink"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HashSet {
	    md5: string;
	    sha1: string;
	    sha256: string;
	    sha512: string;
	    source: string;
	    name?: string;
	    size?: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new HashSet(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.md5 = source["md5"];
	        this.sha1 = source["sha1"];
	        this.sha256 = source["sha256"];
	        this.sha512 = source["sha512"];
	        this.source = source["source"];
	        this.name = source["name"];
	        this.size = source["size"];
	        this.error = source["error"];
	    }
	}
	
	export class MetadataResult {
	    file_name: string;
	    file_size: number;
	    file_type: string;
	    mime_type: string;
	    fields: Record<string, string>;
	    raw_fields: MetaField[];
	    has_gps: boolean;
	    gps_lat: number;
	    gps_lon: number;
	    warnings: string[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new MetadataResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.file_name = source["file_name"];
	        this.file_size = source["file_size"];
	        this.file_type = source["file_type"];
	        this.mime_type = source["mime_type"];
	        this.fields = source["fields"];
	        this.raw_fields = this.convertValues(source["raw_fields"], MetaField);
	        this.has_gps = source["has_gps"];
	        this.gps_lat = source["gps_lat"];
	        this.gps_lon = source["gps_lon"];
	        this.warnings = source["warnings"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QRResult {
	    file_path: string;
	    content: string;
	    content_type: string;
	    is_url: boolean;
	    url?: string;
	    url_safe: boolean;
	    is_suspicious: boolean;
	    warnings: string[];
	    preview: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new QRResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.file_path = source["file_path"];
	        this.content = source["content"];
	        this.content_type = source["content_type"];
	        this.is_url = source["is_url"];
	        this.url = source["url"];
	        this.url_safe = source["url_safe"];
	        this.is_suspicious = source["is_suspicious"];
	        this.warnings = source["warnings"];
	        this.preview = source["preview"];
	        this.error = source["error"];
	    }
	}

}

export namespace identity {
	
	export class BreachEntry {
	    name: string;
	    title: string;
	    domain: string;
	    breach_date: string;
	    added_date: string;
	    description: string;
	    data_classes: string[];
	    pwn_count: number;
	    is_verified: boolean;
	    is_sensitive: boolean;
	    logo_path: string;
	
	    static createFrom(source: any = {}) {
	        return new BreachEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.title = source["title"];
	        this.domain = source["domain"];
	        this.breach_date = source["breach_date"];
	        this.added_date = source["added_date"];
	        this.description = source["description"];
	        this.data_classes = source["data_classes"];
	        this.pwn_count = source["pwn_count"];
	        this.is_verified = source["is_verified"];
	        this.is_sensitive = source["is_sensitive"];
	        this.logo_path = source["logo_path"];
	    }
	}
	export class DorkEntry {
	    title: string;
	    query: string;
	    search_url: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new DorkEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.query = source["query"];
	        this.search_url = source["search_url"];
	        this.description = source["description"];
	    }
	}
	export class DorkGroup {
	    category: string;
	    icon: string;
	    dorks: DorkEntry[];
	
	    static createFrom(source: any = {}) {
	        return new DorkGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.category = source["category"];
	        this.icon = source["icon"];
	        this.dorks = this.convertValues(source["dorks"], DorkEntry);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DorkResult {
	    domain: string;
	    groups: DorkGroup[];
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new DorkResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.groups = this.convertValues(source["groups"], DorkGroup);
	        this.total = source["total"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EmailBreachResult {
	    email: string;
	    found: boolean;
	    breach_count: number;
	    breaches: BreachEntry[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new EmailBreachResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.email = source["email"];
	        this.found = source["found"];
	        this.breach_count = source["breach_count"];
	        this.breaches = this.convertValues(source["breaches"], BreachEntry);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class YearSummary {
	    year: number;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new YearSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.year = source["year"];
	        this.count = source["count"];
	    }
	}
	export class SnapshotEntry {
	    timestamp: string;
	    url: string;
	    status_code: string;
	    mime_type: string;
	    archive_url: string;
	    year: number;
	
	    static createFrom(source: any = {}) {
	        return new SnapshotEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.url = source["url"];
	        this.status_code = source["status_code"];
	        this.mime_type = source["mime_type"];
	        this.archive_url = source["archive_url"];
	        this.year = source["year"];
	    }
	}
	export class WaybackResult {
	    domain: string;
	    total: number;
	    first_seen: string;
	    last_seen: string;
	    snapshots: SnapshotEntry[];
	    year_summary: YearSummary[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new WaybackResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.total = source["total"];
	        this.first_seen = source["first_seen"];
	        this.last_seen = source["last_seen"];
	        this.snapshots = this.convertValues(source["snapshots"], SnapshotEntry);
	        this.year_summary = this.convertValues(source["year_summary"], YearSummary);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PlatformResult {
	    platform: string;
	    url: string;
	    found: boolean;
	    category: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new PlatformResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.platform = source["platform"];
	        this.url = source["url"];
	        this.found = source["found"];
	        this.category = source["category"];
	        this.error = source["error"];
	    }
	}
	export class UsernameSearchResult {
	    username: string;
	    found: PlatformResult[];
	    not_found: PlatformResult[];
	    total: number;
	    found_count: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new UsernameSearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.found = this.convertValues(source["found"], PlatformResult);
	        this.not_found = this.convertValues(source["not_found"], PlatformResult);
	        this.total = source["total"];
	        this.found_count = source["found_count"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class OSINTModuleStatus {
	    name: string;
	    status: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new OSINTModuleStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.status = source["status"];
	        this.message = source["message"];
	    }
	}
	export class OSINTDashboardResult {
	    target: string;
	    target_type: string;
	    modules: OSINTModuleStatus[];
	    username?: UsernameSearchResult;
	    email_breach?: EmailBreachResult;
	    wayback?: WaybackResult;
	    dorks?: DorkResult;
	    risk_score: number;
	    risk_level: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new OSINTDashboardResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.target_type = source["target_type"];
	        this.modules = this.convertValues(source["modules"], OSINTModuleStatus);
	        this.username = this.convertValues(source["username"], UsernameSearchResult);
	        this.email_breach = this.convertValues(source["email_breach"], EmailBreachResult);
	        this.wayback = this.convertValues(source["wayback"], WaybackResult);
	        this.dorks = this.convertValues(source["dorks"], DorkResult);
	        this.risk_score = source["risk_score"];
	        this.risk_level = source["risk_level"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class PhoneLookupResult {
	    number: string;
	    valid: boolean;
	    local_format: string;
	    international_format: string;
	    country_name: string;
	    country_code: string;
	    location: string;
	    carrier: string;
	    line_type: string;
	    is_suspicious: boolean;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new PhoneLookupResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.number = source["number"];
	        this.valid = source["valid"];
	        this.local_format = source["local_format"];
	        this.international_format = source["international_format"];
	        this.country_name = source["country_name"];
	        this.country_code = source["country_code"];
	        this.location = source["location"];
	        this.carrier = source["carrier"];
	        this.line_type = source["line_type"];
	        this.is_suspicious = source["is_suspicious"];
	        this.error = source["error"];
	    }
	}
	
	
	
	

}

export namespace network {
	
	export class BGPPeer {
	    asn: string;
	    name: string;
	    country: string;
	
	    static createFrom(source: any = {}) {
	        return new BGPPeer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.asn = source["asn"];
	        this.name = source["name"];
	        this.country = source["country"];
	    }
	}
	export class BGPResult {
	    query: string;
	    asn: string;
	    as_name: string;
	    as_description: string;
	    country: string;
	    prefixes: string[];
	    prefix_count: number;
	    ipv6_prefixes: string[];
	    peers: BGPPeer[];
	    allocated: string;
	    registry: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new BGPResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.asn = source["asn"];
	        this.as_name = source["as_name"];
	        this.as_description = source["as_description"];
	        this.country = source["country"];
	        this.prefixes = source["prefixes"];
	        this.prefix_count = source["prefix_count"];
	        this.ipv6_prefixes = source["ipv6_prefixes"];
	        this.peers = this.convertValues(source["peers"], BGPPeer);
	        this.allocated = source["allocated"];
	        this.registry = source["registry"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DNSLeakServer {
	    ip: string;
	    country: string;
	    country_code: string;
	    isp: string;
	    is_same_isp: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DNSLeakServer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.country = source["country"];
	        this.country_code = source["country_code"];
	        this.isp = source["isp"];
	        this.is_same_isp = source["is_same_isp"];
	    }
	}
	export class DNSLookupResult {
	    query: string;
	    ips: string[];
	    hostname?: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new DNSLookupResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.ips = source["ips"];
	        this.hostname = source["hostname"];
	        this.error = source["error"];
	    }
	}
	export class GeoPoint {
	    ip: string;
	    lat: number;
	    lon: number;
	    city: string;
	    country: string;
	    country_code: string;
	    isp: string;
	    as: string;
	    is_proxy: boolean;
	    is_hosting: boolean;
	    is_tor: boolean;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new GeoPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.lat = source["lat"];
	        this.lon = source["lon"];
	        this.city = source["city"];
	        this.country = source["country"];
	        this.country_code = source["country_code"];
	        this.isp = source["isp"];
	        this.as = source["as"];
	        this.is_proxy = source["is_proxy"];
	        this.is_hosting = source["is_hosting"];
	        this.is_tor = source["is_tor"];
	        this.error = source["error"];
	    }
	}
	export class GeoMapResult {
	    points: GeoPoint[];
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new GeoMapResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.points = this.convertValues(source["points"], GeoPoint);
	        this.total = source["total"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class IPIntelResult {
	    ip: string;
	    country: string;
	    country_code: string;
	    region: string;
	    region_name: string;
	    city: string;
	    zip: string;
	    lat: number;
	    lon: number;
	    timezone: string;
	    isp: string;
	    org: string;
	    as: string;
	    as_name: string;
	    is_proxy: boolean;
	    is_hosting: boolean;
	    is_tor: boolean;
	    mobile: boolean;
	    query: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new IPIntelResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.country = source["country"];
	        this.country_code = source["country_code"];
	        this.region = source["region"];
	        this.region_name = source["region_name"];
	        this.city = source["city"];
	        this.zip = source["zip"];
	        this.lat = source["lat"];
	        this.lon = source["lon"];
	        this.timezone = source["timezone"];
	        this.isp = source["isp"];
	        this.org = source["org"];
	        this.as = source["as"];
	        this.as_name = source["as_name"];
	        this.is_proxy = source["is_proxy"];
	        this.is_hosting = source["is_hosting"];
	        this.is_tor = source["is_tor"];
	        this.mobile = source["mobile"];
	        this.query = source["query"];
	        this.error = source["error"];
	    }
	}
	export class MyIPResult {
	    public_ip: string;
	    country: string;
	    country_code: string;
	    city: string;
	    isp: string;
	    org: string;
	    as: string;
	    timezone: string;
	    is_vpn: boolean;
	    is_proxy: boolean;
	    is_tor: boolean;
	    dns_leaks: DNSLeakServer[];
	    has_dns_leak: boolean;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new MyIPResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.public_ip = source["public_ip"];
	        this.country = source["country"];
	        this.country_code = source["country_code"];
	        this.city = source["city"];
	        this.isp = source["isp"];
	        this.org = source["org"];
	        this.as = source["as"];
	        this.timezone = source["timezone"];
	        this.is_vpn = source["is_vpn"];
	        this.is_proxy = source["is_proxy"];
	        this.is_tor = source["is_tor"];
	        this.dns_leaks = this.convertValues(source["dns_leaks"], DNSLeakServer);
	        this.has_dns_leak = source["has_dns_leak"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PingResult {
	    host: string;
	    ip: string;
	    sent: number;
	    received: number;
	    packet_loss: number;
	    min_rtt: number;
	    max_rtt: number;
	    avg_rtt: number;
	    rtts: string[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new PingResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.ip = source["ip"];
	        this.sent = source["sent"];
	        this.received = source["received"];
	        this.packet_loss = source["packet_loss"];
	        this.min_rtt = source["min_rtt"];
	        this.max_rtt = source["max_rtt"];
	        this.avg_rtt = source["avg_rtt"];
	        this.rtts = source["rtts"];
	        this.error = source["error"];
	    }
	}
	export class PortResult {
	    port: number;
	    state: string;
	    service: string;
	    banner?: string;
	
	    static createFrom(source: any = {}) {
	        return new PortResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.port = source["port"];
	        this.state = source["state"];
	        this.service = source["service"];
	        this.banner = source["banner"];
	    }
	}
	export class PortScanResult {
	    target: string;
	    open_ports: PortResult[];
	    total: number;
	    scanned: number;
	    // Go type: time
	    start_time: any;
	    // Go type: time
	    end_time: any;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new PortScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.open_ports = this.convertValues(source["open_ports"], PortResult);
	        this.total = source["total"];
	        this.scanned = source["scanned"];
	        this.start_time = this.convertValues(source["start_time"], null);
	        this.end_time = this.convertValues(source["end_time"], null);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReverseDNSResult {
	    ip: string;
	    hostnames: string[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new ReverseDNSResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.hostnames = source["hostnames"];
	        this.error = source["error"];
	    }
	}
	export class TracerouteHop {
	    ttl: number;
	    ip: string;
	    hostname: string;
	    rtt: string;
	    country_code: string;
	    city: string;
	
	    static createFrom(source: any = {}) {
	        return new TracerouteHop(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ttl = source["ttl"];
	        this.ip = source["ip"];
	        this.hostname = source["hostname"];
	        this.rtt = source["rtt"];
	        this.country_code = source["country_code"];
	        this.city = source["city"];
	    }
	}
	export class TracerouteResult {
	    target: string;
	    hops: TracerouteHop[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new TracerouteResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.hops = this.convertValues(source["hops"], TracerouteHop);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace projects {
	
	export class Project {
	    id: number;
	    name: string;
	    description: string;
	    color: string;
	    targets: string[];
	    scan_count: number;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.color = source["color"];
	        this.targets = source["targets"];
	        this.scan_count = source["scan_count"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace scanner {
	
	export class SelfScanResult {
	    public_ip: string;
	    isp: string;
	    country: string;
	    city: string;
	    is_vpn: boolean;
	    is_tor: boolean;
	    is_proxy: boolean;
	    dns_leak: string[];
	    webrtc_leak: string[];
	    open_ports: number[];
	    security_score: number;
	    issues: string[];
	    suggestions: string[];
	    scan_duration: string;
	
	    static createFrom(source: any = {}) {
	        return new SelfScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.public_ip = source["public_ip"];
	        this.isp = source["isp"];
	        this.country = source["country"];
	        this.city = source["city"];
	        this.is_vpn = source["is_vpn"];
	        this.is_tor = source["is_tor"];
	        this.is_proxy = source["is_proxy"];
	        this.dns_leak = source["dns_leak"];
	        this.webrtc_leak = source["webrtc_leak"];
	        this.open_ports = source["open_ports"];
	        this.security_score = source["security_score"];
	        this.issues = source["issues"];
	        this.suggestions = source["suggestions"];
	        this.scan_duration = source["scan_duration"];
	    }
	}

}

export namespace scheduler {
	
	export class ScheduledTask {
	    id: number;
	    name: string;
	    tool: string;
	    target: string;
	    schedule: string;
	    custom_cron?: string;
	    enabled: boolean;
	    // Go type: time
	    last_run?: any;
	    // Go type: time
	    next_run?: any;
	    last_result?: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new ScheduledTask(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.tool = source["tool"];
	        this.target = source["target"];
	        this.schedule = source["schedule"];
	        this.custom_cron = source["custom_cron"];
	        this.enabled = source["enabled"];
	        this.last_run = this.convertValues(source["last_run"], null);
	        this.next_run = this.convertValues(source["next_run"], null);
	        this.last_result = source["last_result"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace threat {
	
	export class CVEResult {
	    cve_id: string;
	    description: string;
	    cvss_v3_score: number;
	    cvss_v3_vector: string;
	    severity: string;
	    published: string;
	    modified: string;
	    references: string[];
	    cpes: string[];
	    has_exploit: boolean;
	    exploit_url?: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new CVEResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cve_id = source["cve_id"];
	        this.description = source["description"];
	        this.cvss_v3_score = source["cvss_v3_score"];
	        this.cvss_v3_vector = source["cvss_v3_vector"];
	        this.severity = source["severity"];
	        this.published = source["published"];
	        this.modified = source["modified"];
	        this.references = source["references"];
	        this.cpes = source["cpes"];
	        this.has_exploit = source["has_exploit"];
	        this.exploit_url = source["exploit_url"];
	        this.error = source["error"];
	    }
	}
	export class CVESearchResult {
	    query: string;
	    total: number;
	    results: CVEResult[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new CVESearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.total = source["total"];
	        this.results = this.convertValues(source["results"], CVEResult);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FeedEntry {
	    ip: string;
	    domain?: string;
	    category: string;
	    confidence: number;
	    country: string;
	    country_code: string;
	    source: string;
	    // Go type: time
	    timestamp: any;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new FeedEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.domain = source["domain"];
	        this.category = source["category"];
	        this.confidence = source["confidence"];
	        this.country = source["country"];
	        this.country_code = source["country_code"];
	        this.source = source["source"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.description = source["description"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class IPReputationResult {
	    ip: string;
	    abuse_score: number;
	    total_reports: number;
	    country_code: string;
	    country: string;
	    isp: string;
	    domain: string;
	    is_vpn: boolean;
	    is_proxy: boolean;
	    is_tor: boolean;
	    is_botnet: boolean;
	    is_datacenter: boolean;
	    usage_type: string;
	    blacklists: string[];
	    last_reported_at: string;
	    risk_score: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new IPReputationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.abuse_score = source["abuse_score"];
	        this.total_reports = source["total_reports"];
	        this.country_code = source["country_code"];
	        this.country = source["country"];
	        this.isp = source["isp"];
	        this.domain = source["domain"];
	        this.is_vpn = source["is_vpn"];
	        this.is_proxy = source["is_proxy"];
	        this.is_tor = source["is_tor"];
	        this.is_botnet = source["is_botnet"];
	        this.is_datacenter = source["is_datacenter"];
	        this.usage_type = source["usage_type"];
	        this.blacklists = source["blacklists"];
	        this.last_reported_at = source["last_reported_at"];
	        this.risk_score = source["risk_score"];
	        this.error = source["error"];
	    }
	}
	export class PasteEntry {
	    url: string;
	    source: string;
	    title: string;
	    content: string;
	    match: string;
	    // Go type: time
	    found_at: any;
	
	    static createFrom(source: any = {}) {
	        return new PasteEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.source = source["source"];
	        this.title = source["title"];
	        this.content = source["content"];
	        this.match = source["match"];
	        this.found_at = this.convertValues(source["found_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PasteMonitorResult {
	    query: string;
	    found: PasteEntry[];
	    total: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new PasteMonitorResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.found = this.convertValues(source["found"], PasteEntry);
	        this.total = source["total"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ThreatFeedResult {
	    entries: FeedEntry[];
	    total: number;
	    // Go type: time
	    updated_at: any;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new ThreatFeedResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.entries = this.convertValues(source["entries"], FeedEntry);
	        this.total = source["total"];
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WatchTarget {
	    id: number;
	    type: string;
	    value: string;
	    // Go type: time
	    added_at: any;
	    // Go type: time
	    last_check: any;
	    risk_score: number;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new WatchTarget(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.value = source["value"];
	        this.added_at = this.convertValues(source["added_at"], null);
	        this.last_check = this.convertValues(source["last_check"], null);
	        this.risk_score = source["risk_score"];
	        this.enabled = source["enabled"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

