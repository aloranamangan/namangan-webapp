// ---------- Reklama ----------
let ADS_CACHE = null;
let ADS_CLOSED = {};

try { ADS_CLOSED = JSON.parse(localStorage.getItem('ni_ads_closed')) || {}; } catch(e){}

function loadAds(place, cb){
  if(ADS_CACHE && ADS_CACHE[place]){ cb(ADS_CACHE[place]); return; }
  api('/api/reklama?place=' + place).then(function(d){
    let list = (d.ads || []).filter(function(a){ return !ADS_CLOSED[a.id]; });
    if(!ADS_CACHE) ADS_CACHE = {};
    ADS_CACHE[place] = list;
    cb(list);
  }).catch(function(){ cb([]); });
}

function adHTML(a){
  const u = a.file_id ? mediaUrl(a.file_id) : '';
  const media = a.is_video
    ? '<video class="ad-media" src="' + u + '" muted loop playsinline autoplay></video>'
    : '<img class="ad-media" src="' + u + '">';

  return '<article class="post ad-post" data-ad="' + a.id + '">' +
    '<div class="ad-lbl">REKLAMA</div>' +
    '<button class="ad-x" data-x="' + a.id + '">&times;</button>' +
    media +
    '<div class="ad-body">' +
      '<b>' + esc(a.title) + '</b>' +
      (a.text ? '<p>' + esc(a.text) + '</p>' : '') +
      (a.owner_id
        ? '<button class="ad-go ad-prof" data-prof="' + a.owner_id + '">\uD83D\uDC64 Profilni ko\'rish</button>'
        : '') +
      (a.btn_url ? '<button class="ad-go" data-go="' + a.id + '">' +
        esc(a.btn_text || 'Batafsil') + '</button>' : '') +
    '</div></article>';
}

function bindAd(node, a){
  apiPost('/api/reklama-amal', { action: 'view', id: a.id }).catch(function(){});

  const x = node.querySelector('[data-x]');
  if(x) x.addEventListener('click', function(e){
    e.stopPropagation();
    ADS_CLOSED[a.id] = 1;
    try { localStorage.setItem('ni_ads_closed', JSON.stringify(ADS_CLOSED)); } catch(e){}
    node.style.transition = 'opacity .3s,height .3s';
    node.style.opacity = '0';
    setTimeout(function(){ node.remove(); }, 320);
  });

  function open(){
    if(!a.btn_url) return;
    apiPost('/api/reklama-amal', { action: 'click', id: a.id }).catch(function(){});
    haptic('light');
    const u = a.btn_url;
    if(u.indexOf('t.me') !== -1 && TG && TG.openTelegramLink) TG.openTelegramLink(u);
    else if(TG && TG.openLink) TG.openLink(u);
    else window.open(u, '_blank');
  }

  function openProf(){
    apiPost('/api/reklama-amal', { action: 'click', id: a.id }).catch(function(){});
    haptic('light');
    if(a.owner_id && typeof openUserProfile === 'function'){
      openUserProfile(a.owner_id, a.owner_username || null);
    }
  }

  const m = node.querySelector('.ad-media');
  if(m) m.addEventListener('click', open);
  const g = node.querySelector('[data-go]:not(.ad-prof)');
  if(g) g.addEventListener('click', function(e){ e.stopPropagation(); open(); });

  const pf = node.querySelector('.ad-prof');
  if(pf) pf.addEventListener('click', function(e){ e.stopPropagation(); openProf(); });
}

// Lentaga reklama joylash (har N postdan keyin)
function injectAds(container, place, every){
  every = every || 5;
  loadAds(place, function(list){
    if(!list.length) return;
    const posts = container.querySelectorAll('.post:not(.ad-post)');
    let ai = 0;
    for(let i = every - 1; i < posts.length; i += every){
      if(ai >= list.length) ai = 0;
      const a = list[ai++];
      const div = document.createElement('div');
      div.innerHTML = adHTML(a);
      const node = div.firstChild;
      posts[i].after(node);
      bindAd(node, a);
    }
  });
}
