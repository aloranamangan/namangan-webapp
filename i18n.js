// ---------- Tillar ----------
const LANGS = {
  uz: {
    // Umumiy
    loading: 'Yuklanmoqda...', error: 'Xato yuz berdi', serverError: 'Server xatosi',
    save: 'Saqlash', cancel: 'Bekor qilish', delete: 'Ochirish', edit: 'Tahrirlash',
    close: 'Yopish', back: 'Orqaga', next: 'Keyingisi', done: 'Tayyor',
    yes: 'Ha', no: 'Yoq', search: 'Qidirish', empty: 'Bosh',
    // Navigatsiya
    navHome: 'Asosiy', navSearch: 'Qidiruv', navSellers: 'Sotuvchilar',
    navMessages: 'Xabarlar', navSpecial: 'Maxsus', navReferral: 'Referal',
    navMap: 'Xarita', navCurrency: 'Valyuta', navWeather: 'Ob-havo',
    navProfile: 'Profil', navCabinet: 'Kabinet', navNotif: 'Bildirishnoma',
    // E'lon
    newPost: 'Yangi elon', price: 'Narx', title: 'Sarlavha', description: 'Malumot',
    forSale: 'Sotiladi', forRent: 'Ijaraga beriladi',
    daily: 'Kunlik ijara', student: 'Studentlar uchun',
    views: 'korish', likes: 'layk', comments: 'komentariya',
    // Profil
    followers: 'obunachi', posts: 'elon', follow: 'Obuna bolish',
    following: 'Obuna bolingan', message: 'Yozish', call: 'Qongiroq',
    editProfile: 'Profilni tahrirlash', name: 'Ism familiya', nickname: 'Nik nomi',
    phone: 'Telefon',
    // Xabarlar
    messages: 'Xabarlar', writeMessage: 'Xabar yozing', send: 'Yuborish',
    online: 'Hozir onlayn', noChats: 'Suhbatlar bosh',
    // Boshqa
    story: 'Storiy', addStory: 'Storiy qoshish', highlights: 'Aktual',
    settings: 'Sozlamalar', language: 'Til'
  },

  ru: {
    loading: 'Загрузка...', error: 'Произошла ошибка', serverError: 'Ошибка сервера',
    save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Изменить',
    close: 'Закрыть', back: 'Назад', next: 'Далее', done: 'Готово',
    yes: 'Да', no: 'Нет', search: 'Поиск', empty: 'Пусто',
    navHome: 'Главная', navSearch: 'Поиск', navSellers: 'Продавцы',
    navMessages: 'Сообщения', navSpecial: 'Особое', navReferral: 'Рефералы',
    navMap: 'Карта', navCurrency: 'Валюта', navWeather: 'Погода',
    navProfile: 'Профиль', navCabinet: 'Кабинет', navNotif: 'Уведомления',
    newPost: 'Новое объявление', price: 'Цена', title: 'Заголовок', description: 'Описание',
    forSale: 'Продаётся', forRent: 'Сдаётся в аренду',
    daily: 'Посуточно', student: 'Для студентов',
    views: 'просмотров', likes: 'лайков', comments: 'комментариев',
    followers: 'подписчиков', posts: 'объявлений', follow: 'Подписаться',
    following: 'Вы подписаны', message: 'Написать', call: 'Позвонить',
    editProfile: 'Редактировать профиль', name: 'Имя и фамилия', nickname: 'Никнейм',
    phone: 'Телефон',
    messages: 'Сообщения', writeMessage: 'Напишите сообщение', send: 'Отправить',
    online: 'В сети', noChats: 'Нет диалогов',
    story: 'История', addStory: 'Добавить историю', highlights: 'Актуальное',
    settings: 'Настройки', language: 'Язык'
  },

  en: {
    loading: 'Loading...', error: 'An error occurred', serverError: 'Server error',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    close: 'Close', back: 'Back', next: 'Next', done: 'Done',
    yes: 'Yes', no: 'No', search: 'Search', empty: 'Empty',
    navHome: 'Home', navSearch: 'Search', navSellers: 'Sellers',
    navMessages: 'Messages', navSpecial: 'Special', navReferral: 'Referral',
    navMap: 'Map', navCurrency: 'Currency', navWeather: 'Weather',
    navProfile: 'Profile', navCabinet: 'Cabinet', navNotif: 'Notifications',
    newPost: 'New listing', price: 'Price', title: 'Title', description: 'Description',
    forSale: 'For sale', forRent: 'For rent',
    daily: 'Daily rent', student: 'For students',
    views: 'views', likes: 'likes', comments: 'comments',
    followers: 'followers', posts: 'listings', follow: 'Follow',
    following: 'Following', message: 'Message', call: 'Call',
    editProfile: 'Edit profile', name: 'Full name', nickname: 'Nickname',
    phone: 'Phone',
    messages: 'Messages', writeMessage: 'Write a message', send: 'Send',
    online: 'Online now', noChats: 'No conversations',
    story: 'Story', addStory: 'Add story', highlights: 'Highlights',
    settings: 'Settings', language: 'Language'
  }
};

let LANG = 'uz';
try {
  const s = localStorage.getItem('ni_lang');
  if(s && LANGS[s]) LANG = s;
  else if(window.Telegram && window.Telegram.WebApp) {
    const c = window.Telegram.WebApp.initDataUnsafe;
    if(c && c.user && c.user.language_code){
      const lc = c.user.language_code.slice(0,2);
      if(LANGS[lc]) LANG = lc;
    }
  }
} catch(e){}

function t(key){
  return (LANGS[LANG] && LANGS[LANG][key]) || (LANGS.uz[key] || key);
}

function setLang(code){
  if(!LANGS[code]) return;
  LANG = code;
  try { localStorage.setItem('ni_lang', code); } catch(e){}
  location.reload();
}

function langName(code){
  return { uz: "O'zbekcha", ru: 'Русский', en: 'English' }[code] || code;
}

function langFlag(code){
  return { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' }[code] || '';
}

// Sahifadagi data-t belgili elementlarni tarjima qilish
function applyLang(){
  document.querySelectorAll('[data-t]').forEach(function(e){
    const k = e.dataset.t;
    if(k) e.textContent = t(k);
  });
  document.querySelectorAll('[data-tp]').forEach(function(e){
    const k = e.dataset.tp;
    if(k) e.placeholder = t(k);
  });
}

// Til tanlash oynasi
function openLangPicker(){
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = '<div class="sheet" id="lgS"><div class="sheet-bar"></div>' +
    '<div class="sheet-title">' + t('language') + '</div>' +
    ['uz','ru','en'].map(function(c){
      return '<button class="sheet-item" data-l="' + c + '">' +
        langFlag(c) + '&nbsp;&nbsp;' + langName(c) +
        (c === LANG ? ' &nbsp;✓' : '') + '</button>';
    }).join('') + '</div>';

  document.body.appendChild(bg);
  bg.addEventListener('click', function(e){ if(e.target === bg) bg.remove(); });
  document.getElementById('lgS').addEventListener('click', function(e){ e.stopPropagation(); });

  bg.querySelectorAll('.sheet-item').forEach(function(b){
    b.addEventListener('click', function(){ setLang(b.dataset.l); });
  });
}

document.addEventListener('DOMContentLoaded', function(){
  setTimeout(applyLang, 100);
});
