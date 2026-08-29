(function(){
  'use strict';
  var SAPI = (typeof API !== 'undefined' && API) ? API : 'https://namangan-ijara-bot.onrender.com';

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
