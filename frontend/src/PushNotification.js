// PushNotification.js

const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
const API_URL = process.env.REACT_APP_API_URL;

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('User is already subscribed.');
      return;
    }

    try {
      const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log('New subscription:', subscription);

      // Send the subscription to your backend
      await axios.post(`${API_URL}/subscribe`, subscription);
      console.log('Subscription sent to backend.');
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
    }
  } else {
    console.warn('Push messaging is not supported.');
  }
}

// Service worker file: public/service-worker.js
// This file must be in the public directory and not in your src folder.
// This is a minimal example. You might need to add more caching logic.
self.addEventListener('push', function(event) {
  const data = event.data.json();
  console.log('Push received:', data);
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/logo.png', // A path to an icon for the notification
    badge: '/badge.png',
    data: {
      url: data.link,
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(clients.openWindow(url));
});