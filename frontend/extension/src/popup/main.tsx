import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Apple,
  Armchair,
  AudioLines,
  Backpack,
  Baby,
  Bath,
  Bed,
  Beef,
  Beer,
  BicepsFlexed,
  Bike,
  Bird,
  Blinds,
  Bone,
  Book,
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  BriefcaseMedical,
  Brush,
  Building,
  Bus,
  Cake,
  CakeSlice,
  Camera,
  Car,
  CarFront,
  Carrot,
  Cat,
  ChefHat,
  Check,
  Cherry,
  ChevronDown,
  ChevronUp,
  Church,
  Clapperboard,
  Coffee,
  Cookie,
  CookingPot,
  Crosshair,
  Crown,
  Dog,
  Drill,
  Dumbbell,
  EyeClosed,
  Fish,
  Flame,
  Flower,
  Flower2,
  FolderPlus,
  Footprints,
  Gamepad2,
  Gem,
  Gift,
  Globe2,
  Glasses,
  GraduationCap,
  Guitar,
  HandHeart,
  HandHelping,
  Hammer,
  Headphones,
  Heart,
  Home,
  Hotel,
  KeyRound,
  Laptop,
  Lamp,
  Leaf,
  Library,
  Landmark,
  Map,
  Mic,
  Microwave,
  Milk,
  Monitor,
  MonitorSmartphone,
  Music,
  Paintbrush,
  Palette,
  Paperclip,
  PawPrint,
  PenTool,
  PersonStanding,
  Piano,
  Pill,
  Pipette,
  Plane,
  Plug,
  Plus,
  Puzzle,
  Rabbit,
  RefreshCw,
  Receipt,
  Refrigerator,
  RockingChair,
  Rocket,
  Ruler,
  Salad,
  Sandwich,
  Scissors,
  Settings,
  Shield,
  Shirt,
  ShowerHead,
  ShoppingBag,
  Smile,
  Sofa,
  Soup,
  Sparkles,
  Sprout,
  Stethoscope,
  Tag,
  Tent,
  TestTube,
  Ticket,
  TrainFront,
  Truck,
  Trophy,
  Tv,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  Video,
  Volleyball,
  WashingMachine,
  Watch,
  Wine,
  Wrench,
  X
} from 'lucide-react';
import './styles.css';

const ignoredExtensionErrorPatterns = [
  'Receiving end does not exist',
  'Could not establish connection',
  'The message port closed before a response was received',
  'Extension context invalidated'
];
const pendingPickedPriceKey = 'pendingPickedPrice';

window.addEventListener('unhandledrejection', (event) => {
  if (isIgnoredExtensionError(event.reason)) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (isIgnoredExtensionError(event.error ?? event.message)) {
    event.preventDefault();
  }
});

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

type PopupStatus = 'idle' | 'extracting' | 'picking' | 'extracted' | 'saving' | 'saved' | 'error';
type Language = 'pl' | 'en';
type MessageResult = { ok: true; response: unknown } | { ok: false; error: Error };

type PendingPickedPrice = Partial<ExtractedProduct> & {
  sourceTabId?: number;
  pickedAt?: number;
};

type PricePickedRuntimeMessage = {
  type?: string;
  payload?: PendingPickedPrice;
};

type Category = {
  id: string;
  name: string;
  iconName?: string | null;
  colorHex?: string | null;
  productCount: number;
};

