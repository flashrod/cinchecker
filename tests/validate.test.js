import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_LINES,
  checkLine,
  classify,
  parseInput,
  validateCIN,
  validateLLPIN,
} from '../src/validate.js';
import { OWNERSHIP_CODES, STATES } from '../src/reference.js';

const NOW = new Date('2026-11-25T00:00:00Z');
const opts = { now: NOW };

const RELIANCE = 'L17110MH1973PLC019786';
const INFOSYS = 'L85110KA1981PLC013115';

const RESULT_KEYS = [
  'companyTypeCode',
  'companyTypeName',
  'errors',
  'industryCode',
  'kind',
  'listed',
  'raw',
  'registrationNumber',
  'stateCode',
  'stateName',
  'valid',
  'value',
  'year',
];

const cin = (state = 'MH', year = 2020, type = 'PTC') =>
  `U12345${state}${year}${type}000001`;

test('parseInput returns nothing for empty and blank-only input', () => {
  assert.deepEqual(parseInput(''), {
    entries: [],
    total: 0,
    truncated: false,
    dropped: 0,
  });
  assert.deepEqual(parseInput('  \n\t\n \r\n'), {
    entries: [],
    total: 0,
    truncated: false,
    dropped: 0,
  });
});

test('parseInput trims lines, drops blanks, and handles CRLF and a BOM', () => {
  const parsed = parseInput('\uFEFF' + RELIANCE + '\r\n\r\n  AAA-1234  \n');
  assert.deepEqual(parsed.entries, [RELIANCE, 'AAA-1234']);
  assert.equal(parsed.total, 2);
  assert.equal(parsed.truncated, false);
});

test('parseInput caps at 2000 lines and reports what it dropped', () => {
  const text = Array.from({ length: 2500 }, () => RELIANCE).join('\n');
  const parsed = parseInput(text);
  assert.equal(MAX_LINES, 2000);
  assert.equal(parsed.total, 2500);
  assert.equal(parsed.entries.length, 2000);
  assert.equal(parsed.truncated, true);
  assert.equal(parsed.dropped, 500);
});

test('classify recognises CINs, LLPINs, and near misses', () => {
  assert.equal(classify(RELIANCE), 'CIN');
  assert.equal(classify('l17110mh1973plc019786'), 'CIN');
  assert.equal(classify('AAA-1234'), 'LLP');
  assert.equal(classify('AAA1234'), 'LLP');
  assert.equal(classify('L17110MH1973PLC01978'), 'CIN');
  assert.equal(classify('ABC123456789012'), 'UNKNOWN');
  assert.equal(classify('not a number'), 'UNKNOWN');
});

test('a valid listed CIN decodes every field', () => {
  const result = checkLine(RELIANCE, opts);
  assert.deepEqual(Object.keys(result).sort(), RESULT_KEYS);
  assert.equal(result.raw, RELIANCE);
  assert.equal(result.value, RELIANCE);
  assert.equal(result.kind, 'CIN');
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.listed, true);
  assert.equal(result.stateCode, 'MH');
  assert.equal(result.stateName, 'Maharashtra');
  assert.equal(result.year, 1973);
  assert.equal(result.companyTypeCode, 'PLC');
  assert.equal(result.companyTypeName, 'Public limited company');
  assert.equal(result.industryCode, '17110');
  assert.equal(result.registrationNumber, '019786');
});

test('an unlisted CIN reports listed: false', () => {
  const result = checkLine(INFOSYS.replace(/^L/, 'U'), opts);
  assert.equal(result.valid, true);
  assert.equal(result.listed, false);
  assert.equal(result.stateName, 'Karnataka');
  assert.equal(result.year, 1981);
});

test('lowercase and stray whitespace are normalised without losing the raw line', () => {
  const result = checkLine('  l17110 mh1973 plc019786  ', opts);
  assert.equal(result.raw, 'l17110 mh1973 plc019786');
  assert.equal(result.value, RELIANCE);
  assert.equal(result.valid, true);
});

