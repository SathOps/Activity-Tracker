#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = process.cwd();
const sourceRoot = join(repoRoot, 'src');

const allowedExtensions = new Set(['.tsx', '.jsx']);
const excludedDirNames = new Set(['i18n']);
const excludedFilePatterns = [/\.test\.[jt]sx?$/i, /\.spec\.[jt]sx?$/i];

const hardcodedAttrPattern =
  /\b(?:placeholder|title|alt|aria-label|aria-description)\s*=\s*["']([^"'{][^"']*[A-Za-z][^"']*)["']/g;
const hardcodedTextNodePattern =
  /<[A-Za-z][^>]*>\s*([^<{][^<]*[A-Za-z][^<]*)\s*<\/[A-Za-z]/g;

function listSourceFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (excludedDirNames.has(entry)) {
        continue;
      }
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    const extension = fullPath.slice(fullPath.lastIndexOf('.'));
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    if (excludedFilePatterns.some((pattern) => pattern.test(fullPath))) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function shouldIgnoreValue(value) {
  const normalized = value.trim();
  if (!normalized) return true;
  if (normalized.includes('{') || normalized.includes('}')) return true;
  if (/^(https?:\/\/|\/|\.\/|\.\.\/)/.test(normalized)) return true;
  if (/^[A-Z0-9_\-.]+$/.test(normalized)) return true;
  if (/^[^A-Za-z]+$/.test(normalized)) return true;
  return false;
}

function collectHardcodedStrings(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const issues = [];

  lines.forEach((line, index) => {
    if (
      line.includes('t(') ||
      line.includes('/* i18n-ignore-line */') ||
      line.includes('// i18n-ignore-line')
    ) {
      return;
    }

    let attrMatch;
    while ((attrMatch = hardcodedAttrPattern.exec(line)) !== null) {
      const value = attrMatch[1];
      if (!shouldIgnoreValue(value)) {
        issues.push({
          line: index + 1,
          value: value.trim(),
          type: 'attribute',
        });
      }
    }
    hardcodedAttrPattern.lastIndex = 0;

    let textMatch;
    while ((textMatch = hardcodedTextNodePattern.exec(line)) !== null) {
      const value = textMatch[1];
      if (!shouldIgnoreValue(value)) {
        issues.push({
          line: index + 1,
          value: value.trim(),
          type: 'text-node',
        });
      }
    }
    hardcodedTextNodePattern.lastIndex = 0;
  });

  return issues;
}

const files = listSourceFiles(sourceRoot);
const allIssues = [];

for (const filePath of files) {
  const issues = collectHardcodedStrings(filePath);
  if (issues.length === 0) continue;

  for (const issue of issues) {
    allIssues.push({
      file: relative(repoRoot, filePath),
      ...issue,
    });
  }
}

if (allIssues.length > 0) {
  console.error(
    '\n❌ i18n usage validation failed: hardcoded UI strings were detected.\n'
  );
  console.error(
    'Run `npm run i18n:replace` locally and replace the flagged values with translation keys (e.g. t("...")).\n'
  );

  for (const issue of allIssues) {
    console.error(
      `- ${issue.file}:${issue.line} [${issue.type}] "${issue.value}"`
    );
  }

  process.exit(1);
}

console.log(
  '✅ i18n usage validation passed: no hardcoded UI strings detected in JSX.'
);
