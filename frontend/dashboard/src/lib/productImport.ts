import { t, type Language } from '../i18n';
import type { CreateProductRequest, Product } from '../types';

export const maxImportRows = 200;
export const maxImportCharacters = 512_000;

type Fields = Pick<CreateProductRequest, 'url' | 'name' | 'shopName' | 'currency'> &
  Partial<Pick<CreateProductRequest, 'categoryName' | 'currentPrice' | 'targetPrice' | 'size' | 'color' | 'isAvailable' | 'isActive'>>;
type Issue = 'importInvalidUrl' | 'importInvalidPrice' | 'importInvalidCurrency' | 'importDuplicate';
export type ImportRow = { row: number; product?: Fields; issue?: Issue };

const columns = {
  name: 'productName', shopName: 'store', categoryName: 'category', currentPrice: 'price',
  targetPrice: 'target', size: 'size', color: 'color', currency: 'currency',
  isAvailable: 'availability', isActive: 'monitoring'
} as const;

function readCsv(text: string, delimiter: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  let closed = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else {
        value += char;
      }
    } else if (char === delimiter || char === '\n') {
      row.push(value.trim());
      value = '';
      closed = false;
      if (char === '\n') {
        rows.push(row);
        row = [];
      }
    } else if (char === '"' && !value && !closed) {
      quoted = true;
    } else if (!closed || /\s/.test(char)) {
      value += char;
    } else {
      return null;
    }
  }

  if (quoted) return null;
  rows.push([...row, value.trim()]);
  return rows;
}

function parseAmount(value?: string): number | undefined {
  if (!value) return undefined;
  const amount = value.replace(/[ \u00a0\u202f]/g, '').replace(',', '.');
  return /^\d{1,12}(?:\.\d{1,2})?$/.test(amount) ? Number(amount) : NaN;
}

function urlKey(value: string) {
  const url = new URL(value);
  url.hash = '';
  return url.href;
}

export function importProductKey(product: Pick<Product, 'url' | 'size' | 'color'>) {
  return JSON.stringify([urlKey(product.url), product.size?.trim().toLowerCase() || '', product.color?.trim().toLowerCase() || '']);
}

export function parseProductImport(input: string, existing: Product[], importedKeys: string[] = []): { rows: ImportRow[]; issue?: 'importTooLarge' | 'importInvalidCsv' } {
  if (input.length > maxImportCharacters) return { rows: [], issue: 'importTooLarge' };
  const text = input.replace(/^\uFEFF/, '').trim().replace(/\r\n?/g, '\n');
  if (!text) return { rows: [] };

  const firstLine = text.split('\n', 1)[0];
  const delimiter = [';', ',', '\t'].find(candidate => firstLine.split(candidate)
    .some(cell => cell.trim().replace(/^"|"$/g, '').toLowerCase() === 'url'));
  const headerOnly = /^"?url"?$/i.test(firstLine.trim());
  const csv = delimiter || headerOnly ? readCsv(text, delimiter ?? ',') : null;
  if ((delimiter || headerOnly) && !csv) return { rows: [], issue: 'importInvalidCsv' };

  const headers = csv?.[0].map(value => value.toLowerCase()) ?? [];
  const source = csv ? csv.slice(1) : text.split(/\s+/).map(url => [url]);
  if (source.length > maxImportRows) return { rows: [], issue: 'importTooLarge' };
  const imported = new Set(importedKeys);
  const seen = new Set(existing.flatMap(product => {
    try { return [importProductKey(product)]; } catch { return []; }
  }));

  const rows = source.flatMap((cells, index): ImportRow[] => {
    if (!cells.some(Boolean)) return [];
    const row = index + (csv ? 2 : 1);
    const value = (field: keyof typeof columns) => {
      const labels = [field.toLowerCase(), ...(['en', 'pl'] as Language[]).map(language => t(language, columns[field]).toLowerCase())];
      return cells[headers.findIndex(header => labels.includes(header))] || undefined;
    };
    let url: URL;
    try {
      url = new URL(cells[csv ? headers.indexOf('url') : 0] ?? '');
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || url.href.length > 2048) {
        return [{ row, issue: 'importInvalidUrl' }];
      }
    } catch {
      return [{ row, issue: 'importInvalidUrl' }];
    }
    const currentPrice = parseAmount(value('currentPrice'));
    const targetPrice = parseAmount(value('targetPrice'));
    if (Number.isNaN(currentPrice) || Number.isNaN(targetPrice)) return [{ row, issue: 'importInvalidPrice' }];
    const currency = value('currency')?.toUpperCase() ?? 'PLN';
    if (!/^[A-Z]{3}$/.test(currency)) return [{ row, issue: 'importInvalidCurrency' }];

    const flag = (raw: string | undefined, yes: 'available' | 'active', no: 'unavailable' | 'inactive') => {
      const normalized = raw?.toLowerCase();
      if (!normalized) return undefined;
      if (['true', t('en', yes).toLowerCase(), t('pl', yes).toLowerCase()].includes(normalized)) return true;
      if (['false', t('en', no).toLowerCase(), t('pl', no).toLowerCase()].includes(normalized)) return false;
      return undefined;
    };
    const shop = url.hostname.replace(/^www\./, '');
    const product: Fields = {
      url: urlKey(url.href), name: value('name') ?? shop, shopName: value('shopName') ?? shop,
      currency, categoryName: value('categoryName'), currentPrice, targetPrice,
      size: value('size'), color: value('color'), isAvailable: flag(value('isAvailable'), 'available', 'unavailable'),
      isActive: flag(value('isActive'), 'active', 'inactive')
    };
    const key = importProductKey(product);
    if (imported.has(key)) return [];
    if (seen.has(key)) return [{ row, issue: 'importDuplicate' }];
    seen.add(key);
    return [{ row, product }];
  });
  return { rows };
}
