import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const localesDir = resolve(repoRoot, 'src', 'i18n', 'locales');

const supportedLanguages = ['en', 'te', 'hi'];

function loadTranslations(lang) {
  const filePath = resolve(localesDir, `${lang}.json`);
  try {
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load ${lang}.json:`, error.message);
    process.exit(1);
  }
}

function getNestedKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getNestedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function validateTranslations() {
  const translations = {};
  const allKeys = new Set();

  // Load all translations
  for (const lang of supportedLanguages) {
    translations[lang] = loadTranslations(lang);
    const keys = getNestedKeys(translations[lang]);
    keys.forEach((key) => allKeys.add(key));
  }

  let hasErrors = false;

  // Check for missing keys in each language
  for (const lang of supportedLanguages) {
    const langKeys = new Set(getNestedKeys(translations[lang]));
    const missingKeys = Array.from(allKeys).filter((key) => !langKeys.has(key));

    if (missingKeys.length > 0) {
      console.error(
        `\n❌ Missing translation keys in ${lang}.json:`,
        missingKeys
      );
      hasErrors = true;
    }
  }

  // Check for extra keys not in reference language (English)
  const enKeys = new Set(getNestedKeys(translations.en));
  for (const lang of supportedLanguages) {
    if (lang === 'en') continue;
    const langKeys = new Set(getNestedKeys(translations[lang]));
    const extraKeys = Array.from(langKeys).filter((key) => !enKeys.has(key));

    if (extraKeys.length > 0) {
      console.error(
        `\n⚠️  Extra translation keys in ${lang}.json (not in English):`,
        extraKeys
      );
      hasErrors = true;
    }
  }

  // Check for empty values
  for (const lang of supportedLanguages) {
    const checkEmpty = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string' && value.trim() === '') {
          console.error(
            `\n⚠️  Empty value found in ${lang}.json for key: ${fullKey}`
          );
          hasErrors = true;
        } else if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          checkEmpty(value, fullKey);
        }
      }
    };
    checkEmpty(translations[lang]);
  }

  if (hasErrors) {
    console.error('\n❌ i18n validation failed. Please fix the issues above.');
    process.exit(1);
  }

  console.log(
    `✅ i18n validation passed! All ${supportedLanguages.length} languages have consistent keys.`
  );
  process.exit(0);
}

validateTranslations();
