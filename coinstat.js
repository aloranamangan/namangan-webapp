(function(){
  'use strict';
  var SAPI = (typeof API !== 'undefined' && API) ? API : 'https://api.namangan-ijara.uz';

  function sAuth(){
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

  function sFmt(n){
    return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function loadCoinStats(){
    var box = document.getElementById('coinStats');
    if(!box) return;

    fetch(SAPI + '/api/coin-stat?' + sAuth())
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || !d.ok) return;
        var j = document.getElementById('csJami');
        var b = document.getElementById('csBugun');
        var o = document.getElementById('csOrin');
        if(j) j.textContent = sFmt(d.jami);
        if(b) b.textContent = '+' + sFmt(d.bugun);
        if(o) o.textContent = d.orin ? '#' + d.orin : '-';
      })
      .catch(function(){});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadCoinStats);
  } else {
    loadCoinStats();
  }
  setInterval(loadCoinStats, 30000);
})();

// ---- Jamoa ulushi ----
(function(){
  'use strict';
  var JAPI = (typeof API !== 'undefined' && API) ? API : 'https://api.namangan-ijara.uz';

  function jFmt(n){ return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function loadJamoa(){
    var box = document.getElementById('jamoaBox');
    if(!box) return;
    fetch(JAPI + '/api/jamoa-stat')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || !d.ok) return;
        var a = document.getElementById('jbJami');
        var b = document.getElementById('jbBugun');
        if(a) a.textContent = jFmt(d.jami);
        if(b) b.textContent = jFmt(d.bugun);
      }).catch(function(){});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadJamoa);
  } else {
    loadJamoa();
  }
  setInterval(loadJamoa, 30000);
})();
