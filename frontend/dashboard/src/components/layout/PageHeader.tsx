import type { ReactNode } from 'react';

export function PageHeader({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF] dark:ring-[rgba(79,140,255,0.28)]">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-normal text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0 sm:self-start">{action}</div>}
    </div>
  );
}
