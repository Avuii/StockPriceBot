import { Activity, Bookmark, Eye, Store } from 'lucide-react';
import type { Language } from '../../i18n';
import { t } from '../../i18n';
import type { Product } from '../../types';
import { discountAmount, discountPercent } from '../../lib/productMetrics';
import { getPriceInsight, healthLabel, healthPillClass, priceBadgeClass } from '../../lib/productInsights';
import { formatDate, formatMoney } from '../../lib/formatters';
import { Badge, Info } from '../common/ui';
import { ProductActionsMenu } from './ProductActionsMenu';

type ProductCardActions = {
  onSelect: () => void;
  onCheck: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleMonitoring: () => void;
  onToggleBookmark: () => void;
};

type ProductCardBaseProps = ProductCardActions & {
  product: Product;
  isSelected: boolean;
  isBookmarked: boolean;
  accentColor: string;
  language: Language;
  bulkSelected?: boolean;
  onBulkToggle?: () => void;
};

export function ProductRow({
  product,
  onSelect,
  onCheck,
  onDelete,
  onEdit,
  onToggleMonitoring,
  isBookmarked,
  onToggleBookmark,
  accentColor,
  language,
  bulkSelected = false,
  onBulkToggle
}: ProductCardBaseProps) {
  const belowThreshold = product.currentPrice !== null
    && product.currentPrice !== undefined
    && product.targetPrice !== null
    && product.targetPrice !== undefined
    && product.currentPrice <= product.targetPrice;
  const saved = discountAmount(product);
  const percent = discountPercent(product);
  const insight = getPriceInsight(product);
  const variantText = [product.size ? `${t(language, 'size')} ${product.size}` : null, product.color].filter(Boolean).join(' / ');

  return (
    <article
      className="relative grid gap-3 overflow-visible rounded-[1.35rem] border border-slate-200 bg-white p-3 pb-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#28344C] dark:bg-[#151D30] sm:grid-cols-[104px_minmax(0,1fr)_auto]"
      style={{ borderColor: isBookmarked ? accentColor : undefined }}
    >
      <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: accentColor }} />
      {onBulkToggle && (
        <label className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-2xl bg-white/95 shadow-sm backdrop-blur dark:bg-[#151D30]/90">
          <input className="h-4 w-4 accent-sky-600" type="checkbox" checked={bulkSelected} onChange={onBulkToggle} aria-label={t(language, 'bulkActions')} />
        </label>
      )}
      <button className="h-[104px] w-[104px] overflow-hidden rounded-2xl bg-slate-100 dark:bg-[#151D30]" onClick={onSelect} title={t(language, 'productPreview')}>
        {product.imageUrl ? (
          <img className="h-full w-full object-cover transition duration-300 hover:scale-[1.04]" src={product.imageUrl} alt="" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">IMG</div>
        )}
      </button>
      <button className="min-w-0 text-left" onClick={onSelect}>
        <div className="grid gap-2">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-normal text-slate-950 dark:text-white">{product.name}</h3>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Store className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{product.shopName}</span>
                </span>
                <span>{product.categoryName ?? t(language, 'uncategorized')}</span>
                {variantText && <span className="truncate">{variantText}</span>}
              </div>
            </div>
            {percent > 0 && <span className="deal-badge shrink-0">-{percent}%</span>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className={`status-pill ${priceBadgeClass(insight.tone)}`}>{t(language, insight.badgeKey)}</span>
            <span className={`status-pill ${healthPillClass(product.monitoringStatus)}`}>
              <Activity className="mr-1 h-3 w-3" />
              {healthLabel(language, product.monitoringStatus)}
            </span>
            {isBookmarked && <span className="status-pill bg-sky-50 text-sky-700 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]">
              <Bookmark className="mr-1 h-3 w-3 fill-current" />
              {t(language, 'bookmarked')}
            </span>}
            {belowThreshold && <span className="status-pill status-pill-alert">{t(language, 'targetPriceDrop')}</span>}
            {product.trackStock && <span className="status-pill status-pill-waiting">{t(language, 'stockAlert')}</span>}
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <CompactMetric label={t(language, 'price')} value={formatMoney(product.currentPrice, product.currency)} strong />
          <CompactMetric label={t(language, 'target')} value={formatMoney(product.targetPrice, product.currency)} />
          <CompactMetric label={t(language, 'availability')} value={product.isAvailable ? t(language, 'available') : t(language, 'unavailable')} tone={product.isAvailable ? 'green' : 'red'} />
          <CompactMetric label={t(language, 'monitoring')} value={product.isActive ? t(language, 'active') : t(language, 'inactive')} tone={product.isActive ? 'green' : 'muted'} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{t(language, 'lowestHistoryPriceShort')}: <strong className="text-slate-700 dark:text-slate-200">{formatMoney(insight.lowestPrice, product.currency)}</strong></span>
          <span>{t(language, 'averageHistoryPriceShort')}: <strong className="text-slate-700 dark:text-slate-200">{formatMoney(insight.averagePrice, product.currency)}</strong></span>
          <span>{t(language, 'currentVsAverage')}: <strong className="text-slate-700 dark:text-slate-200">{formatPercentDelta(insight.currentVsAveragePercent)}</strong></span>
          {saved > 0 && <span className="status-pill status-pill-save">{t(language, 'savingLabel')} {formatMoney(saved, product.currency)}</span>}
        </div>

        <p className="mt-2 text-xs text-slate-400">{t(language, 'lastCheckedShort')}: {formatDate(product.lastCheckedAt)}</p>
      </button>
      <div className="flex items-start justify-end gap-2">
        <button
          className={`icon-button shrink-0 ${isBookmarked ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-[rgba(79,140,255,0.38)] dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]' : ''}`}
          type="button"
          onClick={onToggleBookmark}
          title={isBookmarked ? t(language, 'removeBookmark') : t(language, 'bookmarkProduct')}
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
        <ProductActionsMenu
          isActive={product.isActive}
          isBookmarked={isBookmarked}
          onPreview={onSelect}
          onEdit={onEdit}
          onCheck={onCheck}
          onToggleBookmark={onToggleBookmark}
          onToggleMonitoring={onToggleMonitoring}
          onDelete={onDelete}
          language={language}
        />
      </div>
    </article>
  );
}

