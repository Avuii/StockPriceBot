import type { AccountSettings, DashboardStats } from '../types';
import type { Filters, ProductFormState } from './types';

export const emptyStats: DashboardStats = {
  watchedProducts: 0,
  availableProducts: 0,
  belowThresholdProducts: 0,
  alertsLast24Hours: 0
};

export const emptySettings: AccountSettings = {
  alertEmail: '',
  emailNotificationsEnabled: true,
  emailSmtpHost: '',
  emailSmtpPort: 587,
  emailSmtpUserName: '',
  emailSmtpPassword: '',
  emailSmtpPasswordConfigured: false,
  emailFromEmail: '',
  emailFromName: 'PriceStockBot',
  emailEnableSsl: true,
  minimumDiscountPercent: 20,
  notifyOnlySelectedVariant: true,
  notifyBackInStock: true,
  notifyTargetPrice: true,
  maxEmailsPerProductPerDay: 1,
  defaultCheckIntervalMinutes: 60
};

export const initialFilters: Filters = {
  store: 'all',
  category: 'all',
  size: 'all',
  color: 'all',
  availability: 'all',
  monitoring: 'all',
  belowTarget: 'all',
  stockAlert: 'all',
  recent: 'all',
  sort: 'newest'
};

export const initialProductForm: ProductFormState = {
  name: '',
  url: '',
  shopName: '',
  categoryName: '',
  size: '',
  color: '',
  note: '',
  imageUrl: '',
  basePrice: '',
  currentPrice: '',
  targetPrice: '',
  currency: 'PLN',
  isAvailable: true,
  trackStock: true,
  isActive: true,
  percentDrop: '',
  checkIntervalMinutes: '',
  priceSelector: '',
  stockSelector: ''
};

export const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', '36', '37', '38', '39', '40', 'One Size'];

export const UNCATEGORIZED_CATEGORY_ID = '__uncategorized__';

export const UNCATEGORIZED_COLOR = '#64748b';