test('every accepted state and ROC code produces a valid CIN', () => {
  for (const code of Object.keys(STATES)) {
    const result = checkLine(cin(code), opts);
    assert.equal(result.valid, true, `${code} should be accepted: ${result.errors.join(' | ')}`);
    assert.equal(result.stateCode, code);
    assert.equal(result.stateName, STATES[code].name);
  }
});

test('state aliases decode to the right state or union territory', () => {
  const expectations = {
    MH: 'Maharashtra',
    MR: 'Maharashtra',
    PN: 'Maharashtra',
    ME: 'Maharashtra',
    TN: 'Tamil Nadu',
    TZ: 'Tamil Nadu',
    TS: 'Telangana',
    TG: 'Telangana',
    OR: 'Odisha',
    OD: 'Odisha',
    UR: 'Uttarakhand',
    UT: 'Uttarakhand',
    DD: 'Dadra and Nagar Haveli and Daman & Diu',
    DN: 'Dadra and Nagar Haveli and Daman & Diu',
    DL: 'Delhi',
    DC: 'Delhi',
    WB: 'West Bengal',
    WR: 'West Bengal',
    UP: 'Uttar Pradesh',
    UW: 'Uttar Pradesh',
    LH: 'Ladakh',
    LD: 'Lakshadweep',
    JK: 'Jammu and Kashmir',
  };
  for (const [code, name] of Object.entries(expectations)) {
    assert.equal(checkLine(cin(code), opts).stateName, name, code);
  }
});

test('every accepted ownership code produces a valid CIN', () => {
  for (const code of Object.keys(OWNERSHIP_CODES)) {
    const result = checkLine(cin('MH', 2020, code), opts);
    assert.equal(result.valid, true, `${code} should be accepted: ${result.errors.join(' | ')}`);
    assert.equal(result.companyTypeCode, code);
    assert.equal(result.companyTypeName, OWNERSHIP_CODES[code].name);
  }
});

test('real-world CINs decode as expected', () => {
  const cases = [
    ['U29299PN1998PTC013028', 'Maharashtra', 1998, 'PTC'],
    ['U72900OR2013PTC017289', 'Odisha', 2013, 'PTC'],
    ['U72100OD2026PTC052993', 'Odisha', 2026, 'PTC'],
    ['U27100CT2010PTC021930', 'Chhattisgarh', 2010, 'PTC'],
    ['U15400UR2021PTC012592', 'Uttarakhand', 2021, 'PTC'],
    ['U43210UT2026PTC021338', 'Uttarakhand', 2026, 'PTC'],
    ['U01100LH2023PTC011307', 'Ladakh', 2023, 'PTC'],
    ['U63030LH2022OPC011301', 'Ladakh', 2022, 'OPC'],
    ['U40109UR2001SGC025867', 'Uttarakhand', 2001, 'SGC'],
    ['U05004LD1987GOI004937', 'Lakshadweep', 1987, 'GOI'],
    ['U65999MH2021PLN362365', 'Maharashtra', 2021, 'PLN'],
    ['U29309AP2017FTC105878', 'Andhra Pradesh', 2017, 'FTC'],
    ['U24100MH1970FLC014927', 'Maharashtra', 1970, 'FLC'],
    ['U74999WB2016NPL216827', 'West Bengal', 2016, 'NPL'],
  ];
  for (const [value, stateName, year, type] of cases) {
    const result = checkLine(value, opts);
    assert.equal(result.valid, true, `${value}: ${result.errors.join(' | ')}`);
    assert.equal(result.stateName, stateName, value);
    assert.equal(result.year, year, value);
    assert.equal(result.companyTypeCode, type, value);
  }
});

test('an unknown state code is reported with its exact message', () => {
  const result = checkLine(cin('ZZ'), opts);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    'The state code ZZ is not a valid Indian state or UT.',
  ]);
  assert.equal(result.stateCode, 'ZZ');
  assert.equal(result.stateName, null);
});

