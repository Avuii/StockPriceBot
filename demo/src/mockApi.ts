import type {
  AccountSettings,
  AuthResponse,
  Category,
  CreateProductRequest,
  DashboardStats,
  EmailTestResult,
  PriceHistoryPoint,
  Product,
  ProductCheckLog,
  ProductDetail,
  UpdateProductRequest,
  User
} from '../../frontend/dashboard/src/types';
import type { ApiClient } from '../../frontend/dashboard/src/api';

const DEMO_DELAY_MS = 120;

const now = () => new Date();
const minutesAgo = (minutes: number) => new Date(now().getTime() - minutes * 60_000).toISOString();
const daysAgo = (days: number) => new Date(now().getTime() - days * 24 * 60 * 60_000).toISOString();

function demoImage(label: string, background: string, accent: string) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="32" fill="${background}"/>
      <circle cx="178" cy="62" r="38" fill="${accent}" opacity="0.2"/>
      <circle cx="70" cy="182" r="54" fill="${accent}" opacity="0.15"/>
      <rect x="52" y="58" width="136" height="124" rx="26" fill="white" opacity="0.9"/>
      <text x="120" y="135" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="800" fill="${accent}">${initials}</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let demoSettings: AccountSettings = {
  alertEmail: 'demo@stockpricebot.app',
  emailNotificationsEnabled: true,
  emailSmtpHost: '',
  emailSmtpPort: 587,
  emailSmtpUserName: '',
  emailSmtpPassword: '',
  emailSmtpPasswordConfigured: false,
  emailFromEmail: 'stockpricebotalert@gmail.com',
  emailFromName: 'StockPriceBot',
  emailEnableSsl: true,
  minimumDiscountPercent: 20,
  notifyOnlySelectedVariant: true,
  notifyBackInStock: true,
  notifyTargetPrice: true,
  maxEmailsPerProductPerDay: 1,
  defaultCheckIntervalMinutes: 60
};

let demoUser: User = {
  id: 'demo-user',
  email: 'demo@stockpricebot.app',
  alertEmail: demoSettings.alertEmail,
  emailNotificationsEnabled: demoSettings.emailNotificationsEnabled,
  emailSmtpHost: demoSettings.emailSmtpHost,
  emailSmtpPort: demoSettings.emailSmtpPort,
  emailSmtpUserName: demoSettings.emailSmtpUserName,
  emailSmtpPasswordConfigured: demoSettings.emailSmtpPasswordConfigured,
  emailFromEmail: demoSettings.emailFromEmail,
  emailFromName: demoSettings.emailFromName,
  emailEnableSsl: demoSettings.emailEnableSsl,
  minimumDiscountPercent: demoSettings.minimumDiscountPercent,
  notifyOnlySelectedVariant: demoSettings.notifyOnlySelectedVariant,
  notifyBackInStock: demoSettings.notifyBackInStock,
  notifyTargetPrice: demoSettings.notifyTargetPrice,
  maxEmailsPerProductPerDay: demoSettings.maxEmailsPerProductPerDay,
  defaultCheckIntervalMinutes: demoSettings.defaultCheckIntervalMinutes
};

