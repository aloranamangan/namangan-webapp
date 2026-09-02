// ---------- Kirish slaydlari ----------
function showSplash(done){
  // Faqat birinchi marta
  try {
    if(localStorage.getItem('ni_splash_seen')){ done(); return; }
  } catch(e){}

  const S = [
    {
      bg: 'linear-gradient(160deg,#0B2545 0%,#134074 55%,#1B4965 100%)',
      art: '<div class="ns-photo"><img src="img/slide1.png"></div>',
      t: 'NAMANGAN',
      s: "Vodiyning yuragi",
      d: "Namangan avtovokzal ko'chasi"
    },
    {
      bg: 'linear-gradient(160deg,#1A0F00 0%,#2D1810 50%,#0F0A05 100%)',
      art: '<div class="crown-wrap">' +
           '<div class="fire"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
           '<div class="crown">👑</div></div>',
      t: 'DIKKIYLORD',
      s: 'JAMOASI',
      d: '📞 +998 94 501 18 18<br>📞 +998 50 977 76 76<br><b>Call center</b>'
    },
    {
      bg: 'linear-gradient(160deg,#134E5E 0%,#1B7A6E 50%,#71B280 100%)',
      art: '<div class="ns-photo"><img src="img/slide3.png"></div>',
      t: 'Namangan',
      s: 'Yangi uylar siz bilan',
      d: "Namangan xohlagan yeringizdan uy topib beramiz"
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
    #splash .ns-photo{
      width:240px;height:240px;border-radius:28px;overflow:hidden;
      margin:0 auto 26px;box-shadow:0 18px 50px rgba(0,0,0,.55);
      border:1px solid rgba(255,255,255,.16);
      animation:spIn .8s cubic-bezier(.2,.8,.2,1);
    }
    #splash .ns-photo img{width:100%;height:100%;object-fit:cover;display:block;}
    #splash .crown-wrap{position:relative;width:180px;height:180px;margin:0 auto 22px;
      display:flex;align-items:center;justify-content:center;}
    #splash .crown{font-size:82px;position:relative;z-index:3;
      filter:drop-shadow(0 0 22px rgba(255,170,40,.9));
      animation:spIn .8s cubic-bezier(.2,.8,.2,1);}
    #splash .fire{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);
      width:110px;height:120px;z-index:1;}
    #splash .fire i{
      position:absolute;bottom:0;left:50%;
      width:26px;height:26px;border-radius:50% 50% 35% 35%;
      background:radial-gradient(circle at 50% 75%,#fff6b0,#ffb300 42%,#ff5722 72%,rgba(255,87,34,0));
      filter:blur(4px);mix-blend-mode:screen;
      animation:flame 1.5s ease-in-out infinite;
    }
    #splash .fire i:nth-child(1){margin-left:-13px;animation-delay:0s;}
    #splash .fire i:nth-child(2){margin-left:-38px;animation-delay:.22s;}
    #splash .fire i:nth-child(3){margin-left:12px;animation-delay:.42s;}
    #splash .fire i:nth-child(4){margin-left:-26px;animation-delay:.62s;}
    #splash .fire i:nth-child(5){margin-left:2px;animation-delay:.85s;}
    #splash .fire i:nth-child(6){margin-left:-48px;animation-delay:1.05s;}
    #splash .fire i:nth-child(7){margin-left:24px;animation-delay:1.25s;}
    @keyframes flame{
      0%{opacity:0;transform:translateY(0) scale(.5);}
      18%{opacity:1;}
      60%{opacity:.85;}
      100%{opacity:0;transform:translateY(-88px) scale(1.5) rotate(9deg);}
    }
    #splash .crown-wrap::after{
      content:'';position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
      width:130px;height:52px;border-radius:50%;
      background:radial-gradient(ellipse,rgba(255,150,30,.55),transparent 70%);
      filter:blur(14px);animation:emb 2.2s ease-in-out infinite;
    }
    @keyframes emb{0%,100%{opacity:.5;transform:translateX(-50%) scale(1)}
      50%{opacity:.95;transform:translateX(-50%) scale(1.15)}}
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
        (c.art || ('<div class="ic">' + (c.ico || '') + '</div>')) +
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
    try { localStorage.setItem('ni_splash_seen', '1'); } catch(e){}
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
