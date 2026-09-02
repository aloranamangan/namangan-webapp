// ---------- Kirish ekrani (ikonka animatsiyasi) ----------
function showSplash(done){
  try {
    if(localStorage.getItem('ni_splash_seen')){ done(); return; }
  } catch(e){}

  var ov = document.createElement('div');
  ov.id = 'nsOv';
  ov.innerHTML =
    '<div class="ns-inner">' +
      '<div class="ns-halo"></div>' +
      '<img class="ns-ic" src="icon-192.png" alt="">' +
    '</div>';
  document.body.appendChild(ov);

  var st = document.createElement('style');
  st.textContent =
    '#nsOv{position:fixed;inset:0;z-index:99999;background:#0A0A0A;' +
      'display:flex;align-items:center;justify-content:center;' +
      'animation:nsIn .35s ease;}' +
    '#nsOv.out{animation:nsOut .5s ease forwards;}' +
    '.ns-inner{position:relative;width:150px;height:150px;' +
      'display:flex;align-items:center;justify-content:center;}' +
    '.ns-halo{position:absolute;inset:0;border-radius:50%;' +
      'background:radial-gradient(circle,rgba(212,175,55,.32),transparent 66%);' +
      'animation:nsPulse 2.4s ease-in-out infinite;}' +
    '.ns-ic{position:relative;z-index:1;width:118px;height:118px;' +
      'border-radius:29px;object-fit:cover;' +
      'box-shadow:0 16px 44px rgba(0,0,0,.6),0 0 0 1px rgba(212,175,55,.25);' +
      'animation:nsPop .9s cubic-bezier(.18,.9,.28,1.3) both,' +
      'nsFloat 3.6s ease-in-out 1s infinite;}' +
    '@keyframes nsIn{from{opacity:0}to{opacity:1}}' +
    '@keyframes nsOut{to{opacity:0;transform:scale(1.09)}}' +
    '@keyframes nsPop{0%{opacity:0;transform:scale(.55) rotate(-9deg)}' +
      '100%{opacity:1;transform:scale(1) rotate(0)}}' +
    '@keyframes nsPulse{0%,100%{opacity:.4;transform:scale(.9)}' +
      '50%{opacity:1;transform:scale(1.13)}}' +
    '@keyframes nsFloat{0%,100%{transform:translateY(0)}' +
      '50%{transform:translateY(-9px)}}';
  document.head.appendChild(st);

  setTimeout(function(){
    ov.classList.add('out');
    setTimeout(function(){
      try { ov.remove(); } catch(e){}
      try { localStorage.setItem('ni_splash_seen', '1'); } catch(e){}
      done();
    }, 500);
  }, 2000);
}
