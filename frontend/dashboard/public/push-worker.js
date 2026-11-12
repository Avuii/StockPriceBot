self.addEventListener('push', event => {
  const alert = event.data?.json();
  if (!alert?.title || !alert?.body) return;
  event.waitUntil(self.registration.showNotification(alert.title, { body: alert.body }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const dashboard = windows.find(client => client.url.startsWith(self.registration.scope));
    return dashboard ? dashboard.focus() : self.clients.openWindow(self.registration.scope);
  })());
});
