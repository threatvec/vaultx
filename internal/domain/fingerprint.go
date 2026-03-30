// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// FingerprintResult holds web technology detection results.
type FingerprintResult struct {
	URL        string            `json:"url"`
	Server     string            `json:"server"`
	PoweredBy  string            `json:"powered_by"`
	CMS        []string          `json:"cms"`
	Framework  []string          `json:"framework"`
	CDN        []string          `json:"cdn"`
	Analytics  []string          `json:"analytics"`
	JavaScript []string          `json:"javascript"`
	Headers    map[string]string `json:"headers"`
	Error      string            `json:"error,omitempty"`
}

type techPattern struct {
	name    string
	headers map[string][]string
	body    []string
}

var cmsPatterns = []techPattern{
	{name: "WordPress", headers: map[string][]string{"x-powered-by": {"WordPress"}}, body: []string{"wp-content/", "wp-includes/", "wp-json/"}},
	{name: "Drupal", headers: map[string][]string{"x-drupal-cache": nil, "x-generator": {"Drupal"}}, body: []string{"Drupal.settings", "drupal.js", "/sites/default/"}},
	{name: "Joomla", body: []string{"/components/com_", "/modules/mod_", "Joomla!"}},
	{name: "Magento", body: []string{"Mage.Cookies", "Magento_", "/skin/frontend/", "/js/mage/"}},
	{name: "Shopify", body: []string{"cdn.shopify.com", "Shopify.theme", "/checkouts/"}},
	{name: "Ghost", body: []string{"ghost/", "content/themes/", "ghost-sdk"}},
	{name: "Wix", body: []string{"static.wixstatic.com", "wix.com", "_wix_"}},
	{name: "Squarespace", body: []string{"squarespace.com", "sqsp.net", "squarespace-cdn"}},
	{name: "PrestaShop", body: []string{"/themes/default/", "prestashop", "addProductToCart"}},
	{name: "OpenCart", body: []string{"catalog/view/theme/", "route=product/product"}},
	{name: "TYPO3", body: []string{"typo3/", "TYPO3", "typo3conf/"}},
	{name: "Concrete5", body: []string{"concrete/js/", "ccm_basefile"}},
}

var frameworkPatterns = []techPattern{
	{name: "React", body: []string{"react.development.js", "react.production.min.js", "__REACT_FIBER__", "data-reactroot"}},
	{name: "Vue.js", body: []string{"vue.min.js", "vue.js", "__vue__", "v-bind:", "v-model"}},
	{name: "Angular", body: []string{"angular.min.js", "ng-version", "ng-app", "ng-controller"}},
	{name: "Next.js", body: []string{"_next/static/", "__NEXT_DATA__", "_next/chunks/"}},
	{name: "Nuxt.js", body: []string{"_nuxt/", "__NUXT__"}},
	{name: "Svelte", body: []string{"svelte-", "__svelte"}},
	{name: "jQuery", body: []string{"jquery.min.js", "jquery-", "jQuery.fn.jquery"}},
	{name: "Bootstrap", body: []string{"bootstrap.min.css", "bootstrap.min.js", "col-md-", "btn-primary"}},
	{name: "Tailwind CSS", body: []string{"tailwind.css", "tailwindcss", "tw-"}},
	{name: "Laravel", headers: map[string][]string{"x-powered-by": {"PHP"}}, body: []string{"laravel_session", "XSRF-TOKEN", "laravel"}},
	{name: "Django", headers: map[string][]string{"x-frame-options": {"SAMEORIGIN"}}, body: []string{"csrfmiddlewaretoken", "django"}},
	{name: "Ruby on Rails", headers: map[string][]string{"x-runtime": nil}, body: []string{"csrf-token", "action-dispatch"}},
}

