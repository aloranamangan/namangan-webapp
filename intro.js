// ---------- Kirish animatsiyasi (splash) ----------
// Faqat ilova butunlay yopilib qayta ochilganda ko'rsatiladi

function introKerakmi(){
  try {
    // sessionStorage sahifa yopilganda tozalanadi
    if(sessionStorage.getItem('ni_intro')) return false;
    sessionStorage.setItem('ni_intro', '1');
    return true;
  } catch(e){ return false; }
}

function showIntro(done){
  if(!introKerakmi()){ done(); return; }

  const ov = document.createElement('div');
  ov.id = 'introScr';

  ov.innerHTML =
    // ── 1. Namangan kartasi ──
    '<div class="intro-st" data-s="1">' +
      '<div class="map-wrap">' +
        '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
          '<path class="map-fill" d="M42 58 L78 34 L124 40 L158 66 L166 104 L148 142 ' +
            'L106 166 L62 154 L34 118 Z"/>' +
          '<path class="map-path" d="M42 58 L78 34 L124 40 L158 66 L166 104 L148 142 ' +
            'L106 166 L62 154 L34 118 Z"/>' +
          '<path class="map-path" style="animation-delay:.5s;stroke-width:1.2;opacity:.4" ' +
            'd="M62 90 L118 76 M84 128 L140 108 M78 34 L84 128"/>' +
          '<g class="map-pin"><circle cx="88" cy="82" r="4" fill="#ED4956"/>' +
            '<circle class="map-ring" cx="88" cy="82" r="3" fill="none" ' +
            'stroke="#ED4956" stroke-width="1.5"/></g>' +
          '<g class="map-pin"><circle cx="126" cy="98" r="4" fill="#F5D547"/>' +
            '<circle class="map-ring" cx="126" cy="98" r="3" fill="none" ' +
            'stroke="#F5D547" stroke-width="1.5" style="animation-delay:.5s"/></g>' +
          '<g class="map-pin"><circle cx="70" cy="126" r="4" fill="#0095F6"/>' +
            '<circle class="map-ring" cx="70" cy="126" r="3" fill="none" ' +
            'stroke="#0095F6" stroke-width="1.5" style="animation-delay:1s"/></g>' +
          '<g class="map-pin"><circle cx="132" cy="132" r="4" fill="#34C759"/>' +
            '<circle class="map-ring" cx="132" cy="132" r="3" fill="none" ' +
            'stroke="#34C759" stroke-width="1.5" style="animation-delay:1.5s"/></g>' +
        '</svg>' +
      '</div>' +
      '<div class="intro-t">NAMANGAN</div>' +
      '<div class="intro-s">Vodiyning yuragi</div>' +
    '</div>' +

    // ── 2. DIKKIYLORD ──
    '<div class="intro-st" data-s="2">' +
      '<div class="crown-w">' +
        '<div class="fire-w"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="crown-i">\u{1F451}</div>' +
      '</div>' +
      '<div class="intro-t" style="font-size:30px;">DIKKIYLORD</div>' +
      '<div class="intro-s">JAMOASI</div>' +
    '</div>' +

    // ── 3. UYgram ──
    '<div class="intro-st" data-s="3">' +
      '<div class="ug-final"><span class="uy">UY</span><span class="gram">gram</span></div>' +
      '<div class="ug-sub">Yangi uylar siz bilan</div>' +
    '</div>' +

    '<div class="intro-bar"><i></i></div>';

  document.body.appendChild(ov);

  const steps = ov.querySelectorAll('.intro-st');
  let cur = 0;

  function ko(i){
    steps.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    // animatsiyani qayta ishga tushirish
    const s = steps[i];
    if(s){
      s.querySelectorAll('*').forEach(function(e){
        const a = e.style.animation;
        e.style.animation = 'none';
        void e.offsetWidth;
        e.style.animation = a || '';
      });
    }
    try {
      if(window.Telegram && window.Telegram.WebApp)
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } catch(e){}
  }

  ko(0);

  const t1 = setTimeout(function(){ ko(1); }, 2000);
  const t2 = setTimeout(function(){ ko(2); }, 3800);
  const t3 = setTimeout(function(){
    ov.classList.add('chiq');
    setTimeout(function(){ ov.remove(); done(); }, 650);
  }, 5200);

  // bosilsa o'tkazib yuborish
  ov.addEventListener('click', function(){
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    ov.classList.add('chiq');
    setTimeout(function(){ ov.remove(); done(); }, 400);
  });
}
