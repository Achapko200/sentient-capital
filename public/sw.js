self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Card Tracker', {
      body:  data.body  ?? 'You have a new notification',
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      data:  data.url ? { url: data.url } : {},
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/app';
  event.waitUntil(clients.openWindow(url));
});
