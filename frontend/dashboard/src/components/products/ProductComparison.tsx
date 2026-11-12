import { type Language, t } from '../../i18n';
import { formatDate, formatMoney } from '../../lib/formatters';
import type { Product } from '../../types';

export function ProductComparison({ products, language, onClose }: {
  products: Product[];
  language: Language;
  onClose: () => void;
}) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const currency = product.currency.toUpperCase();
    groups.set(currency, [...(groups.get(currency) ?? []), product]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/70 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="compare-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 shadow-panel dark:bg-[#151D30]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="compare-title" className="text-lg font-semibold">{t(language, 'compareProducts')}</h2>
          <button className="text-button" type="button" onClick={onClose}>{t(language, 'close')}</button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, 'comparisonDescription')}</p>
        {[...groups.entries()].map(([currency, offers]) => {
          const eligible = offers.filter(offer => offer.isAvailable && offer.currentPrice != null && offer.monitoringStatus === 'Ok');
          const lowest = eligible.length > 1 ? Math.min(...eligible.map(offer => offer.currentPrice!)) : null;
          const sorted = [...offers].sort((a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity));
          return (
            <table key={currency} className="mt-4 w-full text-left text-sm">
              <caption className="text-left font-semibold">{currency}</caption>
              <thead><tr>
                <th scope="col" className="p-2">{t(language, 'store')}</th>
                <th scope="col" className="p-2">{t(language, 'productName')}</th>
                <th scope="col" className="p-2">{t(language, 'price')}</th>
                <th scope="col" className="p-2">{t(language, 'availability')}</th>
                <th scope="col" className="p-2">{t(language, 'lastSuccessfulCheck')}</th>
              </tr></thead>
              <tbody>{sorted.map(offer => (
                <tr key={offer.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2">{offer.shopName}</td>
                  <td className="p-2">
                    <a className="underline" href={offer.url} target="_blank" rel="noreferrer">{offer.name}</a>
                    <div className="text-xs text-slate-500">{[offer.size, offer.color].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td className="p-2">{formatMoney(offer.currentPrice, currency)}
                    {lowest !== null && eligible.includes(offer) && offer.currentPrice === lowest &&
                      <span className="block text-xs font-medium text-emerald-700 dark:text-emerald-300">{t(language, 'cheapestAvailable')}</span>}
                  </td>
                  <td className="p-2">{t(language, offer.isAvailable ? 'available' : 'unavailable')}</td>
                  <td className="p-2">{formatDate(offer.lastSuccessfulCheckAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          );
        })}
      </section>
    </div>
  );
}
