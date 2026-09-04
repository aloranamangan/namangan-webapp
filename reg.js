// ---------- Ro'yxatdan o'tish (raqam + Instagram + WhatsApp) ----------
let USER = null;

function checkUser(cb){
  const id = myId();
  if(!id){ cb(null); return; }
  api('/api/user?tg_id=' + id)
    .then(function(d){
      USER = (d.ok && d.exists) ? d : null;
      cb(USER);
    })
    .catch(function(){ cb(null); });
}

function needReg(){
  return !USER || !USER.complete;
}

function showReg(role, onDone){
  const has = USER && USER.phone;

  el('root').innerHTML =
    '<div class="wrap">' +
      '<div class="empty" style="padding:24px 0 26px;">' +
        '<div class="ic">' + (role === 'makler' ? '&#127968;' : '&#128100;') + '</div>' +
        '<p>Ro\'yxatdan o\'tish</p>' +
        '<span>Davom etish uchun ma\'lumotlaringizni to\'ldiring</span>' +
      '</div>' +

      '<label class="label">Telefon raqam</label>' +
      (has
        ? '<div class="inp" style="color:#2ECC71;">&#10003; ' + esc(USER.phone) + '</div>'
        : '<button class="btn ghost" id="phBtn" style="margin-bottom:18px;">&#128241; Raqamni ulashish</button>') +

      '<label class="label">Instagram</label>' +
      '<input class="inp" id="rIg" placeholder="@username" value="' + esc(USER ? USER.instagram : '') + '">' +

      '<label class="label">WhatsApp raqam</label>' +
      '<input class="inp" id="rWa" type="tel" placeholder="+998901234567" value="' + esc(USER ? USER.whatsapp : '') + '">' +

      '<button class="btn" id="rSave">Saqlash va davom etish</button>' +
    '</div>';

  const pb = el('phBtn');
  if(pb) pb.addEventListener('click', askPhone);

  el('rSave').addEventListener('click', function(){
    if(!USER || !USER.phone){ toast('Avval raqamingizni ulashing'); return; }

    const ig = el('rIg').value.trim();
    const wa = el('rWa').value.trim();

    if(ig.length < 2){ toast('Instagram username kiriting'); return; }
    if(!/^\+?998\d{9}$/.test(wa.replace(/[\s\-()]/g, ''))){ toast('WhatsApp: +998901234567'); return; }

    const b = el('rSave');
    b.disabled = true;
    b.textContent = 'Saqlanmoqda...';

    apiPost('/api/user-saqlash', { instagram: ig, whatsapp: wa, role: role })
      .then(function(d){
        if(d.ok){
          haptic('medium');
          USER.instagram = ig;
          USER.whatsapp = wa;
          USER.complete = true;
          onDone();
        } else {
          toast('Xato: ' + (d.error || 'server'));
          b.disabled = false;
          b.textContent = 'Saqlash va davom etish';
        }
      })
      .catch(function(){
        toast('Server xatosi');
        b.disabled = false;
        b.textContent = 'Saqlash va davom etish';
      });
  });

  function askPhone(){
    if(!TG || !TG.requestContact){
      var p = prompt('Telefon raqamingiz (davlat kodi bilan):', '+998');
      if(!p) return;
      p = String(p).trim();
      if(p.replace(/[^0-9]/g, '').length < 7){ toast('Raqam juda qisqa'); return; }
      toast('Saqlanmoqda...');
      var _b = { phone: p };
      try {
        var _u = localStorage.getItem('ni_uid');
        if(_u) _b.tg_id = parseInt(_u);
      } catch(e){}
      apiPost('/api/user-saqlash', _b)
        .then(function(d){
          if(d && d.ok){ haptic('medium'); showReg(role, onDone); }
          else toast('Saqlanmadi');
        })
        .catch(function(){ toast('Server xatosi'); });
      return;
    }
    TG.requestContact(function(ok, res){
      // Telegram raqamni to'g'ridan bergan bo'lsa - darhol saqlaymiz
      try {
        var ph = res && res.responseUnsafe && res.responseUnsafe.contact
                 && res.responseUnsafe.contact.phone_number;
        if(ph){
          toast('Saqlanmoqda...');
          var _bb = { phone: ph };
          try {
            var _uu = localStorage.getItem('ni_uid');
            if(_uu) _bb.tg_id = parseInt(_uu);
          } catch(e){}
          apiPost('/api/user-saqlash', _bb).then(function(d){
            if(d && d.ok){ haptic('medium'); showReg(role, onDone); }
            else toast('Saqlanmadi');
          }).catch(function(){ toast('Server xatosi'); });
          return;
        }
      } catch(e){}

      if(!ok){ toast('Raqam ulashilmadi'); return; }
      toast('Tekshirilmoqda...');
      let n = 0;
      const t = setInterval(function(){
        n++;
        checkUser(function(u){
          if(u && u.phone){
            clearInterval(t);
            haptic('medium');
            showReg(role, onDone);
          } else if(n > 10){
            clearInterval(t);
            toast('Raqam kelmadi, qayta urinib ko\'ring');
          }
        });
      }, 1200);
    });
  }
}
