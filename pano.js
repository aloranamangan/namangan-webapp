// ---------- 360 panorama ko'ruvchi ----------
function loadPannellum(cb){
  if(window.pannellum){ cb(); return; }
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
  document.head.appendChild(css);
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
  s.onload = cb;
  s.onerror = function(){ toast('360 kutubxona yuklanmadi'); };
  document.head.appendChild(s);
}

function openPano(url){
  loadPannellum(function(){
    const d = document.createElement('div');
    d.id = 'panoView';
    d.innerHTML = '<div id="panoBox" style="width:100%;height:100%;"></div>' +
      '<button id="panoClose">&times;</button>';
    document.body.appendChild(d);

    document.getElementById('panoClose').addEventListener('click', function(){ d.remove(); });

    try {
      window.pannellum.viewer('panoBox', {
        type: 'equirectangular',
        panorama: url,
        autoLoad: true,
        showZoomCtrl: true,
        showFullscreenCtrl: false,
        autoRotate: -2
      });
    } catch(e){
      toast('360 ochilmadi');
      d.remove();
    }
  });
}