test('rejected lookalike state codes get a specific hint', () => {
  const cases = {
    CG: 'The state code CG is not a valid Indian state or UT. Chhattisgarh CINs use CT.',
    UK: 'The state code UK is not a valid Indian state or UT. Uttarakhand CINs use UT or the older UR.',
    BH: 'The state code BH is not a valid Indian state or UT. Bihar CINs use BR.',
    MI: 'The state code MI is not a valid Indian state or UT. Mizoram CINs use MZ.',
    AD: 'The state code AD is not a valid Indian state or UT. Andhra Pradesh CINs use AP.',
    DH: 'The state code DH is not a valid Indian state or UT. The merged UT uses DD or DN.',
    LA: 'The state code LA is not a valid Indian state or UT. Lakshadweep CINs normally use LD.',
  };
  for (const [code, message] of Object.entries(cases)) {
    assert.deepEqual(checkLine(cin(code), opts).errors, [message], code);
  }
});

test('a future year is rejected', () => {
  const result = checkLine(cin('MH', 2090), opts);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['The year 2090 is in the future.']);
  assert.equal(result.year, 2090);
});

test('a year before 1850 is rejected', () => {
  assert.deepEqual(checkLine(cin('MH', 1849), opts).errors, [
    'The year 1849 is before 1850, when company registration began in India.',
  ]);
  assert.equal(checkLine(cin('MH', 1850), opts).valid, true);
  assert.equal(checkLine(cin('MH', 2026), opts).valid, true);
});

test('a wrong-length CIN stops at the length error', () => {
  const short = 'L85110KA1981PLC0131';
  assert.equal(short.length, 20);
  assert.deepEqual(checkLine(short, opts).errors, [
    'A CIN must be exactly 21 characters. This one has 20.',
  ]);
  assert.deepEqual(checkLine(short + '5', opts).errors, [
    'A CIN must be exactly 21 characters. This one has 22.',
  ]);
});

test('a bad listing status is reported', () => {
  const result = checkLine(RELIANCE.replace(/^L/, 'X'), opts);
  assert.deepEqual(result.errors, [
    'The first character must be L (listed) or U (unlisted). This one is X.',
  ]);
  assert.equal(result.listed, null);
});

test('non-digit and non-letter field errors use the exact messages', () => {
  assert.deepEqual(checkLine(RELIANCE.replace('17110', '17A10'), opts).errors, [
    'Characters 2–6 are the industry code and must be 5 digits. This one is 17A10.',
  ]);
  assert.deepEqual(checkLine(RELIANCE.replace('MH', 'M1'), opts).errors, [
    'Characters 7–8 are the state code and must be 2 letters. This one is M1.',
  ]);
  assert.deepEqual(checkLine(RELIANCE.replace('1973', '19X3'), opts).errors, [
    'Characters 9–12 are the year of incorporation and must be 4 digits. This one is 19X3.',
  ]);
  assert.deepEqual(checkLine(RELIANCE.replace('PLC', 'P1C'), opts).errors, [
    'Characters 13–15 are the company type and must be 3 letters. This one is P1C.',
  ]);
  assert.deepEqual(checkLine(RELIANCE.replace('019786', '01978X'), opts).errors, [
    'Characters 16–21 are the registration number and must be 6 digits. This one is 01978X.',
  ]);
});

test('an unknown company type is reported and the code is kept', () => {
  const result = checkLine(cin('MH', 2020, 'XYZ'), opts);
  assert.deepEqual(result.errors, [
    'The company type XYZ is not a recognised CIN ownership code.',
  ]);
  assert.equal(result.companyTypeCode, 'XYZ');
  assert.equal(result.companyTypeName, null);
});

test('all CIN field errors on a 21-character line are collected', () => {
  const result = checkLine('X17A10ZZ2090XYZ01978X', opts);
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 6);
  assert.deepEqual(result.errors, [
    'The first character must be L (listed) or U (unlisted). This one is X.',
    'Characters 2–6 are the industry code and must be 5 digits. This one is 17A10.',
    'The state code ZZ is not a valid Indian state or UT.',
    'The year 2090 is in the future.',
    'The company type XYZ is not a recognised CIN ownership code.',
    'Characters 16–21 are the registration number and must be 6 digits. This one is 01978X.',
  ]);
});

