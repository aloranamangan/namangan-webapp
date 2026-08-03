const tg = (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

const CATEGORY_LABELS = {
  kvartira: "Kvartira",
  uy: "Uy",
  ofis: "Ofis",
  dokon: "Do'kon"
};

let listings = [];
let favorites = [];

function saveFavorites() {
  const value = JSON.stringify(favorites);
  if (tg && tg.CloudStorage) {
    tg.CloudStorage.setItem("favorites", value);
  } else {
    try { localStorage.setItem("ni_favorites", value); } catch (e) {}
  }
}

function loadFavorites(callback) {
  if (tg && tg.CloudStorage) {
    tg.CloudStorage.getItem("favorites", (err, value) => {
      if (!err && value) {
        try { favorites = JSON.parse(value); } catch (e) { favorites = []; }
      }
      callback();
    });
  } else {
    try {
      const value = localStorage.getItem("ni_favorites");
      if (value) favorites = JSON.parse(value);
    } catch (e) {}
    callback();
  }
}

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx === -1) {
    favorites.push(id);
  } else {
    favorites.splice(idx, 1);
  }
  saveFavorites();
  render();
}
let state = { category: "hammasi", listingType: "hammasi", minPrice: null, maxPrice: null, district: "", search: "" };
let currentDetail = null;

const grid = document.getElementById("listingGrid");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");

function formatPrice(n) {
  return n.toLocaleString("ru-RU").replace(/,/g, " ");
}

async function loadListings() {
  try {
    const res = await fetch("../data/listings.json");
    listings = await res.json();
  } catch (e) {
    const res = await fetch("listings.json");
    listings = await res.json();
  }
  populateDistricts();
  render();
}

function populateDistricts() {
  const select = document.getElementById("districtSelect");
  const districts = [...new Set(listings.map(l => l.district))];
  districts.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });
}

function filteredListings() {
  if (state.listingType === "mashhur") {
    return [...listings].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 30);
  }
  return listings.filter(l => {
    if (state.listingType === "sevimli") return favorites.includes(l.id);
    if (state.listingType === "mening") {
      const myId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
      return myId && l.tg_user_id === myId;
    }
    if (state.listingType !== "hammasi" && l.listing_type !== state.listingType) return false;
    if (state.category !== "hammasi" && l.category !== state.category) return false;
    if (state.minPrice && l.price < state.minPrice) return false;
    if (state.maxPrice && l.price > state.maxPrice) return false;
    if (state.district && l.district !== state.district) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const haystack = `${l.title} ${l.district} ${l.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function render() {
  const items = filteredListings();
  grid.innerHTML = "";
  grid.classList.add("fade-render");
  resultCount.textContent = items.length ? `${items.length} ta e'lon` : "";
  emptyState.hidden = items.length !== 0;

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    let badgeHtml = "";
    if (item.tariff === "top") badgeHtml = `<div class="badge badge-top">🔥 TOP</div>`;
    else if (item.tariff === "vip") badgeHtml = `<div class="badge badge-vip">⭐ VIP</div>`;

    const isFav = favorites.includes(item.id);
    card.innerHTML = `
      ${badgeHtml}
      <div class="fav-heart ${isFav ? 'active' : ''}" data-id="${item.id}">${isFav ? '❤️' : '🤍'}</div>
      <img class="card-img" src="${item.images[0]}" alt="${item.title}" loading="lazy">
      <div class="card-body">
        <div class="card-price">${formatPrice(item.price)} <small>so'm / oy</small></div>
        <div class="card-title">${item.title}</div>
        <div class="card-district">${item.district}</div>
        <div class="card-tags">
          <span>${item.rooms} xona</span>
          <span>${item.area} m²</span>
          <span>${item.floor}</span>
          ${item.likes ? `<span>👍 ${item.likes}</span>` : ''}
        </div>
      </div>
    `;
    card.addEventListener("click", () => openDetail(item));
    card.querySelector(".fav-heart").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(item.id);
    });
    grid.appendChild(card);
  });
}

