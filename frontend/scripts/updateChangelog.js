#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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

const message = readFlag('message', 'm');
const section = (readFlag('section', 's') || 'Changed').trim();

if (!message) {
  console.error(
    'Usage: node scripts/updateChangelog.js --message "description" [--section Added|Changed|Fixed]'
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
  lines.splice(sectionIndex, 0, '', targetHeader, '', `- ${message}`);
} else {
  let insertIndex = sectionIndex + 1;

  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex += 1;
  }

  lines.splice(insertIndex, 0, `- ${message}`);
}

fs.writeFileSync(changelogPath, lines.join('\n'));
