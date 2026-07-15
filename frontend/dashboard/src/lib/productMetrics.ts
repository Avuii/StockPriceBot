import type { Product } from '../types';

export function discountAmount(product: Product) {
  if (!product.basePrice || !product.currentPrice || product.basePrice <= product.currentPrice) {
    return 0;
  }

  return product.basePrice - product.currentPrice;
}

export function discountPercent(product: Product) {
  if (product.discountPercent && product.discountPercent > 0) {
    return Math.round(product.discountPercent);
  }

  if (!product.basePrice || !product.currentPrice || product.basePrice <= product.currentPrice) {
    return 0;
  }

  return Math.round(((product.basePrice - product.currentPrice) / product.basePrice) * 100);
}

export function latestPriceDropAmount(product: Product) {
  return product.latestPriceDropAmount && product.latestPriceDropAmount > 0
    ? product.latestPriceDropAmount
    : 0;
}

export function latestPriceDropPercent(product: Product) {
  return product.latestPriceDropPercent && product.latestPriceDropPercent > 0
    ? Math.round(product.latestPriceDropPercent)
    : 0;
}

export function buildSavingsTimeline(products: Product[]) {
  const formatter = new Intl.DateTimeFormat('pl-PL', { month: 'short' });
  const monthlySavings = new Map<string, number>();

  for (const product of products) {
    const saved = discountAmount(product);
    if (saved <= 0) {
      continue;
    }

    const date = new Date(product.updatedAt || product.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    monthlySavings.set(key, (monthlySavings.get(key) ?? 0) + saved);
  }

  const now = new Date();
  const rows: { label: string; value: number; monthly: number }[] = [];
  let cumulative = 0;

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    const monthly = monthlySavings.get(key) ?? 0;
    cumulative += monthly;
    rows.push({
      label: formatter.format(date),
      value: Number(cumulative.toFixed(2)),
      monthly: Number(monthly.toFixed(2))
    });
  }

  return rows;
}
