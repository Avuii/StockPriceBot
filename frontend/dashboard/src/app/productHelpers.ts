import { categoryColor } from '../components/categories/categoryVisuals';
import { type Language, t } from '../i18n';
import type {
  AccountSettings,
  Category,
  CreateProductRequest,
  Product,
  UpdateProductRequest,
  User
} from '../types';
import { UNCATEGORIZED_CATEGORY_ID, UNCATEGORIZED_COLOR } from './constants';
import type { Filters, ProductFormState } from './types';

export function matchesFilters(product: Product, filters: Filters, query: string) {
  const text = `${product.name} ${product.shopName} ${product.categoryName ?? ''} ${product.size ?? ''} ${product.color ?? ''} ${product.note ?? ''}`.toLowerCase();
  return (!query || text.includes(query))
    && (filters.store === 'all' || product.shopName === filters.store)
    && (filters.category === 'all'
      || (filters.category === UNCATEGORIZED_CATEGORY_ID ? !product.categoryName : product.categoryName === filters.category))
    && (filters.size === 'all' || product.size === filters.size)
    && (filters.color === 'all' || product.color === filters.color)
    && (filters.availability === 'all' || (filters.availability === 'available' ? product.isAvailable : !product.isAvailable))
    && (filters.monitoring === 'all' || (filters.monitoring === 'active' ? product.isActive : !product.isActive))
    && (filters.belowTarget === 'all' || isBelowTarget(product))
    && (filters.stockAlert === 'all' || product.trackStock)
    && (filters.recent === 'all' || isRecentlyAdded(product));
}

