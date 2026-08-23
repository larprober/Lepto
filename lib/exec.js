'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run an external tool, streaming its output to the console while also
// tee-ing it into logs/<bin>-<timestamp>.log. Ctrl+C stops the child and
// returns to the menu instead of killing Lepto.
function runCommand(bin, args) {
  return new Promise((resolve) => {
    const start = Date.now();
    const logDir = path.join(process.cwd(), 'logs');
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (_) {}

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `${bin}-${stamp}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    logStream.write(`# ${new Date().toISOString()}\n# ${bin} ${args.join(' ')}\n\n`);

    let child;
    try {
      child = spawn(bin, args);
    } catch (err) {
      logStream.end();
      resolve({ code: -1, error: err, logFile, ms: Date.now() - start });
      return;
    }

    const onSigint = () => {
      try {
        child.kill('SIGINT');
      } catch (_) {}
    };
    process.on('SIGINT', onSigint);

    child.stdout.on('data', (d) => {
      process.stdout.write(d);
      logStream.write(d);
    });
    child.stderr.on('data', (d) => {
      process.stdout.write(d);
      logStream.write(d);
    });

    child.on('error', (err) => {
      process.removeListener('SIGINT', onSigint);
      logStream.end();
      resolve({ code: -1, error: err, logFile, ms: Date.now() - start });
    });

    child.on('close', (code) => {
      process.removeListener('SIGINT', onSigint);
      logStream.end();
      resolve({ code, logFile, ms: Date.now() - start });
    });
  });
}

module.exports = { runCommand };
