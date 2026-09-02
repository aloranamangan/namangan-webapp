// ---------- Profil (Instagram uslubi) ----------
let PF = null, PF_TAB = 'posts', PF_POSTS = [], MY_STORIES = [];

function drawProfile(){
  const box = el('profBody');
  if(!box) return;

  const id = myId();
  if(!id){ box.innerHTML = '<div class="load">Telegram orqali kiring</div>'; return; }

  api('/api/profil?tg_id=' + id).then(function(d){
    PF = d.ok ? d : { type: 'user', name: (USER && USER.name) || 'Foydalanuvchi' };
    render();
  }).catch(function(){
    PF = { type: 'user', name: (USER && USER.name) || 'Foydalanuvchi' };
    render();
  });
}

function render(){
  const box = el('profBody');
  const d = PF;
  const isMak = d.type === 'makler';

  const ava = d.avatar
    ? mediaUrl(d.avatar)
    : 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(d.name || 'U');

  const vb = d.verified
    ? '<svg style="width:15px;height:15px;" viewBox="0 0 24 24" fill="#0095F6">' +
      '<path d="M12 1l2.5 2.2 3.3-.4 1 3.2 3 1.5-1.2 3.1 1.2 3.1-3 1.5-1 3.2-3.3-.4L12 23l-2.5-2.2-3.3.4-1-3.2-3-1.5 1.2-3.1L2.2 10l3-1.5 1-3.2 3.3.4z"/>' +
      '<path d="M10.5 15.2l-3-3 1.2-1.2 1.8 1.8 4.3-4.3 1.2 1.2z" fill="#000"/></svg>'
    : '';

  const vip = d.vip ? '<span class="vip-badge">\uD83D\uDC51 VIP</span>' : '';

  const hasStory = MY_STORIES.length > 0;
  const allSeen = hasStory && MY_STORIES.every(function(s){
    return typeof isStorySeen === 'function' && isStorySeen(s.id);
  });

  box.innerHTML =
    '<div class="pf-top">' +
      '<div class="pf-ava-w' + (hasStory ? ' story' : '') + (allSeen ? ' seen' : '') + '">' +
        '<img class="pf-ava" id="pfAva" src="' + ava + '">' +
        '<button class="pf-add" id="pfAdd">+</button>' +
      '</div>' +
      '<div class="pf-nums">' +
        '<div><b>' + fmt(isMak ? (d.posts || 0) : 0) + '</b><span>elon</span></div>' +
        '<div id="pfFollowers"><b>' + fmt(isMak ? (d.followers || 0) : 0) + '</b><span>obunachi</span></div>' +
        '<div><b>' + fmt(d.views || 0) + '</b><span>korish</span></div>' +
      '</div>' +
    '</div>' +

    '<div class="pf-bio">' +
      '<div class="nm">' + esc(d.name || 'Ismingiz') + vb + vip + '</div>' +
      (isMak ? '<div class="un">@' + esc(d.username || '') + '</div>' : '') +
      '<div id="pfXn"></div>' +
      (d.bio ? '<div class="tx">' + esc(d.bio) + '</div>' : '') +
    '</div>' +

    '<div class="pf-btns">' +
      '<button id="pfEdit">Profilni tahrirlash</button>' +
      '<button id="pfNew" class="blue">Elon qoshish</button>' +
      '<button id="pfShare">Ulashish</button>' +
    '</div>' +

    '<div class="hl-row" id="pfHl"></div>' +

    '<div class="pf-tabs">' +
      '<button class="pf-tab on" data-tb="posts">' +
        '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>' +
        '<rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>' +
      '<button class="pf-tab" data-tb="saved">' +
        '<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>' +
      '<button class="pf-tab" data-tb="tagged">' +
        '<svg viewBox="0 0 24 24"><path d="M20.6 8.7l-8-8A2 2 0 0 0 11.2 0H2a2 2 0 0 0-2 2v9.2c0 .5.2 1 .6 1.4l8 8a2 2 0 0 0 2.8 0l9.2-9.2a2 2 0 0 0 0-2.7z" transform="translate(1.5 1.5) scale(.92)"/>' +
        '<circle cx="7" cy="7" r="1.5"/></svg></button>' +
    '</div>' +

    '<div id="pfGrid"><div class="load">Yuklanmoqda...</div></div>' +

    '<div class="pm-list">' +
      '<div class="pm" data-go="wallet" style="border-color:rgba(255,213,79,.4);' +
      'background:linear-gradient(135deg,rgba(255,213,79,.1),rgba(184,134,11,.04));">' +
      '<span class="e">\u{1F4B0}</span>' +
      '<span class="t">UYcoin Wallet</span>' +
      '<span class="v" id="pfCoin">\u2014</span>' +
      '<span class="ar">&rsaquo;</span></div>' +
    '</div>' +

    ((typeof IS_ADMIN !== 'undefined' && IS_ADMIN)
      ? '<div class="pm-list">' +
          '<div class="pm" data-go="panel" style="border-color:rgba(0,149,246,.4);">' +
          '<span class="e">&#9881;&#65039;</span><span class="t">Boshqaruv markazi</span>' +
          '<span class="ar">&rsaquo;</span></div>' +
        '</div>'
      : '');

  bindProfile(isMak);
  loadTab('posts');
  if(isMak) loadXn();
  loadHl();
}

function bindProfile(isMak){
  const av = el('pfAva');
  if(av) av.addEventListener('click', function(){
    // Story bo'lsa - story ochiladi
    if(MY_STORIES && MY_STORIES.length && typeof openStory === 'function'){
      openStory({ id: myId(), name: (PF && PF.name) || '', items: MY_STORIES }, 0);
      return;
    }
    if(typeof avatarMenuU === 'function') avatarMenuU();
  });

  const ad = el('pfAdd');
  if(ad) ad.addEventListener('click', function(){
    if(typeof avatarMenuU === 'function') avatarMenuU();
  });

  const ed = el('pfEdit');
  if(ed) ed.addEventListener('click', editProfileU);

  const nw = el('pfNew');
  if(nw) nw.addEventListener('click', function(){
    haptic('light');
    if(typeof openUploadU === 'function') openUploadU();
    else toast('Elon qoshish tayyorlanmoqda');
  });



  const sh = el('pfShare');
  if(sh) sh.addEventListener('click', function(){
    const u = 'https://t.me/Ijaraga_uybot';
    const txt = (PF.name || '') + ' UYgram\'da';
    const url = 'https://t.me/share/url?url=' + encodeURIComponent(u) +
      '&text=' + encodeURIComponent(txt);
    if(TG && TG.openTelegramLink) TG.openTelegramLink(url); else window.open(url, '_blank');
  });

  const fw = el('pfFollowers');
  if(fw && isMak) fw.addEventListener('click', function(){
    if(typeof showFollowersU === 'function') showFollowersU();
  });

  document.querySelectorAll('.pf-tab').forEach(function(tb){
    tb.addEventListener('click', function(){
      document.querySelectorAll('.pf-tab').forEach(function(x){ x.classList.remove('on'); });
      tb.classList.add('on');
      haptic('light');
      loadTab(tb.dataset.tb);
    });
  });

  const pc = el('pfCoin');
  if(pc && myId()){
    api('/api/wallet?tg_id=' + myId()).then(function(w){
      if(w.ok) pc.textContent = (w.coin || 0).toFixed(2) + ' UYcoin';
    }).catch(function(er){ if(typeof upProgYop==="function") upProgYop(); alert("VIDEO XATO: " + (er && er.message ? er.message : er)); });
  }

  document.querySelectorAll('.pm[data-go]').forEach(function(m){
    m.addEventListener('click', function(){
      const g = m.dataset.go;
      haptic('light');
      if(g === 'lang'){ if(typeof openLangPicker === 'function') openLangPicker(); return; }
      if(g === 'panel'){ location.href = 'zaxira.html'; return; }
      location.href = g + '.html';
    });
  });
}

