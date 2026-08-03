// TODO: bu massivlarni botingiz backendidan (aiogram/SQLite) keladigan
// haqiqiy JSON bilan almashtiring — masalan fetch('/api/sellers') orqali.
let svSellers = [];
const SV_SELLERS_KEY = 'sv_sellers_list';

function svSaveSellers(){
  const val = JSON.stringify(svSellers);
  const cs = window.Telegram?.WebApp?.CloudStorage;
  if(cs){ cs.setItem(SV_SELLERS_KEY, val, ()=>{}); }
  else { try { localStorage.setItem(SV_SELLERS_KEY, val); } catch(e){} }
}

function svLoadSellers(cb){
  const cs = window.Telegram?.WebApp?.CloudStorage;
  if(cs){
    cs.getItem(SV_SELLERS_KEY, (err, value)=>{
      if(!err && value){ try { svSellers = JSON.parse(value) || []; } catch(e){} }
      if(cb) cb();
    });
  } else {
    try { svSellers = JSON.parse(localStorage.getItem(SV_SELLERS_KEY)) || []; } catch(e){ svSellers = []; }
    if(cb) cb();
  }
}

let svListings = [];

let svLikedPosts = {};
let svCurrentPostId = null;

function svFmt(n){ return n.toLocaleString('ru-RU'); }

