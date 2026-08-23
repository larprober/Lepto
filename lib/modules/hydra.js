'use strict';

const SERVICES = [
  'ssh',
  'ftp',
  'http-get',
  'http-post-form',
  'smb',
  'rdp',
  'mysql',
  'postgres',
  'telnet',
  'vnc',
];

async function run(ctx) {
  const { ui, ask, confirm, runCommand } = ctx;

  ui.clear();
  ui.printBanner('v0.1');
  ui.section('Hydra · online login brute-forcer');
  ui.warnMsg('Credential testing is intrusive — use ONLY with written authorization.');
  console.log('');

  const target = await ask('target host');
  if (!target) {
    ui.errMsg('No target.');
    await ask('press enter');
    return;
  }

  ui.info('common services: ' + SERVICES.join(', '));
  const service = await ask('service');
  if (!service) {
    ui.errMsg('No service.');
    await ask('press enter');
    return;
  }

  const user = await ask('username  (blank to use a userlist file)');
  let userArgs;
  if (user) {
    userArgs = ['-l', user];
  } else {
    const ulist = await ask('path to userlist');
    if (!ulist) {
      ui.errMsg('Need a username or a userlist.');
      await ask('press enter');
      return;
    }
    userArgs = ['-L', ulist];
  }

  const wl = await ask('path to password wordlist');
  if (!wl) {
    ui.errMsg('Need a wordlist.');
    await ask('press enter');
    return;
  }

  const extra = await ask('extra flags (optional, e.g. -s 2222 -t 4)');
  const args = [
    ...userArgs,
    '-P',
    wl,
    ...extra.split(/\s+/).filter(Boolean),
    target,
    service,
  ];

  console.log('');
  ui.dim('command:  hydra ' + args.join(' '));
  if (!(await confirm('Launch hydra?'))) {
    ui.info('Cancelled.');
    await ask('press enter');
    return;
  }

  console.log('');
  const res = await runCommand('hydra', args);
  ui.footer(
    res.error ? 'bad' : res.code === 0 ? 'ok' : 'warn',
    res.error ? 'failed to launch hydra' : 'run finished',
    ['hydra', service + '://' + target, (res.ms / 1000).toFixed(1) + 's', 'exit ' + res.code]
  );
  if (res.error) ui.errMsg(res.error.message);
  else ui.dim('log: ' + res.logFile);
  await ask('press enter to return to menu');
}

module.exports = { key: 'hydra', run };
