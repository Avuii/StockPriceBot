type ExtractedProduct = {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  categoryName?: string;
  size?: string;
  color?: string;
  sizeOptions?: string[];
  colorOptions?: string[];
  url: string;
  shopName: string;
  isAvailable?: boolean;
  priceSelector?: string;
  stockSelector?: string;
};

var stockPriceBotContentWindow = window as typeof window & {
  __stockPriceBotMessageListener?: Parameters<typeof chrome.runtime.onMessage.addListener>[0];
  __stockPriceBotPricePickerCleanup?: () => void;
};

if (stockPriceBotContentWindow.__stockPriceBotMessageListener) {
  try {
    chrome.runtime.onMessage.removeListener(stockPriceBotContentWindow.__stockPriceBotMessageListener);
  } catch {
    // The previous extension context may have been invalidated after reload.
  }
}

stockPriceBotContentWindow.__stockPriceBotMessageListener = (message, _sender, sendResponse) => {
  if (message?.type === 'EXTRACT_PRODUCT') {
    try {
      sendResponse(extractProduct());
    } catch {
      sendResponse(fallbackProduct());
    }
    return true;
  }

  if (message?.type === 'PICK_PRICE') {
    try {
      startPricePicker();
      sendResponse({ picking: true });
    } catch {
      sendResponse({});
    }
    return true;
  }

  return false;
};

chrome.runtime.onMessage.addListener(stockPriceBotContentWindow.__stockPriceBotMessageListener);

function extractProduct(): ExtractedProduct {
  const jsonLd = readJsonLdProduct();
  const meta = readMetaProduct();
  const dom = readDomProduct();
  const description = jsonLd.description ?? meta.description ?? dom.description;

  return {
    name: jsonLd.name ?? meta.name ?? dom.name ?? document.title,
    description: description ? trimLongText(description, 1000) : undefined,
    price: jsonLd.price ?? meta.price ?? dom.price,
    currency: jsonLd.currency ?? meta.currency ?? dom.currency ?? 'PLN',
    imageUrl: jsonLd.imageUrl ?? meta.imageUrl ?? dom.imageUrl,
    categoryName: jsonLd.categoryName ?? meta.categoryName ?? dom.categoryName,
    size: jsonLd.size ?? meta.size ?? dom.size,
    color: jsonLd.color ?? meta.color ?? dom.color,
    sizeOptions: dom.sizeOptions,
    colorOptions: dom.colorOptions,
    url: location.href,
    shopName: location.hostname.replace(/^www\./, ''),
    isAvailable: jsonLd.isAvailable ?? meta.isAvailable ?? dom.isAvailable ?? true,
    priceSelector: dom.priceSelector,
    stockSelector: dom.stockSelector
  };
}

function fallbackProduct(): ExtractedProduct {
  return {
    name: cleanText(document.title) ?? location.hostname.replace(/^www\./, ''),
    url: location.href,
    shopName: location.hostname.replace(/^www\./, ''),
    currency: 'PLN',
    isAvailable: true
  };
}

function readJsonLdProduct(): Partial<ExtractedProduct> {
  for (const script of Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'))) {
    try {
      const parsed = JSON.parse(script.textContent ?? '') as unknown;
      const product = findProductNode(parsed);
      if (!product) {
        continue;
      }

      const offers = product.offers;
      const offer = Array.isArray(offers) ? objectValue(offers[0]) : objectValue(offers);

      return {
        name: cleanText(product.name),
        description: cleanText(product.description),
        imageUrl: imageFromJsonLd(product.image),
        categoryName: cleanText(product.category),
        size: cleanText(product.size),
        color: cleanText(product.color),
        price: parsePrice(offer?.price ?? offer?.lowPrice),
        currency: cleanText(offer?.priceCurrency),
        isAvailable: offer?.availability ? !String(offer.availability).toLowerCase().includes('outofstock') : undefined
      };
    } catch {
      continue;
    }
  }

  return {};
}

