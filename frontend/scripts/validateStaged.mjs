import { execSync } from 'node:child_process';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      ...options,
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 0
    ) {
      return typeof error.stdout === 'string' ? error.stdout : '';
    }

    throw error;
  }
}

function getStagedFiles() {
  const output = runCommand(
    'git diff --cached --name-only --diff-filter=ACMR -z'
  );

  return output
    .split('\0')
    .map((file) => file.trim())
    .filter((file) => file.length > 0);
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  process.exit(0);
}

runCommand(
  `${npxCommand} vp check --fix ${stagedFiles.map((file) => JSON.stringify(file)).join(' ')}`,
  {
    stdio: 'inherit',
  }
);

runCommand(
  `git add -- ${stagedFiles.map((file) => JSON.stringify(file)).join(' ')}`,
  {
    stdio: 'inherit',
  }
);
