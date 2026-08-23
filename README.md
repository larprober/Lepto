# Lepto

A bright-gray terminal launcher for authorized security testing. One menu,
several tools — right now it wraps **nmap**, **hydra** and **hping3** behind a
guided interface, builds the command for you, runs it, and tees the output into
a timestamped log.

Styled after the *Judger* console — block banner, `[ n ]` menu, centered
section rules and a status footer — recolored to a bright-gray theme.

```
  ██        ██████    █████     ██████     ████
  ██        ██        ██  ██      ██      ██  ██   v0.1
  ██        █████     █████       ██      ██  ██
  ██        ██        ██          ██      ██  ██
  ██        ██        ██          ██      ██  ██
  ███████   ██████    ██          ██       ████
```

## ⚠ Authorized use only

Lepto only *launches* well-known offensive-security tools; it doesn't do
anything you couldn't do by hand. Use it **exclusively** against systems you
own or have explicit written permission to test. Unauthorized scanning,
credential testing, or packet injection is illegal in most jurisdictions. You
are responsible for how you use it. On startup you must type `agree` to
continue.

## Requirements

- [Node.js](https://nodejs.org) 16 or newer (no npm dependencies — pure stdlib).
- The tools you want to drive, installed and on your `PATH`:

| Module | Binary   | What it does                                            |
| ------ | -------- | ------------------------------------------------------- |
| Nmap   | `nmap`   | Host discovery, port and service/version scanning       |
| Hydra  | `hydra`  | Online login brute-forcing (ssh, ftp, http, smb, …)     |
| Hping3 | `hping3` | Custom TCP/IP packet probes, port checks, traceroute     |

Lepto detects which are present (`Tool status` in the menu) and prints an
install hint for anything missing. hydra and hping3 are Linux-first — on
Windows, run Lepto inside **WSL / Kali**.

## Install

```bash
git clone https://github.com/larprober/Lepto.git
cd Lepto
node lepto.js
```

Or install the `lepto` command globally:

```bash
npm install -g .
lepto
```

## Usage

Pick a module from the main menu. Each one asks a few questions (target, ports,
service, wordlists…), shows you the exact command it will run, warns you, and
asks for a final `y` before executing. `Ctrl+C` stops the running tool and drops
you back to the menu without killing Lepto.

```
Main menu
  [ 1 ] Nmap — scanner        [ ready ]
  [ 2 ] Hydra — brute-force   [ ready ]
  [ 3 ] Hping3 — packet craft [ missing ]
  [ s ] Tool status / install help
  [ x ] Exit
```

### Modules at a glance

- **Nmap** — quick scan, full-port scan, service/version, OS detection,
  aggressive scan, ping sweep, or your own flags.
- **Hydra** — pick a service, target, single user or userlist, a password
  wordlist, plus any extra flags.
- **Hping3** — TCP SYN / ICMP / UDP / ACK probes, TCP traceroute, or custom
  flags. Built-in modes send a bounded packet count (`-c`), not a flood.

Every run is saved to `logs/<tool>-<timestamp>.log`.

## Roadmap

The module system (`lib/modules/*.js`) is small and uniform, so adding another
tool is just one file plus a line in `lepto.js`.

## License

MIT — see [LICENSE](LICENSE).
