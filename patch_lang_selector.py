with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

old = '''<div class="app">'''

new = '''<div class="lang-select-overlay" id="langSelectOverlay">
  <div class="lang-select-box">
    <div class="lang-select-icon">🌐</div>
    <h2>Tilni tanlang / Выберите язык / Choose language</h2>
    <button class="lang-btn" data-lang="uz">🇺🇿 O'zbekcha</button>
    <button class="lang-btn" data-lang="ru">🇷🇺 Русский</button>
    <button class="lang-btn" data-lang="en">🇬🇧 English</button>
  </div>
</div>

<div class="app">'''

if old not in content:
    print("XATO: topilmadi")
elif "langSelectOverlay" in content:
    print("Allaqachon bor")
else:
    content = content.replace(old, new, 1)
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: til tanlash ekrani qo'shildi")