export function sortProducts(left: Product, right: Product, sort: string) {
  if (sort === 'oldest') {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  }

  if (sort === 'priceAsc') {
    return priceOrMax(left.currentPrice) - priceOrMax(right.currentPrice);
  }

  if (sort === 'priceDesc') {
    return priceOrMin(right.currentPrice) - priceOrMin(left.currentPrice);
  }

  if (sort === 'discountDesc') {
    return (right.discountPercent ?? 0) - (left.discountPercent ?? 0);
  }

  if (sort === 'closestTarget') {
    return distanceOrMax(left.distanceToTarget) - distanceOrMax(right.distanceToTarget);
  }

  if (sort === 'lastChecked') {
    return dateOrZero(right.lastCheckedAt) - dateOrZero(left.lastCheckedAt);
  }

  if (sort === 'nameAsc') {
    return left.name.localeCompare(right.name, 'pl');
  }

  if (sort === 'nameDesc') {
    return right.name.localeCompare(left.name, 'pl');
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export function activeFilterChips(filters: Filters, query: string, language: Language) {
  const chips: string[] = [];
  if (query.trim()) {
    chips.push(`${t(language, 'searchChip')}: ${query.trim()}`);
  }
  if (filters.category !== 'all') {
    chips.push(filters.category === UNCATEGORIZED_CATEGORY_ID ? t(language, 'uncategorizedProducts') : filters.category);
  }
  if (filters.store !== 'all') {
    chips.push(filters.store);
  }
  if (filters.size !== 'all') {
    chips.push(`${t(language, 'size')}: ${filters.size}`);
  }
  if (filters.color !== 'all') {
    chips.push(`${t(language, 'color')}: ${filters.color}`);
  }
  if (filters.availability !== 'all') {
    chips.push(filters.availability === 'available' ? t(language, 'available') : t(language, 'unavailable'));
  }
  if (filters.monitoring !== 'all') {
    chips.push(filters.monitoring === 'active' ? t(language, 'monitoringOn') : t(language, 'monitoringOff'));
  }
  if (filters.belowTarget === 'yes') {
    chips.push(t(language, 'targetPriceDrop'));
  }
  if (filters.stockAlert === 'yes') {
    chips.push(t(language, 'stockAlert'));
  }
  if (filters.recent === 'yes') {
    chips.push(t(language, 'recentlyAdded'));
  }
  return chips;
}

export function readStoredAlertIds() {
  try {
    const raw = localStorage.getItem('pricestockbot.readAlertIds');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function readStoredWatchlistIds() {
  try {
    const raw = localStorage.getItem('pricestockbot.watchlistIds');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function productAccentColor(product: Product, categories: Category[]) {
  if (!product.categoryName) {
    return UNCATEGORIZED_COLOR;
  }

  const category = categories.find((item) => item.name === product.categoryName);
  return category ? categoryColor(category) : UNCATEGORIZED_COLOR;
}

export function isBelowTarget(product: Product) {
  return product.currentPrice !== null
    && product.currentPrice !== undefined
    && product.targetPrice !== null
    && product.targetPrice !== undefined
    && product.currentPrice <= product.targetPrice;
}

export function formToCreateRequest(form: ProductFormState, settings: AccountSettings): CreateProductRequest {
  return {
    name: clean(form.name),
    url: form.url,
    shopName: clean(form.shopName),
    imageUrl: clean(form.imageUrl),
    basePrice: numberOrUndefined(form.basePrice),
    currentPrice: numberOrUndefined(form.currentPrice),
    targetPrice: numberOrUndefined(form.targetPrice),
    currency: clean(form.currency) ?? 'PLN',
    size: clean(form.size),
    color: clean(form.color),
    note: clean(form.note),
    isAvailable: form.isAvailable,
    trackStock: form.trackStock,
    isActive: form.isActive,
    isBookmarked: false,
    alertOnPriceDrop: settings.notifyTargetPrice,
    alertOnBackInStock: settings.notifyBackInStock,
    percentDrop: numberOrUndefined(form.percentDrop) ?? settings.minimumDiscountPercent,
    checkIntervalMinutes: numberOrUndefined(form.checkIntervalMinutes) ?? settings.defaultCheckIntervalMinutes,
    categoryName: clean(form.categoryName),
    priceSelector: clean(form.priceSelector),
    stockSelector: clean(form.stockSelector)
  };
}

export function formToUpdateRequest(form: ProductFormState): UpdateProductRequest {
  return {
    name: clean(form.name),
    url: clean(form.url),
    shopName: clean(form.shopName),
    imageUrl: clean(form.imageUrl),
    basePrice: numberOrUndefined(form.basePrice),
    currentPrice: numberOrUndefined(form.currentPrice),
    targetPrice: numberOrUndefined(form.targetPrice),
    currency: clean(form.currency) ?? 'PLN',
    size: clean(form.size),
    color: clean(form.color),
    note: clean(form.note),
    isAvailable: form.isAvailable,
    trackStock: form.trackStock,
    isActive: form.isActive,
    percentDrop: numberOrUndefined(form.percentDrop),
    checkIntervalMinutes: numberOrUndefined(form.checkIntervalMinutes) ?? 60,
    categoryName: clean(form.categoryName),
    priceSelector: clean(form.priceSelector),
    stockSelector: clean(form.stockSelector)
  };
}

export function productToUpdateRequest(product: Product, overrides: Partial<UpdateProductRequest>): UpdateProductRequest {
  return {
    name: product.name,
    url: product.url,
    shopName: product.shopName,
    imageUrl: product.imageUrl ?? '',
    basePrice: product.basePrice ?? undefined,
    currentPrice: product.currentPrice ?? undefined,
    targetPrice: product.targetPrice ?? undefined,
    currency: product.currency,
    size: product.size ?? '',
    color: product.color ?? '',
    note: product.note ?? '',
    isAvailable: product.isAvailable,
    trackStock: product.trackStock,
    isActive: product.isActive,
    isBookmarked: product.isBookmarked,
    checkIntervalMinutes: product.checkIntervalMinutes,
    categoryName: product.categoryName ?? '',
    priceSelector: product.priceSelector ?? '',
    stockSelector: product.stockSelector ?? '',
    ...overrides
  };
}

export function productToForm(product: Product, settings: AccountSettings): ProductFormState {
  return {
    name: product.name,
    url: product.url,
    shopName: product.shopName,
    categoryName: product.categoryName ?? '',
    size: product.size ?? '',
    color: product.color ?? '',
    note: product.note ?? '',
    imageUrl: product.imageUrl ?? '',
    basePrice: product.basePrice?.toString() ?? '',
    currentPrice: product.currentPrice?.toString() ?? '',
    targetPrice: product.targetPrice?.toString() ?? '',
    currency: product.currency,
    isAvailable: product.isAvailable,
    trackStock: product.trackStock,
    isActive: product.isActive,
    percentDrop: settings.minimumDiscountPercent.toString(),
    checkIntervalMinutes: product.checkIntervalMinutes.toString(),
    priceSelector: product.priceSelector ?? '',
    stockSelector: product.stockSelector ?? ''
  };
}

export function settingsFromUser(user: User): AccountSettings {
  return {
    alertEmail: user.alertEmail,
    emailNotificationsEnabled: user.emailNotificationsEnabled,
    emailSmtpHost: user.emailSmtpHost,
    emailSmtpPort: user.emailSmtpPort,
    emailSmtpUserName: user.emailSmtpUserName,
    emailSmtpPassword: '',
    emailSmtpPasswordConfigured: user.emailSmtpPasswordConfigured,
    emailFromEmail: user.emailFromEmail,
    emailFromName: user.emailFromName,
    emailEnableSsl: user.emailEnableSsl,
    minimumDiscountPercent: user.minimumDiscountPercent,
    notifyOnlySelectedVariant: user.notifyOnlySelectedVariant,
    notifyBackInStock: user.notifyBackInStock,
    notifyTargetPrice: user.notifyTargetPrice,
    maxEmailsPerProductPerDay: user.maxEmailsPerProductPerDay,
    defaultCheckIntervalMinutes: user.defaultCheckIntervalMinutes ?? 60
  };
}

export function unique(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

export function countBy(values: string[]) {
  const counts = values.reduce<Record<string, number>>((map, value) => {
    if (value) {
      map[value] = (map[value] ?? 0) + 1;
    }
    return map;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
}

export function numberOrUndefined(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isRecentlyAdded(product: Product) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(product.createdAt).getTime() >= weekAgo;
}

function clean(value: string) {
  return value.trim() || undefined;
}

function priceOrMax(value: number | null | undefined) {
  return value ?? Number.MAX_SAFE_INTEGER;
}

function priceOrMin(value: number | null | undefined) {
  return value ?? Number.MIN_SAFE_INTEGER;
}

function distanceOrMax(value: number | null | undefined) {
  return value === null || value === undefined ? Number.MAX_SAFE_INTEGER : Math.abs(value);
}

function dateOrZero(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}
