import { Grid3X3, List } from 'lucide-react';
import type { ProductViewMode } from '../../app/types';
import { type Language, t } from '../../i18n';

export function ViewSwitch({ viewMode, setViewMode, language }: { viewMode: ProductViewMode; setViewMode: (mode: ProductViewMode) => void; language: Language }) {
  return (
    <div className="inline-flex h-11 shrink-0 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-[#28344C] dark:bg-[#151D30]">
      <button
        className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition ${viewMode === 'list' ? 'bg-sky-50 text-sky-800 shadow-sm dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#24314C]'}`}
        onClick={() => setViewMode('list')}
        type="button"
        title={t(language, 'listViewTitle')}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">{t(language, 'listView')}</span>
      </button>
      <button
        className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition ${viewMode === 'grid' ? 'bg-sky-50 text-sky-800 shadow-sm dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#24314C]'}`}
        onClick={() => setViewMode('grid')}
        type="button"
        title={t(language, 'imageViewTitle')}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="hidden sm:inline">{t(language, 'imageView')}</span>
      </button>
    </div>
  );
}
