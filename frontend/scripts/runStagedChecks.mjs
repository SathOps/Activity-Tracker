import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const binDir = join(repoRoot, 'node_modules', '.bin');
const binExtension = process.platform === 'win32' ? '.cmd' : '';

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    ...options,
  });

const read = (command, args) =>
  execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });

const readList = (command, args) =>
  read(command, args)
    .split('\0')
    .map((entry) => entry.trim())
    .filter(Boolean);

const resolveLocalBin = (name) => {
  const executable = join(binDir, `${name}${binExtension}`);

  if (!existsSync(executable)) {
    console.error(`Missing local dependency binary: ${name}`);
    console.error('Run npm install before using the Git hooks.');
    process.exit(1);
  }

  return executable;
};

const stagedFiles = readList('git', [
  'diff',
  '--cached',
  '--name-only',
  '--diff-filter=ACMR',
  '-z',
]);

if (stagedFiles.length === 0) {
  console.log('No staged files to validate.');
  process.exit(0);
}

const eslintPattern = /\.[cm]?[jt]sx?$/;
const prettierTargets = [...stagedFiles];
const eslintTargets = stagedFiles.filter((file) => eslintPattern.test(file));
const autoFixTargets = prettierTargets.filter(
  (file) => !file.startsWith('.githooks/')
);

if (autoFixTargets.length > 0) {
  const unstagedFiles = new Set(
    read('git', ['diff', '--name-only', '--', ...autoFixTargets])
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  );

  const partiallyStagedFiles = autoFixTargets.filter((file) =>
    unstagedFiles.has(file)
  );

  if (partiallyStagedFiles.length > 0) {
    console.error(
      [
        'Aborting pre-commit because these staged files also have unstaged changes:',
        ...partiallyStagedFiles.map((file) => `- ${file}`),
        'Stage the full file or stash the unstaged changes, then commit again.',
      ].join('\n')
    );
    process.exit(1);
  }
}

if (prettierTargets.length > 0) {
  run(resolveLocalBin('prettier'), [
    '--write',
    '--ignore-unknown',
    ...prettierTargets,
  ]);
}

if (eslintTargets.length > 0) {
  run(resolveLocalBin('eslint'), [
    '--fix',
    '--max-warnings=0',
    ...eslintTargets,
  ]);
}

run('git', ['add', '--', ...new Set([...prettierTargets, ...eslintTargets])]);
