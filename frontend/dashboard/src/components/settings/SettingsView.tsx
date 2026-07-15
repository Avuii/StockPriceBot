import { useState } from 'react';
import type { FormEvent } from 'react';
import { Clock3, Copy, Eye, EyeOff, KeyRound, ListChecks, Mail, Save, Send, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../../api';
import { type Language, t } from '../../i18n';
import type { AccountSettings, EmailTestResult } from '../../types';
import { CustomSelect } from '../common/CustomSelect';
import { Field, Toggle } from '../common/ui';

type SettingsViewProps = {
  settings: AccountSettings;
  setSettings: (settings: AccountSettings) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTestEmail: () => Promise<EmailTestResult>;
  apiToken: string;
  language: Language;
};

const checkIntervalOptions = [
  { value: '15', labelKey: 'interval15Minutes' },
  { value: '30', labelKey: 'interval30Minutes' },
  { value: '60', labelKey: 'interval1Hour' },
  { value: '180', labelKey: 'interval3Hours' },
  { value: '360', labelKey: 'interval6Hours' },
  { value: '720', labelKey: 'interval12Hours' },
  { value: '1440', labelKey: 'interval24Hours' }
] as const;

export function SettingsView({
  settings,
  setSettings,
  onSubmit,
  onTestEmail,
  apiToken,
  language
}: SettingsViewProps) {
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestMessage, setEmailTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('pricestockbot.displayName') ?? '');
  const [currency, setCurrency] = useState(() => localStorage.getItem('pricestockbot.currency') ?? 'PLN');
  const [preferredStores, setPreferredStores] = useState(() => localStorage.getItem('pricestockbot.preferredStores') ?? '');

  async function copyApiToken() {
    if (!apiToken) {
      return;
    }

    await navigator.clipboard.writeText(apiToken);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function submitSettings(event: FormEvent<HTMLFormElement>) {
    localStorage.setItem('pricestockbot.displayName', displayName);
    localStorage.setItem('pricestockbot.currency', currency);
    localStorage.setItem('pricestockbot.preferredStores', preferredStores);
    onSubmit(event);
  }

  async function testEmailSettings() {
    setIsTestingEmail(true);
    setEmailTestMessage(null);

    try {
      const result = await onTestEmail();
      setEmailTestMessage({ type: result.success ? 'success' : 'error', text: result.message });
    } catch (testError) {
      const message = testError instanceof Error
        ? testError.message.replace(/^API \d+:\s*/, '')
        : t(language, 'emailTestFailed');
      setEmailTestMessage({
        type: 'error',
        text: message
      });
    } finally {
      setIsTestingEmail(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel grid gap-4 p-5 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-[#28344C] dark:bg-[#0B1020]/35">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-sky-700 dark:text-[#DCEBFF]" />
            <div>
              <h2 className="text-base font-semibold tracking-normal">{t(language, 'onboardingTitle')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, 'onboardingDescription')}</p>
            </div>
          </div>
          <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>{t(language, 'onboardingStepLogin')}</li>
            <li>{t(language, 'onboardingStepToken')}</li>
            <li>{t(language, 'onboardingStepTrack')}</li>
          </ol>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-[#28344C] dark:bg-[#0B1020]/35">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-200" />
            <h2 className="text-base font-semibold tracking-normal">{t(language, 'privacyTitle')}</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>{t(language, 'privacyReads')}</li>
            <li>{t(language, 'privacyToken')}</li>
            <li>{t(language, 'privacyBackend')}</li>
            <li>{t(language, 'privacyNoAffiliate')}</li>
            <li>{t(language, 'privacyPasswords')}</li>
          </ul>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">{t(language, 'extensionApi')}</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t(language, 'extensionApiDescription')}</p>
          </div>
          <KeyRound className="h-5 w-5 text-teal-700 dark:text-[#DCEBFF]" />
        </div>

        <Field label={t(language, 'backendApi')}>
          <input className="field" value={API_BASE_URL} readOnly />
        </Field>

        <Field label={t(language, 'apiToken')}>
          <div className="flex gap-2">
            <input
              className="field font-mono text-xs"
              type={showToken ? 'text' : 'password'}
              value={apiToken}
              readOnly
            />
            <button className="icon-button shrink-0" type="button" onClick={() => setShowToken((value) => !value)} title={showToken ? t(language, 'hideToken') : t(language, 'showToken')}>
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button className="text-button shrink-0" type="button" onClick={copyApiToken} disabled={!apiToken}>
              <Copy className="h-4 w-4" />
              {copied ? t(language, 'copied') : t(language, 'copy')}
            </button>
          </div>
        </Field>
      </section>

      <form className="panel space-y-4 p-5" onSubmit={submitSettings}>
        <div>
          <h2 className="text-lg font-semibold tracking-normal">{t(language, 'accountSettings')}</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t(language, 'accountSettingsDescription')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t(language, 'displayName')}>
            <input className="field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="np. Ola" />
          </Field>
          <Field label={t(language, 'currency')}>
            <CustomSelect
              value={currency}
              onChange={setCurrency}
              options={[
                { value: 'PLN', label: 'PLN - zloty' },
                { value: 'EUR', label: 'EUR - euro' },
                { value: 'USD', label: 'USD - dollar' }
              ]}
            />
          </Field>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-[#28344C] dark:bg-[#151D30]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-normal">{t(language, 'emailDeliverySettings')}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(language, 'emailDeliveryDescription')}</p>
            </div>
            <Mail className="h-5 w-5 text-sky-700 dark:text-[#DCEBFF]" />
          </div>

          <Field label={t(language, 'alertEmail')}>
            <input className="field" type="email" value={settings.alertEmail ?? ''} onChange={(event) => setSettings({ ...settings, alertEmail: event.target.value })} placeholder="np. twoj@email.pl" />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'alertEmailExactHint')}</p>
          </Field>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Toggle checked={settings.emailNotificationsEnabled} label={t(language, 'emailNotifications')} onChange={(value) => setSettings({ ...settings, emailNotificationsEnabled: value })} />
            <button className="text-button shrink-0" type="button" onClick={testEmailSettings} disabled={isTestingEmail}>
              <Send className="h-4 w-4" />
              {isTestingEmail ? t(language, 'sendingTestEmail') : t(language, 'sendTestEmail')}
            </button>
          </div>

          {emailTestMessage && (
            <p className={`mt-3 rounded-2xl border px-3 py-2 text-sm ${emailTestMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-100'}`}>
              {emailTestMessage.text}
            </p>
          )}
        </div>
        <Field label={t(language, 'preferredStores')}>
          <input className="field" value={preferredStores} onChange={(event) => setPreferredStores(event.target.value)} placeholder="Zalando, Reserved, Sephora" />
        </Field>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-[#28344C] dark:bg-[#151D30]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-normal">{t(language, 'priceRefreshInterval')}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(language, 'priceRefreshDescription')}</p>
            </div>
            <Clock3 className="h-5 w-5 text-sky-700 dark:text-[#DCEBFF]" />
          </div>
          <CustomSelect
            value={String(settings.defaultCheckIntervalMinutes ?? 60)}
            onChange={(value) => setSettings({ ...settings, defaultCheckIntervalMinutes: Number(value) })}
            options={checkIntervalOptions.map((option) => ({
              value: option.value,
              label: t(language, option.labelKey)
            }))}
          />
        </div>
        <Field label={t(language, 'minimumDiscountPercent')}>
          <input
            className="field"
            type="number"
            min="0"
            max="95"
            step="1"
            value={settings.minimumDiscountPercent}
            onChange={(event) => setSettings({ ...settings, minimumDiscountPercent: Number(event.target.value) })}
          />
        </Field>
        <Field label={t(language, 'maxEmailsPerProductPerDay')}>
          <input
            className="field"
            type="number"
            min="1"
            max="24"
            step="1"
            value={settings.maxEmailsPerProductPerDay}
            onChange={(event) => setSettings({ ...settings, maxEmailsPerProductPerDay: Number(event.target.value) })}
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle checked={settings.notifyOnlySelectedVariant} label={t(language, 'selectedVariantOnly')} onChange={(value) => setSettings({ ...settings, notifyOnlySelectedVariant: value })} />
          <Toggle checked={settings.notifyBackInStock} label={t(language, 'backInStock')} onChange={(value) => setSettings({ ...settings, notifyBackInStock: value })} />
          <Toggle checked={settings.notifyTargetPrice} label={t(language, 'targetPriceDrop')} onChange={(value) => setSettings({ ...settings, notifyTargetPrice: value })} />
        </div>

        <button className="soft-primary-button" type="submit">
          <Save className="h-4 w-4" />
          {t(language, 'saveSettings')}
        </button>
      </form>
    </div>
  );
}