test('a valid LLPIN decodes without inventing state or year', () => {
  const result = checkLine('AAA-1234');
  assert.deepEqual(Object.keys(result).sort(), RESULT_KEYS);
  assert.equal(result.kind, 'LLP');
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.listed, null);
  assert.equal(result.stateCode, null);
  assert.equal(result.stateName, null);
  assert.equal(result.year, null);
  assert.equal(result.companyTypeCode, null);
  assert.equal(result.companyTypeName, 'Limited Liability Partnership');
  assert.equal(result.industryCode, null);
  assert.equal(result.registrationNumber, '1234');
});

test('LLPINs are normalised and accept lowercase', () => {
  const result = checkLine(' aaa-1234 ');
  assert.equal(result.raw, 'aaa-1234');
  assert.equal(result.value, 'AAA-1234');
  assert.equal(result.valid, true);
});

test('an LLPIN missing its hyphen gets a specific message', () => {
  assert.deepEqual(checkLine('AAA1234').errors, [
    'An LLPIN is 8 characters including the hyphen. This one has 7.',
    'An LLPIN needs a hyphen after the first three letters, like AAA-1234.',
  ]);
});

test('an LLPIN with a two-letter prefix gets a specific message', () => {
  assert.deepEqual(checkLine('AB-1234').errors, [
    'An LLPIN is 8 characters including the hyphen. This one has 7.',
    'An LLPIN starts with three letters, like AAA-1234.',
  ]);
});

test('an LLPIN with too few digits gets a specific message', () => {
  assert.deepEqual(checkLine('AAA-123').errors, [
    'An LLPIN is 8 characters including the hyphen. This one has 7.',
    'An LLPIN ends with four digits, like AAA-1234.',
  ]);
});

test('an LLPIN with too many digits gets length and suffix errors', () => {
  assert.deepEqual(checkLine('AAA-12345').errors, [
    'An LLPIN is 8 characters including the hyphen. This one has 9.',
    'An LLPIN ends with four digits, like AAA-1234.',
  ]);
});

test('validateLLPIN reports a numeric prefix', () => {
  assert.deepEqual(validateLLPIN('123-4567').errors, [
    'An LLPIN starts with three letters, like AAA-1234.',
  ]);
});

test('unknown input says what was expected and what it got', () => {
  const result = checkLine('ABC123456789012');
  assert.equal(result.kind, 'UNKNOWN');
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "This doesn't look like a CIN (21 characters) or an LLPIN (format AAA-1234). It has 15 characters.",
  ]);
  assert.equal(result.stateName, null);
  assert.equal(result.year, null);
});

test('the unknown message uses a singular noun for one character', () => {
  assert.deepEqual(checkLine('X').errors, [
    "This doesn't look like a CIN (21 characters) or an LLPIN (format AAA-1234). It has 1 character.",
  ]);
});

test('blank lines return null', () => {
  assert.equal(checkLine(''), null);
  assert.equal(checkLine('   '), null);
  assert.equal(checkLine('\u00A0'), null);
});

test('a 10,000-character line is handled without throwing or truncating data', () => {
  const long = 'Z'.repeat(10000);
  const result = checkLine(long);
  assert.equal(result.kind, 'UNKNOWN');
  assert.equal(result.raw.length, 10000);
  assert.equal(result.value.length, 10000);
  assert.match(result.errors[0], /It has 10000 characters\.$/);
});

test('500 lines are all checked', () => {
  const entries = parseInput(Array.from({ length: 500 }, () => RELIANCE).join('\n')).entries;
  const results = entries.map((line) => checkLine(line, opts));
  assert.equal(results.length, 500);
  assert.ok(results.every((result) => result.valid));
});

test('validateCIN can be called directly and preserves the raw input', () => {
  const result = validateCIN(' l17110mh1973plc019786 ', opts);
  assert.equal(result.raw, 'l17110mh1973plc019786');
  assert.equal(result.value, RELIANCE);
  assert.equal(result.valid, true);
});
