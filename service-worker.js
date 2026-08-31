const CACHE_NAME = 'qoffa-smart-v3';
const STATIC_ASSETS = [
  '/',
  '/',
  '/products/',
  '/order/',
  '/about/',
  '/contact/',
  '/terms/',
  '/return-policy/',
  '/bundles/',
  '/product-detail/',
  '/assets/css/style.css',
  '/assets/css/responsive.css',
  '/assets/css/cart.css',
  '/assets/css/order.css',
  '/assets/css/products.css',
  '/assets/css/reorder-popup.css',
  '/assets/css/confirmation-modal.css',
  '/assets/css/home.css',
  '/assets/css/about.css',
  '/assets/css/contact.css',
  '/assets/css/blog.css',
  '/assets/css/animations-config.css',
  '/assets/css/header-search-fix.css',
  '/assets/css/order-advanced.css',
  '/assets/css/paniers-style.css',
  '/assets/css/responsive-new.css',
  '/assets/js/main.js',
  '/assets/js/confirmation-modal.js',
  '/assets/js/reorder-popup.js',
  '/assets/js/reorder-popup-init.js',
  '/assets/js/image-optimizer.js',
  '/assets/js/home.js',
  '/assets/js/about.js',
  '/assets/js/contact.js',
  '/assets/js/order.js',
  '/assets/js/products.js',
  '/assets/js/blog.js',
  '/assets/js/baserow-fix.js',
  '/assets/js/free-shipping-promo.js',
  '/assets/js/global-reorder-init.js',
  '/assets/js/last-order-tracker.js',
  '//assets/images/logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache addAll error:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event with Cache-First strategy for assets, Network-First for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls - Network first
  if (url.hostname === 'api.baserow.io' || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets - Cache first
  if (
    request.method === 'GET' &&
    (url.pathname.includes('/assets/') ||
      (url.pathname === '/' || /\/$/.test(url.pathname)) ||
      url.pathname === '/' ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('images.weserv.nl'))
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Everything else - Network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