function loadTab(tab){
  PF_TAB = tab;
  const g = el('pfGrid');
  if(!g) return;
  g.innerHTML = '<div class="load">Yuklanmoqda...</div>';

  const id = myId();
  let url;
  if(tab === 'saved') url = '/api/saqlangan?tg_id=' + id;
  else if(tab === 'tagged') url = '/api/belgilangan?tg_id=' + id;
  else url = '/api/postlar?username=' + encodeURIComponent(PF.username || '');

  if(tab === 'posts' && !PF.username){
    url = '/api/postlar?username=user' + id;
  }

  api(url).then(function(d){
    const list = d.posts || [];
    if(!list.length){
      g.innerHTML = tab === 'saved'
        ? emptyBox('&#128278;', 'Saqlangan yoq', 'Yoqqan elonlarni saqlang')
        : (tab === 'tagged'
          ? emptyBox('&#127991;', 'Belgilangan yoq', 'Sizni belgilagan elonlar shu yerda')
          : emptyBox('&#128247;', 'Elon yoq', 'Birinchi elonni joylang'));
      return;
    }

    g.innerHTML = '<div class="grid">' + list.map(function(p){
      const m = (p.media && p.media[0]) ? p.media[0] : { file_id: p.file_id, is_video: p.is_video };
      if(!m.file_id) return '';
      const u = mediaUrl(m.file_id);
      return '<div class="cell" data-id="' + p.id + '">' +
        (m.is_video ? '<video src="' + u + '" muted preload="none"></video>' : '<img src="' + u + '">') +
        ((p.media && p.media.length > 1) ? '<span class="multi">&#9673;</span>' : '') +
        (p.pinned ? '<span class="pinned">&#128204;</span>' : '') +
        (tab === 'posts' ? '<button class="cell-menu" data-m="' + p.id + '">&#8942;</button>' : '') +
        '</div>';
    }).join('') + '</div>';

    PF_POSTS = list;

    g.querySelectorAll('.cell-menu').forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        const p = list.filter(function(x){ return String(x.id) === b.dataset.m; })[0];
        if(p) postMenu(p);
      });
    });

    g.querySelectorAll('.cell').forEach(function(c){
      c.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        const p = list.filter(function(x){ return String(x.id) === c.dataset.id; })[0];
        if(!p){ toast('Post topilmadi'); return; }
        if(typeof openPostFull !== 'function'){ toast('Funksiya yoq'); return; }
        try { openPostFull(p); } catch(er){ toast('Xato: ' + er.message); }
      });

      // Uzoq bosish - menyu
      let lt = null;
      c.addEventListener('touchstart', function(){
        if(tab !== 'posts') return;
        lt = setTimeout(function(){
          const p = list.filter(function(x){ return String(x.id) === c.dataset.id; })[0];
          if(p) postMenu(p);
        }, 550);
      }, { passive: true });
      c.addEventListener('touchend', function(){ clearTimeout(lt); });
      c.addEventListener('touchmove', function(){ clearTimeout(lt); });
    });
  }).catch(function(){
    g.innerHTML = '<div class="load">Xato yuz berdi</div>';
  });
}

function emptyBox(ic, t1, t2){
  return '<div class="empty" style="padding:60px 20px;"><div class="ic">' + ic + '</div>' +
    '<p>' + t1 + '</p><span>' + t2 + '</span></div>';
}

function loadXn(){
  if(!PF.username) return;
  api('/api/qoshimcha-nomlar?username=' + encodeURIComponent(PF.username)).then(function(d){
    const box = el('pfXn');
    if(!box) return;
    const list = d.names || [];
    box.innerHTML = list.map(function(n){
      return '<span class="xn">@' + esc(n.uname) + '</span>';
    }).join('');
  }).catch(function(er){ if(typeof upProgYop==="function") upProgYop(); alert("VIDEO XATO: " + (er && er.message ? er.message : er)); });
}

function loadHl(){
  const box = el('pfHl');
  if(!box || !myId()) return;

  api('/api/aktuallar?tg_id=' + myId()).then(function(d){
    const list = d.items || [];
    box.innerHTML =
      '<button class="hl" id="hlAddP"><div class="hl-c add">&#65291;</div><span>Yangi</span></button>' +
      list.map(function(x){
        const u = mediaUrl(x.file_id);
        return '<button class="hl" data-u="' + u + '" data-v="' + (x.is_video ? '1' : '0') + '">' +
          '<div class="hl-c">' + (x.is_video
            ? '<video src="' + u + '" muted preload="none"></video>'
            : '<img src="' + u + '">') + '</div>' +
          '<span>' + esc(x.title) + '</span></button>';
      }).join('');

    const add = el('hlAddP');
    if(add) add.addEventListener('click', function(){
      if(typeof addHighlightU === 'function') addHighlightU();
      else toast('Aktual qoshish');
    });

    box.querySelectorAll('.hl[data-u]').forEach(function(b){
      b.addEventListener('click', function(){
        if(typeof openGallery === 'function')
          openGallery([{ url: b.dataset.u, video: b.dataset.v === '1' }], 0, false, null);
      });
    });
  }).catch(function(er){ if(typeof upProgYop==="function") upProgYop(); alert("VIDEO XATO: " + (er && er.message ? er.message : er)); });
}

