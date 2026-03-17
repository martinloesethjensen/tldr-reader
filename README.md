# TLDR Reader

A macOS desktop app for reading [tldr.tech](https://tldr.tech) newsletters — TLDR Dev, TLDR AI, and TLDR Tech — without ads, tracking links, or sponsor noise.

## Features

- Reads TLDR Dev, TLDR AI, and TLDR Tech
- Tag and category filtering
- Date navigation to browse past issues
- Reading list with read/unread tracking
- Sponsor links removed, UTM tracking stripped from all URLs
- In-memory cache — instant tab switching after first load

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app) |
| Frontend | React 19 + TypeScript + Vite |
| Backend | Rust ([axum](https://github.com/tokio-rs/axum)) |
| Scraping | [`scraper`](https://crates.io/crates/scraper) (HTML), [`reqwest`](https://crates.io/crates/reqwest) (HTTP) |
| Styling | Inline styles, no CSS framework |

The Rust backend runs as a sidecar process bundled inside the app. It scrapes tldr.tech server-side (no CORS issues) and serves parsed articles over a local HTTP API on port `3737`. The Tauri frontend calls that API from the webview.

## Development

**Requirements:** Rust, Node.js ≥ 18, [Tauri prerequisites](https://tauri.app/start/prerequisites/)

```bash
# Start the backend
cd backend && cargo run

# Start the Tauri dev app (in a second terminal)
cd frontend && npm install && npm run tauri dev
```

## Build

```bash
cd backend && cargo build --release
cd frontend && npm run tauri build
```

The installer is output to `frontend/src-tauri/target/release/bundle/`.
