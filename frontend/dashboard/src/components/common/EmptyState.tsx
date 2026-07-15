import { Plus, Search, X } from 'lucide-react';

export function EmptyState({ title, actionLabel, onAction, variant = 'add' }: { title: string; actionLabel: string; onAction: () => void; variant?: 'add' | 'clear' }) {
  return (
    <div className="panel flex flex-col items-center justify-center px-5 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-teal-50 text-teal-800 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]">
        <Search className="h-5 w-5" />
      </div>
      <p className="text-base font-semibold text-stone-800 dark:text-stone-100">{title}</p>
      <button className={variant === 'clear' ? 'text-button mt-4' : 'primary-button mt-4'} type="button" onClick={onAction}>
        {variant === 'clear' ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {actionLabel}
      </button>
    </div>
  );
}
