# Web Scraping Reference

Detailed API specs for Exa and Firecrawl. SKILL.md covers the overview.

## Exa API

Base: `https://api.exa.ai`
Auth: header `x-api-key: $EXA_API_KEY`

### POST /search

Semantic / neural search.

```bash
curl -s https://api.exa.ai/search \
  -H "x-api-key: $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "transformer architecture interpretability",
    "type": "neural",
    "numResults": 10,
    "contents": { "text": true, "highlights": true }
  }'
```

Key params:

| Param | Notes |
|-------|-------|
| `query` | Natural-language query (works best as a *statement*, not question) |
| `type` | `neural` (semantic), `keyword`, `auto` |
| `numResults` | 1–100 |
| `includeDomains` / `excludeDomains` | Array of domains |
| `startPublishedDate` / `endPublishedDate` | ISO date filter |
| `category` | `company`, `research paper`, `news`, `pdf`, `github`, `tweet`, `personal site`, `linkedin profile`, `financial report` |
| `contents.text` | Inline page text (saves a scrape) |
| `contents.highlights` | Auto-extract relevant snippets |
| `contents.summary` | LLM summary per result |

Response: `{ results: [{ id, url, title, publishedDate, author, score, text? }] }`

### POST /findSimilar

Find pages similar to a URL.

```bash
curl -s https://api.exa.ai/findSimilar \
  -H "x-api-key: $EXA_API_KEY" \
  -d '{ "url": "https://example.com/article", "numResults": 5 }'
```

### POST /contents

Fetch content for known URLs (Exa-side, cheaper than Firecrawl for static pages).

```bash
curl -s https://api.exa.ai/contents \
  -H "x-api-key: $EXA_API_KEY" \
  -d '{ "ids": ["https://example.com/page"], "text": true }'
```

## Firecrawl API

Base: `https://api.firecrawl.dev/v1`
Auth: header `Authorization: Bearer $FIRECRAWL_API_KEY`

### POST /scrape

Single URL, sync. Returns markdown.

```bash
curl -s https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["markdown"],
    "onlyMainContent": true,
    "waitFor": 2000
  }'
```

Key params:

| Param | Notes |
|-------|-------|
| `url` | Target URL |
| `formats` | `markdown`, `html`, `rawHtml`, `links`, `screenshot`, `extract` |
| `onlyMainContent` | Strips nav/footer/ads. Default `true` |
| `waitFor` | ms to wait after load (for JS hydration) |
| `timeout` | ms request timeout. Default 30000 |
| `headers` | Custom request headers |
| `actions` | Array of browser actions: `click`, `scroll`, `wait`, `write`, `press`, `screenshot` |
| `extract.schema` | JSON schema for LLM-structured extraction |
| `extract.prompt` | Extraction prompt |

Response: `{ success, data: { markdown, html?, metadata: { title, description, sourceURL, statusCode } } }`

### POST /crawl

Multi-page, async. Returns job ID.

```bash
# Start
curl -s https://api.firecrawl.dev/v1/crawl \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -d '{
    "url": "https://docs.example.com",
    "limit": 100,
    "maxDepth": 3,
    "includePaths": ["^/docs/.*"],
    "excludePaths": ["^/docs/changelog/.*"],
    "scrapeOptions": { "formats": ["markdown"], "onlyMainContent": true }
  }'
# → { "id": "abc123", "url": "https://api.firecrawl.dev/v1/crawl/abc123" }

# Poll
curl -s https://api.firecrawl.dev/v1/crawl/abc123 \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY"
# → { status: "scraping"|"completed", completed, total, data: [...] }
```

Poll every 5–10s. Don't busy-loop.

### POST /batch/scrape

Many URLs, async. Use instead of looping `/scrape` for >5 URLs.

```bash
curl -s https://api.firecrawl.dev/v1/batch/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -d '{
    "urls": ["https://a.com", "https://b.com"],
    "formats": ["markdown"]
  }'
```

Poll same way as crawl.

### POST /map

Fast URL discovery (no rendering). Returns sitemap-style URL list. Use to plan a crawl.

```bash
curl -s https://api.firecrawl.dev/v1/map \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -d '{ "url": "https://example.com", "search": "pricing" }'
```

## Error handling

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Bad API key | Check env var |
| 402 | Out of credits | Stop, tell user |
| 429 | Rate limited | Retry with backoff (scripts handle) |
| 408 | Scrape timeout | Increase `timeout`, add `waitFor` |
| 500 | Service error | Retry once |

## Decision tree

```
Need URLs?            → Exa /search
Have URLs, static?    → curl OR Exa /contents
Have URLs, JS-heavy?  → Firecrawl /scrape
Need whole site?      → Firecrawl /map → /crawl
Need 5–500 URLs?      → Firecrawl /batch/scrape
Need structured data? → Firecrawl /scrape with extract.schema
```
