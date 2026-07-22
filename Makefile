.PHONY: help install dev build test typecheck clean \
        deploy-worker deploy-pages deploy-all \
        worker-whoami worker-tail worker-dev \
        pages-list pages-prod

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
# Cloudflare Pages project name (must already exist; create with `make pages-init`).
PAGES_PROJECT  ?= feedpop
PAGES_BRANCH   ?= main

# Cloudflare Worker name (matches worker/wrangler.toml).
WORKER_NAME    ?= rss-feed-proxy
WORKER_DIR     := worker
WORKER_SRC     := $(WORKER_DIR)/src/index.ts

# Frontend build output (Vite default).
DIST_DIR       := dist

# The deployed worker URL. Override at build time:
#   make build PROXY_URL=https://rss-feed-proxy.<sub>.workers.dev
# If unset, the app falls back to the relative /api/feed path (works only when
# the page and proxy share an origin, e.g. a Pages Function).
PROXY_URL      ?= https://rss-feed-proxy.howgreatfn.workers.dev

# Package manager detection: bun > pnpm > npm.
PKG            := $(shell command -v bun >/dev/null 2>&1 && echo bun || (command -v pnpm >/dev/null 2>&1 && echo pnpm || echo npm))
WRANGLER       := npx wrangler

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make [target]\n\nTargets:\n"} \
	  /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# -----------------------------------------------------------------------------
# Local development
# -----------------------------------------------------------------------------
install: ## Install dependencies ($(PKG) install)
	$(PKG) install

dev: ## Start Vite dev server (proxy included) at localhost:5173
	$(PKG) run dev

build: ## Build the frontend into $(DIST_DIR) with PROXY_URL baked in
	@if [ -n "$(PROXY_URL)" ]; then \
	  echo ">> Building with VITE_PROXY_URL=$(PROXY_URL)"; \
	else \
	  echo ">> Building with relative /api/feed fallback (VITE_PROXY_URL unset)"; \
	fi
	VITE_PROXY_URL=$(PROXY_URL) $(PKG) run build

test: ## Run the vitest suite
	$(PKG) run test

typecheck: ## Type-check without emitting
	$(PKG) run typecheck

clean: ## Remove build artifacts
	rm -rf $(DIST_DIR) tsconfig.tsbuildinfo

# -----------------------------------------------------------------------------
# Cloudflare Worker (feed proxy)
# -----------------------------------------------------------------------------
worker-whoami: ## Show the authenticated Cloudflare account
	$(WRANGLER) whoami

worker-dev: ## Run the worker locally with wrangler dev
	cd $(WORKER_DIR) && $(WRANGLER) dev

worker-tail: ## Tail live worker logs
	$(WRANGLER) tail $(WORKER_NAME)

deploy-worker: ## Deploy the feed-proxy worker to Cloudflare Workers
	@echo ">> Deploying worker from $(WORKER_DIR)/"
	cd $(WORKER_DIR) && $(WRANGLER) deploy
	@echo ""
	@echo ">> Worker deployed. Update PROXY_URL if the URL changed:"
	@echo "   make build PROXY_URL=https://$(WORKER_NAME).<your-subdomain>.workers.dev"

# -----------------------------------------------------------------------------
# Cloudflare Pages (React frontend)
# -----------------------------------------------------------------------------
pages-list: ## List Cloudflare Pages projects
	$(WRANGLER) pages project list

pages-prod: ## Open the production Pages URL
	@echo ">> https://$(PAGES_PROJECT).pages.dev"

deploy-pages: build ## Build and deploy the frontend to Cloudflare Pages (production branch)
	@echo ">> Deploying $(DIST_DIR)/ to Pages project '$(PAGES_PROJECT)' (branch=$(PAGES_BRANCH))"
	$(WRANGLER) pages deploy $(DIST_DIR) --project-name=$(PAGES_PROJECT) --branch=$(PAGES_BRANCH) --commit-dirty=true
	@echo ""
	@echo ">> Live at: https://$(PAGES_PROJECT).pages.dev"

pages-init: ## Create the Cloudflare Pages project (run once)
	$(WRANGLER) pages project create $(PAGES_PROJECT) --production-branch=$(PAGES_BRANCH)

# -----------------------------------------------------------------------------
# Full deployment (worker + pages)
# -----------------------------------------------------------------------------
deploy-all: deploy-worker deploy-pages ## Deploy worker, then build + deploy frontend
	@echo ""
	@echo "================================================"
	@echo "  Deployment complete"
	@echo "  Worker:  https://$(WORKER_NAME).howgreatfn.workers.dev"
	@echo "  Frontend: https://$(PAGES_PROJECT).pages.dev"
	@echo "================================================"