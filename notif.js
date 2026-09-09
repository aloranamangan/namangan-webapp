(function(){
  'use strict';
  var NA = 'https://api.namangan-ijara.uz';

  function idata(){
    try { return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || ''; }
    catch(e){ return ''; }
  }
  function tok(){
    try { return localStorage.getItem('ni_token') || ''; } catch(e){ return ''; }
  }
  function nEsc(s){
    return String(s || '').replace(/[<>&]/g, function(m){
      return { '<':'&lt;', '>':'&gt;', '&':'&amp;' }[m];
    });
  }
  function qachon(s){
    if(!s) return '';
    var t = new Date(String(s).replace(' ', 'T'));
    if(isNaN(t)) return '';
    var d = Math.floor((Date.now() - t) / 1000);
    if(d < 60) return 'hozir';
    if(d < 3600) return Math.floor(d/60) + ' daq';
    if(d < 86400) return Math.floor(d/3600) + ' soat';
    if(d < 604800) return Math.floor(d/86400) + ' kun';
    return Math.floor(d/604800) + ' hafta';
  }

  var IC = {
    like: '\u2764\uFE0F',
    comment: '\uD83D\uDCAC',
    follow: '\uD83D\uDC64',
    hammualif: '\uD83E\uDD1D'
  };
  var MATN = {
    like: 'eloningizni yoqtirdi',
    comment: 'izoh qoldirdi',
    follow: 'sizga obuna boldi',
    hammualif: 'sizni hammualif qildi'
  };

  window.openNotifs = function(){
    var bg = document.createElement('div');
    bg.className = 'nt-bg';
    bg.innerHTML =
      '<div class="nt-sheet">' +
        '<div class="nt-grip"></div>' +
        '<div class="nt-head"><b>Bildirishnomalar</b></div>' +
        '<div class="nt-body" id="ntBody"><div class="nt-load">Yuklanmoqda...</div></div>' +
      '</div>';
    document.body.appendChild(bg);
    bg.onclick = function(e){ if(e.target === bg) bg.remove(); };

    var un = '';
    try {
      un = (typeof PF !== 'undefined' && PF && PF.username) ? PF.username : '';
      if(!un && typeof USER !== 'undefined' && USER) un = USER.username || USER.nickname || '';
    } catch(e){}

    fetch(NA + '/api/bildirishnomalar?username=' + encodeURIComponent(un) +
          '&init_data=' + encodeURIComponent(idata()) +
          '&token=' + encodeURIComponent(tok()))
      .then(function(r){ return r.json(); })
      .then(function(d){
        var box = document.getElementById('ntBody');
        if(!d || !d.ok){ box.innerHTML = '<div class="nt-empty">Xato</div>'; return; }
        var list = d.items || d.notifs || d.royxat || [];
        if(!list.length){
          box.innerHTML = '<div class="nt-empty">' +
            '<div class="nt-ic">\uD83D\uDD14</div>' +
            '<p>Hozircha bildirishnoma yoq</p></div>';
          return;
        }
        box.innerHTML = list.map(function(n){
          var tur = n.kind || n.type || n.tur || 'like';
          var ism = n.name || n.ism || 'Foydalanuvchi';
          return '<div class="nt-row">' +
            '<div class="nt-em">' + (IC[tur] || '\uD83D\uDD14') + '</div>' +
            '<div class="nt-tx"><b>' + nEsc(ism) + '</b> ' +
            (MATN[tur] || '') +
            (n.text ? '<span class="nt-sub">' + nEsc(n.text) + '</span>' : '') +
            '</div>' +
            '<span class="nt-t">' + qachon(n.created_at || n.vaqt) + '</span>' +
            '</div>';
        }).join('');
      })
      .catch(function(){
        document.getElementById('ntBody').innerHTML = '<div class="nt-empty">Xato</div>';
      });
  };
})();

// ---------- Hammualif takliflari ----------
(function(){
  var HA = 'https://api.namangan-ijara.uz';

  function hIdata(){
    try { return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || ''; }
    catch(e){ return ''; }
  }
  function hTok(){
    try { return localStorage.getItem('ni_token') || ''; } catch(e){ return ''; }
  }
  function hUid(){
    try { return localStorage.getItem('ni_uid') || ''; } catch(e){ return ''; }
  }

  window.showHammualif = function(){
    var bg = document.createElement('div');
    bg.className = 'nt-bg';
    bg.innerHTML =
      '<div class="nt-sheet">' +
        '<div class="nt-grip"></div>' +
        '<div class="nt-head"><b>\uD83E\uDD1D Hammualif takliflari</b></div>' +
        '<div class="nt-body" id="hmBody"><div class="nt-load">Yuklanmoqda...</div></div>' +
      '</div>';
    document.body.appendChild(bg);
    bg.onclick = function(e){ if(e.target === bg) bg.remove(); };

    function yukla(){
      fetch(HA + '/api/hammualif-royxat?tg_id=' + encodeURIComponent(hUid()))
        .then(function(r){ return r.json(); })
        .then(function(d){
          var box = document.getElementById('hmBody');
          var t = (d && d.takliflar) || [];
          if(!t.length){
            box.innerHTML = '<div class="nt-empty"><div class="nt-ic">\uD83E\uDD1D</div>' +
              '<p>Taklif yoq</p></div>';
            return;
          }
          box.innerHTML = t.map(function(x){
            return '<div class="hm-row" data-i="' + x.id + '">' +
              '<div class="hm-tx">' + String(x.matn || 'Elon').replace(/[<>&]/g,'') + '</div>' +
              '<div class="hm-b">' +
              '<button class="hm-ok" data-i="' + x.id + '">Qabul</button>' +
              '<button class="hm-no" data-i="' + x.id + '">Rad</button>' +
              '</div></div>';
          }).join('');

          box.querySelectorAll('.hm-ok, .hm-no').forEach(function(b){
            b.onclick = function(){
              var qabul = b.classList.contains('hm-ok');
              b.disabled = true;
              fetch(HA + '/api/hammualif-javob', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ id: b.dataset.i, qabul: qabul,
                  tg_id: parseInt(hUid()) || 0, init_data: hIdata(), token: hTok() })
              }).then(function(r){ return r.json(); }).then(function(){ yukla(); })
                .catch(function(){ b.disabled = false; });
            };
          });
        })
        .catch(function(){
          document.getElementById('hmBody').innerHTML = '<div class="nt-empty">Xato</div>';
        });
    }
    yukla();
  };
})();
