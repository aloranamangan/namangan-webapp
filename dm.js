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
            ? '<video src="' + u + '" playsinline muted data-full="' + u + '" data-v="1"></video>'
            : '<img src="' + u + '" data-full="' + u + '" data-v="0">';
        }
        if(m.text) inner += esc(m.text);
        return '<div class="msg ' + (mine ? 'me' : 'you') + '">' + inner + '</div>';
      }).join('');
      box.querySelectorAll('[data-full]').forEach(function(m){
        m.style.cursor = 'pointer';
        m.addEventListener('click', function(){
          openViewer(m.dataset.full, m.dataset.v === '1');
        });
      });
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

// ---------- Yuborish oynasi (Instagram uslubi) ----------
function openShare(post){
  const id = myId();
  if(!id){ toast('Telegram ilovasida oching'); return; }

  const first = (post.media && post.media[0]) ? post.media[0] : null;
  const fileId = first ? first.url.split('/media/')[1] : null;
  const isVid = first ? !!first.video : false;

  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="shSheet" style="max-height:92vh;height:92vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="share-acts">' +
      '<button class="share-act" id="shStory"><span class="ic">&#10133;</span>Storiyga</button>' +
      '<button class="share-act" id="shDl"><span class="ic">&#11015;&#65039;</span>Yuklab olish</button>' +
      '<button class="share-act" id="shTg"><span class="ic">&#9992;&#65039;</span>Telegram</button>' +
      '<button class="share-act" id="shCopy"><span class="ic">&#128279;</span>Havola</button>' +
    '</div>' +
    '<div class="share-list" id="shList"><div class="load">Yuklanmoqda...</div></div>' +
    '<div class="share-send" id="shBar" style="display:none;">' +
      '<button class="btn" id="shSend">Yuborish</button></div>' +
    '</div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  el('shSheet').addEventListener('click', function(e){ e.stopPropagation(); });

  const chosen = {};

  // Storiyga qo'yish
  el('shStory').addEventListener('click', function(){
    if(!fileId){ toast('Media topilmadi'); return; }
    apiPost('/api/story-qoshish', { file_id: fileId, is_video: isVid })
      .then(function(d){
        if(d.ok){ haptic('medium'); toast('Storiyga qoshildi'); bg.remove(); }
        else toast('Xato yuz berdi');
      }).catch(function(){ toast('Server xatosi'); });
  });

  // Yuklab olish
  el('shDl').addEventListener('click', function(){
    if(!first){ toast('Media topilmadi'); return; }
    const a = document.createElement('a');
    a.href = first.url;
    a.download = isVid ? 'namangan-ijara.mp4' : 'namangan-ijara.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Yuklanmoqda...');
  });

  // Telegramga ulashish
  el('shTg').addEventListener('click', function(){
    const txt = [post.desc, post.price ? 'Narx: ' + post.price : '', '@' + post.username]
      .filter(Boolean).join('\n');
    const u = 'https://t.me/share/url?url=' + encodeURIComponent('https://t.me/Ijaraga_uybot') +
              '&text=' + encodeURIComponent(txt);
    if(TG && TG.openTelegramLink) TG.openTelegramLink(u); else window.open(u, '_blank');
  });

  // Havola nusxalash
  el('shCopy').addEventListener('click', function(){
    const link = 'https://t.me/Ijaraga_uybot';
    if(navigator.clipboard) navigator.clipboard.writeText(link);
    toast('Havola nusxalandi');
  });

  // Foydalanuvchilar ro'yxati
  Promise.all([
    api('/api/chatlar?me=' + id).catch(function(){ return { chats: [] }; }),
    api('/api/maklerlar').catch(function(){ return { maklers: [] }; })
  ]).then(function(r){
    const seen = {};
    const list = [];

    (r[0].chats || []).forEach(function(c){
      if(seen[c.user_id]) return;
      seen[c.user_id] = 1;
      list.push({ id: c.user_id, name: c.name, sub: c.online ? 'Onlayn' : '' });
    });

    (r[1].maklers || []).forEach(function(m){
      if(!m.tg_id || seen[m.tg_id]) return;
      seen[m.tg_id] = 1;
      list.push({ id: m.tg_id, name: m.name, sub: '@' + m.username });
    });

    const box = el('shList');
    if(!box) return;
    if(!list.length){
      box.innerHTML = '<div class="empty" style="padding:44px 16px;">' +
        '<span>Yuboriladigan odam yoq</span></div>';
      return;
    }

    box.innerHTML = list.map(function(u){
      return '<div class="share-row" data-u="' + u.id + '">' +
        '<img src="https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(u.name) + '">' +
        '<div class="si"><b>' + esc(u.name) + '</b><span>' + esc(u.sub) + '</span></div>' +
        '<div class="share-chk"></div></div>';
    }).join('');

    box.querySelectorAll('.share-row').forEach(function(row){
      row.addEventListener('click', function(){
        const uid = row.dataset.u;
        const chk = row.querySelector('.share-chk');
        if(chosen[uid]){
          delete chosen[uid];
          chk.classList.remove('on');
          chk.innerHTML = '';
        } else {
          chosen[uid] = 1;
          chk.classList.add('on');
          chk.innerHTML = '&#10003;';
        }
        const n = Object.keys(chosen).length;
        el('shBar').style.display = n ? 'block' : 'none';
        el('shSend').textContent = n > 1 ? ('Yuborish (' + n + ')') : 'Yuborish';
      });
    });
  });

  el('shSend').addEventListener('click', function(){
    const ids = Object.keys(chosen);
    if(!ids.length || !fileId) return;

    const b = el('shSend');
    b.disabled = true;
    b.textContent = 'Yuborilmoqda...';

    const txt = [post.price ? 'Narx: ' + post.price : '', post.desc].filter(Boolean).join('\n');

    apiPost('/api/post-yuborish', {
      to_ids: ids, file_id: fileId, is_video: isVid, text: txt
    }).then(function(d){
      if(d.ok){ haptic('medium'); toast('Yuborildi'); bg.remove(); }
      else { toast('Xato yuz berdi'); b.disabled = false; b.textContent = 'Yuborish'; }
    }).catch(function(){
      toast('Server xatosi'); b.disabled = false; b.textContent = 'Yuborish';
    });
  });
}

// ---------- To'liq ekran ko'rish ----------
function openViewer(url, isVideo){
  const v = document.createElement('div');
  v.className = 'viewer';
  v.innerHTML =
    '<button class="viewer-close">&times;</button>' +
    (isVideo
      ? '<video src="' + url + '" controls autoplay playsinline></video>'
      : '<img src="' + url + '">') +
    '<button class="viewer-dl">&#11015;&#65039; Yuklab olish</button>';

  document.body.appendChild(v);

  v.querySelector('.viewer-close').addEventListener('click', function(){ v.remove(); });
  v.addEventListener('click', function(e){ if(e.target === v) v.remove(); });

  v.querySelector('.viewer-dl').addEventListener('click', function(e){
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = url;
    a.download = isVideo ? 'video.mp4' : 'rasm.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Yuklanmoqda...');
  });
}
