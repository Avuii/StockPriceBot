import type { ReactNode } from 'react';

export function Shell({ darkMode, children }: { darkMode: boolean; children: ReactNode }) {
  return <div className={darkMode ? 'dark' : ''}>{children}</div>;
}

export function BrandLogo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const className = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  return <img className={`${className} rounded-lg object-cover shadow-sm`} src={`${import.meta.env.BASE_URL}logo.png`} alt="StockPriceBot" />;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600 dark:bg-[#151D30] dark:text-[#DCEBFF]">{children}</span>;
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-50 px-2 py-2 dark:bg-[#151D30]">
      <div className="text-[11px] font-semibold uppercase tracking-normal text-stone-400">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-stone-800 dark:text-stone-100">{value}</div>
    </div>
  );
}

export function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number | string; tone: 'teal' | 'green' | 'amber' | 'rose' }) {
  const toneClass = {
    teal: 'bg-sky-50 text-sky-800 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]',
    green: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
    rose: 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200'
  }[tone];

  return (
    <div className="panel p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
      <div className="text-2xl font-bold tracking-normal text-slate-950 dark:text-white">{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-3 text-left text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-[rgba(79,140,255,0.28)] ${
        checked
          ? 'border-sky-200 bg-sky-50 text-sky-950 dark:border-[rgba(79,140,255,0.34)] dark:bg-[rgba(79,140,255,0.14)] dark:text-[#F5F7FB]'
          : 'border-slate-200 bg-white text-slate-700 dark:border-[#28344C] dark:bg-[#151D30] dark:text-slate-200'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        <span
          className={`relative h-7 w-12 rounded-full p-0.5 transition ${
            checked
              ? 'brand-gradient'
              : 'bg-slate-200 dark:bg-[#24314C]'
          }`}
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
        <span className={`w-8 text-xs font-bold tracking-normal ${checked ? 'text-sky-700 dark:text-[#DCEBFF]' : 'text-slate-400 dark:text-slate-500'}`}>
          {checked ? 'ON' : 'OFF'}
        </span>
      </span>
    </button>
  );
}
