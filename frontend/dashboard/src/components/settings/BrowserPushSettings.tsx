import { useEffect, useState } from 'react';
import { pushApi } from '../../api';
import { t, type Language } from '../../i18n';
import { currentPushSubscription, disableBrowserPush, enableBrowserPush, supportsBrowserPush } from '../../lib/browserPush';

export function BrowserPushSettings({ language }: { language: Language }) {
  const supported = supportsBrowserPush();
  const [key, setKey] = useState<string | null>();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'pushPermissionDenied' | 'pushError' | null>(null);

  useEffect(() => {
    if (!supported) return;
    let disposed = false;
    Promise.all([pushApi.getPushKey(), currentPushSubscription()]).then(([config, subscription]) => {
      if (!disposed) {
        setKey(config.publicKey);
        setEnabled(Boolean(subscription));
      }
    }).catch(() => {
      if (!disposed) setError('pushError');
    });
    return () => { disposed = true; };
  }, [supported]);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (enabled) {
        await disableBrowserPush();
        setEnabled(false);
      } else if (key) {
        const subscribed = await enableBrowserPush(key);
        setEnabled(subscribed);
        if (!subscribed) setError('pushPermissionDenied');
      }
    } catch {
      setEnabled(Boolean(await currentPushSubscription().catch(() => null)));
      setError('pushError');
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;
  return (
    <section className="panel space-y-3 p-5">
      <h2 className="font-semibold">{t(language, 'browserPush')}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t(language, key === null && !enabled ? 'pushUnconfigured' : 'pushDescription')}
      </p>
      <button className="text-button" type="button" onClick={toggle} disabled={busy || (!key && !enabled)}>
        {t(language, enabled ? 'disablePush' : 'enablePush')}
      </button>
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{t(language, error)}</p>}
    </section>
  );
}
