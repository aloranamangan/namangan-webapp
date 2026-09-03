(function(){
  'use strict';
  var SA = 'https://api.namangan-ijara.uz';

  function fmt(n){
    n = Number(n || 0);
    if(n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M';
    if(n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'k';
    return String(n);
  }

  window.showProfilStat = function(){
    var un = (typeof PF !== 'undefined' && PF && PF.username) ? PF.username : '';
    if(!un){ if(typeof toast === 'function') toast('Profil topilmadi'); return; }

    var bg = document.createElement('div');
    bg.className = 'st-bg';
    bg.innerHTML =
      '<div class="st-sheet">' +
        '<div class="st-grip"></div>' +
        '<div class="st-head"><b>Statistika</b><span>oxirgi 30 kunda</span></div>' +
        '<div id="stBody" class="st-load">Yuklanmoqda...</div>' +
      '</div>';
    document.body.appendChild(bg);
    bg.onclick = function(e){ if(e.target === bg) bg.remove(); };

    fetch(SA + '/api/profil-stat?username=' + encodeURIComponent(un))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || !d.ok){ document.getElementById('stBody').textContent = 'Xato'; return; }
        chiz(d);
      })
      .catch(function(){ document.getElementById('stBody').textContent = 'Xato'; });

    function chiz(d){
      var top = (d.top || []).map(function(t){
        return '<div class="st-row"><span class="st-t">' +
          (t.matn || 'Elon').replace(/\n/g, ' ').slice(0, 32) +
          '</span><b>' + fmt(t.views) + '</b></div>';
      }).join('') || '<div class="st-empty">Hozircha malumot yoq</div>';

      document.getElementById('stBody').outerHTML =
        '<div id="stBody">' +
          '<div class="st-hero">' +
            '<div class="st-big">' + fmt(d.korish30) + '</div>' +
            '<div class="st-lbl">Jami korishlar</div>' +
          '</div>' +
          '<div class="st-grid">' +
            '<div class="st-c"><b>' + fmt(d.odam30) + '</b><span>Erishilgan odam</span></div>' +
            '<div class="st-c"><b>' + fmt(d.korish7) + '</b><span>7 kunda</span></div>' +
            '<div class="st-c"><b>' + fmt(d.obunachi) + '</b><span>Obunachi</span></div>' +
            '<div class="st-c"><b>' + fmt(d.elon) + '</b><span>Elonlar</span></div>' +
            '<div class="st-c"><b>' + fmt(d.layk) + '</b><span>Layklar</span></div>' +
            '<div class="st-c"><b>' + (d.elon ? Math.round(d.korish30 / d.elon) : 0) + '</b><span>Ortacha</span></div>' +
          '</div>' +
          '<div class="st-sec">Eng kop korilgan</div>' +
          top +
        '</div>';
    }
  };
})();
