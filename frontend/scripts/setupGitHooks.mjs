import { chmodSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

if (process.env.CI || process.env.VERCEL) {
  process.exit(0);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const hookFiles = [
  join(repoRoot, '.githooks', 'pre-commit'),
  join(repoRoot, '.githooks', 'pre-push'),
];

try {
  execFileSync('git', ['rev-parse', '--git-dir'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
} catch {
  console.log(
    'Skipping Git hook installation: not running inside a Git checkout.'
  );
  process.exit(0);
}

for (const hookFile of hookFiles) {
  if (existsSync(hookFile)) {
    chmodSync(hookFile, 0o755);
  }
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

console.log('Configured Git hooks at .githooks/.');
