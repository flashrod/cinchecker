# CIN Checker — specification

Status: agreed before implementation. Last reviewed 25 November 2026.

This document is the contract for the tool. The tests in `tests/validate.test.js`
encode the rules and messages below. If a rule changes, change this file and the
tests in the same commit.

---

## 1. What the tool does

The tool takes a list of Indian company registration numbers, one per line, and:

1. decides whether each line is a CIN, an LLPIN, or neither;
2. checks the structure and every decodable field;
3. reports **all** problems found in that line, in plain English;
4. decodes the state/ROC, year, company type, industry code, and registration
   number for valid CINs;
5. lets the user copy or download the result as CSV.

Everything runs in the browser. No number is sent to a server, and no lookup is
made against MCA.

### What it does not do

- It does not confirm that a company or LLP exists.
- It does not confirm that a number is currently registered, active, struck off,
  or owned by the company claiming it.
- It does not validate the industry code against a NIC edition.
- It does not verify names, addresses, directors, or filing status.

A syntactically perfect CIN can still be fake. The interface says this in plain
language next to the results and in the footer.

---

## 2. CIN anatomy

A CIN is exactly **21 characters**:

| Positions | Length | Meaning | Example |
| --- | --- | --- | --- |
| 1 | 1 | Listing status: `L` listed, `U` unlisted | `L` |
| 2–6 | 5 | Industry code (NIC-based, five digits) | `17110` |
| 7–8 | 2 | State / Registrar of Companies jurisdiction code | `MH` |
| 9–12 | 4 | Year of incorporation | `1973` |
| 13–15 | 3 | Ownership / company type code | `PLC` |
| 16–21 | 6 | ROC registration number | `019786` |

Example: `L17110MH1973PLC019786` (Reliance Industries Limited).

Two nuances that the interface must not hide:

- **The state segment is a jurisdiction code, not always a state abbreviation.**
  A company registered in Pune carries `PN`, not `MH`; both decode to
  Maharashtra. Mumbai-II uses `MR`, Nagpur `ME`, Delhi-II `DC`, Kolkata-II `WR`,
  UP-II `UW`, Coimbatore `TZ`. The results show the state/UT name and the code,
  never just the code.
- **The code records where the company was registered, not where it operates.**
  A company can be registered in Delhi and trade only in Karnataka.

---

## 3. LLPIN anatomy

An LLPIN is **8 characters including the hyphen**:

```
AAA-1234
│││ ││││
│││ └┴┴┴— four-digit registration number
│└┴—————— three-letter sequential prefix
└———————— hyphen (required)
```

Rules:

1. Exactly three uppercase letters, one hyphen, exactly four digits.
2. The three-letter prefix is assigned sequentially by MCA. It carries **no**
   state, year, or company-type meaning.
3. There is no checksum and no embedded state or year.
4. Format-valid does not mean registered.

Because an LLPIN carries no decodable fields, the Type column shows `LLP`, the
Listed/State/Year/Company-type columns show `—`, and the registration number
shows the four digits.

---

## 4. Reference data

### 4.1 Listing status

| Code | Meaning |
| --- | --- |
| `L` | Listed company |
| `U` | Unlisted company |

Only these two letters are accepted in position 1.

### 4.2 State / ROC codes

`Current` means the code is in use on recent CINs. `Legacy` means older CINs
carry it and it is still accepted. `ROC-specific` means the code identifies a
registrar office inside a state that also has a state-wide code. `Ambiguous`
means the code is not accepted because its meaning could not be verified.

