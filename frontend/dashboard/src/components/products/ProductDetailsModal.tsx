import { Activity, Bell, ClipboardList, ExternalLink, Pencil, Power, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { type Language, t } from '../../i18n';
import { formatDate, formatMoney } from '../../lib/formatters';
import { getPriceInsight, healthLabel, healthPillClass, priceBadgeClass } from '../../lib/productInsights';
import type { Product, ProductCheckLog, ProductDetail, PriceHistoryPoint } from '../../types';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { Badge, Info } from '../common/ui';
import { ProductThumb } from './ProductThumb';

type ProductDetailsModalProps = {
  product: Product;
  detail?: ProductDetail | null;
  chartData: { date: string; price: number }[];
  darkMode: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCheck: () => void;
  onToggleMonitoring: () => void;
  language: Language;
};

export function ProductDetailsModal({
  product,
  detail,
  chartData,
  darkMode,
  onClose,
  onEdit,
  onCheck,
  onToggleMonitoring,
  language
}: ProductDetailsModalProps) {
  const insight = getPriceInsight(detail?.product ?? product);
  const history = detail?.history ?? [];
  const notifications = detail?.notifications ?? [];
  const checkLogs = detail?.checkLogs ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/70 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-panel dark:border-[#28344C] dark:bg-[#151D30]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <ProductThumb product={product} />
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-xl font-semibold tracking-normal text-slate-950 dark:text-white">{product.name}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{product.shopName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.categoryName && <Badge>{product.categoryName}</Badge>}
                {product.size && <Badge>{t(language, 'size')} {product.size}</Badge>}
                {product.color && <Badge>{product.color}</Badge>}
                <Badge>{product.isAvailable ? t(language, 'available') : t(language, 'unavailable')}</Badge>
                <Badge>{product.isActive ? t(language, 'monitoringOn') : t(language, 'monitoringOff')}</Badge>
                <span className={`status-pill ${priceBadgeClass(insight.tone)}`}>{t(language, insight.badgeKey)}</span>
              </div>
            </div>
          </div>
          <button className="icon-button shrink-0" onClick={onClose} title={t(language, 'close')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Info label={t(language, 'price')} value={formatMoney(product.currentPrice, product.currency)} />
              <Info label={t(language, 'target')} value={formatMoney(product.targetPrice, product.currency)} />
              <Info label={t(language, 'basePrice')} value={formatMoney(product.basePrice, product.currency)} />
              <Info label={t(language, 'lastCheckedShort')} value={formatDate(product.lastCheckedAt)} />
              <Info label={t(language, 'lowestHistoryPriceShort')} value={formatMoney(insight.lowestPrice, product.currency)} />
              <Info label={t(language, 'averageHistoryPriceShort')} value={formatMoney(insight.averagePrice, product.currency)} />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-[#28344C] dark:bg-[#0B1020]/35">
              <div className="flex items-start justify-between gap-3">
                <span className={`status-pill ${healthPillClass(product.monitoringStatus)}`}>
                  <Activity className="mr-1 h-3 w-3" />
                  {healthLabel(language, product.monitoringStatus)}
                </span>
                <button className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700 dark:border-[#3F4B68] dark:bg-[#20283C] dark:text-[#F5F7FB] dark:hover:border-[#8B6CF6]" type="button" onClick={onCheck}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t(language, 'check')}
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{product.lastCheckMessage ?? t(language, 'monitorHealthUnknown')}</p>
              {product.lastCheckError && (
                <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/15 dark:text-rose-100">{product.lastCheckError}</p>
              )}
              <div className="mt-2 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{t(language, 'checkSource')}: {product.lastCheckSource ?? '-'}</span>
                <span>{t(language, 'lastSuccessfulCheck')}: {formatDate(product.lastSuccessfulCheckAt)}</span>
              </div>
            </section>

            {product.note && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-[#151D30] dark:text-slate-300">
                {product.note}
              </div>
            )}

            <div className="grid gap-2">
              <button className="text-button w-full" type="button" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                {t(language, 'edit')}
              </button>
              <button className="text-button w-full" type="button" onClick={onEdit}>
                <SlidersHorizontal className="h-4 w-4" />
                {t(language, 'editPriceSelector')}
              </button>
              <button className="text-button w-full" type="button" onClick={onCheck}>
                <RefreshCw className="h-4 w-4" />
                {t(language, 'checkNow')}
              </button>
              <button className="text-button w-full" type="button" onClick={onToggleMonitoring}>
                <Power className="h-4 w-4" />
                {product.isActive ? t(language, 'turnMonitoringOff') : t(language, 'turnMonitoringOn')}
              </button>
              <a className="soft-primary-button w-full" href={product.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t(language, 'openStore')}
              </a>
            </div>
          </aside>

          <div className="space-y-4">
            <PriceHistoryPanel selectedProduct={product} chartData={chartData} darkMode={darkMode} language={language} />
            <AvailabilityHistoryPanel history={history} language={language} />
            <AlertLogPanel notifications={notifications} language={language} />
            <CheckLogPanel logs={checkLogs} language={language} />
          </div>
        </div>
      </section>
    </div>
  );
}

function PriceHistoryPanel({ selectedProduct, chartData, darkMode, language }: { selectedProduct?: Product; chartData: { date: string; price: number }[]; darkMode: boolean; language: Language }) {
  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">{t(language, 'priceHistory')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedProduct?.name ?? t(language, 'noProduct')}</p>
        </div>
        {selectedProduct && (
          <a className="icon-button" href={selectedProduct.url} target="_blank" rel="noreferrer" title={t(language, 'openStore')}>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      <div className="h-80">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={darkMode ? '#28344C' : '#e2e8f0'} strokeDasharray="4 4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#8b7cff" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 dark:border-[#28344C] dark:text-slate-400">
            {t(language, 'noPriceHistory')}
          </div>
        )}
      </div>
    </section>
  );
}

function AvailabilityHistoryPanel({ history, language }: { history: PriceHistoryPoint[]; language: Language }) {
  const rows = [...history].slice(-10).reverse();
  const total = history.length;

  return (
    <CollapsibleSection
      title={t(language, 'availabilityHistory')}
      icon={<Activity className="h-4 w-4" />}
      defaultOpen={false}
      actions={<span className="status-pill">{Math.min(rows.length, 10)}/{total}</span>}
      contentClassName="max-h-80 overflow-y-auto pr-1"
    >
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, 'noData')}</p>
        ) : rows.map((row) => (
          <div key={`${row.checkedAt}-${row.source}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm dark:bg-[#0B1020]/35">
            <span className={row.isAvailable ? 'status-text-green' : 'status-text-red'}>
              {row.isAvailable ? t(language, 'available') : t(language, 'unavailable')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(row.checkedAt)}</span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function AlertLogPanel({ notifications, language }: { notifications: ProductDetail['notifications']; language: Language }) {
  const rows = notifications.slice(0, 10);
  const total = notifications.length;

  return (
    <CollapsibleSection
      title={t(language, 'alertLog')}
      icon={<Bell className="h-4 w-4" />}
      defaultOpen={false}
      actions={<span className="status-pill">{Math.min(rows.length, 10)}/{total}</span>}
      contentClassName="max-h-80 overflow-y-auto pr-1"
    >
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, 'alertHistoryEmpty')}</p>
        ) : rows.map((notification) => (
          <div key={notification.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm dark:bg-[#0B1020]/35">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{notification.type}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(notification.sentAt)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{notification.channel}: {notification.message}</p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function CheckLogPanel({ logs, language }: { logs: ProductCheckLog[]; language: Language }) {
  const rows = logs.slice(0, 10);
  const total = logs.length;

  return (
    <CollapsibleSection
      title={t(language, 'monitoringLogs')}
      icon={<ClipboardList className="h-4 w-4" />}
      defaultOpen={false}
      actions={<span className="status-pill">{Math.min(rows.length, 10)}/{total}</span>}
      contentClassName="max-h-80 overflow-y-auto pr-1"
    >
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, 'noMonitoringLogs')}</p>
        ) : rows.map((log) => (
          <div key={log.id} className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm dark:border-[#28344C] dark:bg-[#0B1020]/35 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <span className={`status-pill ${healthPillClass(log.status)}`}>{healthLabel(language, log.status)}</span>
            <div className="min-w-0">
              <p className="font-semibold">{log.message}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{log.details ?? log.source}</p>
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <p>{formatDate(log.checkedAt)}</p>
              <p>{log.price ? formatMoney(log.price, 'PLN') : '-'}</p>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
