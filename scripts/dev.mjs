import { spawn } from 'node:child_process';

const targets = [
  ['content', ['exec', 'vite', 'build', '--config', 'vite.config.content.ts', '--watch']],
  ['popup', ['exec', 'vite', 'build', '--config', 'vite.config.popup.ts', '--watch']]
];

const children = targets.map(([name, args]) => {
  const child = spawn('pnpm', args, {
    env: process.env,
    stdio: 'inherit'
  });

  child.on('exit', (code, signal) => {
    if (signal === 'SIGINT' || signal === 'SIGTERM') {
      return;
    }

    if (code !== 0) {
      process.exitCode = code ?? 1;
      stopChildren(child.pid);
    }
  });

  child.on('error', (error) => {
    console.error(`[${name}] ${error.message}`);
    process.exitCode = 1;
    stopChildren(child.pid);
  });

  return child;
});

function stopChildren(exceptPid) {
  for (const child of children) {
    if (child.pid && child.pid !== exceptPid && !child.killed) {
      child.kill('SIGTERM');
    }
  }
}

function shutdown() {
  stopChildren();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
