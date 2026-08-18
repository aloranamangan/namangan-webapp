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
    settings: 'Sozlamalar', language: 'Til',
    // Qo'shimcha
    welcome: 'Xush kelibsiz', selectRole: 'Ilovadan qanday foydalanmoqchisiz?',
    roleSeller: 'Sotuvchi / Makler', roleSellerDesc: 'Elon joylayman',
    roleBuyer: 'Xaridor', roleBuyerDesc: 'Elonlarni koraman',
    permanent: 'Tanlov doimiy qoladi',
    loginTitle: 'UYgram', loginDesc: 'Davom etish uchun Telegram akkauntingiz bilan kiring',
    loginBtn: 'Telegram bilan kirish',
    subTitle: 'Ilovadan foydalanish uchun', subDesc: 'Quyidagilarga azo boling',
    subCheck: 'Tekshirish', subOpen: 'Ochish',
    notSubbed: 'Hali azo bolmadingiz',
    blocked: 'Vaqtincha bloklandingiz', paused: 'Vaqtincha toxtatildingiz',
    contactAdmin: 'Admin bilan boglanish',
    daysLeft: 'kundan keyin ochiladi',
    addPost: 'Elon qoshish', selectPhotos: 'Rasm tanlang',
    publish: 'Joylash', publishing: 'Yuklanmoqda...',
    saved: 'Saqlandi', deleted: 'Ochirildi', sent: 'Yuborildi',
    copied: 'Havola nusxalandi', share: 'Ulashish', copy: 'Nusxa',
    noPosts: 'Elon yoq', noResults: 'Topilmadi',
    pinTop: 'Profil tepasiga qadash', unpin: 'Qadashni bekor qilish',
    setLocation: 'Xaritada belgilash', confirmLocation: 'Shu joyni tasdiqlash',
    optional: 'Ixtiyoriy',
    seller: 'Sotuvchi', buyer: 'Xaridor', verified: 'Tasdiqlangan',
    subscribe: 'Obuna bolish', subscribed: 'Obuna bolingan',
    stats: 'Statistika', last30days: 'oxirgi 30 kunda',
    whoLiked: 'Kim layk bosdi', whoViewed: 'Kim kordi',
    myGoal: 'Maqsadingiz', progress: 'Progress', needed: 'Yana kerak',
    invited: 'Taklif qilingan', rewarded: 'Mukofotlangan',
    yourLink: 'Sizning havolangiz', howItWorks: 'Qanday ishlaydi',
    balance: 'Hisobingiz', withdraw: 'Pulni yechish', cardNumber: 'Karta raqami',
    all: 'Hammasi', unread: 'Oqilmagan', online2: 'Onlayn',
    noChatYet: 'Suhbat hali boshlanmagan', notSent: 'Yuborilmadi',
    fileSelected: 'Fayl tanlandi, endi yuboring', download: 'Yuklab olish',
    toStory: 'Storiyga', addedToStory: 'Storiyga qoshildi',
    noMedia: 'Media topilmadi', openInTelegram: 'Telegram orqali kiring',
    micDenied: 'Mikrofonga ruxsat berilmadi',
    recording: 'Yozilmoqda... toxtatish uchun qayta bosing'

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
    settings: 'Настройки', language: 'Язык',
    welcome: 'Добро пожаловать', selectRole: 'Как вы хотите использовать приложение?',
    roleSeller: 'Продавец / Риелтор', roleSellerDesc: 'Размещаю объявления',
    roleBuyer: 'Покупатель', roleBuyerDesc: 'Просматриваю объявления',
    permanent: 'Выбор останется навсегда',
    loginTitle: 'UYgram', loginDesc: 'Войдите через ваш аккаунт Telegram',
    loginBtn: 'Войти через Telegram',
    subTitle: 'Для использования приложения', subDesc: 'Подпишитесь на следующие',
    subCheck: 'Проверить', subOpen: 'Открыть',
    notSubbed: 'Вы ещё не подписались',
    blocked: 'Вы временно заблокированы', paused: 'Вы временно приостановлены',
    contactAdmin: 'Связаться с админом',
    daysLeft: 'дней до разблокировки',
    addPost: 'Добавить объявление', selectPhotos: 'Выберите фото',
    publish: 'Опубликовать', publishing: 'Загрузка...',
    saved: 'Сохранено', deleted: 'Удалено', sent: 'Отправлено',
    copied: 'Ссылка скопирована', share: 'Поделиться', copy: 'Копировать',
    noPosts: 'Нет объявлений', noResults: 'Не найдено',
    pinTop: 'Закрепить вверху', unpin: 'Открепить',
    setLocation: 'Отметить на карте', confirmLocation: 'Подтвердить это место',
    optional: 'Необязательно',
    seller: 'Продавец', buyer: 'Покупатель', verified: 'Подтверждён',
    subscribe: 'Подписаться', subscribed: 'Вы подписаны',
    stats: 'Статистика', last30days: 'за последние 30 дней',
    whoLiked: 'Кто лайкнул', whoViewed: 'Кто посмотрел',
    myGoal: 'Ваша цель', progress: 'Прогресс', needed: 'Ещё нужно',
    invited: 'Приглашено', rewarded: 'Вознаграждено',
    yourLink: 'Ваша ссылка', howItWorks: 'Как это работает',
    balance: 'Ваш баланс', withdraw: 'Вывести деньги', cardNumber: 'Номер карты',
    all: 'Все', unread: 'Непрочитанные', online2: 'В сети',
    noChatYet: 'Диалог ещё не начат', notSent: 'Не отправлено',
    fileSelected: 'Файл выбран, отправьте', download: 'Скачать',
    toStory: 'В историю', addedToStory: 'Добавлено в историю',
    noMedia: 'Медиа не найдено', openInTelegram: 'Откройте через Telegram',
    micDenied: 'Доступ к микрофону запрещён',
    recording: 'Идёт запись... нажмите ещё раз'

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
    settings: 'Settings', language: 'Language',
    welcome: 'Welcome', selectRole: 'How would you like to use the app?',
    roleSeller: 'Seller / Agent', roleSellerDesc: 'I post listings',
    roleBuyer: 'Buyer', roleBuyerDesc: 'I browse listings',
    permanent: 'This choice is permanent',
    loginTitle: 'UYgram', loginDesc: 'Sign in with your Telegram account to continue',
    loginBtn: 'Sign in with Telegram',
    subTitle: 'To use the app', subDesc: 'Subscribe to the following',
    subCheck: 'Check', subOpen: 'Open',
    notSubbed: 'You have not subscribed yet',
    blocked: 'You are temporarily blocked', paused: 'You are temporarily paused',
    contactAdmin: 'Contact admin',
    daysLeft: 'days until unlocked',
    addPost: 'Add listing', selectPhotos: 'Select photos',
    publish: 'Publish', publishing: 'Uploading...',
    saved: 'Saved', deleted: 'Deleted', sent: 'Sent',
    copied: 'Link copied', share: 'Share', copy: 'Copy',
    noPosts: 'No listings', noResults: 'Not found',
    pinTop: 'Pin to top', unpin: 'Unpin',
    setLocation: 'Mark on map', confirmLocation: 'Confirm this location',
    optional: 'Optional',
    seller: 'Seller', buyer: 'Buyer', verified: 'Verified',
    subscribe: 'Follow', subscribed: 'Following',
    stats: 'Statistics', last30days: 'in the last 30 days',
    whoLiked: 'Who liked', whoViewed: 'Who viewed',
    myGoal: 'Your goal', progress: 'Progress', needed: 'Still needed',
    invited: 'Invited', rewarded: 'Rewarded',
    yourLink: 'Your link', howItWorks: 'How it works',
    balance: 'Your balance', withdraw: 'Withdraw', cardNumber: 'Card number',
    all: 'All', unread: 'Unread', online2: 'Online',
    noChatYet: 'No messages yet', notSent: 'Not sent',
    fileSelected: 'File selected, send it', download: 'Download',
    toStory: 'To story', addedToStory: 'Added to story',
    noMedia: 'Media not found', openInTelegram: 'Open in Telegram',
    micDenied: 'Microphone access denied',
    recording: 'Recording... tap again to stop'

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

