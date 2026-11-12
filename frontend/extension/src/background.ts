type PickedPricePayload = {
  price?: number;
  currency?: string;
  priceSelector?: string;
  url?: string;
  shopName?: string;
};

type PricePickedMessage = {
  type?: string;
  payload?: PickedPricePayload;
};

const pendingPickedPriceKey = 'pendingPickedPrice';

chrome.runtime.onInstalled.addListener(() => {
  void ensureDefaultSettings();
});

chrome.runtime.onMessage.addListener((message: PricePickedMessage, sender, sendResponse) => {
  if (message?.type !== 'PRICE_PICKED') {
    return false;
  }

  void handlePricePicked(message, sender)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.warn('StockPriceBot: could not apply picked price.', error);
      sendResponse({ ok: false });
    });

  return true;
});

async function ensureDefaultSettings() {
  try {
    const existing = await chrome.storage.sync.get(['apiBaseUrl', 'authToken']);
    if (!existing.apiBaseUrl) {
      await chrome.storage.sync.set({ apiBaseUrl: 'http://localhost:5080' });
    }
    if (!existing.authToken) {
      await chrome.storage.sync.set({ authToken: '' });
    }
  } catch (error) {
    console.warn('StockPriceBot: could not initialize extension settings.', error);
  }
}

async function handlePricePicked(message: PricePickedMessage, sender: chrome.runtime.MessageSender) {
  const sourceTabId = sender.tab?.id;
  const pending = {
    ...(message.payload ?? {}),
    sourceTabId,
    pickedAt: Date.now()
  };

  await chrome.storage.local.set({
    [pendingPickedPriceKey]: pending
  });

  try {
    await chrome.runtime.sendMessage({ type: 'PRICE_PICKED', payload: pending });
  } catch {
    // The popup can be closed while the user is picking. It will restore this value on next open.
  }

  try {
    await chrome.action.openPopup(sender.tab?.windowId ? { windowId: sender.tab.windowId } : undefined);
  } catch {
    // Some Chrome versions only allow opening the popup from a direct user gesture.
    await chrome.action.setBadgeText({ text: 'OK', tabId: sender.tab?.id });
    await chrome.action.setBadgeBackgroundColor({ color: '#14b8a6', tabId: sender.tab?.id });
  }
}