function editProfileU(){
  const d = PF || {};
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="epU" style="max-height:85vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div><div class="sheet-title">Profilni tahrirlash</div>' +
    '<div class="wrap">' +
    '<label class="label">Ism</label>' +
    '<input class="inp" id="euName" value="' + esc(d.name || '') + '">' +
    '<label class="label">Bio</label>' +
    '<textarea class="txt" id="euBio" maxlength="200" ' +
    'placeholder="Oz haqingizda qisqacha...">' + esc(d.bio || '') + '</textarea>' +

    (d.type === 'makler'
      ? '<div class="pm" id="euUn" style="margin:18px 0 4px;">' +
        '<span class="e">\u{1F517}</span>' +
        '<span class="t">Usernamelar</span>' +
        '<span class="v">@' + esc(d.username || '') + '</span>' +
        '<span class="ar">&rsaquo;</span></div>'
      : '') +

    '<button class="btn" id="euGo" style="margin-top:16px;">Saqlash</button></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#epU').addEventListener('click', function(e){ e.stopPropagation(); });

  const un = bg.querySelector('#euUn');
  if(un) un.addEventListener('click', function(){
    bg.remove();
    usernameOyna();
  });

  const gb = bg.querySelector('#euGo');
  gb.addEventListener('click', function(){
    const bio = bg.querySelector('#euBio').value.trim();
    gb.disabled = true;
    gb.textContent = 'Saqlanmoqda...';

    apiPost('/api/bio', { bio: bio }).then(function(r){
      if(r.ok){
        haptic('medium');
        toast('Saqlandi');
        PF.bio = bio;
        bg.remove();
        render();
      } else { toast('Xato'); gb.disabled = false; gb.textContent = 'Saqlash'; }
    }).catch(function(){
      toast('Server xatosi'); gb.disabled = false; gb.textContent = 'Saqlash';
    });
  });
}

// ---------- Yordamchi funksiyalar ----------
function avatarMenuU(){
  haptic('light');
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="avU"><div class="sheet-bar"></div>' +
    '<div class="sheet-title">Profil</div>' +
    (MY_STORIES.length
      ? '<button class="sheet-item" data-a="view">&#128065;&#65039;&nbsp;&nbsp;Storiyni korish</button>'
      : '') +
    '<button class="sheet-item" data-a="story">&#128248;&nbsp;&nbsp;Storiy qoshish</button>' +
    '<button class="sheet-item" data-a="ava">&#128100;&nbsp;&nbsp;Rasmni almashtirish</button>' +
    '</div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#avU').addEventListener('click', function(e){ e.stopPropagation(); });

  bg.querySelectorAll('.sheet-item').forEach(function(b){
    b.addEventListener('click', function(){
      const a = b.dataset.a;
      bg.remove();
      if(a === 'view' && typeof openStory === 'function')
        openStory({ id: myId(), name: PF.name, items: MY_STORIES }, 0);
      if(a === 'story') addStoryU();
      if(a === 'ava') changeAvatarU();
    });
  });
}

function changeAvatarU(){
  pickFiles(false, function(items){
    if(!items.length || items[0].is_video){ toast('Faqat rasm'); return; }
    toast('Yuklanmoqda...');
    apiPost('/api/profil-avatar', { media: String(items[0].media || '') }).then(function(d){
      if(d.ok){
        haptic('medium');
        PF.avatar = d.file_id;
        toast('Rasm yangilandi');
        render();
      } else toast('Xato');
    }).catch(function(){ toast('Server xatosi'); });
  });
}

function addStoryU(){
  pickFiles(false, function(items){
    if(!items.length) return;
    const it = items[0];
    toast('Yuklanmoqda...');
    apiPost('/api/story-media', { media: it.media, is_video: it.is_video })
      .then(function(d){
        if(d.ok && d.file_id){
          return apiPost('/api/story-qoshish', { file_id: d.file_id, is_video: it.is_video });
        }
        throw new Error('media');
      })
      .then(function(r){
        if(r && r.ok){ haptic('medium'); toast('Storiy qoshildi'); loadMyStories(); }
        else toast('Xato');
      })
      .catch(function(){ toast('Server xatosi'); });
  });
}

function loadMyStories(){
  if(!myId()) return;
  api('/api/mening-storylarim?tg_id=' + myId()).then(function(d){
    MY_STORIES = d.stories || [];
    if(PF) render();
  }).catch(function(er){ if(typeof upProgYop==="function") upProgYop(); alert("VIDEO XATO: " + (er && er.message ? er.message : er)); });
}

function showFollowersU(){
  if(!PF || !PF.username) return;
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="fwU" style="max-height:80vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div><div class="sheet-title">Obunachilar</div>' +
    '<div id="fwB"><div class="load">Yuklanmoqda...</div></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#fwU').addEventListener('click', function(e){ e.stopPropagation(); });

  api('/api/obunachilar?username=' + encodeURIComponent(PF.username)).then(function(d){
    const box = bg.querySelector('#fwB');
    const list = d.users || [];
    if(!list.length){
      box.innerHTML = emptyBox('&#128101;', 'Obunachi yoq', '');
      return;
    }
    box.innerHTML = list.map(function(u){
      const nm = u.name || ('ID ' + u.tg_id);
      return '<div class="chat-row" data-tg="' + (u.tg_id || '') + '" style="cursor:pointer;">' +
        '<div class="chat-ava"><img src="https://api.dicebear.com/7.x/initials/svg?seed=' +
        encodeURIComponent(nm) + '"></div>' +
        '<div class="ci"><b>' + esc(nm) + '</b></div>' +
        '<span style="color:#555;font-size:17px;">&rsaquo;</span></div>';
    }).join('');

    box.querySelectorAll('.chat-row[data-tg]').forEach(function(r){
      r.addEventListener('click', function(){
        const t = r.dataset.tg;
        if(!t) return;
        bg.remove();
        if(typeof openUserProfile === 'function') openUserProfile(parseInt(t), null);
      });
    });
  }).catch(function(er){ if(typeof upProgYop==="function") upProgYop(); alert("VIDEO XATO: " + (er && er.message ? er.message : er)); });
}

function addHighlightU(){
  api('/api/mening-storylarim?tg_id=' + myId()).then(function(d){
    const list = d.stories || [];
    if(!list.length){ toast('Avval storiy joylang'); return; }

    const bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.innerHTML = '<div class="sheet" id="hlU" style="max-height:80vh;overflow-y:auto;">' +
      '<div class="sheet-bar"></div><div class="sheet-title">Aktualga saqlash</div>' +
      '<div class="wrap"><label class="label">Nomi</label>' +
      '<input class="inp" id="hlT" value="Aktual">' +
      '<label class="label">Storiyni tanlang</label>' +
      '<div class="grid" id="hlP" style="border:none;"></div></div></div>';

    document.body.appendChild(bg);
    bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
    bg.querySelector('#hlU').addEventListener('click', function(e){ e.stopPropagation(); });

    bg.querySelector('#hlP').innerHTML = list.map(function(s){
      const u = mediaUrl(s.file_id);
      return '<div class="cell" data-f="' + s.file_id + '" data-v="' + (s.is_video ? '1' : '0') + '">' +
        (s.is_video ? '<video src="' + u + '" muted></video>' : '<img src="' + u + '">') + '</div>';
    }).join('');

    bg.querySelectorAll('.cell').forEach(function(c){
      c.addEventListener('click', function(){
        apiPost('/api/aktual-qoshish', {
          file_id: c.dataset.f, is_video: c.dataset.v === '1',
          title: bg.querySelector('#hlT').value.trim() || 'Aktual'
        }).then(function(r){
          if(r.ok){ haptic('medium'); toast('Saqlandi'); bg.remove(); loadHl(); }
          else toast('Xato');
        });
      });
    });
  }).catch(function(){ toast('Xato'); });
}

