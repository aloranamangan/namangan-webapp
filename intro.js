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
      '<div class="map-photo"><img src="img/slide3.png"></div>' +
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
