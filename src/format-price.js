function formatPrice(item) {
  if (
    typeof item.price !== 'number' ||
    !Number.isFinite(item.price) ||
    item.price < 0
  ) {
    return 'Price not listed';
  }

  const currency = item.currency ?? 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(item.price);
  } catch {
    return 'Price not listed';
  }
}

module.exports = { formatPrice };