# Security & data handling

## What this app is

The dashboard is a **static** single-page app deployed to GitHub Pages. In
production there is **no backend and no authentication** — it serves only the
pre-aggregated, anonymous JSON in [`public/analysis/`](public/analysis/)
(airline codes, airport codes, counts, densities, priority labels). The FastAPI
service under [`backend/`](backend/) is for **local development only** and must
never be exposed to the internet.

## The golden rule: no personal data in this repo

The raw INAD spreadsheet contains special-category personal data (names, dates
of birth, asylum/forged-document case notes). It must **never** be committed.

- Raw spreadsheets (`*.xlsx`, `*.xlsm`, `*.xls`, `*.csv` under `data/`) are
  git-ignored.
- A CI job (`data-guard` in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
  **fails the build** if any such file is ever committed.
- Analysis is generated locally (`npm run analyze`); only the aggregate JSON is
  committed.

## Hardening in place

- **Content-Security-Policy** and related headers are set via `<meta>` tags in
  [`public/index.html`](public/index.html): `frame-ancestors 'none'`
  (anti-clickjacking), `object-src 'none'`, `base-uri 'self'`, and tight
  `script`/`style`/`img`/`connect`/`font` allowlists.
- **CSV exports** are hardened against formula injection and are RFC-4180 quoted
  (see [`src/utils/csv.js`](src/utils/csv.js)).
- **Backend (dev only)**: CORS is limited to localhost (no wildcard, no
  credentials) and the "load server files" endpoint is confined to the `data/`
  directory to prevent path traversal.

## Reporting

Found something? Please open a private report to the repository owner rather than
filing a public issue.
