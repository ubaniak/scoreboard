# Mobile-Friendly Frontend Plan

## Current State

- **Judge UI** (`pages/judge.tsx`, `components/judge/*`): already mobile/tablet optimized — full-screen tap zones, 88px margin buttons, bottom drawer for secondary input. No changes needed.
- **Admin pages** (home, card, bout, settings, login): break on phone — horizontal forms with fixed `labelCol`/`wrapperCol`, AntD Tables without scroll wrappers, fixed pixel widths throughout.
- **Scoreboard display** (`pages/scoreboard.tsx`): designed for 55"+ TV. Not phone-suitable by intent.
- **Viewport meta**: configured correctly in `index.html`.
- **No media queries** beyond `prefers-reduced-motion` in `App.css`.

## Goals

- Admin pages usable on phones ≥375px wide
- Scoreboard display: show fallback message on phone (don't try to make TV layout fit phone)
- Hard breakpoints: `xs <480`, `sm <768`, `md ≥768` (matches AntD defaults)
- Touch targets ≥44×44px on all interactive elements
- No horizontal scroll except inside intentional scroll containers (tables)

## Phase 0 — Foundation

Cheap primitives. Unblocks everything else.

1. **`App.css`** — add mobile media queries
   ```css
   @media (max-width: 768px) {
     body { font-size: 14px; }
   }
   ```
2. **`theme.ts`** — export breakpoints constant
   ```ts
   export const bp = { xs: 480, sm: 768, md: 1024 } as const;
   ```
3. **New `hooks/useBreakpoint.ts`** — thin wrapper over AntD `Grid.useBreakpoint()`. Centralizes screen-size logic, avoids `window.innerWidth` reads in render.
4. **`layouts/page.tsx:53,84`** — `maxWidth: 1280` → `maxWidth: "min(1280px, 100%)"`, add `padding: "0 12px"` for mobile.

## Phase 1 — Critical fixes (P0)

### ScoreTable forced horizontal scroll
- **`components/current/ScoreTable.tsx:69`** — drop `minWidth: 480`. Use `width: "100%"`. Scale row content font down on `xs`.

### Wrap AntD Tables for mobile scroll
Use AntD built-in `scroll={{ x: "max-content" }}` prop instead of wrapper div — handles iOS momentum scrolling natively.

Files:
- `components/officials/list.tsx`
- `components/bouts/list.tsx`
- `components/cards/index.tsx`
- `components/affiliations/index.tsx`
- `components/score/scores.tsx`
- `components/cards/JudgeConsistency.tsx` (2 tables)
- `components/settings/GoogleDrive.tsx`

### Horizontal forms → responsive layout
Pattern (use everywhere):
```tsx
const screens = Grid.useBreakpoint();
<Form layout={screens.md ? "horizontal" : "vertical"} ...>
```

Files:
- `components/login/login.tsx:16-17`
- `components/officials/add.tsx:19-20`, `edit.tsx:24-25`
- `components/cards/add.tsx:25-26`, `edit.tsx:34-35`
- `components/bouts/add.tsx`, `edit.tsx`, `end.tsx`

## Phase 2 — Polish (P1)

### Header
- **`layouts/page.tsx`** — collapse Devices/Settings/ThemeToggle buttons to icon-only on ≤sm. Hamburger drawer optional later.

### Touch target sizing
Bump `size="small"` → `size="middle"` in action columns:
- `components/settings/AutoBackup.tsx:225,236`
- `components/bouts/exportCard.tsx:34-35`
- `components/bout/Export.tsx:34-35`

### Fixed widths → max-width
- `components/affiliations/index.tsx:170` `width: 260` → `width: "100%", maxWidth: 260`
- `components/fouls/handle.tsx:68` `width: 200` → same pattern
- `components/bout/index.tsx:60` `width: 240` → same pattern

### Hide non-essential table columns on phone
Use AntD column `responsive: ["md"]` flag to omit columns from xs/sm rendering.

Examples:
- Cards table: keep name + actions on phone, hide date/officials
- Bouts table: keep number + names + actions, hide weight/round-count

## Phase 3 — Scoreboard fallback

- **`pages/scoreboard.tsx`** — detect `screens.md === false`, render simple message card: "Open on a larger display". Or just toast warning (cheaper).

## Phase 4 — Optional PWA

- `index.html` — add manifest link
- `public/manifest.json` — icons, theme color `#0b0f1a`
- Vite PWA plugin for service worker (offline judge mode if needed)
- Skip unless requested

## Suggested PR Order

| PR | Scope | Risk | Effort |
|----|-------|------|--------|
| 1 | Phase 0 foundation | low | S |
| 2 | Phase 1 table scroll wrappers | low | M |
| 3 | Phase 1 forms vertical-on-mobile | med | M |
| 4 | Phase 1 ScoreTable fix | low | S |
| 5 | Phase 2 polish | low | M |
| 6 | Phase 3 scoreboard fallback | low | S |
| 7 | (opt) Phase 4 PWA | med | M |

## Decisions

1. **Scoreboard on phone**: warn-and-render. Banner overlay, scoreboard layout still attempts to render.
2. **Hamburger nav**: build now. Drawer-based for ≤sm.
3. **PWA**: ship now. Manifest + service worker + icons.
4. **Min supported width**: 320px (iPhone SE).

## Files Touched (Summary)

### Critical (P0)
- `frontend/src/App.css`
- `frontend/src/theme.ts`
- `frontend/src/hooks/useBreakpoint.ts` (new)
- `frontend/src/layouts/page.tsx`
- `frontend/src/components/current/ScoreTable.tsx`
- `frontend/src/components/officials/list.tsx`
- `frontend/src/components/bouts/list.tsx`
- `frontend/src/components/cards/index.tsx`
- `frontend/src/components/affiliations/index.tsx`
- `frontend/src/components/score/scores.tsx`
- `frontend/src/components/cards/JudgeConsistency.tsx`
- `frontend/src/components/settings/GoogleDrive.tsx`
- `frontend/src/components/login/login.tsx`
- `frontend/src/components/officials/add.tsx`
- `frontend/src/components/officials/edit.tsx`
- `frontend/src/components/cards/add.tsx`
- `frontend/src/components/cards/edit.tsx`
- `frontend/src/components/bouts/add.tsx`
- `frontend/src/components/bouts/edit.tsx`
- `frontend/src/components/bouts/end.tsx`

### Polish (P1)
- `frontend/src/components/settings/AutoBackup.tsx`
- `frontend/src/components/bouts/exportCard.tsx`
- `frontend/src/components/bout/Export.tsx`
- `frontend/src/components/fouls/handle.tsx`
- `frontend/src/components/bout/index.tsx`

### Fallback (P3)
- `frontend/src/pages/scoreboard.tsx`

## Out of Scope

- Judge UI redesign — already mobile-good
- Backend changes — pure frontend work
- Replacing AntD — leverage AntD responsive APIs throughout
