import { useState } from 'react';
import {
  Activity,
  Aperture,
  Apple,
  Armchair,
  Atom,
  Baby,
  Backpack,
  Badge,
  BadgeCheck,
  BadgeDollarSign,
  BaggageClaim,
  Bandage,
  Banknote,
  Barcode,
  Bath,
  BatteryCharging,
  Bed,
  Bike,
  Bird,
  Blocks,
  Bone,
  Book,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Brush,
  Cable,
  CakeSlice,
  Calculator,
  CalendarHeart,
  Camera,
  Car,
  CarFront,
  Cat,
  Cctv,
  ChevronDown,
  ChevronUp,
  CircleEllipsis,
  CircleParking,
  Clapperboard,
  Code2,
  Coffee,
  Coins,
  Compass,
  CookingPot,
  Cpu,
  CreditCard,
  Cross,
  Crown,
  Database,
  Dices,
  Disc3,
  Dog,
  Drill,
  Droplet,
  Droplets,
  Drum,
  Dumbbell,
  Eye,
  EyeClosed,
  Fence,
  Film,
  Fingerprint,
  Fish,
  FlaskConical,
  Flower2,
  Focus,
  Folder,
  Fuel,
  Gamepad2,
  Gauge,
  Gem,
  Gift,
  Glasses,
  Goal,
  GraduationCap,
  Guitar,
  Hammer,
  HandCoins,
  HandHeart,
  HardDrive,
  HardHat,
  Headphones,
  Heart,
  HeartPulse,
  Hospital,
  Hotel,
  House,
  IceCreamBowl,
  Image,
  Images,
  Joystick,
  KeyRound,
  Keyboard,
  Lamp,
  Laptop,
  LayoutGrid,
  Leaf,
  Library,
  List,
  LockKeyhole,
  Luggage,
  Map,
  MapPin,
  Medal,
  MicVocal,
  Microscope,
  Monitor,
  Mouse,
  Music,
  Notebook,
  Origami,
  Package,
  PaintBucket,
  Paintbrush,
  PaintbrushVertical,
  Palette,
  Paperclip,
  PartyPopper,
  PawPrint,
  PenLine,
  Pencil,
  Piano,
  PiggyBank,
  Pill,
  Pipette,
  Pizza,
  Plane,
  Printer,
  Puzzle,
  Radio,
  ReceiptText,
  Recycle,
  Refrigerator,
  Router,
  Ruler,
  Scan,
  ScanFace,
  School,
  Scissors,
  Search,
  Server,
  Shapes,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Shovel,
  Siren,
  Smartphone,
  Smile,
  Sparkles,
  SprayCan,
  Sprout,
  Stamp,
  Star,
  Stethoscope,
  Store,
  Sun,
  SwatchBook,
  Swords,
  Syringe,
  Tablet,
  Tag,
  Tags,
  Tent,
  Thermometer,
  Timer,
  TrafficCone,
  Trash2,
  TreePine,
  Trophy,
  Truck,
  Usb,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  Video,
  Volleyball,
  Wallet,
  WandSparkles,
  WashingMachine,
  Watch,
  Wifi,
  Wrench
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Language } from '../../i18n';
import type { Category } from '../../types';

type CategoryIconOption = {
  name: string;
  label: string;
  labelEn: string;
  Icon: LucideIcon;
};

type CategoryIconGroup = {
  id: string;
  label: string;
  labelEn: string;
  options: CategoryIconOption[];
};

