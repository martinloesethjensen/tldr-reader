# TLDR Reader — Claude Code Build Prompt

Build a **TLDR Reader** desktop app: a Rust backend server that scrapes
tldr.tech, and a Tauri 2 desktop app with a React/TypeScript frontend that
talks to it. The app shows the latest issues from TLDR Dev, TLDR AI, and
TLDR Tech with tag-based filtering.

Work through the phases below in order. After each phase, verify the code
compiles and runs before continuing. Do not skip ahead.

---

## Context

- The backend fetches HTML directly from tldr.tech (server-side, no CORS issue).
- Articles are parsed from the HTML using the `scraper` crate.
- Tags are auto-assigned by matching keywords in title + summary text.
- The Tauri frontend calls the local Rust backend over HTTP (localhost).
- No external APIs, no auth, no database — keep it simple.

---

## Monorepo structure to create

```
tldr-reader/
├── backend/          ← Rust axum HTTP server
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── frontend/         ← Tauri 2 app (React + TypeScript + Vite)
│   ├── src-tauri/
│   │   ├── Cargo.toml
│   │   ├── tauri.conf.json
│   │   └── src/
│   │       └── main.rs
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── types.ts
│   │   ├── hooks/
│   │   │   ├── useFeed.ts
│   │   │   └── useReadingList.ts
│   │   └── components/
│   │       ├── FeedTabs.tsx
│   │       ├── TagFilter.tsx
│   │       ├── CategoryFilter.tsx
│   │       ├── ArticleCard.tsx
│   │       └── ReadingListPanel.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## Phase 1 — Rust backend (`backend/`)

### 1.1 Cargo.toml

```toml
[package]
name = "tldr-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
axum        = "0.7"
tokio       = { version = "1", features = ["full"] }
reqwest     = { version = "0.12", features = ["rustls-tls"], default-features = false }
scraper     = "0.19"
serde       = { version = "1", features = ["derive"] }
serde_json  = "1"
tower-http  = { version = "0.5", features = ["cors"] }
chrono      = "0.4"
```

### 1.2 Data types (`src/main.rs`)

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Article {
    pub title:    String,
    pub summary:  String,
    pub url:      String,
    pub category: String,
    pub tags:     Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct Issue {
    pub feed:     String,   // "TLDR Dev" | "TLDR AI" | "TLDR Tech"
    pub date:     String,   // "2026-03-13"
    pub headline: String,   // subtitle of that day's issue
    pub articles: Vec<Article>,
}
```

### 1.3 Feed URL logic

- `dev`  → `https://tldr.tech/dev/{date}`
- `ai`   → `https://tldr.tech/ai/{date}`
- `tech` → `https://tldr.tech/archives/{date_no_dashes}`  e.g. `20260313`

### 1.4 Date iteration

Try the last 7 weekdays (Mon–Fri) in descending order until a valid issue
with ≥ 3 articles is found. Use `chrono` for date arithmetic.

### 1.5 HTML scraper

Use the `scraper` crate. For each `<a href>` element in the parsed HTML:

**Skip the link if:**
- `href` does not start with `http`
- `href` contains `tldr.tech`
- `title` is < 12 chars
- title or href contains any of: `"sponsor"`, `"utm_campaign"`,
  `"advertise.tldr"`, `"subscribe"`, `"privacy"`, `"careers"`,
  `"qawolf"`, `"checkmarx"`, `"svix"`, `"aiven"`, `"serpapi"`,
  `"miro.com"`, `"cdata.com"`

**For each kept link:**
1. Strip the `" (N minute read)"` suffix from the title using string
   manipulation (find last `'('`, check if it contains `"minute read"`).
2. **Summary**: find the `<p>` or `<li>` element that contains this `<a>`,
   then take the `.text()` of the *next sibling* element. Truncate at 380
   chars. Skip if empty or spam.
