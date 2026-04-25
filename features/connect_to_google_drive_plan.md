# Plan: Connect to Google Drive

## Goal
- Import athletes, officials, clubs, and cards (bouts) from a single Google Spreadsheet
- Export card reports (CSV) to a Google Drive folder

---

## Architecture

### Backend: `internal/gdrive/`

Three files following the existing domain pattern:

| File | Responsibility |
|------|---------------|
| `config.go` | `GDriveConfig` struct, persist/load from `~/.scoreboard/gdrive_config.json` |
| `service.go` | OAuth2 flow, Sheets API reads, Drive API uploads |
| `app.go` | HTTP handlers + `RegisterRoutes` |

**Go deps added:**
- `golang.org/x/oauth2`
- `google.golang.org/api/sheets/v4`
- `google.golang.org/api/drive/v3`

### OAuth2 Flow (desktop app)
1. Admin provides Client ID + Client Secret (downloaded from Google Cloud Console)
2. `GET /api/gdrive/auth-url` → returns Google consent URL (redirect_uri = `http://localhost:8080/api/gdrive/callback`)
3. Admin opens URL in browser, grants access
4. Google redirects to callback, backend exchanges code for token, saves to `~/.scoreboard/gdrive_token.json`
5. UI polls config to show "Connected" state

### API Endpoints (all under `/api/gdrive/`, admin-only except callback)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/config` | Get config + connected state |
| PUT | `/config` | Save client_id, client_secret, sheet_id, folder_id |
| GET | `/auth-url` | Get OAuth2 consent URL |
| GET | `/callback` | OAuth2 redirect handler (public, saves token) |
| POST | `/disconnect` | Delete stored token |
| POST | `/import` | Import from Google Sheet tabs |
| POST | `/export/:cardId` | Upload card CSV report to Drive |

---

## Google Sheet Format

One spreadsheet, four named tabs:

**Athletes** tab:
| Name | Age Category | Nationality | Club |

**Officials** tab:
| Name | Nationality | Year of Birth | Registration Number |

**Clubs** tab:
| Name | Location |

**Cards** tab (one row per bout, multiple bouts share Card Name/Date):
| Card Name | Date | Bout Number | Bout Type | Red Athlete | Red Club | Blue Athlete | Blue Club | Age Category | Experience | Gender | Round Length | Glove Size |

---

## Export
Upload `Full Report CSV` (`full_report_<cardName>_<date>.csv`) and `Public Report CSV` to the configured Drive folder (or root if no folder set).

---

## Frontend

- `src/api/gdrive.ts` — TanStack Query/Mutation hooks
- `src/components/settings/GoogleDrive.tsx` — settings UI card
- `src/pages/home.tsx` — add "Google Drive" tab to settings Tabs

### UI Sections
1. **Credentials** — Client ID / Client Secret inputs + Save
2. **Connect / Disconnect** — "Connect to Google" button (opens auth URL) + status badge
3. **Import** — Sheet URL/ID input + "Import Now" button + result summary
4. **Export** — Drive Folder ID input (optional) + per-card export triggered from card reports
   - Also a "Export Card Report" button in the settings tab that accepts a card ID

---

## Wiring in `cmd/main.go`
```go
gdriveApp := gdrive.NewApp(reportsUseCase, cardUseCase, boutsUseCase, athleteUseCase, clubUseCase, officialUsecCase, &importBoutAdapter{boutsUseCase, cardUseCase})
apiRegister.Add(gdriveApp)
```
