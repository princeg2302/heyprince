// HeyPrince Service Worker for iOS & Desktop Web Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🤖 JARVIS Approval Alert', body: event.data.text() };
    }
  }

  const title = data.title || '🤖 JARVIS: New Draft Ready for Review';
  const options = {
    body: data.body || 'Tap to review and customize your draft on HeyPrince.in',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: {
      url: data.url || '/admin/approvals',
      draftId: data.draftId || null,
      timestamp: Date.now(),
    },
    vibrate: [200, 100, 200],
    tag: data.draftId ? `draft_${data.draftId}` : 'heyprince_approval',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/admin/approvals';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open on admin, focus and navigate it
      for (const client of clientList) {
        if (client.url.includes('/admin/') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