document.getElementById("typeTabs").addEventListener("click", e => {
  const btn = e.target.closest(".type-tab");
  if (!btn) return;
  document.querySelectorAll(".type-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  state.listingType = btn.dataset.type;
  const mapView = document.getElementById("mapView");
  if (!mapView.hidden && leafletMap) {
    renderMapMarkers();
  } else {
    render();
  }
});

document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  state.category = btn.dataset.cat;
  render();
});

const sheetOverlay = document.getElementById("sheetOverlay");
document.getElementById("openFilters").addEventListener("click", () => sheetOverlay.classList.add("open"));
sheetOverlay.addEventListener("click", e => { if (e.target === sheetOverlay) sheetOverlay.classList.remove("open"); });

document.getElementById("applyFilters").addEventListener("click", () => {
  state.minPrice = parseInt(document.getElementById("minPrice").value) || null;
  state.maxPrice = parseInt(document.getElementById("maxPrice").value) || null;
  state.district = document.getElementById("districtSelect").value;
  sheetOverlay.classList.remove("open");
  render();
});

document.getElementById("resetFilters").addEventListener("click", () => {
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.getElementById("districtSelect").value = "";
  state.minPrice = null; state.maxPrice = null; state.district = "";
  sheetOverlay.classList.remove("open");
  render();
});

const detailOverlay = document.getElementById("detailOverlay");

function openDetail(item) {
  currentDetail = item;
  trackView(item.id);
  const panoBtn = document.getElementById("panoBtn");
  panoBtn.hidden = !item.panorama;
  document.getElementById("detailPrice").textContent = formatPrice(item.price) + " so'm / oy";
  document.getElementById("detailTitle").textContent = item.title;
  document.getElementById("detailDesc").textContent = item.description;
  document.getElementById("detailMeta").innerHTML =
    `<span>${item.rooms} xona</span><span>${item.area} m²</span><span>${item.floor}</span><span>${item.district}</span>`;

  const gallery = document.getElementById("gallery");
  const dots = document.getElementById("dots");
  gallery.innerHTML = item.images.map(src => `<img src="${src}">`).join("");
  dots.innerHTML = item.images.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join("");

  gallery.onscroll = () => {
    const idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
    [...dots.children].forEach((d, i) => d.classList.toggle("active", i === idx));
  };

  detailOverlay.classList.add("open");
}

detailOverlay.addEventListener("click", e => { if (e.target === detailOverlay) detailOverlay.classList.remove("open"); });

document.getElementById("callBtn").addEventListener("click", () => {
  if (!currentDetail) return;
  window.location.href = `tel:${currentDetail.phone}`;
});

document.getElementById("telegramBtn").addEventListener("click", () => {
  if (!currentDetail) return;
  if (!currentDetail.tg_username) {
    alert("Bu e'lon egasida Telegram username yo'q. Iltimos telefon orqali bog'laning.");
    return;
  }
  const link = `https://t.me/${currentDetail.tg_username}`;
  if (tg && tg.openTelegramLink) {
    tg.openTelegramLink(link);
  } else {
    window.open(link, "_blank");
  }
});

document.getElementById("searchInput").addEventListener("input", e => {
  state.search = e.target.value;
  render();
});

loadFavorites(() => {
  if (tg && tg.CloudStorage) {
    tg.CloudStorage.getItem("viewed", (err, value) => {
      if (!err && value) {
        try { viewedIds = JSON.parse(value); } catch (e) { viewedIds = []; }
      }
      loadListings();
    });
  } else {
    try {
      const value = localStorage.getItem("ni_viewed");
      if (value) viewedIds = JSON.parse(value);
    } catch (e) {}
    loadListings();
  }
});

// ---- Xarita ko'rinishi ----
let leafletMap = null;
let mapInitialized = false;
const NAMANGAN_CENTER = [40.9983, 71.6726];