| Code | State / Union Territory | Status | Note |
| --- | --- | --- | --- |
| `AN` | Andaman and Nicobar Islands | Current | |
| `AP` | Andhra Pradesh | Current | `AD` is a tax code, not a CIN code |
| `AR` | Arunachal Pradesh | Current | |
| `AS` | Assam | Current | |
| `BR` | Bihar | Current | `BH` is a tax code, not a CIN code |
| `CT` | Chhattisgarh | Current | CINs use `CT`; `CG` is a GST code and is rejected |
| `GA` | Goa | Current | |
| `GJ` | Gujarat | Current | |
| `HR` | Haryana | Current | |
| `HP` | Himachal Pradesh | Current | |
| `JH` | Jharkhand | Current | |
| `KA` | Karnataka | Current | |
| `KL` | Kerala | Current | |
| `MP` | Madhya Pradesh | Current | |
| `MH` | Maharashtra | Current | State-wide / Mumbai |
| `MR` | Maharashtra | ROC-specific | Mumbai-II, used from the 2026 ROC split |
| `PN` | Maharashtra | ROC-specific | Pune |
| `ME` | Maharashtra | ROC-specific | Nagpur. Collides with Meghalaya's GST code; Meghalaya CINs use `ML` |
| `MN` | Manipur | Current | |
| `ML` | Meghalaya | Current | |
| `MZ` | Mizoram | Current | `MI` is a tax code, not a CIN code |
| `NL` | Nagaland | Current | |
| `OD` | Odisha | Current | Used on recent CINs |
| `OR` | Odisha | Legacy | Still accepted on older CINs |
| `PB` | Punjab | Current | |
| `RJ` | Rajasthan | Current | |
| `SK` | Sikkim | Current | |
| `TN` | Tamil Nadu | Current | |
| `TZ` | Tamil Nadu | ROC-specific | Coimbatore |
| `TG` | Telangana | Current | |
| `TS` | Telangana | Legacy / alternate | Accepted; sources disagree on which of `TS`/`TG` is newer |
| `TR` | Tripura | Current | |
| `UP` | Uttar Pradesh | Current | |
| `UW` | Uttar Pradesh | ROC-specific | UP-II (Noida), used from the 2026 ROC split |
| `UR` | Uttarakhand | Legacy | Used on older CINs (e.g. 2021) |
| `UT` | Uttarakhand | Current | Used on recent CINs (e.g. 2026); `UK` is rejected |
| `WB` | West Bengal | Current | |
| `WR` | West Bengal | ROC-specific | Kolkata-II, used from the 2026 ROC split |
| `CH` | Chandigarh | Current | |
| `DD` | Dadra and Nagar Haveli and Daman & Diu | Legacy | Daman & Diu; both `DD` and `DN` now decode to the merged UT |
| `DN` | Dadra and Nagar Haveli and Daman & Diu | Legacy | Dadra & Nagar Haveli |
| `DL` | Delhi | Current | |
| `DC` | Delhi | ROC-specific | Delhi-II, used from the 2026 ROC split |
| `JK` | Jammu and Kashmir | Current | |
| `LH` | Ladakh | Current | Observed on Ladakh CINs; some Ladakh companies still carry `JK` (ROC Jammu) |
| `LD` | Lakshadweep | Current | |
| `PY` | Puducherry | Current | |

Rejected codes that users commonly try, each with a specific hint:

| Code | Why it is rejected |
| --- | --- |
| `CG` | Chhattisgarh CINs use `CT`. `CG` is the GST/ISO code. |
| `UK` | Uttarakhand CINs use `UT` or the older `UR`. |
| `BH` | Bihar CINs use `BR`. |
| `MI` | Mizoram CINs use `MZ`. |
| `AD` | Andhra Pradesh CINs use `AP`. |
| `DH` | The merged UT uses `DD` or `DN`. |
| `LA` | Appears on at least one 1997 Lakshadweep CIN. The meaning is unverified, so it is not silently mapped; the hint points to `LD`. |

This is a complete list of codes the checker accepts. Anything else is an
error. No code in this table is invented; see §12 for verification levels.

### 4.3 Ownership / company type codes

| Code | Display name | Verification |
| --- | --- | --- |
| `PLC` | Public limited company | Verified: official code lists and real CINs |
| `PTC` | Private limited company | Verified: official code lists and real CINs |
| `OPC` | One person company | Verified: real CINs |
| `NPL` | Not-for-profit company (Section 8) | Verified: real CINs |
| `FLC` | Foreign subsidiary (public limited) | Expansion **UNVERIFIED**. MoSPI gives "public limited foreign company incorporated in India"; several tax sites give "Financial Lease Company as Public Limited" |
| `FTC` | Foreign subsidiary (private limited) | Verified: MoSPI and real CINs |
| `GAP` | Guarantee and association company (public) | **UNVERIFIED** as a CIN code; no live example recorded. Also described as "General Association Public" |
| `GAT` | Guarantee and association company (private) | **UNVERIFIED**; same caveat |
| `GOI` | Government of India company | Verified: real CINs |
| `SGC` | State government company | Verified: real CINs |
| `ULL` | Public unlimited liability company | Verified in official lists; no live CIN example recorded |
| `ULT` | Private unlimited liability company | Verified in official lists; no live CIN example recorded |
| `PLN` | Nidhi company (public limited) | Code **observed** on real CINs; expansion is **UNVERIFIED** because MCA has not published it |

