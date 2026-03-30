import type { ToolContent } from "./guideTools";

const tr: Record<string, ToolContent> = {
  "shadow-scan": {
    tagline: "Bir hedefin tüm dijital yüzeyini tek taramada keşfet",
    description: "Güvenlik uzmanlarının saatlerce manuel yaptığı keşif sürecini dakikalar içinde otomatikleştirir. Subdomain'ler, açık portlar, DNS kayıtları, SSL sertifikası ve bilinen güvenlik açıklarını tek raporda toplar.",
    useCases: [
      "Şirketimin internete açık yüzeyini öğrenmek istiyorum",
      "Bir web sitesinin güvenlik durumunu değerlendiriyorum",
      "Bug bounty programı için keşif yapıyorum",
    ],
    steps: [
      "Hedef domain adını gir",
      "Yapmak istediğin tarama modüllerini seç (subdomain, port, CVE...)",
      "Tara butonuna bas ve sonuçları bekle",
      "Sonuçları inceleyip PDF raporu olarak indir",
    ],
    faq: [
      { q: "Kendi sitem dışında kullanabilir miyim?", a: "Sadece izin sahibi olduğun sistemleri tara. İzinsiz tarama yasadışı olabilir." },
      { q: "Port tarama ne kadar sürer?", a: "Top 1000 port için ortalama 2-5 dakika." },
    ],
    tips: [
      "Önce Plan modunda çalıştır, hangi bilgilerin döneceğini gör, sonra tam tarama yap.",
      "PDF raporu müşterilere veya ekip arkadaşlarına doğrudan sunabilirsin.",
      "Tarama sonuçlarını AI Risk Analizi'ne gönder, öncelikli aksiyon listesi al.",
    ],
  },
  "url-scanner": {
    tagline: "Şüpheli linkleri tıklamadan güvenli kontrol et",
    description: "Kopyaladığın veya aldığın bir linkin gerçekten güvenli olup olmadığını, phishing sitesi mi yoksa malware dağıtıyor mu olduğunu saniyeler içinde öğren. Tıklamak zorunda kalmadan tam analiz yapılır.",
    useCases: [
      "E-postada gelen şüpheli bir link var, güvenli mi diye kontrol etmek istiyorum",
      "Sosyal medyada paylaşılan bir linkin güvenliğini doğrulamak istiyorum",
      "Müşterimden gelen ödeme linkinin gerçek olup olmadığını anlamak istiyorum",
    ],
    steps: [
      "URL'yi yapıştırma kutusuna yapıştır",
      "Tara butonuna tıkla",
      "Sonuç kartını incele — güvenli / riskli / tehlikeli",
      "Güvenliyse linke gidebilirsin",
    ],
    faq: [
      { q: "Her URL'yi taramalı mıyım?", a: "Tanımadığın veya beklenmedik kaynaklardan gelen URL'leri mutlaka tara." },
    ],
    tips: [
      "Clipboard izleyici (Ayarlar → Pano İzleyici) açıksa, URL kopyaladığında otomatik bildirim gelir.",
      "Kısaltılmış linkleri (bit.ly, tinyurl) önce buradan geçir — gerçek hedefe yönlendiriyor olabilir.",
    ],
  },
  "whois-lookup": {
    tagline: "Bu domain kimin, ne zaman alınmış, ne zaman sona eriyor?",
    description: "Herhangi bir domain adının gerçek sahibini, kayıt tarihini, son kullanma tarihini ve kayıt şirketini öğren. Sahte siteler genellikle yeni kayıtlıdır — bunu hemen anlarsın.",
    useCases: [
      "Bu site güvenilir mi, ne zamandan beri var diye merak ediyorum",
      "Sahte bir web sitesini araştırıyorum, kayıt bilgilerini görmek istiyorum",
      "Domain almadan önce geçmişini ve geçmiş sahibini kontrol etmek istiyorum",
    ],
    steps: [
      "Domain adını yaz (ör: example.com)",
      "Sorgula butonuna tıkla",
      "Kayıt tarihi, son kullanma tarihi ve sahibi incele",
    ],
    faq: [
      { q: "Kayıt bilgileri neden gizli görünüyor?", a: "Birçok kayıt şirketi WHOIS Privacy hizmeti sunar. Bu durumda gerçek sahip bilgisi gizlenir." },
    ],
    tips: [
      "Domain 30 günden az önce kurulduysa dikkat et — phishing sitesi olabilir.",
      "Registrar bilgisi şüpheli görünen ucuz kayıt şirketlerinden ise risk artar.",
    ],
  },
  "dns-analyzer": {
    tagline: "Domain'in tüm DNS kayıtlarını tek ekranda gör",
    description: "A, MX, NS, TXT, CNAME ve SOA gibi tüm DNS kayıt tiplerini analiz eder. SPF ve DMARC ayarlarının doğru yapılandırılıp yapılandırılmadığını kontrol eder.",
    useCases: [
      "Email güvenlik ayarlarımın (SPF/DMARC) doğru kurulduğunu doğrulamak istiyorum",
      "DNS yapılandırmamı sorun giderme amaçlı inceliyorum",
      "Bir domaine ait tüm alt servis yapısını anlamak istiyorum",
    ],
    steps: [
      "Domain adını gir",
      "Tüm DNS kayıt tipleri otomatik sorgulanır",
      "İstediğin kayıt tipini filtrele ve incele",
    ],
    faq: [
      { q: "SPF kaydı nedir?", a: "SPF, hangi sunucuların o domain adına email gönderebileceğini belirler. Doğru ayarlanmazsa email spoofing'e açık olursun." },
    ],
    tips: [
      "MX kayıtlarından bir şirketin hangi email servisini kullandığını (Google, Microsoft, Proton) anlayabilirsin.",
      "TXT kaydında domain doğrulama jetonları, Google Search Console doğrulaması vs. görünebilir.",
    ],
  },
  "ssl-inspector": {
    tagline: "Sertifika güvenli mi, ne zaman sona eriyor?",
    description: "Web sitesinin SSL/TLS sertifikasının detaylarını, güvenlik seviyesini ve bitiş tarihini analiz eder. Sertifika 30 günden az süre kaldıysa uyarı verir.",
    useCases: [
      "Kendi sitemin SSL sertifikasının ne zaman sona erdiğini takip etmek istiyorum",
      "Ziyaret ettiğim sitenin bağlantısının gerçekten güvenli olup olmadığını doğrulamak istiyorum",
    ],
    steps: [
      "Domain adını yaz (https:// olmadan)",
      "Sorgula butonuna tıkla",
      "Sertifika detayları, bitiş tarihi ve güvenlik skoru gösterilir",
    ],
    faq: [
      { q: "SSL A+ notu ne anlama gelir?", a: "SSL Labs standartlarına göre en yüksek güvenlik konfigürasyonunu ifade eder." },
    ],
    tips: [
      "Let's Encrypt sertifikaları 90 gün geçerlidir, otomatik yenilemeyi aktif tut.",
      "TLS 1.0 ve 1.1 kullanan siteler güvenlik açığı barındırır, TLS 1.2+ kullanmak gerekir.",
    ],
  },
  "http-headers": {
    tagline: "Sitenin güvenlik başlıkları doğru ayarlanmış mı?",
    description: "CSP, HSTS, X-Frame-Options gibi kritik güvenlik HTTP başlıklarını kontrol eder. Eksik başlıklar ciddi güvenlik açıklarına yol açabilir.",
    useCases: [
      "Sitemde eksik güvenlik başlıklarını tespit etmek istiyorum",
      "Güvenlik auditinden önce başlık yapılandırmamı doğrulamak istiyorum",
    ],
    steps: [
      "URL'yi gir",
      "Tüm HTTP response başlıkları analiz edilir",
      "Eksik veya yanlış yapılandırılmış başlıklar vurgulanır",
      "Önerilen değerleri uygula",
    ],
    faq: [
      { q: "Content-Security-Policy neden önemli?", a: "CSP, siteye XSS saldırısı yapılmasını önler. En kritik güvenlik başlığıdır." },
      { q: "HSTS nedir?", a: "HTTP Strict Transport Security — tarayıcıya sitenin her zaman HTTPS ile açılması gerektiğini söyler." },
    ],
    tips: [
      "SecurityHeaders.com notu A+ olana kadar optimize et.",
      "X-Frame-Options DENY ayarı clickjacking saldırılarına karşı korur.",
    ],
  },
  "web-fingerprint": {
    tagline: "Bu site hangi teknolojilerle çalışıyor?",
    description: "Bir web sitesinin kullandığı CMS (WordPress, Drupal...), framework, CDN, analitik araçları ve sunucu yazılımını tespit eder.",
    useCases: [
      "Rakibimin hangi teknolojiyi kullandığını anlamak istiyorum",
      "Bu sitenin güncel olmayan bir WordPress sürümü kullanıp kullanmadığını kontrol etmek istiyorum",
    ],
    steps: [
      "Domain adını gir",
      "Tara butonuna bas",
      "Tespit edilen CMS, framework, CDN ve analitik araçları görüntüle",
    ],
    faq: [
      { q: "WordPress tespit edilirse ne yapmalıyım?", a: "Versiyon güncel mi kontrol et. Güncel değilse bilinen CVE'leri CVE Search ile ara." },
    ],
    tips: [
      "Rakip analizi için çok güçlü bir araç. Hangi hosting, CDN ve third-party servisleri kullandıklarını öğren.",
      "Eski eklenti/tema versiyonları en büyük WordPress saldırı vektörüdür.",
    ],
  },
  "phishing-detector": {
    tagline: "Bu domain bir taklit site mi?",
    description: "Girdiğin domain adının bilinen markalarla benzerliğini analiz eder. Typosquatting (yazım hatası domainleri) ve görsel benzeri domainleri tespit eder.",
    useCases: [
      "paypal-secure.com gerçek PayPal mi diye kontrol etmek istiyorum",
      "Kendi markama benzer sahte site kurulmuş mu bulmak istiyorum",
    ],
    steps: [
      "Şüpheli domain adını gir",
      "Analiz et butonuna bas",
      "Benzerlik skoru, tespit edilen marka ve phishing göstergeleri görüntülenir",
    ],
    faq: [
      { q: "Puanım yüksekse ne yapmalıyım?", a: "Siteyi ziyaret etme. Hizmete ait resmi site adresini her zaman kendin yaz veya yer işaretinden aç." },
    ],
    tips: [
      "Unicode karakterler ile yazılan domainler (homograph attack) gözle ayırt edilemez — bu araç tespit eder.",
      "Şüpheli bulduğun domainleri NightWatch izleme listene ekle.",
    ],
  },
  "night-watch": {
    tagline: "Uyurken bile sizi izliyor — 7/24 breach takibi",
    description: "Email adresin, domain'in veya kullanıcı adın herhangi bir veri sızıntısında geçip geçmediğini arka planda sürekli kontrol eder. Yeni bir sızıntı bulunduğunda Discord veya sistem bildirimi gönderir.",
    useCases: [
      "Email adresim bir veri sızıntısında çıkarsa anında haber almak istiyorum",
      "Şirketimin domain'ini sürekli izlemek istiyorum",
      "Birden fazla email adresimi tek yerden takip etmek istiyorum",
    ],
    steps: [
      "İzlemek istediğin email, domain veya kullanıcı adını ekle",
      "Bildirim yöntemini seç (Discord webhook veya sistem bildirimi)",
      "NightWatch'ı etkinleştir",
      "Arka planda çalışır, uygulamayı kapatman gerekmez",
    ],
    faq: [
      { q: "Kaç hedef izleyebilirim?", a: "İstediğin kadar — herhangi bir sınır yoktur." },
      { q: "Sızıntı bulununca ne yapmalıyım?", a: "Hemen şifreni değiştir, sızıntıdaki serviste 2FA kur ve parolayı başka yerlerde kullanmıyorsan onları da değiştir." },
    ],
    tips: [
      "Kurumsal domainler için IT ekibine gönderilecek otomatik Discord bildirimi kurabilirsin.",
      "Sızıntı tarihine bak — eski sızıntılar zaten bilinen veritabanlarındadır, yeni sızıntılar daha kritiktir.",
    ],
  },
  "ip-reputation": {
    tagline: "Bu IP adresi güvenilir mi yoksa tehlikeli mi?",
    description: "Bir IP adresinin kara listelerde olup olmadığını, botnet üyesi mi olduğunu, VPN/proxy/Tor çıkışı mı olduğunu ve abuse skorunu gösterir.",
    useCases: [
      "Siterime gelen şüpheli IP'yi kontrol etmek istiyorum",
      "Aldığım bir emailin kaynak IP'si güvenilir mi bakmak istiyorum",
    ],
    steps: [
      "IP adresini gir",
      "Sorgula butonuna bas",
      "Reputation skoru, kara liste kontrolü ve tespit edilen faaliyetleri incele",
    ],
    faq: [
      { q: "Abuse skoru kaç olunca tehlikeli sayılır?", a: "25 üzeri şüpheli, 75 üzeri yüksek risk olarak değerlendirilir." },
    ],
    tips: [
      "Firewall kuralı yazmadan önce IP'yi burada kontrol et.",
      "Clipboard izleyici ile IP kopyaladığında otomatik sorgu seçeneği aktif olabilir.",
    ],
  },
  "cve-search": {
    tagline: "Kullandığın yazılımda bilinen açık var mı?",
    description: "NVD (National Vulnerability Database) üzerinde yazılım adı veya CVE ID ile güvenlik açıklarını ara. CVSS skoru, açıklama, etkilenen versiyonlar ve mevcut yamaları gösterir.",
    useCases: [
      "Kullandığım Apache versiyonunda bilinen açık var mı araştırıyorum",
      "CVE-2024-XXXXX'in beni etkileyip etkilemediğini anlamak istiyorum",
    ],
    steps: [
      "Yazılım adı veya CVE ID ile ara",
      "CVSS skoru ve önem seviyesini gör",
      "Etkilenen versiyon aralığını kontrol et",
      "Mevcut yama veya workaround'u uygula",
    ],
    faq: [
      { q: "CVSS 9+ ne anlama gelir?", a: "Kritik seviye — hemen yama yapılmalı. Uzaktan istismar edilebilir ve yüksek etki potansiyeli var." },
    ],
    tips: [
      "Sunucularındaki yazılımların versiyon listesini çıkar ve düzenli olarak CVE ara.",
      "CVSS skoruna ek olarak EPSS skoruna da bak — aktif exploit varsa daha acil.",
    ],
  },
  "ip-intelligence": {
    tagline: "Bu IP adresi nereden, kimin, ne yapıyor?",
    description: "Bir IP adresinin coğrafi konumunu, internet servis sağlayıcısını, otonom sistem numarasını ve VPN/proxy/Tor kullanıp kullanmadığını detaylı gösterir.",
    useCases: [
      "Bana saldıran IP'nin nerede olduğunu görmek istiyorum",
      "Gelen trafiğin gerçekten bildirdiği ülkeden gelip gelmediğini doğrulamak istiyorum",
    ],
    steps: [
      "IP adresini gir",
      "Sorgula butonuna bas",
      "Konum, ISP, ASN ve risk göstergelerini incele",
    ],
    faq: [
      { q: "VPN kullandığımda bu araç ne gösteriyor?", a: "VPN sunucusunun IP'sini ve lokasyonunu gösterir, gerçek konumunu değil." },
    ],
    tips: [
      "Clipboard izleyici açıksa IP kopyaladığında anında sorgu seçeneği çıkar.",
      "Birden fazla IP analiz etmek için IP Geolocation Map aracını kullan.",
    ],
  },
  "ip-geolocation": {
    tagline: "IP konumlarını interaktif haritada görselleştir",
    description: "Birden fazla IP adresinin dünya haritasında konumlarını işaretler. Küme görünümü ve detaylı bilgi baloncukları ile büyük IP listelerini analiz et.",
    useCases: [
      "Log dosyalarındaki IP'lerin coğrafi dağılımını haritada görmek istiyorum",
      "Kullanıcılarımın hangi ülkelerden geldiğini görselleştirmek istiyorum",
    ],
    steps: [
      "IP adreslerini gir veya yapıştır (virgülle veya satır satır)",
      "Haritala butonuna bas",
      "İnteraktif haritada konumları gör, işaretçilere tıkla detay al",
    ],
    faq: [],
    tips: [
      "Toplu analiz için IP listesini CSV'den yapıştırabilirsin.",
      "Küme görünümünü zoom ile açarak tek tek IP'leri inceleyebilirsin.",
    ],
  },
  "port-scanner": {
    tagline: "Hedefte hangi portlar açık, hangi servisler çalışıyor?",
    description: "Hedef IP veya domain üzerinde async port taraması yaparak açık portları ve çalışan servisleri tespit eder. Güvenlik değerlendirmesi için temel araç.",
    useCases: [
      "Kendi sunucumda dışarıya açık olmaması gereken portları kontrol etmek istiyorum",
      "Pentest sırasında hedef sistemdeki servisleri keşfediyorum",
    ],
    steps: [
      "Hedef IP veya hostname'i gir",
      "Port aralığını belirle (ör: 1-1000) veya yaygın portları seç",
      "Tara butonuna bas",
      "Açık portlar ve tespit edilen servisler listelenir",
    ],
    faq: [
      { q: "İzinsiz port tarama yapabilir miyim?", a: "Kesinlikle hayır. Yalnızca kendi sistemlerini veya yazılı izin verilen sistemleri tara." },
    ],
    tips: [
      "22 (SSH), 3389 (RDP), 5900 (VNC) portları internete açıksa acilen firewall kuralı ekle.",
      "Banner grabbing ile servis versiyonunu alıp CVE Search'te ara.",
    ],
  },
  "network-tools": {
    tagline: "Ping, traceroute, DNS — tüm ağ araçları bir arada",
    description: "Ping, traceroute, ileri ve ters DNS gibi temel ağ tanılama araçlarını tek bir arayüzden kullan. Bağlantı sorunlarını hızlıca tanıla.",
    useCases: [
      "Bir sunucuya neden ulaşamadığımı traceroute ile buluyorum",
      "DNS çözümlemesinin doğru çalışıp çalışmadığını test ediyorum",
    ],
    steps: [
      "Kullanmak istediğin aracı seç (Ping, Traceroute, DNS...)",
      "Hedef IP veya domain'i gir",
      "Çalıştır butonuna bas ve sonuçları incele",
    ],
    faq: [],
    tips: [
      "Traceroute ile paketin nerede düştüğünü ve hangi router'dan geçtiğini anlarsın.",
      "Reverse DNS ile bir IP'nin hostname'ini öğrenebilirsin.",
    ],
  },
  "my-ip-info": {
    tagline: "İnternete nasıl görünüyorsun? Veri sızıyor mu?",
    description: "Kendi public IP adresini, DNS sızıntısını ve WebRTC sızıntısını kontrol eder. VPN kullanıyorsan gerçek IP'nin sızdığını anlarsın.",
    useCases: [
      "VPN kullanıyorum, gerçek IP'im sızıyor mu kontrol etmek istiyorum",
      "DNS sorgularım gerçekten VPN üzerinden gidiyor mu test etmek istiyorum",
      "İnternete nasıl göründüğümü merak ediyorum",
    ],
    steps: [
      "Sayfayı aç — otomatik olarak bilgilerin toplanır",
      "Public IP, DNS sunucusu ve WebRTC sızıntısı gösterilir",
      "VPN kullanıyorsan sonuçları VPN açık/kapalı karşılaştır",
    ],
    faq: [
      { q: "WebRTC sızıntısı nedir?", a: "Tarayıcının WebRTC özelliği, VPN aktif olsa bile gerçek IP'ni açığa çıkarabilir." },
    ],
    tips: [
      "VPN açıkken buraya gel, gerçek IP'nin görünüp görünmediğini kontrol et.",
      "DNS leak varsa VPN sağlayıcını değiştirmeyi veya DNS-over-HTTPS aktif etmeyi düşün.",
    ],
  },
  "bgp-lookup": {
    tagline: "ASN detayları, prefix duyuruları ve BGP routing",
    description: "Bir IP adresi veya ASN için BGP routing bilgilerini, prefix duyurularını ve otonom sistem detaylarını gösterir.",
    useCases: [
      "Belirli bir IP'nin hangi ASN'e ait olduğunu ve routing bilgilerini görmek istiyorum",
      "Bir ağın upstream bağlantılarını araştırıyorum",
    ],
    steps: [
      "IP adresi veya ASN numarası gir",
      "BGP routing verilerini ve prefix listesini incele",
    ],
    faq: [],
    tips: [
      "BGP hijacking saldırılarını tespit etmek için düzenli routing kontrolü yap.",
    ],
  },
  "metadata-extractor": {
    tagline: "Dosyanın içinde ne saklı? Gizli verileri bul",
    description: "PDF, Word, Excel veya resim dosyasındaki gizli metadata'yı çıkarır. Dosyayı kimin, hangi bilgisayarda, ne zaman oluşturduğunu ve varsa GPS konumunu gösterir.",
    useCases: [
      "Anonim gönderilen belgenin gerçek yazarını veya organizasyonunu bulmak istiyorum",
      "Paylaşacağım belgeden kişisel bilgilerimi temizlemek istiyorum",
      "Bir fotoğrafın gerçekten nerede çekildiğini öğrenmek istiyorum",
    ],
    steps: [
      "Dosyayı sürükle-bırak alanına bırak veya seç",
      "Analiz otomatik başlar",
      "Yazar, oluşturulma tarihi, yazılım ve konum bilgilerini incele",
      "Gerekirse temizlenmiş sürümü indir",
    ],
    faq: [
      { q: "Hangi dosya formatları destekleniyor?", a: "PDF, DOCX, XLSX, PPTX, JPEG, PNG ve diğer yaygın formatlar." },
    ],
    tips: [
      "Belge paylaşmadan önce metadata'yı temizle — yazar adı, şirket adı sızdırmak istemeyebilirsin.",
      "Gazeteciler için: anonim sızdırılan belgeler genellikle metadata içinde kimlik bilgisi taşır.",
    ],
  },
  "image-exif": {
    tagline: "Bu fotoğraf nerede çekildi? Kamera neydi?",
    description: "Fotoğraflardaki EXIF verilerini okur. GPS koordinatları, kamera modeli, lens, ISO ayarları, çekim tarihi ve saatini gösterir. Konum varsa haritada işaretler.",
    useCases: [
      "Bir fotoğrafın gerçekten iddia edilen yerde çekilip çekilmediğini doğrulamak istiyorum",
      "Kendi fotoğraflarımın konum verisi içerip içermediğini kontrol etmek istiyorum",
    ],
    steps: [
      "Görüntü dosyasını seç veya sürükle-bırak",
      "EXIF verileri otomatik okunur",
      "GPS varsa harita üzerinde konum gösterilir",
    ],
    faq: [
      { q: "Tüm fotoğraflarda GPS bilgisi var mı?", a: "Hayır. Bazı platformlar (Instagram, Twitter) ve bazı kameralar GPS verisini siler veya hiç kaydetmez." },
    ],
    tips: [
      "Sosyal medyaya yüklemeden önce EXIF verilerini temizle — özel konumun ifşa olabilir.",
      "WhatsApp görselleri sıkıştırılır ve EXIF verisi büyük ölçüde silinir.",
    ],
  },
  "hash-lookup": {
    tagline: "Bu dosya zararlı mı? VirusTotal ile kontrol et",
    description: "Dosyanın hash değerini hesaplayarak VirusTotal'daki 70+ antivirüs motorunda sorgular. Zararlı yazılım mı, temiz mi hemen anlarsın.",
    useCases: [
      "İndirdiğim dosyanın güvenli olup olmadığını doğrulamak istiyorum",
      "Şüpheli bir .exe dosyasını çalıştırmadan önce kontrol etmek istiyorum",
    ],
    steps: [
      "Hash değerini gir veya dosyayı seç (hash otomatik hesaplanır)",
      "Sorgula butonuna bas",
      "70+ antivirüs sonuçlarını ve detektör listesini incele",
    ],
    faq: [
      { q: "Hiçbir antivirüs tespit etmezse güvenli mi?", a: "Büyük ihtimalle evet, ama %100 garanti değil. Yeni kötü amaçlı yazılımlar başlangıçta tespit edilemeyebilir." },
    ],
    tips: [
      "Dosyayı yüklemek yerine sadece hash gönder — gizlilik açısından daha güvenlidir.",
      "SHA256 hash kullan — MD5 ve SHA1 çakışmaya daha açıktır.",
    ],
  },
  "hash-generator": {
    tagline: "MD5, SHA256, SHA512 hash değerlerini anında üret",
    description: "Metin veya dosya için MD5, SHA1, SHA256 ve SHA512 hash değerlerini anında üretir. Dosya bütünlüğü doğrulama ve veri kimliği için kullanılır.",
    useCases: [
      "İndirdiğim dosyanın orijinal olup olmadığını hash karşılaştırmasıyla doğrulamak istiyorum",
      "Şifre depolamak için hash değeri üretmem gerekiyor",
    ],
    steps: [
      "Metin gir veya dosya seç",
      "İstediğin hash algoritmasını seç",
      "Hash değerini kopyala ve kullan",
    ],
    faq: [],
    tips: [
      "İki dosyanın aynı olduğunu kanıtlamak için SHA256 hash'lerini karşılaştır.",
      "MD5 artık kriptografik güvenlik için önerilmez, yalnızca checksum için kullan.",
    ],
  },
  "qr-analyzer": {
    tagline: "QR kodu taramadan önce içeriğini gör",
    description: "QR kod resmini yükle — içindeki URL veya metni çıkarır. URL ise otomatik olarak güvenlik kontrolüne gönderir. QR phishing saldırılarına karşı koruma.",
    useCases: [
      "Bu QR kodun gerçekten nereye yönlendirdiğini bilmiyorum",
      "Restoranda veya afişte gördüğüm QR kodu güvenli mi kontrol etmek istiyorum",
    ],
    steps: [
      "QR kod görselini yükle",
      "İçerik otomatik çözümlenir",
      "URL içeriyorsa güvenlik kontrolü yapılır",
    ],
    faq: [
      { q: "QR phishing nedir?", a: "Zararlı URL'lerin QR koda gizlenmesidir. Taramadan önce içeriği görmek önemlidir." },
    ],
    tips: [
      "Kamuya açık yerlerdeki QR kodlarına karşı dikkatli ol — üstüne sahte stiker yapıştırılmış olabilir.",
    ],
  },
  "document-analyzer": {
    tagline: "Belgede gizli içerik, makro veya zararlı nesne var mı?",
    description: "Belge dosyalarında gizli metin, makrolar, takip pikselleri ve gömülü nesneleri tespit eder. Zararlı Word veya PDF dosyalarını açmadan analiz et.",
    useCases: [
      "Şüpheli Word dosyasında makro var mı kontrol etmek istiyorum",
      "Bir PDF'in içinde gizli JavaScript veya gömülü nesne var mı bakmak istiyorum",
    ],
    steps: [
      "Belge dosyasını seç",
      "Analiz başlar",
      "Makrolar, gömülü nesneler ve şüpheli içerikler listelenir",
    ],
    faq: [],
    tips: [
      "Bilinmeyen kaynaklardan gelen Word (.docx/.doc) dosyalarını açmadan önce analiz et.",
      "Makro içeren belgeler en yaygın kurumsal malware dağıtım vektörüdür.",
    ],
  },
  "username-search": {
    tagline: "Bu kullanıcı adı 100+ platformda kim?",
    description: "Girdiğin kullanıcı adını GitHub, Twitter, Reddit, Instagram, TikTok ve 100'den fazla platformda eş zamanlı arar. Bir kişinin dijital ayak izini haritalandırır.",
    useCases: [
      "Bir kişinin hangi platformlarda hesabı olduğunu araştırıyorum",
      "Kendi kullanıcı adımın başka platformlarda kullanılıp kullanılmadığını kontrol etmek istiyorum",
    ],
    steps: [
      "Kullanıcı adını gir",
      "Ara butonuna bas",
      "Bulunan profiller platform ikonlarıyla listelenir",
      "Profil linklerine tıklayarak doğrula",
    ],
    faq: [
      { q: "Bu araç yasal mı?", a: "Herkese açık bilgileri toplar. Etik ve yasal sınırlar içinde kullan. Taciz veya stalking için kullanmak yasaktır." },
    ],
    tips: [
      "Farklı varyasyonları dene: kullanıcı adı, kullanıcı_adı, kullaniciadi gibi.",
      "OSINT Dashboard ile email ve Wayback araçlarını birleştirerek kapsamlı profil oluştur.",
    ],
  },
  "email-breach": {
    tagline: "Email adresin veri sızıntısında var mı?",
    description: "HaveIBeenPwned veritabanında email adresini sorgular. Hangi servislerde, ne zaman, hangi bilgilerinin sızdığını gösterir.",
    useCases: [
      "Email adresimin herhangi bir veri sızıntısında yer alıp almadığını öğrenmek istiyorum",
      "Hangi platformdaki şifremi değiştirmem gerektiğini bilmek istiyorum",
    ],
    steps: [
      "Email adresini gir",
      "Sorgula butonuna bas",
      "Sızıntı kaydı varsa hangi servislerde, ne zaman ve ne tür veri sızdığı gösterilir",
    ],
    faq: [
      { q: "Email adresim güvende mi?", a: "Sızıntı çıkmazsa şu ana kadar bilinen ihlallerde görünmemiş demektir. Ancak gelecekteki ihlaller için NightWatch ile izle." },
    ],
    tips: [
      "Tüm email adreslerini düzenli kontrol et — iş, kişisel, eski adresler.",
      "Sızıntı çıkarsa o platformdaki şifreni hemen değiştir ve 2FA ekle.",
    ],
  },
  "phone-lookup": {
    tagline: "Bu telefon numarası nereden, hangi operatör?",
    description: "Telefon numaralarını doğrular ve ülke, operatör (carrier) ile hat tipi (mobil, sabit, VoIP) bilgilerini gösterir.",
    useCases: [
      "Bilinmeyen numaranın hangi ülke ve operatörden geldiğini öğrenmek istiyorum",
      "Sahte bir numara mı (VoIP) yoksa gerçek hat mı anlamak istiyorum",
    ],
    steps: [
      "Telefon numarasını uluslararası formatta gir (+90xxxxxxxxxx)",
      "Sorgula butonuna bas",
      "Ülke, operatör ve hat tipi bilgisini gör",
    ],
    faq: [],
    tips: [
      "VoIP numaralar (Skype, Google Voice, TextNow) çoğunlukla dolandırıcılıkta kullanılır.",
    ],
  },
  "wayback-viewer": {
    tagline: "Bu sitenin geçmişine git — eski sürümleri gör",
    description: "Web.archive.org arşivini kullanarak bir sitenin geçmişteki hallerini görüntüler. Silinen içerikleri, eski sayfa tasarımlarını ve geçmiş bilgileri incele.",
    useCases: [
      "Bir şirketin sitesinden silinen sayfayı veya açıklamayı bulmak istiyorum",
      "Bu sitenin ne zamandan beri var olduğunu ve nasıl değiştiğini araştırıyorum",
    ],
    steps: [
      "Domain adını gir",
      "Tarih seç veya tüm arşivleri listele",
      "Eski site sürümünü görüntüle",
    ],
    faq: [
      { q: "Her site arşivde var mı?", a: "Hayır. Wayback Machine tüm siteleri arşivlemez. Robots.txt ile engellenen siteler arşivlenmez." },
    ],
    tips: [
      "Bir şirketin eski 'hakkımızda' sayfasından faaliyetler veya kişi bilgileri bulabilirsin.",
      "Silinen forum gönderileri veya blog yazıları da arşivde olabilir.",
    ],
  },
  "google-dorks-identity": {
    tagline: "Google'ı silah gibi kullan — gelişmiş arama",
    description: "Hedef domain için 30+ kategoride Google Dork sorgusu otomatik üretir. Exposed dosyalar, admin panelleri, açık dizinler ve hassas veriler için hazır sorgular.",
    useCases: [
      "Kendi sitem hakkında Google'da ne kadar bilgi indexlenmiş görmek istiyorum",
      "Bir hedef için OSINT araştırması yapıyorum",
    ],
    steps: [
      "Hedef domain adını gir",
      "İstediğin kategorileri seç (admin, dosyalar, giriş, backup...)",
      "Üretilen dork sorgularını Google'da çalıştır",
    ],
    faq: [
      { q: "Bu sorgular yasal mı?", a: "Google araması yapmak yasal. Sadece kamuya açık indexlenmiş bilgilere erişirsin. Bulunan bilgiyi nasıl kullandığın önemlidir." },
    ],
    tips: [
      "Kendi şirket domainine karşı çalıştırarak ne kadar hassas bilginin Google'da göründüğünü öğren.",
      "site:example.com filetype:pdf ile belgeler, inurl:admin ile admin paneller bulunabilir.",
    ],
  },
  "osint-dashboard": {
    tagline: "Tüm OSINT araçlarını bir hedef için tek arayüzde çalıştır",
    description: "Username Search, Email Breach, Wayback Viewer ve Google Dorks'u tek bir hedef için aynı anda çalıştırır. Kapsamlı OSINT raporu oluşturur.",
    useCases: [
      "Bir kişi veya domain hakkında kapsamlı OSINT raporu hazırlamak istiyorum",
      "Araştırmacı gazetecilik için dijital profil çıkarmak istiyorum",
    ],
    steps: [
      "Hedef email, kullanıcı adı veya domain'i gir",
      "Çalıştırmak istediğin modülleri seç",
      "Tüm sonuçlar tek raporda birleştirilir",
    ],
    faq: [],
    tips: [
      "Araştırmana başlamadan önce bu araçla hızlı bir ön tarama yap.",
    ],
  },
  "password-analyzer": {
    tagline: "Şifren ne kadar güçlü? Kırılması kaç yıl sürer?",
    description: "Şifrenin gücünü analiz eder, kırılma süresini hesaplar ve HaveIBeenPwned'de daha önce sızıntıda görülüp görülmediğini k-anonymity yöntemiyle güvenli şekilde kontrol eder.",
    useCases: [
      "Kullandığım şifrenin ne kadar güçlü olduğunu görmek istiyorum",
      "Yeni bir şifre seçmeden önce güvenliğini test etmek istiyorum",
    ],
    steps: [
      "Şifreyi yaz — canlı analiz başlar",
      "Güç skoru, kırılma süresi ve öneriler görünür",
      "HIBP kontrolü sonucunu incele",
    ],
    faq: [
      { q: "Şifrem sunucuya gönderiliyor mu?", a: "Hayır. Analiz tamamen lokaldir. HIBP kontrolünde yalnızca hash'in ilk 5 karakteri gönderilir (k-anonymity)." },
    ],
    tips: [
      "12+ karakter, büyük/küçük harf + rakam + sembol kombinasyonu kullan.",
      "Her servis için farklı şifre kullan — sızıntı olduğunda diğer hesapların güvende kalır.",
    ],
  },
  "password-generator": {
    tagline: "Kırılmaz şifre üret — özelleştirilebilir",
    description: "Kriptografik olarak güvenli rastgele şifreler üretir. Uzunluk, karakter seti ve hatırlanabilir mod seçenekleriyle istediğin formatta güçlü şifre oluştur.",
    useCases: [
      "Yeni bir hesap için güçlü şifre üretmek istiyorum",
      "Toplu şifre üretmem gerekiyor (50 adet)",
    ],
    steps: [
      "Uzunluğu ve karakter setini seç",
      "Üret butonuna bas",
      "Beğendiğin şifreyi kopyala",
    ],
    faq: [],
    tips: [
      "Üretilen şifreleri bir şifre yöneticisine (Bitwarden, 1Password) kaydet.",
      "Hatırlanabilir mod (kelimeler arası çizgi ile) daha kolay hatırlanan güçlü şifreler üretir.",
    ],
  },
  "email-header": {
    tagline: "Bu email gerçekten o kişiden mi geldi?",
    description: "Email başlığını yapıştır — SPF, DKIM ve DMARC kontrollerini yapar, gerçek kaynak IP'yi bulur ve phishing şüphesi varsa uyarır.",
    useCases: [
      "Bankamdan geldiğini söyleyen emailin gerçekten bankadan gelip gelmediğini doğrulamak istiyorum",
      "Şirket yetkilisinden geldiği iddia edilen emailin kaynağını doğrulamak istiyorum",
    ],
    steps: [
      "Email istemcisinde 'Ham kaynağı göster' veya 'Show original' seçeneğine tıkla",
      "Tüm başlık metnini kopyala",
      "Bu alana yapıştır ve analiz et",
      "SPF/DKIM/DMARC sonuçları ve phishing skoru incele",
    ],
    faq: [
      { q: "Ham email başlığını nasıl alırım?", a: "Gmail'de üç nokta → Orijinali göster. Outlook'ta Dosya → Özellikler. Thunderbird'de Görünüm → Kaynak." },
    ],
    tips: [
      "SPF geçiyorsa email adresi sahte değil ama içerik yine de yanıltıcı olabilir — dikkatli ol.",
      "Hop sayısı fazla olan emailler birden fazla sunucu üzerinden geçmiş demektir.",
    ],
  },
  "2fa-generator": {
    tagline: "Google Authenticator olmadan TOTP kodu üret",
    description: "Gizli anahtar girerek Google Authenticator uyumlu 6 haneli TOTP kodları üretir. Tamamen offline çalışır, internet gerektirmez.",
    useCases: [
      "Telefonum yanımda değilken 2FA koduma ihtiyacım var",
      "TOTP altyapısını test etmem gerekiyor",
    ],
    steps: [
      "Gizli anahtarı gir veya yeni oluştur",
      "QR kodunu görüntüle ve Google Authenticator ile tara",
      "30 saniyede bir yenilenen kodu kopyala",
    ],
    faq: [
      { q: "TOTP nedir?", a: "Time-based One-Time Password — zaman bazlı tek kullanımlık şifre. Her 30 saniyede değişir." },
    ],
    tips: [
      "Gizli anahtarı güvenli bir yerde sakla — telefon kaybolursa kodu bu anahtarla yeniden oluşturabilirsin.",
      "Yedek kodları her zaman bas ve fiziksel olarak sakla.",
    ],
  },
  "encoder-decoder": {
    tagline: "Base64, Hex, URL — tüm formatları dönüştür",
    description: "Base64, URL encoding, HTML entities, Hex, Binary, ROT13 ve Morse code dahil 8 farklı format arasında anlık dönüşüm yapar.",
    useCases: [
      "Obfuscated payload'ı decode etmem gerekiyor",
      "JWT token'ının payload kısmını okumak istiyorum",
    ],
    steps: [
      "Format tipini seç (Base64, Hex, URL...)",
      "Encode veya Decode modunu seç",
      "Metni gir",
      "Sonuç anında görüntülenir",
    ],
    faq: [
      { q: "Base64 şifreleme midir?", a: "Hayır. Base64 sadece encoding'dir, şifreleme değil. Kolayca decode edilebilir." },
    ],
    tips: [
      "Tüm Formatları Kodla butonuyla girilen metni aynı anda tüm formatlarda görebilirsin.",
      "Caesar şifresi için shift değerini 0-25 arasında ayarlayabilirsin.",
    ],
  },
  "ai-assistant": {
    tagline: "Güvenlik uzmanı gibi sor, anında cevap al",
    description: "Lokal Ollama veya bulut AI (OpenAI/Claude/Gemini) ile güvenlik sorularını doğal dilde sor. Tarama sonuçlarını AI'a analiz ettir, risk değerlendirmesi al.",
    useCases: [
      "ShadowScan sonuçlarımı anlayamıyorum, AI açıklasın",
      "Bu IP tehlikeli mi bana anlat",
      "Güvenliğimi nasıl artırırım diye sormak istiyorum",
    ],
    steps: [
      "Sorunuzu yazın",
      "Enter'a basın veya Gönder butonuna tıklayın",
      "AI yanıtını okuyun",
      "Takip soruları sorabilirsiniz",
    ],
    faq: [
      { q: "Hangi AI kullanılıyor?", a: "Ollama kuruluysa ücretsiz lokal AI. Yoksa Ayarlar bölümünden OpenAI/Claude/Gemini API key girerek bulut AI kullanabilirsiniz." },
      { q: "Verilerim AI'a gönderiliyor mu?", a: "Ollama kullanıyorsanız hayır — tamamen lokaldir. Bulut AI kullanıyorsanız ilgili sağlayıcıya gönderilir." },
    ],
    tips: [
      "Tarama sonuçlarını yapıştırarak 'Bu sonuçları analiz et, ne yapmalıyım?' diye sor.",
      "Spesifik soru sor: 'CVE-2024-1234 nedir?' gibi.",
    ],
  },
  "ai-risk-analysis": {
    tagline: "Tarama sonuçlarını AI yorumlasın, ne yapman gerektiğini söylesin",
    description: "Herhangi bir tarama sonucunu AI'a gönder — risk değerlendirmesi, öncelikli aksiyonlar ve detaylı açıklama üretir.",
    useCases: [
      "ShadowScan çalıştırdım ama sonuçları yorumlayamıyorum",
      "Hangi bulgulara önce odaklanmam gerektiğini bilmek istiyorum",
    ],
    steps: [
      "Son taramalardan analiz etmek istediğini seç",
      "Analiz et butonuna bas",
      "AI risk değerlendirmesi ve aksiyon listesi oluşturur",
    ],
    faq: [],
    tips: [
      "Birden fazla tarama sonucunu seç — AI bunları birlikte değerlendirerek genel risk skorun hesaplar.",
    ],
  },
  "ai-report": {
    tagline: "Haftalık güvenlik raporunu otomatik oluştur",
    description: "Tarama geçmişini analiz ederek kapsamlı haftalık güvenlik raporu üretir. Yöneticilere veya müşterilere sunmaya hazır formatta.",
    useCases: [
      "Yöneticime haftalık güvenlik özeti sunmam gerekiyor",
      "Müşterime düzenli güvenlik raporu hazırlamak istiyorum",
    ],
    steps: [
      "Rapor Oluştur butonuna bas",
      "AI tarama geçmişini analiz eder",
      "Markdown formatında rapor oluşturulur",
      "Kopyala veya .md olarak dışa aktar",
    ],
    faq: [],
    tips: [
      "Raporu Markdown editörüne yapıştırıp PDF olarak dışa aktarabilirsin.",
    ],
  },
};

export default tr;
