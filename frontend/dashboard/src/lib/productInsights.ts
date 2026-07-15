import type { Language } from '../i18n';
import { t } from '../i18n';
import type { Product } from '../types';
import { discountPercent } from './productMetrics';

export type PriceBadgeTone = 'good' | 'best' | 'wait' | 'high';

export type PriceInsight = {
  lowestPrice?: number | null;
  averagePrice?: number | null;
  currentVsAveragePercent?: number | null;
  badgeKey: 'goodDealBadge' | 'lowestPriceBadge' | 'waitBadge' | 'inflatedPriceBadge';
  tone: PriceBadgeTone;
};

export function getPriceInsight(product: Product): PriceInsight {
  const current = product.currentPrice ?? null;
  const lowest = product.lowestHistoryPrice ?? current;
  const average = product.averageHistoryPrice ?? product.basePrice ?? current;
  const currentVsAverage = product.currentVsAveragePercent
    ?? (current !== null && average && average > 0 ? ((current - average) / average) * 100 : null);
  const discount = discountPercent(product);

  if (current !== null && lowest !== null && product.isCurrentLowestHistoricalPrice && product.hasPriceHistoryChange) {
    return {
      lowestPrice: lowest,
      averagePrice: average,
      currentVsAveragePercent: currentVsAverage,
      badgeKey: 'lowestPriceBadge',
      tone: 'best'
    };
  }

  if (discount >= 20 || (currentVsAverage !== null && currentVsAverage <= -10)) {
    return {
      lowestPrice: lowest,
      averagePrice: average,
      currentVsAveragePercent: currentVsAverage,
      badgeKey: 'goodDealBadge',
      tone: 'good'
    };
  }

  if (currentVsAverage !== null && currentVsAverage >= 12) {
    return {
      lowestPrice: lowest,
      averagePrice: average,
      currentVsAveragePercent: currentVsAverage,
      badgeKey: 'inflatedPriceBadge',
      tone: 'high'
    };
  }

  return {
    lowestPrice: lowest,
    averagePrice: average,
    currentVsAveragePercent: currentVsAverage,
    badgeKey: 'waitBadge',
    tone: 'wait'
  };
}

export function priceBadgeClass(tone: PriceBadgeTone) {
  return {
    good: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    best: 'bg-violet-50 text-violet-700 dark:bg-[rgba(79,140,255,0.2)] dark:text-[#F5F7FB]',
    wait: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    high: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'
  }[tone];
}

export function healthLabel(language: Language, status?: string | null) {
  return t(language, healthKey(status) as Parameters<typeof t>[1]);
}

export function healthKey(status?: string | null) {
  if (status === 'Ok') {
    return 'monitorHealthOk';
  }
  if (status === 'PriceNotFound') {
    return 'monitorHealthPriceNotFound';
  }
  if (status === 'SelectorNeedsUpdate') {
    return 'monitorHealthSelectorNeedsUpdate';
  }
  if (status === 'RequiresJavaScript') {
    return 'monitorHealthRequiresJs';
  }
  if (status === 'LastError') {
    return 'monitorHealthLastError';
  }
  if (status === 'StoreBlocked') {
    return 'monitorHealthStoreBlocked';
  }
  return 'monitorHealthUnknown';
}

export function healthPillClass(status?: string | null) {
  if (status === 'Ok') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
  }
  if (status === 'PriceNotFound' || status === 'SelectorNeedsUpdate' || status === 'RequiresJavaScript' || status === 'StoreBlocked') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
  }
  if (status === 'LastError') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]';
}