let demoCategories: Category[] = [
  { id: 'cat-jewelry', name: 'Bizuteria', iconName: 'Gem', colorHex: '#eab308', productCount: 0 },
  { id: 'cat-shoes', name: 'Buty', iconName: 'Search', colorHex: '#8b5cf6', productCount: 0 },
  { id: 'cat-home', name: 'Dom', iconName: 'House', colorHex: '#14b8a6', productCount: 0 },
  { id: 'cat-electronics', name: 'Elektronika', iconName: 'Laptop', colorHex: '#2563eb', productCount: 0 },
  { id: 'cat-agd', name: 'Elektronika, AGD', iconName: 'Search', colorHex: '#86efac', productCount: 0 },
  { id: 'cat-tea', name: 'Herbata', iconName: 'Coffee', colorHex: '#22c55e', productCount: 0 },
  { id: 'cat-other', name: 'Inne', iconName: 'Tag', colorHex: '#64748b', productCount: 0 },
  { id: 'cat-beauty', name: 'Kosmetyki', iconName: 'WandSparkles', colorHex: '#fb7185', productCount: 0 },
  { id: 'cat-books', name: 'Ksiazki', iconName: 'BookOpen', colorHex: '#f97316', productCount: 0 },
  { id: 'cat-clothes', name: 'Ubrania', iconName: 'Shirt', colorHex: '#38bdf8', productCount: 0 },
  { id: 'cat-coffee', name: 'ekspresy do kawy', iconName: 'Coffee', colorHex: '#a16207', productCount: 0 }
];

let demoProducts: Product[] = [
  productSeed({
    id: 'prod-humidifier',
    name: 'Nawilzacz Powietrza na USB 350ml - MIFFY - niebieski',
    shopName: 'allegro.pl',
    categoryName: 'Inne',
    currentPrice: 139.99,
    basePrice: 159.99,
    targetPrice: 100.99,
    color: 'niebieski',
    imageUrl: demoImage('MIFFY', '#eef7ff', '#36b8f4'),
    createdAt: daysAgo(11),
    updatedAt: minutesAgo(70),
    isBookmarked: false
  }),
  productSeed({
    id: 'prod-miffy-phone',
    name: 'Original Miffy Sofa Phone Stand Blind Box figurka kolekcjonerska',
    shopName: 'allegro.pl',
    categoryName: 'Inne',
    currentPrice: 79.99,
    basePrice: 89.99,
    targetPrice: 69.99,
    size: '-',
    color: '-',
    imageUrl: demoImage('Miffy', '#fff1f2', '#fb7185'),
    createdAt: daysAgo(10),
    updatedAt: minutesAgo(80),
    isBookmarked: false
  }),
  productSeed({
    id: 'prod-laka',
    name: 'Laka Forever6 Eye Palette',
    shopName: 'hebe.pl',
    categoryName: 'Kosmetyki',
    currentPrice: 119.99,
    basePrice: 119.99,
    targetPrice: 90,
    size: '-',
    color: '02',
    imageUrl: demoImage('LAKA', '#f8f4ff', '#8b5cf6'),
    createdAt: daysAgo(9),
    updatedAt: minutesAgo(82),
    isBookmarked: true
  }),
  productSeed({
    id: 'prod-planetary',
    name: 'ROBOT PLANETARNY KUCHENNY PODGRZEWANA MISA 8L WAGA PANEL LED 4000 2100W XXL',
    shopName: 'allegro.pl',
    categoryName: 'Elektronika, AGD',
    currentPrice: 599,
    basePrice: 679,
    targetPrice: 500,
    imageUrl: demoImage('Robot', '#f8fafc', '#0ea5e9'),
    createdAt: daysAgo(8),
    updatedAt: minutesAgo(95),
    isBookmarked: true
  }),
  productSeed({
    id: 'prod-slushie',
    name: 'Maszynka do slushie Ninja SLUSHi FS301EU',
    shopName: 'allegro.pl',
    categoryName: 'Elektronika, AGD',
    currentPrice: 938.99,
    basePrice: 1050,
    targetPrice: 900,
    imageUrl: demoImage('Ninja', '#eff6ff', '#ef4444'),
    createdAt: daysAgo(7),
    updatedAt: minutesAgo(110),
    isBookmarked: false
  }),
  productSeed({
    id: 'prod-gosh',
    name: 'Gosh Copenhagen Eyedentity',
    shopName: 'hebe.pl',
    categoryName: null,
    currentPrice: 69.99,
    basePrice: 79.99,
    targetPrice: 50,
    color: '005 be hopeful',
    imageUrl: demoImage('Gosh', '#fff7ed', '#f97316'),
    createdAt: daysAgo(3),
    updatedAt: minutesAgo(34),
    isBookmarked: false
  }),
  productSeed({
    id: 'prod-miyo',
    name: 'Miyo Five Points',
    shopName: 'hebe.pl',
    categoryName: 'Kosmetyki',
    currentPrice: 36,
    basePrice: 49.99,
    targetPrice: 35,
    color: '02 Smokey',
    imageUrl: demoImage('Miyo', '#f1f5f9', '#334155'),
    createdAt: daysAgo(4),
    updatedAt: minutesAgo(210),
    isBookmarked: true
  }),
  productSeed({
    id: 'prod-dress',
    name: '- Sukienka koktajlowa',
    shopName: 'zalando.pl',
    categoryName: 'Ubrania',
    currentPrice: 1277,
    basePrice: 1499,
    targetPrice: 1100,
    size: 'M',
    color: 'pink',
    imageUrl: demoImage('Dress', '#fdf2f8', '#ec4899'),
    createdAt: daysAgo(13),
    updatedAt: daysAgo(1),
    isBookmarked: false
  }),
  productSeed({
    id: 'prod-tea',
    name: 'DAVID RIO Tiger Spice Chai',
    shopName: 'przyjacielekawy.pl',
    categoryName: 'Herbata',
    currentPrice: 59,
    basePrice: 59,
    targetPrice: 49,
    imageUrl: demoImage('Chai', '#fff7ed', '#a16207'),
    createdAt: daysAgo(6),
    updatedAt: minutesAgo(130),
    isBookmarked: false
  }),
  productSeed({
    id: 'prod-ring',
    name: '- Pierscionek',
    shopName: 'zalando.pl',
    categoryName: 'Bizuteria',
    currentPrice: 728,
    basePrice: 899,
    targetPrice: 299.95,
    color: 'silver-coloured',
    imageUrl: demoImage('Ring', '#f8fafc', '#eab308'),
    createdAt: daysAgo(15),
    updatedAt: minutesAgo(180),
    isBookmarked: false
  })
];

