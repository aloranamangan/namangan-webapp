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
      if(!file){ reject('fayl yo\'q'); return; }
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
          if(e.lengthComputable && onProgress){
            onProgress(Math.round(e.loaded / e.total * 100));
          }
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
