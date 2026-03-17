use chrono::{Datelike, Duration, NaiveDate, Utc, Weekday};
use reqwest::Client;
use scraper::{Html, Selector};

use crate::tags::assign_tags;
use crate::types::{Article, Issue};

const SKIP_TERMS: &[&str] = &[
    "sponsor",
    "advertise.tldr",
    "subscribe",
    "privacy",
    "careers",
    "qawolf",
    "checkmarx",
    "svix",
    "aiven",
    "serpapi",
    "miro.com",
    "cdata.com",
];

const UTM_PARAMS: &[&str] = &[
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "utm_id",
    "ref",
];

/// Strip UTM tracking params and common referral params from a URL.
fn strip_utm_params(url: &str) -> String {
    let (before_frag, fragment) = match url.find('#') {
        Some(i) => (&url[..i], Some(&url[i..])),
        None => (url, None),
    };
    let (path, query) = match before_frag.find('?') {
        Some(i) => (&before_frag[..i], Some(&before_frag[i + 1..])),
        None => (before_frag, None),
    };
    let Some(query) = query else {
        return url.to_string();
    };
    let filtered: Vec<&str> = query
        .split('&')
        .filter(|p| {
            let key = p.split('=').next().unwrap_or("").to_lowercase();
            !UTM_PARAMS.contains(&key.as_str())
        })
        .collect();
    let mut result = path.to_string();
    if !filtered.is_empty() {
        result.push('?');
        result.push_str(&filtered.join("&"));
    }
    if let Some(frag) = fragment {
        result.push_str(frag);
    }
    result
}

fn should_skip(href: &str, title: &str) -> bool {
    if !href.starts_with("http") {
        return true;
    }
    if href.contains("tldr.tech") {
        return true;
    }
    if title.len() < 12 {
        return true;
    }
    let href_lower = href.to_lowercase();
    let title_lower = title.to_lowercase();
    SKIP_TERMS
        .iter()
        .any(|t| href_lower.contains(t) || title_lower.contains(t))
}

fn strip_minute_read(title: &str) -> String {
    if let Some(pos) = title.rfind('(') {
        if title[pos..].contains("minute read") {
            return title[..pos].trim().to_string();
        }
    }
    title.to_string()
}

fn map_section_to_category(header: &str) -> String {
    let h = header.to_lowercase();
    if h.contains("article") || h.contains("tutorial") {
        "Articles & Tutorials"
    } else if h.contains("opinion") || h.contains("advice") {
        "Opinions & Advice"
    } else if h.contains("launch") || h.contains("tool") {
        "Launches & Tools"
    } else if h.contains("quick") {
        "Quick Links"
    } else if h.contains("headline") || h.contains("big tech") || h.contains("news") {
        "Headlines"
    } else if h.contains("deep") || h.contains("engineering") || h.contains("research") {
        "Deep Dives"
    } else if h.contains("miscellan") || h.contains("misc") {
        "Misc"
    } else if h.contains("science") || h.contains("futuristic") {
        "Science & Tech"
    } else if !h.is_empty() {
        // Return the original header as-is for unknown sections
        return header.trim().to_string();
    } else {
        "General"
    }
    .to_string()
}

fn build_feed_url(feed_id: &str, date: &NaiveDate) -> Option<String> {
    let date_str = date.format("%Y-%m-%d").to_string();
    match feed_id {
        "dev" => Some(format!("https://tldr.tech/dev/{}", date_str)),
        "ai" => Some(format!("https://tldr.tech/ai/{}", date_str)),
        "tech" => Some(format!("https://tldr.tech/tech/{}", date_str)),
        _ => None,
    }
}

