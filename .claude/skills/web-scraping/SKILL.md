---
name: web-scraping
description: Web scraping toolkit using Exa for semantic/neural search and Firecrawl for scraping JavaScript-heavy pages. Use when user asks to scrape a website, extract content from URLs, crawl a site, search the web semantically, find pages by meaning rather than keywords, or build a search-then-scrape pipeline. Triggers on "scrape", "crawl", "extract from URL", "search the web", "find articles about", "JS-rendered page", "SPA scraping", Exa, or Firecrawl.
---

# Web Scraping

Two services, one toolkit:

- **Exa** — semantic/neural search. Use to FIND relevant URLs by meaning.
- **Firecrawl** — headless-browser scrape/crawl. Use to EXTRACT content from JS-heavy pages.

## Setup

Requires env vars:

```bash
export EXA_API_KEY=...        # https://dashboard.exa.ai/api-keys
export FIRECRAWL_API_KEY=...  # https://firecrawl.dev/app/api-keys
```

Check before running:

```bash
[ -z "$EXA_API_KEY" ] && echo "missing EXA_API_KEY"
[ -z "$FIRECRAWL_API_KEY" ] && echo "missing FIRECRAWL_API_KEY"
```

## Pick the right tool

| Task | Tool |
|------|------|
| "Find articles about X" | Exa search |
| "Scrape this URL" (static HTML) | curl + parse, OR Firecrawl |
| "Scrape this URL" (SPA / JS-rendered / Cloudflare) | Firecrawl scrape |
| "Crawl whole site / section" | Firecrawl crawl |
| "Find pages about X then extract them" | Exa → Firecrawl pipeline |

Default to Firecrawl when page uses React/Vue/Next.js client rendering, lazy-loads content, or blocks bots. Plain curl wastes a request.

## Quick start

```bash
# Semantic search → top 5 URLs
scripts/exa_search.sh "best practices for rust error handling" 5

# Scrape single JS-heavy page → markdown
scripts/firecrawl_scrape.sh "https://example.com/spa-page"

# Crawl section → array of pages
scripts/firecrawl_crawl.sh "https://docs.example.com" 50

# Pipeline: search then scrape top results
scripts/search_and_scrape.sh "rust error handling" 5
```

All scripts write JSON to stdout. Pipe through `jq` to extract fields.

## Workflows

### Semantic search (Exa)

Use `neural` search type for concept-based queries, `keyword` for exact strings, `auto` to let Exa pick. Include `text: true` to get page text in the result (skips needing Firecrawl for simple cases).

### Single-page scrape (Firecrawl)

`/v1/scrape` endpoint. Returns markdown + metadata. Pass `formats: ["markdown", "html", "links"]` to control output. Use `onlyMainContent: true` to strip nav/footer.

### Multi-page crawl (Firecrawl)

`/v1/crawl` is async — returns job ID, poll `/v1/crawl/{id}` until `status: "completed"`. Limit with `limit` and `maxDepth`. Use `includePaths`/`excludePaths` regex to scope.

### Search-then-scrape pipeline

1. Exa returns ranked URLs.
2. For each URL, hit Firecrawl `/scrape`.
3. Batch via Firecrawl `/v1/batch/scrape` if >5 URLs (single async job).

See [REFERENCE.md](REFERENCE.md) for endpoint details, params, response shapes, and error handling.

## Cost & rate limits

- Exa: ~$0.005/search (neural). Has `numResults` cap (typically 100).
- Firecrawl: scrape = 1 credit, crawl = 1 credit/page. Free tier is small — don't crawl whole sites without checking budget.
- Both rate-limit; scripts include `--retry` on 429.

## Output etiquette

Save raw responses to `/tmp/scrape-<timestamp>.json` for re-use. Don't re-hit APIs to re-parse data already fetched.
