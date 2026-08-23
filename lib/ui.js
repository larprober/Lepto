'use strict';

// ── Bright-gray theme (styled after the Judger console) ──────────────────────
const readline = require('readline');

const enabled =
  process.env.NO_COLOR !== undefined
    ? false
    : process.env.FORCE_COLOR === '1'
    ? true
    : process.stdout.isTTY && process.env.TERM !== 'dumb';

const paint = (code) => (s) =>
  enabled ? `\x1b[${code}m${s}\x1b[0m` : String(s);

const t = {
  g0: paint('38;5;253'), // brightest gray  — banner / brackets
  g1: paint('38;5;250'), // labels
  g2: paint('38;5;245'), // secondary text
  g3: paint('38;5;240'), // dim hints / rules
  ok: paint('38;5;114'), // green   — good / ready
  warn: paint('38;5;179'), // amber — warning / missing
  bad: paint('38;5;203'), // red     — error / finding
};

// ── Block banner ─────────────────────────────────────────────────────────────
const GLYPHS = {
  L: ['██    ', '██    ', '██    ', '██    ', '██    ', '██████'],
  E: ['██████', '██    ', '█████ ', '██    ', '██    ', '██████'],
  P: ['█████ ', '██  ██', '█████ ', '██    ', '██    ', '██    '],
  T: ['██████', '  ██  ', '  ██  ', '  ██  ', '  ██  ', '  ██  '],
  O: [' ████ ', '██  ██', '██  ██', '██  ██', '██  ██', ' ████ '],
};

// Each letter is one solid tile; every tile a distinct gray shade.
const BANNER_WORD = 'LEPTO';
const LETTER_SHADES = [250, 236, 255, 243, 247];

function width() {
  return Math.min(process.stdout.columns || 72, 68);
}

function clear() {
  if (enabled) process.stdout.write('\x1b[2J\x1b[H');
}

function colorTile(str, shade) {
  return enabled ? `\x1b[38;5;${shade}m${str}\x1b[0m` : str;
}

function printBanner(version) {
  const letters = BANNER_WORD.split('');
  console.log('');
  for (let r = 0; r < 6; r++) {
    let line = '  ';
    letters.forEach((ch, li) => {
      const glyphRow = GLYPHS[ch] ? GLYPHS[ch][r] : '      ';
      line += colorTile(glyphRow, LETTER_SHADES[li % LETTER_SHADES.length]);
      if (li < letters.length - 1) line += '  '; // gap between tiles
    });
    if (r === 1 && version) line += '   ' + t.g3(version);
    console.log(line);
  }
  console.log('');
}

// ── Structure ────────────────────────────────────────────────────────────────
function rule() {
  console.log(t.g3('─'.repeat(width())));
}

function section(title) {
  const w = width();
  rule();
  const pad = Math.max(0, Math.floor((w - title.length) / 2));
  console.log(' '.repeat(pad) + t.g1(title));
  rule();
}

function menuItem(key, label, note, state) {
  let line = '  ' + t.g0('[ ' + key + ' ]') + ' ' + t.g1(label);
  if (note) {
    const painter = state === 'ok' ? t.ok : state === 'warn' ? t.warn : t.g3;
    line += '  ' + painter('[ ' + note + ' ]');
  }
  console.log(line);
}

function footer(state, msg, meta) {
  const painter = state === 'ok' ? t.ok : state === 'warn' ? t.warn : t.bad;
  rule();
  let line = '  ' + painter(state.toUpperCase()) + '   ' + t.g1(msg);
  if (meta && meta.length) line += '   ' + t.g3('(' + meta.join(' · ') + ')');
  console.log(line);
}

// ── Messages ─────────────────────────────────────────────────────────────────
const info = (m) => console.log('  ' + t.g2(m));
const dim = (m) => console.log('  ' + t.g3(m));
const good = (m) => console.log('  ' + t.ok('✔ ') + t.g1(m));
const warnMsg = (m) => console.log('  ' + t.warn('! ') + t.g1(m));
const errMsg = (m) => console.log('  ' + t.bad('✘ ') + t.g1(m));

// ── Prompts ──────────────────────────────────────────────────────────────────
// One shared, non-raw readline interface with a line queue. A fresh interface
// per question drops buffered input; a raw (terminal) interface would swallow
// Ctrl+C so it couldn't interrupt a running tool. terminal:false keeps the tty
// in cooked mode (SIGINT works) while we buffer any read-ahead lines ourselves.
let rl = null;
let closed = false;
const lineQueue = [];
let waiter = null;

function io() {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.on('line', (line) => {
      if (waiter) {
        const w = waiter;
        waiter = null;
        w(line);
      } else {
        lineQueue.push(line);
      }
    });
    rl.on('close', () => {
      closed = true;
      if (waiter) {
        const w = waiter;
        waiter = null;
        w(null);
      }
    });
  }
  return rl;
}

function nextLine() {
  return new Promise((res) => {
    if (lineQueue.length) res(lineQueue.shift());
    else if (closed) res(null);
    else waiter = res;
  });
}

async function ask(label) {
  io();
  process.stdout.write('  ' + t.g1(label) + t.g3(' › '));
  const line = await nextLine();
  if (line === null) {
    process.stdout.write('\n');
    return '';
  }
  return line.trim();
}

function isClosed() {
  return closed;
}

function closeInput() {
  if (rl) rl.close();
}

async function confirm(label) {
  const a = (await ask(label + ' [y/N]')).toLowerCase();
  return a === 'y' || a === 'yes';
}

module.exports = {
  t,
  clear,
  printBanner,
  rule,
  section,
  menuItem,
  footer,
  info,
  dim,
  good,
  warnMsg,
  errMsg,
  ask,
  confirm,
  isClosed,
  closeInput,
};
