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
      '<div class="nm">' + esc(d.name || 'Ismingiz') + vb + '</div>' +
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
      '<div class="pm" data-go="referal"><span class="e">&#127873;</span>' +
      '<span class="t">Referal dastur</span><span class="ar">&rsaquo;</span></div>' +
      '<div class="pm" data-go="valyuta"><span class="e">&#128176;</span>' +
      '<span class="t">Valyuta kursi</span><span class="ar">&rsaquo;</span></div>' +
      '<div class="pm" data-go="obhavo"><span class="e">&#127780;</span>' +
      '<span class="t">Ob-havo</span><span class="ar">&rsaquo;</span></div>' +
      '<div class="pm" data-go="lang"><span class="e">&#127760;</span>' +
      '<span class="t">' + (typeof t === 'function' ? t('language') : 'Til') + '</span>' +
      '<span class="v">' + (typeof langFlag === 'function' ? langFlag(LANG) + ' ' + langName(LANG) : '') + '</span>' +
      '<span class="ar">&rsaquo;</span></div>' +
      ((typeof IS_ADMIN !== 'undefined' && IS_ADMIN)
        ? '<div class="pm" data-go="panel" style="border-color:rgba(0,149,246,.4);">' +
          '<span class="e">&#9881;&#65039;</span><span class="t">Boshqaruv markazi</span>' +
          '<span class="ar">&rsaquo;</span></div>'
        : '') +
    '</div>';

  bindProfile(isMak);
  loadTab('posts');
  if(isMak) loadXn();
  loadHl();
}

function bindProfile(isMak){
  const av = el('pfAva');
  if(av) av.addEventListener('click', function(){
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
    url = '/api/mening-postlarim?tg_id=' + id;
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
        (m.is_video ? '<video src="' + u + '" muted></video>' : '<img src="' + u + '">') +
        ((p.media && p.media.length > 1) ? '<span class="multi">&#9673;</span>' : '') +
        '</div>';
    }).join('') + '</div>';

    g.querySelectorAll('.cell').forEach(function(c){
      c.addEventListener('click', function(){
        const p = list.filter(function(x){ return String(x.id) === c.dataset.id; })[0];
        if(p && typeof openUserProfile === 'function' && PF_TAB !== 'posts'){
          openUserProfile(null, p.username);
        }
      });
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
  }).catch(function(){});
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
            ? '<video src="' + u + '" muted></video>'
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
  }).catch(function(){});
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
    '<button class="btn" id="euGo">Saqlash</button></div></div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  bg.querySelector('#epU').addEventListener('click', function(e){ e.stopPropagation(); });

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
    apiPost('/api/profil-avatar', { media: items[0].media }).then(function(d){
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
  }).catch(function(){});
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
  }).catch(function(){});
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

      apiPost('/api/post-qoshish', {
        items: picked, price: price, description: full,
        lat: geoLat, lng: geoLng
      }).then(function(d){
        if(d.ok && panoData){
          apiPost('/api/pano-qoshish', {
            media: panoData, price: price,
            description: '360 panorama\n' + title
          }).catch(function(){});
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

      apiPost('/api/post-qoshish', {
        items: picked, price: price, description: full,
        lat: geoLat, lng: geoLng
      }).then(function(d){
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
