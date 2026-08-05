// ---------- Xabarlar (Direct) ----------
let dmTimer = null;

function dmUnreadCheck(btnId){
  const id = myId();
  if(!id) return;
  api('/api/chatlar?me=' + id).then(function(d){
    const b = el(btnId);
    if(!b) return;
    let dot = b.querySelector('.dot-n');
    const n = d.unread || 0;
    if(n > 0){
      if(!dot){
        dot = document.createElement('span');
        dot.className = 'dot-n';
        b.appendChild(dot);
      }
      dot.style.display = 'flex';
      dot.textContent = n > 99 ? '99+' : n;
    } else if(dot){
      dot.style.display = 'none';
    }
  }).catch(function(){});
}

function openChats(){
  const id = myId();
  if(!id){ toast('Telegram ilovasida oching'); return; }

  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="clSheet" style="max-height:88vh;">' +
    '<div class="sheet-bar"></div><div class="sheet-title">Xabarlar</div>' +
    '<div id="clBody"><div class="load">Yuklanmoqda...</div></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  el('clSheet').addEventListener('click', function(e){ e.stopPropagation(); });

  api('/api/chatlar?me=' + id).then(function(d){
    const box = el('clBody');
    if(!box) return;
    const list = d.chats || [];
    if(!list.length){
      box.innerHTML = '<div class="empty" style="padding:50px 16px;">' +
        '<div class="ic">&#128172;</div><p>Xabarlar yoq</p>' +
        '<span>Sotuvchi profilidan yozishingiz mumkin</span></div>';
      return;
    }
    box.innerHTML = list.map(function(c){
      const onl = c.online ? '<span class="onl"></span>' : '';
      const sub = c.online ? 'Onlayn' : esc(c.last);
      return '<div class="chat-row' + (c.seen ? '' : ' unread') + '" data-u="' + c.user_id + '" data-n="' + esc(c.name) + '">' +
        '<div class="chat-ava"><img src="https://api.dicebear.com/7.x/initials/svg?seed=' +
          encodeURIComponent(c.name) + '">' + onl + '</div>' +
        '<div class="ci"><b>' + esc(c.name) + '</b><span>' + sub + '</span></div>' +
        (c.seen ? '' : '<div class="nd"></div>') + '</div>';
    }).join('');

    box.querySelectorAll('.chat-row').forEach(function(r){
      r.addEventListener('click', function(){
        bg.remove();
        openChat(parseInt(r.dataset.u), r.dataset.n);
      });
    });
  }).catch(function(){});
}

function openChat(otherId, otherName){
  const me = myId();
  if(!me) return;

  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="chSheet" style="max-height:94vh;height:94vh;display:flex;flex-direction:column;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="sheet-title">' + esc(otherName || 'Chat') + '</div>' +
    '<div class="msgs" id="chBody" style="flex:1;overflow-y:auto;padding-bottom:16px;">' +
      '<div class="load">Yuklanmoqda...</div></div>' +
    '<div class="msg-bar" style="position:relative;">' +
      '<button class="clip" id="chClip">&#128206;</button>' +
      '<input id="chInp" placeholder="Xabar yozing...">' +
      '<button id="chSend">Yuborish</button>' +
    '</div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg){ clearInterval(dmTimer); bg.remove(); } });
  el('chSheet').addEventListener('click', function(e){ e.stopPropagation(); });

  let pending = null;

  function load(){
    api('/api/chat?me=' + me + '&other=' + otherId).then(function(d){
      const box = el('chBody');
      if(!box) return;
      const list = d.messages || [];
      if(!list.length){
        box.innerHTML = '<div class="empty" style="padding:40px 10px;"><span>Hali xabar yoq</span></div>';
        return;
      }
      box.innerHTML = list.map(function(m){
        const mine = m.from_id === me;
        let inner = '';
        if(m.file_id){
          const u = mediaUrl(m.file_id);
          inner += m.is_video
            ? '<video src="' + u + '" controls playsinline></video>'
            : '<img src="' + u + '">';
        }
        if(m.text) inner += esc(m.text);
        return '<div class="msg ' + (mine ? 'me' : 'you') + '">' + inner + '</div>';
      }).join('');
      box.scrollTop = box.scrollHeight;
    }).catch(function(){});
  }

  load();
  clearInterval(dmTimer);
  dmTimer = setInterval(load, 6000);

  el('chClip').addEventListener('click', function(){
    pickFiles(false, function(items){
      if(!items.length) return;
      pending = items[0];
      toast('Fayl tanlandi, endi yuboring');
    });
  });

  function send(){
    const inp = el('chInp');
    const t = inp.value.trim();
    if(!t && !pending) return;

    const body = { to_id: otherId, text: t };
    if(pending){ body.media = pending.media; body.is_video = pending.is_video; }

    inp.value = '';
    pending = null;

    apiPost('/api/xabar', body).then(function(d){
      if(d.ok){ load(); haptic('light'); }
      else toast('Yuborilmadi');
    }).catch(function(){ toast('Server xatosi'); });
  }

  el('chSend').addEventListener('click', send);
  el('chInp').addEventListener('keypress', function(e){ if(e.key === 'Enter') send(); });
}


// Onlayn signali
function pingOnline(){
  if(myId()) apiPost('/api/onlayn', {}).catch(function(){});
}
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(pingOnline, 1500);
  setInterval(pingOnline, 30000);
});
