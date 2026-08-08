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
