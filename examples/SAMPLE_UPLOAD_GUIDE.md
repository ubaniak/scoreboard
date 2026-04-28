# Sample Upload Guide - Affiliation Refactor

## Files Included

- `sample_affiliations.csv` - Clubs, provinces, nations, other types
- `sample_athletes.csv` - Athletes with affiliation IDs
- `sample_officials.csv` - Officials with affiliation IDs

## Upload Steps

### 1. Get Auth Token
```bash
curl -X POST http://localhost:8080/api/login \
  -H 'Content-Type: application/json' \
  -d '{"pin":"1234"}' | jq -r '.token'
```
Save token as: `TOKEN=<your_token>`

### 2. Upload Affiliations (Step 1 - Required First)
```bash
curl -X POST http://localhost:8080/api/affiliations/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample_affiliations.csv"
```

Expected: 201 Created

### 3. Verify Affiliations Created
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/affiliations | jq '.'
```

Note affiliation IDs returned (e.g., 1, 2, 3... for clubs, 4, 5, 6... for provinces, 7, 8, 9... for nations)

### 4. Update sample_athletes.csv
Edit `sample_athletes.csv` - replace clubAffiliationId, provinceAffiliationId, nationAffiliationId with actual IDs from step 3

Example:
```csv
name,ageCategory,nationality,clubAffiliationId,provinceAffiliationId,nationAffiliationId
John Smith,elite,Canadian,1,4,7
```

If you created affiliations and got back IDs like:
- Team Alpha = 1
- Ontario = 4  
- Canada = 7

Then keep as-is. Otherwise update to match.

### 5. Upload Athletes
```bash
curl -X POST http://localhost:8080/api/athletes/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample_athletes.csv"
```

Expected: 201 Created

### 6. Verify Athletes
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/athletes | jq '.[0]'
```

Check: clubAffiliationId, clubName, provinceName, nationName are populated

### 7. Update sample_officials.csv
Same as athletes - update IDs to match your affiliations

### 8. Upload Officials
```bash
curl -X POST http://localhost:8080/api/officials/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample_officials.csv"
```

### 9. Full Test
```bash
# List all data with affiliations
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/affiliations | jq 'map({id, name, type})'
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/athletes | jq '.[0] | {name, clubName, provinceName, nationName}'
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/officials | jq '.[0] | {name, province, nation}'
```

## Expected Results

### Affiliations List
```json
[
  {"id": 1, "name": "Team Alpha", "type": "club"},
  {"id": 2, "name": "Team Beta", "type": "club"},
  {"id": 4, "name": "Ontario", "type": "province"},
  {"id": 7, "name": "Canada", "type": "nation"}
]
```

### Athlete Detail
```json
{
  "id": 1,
  "name": "John Smith",
  "clubAffiliationId": 1,
  "clubName": "Team Alpha",
  "provinceAffiliationId": 4,
  "provinceName": "Ontario",
  "nationAffiliationId": 7,
  "nationName": "Canada"
}
```

### Official Detail
```json
{
  "id": 1,
  "name": "James Brown",
  "provinceAffiliationId": 4,
  "province": "Ontario",
  "nationAffiliationId": 7,
  "nation": "Canada"
}
```

## Troubleshooting

### "Unexpected token '<'" Error
- Server not running: `./scoreboard`
- Wrong endpoint: check URL path
- Wrong token: get fresh token from login
- Check `curl -v` output for actual response

### Upload Returns Error
- Check CSV format: `name,type` for affiliations
- Check CSV format: matches expected columns for athletes/officials
- Check IDs exist in database before referencing in athletes/officials

### Missing Data After Upload
- Check if upload succeeded (201 status)
- Verify with GET request to see if data was stored
- Check server logs for errors

## Next Steps

1. ✅ Upload affiliations first
2. ✅ Verify affiliations created
3. ✅ Update athlete/official CSVs with correct IDs
4. ✅ Upload athletes/officials
5. ✅ Verify data in GET requests
6. Test UI: create/edit athlete with affiliation selectors (after frontend updated)