// ---------- Birinchi kirishda til tanlash ----------
function askLangOnce(cb){
  let done = null;
  try { done = localStorage.getItem('ni_lang_set'); } catch(e){}
  if(done){ if(cb) cb(); return; }

  const ov = document.createElement('div');
  ov.id = 'langPick';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9600;background:#0a0a0a;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    "padding:40px 28px;text-align:center;font-family:'Manrope',sans-serif;color:#fff;";

  ov.innerHTML =
    '<div style="font-size:60px;margin-bottom:20px;">&#127760;</div>' +
    '<h2 style="font-size:24px;font-weight:800;margin-bottom:8px;">Tilni tanlang</h2>' +
    '<p style="font-size:13.5px;color:#8E8E8E;margin-bottom:34px;line-height:1.6;">' +
    'Выберите язык &middot; Choose language</p>' +
    ['uz','ru','en'].map(function(c){
      return '<button class="lgb" data-l="' + c + '" style="width:100%;max-width:320px;' +
        'padding:17px 20px;margin-bottom:11px;border:1px solid #262626;border-radius:16px;' +
        'background:#121212;color:#fff;cursor:pointer;font-family:inherit;' +
        'display:flex;align-items:center;gap:14px;font-size:16px;font-weight:700;">' +
        '<span style="font-size:26px;">' + langFlag(c) + '</span>' +
        '<span>' + langName(c) + '</span></button>';
    }).join('');

  document.body.appendChild(ov);

  ov.querySelectorAll('.lgb').forEach(function(b){
    b.addEventListener('click', function(){
      const c = b.dataset.l;
      LANG = c;
      try {
        localStorage.setItem('ni_lang', c);
        localStorage.setItem('ni_lang_set', '1');
      } catch(e){}
      try { if(window.Telegram && window.Telegram.WebApp)
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
      ov.remove();
      applyLang();
      if(cb) cb();
    });
  });
}