function findProductNode(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProductNode(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const type = candidate['@type'];
  if (String(Array.isArray(type) ? type.join(',') : type).toLowerCase().includes('product')) {
    return candidate;
  }

  for (const child of Object.values(candidate)) {
    const found = findProductNode(child);
    if (found) {
      return found;
    }
  }

  return null;
}

function readMetaProduct(): Partial<ExtractedProduct> {
  const price = meta('product:price:amount') ?? meta('og:price:amount') ?? meta('price');
  const availability = meta('product:availability') ?? meta('availability');

  return {
    name: meta('og:title') ?? meta('twitter:title') ?? undefined,
    description: meta('description') ?? meta('og:description') ?? meta('twitter:description') ?? undefined,
    imageUrl: meta('og:image') ?? meta('twitter:image') ?? undefined,
    categoryName: meta('product:category') ?? meta('article:section') ?? undefined,
    size: meta('product:size') ?? undefined,
    color: meta('product:color') ?? undefined,
    price: parsePrice(price),
    currency: meta('product:price:currency') ?? meta('og:price:currency') ?? undefined,
    isAvailable: availability ? !availability.toLowerCase().includes('out') : undefined
  };
}

function readDomProduct(): Partial<ExtractedProduct> {
  const priceElement = findPriceElement();
  const stockElement = findStockElement();
  const stockText = document.body.innerText.toLowerCase();
  const sizeInfo = findVariantInfo({
    keywords: ['size', 'rozmiar'],
    optionPattern: /^(xxs|xs|s|m|l|xl|xxl|xxxl|xxxxl|one size|onesize|uni|universal|os|\d{1,3}(?:[.,]5)?|\d{1,3}\s?[-/x]\s?\d{1,3}|w?\d{1,3}\s?l?\d{1,3})$/i
  });
  const colorInfo = findVariantInfo({
    keywords: ['color', 'colour', 'kolor', 'barwa'],
    optionPattern: /^[a-ząćęłńóśźż\s/-]{3,40}$/i
  });

  return {
    name: textFromSelectors(['h1', '[data-testid*="name" i]', '[class*="product-name" i]', '[class*="productName" i]']),
    description: textFromSelectors([
      '[itemprop="description"]',
      '[data-testid*="description" i]',
      '[class*="description" i]',
      '[class*="opis" i]'
    ]),
    imageUrl: findProductImage(),
    categoryName: readBreadcrumbCategory(),
    size: sizeInfo.selected,
    color: colorInfo.selected,
    sizeOptions: sizeInfo.options,
    colorOptions: colorInfo.options,
    price: parsePrice(priceElement?.getAttribute('content') ?? priceElement?.getAttribute('data-price') ?? priceElement?.textContent),
    currency: detectCurrency(priceElement?.textContent),
    isAvailable: !/(niedost[e\u0119]pny|brak w magazynie|out of stock|sold out)/i.test(stockText),
    priceSelector: priceElement ? cssSelector(priceElement) : undefined,
    stockSelector: stockElement ? cssSelector(stockElement) : undefined
  };
}

function findPriceElement(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>([
    '[itemprop="price"]',
    '[data-price]',
    '[class*="price" i]',
    '[class*="cena" i]',
    '[data-testid*="price" i]',
    '[aria-label*="price" i]',
    '[aria-label*="cena" i]'
  ].join(',')));

  return candidates
    .map((element) => ({
      element,
      price: parsePrice(element.getAttribute('content') ?? element.getAttribute('data-price') ?? element.textContent)
    }))
    .filter((candidate) => candidate.price !== undefined)
    .sort((left, right) => textLength(left.element) - textLength(right.element))[0]?.element ?? null;
}

function findStockElement(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>([
    '[itemprop="availability"]',
    '[class*="availability" i]',
    '[class*="stock" i]',
    '[class*="dostep" i]',
    '[data-testid*="availability" i]',
    '[data-testid*="stock" i]',
    '[aria-label*="availability" i]',
    '[aria-label*="dost" i]'
  ].join(',')));

  return candidates.find((element) => /(dost[e\u0119]pny|niedost[e\u0119]pny|stock|available|sold out|brak)/i.test(element.textContent ?? '')) ?? null;
}

function findProductImage(): string | undefined {
  const selectors = [
    'main [itemprop="image"]',
    'main picture img',
    'main img[alt]',
    '[data-testid*="image" i] img',
    '[class*="gallery" i] img',
    '[class*="product" i] img',
    'img'
  ];

  for (const selector of selectors) {
    const image = document.querySelector<HTMLImageElement>(selector);
    const src = image?.currentSrc || image?.src;
    if (src && !src.startsWith('data:')) {
      return src;
    }
  }

  return undefined;
}

function readBreadcrumbCategory(): string | undefined {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>([
    'nav[aria-label*="breadcrumb" i] a',
    '[class*="breadcrumb" i] a',
    '[data-testid*="breadcrumb" i] a',
    '[itemtype*="BreadcrumbList"] [itemprop="name"]'
  ].join(',')))
    .map((element) => cleanText(element.textContent))
    .filter((value): value is string => Boolean(value && value.length > 1));

  if (candidates.length === 0) {
    return undefined;
  }

  return candidates[Math.max(0, candidates.length - 2)] ?? candidates[candidates.length - 1];
}