// ---------- E'lon qo'shish (hamma uchun) ----------
function openUploadU(){
  pickFiles(true, function(items){
    if(!items.length) return;
    const picked = items.slice(0, 10);

    let type = 'sotuv';
    let geoLat = null, geoLng = null;

    const bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.innerHTML = '<div class="sheet" id="upS" style="max-height:92vh;overflow-y:auto;">' +
      '<div class="sheet-bar"></div>' +
      '<div class="sheet-title">Yangi elon</div>' +
      '<div class="wrap">' +

      '<div class="prev-row" style="display:flex;gap:8px;overflow-x:auto;margin-bottom:18px;">' +
      picked.map(function(it){
        return it.is_video
          ? '<video src="' + it.media + '" style="width:88px;height:88px;object-fit:cover;' +
            'border-radius:11px;flex-shrink:0;" muted></video>'
          : '<img src="' + it.media + '" style="width:88px;height:88px;object-fit:cover;' +
            'border-radius:11px;flex-shrink:0;">';
      }).join('') + '</div>' +

      '<label class="label">Turi</label>' +
      '<div class="type-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">' +
        '<button class="tp on" data-t="sotuv">Sotiladi</button>' +
        '<button class="tp" data-t="ijara">Ijaraga</button>' +
        '<button class="tp" data-t="kunlik">Kunlik</button>' +
        '<button class="tp" data-t="student">Student</button>' +
      '</div>' +

      '<label class="label">Sarlavha</label>' +
      '<input class="inp" id="upT" placeholder="3 xonali kvartira, Navoiy kochasi">' +

      '<label class="label">Narx</label>' +
      '<input class="inp" id="upP" placeholder="420 000 000">' +

      '<label class="label">Malumot</label>' +
      '<textarea class="txt" id="upD" placeholder="Qavat, maydon, tamir holati..."></textarea>' +

      ((typeof IS_ADMIN !== 'undefined' && IS_ADMIN)
        ? '<div class="pano-pick" id="upPano"><span class="ic">&#127760;</span>' +
          '<span class="tx"><b>360&deg; panorama</b>' +
          '<span id="upPanoN">Ixtiyoriy &mdash; panorama rasm</span></span></div>'
        : '') +
      '<div class="geo-pick" id="upTag"><span class="ic">&#127991;</span>' +
      '<span class="tx"><b>Odamlarni belgilash</b>' +
      '<span id="upTagN">Ixtiyoriy &mdash; tanlang</span></span></div>' +
      '<div class="geo-pick" id="upGeo"><span class="ic">&#128205;</span>' +
      '<span class="tx"><b>Xaritada belgilash</b>' +
      '<span id="upGeoN">Ixtiyoriy &mdash; xaritadan tanlang</span></span></div>' +

      '<button class="btn" id="upGo">Joylash</button>' +
      '</div></div>';

    document.body.appendChild(bg);
    bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
    bg.querySelector('#upS').addEventListener('click', function(e){ e.stopPropagation(); });

    bg.querySelectorAll('.tp').forEach(function(b){
      b.addEventListener('click', function(){
        bg.querySelectorAll('.tp').forEach(function(x){ x.classList.remove('on'); });
        b.classList.add('on');
        type = b.dataset.t;
        haptic('light');
      });
    });

    let panoData = null;
    const pp = bg.querySelector('#upPano');
    if(pp) pp.addEventListener('click', function(){
      pickFiles(false, function(its){
        if(!its.length || its[0].is_video){ toast('Faqat rasm'); return; }
        panoData = its[0].media;
        pp.classList.add('on');
        bg.querySelector('#upPanoN').textContent = 'Tanlandi';
        haptic('light');
      });
    });

    let tagged = [];
    const tg_ = bg.querySelector('#upTag');
    if(tg_) tg_.addEventListener('click', function(){
      pickPeople(tagged, function(sel){
        tagged = sel;
        tg_.classList.toggle('on', sel.length > 0);
        bg.querySelector('#upTagN').textContent = sel.length
          ? sel.length + ' ta tanlandi' : 'Ixtiyoriy — tanlang';
      });
    });

    const gp = bg.querySelector('#upGeo');
    gp.addEventListener('click', function(){
      if(typeof openGeoPickerU === 'function'){
        openGeoPickerU(function(la, ln){
          geoLat = la; geoLng = ln;
          gp.classList.add('on');
          bg.querySelector('#upGeoN').textContent = la.toFixed(5) + ', ' + ln.toFixed(5);
        });
      } else toast('Xarita yuklanmoqda');
    });

    const gb = bg.querySelector('#upGo');
    gb.addEventListener('click', function(){
      const title = bg.querySelector('#upT').value.trim();
      const price = bg.querySelector('#upP').value.trim();
      const desc = bg.querySelector('#upD').value.trim();

      if(!title){ toast('Sarlavhani kiriting'); return; }

      const HEADS = {
        sotuv: 'Sotiladi', ijara: 'Ijaraga beriladi',
        kunlik: 'Kunlik ijara', student: 'Studentlar uchun'
      };
      const full = HEADS[type] + '\n' + title + (desc ? '\n' + desc : '');

      gb.disabled = true;
      gb.textContent = 'Yuklanmoqda...';

      var _pre = Promise.resolve();
      if(typeof uploadBigVideo === 'function'){
        const kattalar = picked.filter(function(x){ return x.is_video && x._file; });

        if(kattalar.length){
          const hajm = kattalar.reduce(function(s, x){
            return s + (x._file.size || 0);
          }, 0) / (1024 * 1024);
          upProgOch(hajm);
        }

        _pre = Promise.all(picked.map(function(it, i){
          if(!it.is_video || !it._file) return Promise.resolve();
          const mb = (it._file.size || 0) / (1024 * 1024);
          return uploadBigVideo(it._file, function(pc){
            upProgYangila(pc, mb);
            gb.textContent = 'Yuklanmoqda ' + pc + '%';
          }).then(function(url){
            it.media = url;
            it.r2 = true;
            delete it._file;
          });
        })).then(function(){
          if(kattalar.length) upProgYop();
        });
      }

      _pre.then(function(){
      return apiPost('/api/post-qoshish', {
        items: picked, price: price, description: full,
        lat: geoLat, lng: geoLng
      }); }).then(function(d){
        if(d.ok && tagged.length){
          setTimeout(function(){
            api('/api/mening-postlarim?tg_id=' + myId()).then(function(r){
              const last = (r.posts || [])[0];
              if(last) apiPost('/api/belgilash', {
                post_id: last.id, tagged: tagged
              }).catch(function(er){ if(typeof upProgYop==="function") upProgYop(); alert("VIDEO XATO: " + (er && er.message ? er.message : er)); });
            });
          }, 2500);
        }
        if(d.ok && panoData){
          apiPost('/api/pano-qoshish', {
            media: panoData, price: price,
            description: '360 panorama\n' + title
          }).catch(function(er){ if(typeof upProgYop==="function") upProgYop(); alert("VIDEO XATO: " + (er && er.message ? er.message : er)); });
        }
        if(d.ok){
          haptic('medium');
          toast('Elon joylandi');
          bg.remove();
          setTimeout(function(){ drawProfile(); }, 2000);
        } else {
          toast(d.error || 'Xato');
          gb.disabled = false;
          gb.textContent = 'Joylash';
        }
      }).catch(function(){
        toast('Server xatosi');
        gb.disabled = false;
        gb.textContent = 'Joylash';
      });
    });
  });
}

