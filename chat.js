(function(){
  'use strict';

  var CHAT_OPEN = false;
  var CHAT_LAST = 0;
  var CHAT_TIMER = null;
  var CHAT_AZO = false;

  function cEl(id){ return document.getElementById(id); }

  function cEsc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  function cAuth(){
    var p = [];
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      if(tg && tg.initData) p.push('init_data=' + encodeURIComponent(tg.initData));
    } catch(e){}
    try {
      var t = localStorage.getItem('ni_token');
      if(t) p.push('token=' + encodeURIComponent(t));
    } catch(e){}
    return p.join('&');
  }

  function cBody(extra){
    var b = extra || {};
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      if(tg && tg.initData) b.init_data = tg.initData;
    } catch(e){}
    try {
      var t = localStorage.getItem('ni_token');
      if(t) b.token = t;
    } catch(e){}
    return b;
  }

  var CAPI = (typeof API !== 'undefined' && API) ? API : 'https://namangan-ijara-bot.onrender.com';

  function cGet(path){
    return fetch(CAPI + path + (path.indexOf('?') === -1 ? '?' : '&') + cAuth())
      .then(function(r){ return r.json(); });
  }

  function cPost(path, body){
    return fetch(CAPI + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cBody(body))
    }).then(function(r){ return r.json(); });
  }

  function buildUI(){
    if(cEl('chatWrap')) return;

    var w = document.createElement('div');
    w.id = 'chatWrap';
    w.innerHTML =
      '<button id="chatFab" class="chat-fab">' +
        '<span class="chat-fab-ic">&#128172;</span>' +
        '<span class="chat-badge" id="chatBadge" hidden>0</span>' +
      '</button>' +
      '<div class="chat-panel" id="chatPanel" hidden>' +
        '<div class="chat-head">' +
          '<button class="chat-x" id="chatClose">&times;</button>' +
          '<div class="chat-title">Umumiy chat</div>' +
          '<div class="chat-sub"><span id="chatJami">0</span> a\'zo &middot; ' +
            '<span class="chat-dot"></span><span id="chatOnline">0</span> onlayn</div>' +
        '</div>' +
        '<div class="chat-body" id="chatBody"></div>' +
        '<div class="chat-join" id="chatJoin" hidden>' +
          '<p>Yozish uchun chatga a\'zo bo\'ling</p>' +
          '<button class="chat-join-btn" id="chatJoinBtn">A\'zo bo\'lish</button>' +
        '</div>' +
        '<div class="chat-input" id="chatInput" hidden>' +
          '<button class="chat-emo" id="chatEmo">&#128512;</button>' +
          '<input type="text" id="chatText" placeholder="Xabar yozing..." maxlength="500">' +
          '<button class="chat-send" id="chatSend">&#10148;</button>' +
        '</div>' +
        '<div class="chat-emo-box" id="chatEmoBox" hidden></div>' +
      '</div>';

    document.body.appendChild(w);

    var emos = ['😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','🔥','💯',
                '🎉','❤️','🙏','👏','💪','🤝','✅','❌','⭐','💰','🏠','🚗'];
    cEl('chatEmoBox').innerHTML = emos.map(function(e){
      return '<button class="chat-emo-i">' + e + '</button>';
    }).join('');

    cEl('chatFab').addEventListener('click', openChat);
    cEl('chatClose').addEventListener('click', closeChat);
    cEl('chatJoinBtn').addEventListener('click', joinChat);
    cEl('chatSend').addEventListener('click', sendMsg);
    cEl('chatText').addEventListener('keypress', function(e){
      if(e.key === 'Enter') sendMsg();
    });
    cEl('chatEmo').addEventListener('click', function(){
      var b = cEl('chatEmoBox');
      b.hidden = !b.hidden;
    });
    cEl('chatEmoBox').addEventListener('click', function(e){
      if(e.target.classList.contains('chat-emo-i')){
        cEl('chatText').value += e.target.textContent;
        cEl('chatText').focus();
      }
    });
  }

  function openChat(){
    CHAT_OPEN = true;
    cEl('chatPanel').hidden = false;
    cEl('chatFab').style.display = 'none';
    loadMsgs(true);
    if(CHAT_TIMER) clearInterval(CHAT_TIMER);
    CHAT_TIMER = setInterval(function(){ loadMsgs(false); }, 4000);
  }

  function closeChat(){
    CHAT_OPEN = false;
    cEl('chatPanel').hidden = true;
    cEl('chatFab').style.display = '';
    if(CHAT_TIMER){ clearInterval(CHAT_TIMER); CHAT_TIMER = null; }
    checkStatus();
  }

  function joinChat(){
    cEl('chatJoinBtn').disabled = true;
    cPost('/api/chat-azo', {}).then(function(d){
      if(d && d.ok){
        CHAT_AZO = true;
        cEl('chatJoin').hidden = true;
        cEl('chatInput').hidden = false;
        loadMsgs(true);
      } else {
        cEl('chatJoinBtn').disabled = false;
      }
    }).catch(function(){ cEl('chatJoinBtn').disabled = false; });
  }

  function renderMsg(m, myId){
    var mine = (String(m.tg_id) === String(myId));
    var av = m.avatar
      ? '<img class="chat-av" src="' + cEsc(m.avatar) + '">'
      : '<div class="chat-av chat-av-l">' + cEsc((m.ism || '?').charAt(0)) + '</div>';
    var t = '';
    try {
      var d = new Date(m.vaqt.replace(' ', 'T') + 'Z');
      t = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    } catch(e){}

    return '<div class="chat-m' + (mine ? ' me' : '') + '" data-id="' + m.id + '">' +
      (mine ? '' : av) +
      '<div class="chat-bub">' +
        (mine ? '' : '<div class="chat-n">' + cEsc(m.ism) + '</div>') +
        '<div class="chat-t">' + cEsc(m.matn) + '</div>' +
        '<div class="chat-time">' + t + '</div>' +
      '</div></div>';
  }

  function loadMsgs(scrollEnd){
    var myId = null;
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      myId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
    } catch(e){}

    cGet('/api/chat-holat').then(function(h){
      if(!h || !h.ok) return;
      CHAT_AZO = !!h.azo;
      cEl('chatJami').textContent = h.jami || 0;
      cEl('chatOnline').textContent = h.onlayn || 0;
      cEl('chatJoin').hidden = CHAT_AZO;
      cEl('chatInput').hidden = !CHAT_AZO;

      var from = scrollEnd ? Math.max(0, (h.oxirgi_oqilgan || 0) - 20) : CHAT_LAST;
      return cGet('/api/chat-xabarlar&oxirgi=' + from + '&limit=50');
    }).then(function(d){
      if(!d || !d.ok || !d.xabarlar) return;
      var body = cEl('chatBody');
      if(scrollEnd) body.innerHTML = '';

      d.xabarlar.forEach(function(m){
        if(m.id > CHAT_LAST) CHAT_LAST = m.id;
        if(!body.querySelector('[data-id="' + m.id + '"]')){
          body.insertAdjacentHTML('beforeend', renderMsg(m, myId));
        }
      });

      if(d.xabarlar.length){
        body.scrollTop = body.scrollHeight;
        cPost('/api/chat-oqildi', { id: CHAT_LAST });
      }
    }).catch(function(){});
  }

  function sendMsg(){
    var inp = cEl('chatText');
    var v = inp.value.trim();
    if(!v) return;
    inp.value = '';
    cEl('chatEmoBox').hidden = true;

    cPost('/api/chat-yuborish', { matn: v }).then(function(d){
      if(d && d.ok){
        loadMsgs(false);
      } else if(d && d.error === 'havola'){
        alert('Havola yuborish mumkin emas');
      } else if(d && d.error === 'azo_emas'){
        cEl('chatJoin').hidden = false;
        cEl('chatInput').hidden = true;
      }
    }).catch(function(){});
  }

  function checkStatus(){
    cGet('/api/chat-holat').then(function(d){
      if(!d || !d.ok) return;
      var b = cEl('chatBadge');
      if(!b) return;
      if(d.oqilmagan > 0){
        b.textContent = d.oqilmagan > 99 ? '99+' : d.oqilmagan;
        b.hidden = false;
      } else {
        b.hidden = true;
      }
    }).catch(function(){});
  }

  function init(){
    buildUI();
    checkStatus();
    setInterval(function(){ if(!CHAT_OPEN) checkStatus(); }, 20000);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
