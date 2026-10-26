const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, test } = require('node:test');

const tempDirectory = path.join(
  os.tmpdir(),
  `dolce-finder-balances-${process.pid}`,
);
process.env.BALANCE_STORE_PATH = path.join(tempDirectory, 'balances.json');

const {
  addBalance,
  getBalance,
  toMinorUnits,
  useBalance,
} = require('../src/balance-store');
const addBalanceCommand = require('../src/commands/addbalance').data.toJSON();
const viewBalanceCommand = require('../src/commands/viewbalance').data.toJSON();
const useBalanceCommand = require('../src/commands/usebalance').data.toJSON();

after(async () => {
  await fs.rm(tempDirectory, { recursive: true, force: true });
});

test('exposes the requested balance command options', () => {
  assert.deepEqual(addBalanceCommand.options.map((option) => option.name), [
    'amount',
  ]);
  assert.ok(addBalanceCommand.default_member_permissions);
  assert.deepEqual(viewBalanceCommand.options.map((option) => option.name), [
    'user',
  ]);
  assert.deepEqual(useBalanceCommand.options.map((option) => option.name), [
    'amount',
  ]);
});

test('converts positive amounts to cents and rejects invalid precision', () => {
  assert.equal(toMinorUnits(12.34), 1234);
  assert.equal(toMinorUnits(0), null);
  assert.equal(toMinorUnits(-1), null);
  assert.equal(toMinorUnits(1.234), null);
});

test('keeps balances separate by guild and serializes concurrent additions', async () => {
  await Promise.all(
    Array.from({ length: 10 }, () => addBalance('guild-a', 'user-a', 100)),
  );

  assert.equal(await getBalance('guild-a', 'user-a'), 1000);
  assert.equal(await getBalance('guild-b', 'user-a'), 0);
});

test('spending rejects insufficient funds and debits sufficient funds', async () => {
  const rejected = await useBalance('guild-a', 'user-a', 1001);
  assert.deepEqual(rejected, { success: false, balance: 1000 });
  assert.equal(await getBalance('guild-a', 'user-a'), 1000);

  const accepted = await useBalance('guild-a', 'user-a', 250);
  assert.deepEqual(accepted, { success: true, balance: 750 });
  assert.equal(await getBalance('guild-a', 'user-a'), 750);
});