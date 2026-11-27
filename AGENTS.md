# CIN Checker — agent notes

Static site. No framework, no build step, no dependencies. `npm install` is unnecessary.

## Commands

- `npm test` — runs `node --test tests/` (48 tests, Node built-in runner)
- `npm run serve` — `python3 -m http.server 4173` (local dev on port 4173, not 8000)
- `git push origin main` — deploys to GitHub Pages automatically (https://flashrod.github.io/cinchecker/)

## Source layout

- `index.html` — single HTML entrypoint
- `styles.css` — all styles
- `src/validate.js` — pure validation logic (no DOM). `validateCIN`, `validateLLPIN`, `checkLine`, `parseInput`, `classify`
- `src/reference.js` — `STATES`, `OWNERSHIP_CODES`, code status tags (verified/observed/unverified/legacy)
- `src/render.js` — DOM builders, CSV export, reference accordion
- `src/main.js` — event glue: form submit, chips, copy/download, mobile/tablet view switching
- `tests/` — `validate.test.js`, `stress.test.js`
- `docs/spec.md` — validation contract; keep in sync with `src/validate.js` and tests

## Things that are easy to get wrong

- `package.json` has `"type": "module"` — `src/*.js` use ESM `import`/`export`
- No `node_modules`, no lockfile committed, nothing to install
- Deploy is push-to-main only; there is no CI config and no Vercel/Netlify setup
- `validate.js` is intentionally decoupled from the DOM — test logic there, not through the browser
- Codes marked `observed`/`unverified`/`legacy` are flagged in the UI; never present them as certain
