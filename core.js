const API = 'https://api.namangan-ijara.uz';
const TG = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

function tgReady(){
  if(TG){ try { TG.ready(); TG.expand(); } catch(e){} }
}

// APK rejimi uchun token
let APP_TOKEN = null;
try {
  const p = new URLSearchParams(location.search);
  const t = p.get('token');
  if(t){ APP_TOKEN = t; localStorage.setItem('ni_token', t); }
  else APP_TOKEN = localStorage.getItem('ni_token');
} catch(e){}

let APP_ID = null;
try { APP_ID = parseInt(localStorage.getItem('ni_uid')) || null; } catch(e){}

function isApk(){
  return !TG || !TG.initData;
}

function loginTozala(){
  try { localStorage.removeItem('ni_logout'); } catch(e){}
}

function goLogin(){
  loginTozala();
  location.href = 'https://api.namangan-ijara.uz/login';
}

function myId(){
  if(APP_ID) return APP_ID;
  try {
    if(TG && TG.initDataUnsafe && TG.initDataUnsafe.user && TG.initDataUnsafe.user.id){
      return TG.initDataUnsafe.user.id;
    }
  } catch(e){}
  try {
    const raw = (TG && TG.initData) ? TG.initData : '';
    if(raw){
      const p = new URLSearchParams(raw);
      const u = p.get('user');
      if(u){
        const obj = JSON.parse(decodeURIComponent(u));
        if(obj && obj.id) return obj.id;
      }
    }
  } catch(e){}
  try {
    const h = location.hash || '';
    const m = h.match(/tgWebAppData=([^&]+)/);
    if(m){
      const p2 = new URLSearchParams(decodeURIComponent(m[1]));
      const u2 = p2.get('user');
      if(u2){
        const o2 = JSON.parse(u2);
        if(o2 && o2.id) return o2.id;
      }
    }
  } catch(e){}
  return null;
}

function initData(){
  try { return TG.initData || ''; } catch(e){ return ''; }
}

function haptic(t){
  try { TG.HapticFeedback.impactOccurred(t || 'light'); } catch(e){}
}

function fmt(n){
  n = Number(n) || 0;
  if(n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'mln';
  if(n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'ming';
  return String(n);
}

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function el(id){ return document.getElementById(id); }

function toast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.classList.add('show'); }, 10);
  setTimeout(function(){
    t.classList.remove('show');
    setTimeout(function(){ t.remove(); }, 300);
  }, 2600);
}

function api(path, opts){
  return fetch(API + path, opts).then(function(r){ return r.json(); });
}

