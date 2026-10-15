import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import resources from '../src/i18n/resources.js';
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '../src/i18n/languages.js';

export const flatten = (value, prefix = '') => Object.entries(value).reduce((out, [key, item]) => {
  const full = prefix ? `${prefix}.${key}` : key;
  return { ...out, ...(typeof item === 'string' ? { [full]: item } : flatten(item, full)) };
}, {});

const logicalKey = key => key.replace(/_(zero|one|two|few|many|other)$/, '');
const variables = value => [...value.matchAll(/{{\s*([^},]+)(?:,[^}]*)?\s*}}/g)].map(match => match[1].trim()).sort();

export const checkCatalogs = () => {
  assert.deepEqual(Object.keys(resources).sort(), AVAILABLE_LANGUAGES.map(item => item.id).sort());
  const base = flatten(resources[DEFAULT_LANGUAGE]);
  const baseKeys = [...new Set(Object.keys(base).map(logicalKey))].sort();
  for (const [language, namespaces] of Object.entries(resources)) {
    const translations = flatten(namespaces);
    const keys = [...new Set(Object.keys(translations).map(logicalKey))].sort();
    assert.deepEqual(keys, baseKeys, `Missing/extra translation keys: ${language}`);
    for (const [key, value] of Object.entries(translations)) {
      const baseValue = base[key] ?? base[`${logicalKey(key)}_other`];
      assert.ok(value.trim(), `Empty translation: ${language}:${key}`);
      assert.deepEqual(variables(value), variables(baseValue), `Interpolation mismatch: ${language}:${key}`);
      if (key.endsWith('_other')) {
        for (const category of new Intl.PluralRules(language).resolvedOptions().pluralCategories) {
          assert.ok(translations[`${logicalKey(key)}_${category}`], `Missing plural ${category}: ${language}:${key}`);
        }
      }
    }
  }
  return Object.keys(base).length;
};

async function sourceFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return (await Promise.all(entries.map(item => {
    const url = new URL(item.name + (item.isDirectory() ? '/' : ''), folder);
    return item.isDirectory() ? sourceFiles(url) : /\.(jsx?|mjs)$/.test(item.name) ? [url] : [];
  }))).flat();
}

export const checkReferences = async () => {
  const keys = flatten(resources[DEFAULT_LANGUAGE]);
  let count = 0;
  for (const file of await sourceFiles(new URL('../src/', import.meta.url))) {
    if (file.pathname.includes('/i18n/')) continue;
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*(['"])([^'"]+)\1/g)) {
      const path = match[2].replace(':', '.');
      assert.ok(keys[path] || keys[`${path}_other`], `Unknown translation key ${match[2]} in ${file.pathname}`);
      count += 1;
    }
    assert.ok(!/language\s*===\s*['"](?:en|es)['"]/.test(source), `Inline language branch: ${file.pathname}`);
    assert.ok(!/langs\.settings|useLanguage\b|Language\.context/.test(source), `Legacy language API: ${file.pathname}`);
  }
  return count;
};

const keys = checkCatalogs();
const references = await checkReferences();
console.log(`i18n: ${keys} Spanish keys (including plural forms); ${references} static references verified.`);