type VariantInfo = {
  selected?: string;
  options: string[];
};

type VariantConfig = {
  keywords: string[];
  optionPattern: RegExp;
};

function findVariantInfo(config: VariantConfig): VariantInfo {
  const direct = findDirectVariantValue(config.keywords);
  const native = readNativeSelectVariant(config);
  const containers = findVariantContainers(config.keywords);
  const containerOptions = containers.flatMap((container) => readVariantControls(container, config));
  const pageSelected = findSelectedVariantControls(config);
  const options = uniqueStrings([
    ...native.options,
    ...containerOptions.map((option) => option.value),
    ...pageSelected.map((option) => option.value)
  ]).slice(0, 40);

  const selected = direct
    ?? native.selected
    ?? containerOptions.find((option) => option.selected)?.value
    ?? pageSelected.find((option) => option.selected)?.value;

  return {
    selected: selected && isUsableVariant(selected, config) ? selected : undefined,
    options
  };
}

function readNativeSelectVariant(config: VariantConfig): VariantInfo {
  const select = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
    .find((item) => matchesAnyKeyword(`${item.name} ${item.id} ${item.getAttribute('aria-label') ?? ''} ${item.closest('label')?.textContent ?? ''}`, config.keywords));

  if (!select) {
    return { options: [] };
  }

  const options = Array.from(select.options)
    .map((option) => cleanVariant(option.textContent ?? option.value, config.keywords))
    .filter((value): value is string => Boolean(value && isUsableVariant(value, config)));

  return {
    selected: cleanVariant(select.selectedOptions[0]?.textContent ?? select.value, config.keywords),
    options: uniqueStrings(options)
  };
}

function findDirectVariantValue(keywords: string[]): string | undefined {
  const text = document.body.innerText.replace(/\u00a0/g, ' ');
  for (const keyword of keywords) {
    const escaped = escapeRegExp(keyword);
    const patterns = [
      new RegExp(`${escaped}\\s*[:\\-]\\s*([^\\n|,;]{1,50})`, 'i'),
      new RegExp(`wybrany\\s+${escaped}\\s*[:\\-]?\\s*([^\\n|,;]{1,50})`, 'i'),
      new RegExp(`selected\\s+${escaped}\\s*[:\\-]?\\s*([^\\n|,;]{1,50})`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      const value = cleanVariant(match?.[1], keywords);
      if (value) {
        return value;
      }
    }
  }

  return undefined;
}

function findVariantContainers(keywords: string[]): HTMLElement[] {
  const selector = [
    'fieldset',
    'section',
    'form',
    '[role="radiogroup"]',
    '[role="listbox"]',
    '[class*="size" i]',
    '[class*="rozmiar" i]',
    '[class*="color" i]',
    '[class*="kolor" i]',
    '[aria-label*="size" i]',
    '[aria-label*="rozmiar" i]',
    '[aria-label*="color" i]',
    '[aria-label*="kolor" i]',
    '[data-testid*="size" i]',
    '[data-testid*="rozmiar" i]',
    '[data-testid*="color" i]',
    '[data-testid*="kolor" i]',
    '[data-test*="size" i]',
    '[data-test*="rozmiar" i]',
    '[data-test*="color" i]',
    '[data-test*="kolor" i]',
    '[data-cy*="size" i]',
    '[data-cy*="rozmiar" i]',
    '[data-cy*="color" i]',
    '[data-cy*="kolor" i]'
  ].join(',');

  const containers = Array.from(document.querySelectorAll<HTMLElement>(selector))
    .filter((element) => matchesAnyKeyword(describeElement(element), keywords));

  const labelledContainers = Array.from(document.querySelectorAll<HTMLElement>('label, legend, h2, h3, h4, p, span, div'))
    .filter((element) => {
      const text = cleanText(element.textContent);
      return Boolean(text && text.length < 80 && matchesAnyKeyword(text, keywords));
    })
    .map((element) => findUsefulVariantContainer(element))
    .filter((element): element is HTMLElement => Boolean(element));

  return uniqueElements([...containers, ...labelledContainers]).slice(0, 8);
}

function readVariantControls(root: ParentNode, config: VariantConfig) {
  return Array.from(root.querySelectorAll<HTMLElement>('button, a, li, option, label, input, [role="button"], [role="radio"], [role="option"], [data-value], [data-size], [data-testid], [data-test], [data-cy], [data-qa], [aria-label], [title]'))
    .map((element) => ({
      value: cleanVariant(valueFromVariantElement(element), config.keywords),
      selected: isSelectedVariantElement(element)
    }))
    .filter((option): option is { value: string; selected: boolean } => Boolean(option.value && isUsableVariant(option.value, config)));
}

function findSelectedVariantControls(config: VariantConfig) {
  const selector = [
    '[aria-checked="true"]',
    '[aria-selected="true"]',
    '[aria-pressed="true"]',
    '[data-selected="true"]',
    '[data-state="checked"]',
    '[class*="selected" i]',
    '[class*="active" i]',
    'input:checked'
  ].join(',');

  return Array.from(document.querySelectorAll<HTMLElement>(selector))
    .filter((element) => nearbyTextMatches(element, config.keywords))
    .map((element) => ({
      value: cleanVariant(valueFromVariantElement(element), config.keywords),
      selected: true
    }))
    .filter((option): option is { value: string; selected: boolean } => Boolean(option.value && isUsableVariant(option.value, config)));
}

function valueFromVariantElement(element: HTMLElement): string | undefined {
  if (element instanceof HTMLInputElement) {
    const label = element.labels?.[0]?.textContent
      ?? element.closest('label')?.textContent
      ?? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(element.id)}"]`)?.textContent;
    return cleanText(label ?? element.value);
  }

  return cleanText(
    element.getAttribute('aria-label')
    ?? element.getAttribute('title')
    ?? element.getAttribute('data-size')
    ?? element.getAttribute('data-option-value')
    ?? element.getAttribute('data-value')
    ?? element.getAttribute('value')
    ?? element.textContent
  );
}

