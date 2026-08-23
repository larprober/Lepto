'use strict';

const SCANS = [
  { label: 'Quick scan — top 100 ports', build: (t) => ['-T4', '-F', t] },
  { label: 'Full TCP scan — all 65535 ports', build: (t) => ['-p-', '-T4', t] },
  { label: 'Service & version detection', build: (t) => ['-sV', '-T4', t] },
  { label: 'OS detection (needs root/admin)', build: (t) => ['-O', t] },
  { label: 'Aggressive — OS/version/scripts', build: (t) => ['-A', '-T4', t] },
  { label: 'Ping sweep — discover live hosts', build: (t) => ['-sn', t] },
  { label: 'Custom flags', build: null },
];

async function run(ctx) {
  const { ui, ask, confirm, runCommand } = ctx;

  ui.clear();
  ui.printBanner('v0.1');
  ui.section('Nmap · scan a target');
  SCANS.forEach((s, i) => ui.menuItem(i + 1, s.label));
  ui.menuItem('x', 'Back to main menu');
  console.log('');

  const pick = (await ask('nmap')).toLowerCase();
  if (pick === 'x' || pick === '') return;

  const idx = parseInt(pick, 10) - 1;
  if (Number.isNaN(idx) || !SCANS[idx]) {
    ui.errMsg('Unknown option.');
    await ask('press enter');
    return;
  }

  const target = await ask('target host / CIDR');
  if (!target) {
    ui.errMsg('No target given.');
    await ask('press enter');
    return;
  }

  let args;
  if (SCANS[idx].build) {
    args = SCANS[idx].build(target);
  } else {
    const extra = await ask('extra flags (e.g. -sS -p 22,80)');
    args = [...extra.split(/\s+/).filter(Boolean), target];
  }

  console.log('');
  ui.dim('command:  nmap ' + args.join(' '));
  ui.warnMsg('Only scan systems you own or are authorized to test.');
  if (!(await confirm('Run this scan?'))) {
    ui.info('Cancelled.');
    await ask('press enter');
    return;
  }

  console.log('');
  const res = await runCommand('nmap', args);
  ui.footer(
    res.error ? 'bad' : res.code === 0 ? 'ok' : 'warn',
    res.error ? 'failed to launch nmap' : 'scan finished',
    ['nmap', 'target ' + target, (res.ms / 1000).toFixed(1) + 's', 'exit ' + res.code]
  );
  if (res.error) ui.errMsg(res.error.message);
  else ui.dim('log: ' + res.logFile);
  await ask('press enter to return to menu');
}

module.exports = { key: 'nmap', run };
