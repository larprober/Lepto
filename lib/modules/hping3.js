'use strict';

// Every mode sends a bounded number of packets (-c) by default so the tool
// stays a diagnostic probe, not a flooder. Advanced users can pass raw flags
// through "Custom".
const MODES = [
  {
    label: 'TCP SYN probe — check a port',
    needsPort: true,
    build: (t, p) => ['-S', '-p', p || '80', '-c', '4', t],
  },
  {
    label: 'ICMP echo — ping a host',
    needsPort: false,
    build: (t) => ['--icmp', '-c', '4', t],
  },
  {
    label: 'UDP probe — check a port',
    needsPort: true,
    build: (t, p) => ['--udp', '-p', p || '53', '-c', '4', t],
  },
  {
    label: 'ACK probe — firewall/filter check',
    needsPort: true,
    build: (t, p) => ['-A', '-p', p || '80', '-c', '4', t],
  },
  {
    label: 'TCP traceroute',
    needsPort: true,
    build: (t, p) => ['--traceroute', '-V', '-S', '-p', p || '80', t],
  },
  { label: 'Custom flags', needsPort: false, build: null },
];

async function run(ctx) {
  const { ui, ask, confirm, runCommand } = ctx;

  ui.clear();
  ui.printBanner('v0.1');
  ui.section('Hping3 · packet crafting & probing');
  MODES.forEach((m, i) => ui.menuItem(i + 1, m.label));
  ui.menuItem('x', 'Back to main menu');
  console.log('');

  const pick = (await ask('hping3')).toLowerCase();
  if (pick === 'x' || pick === '') return;

  const idx = parseInt(pick, 10) - 1;
  if (Number.isNaN(idx) || !MODES[idx]) {
    ui.errMsg('Unknown option.');
    await ask('press enter');
    return;
  }

  const target = await ask('target host');
  if (!target) {
    ui.errMsg('No target.');
    await ask('press enter');
    return;
  }

  let args;
  const mode = MODES[idx];
  if (mode.build) {
    let port;
    if (mode.needsPort) port = (await ask('port (blank = mode default)')).trim();
    args = mode.build(target, port);
  } else {
    const extra = await ask('flags (e.g. -S -p 443 -c 4)');
    args = [...extra.split(/\s+/).filter(Boolean), target];
  }

  console.log('');
  ui.dim('command:  hping3 ' + args.join(' '));
  ui.warnMsg('hping3 usually needs root/admin — authorized targets only.');
  if (!(await confirm('Send packets?'))) {
    ui.info('Cancelled.');
    await ask('press enter');
    return;
  }

  console.log('');
  const res = await runCommand('hping3', args);
  ui.footer(
    res.error ? 'bad' : res.code === 0 ? 'ok' : 'warn',
    res.error ? 'failed to launch hping3' : 'run finished',
    ['hping3', 'target ' + target, (res.ms / 1000).toFixed(1) + 's', 'exit ' + res.code]
  );
  if (res.error) ui.errMsg(res.error.message);
  else ui.dim('log: ' + res.logFile);
  await ask('press enter to return to menu');
}

module.exports = { key: 'hping3', run };
