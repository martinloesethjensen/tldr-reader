use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Article {
    pub title: String,
    pub summary: String,
    pub url: String,
    pub category: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct Issue {
    pub feed: String,
    pub date: String,
    pub headline: String,
    pub articles: Vec<Article>,
}
