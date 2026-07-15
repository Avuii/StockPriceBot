export function FilterCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 dark:border-[#28344C] dark:bg-[#151D30] dark:text-[#F5F7FB]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
