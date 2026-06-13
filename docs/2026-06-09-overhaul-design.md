# CASA Dashboard — Security, Architecture & UX Overhaul

**Date:** 2026-06-09
**Branch:** `feat/security-ux-architecture-overhaul`
**Status:** Proposed (PR, not merged — pending review)

## Context

`casa-dashboard-v2` is a React (CRA) single-page app deployed as a **static**
site to GitHub Pages from the `gh-pages` branch. The dashboard reads
pre-generated **aggregate** JSON (`public/analysis/*.json`) — airline codes,
airport codes, INAD counts, densities, priority labels. There is no live
backend in production; the FastAPI app under `backend/` is only used for local
development and to power the GitHub Actions analysis step.

A prior security review (by ChatGPT) was actually performed against a *different*
project (`casa_reporting`, a Next.js app with admin/viewer login and a publish
API). Those specific findings — client-side auth bypass, an open `/api/publish`
endpoint, `NEXT_PUBLIC_*` secrets, raw data in `sessionStorage` — **do not exist
in this repository**. This codebase has no auth layer, no publish endpoint, no
`sessionStorage`/`localStorage` use, and no environment-variable secrets. The
generic hardening ideas (CSV injection, security headers) still apply and are
addressed here.

## The headline finding (privacy)

The raw source spreadsheets are committed to this **public** repository:

- `data/INAD_Tabelle .xlsm` (~2 MB)
- `data/BAZL-Daten.xlsx` (~340 KB)

The INAD file contains **special-category personal data** about real
individuals refused entry: names, dates of birth, nationalities, free-text
case notes referencing asylum requests and falsified documents. This is the
single most serious issue in the project. Note:

- The **live dashboard leaks nothing** — it only serves aggregate JSON.
- The exposure is the raw files in the repo tree **and in git history**.

### Root cause = architecture

The CI workflow regenerates analysis by running `scripts/generate_analysis.py`
against the raw files in `data/`. That design *forces* personal data into the
public repo to make auto-deploy work. Fixing the privacy issue and fixing the
architecture are therefore the same change: **decouple analysis generation from
the published repo.**

## Goals

1. Make it structurally impossible to leak raw personal data via this repo.
2. Apply sensible, real security hardening for a static public dashboard.
3. Fix correctness bugs and dead UI controls.
4. Raise UI/UX quality: interactive charts, dark mode, mobile navigation, a11y.
5. Keep the app a zero-backend static deploy; keep the build green.

Out of scope (documented, not done here): rewriting git history to purge the
already-committed files, changing repo visibility, and migrating off the
unmaintained Create React App toolchain. These need owner decisions and/or
coordination — see "Owner follow-ups".

## Design

### A. Privacy & pipeline (decouple raw data)

- Delete `data/*.xlsm` / `data/*.xlsx` from the working tree.
- `.gitignore` all `data/*.xlsx`, `data/*.xlsm`, `data/*.csv`; keep `data/`
  tracked via `.gitkeep` and a rewritten `data/README.md` explaining that raw
  files stay **local only**.
- Analysis becomes a **local** step: `npm run analyze` →
  `scripts/generate_analysis.py`, writing only aggregate JSON to
  `public/analysis/`. The committed JSON is the published artifact.
- Rewrite `.github/workflows/analyze-and-deploy.yml` → a **build-and-deploy**
  workflow with no Python/raw-data dependency.
- Add a **guardrail** CI job (`data-guard`) that fails the build if any
  `data/**` spreadsheet (`*.xlsx`/`*.xlsm`/`*.csv`) is ever committed again.

### B. Security hardening

- **CSP + headers** in `public/index.html` via `<meta>`: a Content-Security-
  Policy with `frame-ancestors 'none'` (clickjacking), `object-src 'none'`,
  `base-uri 'self'`, scoped `img/connect/font/style/script` allowlists covering
  the globe textures (`unpkg.com`), Google Fonts, and data URIs. Plus
  `Referrer-Policy` and `X-Content-Type-Options`.
- **CSV injection**: a shared `src/utils/csv.js` that neutralizes formula
  triggers (`= + - @`, tab, CR) and RFC-4180-quotes every field. All exports go
  through it.
- **Backend (dev-only) hardening**: replace the `allow_origins=["*"]` +
  `allow_credentials=True` combination with an env-driven localhost allowlist;
  constrain `/api/load-server-files` to an allowlisted base directory to remove
  the arbitrary-file-read (path traversal) capability; document the backend as
  local-development-only.
- `SECURITY.md` describing the model, reporting, and the data-handling rule.

### C. Correctness & architecture

- Fix the **Overview → "INAD by region"** chart, which currently always renders
  hard-coded sample data even when real data is loaded; derive region buckets
  from the loaded routes via airport→region mapping.
- Wire the three **dead Export buttons** (Airlines table, Legal high-priority,
  Legal watch-list) to the shared CSV util; make the Globe/region exports real.
- Persist `language`, `theme`, and selected `semester` to `localStorage`.

### D. UI / UX / interactivity

- Replace the hand-rolled `SimpleBarChart` with **recharts** (already a
  dependency) for responsive, tooltip-driven charts.
- **Dark mode**: a `[data-theme]` token set layered over the existing CSS
  variables, with a persisted toggle in the sidebar.
- **Responsive navigation**: the sidebar is currently translated off-canvas
  below 1024px with no way to reopen it — add a hamburger button + overlay so
  the app is usable on tablet/mobile.
- **Accessibility**: nav items become real buttons, icon-only buttons get
  `aria-label`s, visible `:focus-visible` rings, and reduced-motion respect.

## Verification

- `npm run build` stays green (CI=false to treat warnings as warnings).
- Manual browser pass via local preview: globe, all tabs, dark mode, mobile
  hamburger, CSV exports open cleanly in a spreadsheet, charts interactive.
- A preview build is deployed to the `gh-pages` `preview/` subpath so the change
  can be reviewed at a live URL **without** merging or touching the live site.

## Owner follow-ups (decisions required, not done in this PR)

1. **Purge git history** of the committed spreadsheets (`git filter-repo` / BFG),
   then ask GitHub Support to expire cached views; treat any data therein as
   disclosed and handle per SEM/data-protection process.
2. **Repo visibility**: decide whether a CASA/INAD tool should be public at all;
   consider making it private. (Note: the live URL is referenced in the job
   portfolio, so this is a tradeoff to make consciously.)
3. **Toolchain**: plan a migration off Create React App (unmaintained) to Vite,
   which also clears most of the current `npm audit` dev-tooling findings.
