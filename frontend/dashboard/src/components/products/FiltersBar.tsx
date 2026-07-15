import { Bell, Download, Filter, FolderPlus, Search, Upload, X } from 'lucide-react';
import { UNCATEGORIZED_CATEGORY_ID } from '../../app/constants';
import { activeFilterChips } from '../../app/productHelpers';
import type { Filters, ProductViewMode } from '../../app/types';
import { type Language, t } from '../../i18n';
import { CustomSelect } from '../common/CustomSelect';
import { FilterCheck } from '../common/FilterCheck';
import { ViewSwitch } from '../common/ViewSwitch';

type FiltersBarProps = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  query: string;
  setQuery: (value: string) => void;
  optionSets: { stores: string[]; categories: string[]; sizes: string[]; colors: string[] };
  viewMode: ProductViewMode;
  setViewMode: (mode: ProductViewMode) => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  onClear: () => void;
  onManageCategories: () => void;
  onExportProducts: () => void;
  onImportProducts: () => void;
  onOpenSettings: () => void;
  language: Language;
};

export function FiltersBar({
  filters,
  setFilters,
  query,
  setQuery,
  optionSets,
  viewMode,
  setViewMode,
  showAdvanced,
  setShowAdvanced,
  onClear,
  onManageCategories,
  onExportProducts,
  onImportProducts,
  onOpenSettings,
  language
}: FiltersBarProps) {
  const activeChips = activeFilterChips(filters, query, language);
  const categoryOptions = [
    { value: 'all', label: t(language, 'allCategories') },
    ...optionSets.categories.map((category) => ({
      value: category,
      label: category === UNCATEGORIZED_CATEGORY_ID ? t(language, 'uncategorizedProducts') : category
    }))
  ];
  const storeOptions = [
    { value: 'all', label: t(language, 'allStores') },
    ...optionSets.stores.map((store) => ({ value: store, label: store }))
  ];
  const sortOptions = [
    { value: 'newest', label: t(language, 'newest') },
    { value: 'oldest', label: t(language, 'oldest') },
    { value: 'priceAsc', label: t(language, 'priceAsc') },
    { value: 'priceDesc', label: t(language, 'priceDesc') },
    { value: 'discountDesc', label: t(language, 'biggestDiscount') },
    { value: 'closestTarget', label: t(language, 'closestTarget') },
    { value: 'lastChecked', label: t(language, 'lastChecked') },
    { value: 'nameAsc', label: t(language, 'nameAsc') },
    { value: 'nameDesc', label: t(language, 'nameDesc') }
  ];

  return (
    <section className="panel p-4">
      <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(240px,1fr)_minmax(180px,240px)_minmax(180px,240px)]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field h-11 pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(language, 'searchPlaceholder')}
          />
        </div>
        <CustomSelect value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} options={categoryOptions} />
        <CustomSelect value={filters.store} onChange={(value) => setFilters({ ...filters, store: value })} options={storeOptions} />
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-[#28344C]">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CustomSelect
            className="min-w-[230px] max-w-full flex-1 sm:flex-none"
            value={filters.sort}
            onChange={(value) => setFilters({ ...filters, sort: value })}
            options={sortOptions}
          />
          <button
            className={showAdvanced ? 'soft-primary-button h-10 px-3' : 'text-button h-10 px-3'}
            onClick={() => setShowAdvanced(!showAdvanced)}
            type="button"
          >
            <Filter className="h-4 w-4" />
            <span>{t(language, 'filters')}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
              {activeChips.length} {t(language, 'activeFiltersLabel')}
            </span>
          </button>
          <ViewSwitch viewMode={viewMode} setViewMode={setViewMode} language={language} />
        </div>
        {activeChips.length > 0 && (
          <div className="mt-2 flex min-w-0 flex-wrap gap-2">
            {activeChips.map((chip) => (
              <span key={chip} className="rounded bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <button className="text-button min-h-9 px-3" type="button" onClick={onManageCategories}>
          <FolderPlus className="h-4 w-4" />
          {t(language, 'categories')}
        </button>
        <button className="text-button min-h-9 px-3" type="button" onClick={onExportProducts}>
          <Download className="h-4 w-4" />
          {t(language, 'export')}
        </button>
        <button className="text-button min-h-9 px-3" type="button" onClick={onImportProducts}>
          <Upload className="h-4 w-4" />
          {t(language, 'importWishlist')}
        </button>
        <button className="text-button min-h-9 px-3" type="button" onClick={onOpenSettings}>
          <Bell className="h-4 w-4" />
          {t(language, 'notifications')}
        </button>
        <button className="text-button min-h-9 px-3" type="button" onClick={onClear}>
          <X className="h-4 w-4" />
          {t(language, 'clearFilters')}
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-3 grid gap-3 border-t border-stone-200 pt-3 dark:border-[#28344C] md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label={t(language, 'size')} value={filters.size} onChange={(value) => setFilters({ ...filters, size: value })} options={optionSets.sizes} language={language} />
          <FilterSelect label={t(language, 'color')} value={filters.color} onChange={(value) => setFilters({ ...filters, color: value })} options={optionSets.colors} language={language} />
          <CustomSelect
            label={t(language, 'availability')}
            value={filters.availability}
            onChange={(value) => setFilters({ ...filters, availability: value })}
            options={[
              { value: 'all', label: t(language, 'all') },
              { value: 'available', label: t(language, 'available') },
              { value: 'unavailable', label: t(language, 'unavailable') }
            ]}
          />
          <CustomSelect
            label={t(language, 'monitoring')}
            value={filters.monitoring}
            onChange={(value) => setFilters({ ...filters, monitoring: value })}
            options={[
              { value: 'all', label: t(language, 'all') },
              { value: 'active', label: t(language, 'active') },
              { value: 'inactive', label: t(language, 'inactive') }
            ]}
          />
          <FilterCheck
            label={t(language, 'belowTargetFilter')}
            checked={filters.belowTarget === 'yes'}
            onChange={(checked) => setFilters({ ...filters, belowTarget: checked ? 'yes' : 'all' })}
          />
          <FilterCheck
            label={t(language, 'restockAlertFilter')}
            checked={filters.stockAlert === 'yes'}
            onChange={(checked) => setFilters({ ...filters, stockAlert: checked ? 'yes' : 'all' })}
          />
          <FilterCheck
            label={t(language, 'recentlyAdded')}
            checked={filters.recent === 'yes'}
            onChange={(checked) => setFilters({ ...filters, recent: checked ? 'yes' : 'all' })}
          />
        </div>
      )}
    </section>
  );
}

function FilterSelect({ label, value, onChange, options, language }: { label: string; value: string; onChange: (value: string) => void; options: string[]; language: Language }) {
  return (
    <CustomSelect
      label={label}
      value={value}
      onChange={onChange}
      options={[
        { value: 'all', label: t(language, 'all') },
        ...options.map((option) => ({ value: option, label: option }))
      ]}
    />
  );
}
