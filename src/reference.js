/**
 * Reference data for Indian CIN and LLPIN validation.
 *
 * Status values:
 *   verified   - in an official code list and/or confirmed on a real CIN
 *   observed   - seen on real CINs, expansion not officially published
 *   unverified - secondary sources only, or sources disagree
 *
 * Sources are listed at the bottom of this file and in docs/spec.md.
 */

export const LAST_REVIEWED = '25 November 2026';

export const STATES = {
  AN: { name: 'Andaman and Nicobar Islands', status: 'verified' },
  AP: { name: 'Andhra Pradesh', status: 'verified', note: 'AD is a tax code, not a CIN code.' },
  AR: { name: 'Arunachal Pradesh', status: 'verified' },
  AS: { name: 'Assam', status: 'verified' },
  BR: { name: 'Bihar', status: 'verified', note: 'BH is a tax code, not a CIN code.' },
  CT: { name: 'Chhattisgarh', status: 'verified', note: 'CINs use CT. CG is a GST code.' },
  GA: { name: 'Goa', status: 'verified' },
  GJ: { name: 'Gujarat', status: 'verified' },
  HR: { name: 'Haryana', status: 'verified' },
  HP: { name: 'Himachal Pradesh', status: 'verified' },
  JH: { name: 'Jharkhand', status: 'verified' },
  KA: { name: 'Karnataka', status: 'verified' },
  KL: { name: 'Kerala', status: 'verified' },
  MP: { name: 'Madhya Pradesh', status: 'verified' },
  MH: { name: 'Maharashtra', status: 'verified', note: 'State-wide / Mumbai ROC.' },
  MR: { name: 'Maharashtra', status: 'observed', note: 'Mumbai-II ROC, used from the 2026 split.' },
  PN: { name: 'Maharashtra', status: 'observed', note: 'Pune ROC.' },
  ME: {
    name: 'Maharashtra',
    status: 'observed',
    note: 'Nagpur ROC. Collides with Meghalaya’s GST code; Meghalaya CINs use ML.',
  },
  MN: { name: 'Manipur', status: 'verified' },
  ML: { name: 'Meghalaya', status: 'verified' },
  MZ: { name: 'Mizoram', status: 'verified', note: 'MI is a tax code, not a CIN code.' },
  NL: { name: 'Nagaland', status: 'verified' },
  OD: { name: 'Odisha', status: 'observed', note: 'Used on recent CINs.' },
  OR: { name: 'Odisha', status: 'verified', note: 'Older code; OD is also accepted.' },
  PB: { name: 'Punjab', status: 'verified' },
  RJ: { name: 'Rajasthan', status: 'verified' },
  SK: { name: 'Sikkim', status: 'verified' },
  TN: { name: 'Tamil Nadu', status: 'verified' },
  TZ: { name: 'Tamil Nadu', status: 'observed', note: 'Coimbatore ROC.' },
  TG: { name: 'Telangana', status: 'observed' },
  TS: { name: 'Telangana', status: 'observed', note: 'Alternate code; TG is also accepted.' },
  TR: { name: 'Tripura', status: 'verified' },
  UP: { name: 'Uttar Pradesh', status: 'verified' },
  UW: { name: 'Uttar Pradesh', status: 'observed', note: 'UP-II (Noida) ROC, used from the 2026 split.' },
  UR: { name: 'Uttarakhand', status: 'verified', note: 'Older code; UT is also accepted.' },
  UT: { name: 'Uttarakhand', status: 'observed', note: 'Used on recent CINs. UK is not a CIN code.' },
  WB: { name: 'West Bengal', status: 'verified' },
  WR: { name: 'West Bengal', status: 'observed', note: 'Kolkata-II ROC, used from the 2026 split.' },
  CH: { name: 'Chandigarh', status: 'verified' },
  DD: {
    name: 'Dadra and Nagar Haveli and Daman & Diu',
    status: 'verified',
    note: 'Daman & Diu. DN also maps here.',
  },
  DN: {
    name: 'Dadra and Nagar Haveli and Daman & Diu',
    status: 'verified',
    note: 'Dadra & Nagar Haveli. DD also maps here.',
  },
  DL: { name: 'Delhi', status: 'verified' },
  DC: { name: 'Delhi', status: 'observed', note: 'Delhi-II ROC, used from the 2026 split.' },
  JK: { name: 'Jammu and Kashmir', status: 'verified' },
  LH: {
    name: 'Ladakh',
    status: 'observed',
    note: 'Observed on Ladakh CINs. Some Ladakh companies still carry JK (ROC Jammu).',
  },
  LD: { name: 'Lakshadweep', status: 'verified' },
  PY: { name: 'Puducherry', status: 'verified' },
};

