# Google Drive Integration Setup Guide

Complete guide to set up the Google Drive integration for importing tournament data and exporting reports.

## Step 1: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Create Project** (top-left dropdown, next to "Google Cloud")
3. Enter a project name (e.g., "Scoreboard")
4. Click **Create**

---

## Step 2: Enable Required APIs

1. From your project dashboard, go to **APIs & Services → Library**
2. Search for and enable:
   - **Google Sheets API** — for importing tournament data
   - **Google Drive API** — for exporting reports

---

## Step 3: Set Up the OAuth Consent Screen (one-time setup)

This tells Google what your app does and what data it requests. Required before creating OAuth credentials.

1. Go to **APIs & Services → OAuth consent screen** (in the left sidebar)
2. Choose **External** as the user type and click **Create**
3. Fill in the form:
   - **App name:** "Scoreboard" (or your choice)
   - **User support email:** Your email address
   - **Developer contact:** Your email address
4. Click **Save and Continue**
5. On the **Scopes** screen, skip and click **Save and Continue** (scopes are automatically requested)
6. Review and click **Back to Dashboard** — you don't need to add test users

---

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services → Credentials** (in the left sidebar)
2. Click **Create Credentials → OAuth client ID**
3. Choose **Web application** as the Application type
4. Under **Authorized redirect URIs**, add exactly:
   ```
   http://localhost:8080/api/gdrive/callback
   ```
5. Click **Create** — a modal will pop up with your credentials
6. Copy the **Client ID** and **Client Secret** and save them somewhere safe

---

## Step 5: Configure Credentials in Scoreboard

1. Start the scoreboard app: `./scoreboard`
2. Log in as admin at `http://localhost:8080`
3. Click the **Google Drive** tab (in top navigation)
4. Click **Configure**
5. In the form:
   - Paste the **Client ID** from Step 4
   - Paste the **Client Secret** from Step 4
6. (Optional) Click **Verify Connection** to test the credentials
7. Click **Save Config**

---

## Step 6: Prepare Your Google Sheet Template

You'll need a Google Sheet with tabs named exactly: `Athletes`, `Officials`, `Clubs`, `Cards`.

### Option A: Use the Built-in Template
1. In the **Import from Sheet** section, click **Upload Template**
2. A new Google Sheet will be created in your Drive with the correct structure
3. Copy the Sheet ID from the URL and continue to Step 7

### Option B: Create Your Own Sheet
1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Rename the default sheet tabs to: `Athletes`, `Officials`, `Clubs`, `Cards`
3. Add your data with the following column headers:

**Clubs tab:**
| Name | Location |

**Athletes tab:**
| Name | Age Category | Nationality | Club |

**Officials tab:**
| Name | Nationality | Year of Birth | Registration Number |

**Cards tab:**
| Card Name | Date | Bout Number | Bout Type | Red Athlete | Red Club | Blue Athlete | Blue Club | Age Category | Experience | Gender | Round Length | Glove Size |

4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/**SHEET_ID**/edit`

---

## Step 7: Link Your Sheet to Scoreboard

1. Back in the **Configure** modal:
   - Paste the **Google Sheet ID** from Step 6
   - (Optional) Paste a **Drive Folder ID** to upload exports to a specific folder, or leave blank for Drive root
2. Click **Save Config**

---

## Step 8: Connect to Google

1. Click **Connect to Google** button
2. A new browser tab opens — sign in with your Google account
3. Grant access to Google Sheets and Drive when prompted
4. You'll be redirected back to the app — the status should show **Connected**

---

## Step 9: Import and Export

### Import Tournament Data
1. Ensure your Sheet has data in the `Athletes`, `Officials`, `Clubs`, and `Cards` tabs
2. Click **Import Now** — the app will create or update all records
3. Check the **Clubs**, **Athletes**, **Officials**, and **Cards** tabs to verify

### Export Card Reports
1. In the **Export Card Report to Drive** section, select a card from the dropdown
2. Click **Export**
3. CSV reports will be uploaded to your Google Drive
4. Click the links to view them

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "client credentials not configured" | Complete Step 5 first (Configure button) |
| "not connected" on import | Complete Step 8 (Connect to Google) |
| "Sheet tab not found" | Ensure tabs are named exactly: `Athletes`, `Officials`, `Clubs`, `Cards` |
| "redirect_uri_mismatch" error | Verify the redirect URI in Google Cloud Console matches exactly: `http://localhost:8080/api/gdrive/callback` |
| Import shows 0 records | Check sheet tab names and column headers |
| Export fails | Ensure you have write access to the Drive folder |
