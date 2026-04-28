#!/bin/bash

# Quick upload script for testing affiliations refactor
# Usage: ./quick_upload.sh <token>

set -e

TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  echo "Usage: $0 <token>"
  echo ""
  echo "Get token:"
  echo "curl -X POST http://localhost:8080/api/login -H 'Content-Type: application/json' -d '{\"pin\":\"1234\"}' | jq -r .token"
  exit 1
fi

BASE="http://localhost:8080/api"
HEADER="Authorization: Bearer $TOKEN"

echo "=== Quick Upload Test ==="
echo ""

# Step 1: Upload affiliations
echo "1. Uploading affiliations..."
curl -s -X POST -H "$HEADER" -F "file=@sample_affiliations.csv" "$BASE/affiliations/import" > /dev/null
echo "✓ Done"

# Step 2: Get affiliation IDs
echo "2. Getting affiliation IDs..."
AFFILIATIONS=$(curl -s -H "$HEADER" "$BASE/affiliations")
CLUB_1=$(echo "$AFFILIATIONS" | jq '.[] | select(.type=="club") | .id' | head -1)
PROV_1=$(echo "$AFFILIATIONS" | jq '.[] | select(.type=="province") | .id' | head -1)
NAT_1=$(echo "$AFFILIATIONS" | jq '.[] | select(.type=="nation") | .id' | head -1)

echo "Club ID: $CLUB_1, Province ID: $PROV_1, Nation ID: $NAT_1"
echo ""

# Step 3: Create athletes.csv with real IDs
echo "3. Creating athletes.csv with real IDs..."
cat > /tmp/athletes_import.csv << EOF
name,ageCategory,nationality,clubAffiliationId,provinceAffiliationId,nationAffiliationId
John Smith,elite,Canadian,$CLUB_1,$PROV_1,$NAT_1
Jane Doe,u19,Canadian,$CLUB_1,$PROV_1,$NAT_1
EOF

# Step 4: Upload athletes
echo "4. Uploading athletes..."
curl -s -X POST -H "$HEADER" -F "file=@/tmp/athletes_import.csv" "$BASE/athletes/import" > /dev/null
echo "✓ Done"

# Step 5: Create officials.csv with real IDs
echo "5. Creating officials.csv with real IDs..."
cat > /tmp/officials_import.csv << EOF
name,nationality,gender,yearOfBirth,registrationNumber,provinceAffiliationId,nationAffiliationId
James Brown,Canadian,M,1980,OFF001,$PROV_1,$NAT_1
Patricia Davis,Canadian,F,1985,OFF002,$PROV_1,$NAT_1
EOF

# Step 6: Upload officials
echo "6. Uploading officials..."
curl -s -X POST -H "$HEADER" -F "file=@/tmp/officials_import.csv" "$BASE/officials/import" > /dev/null
echo "✓ Done"

echo ""
echo "=== Verification ==="
echo ""

# Verify affiliations
echo "Affiliations:"
curl -s -H "$HEADER" "$BASE/affiliations" | jq 'map({id, name, type})'
echo ""

# Verify athletes
echo "Athletes:"
curl -s -H "$HEADER" "$BASE/athletes" | jq '.[0] | {name, clubAffiliationId, clubName, provinceAffiliationId, provinceName, nationAffiliationId, nationName}'
echo ""

# Verify officials
echo "Officials:"
curl -s -H "$HEADER" "$BASE/officials" | jq '.[0] | {name, provinceAffiliationId, province, nationAffiliationId, nation}'
echo ""

echo "✓ All uploads complete!"
