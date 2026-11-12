import { API_BASE_URL, pushApi } from '../api';

export const supportsBrowserPush = () => window.isSecureContext && !API_BASE_URL.startsWith('demo:')
  && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const workerUrl = import.meta.env.BASE_URL + 'push-worker.js';

export async function currentPushSubscription() {
  if (!supportsBrowserPush()) return null;
  const registration = await navigator.serviceWorker.getRegistration(workerUrl);
  return await registration?.pushManager.getSubscription() ?? null;
}

export async function enableBrowserPush(publicKey: string) {
  // Ask for permission directly from the settings button's click handler.
  if (await Notification.requestPermission() !== 'granted') return false;

  const encoded = publicKey.replace(/-/g, '+').replace(/_/g, '/');
  const key = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')), character => character.charCodeAt(0));
  await navigator.serviceWorker.register(workerUrl);
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const subscribedKey = new Uint8Array(subscription.options.applicationServerKey ?? new ArrayBuffer(0));
    if (subscribedKey.length !== key.length || key.some((byte, index) => byte !== subscribedKey[index])) {
      await disableBrowserPush();
      subscription = null;
    }
  }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const keys = subscription.toJSON().keys;
  try {
    await pushApi.savePushSubscription({ endpoint: subscription.endpoint, p256dh: keys?.p256dh, auth: keys?.auth });
  } catch (error) {
    await subscription.unsubscribe().catch(() => false);
    throw error;
  }
  return true;
}

export async function disableBrowserPush() {
  const subscription = await currentPushSubscription();
  if (!subscription) return;
  try {
    await pushApi.removePushSubscription(subscription.endpoint);
  } finally {
    await subscription.unsubscribe();
  }
}
