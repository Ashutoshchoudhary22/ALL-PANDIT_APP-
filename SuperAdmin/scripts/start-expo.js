const { spawn } = require('child_process');
const path = require('path');

const nodeOptions = '--max-old-space-size=8192';
const expoCli = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli');
const args = process.argv.slice(2);

const child = spawn(
  process.execPath,
  [nodeOptions, expoCli, ...args],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      EXPO_NO_INTERACTIVE: '1',
      CI: '1',
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
