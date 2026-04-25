# How to Test: Connect to Google Drive

## Prerequisites

- A Google account
- Admin access to the scoreboard app
- A Google Cloud project (free tier is fine)

---

## Step 1 — Create OAuth2 Credentials in Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable these APIs:
   - **Google Sheets API** — search "Sheets API" → Enable
   - **Google Drive API** — search "Drive API" → Enable
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add authorised redirect URI: `http://localhost:8080/api/gdrive/callback`
7. Click Create — copy the **Client ID** and **Client Secret**

---

## Step 2 — Create a Test Google Spreadsheet

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Add four tabs named exactly: `Athletes`, `Officials`, `Clubs`, `Cards`

### Clubs tab (columns in row 1)
| Name | Location |
|------|----------|
| City Boxing | Auckland |
| North Stars | Wellington |

### Athletes tab
| Name | Age Category | Nationality | Club |
|------|-------------|-------------|------|
| Jane Smith | Elite | NZL | City Boxing |
| Mark Jones | U17 | NZL | North Stars |

### Officials tab
| Name | Nationality | Year of Birth | Registration Number |
|------|-------------|--------------|-------------------|
| Ref Roberts | NZL | 1980 | REF001 |

### Cards tab
| Card Name | Date | Bout Number | Bout Type | Red Athlete | Red Club | Blue Athlete | Blue Club | Age Category | Experience | Gender | Round Length | Glove Size |
|-----------|------|-------------|-----------|-------------|----------|--------------|-----------|-------------|------------|--------|-------------|------------|
| Test Card | 2026-05-01 | 1 | scored | Jane Smith | City Boxing | Mark Jones | North Stars | Elite | novice | female | 3 | 10oz |

3. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**<SHEET_ID>**/edit`

---

## Step 3 — Configure the App

1. Start the scoreboard app: `./scoreboard`
2. Log in as admin at `http://localhost:8080`
3. Click the **Google Drive** tab (top navigation on the home page)
4. Fill in:
   - **Client ID** — from Step 1
   - **Client Secret** — from Step 1
   - **Google Sheet ID** — from Step 2
   - **Drive Folder ID** — leave blank to upload to root, or paste a Drive folder ID
5. Click **Save Config** — you should see "Config saved"

---

## Step 4 — Connect OAuth

1. Click **Connect to Google**
2. A new browser tab opens — sign in and grant access to Sheets and Drive
3. You are redirected back to `http://localhost:8080/?tab=google-drive`
4. The status badge should change to **Connected**

---

## Step 5 — Test Import

1. Click **Import Now**
2. A success message should appear:
   `Imported: 2 clubs, 2 athletes, 1 officials, 1 bouts`
3. Navigate to the **Clubs**, **Athletes**, and **Officials** tabs to verify records were created
4. Navigate to **Cards** → verify "Test Card" exists with Bout #1

---

## Step 6 — Test Export

1. Find the numeric ID of an existing card (visible in the URL when viewing a card, e.g. `/card/3/...`)
2. In the Google Drive tab, enter the card ID in the **Card ID** field
3. Click **Export**
4. A success message appears and Drive links are shown
5. Click the links — you should see the Full Report and Public Report CSV files in Google Drive

---

## Step 7 — Test Disconnect

1. Click **Disconnect**
2. Confirm in the dialog
3. Status badge returns to **Not connected**
4. **Import Now** and **Export** buttons become disabled

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "client credentials not configured" | Save config with Client ID and Secret first |
| "not connected" on import | Complete the OAuth flow (Step 4) |
| Sheet tab not found / 0 records imported | Check tab names are exactly `Athletes`, `Officials`, `Clubs`, `Cards` |
| "redirect_uri_mismatch" from Google | Ensure `http://localhost:8080/api/gdrive/callback` is in the allowed redirect URIs |
| Token exchange failed | Client Secret may be wrong — re-check Cloud Console |
