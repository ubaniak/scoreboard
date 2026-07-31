#!/usr/bin/env bash
# Firecrawl async crawl. Submits job, polls until complete, prints final JSON.
# Usage: firecrawl_crawl.sh URL [limit=50] [maxDepth=3] [includeRegex] [excludeRegex]
#   firecrawl_crawl.sh https://docs.example.com 100 3 '^/docs/.*' '^/docs/changelog/.*'
# Output: final crawl JSON to stdout. Progress to stderr.

set -euo pipefail

if [ -z "${FIRECRAWL_API_KEY:-}" ]; then
  echo "ERROR: FIRECRAWL_API_KEY not set" >&2
  exit 1
fi

URL="${1:?usage: firecrawl_crawl.sh URL [limit] [maxDepth] [includeRegex] [excludeRegex]}"
LIMIT="${2:-50}"
MAX_DEPTH="${3:-3}"
INCLUDE="${4:-}"
EXCLUDE="${5:-}"

INCLUDE_JSON="[]"
EXCLUDE_JSON="[]"
[ -n "$INCLUDE" ] && INCLUDE_JSON=$(printf '%s' "$INCLUDE" | jq -Rs '[.]')
[ -n "$EXCLUDE" ] && EXCLUDE_JSON=$(printf '%s' "$EXCLUDE" | jq -Rs '[.]')

PAYLOAD=$(cat <<EOF
{
  "url": $(printf '%s' "$URL" | jq -Rs .),
  "limit": $LIMIT,
  "maxDepth": $MAX_DEPTH,
  "includePaths": $INCLUDE_JSON,
  "excludePaths": $EXCLUDE_JSON,
  "scrapeOptions": { "formats": ["markdown"], "onlyMainContent": true }
}
EOF
)

START=$(curl -sS https://api.firecrawl.dev/v1/crawl \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

JOB_ID=$(printf '%s' "$START" | jq -r '.id // empty')
if [ -z "$JOB_ID" ]; then
  echo "ERROR: no job id. response: $START" >&2
  exit 1
fi

echo "crawl job: $JOB_ID" >&2

while true; do
  RESP=$(curl -sS "https://api.firecrawl.dev/v1/crawl/$JOB_ID" \
    -H "Authorization: Bearer $FIRECRAWL_API_KEY")
  STATUS=$(printf '%s' "$RESP" | jq -r '.status // "unknown"')
  COMPLETED=$(printf '%s' "$RESP" | jq -r '.completed // 0')
  TOTAL=$(printf '%s' "$RESP" | jq -r '.total // 0')
  echo "  status=$STATUS  $COMPLETED/$TOTAL" >&2

  case "$STATUS" in
    completed) printf '%s' "$RESP"; exit 0 ;;
    failed|cancelled) echo "ERROR: crawl $STATUS" >&2; printf '%s' "$RESP"; exit 1 ;;
    *) sleep 8 ;;
  esac
done