let historyByProductId: Record<string, PriceHistoryPoint[]> = {
  'prod-humidifier': history('prod-humidifier', [159.99, 149.99, 145.49, 139.99]),
  'prod-miffy-phone': history('prod-miffy-phone', [89.99, 89.99, 79.99]),
  'prod-laka': history('prod-laka', [119.99, 119.99, 119.99]),
  'prod-planetary': history('prod-planetary', [679, 649, 629, 599]),
  'prod-slushie': history('prod-slushie', [1050, 999, 938.99]),
  'prod-gosh': history('prod-gosh', [79.99, 69.99, 69.99]),
  'prod-miyo': history('prod-miyo', [49.99, 42, 36]),
  'prod-dress': history('prod-dress', [1499, 1399, 1277]),
  'prod-tea': history('prod-tea', [59, 59]),
  'prod-ring': history('prod-ring', [899, 799, 728])
};

let notificationsByProductId: Record<string, ProductDetail['notifications']> = {
  'prod-planetary': [{
    id: 'notif-planetary-drop',
    type: 'price_drop',
    channel: 'email',
    message: 'Price dropped by PLN 30.00.',
    sentAt: minutesAgo(30)
  }],
  'prod-gosh': [{
    id: 'notif-gosh-target',
    type: 'price_drop',
    channel: 'email',
    message: 'Product is closer to your target price.',
    sentAt: minutesAgo(55)
  }]
};

demoProducts = demoProducts.map(hydrateProductMetrics);

let checkLogsByProductId: Record<string, ProductCheckLog[]> = Object.fromEntries(
  demoProducts.map((product) => [product.id, [checkLog(product, 'Info', 'Ok', 'Cena odczytana poprawnie.')]])
);