function initMap() {
  if (mapInitialized) return;
  leafletMap = L.map('mapView').setView(NAMANGAN_CENTER, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(leafletMap);
  mapInitialized = true;
}

function renderMapMarkers() {
  if (!leafletMap) return;
  leafletMap.eachLayer(layer => {
    if (layer instanceof L.Marker) leafletMap.removeLayer(layer);
  });

  const withLocation = filteredListings().filter(l => l.lat && l.lng);
  withLocation.forEach(item => {
    const marker = L.marker([item.lat, item.lng]).addTo(leafletMap);
    const popupHtml = `
      <div class="map-popup">
        <b>${item.title}</b>
        <div>${item.district}</div>
        <div class="price">${formatPrice(item.price)} so'm</div>
        <button onclick="window.__openFromMap(${item.id})">Batafsil</button>
      </div>`;
    marker.bindPopup(popupHtml);
  });

  if (withLocation.length > 0) {
    const group = L.featureGroup(withLocation.map(item => L.marker([item.lat, item.lng])));
    leafletMap.fitBounds(group.getBounds().pad(0.2));
  }
}

window.__openFromMap = function(id) {
  const item = listings.find(l => l.id === id);
  if (item) openDetail(item);
};

document.getElementById("mapToggleBtn").addEventListener("click", () => {
  const mapView = document.getElementById("mapView");
  const isHidden = mapView.hidden;

  if (isHidden) {
    mapView.hidden = false;
    grid.style.display = "none";
    emptyState.hidden = true;
    document.getElementById("mapToggleBtn").textContent = "📋 Ro'yxatga qaytish";
    initMap();
    setTimeout(() => {
      leafletMap.invalidateSize();
      renderMapMarkers();
    }, 100);
  } else {
    mapView.hidden = true;
    grid.style.display = "flex";
    document.getElementById("mapToggleBtn").textContent = "🗺 Xaritadan qidirish";
    render();
  }
});

// ---- Referal sahifasi ----
function initReferralView() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") !== "referral") return;

  document.getElementById("referralView").hidden = false;

  const link = params.get("link") || "";
  const count = parseInt(params.get("count") || "0");
  const earnings = parseInt(params.get("earnings") || "0");
  const minAmount = parseInt(params.get("min") || "3600000");

  document.getElementById("refLinkValue").textContent = link;
  document.getElementById("refCount").textContent = count;
  document.getElementById("refEarnings").textContent = earnings.toLocaleString("ru-RU").replace(/,/g, " ");

  const pct = Math.min(100, (earnings / minAmount) * 100);
  document.getElementById("refProgressText").textContent =
    `${earnings.toLocaleString("ru-RU").replace(/,/g, " ")} / ${minAmount.toLocaleString("ru-RU").replace(/,/g, " ")} so'm`;
  setTimeout(() => {
    document.getElementById("refProgressFill").style.width = pct + "%";
  }, 300);

  document.getElementById("refCopyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(link).then(() => {
      const btn = document.getElementById("refCopyBtn");
      btn.textContent = "✅ Nusxalandi!";
      setTimeout(() => { btn.textContent = "📋 Nusxalash"; }, 2000);
    });
  });

  // Pul yomg'iri - taklif soniga qarab intensivlik
  const coinEmojis = ["💰", "🪙", "💵"];
  const rain = document.getElementById("coinRain");
  const coinCount = Math.min(40, Math.max(8, count * 3));

  function dropCoin() {
    const coin = document.createElement("div");
    coin.className = "coin";
    coin.textContent = coinEmojis[Math.floor(Math.random() * coinEmojis.length)];
    coin.style.left = Math.random() * 100 + "vw";
    coin.style.animationDuration = (2.5 + Math.random() * 2) + "s";
    coin.style.fontSize = (16 + Math.random() * 16) + "px";
    rain.appendChild(coin);
    setTimeout(() => coin.remove(), 5000);
  }

  for (let i = 0; i < Math.min(coinCount, 10); i++) {
    setTimeout(dropCoin, i * 150);
  }
  setInterval(dropCoin, Math.max(300, 2000 - count * 100));
}

