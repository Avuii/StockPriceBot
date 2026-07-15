import { useState } from 'react';
import type { FormEvent } from 'react';
import { FolderPlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { type Language, t } from '../../i18n';
import type { Category } from '../../types';
import {
  categoryColor,
  categoryColorOptions,
  CategoryIcon,
  ColorPicker,
  IconSelect
} from './categoryVisuals';

type CategoryManagerProps = {
  categories: Category[];
  activeCategory: string;
  onFilterCategory: (categoryName: string) => void;
  onCreateCategory: (name: string, iconName?: string, colorHex?: string) => Promise<Category | undefined>;
  onUpdateCategory: (category: Category, name: string, iconName?: string | null, colorHex?: string | null) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
  expanded?: boolean;
  language: Language;
};

export function CategoryManager({
  categories,
  activeCategory,
  onFilterCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  expanded = false,
  language
}: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Tag');
  const [newColor, setNewColor] = useState(categoryColorOptions[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Tag');
  const [editColor, setEditColor] = useState(categoryColorOptions[0]);

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await onCreateCategory(newName, newIcon, newColor);
    if (created) {
      setNewName('');
      setNewIcon('Tag');
      setNewColor(categoryColorOptions[0]);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.iconName ?? 'Tag');
    setEditColor(categoryColor(category));
  }

  async function submitEdit(category: Category) {
    await onUpdateCategory(category, editName, editIcon, editColor);
    setEditingId(null);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-normal">{t(language, 'categories')}</h2>
        <FolderPlus className="h-5 w-5 text-teal-700 dark:text-[#DCEBFF]" />
      </div>

      <form className="grid gap-2" onSubmit={submitNew}>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input className="field" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={t(language, 'addCategory')} />
          <button className="icon-button shrink-0" type="submit" title={t(language, 'addCategoryTitle')}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <IconSelect value={newIcon} onChange={setNewIcon} language={language} />
        <ColorPicker value={newColor} onChange={setNewColor} language={language} />
      </form>

      <div className={expanded ? 'mt-4 grid gap-2 sm:grid-cols-2' : 'mt-4 space-y-2'}>
        {categories.length === 0 ? (
          <span className="text-sm text-stone-500 dark:text-stone-400">{t(language, 'noCategories')}</span>
        ) : categories.map((category) => (
          <div key={category.id} className="rounded-md border border-stone-200 bg-stone-50 p-2 dark:border-[#28344C] dark:bg-[#151D30]">
            {editingId === category.id ? (
              <div className="grid gap-2">
                <input className="field" value={editName} onChange={(event) => setEditName(event.target.value)} />
                <IconSelect value={editIcon} onChange={setEditIcon} language={language} />
                <ColorPicker value={editColor} onChange={setEditColor} language={language} />
                <div className="flex gap-2">
                  <button className="icon-button" type="button" onClick={() => submitEdit(category)} title={t(language, 'saveChanges')}>
                    <Save className="h-4 w-4" />
                  </button>
                  <button className="icon-button" type="button" onClick={() => setEditingId(null)} title={t(language, 'cancel')}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                    activeCategory === category.name
                      ? 'bg-sky-50 text-sky-800 shadow-sm ring-1 ring-sky-200 dark:bg-[#24314C] dark:text-[#F5F7FB] dark:ring-[rgba(79,140,255,0.34)]'
                      : 'text-stone-700 hover:bg-white dark:text-[#F5F7FB] dark:hover:bg-[#24314C]'
                  }`}
                  type="button"
                  onClick={() => onFilterCategory(category.name)}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: categoryColor(category) }}
                  >
                    <CategoryIcon name={category.iconName} className="h-4 w-4" />
                  </span>
                  <span className="truncate font-medium">{category.name}</span>
                  <span className={`ml-auto rounded px-2 py-0.5 text-xs ${activeCategory === category.name ? 'bg-sky-100 text-sky-800 dark:bg-[rgba(79,140,255,0.2)] dark:text-[#F5F7FB]' : 'bg-white text-stone-500 dark:bg-[#24314C] dark:text-[#F5F7FB]'}`}>
                    {category.productCount}
                  </span>
                </button>
                <button className="icon-button shrink-0" type="button" onClick={() => startEdit(category)} title={t(language, 'edit')}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="icon-button shrink-0 hover:border-rose-500 hover:text-rose-700" type="button" onClick={() => onDeleteCategory(category)} title={t(language, 'deleteCategory')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
