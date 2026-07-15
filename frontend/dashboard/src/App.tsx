import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import {
  BarChart3,
  Bell,
  Bookmark,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  FolderPlus,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Moon,
  Package,
  PackageSearch,
  Percent,
  Pencil,
  Plus,
  Save,
  Store,
  Sun,
  Tags,
  TrendingDown,
  Trash2,
  UserPlus,
  Upload,
  Wallet,
  X
} from 'lucide-react';
import { api as realApi, AuthError, getToken, setToken, type ApiClient } from './api';
import {
  emptySettings,
  emptyStats,
  initialFilters,
  initialProductForm,
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_COLOR
} from './app/constants';
import {
  countBy,
  formToCreateRequest,
  formToUpdateRequest,
  isBelowTarget,
  matchesFilters,
  productAccentColor,
  productToForm,
  productToUpdateRequest,
  readStoredAlertIds,
  readStoredWatchlistIds,
  settingsFromUser,
  sortProducts,
  unique
} from './app/productHelpers';
import type { AuthMode, Filters, ProductFormState, ProductViewMode, View } from './app/types';
import { SavingsOverTimeCard } from './components/charts/SavingsOverTimeCard';
import { CategoryManager } from './components/categories/CategoryManager';
import {
  categoryColor,
  CategoryIcon
} from './components/categories/categoryVisuals';
import { CollapsibleSection } from './components/common/CollapsibleSection';
import { EmptyState } from './components/common/EmptyState';
import { CustomSelect } from './components/common/CustomSelect';
import { LanguageSelect } from './components/common/LanguageSelect';
import { ViewSwitch } from './components/common/ViewSwitch';
import { Badge, BrandLogo, Field, Info, Shell, Stat, Toggle } from './components/common/ui';
import { DesktopSidebar, MobileNavigation, TopBar } from './components/layout/AppNavigation';
import { PageHeader } from './components/layout/PageHeader';
import { FiltersBar } from './components/products/FiltersBar';
import { ProductDetailsModal } from './components/products/ProductDetailsModal';
import { ProductImageCard, ProductRow } from './components/products/ProductCards';
import { ProductForm } from './components/products/ProductForm';
import { ProductThumb } from './components/products/ProductThumb';
import { SettingsView } from './components/settings/SettingsView';
import { type Language, productCountLabel, t } from './i18n';
import { csvCell, formatDate, formatMoney } from './lib/formatters';
import { buildSavingsTimeline, discountAmount, discountPercent, latestPriceDropAmount, latestPriceDropPercent } from './lib/productMetrics';
import { getPriceInsight } from './lib/productInsights';
import type {
  AccountSettings,
  Category,
  DashboardStats,
  PriceHistoryPoint,
  Product,
  ProductDetail,
  User
} from './types';

type Props = {
  connection: HubConnection;
  apiClient?: ApiClient;
  autoSignIn?: boolean;
};

const AUTO_REFRESH_INTERVAL_MS = 30_000;

