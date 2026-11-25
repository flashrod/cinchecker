/**
 * DOM builders for the checker. All user-supplied values go in through
 * textContent, never innerHTML.
 */

import { LAST_REVIEWED, LLP_TYPE_NAME, OWNERSHIP_CODES, SOURCES, STATES } from './reference.js';

const MAX_DISPLAY = 64;

const ICON_MARKUP = {
  check:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="M5.2 8.2l1.9 1.9 3.7-3.9"/></svg>',
  alert:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.4L14.2 13H1.8L8 2.4z"/><path d="M8 6.3v3"/><circle cx="8" cy="11.4" r=".55" fill="currentColor" stroke="none"/></svg>',
  question:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.3"/><circle cx="8" cy="11.5" r=".55" fill="currentColor" stroke="none"/></svg>',
};

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function text(value) {
  return document.createTextNode(value);
}

function icon(name, size = 12) {
  const holder = document.createElement('span');
  holder.innerHTML = ICON_MARKUP[name];
  const svg = holder.firstElementChild;
  if (!svg) return null;
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  return svg;
}

function dash() {
  return el('span', 'dash', '—');
}

function displayValue(value) {
  return value.length > MAX_DISPLAY ? `${value.slice(0, MAX_DISPLAY - 1)}…` : value;
}

export function statusFor(result) {
  if (result.valid) return { label: 'Valid', tone: 'valid', icon: 'check' };
  if (result.kind === 'UNKNOWN') {
    return { label: 'Not recognised', tone: 'unknown', icon: 'question' };
  }
  return { label: 'Invalid', tone: 'invalid', icon: 'alert' };
}

export function statusBadge(result) {
  const status = statusFor(result);
  const badge = el('span', `badge badge-${status.tone}`);
  badge.append(icon(status.icon, 11), text(status.label));
  return badge;
}

export function listedText(result) {
  if (result.listed === true) return 'Yes';
  if (result.listed === false) return 'No';
  return '—';
}

export function typeText(result) {
  if (result.kind === 'CIN') return 'CIN';
  if (result.kind === 'LLP') return 'LLP';
  return '—';
}

export function stateText(result) {
  if (result.stateName && result.stateCode) {
    return `${result.stateName} (${result.stateCode})`;
  }
  if (result.stateCode) return `${result.stateCode} — unknown`;
  return '—';
}

export function companyText(result) {
  if (result.companyTypeName) return result.companyTypeName;
  if (result.companyTypeCode) return `${result.companyTypeCode} — unknown`;
  return '—';
}

function numberCell(result) {
  const cell = el('td', 'cell-number');
  const code = el('code', null, displayValue(result.value));
  if (result.value.length > MAX_DISPLAY) {
    code.title = `${result.value.slice(0, 120)}… Full value is in the CSV export.`;
  } else {
    code.title = result.value;
  }
  cell.append(code);
  return cell;
}

function stateCell(result) {
  const cell = el('td', 'cell-state');
  if (!result.stateCode) {
    cell.append(dash());
    return cell;
  }
  if (result.stateName) {
    cell.append(el('span', 'state-name', result.stateName));
  } else {
    cell.append(el('span', 'state-name', 'Unknown'));
  }
  cell.append(el('span', 'state-code', result.stateCode));
  return cell;
}

function companyCell(result) {
  const cell = el('td', 'cell-company');
  if (result.companyTypeName) {
    cell.append(el('span', 'company-name', result.companyTypeName));
    if (result.companyTypeCode) {
      cell.append(el('span', 'state-code', result.companyTypeCode));
    }
  } else if (result.companyTypeCode) {
    cell.append(el('span', 'company-name', `${result.companyTypeCode} — unknown`));
  } else {
    cell.append(dash());
  }
  return cell;
}

function errorsBlock(result) {
  const box = el('div', 'errors');
  const marker = icon('alert', 13);
  if (marker) box.append(marker);
  const list = el('ul');
  for (const message of result.errors) list.append(el('li', null, message));
  box.append(list);
  return box;
}

function resultRow(result) {
  const row = el('tr');
  row.append(
    numberCell(result),
    (() => {
      const cell = el('td');
      cell.append(statusBadge(result));
      return cell;
    })(),
    el('td', 'cell-type', typeText(result)),
    el('td', 'cell-listed', listedText(result)),
    stateCell(result),
    el('td', 'cell-year', result.year === null ? '—' : String(result.year)),
    companyCell(result),
  );
  return row;
}

