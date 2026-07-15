import { BarChart3, TrendingDown } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { type Language, t } from '../../i18n';

type SavingsPoint = {
  label: string;
  value: number;
  monthly?: number;
};

type SavingsOverTimeCardProps = {
  rows: SavingsPoint[];
  total: number;
  currency: string;
  language: Language;
};

export function SavingsOverTimeCard({ rows, total, currency, language }: SavingsOverTimeCardProps) {
  const chartRows = rows.length > 0 ? rows : emptyRows();
  const hasSavings = chartRows.some((row) => row.value > 0 || (row.monthly ?? 0) > 0);

  return (
    <section className="panel overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]">
            <BarChart3 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">{t(language, 'savingsOverTime')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, 'savingsTrend')}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
          <TrendingDown className="h-3.5 w-3.5" />
          {formatMoney(total, currency, language)}
        </span>
      </div>
      <div className="px-4 pb-4">
        <div className="relative h-64 rounded-[1.35rem] border border-slate-100 bg-white p-3 shadow-sm dark:border-[#28344C] dark:bg-[#151D30]">
          {!hasSavings && (
            <div className="absolute inset-3 z-10 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 text-center text-sm text-slate-500 backdrop-blur-sm dark:border-[#28344C] dark:bg-[#151D30]/80 dark:text-slate-400">
              {t(language, 'noSavingsHistory')}
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartRows} margin={{ top: 16, right: 14, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(value) => compactMoney(Number(value), currency, language)}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatMoney(Number(value), currency, language),
                  name === 'monthly' ? t(language, 'currentMonth') : t(language, 'total')
                ]}
                labelClassName="font-semibold text-slate-900"
                contentStyle={{
                  borderRadius: 18,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 18px 44px rgba(15, 23, 42, 0.14)'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                strokeWidth={3}
                fill="url(#savingsGradient)"
                dot={{ r: 4, fill: '#0ea5e9', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#ffffff', strokeWidth: 3 }}
              />
              <Area
                type="monotone"
                dataKey="monthly"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="transparent"
                dot={{ r: 3, fill: '#14b8a6', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function emptyRows() {
  return [
    { label: 'Feb', value: 0, monthly: 0 },
    { label: 'Mar', value: 0, monthly: 0 },
    { label: 'Apr', value: 0, monthly: 0 },
    { label: 'May', value: 0, monthly: 0 },
    { label: 'Jun', value: 0, monthly: 0 },
    { label: 'Jul', value: 0, monthly: 0 }
  ];
}

function formatMoney(value: number, currency: string, language: Language) {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pl-PL', { style: 'currency', currency }).format(value);
}

function compactMoney(value: number, currency: string, language: Language) {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pl-PL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}