const iconRegistry: Record<string, LucideIcon> = {
  Activity,
  Aperture,
  Apple,
  Armchair,
  Atom,
  Baby,
  Backpack,
  Badge,
  BadgeCheck,
  BadgeDollarSign,
  BaggageClaim,
  Bandage,
  Banknote,
  Barcode,
  Bath,
  BatteryCharging,
  Bed,
  Bike,
  Bird,
  Blocks,
  Bone,
  Book,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Brush,
  Cable,
  CakeSlice,
  Calculator,
  CalendarHeart,
  Camera,
  Car,
  CarFront,
  Cat,
  Cctv,
  CircleEllipsis,
  CircleParking,
  Clapperboard,
  Code2,
  Coffee,
  Coins,
  Compass,
  CookingPot,
  Cpu,
  CreditCard,
  Cross,
  Crown,
  Database,
  Dices,
  Disc3,
  Dog,
  Drill,
  Droplet,
  Droplets,
  Drum,
  Dumbbell,
  Eye,
  EyeClosed,
  Fence,
  Film,
  Fingerprint,
  Fish,
  FlaskConical,
  Flower2,
  Focus,
  Folder,
  Fuel,
  Gamepad2,
  Gauge,
  Gem,
  Gift,
  Glasses,
  Goal,
  GraduationCap,
  Guitar,
  Hammer,
  HandCoins,
  HandHeart,
  HardDrive,
  HardHat,
  Headphones,
  Heart,
  HeartPulse,
  Hospital,
  Hotel,
  House,
  IceCreamBowl,
  Image,
  Images,
  Joystick,
  KeyRound,
  Keyboard,
  Lamp,
  Laptop,
  LayoutGrid,
  Leaf,
  Library,
  List,
  LockKeyhole,
  Luggage,
  Map,
  MapPin,
  Medal,
  MicVocal,
  Microscope,
  Monitor,
  Mouse,
  Music,
  Notebook,
  Origami,
  Package,
  PaintBucket,
  Paintbrush,
  PaintbrushVertical,
  Palette,
  Paperclip,
  PartyPopper,
  PawPrint,
  PenLine,
  Pencil,
  Piano,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Printer,
  Puzzle,
  Radio,
  ReceiptText,
  Recycle,
  Refrigerator,
  Router,
  Ruler,
  Scan,
  ScanFace,
  School,
  Scissors,
  Search,
  Server,
  Shapes,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Shovel,
  Siren,
  Smartphone,
  Smile,
  Sparkles,
  SprayCan,
  Sprout,
  Stamp,
  Star,
  Stethoscope,
  Store,
  Sun,
  SwatchBook,
  Swords,
  Syringe,
  Tablet,
  Tag,
  Tags,
  Tent,
  Thermometer,
  Timer,
  TrafficCone,
  Trash2,
  TreePine,
  Trophy,
  Truck,
  Usb,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  Video,
  Volleyball,
  Wallet,
  WandSparkles,
  WashingMachine,
  Watch,
  Wifi,
  Wrench
};
const iconFallbacks: Record<string, string> = {
  Motorbike: 'Bike',
  Screwdriver: 'Wrench',
  BottleDispenser: 'SprayCan',
  Balloon: 'PartyPopper'
};

function resolveIcon(name: string): LucideIcon {
  return iconRegistry[iconFallbacks[name] ?? name] ?? Package;
}

function iconOption(name: string, label: string, labelEn: string): CategoryIconOption {
  return {
    name,
    label,
    labelEn,
    Icon: resolveIcon(name)
  };
}