function svFmtShort(n){
  if(n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'mln';
  if(n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'ming';
  return String(n);
}

function svShuffle(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let svLastPanel = 'rank';
let svPickerMode = false;
let svSelectedTarget = null;

function svLoadSellersFromServer(cb){
  fetch('https://namangan-ijara-bot.onrender.com/api/maklerlar')
    .then(r => r.json())
    .then(d => {
      if(d.ok && Array.isArray(d.maklers)){
        svSellers = d.maklers.map(m => ({
          id: m.tg_id || Math.abs(hashCode(m.username)),
          name: m.name || m.username,
          username: m.username,
          phone: m.phone || '',
          roles: m.roles || [],
          obuna: 0, following: 0, posts: 0, elon: 0, korish: 0, sotuv: 0,
          verified: false,
          avatar: 'https://picsum.photos/seed/' + encodeURIComponent(m.username) + '/200',
          approved: true
        }));
      }
      if(cb) cb();
    })
    .catch(e => { console.warn('Maklerlarni yuklashda xato:', e); if(cb) cb(); });
}

function hashCode(s){
  let h = 0;
  for(let i = 0; i < (s||'').length; i++){ h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}

function svRenderRank(){
  svMergeMyProfile();
  let sorted = [...svSellers].sort((a,b)=> b.obuna - a.obuna);
  if(svMyProfile){
    sorted = sorted.filter(s => s.id !== svMyProfile.id);
    sorted.unshift(svMyProfile);
  }
  document.getElementById('svRankCount').textContent = sorted.length + " ta profil";
  document.getElementById('svRankList').innerHTML = sorted.map((s,i)=>{
    const rankClass = i===0?'sv-top1':i===1?'sv-top2':i===2?'sv-top3':'';
    const isMe = svMyProfile && s.id === svMyProfile.id;
    const topPill = (i<3 && !isMe) ? '<div class="sv-top-pill">TOP</div>' : (isMe ? '<div class="sv-me-pill">SIZ</div>' : '');
    const check = s.verified ? `<span class="sv-badge-check"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : '';
    return `
    <div class="sv-seller-row ${rankClass} ${isMe ? 'sv-me' : ''}" onclick="svOpenProfile(${s.id})">
      ${topPill}
      <div class="sv-rank-tile">${i+1}</div>
      <img class="sv-avatar" src="${s.avatar}">
      <div class="sv-seller-info">
        <div class="sv-seller-name">${s.name} ${check}</div>
        <div class="sv-seller-meta">
          <span>${svFmt(s.obuna)} obunachi</span>
          <span>${svFmt(s.posts)} post</span>
        </div>
        ${svRoleBadges(s)}
      </div>
      ${(!isMe && s.username) ? svSubBtnHTML(s.username) : ''}
    </div>`;
  }).join('');
}

function svItemHTML(l){
  const media = (l.video && l.videoUrl)
    ? `<video muted loop playsinline preload="metadata" poster="${l.img}" src="${l.videoUrl}"></video><div class="sv-video-progress"><i></i></div>`
    : `<img src="${l.img}" loading="lazy">`;
  const flag = l.video ? '<svg class="sv-video-flag" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>' : '';
  return `<div class="sv-explore-item" onclick="svOpenPost(${l.id})">${media}${flag}<div class="sv-price-tag">${l.price}</div></div>`;
}

function svRenderGrid(containerId, items){
  const grid = document.getElementById(containerId);
  grid.innerHTML = items.map(svItemHTML).join('');
  svObserveVideos(grid);
}

function svObserveVideos(container){
  const videos = container.querySelectorAll('video');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const v = entry.target;
      if(entry.isIntersecting){ v.play().catch(()=>{}); } else { v.pause(); }
    });
  }, {threshold:0.6});
  videos.forEach(v=>{
    io.observe(v);
    const bar = v.parentElement.querySelector('.sv-video-progress i');
    if(bar){
      v.addEventListener('timeupdate', ()=>{
        if(v.duration) bar.style.width = (v.currentTime / v.duration * 100) + '%';
      });
    }
  });
}

function svRenderSearch(){ svRenderGrid('svSearchGrid', svShuffle(svListings)); }

function svRenderComments(l){
  const box = document.getElementById('svCommentList');
  if(!l.comments.length){
    box.innerHTML = `<div class="sv-comment-empty">Hali komentariya yo'q. Birinchi bo'ling!</div>`;
    return;
  }
  box.innerHTML = l.comments.map(c => `
    <div class="sv-comment-item">
      <img class="sv-comment-avatar" src="https://picsum.photos/seed/${encodeURIComponent(c.name)}/60">
      <div><b>${c.name}</b><br><span class="sv-comment-text">${c.text}</span></div>
    </div>
  `).join('');
}

function svOpenPost(postId){
  const l = svListings.find(x => x.id === postId);
  if(!l) return;
  const s = svSellers.find(x => x.id === l.seller);
  svCurrentPostId = postId;

  const media = (l.video && l.videoUrl)
    ? `<video muted loop playsinline autoplay controls poster="${l.img}" src="${l.videoUrl}"></video>`
    : `<img src="${l.img}">`;
  document.getElementById('svPostMedia').innerHTML = media;

  document.getElementById('svPostAvatar').src = s ? s.avatar : '';
  document.getElementById('svPostSellerName').textContent = s ? s.name : "Noma'lum";
  document.getElementById('svPostSellerRow').onclick = () => { if(s) svOpenProfile(s.id); };

  document.getElementById('svPostPrice').textContent = l.price;
  document.getElementById('svPostViews').textContent = `${svFmtShort(l.views)} ko'rish`;
  document.getElementById('svLikeCount').textContent = svFmt(l.likes);
  document.getElementById('svCommentCount').textContent = svFmt(l.comments.length);
  document.getElementById('svRepostCount').textContent = svFmt(l.reposts);

  const likeBtn = document.getElementById('svLikeBtn');
  likeBtn.classList.toggle('liked', !!svLikedPosts[postId]);

  const saveBtn = document.getElementById('svSaveBtn');
  if(saveBtn) saveBtn.classList.toggle('saved', svFavorites.includes(postId));

  svRenderComments(l);
  svCloseAllViews();
  document.getElementById('svPostView').hidden = false;
}

function svToggleLike(){
  const l = svListings.find(x => x.id === svCurrentPostId);
  if(!l) return;
  const liked = !!svLikedPosts[svCurrentPostId];
  svLikedPosts[svCurrentPostId] = !liked;
  l.likes += liked ? -1 : 1;
  document.getElementById('svLikeCount').textContent = svFmt(l.likes);
  document.getElementById('svLikeBtn').classList.toggle('liked', !liked);
}

function svAddComment(){
  const l = svListings.find(x => x.id === svCurrentPostId);
  const input = document.getElementById('svCommentInput');
  const text = input.value.trim();
  if(!l || !text) return;

  const me = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Siz';
  l.comments.push({ name: me, text });
  input.value = '';
  document.getElementById('svCommentCount').textContent = svFmt(l.comments.length);
  svRenderComments(l);

  // TODO: haqiqiy botga ulash uchun shu yerga fetch/POST qo'shing:
  // fetch('https://your-bot-api.example/comment', {method:'POST', body: JSON.stringify({postId:l.id, name:me, text})});
}

function svRepost(){
  const l = svListings.find(x => x.id === svCurrentPostId);
  if(!l) return;
  l.reposts += 1;
  document.getElementById('svRepostCount').textContent = svFmt(l.reposts);
  alert("Repost qilindi ✅");
}

function svSelectComplaintTarget(s){
  svSelectedTarget = s;
  svPickerMode = false;

  const picker = document.getElementById('svTargetPicker');
  picker.innerHTML = `
    <span class="sv-target-chip">
      <img class="sv-target-avatar" src="${s.avatar}">
      <span class="sv-target-name">@${s.name}</span>
    </span>`;
  document.getElementById('svTargetSellerId').value = s.id;

  document.getElementById('sellersView').hidden = true;
  document.getElementById('svRankTitle').textContent = 'Sotuvchilar';
  document.getElementById('svComplaintView').hidden = false;
}

function svOpenProfile(sellerId){
  const s = svSellers.find(x=>x.id===sellerId);
  if(!s) return;

  if(svPickerMode){
    svSelectComplaintTarget(s);
    return;
  }

  document.getElementById('svPAvatar').src = s.avatar;
  document.getElementById('svPName').innerHTML = s.name + (s.verified ? ` <span class="sv-badge-check"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : '');
  document.getElementById('svPId').textContent = 'ID: ' + s.id;

  document.getElementById('svPPosts').textContent = svFmt(s.posts);
  document.getElementById('svPFollowers').textContent = svFmt(s.obuna);
  document.getElementById('svPFollowing').textContent = svFmt(s.following);

  document.getElementById('svPElon').textContent = svFmt(s.elon);
  document.getElementById('svPKorish').textContent = (s.korish/1000000).toFixed(1)+' mln';
  document.getElementById('svPObuna').textContent = svFmt(s.obuna);
  document.getElementById('svPSotuv').textContent = svFmt(s.sotuv);

  svRenderGrid('svPListings', svListings.filter(l=>l.seller===sellerId));
  svCloseAllViews();
  document.getElementById('svProfileView').hidden = false;
}


// ---------- Sevimlilar (Telegram CloudStorage) ----------
const SV_FAV_KEY = 'sv_favorites';
let svFavorites = [];

function svLoadFavorites(){
  const cs = window.Telegram?.WebApp?.CloudStorage;
  if(cs){
    cs.getItem(SV_FAV_KEY, (err, value)=>{
      if(!err && value){
        try { svFavorites = JSON.parse(value) || []; } catch(e){ svFavorites = []; }
      }
    });
  } else {
    try { svFavorites = JSON.parse(sessionStorage.getItem(SV_FAV_KEY)) || []; } catch(e){ svFavorites = []; }
  }
}

function svPersistFavorites(){
  const val = JSON.stringify(svFavorites);
  const cs = window.Telegram?.WebApp?.CloudStorage;
  if(cs){
    cs.setItem(SV_FAV_KEY, val, ()=>{});
  } else {
    try { sessionStorage.setItem(SV_FAV_KEY, val); } catch(e){}
  }
}

function svToggleSave(){
  if(svCurrentPostId === null) return;
  const idx = svFavorites.indexOf(svCurrentPostId);
  if(idx === -1){ svFavorites.push(svCurrentPostId); }
  else { svFavorites.splice(idx, 1); }
  svPersistFavorites();
  document.getElementById('svSaveBtn').classList.toggle('saved', idx === -1);
}

function svRenderFavorites(){
  const items = svListings.filter(l => svFavorites.includes(l.id));
  const empty = document.getElementById('svFavEmpty');
  const grid = document.getElementById('svFavGrid');
  if(!items.length){
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  svRenderGrid('svFavGrid', items);
}

function svSetActiveNav(name){
  document.querySelectorAll('.sv-nav-item').forEach(b=>{
    b.classList.toggle('active', b.dataset.svNav === name);
  });
}

function svCloseAllViews(){
  document.getElementById('sellersView').hidden = true;
  document.getElementById('svSearchView').hidden = true;
  document.getElementById('svProfileView').hidden = true;
  document.getElementById('svComplaintView').hidden = true;
  const postView = document.getElementById('svPostView');
  if(postView) postView.hidden = true;
  const favView = document.getElementById('svFavView');
  if(favView) favView.hidden = true;
  const regView = document.getElementById('svRegView');
  if(regView) regView.hidden = true;
}

document.addEventListener('DOMContentLoaded', ()=>{
  svLoadSellers(()=>{ svMergeMyProfile(); });
  setTimeout(svRestoreProfileFromServer, 300);
  document.querySelectorAll('.sv-nav-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const target = btn.dataset.svNav;
      svSetActiveNav(target);
      svCloseAllViews();

      if(target === 'sellers'){
        document.getElementById('sellersView').hidden = false;
        svRenderRank();
        svLoadSellersFromServer(() => { svRenderRank(); svLoadSubStates(() => svRenderRank()); });
      } else if(target === 'search'){
        document.getElementById('svSearchView').hidden = false;
        svRenderSearch();
      } else if(target === 'complaint'){
        document.getElementById('svComplaintView').hidden = false;
        document.getElementById('svComplaintForm').hidden = false;
        document.getElementById('svComplaintSuccess').style.display = 'none';
      } else if(target === 'favorites'){
        document.getElementById('svFavView').hidden = false;
        svRenderFavorites();
      } else if(target === 'profile'){
        const pBtn = document.getElementById('profileBtn');
        if(pBtn) pBtn.click();
        svRefreshRegisterView();
      } else if(target === 'add' || target === 'messages'){
        alert("Tez orada qo'shiladi");
      }
    });
  });

  document.getElementById('svClose').addEventListener('click', ()=>{
    document.getElementById('sellersView').hidden = true;
    document.getElementById('svRankTitle').textContent = 'Sotuvchilar';
    if(svPickerMode){
      svPickerMode = false;
      document.getElementById('svComplaintView').hidden = false;
    } else {
      svSetActiveNav('home');
    }
  });

  document.getElementById('svTargetPicker').addEventListener('click', ()=>{
    svPickerMode = true;
    document.getElementById('svComplaintView').hidden = true;
    document.getElementById('svRankTitle').textContent = 'Kimga shikoyat qilyapsiz?';
    document.getElementById('sellersView').hidden = false;
    svRenderRank();
  });

  document.getElementById('svSearchClose').addEventListener('click', ()=>{
    document.getElementById('svSearchView').hidden = true;
    svSetActiveNav('home');
  });

  document.getElementById('svProfileClose').addEventListener('click', ()=>{
    document.getElementById('svProfileView').hidden = true;
  });

  document.getElementById('svComplaintClose').addEventListener('click', ()=>{
    document.getElementById('svComplaintView').hidden = true;
    svSetActiveNav('home');
  });

  const nativeProfileClose = document.getElementById('profileClose');
  if(nativeProfileClose){
    nativeProfileClose.addEventListener('click', ()=> svSetActiveNav('home'));
  }

  document.getElementById('svPostBack').addEventListener('click', ()=>{
    document.getElementById('svPostView').hidden = true;
    const media = document.getElementById('svPostMedia').querySelector('video');
    if(media) media.pause();
  });

  svLoadFavorites();

  document.getElementById('svFavClose').addEventListener('click', ()=>{
    document.getElementById('svFavView').hidden = true;
    svSetActiveNav('home');
  });

  const saveBtnEl = document.getElementById('svSaveBtn');
  if(saveBtnEl) saveBtnEl.addEventListener('click', svToggleSave);

  document.getElementById('svLikeBtn').addEventListener('click', svToggleLike);
  document.getElementById('svRepostBtn').addEventListener('click', svRepost);
  document.getElementById('svCommentSendBtn').addEventListener('click', svAddComment);
  document.getElementById('svCommentFocusBtn').addEventListener('click', ()=>{
    document.getElementById('svCommentInput').focus();
  });
  document.getElementById('svCommentInput').addEventListener('keypress', (e)=>{
    if(e.key === 'Enter') svAddComment();
  });

  document.getElementById('svSearchInput').addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    const filtered = q ? svListings.filter(l=>{
      const s = svSellers.find(x=>x.id===l.seller);
      return s && s.name.toLowerCase().includes(q);
    }) : svShuffle(svListings);
    svRenderGrid('svSearchGrid', filtered);
  });

  document.getElementById('svComplaintForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const reason = document.getElementById('svComplaintReason').value;
    const text = document.getElementById('svComplaintText').value.trim();

    if(!svSelectedTarget){
      alert("Iltimos, avval kim ustidan shikoyat qilayotganingizni tanlang (@ Tanlang)");
      return;
    }
    if(!reason || !text) return;

    const payload = {
      reason,
      text,
      target: { id: svSelectedTarget.id, name: svSelectedTarget.name },
      user: window.Telegram?.WebApp?.initDataUnsafe?.user || null
    };

    // TODO: haqiqiy botga ulash uchun shu yerga fetch/POST qo'shing:
    // fetch('https://your-bot-api.example/complaint', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    console.log('Shikoyat:', payload);

    document.getElementById('svComplaintForm').hidden = true;
    document.getElementById('svComplaintSuccess').style.display = 'block';
    document.getElementById('svComplaintForm').reset();

    document.getElementById('svTargetPicker').innerHTML = '<span class="sv-target-placeholder" id="svTargetPlaceholder">@ Tanlang</span>';
    svSelectedTarget = null;
  });
});

// ---------- Makler ro'yxatdan o'tish ----------
const SV_ME_KEY = 'sv_my_profile';
const SV_PLANS = [
  { id: '1m', months: 1, price: 100000, label: '1 oy' },
  { id: '2m', months: 2, price: 200000, label: '2 oy' },
  { id: '3m', months: 3, price: 280000, label: '3 oy', discount: 20000, badge: 'CHEGIRMA' }
];

function svPaidDaysLeft(){
  if(!svMyProfile || !svMyProfile.paidUntil) return 0;
  const left = (svMyProfile.paidUntil - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(left));
}

function svPlansHTML(){
  return '<div class="sv-plans">' + SV_PLANS.map(p => `
    <button type="button" class="sv-plan" data-plan="${p.id}">
      ${p.badge ? `<span class="sv-plan-badge">${p.badge}</span>` : ''}
      <span class="sv-plan-label">${p.label}</span>
      <span class="sv-plan-price">${p.price.toLocaleString('ru-RU')}</span>
      <span class="sv-plan-cur">so'm</span>
      ${p.discount ? `<span class="sv-plan-save">${p.discount.toLocaleString('ru-RU')} tejaysiz</span>` : ''}
    </button>`).join('') + '</div>';
}

function svBindPlanButtons(){
  document.querySelectorAll('.sv-plan').forEach(btn => {
    btn.addEventListener('click', () => svRequestSocialPayment(btn.dataset.plan));
  });
}
let svMyProfile = null;
let svPhotoData = null;

function svLoadMyProfile(){
  const cs = window.Telegram?.WebApp?.CloudStorage;
  if(cs){
    cs.getItem(SV_ME_KEY, (err, value)=>{
      if(!err && value){
        try { svMyProfile = JSON.parse(value); } catch(e){ svMyProfile = null; }
      }
      svMergeMyProfile();
      svRefreshRegisterView();
    });
  } else {
    try { svMyProfile = JSON.parse(sessionStorage.getItem(SV_ME_KEY)); } catch(e){ svMyProfile = null; }
    svMergeMyProfile();
    svRefreshRegisterView();
  }
}

function svPersistMyProfile(){
  const val = JSON.stringify(svMyProfile);
  const cs = window.Telegram?.WebApp?.CloudStorage;
  if(cs){ cs.setItem(SV_ME_KEY, val, ()=>{}); }
  else { try { sessionStorage.setItem(SV_ME_KEY, val); } catch(e){} }
}


function svRoleBadges(s){
  if(!s.roles || !s.roles.length) return '';
  return '<div class="sv-role-row">' + s.roles.map(r => {
    const cls = r === 'sotuvchi' ? 'sv-role-sell' : 'sv-role-rent';
    const label = r === 'sotuvchi' ? 'Sotuvchi' : 'Ijarachi';
    return `<span class="sv-role-badge ${cls}">${label}</span>`;
  }).join('') + '</div>';
}

function svMergeMyProfile(){
  if(!svMyProfile) return;
  if(!svMyProfile.approved){
    const i = svSellers.findIndex(s => s.id === svMyProfile.id);
    if(i !== -1) svSellers.splice(i, 1);
    return;
  }
  if(!svMyProfile.createdAt){
    svMyProfile.createdAt = Date.now();
    svPersistMyProfile();
  }
  if(!svSellers.some(s => s.id === svMyProfile.id)) svSellers.push(svMyProfile);
  svSaveSellers();
}

function svCheckMaklerStatus(){
  if(!svMyProfile || svMyProfile.approved) return;
  fetch('https://namangan-ijara-bot.onrender.com/api/makler-holat?username=' + encodeURIComponent(svMyProfile.username))
    .then(r => r.json())
    .then(d => {
      if(d.status === 'approved'){
        svMyProfile.approved = true;
        svPersistMyProfile();
        svMergeMyProfile();
        svRefreshRegisterView();
        alert("🎉 Tabriklaymiz! Profilingiz tasdiqlandi.");
      }
    })
    .catch(e => console.warn('Holat tekshirishda xato:', e));
}

function svRefreshRegisterView(){
  const form = document.getElementById('svRegForm');
  const done = document.getElementById('svRegDone');
  if(!form || !done) return;

  const pending = document.getElementById('svRegPending');

  const igBox = document.getElementById('svMaklerBox');
  if(igBox && igBox.querySelector('.sv-ig-head')) return;

  if(svMyProfile && !svMyProfile.approved){
    svCheckMaklerStatus();
    fetch(SV_API + '/api/makler-holat?username=' + encodeURIComponent(svMyProfile.username))
      .then(r => r.json())
      .then(d => {
        if(d.status === 'approved' && svMyProfile && !svMyProfile.approved){
          svMyProfile.approved = true;
          svPersistMyProfile();
          svRefreshRegisterView();
        }
      }).catch(()=>{});
    form.hidden = true;
    if(pending) pending.hidden = false;
    done.hidden = true;
    return;
  }

  if(svMyProfile){
    form.hidden = true;
    if(pending) pending.hidden = true;
    done.hidden = false;
    document.getElementById('svRegDoneAvatar').src = svMyProfile.avatar || '';
    document.getElementById('svRegDoneName').textContent = svMyProfile.name;
    document.getElementById('svRegDoneUser').textContent = '@' + svMyProfile.username;
    document.getElementById('svRegDonePhone').textContent = svMyProfile.phone;
    svRenderSocialSection();

    if(!document.getElementById('svDeleteBtn')){
      const btn = document.createElement('button');
      btn.id = 'svDeleteBtn';
      btn.className = 'sv-delete-btn';
      btn.textContent = "🗑 Profilni o'chirish";
      btn.addEventListener('click', svDeleteMyProfile);
      done.appendChild(btn);
    }
  } else {
    form.hidden = false;
    done.hidden = true;
  }
}

function svRenderSocialSection(){
  const box = document.getElementById('svSocialBox');
  if(!box || !svMyProfile) return;

  const paidLeft = svPaidDaysLeft();
  const trialLeft = svTrialDaysLeft();

  if(!svHasSocialAccess()){
    box.innerHTML = `
      <div class="sv-social-locked">
        <div class="sv-lock-icon">🔒</div>
        <p>Muddat tugadi</p>
        <span>Ijtimoiy tarmoq havolalaringiz vaqtincha yashirildi. Tarifni tanlab qayta faollashtiring.</span>
      </div>` + svPlansHTML();
    svBindPlanButtons();
    return;
  }

  let banner = '';
  if(paidLeft > 0){
    banner = `<div class="sv-trial-banner sv-trial-paid">
      <b>✅ Faol obuna: ${paidLeft} kun qoldi</b>
      <span>Havolalaringiz ko'rinib turibdi.</span>
    </div>`;
  } else {
    const urgent = trialLeft <= 3 ? ' sv-trial-urgent' : '';
    banner = `<div class="sv-trial-banner${urgent}">
      <b>🎁 Bepul sinov: ${trialLeft} kun qoldi</b>
      <span>Muddat tugagach havolalar yashiriladi. Quyidan tarif tanlab davom ettiring.</span>
    </div>`;
  }

  const s = svMyProfile.socials || {};
  box.innerHTML = banner + `
    <label class="sv-field-label">Instagram</label>
    <input class="sv-select" id="svSocInstagram" placeholder="@username" value="${s.instagram || ''}">
    <label class="sv-field-label">Telegram</label>
    <input class="sv-select" id="svSocTelegram" placeholder="@username" value="${s.telegram || ''}">
    <label class="sv-field-label">YouTube</label>
    <input class="sv-select" id="svSocYoutube" placeholder="Kanal havolasi" value="${s.youtube || ''}">
    <label class="sv-field-label">Telegram kanal</label>
    <input class="sv-select" id="svSocChannel" placeholder="@kanal_nomi" value="${s.channel || ''}">
    <button class="sv-submit-btn" id="svSaveSocialBtn">Saqlash</button>
    <label class="sv-field-label" style="margin-top:20px;">Tarif tanlash</label>` + svPlansHTML();

  const saveBtn = document.getElementById('svSaveSocialBtn');
  if(saveBtn){
    saveBtn.addEventListener('click', ()=>{
      svMyProfile.socials = {
        instagram: document.getElementById('svSocInstagram').value.trim(),
        telegram: document.getElementById('svSocTelegram').value.trim(),
        youtube: document.getElementById('svSocYoutube').value.trim(),
        channel: document.getElementById('svSocChannel').value.trim()
      };
      svPersistMyProfile();
      alert('Havolalar saqlandi ✅');
    });
  }
  svBindPlanButtons();
}

function svRequestSocialPayment(planId){
  const plan = SV_PLANS.find(p => p.id === planId);
  if(!plan){ alert("Tarifni tanlang"); return; }

  const payload = {
    type: 'social_links_payment',
    plan: plan.id,
    months: plan.months,
    amount: plan.price,
    profile: svMyProfile ? { id: svMyProfile.id, username: svMyProfile.username, phone: svMyProfile.phone } : null,
    user: window.Telegram?.WebApp?.initDataUnsafe?.user || null
  };
  console.log("To'lov so'rovi:", payload);

  // TODO: haqiqiy botga ulash uchun:
  // fetch('https://your-bot-api.example/pay-social', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});

  alert(`${plan.label} — ${plan.price.toLocaleString('ru-RU')} so'm\n\nTo'lov uchun botga o'ting: karta orqali to'lab, skrinshotini yuboring. Admin tasdiqlagach obuna faollashadi.`);
}

function svHandlePhotoPick(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    svPhotoData = reader.result;
    document.getElementById('svRegPhotoPreview').innerHTML = `<img src="${svPhotoData}">`;
  };
  reader.readAsDataURL(file);
}

function svSubmitRegistration(e){
  e.preventDefault();
  const name = document.getElementById('svRegName').value.trim();
  const username = document.getElementById('svRegUsername').value.trim().replace(/^@/, '');
  const phone = document.getElementById('svRegPhone').value.trim();

  const roles = [];
  if(document.getElementById('svRoleSell').checked) roles.push('sotuvchi');
  if(document.getElementById('svRoleRent').checked) roles.push('ijarachi');

  if(!name || !username || !phone){
    alert("Barcha maydonlarni to'ldiring");
    return;
  }
  if(!roles.length){
    alert("Kamida bitta yo'nalish tanlang: Sotuvchi yoki Ijarachi");
    return;
  }
  if(!/^[a-zA-Z0-9_]{3,32}$/.test(username)){
    alert("Username faqat lotin harflari, raqam va _ dan iborat bo'lsin (3-32 belgi)");
    return;
  }
  if(svSellers.some(s => s.username && s.username.toLowerCase() === username.toLowerCase())){
    alert("Bu username band, boshqasini tanlang");
    return;
  }

  svMyProfile = {
    id: Date.now(),
    name, username, phone,
    avatar: svPhotoData || 'https://picsum.photos/seed/' + encodeURIComponent(username) + '/200',
    obuna: 0, following: 0, posts: 0, elon: 0, korish: 0, sotuv: 0,
    verified: false,
    socialsPaid: false,
    socials: {},
    roles,
    approved: false
  };
  svPersistMyProfile();
  svMergeMyProfile();

  console.log("Yangi makler arizasi:", svMyProfile);

  fetch('https://namangan-ijara-bot.onrender.com/api/makler-ariza', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: svMyProfile.name,
      username: svMyProfile.username,
      phone: svMyProfile.phone,
      roles: svMyProfile.roles,
      init_data: svInitData()
    })
  }).then(r => r.json())
    .then(d => console.log('Ariza yuborildi:', d))
    .catch(e => console.warn('Ariza yuborishda xato:', e));

  // TODO: botga yuborish:
  // fetch('https://your-bot-api.example/makler-ariza', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(svMyProfile)});

  alert("✅ Arizangiz yuborildi!\n\nAdmin tasdiqlagach profilingiz Sotuvchilar bo'limida paydo bo'ladi.");
  // TODO: botga yuborish:
  // fetch('https://your-bot-api.example/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(svMyProfile)});

  svRefreshRegisterView();
}

// ---------- @ orqali qidiruv ----------
function svRenderSellerResults(list){
  const grid = document.getElementById('svSearchGrid');
  if(!list.length){
    grid.innerHTML = '<div class="sv-comment-empty">Hech kim topilmadi</div>';
    return;
  }
  grid.innerHTML = list.map(s => {
    const check = s.verified ? '<span class="sv-badge-check"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '';
    return `
    <div class="sv-seller-row" onclick="svOpenProfile(${s.id})">
      <img class="sv-avatar" src="${s.avatar}">
      <div class="sv-seller-info">
        <div class="sv-seller-name">${s.name} ${check}</div>
        <div class="sv-seller-meta"><span>@${s.username || 'user'}</span><span>${svFmt(s.obuna)} obunachi</span></div>
      </div>
    </div>`;
  }).join('');
}

function svHandleSearchInput(e){
  const raw = e.target.value.trim();
  const grid = document.getElementById('svSearchGrid');

  if(raw.startsWith('@')){
    grid.classList.remove('sv-explore-grid');
    const q = raw.slice(1).toLowerCase();
    const found = svSellers.filter(s => (s.username || '').toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    svRenderSellerResults(found);
    return;
  }

  grid.classList.add('sv-explore-grid');
  const q = raw.toLowerCase();
  const filtered = q ? svListings.filter(l => {
    const s = svSellers.find(x => x.id === l.seller);
    return s && s.name.toLowerCase().includes(q);
  }) : svShuffle(svListings);
  svRenderGrid('svSearchGrid', filtered);
}

document.addEventListener('DOMContentLoaded', ()=>{
  svLoadMyProfile();

  const regClose = document.getElementById('svRegClose');
  if(regClose) regClose.addEventListener('click', ()=>{
    document.getElementById('svRegView').hidden = true;
    svSetActiveNav('home');
  });

  const regForm = document.getElementById('svRegForm');
  if(regForm) regForm.addEventListener('submit', svSubmitRegistration);

  const regPhoto = document.getElementById('svRegPhoto');
  if(regPhoto) regPhoto.addEventListener('change', svHandlePhotoPick);

  const searchInput = document.getElementById('svSearchInput');
  if(searchInput){
    const clone = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(clone, searchInput);
    clone.addEventListener('input', svHandleSearchInput);
    clone.placeholder = "@username yoki e'lon qidiring";
  }

  document.querySelectorAll('.sv-nav-item').forEach(btn=>{
    if(btn.dataset.svNav === 'register'){
      btn.addEventListener('click', ()=>{
        svCloseAllViews();
        const rv = document.getElementById('svRegView');
        if(rv) rv.hidden = false;
        svRefreshRegisterView();
      });
    }
  });
});

// ---------- Obuna tizimi ----------
const SV_API = 'https://namangan-ijara-bot.onrender.com';
let svSubStates = {};

function svMyTgId(){
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
}

function svSubBtnHTML(username){
  const st = svSubStates[username] || { following: false };
  const cls = st.following ? 'sv-sub-btn subbed' : 'sv-sub-btn';
  const txt = st.following ? 'Obuna bo\'lingan' : 'Azo bo\'lish';
  let more = '';
  if(st.following){
    more = `<button class="sv-sub-more" onclick="event.stopPropagation(); svOpenSubMenu('${username}')">⋯</button>`;
  }
  return `<div class="sv-sub-wrap">
    <button class="${cls}" onclick="event.stopPropagation(); svToggleFollow('${username}')">${txt}</button>
    ${more}
  </div>`;
}

function svToggleFollow(username){
  const tgId = svMyTgId();
  if(!tgId){ alert("Bu funksiya faqat Telegram ilovasida ishlaydi"); return; }

  const st = svSubStates[username] || { following: false };
  const action = st.following ? 'unfollow' : 'follow';

  fetch(SV_API + '/api/obuna', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, username, init_data: svInitData() })
  }).then(r => r.json()).then(d => {
    if(d.ok){
      svSubStates[username] = { following: d.following, muted: d.muted };
      const s = svSellers.find(x => x.username === username);
      if(s) s.obuna = d.followers;
      svRenderRank();
    }
  }).catch(e => console.warn('Obuna xatosi:', e));
}

function svOpenSubMenu(username){
  const st = svSubStates[username] || {};
  const muteTxt = st.muted ? '🔔 Ovozni yoqish' : '🔕 Ovozini o\'chirish';

  const ov = document.createElement('div');
  ov.className = 'sv-sheet-overlay';
  ov.innerHTML = `
    <div class="sv-sheet" onclick="event.stopPropagation()">
      <div class="sv-sheet-handle"></div>
      <div class="sv-sheet-title">@${username}</div>
      <button class="sv-sheet-item" id="svMuteItem">${muteTxt}</button>
      <button class="sv-sheet-item danger" id="svUnfollowItem">Azolikdan chiqish</button>
    </div>`;

  ov.addEventListener('click', () => ov.remove());
  document.body.appendChild(ov);

  ov.querySelector('#svMuteItem').addEventListener('click', () => {
    svSubAction(username, st.muted ? 'unmute' : 'mute');
    ov.remove();
  });
  ov.querySelector('#svUnfollowItem').addEventListener('click', () => {
    svSubAction(username, 'unfollow');
    ov.remove();
  });
}

function svSubAction(username, action){
  const tgId = svMyTgId();
  if(!tgId) return;
  fetch(SV_API + '/api/obuna', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, username, init_data: svInitData() })
  }).then(r => r.json()).then(d => {
    if(d.ok){
      svSubStates[username] = { following: d.following, muted: d.muted };
      const s = svSellers.find(x => x.username === username);
      if(s) s.obuna = d.followers;
      svRenderRank();
    }
  }).catch(e => console.warn('Obuna xatosi:', e));
}

function svLoadSubStates(cb){
  const tgId = svMyTgId();
  if(!tgId || !svSellers.length){ if(cb) cb(); return; }

  let done = 0;
  svSellers.forEach(s => {
    fetch(SV_API + '/api/obuna-holat?username=' + encodeURIComponent(s.username) + '&follower_id=' + tgId)
      .then(r => r.json())
      .then(d => {
        svSubStates[s.username] = { following: !!d.following, muted: !!d.muted };
        s.obuna = d.followers || 0;
      })
      .catch(() => {})
      .finally(() => { done++; if(done === svSellers.length && cb) cb(); });
  });
}

// ---------- Arizani o'chirish ----------
function svDeleteMyProfile(){
  if(!svMyProfile) return;
  if(!confirm("Profilingizni butunlay o'chirasizmi?\n\nProfilingiz Sotuvchilar bo'limidan olib tashlanadi.")) return;

  fetch(SV_API + '/api/makler-ochirish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: svMyProfile.username, init_data: svInitData() })
  }).then(r => r.json()).then(d => {
    if(d.ok){
      const cs = window.Telegram?.WebApp?.CloudStorage;
      if(cs){ cs.removeItem(SV_ME_KEY, ()=>{}); }
      else { try { sessionStorage.removeItem(SV_ME_KEY); } catch(e){} }
      svMyProfile = null;
      svPhotoData = null;
      const f = document.getElementById('svRegForm');
      if(f){ f.reset(); f.hidden = false; }
      const prev = document.getElementById('svRegPhotoPreview');
      if(prev) prev.innerHTML = '📷';
      svRefreshRegisterView();
      alert("Profilingiz o'chirildi");
    } else {
      alert("O'chirishda xato yuz berdi");
    }
  }).catch(e => { console.warn(e); alert("Server bilan bog'lanishda xato"); });
}

// ---------- Profilni serverdan tiklash ----------
function svRestoreProfileFromServer(){
  const tgId = svMyTgId();
  if(!tgId) return;

  fetch(SV_API + '/api/mening-profilim?tg_id=' + tgId)
    .then(r => r.json())
    .then(d => {
      if(!d.ok) return;

      if(!svMyProfile){
        svMyProfile = {
          id: tgId,
          name: d.name,
          username: d.username,
          phone: d.phone,
          roles: d.roles || [],
          avatar: 'https://picsum.photos/seed/' + encodeURIComponent(d.username) + '/200',
          obuna: d.followers || 0,
          following: 0, posts: 0, elon: 0, korish: 0, sotuv: 0,
          verified: false,
          socials: {},
          createdAt: Date.now(),
          paidUntil: 0,
          approved: d.status === 'approved'
        };
      } else {
        svMyProfile.approved = d.status === 'approved';
        svMyProfile.obuna = d.followers || 0;
      }
      svPersistMyProfile();
      svRefreshRegisterView();
    })
    .catch(e => console.warn('Profil tiklashda xato:', e));
}

function svEnsureDeleteBtn(){
  const done = document.getElementById('svRegDone');
  if(!done || done.hidden || !svMyProfile) return;
  if(document.getElementById('svDeleteBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'svDeleteBtn';
  btn.className = 'sv-delete-btn';
  btn.textContent = "🗑 Profilni o'chirish";
  btn.addEventListener('click', svDeleteMyProfile);
  done.appendChild(btn);
}

// setInterval(svEnsureDeleteBtn, 1000);

// ---------- Storieslar va lenta ----------
function svRenderStories(){
  const box = document.getElementById('svStories');
  if(!box) return;

  const subs = svSellers.filter(s => (svSubStates[s.username] || {}).following);
  if(!subs.length){
    box.innerHTML = '<div class="sv-stories-empty">Obuna bo\'lgan sotuvchilaringiz shu yerda chiqadi</div>';
    return;
  }

  box.innerHTML = subs.map(s => `
    <button class="sv-story" onclick="svOpenProfileByUsername('${s.username}')">
      <div class="sv-story-ring"><img src="${s.avatar}"></div>
      <span class="sv-story-name">${s.username}</span>
    </button>`).join('');
}

function svRenderFeed(){
  const box = document.getElementById('svFeed');
  if(!box) return;

  const subUsernames = svSellers
    .filter(s => (svSubStates[s.username] || {}).following)
    .map(s => s.id);

  const posts = svListings.filter(l => subUsernames.includes(l.seller));

  if(!posts.length){
    box.innerHTML = `
      <div class="sv-feed-empty">
        <div style="font-size:38px;">📭</div>
        <p>Lentangiz bo'sh</p>
        <span>Sotuvchilarga obuna bo'ling — ularning e'lonlari shu yerda chiqadi</span>
      </div>`;
    return;
  }

  box.innerHTML = posts.map(l => {
    const s = svSellers.find(x => x.id === l.seller);
    const media = (l.video && l.videoUrl)
      ? `<video muted loop playsinline preload="metadata" poster="${l.img || ''}" src="${l.videoUrl}"></video>`
      : `<img src="${l.img}" loading="lazy">`;
    return `
    <div class="sv-feed-item">
      <div class="sv-feed-head" onclick="svOpenProfile(${l.seller})">
        <img src="${s ? s.avatar : ''}">
        <span class="sv-feed-name">${s ? s.name : ''}</span>
      </div>
      <div class="sv-feed-media" data-post="${l.id}">${media}
        <svg class="sv-dbl-heart" viewBox="0 0 24 24" fill="#fff"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
      </div>
      ${svFeedActionsHTML(l)}
      <div class="sv-feed-body">
        ${l.price ? `<div class="sv-feed-price">${l.price}</div>` : ''}
        ${l.desc ? `<div class="sv-feed-desc">${l.desc}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  svObserveVideos(box);
  setTimeout(svBindDoubleTap, 50);
}

function svRefreshHome(){
  svLoadSellersFromServer(() => {
    svLoadSubStates(() => {
      svLoadPostsFromServer(() => {
        svRenderStories();
        svRenderFeed();
        svRenderSearch();
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(svRefreshHome, 600);
});

setTimeout(svRefreshHome, 1500);
setTimeout(svRefreshHome, 3500);


function svOpenProfileByUsername(username){
  const s = svSellers.find(x => x.username === username);
  if(s) svOpenProfile(s.id);
}


function svInitData(){
  return window.Telegram?.WebApp?.initData || '';
}


// ---------- E'lon qo'shish (10 tagacha media) ----------
let svPickedItems = [];
const SV_MAX_MEDIA = 10;

function svBindUploadBtn(){
  const btn = document.getElementById('svOpenUploadBtn');
  if(!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => svPickMedia(true));
}

function svPickMedia(openFormAfter){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.multiple = true;
  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if(!files.length){ input.remove(); return; }

    const free = SV_MAX_MEDIA - svPickedItems.length;
    if(free <= 0){
      alert("Ko'pi bilan " + SV_MAX_MEDIA + " ta fayl");
      input.remove();
      return;
    }

    const chosen = files.slice(0, free);
    let loaded = 0;

    chosen.forEach(file => {
      if(file.size > 20 * 1024 * 1024){
        loaded++;
        return;
      }
      const isVid = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = () => {
        if(isVid){
          svPickedItems.push({ media: reader.result, is_video: true });
          loaded++;
          if(loaded === chosen.length){
            input.remove();
            if(openFormAfter) svShowPostForm(); else svRenderMediaStrip();
          }
          return;
        }
        svCompressImage(reader.result, (small) => {
          svPickedItems.push({ media: small, is_video: false });
          loaded++;
          if(loaded === chosen.length){
            input.remove();
            if(openFormAfter) svShowPostForm(); else svRenderMediaStrip();
          }
        });
        return;
        if(loaded === chosen.length){
          input.remove();
          if(openFormAfter) svShowPostForm();
          else svRenderMediaStrip();
        }
      };
      reader.onerror = () => { loaded++; };
      reader.readAsDataURL(file);
    });
  });

  input.click();
}

function svRenderMediaStrip(){
  const strip = document.getElementById('svMediaStrip');
  const cnt = document.getElementById('svMediaCount');
  if(!strip) return;

  strip.innerHTML = svPickedItems.map((it, i) => {
    const thumb = it.is_video
      ? `<video src="${it.media}" muted></video>`
      : `<img src="${it.media}">`;
    return `<div class="sv-media-thumb">${thumb}<button type="button" class="sv-media-del" data-i="${i}">✕</button></div>`;
  }).join('') + (svPickedItems.length < SV_MAX_MEDIA
      ? '<button type="button" class="sv-media-add" id="svMediaAdd">＋</button>' : '');

  if(cnt) cnt.textContent = svPickedItems.length + ' / ' + SV_MAX_MEDIA;

  strip.querySelectorAll('.sv-media-del').forEach(b => {
    b.addEventListener('click', () => {
      svPickedItems.splice(parseInt(b.dataset.i), 1);
      svRenderMediaStrip();
    });
  });

  const addBtn = document.getElementById('svMediaAdd');
  if(addBtn) addBtn.addEventListener('click', () => svPickMedia(false));
}

function svShowPostForm(){
  let postType = 'sotuv';

  const ov = document.createElement('div');
  ov.className = 'sv-sheet-overlay';
  ov.innerHTML = `
    <div class="sv-sheet sv-post-sheet" onclick="event.stopPropagation()" style="max-height:90vh;overflow-y:auto;">
      <div class="sv-sheet-handle"></div>
      <div class="sv-post-body">
        <div class="sv-media-count" id="svMediaCount"></div>
        <div class="sv-media-strip" id="svMediaStrip"></div>

        <div class="sv-type-row">
          <button type="button" class="sv-type-btn active" data-type="sotuv">Sotiladi</button>
          <button type="button" class="sv-type-btn" data-type="ijara">Ijaraga beriladi</button>
        </div>

        <label class="sv-post-label">Sarlavha</label>
        <input class="sv-post-input" id="svPostTitle" placeholder="Kvartira, Pahlavon mahallasi">

        <label class="sv-post-label">Narx</label>
        <input class="sv-post-input" id="svPostPrice" placeholder="85 000 000 so'm">

        <label class="sv-post-label">Ma'lumot</label>
        <textarea class="sv-post-textarea" id="svPostDesc" placeholder="Manzil, xonalar soni, qavat, maydon..."></textarea>

        <button class="sv-post-send" id="svPostSend">Joylash</button>
        <button class="sv-post-cancel" id="svPostCancel">Bekor qilish</button>
      </div>
    </div>`;

  document.body.appendChild(ov);
  svRenderMediaStrip();

  ov.querySelectorAll('.sv-type-btn').forEach(b => {
    b.addEventListener('click', () => {
      ov.querySelectorAll('.sv-type-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      postType = b.dataset.type;
    });
  });

  ov.querySelector('#svPostCancel').addEventListener('click', () => {
    svPickedItems = [];
    ov.remove();
  });

  ov.querySelector('#svPostSend').addEventListener('click', () => {
    const title = ov.querySelector('#svPostTitle').value.trim();
    const price = ov.querySelector('#svPostPrice').value.trim();
    const desc = ov.querySelector('#svPostDesc').value.trim();

    if(!svPickedItems.length){ alert("Kamida bitta rasm tanlang"); return; }
    if(!title){ alert("Sarlavhani kiriting"); return; }
    if(!price){ alert("Narxni kiriting"); return; }

    const btn = ov.querySelector('#svPostSend');
    btn.disabled = true;
    btn.textContent = 'Yuklanmoqda...';

    const header = postType === 'sotuv' ? 'Sotiladi' : 'Ijaraga beriladi';
    const fullDesc = header + '\n' + title + (desc ? '\n' + desc : '');

    fetch(SV_API + '/api/post-qoshish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: svPickedItems,
        price: price,
        description: fullDesc,
        init_data: svInitData()
      })
    }).then(r => r.json()).then(d => {
      if(d.ok){
        alert("E'lon joylandi \u2705");
        svPickedItems = [];
        ov.remove();
        svRefreshHome();
      } else {
        alert("Xato: " + (d.error || 'server'));
        btn.disabled = false;
        btn.textContent = 'Joylash';
      }
    }).catch(() => {
      alert("Server bilan bog'lanishda xato");
      btn.disabled = false;
      btn.textContent = 'Joylash';
    });
  });
}

setInterval(svBindUploadBtn, 1000);

// ---------- Postlarni serverdan yuklash ----------
function svLoadPostsFromServer(cb){
  fetch(SV_API + '/api/postlar')
    .then(r => r.json())
    .then(d => {
      if(d.ok && Array.isArray(d.posts)){
        svListings = d.posts.map(p => {
          const seller = svSellers.find(s => s.username === p.username);
          const media = (p.media && p.media.length) ? p.media
                        : [{ file_id: p.file_id, is_video: p.is_video }];
          const first = media[0] || {};
          const url = first.file_id ? (SV_API + '/media/' + first.file_id) : '';
          return {
            id: p.id,
            seller: seller ? seller.id : null,
            username: p.username,
            price: p.price || '',
            desc: p.description || '',
            video: !!first.is_video,
            img: first.is_video ? '' : url,
            videoUrl: first.is_video ? url : '',
            media: media.map(m => ({
              url: SV_API + '/media/' + m.file_id,
              is_video: !!m.is_video
            })),
            views: p.views || 0,
            likes: p.likes || 0,
            reposts: 0,
            comments: []
          };
        });
      }
      if(cb) cb();
    })
    .catch(e => { console.warn('Postlarni yuklashda xato:', e); if(cb) cb(); });
}


function svCompressImage(dataUrl, cb){
  const img = new Image();
  img.onload = () => {
    const MAX = 1440;
    let w = img.width, h = img.height;
    if(w > MAX || h > MAX){
      if(w > h){ h = Math.round(h * MAX / w); w = MAX; }
      else { w = Math.round(w * MAX / h); h = MAX; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    try {
      cb(canvas.toDataURL('image/jpeg', 0.85));
    } catch(e){
      cb(dataUrl);
    }
  };
  img.onerror = () => cb(dataUrl);
  img.src = dataUrl;
}


// ---------- Lenta amallari ----------
function svFeedActionsHTML(l){
  const liked = !!svLikedPosts[l.id];
  const saved = svFavorites.includes(l.id);
  return `
  <div class="sv-feed-actions">
    <button class="sv-fa-btn ${liked ? 'liked' : ''}" onclick="svFeedLike(${l.id})">
      <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
      <span>${svFmt(l.likes)}</span>
    </button>
    <button class="sv-fa-btn" onclick="svOpenPost(${l.id})">
      <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l2-4.9A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>
      <span>${svFmt((l.comments||[]).length)}</span>
    </button>
    <button class="sv-fa-btn" onclick="svFeedRepost(${l.id})">
      <svg viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
      <span>${svFmt(l.reposts)}</span>
    </button>
    <button class="sv-fa-btn" onclick="svFeedShare(${l.id})">
      <svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
    </button>
    <button class="sv-fa-btn sv-fa-save ${saved ? 'saved' : ''}" onclick="svFeedSave(${l.id})">
      <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    </button>
  </div>`;
}

function svFeedLike(id){
  const l = svListings.find(x => x.id === id);
  if(!l) return;
  const liked = !!svLikedPosts[id];
  svLikedPosts[id] = !liked;
  l.likes = Math.max(0, (l.likes || 0) + (liked ? -1 : 1));
  svRenderFeed();
}

function svFeedRepost(id){
  const l = svListings.find(x => x.id === id);
  if(!l) return;
  l.reposts = (l.reposts || 0) + 1;
  svRenderFeed();
  svFeedShare(id);
}

function svFeedSave(id){
  const i = svFavorites.indexOf(id);
  if(i === -1) svFavorites.push(id);
  else svFavorites.splice(i, 1);
  svStoreSet(SV_FAV_KEY, svFavorites);
  svRenderFeed();
}

function svFeedShare(id){
  const l = svListings.find(x => x.id === id);
  if(!l) return;
  const s = svSellers.find(x => x.id === l.seller);
  const text = [
    l.desc || '',
    l.price ? 'Narx: ' + l.price : '',
    s ? '@' + s.username : ''
  ].filter(Boolean).join('\n');

  const link = 'https://t.me/Ijaraga_uybot';
  const url = 'https://t.me/share/url?url=' + encodeURIComponent(link) +
              '&text=' + encodeURIComponent(text);

  const tg = window.Telegram?.WebApp;
  if(tg && tg.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}

// ---------- Rol tanlash ----------
const SV_ROLE_KEY = 'sv_user_role';
let svUserRole = null;

function svShowRoleAsk(){
  const box = document.getElementById('svMaklerBox');
  if(!box) return;

  box.innerHTML = `
    <div class="sv-role-ask">
      <h3>Siz kimsiz?</h3>
      <p>Ilovadan qanday foydalanmoqchisiz?</p>
      <div class="sv-role-cards">
        <button class="sv-role-card" id="svRoleViewer">
          <span class="sv-role-ico">👀</span>
          <span class="sv-role-txt">
            <b>Oddiy kuzatuvchi</b>
            <span>E'lonlarni ko'raman, sotuvchilarga obuna bo'laman</span>
          </span>
        </button>
        <button class="sv-role-card" id="svRoleMakler">
          <span class="sv-role-ico">🏠</span>
          <span class="sv-role-txt">
            <b>Makler / Sotuvchi</b>
            <span>E'lon joylayman, mijozlar topaman</span>
          </span>
        </button>
      </div>
    </div>`;

  document.getElementById('svRoleViewer').addEventListener('click', () => {
    svUserRole = 'viewer';
    svStoreSet(SV_ROLE_KEY, 'viewer');
    svShowViewerNote();
  });

  document.getElementById('svRoleMakler').addEventListener('click', () => {
    svUserRole = 'makler';
    svStoreSet(SV_ROLE_KEY, 'makler');
    svRestoreMaklerBox();
  });
}

function svShowViewerNote(){
  const box = document.getElementById('svMaklerBox');
  if(!box) return;
  box.innerHTML = `
    <div class="sv-role-ask">
      <span style="font-size:38px;">👀</span>
      <h3 style="margin-top:10px;">Kuzatuvchi rejimi</h3>
      <p>Sotuvchilarga obuna bo'ling — ularning e'lonlari asosiy sahifada chiqadi.</p>
      <button class="sv-role-back" id="svRoleChange">Makler bo'lishni xohlayman</button>
    </div>`;
  document.getElementById('svRoleChange').addEventListener('click', () => {
    svUserRole = 'makler';
    svStoreSet(SV_ROLE_KEY, 'makler');
    svRestoreMaklerBox();
  });
}

let svMaklerBoxHTML = null;

function svSaveMaklerBoxHTML(){
  const box = document.getElementById('svMaklerBox');
  if(box && !svMaklerBoxHTML && !box.querySelector('.sv-role-ask')){
    svMaklerBoxHTML = box.innerHTML;
  }
}

function svRestoreMaklerBox(){
  const box = document.getElementById('svMaklerBox');
  if(box && svMaklerBoxHTML){
    box.innerHTML = svMaklerBoxHTML;
    svRefreshRegisterView();
    svEnsureDeleteBtn();
  }
}

function svApplyRole(){
  const box = document.getElementById('svMaklerBox');
  if(!box) return;
  svSaveMaklerBoxHTML();

  if(svMyProfile){
    svUserRole = 'makler';
    if(svMyProfile.approved && !box.querySelector('.sv-ig-head')) svRenderIgProfile();
    return;
  }

  if(svUserRole === 'viewer'){
    if(!box.querySelector('.sv-role-ask')) svShowViewerNote();
  } else if(svUserRole === 'makler'){
    svRestoreMaklerBox();
  } else {
    if(!box.querySelector('.sv-role-ask')) svShowRoleAsk();
  }
}

svStoreGet(SV_ROLE_KEY, (v) => {
  if(v === 'viewer' || v === 'makler') svUserRole = v;
  setTimeout(svApplyRole, 800);
});


// ---------- Ikki marta bosib layk ----------
function svBindDoubleTap(){
  document.querySelectorAll('.sv-feed-media[data-post]').forEach(el => {
    if(el.dataset.tapBound) return;
    el.dataset.tapBound = '1';

    let lastTap = 0;
    let timer = null;
    const id = parseInt(el.dataset.post);

    el.addEventListener('click', (e) => {
      const now = Date.now();
      if(now - lastTap < 320){
        clearTimeout(timer);
        lastTap = 0;
        svDoubleTapLike(id, el);
      } else {
        lastTap = now;
        timer = setTimeout(() => { svOpenPost(id); }, 330);
      }
    });
  });
}

function svDoubleTapLike(id, el){
  const l = svListings.find(x => x.id === id);
  if(!l) return;

  if(!svLikedPosts[id]){
    svLikedPosts[id] = true;
    l.likes = (l.likes || 0) + 1;
    const btn = document.querySelector(`.sv-feed-item .sv-fa-btn[onclick="svFeedLike(${id})"]`);
    if(btn){
      btn.classList.add('liked');
      const sp = btn.querySelector('span');
      if(sp) sp.textContent = svFmt(l.likes);
    }
  }

  const heart = el.querySelector('.sv-dbl-heart');
  if(heart){
    heart.classList.remove('pop');
    void heart.offsetWidth;
    heart.classList.add('pop');
  }

  const tg = window.Telegram?.WebApp;
  if(tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

setInterval(svBindDoubleTap, 800);

// ================= INSTAGRAM PROFIL =================
let svIgTab = 'grid';

function svIgVerifiedSVG(){
  return `<svg class="sv-ig-verified" viewBox="0 0 24 24" fill="#0095F6"><path d="M12 1l2.5 2.2 3.3-.4 1 3.2 3 1.5-1.2 3.1 1.2 3.1-3 1.5-1 3.2-3.3-.4L12 23l-2.5-2.2-3.3.4-1-3.2-3-1.5 1.2-3.1L2.2 10l3-1.5 1-3.2 3.3.4z"/><path d="M10.5 15.2l-3-3 1.2-1.2 1.8 1.8 4.3-4.3 1.2 1.2z" fill="#000"/></svg>`;
}

function svRenderIgProfile(){
  const box = document.getElementById('svMaklerBox');
  if(!box || !svMyProfile || !svMyProfile.approved) return;

  const p = svMyProfile;
  const myPosts = svListings.filter(l => l.username === p.username);
  const bio = p.bio || '';
  const soc = p.socials || {};

  const chips = [];
  if(soc.instagram) chips.push({i:'📷', t:'Instagram', u:'https://instagram.com/' + soc.instagram.replace(/^@/,'')});
  if(soc.telegram) chips.push({i:'✈️', t:'Telegram', u:'https://t.me/' + soc.telegram.replace(/^@/,'')});
  if(soc.youtube) chips.push({i:'▶️', t:'YouTube', u:soc.youtube});
  if(soc.channel) chips.push({i:'📢', t:'Kanal', u:'https://t.me/' + soc.channel.replace(/^@/,'')});

  box.innerHTML = `
    <div class="sv-ig-top">
      <div class="sv-ig-user">${p.username} ${p.verified ? svIgVerifiedSVG() : ''}</div>
    </div>

    <div class="sv-ig-head">
      <div class="sv-ig-avatar-wrap">
        <img class="sv-ig-avatar" src="${p.avatar}">
        <button class="sv-ig-avatar-add" id="svIgAdd">+</button>
      </div>
      <div class="sv-ig-stats">
        <div class="sv-ig-stat"><b>${svFmt(myPosts.length)}</b><span>post</span></div>
        <div class="sv-ig-stat" id="svIgFollowers"><b>${svFmt(p.obuna)}</b><span>obunachi</span></div>
        <div class="sv-ig-stat"><b>${svFmt(p.following)}</b><span>obuna</span></div>
      </div>
    </div>

    <div class="sv-ig-bio">
      <div class="sv-ig-bio-name">${p.name}</div>
      ${bio ? `<div class="sv-ig-bio-text">${bio}</div>` : ''}
      <div class="sv-ig-bio-phone">${p.phone || ''}</div>
    </div>

    ${chips.length ? `<div class="sv-ig-chips">${chips.map(c =>
      `<a class="sv-ig-chip" href="${c.u}" target="_blank" rel="noopener"><span>${c.i}</span>${c.t}</a>`
    ).join('')}</div>` : ''}

    <div class="sv-ig-actions">
      <button class="sv-ig-btn" id="svIgEdit">Profilni tahrirlash</button>
      <button class="sv-ig-btn" id="svIgShare">Ulashish</button>
    </div>

    <div class="sv-ig-tabs">
      <button class="sv-ig-tab ${svIgTab==='grid'?'active':''}" data-tab="grid">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      </button>
      <button class="sv-ig-tab ${svIgTab==='saved'?'active':''}" data-tab="saved">
        <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button class="sv-ig-tab ${svIgTab==='info'?'active':''}" data-tab="info">
        <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M2 18l5-4 3 2 4-4 8 6"/></svg>
      </button>
    </div>

    <div class="sv-ig-grid" id="svIgGrid"></div>

    <button class="sv-delete-btn" id="svDeleteBtn2">🗑 Profilni o'chirish</button>
  `;

  svRenderIgGrid();

  document.getElementById('svIgAdd').addEventListener('click', () => {
    const b = document.getElementById('svOpenUploadBtn');
    if(b) b.click(); else svPickMedia(true);
  });
  document.getElementById('svIgEdit').addEventListener('click', svIgEditProfile);
  document.getElementById('svIgShare').addEventListener('click', svIgShareProfile);
  document.getElementById('svDeleteBtn2').addEventListener('click', svDeleteMyProfile);

  box.querySelectorAll('.sv-ig-tab').forEach(t => {
    t.addEventListener('click', () => {
      svIgTab = t.dataset.tab;
      svRenderIgProfile();
    });
  });
}

function svRenderIgGrid(){
  const g = document.getElementById('svIgGrid');
  if(!g || !svMyProfile) return;

  let items;
  if(svIgTab === 'grid'){
    items = svListings.filter(l => l.username === svMyProfile.username);
  } else if(svIgTab === 'saved'){
    items = svListings.filter(l => svFavorites.includes(l.id));
  } else {
    items = svListings.filter(l => l.username === svMyProfile.username && l.video);
  }

  if(!items.length){
    g.innerHTML = `<div class="sv-ig-empty">
      <div style="font-size:40px;">📷</div>
      <p>Hali e'lon yo'q</p>
      <span>${svIgTab==='saved' ? "Saqlangan e'lonlar shu yerda chiqadi" : "＋ tugmasi bilan e'lon qo'shing"}</span>
    </div>`;
    return;
  }

  g.innerHTML = items.map(l => {
    const multi = (l.media && l.media.length > 1)
      ? `<svg class="sv-ig-cell-multi" viewBox="0 0 24 24" fill="#fff"><rect x="7" y="3" width="14" height="14" rx="2"/><rect x="3" y="7" width="14" height="14" rx="2" opacity=".85"/></svg>`
      : '';
    const media = l.video
      ? `<video src="${l.videoUrl}" muted preload="metadata"></video>`
      : `<img src="${l.img}" loading="lazy">`;
    return `<div class="sv-ig-cell" onclick="svOpenPost(${l.id})">${media}${multi}</div>`;
  }).join('');
}

function svIgShareProfile(){
  if(!svMyProfile) return;
  const text = `${svMyProfile.name} — Namangan Ijara\n@${svMyProfile.username}`;
  const url = 'https://t.me/share/url?url=' + encodeURIComponent('https://t.me/Ijaraga_uybot') +
              '&text=' + encodeURIComponent(text);
  const tg = window.Telegram?.WebApp;
  if(tg && tg.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}

function svIgEditProfile(){
  const p = svMyProfile;
  if(!p) return;
  const ov = document.createElement('div');
  ov.className = 'sv-sheet-overlay';
  ov.innerHTML = `
    <div class="sv-sheet sv-post-sheet" onclick="event.stopPropagation()" style="max-height:88vh;overflow-y:auto;">
      <div class="sv-sheet-handle"></div>
      <div class="sv-post-body">
        <label class="sv-post-label">Ism</label>
        <input class="sv-post-input" id="svEdName" value="${p.name || ''}">
        <label class="sv-post-label">Bio</label>
        <textarea class="sv-post-textarea" id="svEdBio" placeholder="O'zingiz haqingizda...">${p.bio || ''}</textarea>
        <label class="sv-post-label">Instagram</label>
        <input class="sv-post-input" id="svEdIg" placeholder="@username" value="${(p.socials||{}).instagram || ''}">
        <label class="sv-post-label">Telegram</label>
        <input class="sv-post-input" id="svEdTg" placeholder="@username" value="${(p.socials||{}).telegram || ''}">
        <button class="sv-post-send" id="svEdSave">Saqlash</button>
        <button class="sv-post-cancel" id="svEdCancel">Bekor qilish</button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  ov.querySelector('#svEdCancel').addEventListener('click', () => ov.remove());
  ov.querySelector('#svEdSave').addEventListener('click', () => {
    p.name = ov.querySelector('#svEdName').value.trim() || p.name;
    p.bio = ov.querySelector('#svEdBio').value.trim();
    p.socials = p.socials || {};
    p.socials.instagram = ov.querySelector('#svEdIg').value.trim();
    p.socials.telegram = ov.querySelector('#svEdTg').value.trim();
    svPersistMyProfile();
    ov.remove();
    svRenderIgProfile();
  });
}


// ============ YAGONA PROFIL BOSHQARUVCHISI ============
let svProfileRendered = false;

function svProfileController(){
  const box = document.getElementById('svMaklerBox');
  if(!box) return;

  const form = document.getElementById('svRegForm');
  const pending = document.getElementById('svRegPending');
  const done = document.getElementById('svRegDone');
  const intro = box.querySelector('.sv-reg-intro');

  // 1) Tasdiqlangan makler -> Instagram profil
  if(svMyProfile && svMyProfile.approved){
    if(form) form.style.display = 'none';
    if(pending) pending.style.display = 'none';
    if(done) done.style.display = 'none';
    if(intro) intro.style.display = 'none';

    if(!svProfileRendered || !box.querySelector('.sv-ig-head')){
      try {
        svRenderIgProfile();
        svProfileRendered = true;
      } catch(e){ console.warn('IG profil:', e); }
    }
    return;
  }

  svProfileRendered = false;

  // 2) Ariza yuborilgan, kutilmoqda
  if(svMyProfile && !svMyProfile.approved){
    if(form) form.style.display = 'none';
    if(done) done.style.display = 'none';
    if(intro) intro.style.display = 'none';
    if(pending) pending.style.display = '';
    return;
  }

  // 3) Hali ariza yo'q -> forma
  if(form) form.style.display = '';
  if(pending) pending.style.display = 'none';
  if(done) done.style.display = 'none';
  if(intro) intro.style.display = '';
}

setInterval(svProfileController, 600);

// Serverdan holatni majburiy tekshirish
(function svForceApproved(){
  let done = false;
  const t = setInterval(() => {
    const tgId = svMyTgId();
    if(!tgId || done) return;
    fetch(SV_API + '/api/mening-profilim?tg_id=' + tgId)
      .then(r => r.json())
      .then(d => {
        if(d.ok && d.status === 'approved'){
          if(!svMyProfile){
            svMyProfile = {
              id: tgId, name: d.name, username: d.username, phone: d.phone,
              roles: d.roles || [], avatar: 'https://picsum.photos/seed/' + encodeURIComponent(d.username) + '/200',
              obuna: d.followers || 0, following: 0, posts: 0, elon: 0, korish: 0, sotuv: 0,
              verified: false, socials: {}, createdAt: Date.now(), paidUntil: 0, approved: true
            };
          } else {
            svMyProfile.approved = true;
            svMyProfile.obuna = d.followers || 0;
          }
          try { svPersistMyProfile(); } catch(e){}
          done = true;
          clearInterval(t);
        }
      }).catch(()=>{});
  }, 1500);
  setTimeout(() => clearInterval(t), 30000);
})();

setTimeout(function(){
  var d = document.createElement('div');
  d.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#c00;color:#fff;padding:8px;font-size:12px;text-align:center;font-family:monospace';
  d.textContent = 'P:' + (typeof svMyProfile) + ' A:' + (svMyProfile && svMyProfile.approved) + ' T:' + (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user ? window.Telegram.WebApp.initDataUnsafe.user.id : 'yoq');
  document.body.appendChild(d);
}, 6000);

// ================= MENING SAHIFAM (yangi, mustaqil) =================
let mpState = { loading: true, profile: null };

function mpTgId(){
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
}

function mpLoad(){
  const id = mpTgId();
  const body = document.getElementById('svMyPageBody');
  if(!body) return;

  if(!id){
    body.innerHTML = `<div class="sv-role-ask"><h3>Telegram kerak</h3>
      <p>Bu bo'lim faqat Telegram ilovasida ishlaydi.</p></div>`;
    return;
  }

  body.innerHTML = `<div class="sv-role-ask"><p style="padding:40px 0;">Yuklanmoqda...</p></div>`;

  fetch(SV_API + '/api/mening-profilim?tg_id=' + id)
    .then(r => r.json())
    .then(d => {
      mpState.loading = false;
      mpState.profile = d.ok ? d : null;
      mpRender();
    })
    .catch(() => { mpState.loading = false; mpState.profile = null; mpRender(); });
}

function mpRender(){
  const body = document.getElementById('svMyPageBody');
  if(!body) return;
  const p = mpState.profile;

  if(!p){ mpRenderForm(body); return; }
  if(p.status !== 'approved'){ mpRenderPending(body); return; }
  mpRenderProfile(body, p);
}

function mpRenderPending(body){
  body.innerHTML = `
    <div class="sv-role-ask">
      <div style="font-size:44px;">⏳</div>
      <h3>Arizangiz ko'rib chiqilmoqda</h3>
      <p>Admin tasdiqlagach sahifangiz shu yerda ochiladi.</p>
    </div>`;
}

function mpRenderForm(body){
  body.innerHTML = `
    <div id="mpForm" style="padding:6px 2px 30px;">
      <p class="sv-reg-intro" style="text-align:center;color:#8E8E8E;font-size:12.5px;line-height:1.6;margin:0 0 24px;">
        Makler bo'lib ishlash uchun ariza qoldiring.<br>Admin tasdiqlagach sahifangiz ochiladi.
      </p>

      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:26px;">
        <div id="mpAvaPrev" style="width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(203,161,53,.3);display:flex;align-items:center;justify-content:center;font-size:30px;overflow:hidden;">📷</div>
        <label style="padding:9px 20px;border-radius:100px;font-size:11.5px;font-weight:800;color:#E8D9A8;background:rgba(203,161,53,.10);border:1px solid rgba(203,161,53,.4);cursor:pointer;">Rasm tanlash
          <input type="file" id="mpAva" accept="image/*" hidden>
        </label>
      </div>

      <label class="sv-post-label">Ism familiya</label>
      <input class="sv-post-input" id="mpName" placeholder="Bahromjon Karimov">

      <label class="sv-post-label">Username</label>
      <input class="sv-post-input" id="mpUser" placeholder="bahromjon_makler">

      <label class="sv-post-label">Yo'nalish</label>
      <div style="display:flex;gap:11px;margin-bottom:20px;">
        <label class="sv-role-opt" style="flex:1;display:flex;align-items:center;justify-content:center;gap:9px;padding:15px 0;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);color:#fff;font-size:13.5px;font-weight:700;">
          <input type="checkbox" id="mpSell" style="width:17px;height:17px;accent-color:#CBA135;"> Sotuvchi
        </label>
        <label class="sv-role-opt" style="flex:1;display:flex;align-items:center;justify-content:center;gap:9px;padding:15px 0;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);color:#fff;font-size:13.5px;font-weight:700;">
          <input type="checkbox" id="mpRent" style="width:17px;height:17px;accent-color:#CBA135;"> Ijarachi
        </label>
      </div>

      <label class="sv-post-label">Telefon</label>
      <input class="sv-post-input" id="mpPhone" type="tel" placeholder="+998901234567">

      <button class="sv-post-send" id="mpSend">Ariza yuborish</button>
    </div>`;

  let avaData = null;
  document.getElementById('mpAva').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = () => {
      avaData = r.result;
      document.getElementById('mpAvaPrev').innerHTML = `<img src="${avaData}" style="width:100%;height:100%;object-fit:cover;">`;
    };
    r.readAsDataURL(f);
  });

  document.getElementById('mpSend').addEventListener('click', () => {
    const name = document.getElementById('mpName').value.trim();
    const user = document.getElementById('mpUser').value.trim().replace(/^@/,'');
    const phone = document.getElementById('mpPhone').value.trim();
    const roles = [];
    if(document.getElementById('mpSell').checked) roles.push('sotuvchi');
    if(document.getElementById('mpRent').checked) roles.push('ijarachi');

    if(name.length < 3){ alert("Ismni to'liq kiriting"); return; }
    if(!/^[a-zA-Z0-9_]{3,32}$/.test(user)){ alert("Username: lotin harflari, raqam, _"); return; }
    if(!/^\+?998\d{9}$/.test(phone.replace(/[\s\-()]/g,''))){ alert("Telefon: +998901234567"); return; }
    if(!roles.length){ alert("Yo'nalish tanlang"); return; }

    const btn = document.getElementById('mpSend');
    btn.disabled = true;
    btn.textContent = 'Yuborilmoqda...';

    fetch(SV_API + '/api/makler-ariza', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username: user, phone, roles, init_data: svInitData() })
    }).then(r => r.json()).then(d => {
      if(d.ok){
        alert("Arizangiz yuborildi ✅");
        mpLoad();
      } else {
        alert("Xato: " + (d.error || 'server'));
        btn.disabled = false;
        btn.textContent = 'Ariza yuborish';
      }
    }).catch(() => {
      alert("Server bilan bog'lanishda xato");
      btn.disabled = false;
      btn.textContent = 'Ariza yuborish';
    });
  });
}

function mpRenderProfile(body, p){
  const myPosts = svListings.filter(l => l.username === p.username);
  const ava = 'https://picsum.photos/seed/' + encodeURIComponent(p.username) + '/200';

  body.innerHTML = `
    <div class="sv-ig-top"><div class="sv-ig-user">${p.username}</div></div>

    <div class="sv-ig-head">
      <div class="sv-ig-avatar-wrap">
        <img class="sv-ig-avatar" src="${ava}">
        <button class="sv-ig-avatar-add" id="mpAdd">+</button>
      </div>
      <div class="sv-ig-stats">
        <div class="sv-ig-stat"><b>${myPosts.length}</b><span>post</span></div>
        <div class="sv-ig-stat"><b>${p.followers || 0}</b><span>obunachi</span></div>
        <div class="sv-ig-stat"><b>0</b><span>obuna</span></div>
      </div>
    </div>

    <div class="sv-ig-bio">
      <div class="sv-ig-bio-name">${p.name}</div>
      <div class="sv-ig-bio-phone">${p.phone || ''}</div>
    </div>

    <div class="sv-ig-actions">
      <button class="sv-ig-btn" id="mpShare">Ulashish</button>
      <button class="sv-ig-btn" id="mpDel" style="color:#ED4956;">O'chirish</button>
    </div>

    <div class="sv-ig-grid" id="mpGrid"></div>`;

  const g = document.getElementById('mpGrid');
  if(!myPosts.length){
    g.innerHTML = `<div class="sv-ig-empty"><div style="font-size:40px;">📷</div>
      <p>Hali e'lon yo'q</p><span>＋ tugmasi bilan qo'shing</span></div>`;
  } else {
    g.innerHTML = myPosts.map(l => {
      const m = l.video ? `<video src="${l.videoUrl}" muted preload="metadata"></video>` : `<img src="${l.img}">`;
      return `<div class="sv-ig-cell" onclick="svOpenPost(${l.id})">${m}</div>`;
    }).join('');
  }

  document.getElementById('mpAdd').addEventListener('click', () => svPickMedia(true));
  document.getElementById('mpShare').addEventListener('click', () => {
    const url = 'https://t.me/share/url?url=' + encodeURIComponent('https://t.me/Ijaraga_uybot') +
                '&text=' + encodeURIComponent(p.name + ' — Namangan Ijara\n@' + p.username);
    const tg = window.Telegram?.WebApp;
    if(tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url,'_blank');
  });
  document.getElementById('mpDel').addEventListener('click', () => {
    if(!confirm("Sahifangizni o'chirasizmi?")) return;
    fetch(SV_API + '/api/makler-ochirish', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username: p.username, init_data: svInitData() })
    }).then(r=>r.json()).then(d=>{
      if(d.ok){ alert("O'chirildi"); mpLoad(); } else alert("Xato");
    }).catch(()=>alert("Server xatosi"));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sv-nav-item').forEach(btn => {
    if(btn.dataset.svNav !== 'mypage') return;
    btn.addEventListener('click', () => {
      svCloseAllViews();
      const v = document.getElementById('svMyPageView');
      if(v){ v.hidden = false; mpLoad(); }
    });
  });
  const c = document.getElementById('svMyPageClose');
  if(c) c.addEventListener('click', () => {
    document.getElementById('svMyPageView').hidden = true;
    svSetActiveNav('home');
  });
});