/**
 * Codes that look plausible but are not CIN jurisdiction codes.
 * The value is a short sentence appended to the standard state error.
 */
export const STATE_HINTS = {
  CG: 'Chhattisgarh CINs use CT.',
  UK: 'Uttarakhand CINs use UT or the older UR.',
  BH: 'Bihar CINs use BR.',
  MI: 'Mizoram CINs use MZ.',
  AD: 'Andhra Pradesh CINs use AP.',
  DH: 'The merged UT uses DD or DN.',
  LA: 'Lakshadweep CINs normally use LD.',
};

export const OWNERSHIP_CODES = {
  PLC: {
    name: 'Public limited company',
    status: 'verified',
  },
  PTC: {
    name: 'Private limited company',
    status: 'verified',
  },
  OPC: {
    name: 'One person company',
    status: 'verified',
  },
  NPL: {
    name: 'Not-for-profit company (Section 8)',
    status: 'verified',
  },
  FLC: {
    name: 'Foreign subsidiary (public limited)',
    status: 'unverified',
    note: 'MoSPI calls this a public limited foreign company. Several tax sites say “financial lease company”.',
  },
  FTC: {
    name: 'Foreign subsidiary (private limited)',
    status: 'verified',
  },
  GAP: {
    name: 'Guarantee and association company (public)',
    status: 'unverified',
    note: 'Also described as “general association public”. No live CIN example recorded.',
  },
  GAT: {
    name: 'Guarantee and association company (private)',
    status: 'unverified',
    note: 'Also described as “general association private”. No live CIN example recorded.',
  },
  GOI: {
    name: 'Government of India company',
    status: 'verified',
  },
  SGC: {
    name: 'State government company',
    status: 'verified',
  },
  ULL: {
    name: 'Public unlimited liability company',
    status: 'verified',
    note: 'No live CIN example recorded.',
  },
  ULT: {
    name: 'Private unlimited liability company',
    status: 'verified',
    note: 'No live CIN example recorded.',
  },
  PLN: {
    name: 'Nidhi company (public limited)',
    status: 'observed',
    note: 'Observed on real Nidhi CINs. MCA has not published the expansion.',
  },
};

export const LISTING_STATUS = {
  L: 'Listed',
  U: 'Unlisted',
};

export const LLP_TYPE_NAME = 'Limited Liability Partnership';

export const MIN_YEAR = 1850;

export const SOURCES = [
  {
    label: 'MoSPI, Annual Survey of Industries 2017–18: Instructions',
    url: 'https://mospi.gov.in/sites/default/files/publication_reports/Instruction.pdf',
  },
  {
    label: 'TaxGuru, Understanding Corporate Identification Number (CIN)',
    url: 'https://taxguru.in/company-law/understanding-corporate-identification-number-cin.html',
  },
  {
    label: 'CompanysRegistration.com, State from CIN Explained',
    url: 'https://companysregistration.com/blogs/registration-trend/state-from-cin-company-registration-data-explained',
  },
  {
    label: 'MCA21 company and LLP master data',
    url: 'https://www.mca.gov.in',
  },
];
