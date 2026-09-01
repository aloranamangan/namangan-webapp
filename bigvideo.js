(function(){
  'use strict';
  var VAPI = (typeof API !== 'undefined' && API) ? API : 'https://api.namangan-ijara.uz';
  window.MAX_VIDEO_MB = 1024;

  function vBody(){
    var b = {};
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      if(tg && tg.initData) b.init_data = tg.initData;
    } catch(e){}
    try {
      var t = localStorage.getItem('ni_token');
      if(t) b.token = t;
    } catch(e){}
    return b;
  }

  window.uploadBigVideo = function(file, onProgress){
    return new Promise(function(resolve, reject){
      if(!file){ reject('fayl yoq'); return; }
      if(file.size > window.MAX_VIDEO_MB * 1024 * 1024){
        reject('Video ' + window.MAX_VIDEO_MB + ' MB dan katta');
        return;
      }
      fetch(VAPI + '/api/video-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vBody())
      }).then(function(r){ return r.json(); }).then(function(d){
        if(!d || !d.ok || !d.url){ reject('URL olinmadi'); return; }
        var xhr = new XMLHttpRequest();
        xhr.open('PUT', d.url, true);
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.upload.onprogress = function(e){
          if(e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100));
        };
        xhr.onload = function(){
          if(xhr.status >= 200 && xhr.status < 300) resolve(d.public);
          else reject('Yuklashda xato: ' + xhr.status);
        };
        xhr.onerror = function(){ reject('Tarmoq xatosi'); };
        xhr.send(file);
      }).catch(function(e){ reject(String(e)); });
    });
  };
})();

// Post yuborishdan oldin videolarni R2 ga yuklaydi
(function(){
  var _orig = null;
  function hook(){
    if(typeof apiPost !== 'function'){ setTimeout(hook, 300); return; }
    if(_orig) return;
    _orig = apiPost;
    window.apiPost = function(path, body){
      if(path !== '/api/post-qoshish' || !body || !body.items){
        return _orig(path, body);
      }
      var vids = body.items.filter(function(it){ return it.is_video && it._file; });
      if(!vids.length) return _orig(path, body);

      return Promise.all(vids.map(function(it){
        return uploadBigVideo(it._file, function(pc){
          try {
            var b = document.getElementById('upGo');
            if(b) b.textContent = 'Video ' + pc + '%';
          } catch(e){}
        }).then(function(url){
          it.media = url; it.r2 = true; delete it._file;
        }).catch(function(){ delete it._file; });
      })).then(function(){
        return _orig(path, body);
      });
    };
  }
  hook();
})();