function apiPost(path, body){
  const data = { init_data: initData() };
  if(APP_TOKEN) data.token = APP_TOKEN;
  for(const k in body) data[k] = body[k];
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

function mediaUrl(id){
  if(!id) return '';
  var s = String(id);
  if(s.indexOf('http://') === 0 || s.indexOf('https://') === 0) return s;
  return API + '/media/' + s;
}

function shrink(dataUrl, cb){
  const img = new Image();
  img.onload = function(){
    const MAX = 1440;
    let w = img.width, h = img.height;
    if(w > MAX || h > MAX){
      if(w > h){ h = Math.round(h * MAX / w); w = MAX; }
      else { w = Math.round(w * MAX / h); h = MAX; }
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    try { cb(c.toDataURL('image/jpeg', 0.85)); } catch(e){ cb(dataUrl); }
  };
  img.onerror = function(){ cb(dataUrl); };
  img.src = dataUrl;
}

function pickFiles(multiple, cb){
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*,video/*';
  if(multiple) inp.multiple = true;
  inp.style.display = 'none';
  document.body.appendChild(inp);

  inp.addEventListener('change', function(e){
    const files = Array.prototype.slice.call(e.target.files || []);
    if(!files.length){ inp.remove(); return; }
    const out = [];
    let done = 0;

    function check(){ if(done === files.length){ inp.remove(); cb(out); } }

    files.forEach(function(f){
      const isVid = f.type.indexOf('video') === 0;

      // Rasm: 20 MB
      if(!isVid && f.size > 20 * 1024 * 1024){
        if(typeof toast === 'function') toast('Rasm juda katta (max 20 MB)');
        done++; check(); return;
      }

      // Video: 1 GB
      if(isVid && f.size > 1024 * 1024 * 1024){
        if(typeof toast === 'function') toast('Video juda katta (max 1 GB)');
        done++; check(); return;
      }

      // Katta video: base64 o'qimaymiz, to'g'ridan R2 ga yuklanadi
      if(isVid && f.size > 2 * 1024 * 1024){
        out.push({ media: '', is_video: true, _file: f });
        done++; check(); return;
      }

      const r = new FileReader();
      r.onload = function(){
        if(isVid){
          out.push({ media: r.result, is_video: true, _file: f });
          done++; check();
        } else {
          shrink(r.result, function(sm){
            out.push({ media: sm, is_video: false });
            done++; check();
          });
        }
      };
      r.onerror = function(){ done++; check(); };
      r.readAsDataURL(f);
    });
  });

  inp.click();
}

document.addEventListener('DOMContentLoaded', tgReady);

// ---------- Cheklovni tekshirish ----------
function checkRestriction(cb){
  const id = myId();
  if(!id){ cb(false); return; }

  api('/api/cheklov?tg_id=' + id).then(function(d){
    if(d.blocked){ showBlocked('block', d.block_until); cb(true); return; }
    if(d.paused){ showBlocked('pause', d.pause_until); cb(true); return; }
    cb(false);
  }).catch(function(){ cb(false); });
}

function showBlocked(kind, until){
  const isBlock = kind === 'block';
  const d = document.createElement('div');
  d.className = 'blocked-screen';

  let untilTxt = '';
  if(until && until.length > 4){
    const dt = new Date(until.replace(' ', 'T'));
    if(!isNaN(dt)){
      const days = Math.max(0, Math.ceil((dt - new Date()) / 86400000));
      untilTxt = '<div class="bl-until">' + days + ' kundan keyin ochiladi</div>';
    }
  }

  d.innerHTML =
    '<div class="bl-circle"><span>' + (isBlock ? '&#128683;' : '&#9208;&#65039;') + '</span></div>' +
    '<h2>' + (isBlock ? t('blocked') : t('paused')) + '</h2>' +
    '<p>' + (isBlock
      ? 'Qoidalarni buzganingiz uchun hisobingiz cheklandi.<br>Savol boisa admin bilan boglaning.'
      : 'Hisobingiz vaqtincha toxtatib qoyildi.<br>Muddat tugagach avtomatik ochiladi.') + '</p>' +
    untilTxt +
    '<button id="blAdmin" style="margin-top:26px;padding:14px 30px;border:none;border-radius:100px;' +
    'background:#0095F6;color:#fff;font-size:15px;font-weight:800;cursor:pointer;' +
    'font-family:inherit;">&#128172; Admin bilan boglanish</button>';

  document.body.innerHTML = '';
  document.body.appendChild(d);

  const b = document.getElementById('blAdmin');
  if(b) b.addEventListener('click', function(){
    const u = 'https://t.me/Ijara_admin_namangan';
    if(TG && TG.openTelegramLink) TG.openTelegramLink(u);
    else window.open(u, '_blank');
  });
}

// ---------- Cheklovni tekshirish ----------
function checkRestriction(cb){
  const id = myId();
  if(!id){ cb(false); return; }
  api('/api/cheklov?tg_id=' + id).then(function(d){
    if(d.blocked){ showBlocked('block', d.block_until); cb(true); return; }
    if(d.paused){ showBlocked('pause', d.pause_until); cb(true); return; }
    cb(false);
  }).catch(function(){ cb(false); });
}

function showBlocked(kind, until){
  const isBlock = kind === 'block';
  const d = document.createElement('div');
  d.className = 'blocked-screen';

  let untilTxt = '';
  if(until && until.length > 4){
    const dt = new Date(until.replace(' ', 'T'));
    if(!isNaN(dt)){
      const days = Math.max(0, Math.ceil((dt - new Date()) / 86400000));
      untilTxt = '<div class="bl-until">' + days + ' kundan keyin ochiladi</div>';
    }
  }

  d.innerHTML =
    '<div class="bl-circle"><span>' + (isBlock ? '&#128683;' : '&#9208;&#65039;') + '</span></div>' +
    '<h2>' + (isBlock ? t('blocked') : t('paused')) + '</h2>' +
    '<p>' + (isBlock
      ? 'Qoidalarni buzganingiz uchun hisobingiz cheklandi.<br>Savol boisa admin bilan boglaning.'
      : 'Hisobingiz vaqtincha toxtatib qoyildi.<br>Muddat tugagach avtomatik ochiladi.') + '</p>' +
    untilTxt +
    '<button id="blAdmin" style="margin-top:26px;padding:14px 30px;border:none;border-radius:100px;' +
    'background:#0095F6;color:#fff;font-size:15px;font-weight:800;cursor:pointer;' +
    'font-family:inherit;">&#128172; Admin bilan boglanish</button>';

  document.body.innerHTML = '';
  document.body.appendChild(d);

  const b = document.getElementById('blAdmin');
  if(b) b.addEventListener('click', function(){
    const u = 'https://t.me/Ijara_admin_namangan';
    if(TG && TG.openTelegramLink) TG.openTelegramLink(u);
    else window.open(u, '_blank');
  });
}


// APK: sessiyani tekshirish
function checkSession(cb){
  if(!isApk()){ cb(true); return; }
  if(!APP_TOKEN){ cb(false); return; }

  fetch(API + '/api/me?token=' + encodeURIComponent(APP_TOKEN))
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.ok && d.tg_id){
        APP_ID = d.tg_id;
        try { localStorage.setItem('ni_uid', String(d.tg_id)); } catch(e){}
        cb(true);
      } else cb(false);
    })
    .catch(function(){ cb(false); });
}

function requireAuth(cb){
  try {
    var u = window.Telegram && window.Telegram.WebApp
      && window.Telegram.WebApp.initDataUnsafe
      && window.Telegram.WebApp.initDataUnsafe.user;
    if(u && u.id){
      APP_ID = u.id;
      try { localStorage.setItem('ni_uid', String(u.id)); } catch(e){}
      cb(); return;
    }
  } catch(e){}
  try {
    var s = localStorage.getItem('ni_uid');
    if(s && s !== 'null' && s !== '0'){
      APP_ID = parseInt(s);
      cb(); return;
    }
  } catch(e){}
  checkSession(function(ok){
    if(ok){ cb(); return; }
    igLoginScreen();
  });
}

function askRole(cb){
  if(!isApk()){ cb(); return; }

  const id = myId();
  if(!id){ showRolePick(cb); return; }

  // Rolni serverdan olamiz (bot bilan bir xil bo'lishi uchun)
  api('/api/user?tg_id=' + id).then(function(d){
    const role = (d && d.ok && d.role) ? d.role : null;

    if(IS_ADMIN || myId() === 7894423610){
      let last = null;
      try {
        last = localStorage.getItem('ni_admin_panel');
        if(last === 'radar.html'){
          localStorage.removeItem('ni_admin_panel');
          last = null;
        }
      } catch(e){}
      const cur = location.pathname.split('/').pop();
      if(last){
        if(last !== cur){ location.href = last; return; }
        cb(); return;
      }
      showAdminPanels(cb);
      return;
    }

    // Bitta ilova - rol yoq
    if(location.pathname.indexOf('xaridor') === -1 &&
       location.pathname.indexOf('sotuvchi') === -1 &&
       location.pathname.indexOf('.html') !== -1){
      cb(); return;
    }
    cb();
  }).catch(function(){ showRolePick(cb); });
}

function showRolePick(cb){

  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9400;background:#000;color:#fff;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    "padding:40px 28px;text-align:center;font-family:'Manrope',sans-serif;";
  ov.innerHTML =
    '<div style="font-size:56px;margin-bottom:18px;">&#128075;</div>' +
    '<h2 style="font-size:25px;font-weight:800;margin-bottom:10px;">Xush kelibsiz!</h2>' +
    '<p style="font-size:14px;color:#8E8E8E;line-height:1.6;margin-bottom:34px;max-width:300px;">' +
    'Ilovadan qanday foydalanmoqchisiz?<br><b style="color:#FFC107;">Tanlov doimiy qoladi.</b></p>' +
    '<button id="rMak" style="width:100%;max-width:320px;padding:18px;margin-bottom:12px;' +
    'border:1px solid #262626;border-radius:16px;background:#121212;color:#fff;cursor:pointer;' +
    "font-family:inherit;text-align:left;display:flex;align-items:center;gap:14px;\">" +
    '<span style="font-size:28px;">&#127968;</span><span>' +
    '<b style="display:block;font-size:15px;">Sotuvchi / Makler</b>' +
    '<span style="font-size:12px;color:#8E8E8E;">E\'lon joylayman</span></span></button>' +
    '<button id="rXar" style="width:100%;max-width:320px;padding:18px;' +
    'border:1px solid #262626;border-radius:16px;background:#121212;color:#fff;cursor:pointer;' +
    "font-family:inherit;text-align:left;display:flex;align-items:center;gap:14px;\">" +
    '<span style="font-size:28px;">&#128100;</span><span>' +
    '<b style="display:block;font-size:15px;">Xaridor</b>' +
    '<span style="font-size:12px;color:#8E8E8E;">E\'lonlarni ko\'raman</span></span></button>';

  document.body.appendChild(ov);

  function pick(role, go){
    apiPost('/api/rol-saqlash', { role: role })
      .then(function(){ go(); })
      .catch(function(){ go(); });
  }

  document.getElementById('rMak').addEventListener('click', function(){
    pick('makler', function(){ location.href = 'xaridor.html'; });
  });
  document.getElementById('rXar').addEventListener('click', function(){
    pick('xaridor', function(){ ov.remove(); cb(); });
  });
}

// ---------- Admin panellari (APK) ----------
const ADMIN_ID_APP = 7894423610;
let IS_ADMIN = false, IS_SUPER = false;

function loadAdminState(cb){
  const id = myId();
  if(!id){ if(cb) cb(); return; }
  if(id === ADMIN_ID_APP){ IS_ADMIN = true; IS_SUPER = true; if(cb) cb(); return; }

  api('/api/admin-holat?tg_id=' + id).then(function(d){
    IS_ADMIN = !!(d && d.admin);
    IS_SUPER = !!(d && d.super);
    if(cb) cb();
  }).catch(function(){ if(cb) cb(); });
}

function showAdminPanels(cb, force){
  const id = myId();
  if(!IS_ADMIN && id !== ADMIN_ID_APP){ if(cb) cb(); return; }

  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9400;background:#000;color:#fff;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    "padding:36px 26px;text-align:center;font-family:'Manrope',sans-serif;";

  const P = [
    ['radar.html', '🖥', 'Tizim monitori', 'Server, xatolar, statistika'],
    ['xaridor.html', '👥', 'Xaridor paneli', "E'lonlarni ko'rish"],
    ['admin.html', '📊', 'Nazorat paneli', 'Foydalanuvchilar boshqaruvi'],
    ['zaxira.html', '⚙️', 'Boshqaruv markazi', 'Reklama, xabar, kanallar']
  ];

  ov.innerHTML =
    '<button id="apnClose" style="position:absolute;top:calc(16px + env(safe-area-inset-top));' +
    'right:18px;width:36px;height:36px;border-radius:50%;border:none;background:#1a1a1a;' +
    'color:#fff;font-size:20px;cursor:pointer;">&times;</button>' +
    '<div style="font-size:50px;margin-bottom:14px;">🛠</div>' +
    '<h2 style="font-size:23px;font-weight:800;margin-bottom:8px;">Admin panellari</h2>' +
    '<p style="font-size:13px;color:#8E8E8E;margin-bottom:28px;">Qaysi bo\'limga kirasiz?</p>' +
    P.map(function(p){
      return '<button class="apn" data-u="' + p[0] + '" style="width:100%;max-width:340px;' +
        'padding:16px;margin-bottom:11px;border:1px solid #262626;border-radius:16px;' +
        'background:#121212;color:#fff;cursor:pointer;font-family:inherit;text-align:left;' +
        'display:flex;align-items:center;gap:14px;">' +
        '<span style="font-size:26px;">' + p[1] + '</span><span>' +
        '<b style="display:block;font-size:15px;">' + p[2] + '</b>' +
        '<span style="font-size:12px;color:#8E8E8E;">' + p[3] + '</span></span></button>';
    }).join('');

  document.body.appendChild(ov);

  const cx = document.getElementById('apnClose');
  if(cx) cx.addEventListener('click', function(){ ov.remove(); if(cb) cb(); });

  ov.querySelectorAll('.apn').forEach(function(b){
    b.addEventListener('click', function(){
      const u = b.dataset.u;
      try {
        if(u !== 'radar.html') localStorage.setItem('ni_admin_panel', u);
        else localStorage.removeItem('ni_admin_panel');
      } catch(e){}
      const cur = location.pathname.split('/').pop();
      if(u === cur){ ov.remove(); if(cb) cb(); }
      else location.href = u;
    });
  });
}

// ---------- Majburiy obuna ----------
function checkSubs(cb){
  const id = myId();
  if(!id){ cb(true); return; }

  api('/api/obuna-tekshir?tg_id=' + id).then(function(d){
    if(d.subscribed){ cb(true); return; }
    showSubScreen(d.missing || [], cb);
  }).catch(function(){ cb(true); });
}

function showSubScreen(list, cb){
  const old = document.getElementById('subScr');
  if(old) old.remove();

  const s = document.createElement('div');
  s.id = 'subScr';
  s.className = 'sub-screen';

  const KIND = { channel: '\u{1F4E2}', group: '\u{1F465}', bot: '\u{1F916}' };
  const KLBL = { channel: 'Kanal', group: 'Guruh', bot: 'Bot' };

  s.innerHTML =
    '<div class="orb a"></div><div class="orb b"></div>' +
    '<div class="ic">\u{1F514}</div>' +
    '<h2>Ilovadan foydalanish uchun</h2>' +
    '<p>Quyidagilarga a\u2019zo bo\u2018ling,<br>so\u2018ng <b style="color:#fff;">Tekshirish</b> tugmasini bosing</p>' +

    '<div class="sub-list">' +
      list.map(function(c){
        const k = c.kind || 'channel';
        const lnk = c.url || c.link ||
          ('https://t.me/' + String(c.username || c.chat_id || '').replace('@',''));
        return '<div class="sub-item" data-u="' + esc(lnk) + '">' +
          '<span class="e">' + (KIND[k] || KIND.channel) + '</span>' +
          '<span class="t"><b>' + esc(c.title || c.username || '') + '</b>' +
          '<span>' + (KLBL[k] || 'Kanal') + '</span></span>' +
          '<span class="go">Ochish</span></div>';
      }).join('') +
    '</div>' +

    '<div class="sub-warn">' +
      '\u26A0\uFE0F Obuna bo\u2018lmasangiz ilova ishlamaydi' +
    '</div>' +

    '<button class="sub-check" id="subGo">Tekshirish</button>';

  document.body.appendChild(s);

  // Kanallarni ochish
  s.querySelectorAll('.sub-item').forEach(function(it){
    it.addEventListener('click', function(){
      const u = it.dataset.u;
      if(!u) return;
      haptic('light');
      it.classList.add('done');
      it.querySelector('.go').textContent = '\u2713 Ochildi';
      if(TG && TG.openTelegramLink) TG.openTelegramLink(u);
      else window.open(u, '_blank');
    });
  });

  // Tekshirish
  const gb = s.querySelector('#subGo');
  gb.addEventListener('click', function(){
    gb.disabled = true;
    gb.textContent = 'Tekshirilmoqda...';
    haptic('light');

    const id = myId();

    // Telegram bo'lmagan foydalanuvchilar - o'tkazamiz
    if(!id || id < 0){
      setTimeout(function(){ subOkScreen(s, cb); }, 900);
      return;
    }

    api('/api/obuna-tekshir?tg_id=' + id + '&t=' + Date.now()).then(function(d){
      if(d.subscribed){
        subOkScreen(s, cb);
      } else {
        toast('Hali a\u2019zo bo\u2018lmadingiz');
        haptic('medium');
        gb.disabled = false;
        gb.textContent = 'Tekshirish';
      }
    }).catch(function(){
      // Xato bo'lsa ham o'tkazamiz
      subOkScreen(s, cb);
    });
  });
}

function subOkScreen(subEl, cb){
  const ok = document.createElement('div');
  ok.className = 'sub-ok';
  ok.innerHTML =
    '<div class="circle">\u2713</div>' +
    '<h2>Obuna bo\u2018ldingiz!</h2>' +
    '<p>Ilovaga xush kelibsiz</p>';

  document.body.appendChild(ok);
  haptic('medium');

  setTimeout(function(){
    ok.remove();
    if(subEl) subEl.remove();
    cb(true);
  }, 1800);
}

// ---------- Ommaviy profil ----------
function openUserProfileOld(tgId, username){
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.style.zIndex = '7500';
  bg.innerHTML = '<div class="sheet" id="upS" style="max-height:88vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div id="upBody"><div class="load">Yuklanmoqda...</div></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  document.getElementById('upS').addEventListener('click', function(e){ e.stopPropagation(); });

  const q = username
    ? '/api/profil?username=' + encodeURIComponent(username)
    : '/api/profil?tg_id=' + tgId;

  api(q).then(function(d){
    const box = document.getElementById('upBody');
    if(!box) return;

    if(!d.ok){
      box.innerHTML = '<div class="empty" style="padding:44px 16px;">' +
        '<span>Profil topilmadi</span></div>';
      return;
    }

    const ava = d.avatar
      ? mediaUrl(d.avatar)
      : 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(d.name || 'U');

    const vb = d.verified
      ? '<svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="#0095F6">' +
        '<path d="M12 1l2.5 2.2 3.3-.4 1 3.2 3 1.5-1.2 3.1 1.2 3.1-3 1.5-1 3.2-3.3-.4L12 23l-2.5-2.2-3.3.4-1-3.2-3-1.5 1.2-3.1L2.2 10l3-1.5 1-3.2 3.3.4z"/>' +
        '<path d="M10.5 15.2l-3-3 1.2-1.2 1.8 1.8 4.3-4.3 1.2 1.2z" fill="#000"/></svg>'
      : '';

    let h = '<div class="up-head">' +
      '<img class="up-ava" src="' + ava + '">' +
      '<b>' + esc(d.name || 'Foydalanuvchi') + vb + '</b>';

    if(d.type === 'makler'){
      h += '<div class="nk">@' + esc(d.username || '') + '</div>' +
        '<div class="up-stats">' +
        '<div><b>' + fmt(d.posts || 0) + '</b><span>elon</span></div>' +
        '<div><b>' + fmt(d.followers || 0) + '</b><span>obunachi</span></div>' +
        '</div></div>' +
        '<div class="up-btns">' +
        '<button style="background:#0095F6;color:#fff;" id="upMsg">Yozish</button>' +
        (d.phone ? '<button style="background:#262626;color:#fff;" id="upCall">Qongiroq</button>' : '') +
        '</div>';
    } else {
      h += (d.nickname ? '<div class="nk">@' + esc(d.nickname) + '</div>' : '') +
        '</div>' +
        '<div class="up-btns">' +
        '<button style="background:#0095F6;color:#fff;" id="upMsg">Yozish</button>' +
        '</div>';
    }

    box.innerHTML = h;

    const mb = document.getElementById('upMsg');
    if(mb) mb.addEventListener('click', function(){
      bg.remove();
      if(typeof openChat === 'function') openChat(d.tg_id, d.name);
    });

    const cb = document.getElementById('upCall');
    if(cb && d.phone) cb.addEventListener('click', function(){
      location.href = 'tel:' + d.phone;
    });
  }).catch(function(){
    const box = document.getElementById('upBody');
    if(box) box.innerHTML = '<div class="load">Xato yuz berdi</div>';
  });
}


// ---------- Ommaviy profil (to'liq ekran) ----------
function openUserProfile(tgId, username){
  const v = document.createElement('div');
  v.className = 'up-full';
  v.innerHTML =
    '<div class="up-bar"><button id="upBack">&#8592;</button><b id="upTitle">Profil</b></div>' +
    '<div id="upBody"><div class="load">Yuklanmoqda...</div></div>';

  document.body.appendChild(v);
  document.getElementById('upBack').addEventListener('click', function(){ v.remove(); });

  const q = username
    ? '/api/profil?username=' + encodeURIComponent(username)
    : '/api/profil?tg_id=' + tgId;

  api(q).then(function(d){
    const box = document.getElementById('upBody');
    if(!box) return;

    if(!d.ok){
      box.innerHTML = '<div class="empty" style="padding:70px 16px;">' +
        '<div class="ic">&#128100;</div><p>Profil topilmadi</p></div>';
      return;
    }

    const tt = document.getElementById('upTitle');
    if(tt) tt.textContent = d.name || 'Profil';

    const ava = d.avatar
      ? mediaUrl(d.avatar)
      : 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(d.name || 'U');

    const vb = d.verified
      ? '<svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="#0095F6">' +
        '<path d="M12 1l2.5 2.2 3.3-.4 1 3.2 3 1.5-1.2 3.1 1.2 3.1-3 1.5-1 3.2-3.3-.4L12 23l-2.5-2.2-3.3.4-1-3.2-3-1.5 1.2-3.1L2.2 10l3-1.5 1-3.2 3.3.4z"/>' +
        '<path d="M10.5 15.2l-3-3 1.2-1.2 1.8 1.8 4.3-4.3 1.2 1.2z" fill="#000"/></svg>'
      : '';

    let h = '<div class="up-head">' +
      '<img class="up-ava" src="' + ava + '">' +
      '<b>' + esc(d.name || 'Foydalanuvchi') + vb + '</b>';

    if(d.type === 'makler'){
      h += '<div class="nk">@' + esc(d.username || '') + '</div>' +
        '<div class="up-stats">' +
        '<div><b>' + fmt(d.posts || 0) + '</b><span>elon</span></div>' +
        '<div><b>' + fmt(d.followers || 0) + '</b><span>obunachi</span></div>' +
        '</div></div>' +
        '<div class="up-btns">' +
        '<button style="background:#0095F6;color:#fff;" id="upMsg">Yozish</button>' +
        (d.phone ? '<button style="background:#262626;color:#fff;" id="upCall">Qongiroq</button>' : '') +
        '</div><div id="upPosts"></div>';
    } else {
      h += (d.nickname ? '<div class="nk">@' + esc(d.nickname) + '</div>' : '') +
        '</div>' +
        '<div class="up-btns">' +
        '<button style="background:#0095F6;color:#fff;" id="upMsg">Yozish</button>' +
        '</div>' +
        '<div class="empty" style="padding:50px 20px;">' +
        '<div class="ic">&#128274;</div><p>Maxfiy profil</p>' +
        '<span>Bu foydalanuvchi elon joylamaydi</span></div>';
    }

    box.innerHTML = h;

    const mb = document.getElementById('upMsg');
    if(mb) mb.addEventListener('click', function(){
      v.remove();
      if(typeof openChat === 'function') openChat(d.tg_id, d.name);
    });

    const cb = document.getElementById('upCall');
    if(cb && d.phone) cb.addEventListener('click', function(){
      location.href = 'tel:' + d.phone;
    });

    if(d.type === 'makler' && d.username){
      api('/api/postlar?username=' + encodeURIComponent(d.username)).then(function(p){
        const pb = document.getElementById('upPosts');
        if(!pb) return;
        const list = p.posts || [];
        if(!list.length){
          pb.innerHTML = '<div class="empty" style="padding:44px 16px;"><span>Elon yoq</span></div>';
          return;
        }
        pb.innerHTML = '<div class="up-grid">' + list.map(function(x){
          const m = (x.media && x.media[0]) ? x.media[0] : { file_id: x.file_id, is_video: x.is_video };
          if(!m.file_id) return '';
          const u = mediaUrl(m.file_id);
          return '<div class="up-cell">' +
            (m.is_video ? '<video src="' + u + '" muted></video>' : '<img src="' + u + '">') +
            '</div>';
        }).join('') + '</div>';
      }).catch(function(){});
    }
  }).catch(function(){
    const box = document.getElementById('upBody');
    if(box) box.innerHTML = '<div class="load">Xato yuz berdi</div>';
  });
}

// ---------- Instagram uslubidagi kirish ekrani ----------
function igLoginScreen(){
  document.body.innerHTML =
    '<div class="ig-login">' +
      '<div class="ig-top">' +
        '<div class="ig-logo"><span class="uy">UY</span><span class="gram">gram</span></div>' +
        '<div class="ig-slogan">Zamonaviy uylar bizda</div>' +

        '<input class="ig-inp" id="igUser" placeholder="Login yoki telefon" autocomplete="username">' +
        '<input class="ig-inp" id="igPass" type="password" placeholder="Parol" autocomplete="current-password">' +
        '<button class="ig-btn" id="igGo" disabled>Kirish</button>' +
        '<div class="ig-forgot" id="igForgot">Parolni unutdingizmi?</div>' +

        '<div class="ig-or"><span>YOKI</span></div>' +

        '<div class="ig-socials">' +
          '<button class="ig-soc tg" id="socTg">' +
            '<svg viewBox="0 0 24 24"><path d="M23.1 3.2c-.3-.3-.8-.4-1.4-.2L1.6 10.8c-.6.2-.9.6-.9 1s.3.8.9 1l5.1 1.9 2 6c.1.4.4.6.8.6.3 0 .5-.1.7-.3l2.8-2.8 5 3.7c.3.2.6.3.9.3.5 0 .9-.4 1-.9l3.5-16.6c.1-.6 0-1.1-.3-1.5zM8.5 14.2l-3.9-1.5L18 6.4 8.5 14.2zm1.4 4.3l-1.2-3.6 9.4-7.7-6.4 9.4-1.8 1.9z"/></svg>' +
            'Telegram bilan davom etish</button>' +

          '<button class="ig-soc gg" id="socGg">' +
            '<svg viewBox="0 0 24 24">' +
            '<path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.4-.2-2.1H12v3.9h6c-.1 1-.8 2.6-2.2 3.6l3.4 2.6c2-1.8 3.4-4.6 3.4-8z"/>' +
            '<path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.4-2.6c-.9.6-2.1 1.1-3.8 1.1-2.9 0-5.3-1.9-6.2-4.5l-3.5 2.7C4.1 20.5 7.8 23 12 23z"/>' +
            '<path fill="#FBBC05" d="M5.8 14.4c-.2-.7-.4-1.4-.4-2.2s.1-1.5.3-2.2L2.3 7.3C1.5 8.7 1 10.3 1 12.2s.5 3.5 1.3 4.9l3.5-2.7z"/>' +
            '<path fill="#EA4335" d="M12 5.4c2 0 3.4.9 4.2 1.6l3-3C17.4 2.2 14.9 1 12 1 7.8 1 4.1 3.5 2.3 7.3l3.5 2.7C6.7 7.3 9.1 5.4 12 5.4z"/></svg>' +
            'Google bilan davom etish</button>' +

        '</div>' +

        '<div class="ig-team" id="igTeam">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<rect x="2" y="2" width="20" height="20" rx="5"/>' +
          '<circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>' +
          'DIKKIYLORD JAMOASI' +
        '</div>' +
      '</div>' +

      '<div class="ig-bottom">Hisobingiz yoqmi? <b id="igReg">Royxatdan oting</b></div>' +
    '</div>';

  // Tugmalarni ulash
  const u = document.getElementById('igUser');
  const p = document.getElementById('igPass');
  const g = document.getElementById('igGo');

  function tekshir(){
    g.disabled = !(u.value.trim().length >= 3 && p.value.length >= 4);
  }
  u.addEventListener('input', tekshir);
  p.addEventListener('input', tekshir);

  g.addEventListener('click', function(){
    const lg = u.value.trim().toLowerCase();
    const pw = p.value;

    g.disabled = true;
    g.textContent = 'Tekshirilmoqda...';

    fetch(API + '/api/kirish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: lg, parol: pw })
    }).then(function(r){ return r.json(); }).then(function(d){
      if(d.ok && d.token){
        try {
          localStorage.setItem('ni_token', d.token);
          localStorage.removeItem('ni_logout');
        } catch(e){}
        haptic('medium');
        toast('Xush kelibsiz!');
        setTimeout(function(){ location.reload(); }, 600);
      } else {
        toast(d.error || 'Login yoki parol xato');
        g.disabled = false;
        g.textContent = 'Kirish';
      }
    }).catch(function(){
      toast('Server xatosi');
      g.disabled = false;
      g.textContent = 'Kirish';
    });
  });

  // Enter bilan kirish
  p.addEventListener('keypress', function(e){
    if(e.key === 'Enter' && !g.disabled) g.click();
  });

  document.getElementById('igForgot').addEventListener('click', function(){
    toast('Telegram yoki Google bilan kirib, parolni tiklang');
  });

  document.getElementById('igReg').addEventListener('click', royxatOyna);

  document.getElementById('socTg').addEventListener('click', goLogin);

  document.getElementById('socGg').addEventListener('click', function(){
    loginTozala();
    location.href = 'https://api.namangan-ijara.uz/google-login';
  });

  document.getElementById('igTeam').addEventListener('click', function(){
    const url = 'https://instagram.com/dikkiylord';
    if(TG && TG.openLink) TG.openLink(url); else window.open(url, '_blank');
  });
}

// ---------- Ro'yxatdan o'tish oynasi ----------
function royxatOyna(){
  const bg = document.createElement('div');
  bg.className = 'ig-login';
  bg.style.zIndex = '9600';

  bg.innerHTML =
    '<div class="ig-top">' +
      '<div class="ig-logo"><span class="uy">UY</span><span class="gram">gram</span></div>' +
      '<div class="ig-slogan">Royxatdan oting</div>' +

      '<input class="ig-inp" id="rgIsm" placeholder="Ism familiya" autocomplete="name">' +
      '<input class="ig-inp" id="rgLogin" placeholder="Login (lotin harflari)" autocomplete="username">' +
      '<div class="un-msg" id="rgMsg" style="margin:-4px 0 8px 4px;"></div>' +
      '<input class="ig-inp" id="rgPass" type="password" placeholder="Parol (kamida 6 belgi)" autocomplete="new-password">' +
      '<input class="ig-inp" id="rgPass2" type="password" placeholder="Parolni takrorlang" autocomplete="new-password">' +
      '<button class="ig-btn" id="rgGo" disabled>Royxatdan otish</button>' +

      '<div class="ig-forgot" id="rgBack" style="margin-top:22px;">&#8592; Kirish sahifasiga qaytish</div>' +
    '</div>';

  document.body.appendChild(bg);

  const ism = bg.querySelector('#rgIsm');
  const lg = bg.querySelector('#rgLogin');
  const p1 = bg.querySelector('#rgPass');
  const p2 = bg.querySelector('#rgPass2');
  const msg = bg.querySelector('#rgMsg');
  const go = bg.querySelector('#rgGo');

  let loginOk = false;
  let tm = null;

  function tekshir(){
    const lgV = lg.value.trim().toLowerCase();
    const lgOk = /^[a-z0-9._]{4,32}$/.test(lgV);

    go.disabled = !(
      ism.value.trim().length >= 3 &&
      lgOk &&
      p1.value.length >= 6 &&
      p1.value === p2.value
    );
  }

  [ism, lg, p1, p2].forEach(function(e){ e.addEventListener('input', tekshir); });

  lg.addEventListener('input', function(){
    const v = lg.value.trim().toLowerCase();

    if(!v){ msg.textContent = ''; msg.className = 'un-msg'; return; }

    if(!/^[a-z0-9._]{4,32}$/.test(v)){
      msg.textContent = '\u2717 4-32 belgi, lotin harflari, raqam, nuqta';
      msg.className = 'un-msg busy';
    } else {
      msg.textContent = '\u2713 Yaxshi';
      msg.className = 'un-msg free';
    }
  });

  p2.addEventListener('input', function(){
    if(p2.value && p1.value !== p2.value){
      p2.style.borderColor = '#ED4956';
    } else {
      p2.style.borderColor = '';
    }
  });

  go.addEventListener('click', function(){
    go.disabled = true;
    go.textContent = 'Yaratilmoqda...';

    fetch(API + '/api/royxat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ism: ism.value.trim(),
        login: lg.value.trim().toLowerCase(),
        parol: p1.value
      })
    }).then(function(r){ return r.json(); }).then(function(d){
      if(d.ok && d.token){
        try {
          localStorage.setItem('ni_token', d.token);
          localStorage.removeItem('ni_logout');
        } catch(e){}
        haptic('medium');
        toast('Xush kelibsiz!');
        setTimeout(function(){ location.reload(); }, 700);
      } else {
        toast(d.error || 'Xato');
        go.disabled = false;
        go.textContent = 'Royxatdan otish';
      }
    }).catch(function(){
      toast('Server xatosi');
      go.disabled = false;
      go.textContent = 'Royxatdan otish';
    });
  });

  bg.querySelector('#rgBack').addEventListener('click', function(){ bg.remove(); });
}

// ---------- Reklama kalkulyatori ----------
function reklamaOyna(postId){
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.style.zIndex = '9100';
  bg.innerHTML = '<div class="sheet" id="rkS" style="max-height:92vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="sheet-title">\u{1F4E2} Reklama qilish</div>' +
    '<div id="rkBody"><div class="load">Yuklanmoqda...</div></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#rkS').addEventListener('click', function(e){ e.stopPropagation(); });

  api('/api/reklama-narx?t=' + Date.now()).then(function(d){
    if(!d.ok){ bg.querySelector('#rkBody').innerHTML = '<div class="load">Xato</div>'; return; }
    chizRk(bg, d, postId);
  }).catch(function(){
    bg.querySelector('#rkBody').innerHTML = '<div class="load">Server xatosi</div>';
  });
}

function chizRk(bg, d, postId){
  const baza = d.baza || {};
  const turlar = Object.keys(baza);
  let tur = turlar[0] || 'lenta';
  let kun = 1;
  let soni = 1;

  const box = bg.querySelector('#rkBody');

  box.innerHTML =
    '<div class="wrap">' +
      (d.keyingi_bosqich
        ? '<div class="rk-info">\u{1F4C8} Hozir <b>' + fmt(d.foydalanuvchi) + '</b> foydalanuvchi. ' +
          '<b>' + fmt(d.keyingi_bosqich) + '</b> ga yetganda narx oshadi \u2014 hozir oling!</div>'
        : '') +

      '<div class="rk-types" id="rkTypes">' +
        turlar.map(function(k){
          const b = baza[k];
          return '<div class="rk-type' + (k === tur ? ' on' : '') + '" data-k="' + k + '">' +
            '<span class="e">' + b.emoji + '</span>' +
            '<div class="n">' + esc(b.nom) + '</div>' +
            '<div class="p">' + fmt(b.narx) + ' / kun</div>' +
            '<div class="iz">' + esc(b.izoh) + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      '<div class="rk-row">' +
        '<div class="lb"><span>Muddat</span><b id="rkKunT">1 kun</b></div>' +
        '<input type="range" class="rk-slider" id="rkKun" min="1" max="30" value="1">' +
      '</div>' +

      '<div class="rk-row">' +
        '<div class="lb"><span>Elonlar soni</span><b id="rkSonT">1 ta</b></div>' +
        '<input type="range" class="rk-slider" id="rkSon" min="1" max="10" value="1">' +
      '</div>' +

      '<div class="rk-disc-list" id="rkDisc">' +
        (d.chegirma || []).map(function(c){
          return '<span class="rk-disc" data-n="' + c.soni + '">' +
            c.soni + ' ta \u2192 ' + c.foiz + '%</span>';
        }).join('') +
      '</div>' +

      '<div class="rk-total">' +
        '<div class="r"><span>Kunlik narx</span><b id="rkDay">\u2014</b></div>' +
        '<div class="r"><span>Muddat</span><b id="rkKunN">1 kun</b></div>' +
        '<div class="r"><span>Elonlar</span><b id="rkSonN">1 ta</b></div>' +
        '<div class="r disc" id="rkDiscRow" style="display:none;">' +
          '<span>Chegirma</span><b id="rkDiscN">\u2014</b></div>' +
        '<div class="big"><span>Jami</span>' +
          '<div><span class="rk-old" id="rkOld" style="display:none;"></span>' +
          '<b id="rkSum">\u2014</b></div></div>' +
      '</div>' +

      '<button class="btn" id="rkGo">Buyurtma berish</button>' +
    '</div>';

  function hisobla(){
    const b = baza[tur];
    if(!b) return;

    const asos = b.narx * kun * soni;

    let ch = 0;
    (d.chegirma || []).forEach(function(c){
      if(soni >= c.soni) ch = c.foiz;
    });

    const yakuniy = Math.round(asos * (100 - ch) / 100);

    bg.querySelector('#rkDay').textContent = fmt(b.narx);
    bg.querySelector('#rkKunN').textContent = kun + ' kun';
    bg.querySelector('#rkSonN').textContent = soni + ' ta';
    bg.querySelector('#rkKunT').textContent = kun + ' kun';
    bg.querySelector('#rkSonT').textContent = soni + ' ta';

    const dr = bg.querySelector('#rkDiscRow');
    const ol = bg.querySelector('#rkOld');
    if(ch > 0){
      dr.style.display = '';
      bg.querySelector('#rkDiscN').textContent = '\u2212' + ch + '%';
      ol.style.display = '';
      ol.textContent = fmt(asos);
    } else {
      dr.style.display = 'none';
      ol.style.display = 'none';
    }

    bg.querySelector('#rkSum').textContent = fmt(yakuniy);

    // Chegirma yorliqlari
    bg.querySelectorAll('.rk-disc').forEach(function(x){
      x.classList.toggle('on', soni >= parseInt(x.dataset.n));
    });
  }

  bg.querySelectorAll('.rk-type').forEach(function(t){
    t.addEventListener('click', function(){
      bg.querySelectorAll('.rk-type').forEach(function(x){ x.classList.remove('on'); });
      t.classList.add('on');
      tur = t.dataset.k;
      haptic('light');
      hisobla();
    });
  });

  bg.querySelector('#rkKun').addEventListener('input', function(e){
    kun = parseInt(e.target.value);
    hisobla();
  });

  bg.querySelector('#rkSon').addEventListener('input', function(e){
    soni = parseInt(e.target.value);
    hisobla();
  });

  bg.querySelector('#rkGo').addEventListener('click', function(){
    const gb = bg.querySelector('#rkGo');
    gb.disabled = true;
    gb.textContent = 'Yuborilmoqda...';

    apiPost('/api/reklama-buyurtma', {
      tur: tur, kun: kun, soni: soni, post_id: postId || null
    }).then(function(r){
      if(!r.ok){
        toast(r.error || 'Xato');
        gb.disabled = false;
        gb.textContent = 'Buyurtma berish';
        return;
      }
      bg.remove();
      tolovOyna(r);
    }).catch(function(){
      toast('Server xatosi');
      gb.disabled = false;
      gb.textContent = 'Buyurtma berish';
    });
  });

  hisobla();
}

function tolovOyna(r){
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.style.zIndex = '9200';
  bg.innerHTML = '<div class="sheet" id="tlS" style="max-height:88vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="sheet-title">Tolov</div>' +
    '<div class="wrap">' +
      '<div class="pay-card">' +
        '<div class="lb">KARTA RAQAMI</div>' +
        '<div class="num">' + esc(r.karta || '') + '</div>' +
        '<div class="lb">KARTA EGASI</div>' +
        '<div class="own">' + esc(r.egasi || '') + '</div>' +
      '</div>' +
      '<div style="text-align:center;font-size:32px;font-weight:300;margin-bottom:4px;">' +
        fmt(r.narx) + '</div>' +
      '<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:20px;">som</div>' +
      '<div class="pay-warn">Tolovni amalga oshirgach, chek skrinshotini adminga yuboring. ' +
      'Tasdiqlangach reklama darhol ishga tushadi.</div>' +
      '<button class="btn" id="tlCopy" style="background:#262626;margin-bottom:10px;">' +
        'Karta raqamini nusxalash</button>' +
      '<button class="btn" id="tlAdmin">Adminga chek yuborish</button>' +
    '</div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#tlS').addEventListener('click', function(e){ e.stopPropagation(); });

  bg.querySelector('#tlCopy').addEventListener('click', function(){
    if(navigator.clipboard) navigator.clipboard.writeText((r.karta || '').replace(/\s/g, ''));
    toast('Nusxalandi');
    haptic('light');
  });

  bg.querySelector('#tlAdmin').addEventListener('click', function(){
    const u = r.admin || 'https://t.me/Ijara_admin_namangan';
    if(TG && TG.openTelegramLink) TG.openTelegramLink(u);
    else window.open(u, '_blank');
  });
}



// Lentadagi videoga bosilsa - to'liq ekran + ovoz
document.addEventListener('click', function(e){
  const v = e.target;
  if(!v || v.tagName !== 'VIDEO') return;
  if(!v.hasAttribute('data-vid')) return;

  e.preventDefault();
  e.stopPropagation();

  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9800;background:#000;' +
    'display:flex;align-items:center;justify-content:center;';

  ov.innerHTML =
    '<video src="' + v.src + '" controls autoplay playsinline ' +
    'style="max-width:100%;max-height:100%;"></video>' +
    '<button style="position:absolute;top:calc(14px + env(safe-area-inset-top));' +
    'right:16px;width:38px;height:38px;border-radius:50%;border:none;' +
    'background:rgba(0,0,0,.6);color:#fff;font-size:22px;cursor:pointer;z-index:5;">&times;</button>';

  document.body.appendChild(ov);

  ov.querySelector('button').addEventListener('click', function(){ ov.remove(); });
  ov.addEventListener('click', function(ev){ if(ev.target === ov) ov.remove(); });
}, true);
