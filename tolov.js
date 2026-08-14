// ---------- To'lov tizimi ----------
let PAY = null;

function checkPayment(cb){
  const id = myId();
  if(!id){ cb(true); return; }

  api('/api/tolov-holat?tg_id=' + id).then(function(d){
    PAY = d;
    if(!d.blocked){ cb(true); return; }
    showPayBlock(d);
  }).catch(function(){ cb(true); });
}

function showPayBlock(d){
  document.body.innerHTML = '';

  const s = document.createElement('div');
  s.className = 'pay-block';
  s.innerHTML =
    '<div class="pay-circle"><span>&#128179;</span></div>' +
    '<h2>Siz tolov qilmaganingiz uchun<br>bloklandingiz</h2>' +
    '<p>Xizmatdan foydalanishni davom ettirish uchun<br>tolovni amalga oshiring</p>' +
    '<button class="pay-btn" id="payGo">Tolov qilish</button>';

  document.body.appendChild(s);
  document.getElementById('payGo').addEventListener('click', function(){ openPay(d); });
}

function openPay(d){
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.style.zIndex = '9400';
  bg.innerHTML = '<div class="sheet" id="pyS" style="max-height:92vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="sheet-title">Tolov</div>' +
    '<div class="wrap">' +
      '<div style="text-align:center;">' +
        '<div class="pay-timer" id="pyT">15:00</div>' +
        '<div class="pay-timer-lb">tolov uchun vaqt</div>' +
      '</div>' +
      '<div class="pay-card">' +
        '<div class="lb">KARTA RAQAMI</div>' +
        '<div class="num" id="pyNum">' + esc(d.card || '') + '</div>' +
        '<div class="lb">KARTA EGASI</div>' +
        '<div class="own">' + esc(d.owner || '') + '</div>' +
      '</div>' +
      '<div style="text-align:center;font-size:30px;font-weight:300;margin-bottom:6px;">' +
        fmt(d.amount || 200000) + '</div>' +
      '<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:20px;">som</div>' +
      '<div class="pay-warn">' +
        '&#9888;&#65039; Tolovni amalga oshirgach, <b>15 daqiqa ichida</b> ' +
        'chek skrinshotini adminga yuboring. Aks holda tolov tasdiqlanmaydi.' +
      '</div>' +
      '<button class="btn" id="pyCopy" style="background:#262626;margin-bottom:10px;">' +
        'Karta raqamini nusxalash</button>' +
      '<button class="btn" id="pyAdmin">Adminga skrinshot yuborish</button>' +
    '</div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  document.getElementById('pyS').addEventListener('click', function(e){ e.stopPropagation(); });

  // Serverga xabar
  apiPost('/api/tolov-amal', { action: 'start' }).catch(function(){});

  // Taymer
  let left = 15 * 60;
  const tEl = document.getElementById('pyT');
  const tick = setInterval(function(){
    left--;
    if(left <= 0){
      clearInterval(tick);
      tEl.textContent = '00:00';
      tEl.style.color = '#ED4956';
      return;
    }
    const m = Math.floor(left / 60);
    const s = left % 60;
    tEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    if(left < 180) tEl.style.color = '#ED4956';
  }, 1000);

  document.getElementById('pyCopy').addEventListener('click', function(){
    if(navigator.clipboard) navigator.clipboard.writeText((d.card || '').replace(/\s/g, ''));
    toast('Karta raqami nusxalandi');
    haptic('light');
  });

  document.getElementById('pyAdmin').addEventListener('click', function(){
    const u = d.admin_link || 'https://t.me/Ijara_admin_namangan';
    if(TG && TG.openTelegramLink) TG.openTelegramLink(u);
    else window.open(u, '_blank');
  });
}
