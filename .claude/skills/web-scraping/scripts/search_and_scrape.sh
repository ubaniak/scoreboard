#!/usr/bin/env bash
# Pipeline: Exa search -> Firecrawl batch scrape of top results.
# Usage: search_and_scrape.sh "query" [numResults=5]
#   search_and_scrape.sh "rust error handling" 5
# Output: JSON { query, results: [{ url, title, score, markdown }] } to stdout.

set -euo pipefail

if [ -z "${EXA_API_KEY:-}" ] || [ -z "${FIRECRAWL_API_KEY:-}" ]; then
  echo "ERROR: need EXA_API_KEY and FIRECRAWL_API_KEY" >&2
  exit 1
fi

QUERY="${1:?usage: search_and_scrape.sh \"query\" [numResults]}"
NUM="${2:-5}"

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "1/2 Exa search: \"$QUERY\" (top $NUM)" >&2
SEARCH=$("$DIR/exa_search.sh" "$QUERY" "$NUM" neural false)

URLS=$(printf '%s' "$SEARCH" | jq -r '.results[].url')
URLS_JSON=$(printf '%s' "$SEARCH" | jq '[.results[].url]')

echo "2/2 Firecrawl batch scrape" >&2
BATCH=$(curl -sS https://api.firecrawl.dev/v1/batch/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --argjson urls "$URLS_JSON" '{urls: $urls, formats: ["markdown"], onlyMainContent: true}')")

JOB_ID=$(printf '%s' "$BATCH" | jq -r '.id // empty')
if [ -z "$JOB_ID" ]; then
  echo "ERROR: no batch id. response: $BATCH" >&2
  exit 1
fi

while true; do
  RESP=$(curl -sS "https://api.firecrawl.dev/v1/batch/scrape/$JOB_ID" \
    -H "Authorization: Bearer $FIRECRAWL_API_KEY")
  STATUS=$(printf '%s' "$RESP" | jq -r '.status // "unknown"')
  echo "  batch status=$STATUS" >&2
  case "$STATUS" in
    completed) break ;;
    failed|cancelled) echo "ERROR: batch $STATUS" >&2; printf '%s' "$RESP"; exit 1 ;;
    *) sleep 5 ;;
  esac
done

# Merge: Exa metadata + Firecrawl markdown, joined by URL.
jq -n \
  --arg query "$QUERY" \
  --argjson search "$SEARCH" \
  --argjson batch "$RESP" \
  '{
     query: $query,
     results: ($search.results | map(
       . as $r
       | ($batch.data // [] | map(select(.metadata.sourceURL == $r.url)) | first) as $b
       | {
           url: $r.url,
           title: $r.title,
           score: $r.score,
           publishedDate: $r.publishedDate,
           markdown: ($b.markdown // null)
         }
     ))
   }'
