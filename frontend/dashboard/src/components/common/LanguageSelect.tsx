import { Globe2 } from 'lucide-react';
import type { Language } from '../../i18n';
import { CustomSelect } from './CustomSelect';

type LanguageSelectProps = {
  language: Language;
  onChange: (language: Language) => void;
  compact?: boolean;
  label?: string;
};

export function LanguageSelect({ language, onChange, compact = false, label = 'Language' }: LanguageSelectProps) {
  return (
    <div className={compact ? 'w-[112px]' : 'w-[160px]'}>
      <CustomSelect
        label={compact ? undefined : label}
        value={language}
        onChange={(value) => onChange(value as Language)}
        buttonClassName={compact ? 'min-h-10 px-3' : ''}
        options={[
          { value: 'pl', label: 'PL', icon: <Globe2 className="h-4 w-4 text-sky-600 dark:text-[#DCEBFF]" /> },
          { value: 'en', label: 'ENG', icon: <Globe2 className="h-4 w-4 text-sky-600 dark:text-[#DCEBFF]" /> }
        ]}
      />
    </div>
  );
}