initReferralView();

// ---- 360 daraja panorama ko'rish ----
document.getElementById("panoClose").addEventListener("click", () => {
  document.getElementById("panoOverlay").hidden = true;
  document.getElementById("panoViewer").innerHTML = "";
});

document.getElementById("panoBtn").addEventListener("click", () => {
  if (!currentDetail || !currentDetail.panorama) return;
  document.getElementById("panoOverlay").hidden = false;
  pannellum.viewer("panoViewer", {
    type: "equirectangular",
    panorama: currentDetail.panorama,
    autoLoad: true,
  });
});

// ---- Profil sahifasi ----
let viewedIds = [];

function saveViewed() {
  const value = JSON.stringify(viewedIds);
  if (tg && tg.CloudStorage) {
    tg.CloudStorage.setItem("viewed", value);
  } else {
    try { localStorage.setItem("ni_viewed", value); } catch (e) {}
  }
}

function trackView(id) {
  if (!viewedIds.includes(id)) {
    viewedIds.push(id);
    saveViewed();
  }
}

function switchToTab(targetType) {
  document.querySelectorAll(".type-tab").forEach(t => t.classList.remove("active"));
  const btn = document.querySelector(`.type-tab[data-type="${targetType}"]`);
  if (btn) {
    btn.classList.add("active");
  } else {
    document.querySelector('.type-tab[data-type="hammasi"]').classList.add("active");
  }
  state.listingType = targetType;
  document.getElementById("mapView").hidden = true;
  grid.style.display = "flex";
  render();
}

function openProfile() {
  const user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileUsername").textContent = user.username ? "@" + user.username : "";
  document.getElementById("profileAvatar").src = user.photo_url || "icon-192.png";

  document.getElementById("statFavorites").textContent = favorites.length;
  const myId = user.id || null;
  const myListingsCount = myId ? listings.filter(l => l.tg_user_id === myId).length : 0;
  document.getElementById("statMyListings").textContent = myListingsCount;
  document.getElementById("statViewed").textContent = viewedIds.length;

  document.getElementById("profileView").hidden = false;
}

document.getElementById("profileBtn").addEventListener("click", openProfile);
document.getElementById("profileClose").addEventListener("click", () => {
  document.getElementById("profileView").hidden = true;
});

document.querySelectorAll("[data-target]").forEach(el => {
  el.addEventListener("click", () => {
    const target = el.dataset.target;
    document.getElementById("profileView").hidden = true;
    switchToTab(target);
  });
});

document.getElementById("profileContactAdmin").addEventListener("click", () => {
  const link = "https://t.me/Ijara_admin_namangan";
  if (tg && tg.openTelegramLink) {
    tg.openTelegramLink(link);
  } else {
    window.open(link, "_blank");
  }
});

// ---- Til tanlash ----
let appLang = "uz";

function initLangSelector() {
  const inTelegram = !!(tg && tg.initData);
  const saved = inTelegram ? null : localStorage.getItem("ni_lang");

  function applyLangChoice(lang) {
    appLang = lang;
    document.getElementById("langSelectOverlay").style.display = "none";
  }

  if (inTelegram && tg.CloudStorage) {
    tg.CloudStorage.getItem("lang", (err, value) => {
      if (!err && value) {
        applyLangChoice(value);
      } else {
        document.getElementById("langSelectOverlay").style.display = "flex";
      }
    });
  } else if (saved) {
    applyLangChoice(saved);
  } else {
    document.getElementById("langSelectOverlay").style.display = "flex";
  }

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (inTelegram && tg.CloudStorage) {
        tg.CloudStorage.setItem("lang", lang);
      } else {
        try { localStorage.setItem("ni_lang", lang); } catch (e) {}
      }
      applyLangChoice(lang);
    });
  });
}

initLangSelector();
