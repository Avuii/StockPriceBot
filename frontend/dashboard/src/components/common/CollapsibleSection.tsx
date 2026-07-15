import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
};

export function CollapsibleSection({
  title,
  description,
  icon,
  actions,
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className = '',
  contentClassName = ''
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const contentId = useId();

  useEffect(() => {
    if (controlledOpen === undefined) {
      setInternalOpen(defaultOpen);
    }
  }, [controlledOpen, defaultOpen, title]);

  function toggleOpen() {
    const nextOpen = !open;
    onOpenChange?.(nextOpen);
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
  }

  return (
    <section className={`panel overflow-hidden p-0 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg ${className}`}>
      <div className="flex items-start justify-between gap-3 p-4">
        <button
          aria-controls={contentId}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          type="button"
          onClick={toggleOpen}
        >
          {icon && (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]">
              {icon}
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-base font-semibold text-slate-950 dark:text-white">{title}</span>
            {description && <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{description}</span>}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            aria-controls={contentId}
            aria-expanded={open}
            className="icon-button"
            type="button"
            onClick={toggleOpen}
            title={open ? 'Zwin sekcje' : 'Rozwin sekcje'}
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`px-4 pb-4 ${contentClassName}`}>{children}</div>
        </div>
      </div>
    </section>
  );
}
