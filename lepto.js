#!/usr/bin/env node
'use strict';

const ui = require('./lib/ui');
const { runCommand } = require('./lib/exec');
const registry = require('./lib/registry');
const nmap = require('./lib/modules/nmap');
const hydra = require('./lib/modules/hydra');
const hping3 = require('./lib/modules/hping3');

const VERSION = 'v0.1';
const ctx = { ui, ask: ui.ask, confirm: ui.confirm, runCommand, registry };

const MODULES = [
  { key: 'nmap', title: 'Nmap', note: 'scanner', run: () => nmap.run(ctx) },
  { key: 'hydra', title: 'Hydra', note: 'brute-force', run: () => hydra.run(ctx) },
  { key: 'hping3', title: 'Hping3', note: 'packet craft', run: () => hping3.run(ctx) },
];

async function legalGate() {
  ui.section('Authorized use only');
  ui.info('Lepto is a launcher for offensive-security tools (nmap, hydra, hping3).');
  ui.info('Run it ONLY against systems you own or have explicit written permission');
  ui.info('to test. Unauthorized scanning or access is illegal in most places.');
  console.log('');
  const a = (await ui.ask("type 'agree' to continue")).toLowerCase();
  if (a !== 'agree') {
    ui.errMsg('Not accepted. Exiting.');
    process.exit(0);
  }
}

async function toolStatus() {
  ui.clear();
  ui.printBanner(VERSION);
  ui.section('Tool status');
  for (const m of MODULES) {
    if (registry.isInstalled(m.key)) {
      ui.good(m.title + '  — installed');
    } else {
      ui.warnMsg(m.title + '  — not found');
      ui.dim('   install:  ' + registry.installHint(m.key));
    }
  }
  console.log('');
  await ui.ask('press enter to return to menu');
}

async function mainMenu() {
  ui.clear();
  ui.printBanner(VERSION);
  ui.section('Choose a module');
  MODULES.forEach((m, i) => {
    const ready = registry.isInstalled(m.key);
    ui.menuItem(i + 1, m.title + ' — ' + m.note, ready ? 'ready' : 'missing', ready ? 'ok' : 'warn');
  });
  ui.menuItem('s', 'Tool status / install help');
  ui.menuItem('x', 'Exit');
  console.log('');
  return (await ui.ask('lepto')).toLowerCase();
}

async function main() {
  ui.clear();
  ui.printBanner(VERSION);
  await legalGate();

  for (;;) {
    const c = await mainMenu();
    if (ui.isClosed()) break; // EOF / Ctrl+D
    if (c === 'x' || c === 'q') {
      ui.dim('bye.');
      ui.closeInput();
      break;
    } else if (c === 's') {
      await toolStatus();
    } else {
      const idx = parseInt(c, 10) - 1;
      const m = MODULES[idx];
      if (!m) continue;
      if (!registry.isInstalled(m.key)) {
        ui.warnMsg(m.title + ' is not installed.');
        ui.dim('install:  ' + registry.installHint(m.key));
        await ui.ask('press enter');
        continue;
      }
      await m.run();
    }
  }
}

main().catch((e) => {
  ui.errMsg('fatal: ' + e.message);
  process.exit(1);
});