export const categoryIconGroups: CategoryIconGroup[] = [
  {
    id: 'beauty',
    label: 'Makijaz / piekno',
    labelEn: 'Makeup / beauty',
    options: [
      iconOption('Brush', 'Pedzel', 'Brush'),
      iconOption('PaintbrushVertical', 'Pedzel pionowy', 'Vertical brush'),
      iconOption('Palette', 'Paleta', 'Palette'),
      iconOption('SwatchBook', 'Wzornik', 'Swatch book'),
      iconOption('Sparkles', 'Blask', 'Sparkles'),
      iconOption('WandSparkles', 'Magiczna rozdzka', 'Magic wand'),
      iconOption('Eye', 'Oko', 'Eye'),
      iconOption('EyeClosed', 'Zamkniete oko', 'Closed eye'),
      iconOption('ScanFace', 'Twarz', 'Face scan'),
      iconOption('Droplet', 'Kropla', 'Droplet'),
      iconOption('Pipette', 'Pipeta', 'Pipette'),
      iconOption('Gem', 'Klejnot', 'Gem'),
      iconOption('Heart', 'Serce', 'Heart'),
      iconOption('Star', 'Gwiazda', 'Star')
    ]
  },
  {
    id: 'automotive',
    label: 'Motoryzacja',
    labelEn: 'Automotive',
    options: [
      iconOption('Car', 'Auto', 'Car'),
      iconOption('CarFront', 'Przod auta', 'Car front'),
      iconOption('Motorbike', 'Motocykl', 'Motorbike'),
      iconOption('Bike', 'Rower', 'Bike'),
      iconOption('Truck', 'Ciezarowka', 'Truck'),
      iconOption('Fuel', 'Paliwo', 'Fuel'),
      iconOption('Gauge', 'Licznik', 'Gauge'),
      iconOption('Wrench', 'Klucz', 'Wrench'),
      iconOption('BatteryCharging', 'Akumulator', 'Battery charging'),
      iconOption('KeyRound', 'Klucz', 'Key'),
      iconOption('CircleParking', 'Parking', 'Parking'),
      iconOption('TrafficCone', 'Pacholek', 'Traffic cone')
    ]
  },
  {
    id: 'fashion',
    label: 'Moda i ubrania',
    labelEn: 'Fashion and clothing',
    options: [
      iconOption('Shirt', 'Ubrania', 'Clothing'),
      iconOption('Watch', 'Zegarek', 'Watch'),
      iconOption('Glasses', 'Okulary', 'Glasses'),
      iconOption('Gem', 'Bizuteria', 'Jewelry'),
      iconOption('Crown', 'Premium', 'Premium'),
      iconOption('ShoppingBag', 'Torba zakupowa', 'Shopping bag'),
      iconOption('SwatchBook', 'Wzornik', 'Swatch book')
    ]
  },
  {
    id: 'electronics',
    label: 'Elektronika',
    labelEn: 'Electronics',
    options: [
      iconOption('Smartphone', 'Smartfon', 'Smartphone'),
      iconOption('Laptop', 'Laptop', 'Laptop'),
      iconOption('Tablet', 'Tablet', 'Tablet'),
      iconOption('Monitor', 'Monitor', 'Monitor'),
      iconOption('Headphones', 'Sluchawki', 'Headphones'),
      iconOption('Camera', 'Aparat', 'Camera'),
      iconOption('Gamepad2', 'Pad', 'Gamepad'),
      iconOption('Cpu', 'Procesor', 'CPU'),
      iconOption('Keyboard', 'Klawiatura', 'Keyboard'),
      iconOption('Mouse', 'Mysz', 'Mouse')
    ]
  },
  {
    id: 'home',
    label: 'Dom i wyposazenie',
    labelEn: 'Home and furniture',
    options: [
      iconOption('House', 'Dom', 'House'),
      iconOption('Armchair', 'Fotel', 'Armchair'),
      iconOption('Bed', 'Lozko', 'Bed'),
      iconOption('Lamp', 'Lampa', 'Lamp'),
      iconOption('CookingPot', 'Garnek', 'Cooking pot'),
      iconOption('WashingMachine', 'Pralka', 'Washing machine'),
      iconOption('Refrigerator', 'Lodowka', 'Refrigerator'),
      iconOption('Bath', 'Wanna', 'Bath'),
      iconOption('PaintBucket', 'Farba', 'Paint bucket')
    ]
  },
  {
    id: 'sport',
    label: 'Sport',
    labelEn: 'Sports',
    options: [
      iconOption('Dumbbell', 'Hantla', 'Dumbbell'),
      iconOption('Bike', 'Rower', 'Bike'),
      iconOption('Trophy', 'Puchar', 'Trophy'),
      iconOption('Medal', 'Medal', 'Medal'),
      iconOption('Volleyball', 'Pilka', 'Volleyball'),
      iconOption('Goal', 'Bramka', 'Goal'),
      iconOption('Timer', 'Timer', 'Timer'),
      iconOption('Activity', 'Aktywnosc', 'Activity')
    ]
  },
  {
    id: 'pets',
    label: 'Produkty dla zwierzat',
    labelEn: 'Pet products',
    options: [
      iconOption('PawPrint', 'Lapa', 'Paw print'),
      iconOption('Cat', 'Kot', 'Cat'),
      iconOption('Dog', 'Pies', 'Dog'),
      iconOption('Bird', 'Ptak', 'Bird'),
      iconOption('Fish', 'Ryba', 'Fish'),
      iconOption('Bone', 'Kosc', 'Bone')
    ]
  },
  {
    id: 'books-media',
    label: 'Ksiazki i multimedia',
    labelEn: 'Books and media',
    options: [
      iconOption('BookOpen', 'Otwarta ksiazka', 'Open book'),
      iconOption('Book', 'Ksiazka', 'Book'),
      iconOption('Library', 'Biblioteka', 'Library'),
      iconOption('Music', 'Muzyka', 'Music'),
      iconOption('Film', 'Film', 'Film'),
      iconOption('Headphones', 'Sluchawki', 'Headphones'),
      iconOption('Clapperboard', 'Klapser', 'Clapperboard')
    ]
  },
  {
    id: 'food',
    label: 'Jedzenie i napoje',
    labelEn: 'Food and drinks',
    options: [
      iconOption('Utensils', 'Sztucce', 'Utensils'),
      iconOption('CookingPot', 'Garnek', 'Cooking pot'),
      iconOption('Coffee', 'Kawa', 'Coffee'),
      iconOption('Apple', 'Jablko', 'Apple'),
      iconOption('Pizza', 'Pizza', 'Pizza'),
      iconOption('CakeSlice', 'Kawalek ciasta', 'Cake slice'),
      iconOption('IceCreamBowl', 'Lody', 'Ice cream'),
      iconOption('ShoppingBasket', 'Koszyk', 'Shopping basket')
    ]
  },
  {
    id: 'kids',
    label: 'Dzieci',
    labelEn: 'Kids',
    options: [
      iconOption('Baby', 'Dziecko', 'Baby'),
      iconOption('Blocks', 'Klocki', 'Blocks'),
      iconOption('Puzzle', 'Puzzle', 'Puzzle'),
      iconOption('Backpack', 'Plecak', 'Backpack'),
      iconOption('School', 'Szkola', 'School'),
      iconOption('BookOpen', 'Ksiazka', 'Open book')
    ]
  },
  {
    id: 'premium',
    label: 'Bizuteria i premium',
    labelEn: 'Jewelry and premium',
    options: [
      iconOption('Gem', 'Klejnot', 'Gem'),
      iconOption('Crown', 'Korona', 'Crown'),
      iconOption('Sparkles', 'Blask', 'Sparkles'),
      iconOption('Watch', 'Zegarek', 'Watch'),
      iconOption('Gift', 'Prezent', 'Gift'),
      iconOption('Badge', 'Odznaka', 'Badge')
    ]
  },
  {
    id: 'tools',
    label: 'Narzedzia i remont',
    labelEn: 'Tools and renovation',
    options: [
      iconOption('Hammer', 'Mlotek', 'Hammer'),
      iconOption('Wrench', 'Klucz', 'Wrench'),
      iconOption('Drill', 'Wiertarka', 'Drill'),
      iconOption('Screwdriver', 'Srubokret', 'Screwdriver'),
      iconOption('Paintbrush', 'Pedzel', 'Paintbrush'),
      iconOption('PaintBucket', 'Farba', 'Paint bucket'),
      iconOption('Ruler', 'Miarka', 'Ruler'),
      iconOption('HardHat', 'Kask', 'Hard hat')
    ]
  },
  {
    id: 'shopping',
    label: 'Uniwersalne zakupowe',
    labelEn: 'Universal shopping',
    options: [
      iconOption('Package', 'Paczka', 'Package'),
      iconOption('ShoppingBag', 'Torba', 'Shopping bag'),
      iconOption('ShoppingBasket', 'Koszyk', 'Shopping basket'),
      iconOption('ShoppingCart', 'Wozek', 'Shopping cart'),
      iconOption('Store', 'Sklep', 'Store'),
      iconOption('Gift', 'Prezent', 'Gift'),
      iconOption('Tag', 'Tag', 'Tag'),
      iconOption('Barcode', 'Kod kreskowy', 'Barcode')
    ]
  },
  {
    id: 'health',
    label: 'Zdrowie i apteka',
    labelEn: 'Health and pharmacy',
    options: [
      iconOption('Pill', 'Tabletka', 'Pill'),
      iconOption('Stethoscope', 'Stetoskop', 'Stethoscope'),
      iconOption('HeartPulse', 'Puls', 'Heart pulse'),
      iconOption('Syringe', 'Strzykawka', 'Syringe'),
      iconOption('Thermometer', 'Termometr', 'Thermometer'),
      iconOption('Bandage', 'Bandaż', 'Bandage'),
      iconOption('Hospital', 'Szpital', 'Hospital'),
      iconOption('Cross', 'Krzyz', 'Cross')
    ]
  },
  {
    id: 'office',
    label: 'Biuro i papiernicze',
    labelEn: 'Office and stationery',
    options: [
      iconOption('BriefcaseBusiness', 'Biznes', 'Business'),
      iconOption('Printer', 'Drukarka', 'Printer'),
      iconOption('Notebook', 'Notatnik', 'Notebook'),
      iconOption('Paperclip', 'Spinacz', 'Paperclip'),
      iconOption('Calculator', 'Kalkulator', 'Calculator'),
      iconOption('Folder', 'Folder', 'Folder'),
      iconOption('PenLine', 'Dlugopis', 'Pen'),
      iconOption('Stamp', 'Pieczatka', 'Stamp')
    ]
  },
  {
    id: 'travel',
    label: 'Podroze i turystyka',
    labelEn: 'Travel and tourism',
    options: [
      iconOption('Plane', 'Samolot', 'Plane'),
      iconOption('Luggage', 'Walizka', 'Luggage'),
      iconOption('BaggageClaim', 'Bagaz', 'Baggage claim'),
      iconOption('Map', 'Mapa', 'Map'),
      iconOption('MapPin', 'Punkt na mapie', 'Map pin'),
      iconOption('Compass', 'Kompas', 'Compass'),
      iconOption('Hotel', 'Hotel', 'Hotel'),
      iconOption('Tent', 'Namiot', 'Tent')
    ]
  },
  {
    id: 'gaming',
    label: 'Gaming',
    labelEn: 'Gaming',
    options: [
      iconOption('Gamepad2', 'Pad', 'Gamepad'),
      iconOption('Joystick', 'Joystick', 'Joystick'),
      iconOption('Dices', 'Kosci', 'Dice'),
      iconOption('Swords', 'Miecze', 'Swords'),
      iconOption('Trophy', 'Puchar', 'Trophy'),
      iconOption('Headphones', 'Sluchawki', 'Headphones'),
      iconOption('Monitor', 'Monitor', 'Monitor'),
      iconOption('Cpu', 'Procesor', 'CPU')
    ]
  },
  {
    id: 'garden',
    label: 'Ogrod i rosliny',
    labelEn: 'Garden and plants',
    options: [
      iconOption('Flower2', 'Kwiat', 'Flower'),
      iconOption('Sprout', 'Kielki', 'Sprout'),
      iconOption('TreePine', 'Drzewo', 'Tree'),
      iconOption('Leaf', 'Lisc', 'Leaf'),
      iconOption('Shovel', 'Lopata', 'Shovel'),
      iconOption('Fence', 'Plot', 'Fence'),
      iconOption('Droplets', 'Krople', 'Droplets'),
      iconOption('Sun', 'Slonce', 'Sun')
    ]
  },
  {
    id: 'photo-video',
    label: 'Fotografia i wideo',
    labelEn: 'Photo and video',
    options: [
      iconOption('Camera', 'Aparat', 'Camera'),
      iconOption('Aperture', 'Przyslona', 'Aperture'),
      iconOption('Images', 'Zdjecia', 'Images'),
      iconOption('Image', 'Zdjecie', 'Image'),
      iconOption('Focus', 'Ostrosc', 'Focus'),
      iconOption('Scan', 'Skan', 'Scan'),
      iconOption('Video', 'Wideo', 'Video'),
      iconOption('Clapperboard', 'Klapser', 'Clapperboard')
    ]
  },
  {
    id: 'music',
    label: 'Muzyka i instrumenty',
    labelEn: 'Music and instruments',
    options: [
      iconOption('Music', 'Muzyka', 'Music'),
      iconOption('Guitar', 'Gitara', 'Guitar'),
      iconOption('Piano', 'Pianino', 'Piano'),
      iconOption('Drum', 'Perkusja', 'Drum'),
      iconOption('MicVocal', 'Mikrofon', 'Vocal mic'),
      iconOption('Radio', 'Radio', 'Radio'),
      iconOption('Headphones', 'Sluchawki', 'Headphones'),
      iconOption('Disc3', 'Plyta', 'Disc')
    ]
  },
  {
    id: 'finance',
    label: 'Finanse i platnosci',
    labelEn: 'Finance and payments',
    options: [
      iconOption('Wallet', 'Portfel', 'Wallet'),
      iconOption('CreditCard', 'Karta', 'Credit card'),
      iconOption('Banknote', 'Banknot', 'Banknote'),
      iconOption('Coins', 'Monety', 'Coins'),
      iconOption('ReceiptText', 'Paragon', 'Receipt'),
      iconOption('BadgeDollarSign', 'Dolar', 'Dollar badge'),
      iconOption('PiggyBank', 'Skarbonka', 'Piggy bank'),
      iconOption('HandCoins', 'Monety w dloni', 'Hand coins')
    ]
  },
  {
    id: 'it',
    label: 'Komputery i IT',
    labelEn: 'Computers and IT',
    options: [
      iconOption('Code2', 'Kod', 'Code'),
      iconOption('Database', 'Baza danych', 'Database'),
      iconOption('Server', 'Serwer', 'Server'),
      iconOption('Router', 'Router', 'Router'),
      iconOption('HardDrive', 'Dysk', 'Hard drive'),
      iconOption('Cable', 'Kabel', 'Cable'),
      iconOption('Usb', 'USB', 'USB'),
      iconOption('Wifi', 'Wi-Fi', 'Wi-Fi')
    ]
  },
  {
    id: 'security',
    label: 'Bezpieczenstwo',
    labelEn: 'Security',
    options: [
      iconOption('Shield', 'Tarcza', 'Shield'),
      iconOption('LockKeyhole', 'Zamek', 'Lock'),
      iconOption('KeyRound', 'Klucz', 'Key'),
      iconOption('Fingerprint', 'Odcisk palca', 'Fingerprint'),
      iconOption('ScanFace', 'Skan twarzy', 'Face scan'),
      iconOption('Siren', 'Syrena', 'Siren'),
      iconOption('Cctv', 'Monitoring', 'CCTV'),
      iconOption('BadgeCheck', 'Weryfikacja', 'Verified badge')
    ]
  },
  {
    id: 'hobby',
    label: 'Hobby i rekodzielo',
    labelEn: 'Hobby and crafts',
    options: [
      iconOption('Scissors', 'Nozyczki', 'Scissors'),
      iconOption('Pencil', 'Olowek', 'Pencil'),
      iconOption('Origami', 'Origami', 'Origami'),
      iconOption('Puzzle', 'Puzzle', 'Puzzle'),
      iconOption('Shapes', 'Ksztalty', 'Shapes'),
      iconOption('Ruler', 'Linijka', 'Ruler'),
      iconOption('Paintbrush', 'Pedzel', 'Paintbrush'),
      iconOption('Palette', 'Paleta', 'Palette')
    ]
  },
  {
    id: 'education',
    label: 'Nauka i edukacja',
    labelEn: 'Science and education',
    options: [
      iconOption('Microscope', 'Mikroskop', 'Microscope'),
      iconOption('FlaskConical', 'Kolba', 'Flask'),
      iconOption('Atom', 'Atom', 'Atom'),
      iconOption('GraduationCap', 'Czapka absolwenta', 'Graduation cap'),
      iconOption('School', 'Szkola', 'School'),
      iconOption('BookOpen', 'Ksiazka', 'Open book'),
      iconOption('Backpack', 'Plecak', 'Backpack'),
      iconOption('Calculator', 'Kalkulator', 'Calculator')
    ]
  },
  {
    id: 'cleaning',
    label: 'Sprzatanie i chemia',
    labelEn: 'Cleaning and household chemicals',
    options: [
      iconOption('SprayCan', 'Spray', 'Spray can'),
      iconOption('WashingMachine', 'Pralka', 'Washing machine'),
      iconOption('Droplets', 'Krople', 'Droplets'),
      iconOption('Trash2', 'Kosz', 'Trash'),
      iconOption('Recycle', 'Recykling', 'Recycle'),
      iconOption('Package', 'Opakowanie', 'Package'),
      iconOption('BottleDispenser', 'Dozownik', 'Dispenser'),
      iconOption('Sparkles', 'Czystosc', 'Sparkles')
    ]
  },
  {
    id: 'gifts',
    label: 'Prezenty i okazje',
    labelEn: 'Gifts and occasions',
    options: [
      iconOption('Gift', 'Prezent', 'Gift'),
      iconOption('CakeSlice', 'Ciasto', 'Cake slice'),
      iconOption('PartyPopper', 'Konfetti', 'Party popper'),
      iconOption('Balloon', 'Balon', 'Balloon'),
      iconOption('Heart', 'Serce', 'Heart'),
      iconOption('Flower2', 'Kwiat', 'Flower'),
      iconOption('CalendarHeart', 'Data specjalna', 'Special date'),
      iconOption('Sparkles', 'Blask', 'Sparkles')
    ]
  },
  {
    id: 'family',
    label: 'Rodzina i osoby',
    labelEn: 'Family and people',
    options: [
      iconOption('UserRound', 'Ja', 'Me'),
      iconOption('Users', 'Rodzina', 'Family'),
      iconOption('UsersRound', 'Domownicy', 'Household'),
      iconOption('Heart', 'Partner / partnerka', 'Partner'),
      iconOption('Baby', 'Dziecko', 'Child'),
      iconOption('Crown', 'Dziadkowie', 'Grandparents'),
      iconOption('HandHeart', 'Dla bliskich', 'For loved ones'),
      iconOption('Smile', 'Dla siebie', 'For me')
    ]
  },
  {
    id: 'other',
    label: 'Inne',
    labelEn: 'Other',
    options: [
      iconOption('Package', 'Paczka', 'Package'),
      iconOption('Boxes', 'Pudelka', 'Boxes'),
      iconOption('CircleEllipsis', 'Wiecej', 'More'),
      iconOption('Shapes', 'Ksztalty', 'Shapes'),
      iconOption('Tags', 'Tagi', 'Tags'),
      iconOption('LayoutGrid', 'Siatka', 'Grid'),
      iconOption('List', 'Lista', 'List'),
      iconOption('Search', 'Szukaj', 'Search')
    ]
  }
];