function isSelectedVariantElement(element: HTMLElement) {
  if (element instanceof HTMLInputElement) {
    return element.checked;
  }

  const className = element.className?.toString().toLowerCase() ?? '';
  return element.getAttribute('aria-checked') === 'true'
    || element.getAttribute('aria-selected') === 'true'
    || element.getAttribute('aria-pressed') === 'true'
    || element.getAttribute('data-selected') === 'true'
    || element.getAttribute('data-state') === 'checked'
    || /\b(selected|active|checked|current)\b/i.test(className);
}

function isUsableVariant(value: string, config: VariantConfig) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 45) {
    return false;
  }

  if (/wybierz|select|rozmiar|size|kolor|color|dost[eę]p|niedost[eę]p|dodaj|koszyk|sprawd/i.test(normalized)) {
    return false;
  }

  if (/^\d{3}$/.test(normalized) && Number(normalized) > 200) {
    return false;
  }

  return config.optionPattern.test(normalized);
}

function findUsefulVariantContainer(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.closest('fieldset, section, form, [role="radiogroup"], [role="listbox"], div, li');

  for (let depth = 0; current && depth < 4; depth += 1) {
    if (current.querySelector('button, [role="button"], [role="radio"], [role="option"], option, input, [data-value], [data-size]')) {
      return current;
    }
    current = current.parentElement;
  }

  return element.parentElement;
}

function nearbyTextMatches(element: HTMLElement, keywords: string[]) {
  const text = [
    describeElement(element),
    element.closest('fieldset, section, form, div, li')?.textContent ?? '',
    element.parentElement?.textContent ?? ''
  ].join(' ');

  return matchesAnyKeyword(text, keywords);
}

function describeElement(element: Element) {
  return [
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
    element.getAttribute('data-testid'),
    element.getAttribute('data-test'),
    element.getAttribute('data-cy'),
    element.getAttribute('data-qa'),
    element.getAttribute('data-value'),
    element.getAttribute('data-size'),
    element.getAttribute('name'),
    element.getAttribute('id'),
    element.className?.toString(),
    element.textContent
  ].filter(Boolean).join(' ');
}

