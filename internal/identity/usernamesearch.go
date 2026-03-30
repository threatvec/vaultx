// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package identity

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

// PlatformResult holds the result of checking a username on one platform.
type PlatformResult struct {
	Platform string `json:"platform"`
	URL      string `json:"url"`
	Found    bool   `json:"found"`
	Category string `json:"category"`
	Error    string `json:"error,omitempty"`
}

// UsernameSearchResult holds all platform results for a username.
type UsernameSearchResult struct {
	Username  string           `json:"username"`
	Found     []PlatformResult `json:"found"`
	NotFound  []PlatformResult `json:"not_found"`
	Total     int              `json:"total"`
	FoundCount int             `json:"found_count"`
	Error     string           `json:"error,omitempty"`
}

// platformDef defines a platform to check.
type platformDef struct {
	Name     string
	URL      string // {username} placeholder
	Category string
	// Some platforms return 200 for all users; check string in body
	CheckNot string // if response body contains this string, user does NOT exist
}

var platforms = []platformDef{
	// Code / Dev
	{"GitHub", "https://github.com/{username}", "code", "Not Found"},
	{"GitLab", "https://gitlab.com/{username}", "code", ""},
	{"Bitbucket", "https://bitbucket.org/{username}", "code", ""},
	{"HackerNews", "https://news.ycombinator.com/user?id={username}", "code", "No such user"},
	{"Dev.to", "https://dev.to/{username}", "code", ""},
	{"Keybase", "https://keybase.io/{username}", "code", ""},
	{"Replit", "https://replit.com/@{username}", "code", ""},
	{"CodePen", "https://codepen.io/{username}", "code", ""},
	{"npm", "https://www.npmjs.com/~{username}", "code", ""},
	{"PyPI", "https://pypi.org/user/{username}/", "code", ""},
	{"Docker Hub", "https://hub.docker.com/u/{username}", "code", ""},
	// Social
	{"Reddit", "https://www.reddit.com/user/{username}", "social", "Sorry, nobody on Reddit"},
	{"Twitter/X", "https://x.com/{username}", "social", ""},
	{"Instagram", "https://www.instagram.com/{username}/", "social", ""},
	{"TikTok", "https://www.tiktok.com/@{username}", "social", ""},
	{"Pinterest", "https://www.pinterest.com/{username}/", "social", ""},
	{"Tumblr", "https://{username}.tumblr.com", "social", ""},
	{"Medium", "https://medium.com/@{username}", "social", ""},
	{"Mastodon", "https://mastodon.social/@{username}", "social", ""},
	{"Telegram", "https://t.me/{username}", "social", ""},
	{"VK", "https://vk.com/{username}", "social", ""},
	{"About.me", "https://about.me/{username}", "social", ""},
	// Gaming
	{"Steam", "https://steamcommunity.com/id/{username}", "gaming", "The specified profile could not be found"},
	{"Twitch", "https://www.twitch.tv/{username}", "gaming", ""},
	{"Xbox", "https://account.xbox.com/en-US/Profile?Gamertag={username}", "gaming", ""},
	{"PlayStation", "https://psnprofiles.com/{username}", "gaming", ""},
	{"Roblox", "https://www.roblox.com/user.aspx?username={username}", "gaming", ""},
	{"Minecraft", "https://namemc.com/profile/{username}", "gaming", ""},
	{"Itch.io", "https://itch.io/profile/{username}", "gaming", ""},
	{"GameFAQs", "https://gamefaqs.gamespot.com/community/{username}", "gaming", ""},
	// Creative
	{"YouTube", "https://www.youtube.com/@{username}", "creative", ""},
	{"SoundCloud", "https://soundcloud.com/{username}", "creative", ""},
	{"Spotify", "https://open.spotify.com/user/{username}", "creative", ""},
	{"Last.fm", "https://www.last.fm/user/{username}", "creative", ""},
	{"Flickr", "https://www.flickr.com/people/{username}", "creative", ""},
	{"500px", "https://500px.com/p/{username}", "creative", ""},
	{"Behance", "https://www.behance.net/{username}", "creative", ""},
	{"Dribbble", "https://dribbble.com/{username}", "creative", ""},
	{"Vimeo", "https://vimeo.com/{username}", "creative", ""},
	{"DeviantArt", "https://www.deviantart.com/{username}", "creative", ""},
	{"ArtStation", "https://www.artstation.com/{username}", "creative", ""},
	{"Unsplash", "https://unsplash.com/@{username}", "creative", ""},
	// Professional
	{"LinkedIn", "https://www.linkedin.com/in/{username}", "professional", ""},
	{"AngelList", "https://angel.co/{username}", "professional", ""},
	{"ProductHunt", "https://www.producthunt.com/@{username}", "professional", ""},
	{"Patreon", "https://www.patreon.com/{username}", "professional", ""},
	{"Fiverr", "https://www.fiverr.com/{username}", "professional", ""},
	{"Upwork", "https://www.upwork.com/freelancers/~{username}", "professional", ""},
	{"Freelancer", "https://www.freelancer.com/u/{username}", "professional", ""},
	{"Gravatar", "https://en.gravatar.com/{username}", "professional", ""},
	{"WordPress", "https://wordpress.org/support/users/{username}/", "professional", ""},
	{"Substack", "https://substack.com/@{username}", "professional", ""},
	// Forums
	{"HackerForums", "https://hackforums.net/member.php?username={username}", "forum", ""},
	{"Bugcrowd", "https://bugcrowd.com/{username}", "forum", ""},
	{"HackerOne", "https://hackerone.com/{username}", "forum", ""},
	{"Disqus", "https://disqus.com/by/{username}", "forum", ""},
	{"Quora", "https://www.quora.com/profile/{username}", "forum", ""},
	{"StackOverflow", "https://stackoverflow.com/users/0/{username}", "forum", ""},
	{"MyAnimeList", "https://myanimelist.net/profile/{username}", "forum", ""},
	{"Letterboxd", "https://letterboxd.com/{username}/", "forum", ""},
	{"Goodreads", "https://www.goodreads.com/{username}", "forum", ""},
	// Crypto / Tech
	{"Keyoxide", "https://keyoxide.org/{username}", "crypto", ""},
	{"Etherscan", "https://etherscan.io/search?q={username}", "crypto", ""},
	{"OpenBugBounty", "https://www.openbugbounty.org/researchers/{username}/", "crypto", ""},
	{"Wattpad", "https://www.wattpad.com/user/{username}", "creative", ""},
	{"Kickstarter", "https://www.kickstarter.com/profile/{username}", "professional", ""},
	{"Bandcamp", "https://www.bandcamp.com/{username}", "creative", ""},
	{"Mix", "https://mix.com/{username}", "social", ""},
	{"Snapchat", "https://www.snapchat.com/add/{username}", "social", ""},
	{"Clubhouse", "https://www.clubhouse.com/@{username}", "social", ""},
	{"Signal", "https://signal.me/#p/{username}", "social", ""},
	{"Wire", "https://wire.com/en/company/", "social", ""},
	// More gaming / streaming
	{"Mixer", "https://mixer.com/{username}", "gaming", ""},
	{"Trovo", "https://trovo.live/{username}", "gaming", ""},
	{"Crunchyroll", "https://www.crunchyroll.com/user/{username}", "creative", ""},
	{"NicoNico", "https://www.nicovideo.jp/user/{username}", "creative", ""},
	{"Psnprofiles", "https://psnprofiles.com/{username}", "gaming", ""},
	// Business
	{"Etsy", "https://www.etsy.com/shop/{username}", "professional", ""},
	{"eBay", "https://www.ebay.com/usr/{username}", "professional", ""},
	{"Amazon", "https://www.amazon.com/gp/profile/amzn1.account.{username}", "professional", ""},
	{"Shopify", "https://{username}.myshopify.com", "professional", ""},
	{"Gumroad", "https://{username}.gumroad.com", "professional", ""},
	// Misc
	{"Imgur", "https://imgur.com/user/{username}", "creative", ""},
	{"Giphy", "https://giphy.com/{username}", "creative", ""},
	{"Linktree", "https://linktr.ee/{username}", "social", ""},
	{"AllMyLinks", "https://allmylinks.com/{username}", "social", ""},
	{"Carrd", "https://{username}.carrd.co", "social", ""},
	{"Ko-fi", "https://ko-fi.com/{username}", "professional", ""},
	{"CashApp", "https://cash.app/${username}", "professional", ""},
	{"Venmo", "https://venmo.com/{username}", "professional", ""},
	{"Lichess", "https://lichess.org/@/{username}", "gaming", ""},
	{"Chess.com", "https://www.chess.com/member/{username}", "gaming", ""},
	{"Kaggle", "https://www.kaggle.com/{username}", "code", ""},
	{"Codewars", "https://www.codewars.com/users/{username}", "code", ""},
	{"LeetCode", "https://leetcode.com/{username}/", "code", ""},
	{"HackerEarth", "https://www.hackerearth.com/@{username}", "code", ""},
	{"Codeforces", "https://codeforces.com/profile/{username}", "code", ""},
}

