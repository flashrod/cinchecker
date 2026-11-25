import { MAX_LINES, checkLine, parseInput } from './validate.js';
import {
  buildCsv,
  renderCards,
  renderReference,
  renderTable,
  summaryFragment,
} from './render.js';

const $ = (id) => document.getElementById(id);

const form = $('check-form');
const textarea = $('numbers');
const lineCount = $('line-count');
const inputNotice = $('input-notice');
const summary = $('summary');
const placeholder = $('results-placeholder');
const truncation = $('truncation');
const toolbar = $('toolbar');
const exportBox = $('export');
const tableWrap = $('table-wrap');
const resultsBody = $('results-body');
const cards = $('cards');
const filterEmpty = $('filter-empty');
const copyButton = $('copy');
const copyLabel = $('copy-label');
const downloadButton = $('download');
const live = $('live');

const chips = Array.from(document.querySelectorAll('.chip'));

const STORAGE_KEY = 'cin-checker:input';

const SAMPLE = [
  'L17110MH1973PLC019786',
  'U29299PN1998PTC013028',
  'AAA-1234',
  'U27100CG2010PTC021930',
  'L85110KA1981PLC0131',
];

const media = window.matchMedia('(max-width: 719px)');

const state = {
  results: [],
  filter: 'all',
  checked: false,
  mobile: media.matches,
};

const fmt = (value) => value.toLocaleString('en-IN');

function announce(message) {
  live.textContent = '';
  window.setTimeout(() => {
    live.textContent = message;
  }, 30);
}

function showNotice(message) {
  inputNotice.textContent = message;
  inputNotice.hidden = false;
}

function hideNotice() {
  inputNotice.hidden = true;
  inputNotice.textContent = '';
}

function updateCount() {
  const total = parseInput(textarea.value).total;
  lineCount.textContent = `${fmt(total)} ${total === 1 ? 'line' : 'lines'}`;
}

function saveInput() {
  try {
    sessionStorage.setItem(STORAGE_KEY, textarea.value);
  } catch {
    /* storage can be blocked; the checker still works */
  }
}

function restoreInput() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function hideResults() {
  placeholder.hidden = false;
  toolbar.hidden = true;
  exportBox.hidden = true;
  tableWrap.hidden = true;
  cards.hidden = true;
  truncation.hidden = true;
  filterEmpty.hidden = true;
  summary.replaceChildren();
  resultsBody.replaceChildren();
  cards.replaceChildren();
}

function updateChips() {
  const valid = state.results.filter((result) => result.valid).length;
  const invalid = state.results.length - valid;

  for (const chip of chips) {
    const filter = chip.dataset.filter;
    const count = filter === 'all' ? state.results.length : filter === 'valid' ? valid : invalid;
    const counter = chip.querySelector('.chip-count');
    if (counter) counter.textContent = fmt(count);
    chip.setAttribute('aria-pressed', String(filter === state.filter));
  }
}

function emptyMessage() {
  if (state.filter === 'valid') return 'No valid numbers in this list.';
  if (state.filter === 'invalid') return 'No invalid numbers — every line passed.';
  return 'No numbers to show.';
}

function renderActiveView() {
  const filtered = state.results.filter((result) => {
    if (state.filter === 'valid') return result.valid;
    if (state.filter === 'invalid') return !result.valid;
    return true;
  });

  tableWrap.hidden = state.mobile;
  cards.hidden = !state.mobile;

  if (state.mobile) {
    renderCards(cards, filtered);
  } else {
    renderTable(resultsBody, filtered);
  }

  filterEmpty.hidden = filtered.length > 0;
  filterEmpty.textContent = emptyMessage();
}

function renderAll(parsed) {
  placeholder.hidden = true;
  toolbar.hidden = false;
  exportBox.hidden = false;

  summary.replaceChildren(summaryFragment(state.results));
  updateChips();

  if (parsed.truncated) {
    truncation.textContent = `Showing the first ${fmt(MAX_LINES)} of ${fmt(parsed.total)} lines. ${fmt(parsed.dropped)} ${parsed.dropped === 1 ? 'line was' : 'lines were'} not checked. Split the list and run it again for the rest.`;
    truncation.hidden = false;
  } else {
    truncation.hidden = true;
  }

  renderActiveView();
}

function runCheck() {
  const parsed = parseInput(textarea.value);

  if (parsed.total === 0) {
    state.results = [];
    state.checked = false;
    state.filter = 'all';
    hideResults();
    showNotice('Paste at least one CIN or LLPIN to check.');
    announce('Nothing to check. Paste at least one number.');
    textarea.focus();
    return;
  }

  hideNotice();
  state.results = parsed.entries.map((line) => checkLine(line)).filter(Boolean);
  state.checked = true;
  state.filter = 'all';
  saveInput();
  renderAll(parsed);
}

function setFilter(filter) {
  state.filter = filter;
  updateChips();
  renderActiveView();
}

function fallbackCopy(value) {
  const helper = document.createElement('textarea');
  helper.value = value;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.top = '-1000px';
  helper.style.opacity = '0';
  document.body.append(helper);
  helper.select();
  const copied = document.execCommand('copy');
  helper.remove();
  if (!copied) throw new Error('Copy command was rejected');
}

function flashCopyLabel() {
  copyLabel.textContent = 'Copied';
  window.setTimeout(() => {
    copyLabel.textContent = 'Copy as CSV';
  }, 1800);
}

function downloadCsv() {
  const csv = buildCsv(state.results);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `cin-check-${stamp}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  announce(`Downloaded ${fmt(state.results.length)} rows as CSV.`);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  runCheck();
});

textarea.addEventListener('input', () => {
  updateCount();
  saveInput();
  if (!inputNotice.hidden) hideNotice();
});

textarea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    runCheck();
  }
});

for (const chip of chips) {
  chip.addEventListener('click', () => setFilter(chip.dataset.filter));
}

for (const button of document.querySelectorAll('.example')) {
  button.addEventListener('click', () => {
    const value = button.dataset.example;
    const current = textarea.value.trim();
    textarea.value = current ? `${current}\n${value}` : value;
    updateCount();
    saveInput();
    runCheck();
  });
}

$('sample').addEventListener('click', () => {
  textarea.value = SAMPLE.join('\n');
  updateCount();
  saveInput();
  runCheck();
});

$('clear').addEventListener('click', () => {
  textarea.value = '';
  state.results = [];
  state.checked = false;
  state.filter = 'all';
  saveInput();
  hideResults();
  updateCount();
  hideNotice();
  announce('Cleared.');
  textarea.focus();
});

copyButton.addEventListener('click', async () => {
  const csv = buildCsv(state.results);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(csv);
    } else {
      fallbackCopy(csv);
    }
    flashCopyLabel();
    announce(`Copied ${fmt(state.results.length)} rows as CSV.`);
  } catch {
    announce('Copy failed. Use Download CSV instead.');
  }
});

downloadButton.addEventListener('click', downloadCsv);

const onBreakpointChange = (event) => {
  state.mobile = event.matches;
  if (state.checked) renderActiveView();
};

if (media.addEventListener) {
  media.addEventListener('change', onBreakpointChange);
} else {
  media.addListener(onBreakpointChange);
}

renderReference({
  stateList: $('state-list'),
  typeList: $('type-list'),
  sourceList: $('source-list'),
  reviewed: $('reviewed'),
});

textarea.value = restoreInput();
updateCount();
hideResults();
