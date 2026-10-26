const fs = require('node:fs/promises');
const path = require('node:path');
const { formatPrice } = require('./format-price');

const balanceFile =
  process.env.BALANCE_STORE_PATH ??
  path.join(__dirname, '..', 'data', 'balances.json');
const currency = process.env.BALANCE_CURRENCY ?? 'PHP';
let operationQueue = Promise.resolve();

function enqueue(operation) {
  const result = operationQueue.then(operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readBalances() {
  try {
    const contents = await fs.readFile(balanceFile, 'utf8');
    const balances = JSON.parse(contents);
    if (!balances || Array.isArray(balances) || typeof balances !== 'object') {
      throw new Error('Balance data must be a JSON object.');
    }
    return balances;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeBalances(balances) {
  await fs.mkdir(path.dirname(balanceFile), { recursive: true });
  const temporaryFile = `${balanceFile}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(balances, null, 2)}\n`, {
      flag: 'wx',
    });
    await fs.rename(temporaryFile, balanceFile);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
    throw error;
  }
}

function balanceKey(guildId, userId) {
  if (!guildId || !userId) throw new Error('Guild and user IDs are required.');
  return `${guildId}:${userId}`;
}

function toMinorUnits(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  const minorUnits = Math.round(amount * 100);
  if (
    !Number.isSafeInteger(minorUnits) ||
    Math.abs(amount * 100 - minorUnits) > 1e-6
  ) {
    return null;
  }
  return minorUnits;
}

async function getBalance(guildId, userId) {
  return enqueue(async () => {
    const balances = await readBalances();
    const balance = balances[balanceKey(guildId, userId)] ?? 0;
    if (!Number.isSafeInteger(balance) || balance < 0) {
      throw new Error('Stored balance is invalid.');
    }
    return balance;
  });
}

async function addBalance(guildId, userId, amount) {
  return enqueue(async () => {
    const key = balanceKey(guildId, userId);
    const balances = await readBalances();
    const currentBalance = balances[key] ?? 0;
    const newBalance = currentBalance + amount;
    if (!Number.isSafeInteger(currentBalance) || !Number.isSafeInteger(newBalance)) {
      throw new Error('Balance amount exceeds the supported range.');
    }
    balances[key] = newBalance;
    await writeBalances(balances);
    return newBalance;
  });
}

async function useBalance(guildId, userId, amount) {
  return enqueue(async () => {
    const key = balanceKey(guildId, userId);
    const balances = await readBalances();
    const currentBalance = balances[key] ?? 0;
    if (!Number.isSafeInteger(currentBalance) || currentBalance < 0) {
      throw new Error('Stored balance is invalid.');
    }
    if (currentBalance < amount) {
      return { success: false, balance: currentBalance };
    }

    const newBalance = currentBalance - amount;
    balances[key] = newBalance;
    await writeBalances(balances);
    return { success: true, balance: newBalance };
  });
}

function formatBalance(minorUnits) {
  return formatPrice({ price: minorUnits / 100, currency });
}

module.exports = {
  addBalance,
  formatBalance,
  getBalance,
  toMinorUnits,
  useBalance,
};