export const categoryIconOptions = categoryIconGroups
  .flatMap((group) => group.options)
  .filter((option, index, allOptions) => allOptions.findIndex((item) => item.name === option.name) === index);

function categoryIconLabel(option: CategoryIconOption, language: Language) {
  return language === 'en' ? option.labelEn : option.label;
}

function categoryIconGroupLabel(group: CategoryIconGroup, language: Language) {
  return language === 'en' ? group.labelEn : group.label;
}

function findGroupForIcon(iconName: string) {
  return categoryIconGroups.find((group) => group.options.some((option) => option.name === iconName)) ?? categoryIconGroups[0];
}

export const categoryColorOptions = [
  '#38bdf8',
  '#8b5cf6',
  '#2563eb',
  '#f43f5e',
  '#14b8a6',
  '#f97316',
  '#64748b',
  '#22c55e',
  '#ec4899',
  '#eab308'
];

export function IconSelect({
  value,
  onChange,
  language = 'pl'
}: {
  value: string;
  onChange: (value: string) => void;
  language?: Language;
}) {
  const [open, setOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(() => findGroupForIcon(value).id);
  const selectedOption = categoryIconOptions.find((item) => item.name === value) ?? categoryIconOptions[categoryIconOptions.length - 1];
  const SelectedIcon = selectedOption.Icon;
  const selectedLabel = categoryIconLabel(selectedOption, language);
  const chooseIconLabel = language === 'en' ? 'Choose icon' : 'Wybierz ikone';
  const activeGroup = categoryIconGroups.find((group) => group.id === activeGroupId) ?? categoryIconGroups[0];

  function togglePicker() {
    if (!open) {
      setActiveGroupId(findGroupForIcon(value).id);
    }
    setOpen((current) => !current);
  }

  return (
    <div className="space-y-2">
      <button
        className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 dark:border-[#28344C] dark:bg-[#151D30] dark:text-slate-100 dark:hover:border-[rgba(79,140,255,0.45)] dark:hover:bg-[#24314C]"
        type="button"
        onClick={togglePicker}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]">
            <SelectedIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{selectedLabel}</span>
        </span>
        <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {chooseIconLabel}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner dark:border-[#28344C] dark:bg-[#151D30]">
          <div className="mb-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">
            {categoryIconGroups.map((group) => {
              const selected = activeGroup.id === group.id;
              return (
                <button
                  key={group.id}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    selected
                      ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-[rgba(79,140,255,0.38)] dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 dark:border-[#28344C] dark:bg-[#0B1020]/35 dark:text-slate-300 dark:hover:bg-[#24314C]'
                  }`}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                >
                  {categoryIconGroupLabel(group, language)}
                </button>
              );
            })}
          </div>

          <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{categoryIconGroupLabel(activeGroup, language)}</span>
            <span>{activeGroup.options.length}</span>
          </div>

          <div className="grid max-h-56 grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2 overflow-y-auto pr-1">
            {activeGroup.options.map((option) => {
              const selected = value === option.name;
              const label = categoryIconLabel(option, language);
              return (
                <button
                  key={`${activeGroup.id}-${option.name}`}
                  aria-label={label}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 dark:hover:border-[rgba(79,140,255,0.38)] dark:hover:bg-[#24314C] ${
                    selected
                      ? 'border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-100 dark:border-[rgba(79,140,255,0.38)] dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF] dark:ring-[rgba(79,140,255,0.28)]'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-[#28344C] dark:bg-[#151D30] dark:text-slate-300'
                  }`}
                  type="button"
                  onClick={() => {
                    onChange(option.name);
                    setOpen(false);
                  }}
                  title={label}
                >
                  <option.Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
  language = 'pl'
}: {
  value: string;
  onChange: (value: string) => void;
  language?: Language;
}) {
  const customColorSelected = !categoryColorOptions.some((color) => color.toLowerCase() === value.toLowerCase());
  const customColorLabel = language === 'en' ? 'Custom color' : 'Wlasny kolor';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {categoryColorOptions.map((color) => (
        <button
          key={color}
          className={`h-8 w-8 rounded-full border-2 shadow-sm transition hover:-translate-y-0.5 ${value.toLowerCase() === color.toLowerCase() ? 'border-slate-900 ring-2 ring-sky-100 dark:border-white dark:ring-[rgba(79,140,255,0.28)]' : 'border-white dark:border-[#28344C]'}`}
          style={{ backgroundColor: color }}
          type="button"
          onClick={() => onChange(color)}
          title={color}
        />
      ))}
      <label
        className={`relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 shadow-sm transition hover:-translate-y-0.5 ${
          customColorSelected
            ? 'border-slate-900 ring-2 ring-sky-100 dark:border-white dark:ring-[rgba(79,140,255,0.28)]'
            : 'border-white dark:border-[#28344C]'
        }`}
        style={{
          background: 'conic-gradient(from 90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)'
        }}
        title={customColorLabel}
      >
        <Pipette className="relative z-10 h-4 w-4 text-white drop-shadow" />
        <input
          aria-label={customColorLabel}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const option = categoryIconOptions.find((item) => item.name === name) ?? categoryIconOptions[categoryIconOptions.length - 1];
  const Icon = option.Icon;
  return <Icon className={className} />;
}

export function categoryColor(category: Category) {
  return normalizeCategoryColor(category.colorHex) ?? defaultCategoryColor(category.name);
}

function normalizeCategoryColor(color?: string | null) {
  if (!color) {
    return undefined;
  }

  const normalized = color.startsWith('#') ? color : `#${color}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return undefined;
  }

  return isVeryDarkColor(normalized) ? undefined : normalized;
}

function isVeryDarkColor(color: string) {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);
  return luminance < 42;
}

function defaultCategoryColor(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('ubran') || normalized.includes('bluz') || normalized.includes('odzie')) {
    return '#38bdf8';
  }
  if (normalized.includes('but')) {
    return '#8b5cf6';
  }
  if (normalized.includes('elektr') || normalized.includes('komputer') || normalized.includes('it')) {
    return '#2563eb';
  }
  if (normalized.includes('kosmet') || normalized.includes('beauty') || normalized.includes('piek')) {
    return '#f43f5e';
  }
  if (normalized.includes('dom') || normalized.includes('ogrod')) {
    return '#14b8a6';
  }
  if (normalized.includes('ksiaz') || normalized.includes('ksi') || normalized.includes('book')) {
    return '#f97316';
  }
  if (normalized.includes('auto') || normalized.includes('moto')) {
    return '#64748b';
  }
  if (normalized.includes('sport')) {
    return '#22c55e';
  }
  if (normalized.includes('prezent') || normalized.includes('okaz')) {
    return '#ec4899';
  }
  return '#64748b';
}
