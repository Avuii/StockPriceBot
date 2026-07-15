export type DashboardStats = {
  watchedProducts: number;
  availableProducts: number;
  belowThresholdProducts: number;
  alertsLast24Hours: number;
};

export type Product = {
  id: string;
  name: string;
  url: string;
  shopName: string;
  imageUrl?: string | null;
  basePrice?: number | null;
  currentPrice?: number | null;
  targetPrice?: number | null;
  currency: string;
  size?: string | null;
  color?: string | null;
  note?: string | null;
  isAvailable: boolean;
  lastCheckedAt?: string | null;
  checkIntervalMinutes: number;
  trackStock: boolean;
  isActive: boolean;
  isBookmarked: boolean;
  categoryName?: string | null;
  createdAt: string;
  updatedAt: string;
  discountPercent?: number | null;
  distanceToTarget?: number | null;
  lowestHistoryPrice?: number | null;
  averageHistoryPrice?: number | null;
  currentVsAveragePercent?: number | null;
  priceHistoryCount?: number | null;
  distinctHistoryPriceCount?: number | null;
  hasPriceHistoryChange?: boolean | null;
  isCurrentLowestHistoricalPrice?: boolean | null;
  latestPriceDropAmount?: number | null;
  latestPriceDropPercent?: number | null;
  hasRecentRestock?: boolean | null;
  monitoringStatus?: string | null;
  lastCheckMessage?: string | null;
  lastCheckError?: string | null;
  lastCheckSource?: string | null;
  lastSuccessfulCheckAt?: string | null;
  priceSelector?: string | null;
  stockSelector?: string | null;
};

export type AlertRule = {
  id: string;
  type: string;
  targetPrice?: number | null;
  percentDrop?: number | null;
  isActive: boolean;
  lastTriggeredAt?: string | null;
};

export type PriceHistoryPoint = {
  price?: number | null;
  currency: string;
  isAvailable: boolean;
  checkedAt: string;
  source: string;
};

export type ProductDetail = {
  product: Product;
  alertRules: AlertRule[];
  history: PriceHistoryPoint[];
  notifications: NotificationLog[];
  checkLogs: ProductCheckLog[];
};

export type NotificationLog = {
  id: string;
  type: string;
  channel: string;
  message: string;
  sentAt: string;
};

export type ProductCheckLog = {
  id: string;
  level: string;
  status: string;
  message: string;
  details?: string | null;
  price?: number | null;
  isAvailable?: boolean | null;
  source: string;
  checkedAt: string;
};

export type Category = {
  id: string;
  name: string;
  iconName?: string | null;
  colorHex?: string | null;
  productCount: number;
};

export type CreateProductRequest = {
  name?: string;
  url: string;
  shopName?: string;
  imageUrl?: string;
  basePrice?: number;
  currentPrice?: number;
  targetPrice?: number;
  currency?: string;
  size?: string;
  color?: string;
  note?: string;
  isAvailable?: boolean;
  trackStock?: boolean;
  isActive?: boolean;
  isBookmarked?: boolean;
  alertOnPriceDrop?: boolean;
  alertOnBackInStock?: boolean;
  percentDrop?: number;
  alertOnAnyPriceChange?: boolean;
  checkIntervalMinutes?: number;
  categoryName?: string;
  priceSelector?: string;
  stockSelector?: string;
};

export type UpdateProductRequest = {
  name?: string;
  url?: string;
  shopName?: string;
  imageUrl?: string;
  basePrice?: number;
  currentPrice?: number;
  targetPrice?: number;
  currency?: string;
  size?: string;
  color?: string;
  note?: string;
  isAvailable: boolean;
  trackStock: boolean;
  isActive: boolean;
  isBookmarked?: boolean;
  percentDrop?: number;
  checkIntervalMinutes: number;
  categoryName?: string;
  priceSelector?: string;
  stockSelector?: string;
};

export type User = {
  id: string;
  email: string;
  alertEmail?: string | null;
  emailNotificationsEnabled: boolean;
  emailSmtpHost?: string | null;
  emailSmtpPort: number;
  emailSmtpUserName?: string | null;
  emailSmtpPasswordConfigured: boolean;
  emailFromEmail?: string | null;
  emailFromName?: string | null;
  emailEnableSsl: boolean;
  minimumDiscountPercent: number;
  notifyOnlySelectedVariant: boolean;
  notifyBackInStock: boolean;
  notifyTargetPrice: boolean;
  maxEmailsPerProductPerDay: number;
  defaultCheckIntervalMinutes: number;
};

export type AccountSettings = {
  alertEmail?: string | null;
  emailNotificationsEnabled: boolean;
  emailSmtpHost?: string | null;
  emailSmtpPort: number;
  emailSmtpUserName?: string | null;
  emailSmtpPassword?: string | null;
  emailSmtpPasswordConfigured: boolean;
  emailFromEmail?: string | null;
  emailFromName?: string | null;
  emailEnableSsl: boolean;
  minimumDiscountPercent: number;
  notifyOnlySelectedVariant: boolean;
  notifyBackInStock: boolean;
  notifyTargetPrice: boolean;
  maxEmailsPerProductPerDay: number;
  defaultCheckIntervalMinutes: number;
};

export type EmailTestResult = {
  success: boolean;
  message: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
