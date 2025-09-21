const CACHE_NAME = 'bacwithme-cache-v5'; // Incremented cache version
// Add all the files that should be cached for offline use.
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/MainApp.tsx',
  '/types.ts',
  '/constants.ts',
  // Components
  '/components/BottomNav.tsx',
  '/components/ProgressBar.tsx',
  '/components/icons/HomeIcon.tsx',
  '/components/icons/LessonsIcon.tsx',
  '/components/icons/ExercisesIcon.tsx',
  '/components/icons/AssistantIcon.tsx',
  '/components/icons/ProfileIcon.tsx',
  '/components/icons/CommunityIcon.tsx',
  '/components/icons/SunIcon.tsx',
  '/components/icons/MoonIcon.tsx',
  // Screens
  '/screens/SetupScreen.tsx', // Added SetupScreen
  '/screens/HomeScreen.tsx',
  '/screens/LessonsScreen.tsx',
  '/screens/ExercisesScreen.tsx',
  '/screens/AssistantScreen.tsx',
  '/screens/ProfileScreen.tsx',
  '/screens/CommunityScreen.tsx',
  '/screens/QuickReviewScreen.tsx',
  '/screens/ExamScreen.tsx',
  '/screens/LeaderboardScreen.tsx',
  '/screens/PastExamsScreen.tsx',
  '/screens/ExamGeneratorScreen.tsx',
  '/screens/StudyPlanScreen.tsx',
  // Services
  '/services/api.ts',
  '/services/geminiService.ts',
  '/services/supabaseClient.ts'
  // Removed '/screens/AuthScreen.tsx'
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll() to fetch and cache all the assets in the urlsToCache list.
        // Using { cache: 'reload' } to ensure we get the latest version from the network upon install.
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
  );
});

// Cache and return requests using a cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, cache it, and return response
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Update a service worker and remove old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});