`PLN` is included because it appears on real Nidhi company CINs
(`U65999MH2021PLN362365`, `U74120TN2012PLN086751`). Excluding it would reject
valid numbers.

`GAP`/`GAT` are included because they appear in official and widely used code
lists, but no live CIN was found. They are labelled UNVERIFIED in the UI's code
reference.

The industry code is **not** checked against a NIC edition. NIC-2004, NIC-2008,
and older editions coexist in older CINs, so a semantic check would produce
false errors.

### 4.4 Year range

- Earliest accepted year: **1850**, the first Indian companies Act.
- Latest accepted year: the **current calendar year at runtime** (2026 at the
  time of writing).
- A year before 1850 and a future year are separate errors with separate
  messages.

---

## 5. Input handling

1. Split on `\n`, `\r\n`, or `\r`.
2. Trim each line.
3. Drop lines that are empty after trimming.
4. Convert to uppercase.
5. Remove internal whitespace (spaces, tabs, non-breaking spaces, zero-width
   characters) so a CIN copied out of a PDF or email still checks.
6. Do **not** remove any other punctuation. A hyphen inside a CIN is an error;
   a missing hyphen in an LLPIN is an error.
7. Process at most **2,000 lines**. Report how many were dropped.
8. A line of any length is accepted as input. Display is truncated at 64
   characters; the full value is kept for validation and CSV export.

Trade-off: stripping internal whitespace means a stray space can never be
reported as an error, but CINs pasted from PDFs and email routinely contain
them, and rejecting those would make the tool useless for its main job.

Line counting is on non-empty lines. Blank-only input is treated as empty.

---

## 6. Validation rules

Rules run in order. Messages are exact; tests assert them.

### 6.1 Classification

A normalised value is:

1. an **LLPIN** if it matches `^[A-Z]{3}-[0-9]{4}$`;
2. an **LLPIN attempt** if it is 6–10 characters and matches
   `^[A-Z]{2,5}-?[0-9]{2,5}$`;
3. a **CIN attempt** if it is 18–24 characters, contains at most two
   non-alphanumeric characters, and is otherwise alphanumeric or hyphenated;
4. otherwise **unknown**.

The attempt branches exist so a user who forgot the hyphen, or dropped a
character, gets a specific message instead of "this is not a number".

### 6.2 CIN rules

| # | Rule | Message |
| --- | --- | --- |
| C1 | Length is exactly 21. If not, stop: positional checks would be unreliable. | `A CIN must be exactly 21 characters. This one has {n}.` |
| C2 | Position 1 is `L` or `U`. | `The first character must be L (listed) or U (unlisted). This one is {c}.` |
| C3 | Positions 2–6 are five digits. | `Characters 2–6 are the industry code and must be 5 digits. This one is {value}.` |
| C4 | Positions 7–8 are two letters. | `Characters 7–8 are the state code and must be 2 letters. This one is {value}.` |
| C5 | The state code is in the accepted table. | `The state code {code} is not a valid Indian state or UT.` plus a hint when one exists, e.g. ` Chhattisgarh CINs use CT.` |
| C6 | Positions 9–12 are four digits. | `Characters 9–12 are the year of incorporation and must be 4 digits. This one is {value}.` |
| C7 | The year is not before 1850. | `The year {year} is before 1850, when company registration began in India.` |
| C8 | The year is not after the current year. | `The year {year} is in the future.` |
| C9 | Positions 13–15 are three letters. | `Characters 13–15 are the company type and must be 3 letters. This one is {value}.` |
| C10 | The company type is in the accepted table. | `The company type {code} is not a recognised CIN ownership code.` |
| C11 | Positions 16–21 are six digits. | `Characters 16–21 are the registration number and must be 6 digits. This one is {value}.` |

C2–C11 are independent and **all** failing ones are reported for a 21-character
line. C1 short-circuits because every later position would be misaligned.

### 6.3 LLPIN rules

| # | Rule | Message |
| --- | --- | --- |
| L1 | Length is exactly 8. | `An LLPIN is 8 characters including the hyphen. This one has {n}.` |
| L2 | The first three characters are letters. | `An LLPIN starts with three letters, like AAA-1234.` |
| L3 | Character 4 is a hyphen. | `An LLPIN needs a hyphen after the first three letters, like AAA-1234.` |
| L4 | Characters 5–8 are four digits. | `An LLPIN ends with four digits, like AAA-1234.` |

L1–L4 are independent and all failures are reported.

### 6.4 Unknown input

