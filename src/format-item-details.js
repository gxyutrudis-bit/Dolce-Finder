const categories = new Map([
  ['avatar decoration', 'Avatar decoration'],
  ['avatar decorations', 'Avatar decoration'],
  ['profile effect', 'Profile effect'],
  ['profile effects', 'Profile effect'],
  ['frame effect', 'Frame effect'],
  ['frame effects', 'Frame effect'],
  ['nameplate', 'Nameplate'],
  ['nameplates', 'Nameplate'],
]);

function formatCategory(category) {
  if (typeof category !== 'string') return null;
  return categories.get(category.trim().toLowerCase()) ?? null;
}

function formatOrbsPrice(price) {
  if (!Number.isSafeInteger(price) || price < 0) return null;
  return `${new Intl.NumberFormat().format(price)} Orbs`;
}

module.exports = { formatCategory, formatOrbsPrice };