function matchesAnyKeyword(value: string | undefined, keywords: string[]) {
  const normalized = (value ?? '').toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function uniqueElements<T extends Element>(elements: T[]) {
  return Array.from(new Set(elements));
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanVariant(value: unknown, keywords: string[]) {
  const normalized = cleanText(value);
  if (!normalized) {
    return undefined;
  }

  const cleaned = keywords.reduce(
    (current, keyword) => current.replace(new RegExp(keyword, 'ig'), ''),
    normalized
  )
    .replace(/wybrany|selected|rozmiar|kolor|color|size/ig, '')
    .replace(/dost[e\u0119]pny|niedost[e\u0119]pny|available|unavailable|out of stock|sold out|brak w magazynie|ostatnie sztuki/ig, '')
    .replace(/[:,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || normalized;
}

function textFromSelectors(selectors: string[]) {
  for (const selector of selectors) {
    const value = cleanText(document.querySelector<HTMLElement>(selector)?.textContent);
    if (value) {
      return trimLongText(value, 700);
    }
  }

  return undefined;
}

function startPricePicker() {
  let current: HTMLElement | null = null;
  stockPriceBotContentWindow.__stockPriceBotPricePickerCleanup?.();

  const move = (event: MouseEvent) => {
    current?.style.removeProperty('outline');
    current = event.target as HTMLElement;
    current.style.outline = '3px solid #8b5cf6';
    current.style.outlineOffset = '3px';
  };

  const click = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    cleanup();
    const element = event.target as HTMLElement;
    const picked = readPickedPrice(element);
    try {
      chrome.runtime.sendMessage({ type: 'PRICE_PICKED', payload: picked }, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      // The popup can be closed while the user is picking. The background will handle it when available.
    }
  };

  const cleanup = () => {
    current?.style.removeProperty('outline');
    current?.style.removeProperty('outline-offset');
    document.removeEventListener('mousemove', move, true);
    document.removeEventListener('click', click, true);
    stockPriceBotContentWindow.__stockPriceBotPricePickerCleanup = undefined;
  };

  stockPriceBotContentWindow.__stockPriceBotPricePickerCleanup = cleanup;
  document.addEventListener('mousemove', move, true);
  document.addEventListener('click', click, true);
}

function readPickedPrice(element: HTMLElement): Partial<ExtractedProduct> {
  const candidates = elementCandidates(element);
  const fallbackSelector = cssSelector(element);

  for (const candidate of candidates) {
    const text = priceText(candidate);
    const price = parsePrice(text);
    if (price !== undefined) {
      return {
        price,
        currency: detectCurrency(text) ?? 'PLN',
        priceSelector: cssSelector(candidate),
        url: location.href,
        shopName: location.hostname.replace(/^www\./, '')
      };
    }
  }

  return {
    currency: 'PLN',
    priceSelector: fallbackSelector,
    url: location.href,
    shopName: location.hostname.replace(/^www\./, '')
  };
}

function elementCandidates(element: HTMLElement) {
  const candidates: HTMLElement[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body && candidates.length < 5) {
    candidates.push(current);
    current = current.parentElement;
  }

  return candidates;
}

function priceText(element: HTMLElement) {
  return [
    element.getAttribute('content'),
    element.getAttribute('data-price'),
    element.getAttribute('data-value'),
    element.getAttribute('aria-label'),
    element.textContent
  ].map((value) => value ?? '').join(' ');
}

function meta(name: string): string | undefined {
  return document
    .querySelector<HTMLMetaElement>(`meta[property="${name}"], meta[name="${name}"]`)
    ?.content
    ?.trim();
}

function parsePrice(value: unknown): number | undefined {
  const text = String(value ?? '').replace(/\u00a0/g, ' ');
  const matches = text.match(/\d[\d\s.,]*/g);
  if (!matches) {
    return undefined;
  }

  for (const match of matches) {
    const parsed = normalizeNumber(match);
    if (parsed !== undefined && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeNumber(value: string): number | undefined {
  let normalized = value.replace(/\s/g, '');
  if (!normalized) {
    return undefined;
  }

  const comma = normalized.lastIndexOf(',');
  const dot = normalized.lastIndexOf('.');
  if (comma > -1 && dot > -1) {
    normalized = comma > dot
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '');
  } else if (comma > -1) {
    normalized = normalized.replace(',', '.');
  } else if (dot > -1 && normalized.length - dot - 1 > 2) {
    normalized = normalized.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function detectCurrency(value: unknown): string | undefined {
  const valueText = String(value ?? '').toUpperCase();
  if (valueText.includes('EUR') || valueText.includes('\u20ac')) {
    return 'EUR';
  }
  if (valueText.includes('USD') || valueText.includes('$')) {
    return 'USD';
  }
  if (valueText.includes('PLN') || valueText.includes('Z\u0141') || valueText.includes('ZL')) {
    return 'PLN';
  }
  return undefined;
}

function cssSelector(element: Element): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const className = Array.from(element.classList).find(Boolean);
  if (className) {
    return `${element.tagName.toLowerCase()}.${CSS.escape(className)}`;
  }

  return element.tagName.toLowerCase();
}

function imageFromJsonLd(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return imageFromJsonLd(value[0]);
  }

  const object = objectValue(value);
  return cleanText(object?.url);
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function cleanText(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized || undefined;
}

function trimLongText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value;
}

function textLength(element: HTMLElement) {
  const length = element.innerText?.trim().length ?? element.textContent?.trim().length ?? 999;
  return length || 999;
}
