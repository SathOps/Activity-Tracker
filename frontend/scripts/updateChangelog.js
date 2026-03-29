#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);

function readFlag(name, alias) {
  const index = args.findIndex(
    (value) => value === `--${name}` || (alias && value === `-${alias}`)
  );

  if (index === -1 || index === args.length - 1) {
    return undefined;
  }

  return args[index + 1];
}

function hasFlag(name, alias) {
  return args.some(
    (value) => value === `--${name}` || (alias && value === `-${alias}`)
  );
}

function runGit(argsList) {
  return execFileSync('git', argsList, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function readChangedFiles() {
  const staged = runGit([
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=ACMR',
  ])
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);

  if (staged.length > 0) {
    return staged;
  }

  const workingTree = runGit(['status', '--porcelain'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);

  return [...new Set(workingTree)];
}

/**
 * @param {string} file
 * @returns {string}
 */
function normalizePath(file) {
  return file.replace(/\\/g, '/');
}

function inferSectionFromFiles(files) {
  if (
    files.some((file) => {
      const normalized = normalizePath(file);
      return normalized.startsWith('tests/') || normalized.endsWith('.test.ts');
    })
  ) {
    return 'Fixed';
  }

  if (
    files.some((file) => {
      const normalized = normalizePath(file);
      return (
        normalized.startsWith('docs/') ||
        normalized === 'README.md' ||
        normalized === 'CONTRIBUTING.md'
      );
    })
  ) {
    return 'Changed';
  }

  return 'Changed';
}

/**
 * @param {string[]} files
 * @returns {string}
 */
function createAutoMessage(files) {
  const limit = 5;
  const sorted = [...new Set(files.map(normalizePath))].sort((left, right) =>
    left.localeCompare(right)
  );
  const shown = sorted.slice(0, limit).map((file) => `\`${file}\``);
  const remaining = sorted.length - shown.length;
  const suffix = remaining > 0 ? `, and ${remaining} more file(s)` : '';
  return `Updated ${shown.join(', ')}${suffix}`;
}

const message = readFlag('message', 'm');
const sectionFromFlag = readFlag('section', 's');
const autoMode = hasFlag('auto', 'a') || !message;

let resolvedMessage = message;
let section = (sectionFromFlag || 'Changed').trim();

if (autoMode && !message) {
  try {
    const changedFiles = readChangedFiles();

    if (changedFiles.length === 0) {
      console.error(
        'No changed files found. Stage or edit files before running.'
      );
      process.exit(1);
    }

    section = sectionFromFlag ? section : inferSectionFromFiles(changedFiles);
    resolvedMessage = createAutoMessage(changedFiles);
  } catch (error) {
    console.error(
      `Unable to generate changelog entry automatically: ${String(error)}`
    );
    process.exit(1);
  }
}

if (!resolvedMessage) {
  console.error(
    'Usage: node scripts/updateChangelog.js --message "description" [--section Added|Changed|Fixed] or --auto'
  );
  process.exit(1);
}

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
const content = fs.readFileSync(changelogPath, 'utf-8');
const lines = content.split(/\r?\n/);
const unreleasedIndex = lines.findIndex((line) =>
  line.startsWith('## [Unreleased]')
);

if (unreleasedIndex === -1) {
  console.error('Unable to find "## [Unreleased]" section in CHANGELOG.md.');
  process.exit(1);
}

const targetHeader = `### ${section}`;
let sectionIndex = lines.findIndex(
  (line, index) => index > unreleasedIndex && line.trim() === targetHeader
);

if (sectionIndex === -1) {
  const insertAfter = lines.findIndex(
    (line, index) =>
      index > unreleasedIndex &&
      line.startsWith('### ') &&
      line.trim() !== targetHeader
  );

  sectionIndex = insertAfter === -1 ? unreleasedIndex + 1 : insertAfter;
  lines.splice(sectionIndex, 0, '', targetHeader, '', `- ${resolvedMessage}`);
} else {
  let insertIndex = sectionIndex + 1;

  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex += 1;
  }

  lines.splice(insertIndex, 0, `- ${resolvedMessage}`);
}

fs.writeFileSync(changelogPath, lines.join('\n'));
