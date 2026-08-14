const CACHE = 'ni-v6';
const FILES = [
  'xaridor.html', 'sotuvchi.html', 'obhavo.html', 'valyuta.html',
  'style.css', 'weather.css', 'core.js', 'reg.js', 'dm.js', 'story.js', 'pano.js',
  'manifest.json', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(FILES.map(function(f){
        return c.add(f).catch(function(){});
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  const u = e.request.url;
  if(u.indexOf('/api/') !== -1 || u.indexOf('/media/') !== -1 ||
     u.indexOf('open-meteo') !== -1 || u.indexOf('cbu.uz') !== -1){
    return;
  }

  // HTML/JS/CSS - avval tarmoqdan (yangilanish uchun)
  if(u.indexOf('.html') !== -1 || u.indexOf('.js') !== -1 || u.indexOf('.css') !== -1){
    e.respondWith(
      fetch(e.request).then(function(res){
        if(res && res.status === 200){
          const cp = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, cp).catch(function(){}); });
        }
        return res;
      }).catch(function(){ return caches.match(e.request); })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).then(function(res){
        if(res && res.status === 200 && e.request.method === 'GET'){
          const cp = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, cp).catch(function(){}); });
        }
        return res;
      }).catch(function(){ return caches.match('xaridor.html'); });
    })
  );
});
