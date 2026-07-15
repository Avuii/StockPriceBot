import { LogOut, Moon, Percent, Plus, Sun } from 'lucide-react';
import type { Language } from '../../i18n';
import { navLabel, t } from '../../i18n';
import type { View } from '../../app/types';
import { LanguageSelect } from '../common/LanguageSelect';
import { BrandLogo } from '../common/ui';
import { navigationItems } from './navigation';

export function DesktopSidebar({
  activeView,
  userEmail,
  language,
  onViewChange,
  onAddProduct,
  onLogout,
  alertCount
}: {
  activeView: View;
  userEmail: string;
  language: Language;
  onViewChange: (view: View) => void;
  onAddProduct: () => void;
  onLogout: () => void;
  alertCount: number;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[var(--border-primary)] bg-[var(--bg-sidebar)] px-4 py-5 shadow-sm lg:flex lg:flex-col">
      <div className="mb-6 flex items-center gap-3 px-2">
        <BrandLogo size="lg" />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-normal text-slate-950 dark:text-white">StockPriceBot</h1>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{t(language, 'smartPriceTracker')}</p>
        </div>
      </div>

      <button className="primary-button mb-5 w-full" type="button" onClick={onAddProduct}>
        <Plus className="h-4 w-4" />
        {t(language, 'trackNewProduct')}
      </button>

      <nav className="space-y-1">
        {navigationItems.map(({ view, Icon }) => (
          <button
            key={view}
            className={activeView === view ? 'nav-item nav-item-active' : 'nav-item'}
            type="button"
            onClick={() => onViewChange(view)}
          >
            <Icon className="h-4 w-4" />
            <span className="min-w-0 flex-1">{navLabel(language, view)}</span>
            {view === 'notifications' && alertCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${activeView === view ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'}`}>
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-950 dark:border-[rgba(79,140,255,0.24)] dark:bg-[rgba(79,140,255,0.14)] dark:text-[#F5F7FB]">
        <div className="flex items-center gap-2 font-semibold">
          <Percent className="h-4 w-4 text-rose-500" />
          Smart shopping
        </div>
        <p className="mt-1 text-sky-800 dark:text-[#DCEBFF]">{t(language, 'shoppingHint')}</p>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-[#28344C] dark:bg-[#151D30]">
        <div className="text-xs font-semibold uppercase tracking-normal text-slate-400">{t(language, 'account')}</div>
        <div className="mt-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{userEmail}</div>
      </div>

      <button className="text-button mt-3 w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        {t(language, 'logout')}
      </button>
    </aside>
  );
}

export function TopBar({
  activeView,
  userEmail,
  language,
  onLanguageChange,
  onToggleTheme,
  onLogout,
  darkMode
}: {
  activeView: View;
  userEmail: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  darkMode: boolean;
}) {
  const item = navigationItems.find((navItem) => navItem.view === activeView) ?? navigationItems[0];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-primary)] bg-[var(--bg-topbar)] px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <BrandLogo />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <item.Icon className="h-4 w-4" />
              {navLabel(language, item.view)}
            </div>
            <p className="truncate text-xs text-slate-400 lg:hidden">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelect language={language} onChange={onLanguageChange} label={t(language, 'language')} compact />
          <button className="icon-button" onClick={onToggleTheme} title={t(language, 'theme')}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="icon-button lg:hidden" onClick={onLogout} title={t(language, 'logout')}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileNavigation({
  activeView,
  onViewChange,
  alertCount,
  language
}: {
  activeView: View;
  onViewChange: (view: View) => void;
  alertCount: number;
  language: Language;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-[var(--border-primary)] bg-[var(--bg-topbar)] px-2 py-2 shadow-panel lg:hidden"
      style={{ gridTemplateColumns: `repeat(${navigationItems.length}, minmax(0, 1fr))` }}
    >
      {navigationItems.map(({ view, Icon }) => (
        <button
          key={view}
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition ${activeView === view ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF] dark:ring-[rgba(79,140,255,0.28)]' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#24314C]'}`}
          type="button"
          onClick={() => onViewChange(view)}
        >
          <span className="relative">
            <Icon className="h-4 w-4" />
            {view === 'notifications' && alertCount > 0 && (
              <span className="absolute -right-2 -top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#151D30]" />
            )}
          </span>
          <span className="max-w-full truncate">{navLabel(language, view).split(' ')[0]}</span>
        </button>
      ))}
    </nav>
  );
}