async fn scrape_issue(client: &Client, feed_id: &str, date: &NaiveDate) -> Option<Issue> {
    let url = build_feed_url(feed_id, date)?;
    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let html = resp.text().await.ok()?;
    let document = Html::parse_document(&html);

    let section_sel = Selector::parse("section").unwrap();
    let h3_sel = Selector::parse("h3").unwrap();
    let article_sel = Selector::parse("article").unwrap();
    let link_sel = Selector::parse("a[href]").unwrap();
    let link_h3_sel = Selector::parse("h3").unwrap();
    let summary_sel = Selector::parse("div.newsletter-html").unwrap();

    let mut articles: Vec<Article> = Vec::new();

    for section in document.select(&section_sel) {
        // Get category from the section's first h3
        let category = section
            .select(&h3_sel)
            .next()
            .map(|h| h.text().collect::<String>())
            .map(|t| map_section_to_category(t.trim()))
            .unwrap_or_else(|| "General".to_string());

        for article_el in section.select(&article_sel) {
            // Get the first link in the article
            let Some(link) = article_el.select(&link_sel).next() else {
                continue;
            };
            let href = link.value().attr("href").unwrap_or("").to_string();

            // Title: prefer h3 inside the link, fall back to link text
            let raw_title: String = link
                .select(&link_h3_sel)
                .next()
                .map(|h| h.text().collect())
                .unwrap_or_else(|| link.text().collect::<Vec<_>>().join(" "));
            let raw_title = raw_title.trim().to_string();

            if should_skip(&href, &raw_title) {
                continue;
            }

            let href = strip_utm_params(&href);
            let title = strip_minute_read(&raw_title);

            // Summary from div.newsletter-html
            let summary = article_el
                .select(&summary_sel)
                .next()
                .map(|div| {
                    let text: String = div.text().collect();
                    let text = text.trim().to_string();
                    if text.len() > 380 {
                        text.chars().take(380).collect()
                    } else {
                        text
                    }
                })
                .unwrap_or_default();

            // Skip if summary is spam
            let summary_lower = summary.to_lowercase();
            if SKIP_TERMS.iter().any(|t| summary_lower.contains(t)) {
                continue;
            }

            let tags = assign_tags(&title, &summary);

            articles.push(Article {
                title,
                summary,
                url: href,
                category: category.clone(),
                tags,
            });
        }
    }

    if articles.len() < 3 {
        return None;
    }

    // Headline from <title> tag
    let title_sel = Selector::parse("title").unwrap();
    let date_str = date.format("%Y-%m-%d").to_string();
    let headline = document
        .select(&title_sel)
        .next()
        .map(|t| t.text().collect::<String>().trim().to_string())
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| format!("{} — {}", feed_display(feed_id), date_str));

    Some(Issue {
        feed: feed_display(feed_id).to_string(),
        date: date_str,
        headline,
        articles,
    })
}

fn feed_display(feed_id: &str) -> &'static str {
    match feed_id {
        "dev" => "TLDR Dev",
        "ai" => "TLDR AI",
        "tech" => "TLDR Tech",
        _ => "TLDR",
    }
}

pub fn last_n_weekdays(n: usize) -> Vec<NaiveDate> {
    let today = Utc::now().date_naive();
    let mut days = Vec::new();
    let mut current = today;
    while days.len() < n {
        match current.weekday() {
            Weekday::Sat | Weekday::Sun => {}
            _ => days.push(current),
        }
        current -= Duration::days(1);
    }
    days
}

pub async fn fetch_feed(client: &Client, feed_id: &str) -> Result<Issue, String> {
    for date in last_n_weekdays(7) {
        if let Some(issue) = scrape_issue(client, feed_id, &date).await {
            return Ok(issue);
        }
    }
    Err(format!("No valid issue found for feed '{}'", feed_id))
}

pub async fn fetch_feed_for_date(
    client: &Client,
    feed_id: &str,
    date_str: &str,
) -> Result<Issue, String> {
    let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
        .map_err(|_| format!("Invalid date '{}'", date_str))?;
    scrape_issue(client, feed_id, &date)
        .await
        .ok_or_else(|| format!("No issue found for {} on {}", feed_id, date_str))
}