function errorsRow(result) {
  const row = el('tr', 'errors-row');
  const cell = el('td');
  cell.colSpan = 7;
  cell.append(errorsBlock(result));
  row.append(cell);
  return row;
}

export function renderTable(tbody, results) {
  const fragment = document.createDocumentFragment();
  for (const result of results) {
    fragment.append(resultRow(result));
    if (result.errors.length > 0) fragment.append(errorsRow(result));
  }
  tbody.replaceChildren(fragment);
}

function meta(label, value) {
  const group = el('div');
  group.append(el('dt', null, label), el('dd', null, value));
  return group;
}

export function renderCards(container, results) {
  const fragment = document.createDocumentFragment();
  for (const result of results) {
    const card = el('article', 'card');
    const top = el('div', 'card-top');
    top.append(el('span', 'card-number', displayValue(result.value)), statusBadge(result));
    card.append(top);

    const metaGrid = el('dl', 'card-meta');
    metaGrid.append(
      meta('Type', typeText(result)),
      meta('Listed', listedText(result)),
      meta('State', stateText(result)),
      meta('Year', result.year === null ? '—' : String(result.year)),
      meta('Company type', companyText(result)),
    );
    card.append(metaGrid);

    if (result.errors.length > 0) card.append(errorsBlock(result));
    fragment.append(card);
  }
  container.replaceChildren(fragment);
}

export function summaryFragment(results) {
  const valid = results.filter((result) => result.valid).length;
  const llps = results.filter((result) => result.kind === 'LLP').length;
  const invalid = results.length - valid;

  const fragment = document.createDocumentFragment();
  const strong = (value) => el('strong', null, String(value));
  const separator = () => el('span', 'sep', '·');

  fragment.append(strong(valid), text(' valid'), separator());
  fragment.append(strong(invalid), text(' invalid'));
  if (llps > 0) {
    fragment.append(separator(), strong(llps), text(llps === 1 ? ' LLP' : ' LLPs'));
  }
  return fragment;
}

function csvCell(value) {
  let string = String(value ?? '');
  if (/^[=+\-@]/.test(string)) string = `'${string}`;
  return `"${string.replace(/"/g, '""')}"`;
}

export function buildCsv(results) {
  const header = [
    'Number',
    'Status',
    'Type',
    'Listed',
    'State',
    'Year',
    'Company type',
    'Errors',
  ];
  const rows = [header.map(csvCell).join(',')];

  for (const result of results) {
    const status = statusFor(result).label;
    rows.push(
      [
        result.value,
        status,
        typeText(result),
        listedText(result),
        stateText(result),
        result.year === null ? '' : result.year,
        companyText(result),
        result.errors.join(' | '),
      ]
        .map(csvCell)
        .join(','),
    );
  }

  return rows.join('\r\n');
}

function tag(status) {
  const label = status === 'observed' ? 'observed' : 'unverified';
  return el('em', `tag tag-${status}`, label);
}

export function renderReference({ stateList, typeList, sourceList, reviewed }) {
  const states = document.createDocumentFragment();
  for (const [code, info] of Object.entries(STATES)) {
    const item = el('li');
    item.title = info.note || info.name;
    item.append(el('code', null, code), el('span', 'code-name', info.name));
    if (info.status !== 'verified') item.append(tag(info.status));
    states.append(item);
  }
  stateList.replaceChildren(states);

  const types = document.createDocumentFragment();
  for (const [code, info] of Object.entries(OWNERSHIP_CODES)) {
    const item = el('li');
    item.title = info.note || info.name;
    item.append(el('code', null, code), el('span', 'code-name', info.name));
    if (info.status !== 'verified') item.append(tag(info.status));
    types.append(item);
  }
  typeList.replaceChildren(types);

  const sources = document.createDocumentFragment();
  for (const source of SOURCES) {
    const item = el('li');
    const link = el('a', null, source.label);
    link.href = source.url;
    item.append(link);
    sources.append(item);
  }
  sourceList.replaceChildren(sources);

  reviewed.textContent = `Last reviewed ${LAST_REVIEWED}. “Observed” means the code is seen on real CINs but its expansion is not officially published; “unverified” means sources disagree or no live example was found. LLPINs carry no state, year, or type, so ${LLP_TYPE_NAME} is shown instead.`;
}