var cdnPatterns = []techPattern{
	{name: "Cloudflare", headers: map[string][]string{"cf-ray": nil, "server": {"cloudflare"}}},
	{name: "Fastly", headers: map[string][]string{"x-served-by": {"cache-"}, "x-cache": nil}},
	{name: "Akamai", headers: map[string][]string{"x-check-cacheable": nil, "akamai-x-cache": nil}},
	{name: "AWS CloudFront", headers: map[string][]string{"x-amz-cf-id": nil, "via": {"CloudFront"}}},
	{name: "Google Cloud CDN", headers: map[string][]string{"x-goog-generation": nil}},
	{name: "Azure CDN", headers: map[string][]string{"x-ec-custom-error": nil, "x-azure-ref": nil}},
	{name: "jsDelivr", body: []string{"cdn.jsdelivr.net"}},
	{name: "Cloudinary", body: []string{"cloudinary.com", "res.cloudinary.com"}},
	{name: "Bunny CDN", headers: map[string][]string{"server": {"BunnyCDN"}}},
}

var analyticsPatterns = []techPattern{
	{name: "Google Analytics", body: []string{"google-analytics.com/analytics.js", "gtag/js?id=", "UA-", "G-"}},
	{name: "Google Tag Manager", body: []string{"googletagmanager.com/gtm.js", "GTM-"}},
	{name: "Facebook Pixel", body: []string{"connect.facebook.net/en_US/fbevents.js", "fbq('init'"}},
	{name: "HotJar", body: []string{"static.hotjar.com", "hjid", "hjsv"}},
	{name: "Segment", body: []string{"cdn.segment.com", "analytics.identify"}},
	{name: "Mixpanel", body: []string{"cdn.mxpnl.com", "mixpanel.init"}},
	{name: "Amplitude", body: []string{"cdn.amplitude.com", "amplitude.init"}},
	{name: "Plausible", body: []string{"plausible.io/js/plausible.js"}},
	{name: "Matomo", body: []string{"matomo.js", "piwik.js", "_paq.push"}},
	{name: "Intercom", body: []string{"widget.intercom.io", "intercomSettings"}},
	{name: "Zendesk", body: []string{"static.zdassets.com", "zendeskWidget"}},
}

// FingerprintWeb detects technologies used by a website.
func FingerprintWeb(ctx context.Context, targetURL string) (*FingerprintResult, error) {
	result := &FingerprintResult{
		URL:     targetURL,
		Headers: make(map[string]string),
	}

	if !strings.HasPrefix(targetURL, "http") {
		targetURL = "https://" + targetURL
	}

	client := &http.Client{Timeout: 20 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		result.Error = fmt.Sprintf("invalid URL: %v", err)
		return result, nil
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("request failed: %v", err)
		return result, nil
	}
	defer resp.Body.Close()

	for k, vals := range resp.Header {
		result.Headers[k] = strings.Join(vals, "; ")
	}
	result.Server = resp.Header.Get("Server")
	result.PoweredBy = resp.Header.Get("X-Powered-By")

	body, err := io.ReadAll(io.LimitReader(resp.Body, 512*1024))
	if err != nil {
		result.Error = fmt.Sprintf("failed to read body: %v", err)
		return result, nil
	}
	bodyStr := string(body)

	result.CMS = matchPatterns(bodyStr, resp.Header, cmsPatterns)
	result.Framework = matchPatterns(bodyStr, resp.Header, frameworkPatterns)
	result.CDN = matchPatterns(bodyStr, resp.Header, cdnPatterns)
	result.Analytics = matchPatterns(bodyStr, resp.Header, analyticsPatterns)

	return result, nil
}

// matchPatterns checks response headers and body for technology signatures.
func matchPatterns(body string, headers http.Header, patterns []techPattern) []string {
	var matched []string
	bodyLower := strings.ToLower(body)

	for _, p := range patterns {
		found := false
		for headerName, expectedVals := range p.headers {
			headerVal := strings.ToLower(headers.Get(headerName))
			if expectedVals == nil && headerVal != "" {
				found = true
				break
			}
			for _, expected := range expectedVals {
				if strings.Contains(headerVal, strings.ToLower(expected)) {
					found = true
					break
				}
			}
			if found {
				break
			}
		}
		if !found {
			for _, pattern := range p.body {
				if strings.Contains(bodyLower, strings.ToLower(pattern)) {
					found = true
					break
				}
			}
		}
		if found {
			matched = append(matched, p.name)
		}
	}
	return matched
}