function openGeoPickerU(cb){
  if(typeof L === 'undefined'){
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = function(){ showGeo(cb); };
    document.head.appendChild(s);
  } else showGeo(cb);
}

function showGeo(cb){
  const d = document.createElement('div');
  d.id = 'geoMap';
  d.innerHTML = '<div id="geoMapBox"></div>' +
    '<div class="geo-center">&#128205;</div>' +
    '<button class="geo-x" id="geoX">&times;</button>' +
    '<button class="geo-ok" id="geoOk">Shu joyni tasdiqlash</button>';
  document.body.appendChild(d);

  const m = L.map('geoMapBox', { zoomControl: false, attributionControl: false })
    .setView([40.9983, 71.6726], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { maxZoom: 19 }).addTo(m);
  L.control.zoom({ position: 'bottomright' }).addTo(m);

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(p){
      m.setView([p.coords.latitude, p.coords.longitude], 16);
    }, function(){}, { timeout: 4000 });
  }

  document.getElementById('geoX').addEventListener('click', function(){ d.remove(); });
  document.getElementById('geoOk').addEventListener('click', function(){
    const c = m.getCenter();
    d.remove();
    cb(c.lat, c.lng);
    haptic('medium');
  });

  setTimeout(function(){ m.invalidateSize(); }, 200);
}

// ---------- E'lon qo'shish (hamma uchun) ----------


function openGeoPickerU(cb){
  if(typeof L === 'undefined'){
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = function(){ showGeo(cb); };
    document.head.appendChild(s);
  } else showGeo(cb);
}

function showGeo(cb){
  const d = document.createElement('div');
  d.id = 'geoMap';
  d.innerHTML = '<div id="geoMapBox"></div>' +
    '<div class="geo-center">&#128205;</div>' +
    '<button class="geo-x" id="geoX">&times;</button>' +
    '<button class="geo-ok" id="geoOk">Shu joyni tasdiqlash</button>';
  document.body.appendChild(d);

  const m = L.map('geoMapBox', { zoomControl: false, attributionControl: false })
    .setView([40.9983, 71.6726], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { maxZoom: 19 }).addTo(m);
  L.control.zoom({ position: 'bottomright' }).addTo(m);

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(p){
      m.setView([p.coords.latitude, p.coords.longitude], 16);
    }, function(){}, { timeout: 4000 });
  }

  document.getElementById('geoX').addEventListener('click', function(){ d.remove(); });
  document.getElementById('geoOk').addEventListener('click', function(){
    const c = m.getCenter();
    d.remove();
    cb(c.lat, c.lng);
    haptic('medium');
  });

  setTimeout(function(){ m.invalidateSize(); }, 200);
}


// ---------- Odam tanlash ----------
function pickPeople(current, cb){
  const sel = {};
  (current || []).forEach(function(x){ sel[x] = 1; });

  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.style.zIndex = '9000';
  bg.innerHTML = '<div class="sheet" id="ppS" style="max-height:82vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="sheet-title">Odamlarni belgilash</div>' +
    '<div class="search-bar" style="padding:0 16px 10px;">' +
    '<input class="inp" id="ppQ" placeholder="Ism yoki username"></div>' +
    '<div id="ppL"><div class="load">Yuklanmoqda...</div></div>' +
    '<div class="wrap"><button class="btn" id="ppGo">Tayyor</button></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#ppS').addEventListener('click', function(e){ e.stopPropagation(); });

  let LIST = [];

  api('/api/maklerlar').then(function(d){
    LIST = (d.maklers || []).filter(function(m){ return m.tg_id && m.tg_id !== myId(); });
    draw('');
  }).catch(function(){
    bg.querySelector('#ppL').innerHTML = '<div class="load">Xato</div>';
  });

  function draw(f){
    f = (f || '').toLowerCase();
    const box = bg.querySelector('#ppL');
    const list = LIST.filter(function(m){
      if(!f) return true;
      return (m.name || '').toLowerCase().indexOf(f) !== -1 ||
             (m.username || '').toLowerCase().indexOf(f) !== -1;
    }).slice(0, 50);

    if(!list.length){
      box.innerHTML = '<div class="empty" style="padding:36px 16px;"><span>Topilmadi</span></div>';
      return;
    }

    box.innerHTML = list.map(function(m){
      const on = sel[m.tg_id] ? ' on' : '';
      const ava = m.avatar
        ? mediaUrl(m.avatar)
        : 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(m.name);
      return '<div class="share-row" data-tg="' + m.tg_id + '">' +
        '<img src="' + ava + '">' +
        '<div class="si"><b>' + esc(m.name) + '</b><span>@' + esc(m.username) + '</span></div>' +
        '<div class="share-chk' + on + '">' + (on ? '&#10003;' : '') + '</div></div>';
    }).join('');

    box.querySelectorAll('.share-row').forEach(function(r){
      r.addEventListener('click', function(){
        const id = r.dataset.tg;
        const chk = r.querySelector('.share-chk');
        if(sel[id]){
          delete sel[id];
          chk.classList.remove('on');
          chk.innerHTML = '';
        } else {
          sel[id] = 1;
          chk.classList.add('on');
          chk.innerHTML = '\u2713';
        }
        haptic('light');
      });
    });
  }

  bg.querySelector('#ppQ').addEventListener('input', function(e){ draw(e.target.value); });
  bg.querySelector('#ppGo').addEventListener('click', function(){
    cb(Object.keys(sel).map(function(x){ return parseInt(x); }));
    bg.remove();
  });
}