// SearchUsername checks 100+ platforms concurrently for a given username.
func SearchUsername(ctx context.Context, username string, progressCh chan<- PlatformResult) (*UsernameSearchResult, error) {
	username = strings.TrimSpace(username)
	result := &UsernameSearchResult{Username: username, Total: len(platforms)}

	jobs := make(chan platformDef, len(platforms))
	results := make(chan PlatformResult, len(platforms))

	const workers = 50
	var wg sync.WaitGroup

	// Rate limiter: 20 req/s
	ticker := time.NewTicker(time.Second / 20)
	defer ticker.Stop()

	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for p := range jobs {
				select {
				case <-ctx.Done():
					results <- PlatformResult{Platform: p.Name, URL: "", Found: false}
					continue
				case <-ticker.C:
				}
				r := checkPlatform(ctx, client, p, username)
				results <- r
				if progressCh != nil {
					select {
					case progressCh <- r:
					default:
					}
				}
			}
		}()
	}

	for _, p := range platforms {
		jobs <- p
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	for r := range results {
		if r.Found {
			result.Found = append(result.Found, r)
			result.FoundCount++
		} else {
			result.NotFound = append(result.NotFound, r)
		}
	}

	return result, nil
}

func checkPlatform(ctx context.Context, client *http.Client, p platformDef, username string) PlatformResult {
	url := strings.ReplaceAll(p.URL, "{username}", username)
	res := PlatformResult{
		Platform: p.Name,
		URL:      url,
		Category: p.Category,
	}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		res.Error = err.Error()
		return res
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return res
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		if p.CheckNot != "" {
			buf := make([]byte, 4096)
			n, _ := resp.Body.Read(buf)
			body := string(buf[:n])
			if strings.Contains(body, p.CheckNot) {
				return res
			}
		}
		res.Found = true
		res.URL = fmt.Sprintf("%s", url)
	}

	return res
}
