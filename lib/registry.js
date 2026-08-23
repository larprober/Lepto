'use strict';

const { spawnSync } = require('child_process');

const TOOLS = {
  nmap: {
    title: 'Nmap',
    blurb: 'Network mapper — host discovery, port & service scanning',
    install: {
      linux: 'sudo apt install nmap    (or: sudo pacman -S nmap)',
      darwin: 'brew install nmap',
      win32: 'winget install Insecure.Nmap    (or download from nmap.org)',
    },
  },
  hydra: {
    title: 'Hydra',
    blurb: 'Fast online login brute-forcer (ssh, ftp, http, smb, …)',
    install: {
      linux: 'sudo apt install hydra    (or: sudo pacman -S hydra)',
      darwin: 'brew install hydra',
      win32: 'not natively supported — use WSL / Kali',
    },
  },
  hping3: {
    title: 'Hping3',
    blurb: 'TCP/IP packet crafter — custom probes, port checks, traceroute',
    install: {
      linux: 'sudo apt install hping3    (or: sudo pacman -S hping)',
      darwin: 'brew install hping    (via third-party tap)',
      win32: 'not natively supported — use WSL / Kali',
    },
  },
};

function isInstalled(bin) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  try {
    const r = spawnSync(finder, [bin], { stdio: 'ignore' });
    return r.status === 0;
  } catch (_) {
    return false;
  }
}

function installHint(key) {
  const tool = TOOLS[key];
  if (!tool) return '';
  return tool.install[process.platform] || tool.install.linux;
}

module.exports = { TOOLS, isInstalled, installHint };