const categoryIconOptions = [
  { name: 'Shirt', label: 'Ubrania', Icon: Shirt },
  { name: 'Footprints', label: 'Buty', Icon: Footprints },
  { name: 'ShoppingBag', label: 'Torby i zakupy', Icon: ShoppingBag },
  { name: 'Backpack', label: 'Plecaki', Icon: Backpack },
  { name: 'Gem', label: 'Bizuteria', Icon: Gem },
  { name: 'Watch', label: 'Akcesoria', Icon: Watch },
  { name: 'Glasses', label: 'Okulary', Icon: Glasses },
  { name: 'Ruler', label: 'Rozmiary i krawiectwo', Icon: Ruler },
  { name: 'Scissors', label: 'Krawiectwo', Icon: Scissors },
  { name: 'Laptop', label: 'Elektronika', Icon: Laptop },
  { name: 'Monitor', label: 'Monitory', Icon: Monitor },
  { name: 'Tv', label: 'TV i wideo', Icon: Tv },
  { name: 'Plug', label: 'Akcesoria elektryczne', Icon: Plug },
  { name: 'MonitorSmartphone', label: 'Gadzety', Icon: MonitorSmartphone },
  { name: 'Headphones', label: 'Audio', Icon: Headphones },
  { name: 'AudioLines', label: 'Dzwiek', Icon: AudioLines },
  { name: 'Gamepad2', label: 'Gaming', Icon: Gamepad2 },
  { name: 'Video', label: 'Wideo', Icon: Video },
  { name: 'Camera', label: 'Foto i kamera', Icon: Camera },
  { name: 'Mic', label: 'Mikrofony', Icon: Mic },
  { name: 'Music', label: 'Muzyka', Icon: Music },
  { name: 'Guitar', label: 'Instrumenty', Icon: Guitar },
  { name: 'Piano', label: 'Pianino', Icon: Piano },
  { name: 'Sparkles', label: 'Kosmetyki', Icon: Sparkles },
  { name: 'Paintbrush', label: 'Makijaz i beauty', Icon: Paintbrush },
  { name: 'Pill', label: 'Suplementy', Icon: Pill },
  { name: 'Stethoscope', label: 'Zdrowie', Icon: Stethoscope },
  { name: 'BriefcaseMedical', label: 'Medyczne', Icon: BriefcaseMedical },
  { name: 'TestTube', label: 'Laboratorium', Icon: TestTube },
  { name: 'Home', label: 'Dom', Icon: Home },
  { name: 'Bed', label: 'Sypialnia', Icon: Bed },
  { name: 'Sofa', label: 'Meble', Icon: Sofa },
  { name: 'Armchair', label: 'Fotele', Icon: Armchair },
  { name: 'RockingChair', label: 'Krzesla', Icon: RockingChair },
  { name: 'Blinds', label: 'Wnetrza', Icon: Blinds },
  { name: 'Lamp', label: 'Oswietlenie', Icon: Lamp },
  { name: 'Bath', label: 'Lazienka', Icon: Bath },
  { name: 'ShowerHead', label: 'Prysznic', Icon: ShowerHead },
  { name: 'WashingMachine', label: 'Pranie', Icon: WashingMachine },
  { name: 'Refrigerator', label: 'AGD', Icon: Refrigerator },
  { name: 'Microwave', label: 'Kuchenne AGD', Icon: Microwave },
  { name: 'Coffee', label: 'Kuchnia i kawa', Icon: Coffee },
  { name: 'Apple', label: 'Jedzenie', Icon: Apple },
  { name: 'ChefHat', label: 'Gotowanie', Icon: ChefHat },
  { name: 'CookingPot', label: 'Garnki', Icon: CookingPot },
  { name: 'Utensils', label: 'Restauracje', Icon: Utensils },
  { name: 'Milk', label: 'Nabial', Icon: Milk },
  { name: 'Beef', label: 'Mieso', Icon: Beef },
  { name: 'Carrot', label: 'Warzywa', Icon: Carrot },
  { name: 'Cherry', label: 'Owoce', Icon: Cherry },
  { name: 'Cake', label: 'Ciasta', Icon: Cake },
  { name: 'CakeSlice', label: 'Slodycze', Icon: CakeSlice },
  { name: 'Cookie', label: 'Przekaski', Icon: Cookie },
  { name: 'Soup', label: 'Zupy', Icon: Soup },
  { name: 'Salad', label: 'Salatki', Icon: Salad },
  { name: 'Sandwich', label: 'Kanapki', Icon: Sandwich },
  { name: 'Wine', label: 'Wino', Icon: Wine },
  { name: 'Beer', label: 'Napoje', Icon: Beer },
  { name: 'Leaf', label: 'Eko', Icon: Leaf },
  { name: 'Sprout', label: 'Ogrod', Icon: Sprout },
  { name: 'Book', label: 'Ksiazki', Icon: Book },
  { name: 'BookOpen', label: 'Ksiazki otwarte', Icon: BookOpen },
  { name: 'Library', label: 'Biblioteka', Icon: Library },
  { name: 'GraduationCap', label: 'Edukacja', Icon: GraduationCap },
  { name: 'Paperclip', label: 'Biuro', Icon: Paperclip },
  { name: 'Receipt', label: 'Rachunki', Icon: Receipt },
  { name: 'PenTool', label: 'Papiernicze', Icon: PenTool },
  { name: 'Building', label: 'Firmowe', Icon: Building },
  { name: 'Landmark', label: 'Instytucje', Icon: Landmark },
  { name: 'Briefcase', label: 'Praca', Icon: Briefcase },
  { name: 'BriefcaseBusiness', label: 'Biznes', Icon: BriefcaseBusiness },
  { name: 'Wrench', label: 'Narzedzia', Icon: Wrench },
  { name: 'Hammer', label: 'Remont', Icon: Hammer },
  { name: 'Drill', label: 'Majsterkowanie', Icon: Drill },
  { name: 'Truck', label: 'Dostawa', Icon: Truck },
  { name: 'Car', label: 'Auto', Icon: Car },
  { name: 'CarFront', label: 'Motoryzacja', Icon: CarFront },
  { name: 'Bus', label: 'Autobus', Icon: Bus },
  { name: 'TrainFront', label: 'Pociag', Icon: TrainFront },
  { name: 'Plane', label: 'Loty', Icon: Plane },
  { name: 'Hotel', label: 'Hotel', Icon: Hotel },
  { name: 'Bike', label: 'Rower', Icon: Bike },
  { name: 'Map', label: 'Podroze', Icon: Map },
  { name: 'Ticket', label: 'Bilety', Icon: Ticket },
  { name: 'Rocket', label: 'Nowosci', Icon: Rocket },
  { name: 'Flame', label: 'Gorace okazje', Icon: Flame },
  { name: 'Gift', label: 'Prezenty', Icon: Gift },
  { name: 'Crown', label: 'Premium', Icon: Crown },
  { name: 'Church', label: 'Okazje rodzinne', Icon: Church },
  { name: 'Shield', label: 'Bezpieczenstwo', Icon: Shield },
  { name: 'Smile', label: 'Dla siebie', Icon: Smile },
  { name: 'HandHeart', label: 'Dla bliskich', Icon: HandHeart },
  { name: 'HandHelping', label: 'Pomoc i uslugi', Icon: HandHelping },
  { name: 'UserRound', label: 'Ja', Icon: UserRound },
  { name: 'Users', label: 'Rodzina', Icon: Users },
  { name: 'UsersRound', label: 'Domownicy', Icon: UsersRound },
  { name: 'FamilyKids', label: 'Rodzice i dzieci', Icon: UsersRound },
  { name: 'Partner', label: 'Partner / partnerka', Icon: Heart },
  { name: 'Grandparents', label: 'Dziadkowie', Icon: Crown },
  { name: 'PersonStanding', label: 'Osoba', Icon: PersonStanding },
  { name: 'KeyRound', label: 'Klucze i dostep', Icon: KeyRound },
  { name: 'EyeClosed', label: 'Prywatne', Icon: EyeClosed },
  { name: 'Clapperboard', label: 'Film', Icon: Clapperboard },
  { name: 'Puzzle', label: 'Puzzle i zabawki', Icon: Puzzle },
  { name: 'Dumbbell', label: 'Sport', Icon: Dumbbell },
  { name: 'BicepsFlexed', label: 'Fitness', Icon: BicepsFlexed },
  { name: 'Trophy', label: 'Nagrody', Icon: Trophy },
  { name: 'Volleyball', label: 'Gry zespolowe', Icon: Volleyball },
  { name: 'Tent', label: 'Outdoor', Icon: Tent },
  { name: 'Baby', label: 'Dziecko', Icon: Baby },
  { name: 'PawPrint', label: 'Zwierzeta', Icon: PawPrint },
  { name: 'Dog', label: 'Pies', Icon: Dog },
  { name: 'Cat', label: 'Kot', Icon: Cat },
  { name: 'Bird', label: 'Ptaki', Icon: Bird },
  { name: 'Fish', label: 'Ryby', Icon: Fish },
  { name: 'Rabbit', label: 'Male zwierzeta', Icon: Rabbit },
  { name: 'Bone', label: 'Karma i przysmaki', Icon: Bone },
  { name: 'Palette', label: 'Hobby', Icon: Palette },
  { name: 'Brush', label: 'Sztuka', Icon: Brush },
  { name: 'Flower', label: 'Kwiaty', Icon: Flower },
  { name: 'Flower2', label: 'Dekoracje', Icon: Flower2 },
  { name: 'Heart', label: 'Ulubione', Icon: Heart },
  { name: 'Tag', label: 'Inne', Icon: Tag }
];
const categoryColorOptions = ['#38bdf8', '#8b5cf6', '#2563eb', '#f43f5e', '#14b8a6', '#f97316', '#64748b'];
const popupCopy = {
  pl: {
    subtitle: 'Obserwuj ten produkt',
    refresh: 'Odswiez',
    basePrice: 'Cena bazowa',
    targetPrice: 'Cena docelowa',
    size: 'Rozmiar',
    color: 'Kolor',
    category: 'Kategoria',
    noCategory: 'Bez kategorii',
    detectedCategory: 'Wykryto kategorie',
    addThisCategory: 'Dodaj te kategorie',
    newCategory: 'Nowa kategoria',
    refreshCategories: 'Odswiez kategorie',
    categoryTokenHint: 'Otworz dashboard albo wklej token API, aby pobrac kategorie.',
    noCategoriesLoaded: 'Nie pobrano kategorii. Odswiez albo sprawdz token API.',
    chooseIcon: 'Wybierz ikone',
    note: 'Notatka',
    stockAlert: 'Powiadom, gdy wroci na stock',
    activeMonitoring: 'Aktywny monitoring',
    pickPrice: 'Wskaz cene',
    picking: 'Kliknij cene na stronie produktu. Wskazana cena zapisze sie w popupie.',
    save: 'Zapisz',
    apiSaved: 'Token zapisuje sie w przegladarce',
    priceMissing: 'Cena niewykryta',
    loading: 'Pobieranie danych...',
    noData: 'Nie udalo sie pobrac danych automatycznie.',
    retry: 'Sprobuj ponownie',
    sizeEmpty: 'Nie wykryto wybranego rozmiaru.',
    colorEmpty: 'Nie wykryto wybranego koloru.',
    detected: 'Wykryto',
    suggestions: 'Wybierz z podpowiedzi:',
    extracting: 'Odswiezam dane z aktualnej strony...',
    extracted: 'Dane produktu zostaly zaktualizowane.',
    saving: 'Zapisywanie produktu...',
    saved: 'Zapisano produkt na liscie obserwowanych.',
    language: 'Jezyk',
    partialRead: 'Nie udalo sie automatycznie odczytac strony. Uzupelnij cene recznie i zapisz produkt.',
    backendUnavailable: 'Nie moge polaczyc sie z backendem. Sprawdz, czy API dziala i czy adres Backend jest poprawny.',
    tokenExpired: 'Token API jest niepoprawny albo wygasl. Skopiuj nowy token z ustawien dashboardu.',
    saveFailed: 'Nie udalo sie zapisac produktu.',
    noActiveTab: 'Brak aktywnej karty.',
    pageUnreadable: 'Tej strony nie da sie odczytac przez wtyczke.',
    extractFailed: 'Nie udalo sie odczytac danych ze strony.',
    pageCannotPick: 'Na tej stronie nie mozna wskazac ceny.',
    pageConnectionFailed: 'Nie moge polaczyc sie ze strona. Odswiez strone produktu i sprobuj ponownie.',
    pickFailed: 'Nie udalo sie uruchomic wskazywania ceny.',
    tokenRequired: 'Wklej token sesji z dashboardu w sekcji API.',
    tokenRequiredCategory: 'Wklej token sesji z dashboardu w sekcji API, aby dodac kategorie.',
    categorySaveFailed: 'Nie udalo sie dodac kategorii.',
    add: 'Dodaj',
    backend: 'Backend',
    apiToken: 'Token API',
    productNotFound: 'Nie znaleziono danych produktu na tej stronie.',
    close: 'Zamknij'
  },
  en: {
    subtitle: 'Track this product',
    refresh: 'Refresh',
    basePrice: 'Base price',
    targetPrice: 'Target price',
    size: 'Size',
    color: 'Color',
    category: 'Category',
    noCategory: 'No category',
    detectedCategory: 'Detected category',
    addThisCategory: 'Add this category',
    newCategory: 'New category',
    refreshCategories: 'Refresh categories',
    categoryTokenHint: 'Open the dashboard or paste the API token to load categories.',
    noCategoriesLoaded: 'Categories were not loaded. Refresh or check the API token.',
    chooseIcon: 'Choose icon',
    note: 'Note',
    stockAlert: 'Notify when back in stock',
    activeMonitoring: 'Active monitoring',
    pickPrice: 'Pick price',
    picking: 'Click the price on the product page. The picked price will be saved in the popup.',
    save: 'Save',
    apiSaved: 'Token is saved in the browser',
    priceMissing: 'Price not detected',
    loading: 'Loading product data...',
    noData: 'Could not read product data automatically.',
    retry: 'Try again',
    sizeEmpty: 'Selected size was not detected.',
    colorEmpty: 'Selected color was not detected.',
    detected: 'Detected',
    suggestions: 'Pick from suggestions:',
    extracting: 'Refreshing data from the current page...',
    extracted: 'Product data has been updated.',
    saving: 'Saving product...',
    saved: 'Product saved to your watchlist.',
    language: 'Language',
    partialRead: 'Could not read the page automatically. Fill the price manually and save the product.',
    backendUnavailable: 'Could not connect to the backend. Check that the API is running and the Backend address is correct.',
    tokenExpired: 'The API token is invalid or expired. Copy a fresh token from dashboard settings.',
    saveFailed: 'Could not save the product.',
    noActiveTab: 'No active tab.',
    pageUnreadable: 'This page cannot be read by the extension.',
    extractFailed: 'Could not read data from the page.',
    pageCannotPick: 'You cannot pick a price on this page.',
    pageConnectionFailed: 'Could not connect to the page. Refresh the product page and try again.',
    pickFailed: 'Could not start price picking.',
    tokenRequired: 'Paste the dashboard session token in the API section.',
    tokenRequiredCategory: 'Paste the dashboard session token in the API section to add a category.',
    categorySaveFailed: 'Could not add the category.',
    add: 'Add',
    backend: 'Backend',
    apiToken: 'API token',
    productNotFound: 'Product data was not found on this page.',
    close: 'Close'
  }
} as const;

