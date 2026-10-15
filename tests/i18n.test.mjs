import assert from 'node:assert/strict';
import test from 'node:test';
import { createInstance } from 'i18next';
import resources from '../src/i18n/resources.js';
import { detectLanguage, getLocale, normalizeLanguage, persistLanguage, LANGUAGE_STORAGE_KEY } from '../src/i18n/languages.js';
import { formatCurrency, formatDate } from '../src/i18n/formatters.js';
import { translateError, fieldError } from '../src/i18n/errors.js';
import { checkCatalogs, checkReferences } from '../scripts/check-i18n.mjs';

const makeI18n = async (overrides = {}) => {
  const instance = createInstance();
  await instance.init({ resources, lng: 'es', fallbackLng: 'es', defaultNS: 'common', interpolation: { escapeValue: false }, ...overrides });
  return instance;
};

test('all catalogs and static translation references are complete', async () => {
  checkCatalogs();
  await checkReferences();
});

test('restores the existing saved preference, normalizes regional codes and rejects unsupported languages', () => {
  assert.equal(detectLanguage({ getItem: key => key === LANGUAGE_STORAGE_KEY ? 'en-US' : null }, { language: 'es-MX' }), 'en');
  assert.equal(normalizeLanguage('ES_mx'), 'es');
  assert.equal(normalizeLanguage('fr'), 'es');
  assert.equal(normalizeLanguage(null), 'es');
  assert.equal(detectLanguage(null, { languages: ['fr-FR', 'en-GB'] }), 'en');
  assert.equal(detectLanguage(null, { languages: ['fr-FR'] }), 'es');
  assert.equal(detectLanguage({ getItem: () => { throw Error('blocked'); } }, { language: 'en' }), 'en');
});

test('persists the preference and updates html even when storage is blocked', () => {
  const document = { documentElement: {} };
  const saved = new Map();
  persistLanguage('en-US', { setItem: (key, value) => saved.set(key, value) }, document);
  assert.equal(saved.get(LANGUAGE_STORAGE_KEY), 'en');
  assert.equal(document.documentElement.lang, 'en');
  persistLanguage('es', { setItem: () => { throw Error('blocked'); } }, document);
  assert.equal(document.documentElement.lang, 'es');
});

test('switches languages on the same i18next instance and renders plurals/interpolation', async () => {
  const i18n = await makeI18n();
  assert.equal(i18n.t('placements:availableFaces', { count: 1 }), '1 cara disponible');
  assert.equal(i18n.t('placements:availableFaces', { count: 2 }), '2 caras disponibles');
  assert.equal(i18n.t('placements:availableFaces', { count: 1000000 }), '1000000 caras disponibles');
  await i18n.changeLanguage('en');
  assert.equal(i18n.t('placements:availableFaces', { count: 0 }), '0 faces available');
  assert.equal(i18n.t('placements:availableFaces', { count: 1 }), '1 face available');
  assert.equal(i18n.t('placements:availableFaces', { count: 3 }), '3 faces available');
  assert.equal(i18n.t('common:pagination.range', { start: 1, end: 12, total: 20 }), 'Showing 1 to 12 of 20 results');
});

test('falls back to Spanish for an untranslated key in a supported language', async () => {
  const partial = structuredClone(resources);
  delete partial.en.reviewHub.claimTitle;
  const i18n = await makeI18n({ resources: partial, lng: 'en' });
  assert.equal(i18n.t('reviewHub:claimTitle'), resources.es.reviewHub.claimTitle);
});

test('formats the same monetary value and currency independently of the UI language', () => {
  for (const language of ['es', 'en']) {
    assert.equal(formatCurrency(1234.5, 'MXN', language), new Intl.NumberFormat(getLocale(language), { style: 'currency', currency: 'MXN', currencyDisplay: 'code' }).format(1234.5));
    assert.match(formatCurrency(1234.5, 'MXN', language), /MXN/);
  }
  assert.equal(formatDate(null), '—');
  assert.notEqual(formatDate('2026-10-15T12:00:00Z', 'es'), formatDate('2026-10-15T12:00:00Z', 'en'));
});

test('keeps RPC/auth error codes and field errors localizable after a language switch', async () => {
  const i18n = await makeI18n();
  const rpcError = { code: 'P0001', message: 'REVIEW_ALREADY_ASSIGNED' };
  assert.equal(translateError(i18n.t.bind(i18n), rpcError), resources.es.reviewHub.errors.REVIEW_ALREADY_ASSIGNED);
  assert.equal(translateError(i18n.t.bind(i18n), { code: 'invalid_credentials' }), resources.es.common.errors.invalid_credentials);
  await i18n.changeLanguage('en');
  assert.equal(translateError(i18n.t.bind(i18n), rpcError), resources.en.reviewHub.errors.REVIEW_ALREADY_ASSIGNED);
  assert.equal(translateError(i18n.t.bind(i18n), Error('Unrecognized server detail')), resources.en.common.errors.unexpected);
  assert.equal(fieldError(i18n.t.bind(i18n), { type: 'minLength' }, {}, { minLength: 5 }), 'Enter at least 5 characters.');
});

test('all dynamic placement enums, review tabs and face tabs resolve in both languages', async () => {
  const i18n = await makeI18n();
  const groups = {
    'placements:types': ['UNIPOLE_BILLBOARD', 'HAND_PAINTED_MURAL', 'BARRICADE', 'BUILDING_WRAP'],
    'placements:ownerStatuses': ['active', 'paused', 'withdrawn'],
    'placements:reviewStatuses': ['pending', 'in_review', 'approved', 'rejected', 'suspended'],
    'placements:visibility': ['public', 'private', 'unlisted'],
    'placements:form.tabs': ['face1', 'face2', 'face3', 'face4'],
  };
  for (const language of ['es', 'en']) {
    await i18n.changeLanguage(language);
    for (const [prefix, values] of Object.entries(groups)) {
      for (const value of values) {
        const key = `${prefix}.${value}`;
        assert.notEqual(i18n.t(key), key.split(':')[1], `${language}:${key}`);
      }
    }
    for (const key of ['unassigned', 'mine', 'reassign']) assert.ok(i18n.exists(`reviewHub:${key}`));
  }
});