export default function App({ connection, apiClient = realApi, autoSignIn = false }: Props) {
  const api = apiClient;
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<ProductDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<ProductFormState>(initialProductForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductFormState>(initialProductForm);
  const [settings, setSettings] = useState<AccountSettings>(emptySettings);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [productViewMode, setProductViewMode] = useState<ProductViewMode>('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showProductsAside, setShowProductsAside] = useState(true);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const storedWatchlistIdsRef = useRef<string[]>(readStoredWatchlistIds());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pricestockbot.theme') === 'dark');
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('pricestockbot.language') === 'en' ? 'en' : 'pl');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((product) => product.id === selectedId);

  const optionSets = useMemo(() => ({
    stores: unique(products.map((product) => product.shopName)),
    categories: [
      ...unique(products.map((product) => product.categoryName ?? '').filter(Boolean)),
      ...(products.some((product) => !product.categoryName) ? [UNCATEGORIZED_CATEGORY_ID] : [])
    ],
    sizes: unique(products.map((product) => product.size ?? '').filter(Boolean)),
    colors: unique(products.map((product) => product.color ?? '').filter(Boolean))
  }), [products]);

  const bookmarkedProducts = useMemo(
    () => products.filter((product) => product.isBookmarked),
    [products]
  );

  const selectedProductsForBulk = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds]
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products
      .filter((product) => matchesFilters(product, filters, normalizedQuery))
      .sort((left, right) => sortProducts(left, right, filters.sort));
  }, [filters, products, query]);

  const chartData = useMemo(() => history
    .filter((point) => point.price !== null && point.price !== undefined)
    .map((point) => ({
      date: new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(point.checkedAt)),
      price: point.price ?? 0
    })), [history]);

  async function loadData(options: { silent?: boolean } = {}) {
    const silent = options.silent ?? false;
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const [nextStats, nextProducts, nextCategories, nextSettings] = await Promise.all([
        api.getStats(),
        api.getProducts(),
        api.getCategories(),
        api.getSettings()
      ]);
      setStats(nextStats);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setSettings(nextSettings);
      setSelectedId((current) => current && nextProducts.some((product) => product.id === current) ? current : null);
    } catch (loadError) {
      if (loadError instanceof AuthError) {
        setUser(null);
      } else if (!silent) {
        setError(loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac danych.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }

  async function loadProductDetail(productId: string, options: { silent?: boolean } = {}) {
    try {
      const detail = await api.getProduct(productId);
      setSelectedDetail(detail);
      setHistory(detail.history);
    } catch {
      if (!options.silent) {
        setSelectedDetail(null);
        setHistory([]);
      }
    }
  }

  useEffect(() => {
    localStorage.setItem('pricestockbot.theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('pricestockbot.language', language);
  }, [language]);

  useEffect(() => {
    setSelectedProductIds((current) => current.filter((id) => products.some((product) => product.id === id)));
  }, [products]);

  useEffect(() => {
    if (!user || products.length === 0 || storedWatchlistIdsRef.current.length === 0) {
      return;
    }

    const storedIds = storedWatchlistIdsRef.current;
    const productsToPersist = products.filter((product) => storedIds.includes(product.id) && !product.isBookmarked);
    storedWatchlistIdsRef.current = [];
    localStorage.removeItem('pricestockbot.watchlistIds');

    if (productsToPersist.length === 0) {
      return;
    }

    let cancelled = false;
    async function persistStoredWatchlist() {
      try {
        await Promise.all(productsToPersist.map((product) => api.updateProduct(product.id, productToUpdateRequest(product, { isBookmarked: true }))));
        if (!cancelled) {
          await loadData({ silent: true });
        }
      } catch (migrationError) {
        if (!cancelled) {
          setError(migrationError instanceof Error ? migrationError.message : 'Nie udalo sie zapisac zakladek.');
        }
      }
    }

    persistStoredWatchlist();
    return () => {
      cancelled = true;
    };
  }, [products, user]);

  useEffect(() => {
    async function boot() {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlEmail = params.get('email');
      if (window.location.pathname === '/reset-password' && urlToken) {
        setAuthMode('reset');
        setResetToken(urlToken);
        setAuthEmail(urlEmail ?? '');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!autoSignIn && !getToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await api.me();
        setUser(me);
        await loadData();
      } catch {
        setToken(null);
        setUser(null);
        setIsLoading(false);
      }
    }

    boot();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    connection.on('productCreated', loadData);
    connection.on('productUpdated', loadData);
    connection.on('productChecked', loadData);
    connection.on('productDeleted', loadData);

    return () => {
      connection.off('productCreated', loadData);
      connection.off('productUpdated', loadData);
      connection.off('productChecked', loadData);
      connection.off('productDeleted', loadData);
    };
  }, [connection, user]);

  useEffect(() => {
    if (!selectedProduct || !user) {
      setHistory([]);
      setSelectedDetail(null);
      return;
    }

    setHistory([]);
    setSelectedDetail(null);
    void loadProductDetail(selectedProduct.id);
  }, [selectedProduct?.id, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let refreshing = false;
    let cancelled = false;

    async function refreshInBackground() {
      if (refreshing) {
        return;
      }

      refreshing = true;
      try {
        await loadData({ silent: true });
        if (!cancelled && selectedId && productDetailsOpen) {
          await loadProductDetail(selectedId, { silent: true });
        }
      } finally {
        refreshing = false;
      }
    }

    const intervalId = window.setInterval(refreshInBackground, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user, selectedId, productDetailsOpen]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAuthMessage(null);

    try {
      if (authMode === 'forgot') {
        const response = await api.forgotPassword(authEmail);
        setAuthMessage(response.message);
        return;
      }

      if (authMode === 'reset') {
        const response = await api.resetPassword(authEmail, resetToken, authPassword);
        setAuthMode('login');
        setResetToken('');
        setAuthPassword('');
        setAuthMessage(response.message);
        window.history.replaceState(null, '', '/');
        return;
      }

      const response = authMode === 'login'
        ? await api.login(authEmail, authPassword)
        : await api.register(authEmail, authPassword);

      setToken(response.token);
      setUser(response.user);
      setSettings(settingsFromUser(response.user));
      setAuthPassword('');
      await loadData();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : t(language, 'authFailed'));
    }
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setToken(null);
      setUser(null);
      setProducts([]);
      setCategories([]);
      setHistory([]);
      setSelectedDetail(null);
      setSelectedId(null);
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const created = await api.createProduct(formToCreateRequest(form, settings));
      setForm(initialProductForm);
      setSelectedId(created.id);
      setAddProductModalOpen(false);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nie udalo sie dodac produktu.');
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) {
      return;
    }

    try {
      const updated = await api.updateProduct(editingProduct.id, formToUpdateRequest(editForm));
      setEditingProduct(null);
      setSelectedId(updated.id);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nie udalo sie zapisac zmian.');
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      await loadData();
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : 'Nie udalo sie zapisac ustawien.');
    }
  }

  async function sendTestEmail() {
    setError(null);
    const updated = await api.updateSettings(settings);
    setSettings(updated);
    return api.sendTestEmail();
  }

  async function createCategory(name: string, iconName?: string, colorHex?: string) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return undefined;
    }

    try {
      const created = await api.createCategory(normalizedName, iconName, colorHex);
      await loadData();
      return created;
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : 'Nie udalo sie dodac kategorii.');
      return undefined;
    }
  }

  async function updateCategory(category: Category, name: string, iconName?: string | null, colorHex?: string | null) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return;
    }

    try {
      const updated = await api.updateCategory(category.id, { name: normalizedName, iconName, colorHex });
      if (filters.category === category.name && updated.name !== category.name) {
        setFilters({ ...filters, category: updated.name });
      }
      await loadData();
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : 'Nie udalo sie zapisac kategorii.');
    }
  }

  async function removeCategory(category: Category) {
    const force = category.productCount > 0
      ? window.confirm(language === 'en'
        ? `Category "${category.name}" has assigned products (${category.productCount}). Delete it and detach products from the category?`
        : `Kategoria "${category.name}" ma przypisane produkty (${category.productCount}). Usunac ja i odpiac produkty od kategorii?`)
      : false;

    if (category.productCount > 0 && !force) {
      return;
    }

    try {
      await api.deleteCategory(category.id, force);
      if (filters.category === category.name) {
        setFilters({ ...filters, category: 'all' });
      }
      await loadData();
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : 'Nie udalo sie usunac kategorii.');
    }
  }

  function clearFilters() {
    setFilters(initialFilters);
    setQuery('');
  }

  function openAddProductModal() {
    setAddProductModalOpen(true);
  }

  function openProductsAdd() {
    setActiveView('products');
    setAddProductModalOpen(true);
  }

  function exportProducts() {
    exportProductsList(visibleProducts, 'pricestockbot-products.csv');
  }

  function exportProductsList(targetProducts: Product[], filename: string) {
    const headers = [
      t(language, 'productName'),
      t(language, 'store'),
      t(language, 'category'),
      t(language, 'price'),
      t(language, 'target'),
      t(language, 'size'),
      t(language, 'color'),
      t(language, 'availability'),
      t(language, 'monitoring'),
      'URL'
    ];
    const rows = targetProducts.map((product) => [
      product.name,
      product.shopName,
      product.categoryName ?? '',
      product.currentPrice?.toString() ?? '',
      product.targetPrice?.toString() ?? '',
      product.size ?? '',
      product.color ?? '',
      product.isAvailable ? t(language, 'available') : t(language, 'unavailable'),
      product.isActive ? t(language, 'active') : t(language, 'inactive'),
      product.url
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importWishlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const urls = importText
      .split(/\r?\n/)
      .map((line) => line.match(/https?:\/\/[^\s;"',]+/i)?.[0] ?? line.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      return;
    }

    try {
      for (const rawUrl of urls) {
        const url = new URL(rawUrl);
        const shopName = url.hostname.replace(/^www\./, '');
        await api.createProduct({
          url: url.toString(),
          name: shopName,
          shopName,
          currency: 'PLN',
          isAvailable: true,
          trackStock: true,
          isActive: true,
          alertOnPriceDrop: settings.notifyTargetPrice,
          alertOnBackInStock: settings.notifyBackInStock,
          percentDrop: settings.minimumDiscountPercent,
          checkIntervalMinutes: settings.defaultCheckIntervalMinutes
        });
      }

      setImportText('');
      setImportModalOpen(false);
      await loadData();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Nie udalo sie zaimportowac URL-i.');
    }
  }

  function toggleBulkSelection(product: Product) {
    setSelectedProductIds((current) => current.includes(product.id)
      ? current.filter((id) => id !== product.id)
      : [...current, product.id]);
  }

  async function bulkDeleteProducts() {
    if (selectedProductsForBulk.length === 0) {
      return;
    }

    const ok = window.confirm(language === 'en'
      ? `Delete ${selectedProductsForBulk.length} selected products?`
      : `Usunac ${selectedProductsForBulk.length} zaznaczonych produktow?`);
    if (!ok) {
      return;
    }

    await Promise.all(selectedProductsForBulk.map((product) => api.deleteProduct(product.id)));
    setSelectedProductIds([]);
    await loadData();
  }

  async function bulkSetMonitoring(isActive: boolean) {
    await Promise.all(selectedProductsForBulk.map((product) => api.updateProduct(product.id, productToUpdateRequest(product, { isActive }))));
    await loadData();
  }

  async function bulkChangeCategory(categoryName: string) {
    await Promise.all(selectedProductsForBulk.map((product) => api.updateProduct(product.id, productToUpdateRequest(product, { categoryName }))));
    await loadData();
  }

  async function checkProduct(product: Product) {
    await api.checkProduct(product.id);
    await loadData();
    if (selectedId === product.id || productDetailsOpen) {
      const detail = await api.getProduct(product.id);
      setSelectedDetail(detail);
      setHistory(detail.history);
    }
  }

  async function deleteProduct(product: Product) {
    await api.deleteProduct(product.id);
    if (selectedId === product.id) {
      setSelectedId(null);
      setSelectedDetail(null);
    }
    await loadData();
  }

  async function toggleMonitoring(product: Product) {
    await api.updateProduct(product.id, productToUpdateRequest(product, { isActive: !product.isActive }));
    await loadData();
  }

  async function toggleWatchlist(product: Product) {
    const nextValue = !product.isBookmarked;
    setError(null);
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isBookmarked: nextValue } : item));
    setSelectedDetail((current) => current?.product.id === product.id
      ? { ...current, product: { ...current.product, isBookmarked: nextValue } }
      : current);

    try {
      const updated = await api.updateProduct(product.id, productToUpdateRequest(product, { isBookmarked: nextValue }));
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedDetail((current) => current?.product.id === updated.id ? { ...current, product: updated } : current);
    } catch (bookmarkError) {
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isBookmarked: product.isBookmarked } : item));
      setSelectedDetail((current) => current?.product.id === product.id
        ? { ...current, product: { ...current.product, isBookmarked: product.isBookmarked } }
        : current);
      setError(bookmarkError instanceof Error ? bookmarkError.message : 'Nie udalo sie zapisac zakladki.');
    }
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditForm(productToForm(product, settings));
  }

  function openProductDetails(product: Product) {
    setSelectedId(product.id);
    setProductDetailsOpen(true);
  }

  if (!user) {
    return (
      <Shell darkMode={darkMode}>
        <AuthScreen
          mode={authMode}
          email={authEmail}
          password={authPassword}
          message={authMessage}
          error={error}
          isLoading={isLoading}
          onModeChange={(mode) => {
            if (mode === 'login' && authMode === 'reset') {
              window.history.replaceState(null, '', '/');
            }
            setAuthMode(mode);
            setError(null);
            setAuthMessage(null);
            setAuthPassword('');
          }}
          onEmailChange={(value) => {
            setAuthEmail(value);
            setAuthMessage(null);
          }}
          onPasswordChange={(value) => {
            setAuthPassword(value);
            setAuthMessage(null);
          }}
          onSubmit={submitAuth}
          onToggleTheme={() => setDarkMode((value) => !value)}
          darkMode={darkMode}
          language={language}
          onLanguageChange={setLanguage}
        />
      </Shell>
    );
  }

  return (
    <Shell darkMode={darkMode}>
      <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
        <div className="flex min-h-screen">
          <DesktopSidebar
            activeView={activeView}
            userEmail={user.email}
            language={language}
            onViewChange={setActiveView}
            onAddProduct={openAddProductModal}
            onLogout={logout}
            alertCount={stats.alertsLast24Hours}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              activeView={activeView}
              userEmail={user.email}
              language={language}
              onLanguageChange={setLanguage}
              onToggleTheme={() => setDarkMode((value) => !value)}
              onLogout={logout}
              darkMode={darkMode}
            />

            <div className="flex-1 pb-24 lg:pb-0">
              {activeView === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  products={products}
                  categories={categories}
                  onAddProduct={openProductsAdd}
                  onOpenProducts={() => setActiveView('products')}
                  onOpenCategories={() => setActiveView('categories')}
                  onOpenNotifications={() => setActiveView('notifications')}
                  onSelectProduct={openProductDetails}
                  language={language}
                />
              )}

              {activeView === 'products' && (
                <div className={`mx-auto grid gap-6 px-4 py-6 sm:px-6 lg:px-8 ${showProductsAside ? 'max-w-[1500px] xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]' : 'max-w-[1180px]'}`}>
                  <section className="min-w-0 space-y-5">
                    <PageHeader
                      icon={<PackageSearch className="h-5 w-5" />}
                      title={t(language, 'productsTitle')}
                      description={t(language, 'productsDescription')}
                      action={(
                        <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-nowrap">
                          <button className="text-button shrink-0 whitespace-nowrap" type="button" onClick={() => setShowProductsAside((value) => !value)}>
                            {showProductsAside ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {showProductsAside ? t(language, 'hidePanel') : t(language, 'showPanel')}
                          </button>
                          <button className="primary-button shrink-0 whitespace-nowrap" type="button" onClick={openAddProductModal}>
                            <Plus className="h-4 w-4" />
                            {t(language, 'addProduct')}
                          </button>
                        </div>
                      )}
                    />

                    <FiltersBar
                      filters={filters}
                      setFilters={setFilters}
                      query={query}
                      setQuery={setQuery}
                      optionSets={optionSets}
                      viewMode={productViewMode}
                      setViewMode={setProductViewMode}
                      showAdvanced={showAdvancedFilters}
                      setShowAdvanced={setShowAdvancedFilters}
                      onClear={clearFilters}
                      onManageCategories={() => setActiveView('categories')}
                      onExportProducts={exportProducts}
                      onImportProducts={() => setImportModalOpen(true)}
                      onOpenSettings={() => setActiveView('notifications')}
                      language={language}
                    />

                    {selectedProductsForBulk.length > 0 && (
                      <BulkActionsBar
                        selectedCount={selectedProductsForBulk.length}
                        categories={categories}
                        onDelete={bulkDeleteProducts}
                        onEnable={() => bulkSetMonitoring(true)}
                        onDisable={() => bulkSetMonitoring(false)}
                        onChangeCategory={bulkChangeCategory}
                        onExport={() => exportProductsList(selectedProductsForBulk, 'pricestockbot-selected-products.csv')}
                        onClear={() => setSelectedProductIds([])}
                        language={language}
                      />
                    )}

                    {error && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-100">
                        {error}
                      </div>
                    )}

                    {!isLoading && products.length === 0 ? (
                      <EmptyState
                        title={t(language, 'noProducts')}
                        actionLabel={t(language, 'firstProduct')}
                        onAction={openAddProductModal}
                      />
                    ) : !isLoading && visibleProducts.length === 0 ? (
                      <EmptyState
                        title={t(language, 'noFilterResults')}
                        actionLabel={t(language, 'clearFilters')}
                        onAction={clearFilters}
                        variant="clear"
                      />
                    ) : productViewMode === 'list' ? (
                      <div className="grid gap-3">
                        {visibleProducts.map((product) => (
                          <ProductRow
                            key={product.id}
                            product={product}
                            isSelected={selectedProduct?.id === product.id}
                            onSelect={() => openProductDetails(product)}
                            onCheck={() => checkProduct(product)}
                            onDelete={() => deleteProduct(product)}
                            onEdit={() => openEdit(product)}
                            onToggleMonitoring={() => toggleMonitoring(product)}
                            isBookmarked={product.isBookmarked}
                            onToggleBookmark={() => toggleWatchlist(product)}
                            accentColor={productAccentColor(product, categories)}
                            bulkSelected={selectedProductIds.includes(product.id)}
                            onBulkToggle={() => toggleBulkSelection(product)}
                            language={language}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {visibleProducts.map((product) => (
                          <ProductImageCard
                            key={product.id}
                            product={product}
                            isSelected={selectedProduct?.id === product.id}
                            onSelect={() => openProductDetails(product)}
                            onCheck={() => checkProduct(product)}
                            onDelete={() => deleteProduct(product)}
                            onEdit={() => openEdit(product)}
                            onToggleMonitoring={() => toggleMonitoring(product)}
                            isBookmarked={product.isBookmarked}
                            onToggleBookmark={() => toggleWatchlist(product)}
                            accentColor={productAccentColor(product, categories)}
                            bulkSelected={selectedProductIds.includes(product.id)}
                            onBulkToggle={() => toggleBulkSelection(product)}
                            language={language}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {showProductsAside && (
                    <aside className="min-w-0 space-y-5 xl:sticky xl:top-20 xl:self-start">
                      <CollapsibleSection title={t(language, 'categories')} icon={<Tags className="h-4 w-4" />}>
                        <CategoryManager
                          categories={categories}
                          activeCategory={filters.category}
                          onFilterCategory={(categoryName) => setFilters({ ...filters, category: categoryName })}
                          onCreateCategory={createCategory}
                          onUpdateCategory={updateCategory}
                          onDeleteCategory={removeCategory}
                          language={language}
                        />
                      </CollapsibleSection>

                      <CollapsibleSection title={t(language, 'addProduct')} icon={<Plus className="h-4 w-4" />} className="scroll-mt-5" defaultOpen={false}>
                        <ProductForm
                          form={form}
                          setForm={setForm}
                          categories={categories}
                          onCreateCategory={createCategory}
                          onSubmit={submitProduct}
                          submitLabel={t(language, 'observeProduct')}
                          language={language}
                        />
                      </CollapsibleSection>
                    </aside>
                  )}
                </div>
              )}

              {activeView === 'watchlist' && (
                <WatchlistView
                  products={bookmarkedProducts}
                  categories={categories}
                  viewMode={productViewMode}
                  setViewMode={setProductViewMode}
                  onOpenProducts={() => setActiveView('products')}
                  onSelect={openProductDetails}
                  onCheck={checkProduct}
                  onDelete={deleteProduct}
                  onEdit={openEdit}
                  onToggleMonitoring={toggleMonitoring}
                  onToggleBookmark={toggleWatchlist}
                  language={language}
                />
              )}

              {activeView === 'categories' && (
                <CategoriesPage
                  categories={categories}
                  products={products}
                  activeCategory={filters.category}
                  onFilterCategory={(categoryName) => {
                    setFilters({ ...filters, category: categoryName });
                    setActiveView('products');
                  }}
                  onCreateCategory={createCategory}
                  onUpdateCategory={updateCategory}
                  onDeleteCategory={removeCategory}
                  language={language}
                />
              )}

              {activeView === 'statistics' && (
                <StatisticsPage stats={stats} products={products} categories={categories} onSelectProduct={openProductDetails} language={language} />
              )}

              {activeView === 'notifications' && (
                <NotificationsPage
                  settings={settings}
                  setSettings={setSettings}
                  onSubmit={saveSettings}
                  products={products}
                  onEditProduct={openEdit}
                  onOpenProduct={openProductDetails}
                  language={language}
                />
              )}

              {activeView === 'settings' && (
                <SettingsView settings={settings} setSettings={setSettings} onSubmit={saveSettings} onTestEmail={sendTestEmail} apiToken={getToken() ?? ''} language={language} />
              )}
            </div>

            <MobileNavigation activeView={activeView} onViewChange={setActiveView} alertCount={stats.alertsLast24Hours} language={language} />
          </div>
        </div>

        {addProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/70 p-4 backdrop-blur-sm">
            <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-panel dark:border-[#28344C] dark:bg-[#151D30]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal">{t(language, 'addProduct')}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(language, 'addProductDescription')}</p>
                </div>
                <button className="icon-button" onClick={() => setAddProductModalOpen(false)} title={t(language, 'close')}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProductForm
                form={form}
                setForm={setForm}
                categories={categories}
                onCreateCategory={createCategory}
                onSubmit={submitProduct}
                submitLabel={t(language, 'observeProduct')}
                language={language}
              />
            </section>
          </div>
        )}

        {productDetailsOpen && selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            detail={selectedDetail}
            chartData={chartData}
            darkMode={darkMode}
            onClose={() => setProductDetailsOpen(false)}
            onEdit={() => {
              setProductDetailsOpen(false);
              openEdit(selectedProduct);
            }}
            onCheck={() => checkProduct(selectedProduct)}
            onToggleMonitoring={() => toggleMonitoring(selectedProduct)}
            language={language}
          />
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/70 p-4 backdrop-blur-sm">
            <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-panel dark:border-[#28344C] dark:bg-[#151D30]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal">{t(language, 'editProduct')}</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{editingProduct.name}</p>
                </div>
                <button className="icon-button" onClick={() => setEditingProduct(null)} title={t(language, 'close')}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProductForm
                form={editForm}
                setForm={setEditForm}
                categories={categories}
                onCreateCategory={createCategory}
                onSubmit={saveEdit}
                submitLabel={t(language, 'saveChanges')}
                isEdit
                language={language}
              />
            </section>
          </div>
        )}

        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/70 p-4 backdrop-blur-sm">
            <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-panel dark:border-[#28344C] dark:bg-[#151D30]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal">{t(language, 'categories')}</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t(language, 'categoryNamesAndIcons')}</p>
                </div>
                <button className="icon-button" onClick={() => setCategoryModalOpen(false)} title={t(language, 'close')}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CategoryManager
                categories={categories}
                activeCategory={filters.category}
                onFilterCategory={(categoryName) => setFilters({ ...filters, category: categoryName })}
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={removeCategory}
                expanded
                language={language}
              />
            </section>
          </div>
        )}

        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/70 p-4 backdrop-blur-sm">
            <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-panel dark:border-[#28344C] dark:bg-[#151D30]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal">{t(language, 'importWishlist')}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(language, 'importWishlistDescription')}</p>
                </div>
                <button className="icon-button" onClick={() => setImportModalOpen(false)} title={t(language, 'close')}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form className="space-y-3" onSubmit={importWishlist}>
                <Field label={t(language, 'pasteUrls')}>
                  <textarea className="field min-h-44 py-3 font-mono text-xs" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={'https://sklep.pl/produkt-1\nhttps://sklep.pl/produkt-2'} />
                </Field>
                <button className="primary-button w-full" type="submit">
                  <Upload className="h-4 w-4" />
                  {t(language, 'importProducts')}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </Shell>
  );
}

function DashboardView({
  stats,
  products,
  categories,
  onAddProduct,
  onOpenProducts,
  onOpenCategories,
  onOpenNotifications,
  onSelectProduct,
  language
}: {
  stats: DashboardStats;
  products: Product[];
  categories: Category[];
  onAddProduct: () => void;
  onOpenProducts: () => void;
  onOpenCategories: () => void;
  onOpenNotifications: () => void;
  onSelectProduct: (product: Product) => void;
  language: Language;
}) {
  const savings = products.reduce((sum, product) => {
    if (product.basePrice && product.currentPrice && product.basePrice > product.currentPrice) {
      return sum + product.basePrice - product.currentPrice;
    }
    return sum;
  }, 0);
  const bestDeals = [...products]
    .filter((product) => latestPriceDropAmount(product) > 0 && product.hasPriceHistoryChange)
    .sort((left, right) => latestPriceDropAmount(right) - latestPriceDropAmount(left))
    .slice(0, 5);
  const closeToTarget = [...products]
    .filter(isCloseToTargetOpportunity)
    .sort((left, right) => (targetGapPercent(left) ?? Number.MAX_SAFE_INTEGER) - (targetGapPercent(right) ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3);
  const lowestEver = products
    .filter((product) => product.isCurrentLowestHistoricalPrice && product.hasPriceHistoryChange)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 3);
  const backInStock = products
    .filter((product) => product.isAvailable && product.trackStock && product.hasRecentRestock)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 3);
  const discountedProducts = products.filter((product) => discountAmount(product) > 0);
  const alertProducts = products
    .filter((product) => isBelowTarget(product) || (!product.isAvailable && product.trackStock))
    .slice(0, 5);
  const savingsTimeline = buildSavingsTimeline(products);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel overflow-hidden p-5 lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30">
              <Percent className="h-3.5 w-3.5" />
              {t(language, 'promoHeroEyebrow')}
            </div>
            <h2 className="max-w-4xl text-3xl font-bold tracking-normal text-slate-950 dark:text-white lg:text-4xl">
              {t(language, 'dashboardHeroTitle')}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t(language, 'dashboardHeroBody')}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="primary-button" type="button" onClick={onAddProduct}>
              <Plus className="h-4 w-4" />
              {t(language, 'addProduct')}
            </button>
            <button className="text-button" type="button" onClick={onOpenProducts}>
              <PackageSearch className="h-4 w-4" />
              {t(language, 'watchlist')}
            </button>
            <button className="text-button" type="button" onClick={onOpenNotifications}>
              <Bell className="h-4 w-4" />
              {t(language, 'openAlerts')}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<Package className="h-5 w-5" />} label={t(language, 'tracked')} value={stats.watchedProducts} tone="teal" />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label={t(language, 'available')} value={stats.availableProducts} tone="green" />
        <Stat icon={<Wallet className="h-5 w-5" />} label={t(language, 'totalSavings')} value={formatMoney(savings, 'PLN')} tone="green" />
        <Stat icon={<TrendingDown className="h-5 w-5" />} label={t(language, 'onSale')} value={discountedProducts.length} tone="rose" />
        <Stat icon={<Bell className="h-5 w-5" />} label={t(language, 'alerts24h')} value={stats.alertsLast24Hours} tone="rose" />
      </div>

      <CollapsibleSection title={t(language, 'topOpportunities')} icon={<TrendingDown className="h-4 w-4" />} defaultOpen>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <OpportunityColumn title={t(language, 'biggestDrops')} products={bestDeals.slice(0, 3)} onOpen={onSelectProduct} language={language} />
          <OpportunityColumn title={t(language, 'closeToTargetProducts')} products={closeToTarget} onOpen={onSelectProduct} language={language} />
          <OpportunityColumn title={t(language, 'lowestEverProducts')} products={lowestEver} onOpen={onSelectProduct} language={language} />
          <OpportunityColumn title={t(language, 'backInStockProducts')} products={backInStock} onOpen={onSelectProduct} language={language} />
        </div>
      </CollapsibleSection>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <CollapsibleSection
          title={t(language, 'bestPriceDrops')}
          icon={<Percent className="h-4 w-4" />}
          actions={<button className="text-button min-h-9 px-3" type="button" onClick={onOpenProducts}>{t(language, 'seeProducts')}</button>}
        >
          <div className="space-y-2">
            {bestDeals.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#28344C] dark:text-slate-400">{t(language, 'noDiscountsYet')}</p>
            ) : bestDeals.map((product) => (
              <DealRow key={product.id} product={product} onOpen={onSelectProduct} language={language} />
            ))}
          </div>
        </CollapsibleSection>

        <SavingsOverTimeCard rows={savingsTimeline} total={savings} currency="PLN" language={language} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <CollapsibleSection
          title={t(language, 'recentAlerts')}
          icon={<Bell className="h-4 w-4" />}
          actions={<button className="text-button min-h-9 px-3" type="button" onClick={onOpenNotifications}>{t(language, 'openAlertsAction')}</button>}
        >
          <div className="space-y-2">
            {alertProducts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#28344C] dark:text-slate-400">{t(language, 'noActiveAlerts')}</p>
            ) : alertProducts.map((product) => (
              <AlertPreviewRow key={product.id} product={product} onOpen={onSelectProduct} language={language} />
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title={t(language, 'categories')}
          icon={<Tags className="h-4 w-4" />}
          actions={<button className="text-button min-h-9 px-3" type="button" onClick={onOpenCategories}>{t(language, 'manage')}</button>}
        >
          <div className="space-y-2">
            {categories.slice(0, 7).map((category) => (
              <div key={category.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-[#151D30]">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-white"
                  style={{ backgroundColor: categoryColor(category) }}
                >
                  <CategoryIcon name={category.iconName} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
                <span className="rounded bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-[#151D30] dark:text-slate-300">{category.productCount}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

function isCloseToTargetOpportunity(product: Product) {
  const gap = targetGapPercent(product);
  return gap !== null && gap > 0 && gap <= 20;
}

function targetGapPercent(product: Product) {
  if (!product.currentPrice || !product.targetPrice || product.targetPrice <= 0) {
    return null;
  }

  return ((product.currentPrice - product.targetPrice) / product.targetPrice) * 100;
}

function BulkActionsBar({
  selectedCount,
  categories,
  onDelete,
  onEnable,
  onDisable,
  onChangeCategory,
  onExport,
  onClear,
  language
}: {
  selectedCount: number;
  categories: Category[];
  onDelete: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onChangeCategory: (categoryName: string) => void;
  onExport: () => void;
  onClear: () => void;
  language: Language;
}) {
  return (
    <section className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold">{t(language, 'bulkActions')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCount} {t(language, 'selectedProducts')}</p>
      </div>
      <div className="flex min-w-0 flex-wrap gap-2">
        <div className="min-w-[210px]">
          <CustomSelect
            value="__placeholder__"
            onChange={(value) => {
              if (value !== '__placeholder__') {
                onChangeCategory(value);
              }
            }}
            options={[
              { value: '__placeholder__', label: t(language, 'changeCategory') },
              { value: '', label: t(language, 'uncategorized') },
              ...categories.map((category) => ({ value: category.name, label: category.name }))
            ]}
          />
        </div>
        <button className="text-button min-h-9 px-3" type="button" onClick={onEnable}>{t(language, 'enableMonitoringSelected')}</button>
        <button className="text-button min-h-9 px-3" type="button" onClick={onDisable}>{t(language, 'disableMonitoringSelected')}</button>
        <button className="text-button min-h-9 px-3" type="button" onClick={onExport}>{t(language, 'exportSelected')}</button>
        <button className="text-button min-h-9 px-3" type="button" onClick={onClear}>{t(language, 'clearSelection')}</button>
        <button className="text-button min-h-9 px-3 text-rose-700 dark:text-rose-300" type="button" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          {t(language, 'deleteSelected')}
        </button>
      </div>
    </section>
  );
}

function DealRow({ product, onOpen, language }: { product: Product; onOpen: (product: Product) => void; language: Language }) {
  const saved = discountAmount(product);
  const percent = discountPercent(product);

  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-left transition hover:border-sky-200 hover:bg-sky-50 dark:border-[#28344C] dark:bg-[#151D30] dark:hover:border-[rgba(79,140,255,0.34)] dark:hover:bg-[#24314C]"
      type="button"
      onClick={() => onOpen(product)}
    >
      <ProductThumb product={product} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          {percent > 0 && <span className="deal-badge">-{percent}%</span>}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{product.shopName} / {product.categoryName ?? t(language, 'uncategorized')}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">{formatMoney(product.currentPrice, product.currency)}</p>
        {product.basePrice && product.basePrice > (product.currentPrice ?? 0) && (
          <p className="text-xs text-slate-400 line-through">{formatMoney(product.basePrice, product.currency)}</p>
        )}
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t(language, 'savingLabel')} {formatMoney(saved, product.currency)}</p>
      </div>
    </button>
  );
}

function OpportunityColumn({ title, products, onOpen, language }: { title: string; products: Product[]; onOpen: (product: Product) => void; language: Language }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-[#28344C] dark:bg-[#0B1020]/35">
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      <div className="space-y-2">
        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500 dark:border-[#28344C] dark:text-slate-400">{t(language, 'noData')}</p>
        ) : products.map((product) => {
          const opportunityPercent = latestPriceDropPercent(product) || discountPercent(product);

          return (
            <button key={product.id} className="flex w-full items-center gap-2 rounded-2xl bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[#151D30]" type="button" onClick={() => onOpen(product)}>
              <ProductThumb product={product} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-slate-500">{formatMoney(product.currentPrice, product.currency)}</p>
              </div>
              {opportunityPercent > 0 && <span className="deal-badge">-{opportunityPercent}%</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AlertPreviewRow({ product, onOpen, language }: { product: Product; onOpen: (product: Product) => void; language: Language }) {
  const priceAlert = isBelowTarget(product);

  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-left transition hover:border-sky-200 hover:bg-sky-50 dark:border-[#28344C] dark:bg-[#151D30] dark:hover:border-[rgba(79,140,255,0.34)] dark:hover:bg-[#24314C]" type="button" onClick={() => onOpen(product)}>
      <ProductThumb product={product} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{product.name}</p>
        <p className="text-xs text-slate-500">
          {priceAlert ? t(language, 'priceBelowTarget') : t(language, 'monitoringRestock')} / {formatDate(product.updatedAt)}
        </p>
      </div>
      <span className={priceAlert ? 'deal-badge' : 'status-pill status-pill-waiting'}>
        {priceAlert ? t(language, 'priceDrop') : t(language, 'stockAlertShort')}
      </span>
    </button>
  );
}

function WatchlistView({
  products,
  categories,
  viewMode,
  setViewMode,
  onOpenProducts,
  onSelect,
  onCheck,
  onDelete,
  onEdit,
  onToggleMonitoring,
  onToggleBookmark,
  language
}: {
  products: Product[];
  categories: Category[];
  viewMode: ProductViewMode;
  setViewMode: (mode: ProductViewMode) => void;
  onOpenProducts: () => void;
  onSelect: (product: Product) => void;
  onCheck: (product: Product) => void;
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleMonitoring: (product: Product) => void;
  onToggleBookmark: (product: Product) => void;
  language: Language;
}) {
  return (
    <div className="mx-auto max-w-[1180px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Bookmark className="h-5 w-5" />}
        title={t(language, 'watchlistTitle')}
        description={t(language, 'watchlistDescription')}
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <button className="text-button shrink-0 whitespace-nowrap" type="button" onClick={onOpenProducts}>
              <PackageSearch className="h-4 w-4" />
              {t(language, 'seeProducts')}
            </button>
            <ViewSwitch viewMode={viewMode} setViewMode={setViewMode} language={language} />
          </div>
        )}
      />

      {products.length === 0 ? (
        <EmptyState
          title={t(language, 'watchlistEmpty')}
          actionLabel={t(language, 'seeProducts')}
          onAction={onOpenProducts}
        />
      ) : viewMode === 'list' ? (
        <div className="grid gap-3">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isSelected={false}
              onSelect={() => onSelect(product)}
              onCheck={() => onCheck(product)}
              onDelete={() => onDelete(product)}
              onEdit={() => onEdit(product)}
              onToggleMonitoring={() => onToggleMonitoring(product)}
              isBookmarked={product.isBookmarked}
              onToggleBookmark={() => onToggleBookmark(product)}
              accentColor={productAccentColor(product, categories)}
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductImageCard
              key={product.id}
              product={product}
              isSelected={false}
              onSelect={() => onSelect(product)}
              onCheck={() => onCheck(product)}
              onDelete={() => onDelete(product)}
              onEdit={() => onEdit(product)}
              onToggleMonitoring={() => onToggleMonitoring(product)}
              isBookmarked={product.isBookmarked}
              onToggleBookmark={() => onToggleBookmark(product)}
              accentColor={productAccentColor(product, categories)}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesPage({
  categories,
  products,
  activeCategory,
  onFilterCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  language
}: {
  categories: Category[];
  products: Product[];
  activeCategory: string;
  onFilterCategory: (categoryName: string) => void;
  onCreateCategory: (name: string, iconName?: string, colorHex?: string) => Promise<Category | undefined>;
  onUpdateCategory: (category: Category, name: string, iconName?: string | null, colorHex?: string | null) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
  language: Language;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const uncategorizedProducts = products.filter((product) => !product.categoryName);
  const groupedCategories = [
    ...categories.map((category) => {
      const categoryProducts = products.filter((product) => product.categoryName === category.name);
      const bestDeal = [...categoryProducts].sort((left, right) => discountAmount(right) - discountAmount(left))[0];
      return { category, products: categoryProducts, bestDeal, filterValue: category.name };
    }),
    ...(uncategorizedProducts.length > 0 ? [{
      category: {
        id: UNCATEGORIZED_CATEGORY_ID,
        name: t(language, 'uncategorizedProducts'),
        iconName: 'Tag',
        colorHex: UNCATEGORIZED_COLOR,
        productCount: uncategorizedProducts.length
      },
      products: uncategorizedProducts,
      bestDeal: [...uncategorizedProducts].sort((left, right) => discountAmount(right) - discountAmount(left))[0],
      filterValue: UNCATEGORIZED_CATEGORY_ID,
      isUncategorized: true
    }] : [])
  ];
  const selectedGroup = groupedCategories.find(({ category }) => category.id === selectedCategoryId);

  if (selectedGroup) {
    return (
      <CategoryDetailView
        group={selectedGroup}
        groups={groupedCategories}
        language={language}
        onBack={() => setSelectedCategoryId(null)}
        onSelectCategory={setSelectedCategoryId}
        onFilterCategory={onFilterCategory}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Tags className="h-5 w-5" />}
        title={t(language, 'categoryTitle')}
        description={t(language, 'categoryDescription')}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {groupedCategories.map((group) => (
          <CategoryOverviewCard
            key={group.category.id}
            group={group}
            isActive={activeCategory === group.filterValue}
            language={language}
            onOpen={() => setSelectedCategoryId(group.category.id)}
          />
        ))}
        <button
          className="panel flex min-h-[180px] flex-col items-center justify-center gap-3 border-dashed bg-slate-50 p-4 text-slate-500 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:text-sky-700 dark:bg-[#151D30] dark:hover:bg-[#24314C]"
          type="button"
          onClick={() => {
            setCategoryManagerOpen(true);
            window.requestAnimationFrame(() => {
              document.getElementById('category-manager-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm dark:bg-[#151D30] dark:text-slate-200">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">{t(language, 'addCategory')}</span>
        </button>
      </section>

      <div id="category-manager-section" className="scroll-mt-24">
        <CollapsibleSection
          title={t(language, 'manageCategories')}
          icon={<FolderPlus className="h-4 w-4" />}
          defaultOpen={false}
          open={categoryManagerOpen}
          onOpenChange={setCategoryManagerOpen}
        >
          <CategoryManager
            categories={categories}
            activeCategory={activeCategory}
            onFilterCategory={onFilterCategory}
            onCreateCategory={onCreateCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            expanded
            language={language}
          />
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        title={t(language, 'productsByCategory')}
        icon={<PackageSearch className="h-4 w-4" />}
        defaultOpen={false}
        actions={<button className="text-button min-h-9 px-3" type="button" onClick={() => onFilterCategory('all')}>{t(language, 'showAll')}</button>}
      >
        <div className="grid gap-3">
          {groupedCategories.map((group) => (
            <CategoryProductGroup key={group.category.id} group={group} language={language} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

type CategoryGroup = {
  category: Category;
  products: Product[];
  bestDeal?: Product;
  filterValue: string;
  isUncategorized?: boolean;
};

function CategoryProductGroup({ group, language }: { group: CategoryGroup; language: Language }) {
  const [open, setOpen] = useState(false);
  const { category, products: categoryProducts } = group;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-[#28344C] dark:bg-[#151D30]">
      <button
        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white dark:hover:bg-[#24314C]"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: categoryColor(category) }}>
          <CategoryIcon name={category.iconName} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-bold">{category.name}</h4>
          <p className="text-xs text-slate-500">{productCountLabel(language, categoryProducts.length)}</p>
        </div>
        <ChevronDownIcon open={open} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-2 px-3 pb-3">
            {categoryProducts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500 dark:border-[#28344C] dark:bg-[#151D30]">{t(language, 'noProductsInCategory')}</p>
            ) : categoryProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm dark:bg-[#151D30]">
                <ProductThumb product={product} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">{formatMoney(product.currentPrice, product.currency)}</p>
                </div>
                {discountAmount(product) > 0 && <span className="deal-badge">-{discountPercent(product)}%</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-[#28344C] dark:bg-[#151D30] dark:text-slate-300">
      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
    </span>
  );
}

function CategoryOverviewCard({
  group,
  isActive,
  language,
  onOpen
}: {
  group: CategoryGroup;
  isActive: boolean;
  language: Language;
  onOpen: () => void;
}) {
  const { category, bestDeal, products: categoryProducts } = group;
  const color = categoryColor(category);
  const progress = Math.min(100, Math.max(12, category.productCount * 18));

  return (
    <button
      className={`panel group min-h-[180px] p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:hover:border-[rgba(79,140,255,0.34)] ${isActive ? 'ring-2 ring-sky-300 dark:ring-[rgba(79,140,255,0.34)]' : ''}`}
      type="button"
      onClick={onOpen}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition duration-300 group-hover:scale-105"
          style={{ backgroundColor: color }}
        >
          <CategoryIcon name={category.iconName} className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-[#151D30] dark:text-slate-200">
          {productCountLabel(language, category.productCount)}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{category.name}</h3>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#151D30]">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {bestDeal && discountAmount(bestDeal) > 0
          ? `${t(language, 'bestDeal')}: ${formatMoney(discountAmount(bestDeal), bestDeal.currency)} ${t(language, 'cheaper')}`
          : t(language, 'noDiscount')}
      </p>
      {categoryProducts[0] && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-[#151D30]">
          <ProductThumb product={categoryProducts[0]} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{categoryProducts[0].name}</p>
            <p className="text-xs text-slate-500">{formatMoney(categoryProducts[0].currentPrice, categoryProducts[0].currency)}</p>
          </div>
        </div>
      )}
    </button>
  );
}

function CategoryDetailView({
  group,
  groups,
  language,
  onBack,
  onSelectCategory,
  onFilterCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}: {
  group: CategoryGroup;
  groups: CategoryGroup[];
  language: Language;
  onBack: () => void;
  onSelectCategory: (categoryId: string) => void;
  onFilterCategory: (categoryName: string) => void;
  onCreateCategory: (name: string, iconName?: string, colorHex?: string) => Promise<Category | undefined>;
  onUpdateCategory: (category: Category, name: string, iconName?: string | null, colorHex?: string | null) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
}) {
  const { category, products: categoryProducts, bestDeal } = group;
  const color = categoryColor(category);
  const savings = categoryProducts.reduce((sum, product) => sum + discountAmount(product), 0);
  const available = categoryProducts.filter((product) => product.isAvailable).length;

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel overflow-hidden p-0">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-6">
          <div className="min-w-0">
            <button className="text-button mb-4 min-h-9 px-3" type="button" onClick={onBack}>
              <X className="h-4 w-4" />
              {t(language, 'backToCategories')}
            </button>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                <CategoryIcon name={category.iconName} className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sky-700 dark:text-[#DCEBFF]">{t(language, 'categoryDetails')}</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">{category.name}</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {productCountLabel(language, categoryProducts.length)} / {available} {t(language, 'available').toLowerCase()}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="soft-primary-button" type="button" onClick={() => onFilterCategory(group.filterValue)}>
                <PackageSearch className="h-4 w-4" />
                {t(language, 'showInWatchlist')}
              </button>
              <button className="text-button" type="button" onClick={onBack}>
                <Tags className="h-4 w-4" />
                {t(language, 'switchCategory')}
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Info label={t(language, 'productsCount')} value={String(categoryProducts.length)} />
            <Info label={t(language, 'totalSavings')} value={formatMoney(savings, bestDeal?.currency ?? 'PLN')} />
            <Info label={t(language, 'bestDeal')} value={bestDeal ? formatMoney(bestDeal.currentPrice, bestDeal.currency) : '-'} />
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 dark:border-[#28344C] lg:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-normal text-slate-400">{t(language, 'switchCategory')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {groups.map(({ category: itemCategory }) => (
              <button
                key={itemCategory.id}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${itemCategory.id === category.id ? 'border-sky-200 bg-sky-50 text-sky-800 shadow-sm dark:border-[rgba(79,140,255,0.45)] dark:bg-[#24314C] dark:text-[#F5F7FB]' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-[#28344C] dark:bg-[#151D30] dark:text-slate-200'}`}
                type="button"
                onClick={() => onSelectCategory(itemCategory.id)}
              >
                <CategoryIcon name={itemCategory.iconName} className="h-4 w-4" />
                {itemCategory.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <CollapsibleSection title={t(language, 'productsInCategory')} icon={<PackageSearch className="h-4 w-4" />}>
        {categoryProducts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#28344C] dark:text-slate-400">{t(language, 'noProductsInCategory')}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categoryProducts.map((product) => (
              <button
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-left transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-md dark:border-[#28344C] dark:bg-[#151D30] dark:hover:border-[rgba(79,140,255,0.34)] dark:hover:bg-[#24314C]"
                type="button"
                onClick={() => onFilterCategory(group.filterValue)}
              >
                <div className="aspect-[4/3] bg-slate-100 dark:bg-[#151D30]">
                  {product.imageUrl ? (
                    <img className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" src={product.imageUrl} alt="" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">IMG</div>
                  )}
                </div>
                <div className="space-y-3 p-3">
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold text-slate-950 dark:text-white">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.shopName}</p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold">{formatMoney(product.currentPrice, product.currency)}</p>
                  {product.targetPrice && <p className="text-xs text-slate-500">{t(language, 'target')}: {formatMoney(product.targetPrice, product.currency)}</p>}
                    </div>
                    {discountAmount(product) > 0 && <span className="deal-badge">-{discountPercent(product)}%</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.size && <Badge>{product.size}</Badge>}
                    {product.color && <Badge>{product.color}</Badge>}
                    <span className={product.isAvailable ? 'status-pill status-pill-save' : 'status-pill status-pill-alert'}>{product.isAvailable ? t(language, 'available') : t(language, 'unavailable')}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title={t(language, 'manageCategories')} icon={<FolderPlus className="h-4 w-4" />} defaultOpen={false}>
        <CategoryManager
          categories={groups.filter((item) => !item.isUncategorized).map((item) => item.category)}
          activeCategory={group.filterValue}
          onFilterCategory={onFilterCategory}
          onCreateCategory={onCreateCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
          expanded
          language={language}
        />
      </CollapsibleSection>
    </div>
  );
}

function StatisticsPage({
  stats,
  products,
  categories,
  onSelectProduct,
  language
}: {
  stats: DashboardStats;
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  language: Language;
}) {
  const savings = products.reduce((sum, product) => product.basePrice && product.currentPrice && product.basePrice > product.currentPrice ? sum + product.basePrice - product.currentPrice : sum, 0);
  const watchedValue = products.reduce((sum, product) => sum + (product.currentPrice ?? product.basePrice ?? 0), 0);
  const discountedProducts = products.filter((product) => discountPercent(product) > 0);
  const averageDiscount = discountedProducts.length
    ? Math.round(discountedProducts.reduce((sum, product) => sum + discountPercent(product), 0) / discountedProducts.length)
    : 0;
  const topStores = countBy(products.map((product) => product.shopName)).slice(0, 6);
  const savingsTimeline = buildSavingsTimeline(products);
  const uncategorizedCount = products.filter((product) => !product.categoryName).length;
  const categoryRows = [
    ...categories.map((category) => ({ label: category.name, value: category.productCount })),
    ...(uncategorizedCount > 0 ? [{ label: t(language, 'uncategorizedProducts'), value: uncategorizedCount }] : [])
  ];
  const bestDeals = [...products]
    .filter((product) => discountAmount(product) > 0)
    .sort((left, right) => discountAmount(right) - discountAmount(left))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title={t(language, 'statisticsTitle')}
        description={t(language, 'statisticsDescription')}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Wallet className="h-5 w-5" />} label={t(language, 'totalSavings')} value={formatMoney(savings, 'PLN')} tone="green" />
        <Stat icon={<TrendingDown className="h-5 w-5" />} label={t(language, 'averageDiscount')} value={`${averageDiscount}%`} tone="rose" />
        <Stat icon={<Package className="h-5 w-5" />} label={t(language, 'tracked')} value={stats.watchedProducts} tone="teal" />
        <Stat icon={<PackageSearch className="h-5 w-5" />} label={t(language, 'watchedValue')} value={formatMoney(watchedValue, 'PLN')} tone="amber" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <SavingsOverTimeCard rows={savingsTimeline} total={savings} currency="PLN" language={language} />
        <BarList title={t(language, 'productsByCategoryShort')} rows={categoryRows} language={language} />
      </div>
      <BarList title={t(language, 'topStores')} rows={topStores} language={language} variant="store" />
      <section className="panel p-4">
        <h3 className="mb-4 text-base font-semibold">{t(language, 'bestDealsInList')}</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {bestDeals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#28344C] dark:text-slate-400">{t(language, 'noDiscountData')}</p>
          ) : bestDeals.map((product) => (
            <DealRow key={product.id} product={product} onOpen={onSelectProduct} language={language} />
          ))}
        </div>
      </section>
    </div>
  );
}

function NotificationsPage({
  settings,
  setSettings,
  onSubmit,
  products,
  onEditProduct,
  onOpenProduct,
  language
}: {
  settings: AccountSettings;
  setSettings: (settings: AccountSettings) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  products: Product[];
  onEditProduct: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
  language: Language;
}) {
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => readStoredAlertIds());
  const alertProducts = products.filter((product) => isBelowTarget(product) || (!product.isAvailable && product.trackStock)).slice(0, 12);
  const unreadAlerts = alertProducts.filter((product) => !readAlertIds.includes(product.id));
  const earlierAlerts = alertProducts.filter((product) => readAlertIds.includes(product.id));
  const dailyDigestCount = products.filter((product) => discountAmount(product) > 0 || isBelowTarget(product)).length;

  useEffect(() => {
    localStorage.setItem('pricestockbot.readAlertIds', JSON.stringify(readAlertIds));
  }, [readAlertIds]);

  return (
    <div className="mx-auto grid max-w-[1300px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <section className="space-y-5">
        <PageHeader
          icon={<Bell className="h-5 w-5" />}
          title={t(language, 'notificationsTitle')}
          description={t(language, 'notificationsDescription')}
          action={(
            <button className="text-button" type="button" onClick={() => setReadAlertIds(alertProducts.map((product) => product.id))} disabled={unreadAlerts.length === 0}>
              <CheckCircle2 className="h-4 w-4" />
              {t(language, 'markAllRead')}
            </button>
          )}
        />
        <CollapsibleSection
          title={t(language, 'newAlerts')}
          icon={<Bell className="h-4 w-4" />}
          actions={(
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
              {unreadAlerts.length} {t(language, 'unread')}
            </span>
          )}
        >
          <div className="space-y-2">
            {unreadAlerts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#28344C] dark:text-slate-400">{t(language, 'noProductAlerts')}</p>
            ) : unreadAlerts.map((product) => (
              <AlertItem
                key={product.id}
                product={product}
                isRead={false}
                onOpen={() => onOpenProduct(product)}
                onEdit={() => onEditProduct(product)}
                onMarkRead={() => setReadAlertIds((current) => [...new Set([...current, product.id])])}
                language={language}
              />
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t(language, 'alertHistory')} icon={<Clock3 className="h-4 w-4" />} defaultOpen={earlierAlerts.length > 0}>
          <div className="space-y-2">
            {earlierAlerts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#28344C] dark:text-slate-400">{t(language, 'alertHistoryEmpty')}</p>
            ) : earlierAlerts.map((product) => (
              <AlertItem
                key={product.id}
                product={product}
                isRead
                onOpen={() => onOpenProduct(product)}
                onEdit={() => onEditProduct(product)}
                onMarkRead={() => undefined}
                language={language}
              />
            ))}
          </div>
        </CollapsibleSection>
      </section>

      <form className="panel h-fit space-y-4 p-5" onSubmit={onSubmit}>
        <div>
          <h2 className="text-lg font-semibold tracking-normal">{t(language, 'alertSettings')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(language, 'alertSettingsDescription')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-[#28344C] dark:bg-[#0B1020]/35">
          <p className="text-sm font-semibold">{t(language, 'dailyDigest')}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(language, 'dailyDigestPreview').replace('{count}', String(dailyDigestCount))}</p>
        </div>
        <Field label={t(language, 'alertEmail')}>
          <input className="field" type="email" value={settings.alertEmail ?? ''} onChange={(event) => setSettings({ ...settings, alertEmail: event.target.value })} placeholder="np. twoj@email.pl" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'alertEmailHint')}</p>
        </Field>
        <Field label={t(language, 'minimumDiscountPercent')}>
          <input className="field" type="number" min="0" max="95" step="1" value={settings.minimumDiscountPercent} onChange={(event) => setSettings({ ...settings, minimumDiscountPercent: Number(event.target.value) })} />
        </Field>
        <Field label={t(language, 'maxEmailsPerProductPerDay')}>
          <input className="field" type="number" min="1" max="24" step="1" value={settings.maxEmailsPerProductPerDay} onChange={(event) => setSettings({ ...settings, maxEmailsPerProductPerDay: Number(event.target.value) })} />
        </Field>
        <div className="grid gap-2">
          <Toggle checked={settings.emailNotificationsEnabled} label={t(language, 'emailNotifications')} onChange={(value) => setSettings({ ...settings, emailNotificationsEnabled: value })} />
          <Toggle checked={settings.notifyOnlySelectedVariant} label={t(language, 'selectedVariantOnly')} onChange={(value) => setSettings({ ...settings, notifyOnlySelectedVariant: value })} />
          <Toggle checked={settings.notifyBackInStock} label={t(language, 'backInStock')} onChange={(value) => setSettings({ ...settings, notifyBackInStock: value })} />
          <Toggle checked={settings.notifyTargetPrice} label={t(language, 'targetPriceDrop')} onChange={(value) => setSettings({ ...settings, notifyTargetPrice: value })} />
        </div>
        <button className="soft-primary-button w-full" type="submit">
          <Save className="h-4 w-4" />
          {t(language, 'saveAlerts')}
        </button>
      </form>
    </div>
  );
}

function AlertItem({
  product,
  isRead,
  onOpen,
  onEdit,
  onMarkRead,
  language
}: {
  product: Product;
  isRead: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onMarkRead: () => void;
  language: Language;
}) {
  const oldPrice = product.basePrice;
  const newPrice = product.currentPrice;
  const saved = discountAmount(product);
  const priceAlert = isBelowTarget(product);
  const percent = discountPercent(product);

  return (
    <div className={`flex flex-col gap-3 rounded-[1.25rem] border p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center ${isRead ? 'border-slate-100 bg-slate-50 opacity-80 dark:border-[#28344C] dark:bg-[#151D30]' : 'border-rose-100 bg-rose-50/60 dark:border-rose-400/30 dark:bg-rose-500/15'}`}>
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" type="button" onClick={onOpen}>
        <ProductThumb product={product} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <span className={priceAlert ? 'deal-badge' : 'status-pill status-pill-waiting'}>
              {priceAlert ? t(language, 'priceDrop') : t(language, 'stockAlert')}
            </span>
            {percent > 0 && <span className="deal-badge">-{percent}%</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">{product.shopName} / {formatDate(product.updatedAt)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            {oldPrice && <span>{t(language, 'oldPrice')}: {formatMoney(oldPrice, product.currency)}</span>}
            {newPrice && <span>{t(language, 'newPrice')}: {formatMoney(newPrice, product.currency)}</span>}
            {saved > 0 && <span className="font-semibold text-emerald-700 dark:text-emerald-300">{t(language, 'saved')}: {formatMoney(saved, product.currency)}</span>}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        {!isRead && (
          <button className="text-button min-h-9 px-3" type="button" onClick={onMarkRead}>
            <CheckCircle2 className="h-4 w-4" />
            {t(language, 'markRead')}
          </button>
        )}
        <button className="text-button min-h-9 px-3" type="button" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          {t(language, 'edit')}
        </button>
      </div>
    </div>
  );
}

function BarList({
  title,
  rows,
  language,
  variant = 'default'
}: {
  title: string;
  rows: { label: string; value: number }[];
  language: Language;
  variant?: 'default' | 'store';
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const showStoreLogo = variant === 'store';

  return (
    <section className="panel p-4">
      <h3 className="mb-4 text-base font-semibold">{title}</h3>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">{t(language, 'noData')}</p>
        ) : rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                {showStoreLogo && <StoreLogo storeName={row.label} />}
                <span className="truncate font-medium">{row.label}</span>
              </span>
              <span className="text-slate-500">{row.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#151D30]">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StoreLogo({ storeName }: { storeName: string }) {
  const [failed, setFailed] = useState(false);
  const domain = storeLogoDomain(storeName);
  const initial = storeName.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-bold text-sky-700 shadow-sm dark:border-[#3F4B68] dark:bg-[#20283C] dark:text-[#C7D7FF]">
      {domain && !failed ? (
        <img
          className="h-5 w-5 object-contain"
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : domain ? (
        initial
      ) : (
        <Store className="h-4 w-4" />
      )}
    </span>
  );
}

function storeLogoDomain(storeName: string) {
  const normalized = storeName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (normalized.includes('.')) {
    return normalized;
  }

  const knownStores: Record<string, string> = {
    allegro: 'allegro.pl',
    zalando: 'zalando.pl',
    komputronik: 'komputronik.pl',
    empik: 'empik.com',
    reserved: 'reserved.com',
    sephora: 'sephora.pl',
    mediaexpert: 'mediaexpert.pl',
    'media expert': 'mediaexpert.pl',
    xkom: 'x-kom.pl',
    'x-kom': 'x-kom.pl',
    morele: 'morele.net',
    ccc: 'ccc.eu',
    eobuwie: 'eobuwie.com.pl',
    amazon: 'amazon.pl',
    nike: 'nike.com',
    adidas: 'adidas.pl',
    zara: 'zara.com',
    hm: 'hm.com',
    'h&m': 'hm.com'
  };

  return knownStores[normalized] ?? `${normalized.replace(/\s+/g, '')}.pl`;
}

function AuthScreen({
  mode,
  email,
  password,
  message,
  error,
  isLoading,
  darkMode,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleTheme,
  language,
  onLanguageChange
}: {
  mode: AuthMode;
  email: string;
  password: string;
  message: string | null;
  error: string | null;
  isLoading: boolean;
  darkMode: boolean;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleTheme: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const showPasswordField = mode !== 'forgot';
  const subtitle = {
    login: t(language, 'loginSubtitle'),
    register: t(language, 'registerSubtitle'),
    forgot: t(language, 'forgotPasswordSubtitle'),
    reset: t(language, 'resetPasswordSubtitle')
  }[mode];
  const submitLabel = {
    login: t(language, 'login'),
    register: t(language, 'register'),
    forgot: t(language, 'sendResetLink'),
    reset: t(language, 'setNewPassword')
  }[mode];
  const SubmitIcon = mode === 'login' ? LogIn : mode === 'register' ? UserPlus : mode === 'forgot' ? Mail : KeyRound;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] p-4 text-[var(--text-primary)]">
      <section className="panel w-full max-w-md p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" />
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">StockPriceBot</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelect language={language} onChange={onLanguageChange} label={t(language, 'language')} compact />
            <button className="icon-button" onClick={onToggleTheme} title={t(language, 'theme')}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Email">
            <input className="field" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required />
          </Field>
          {showPasswordField && (
            <Field label={mode === 'reset' ? t(language, 'newPassword') : t(language, 'password')}>
              <div className="relative">
                <input
                  className="field bg-[var(--surface-primary)] pr-12 text-[var(--text-primary)]"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#24314C] dark:hover:text-white"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  title={showPassword ? t(language, 'hidePassword') : t(language, 'showPassword')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'reset' && <p className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'passwordMinHint')}</p>}
            </Field>
          )}
          {message && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100">{message}</div>}
          {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-500/15 dark:text-rose-100">{error}</div>}
          <button className="soft-primary-button w-full" type="submit" disabled={isLoading}>
            <SubmitIcon className="h-4 w-4" />
            {submitLabel}
          </button>
        </form>

        <div className="mt-3 grid gap-2">
          {mode === 'login' && (
            <button className="text-button w-full" type="button" onClick={() => onModeChange('forgot')}>
              {t(language, 'forgotPassword')}
            </button>
          )}
          <button className="text-button w-full" type="button" onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? t(language, 'noAccountRegister') : mode === 'register' ? t(language, 'hasAccountLogin') : t(language, 'backToLogin')}
          </button>
        </div>
      </section>
    </main>
  );
}
