# Tenderdesk — Tender Document Package Builder

A browser-only application for checking tender documents and building an ordered, numbered PDF submission. The interface is available in English and Bangla.

- Public source: https://github.com/SDAFIK/tender-document-package-builder
- Website: https://sdafik.github.io/tender-document-package-builder/

## Run locally

Use Node.js 22.12+ or 24 and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

The production site is a static Vite build in `dist/`. HTTPS is required for Web Crypto in production; localhost also works. No backend, database, authentication, storage service, analytics, or external AI is used. All app assets, including the PDF.js worker, are served from the same origin. Files are held in memory and cleared on refresh or a successful tender change.

## Free hosting

The primary host is GitHub Pages, publishing the root of the `gh-pages` branch. Use `npm run build:pages` to build with the repository subpath, then publish the contents of `dist/` with a `.nojekyll` file to that branch. Source remains on `codex/tender-builder`. Source pushes alone do not update the deployed static branch.

No purchased domain is required. The requested `sadibai.site` domain was not owned by the user and is not used for this deployment.

## Workflow

1. Load the tender's `requirements.json`.
2. Add PDF files (at most 30, with at most 50,000,000 bytes in total).
3. Match files to requirements. Moving a file releases its previous requirement. Changing a file clears the previous expiry date.
4. Enter expiry dates for matched documents that require them.
5. Resolve all blocking statuses, then generate `<tender_id>_Package.pdf`.

The cover stays English regardless of UI language. Every page receives `<tender_id> | Page X of Y` in additional space outside the source page. An optional unmatched requirement is nonblocking. An optional **matched** requirement with a missing/expired required date is blocking. Expiry on the deadline is valid.

Exact duplicate content is detected with browser SHA-256. Copies can remain in the uploaded list, but cannot be assigned to different requirements. Same filenames alone never determine duplication.

Bonus implemented: Excel-compatible UTF-8 CSV checklist export, with quoted cells and spreadsheet-formula protection. Damaged, unsupported, and password-protected PDFs receive clear errors.

## Architecture

- `src/domain.ts`: pure status, date, sorting, matching, removal, and duplicate rules.
- `src/validation.ts`: validates external JSON before it reaches application state.
- `src/files.ts` / `src/hashing.ts`: browser PDF parsing, limits, metadata, and hashing.
- `src/useWorkspace.ts`: canonical uploads/matches and async operation lock; statuses are derived.
- `src/Checklist.tsx`, `src/DocumentPanel.tsx`, `src/App.tsx`: workflow interface.
- `src/i18n.ts`: typed English/Bangla copy.
- `src/package.ts`: cover, page copying, rotation-aware footer bands, download.
- `src/checklistExport.ts`: CSV export.

React 19, Vite 7, strict TypeScript, pdf-lib, pdfjs-dist, Web Crypto, Lucide, Vitest, and Playwright. Dependencies are pinned through `package-lock.json`.

## Verification

`npm test` runs 43 deterministic domain and PDF tests. The complete browser acceptance suite passed in Chrome Headless Shell 153.0.8010.12; the sample workflow also passed in Microsoft Edge. See `QA.md` for the mandatory acceptance matrix and results.

For browser tests, extract the provided fictional sample pack into `tmp/sample-pack/`, start `npm run dev -- --port 5173 --strictPort`, then run:

```sh
npx playwright install chromium --only-shell
node tests/browser.mjs
node tests/geometry.mjs
```

To use a locally installed browser, set `BROWSER_CHANNEL=msedge` or `chrome`. The browser test checks there are zero external requests during the local workflow. Screenshots go to `screenshots/`; the sample package goes to `output/`. Test input documents are not included in the hosted static assets.

## Sample submission

- `output/T-2026-0417_Package.pdf`: 16 pages, generated through the UI from the provided sample pack.
- `screenshots/02-document-statuses.png`: mandatory status screenshot.
- Additional English, Bangla, and mobile screenshots are included.
- `SAMPLE-WALKTHROUGH.md`: documented sample decisions, kept outside application logic.

## Documented assumptions and limitations

- “50 MB” is treated as 50,000,000 bytes; the problem statement does not define decimal versus binary MB.
- Tied `order` values keep their JSON relative order. Duplicate requirement IDs and nonpositive/noninteger orders are rejected with a validation error.
- Unusually long cover content increases the height of the single cover page instead of clipping or introducing an extra page before the documents.
- Generated cover/footer text uses the standard English Helvetica font. Characters unsupported by that font produce a clear error; Bangla PDF cover/index support is not implemented. Existing Bangla text inside source PDFs is preserved.
- Dates are entered by the user; the app does not infer expiry dates or verify that a chosen document semantically matches a requirement.
- Encrypted PDFs are rejected even when a viewer can open them without prompting; use an unlocked copy.
- Work is not persisted. Save/reopen, automatic matching suggestions, index, seal/signature placement, and AI assistance are not implemented.
- The Official Rulebook was not supplied. Sections 5.5, 9, 11 and other Rulebook obligations remain unverified. Contest timing was deferred by the user; these development commits do not certify compliance with an actual T+0/T+90 window.

## Technical references

- [pdf-lib page API](https://pdf-lib.js.org/docs/api/classes/pdfpage)
- [PDF.js examples](https://mozilla.github.io/pdf.js/examples/)

The official five-page problem statement is the requirements source of truth. The sample pack is fictional contest material, and is used only for contest verification.
