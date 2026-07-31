#!/usr/bin/env bash
# Firecrawl single-page scrape. JS-rendered.
# Usage: firecrawl_scrape.sh URL [waitMs=2000] [formats=markdown]
#   firecrawl_scrape.sh https://example.com
#   firecrawl_scrape.sh https://spa.example.com 5000 "markdown,links"
# Output: JSON to stdout.

set -euo pipefail

if [ -z "${FIRECRAWL_API_KEY:-}" ]; then
  echo "ERROR: FIRECRAWL_API_KEY not set" >&2
  exit 1
fi

URL="${1:?usage: firecrawl_scrape.sh URL [waitMs] [formats]}"
WAIT="${2:-2000}"
FORMATS_CSV="${3:-markdown}"

FORMATS_JSON=$(printf '%s' "$FORMATS_CSV" | jq -Rc 'split(",") | map(gsub("^\\s+|\\s+$"; ""))')

PAYLOAD=$(cat <<EOF
{
  "url": $(printf '%s' "$URL" | jq -Rs .),
  "formats": $FORMATS_JSON,
  "onlyMainContent": true,
  "waitFor": $WAIT,
  "timeout": 60000
}
EOF
)

curl -sS --retry 3 --retry-delay 2 --retry-on-http-error 429,500,502,503 \
  https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