export const mockApi = {
  login: async (email: string, _password: string): Promise<AuthResponse> => {
    demoUser = { ...demoUser, email: email || demoUser.email };
    return delayed({ token: 'demo-token', user: clone(demoUser) });
  },
  register: async (email: string, _password: string): Promise<AuthResponse> => {
    demoUser = { ...demoUser, email: email || demoUser.email };
    return delayed({ token: 'demo-token', user: clone(demoUser) });
  },
  forgotPassword: (email: string) => delayed({ message: `Demo reset link prepared for ${email || 'your email'}.` }),
  resetPassword: (_email: string, _token: string, _password: string) => delayed({ message: 'Demo password updated. You can sign in now.' }),
  me: () => delayed(demoUser),
  logout: () => delayed(undefined),
  getSettings: () => delayed(demoSettings),
  updateSettings: (payload: AccountSettings) => {
    demoSettings = { ...payload, emailSmtpPassword: '', emailSmtpPasswordConfigured: Boolean(payload.emailSmtpPassword || payload.emailSmtpPasswordConfigured) };
    demoUser = userFromSettings(demoUser.email, demoSettings);
    return delayed(demoSettings);
  },
  sendTestEmail: (): Promise<EmailTestResult> => delayed({
    success: true,
    message: `Demo email would be sent to ${demoSettings.alertEmail || demoUser.email}.`
  }),
  getStats: () => delayed(buildStats()),
  getProducts: () => delayed(hydratedProducts()),
  getProduct: (id: string) => delayed(buildProductDetail(id)),
  getHistory: (id: string) => delayed(historyByProductId[id] ?? []),
  createProduct: (payload: CreateProductRequest) => {
    const product = hydrateProductMetrics(productSeed({
      id: `prod-${Date.now()}`,
      name: payload.name || payload.shopName || 'New tracked product',
      url: payload.url,
      shopName: payload.shopName || hostName(payload.url),
      categoryName: payload.categoryName || null,
      currentPrice: payload.currentPrice ?? payload.basePrice ?? null,
      basePrice: payload.basePrice ?? payload.currentPrice ?? null,
      targetPrice: payload.targetPrice ?? null,
      currency: payload.currency ?? 'PLN',
      size: payload.size ?? null,
      color: payload.color ?? null,
      note: payload.note ?? null,
      imageUrl: payload.imageUrl || demoImage(payload.name || 'Product', '#eff6ff', '#0ea5e9'),
      isAvailable: payload.isAvailable ?? true,
      trackStock: payload.trackStock ?? true,
      isActive: payload.isActive ?? true,
      isBookmarked: payload.isBookmarked ?? false,
      checkIntervalMinutes: payload.checkIntervalMinutes ?? demoSettings.defaultCheckIntervalMinutes,
      priceSelector: payload.priceSelector ?? null,
      stockSelector: payload.stockSelector ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    demoProducts = [product, ...demoProducts];
    historyByProductId[product.id] = product.currentPrice !== null && product.currentPrice !== undefined
      ? [{ price: product.currentPrice, currency: product.currency, isAvailable: product.isAvailable, checkedAt: new Date().toISOString(), source: 'Demo' }]
      : [];
    checkLogsByProductId[product.id] = [checkLog(product, 'Info', 'Ok', 'Demo product created.')];
    return delayed(product);
  },
  updateProduct: (id: string, payload: UpdateProductRequest) => {
    const current = findProduct(id);
    const next = hydrateProductMetrics({
      ...current,
      ...payload,
      imageUrl: payload.imageUrl ?? current.imageUrl,
      categoryName: payload.categoryName || null,
      updatedAt: new Date().toISOString()
    });

    const previousPrice = current.currentPrice;
    demoProducts = demoProducts.map((product) => product.id === id ? next : product);
    if (next.currentPrice !== null && next.currentPrice !== undefined && next.currentPrice !== previousPrice) {
      appendHistory(next, 'ManualEdit');
    }
    checkLogsByProductId[id] = [checkLog(next, 'Info', 'Ok', 'Product updated in demo.'), ...(checkLogsByProductId[id] ?? [])].slice(0, 20);
    return delayed(next);
  },
  deleteProduct: (id: string) => {
    demoProducts = demoProducts.filter((product) => product.id !== id);
    delete historyByProductId[id];
    delete notificationsByProductId[id];
    delete checkLogsByProductId[id];
    return delayed(undefined);
  },
  checkProduct: (id: string) => {
    const product = findProduct(id);
    const next = hydrateProductMetrics({
      ...product,
      lastCheckedAt: new Date().toISOString(),
      lastSuccessfulCheckAt: new Date().toISOString(),
      monitoringStatus: 'Ok',
      lastCheckMessage: 'Cena odczytana poprawnie.',
      lastCheckError: null,
      lastCheckSource: 'JsonLd',
      updatedAt: new Date().toISOString()
    });
    appendHistory(next, 'JsonLd');
    checkLogsByProductId[id] = [checkLog(next, 'Info', 'Ok', 'Cena odczytana poprawnie.'), ...(checkLogsByProductId[id] ?? [])].slice(0, 20);
    demoProducts = demoProducts.map((productItem) => productItem.id === id ? hydrateProductMetrics(next) : productItem);
    return delayed(findProduct(id));
  },
  getCategories: () => delayed(categoriesWithCounts()),
  createCategory: (name: string, iconName?: string, colorHex?: string) => {
    const existing = demoCategories.find((category) => category.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return delayed({ ...existing, productCount: productCount(existing.name) });
    }

    const category: Category = {
      id: `cat-${Date.now()}`,
      name,
      iconName: iconName || 'Tag',
      colorHex: colorHex || '#38bdf8',
      productCount: 0
    };
    demoCategories = [...demoCategories, category];
    return delayed(category);
  },
  updateCategory: (id: string, payload: { name: string; iconName?: string | null; colorHex?: string | null }) => {
    const previous = demoCategories.find((category) => category.id === id);
    if (!previous) {
      throw new Error('Category not found.');
    }

    demoCategories = demoCategories.map((category) => category.id === id ? {
      ...category,
      name: payload.name,
      iconName: payload.iconName ?? category.iconName,
      colorHex: payload.colorHex ?? category.colorHex
    } : category);
    demoProducts = demoProducts.map((product) => product.categoryName === previous.name ? { ...product, categoryName: payload.name } : product);
    return delayed(categoriesWithCounts().find((category) => category.id === id)!);
  },
  deleteCategory: (id: string, force = false) => {
    const category = demoCategories.find((item) => item.id === id);
    if (!category) {
      return delayed(undefined);
    }

    const assignedCount = productCount(category.name);
    if (assignedCount > 0 && !force) {
      throw new Error('Category is used by products.');
    }

    demoCategories = demoCategories.filter((item) => item.id !== id);
    demoProducts = demoProducts.map((product) => product.categoryName === category.name ? { ...product, categoryName: null } : product);
    return delayed(undefined);
  }
} satisfies ApiClient;

function productSeed(seed: Partial<Product> & Pick<Product, 'id' | 'name' | 'shopName'>): Product {
  const createdAt = seed.createdAt ?? daysAgo(2);
  const currentPrice = seed.currentPrice ?? null;
  return {
    id: seed.id,
    name: seed.name,
    url: seed.url ?? `https://${seed.shopName}/demo/${seed.id}`,
    shopName: seed.shopName,
    imageUrl: seed.imageUrl ?? demoImage(seed.name, '#f8fafc', '#0ea5e9'),
    basePrice: seed.basePrice ?? currentPrice,
    currentPrice,
    targetPrice: seed.targetPrice ?? null,
    currency: seed.currency ?? 'PLN',
    size: seed.size ?? null,
    color: seed.color ?? null,
    note: seed.note ?? 'Demo product used for the GitHub Pages preview.',
    isAvailable: seed.isAvailable ?? true,
    lastCheckedAt: seed.lastCheckedAt ?? minutesAgo(35),
    checkIntervalMinutes: seed.checkIntervalMinutes ?? 60,
    trackStock: seed.trackStock ?? true,
    isActive: seed.isActive ?? true,
    isBookmarked: seed.isBookmarked ?? false,
    categoryName: seed.categoryName ?? null,
    createdAt,
    updatedAt: seed.updatedAt ?? createdAt,
    discountPercent: seed.discountPercent ?? null,
    distanceToTarget: seed.distanceToTarget ?? null,
    lowestHistoryPrice: seed.lowestHistoryPrice ?? currentPrice,
    averageHistoryPrice: seed.averageHistoryPrice ?? currentPrice,
    currentVsAveragePercent: seed.currentVsAveragePercent ?? 0,
    priceHistoryCount: seed.priceHistoryCount ?? 1,
    distinctHistoryPriceCount: seed.distinctHistoryPriceCount ?? 1,
    hasPriceHistoryChange: seed.hasPriceHistoryChange ?? false,
    isCurrentLowestHistoricalPrice: seed.isCurrentLowestHistoricalPrice ?? false,
    latestPriceDropAmount: seed.latestPriceDropAmount ?? 0,
    latestPriceDropPercent: seed.latestPriceDropPercent ?? 0,
    hasRecentRestock: seed.hasRecentRestock ?? false,
    monitoringStatus: seed.monitoringStatus ?? 'Ok',
    lastCheckMessage: seed.lastCheckMessage ?? 'Cena odczytana poprawnie.',
    lastCheckError: seed.lastCheckError ?? null,
    lastCheckSource: seed.lastCheckSource ?? 'JsonLd',
    lastSuccessfulCheckAt: seed.lastSuccessfulCheckAt ?? minutesAgo(35),
    priceSelector: seed.priceSelector ?? null,
    stockSelector: seed.stockSelector ?? null
  };
}

function hydrateProductMetrics(product: Product): Product {
  const points = historyByProductId?.[product.id] ?? [];
  const prices = points
    .map((point) => point.price)
    .filter((price): price is number => typeof price === 'number');
  const current = product.currentPrice ?? prices.at(-1) ?? null;
  const lowest = prices.length > 0 ? Math.min(...prices) : current;
  const average = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : current;
  const distinctCount = new Set(prices.map((price) => price.toFixed(2))).size;
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;
  const latest = prices.length > 0 ? prices[prices.length - 1] : current;
  const latestDropAmount = previous !== null && latest !== null && previous > latest ? previous - latest : 0;
  const latestDropPercent = latestDropAmount > 0 && previous ? (latestDropAmount / previous) * 100 : 0;
  const discountPercent = product.basePrice && current && product.basePrice > current
    ? ((product.basePrice - current) / product.basePrice) * 100
    : 0;

  return {
    ...product,
    currentPrice: current,
    lowestHistoryPrice: lowest,
    averageHistoryPrice: average,
    currentVsAveragePercent: current !== null && average && average > 0 ? ((current - average) / average) * 100 : null,
    priceHistoryCount: points.length || 1,
    distinctHistoryPriceCount: distinctCount || 1,
    hasPriceHistoryChange: distinctCount > 1,
    isCurrentLowestHistoricalPrice: current !== null && lowest !== null && current <= lowest && distinctCount > 1,
    latestPriceDropAmount: Number(latestDropAmount.toFixed(2)),
    latestPriceDropPercent: Number(latestDropPercent.toFixed(2)),
    discountPercent: Number(discountPercent.toFixed(2)),
    distanceToTarget: current !== null && product.targetPrice !== null && product.targetPrice !== undefined
      ? Math.max(0, current - product.targetPrice)
      : null
  };
}

function history(productId: string, prices: number[]): PriceHistoryPoint[] {
  return prices.map((price, index) => ({
    price,
    currency: 'PLN',
    isAvailable: true,
    checkedAt: daysAgo(prices.length - index),
    source: index === 0 ? 'Initial' : 'JsonLd'
  }));
}

function hydratedProducts() {
  demoProducts = demoProducts.map(hydrateProductMetrics);
  return demoProducts;
}

function appendHistory(product: Product, source: string) {
  historyByProductId[product.id] = [
    ...(historyByProductId[product.id] ?? []),
    {
      price: product.currentPrice ?? null,
      currency: product.currency,
      isAvailable: product.isAvailable,
      checkedAt: new Date().toISOString(),
      source
    }
  ].slice(-60);
}

function buildProductDetail(id: string): ProductDetail {
  const product = hydrateProductMetrics(findProduct(id));
  return {
    product,
    alertRules: [
      { id: `${id}-target`, type: 'TargetPrice', targetPrice: product.targetPrice, isActive: true, lastTriggeredAt: null },
      { id: `${id}-stock`, type: 'BackInStock', isActive: product.trackStock, lastTriggeredAt: null }
    ],
    history: historyByProductId[id] ?? [],
    notifications: notificationsByProductId[id] ?? [],
    checkLogs: checkLogsByProductId[id] ?? []
  };
}

function buildStats(): DashboardStats {
  const products = hydratedProducts();
  return {
    watchedProducts: products.length,
    availableProducts: products.filter((product) => product.isAvailable).length,
    belowThresholdProducts: products.filter((product) => product.currentPrice !== null
      && product.currentPrice !== undefined
      && product.targetPrice !== null
      && product.targetPrice !== undefined
      && product.currentPrice <= product.targetPrice).length,
    alertsLast24Hours: Object.values(notificationsByProductId).flat().filter((notification) => new Date(notification.sentAt).getTime() > Date.now() - 24 * 60 * 60_000).length
  };
}

function categoriesWithCounts() {
  return demoCategories
    .map((category) => ({ ...category, productCount: productCount(category.name) }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pl'));
}

function productCount(categoryName: string) {
  return demoProducts.filter((product) => product.categoryName === categoryName).length;
}

function findProduct(id: string) {
  const product = demoProducts.find((item) => item.id === id);
  if (!product) {
    throw new Error('Product not found.');
  }
  return product;
}

function checkLog(product: Product, level: string, status: string, message: string): ProductCheckLog {
  return {
    id: `log-${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level,
    status,
    message,
    details: product.lastCheckError ?? null,
    price: product.currentPrice ?? null,
    isAvailable: product.isAvailable,
    source: product.lastCheckSource ?? 'JsonLd',
    checkedAt: product.lastCheckedAt ?? new Date().toISOString()
  };
}

function hostName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'demo-shop.pl';
  }
}

function userFromSettings(email: string, settings: AccountSettings): User {
  return {
    id: demoUser.id,
    email,
    alertEmail: settings.alertEmail,
    emailNotificationsEnabled: settings.emailNotificationsEnabled,
    emailSmtpHost: settings.emailSmtpHost,
    emailSmtpPort: settings.emailSmtpPort,
    emailSmtpUserName: settings.emailSmtpUserName,
    emailSmtpPasswordConfigured: settings.emailSmtpPasswordConfigured,
    emailFromEmail: settings.emailFromEmail,
    emailFromName: settings.emailFromName,
    emailEnableSsl: settings.emailEnableSsl,
    minimumDiscountPercent: settings.minimumDiscountPercent,
    notifyOnlySelectedVariant: settings.notifyOnlySelectedVariant,
    notifyBackInStock: settings.notifyBackInStock,
    notifyTargetPrice: settings.notifyTargetPrice,
    maxEmailsPerProductPerDay: settings.maxEmailsPerProductPerDay,
    defaultCheckIntervalMinutes: settings.defaultCheckIntervalMinutes
  };
}

function clone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function delayed<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), DEMO_DELAY_MS);
  });
}
