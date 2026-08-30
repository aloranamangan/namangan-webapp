(function(){
  'use strict';
  var XAPI = (typeof API !== 'undefined' && API) ? API : 'https://api.namangan-ijara.uz';
  var XZ_OCHILGAN = false;
  var XZ_BUSY = false;

  function xEl(id){ return document.getElementById(id); }

  function xAuth(){
    var p = [];
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      if(tg && tg.initData) p.push('init_data=' + encodeURIComponent(tg.initData));
    } catch(e){}
    try {
      var t = localStorage.getItem('ni_token');
      if(t) p.push('token=' + encodeURIComponent(t));
    } catch(e){}
    return p.join('&');
  }

  function xBody(){
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

  function buildXazina(){
    if(xEl('xzPanel')) return;
    var d = document.createElement('div');
    d.innerHTML =
      '<div class="xz-panel" id="xzPanel" hidden>' +
        '<button class="xz-x" id="xzClose">&times;</button>' +
        '<div class="xz-in">' +
          '<div class="xz-box" id="xzBox">🎁</div>' +
          '<h2 class="xz-t" id="xzTitle">Kunlik xazina</h2>' +
          '<p class="xz-s" id="xzSub">Har kuni bir marta ochish mumkin</p>' +
          '<button class="xz-btn" id="xzOpen">Ochish</button>' +
          '<div class="xz-res" id="xzRes" hidden></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(d.firstChild);

    xEl('xzClose').addEventListener('click', closeXazina);
    xEl('xzOpen').addEventListener('click', openBox);
  }

  function openXazina(){
    buildXazina();
    xEl('xzPanel').hidden = false;
    checkXazina();
  }

  function closeXazina(){
    var p = xEl('xzPanel');
    if(p) p.hidden = true;
    var t = xEl('xazinaTab');
    if(t) t.classList.remove('on');
  }

  function checkXazina(){
    fetch(XAPI + '/api/xazina?' + xAuth())
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || !d.ok) return;
        XZ_OCHILGAN = !!d.ochilgan;
        var btn = xEl('xzOpen');
        var dot = xEl('xzDot');
        if(XZ_OCHILGAN){
          if(btn){ btn.disabled = true; btn.textContent = 'Ertaga qaytib keling'; }
          if(xEl('xzSub')) xEl('xzSub').textContent = 'Bugungi xazina ochilgan';
          if(dot) dot.hidden = true;
        } else {
          if(btn){ btn.disabled = false; btn.textContent = 'Ochish'; }
          if(dot) dot.hidden = false;
        }
      }).catch(function(){});
  }

  function openBox(){
    if(XZ_BUSY || XZ_OCHILGAN) return;
    XZ_BUSY = true;

    var box = xEl('xzBox');
    var btn = xEl('xzOpen');
    if(btn){ btn.disabled = true; btn.textContent = 'Ochilmoqda...'; }
    if(box) box.classList.add('shake');

    fetch(XAPI + '/api/xazina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xBody())
    }).then(function(r){ return r.json(); })
      .then(function(d){
        setTimeout(function(){
          if(box) box.classList.remove('shake');
          XZ_BUSY = false;

          if(!d || !d.ok){
            if(d && d.error === 'bugun_ochilgan'){
              XZ_OCHILGAN = true;
              if(btn){ btn.textContent = 'Ertaga qaytib keling'; }
              if(xEl('xzSub')) xEl('xzSub').textContent = 'Bugungi xazina ochilgan';
            } else {
              if(btn){ btn.disabled = false; btn.textContent = 'Ochish'; }
            }
            return;
          }

          XZ_OCHILGAN = true;
          if(box){ box.textContent = '🎉'; box.classList.add('pop'); }
          var res = xEl('xzRes');
          if(res){
            res.innerHTML = '<div class="xz-win">Siz yutdingiz!</div>' +
                            '<div class="xz-prize">' + (d.nom || '') + '</div>';
            res.hidden = false;
          }
          if(btn){ btn.textContent = 'Ertaga qaytib keling'; }
          if(xEl('xzDot')) xEl('xzDot').hidden = true;

          try {
            var tg = window.Telegram && window.Telegram.WebApp;
            if(tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
          } catch(e){}
        }, 1200);
      }).catch(function(){
        XZ_BUSY = false;
        if(box) box.classList.remove('shake');
        if(btn){ btn.disabled = false; btn.textContent = 'Ochish'; }
      });
  }

  function init(){
    var tab = xEl('xazinaTab');
    if(tab){
      tab.addEventListener('click', function(){
        document.querySelectorAll('.fm-tab').forEach(function(t){ t.classList.remove('on'); });
        tab.classList.add('on');
        openXazina();
      });
    }
    checkXazina();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
