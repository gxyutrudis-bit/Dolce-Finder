const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createCatalogStore } = require('../src/catalog-store');
const { data, normalizeShopItems } = require('../src/commands/syncshop');

test('syncshop is a Manage Server command with a required JSON attachment', () => {
  const command = data.toJSON();
  assert.equal(command.name, 'syncshop');
  assert.equal(command.default_member_permissions, '32');
  assert.equal(command.options[0].name, 'shop_json');
  assert.equal(command.options[0].required, true);
});

test('normalizes valid shop items and rejects unsafe catalog entries', () => {
  assert.deepEqual(
    normalizeShopItems([
      {
        name: 'Frame',
        description: 'Decoration',
        category: 'frame effect',
        price: 4.99,
        currency: 'eur',
        orbsPrice: 1200,
        url: 'https://example.com/frame',
        imageUrl: 'https://example.com/frame.png',
        ignored: 'field',
      },
    ]),
    [
      {
        name: 'Frame',
        description: 'Decoration',
        category: 'frame effect',
        price: 4.99,
        currency: 'EUR',
        orbsPrice: 1200,
        url: 'https://example.com/frame',
        imageUrl: 'https://example.com/frame.png',
      },
    ],
  );
  assert.throws(() => normalizeShopItems([]), /non-empty array/);
  assert.throws(() => normalizeShopItems([{ name: ' ' }]), /non-empty name/);
  assert.throws(
    () => normalizeShopItems([{ name: 'Frame', imageUrl: 'http://example.com/frame.png' }]),
    /must use HTTPS/,
  );
});

test('catalog store atomically replaces and reloads shared items', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dolce-catalog-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  const store = createCatalogStore(path.join(directory, 'shop-items.json'));
  assert.deepEqual(await store.getShopItems(), []);

  const items = [{ name: 'Frame', imageUrl: 'https://example.com/frame.png' }];
  assert.equal(await store.replaceShopItems(items), 1);
  assert.deepEqual(await store.getShopItems(), items);
});