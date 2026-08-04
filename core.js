const API = 'https://namangan-ijara-bot.onrender.com';
const TG = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

function tgReady(){
  if(TG){ try { TG.ready(); TG.expand(); } catch(e){} }
}

function myId(){
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
