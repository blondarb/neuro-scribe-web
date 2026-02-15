# Neuro Scribe — Makefile
# Single entry point for all common operations.
# Run `make help` to see available commands.

.PHONY: help dev dev-client dev-all test lint build clean setup sync \
        db-up db-migrate db-generate db-seed \
        docker-up docker-down docker-build smoke security phi-scan token \
        test-integration test-unit

# ─── Configuration ───────────────────────────────────────────────────────────

SHELL := /bin/bash
PROJECT_DIR := $(shell pwd)
DATA_DIR := $(PROJECT_DIR)/data
NEURO_PLANS_DIR := $(shell dirname $(PROJECT_DIR))

# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# ─── Help ────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@echo ""
	@echo "$(CYAN)Neuro Scribe$(RESET) — Development Commands"
	@echo ""
	@echo "$(GREEN)Setup:$(RESET)"
	@grep -E '^(setup|sync|db-).*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  $(CYAN)make %-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Development:$(RESET)"
	@grep -E '^(dev|test|lint|build|clean|token).*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  $(CYAN)make %-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Docker:$(RESET)"
	@grep -E '^docker-.*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  $(CYAN)make %-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Quality & Security:$(RESET)"
	@grep -E '^(smoke|security|phi-).*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  $(CYAN)make %-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─── Setup ───────────────────────────────────────────────────────────────────

setup: ## First-time setup: install deps, sync KB, create env file
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	npm install
	@echo "$(CYAN)Syncing knowledge base...$(RESET)"
	$(MAKE) sync
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)Created .env from template — edit it with your API keys:$(RESET)"; \
		echo "  DEEPGRAM_API_KEY, ANTHROPIC_API_KEY, JWT_SECRET, ENCRYPTION_KEY"; \
	fi
	@echo ""
	@echo "$(GREEN)Setup complete!$(RESET)"
	@echo ""
	@echo "$(CYAN)Next steps:$(RESET)"
	@echo "  1. Edit .env with your API keys"
	@echo "  2. make db-up        (start PostgreSQL)"
	@echo "  3. make db-migrate   (create tables)"
	@echo "  4. make dev-all      (start API + frontend)"
	@echo "  5. make token        (get a dev JWT for testing)"

sync: ## Sync plans.json + medications.json from neuro-plans
	@mkdir -p $(DATA_DIR)
	@if [ -f "$(NEURO_PLANS_DIR)/docs/data/plans.json" ]; then \
		cp "$(NEURO_PLANS_DIR)/docs/data/plans.json" "$(DATA_DIR)/plans.json"; \
		cp "$(NEURO_PLANS_DIR)/docs/data/medications.json" "$(DATA_DIR)/medications.json"; \
		echo "$(GREEN)Synced plans.json + medications.json$(RESET)"; \
	elif [ -f scripts/sync-knowledge.sh ]; then \
		bash scripts/sync-knowledge.sh "$(NEURO_PLANS_DIR)"; \
	else \
		echo "$(YELLOW)No data source found — place plans.json and medications.json in $(DATA_DIR)$(RESET)"; \
	fi

# ─── Database ────────────────────────────────────────────────────────────────

db-up: ## Start PostgreSQL (Docker)
	docker compose -f docker/docker-compose.yml up postgres -d
	@echo "$(GREEN)PostgreSQL running on localhost:5432$(RESET)"

db-migrate: ## Run database migrations (tables + enums)
	npm run db:migrate

db-generate: ## Regenerate migration SQL from schema changes
	npm run db:generate

db-seed: ## Seed database with synthetic test data
	@if [ -f scripts/seed.ts ]; then \
		npx tsx scripts/seed.ts; \
	else \
		echo "$(YELLOW)No seed script found$(RESET)"; \
	fi
	@echo "$(GREEN)Database seeded$(RESET)"

# ─── Development ─────────────────────────────────────────────────────────────

dev: ## Start API server (auto-reload)
	npm run dev

dev-client: ## Start frontend dev server (Vite, port 5173)
	npm run dev:client

dev-all: ## Start API + frontend in parallel
	@echo "$(CYAN)Starting API server on :3000 and frontend on :5173$(RESET)"
	@npm run dev & npm run dev:client & wait

test: ## Run all tests
	npx vitest run

test-watch: ## Run tests in watch mode
	npx vitest

test-unit: ## Run unit tests only
	npx vitest run tests/unit

test-integration: ## Run integration tests only
	npx vitest run tests/integration

lint: ## Type-check the project
	npm run lint

build: ## Build for production
	npm run build

clean: ## Remove build artifacts and node_modules
	rm -rf dist node_modules coverage .nyc_output

token: ## Generate a dev JWT token for API testing
	@npx tsx scripts/dev-token.ts

# ─── Docker ──────────────────────────────────────────────────────────────────

docker-up: ## Start full stack (app + PostgreSQL)
	docker compose -f docker/docker-compose.yml up --build -d
	@echo "$(GREEN)Stack running — API at http://localhost:3000$(RESET)"

docker-down: ## Stop all containers
	docker compose -f docker/docker-compose.yml down

docker-build: ## Build production Docker image
	docker build -f docker/Dockerfile -t neuro-scribe:latest .

# ─── Quality & Security ─────────────────────────────────────────────────────

smoke: ## Run smoke tests (health check + knowledge service)
	@echo "$(CYAN)Running smoke tests...$(RESET)"
	npx vitest run tests/unit
	@echo "$(GREEN)All smoke tests passed$(RESET)"

security: ## Run security audit + PHI scan
	npm audit --audit-level=high
	@echo "$(CYAN)Checking for PHI leaks...$(RESET)"
	$(MAKE) phi-scan

phi-scan: ## Scan codebase for PHI patterns in logs/errors
	@if [ -f scripts/phi-scan.sh ]; then \
		bash scripts/phi-scan.sh; \
	else \
		echo "$(YELLOW)phi-scan.sh not found — skipping$(RESET)"; \
	fi
