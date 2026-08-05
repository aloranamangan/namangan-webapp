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
  bg.innerHTML = '<div class="sheet" id="clSheet" style="max-height:94vh;height:94vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="dm-top"><h2>Xabarlar</h2><button id="clClose">&times;</button></div>' +
    '<div class="dm-notes" id="clNotes"></div>' +
    '<div class="dm-tabs" id="clTabs"></div>' +
    '<div id="clBody"><div class="load">Yuklanmoqda...</div></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  el('clSheet').addEventListener('click', function(e){ e.stopPropagation(); });
  el('clClose').addEventListener('click', function(){ bg.remove(); });

  let all = [];
  let mode = 'all';

  api('/api/chatlar?me=' + id).then(function(d){
    all = d.chats || [];
    drawNotes();
    drawTabs();
    drawList();
  }).catch(function(){
    const b = el('clBody');
    if(b) b.innerHTML = '<div class="empty" style="padding:44px 10px;"><span>Xato yuz berdi</span></div>';
  });

  function drawNotes(){
    const box = el('clNotes');
    if(!box) return;
    const onl = all.filter(function(c){ return c.online; }).slice(0, 12);
    if(!onl.length){ box.style.display = 'none'; return; }
    box.style.display = 'flex';
    box.innerHTML = onl.map(function(c){
      return '<button class="dm-note" data-u="' + c.user_id + '" data-n="' + esc(c.name) + '">' +
        '<div class="dm-note-ava"><img src="https://api.dicebear.com/7.x/initials/svg?seed=' +
        encodeURIComponent(c.name) + '"><span class="onl"></span></div>' +
        '<span>' + esc(c.name) + '</span></button>';
    }).join('');
    box.querySelectorAll('.dm-note').forEach(function(b){
      b.addEventListener('click', function(){
        bg.remove();
        openChat(parseInt(b.dataset.u), b.dataset.n);
      });
    });
  }

  function drawTabs(){
    const box = el('clTabs');
    if(!box) return;
    const unread = all.filter(function(c){ return !c.seen; }).length;
    box.innerHTML =
      '<button class="dm-tab' + (mode === 'all' ? ' on' : '') + '" data-m="all">' +
        '<span class="bl"></span>Hammasi <span class="num">' + all.length + '</span></button>' +
      '<button class="dm-tab' + (mode === 'unread' ? ' on' : '') + '" data-m="unread">' +
        '<span class="bl"></span>Oqilmagan <span class="num">' + unread + '</span></button>' +
      '<button class="dm-tab' + (mode === 'online' ? ' on' : '') + '" data-m="online">' +
        'Onlayn <span class="num">' + all.filter(function(c){ return c.online; }).length + '</span></button>';

    box.querySelectorAll('.dm-tab').forEach(function(t){
      t.addEventListener('click', function(){
        mode = t.dataset.m;
        drawTabs();
        drawList();
      });
    });
  }

  function drawList(){
    const box = el('clBody');
    if(!box) return;

    let list = all;
    if(mode === 'unread') list = all.filter(function(c){ return !c.seen; });
    else if(mode === 'online') list = all.filter(function(c){ return c.online; });

    if(!list.length){
      box.innerHTML = '<div class="empty" style="padding:50px 16px;">' +
        '<div class="ic">&#128172;</div><p>Xabarlar yoq</p>' +
        '<span>Sotuvchi profilidan yozishingiz mumkin</span></div>';
      return;
    }

    box.innerHTML = list.map(function(c){
      const onl = c.online ? '<span class="onl"></span>' : '';
      const sub = c.online ? 'Hozir onlayn' : esc(c.last);
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
  }
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