| # | Rule | Message |
| --- | --- | --- |
| U1 | The line is not CIN-like or LLPIN-like. | `This doesn't look like a CIN (21 characters) or an LLPIN (format AAA-1234). It has {n} character(s).` |

`{n}` is the normalised length, and the noun is singular for 1.

---

## 7. Result model

`checkLine(rawLine)` returns `null` for a blank line, otherwise exactly this
shape and no other keys:

```js
{
  raw,               // the line as typed, trimmed, original case and spacing
  value,             // normalised: uppercase, no whitespace
  kind,              // 'CIN' | 'LLP' | 'UNKNOWN'
  valid,             // true only when errors is empty
  errors,            // string[], every failure found
  listed,            // true | false | null
  stateCode,         // 'MH' | null
  stateName,         // 'Maharashtra' | null
  year,              // 1973 | null
  companyTypeCode,   // 'PLC' | null
  companyTypeName,   // 'Public limited company' | null
  industryCode,      // '17110' | null
  registrationNumber // '019786' | '1234' | null
}
```

For an LLP, `companyTypeName` is `Limited Liability Partnership`; all other
decoded fields are `null`. For `UNKNOWN`, every decoded field is `null`.

An unknown but well-formed state code is kept in `stateCode` with
`stateName: null`, so the interface can show the code the user typed. The same
applies to an unknown company type code.

### Exports

`src/validate.js` exports:

- `parseInput(text, { maxLines })` → `{ entries, total, truncated, dropped }`
- `classify(value)` → `'CIN' | 'LLP' | 'UNKNOWN'`
- `validateCIN(input, { now })` → result object
- `validateLLPIN(input)` → result object
- `checkLine(rawLine, { now })` → result object or `null`
- `MAX_LINES` (2000)

`now` exists so tests can pin the current year. It defaults to `new Date()`.

`src/validate.js` contains no DOM access.

---

## 8. Interface requirements

### Structure

1. Header: product name and one-sentence description.
2. Checker panel: visible label, large textarea, two example numbers in the
   placeholder, `Check numbers` primary button, `Load sample` and `Clear`
   secondary actions, live line count.
3. Results: summary bar (`9 valid · 3 invalid · 2 LLPs`), filter chips
   `All` / `Valid` / `Invalid`, `Copy as CSV`, `Download CSV`.
4. Desktop table columns: Number, Status, Type, Listed, State, Year,
   Company type. Invalid rows show their errors inline, directly under the row.
5. Below 720px: cards instead of a table. No horizontal scrolling. This
   covers the required 640px mobile case and avoids a cramped table between
   640 and 719px.
6. A CIN anatomy strip, two short context cards, and a collapsible list of
   accepted codes generated from `src/reference.js`.
7. Footer: MCA verification warning, sources.

### States

- Empty input: no results; a polite message asks for at least one number.
- Blank-only input: same as empty.
- All valid, all invalid, mixed.
- 500+ lines: renders without blocking.
- More than 2,000 lines: first 2,000 checked; a notice gives the number dropped.
- A 10,000-character line: validation still runs; display truncates at 64
  characters with an ellipsis and never widens the layout.
- A filter with no matches: explicit empty message.

### Status

Status is always **icon + text + colour**, never colour alone. Icons are inline
SVG. Valid uses a check, invalid an alert triangle, unknown a question mark.

### CSV

Columns: `Number, Status, Type, Listed, State, Year, Company type, Errors`.
Cells are quoted, quotes doubled, and values starting with `=`, `+`, `-`, or
`@` are prefixed with an apostrophe to prevent spreadsheet formula injection.
The file is named `cin-check-YYYY-MM-DD.csv`.

### Design direction

Premium utilitarian minimalism: warm off-white paper, off-black ink, one deep
teal accent, muted pastel status washes, editorial serif headings, system sans
body, monospace numbers. Flat surfaces, 1px borders, 8–12px radii, no
gradients, no heavy shadows, no emoji. Visible focus rings, WCAG AA contrast,
44px minimum touch targets on mobile. Light palette only, as requested; the
page declares `color-scheme: light` so native controls match.

Trade-off: a serif display face and generous whitespace make a legal-format
tool feel considered rather than bureaucratic, at the cost of some vertical
space above the fold; the checker itself still starts within the first screen
on a laptop.

---

## 9. Accessibility

