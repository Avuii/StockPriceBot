export type View = 'dashboard' | 'products' | 'watchlist' | 'categories' | 'statistics' | 'notifications' | 'settings';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export type ProductViewMode = 'list' | 'grid';

export type Filters = {
  store: string;
  category: string;
  size: string;
  color: string;
  availability: string;
  monitoring: string;
  belowTarget: string;
  stockAlert: string;
  recent: string;
  sort: string;
};

export type ProductFormState = {
  name: string;
  url: string;
  shopName: string;
  categoryName: string;
  size: string;
  color: string;
  note: string;
  imageUrl: string;
  basePrice: string;
  currentPrice: string;
  targetPrice: string;
  currency: string;
  isAvailable: boolean;
  trackStock: boolean;
  isActive: boolean;
  percentDrop: string;
  checkIntervalMinutes: string;
  priceSelector: string;
  stockSelector: string;
};
