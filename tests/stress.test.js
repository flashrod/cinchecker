import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseInput,
  classify,
  validateCIN,
  validateLLPIN,
  checkLine,
} from '../src/validate.js';
import { STATES, OWNERSHIP_CODES } from '../src/reference.js';

const now = new Date('2026-11-25T00:00:00Z');
const opts = { now };

function cin(state = 'MH', year = 2020, type = 'PTC') {
  return `U12345${state}${year}${type}000001`;
}

test('stress: every accepted state decodes as valid', () => {
  const failures = [];
  for (const code of Object.keys(STATES)) {
    const res = checkLine(cin(code), opts);
    if (!res.valid) failures.push({ code, errors: res.errors });
    if (res.stateName !== STATES[code].name) {
      failures.push({ code, got: res.stateName, want: STATES[code].name });
    }
  }
  assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 5)));
});

test('stress: every ownership code decodes as valid', () => {
  const failures = [];
  for (const code of Object.keys(OWNERSHIP_CODES)) {
    const res = checkLine(cin('MH', 2020, code), opts);
    if (!res.valid) failures.push({ code, errors: res.errors });
    if (res.companyTypeName !== OWNERSHIP_CODES[code].name) {
      failures.push({ code, got: res.companyTypeName, want: OWNERSHIP_CODES[code].name });
    }
  }
  assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 5)));
});

test('stress: 500 random valid CINs all pass', () => {
  const states = Object.keys(STATES);
  const types = Object.keys(OWNERSHIP_CODES);
  let bad = 0;
  for (let i = 0; i < 500; i++) {
    const state = states[i % states.length];
    const type = types[i % types.length];
    const year = 1850 + (i % 177);
    const industry = String(10000 + ((i * 7919) % 89999));
    const reg = String(100000 + ((i * 104729) % 899999));
    const value = (i % 2 ? 'L' : 'U') + industry + state + year + type + reg;
    if (!checkLine(value, opts).valid) bad++;
  }
  assert.equal(bad, 0);
});

test('stress: 100k lines parsed and capped at 2,000 fast', () => {
  const many = Array.from({ length: 100000 }, () => 'L17110MH1973PLC019786').join('\n');
  const t0 = performance.now();
  const parsed = parseInput(many);
  const t1 = performance.now();
  assert.equal(parsed.total, 100000);
  assert.equal(parsed.entries.length, 2000);
  assert.equal(parsed.dropped, 98000);
  assert.ok(parsed.truncated);
  assert.ok(t1 - t0 < 100, `parse took ${Math.round(t1 - t0)}ms`);
});

test('stress: 1,000,000-char single line is classified without hanging', () => {
  const huge = 'Z'.repeat(1000000);
  const t0 = performance.now();
  const res = checkLine(huge, opts);
  const t1 = performance.now();
  assert.equal(res.kind, 'UNKNOWN');
  assert.equal(res.raw.length, 1000000);
  assert.ok(t1 - t0 < 500, `classify took ${Math.round(t1 - t0)}ms`);
  assert.match(res.errors[0], /1000000 characters/);
});

test('stress: empty and blank-only input yields nothing', () => {
  for (const value of ['', '   ', '\n\n  \t', '\n\n']) {
    const parsed = parseInput(value);
    assert.equal(parsed.total, 0);
    assert.equal(parsed.entries.length, 0);
  }
});

test('stress: all-invalid mixed batch reports each error', () => {
  const lines = [
    'ZZ17110MH1973PLC019786', // bad listing char
    'L17110ZZ1973PLC019786', // bad state
    'L17110MH2090PTC019786', // future year
    'AAA-1234-', // LLP trailing hyphen
    'hello world', // garbage
  ];
  const results = lines.map((l) => checkLine(l, opts));
  assert.equal(results.filter((r) => r.valid).length, 0);
  assert.ok(results.every((r) => r.errors.length > 0));
  assert.ok(results.some((r) => r.errors.some((e) => e.includes('state code ZZ'))));
  assert.ok(results.some((r) => r.errors.some((e) => e.includes('year 2090'))));
});

test('stress: normalisation handles case, spaces, nbsp, zero-width, fullwidth', () => {
  const good = 'L17110MH1973PLC019786';
  assert.ok(checkLine(good.toLowerCase(), opts).valid);
  assert.ok(checkLine(` ${good} `, opts).valid);
  assert.ok(checkLine(`L17110\tMH1973\tPLC019786`, opts).valid);
  assert.ok(checkLine(`L17110\u00A0MH1973\u00A0PLC019786`, opts).valid);
  assert.ok(checkLine(`L17110\u200BMH1973\u200BPLC019786`, opts).valid);
  assert.ok(checkLine('Ｌ１７１１０ＭＨ１９７３ＰＬＣ０１９７８６', opts).valid);
});

test('stress: classify never hangs on adversarial input', () => {
  const adversarial = [
    'A'.repeat(100),
    '!!!@@@###$$$',
    'AAA-1234!!!!',
    'L17110MH1973PLC019786extra',
    '😀😀😀😀😀😀😀😀',
    'AB-CD-EF-GH-IJ',
    '123456789012345678901',
  ];
  const t0 = performance.now();
  for (const a of adversarial) classify(a);
  const t1 = performance.now();
  assert.ok(t1 - t0 < 50, `classify took ${Math.round(t1 - t0)}ms`);
});

test('stress: result shape is always complete', () => {
  const keys = [
    'raw', 'value', 'kind', 'valid', 'errors', 'listed',
    'stateCode', 'stateName', 'year', 'companyTypeCode',
    'companyTypeName', 'industryCode', 'registrationNumber',
  ];
  const samples = [
    checkLine('L17110MH1973PLC019786', opts),
    checkLine('AAA-1234'),
    checkLine('garbage'),
  ];
  for (const s of samples) {
    if (!s) continue;
    for (const k of keys) assert.ok(k in s, `missing key ${k}`);
    assert.ok(Array.isArray(s.errors));
  }
});

test('stress: unknown input message states expected and actual length', () => {
  const res = checkLine('hello', opts);
  assert.match(res.errors[0], /This doesn't look like a CIN \(21 characters\) or an LLPIN \(format AAA-1234\)\. It has 5 characters\./);
  const res2 = checkLine('Z'.repeat(10000), opts);
  assert.match(res2.errors[0], /It has 10000 characters\./);
});
