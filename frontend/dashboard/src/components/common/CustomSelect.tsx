import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type CustomSelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
};

export function CustomSelect({
  value,
  options,
  onChange,
  label,
  placeholder = 'Wybierz',
  className = '',
  buttonClassName = '',
  menuClassName = ''
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      {label && <span className="label mb-1.5 block">{label}</span>}
      <button
        aria-controls={id}
        aria-expanded={open}
        className={`custom-select-button ${buttonClassName}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon}
          <span className={`truncate ${selectedOption ? '' : 'text-slate-400'}`}>{selectedOption?.label ?? placeholder}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={id}
          className={`absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-panel animate-in fade-in zoom-in-95 dark:border-[#28344C] dark:bg-[#151D30] ${menuClassName}`}
          role="listbox"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold transition ${
                  selected
                    ? 'bg-sky-50 text-sky-800 dark:bg-[rgba(79,140,255,0.14)] dark:text-[#DCEBFF]'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#24314C]'
                }`}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.icon}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
