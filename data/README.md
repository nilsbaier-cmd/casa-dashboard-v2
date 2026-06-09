# Data files — local only, never commit

> ⚠️ **The raw INAD/BAZL spreadsheets contain personal data and must NEVER be
> committed to this (public) repository.** They are git-ignored on purpose. Only
> the aggregated, anonymous JSON in [`../public/analysis/`](../public/analysis/)
> is published.

## How the data flows

```
data/INAD_*.xlsm   ─┐
data/BAZL-*.xlsx   ─┤──>  npm run analyze  ──>  public/analysis/*.json  ──> committed & deployed
(local only)       ─┘     (scripts/generate_analysis.py)                    (aggregate only)
```

The dashboard never reads the raw spreadsheets — it reads the pre-generated
aggregate JSON. The aggregation keeps only airline codes, airport codes, counts,
densities and priority labels; no personal fields are carried over.

## Updating the dashboard with new data

1. Put the two source files in this folder (they stay on your machine only):
   - `INAD-Tabelle.xlsx` / `.xlsm` — columns `Fluggesellschaft`, `Abflugort`,
     `Jahr`, `Monat` (`Verweigerungsgründe` optional).
   - `BAZL-Daten.xlsx` — columns `Fluggesellschaft`, `Abflugort`, `PAX`, `Jahr`,
     `Monat`.
2. Generate the aggregate JSON locally:
   ```bash
   npm run analyze
   ```
   (Needs Python 3.9+ and `pip install -r backend/requirements.txt`.)
3. Commit **only** the regenerated `public/analysis/*.json`:
   ```bash
   git add public/analysis
   git commit -m "data: refresh analysis (<period>)"
   git push
   ```

Pushing to `main` triggers the build-and-deploy workflow. A guardrail job
**fails the build** if a spreadsheet is ever staged under `data/`, so a slip
can't silently re-expose personal data.
