const { test } = require('node:test');
const assert = require('node:assert/strict');
const en = require('../site/src/locales/en.json');
const tr = require('../site/src/locales/tr.json');

function flatten(catalog, prefix = '') {
  return Object.fromEntries(Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' ? Object.entries(flatten(value, path)) : [[path, value]];
  }));
}

test('English and Turkish catalogs contain the same nonempty translation keys', () => {
  const english = flatten(en), turkish = flatten(tr);
  assert.deepEqual(Object.keys(english).sort(), Object.keys(turkish).sort());
  for (const [language, catalog] of [['en', english], ['tr', turkish]]) {
    for (const [key, value] of Object.entries(catalog)) {
      assert.equal(typeof value, 'string', `${language}.${key}`);
      assert(value.trim().length > 0, `${language}.${key} is empty`);
    }
  }
});

test('translations preserve the variables used by accessibility labels', () => {
  const english = flatten(en), turkish = flatten(tr);
  const variables = value => [...value.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(match => match[1]).sort();
  for (const key of Object.keys(english)) assert.deepEqual(variables(english[key]), variables(turkish[key]), key);
});