// ---------- Username boshqaruvi ----------
function usernameOyna(){
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="unS" style="max-height:90vh;overflow-y:auto;">' +
    '<div class="sheet-bar"></div>' +
    '<div class="sheet-title">Usernamelar</div>' +
    '<div id="unBody"><div class="load">Yuklanmoqda...</div></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#unS').addEventListener('click', function(e){ e.stopPropagation(); });

  api('/api/profil?tg_id=' + myId()).then(function(d){
    if(!d.ok || d.type !== 'makler'){
      bg.querySelector('#unBody').innerHTML =
        '<div class="empty" style="padding:44px 20px;">' +
        '<div class="ic">\\u{1F517}</div><p>Username yoq</p>' +
        '<span>Elon joylaganingizdan song<br>username paydo boladi</span></div>';
      return;
    }

    api('/api/qoshimcha-nomlar?username=' + encodeURIComponent(d.username))
      .then(function(x){
        chizUn(bg, d, x.names || []);
      }).catch(function(){ chizUn(bg, d, []); });
  }).catch(function(){
    bg.querySelector('#unBody').innerHTML = '<div class="load">Xato</div>';
  });
}

function chizUn(bg, prof, extra){
  const box = bg.querySelector('#unBody');

  let slots = '';
  for(let i = 0; i < 5; i++){
    const cur = extra[i] ? extra[i].uname : '';
    const cid = extra[i] ? extra[i].id : '';
    slots += '<div class="un-slot' + (cur ? ' ok' : '') + '"' +
      (cid ? ' data-id="' + cid + '"' : '') + '>' +
      '<input class="inp un-inp" placeholder="Qoshimcha ' + (i + 1) + '" value="' + esc(cur) + '"' +
      (cur ? ' readonly style="opacity:.7;"' : '') + '>' +
      '<div class="un-msg' + (cur ? ' free' : '') + '">' +
      (cur ? '\\u2713 Sizniki (bosib ochirish)' : '') + '</div></div>';
  }

  box.innerHTML =
    '<div class="wrap">' +
      '<label class="label">Asosiy username</label>' +
      '<input class="inp" id="unMain" value="' + esc(prof.username || '') + '">' +
      '<div class="un-msg" id="unMainMsg"></div>' +
      '<button class="btn" id="unMainGo" style="margin-bottom:26px;">Asosiyni ozgartirish</button>' +

      '<div style="height:1px;background:var(--line);margin-bottom:20px;"></div>' +

      '<label class="label">Qoshimcha usernamelar</label>' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.5;">' +
      'Qidiruvda topilish uchun 5 tagacha nom band qilishingiz mumkin.</div>' +
      slots +
      '<button class="btn" id="unExtraGo">Qoshimchalarni saqlash</button>' +
    '</div>';

  // Asosiy username tekshiruvi
  const mi = bg.querySelector('#unMain');
  const mm = bg.querySelector('#unMainMsg');
  const eski = prof.username || '';
  let tm = null;

  mi.addEventListener('input', function(){
    const v = mi.value.trim().replace(/^@/, '').toLowerCase();
    clearTimeout(tm);

    if(v === eski){ mm.textContent = ''; mm.className = 'un-msg'; return; }
    if(!v){ mm.textContent = ''; mm.className = 'un-msg'; return; }

    if(!/^[a-z0-9._]{4,32}$/.test(v)){
      mm.textContent = '\\u2717 4-32 belgi, lotin harflari, raqam, nuqta';
      mm.className = 'un-msg busy';
      return;
    }

    mm.textContent = 'Tekshirilmoqda...';
    mm.className = 'un-msg check';

    tm = setTimeout(function(){
      fetch(API + '/api/nom-tekshir?uname=' + encodeURIComponent(v) + '&tg_id=' + myId())
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(d && d.free){
            mm.textContent = '\\u2713 Bosh';
            mm.className = 'un-msg free';
          } else {
            mm.textContent = '\\u2717 ' + ((d && d.msg) || 'Band');
            mm.className = 'un-msg busy';
          }
        }).catch(function(){ mm.textContent = ''; });
    }, 500);
  });

  bg.querySelector('#unMainGo').addEventListener('click', function(){
    const v = mi.value.trim().replace(/^@/, '').toLowerCase();

    if(v === eski){ toast('Ozgarish yoq'); return; }
    if(!/^[a-z0-9._]{4,32}$/.test(v)){ toast('Notogri format'); return; }
    if(!confirm('Username @' + eski + ' \\u2192 @' + v + '\\n\\nOzgartirasizmi?')) return;

    const b = bg.querySelector('#unMainGo');
    b.disabled = true;
    b.textContent = 'Ozgartirilmoqda...';

    apiPost('/api/username-ozgartir', { yangi: v }).then(function(d){
      if(d.ok){
        haptic('medium');
        toast('Username ozgartirildi');
        bg.remove();
        if(typeof drawProfile === 'function') drawProfile();
      } else {
        toast(d.error || 'Xato');
        b.disabled = false;
        b.textContent = 'Asosiyni ozgartirish';
      }
    }).catch(function(){
      toast('Server xatosi');
      b.disabled = false;
      b.textContent = 'Asosiyni ozgartirish';
    });
  });

  // Qo'shimchalar
  bg.querySelectorAll('.un-slot').forEach(function(s){
    const inp = s.querySelector('.un-inp');
    const msg = s.querySelector('.un-msg');
    const id = s.dataset.id;

    if(id){
      inp.addEventListener('click', function(){
        if(!confirm('@' + inp.value + ' ni ochirasizmi?')) return;
        apiPost('/api/nom-amal', { action: 'delete', id: parseInt(id) })
          .then(function(d){
            if(d.ok){ toast('Ochirildi'); bg.remove(); setTimeout(usernameOyna, 700); }
          });
      });
      return;
    }

    let t2 = null;
    inp.addEventListener('input', function(){
      const v = inp.value.trim().replace(/^@/, '').toLowerCase();
      clearTimeout(t2);

      if(!v){ msg.textContent = ''; msg.className = 'un-msg'; s.classList.remove('ok'); return; }

      if(!/^[a-z0-9._]{4,32}$/.test(v)){
        msg.textContent = '\\u2717 Notogri format';
        msg.className = 'un-msg busy';
        s.classList.remove('ok');
        return;
      }

      msg.textContent = 'Tekshirilmoqda...';
      msg.className = 'un-msg check';

      t2 = setTimeout(function(){
        fetch(API + '/api/nom-tekshir?uname=' + encodeURIComponent(v) + '&tg_id=' + myId())
          .then(function(r){ return r.json(); })
          .then(function(d){
            if(d && d.free){
              msg.textContent = '\\u2713 Bosh';
              msg.className = 'un-msg free';
              s.classList.add('ok');
            } else {
              msg.textContent = '\\u2717 Band';
              msg.className = 'un-msg busy';
              s.classList.remove('ok');
            }
          }).catch(function(){ msg.textContent = ''; });
      }, 500);
    });
  });

  bg.querySelector('#unExtraGo').addEventListener('click', function(){
    const jobs = [];
    bg.querySelectorAll('.un-slot').forEach(function(s){
      if(s.dataset.id) return;
      const v = s.querySelector('.un-inp').value.trim().replace(/^@/, '').toLowerCase();
      if(v) jobs.push(v);
    });

    if(!jobs.length){ toast('Yangi username yoq'); return; }

    const b = bg.querySelector('#unExtraGo');
    b.disabled = true;
    b.textContent = 'Saqlanmoqda...';

    let i = 0;
    const errs = [];
    function next(){
      if(i >= jobs.length){
        b.disabled = false;
        b.textContent = 'Qoshimchalarni saqlash';
        if(errs.length) toast('Xato: ' + errs[0]);
        else { haptic('medium'); toast('Saqlandi'); }
        bg.remove();
        return;
      }
      apiPost('/api/nom-amal', { action: 'add', uname: jobs[i++] })
        .then(function(d){ if(!d.ok) errs.push(d.error || ''); next(); })
        .catch(function(){ next(); });
    }
    next();
  });
}


