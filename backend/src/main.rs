// PHASE 1
mod scraper;
mod tags;
mod types;

use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};

#[derive(serde::Deserialize)]
struct FeedDatePath {
    feed_id: String,
    date:    String,
}
use reqwest::Client;
use tower_http::cors::{Any, CorsLayer};

use scraper::{fetch_feed, fetch_feed_for_date};
use types::Issue;

type SharedClient = Arc<Client>;

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "version": "0.1.0" }))
}

async fn feed_handler(
    Path(feed_id): Path<String>,
    State(client): State<SharedClient>,
) -> Result<Json<Issue>, (StatusCode, String)> {
    fetch_feed(&client, &feed_id)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::NOT_FOUND, e))
}

async fn feed_date_handler(
    Path(FeedDatePath { feed_id, date }): Path<FeedDatePath>,
    State(client): State<SharedClient>,
) -> Result<Json<Issue>, (StatusCode, String)> {
    fetch_feed_for_date(&client, &feed_id, &date)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::NOT_FOUND, e))
}

async fn all_handler(
    State(client): State<SharedClient>,
) -> Json<Vec<Issue>> {
    let mut issues = Vec::new();
    for feed_id in ["dev", "ai", "tech"] {
        match fetch_feed(&client, feed_id).await {
            Ok(issue) => issues.push(issue),
            Err(e)    => eprintln!("Error fetching '{}': {}", feed_id, e),
        }
    }
    Json(issues)
}

#[tokio::main]
async fn main() {
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3737);

    let client: SharedClient = Arc::new(
        Client::builder()
            .user_agent("Mozilla/5.0 (compatible; tldr-reader/0.1)")
            .build()
            .expect("Failed to build HTTP client"),
    );

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health))
        .route("/feed/:feed_id", get(feed_handler))
        .route("/feed/:feed_id/:date", get(feed_date_handler))
        .route("/all", get(all_handler))
        .with_state(client)
        .layer(cors);

    let addr = format!("0.0.0.0:{}", port);
    println!("TLDR Backend listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
