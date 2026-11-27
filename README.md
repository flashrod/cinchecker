# CIN Checker

A production-quality static tool that validates Indian CINs (Company Identification Numbers) and LLPINs (Limited Liability Partnership Identification Numbers), decodes every field, and reports exact errors in plain English. Runs entirely in your browser — nothing is uploaded.

**Live:** [https://flashrod.github.io/cinchecker/](https://flashrod.github.io/cinchecker/)

---

## What it does

Paste one CIN or LLPIN per line and get:

- **Validation** — checks format, state/ROC code, year, company type, and registration number
- **Decoding** — listing status, industry code, state name, year, company type, and registration number
- **Exact errors** — plain-English messages naming exactly what's wrong (e.g. `The state code ZZ is not a valid Indian state or UT`, `The year 2090 is in the future`)
- **Results summary** — `9 valid · 3 invalid · 2 LLPs`
- **Filter chips** — All / Valid / Invalid
- **Desktop table** + **mobile cards** (under 720px)
- **Copy as CSV** / **Download CSV** (UTF-8 BOM, formula-injection guarded)
- **2,000-line cap** with a clear truncation notice

---

## Tech stack

- `index.html`, `styles.css`, `src/main.js`, `src/validate.js`, `src/reference.js`, `src/render.js`
- No frameworks, no build step, one Google font (Newsreader)
- Light palette only; `color-scheme: light`
- WCAG AA contrast, 44px touch targets, inline SVG icons only

---

## Commands

```bash
# Install dependencies (none required, but lockfile present)
npm install

# Run the test suite (48 tests)
npm test

# Serve locally for development
npm run serve   # python3 -m http.server 4173
```

---

## Validation rules summary

### CIN (21 characters)
`L 17110 MH 1973 PLC 019786`
- **Listing** (1 char): `L` listed, `U` unlisted
- **Industry** (5 digits): NIC code
- **State / ROC** (2 letters): 47 accepted codes (e.g. `MH`, `PN`, `DL`, `JK`, `LH`)
- **Year** (4 digits): 1850 through current year (2026)
- **Company type** (3 letters): 13 accepted codes (e.g. `PLC`, `PTC`, `OPC`, `NPL`, `FLC`, `FTC`)
- **Registration** (6 digits)

### LLPIN (8 characters)
`AAA-1234` — three letters, hyphen, four digits. No state, year, or company type.

### Rejected lookalikes (with hints)
- `CG` → CT (Chhattisgarh)
- `UK` → UT / UR (Uttarakhand)
- `BH` → BR (Bihar)
- `MI` → MZ (Mizoram)
- `AD` → AP (Andhra Pradesh)
- `DH` → DD / DN (Dadra & Nagar Haveli / Daman & Diu)
- `LA` → LD (Lakshadweep)

---

## MCA verification

Format validation only. A well-formed number can still be fake or struck off — always confirm on [MCA21](https://www.mca.gov.in) before relying on it.

MCA has not published a formal public CIN specification; this tool is built from observed CINs and public references. Codes marked `UNVERIFIED` or `legacy` in the UI are flagged as such.

---

## Deploy on GitHub Pages

This is a static site (`index.html`, `styles.css`, `src/`) — no build step. It's deployed from the `main` branch via GitHub Pages.

Live: https://flashrod.github.io/cinchecker/

To redeploy after a change:
```bash
git push origin main
```
GitHub Pages rebuilds automatically from `main`.

---

## Tests

`npm test` runs 48 tests covering every validation rule, edge cases (empty input, 100k lines, 1M-character single line, fullwidth/zero-width normalization), CSV escaping, and result shape.

---

## Known uncertainties

Items flagged `UNVERIFIED` or `legacy` in the UI and `docs/spec.md`:

- `FLC` expansion conflict ("Foreign subsidiary (public limited)")
- `PLN` observed on Nidhi CINs, expansion unconfirmed
- `GAP` / `GAT` — no live CIN example found
- `ME` Meghalaya collision with other codes
- `TS` / `TG` ordering (Telangana)
- `LA` legacy rejection (Lakshadweep uses `LD`)
- `LH` / `JK` Ladakh nuance
- 2026 ROC split codes (`DC`, `MR`, `ME`, `UW`, `WR`) observed but not independently captured from MCA

These are marked in the UI, never presented as certain.
