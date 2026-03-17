.PHONY: backend frontend dev build

TARGET := $(shell rustc --print host-tuple)

# Standalone backend (no Tauri)
backend:
	cargo run -p tldr-backend

# Ensure the backend binary exists under target/release/ with the target-triple
# name that Tauri's externalBin validator expects at every build.
.ensure-binary:
	cargo build -p tldr-backend
	@mkdir -p target/release
	@cp target/debug/tldr-backend "target/release/tldr-backend-$(TARGET)"

# Tauri dev frontend only (backend must already be running separately)
frontend: .ensure-binary
	cd frontend && npm run tauri dev

# Start both backend and Tauri frontend together
dev: .ensure-binary
	target/debug/tldr-backend &
	cd frontend && npm run tauri dev

# Phase 8: production build
# Produces a native installer in frontend/src-tauri/target/release/bundle/
build:
	cargo build --release -p tldr-backend
	cp target/release/tldr-backend "target/release/tldr-backend-$(TARGET)"
	cd frontend && npm run tauri build
