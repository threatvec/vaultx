# Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
# VAULTX Build System

VERSION   := 1.0.0
BINARY    := vaultx
BUILD_DIR := build/bin
LDFLAGS   := -s -w

.PHONY: dev build build-debug build-win build-linux build-mac build-mac-arm build-all clean lint test vet
.PHONY: release-win release-linux release-mac checksums frontend-install frontend-build frontend-check info
.PHONY: installer portable

# ─── Development ────────────────────────────────────────────────────

dev:
	wails dev

# ─── Standard builds (no obfuscation) ──────────────────────────────

build:
	wails build -clean

build-debug:
	wails build -debug

# ─── Portable .exe (single file, no install) ───────────────────────

portable:
	@echo "Building portable Windows exe..."
	wails build -clean
	@echo "Done: $(BUILD_DIR)/$(BINARY).exe"
	@echo "Portable — double-click to run."

# ─── Production builds (garble obfuscation) ─────────────────────────

build-win:
	@echo "Building Windows amd64 (garble)..."
	GOOS=windows GOARCH=amd64 garble -tiny -literals -seed=random build \
		-ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY)-windows-amd64.exe ./...
	@echo "Done: $(BUILD_DIR)/$(BINARY)-windows-amd64.exe"

build-linux:
	@echo "Building Linux amd64 (garble)..."
	GOOS=linux GOARCH=amd64 garble -tiny -literals -seed=random build \
		-ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY)-linux-amd64 ./...
	@echo "Done: $(BUILD_DIR)/$(BINARY)-linux-amd64"

build-mac:
	@echo "Building macOS amd64 (garble)..."
	GOOS=darwin GOARCH=amd64 garble -tiny -literals -seed=random build \
		-ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY)-macos-amd64 ./...
	@echo "Done: $(BUILD_DIR)/$(BINARY)-macos-amd64"

build-mac-arm:
	@echo "Building macOS arm64 (garble)..."
	GOOS=darwin GOARCH=arm64 garble -tiny -literals -seed=random build \
		-ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY)-macos-arm64 ./...
	@echo "Done: $(BUILD_DIR)/$(BINARY)-macos-arm64"

build-all: build-win build-linux build-mac build-mac-arm
	@echo "All builds completed."

# ─── Wails production builds (includes frontend) ───────────────────

release-win:
	@echo "Building Windows release..."
	wails build -clean -platform windows/amd64
	@echo "Done."

release-linux:
	@echo "Building Linux release..."
	wails build -clean -platform linux/amd64
	@echo "Done."

release-mac:
	@echo "Building macOS release..."
	wails build -clean -platform darwin/universal
	@echo "Done."

# ─── NSIS Installer (requires NSIS installed) ──────────────────────

installer: build
	@echo "Building NSIS installer..."
	@cd build && makensis installer.nsi
	@echo "Done: build/VAULTX-Setup.exe"

# ─── Checksums ──────────────────────────────────────────────────────

checksums:
	@echo "Generating SHA256 checksums..."
	@cd $(BUILD_DIR) && sha256sum * > SHA256SUMS.txt 2>/dev/null || \
		cd $(BUILD_DIR) && shasum -a 256 * > SHA256SUMS.txt
	@echo "Checksums: $(BUILD_DIR)/SHA256SUMS.txt"

# ─── Quality ────────────────────────────────────────────────────────

lint:
	golangci-lint run ./...

test:
	go test -v -race -count=1 ./...

vet:
	go vet ./...

# ─── Cleanup ────────────────────────────────────────────────────────

clean:
	rm -rf $(BUILD_DIR)/
	rm -rf frontend/dist/
	rm -f build/VAULTX-Setup.exe
	@echo "Cleaned build artifacts."

# ─── Frontend only ──────────────────────────────────────────────────

frontend-install:
	cd frontend && npm install --legacy-peer-deps

frontend-build:
	cd frontend && npm run build

frontend-check:
	cd frontend && npx tsc --noEmit

# ─── Info ───────────────────────────────────────────────────────────

info:
	@echo "VAULTX v$(VERSION)"
	@echo "Go:     $$(go version)"
	@echo "Wails:  $$(wails version 2>/dev/null || echo 'not installed')"
	@echo "Garble: $$(garble version 2>/dev/null || echo 'not installed')"
	@echo "NSIS:   $$(makensis /VERSION 2>/dev/null || echo 'not installed')"
	@echo "Node:   $$(node --version 2>/dev/null || echo 'not installed')"
	@echo "npm:    $$(npm --version 2>/dev/null || echo 'not installed')"
