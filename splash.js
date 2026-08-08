// ---------- Kirish slaydlari ----------
function showSplash(done){
  const S = [
    {
      bg: 'linear-gradient(160deg,#0B2545 0%,#134074 55%,#1B4965 100%)',
      ico: '🏛️',
      t: 'NAMANGAN',
      s: 'Vodiyning yuragi',
      d: 'Shaharning ishonchli ko\'chmas mulk platformasi'
    },
    {
      bg: 'linear-gradient(160deg,#1A1A2E 0%,#16213E 50%,#0F3460 100%)',
      ico: '👑',
      t: 'DIKKIYLORD',
      s: 'JAMOASI',
      d: 'Sifat va ishonch bilan xizmatingizdamiz'
    },
    {
      bg: 'linear-gradient(160deg,#134E5E 0%,#1B7A6E 50%,#71B280 100%)',
      ico: '🗺️',
      t: 'Namangan',
      s: 'Yangi uylar siz bilan',
      d: 'Barcha uylar shu yerda'
    }
  ];

  let i = 0;
  const ov = document.createElement('div');
  ov.id = 'splash';
  document.body.appendChild(ov);

  const st = document.createElement('style');
  st.textContent = `
    #splash{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;
      align-items:center;justify-content:center;padding:44px 30px;text-align:center;
      transition:background 1s ease;color:#fff;font-family:'Manrope',sans-serif;}
    #splash .ic{font-size:88px;margin-bottom:26px;animation:spIn .8s cubic-bezier(.2,.8,.2,1);}
    #splash h2{font-size:34px;font-weight:800;letter-spacing:1px;line-height:1.15;
      animation:spUp .8s .1s cubic-bezier(.2,.8,.2,1) both;}
    #splash h3{font-size:19px;font-weight:600;opacity:.9;margin-top:6px;
      animation:spUp .8s .2s cubic-bezier(.2,.8,.2,1) both;}
    #splash p{font-size:14px;opacity:.6;margin-top:16px;line-height:1.6;max-width:280px;
      animation:spUp .8s .3s cubic-bezier(.2,.8,.2,1) both;}
    #splash .dots{position:absolute;bottom:118px;display:flex;gap:8px;}
    #splash .dt{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.3);transition:all .3s;}
    #splash .dt.on{background:#fff;width:24px;border-radius:5px;}
    #splash .go{position:absolute;bottom:52px;left:30px;right:30px;
      padding:16px 0;border:none;border-radius:100px;background:#fff;color:#111;
      font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;
      animation:spUp .8s .4s cubic-bezier(.2,.8,.2,1) both;}
    #splash .skip{position:absolute;top:calc(20px + env(safe-area-inset-top));right:22px;
      background:none;border:none;color:rgba(255,255,255,.6);font-size:14px;
      font-weight:600;cursor:pointer;font-family:inherit;}
    @keyframes spIn{from{opacity:0;transform:scale(.5) rotate(-14deg)}to{opacity:1;transform:none}}
    @keyframes spUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
    #splash .fade{animation:spFade .45s ease both;}
    @keyframes spFade{from{opacity:0}to{opacity:1}}
  `;
  document.head.appendChild(st);

  function draw(){
    const c = S[i];
    ov.style.background = c.bg;
    ov.innerHTML =
      '<button class="skip">O\'tkazish</button>' +
      '<div class="fade">' +
        '<div class="ic">' + c.ico + '</div>' +
        '<h2>' + c.t + '</h2>' +
        '<h3>' + c.s + '</h3>' +
        '<p>' + c.d + '</p>' +
      '</div>' +
      '<div class="dots">' + S.map(function(_, k){
        return '<div class="dt' + (k === i ? ' on' : '') + '"></div>';
      }).join('') + '</div>' +
      '<button class="go">' + (i === S.length - 1 ? 'Boshlash' : 'Keyingisi') + '</button>';

    ov.querySelector('.go').addEventListener('click', next);
    ov.querySelector('.skip').addEventListener('click', finish);
  }

  function next(){
    try { TG.HapticFeedback.impactOccurred('light'); } catch(e){}
    if(i < S.length - 1){ i++; draw(); }
    else finish();
  }

  function finish(){
    ov.style.transition = 'opacity .4s';
    ov.style.opacity = '0';
    setTimeout(function(){ ov.remove(); done(); }, 420);
  }

  // Yonga surish
  let sx = null;
  ov.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive: true });
  ov.addEventListener('touchend', function(e){
    if(sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    sx = null;
    if(dx < -55) next();
    else if(dx > 55 && i > 0){ i--; draw(); }
  }, { passive: true });

  draw();
}
