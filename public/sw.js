const CACHE_NAME = 'zeus-panel-v1';

self.addEventListener('install', event => {
  console.log('[SW] Installed');
});

self.addEventListener('activate', event => {
  console.log('[SW] Activated');
});

self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Zeus Panel', body: event.data.text() };
  }

  const options = {
    body: data.body || 'اعلان جدید',
    icon: data.icon || '/assets/icon.png',
    badge: data.badge || '/assets/icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    },
    actions: data.actions || [
      { action: 'open', title: 'مشاهده' },
      { action: 'close', title: 'بستن' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Zeus Panel', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) {
          clientList[0].focus();
        } else {
          clients.openWindow('/dashboard');
        }
      })
    );
  }
});
