#!/usr/bin/env bash
# Exa semantic search.
# Usage: exa_search.sh "query" [numResults=10] [type=neural] [withText=true]
#   exa_search.sh "rust error handling"
#   exa_search.sh "latest LLM benchmarks" 20 neural true
# Output: JSON to stdout.

set -euo pipefail

if [ -z "${EXA_API_KEY:-}" ]; then
  echo "ERROR: EXA_API_KEY not set" >&2
  exit 1
fi

QUERY="${1:?usage: exa_search.sh \"query\" [numResults] [type] [withText]}"
NUM="${2:-10}"
TYPE="${3:-neural}"
WITH_TEXT="${4:-true}"

PAYLOAD=$(cat <<EOF
{
  "query": $(printf '%s' "$QUERY" | jq -Rs .),
  "type": "$TYPE",
  "numResults": $NUM,
  "contents": { "text": $WITH_TEXT, "highlights": true }
}
EOF
)

curl -sS --retry 3 --retry-delay 2 --retry-on-http-error 429,500,502,503 \
  https://api.exa.ai/search \
  -H "x-api-key: $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
