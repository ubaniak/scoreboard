SHELL := /usr/bin/env bash
SCRIPTS := scripts
NUM ?= 5
WAIT ?= 2000
LIMIT ?= 50
DEPTH ?= 3
FORMATS ?= markdown

.PHONY: help setup run search scrape crawl pipeline check clean

help:
	@echo "Targets:"
	@echo "  make setup                          Check deps + API keys, chmod scripts"
	@echo "  make run Q='your query'             Default: search-and-scrape pipeline"
	@echo "  make search Q='your query' [NUM=10]"
	@echo "  make scrape URL=https://... [WAIT=2000] [FORMATS=markdown,links]"
	@echo "  make crawl URL=https://... [LIMIT=50] [DEPTH=3] [INCLUDE=regex] [EXCLUDE=regex]"
	@echo "  make pipeline Q='your query' [NUM=5]"
	@echo "  make check                          Verify env vars set"
	@echo "  make clean                          Remove /tmp/scrape-*.json cache"

setup:
	@echo "==> deps"
	@command -v curl >/dev/null || { echo "missing: curl"; exit 1; }
	@command -v jq   >/dev/null || { echo "missing: jq (brew install jq)"; exit 1; }
	@echo "    curl $$(curl --version | head -1 | awk '{print $$2}')"
	@echo "    jq   $$(jq --version)"
	@echo "==> scripts"
	@chmod +x $(SCRIPTS)/*.sh
	@ls $(SCRIPTS)/*.sh
	@echo "==> env"
	@$(MAKE) -s check || echo "    set keys then re-run: export EXA_API_KEY=... FIRECRAWL_API_KEY=..."
	@echo "==> ready"

check:
	@[ -n "$$EXA_API_KEY" ]       && echo "    EXA_API_KEY       set" || { echo "    EXA_API_KEY       MISSING"; exit 1; }
	@[ -n "$$FIRECRAWL_API_KEY" ] && echo "    FIRECRAWL_API_KEY set" || { echo "    FIRECRAWL_API_KEY MISSING"; exit 1; }

run: pipeline

pipeline:
	@[ -n "$(Q)" ] || { echo "usage: make pipeline Q='your query' [NUM=5]"; exit 1; }
	@$(SCRIPTS)/search_and_scrape.sh "$(Q)" $(NUM)

search:
	@[ -n "$(Q)" ] || { echo "usage: make search Q='your query' [NUM=10]"; exit 1; }
	@$(SCRIPTS)/exa_search.sh "$(Q)" $(NUM)

scrape:
	@[ -n "$(URL)" ] || { echo "usage: make scrape URL=https://... [WAIT=2000] [FORMATS=markdown]"; exit 1; }
	@$(SCRIPTS)/firecrawl_scrape.sh "$(URL)" $(WAIT) "$(FORMATS)"

crawl:
	@[ -n "$(URL)" ] || { echo "usage: make crawl URL=https://... [LIMIT=50] [DEPTH=3] [INCLUDE=regex] [EXCLUDE=regex]"; exit 1; }
	@$(SCRIPTS)/firecrawl_crawl.sh "$(URL)" $(LIMIT) $(DEPTH) "$(INCLUDE)" "$(EXCLUDE)"

clean:
	@rm -f /tmp/scrape-*.json
	@echo "cleared /tmp/scrape-*.json"