function Popup() {
  const [sourceTabId] = useState(() => tabIdFromUrl());
  const [product, setProduct] = useState<ExtractedProduct | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [note, setNote] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColorOptions[0]);
  const [trackStock, setTrackStock] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:5080');
  const [authToken, setAuthToken] = useState('');
  const [language, setLanguage] = useState<Language>('pl');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [status, setStatus] = useState<PopupStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function extract(options: { preserveForm?: boolean; showSuccess?: boolean } = {}) {
    setError(null);
    setStatus('extracting');

    try {
      const tab = await getProductTab(sourceTabId);
      if (!tab.id) {
        throw new Error(popupCopy[language].noActiveTab);
      }

      if (tab.url && !/^https?:\/\//i.test(tab.url)) {
        throw new Error(popupCopy[language].pageUnreadable);
      }

      try {
        const response = await extractFromTab(tab.id, language);
        applyExtractedProduct(response, Boolean(options.preserveForm));
        setStatus(options.showSuccess ? 'extracted' : 'idle');
      } catch {
        applyExtractedProduct(fallbackProductFromTab(tab), Boolean(options.preserveForm));
        setStatus('error');
        setError(popupCopy[language].partialRead);
      }
    } catch (extractError) {
      setStatus('error');
      setError(extractError instanceof Error ? extractError.message : popupCopy[language].extractFailed);
    }
  }

  function applyExtractedProduct(response: ExtractedProduct, preserveForm: boolean) {
    const detectedPrice = response.price ? String(response.price) : '';

    setProduct(response);

    if (!preserveForm) {
      setTargetPrice(detectedPrice);
      setBasePrice(detectedPrice);
      setSize(response.size ?? '');
      setColor(response.color ?? '');
      setNote(limitText(response.description ?? '', 1000));
      setCategoryName('');
      setCategoryTouched(false);
      return;
    }

    setTargetPrice((current) => current || detectedPrice);
    setBasePrice((current) => current || detectedPrice);
    setSize((current) => response.size ?? current);
    setColor((current) => response.color ?? current);
    setNote((current) => current || limitText(response.description ?? '', 1000));
  }

  function applyPickedPrice(picked: PendingPickedPrice) {
    if (!picked.price) {
      setStatus('error');
      setError(popupCopy[language].priceMissing);
      return false;
    }

    setProduct((current) => {
      const existing = current ?? {
        name: picked.name,
        url: picked.url ?? '',
        shopName: picked.shopName ?? 'unknown',
        currency: picked.currency ?? 'PLN',
        isAvailable: true
      };

      return {
        ...existing,
        price: picked.price,
        currency: picked.currency ?? existing.currency,
        priceSelector: picked.priceSelector ?? existing.priceSelector,
        url: existing.url || picked.url || '',
        shopName: existing.shopName || picked.shopName || 'unknown'
      };
    });
    setBasePrice(String(picked.price));
    setTargetPrice((current) => current || String(picked.price));
    setError(null);
    setStatus('extracted');
    return true;
  }

  async function restorePendingPickedPrice() {
    try {
      const result = await chrome.storage.local.get([pendingPickedPriceKey]);
      const pending = result[pendingPickedPriceKey] as PendingPickedPrice | undefined;
      if (!pending) {
        return;
      }

      const isExpired = pending.pickedAt ? Date.now() - pending.pickedAt > 10 * 60 * 1000 : false;
      const isOtherTab = Boolean(sourceTabId && pending.sourceTabId && pending.sourceTabId !== sourceTabId);
      if (isExpired) {
        await chrome.storage.local.remove(pendingPickedPriceKey);
        return;
      }
      if (isOtherTab) {
        return;
      }

      if (applyPickedPrice(pending)) {
        await chrome.storage.local.remove(pendingPickedPriceKey);
      }
    } catch {
      // Picking is a convenience path. The product form can still be edited manually.
    }
  }

  async function pickPrice() {
    setError(null);
    setStatus('picking');

    try {
      const tab = await getProductTab(sourceTabId);
      if (!tab.id) {
        throw new Error(popupCopy[language].noActiveTab);
      }

      if (tab.url && !/^https?:\/\//i.test(tab.url)) {
        throw new Error(popupCopy[language].pageCannotPick);
      }

      const response = await sendMessageWithContentScript(tab.id, { type: 'PICK_PRICE' });
      if (!response) {
        throw new Error(popupCopy[language].pageConnectionFailed);
      }

      const picked = response as Partial<ExtractedProduct>;
      if (picked.price) {
        applyPickedPrice(picked);
      }
      void focusProductTab(tab);
    } catch (pickError) {
      setStatus('error');
      setError(pickError instanceof Error ? pickError.message : popupCopy[language].pickFailed);
    }
  }

  async function save() {
    if (!product) {
      return;
    }

    if (!authToken.trim()) {
      setStatus('error');
      setError(popupCopy[language].tokenRequired);
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const manualPrice = numberOrUndefined(basePrice);
      const response = await fetch(apiUrl(apiBaseUrl, '/api/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.trim()}`
        },
        body: JSON.stringify({
          name: product.name,
          url: product.url,
          shopName: product.shopName,
          imageUrl: product.imageUrl,
          basePrice: manualPrice ?? product.price,
          currentPrice: product.price ?? manualPrice,
          targetPrice: numberOrUndefined(targetPrice),
          currency: product.currency ?? 'PLN',
          size: clean(size),
          color: clean(color),
          note: clean(note),
          categoryName: clean(categoryName),
          isAvailable: product.isAvailable ?? true,
          trackStock,
          isActive,
          alertOnPriceDrop: Boolean(targetPrice),
          alertOnBackInStock: trackStock,
          priceSelector: product.priceSelector,
          stockSelector: product.stockSelector
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(popupCopy[language].tokenExpired);
        }
        throw new Error(await response.text() || popupCopy[language].saveFailed);
      }

      setStatus('saved');
      if (window.location.protocol === 'chrome-extension:') {
        window.setTimeout(() => window.close(), 700);
      }
    } catch (saveError) {
      setStatus('error');
      setError(saveError instanceof TypeError
        ? popupCopy[language].backendUnavailable
        : saveError instanceof Error ? saveError.message : popupCopy[language].saveFailed);
    }
  }

  async function loadCategories(nextBaseUrl = apiBaseUrl, nextToken = authToken, options: { allowDashboardSync?: boolean } = {}) {
    const allowDashboardSync = options.allowDashboardSync ?? true;
    let token = nextToken.trim();
    setCategoriesLoading(true);
    setCategoryLoadError(null);

    if (!token && allowDashboardSync) {
      const syncedToken = await syncTokenFromDashboard();
      if (syncedToken) {
        token = syncedToken;
        setAuthToken(syncedToken);
        await chrome.storage.sync.set({ apiBaseUrl: nextBaseUrl, authToken: syncedToken });
      }
    }

    if (!token) {
      setCategories([]);
      setCategoryLoadError(popupCopy[language].categoryTokenHint);
      setCategoriesLoading(false);
      return;
    }

    try {
      let response = await fetch(apiUrl(nextBaseUrl, '/api/categories'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401 && allowDashboardSync) {
        const syncedToken = await syncTokenFromDashboard();
        if (syncedToken && syncedToken !== token) {
          token = syncedToken;
          setAuthToken(syncedToken);
          await chrome.storage.sync.set({ apiBaseUrl: nextBaseUrl, authToken: syncedToken });
          response = await fetch(apiUrl(nextBaseUrl, '/api/categories'), {
            headers: {
              Authorization: `Bearer ${syncedToken}`
            }
          });
        }
      }

      if (response.ok) {
        setCategories(await response.json() as Category[]);
        setCategoryLoadError(null);
      } else {
        setCategories([]);
        setCategoryLoadError(response.status === 401
          ? popupCopy[language].tokenExpired
          : popupCopy[language].noCategoriesLoaded);
      }
    } catch {
      setCategories([]);
      setCategoryLoadError(popupCopy[language].backendUnavailable);
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name || !authToken.trim()) {
      if (!authToken.trim()) {
        setStatus('error');
        setError(popupCopy[language].tokenRequiredCategory);
      }
      return;
    }

    try {
      const response = await fetch(apiUrl(apiBaseUrl, '/api/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.trim()}`
        },
        body: JSON.stringify({ name, iconName: newCategoryIcon, colorHex: newCategoryColor })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const created = await response.json() as Category;
      setCategories((current) => [
        ...current.filter((category) => category.id !== created.id),
        created
      ].sort((left, right) => left.name.localeCompare(right.name, 'pl')));
      setCategoryName(created.name);
      setCategoryTouched(true);
      setNewCategoryName('');
      setNewCategoryIcon('Tag');
      setNewCategoryColor(categoryColorOptions[0]);
      setShowNewCategory(false);
    } catch (categoryError) {
      setStatus('error');
      setError(categoryError instanceof Error ? categoryError.message : popupCopy[language].categorySaveFailed);
    }
  }

  useEffect(() => {
    void (async () => {
      let nextBaseUrl = 'http://localhost:5080';
      let nextToken = '';

      void chrome.action.setBadgeText({ text: '' }).catch(() => undefined);

      try {
        const result = await chrome.storage.sync.get(['apiBaseUrl', 'authToken', 'popupLanguage']);
        if (result.apiBaseUrl) {
          setApiBaseUrl(result.apiBaseUrl);
          nextBaseUrl = result.apiBaseUrl;
        }
        if (result.authToken) {
          setAuthToken(result.authToken);
          nextToken = result.authToken;
        }
        if (result.popupLanguage === 'en' || result.popupLanguage === 'pl') {
          setLanguage(result.popupLanguage);
        }
      } catch {
        // Settings are optional. Defaults keep the popup usable.
      }

      setSettingsLoaded(true);
      void loadCategories(nextBaseUrl, nextToken);
      await extract();
      await restorePendingPickedPrice();
    })();
  }, []);

  useEffect(() => {
    const listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (message: PricePickedRuntimeMessage) => {
      if (message?.type !== 'PRICE_PICKED' || !message.payload) {
        return false;
      }

      const pending = message.payload;
      if (sourceTabId && pending.sourceTabId && pending.sourceTabId !== sourceTabId) {
        return false;
      }

      if (applyPickedPrice(pending)) {
        void chrome.storage.local.remove(pendingPickedPriceKey);
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [sourceTabId, language]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    void chrome.storage.sync
      .set({ apiBaseUrl, authToken, popupLanguage: language })
      .catch(() => undefined);
  }, [apiBaseUrl, authToken, language, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    void loadCategories();
  }, [apiBaseUrl, authToken, settingsLoaded]);

  useEffect(() => {
    if (!product?.categoryName || categoryTouched || categoryName) {
      return;
    }

    const match = findMatchingCategory(categories, product.categoryName);
    if (match) {
      setCategoryName(match.name);
    }
  }, [categories, categoryName, categoryTouched, product?.categoryName]);

  useEffect(() => {
    if (status !== 'idle' || error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [status, error]);

  const copy = popupCopy[language];

  return (
    <main className="w-[392px] bg-slate-50 p-4 text-slate-900">
      <StatusBanner status={status} error={error} language={language} />

      <header className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
          <img className="h-11 w-11 rounded-xl object-cover shadow-sm" src="/logo.png" alt="StockPriceBot" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-normal">StockPriceBot</h1>
            <p className="line-clamp-2 text-xs leading-4 text-slate-500">{copy.subtitle}</p>
          </div>
        </div>
          <button className="icon-button shrink-0" type="button" onClick={() => window.close()} title={copy.close} aria-label={copy.close}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex h-9 w-[92px] shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700" title={copy.language}>
            <Globe2 className="h-3.5 w-3.5 text-teal-700" />
            <select className="min-w-0 flex-1 bg-transparent outline-none" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={copy.language}>
              <option value="pl">PL</option>
              <option value="en">ENG</option>
            </select>
          </label>
          <button
            className="small-button flex-1"
            onClick={() => void extract({ preserveForm: true, showSuccess: true })}
            disabled={status === 'extracting'}
            title={copy.refresh}
          >
            <RefreshCw className="h-4 w-4" />
            {copy.refresh}
          </button>
        </div>
      </header>

      {product ? (
        <section className="space-y-3">
          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
              {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-sm font-semibold">{product.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{product.shopName}</p>
              <p className="mt-2 text-base font-semibold text-teal-800">
                {product.price ? `${product.price.toFixed(2)} ${product.currency ?? 'PLN'}` : copy.priceMissing}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label={copy.basePrice}>
              <input className="field" type="number" step="0.01" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} />
            </Field>
            <Field label={copy.targetPrice}>
              <input className="field" type="number" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label={copy.size}>
              <input className="field" value={size} onChange={(event) => setSize(event.target.value)} />
              <VariantSuggestions
                value={size}
                options={product.sizeOptions}
                emptyText={copy.sizeEmpty}
                detectedText={copy.detected}
                suggestionsText={copy.suggestions}
                onPick={setSize}
              />
            </Field>
            <Field label={copy.color}>
              <input className="field" value={color} onChange={(event) => setColor(event.target.value)} />
              <VariantSuggestions
                value={color}
                options={product.colorOptions}
                emptyText={copy.colorEmpty}
                detectedText={copy.detected}
                suggestionsText={copy.suggestions}
                onPick={setColor}
              />
            </Field>
          </div>

          <Field label={copy.category}>
            <div className="flex gap-2">
              <select
                className="field"
                value={categoryName}
                onChange={(event) => {
                  setCategoryTouched(true);
                  setCategoryName(event.target.value);
                }}
              >
                <option value="">{copy.noCategory}</option>
                {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
              <button className="icon-button shrink-0" type="button" onClick={() => void loadCategories(apiBaseUrl, authToken, { allowDashboardSync: true })} title={copy.refreshCategories} aria-label={copy.refreshCategories}>
                <RefreshCw className={`h-4 w-4 ${categoriesLoading ? 'animate-spin' : ''}`} />
              </button>
              <button className="icon-button shrink-0" type="button" onClick={() => setShowNewCategory((value) => !value)} title={copy.addThisCategory}>
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>
            {(categoryLoadError || (categories.length === 0 && !categoriesLoading)) && (
              <p className="mt-1 text-xs text-slate-500">
                {categoryLoadError ?? copy.noCategoriesLoaded}
              </p>
            )}
            {product.categoryName && !findMatchingCategory(categories, product.categoryName) && (
              <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                <div className="font-medium">{copy.detectedCategory}: {product.categoryName}</div>
                <button
                  className="mt-2 rounded border border-sky-300 bg-white px-2 py-1 text-xs font-semibold text-sky-800"
                  type="button"
                  onClick={() => {
                    setNewCategoryName(product.categoryName ?? '');
                    setShowNewCategory(true);
                  }}
                >
                  {copy.addThisCategory}
                </button>
              </div>
            )}
          </Field>

          {showNewCategory && (
            <div className="grid gap-2 rounded-md border border-stone-200 bg-white p-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                className="field"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder={copy.newCategory}
              />
              <button className="icon-button" type="button" onClick={createCategory} title={copy.add}>
                <Plus className="h-4 w-4" />
              </button>
              </div>
              <CategoryIconPicker value={newCategoryIcon} onChange={setNewCategoryIcon} buttonLabel={copy.chooseIcon} />
              <div className="flex items-center gap-2">
                <CustomColorPicker value={newCategoryColor} onChange={setNewCategoryColor} label={copy.color} />
                <span className="text-xs text-slate-500">{newCategoryColor}</span>
              </div>
            </div>
          )}

          <Field label={copy.note}>
            <textarea className="field min-h-16 py-2" value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={trackStock} onChange={(event) => setTrackStock(event.target.checked)} />
            {copy.stockAlert}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            {copy.activeMonitoring}
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button className="text-button" onClick={pickPrice}>
              <Crosshair className="h-4 w-4" />
              {copy.pickPrice}
            </button>
            <button className="primary-button" onClick={save} disabled={status === 'saving'}>
              <Check className="h-4 w-4" />
              {copy.save}
            </button>
          </div>

          <details className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              API
            </summary>
            <Field label={copy.backend}>
              <input className="field mt-3" value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
            </Field>
            <Field label={copy.apiToken}>
              <input className="field mt-3" value={authToken} onChange={(event) => setAuthToken(event.target.value)} />
              <p className="mt-1 text-xs text-slate-500">{copy.apiSaved}</p>
            </Field>
          </details>

        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          <p>{status === 'extracting' ? copy.loading : copy.noData}</p>
          <button
            className="text-button mt-3 w-full"
            type="button"
            onClick={() => void extract({ preserveForm: true, showSuccess: true })}
            disabled={status === 'extracting'}
          >
            <RefreshCw className="h-4 w-4" />
            {copy.retry}
          </button>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function CategoryIconPicker({
  value,
  onChange,
  buttonLabel
}: {
  value: string;
  onChange: (value: string) => void;
  buttonLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = categoryIconOptions.find((item) => item.name === value) ?? categoryIconOptions[categoryIconOptions.length - 1];
  const SelectedIcon = selectedOption.Icon;

  return (
    <div className="space-y-2">
      <button
        className="flex min-h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-2.5 text-left text-xs font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <SelectedIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{selectedOption.label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
          {buttonLabel}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {open && (
        <div className="flex max-h-40 flex-wrap gap-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 pr-1 shadow-inner">
          {categoryIconOptions.map((option) => {
            const selected = value === option.name;
            return (
              <button
                key={option.name}
                aria-label={option.label}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 ${
                  selected
                    ? 'border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-100'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
                type="button"
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                }}
                title={option.label}
              >
                <option.Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomColorPicker({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const customColorSelected = !categoryColorOptions.some((color) => color.toLowerCase() === value.toLowerCase());

  return (
    <label
      className={`relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 shadow-sm transition hover:-translate-y-0.5 ${
        customColorSelected ? 'border-slate-900 ring-2 ring-sky-100' : 'border-white'
      }`}
      style={{
        background: 'conic-gradient(from 90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)'
      }}
      title={label}
    >
      <Pipette className="relative z-10 h-4 w-4 text-white drop-shadow" />
      <input
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StatusBanner({ status, error, language }: { status: PopupStatus; error: string | null; language: Language }) {
  const copy = popupCopy[language];

  if (!error && status === 'idle') {
    return null;
  }

  if (error) {
    return (
      <div className="sticky top-0 z-20 mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 shadow-sm">
        {error}
      </div>
    );
  }

  if (status === 'extracting') {
    return (
      <div className="sticky top-0 z-20 mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 shadow-sm">
        {copy.extracting}
      </div>
    );
  }

  if (status === 'picking') {
    return (
      <div className="sticky top-0 z-20 mb-3 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 shadow-sm">
        {copy.picking}
      </div>
    );
  }

  if (status === 'extracted') {
    return (
      <div className="sticky top-0 z-20 mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 shadow-sm">
        {copy.extracted}
      </div>
    );
  }

  if (status === 'saving') {
    return (
      <div className="sticky top-0 z-20 mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 shadow-sm">
        {copy.saving}
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div className="sticky top-0 z-20 mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 shadow-sm">
        {copy.saved}
      </div>
    );
  }

  return null;
}

function VariantSuggestions({
  value,
  options,
  emptyText,
  detectedText,
  suggestionsText,
  onPick
}: {
  value: string;
  options?: string[];
  emptyText: string;
  detectedText: string;
  suggestionsText: string;
  onPick: (value: string) => void;
}) {
  const visibleOptions = (options ?? []).filter((option) => option && option !== value).slice(0, 40);
  if (value && visibleOptions.length === 0) {
    return <p className="text-[11px] text-emerald-700">{detectedText}: {value}</p>;
  }

  if (visibleOptions.length === 0) {
    return <p className="text-[11px] text-stone-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-1">
      {!value && <p className="text-[11px] text-stone-500">{emptyText} {suggestionsText}</p>}
      <div className="flex max-h-28 flex-wrap gap-1 overflow-auto pr-1">
        {visibleOptions.map((option) => (
          <button
            key={option}
            className="rounded border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-700 hover:border-teal-600 hover:text-teal-700"
            type="button"
            onClick={() => onPick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function clean(value: string) {
  return value.trim() || undefined;
}

function limitText(value: string, maxLength: number) {
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
}

function apiUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

function numberOrUndefined(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function tabIdFromUrl() {
  const rawTabId = new URLSearchParams(window.location.search).get('sourceTabId');
  const tabId = rawTabId ? Number(rawTabId) : Number.NaN;
  return Number.isInteger(tabId) && tabId > 0 ? tabId : null;
}

async function syncTokenFromDashboard() {
  try {
    const dashboardTabs = await chrome.tabs.query({
      url: [
        'http://localhost:*/*',
        'http://127.0.0.1:*/*',
        'https://localhost:*/*',
        'https://127.0.0.1:*/*'
      ]
    });

    for (const tab of dashboardTabs) {
      if (!tab.id) {
        continue;
      }

      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => localStorage.getItem('pricestockbot.token')
        });
        const token = typeof result?.result === 'string' ? result.result.trim() : '';
        if (token) {
          return token;
        }
      } catch {
        continue;
      }
    }
  } catch {
    return '';
  }

  return '';
}

async function getProductTab(sourceTabId: number | null) {
  if (sourceTabId) {
    try {
      return await chrome.tabs.get(sourceTabId);
    } catch {
      // The source tab may have been closed. Fall back to the active tab.
    }
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function focusProductTab(tab: chrome.tabs.Tab) {
  if (!tab.id) {
    return;
  }

  try {
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    await chrome.tabs.update(tab.id, { active: true });
  } catch {
    // Focusing is a convenience. Picking still works if Chrome denies the focus update.
  }
}

async function extractFromTab(tabId: number, language: Language) {
  const response = await sendMessageWithContentScript(tabId, { type: 'EXTRACT_PRODUCT' }) as ExtractedProduct | undefined;
  if (!response?.url) {
    throw new Error(popupCopy[language].productNotFound);
  }

  return response;
}

async function sendMessageWithContentScript(tabId: number, message: unknown) {
  const firstAttempt = await sendTabMessage(tabId, message);
  if (firstAttempt.ok) {
    return firstAttempt.response;
  }

  if (!isMissingReceiverError(firstAttempt.error)) {
    throw firstAttempt.error;
  }

  const injected = await injectContentScript(tabId);
  if (!injected.ok) {
    if (isMissingReceiverError(injected.error)) {
      return undefined;
    }
    throw injected.error;
  }

  for (const delay of [120, 250, 500, 900]) {
    await sleep(delay);
    const retry = await sendTabMessage(tabId, message);
    if (retry.ok) {
      return retry.response;
    }
    if (!isMissingReceiverError(retry.error)) {
      throw retry.error;
    }
  }

  return undefined;
}

function sendTabMessage(tabId: number, message: unknown): Promise<MessageResult> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        resolve({ ok: false, error: new Error(lastError.message) });
        return;
      }

      resolve({ ok: true, response });
    });
  });
}

async function injectContentScript(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/content.js']
    });
    return { ok: true, response: undefined } satisfies MessageResult;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) } satisfies MessageResult;
  }
}

function isMissingReceiverError(error: unknown) {
  return isIgnoredExtensionError(error);
}

function isIgnoredExtensionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return ignoredExtensionErrorPatterns.some((pattern) => message.includes(pattern));
}

function fallbackProductFromTab(tab: chrome.tabs.Tab): ExtractedProduct {
  const url = tab.url ?? '';
  let shopName = 'unknown';
  try {
    shopName = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    shopName = 'unknown';
  }

  return {
    name: tab.title?.trim() || shopName,
    url,
    shopName,
    currency: 'PLN',
    imageUrl: tab.favIconUrl,
    isAvailable: true
  };
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function findMatchingCategory(categories: Category[], name: string) {
  const normalized = normalizeCategoryName(name);
  return categories.find((category) => normalizeCategoryName(category.name) === normalized);
}

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
