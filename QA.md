# Acceptance verification

The local application was exercised with the supplied pack and synthetic unseen data. Unit tests, production TypeScript/build checks, real browser interaction, PDF text extraction, and rendered PDF inspection were used. See test scripts for reproducible assertions.

Final result: 43 unit tests passed; TypeScript and Vite production build passed; complete browser acceptance and geometry checks passed in Chrome Headless Shell 153.0.8010.12. CSV download was exercised in the browser. The main workflow was also checked in Microsoft Edge.

| # | Mandatory case | Verification |
|---|---|---|
| 1 | Mandatory unmatched → Missing; blocked | Unit + browser |
| 2 | Optional unmatched → Not provided; nonblocking | Unit + browser |
| 3 | Matched expiry requirement without date → date needed | Unit + browser |
| 4 | Expiry before deadline → Expired | Unit + browser |
| 5 | Expiry equal to deadline → OK | Unit + browser |
| 6 | Expiry after deadline → OK | Unit + browser |
| 7 | Matched non-expiry requirement → OK | Unit + browser |
| 8 | Same bytes, different names → duplicate | Unit + browser sample |
| 9 | Same name, different bytes → distinct | Unit |
| 10 | Duplicate copies cannot match different requirements | Unit + disabled browser option + generator guard |
| 11 | Reassign one file to another requirement | Unit + browser |
| 12 | Replace requirement's file; release old match | Unit + browser; old expiry clears |
| 13 | Remove matched PDF; immediately recalculate | Unit + browser |
| 14 | Reject non-PDF with clear message | Browser PNG rejection |
| 15 | Damaged PDF does not crash | Browser malformed PDF |
| 16 | Scrambled requirements use numeric order | Unit + browser reversed JSON |
| 17 | Unmatched optional documents omitted | Generated sample and unit test |
| 18 | Preserve every source page in original order | 16-page sample text extraction and rendering |
| 19 | English cover is first | Visual inspection; generated from Bangla UI |
| 20 | Exact Page X of Y footer on every page | All 16 pages extracted and checked |
| 21 | Footer does not cover source content | Sample visual checks; four rotation fixtures pixel comparison |
| 22 | English/Bangla switching | Browser |
| 23 | Language change preserves uploads, matching, dates | Browser |
| 24 | Exact download filename | Browser download assertion |

Additional checks: 31-file batch admits 30 and reports the excess; 50,000,001-byte file is rejected; malformed JSON preserves existing work; duplicate IDs and invalid calendar dates are rejected; prototype-like IDs work; zero external requests and zero page errors during local browser acceptance; no horizontal overflow at 390px width; long cover text stays on a single expanded page.

PDF geometry fixtures use 0/90/180/270-degree pages with offset crop boxes and content at each edge. The visible source portions render pixel-for-pixel identically after packaging. Standard sample text pages show only negligible renderer rounding differences. The scanned declaration's embedded image is preserved pixel-for-pixel; its rendered antialiasing changes slightly because the page canvas is larger.

## Not certified

Official Rulebook compliance and real contest timing remain unverified. User explicitly deferred the timing question. Bonus features not listed in the README are not implemented. No claim is made that all possible PDF producer quirks or languages unsupported by the cover font are handled.
