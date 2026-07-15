import { Bookmark, Eye, MoreHorizontal, Pencil, Power, RefreshCw, Trash2 } from 'lucide-react';
import { type Language, t } from '../../i18n';

type ProductActionsMenuProps = {
  isActive: boolean;
  isBookmarked: boolean;
  language?: Language;
  onPreview: () => void;
  onEdit: () => void;
  onCheck: () => void;
  onToggleBookmark: () => void;
  onToggleMonitoring: () => void;
  onDelete: () => void;
};

export function ProductActionsMenu({
  isActive,
  isBookmarked,
  language = 'pl',
  onPreview,
  onEdit,
  onCheck,
  onToggleBookmark,
  onToggleMonitoring,
  onDelete
}: ProductActionsMenuProps) {
  return (
    <details className="product-actions-menu group relative z-20">
      <summary className="actions-summary icon-button cursor-pointer" title={t(language, 'actions')}>
        <MoreHorizontal className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 top-full z-[120] mt-2 grid w-60 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-panel dark:border-[#28344C] dark:bg-[#151D30]">
        <button className="menu-action" type="button" onClick={onPreview}>
          <Eye className="h-4 w-4" />
          {t(language, 'quickPreview')}
        </button>
        <button className="menu-action" type="button" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          {t(language, 'edit')}
        </button>
        <button className="menu-action" type="button" onClick={onCheck}>
          <RefreshCw className="h-4 w-4" />
          {t(language, 'refreshPrice')}
        </button>
        <button className="menu-action" type="button" onClick={onToggleMonitoring}>
          <Power className="h-4 w-4" />
          {isActive ? t(language, 'pauseMonitoring') : t(language, 'resumeMonitoring')}
        </button>
        <button className="menu-action" type="button" onClick={onToggleBookmark}>
          <Bookmark className={`h-4 w-4 text-sky-700 ${isBookmarked ? 'fill-current' : ''}`} />
          {isBookmarked ? t(language, 'removeBookmark') : t(language, 'bookmarkProduct')}
        </button>
        <button className="menu-action menu-action-danger" type="button" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          {t(language, 'deleteProduct')}
        </button>
      </div>
    </details>
  );
}
