(function(){
  'use strict';
  var OAPI = (typeof API !== 'undefined' && API) ? API : 'https://api.namangan-ijara.uz';
  var oTimer = null;

  function oBody(x){
    var b = x || {};
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

  function oPost(p, b){
    return fetch(OAPI + p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(oBody(b))
    }).then(function(r){ return r.json(); });
  }

  function fmt(n){ return String(n||0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  window.showObunaTanlash = function(){
    var bg = document.createElement('div');
    bg.className = 'ob-bg';
    bg.innerHTML =
      '<div class="ob-sheet">' +
        '<button class="ob-x">&times;</button>' +
        '<h2>Siz makler bo\'lasizmi?</h2>' +
        '<p class="ob-s">Tarifni tanlang</p>' +
        '<div class="ob-card" data-t="makler">' +
          '<div class="ob-ic">\uD83D\uDCBC</div>' +
          '<div class="ob-tx"><b>Makler</b>' +
          '<span>E\'lon joylash, mijozlar topish</span></div>' +
          '<div class="ob-p">100 000<small>so\'m/oy</small></div>' +
        '</div>' +
        '<div class="ob-card gold" data-t="vip">' +
          '<div class="ob-ic">\uD83D\uDC51</div>' +
          '<div class="ob-tx"><b>Makler + VIP</b>' +
          '<span>360\u00B0 panorama, oltin belgi</span></div>' +
          '<div class="ob-p">250 000<small>so\'m/oy</small></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bg);

    bg.querySelector('.ob-x').onclick = function(){ bg.remove(); };
    bg.onclick = function(e){ if(e.target === bg) bg.remove(); };

    bg.querySelectorAll('.ob-card').forEach(function(c){
      c.onclick = function(){
        var tur = c.dataset.t;
        c.style.opacity = '.5';
        oPost('/api/obuna-boshla', { tur: tur }).then(function(d){
          if(!d || !d.ok){ c.style.opacity = '1'; return; }
          bg.remove();
          if(d.bepul) showBepul(d);
          else showTolov(d);
        }).catch(function(){ c.style.opacity = '1'; });
      };
    });
  };

  function showBepul(d){
    var bg = document.createElement('div');
    bg.className = 'ob-bg';
    bg.innerHTML =
      '<div class="ob-sheet ob-ok">' +
        '<div class="ob-big">\uD83C\uDF89</div>' +
        '<h2>Tayyor!</h2>' +
        '<p class="ob-s">' + (d.kun || 15) + ' kun bepul ochildi.<br>' +
        'Endi e\'lon joylashingiz mumkin.</p>' +
        '<button class="ob-btn">Boshlash</button>' +
      '</div>';
    document.body.appendChild(bg);
    bg.querySelector('.ob-btn').onclick = function(){ bg.remove(); location.reload(); };
  }

  function showTolov(d){
    var bg = document.createElement('div');
    bg.className = 'ob-bg';
    bg.innerHTML =
      '<div class="ob-sheet">' +
        '<button class="ob-x">&times;</button>' +
        '<h2>\uD83D\uDC51 VIP obuna</h2>' +
        '<div class="ob-timer" id="obTimer">15:00</div>' +
        '<p class="ob-s">Shu vaqt ichida to\'lov qiling</p>' +
        '<div class="ob-karta">' +
          '<div class="ob-num" id="obNum">' + (d.karta || '') + '</div>' +
          '<div class="ob-eg">' + (d.egasi || '') + '</div>' +
          '<button class="ob-copy">\uD83D\uDCCB Nusxalash</button>' +
        '</div>' +
        '<div class="ob-sum">' + fmt(d.summa) + ' so\'m</div>' +
        '<button class="ob-btn" id="obPaid">To\'lov qildim</button>' +
      '</div>';
    document.body.appendChild(bg);

    bg.querySelector('.ob-x').onclick = function(){
      if(oTimer) clearInterval(oTimer);
      bg.remove();
    };
    bg.querySelector('.ob-copy').onclick = function(){
      try {
        navigator.clipboard.writeText((d.karta||'').replace(/\s/g,''));
        this.textContent = '\u2705 Nusxalandi';
      } catch(e){}
    };

    var qoldi = (d.daqiqa || 15) * 60;
    var tEl = bg.querySelector('#obTimer');
    if(oTimer) clearInterval(oTimer);
    oTimer = setInterval(function(){
      qoldi--;
      if(qoldi <= 0){
        clearInterval(oTimer);
        tEl.textContent = 'Vaqt tugadi';
        tEl.classList.add('red');
        return;
      }
      var m = Math.floor(qoldi/60), s = qoldi % 60;
      tEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      if(qoldi < 180) tEl.classList.add('red');
    }, 1000);

    bg.querySelector('#obPaid').onclick = function(){
      if(oTimer) clearInterval(oTimer);
      bg.remove();
      showChek();
    };
  }

  function showChek(){
    var bg = document.createElement('div');
    bg.className = 'ob-bg';
    bg.innerHTML =
      '<div class="ob-sheet">' +
        '<button class="ob-x">&times;</button>' +
        '<div class="ob-big">\uD83D\uDCF7</div>' +
        '<h2>Chekni yuboring</h2>' +
        '<p class="ob-s">To\'lov skrinshotini tanlang</p>' +
        '<button class="ob-btn" id="obPick">Skrinshot tanlash</button>' +
        '<div id="obPrev"></div>' +
      '</div>';
    document.body.appendChild(bg);

    bg.querySelector('.ob-x').onclick = function(){ bg.remove(); };

    bg.querySelector('#obPick').onclick = function(){
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = function(){
        var f = inp.files[0];
        if(!f) return;
        var r = new FileReader();
        r.onload = function(){
          bg.querySelector('#obPrev').innerHTML =
            '<img src="' + r.result + '" class="ob-prev">';
          bg.querySelector('#obPick').textContent = 'Yuborilmoqda...';
          bg.querySelector('#obPick').disabled = true;

          oPost('/api/obuna-chek', { chek: r.result }).then(function(){
            bg.remove();
            showKutish();
          }).catch(function(){
            bg.querySelector('#obPick').textContent = 'Qayta urinish';
            bg.querySelector('#obPick').disabled = false;
          });
        };
        r.readAsDataURL(f);
      };
      inp.click();
    };
  }

  function showKutish(){
    var bg = document.createElement('div');
    bg.className = 'ob-bg';
    bg.innerHTML =
      '<div class="ob-sheet ob-ok">' +
        '<div class="ob-big">\u23F3</div>' +
        '<h2>Kutib turing</h2>' +
        '<p class="ob-s">Admin tekshirib tasdiqlaydi.<br>' +
        'Odatda <b>15 daqiqadan 1 soatgacha</b> vaqt oladi.<br><br>' +
        'Tasdiqlangach xabar keladi.</p>' +
        '<button class="ob-btn">Yopish</button>' +
      '</div>';
    document.body.appendChild(bg);
    bg.querySelector('.ob-btn').onclick = function(){ bg.remove(); };
  }
})();