3. **Category**: scan backwards through the raw HTML string from the
   anchor's byte position for the nearest keyword:
   `"articles"/"tutorial"` → `"Articles & Tutorials"`,
   `"opinion"/"advice"` → `"Opinions & Advice"`,
   `"launch"/"tools"` → `"Launches & Tools"`,
   `"quick"` → `"Quick Links"`,
   `"headline"/"news"` → `"Headlines"`,
   `"deep dive"/"engineering"/"research"` → `"Deep Dives"`,
   `"miscellan"` → `"Misc"`.
   Default to `"General"`.
4. **Tags**: keyword matching over `title + " " + summary`. See tag rules
   in section 1.6.

### 1.6 Tag rules

Implement as a static slice of `(&str, &[&str])` — (tag_name, keywords):

```
("github",      &["github", "git repo"]),
("cli",         &["cli", "command line", "terminal", "shell", "bash"]),
("rust",        &["rust", "cargo", "rustlang"]),
("python",      &["python", "pip", "pypi", "django", "flask", "fastapi"]),
("ai",          &["llm", "gpt", "claude", "gemini", "openai", "anthropic",
                   "language model", "ai agent", "machine learning"]),
("security",    &["security", "vulnerabilit", "exploit", "hack",
                   "breach", "cve", "malicious", "attack"]),
("open source", &["open-source", "open source", "mit license"]),
("cloud",       &["aws", "cloudflare", "kubernetes", "k8s", "docker",
                   "gcp", "azure"]),
("typescript",  &["typescript", "deno", "type-safe"]),
("web",         &["frontend", "react", "vue", "angular", "nextjs",
                   "vercel", "browser"]),
("devops",      &["devops", "ci/cd", "pipeline", "deployment", "infra"]),
("database",    &["database", "postgres", "mysql", "redis", "sqlite",
                   "duckdb"]),
("llm",         &["large language model", "reasoning model", "fine-tun",
                   "rag", "embedding", "benchmark"]),
("mobile",      &["mobile", "ios", "android", "swift", "kotlin",
                   "flutter"]),
("startup",     &["startup", "funding", "seed round", "series a",
                   "valuation", "raises $"]),
("linux",       &["linux", "debian", "ubuntu", "kernel"]),
("performance", &["latency", "throughput", "benchmark", "faster",
                   "optimize"]),
```

Return at most 6 tags per article. Deduplicate.

### 1.7 HTTP routes

Use `axum` with shared `reqwest::Client` state:

```
GET /health          → { "status": "ok", "version": "0.1.0" }
GET /feed/:feed_id   → Issue JSON  (feed_id: dev | ai | tech)
GET /all             → [Issue, Issue, Issue]  (all three, sequential)
```

Add `tower_http::cors::CorsLayer` with `allow_origin(Any)` so the Tauri
webview can call it from `localhost`.

### 1.8 Port

Default port `3737`. Read from `PORT` env var if set.

### 1.9 Verify

```bash
cd backend && cargo build
cargo run &
curl http://localhost:3737/health
curl http://localhost:3737/feed/dev | head -c 500
```

Confirm it returns valid JSON with articles before moving on.

---

## Phase 2 — Tauri app scaffold (`frontend/`)

### 2.1 Create Tauri 2 project

```bash
npm create tauri-app@latest frontend -- \
  --template react-ts \
  --manager npm
cd frontend
npm install
```

### 2.2 Configure Tauri

In `src-tauri/tauri.conf.json`:
- `productName`: `"TLDR Reader"`
- `identifier`: `"dev.martinloeseth.tldr-reader"`
- `windows[0].title`: `"TLDR Reader"`
- `windows[0].width`: `1000`
- `windows[0].height`: `720`
- `windows[0].minWidth`: `700`
- `windows[0].minHeight`: `500`

### 2.3 Tauri Rust side (`src-tauri/src/main.rs`)

Add a single Tauri command that spawns the backend process:

```rust
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::State;

struct BackendProcess(Mutex<Option<Child>>);

#[tauri::command]
fn backend_url() -> String {
    "http://localhost:3737".to_string()
}

fn main() {
    // Spawn the backend binary bundled with the app
    let backend = Command::new("tldr-backend")
        .spawn()
        .ok();

    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(backend)))
        .invoke_handler(tauri::generate_handler![backend_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Note: for development, the backend is run separately. For production builds,
bundle the backend binary as a sidecar in `tauri.conf.json`.

### 2.4 Install frontend dependencies

```bash
npm install
```

No extra UI libraries — use plain CSS modules or inline styles only.
Fonts: load `JetBrains Mono` and `DM Sans` from Google Fonts via a `<link>`
in `index.html`.

---

## Phase 3 — Frontend types and API layer

### 3.1 `src/types.ts`

```typescript
export interface Article {
  title:    string;
  summary:  string;
  url:      string;
  category: string;
  tags:     string[];
}

export interface Issue {
  feed:     string;
  date:     string;
  headline: string;
  articles: Article[];
}

export type FeedId = 'dev' | 'ai' | 'tech';

export interface FeedMeta {
  id:     FeedId;
  label:  string;
  emoji:  string;
  accent: string;
}
```

### 3.2 `src/api.ts`

```typescript
const BASE = 'http://localhost:3737';