// ---------- Elonni toliq ekranda ochish ----------
function openPostFull(p){
  const E = function(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  };
  const F = function(n){
    return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  const U = function(fid){
    var s = String(fid || '');
    if(s.indexOf('http://') === 0 || s.indexOf('https://') === 0) return s;
    return 'https://api.namangan-ijara.uz/media/' + s;
  };

  const media = (p.media && p.media.length) ? p.media
    : [{ file_id: p.file_id, is_video: p.is_video }];

  let idx = 0;

  const v = document.createElement('div');
  v.className = 'pf-full';
  document.body.appendChild(v);

  // Yuqoriga/pastga surish - keyingi/oldingi post
  (function(){
    var y0 = 0, x0 = 0;
    v.addEventListener('touchstart', function(e){
      y0 = e.touches[0].clientY;
      x0 = e.touches[0].clientX;
    }, { passive: true });
    v.addEventListener('touchend', function(e){
      var dy = e.changedTouches[0].clientY - y0;
      var dx = e.changedTouches[0].clientX - x0;
      // Chap/o'ng surish - media almashish
      if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60){
        if(media.length > 1){
          if(dx < 0 && idx < media.length - 1){ idx++; chiz(); }
          else if(dx > 0 && idx > 0){ idx--; chiz(); }
        }
        return;
      }
      if(Math.abs(dy) < 70) return;
      if(typeof PF_POSTS === 'undefined' || !PF_POSTS.length) return;
      var i = -1;
      for(var k = 0; k < PF_POSTS.length; k++){
        if(String(PF_POSTS[k].id) === String(p.id)){ i = k; break; }
      }
      if(i === -1) return;
      var j = dy < 0 ? i + 1 : i - 1;
      if(j < 0 || j >= PF_POSTS.length) return;
      try { v.remove(); } catch(e2){}
      openPostFull(PF_POSTS[j]);
    }, { passive: true });
  })();

  function chiz(){
    const m = media[idx] || media[0];
    const u = U(m.file_id);

    v.innerHTML =
      '<div class="pf-bar">' +
        '<button id="pfClose">&#8592;</button><b>Elon</b>' +
        '<button id="pfMenu">&#8942;</button></div>' +

      '<div class="pf-media">' +
        (m.is_video
          ? '<video src="' + u + '" controls playsinline preload="metadata"></video>'
          : '<img src="' + u + '">') +
        (media.length > 1
          ? '<div class="pf-dots">' + media.map(function(_, i){
              return '<i class="' + (i === idx ? 'on' : '') + '"></i>';
            }).join('') + '</div>' +
            '<button class="pf-nav l" id="pfPrev">&#8249;</button>' +
            '<button class="pf-nav r" id="pfNext">&#8250;</button>'
          : '') +
      '</div>' +

      '<div class="pf-info">' +
        (p.price ? '<div class="pf-price">' + E(p.price) + '</div>' : '') +
        (p.description ? '<div class="pf-desc">' + E(p.description) + '</div>' : '') +
        '<div class="pf-stats">' +
          '<span>\u{1F441} ' + F(p.views) + '</span>' +
          '<span>\u2764\uFE0F ' + F(p.likes) + '</span>' +
        '</div></div>' +

      '<div class="pf-acts">' +
        '<button class="pf-btn blue" id="pfAd">\u{1F4E2} Reklama qilish</button>' +
        '<button class="pf-btn" id="pfEdit2">\u270F\uFE0F Tahrirlash</button>' +
        '<button class="pf-btn red" id="pfDel">\u{1F5D1}</button>' +
      '</div>';

    const cb = v.querySelector('#pfClose');
    if(cb) cb.onclick = function(){ v.remove(); };

    const pv = v.querySelector('#pfPrev');
    if(pv) pv.onclick = function(){
      idx = (idx - 1 + media.length) % media.length; chiz();
    };

    const nx = v.querySelector('#pfNext');
    if(nx) nx.onclick = function(){
      idx = (idx + 1) % media.length; chiz();
    };

    const ad = v.querySelector('#pfAd');
    if(ad) ad.onclick = function(){
      if(typeof reklamaOyna === 'function') reklamaOyna(p.id);
      else if(typeof toast === 'function') toast('Reklama oynasi yoq');
    };

    const ed = v.querySelector('#pfEdit2');
    if(ed) ed.onclick = function(){
      v.remove();
      if(typeof editPost === 'function') editPost(p);
      else if(typeof toast === 'function') toast('Tahrirlash yoq');
    };

    const dl = v.querySelector('#pfDel');
    if(dl) dl.onclick = function(){
      if(!confirm('Elonni ochirasizmi?')) return;
      apiPost('/api/post-ochirish', { post_id: p.id }).then(function(d){
        if(d.ok){
          if(typeof toast === 'function') toast('Ochirildi');
          v.remove();
          if(typeof loadTab === 'function') loadTab(PF_TAB);
        }
      });
    };

    const mn = v.querySelector('#pfMenu');
    if(mn) mn.onclick = function(){
      v.remove();
      if(typeof postMenu === 'function') postMenu(p);
    };
  }

  chiz();
}


// Zaxira: grid bosilishi (delegatsiya orqali)
document.addEventListener('click', function(e){
  const c = e.target.closest ? e.target.closest('#pfGrid .cell') : null;
  if(!c) return;

  const id = c.dataset.id;
  if(!id) return;

  e.preventDefault();
  e.stopPropagation();

  if(typeof PF_POSTS !== 'undefined' && PF_POSTS.length){
    const p = PF_POSTS.filter(function(x){ return String(x.id) === id; })[0];
    if(p){ openPostFull(p); return; }
  }

  // Serverdan olamiz
  api('/api/postlar?id=' + id).then(function(d){
    const p = (d.posts || []).filter(function(x){ return String(x.id) === id; })[0];
    if(p) openPostFull(p);
    else toast('Elon topilmadi');
  }).catch(function(){ toast('Xato'); });
});