export function ProductImageCard({
  product,
  onSelect,
  onCheck,
  onDelete,
  onEdit,
  onToggleMonitoring,
  isBookmarked,
  onToggleBookmark,
  accentColor,
  language,
  bulkSelected = false,
  onBulkToggle
}: ProductCardBaseProps) {
  const belowThreshold = product.currentPrice !== null
    && product.currentPrice !== undefined
    && product.targetPrice !== null
    && product.targetPrice !== undefined
    && product.currentPrice <= product.targetPrice;
  const saved = discountAmount(product);
  const percent = discountPercent(product);
  const insight = getPriceInsight(product);

  return (
    <article
      className="relative overflow-visible rounded-[1.35rem] border border-slate-200 bg-white pb-1.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#28344C] dark:bg-[#151D30]"
      style={{ borderColor: isBookmarked ? accentColor : undefined }}
    >
      <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: accentColor }} />
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-[#151D30]">
        {onBulkToggle && (
          <label className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/95 shadow-sm backdrop-blur dark:bg-[#151D30]/90">
            <input className="h-4 w-4 accent-sky-600" type="checkbox" checked={bulkSelected} onChange={onBulkToggle} aria-label={t(language, 'bulkActions')} />
          </label>
        )}
        <button className="block h-full w-full" onClick={onSelect} title={t(language, 'productPreview')}>
          {product.imageUrl ? (
            <img className="h-full w-full object-cover transition duration-300 hover:scale-[1.04]" src={product.imageUrl} alt="" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">{t(language, 'imageMissing')}</div>
          )}
        </button>
        {percent > 0 && <span className={`deal-badge absolute ${onBulkToggle ? 'left-14' : 'left-3'} top-3`}>-{percent}%</span>}
        <button
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/95 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:bg-[#151D30]/90 ${isBookmarked ? 'text-sky-700 dark:text-[#DCEBFF]' : 'text-slate-500 dark:text-slate-300'}`}
          type="button"
          onClick={onToggleBookmark}
          title={isBookmarked ? t(language, 'removeBookmark') : t(language, 'bookmarkProduct')}
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="space-y-3 p-3">
        <button className="block w-full text-left" onClick={onSelect}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-base font-semibold tracking-normal text-slate-950 dark:text-white">{product.name}</h3>
            {belowThreshold && <span className="deal-badge">{t(language, 'targetPriceDrop')}</span>}
            <span className={`status-pill ${priceBadgeClass(insight.tone)}`}>{t(language, insight.badgeKey)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product.shopName}</p>
        </button>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info label={t(language, 'price')} value={formatMoney(product.currentPrice, product.currency)} />
          <Info label={t(language, 'target')} value={formatMoney(product.targetPrice, product.currency)} />
          <Info label={t(language, 'lowestHistoryPriceShort')} value={formatMoney(insight.lowestPrice, product.currency)} />
          <Info label={t(language, 'averageHistoryPriceShort')} value={formatMoney(insight.averagePrice, product.currency)} />
        </div>

        <div className="flex flex-wrap gap-2">
          {product.categoryName && <Badge>{product.categoryName}</Badge>}
          {!product.categoryName && <Badge>{t(language, 'uncategorized')}</Badge>}
          {product.size && <Badge>{t(language, 'size')} {product.size}</Badge>}
          {product.color && <Badge>{product.color}</Badge>}
          <span className={product.isAvailable ? 'status-pill status-pill-save' : 'status-pill status-pill-alert'}>{product.isAvailable ? t(language, 'available') : t(language, 'unavailable')}</span>
          <span className={product.isActive ? 'status-pill status-pill-save' : 'status-pill'}>{product.isActive ? t(language, 'monitoringOn') : t(language, 'monitoringOff')}</span>
          <span className={`status-pill ${healthPillClass(product.monitoringStatus)}`}>{healthLabel(language, product.monitoringStatus)}</span>
          {isBookmarked && <span className="status-pill bg-sky-50 text-sky-700 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]">{t(language, 'bookmarked')}</span>}
          {saved > 0 && <span className="status-pill status-pill-save">{t(language, 'savingLabel')} {formatMoney(saved, product.currency)}</span>}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button className="text-button flex-1" type="button" onClick={onSelect}>
            <Eye className="h-4 w-4" />
            {t(language, 'preview')}
          </button>
          <ProductActionsMenu
            isActive={product.isActive}
            isBookmarked={isBookmarked}
            onPreview={onSelect}
            onEdit={onEdit}
            onCheck={onCheck}
            onToggleBookmark={onToggleBookmark}
            onToggleMonitoring={onToggleMonitoring}
            onDelete={onDelete}
            language={language}
          />
        </div>
      </div>
    </article>
  );
}

function formatPercentDelta(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function CompactMetric({
  label,
  value,
  tone = 'default',
  strong = false
}: {
  label: string;
  value: string;
  tone?: 'default' | 'green' | 'red' | 'muted';
  strong?: boolean;
}) {
  const toneClass = {
    default: 'text-slate-950 dark:text-white',
    green: 'text-emerald-700 dark:text-emerald-300',
    red: 'text-rose-700 dark:text-rose-300',
    muted: 'text-slate-500 dark:text-slate-400'
  }[tone];

  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-[#0B1020]/35">
      <p className="truncate text-[11px] font-semibold uppercase tracking-normal text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-sm ${strong ? 'font-bold' : 'font-semibold'} ${toneClass}`}>{value}</p>
    </div>
  );
}