export async function fetchFeed(feedId: string): Promise<Issue> {
  const res = await fetch(`${BASE}/feed/${feedId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchAll(): Promise<Issue[]> {
  const res = await fetch(`${BASE}/all`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

### 3.3 `src/hooks/useFeed.ts`

Custom hook that:
- Accepts a `feedId: FeedId`
- Returns `{ issue, loading, error, reload }`
- Caches results in a module-level `Map<FeedId, Issue>` so switching tabs
  does not re-fetch
- Calls `fetchFeed(feedId)` on mount and on `reload()`

### 3.4 Tag color map

```typescript
export const TAG_COLORS: Record<string, string> = {
  github:       '#e879f9',
  cli:          '#fbbf24',
  rust:         '#fb923c',
  python:       '#60a5fa',
  ai:           '#a78bfa',
  security:     '#f87171',
  'open source':'#34d399',
  cloud:        '#38bdf8',
  typescript:   '#93c5fd',
  web:          '#fb923c',
  devops:       '#4ade80',
  database:     '#22d3ee',
  llm:          '#c084fc',
  mobile:       '#fb7185',
  startup:      '#facc15',
  linux:        '#a3e635',
  performance:  '#f0abfc',
};

export function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? '#94a3b8';
}
```

---

## Phase 4 — Frontend components

Use **dark theme** throughout. Background `#07090e`. Text `#dde4ef`.
Accent colours per feed. No UI framework — plain CSS-in-JS via `style` props
or CSS modules. Font stack: `'DM Sans', sans-serif` for body,
`'JetBrains Mono', monospace` for labels/badges/code.

### 4.1 `FeedTabs.tsx`

Props: `feeds: FeedMeta[]`, `active: FeedId`, `loading: Record<FeedId, boolean>`,
`onChange: (id: FeedId) => void`

Render a horizontal row of tab buttons. Active tab has a border and
background tint using its `accent` colour. Loading state shows a small
pulsing dot.

### 4.2 `TagFilter.tsx`

Props: `tags: string[]`, `active: string[]`, `onToggle: (tag: string) => void`,
`onClear: () => void`

Render coloured pill buttons for each tag. Active pills are filled.
Show a `clear` link when any tags are active.

### 4.3 `CategoryFilter.tsx`

Props: `categories: string[]`, `active: string`, `onChange: (cat: string) => void`

Render small rectangular buttons for `['All', ...categories]`.

### 4.4 `ArticleCard.tsx`

Props: `article: Article`, `activeTags: string[]`,
`onTagClick: (tag: string) => void`

Layout:
```
┌─────────────────────────────────────────────────┐
│ [Title linked to url]              [📋] [Category badge] │
│ Summary text (muted, smaller)                   │
│ [tag1] [tag2] [tag3]                            │
└─────────────────────────────────────────────────┘
```

- Title: links open in default browser via `window.__TAURI__.shell.open(url)`
  (or fall back to `window.open` in web mode)
- 📋 copy button: copies `url` to clipboard
- Category badge: colour-coded by category
- Tags: clicking a tag calls `onTagClick` to filter by it
- Hover state: slightly lighter background

### 4.5 `App.tsx`

Wire everything together:

```
<App>
  <header>  tldr.reader  </header>
  <FeedTabs … />
  <issue date + headline>
  <CategoryFilter … />
  <TagFilter … />
  <divider>
  <article count + filter status>
  {filtered articles.map(a => <ArticleCard … />)}
</App>
```

Filtering logic (in `App.tsx`):
- `filteredArticles = issue.articles.filter(a =>`
  `  (activeTags.length === 0 || a.tags.some(t => activeTags.includes(t))) &&`
  `  (catFilter === 'All' || a.category === catFilter)`
  `)`
- Available tags = deduplicated union of all tags from current issue's articles, sorted alphabetically
- Available categories = deduplicated list from current issue's articles

---

## Phase 5 — Reading list (frontend only, local-first)

All state lives in `localStorage`. No backend changes required.

### 5.1 Type additions (`src/types.ts`)

Add to the existing types file:

```typescript
export interface ReadingListEntry {
  url:     string;
  title:   string;
  summary: string;
  feedId:  FeedId;
  date:    string;    // issue date, e.g. "2026-03-13"
  addedAt: string;    // ISO timestamp
  read:    boolean;
}
```

### 5.2 `src/hooks/useReadingList.ts`

- Persists to `localStorage` under the key `"tldr-reading-list"`.
- Load from `localStorage` once on module init (outside the hook, like the
  feed cache) so state survives tab switches without a re-read.
- Returns:

```typescript
interface UseReadingList {
  entries:          ReadingListEntry[];
  add:              (article: Article, feedId: FeedId, date: string) => void;
  remove:           (url: string) => void;
  toggleRead:       (url: string) => void;
  markAllRead:      () => void;
  clearRead:        () => void;   // removes entries where read === true
  isInList:         (url: string) => boolean;
  isRead:           (url: string) => boolean;
  unreadCount:      number;
}
```

- `add` is a no-op if the URL is already present.
- After every mutation, write the full array back to `localStorage` as JSON.

### 5.3 `ArticleCard.tsx` additions

Add four new props:

```typescript
isInReadingList: boolean;
isRead:          boolean;
onToggleReadingList: () => void;
onToggleRead:    () => void;
```

**UI changes:**

Update the card header row to:
```
[Title]   [✓ read]  [🔖 save]  [📋 copy]  [Category badge]
```

- **🔖 save button**: filled/accent-coloured when `isInReadingList`, outline
  when not. Clicking toggles the article in/out of the reading list.
- **✓ read button**: only visible when `isInReadingList === true`. Filled
  when `isRead`, outline when unread. Clicking calls `onToggleRead`.
- Cards where `isRead === true` render at **50% opacity** with the title
  in a slightly muted colour. The rest of the layout is unchanged.

### 5.4 `src/components/ReadingListPanel.tsx`

Rendered in place of the article list when the active tab is
`'reading-list'`. Props:

```typescript
interface ReadingListPanelProps {
  entries:      ReadingListEntry[];
  onRemove:     (url: string) => void;
  onToggleRead: (url: string) => void;
  onMarkAllRead:() => void;
  onClearRead:  () => void;
}
```

Layout:

```
[N unread · N total]              [mark all read]  [clear read]
──────────────────────────────────────────────────────────────
{entries sorted by addedAt desc, unread first}
  → each entry rendered as an ArticleCard (read-only tag filter,
    isInReadingList=true, onToggleReadingList=remove)
──────────────────────────────────────────────────────────────
Empty state: "your reading list is empty · start saving articles with 🔖"
```

Tags and category badges in this panel are display-only (clicking a tag
does nothing — no feed context to filter into).

### 5.5 `FeedTabs.tsx` additions

Add a 4th tab entry:

```typescript
{ id: 'reading-list', label: 'Saved', emoji: '🔖', accent: '#94a3b8' }
```

The `FeedId` type does **not** need to change — use a union:

```typescript
export type ActiveTab = FeedId | 'reading-list';
```

Show a small numeric badge on the Saved tab when `unreadCount > 0`.

### 5.6 `App.tsx` additions

- Replace `active: FeedId` state with `activeTab: ActiveTab`.
- Pass `useReadingList()` results down to every `<ArticleCard>` in the feed
  views and into `<ReadingListPanel>`.
- When `activeTab === 'reading-list'`, render `<ReadingListPanel>` instead
  of the feed content area. Hide `CategoryFilter`, `TagFilter`, and the
  issue date/headline row.
- Keyboard shortcut `4` → switch to Saved tab (add to Phase 6.5 list).

### 5.7 Smoke tests

- [x] Clicking 🔖 on an article card saves it; icon changes to filled
- [x] Clicking 🔖 again removes it
- [x] Saved tab shows the correct unread badge count
- [x] Opening Saved tab lists saved articles, newest first
- [x] ✓ button marks an article read; card dims to 50% opacity
- [x] ✓ button on a read article marks it unread again
- [x] "mark all read" dims every card in the panel
- [x] "clear read" removes only read articles from the list
- [x] Closing and reopening the app restores the reading list from localStorage
- [x] Saving the same article twice does not create a duplicate

---

## Phase 6 — Integration & dev run

### 6.1 Start backend in one terminal

```bash
cd backend && cargo run
```

### 6.2 Start Tauri dev in another

```bash
cd frontend && npm run tauri dev
```

### 6.3 Smoke tests

- [x] App window opens, TLDR Dev loads automatically
- [x] Switching to TLDR AI and TLDR Tech fetches their issues
- [x] Clicking a tag pill filters the article list
- [x] Clicking the same tag again deselects it
- [x] Clicking a tag on an article card filters by that tag
- [x] "clear" button resets tag filter
- [x] Category filter works independently and combines with tag filter
- [x] Article titles open in the system browser (not in the Tauri webview)
- [x] Copy button copies the article URL to clipboard

---

## Phase 7 — Polish

### 7.1 Loading states
Show a spinner (pure CSS, no library) centred in the article area while
fetching. Use the active feed's accent colour.

### 7.2 Error state
Show a styled error box if the backend returns an error or is unreachable.
Include a **Retry** button that calls `reload()`.

### 7.3 Empty filter state
If active filters produce zero results, show:
`"no articles match · [clear filters]"`

### 7.4 Refresh button
Add a circular arrow button in the header that:
- Clears the cache entry for the active feed
- Re-fetches it
- Pulses/rotates while loading

### 7.5 Keyboard shortcuts
- `1` / `2` / `3` → switch to Dev / AI / Tech feed
- `4` → switch to Saved (reading list) tab
- `Escape` → clear all active tag filters
- `R` → refresh active feed

### 7.6 Window title
Update the Tauri window title to `"TLDR Reader — {feed label} · {date}"`
when an issue loads, using `appWindow.setTitle(...)`.

---

## Phase 8 — Production build (optional)

### 8.1 Bundle the backend as a Tauri sidecar

In `src-tauri/tauri.conf.json`, add:
```json
"bundle": {
  "externalBin": ["../backend/target/release/tldr-backend"]
}
```

Update `src-tauri/src/main.rs` to use `tauri::api::process::Command` for the
sidecar instead of `std::process::Command`.

### 8.2 Build

```bash
cd backend && cargo build --release
cd frontend && npm run tauri build
```

The output is a platform-native installer in
`frontend/src-tauri/target/release/bundle/`.

---

## Constraints & notes

- **Rust edition**: 2021
- **Tauri version**: 2.x
- **No external CSS frameworks** (no Tailwind, no MUI, no Bootstrap)
- **No state management library** (no Redux, no Zustand) — React `useState`
  and the `useFeed` hook are sufficient
- **No database** — in-memory cache only
- **No auth** — the backend listens on localhost only
- Keep each file focused and small. Split logic into modules if `main.rs`
  exceeds ~200 lines.
- Add `// PHASE N` comments at the top of each file indicating which phase
  created it.
- After each phase, run the relevant build command and fix any compiler
  errors before proceeding.