// ---------- Elon boshqaruvi (eski paneldan) ----------
function postMenu(p){
  if(!p) return;
  haptic('medium');

  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="pmS"><div class="sheet-bar"></div>' +
    '<div class="sheet-title">Eʼlon boshqaruvi</div>' +
    '<button class="sheet-item" data-a="edit">&#9999;&#65039;&nbsp;&nbsp;Tahrirlash</button>' +
    '<button class="sheet-item" data-a="pin">&#128204; ' +
      (p.pinned ? 'Qadashni bekor qilish' : 'Tepaga qadash') + '</button>' +
    '<button class="sheet-item" data-a="geo">&#128205;&nbsp;&nbsp;Joylashuvni belgilash</button>' +
    '<button class="sheet-item danger" data-a="del">&#128465;&#65039;&nbsp;&nbsp;Eʼlonni oʻchirish</button>' +
    '</div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  el('pmS').addEventListener('click', function(e){ e.stopPropagation(); });

  bg.querySelectorAll('.sheet-item').forEach(function(b){
    b.addEventListener('click', function(){
      const a = b.dataset.a;
      bg.remove();

      if(a === 'del'){
        if(!confirm('Elonni ochirasizmi?\n\nLayk, komentariya, korishlar ham ochadi.')) return;
        apiPost('/api/post-ochirish', { post_id: p.id }).then(function(d){
          if(d.ok){ haptic('medium'); toast('Ochirildi'); drawProfile(); }
          else toast(d.error || 'Xato');
        }).catch(function(){ toast('Server xatosi'); });
      }

      if(a === 'edit') editPost(p);

      if(a === 'pin'){
        apiPost('/api/post-pin', { post_id: p.id, on: !p.pinned }).then(function(d){
          if(d.ok){
            haptic('medium');
            toast(p.pinned ? 'Qadash bekor qilindi' : 'Tepaga qadaldi');
            drawProfile();
          } else toast('Xato');
        }).catch(function(){ toast('Server xatosi'); });
      }

      if(a === 'geo'){
        openGeoPicker(function(la, ln){
          apiPost('/api/post-tahrirlash', {
            post_id: p.id, price: p.price || '',
            description: p.description || '', lat: la, lng: ln
          }).then(function(d){
            if(d.ok){ haptic('medium'); toast('Joylashuv saqlandi'); }
            else toast('Xato');
          });
        });
      }
    });
  });
}

function editPost(p){
  const lines = String(p.description || '').split('\n');
  const head = lines[0] || '';
  const title = lines[1] || '';
  const body = lines.slice(2).join('\n');

  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="epS" style="max-height:88vh;">' +
    '<div class="sheet-bar"></div><div class="sheet-title">Eʼlonni tahrirlash</div>' +
    '<div class="wrap">' +
    '<label class="label">Sarlavha</label>' +
    '<input class="inp" id="eT" value="' + esc(title) + '">' +
    '<label class="label">Narx</label>' +
    '<input class="inp" id="eP" value="' + esc(p.price || '') + '">' +
    '<label class="label">Malumot</label>' +
    '<textarea class="txt" id="eD">' + esc(body) + '</textarea>' +
    '<button class="btn" id="eGo">Saqlash</button></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  el('epS').addEventListener('click', function(e){ e.stopPropagation(); });

  el('eGo').addEventListener('click', function(){
    const t = el('eT').value.trim();
    if(!t){ toast('Sarlavhani kiriting'); return; }

    const full = head + '\n' + t + (el('eD').value.trim() ? '\n' + el('eD').value.trim() : '');
    const b = el('eGo');
    b.disabled = true;
    b.textContent = 'Saqlanmoqda...';

    apiPost('/api/post-tahrirlash', {
      post_id: p.id, price: el('eP').value.trim(), description: full
    }).then(function(d){
      if(d.ok){ haptic('medium'); toast('Saqlandi'); bg.remove(); drawProfile(); }
      else { toast('Xato'); b.disabled = false; b.textContent = 'Saqlash'; }
    }).catch(function(){
      toast('Server xatosi'); b.disabled = false; b.textContent = 'Saqlash';
    });
  });
}

// ---------- Video yuklash progressi ----------
let UP_OV = null, UP_T0 = 0;

function upProgOch(hajmMB){
  if(UP_OV) UP_OV.remove();

  UP_T0 = Date.now();

  const ov = document.createElement('div');
  ov.className = 'up-prog';
  ov.innerHTML =
    '<div class="ic">\u{1F4F9}</div>' +
    '<h3>Video yuklanmoqda</h3>' +
    '<div class="sub">Ilovani yopmang</div>' +

    '<div class="up-ring">' +
      '<svg viewBox="0 0 100 100">' +
        '<defs><linearGradient id="upGrad" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#0095F6"/>' +
        '<stop offset="100%" stop-color="#8BC34A"/></linearGradient></defs>' +
        '<circle class="bg" cx="50" cy="50" r="42"/>' +
        '<circle class="fg" id="upFg" cx="50" cy="50" r="42" ' +
        'stroke-dasharray="264" stroke-dashoffset="264"/>' +
      '</svg>' +
      '<div class="pc"><b id="upPc">0</b><span>foiz</span></div>' +
    '</div>' +

    '<div class="up-info">' +
      '<div><b id="upSpeed">\u2014</b><span>tezlik</span></div>' +
      '<div><b id="upLeft">\u2014</b><span>qoldi</span></div>' +
      '<div><b id="upSize">' + (hajmMB || 0).toFixed(0) + ' MB</b><span>hajm</span></div>' +
    '</div>' +

    '<div class="up-hint">Katta videolar 1-5 daqiqa olishi mumkin</div>';

  document.body.appendChild(ov);
  UP_OV = ov;
}

function upProgYangila(pc, hajmMB){
  if(!UP_OV) return;

  const fg = UP_OV.querySelector('#upFg');
  const el_pc = UP_OV.querySelector('#upPc');
  const el_sp = UP_OV.querySelector('#upSpeed');
  const el_lf = UP_OV.querySelector('#upLeft');

  if(fg) fg.style.strokeDashoffset = String(264 - (264 * pc / 100));
  if(el_pc) el_pc.textContent = pc;

  const sek = (Date.now() - UP_T0) / 1000;
  if(sek > 1 && pc > 0){
    const yuklangan = (hajmMB || 0) * pc / 100;
    const tez = yuklangan / sek;
    if(el_sp) el_sp.textContent = tez.toFixed(1) + ' MB/s';

    const qolgan = ((hajmMB || 0) - yuklangan) / (tez || 0.1);
    if(el_lf){
      el_lf.textContent = qolgan > 60
        ? Math.ceil(qolgan / 60) + ' daq'
        : Math.ceil(qolgan) + ' sek';
    }
  }
}

function upProgYop(){
  if(!UP_OV) return;
  const ov = UP_OV;
  UP_OV = null;

  ov.querySelector('h3').textContent = 'Tayyor!';
  ov.querySelector('.ic').textContent = '\u2705';
  ov.querySelector('.sub').textContent = 'Video yuklandi';

  setTimeout(function(){ ov.remove(); }, 900);
}
