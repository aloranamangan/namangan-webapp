const API = 'https://namangan-ijara-bot.onrender.com';
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

function goLogin(){
  location.href = 'https://namangan-ijara-bot.onrender.com/login';
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

function mediaUrl(id){ return API + '/media/' + id; }

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
      if(f.size > 20 * 1024 * 1024){ done++; check(); return; }
      const isVid = f.type.indexOf('video') === 0;
      const r = new FileReader();
      r.onload = function(){
        if(isVid){
          out.push({ media: r.result, is_video: true });
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
    '<h2>' + (isBlock ? 'Vaqtincha bloklandingiz' : 'Vaqtincha toxtatildingiz') + '</h2>' +
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
    '<h2>' + (isBlock ? 'Vaqtincha bloklandingiz' : 'Vaqtincha toxtatildingiz') + '</h2>' +
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
  checkSession(function(ok){
    if(ok){ cb(); return; }
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;padding:40px 28px;text-align:center;">' +
      '<div style="font-size:60px;margin-bottom:20px;">&#127968;</div>' +
      '<h2 style="font-size:24px;font-weight:800;margin-bottom:10px;">Namangan Ijara</h2>' +
      '<p style="font-size:14px;color:#8E8E8E;line-height:1.6;margin-bottom:32px;">' +
      'Davom etish uchun Telegram akkauntingiz bilan kiring</p>' +
      '<button id="loginBtn" style="padding:15px 34px;border:none;border-radius:100px;' +
      'background:#0095F6;color:#fff;font-size:15px;font-weight:800;cursor:pointer;">' +
      'Telegram bilan kirish</button></div>';
    const b = document.getElementById('loginBtn');
    if(b) b.addEventListener('click', goLogin);
  });
}

// ---------- APK: rol tanlash ----------
function askRole(cb){
  if(!isApk()){ cb(); return; }

  const id = myId();
  if(!id){ showRolePick(cb); return; }

  // Rolni serverdan olamiz (bot bilan bir xil bo'lishi uchun)
  api('/api/user?tg_id=' + id).then(function(d){
    const role = (d && d.ok && d.role) ? d.role : null;

    if(myId() === 7894423610){
      let last = null;
      try { last = localStorage.getItem('ni_admin_panel'); } catch(e){}
      const cur = location.pathname.split('/').pop();
      if(last){
        if(last !== cur){ location.href = last; return; }
        cb(); return;
      }
      showAdminPanels(cb);
      return;
    }

    if(role === 'makler'){
      if(location.pathname.indexOf('sotuvchi') === -1){ location.href = 'sotuvchi.html'; return; }
      cb(); return;
    }
    if(role === 'xaridor'){
      if(location.pathname.indexOf('xaridor') === -1){ location.href = 'xaridor.html'; return; }
      cb(); return;
    }
    showRolePick(cb);
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
    pick('makler', function(){ location.href = 'sotuvchi.html'; });
  });
  document.getElementById('rXar').addEventListener('click', function(){
    pick('xaridor', function(){ ov.remove(); cb(); });
  });
}

// ---------- Admin panellari (APK) ----------
const ADMIN_ID_APP = 7894423610;

function showAdminPanels(cb, force){
  const id = myId();
  if(id !== ADMIN_ID_APP){ if(cb) cb(); return; }

  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9400;background:#000;color:#fff;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    "padding:36px 26px;text-align:center;font-family:'Manrope',sans-serif;";

  const P = [
    ['sotuvchi.html', '🏠', 'Sotuvchi paneli', "E'lon joylash, kabinet"],
    ['xaridor.html', '👥', 'Xaridor paneli', "E'lonlarni ko'rish"],
    ['admin.html', '📊', 'Nazorat paneli', 'Foydalanuvchilar boshqaruvi'],
    ['zaxira.html', '🧩', 'Zaxira panel', "Bo'sh"]
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
      try { localStorage.setItem('ni_admin_panel', u); } catch(e){}
      const cur = location.pathname.split('/').pop();
      if(u === cur){ ov.remove(); if(cb) cb(); }
      else location.href = u;
    });
  });
}
