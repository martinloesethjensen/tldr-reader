# Cross-Platform Plan

Target: macOS (DMG), iOS (IPA), Windows (EXE), Linux (AppImage), and Web — all built and uploaded to GitHub Releases on a `v*` tag push.

---

## Architecture overview

The current app has a split architecture: a Rust axum sidecar runs locally and the Tauri webview calls it over `localhost:3737`. This works perfectly for desktop but is not viable for mobile or web targets where a sidecar process cannot run.

**Strategy per target:**

| Target | Shell | Backend |
|---|---|---|
| macOS | Tauri 2 | Sidecar (current) |
| Windows / Linux | Tauri 2 | Sidecar (current) |
| iOS / Android | Tauri 2 mobile | Remote API |
| Web | Vite static site | Remote API |

Mobile and web targets share a deployed backend, while desktop bundles the backend locally as today.

---

## Phase 1 — Platform abstraction layer

**Goal:** isolate every Tauri-specific call behind a thin shim so the same frontend code compiles for all targets.

### 1.1 `src/lib/platform.ts`

Replace direct Tauri API imports with a shim that detects the runtime:

```ts
// src/lib/platform.ts
import { isTauri } from '@tauri-apps/api/core';

export async function openExternal(url: string) {
  if (await isTauri()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    return openUrl(url);
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function setWindowTitle(title: string) {
  if (await isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    return getCurrentWindow().setTitle(title).catch(() => {});
  }
  document.title = title;
}
```

- Update `ArticleCard.tsx` to use `openExternal`
- Update `App.tsx` to use `setWindowTitle`

### 1.2 Configurable API base URL

`api.ts` hard-codes `localhost:3737`. Replace it with a build-time env var:

```ts
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3737';
```

- Desktop builds: leave `VITE_API_BASE` unset (defaults to localhost sidecar)
- Web / mobile builds: set `VITE_API_BASE=https://api.yourdomain.com` in CI

---

## Phase 2 — Deploy backend as a web service

Mobile and web need a publicly accessible backend. The existing axum server requires no changes — just deploy it.

### Options (pick one)

| Option | Effort | Cost |
|---|---|---|
| Fly.io / Railway / Render | Low — push a `Dockerfile` | Free tier available |
| VPS (e.g. Hetzner) | Medium | ~€4/mo |
| Cloudflare Workers (rewrite in WASM) | High | Free |

### Minimal `Dockerfile`

```dockerfile
FROM rust:1.77-slim AS builder
WORKDIR /app
COPY . .
RUN cargo build --release -p tldr-backend

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/tldr-backend /usr/local/bin/tldr-backend
EXPOSE 3737
CMD ["tldr-backend"]
```

### CORS

Add `tower-http` CORS middleware to `backend/src/main.rs` to allow requests from the web app origin:

```rust
use tower_http::cors::{CorsLayer, Any};

let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any);

let app = Router::new()
    // ...routes...
    .layer(cors);
```

---

## Phase 3 — Web target

### Build

```bash
cd frontend
VITE_API_BASE=https://api.yourdomain.com npm run build
# Output: frontend/dist/ — deploy to any static host
```

No Tauri involved. The Tauri plugin imports are dynamic (Phase 1), so they are never evaluated in the browser.

### Hosting options

- **GitHub Pages** — free, built-in to the repo
- **Vercel / Netlify** — free, automatic deploy on push
- **Self-hosted** — serve `dist/` with nginx

---

## Phase 4 — Desktop: Windows and Linux

Tauri already targets Windows and Linux — the only gap is CI.

### Required CI changes

- Add `windows-latest` and `ubuntu-latest` runners alongside `macos-latest`
- Windows: produces `.exe` (NSIS installer) and/or `.msi`
- Linux: produces `.AppImage` and/or `.deb`
- Sidecar binary must be cross-compiled or built natively on each runner

**Cross-compilation note:** The simplest approach is to build the backend natively on each runner (same OS as the Tauri build). Add a matrix strategy:

```yaml
strategy:
  matrix:
    include:
      - os: macos-latest
        bundle_args: --bundles dmg
        artifact_glob: '**/*.dmg'
      - os: windows-latest
        bundle_args: --bundles nsis
        artifact_glob: '**/*.exe'
      - os: ubuntu-latest
        bundle_args: --bundles appimage
        artifact_glob: '**/*.AppImage'
```

---

## Phase 5 — iOS (IPA)

Tauri 2 supports iOS via `tauri ios`. Requires Xcode and an Apple Developer account.

### One-time setup (local)

```bash
cd frontend
npx tauri ios init
# Follow prompts — sets up Xcode project under src-tauri/gen/apple
```

Commit the generated `src-tauri/gen/apple/` directory.

### Signing requirements (CI)

Store the following as GitHub Actions secrets:

| Secret | Description |
|---|---|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` distribution certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12` |
| `APPLE_PROVISIONING_PROFILE` | Base64-encoded `.mobileprovision` |
| `APPLE_TEAM_ID` | Apple Developer team ID |

### Build (CI)

```bash
# Install the iOS target
rustup target add aarch64-apple-ios

# Build
npx tauri ios build --export-method app-store-connect
# or --export-method ad-hoc for direct distribution
```

Output: `.ipa` file under `src-tauri/gen/apple/build/`.

### Backend for iOS

The iOS app calls the remote backend (Phase 2). Set `VITE_API_BASE` to the deployed URL at build time. No sidecar — remove `externalBin` from `tauri.conf.json` for the iOS target (use a platform-specific config override).

---

## Phase 6 — Android (APK / AAB)

Similar to iOS but using Android tooling. Lower priority — list for completeness.

### One-time setup (local)

```bash
npx tauri android init
```

### Signing requirements (CI)

| Secret | Description |
|---|---|
| `ANDROID_KEYSTORE` | Base64-encoded `.jks` keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

### Build (CI)

```bash
rustup target add aarch64-linux-android
npx tauri android build
```

---

## Phase 7 — Unified release workflow

Replace the current single-job `release.yml` with a multi-job workflow.

### Structure

```
release.yml
├── build-macos        → uploads .dmg
├── build-windows      → uploads .exe
├── build-linux        → uploads .AppImage
├── build-ios          → uploads .ipa
├── build-android      → uploads .apk / .aab
└── deploy-web         → deploys dist/ to static host
```

All jobs trigger on `v*` tags. Each uploads its artifact to the same GitHub Release using `softprops/action-gh-release` or `tauri-action`'s built-in upload.

### Sketch

```yaml
jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - # ... build backend sidecar, run tauri-action --bundles dmg

  build-windows:
    runs-on: windows-latest
    steps:
      - # ... build backend sidecar, run tauri-action --bundles nsis

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - # ... build backend sidecar, run tauri-action --bundles appimage

  build-ios:
    runs-on: macos-latest
    steps:
      - # ... install certs, run tauri ios build, upload .ipa

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - # ... npm run build with VITE_API_BASE set, deploy dist/
```

---

## Recommended sequence

1. **Phase 1** — platform shim + env-var API base (unblocks everything else, low risk)
2. **Phase 2** — deploy backend (prerequisite for web and mobile)
3. **Phase 3** — web build + CI deploy (quick win, no new tooling)
4. **Phase 4** — Windows + Linux CI (Tauri already supports these, mostly CI config)
5. **Phase 5** — iOS (most involved: Xcode project, certificates, App Store setup)
6. **Phase 6** — Android (similar complexity to iOS)
7. **Phase 7** — unify the release workflow

Phases 1–4 can be done without an Apple Developer account. Phase 5 requires one ($99/year).