- Every input has a visible `<label>`.
- The summary is `aria-live="polite"`.
- Copy/download feedback goes to a visually hidden live region.
- The table has a caption (visually hidden) and `th scope="col"`.
- Filter chips are buttons with `aria-pressed`.
- Focus is never trapped; the whole flow works with Tab, Enter, and Space.
- `Cmd/Ctrl + Enter` in the textarea runs the check.
- Status is never communicated by colour alone.
- Reduced motion is respected.
- Error text is associated with its row visually and included in the CSV.

---

## 10. Performance and limits

- 2,000 lines maximum per check.
- Validation is synchronous and pure; 2,000 CINs is a few milliseconds.
- Rendering builds a `DocumentFragment` and inserts once.
- Only the active layout (table or cards) is rendered; a `matchMedia` listener
  re-renders on breakpoint change.
- No network requests after load except the optional Google font.

---

## 11. Data handling

- Input is stored in `sessionStorage` so a reload does not lose a paste.
- `Clear` removes it.
- Results are never stored.
- No analytics, no cookies, no server calls.

---

## 12. Sources and verification levels

| Level | Meaning |
| --- | --- |
| Verified | In an official code list and/or confirmed on real CINs cited in this repository |
| Observed | Seen on real CINs, but the expansion is not officially published |
| Unverified | In secondary code lists only, or expansions that conflict between sources |

Sources consulted:

1. Ministry of Statistics and Programme Implementation, *Annual Survey of
   Industries 2017–18: Instructions* — CIN structure and ownership codes,
   including `FLC`/`FTC` as public/private foreign companies and `GAP`/`GAT` as
   guarantee and association companies.
   <https://mospi.gov.in/sites/default/files/publication_reports/Instruction.pdf>
2. TaxGuru, *Understanding Corporate Identification Number (CIN)* (2025).
   <https://taxguru.in/company-law/understanding-corporate-identification-number-cin.html>
3. TaxGuru, *Why Corporate Identity Number (CIN) & Know Structure of CIN*
   (2021).
   <https://taxguru.in/company-law/corporate-identity-number-cin-structure-cin.html>
4. Bajaj Finserv, *What is a Corporate Identification Number (CIN)*.
   <https://www.bajajfinserv.in/what-is-cin>
5. MCA21 company/LLP master data (for manual verification of any number).
   <https://www.mca.gov.in>
6. CompanysRegistration.com, *State from CIN Explained* (October 2026) —
   multiple ROC codes per state and the 2026 jurisdiction changes.
   <https://companysregistration.com/blogs/registration-trend/state-from-cin-company-registration-data-explained>
7. Real CINs used as fixtures, including:
   `L17110MH1973PLC019786`, `L85110KA1981PLC013115`,
   `U29299PN1998PTC013028`, `U72900OR2013PTC017289`,
   `U72100OD2026PTC052993`, `U27100CT2010PTC021930`,
   `U15400UR2021PTC012592`, `U43210UT2026PTC021338`,
   `U01100LH2023PTC011307`, `U63030LH2022OPC011301`,
   `U40109UR2001SGC025867`, `U05004LD1987GOI004937`,
   `U65999MH2021PLN362365`, `U74120TN2012PLN086751`,
   `U29309AP2017FTC105878`, `U24100MH1970FLC014927`,
   `U74999WB2016NPL216827`.

MCA has not published a single formal public CIN specification. The structure
and code lists above are assembled from the government sources and observed
CINs. This limitation is stated in the README and in the interface.

---

## 13. Open questions and unverified items

1. `FLC` expansion: MoSPI says public limited foreign company; several tax sites
   say Financial Lease Company as Public Limited. Displayed as "Foreign
   subsidiary (public limited)", marked unverified.
2. `PLN` expansion: the code is certain from real Nidhi CINs; the expansion is
   not officially published.
3. `GAP`/`GAT`: no live CIN found. Included because multiple code lists carry
   them; marked unverified.
4. `ME`: mapped to Nagpur (Maharashtra) following the 2026 jurisdiction
   methodology. It is also Meghalaya's GST code, so a CIN using `ME` for
   Meghalaya would be decoded as Maharashtra. Meghalaya CINs use `ML`.
5. `TS`/`TG`: both accepted. Sources disagree about which is newer.
6. `LA`: rejected with a hint. One 1997 Lakshadweep CIN uses it; the meaning is
   unverified.
7. `LH` for Ladakh: observed, but some Ladakh companies carry `JK` because they
   are registered with ROC Jammu.
8. The 2026 ROC split codes (`DC`, `MR`, `ME`, `UW`, `WR`) are observed in
   current data and documented by secondary trackers; MCA's public code list
   has not been independently captured here.
