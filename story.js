// ---------- Storieslar ----------
let STORIES = [];

function loadStories(cb){
  var _p = 't=' + Date.now();
  try { if(initData()) _p += '&init_data=' + encodeURIComponent(initData()); } catch(e){}
  try { if(typeof APP_TOKEN !== 'undefined' && APP_TOKEN) _p += '&token=' + encodeURIComponent(APP_TOKEN); } catch(e){}

  api('/api/storylar?' + _p).then(function(d){
    STORIES = d.stories || [];
    if(cb) cb();
  }).catch(function(e){
    console.log('Storylar xatosi:', e);
    STORIES = [];
    if(cb) cb();
  });
}

function groupStories(){
  const g = {};
  STORIES.forEach(function(s){
    if(!g[s.owner_id]) g[s.owner_id] = { id: s.owner_id, name: s.name, items: [] };
    g[s.owner_id].items.push(s);
  });
  return Object.keys(g).map(function(k){ return g[k]; });
}

function openStory(group, startIdx){
  let idx = startIdx || 0;
  let timer = null;
  const me = myId();

  const v = document.createElement('div');
  v.className = 'sv-view-full';
  document.body.appendChild(v);

  function draw(){
    const it = group.items[idx];
    if(!it){ close(); return; }

    const bars = group.items.map(function(_, i){
      return '<div class="sv-bar' + (i < idx ? ' done' : '') + '"><i></i></div>';
    }).join('');

    const isMine = me && group.id === me;

    v.innerHTML =
      '<div class="sv-bars">' + bars + '</div>' +
      '<div class="sv-hd">' +
        '<img src="https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(group.name) + '">' +
        '<b>' + esc(group.name) + '</b>' +
        '<button id="svX">&times;</button>' +
      '</div>' +
      '<div class="sv-media" id="svM">' +
        (it.is_video
          ? '<video src="' + mediaUrl(it.file_id) + '" autoplay playsinline></video>'
          : '<img src="' + mediaUrl(it.file_id) + '">') +
      '</div>' +
      (isMine
        ? '<div class="sv-stat" id="svStat">' +
            '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '<span id="svCnt">Yuklanmoqda...</span></div>'
        : '<div class="sv-foot">' +
            '<input id="svMsg" placeholder="Xabar yuborish...">' +
            '<button id="svLike"><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>' +
            '<button id="svSend"><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
          '</div>');

    el('svX').addEventListener('click', close);

    // Ko'rildi
    apiPost('/api/story-korish', { story_id: it.id }).catch(function(){});
    markStorySeen(it.id);

    if(isMine){
      api('/api/story-stat?story_id=' + it.id).then(function(d){
        const c = el('svCnt');
        if(c && d.ok) c.textContent = d.stat.views + ' korish · ' + d.stat.likes + ' layk';
      }).catch(function(){});
      const st = el('svStat');
      if(st) st.addEventListener('click', function(){ showViewers(it.id); });
    } else {
      el('svLike').addEventListener('click', function(){
        const b = el('svLike');
        const on = !b.classList.contains('liked');
        b.classList.toggle('liked', on);
        haptic('light');
        apiPost('/api/story-layk', { story_id: it.id, on: on }).catch(function(){});
      });
      el('svSend').addEventListener('click', sendMsg);
      el('svMsg').addEventListener('keypress', function(e){ if(e.key === 'Enter') sendMsg(); });
    }

    function sendMsg(){
      const inp = el('svMsg');
      const t = inp.value.trim();
      if(!t) return;
      inp.value = '';
      apiPost('/api/xabar', { to_id: group.id, text: t }).then(function(d){
        if(d.ok) toast('Yuborildi');
      }).catch(function(){});
    }

    // Media bosilganda keyingi/oldingi
    el('svM').addEventListener('click', function(e){
      const w = window.innerWidth;
      if(e.clientX < w * 0.3) prev(); else next();
    });

    // Tepaga surish -> ko'rganlar
    let ty = null;
    v.addEventListener('touchstart', function(e){ ty = e.touches[0].clientY; }, { passive: true });
    v.addEventListener('touchend', function(e){
      if(ty === null) return;
      const dy = e.changedTouches[0].clientY - ty;
      ty = null;
      if(dy < -80){
        clearInterval(timer);
        showViewers(it.id);
      }
    }, { passive: true });

    // Progress
    const bar = v.querySelectorAll('.sv-bar')[idx];
    const fill = bar ? bar.querySelector('i') : null;
    const dur = it.is_video ? 15000 : 6000;
    let t0 = Date.now();
    clearInterval(timer);
    timer = setInterval(function(){
      const p = Math.min(100, (Date.now() - t0) / dur * 100);
      if(fill) fill.style.width = p + '%';
      if(p >= 100){ clearInterval(timer); next(); }
    }, 60);
  }

  function next(){
    clearInterval(timer);
    idx++;
    if(idx >= group.items.length) close(); else draw();
  }

  function prev(){
    clearInterval(timer);
    if(idx > 0){ idx--; draw(); }
  }

  function close(){
    clearInterval(timer);
    v.remove();
  }

  draw();
}

function showViewers(storyId){
  api('/api/story-stat?story_id=' + storyId).then(function(d){
    if(!d.ok) return;
    const list = d.stat.viewers || [];
    const bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.style.zIndex = '6100';
    bg.innerHTML = '<div class="sheet" id="vwSheet" style="max-height:70vh;">' +
      '<div class="sheet-bar"></div>' +
      '<div class="sheet-title">' + d.stat.views + ' korish · ' + d.stat.likes + ' layk</div>' +
      '<div style="padding-bottom:16px;">' +
      (list.length
        ? list.map(function(u){
            return '<div class="chat-row"><div class="chat-ava">' +
              '<img src="https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(u.name) + '"></div>' +
              '<div class="ci"><b>' + esc(u.name) + '</b></div>' +
              (u.liked ? '<span style="font-size:18px;">&#10084;&#65039;</span>' : '') + '</div>';
          }).join('')
        : '<div class="empty" style="padding:40px 10px;"><span>Hali hech kim kormagan</span></div>') +
      '</div></div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
    el('vwSheet').addEventListener('click', function(e){ e.stopPropagation(); });
  }).catch(function(){});
}

// ---------- Ko'rilgan storieslar ----------
function seenStore(){
  try { return JSON.parse(localStorage.getItem('ni_story_seen')) || {}; }
  catch(e){ return {}; }
}

function isStorySeen(id){
  return !!seenStore()[id];
}

function markStorySeen(id){
  const s = seenStore();
  s[id] = 1;
  try { localStorage.setItem('ni_story_seen', JSON.stringify(s)); } catch(e){}
}
