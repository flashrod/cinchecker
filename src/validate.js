/**
 * Pure validation logic for Indian CINs and LLPINs.
 *
 * No DOM access. Every function is synchronous and returns new objects.
 * The rules and exact messages are specified in docs/spec.md.
 */

import {
  LLP_TYPE_NAME,
  MIN_YEAR,
  OWNERSHIP_CODES,
  STATES,
  STATE_HINTS,
} from './reference.js';

export const MAX_LINES = 2000;

const WHITESPACE = /[\s\u200B-\u200D\uFEFF]+/g;
const LETTERS_2 = /^[A-Z]{2}$/;
const LETTERS_3 = /^[A-Z]{3}$/;
const DIGITS_4 = /^[0-9]{4}$/;
const DIGITS_5 = /^[0-9]{5}$/;
const DIGITS_6 = /^[0-9]{6}$/;

/** Uppercase and remove whitespace so PDF and email pastes still check. */
function normalise(input) {
  return String(input ?? '')
    .normalize('NFKC')
    .replace(WHITESPACE, '')
    .toUpperCase();
}

function emptyResult(raw, value, kind) {
  return {
    raw,
    value,
    kind,
    valid: false,
    errors: [],
    listed: null,
    stateCode: null,
    stateName: null,
    year: null,
    companyTypeCode: null,
    companyTypeName: null,
    industryCode: null,
    registrationNumber: null,
  };
}

function currentYear(now) {
  const date = now instanceof Date ? now : new Date(now);
  const year = date.getFullYear();
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function unknownMessage(length) {
  const noun = length === 1 ? 'character' : 'characters';
  return `This doesn't look like a CIN (21 characters) or an LLPIN (format AAA-1234). It has ${length} ${noun}.`;
}

/**
 * Split pasted text into candidate lines.
 * Blank lines are dropped; at most `maxLines` are returned.
 */
export function parseInput(text, { maxLines = MAX_LINES } = {}) {
  const lines = String(text ?? '')
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    entries: lines.slice(0, maxLines),
    total: lines.length,
    truncated: lines.length > maxLines,
    dropped: Math.max(0, lines.length - maxLines),
  };
}

/**
 * Decide what the user was trying to paste.
 * Near misses are classified as attempts so they get specific errors.
 */
export function classify(input) {
  const value = normalise(input);

  if (/^[A-Z]{3}-[0-9]{4}$/.test(value)) return 'LLP';

  if (
    value.length >= 6 &&
    value.length <= 10 &&
    /^[A-Z]{2,5}-?[0-9]{2,5}-?$/.test(value)
  ) {
    return 'LLP';
  }

  if (value.length >= 18 && value.length <= 24) {
    const alphanumeric = value.replace(/[^A-Z0-9]/g, '').length;
    if (alphanumeric >= value.length - 4) return 'CIN';
  }

  return 'UNKNOWN';
}

/** Validate a CIN and decode every field that can be decoded. */
export function validateCIN(input, { now = new Date() } = {}) {
  const raw = String(input ?? '').trim();
  const value = normalise(raw);
  const result = emptyResult(raw, value, 'CIN');
  const errors = result.errors;

  if (value.length !== 21) {
    errors.push(
      `A CIN must be exactly 21 characters. This one has ${value.length}.`,
    );
    return result;
  }

  const listing = value[0];
  if (listing === 'L') {
    result.listed = true;
  } else if (listing === 'U') {
    result.listed = false;
  } else {
    errors.push(
      `The first character must be L (listed) or U (unlisted). This one is ${listing}.`,
    );
  }

  const industry = value.slice(1, 6);
  if (DIGITS_5.test(industry)) {
    result.industryCode = industry;
  } else {
    errors.push(
      `Characters 2–6 are the industry code and must be 5 digits. This one is ${industry}.`,
    );
  }

  const state = value.slice(6, 8);
  if (!LETTERS_2.test(state)) {
    errors.push(
      `Characters 7–8 are the state code and must be 2 letters. This one is ${state}.`,
    );
  } else if (STATES[state]) {
    result.stateCode = state;
    result.stateName = STATES[state].name;
  } else {
    result.stateCode = state;
    const hint = STATE_HINTS[state];
    errors.push(
      `The state code ${state} is not a valid Indian state or UT.${hint ? ` ${hint}` : ''}`,
    );
  }

  const yearText = value.slice(8, 12);
  if (!DIGITS_4.test(yearText)) {
    errors.push(
      `Characters 9–12 are the year of incorporation and must be 4 digits. This one is ${yearText}.`,
    );
  } else {
    const year = Number(yearText);
    result.year = year;

    if (year < MIN_YEAR) {
      errors.push(
        `The year ${year} is before 1850, when company registration began in India.`,
      );
    } else if (year > currentYear(now)) {
      errors.push(`The year ${year} is in the future.`);
    }
  }

  const type = value.slice(12, 15);
  if (!LETTERS_3.test(type)) {
    errors.push(
      `Characters 13–15 are the company type and must be 3 letters. This one is ${type}.`,
    );
  } else if (OWNERSHIP_CODES[type]) {
    result.companyTypeCode = type;
    result.companyTypeName = OWNERSHIP_CODES[type].name;
  } else {
    result.companyTypeCode = type;
    errors.push(
      `The company type ${type} is not a recognised CIN ownership code.`,
    );
  }

  const registration = value.slice(15, 21);
  if (DIGITS_6.test(registration)) {
    result.registrationNumber = registration;
  } else {
    errors.push(
      `Characters 16–21 are the registration number and must be 6 digits. This one is ${registration}.`,
    );
  }

  result.valid = errors.length === 0;
  return result;
}

/** Validate an LLPIN. The identifier carries no state, year, or type. */
export function validateLLPIN(input) {
  const raw = String(input ?? '').trim();
  const value = normalise(raw);
  const result = emptyResult(raw, value, 'LLP');
  const errors = result.errors;

  result.companyTypeName = LLP_TYPE_NAME;

  if (value.length !== 8) {
    errors.push(
      `An LLPIN is 8 characters including the hyphen. This one has ${value.length}.`,
    );
  }

  if (!/^[A-Z]{3}/.test(value)) {
    errors.push('An LLPIN starts with three letters, like AAA-1234.');
  } else if (value[3] !== '-') {
    errors.push(
      'An LLPIN needs a hyphen after the first three letters, like AAA-1234.',
    );
  }

  // If the hyphen is missing, the digits start one position earlier.
  const digits = value.slice(value[3] === '-' ? 4 : 3);
  if (DIGITS_4.test(digits)) {
    result.registrationNumber = digits;
  } else {
    errors.push('An LLPIN ends with four digits, like AAA-1234.');
  }

  result.valid = errors.length === 0;
  return result;
}

/**
 * Check one pasted line. Returns null for a blank line.
 */
export function checkLine(line, options = {}) {
  const raw = String(line ?? '').trim();
  if (!raw) return null;

  const value = normalise(raw);
  if (!value) return null;

  const kind = classify(value);
  if (kind === 'CIN') return validateCIN(raw, options);
  if (kind === 'LLP') return validateLLPIN(raw);

  const result = emptyResult(raw, value, 'UNKNOWN');
  result.errors.push(unknownMessage(value.length));
  return result;
}
