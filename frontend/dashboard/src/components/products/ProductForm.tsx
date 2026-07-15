import { useState } from 'react';
import type { FormEvent } from 'react';
import { FolderPlus, Plus, Save } from 'lucide-react';
import { sizeOptions } from '../../app/constants';
import type { ProductFormState } from '../../app/types';
import { numberOrUndefined } from '../../app/productHelpers';
import {
  categoryColorOptions,
  ColorPicker,
  IconSelect
} from '../categories/categoryVisuals';
import { CustomSelect } from '../common/CustomSelect';
import { Badge, Field, Toggle } from '../common/ui';
import { type Language, t } from '../../i18n';
import { formatMoney } from '../../lib/formatters';
import type { Category } from '../../types';

type ProductFormProps = {
  form: ProductFormState;
  setForm: (form: ProductFormState) => void;
  categories: Category[];
  onCreateCategory: (name: string, iconName?: string, colorHex?: string) => Promise<Category | undefined>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isEdit?: boolean;
  language: Language;
};

export function ProductForm({
  form,
  setForm,
  categories,
  onCreateCategory,
  onSubmit,
  submitLabel,
  isEdit = false,
  language
}: ProductFormProps) {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColorOptions[0]);
  const selectedCategoryExists = !form.categoryName || categories.some((category) => category.name === form.categoryName);
  const categoryOptions = [
    { value: '', label: t(language, 'uncategorized') },
    ...(!selectedCategoryExists ? [{ value: form.categoryName, label: form.categoryName }] : []),
    ...categories.map((category) => ({ value: category.name, label: category.name }))
  ];

  async function createInlineCategory() {
    const created = await onCreateCategory(newCategoryName, newCategoryIcon, newCategoryColor);
    if (created) {
      setForm({ ...form, categoryName: created.name });
      setNewCategoryName('');
      setNewCategoryIcon('Tag');
      setNewCategoryColor(categoryColorOptions[0]);
      setShowNewCategory(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label={t(language, 'productName')}>
        <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </Field>
      <Field label={t(language, 'link')}>
        <input className="field" type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t(language, 'storePlatform')}>
          <input className="field" value={form.shopName} onChange={(event) => setForm({ ...form, shopName: event.target.value })} />
        </Field>
        <Field label={t(language, 'category')}>
          <div className="flex gap-2">
            <CustomSelect className="flex-1" value={form.categoryName} onChange={(value) => setForm({ ...form, categoryName: value })} options={categoryOptions} />
            <button className="icon-button shrink-0" type="button" onClick={() => setShowNewCategory((value) => !value)} title={t(language, 'addCategoryTitle')}>
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
        </Field>
      </div>
      {showNewCategory && (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 dark:border-[#28344C] dark:bg-[#151D30]">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="field"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder={t(language, 'categoryName')}
            />
            <button className="soft-primary-button min-h-10 px-3" type="button" onClick={createInlineCategory}>
              <Plus className="h-4 w-4" />
              {t(language, 'add')}
            </button>
          </div>
          <div className="mt-3">
            <IconSelect value={newCategoryIcon} onChange={setNewCategoryIcon} language={language} />
          </div>
          <div className="mt-3">
            <ColorPicker value={newCategoryColor} onChange={setNewCategoryColor} language={language} />
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t(language, 'size')}>
          <input className="field" list="sizes" value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
        </Field>
        <Field label={t(language, 'color')}>
          <input className="field" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
        </Field>
      </div>
      <datalist id="sizes">
        {sizeOptions.map((size) => <option key={size} value={size} />)}
      </datalist>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t(language, 'basePrice')}>
          <input className="field" type="number" step="0.01" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} />
        </Field>
        <Field label={t(language, 'currentPrice')}>
          <input className="field" type="number" step="0.01" value={form.currentPrice} onChange={(event) => setForm({ ...form, currentPrice: event.target.value })} />
        </Field>
        <Field label={t(language, 'targetPrice')}>
          <input className="field" type="number" step="0.01" value={form.targetPrice} onChange={(event) => setForm({ ...form, targetPrice: event.target.value })} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t(language, 'currency')}>
          <CustomSelect
            value={form.currency || 'PLN'}
            onChange={(value) => setForm({ ...form, currency: value })}
            options={[
              { value: 'PLN', label: 'PLN - zloty' },
              { value: 'EUR', label: 'EUR - euro' },
              { value: 'USD', label: 'USD - dollar' }
            ]}
          />
        </Field>
        <Field label={t(language, 'minimumDropPercent')}>
          <input className="field" type="number" step="1" value={form.percentDrop} onChange={(event) => setForm({ ...form, percentDrop: event.target.value })} />
        </Field>
      </div>
      <Field label={t(language, 'note')}>
        <textarea className="field min-h-20 py-2" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
      </Field>
      <Field label={t(language, 'imageUrl')}>
        <input className="field" type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t(language, 'priceSelector')}>
          <input className="field font-mono text-xs" value={form.priceSelector} onChange={(event) => setForm({ ...form, priceSelector: event.target.value })} placeholder=".product-price" />
        </Field>
        <Field label={t(language, 'stockSelector')}>
          <input className="field font-mono text-xs" value={form.stockSelector} onChange={(event) => setForm({ ...form, stockSelector: event.target.value })} placeholder=".availability" />
        </Field>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#28344C] dark:bg-[#151D30]">
        <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-400">{t(language, 'cardPreview')}</div>
        <div className="flex gap-3 rounded-lg bg-white p-3 dark:bg-[#151D30]">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-[#151D30]">
            {form.imageUrl ? <img className="h-full w-full object-cover" src={form.imageUrl} alt="" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{form.name || t(language, 'productName')}</p>
            <p className="mt-1 text-xs text-slate-500">{form.shopName || t(language, 'store')} / {form.categoryName || t(language, 'uncategorized')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.size && <Badge>{t(language, 'size')} {form.size}</Badge>}
              {form.color && <Badge>{form.color}</Badge>}
              <span className="text-sm font-semibold text-sky-700 dark:text-[#DCEBFF]">
                {formatMoney(numberOrUndefined(form.currentPrice), form.currency || 'PLN')}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle checked={form.isAvailable} label={t(language, 'available')} onChange={(value) => setForm({ ...form, isAvailable: value })} />
        <Toggle checked={form.trackStock} label={t(language, 'stockAlert')} onChange={(value) => setForm({ ...form, trackStock: value })} />
        <Toggle checked={form.isActive} label={t(language, 'monitoring')} onChange={(value) => setForm({ ...form, isActive: value })} />
      </div>
      <button className={isEdit ? 'soft-primary-button w-full' : 'primary-button w-full'} type="submit">
        {isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {submitLabel}
      </button>
    </form>
  );
}
