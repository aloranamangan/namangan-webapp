'use strict';

const CONFIG = {
  asset: {
    mode: 'placeholder',
    video: { src:'assets/eagle/eagle.webm', cycleStart:0, cycleEnd:0.9 },
    frames:{ pattern:'assets/eagle/frame_%d.webp', count:24, pad:3 }
  },
  size:   { desktop:260, tablet:200, mobile:138 },
  motion: { follow:0.055, bankGain:46, bankMax:26,
            flapBase:1.5, flapPerSpeed:9.0, takeoffFlap:3.4 },
  landing:{ approach:0.95, holdIn:0.14, holdOut:0.30, takeoff:0.55 },
  path: [
    { t:0.00, x:0.90, y:0.22, scale:0.62 },
    { t:0.14, x:0.62, y:0.34, scale:0.86 },
    { t:0.30, x:0.24, y:0.28, scale:1.00 },
    { t:0.46, x:0.34, y:0.46, scale:0.94 },
    { t:0.62, x:0.70, y:0.38, scale:0.90 },
    { t:0.78, x:0.44, y:0.30, scale:0.82 },
    { t:1.00, x:0.14, y:0.18, scale:0.66 }
  ]
};

const STATE = { FLYING:'Flying', LANDING:'Landing', LANDED:'Landed', TAKEOFF:'Taking Off' };

class EagleAsset{
  constructor(cfg){ this.cfg=cfg; this.mode=cfg.mode; this.ready=false;
    this.aspect=0.58; this._phase=0; this._load(); }
  _load(){
    if(this.mode==='video') return this._loadVideo();
    if(this.mode==='frames') return this._loadFrames();
    this.ready=true;
  }
  _loadVideo(){
    const v=document.createElement('video');
    v.src=this.cfg.video.src; v.muted=true; v.loop=true;
    v.playsInline=true; v.preload='auto';
    v.addEventListener('loadeddata',()=>{ this.aspect=v.videoHeight/v.videoWidth; this.ready=true; });
    v.addEventListener('error',()=>{ this.mode='placeholder'; this.ready=true; });
    v.play().catch(()=>{}); this.video=v;
  }
  _loadFrames(){
    const {pattern,count,pad}=this.cfg.frames;
    this.frames=[]; let ok=0, bad=0;
    for(let i=0;i<count;i++){
      const im=new Image();
      im.src=pattern.replace('%d',String(i).padStart(pad,'0'));
      im.onload=()=>{ if(i===0) this.aspect=im.naturalHeight/im.naturalWidth;
        if(++ok===count) this.ready=true; };
      im.onerror=()=>{ if(++bad===1){ this.mode='placeholder'; this.ready=true; } };
      this.frames.push(im);
    }
  }
  seek(p){
    if(this.mode==='video'&&this.video&&this.ready){
      const c=this.cfg.video, t=c.cycleStart+(c.cycleEnd-c.cycleStart)*p;
      if(Math.abs(this.video.currentTime-t)>0.012){ try{ this.video.currentTime=t; }catch(e){} }
    }
    this._phase=p;
  }
  source(){
    if(this.mode==='video') return this.ready?this.video:null;
    if(this.mode==='frames'&&this.ready){
      const n=this.frames.length;
      return this.frames[Math.min(n-1,Math.floor(this._phase*n))];
    }
    return null;
  }
}

function spline(a,b,c,d,u){
  const u2=u*u,u3=u2*u;
  return 0.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u2+(-a+3*b-3*c+d)*u3);
}
const easeInOut=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-t,3);
const lerp=(a,b,n)=>a+(b-a)*n;

class FlightPath{
  constructor(k){ this.keys=k; }
  at(t){
    const k=this.keys; t=Math.max(0,Math.min(1,t));
    let i=0; while(i<k.length-2&&t>k[i+1].t) i++;
    const p0=k[Math.max(0,i-1)],p1=k[i],
          p2=k[Math.min(k.length-1,i+1)],p3=k[Math.min(k.length-1,i+2)];
    const span=(p2.t-p1.t)||1, u=(t-p1.t)/span;
    return { x:spline(p0.x,p1.x,p2.x,p3.x,u),
             y:spline(p0.y,p1.y,p2.y,p3.y,u),
             scale:spline(p0.scale,p1.scale,p2.scale,p3.scale,u) };
  }
}

class Eagle{
  constructor(cv){
    this.canvas=cv; this.ctx=cv.getContext('2d');
    this.asset=new EagleAsset(CONFIG.asset);
    this.path=new FlightPath(CONFIG.path);
    this.perchEl=document.querySelector('[data-eagle-perch]');
    this.state=STATE.FLYING; this.progress=0; this.paused=false;
    this.pos={x:0,y:0}; this.vel={x:0,y:0};
    this.scale=1; this.bank=0; this.facing=-1;
    this.flapPhase=0; this.wing=1; this.legs=0; this.breath=0;
    this._forced=null;
    this.resize(); this._seed();
  }
  resize(){
    const dpr=Math.min(2,window.devicePixelRatio||1);
    this.vw=window.innerWidth; this.vh=window.innerHeight;
    this.canvas.width=Math.round(this.vw*dpr);
    this.canvas.height=Math.round(this.vh*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.baseW=this.vw<640?CONFIG.size.mobile:this.vw<1024?CONFIG.size.tablet:CONFIG.size.desktop;
  }
  _seed(){
    const p=this.path.at(0);
    this.pos.x=p.x*this.vw; this.pos.y=p.y*this.vh; this.scale=p.scale;
  }
  _window(){
    if(!this.perchEl) return null;
    const r=this.perchEl.getBoundingClientRect();
    const mid=r.top+window.scrollY+r.height/2-this.vh/2;
    const L=CONFIG.landing;
    return { approach:mid-this.vh*L.approach, touch:mid-this.vh*L.holdIn,
             leave:mid+this.vh*L.holdOut,
             airborne:mid+this.vh*L.holdOut+this.vh*L.takeoff, rect:r };
  }
  _perch(rect){
    const fx=parseFloat(this.perchEl.dataset.perchX||'0.66');
    const dy=parseFloat(this.perchEl.dataset.perchY||'16');
    return { x:rect.left+rect.width*fx, y:rect.top+dy };
  }
  update(dt){
    const maxS=Math.max(1,document.documentElement.scrollHeight-this.vh);
    const sy=this._forced!==null?this._forced:window.scrollY;
    this.progress=Math.max(0,Math.min(1,sy/maxS));
    const w=this._window();
    let target,ts;

    if(!w||sy<w.approach){
      this.state=STATE.FLYING;
      const p=this.path.at(this.progress);
      target={x:p.x*this.vw,y:p.y*this.vh}; ts=p.scale; this.wing=1; this.legs=0;
    } else if(sy<w.touch){
      this.state=STATE.LANDING;
      const k=easeInOut((sy-w.approach)/(w.touch-w.approach));
      const p=this.path.at(this.progress), pp=this._perch(w.rect);
      target={x:lerp(p.x*this.vw,pp.x,k),y:lerp(p.y*this.vh,pp.y,k)};
      ts=lerp(p.scale,1.06,k); this.wing=lerp(1,0.34,k);
      this.legs=easeOut(Math.max(0,(k-0.45)/0.55));
    } else if(sy<w.leave){
      this.state=STATE.LANDED;
      target=this._perch(w.rect); ts=1.06; this.wing=0.05; this.legs=1;
    } else if(sy<w.airborne){
      this.state=STATE.TAKEOFF;
      const k=easeOut((sy-w.leave)/(w.airborne-w.leave));
      const pp=this._perch(w.rect), p=this.path.at(this.progress);
      target={x:lerp(pp.x,p.x*this.vw,k),
              y:lerp(pp.y,p.y*this.vh-this.vh*0.10*(1-k),k)};
      ts=lerp(1.06,p.scale,k); this.wing=lerp(1.42,1,k);
      this.legs=1-easeOut(Math.min(1,k/0.4));
    } else {
      this.state=STATE.FLYING;
      const p=this.path.at(this.progress);
      target={x:p.x*this.vw,y:p.y*this.vh}; ts=p.scale; this.wing=1; this.legs=0;
    }

    const grip=this.state===STATE.LANDED?0.32:CONFIG.motion.follow;
    const step=1-Math.pow(1-grip,dt*60);
    const nx=lerp(this.pos.x,target.x,step), ny=lerp(this.pos.y,target.y,step);
    this.vel.x=lerp(this.vel.x,(nx-this.pos.x)/Math.max(dt,0.001),0.25);
    this.vel.y=lerp(this.vel.y,(ny-this.pos.y)/Math.max(dt,0.001),0.25);
    this.pos.x=nx; this.pos.y=ny;
    this.scale=lerp(this.scale,ts,step);

    const sp=Math.hypot(this.vel.x,this.vel.y)/this.vw;
    let bt=0;
    if(this.state!==STATE.LANDED){
      bt=Math.max(-CONFIG.motion.bankMax,Math.min(CONFIG.motion.bankMax,
         -(this.vel.y/this.vw)*CONFIG.motion.bankGain*34));
    }
    this.bank=lerp(this.bank,bt,1-Math.pow(0.86,dt*60));
    if(Math.abs(this.vel.x)>this.vw*0.06) this.facing=this.vel.x>0?1:-1;

    let rate;
    if(this.state===STATE.LANDED) rate=0.22;
    else if(this.state===STATE.TAKEOFF) rate=CONFIG.motion.takeoffFlap;
    else rate=CONFIG.motion.flapBase+sp*CONFIG.motion.flapPerSpeed;
    this.flapPhase=(this.flapPhase+rate*dt)%1;
    this.asset.seek(this.flapPhase);
    this.breath=(this.breath+dt*0.55)%1;
  }
  draw(){
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.vw,this.vh);
    const w=this.baseW*this.scale;
    if(this.pos.x<-w||this.pos.x>this.vw+w) return;
    const br=this.state===STATE.LANDED?1+Math.sin(this.breath*Math.PI*2)*0.012:1;
    ctx.save();
    ctx.translate(this.pos.x,this.pos.y);
    ctx.rotate(this.bank*Math.PI/180);
    ctx.scale(this.facing*br,br);
    const src=this.asset.source();
    if(src){ const h=w*this.asset.aspect; ctx.drawImage(src,-w/2,-h/2,w,h); }
    else { drawEagle(ctx,w,this.flapPhase,this.wing,this.legs); }
    ctx.restore();
  }
  flyTo(kind){
    const w=this._window(); if(!w) return;
    const y=kind==='land'?(w.touch+w.leave)/2:w.leave+(w.airborne-w.leave)*0.55;
    this._forced=null;
    window.scrollTo({top:y,behavior:'smooth'});
  }
  reset(){
    this._forced=null; this.state=STATE.FLYING;
    this.vel={x:0,y:0}; this.bank=0; this._seed();
    window.scrollTo({top:0,behavior:'smooth'});
  }
}

function drawEagle(ctx,w,phase,wingAmt,legAmt){
  const s=w/260, beat=Math.sin(phase*Math.PI*2);
  const lift=beat*42*wingAmt, curl=(1-wingAmt)*0.62;
  ctx.save(); ctx.scale(s,s);

  const body=ctx.createLinearGradient(0,-34,0,40);
  body.addColorStop(0,'#6E4B2C'); body.addColorStop(1,'#31210F');

  ctx.save(); ctx.rotate((-lift*0.72)*Math.PI/180);
  wing(ctx,-1,curl,wingAmt,0.82); ctx.restore();

  ctx.save(); ctx.rotate((beat*5*wingAmt)*Math.PI/180);
  ctx.beginPath();
  ctx.moveTo(28,12); ctx.lineTo(78,6-14*wingAmt); ctx.lineTo(80,20);
  ctx.lineTo(76,34+10*wingAmt); ctx.lineTo(28,24); ctx.closePath();
  ctx.fillStyle='#4A3218'; ctx.fill();
  ctx.strokeStyle='rgba(20,12,4,.75)'; ctx.lineWidth=1.1; ctx.stroke();
  for(let i=1;i<4;i++){
    ctx.beginPath(); ctx.moveTo(34,14+i*2.6);
    ctx.lineTo(76,8+i*7-10*wingAmt);
    ctx.strokeStyle='rgba(20,12,4,.4)'; ctx.lineWidth=.9; ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath(); ctx.ellipse(0,6,34,20,-0.16,0,Math.PI*2);
  ctx.fillStyle=body; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0,6,34,20,-0.16,0,Math.PI*2); ctx.clip();
  for(let i=-3;i<5;i++){
    ctx.beginPath(); ctx.arc(-8+i*8,2+(i%2)*7,7,0.2,Math.PI-0.2);
    ctx.strokeStyle='rgba(255,225,190,.09)'; ctx.lineWidth=1.4; ctx.stroke();
  }
  ctx.restore();

  if(legAmt>0.02){
    const drop=8+legAmt*22;
    ctx.strokeStyle='#E9A72C'; ctx.lineWidth=3.4; ctx.lineCap='round';
    [-8,6].forEach(ox=>{
      ctx.beginPath(); ctx.moveTo(ox,20);
      ctx.lineTo(ox+2*legAmt,20+drop); ctx.stroke();
      ctx.lineWidth=2.4;
      [-5,0,5].forEach(tx=>{
        ctx.beginPath(); ctx.moveTo(ox+2*legAmt,20+drop);
        ctx.lineTo(ox+2*legAmt+tx*legAmt,20+drop+5*legAmt); ctx.stroke();
      });
      ctx.lineWidth=3.4;
    });
    ctx.lineCap='butt';
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-24,-6); ctx.quadraticCurveTo(-38,-16,-44,-26);
  ctx.lineTo(-30,-20); ctx.quadraticCurveTo(-26,-12,-20,-4); ctx.closePath();
  ctx.fillStyle='#F2EFE6'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-48,-30,14,12,-0.2,0,Math.PI*2);
  ctx.fillStyle='#F7F5EC'; ctx.fill();
  ctx.strokeStyle='rgba(150,145,130,.5)'; ctx.lineWidth=.9; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-58,-36); ctx.quadraticCurveTo(-50,-40,-42,-36);
  ctx.strokeStyle='#8C8776'; ctx.lineWidth=1.8; ctx.stroke();
  ctx.beginPath(); ctx.arc(-53,-31,2.9,0,Math.PI*2);
  ctx.fillStyle='#140D04'; ctx.fill();
  ctx.beginPath(); ctx.arc(-54,-32,1,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-60,-28);
  ctx.quadraticCurveTo(-76,-25,-78,-18);
  ctx.quadraticCurveTo(-70,-18,-62,-22); ctx.closePath();
  ctx.fillStyle='#F0B429'; ctx.fill();
  ctx.strokeStyle='#B5820B'; ctx.lineWidth=.9; ctx.stroke();
  ctx.restore();

  ctx.save(); ctx.rotate(lift*Math.PI/180);
  wing(ctx,1,curl,wingAmt,1); ctx.restore();
  ctx.restore();
}

function wing(ctx,dir,curl,spread,alpha){
  const span=118*(0.36+0.64*spread), droop=26*curl;
  ctx.save(); ctx.globalAlpha=alpha;
  const g=ctx.createLinearGradient(0,-20*dir,span,30*dir);
  g.addColorStop(0,'#7A5432'); g.addColorStop(0.5,'#4C3319'); g.addColorStop(1,'#291A0B');
  ctx.beginPath(); ctx.moveTo(-4,0);
  ctx.quadraticCurveTo(span*0.34,(-30+droop)*dir,span*0.74,(-22+droop*1.3)*dir);
  ctx.quadraticCurveTo(span*0.96,(-14+droop)*dir,span,(2+droop)*dir);
  ctx.quadraticCurveTo(span*0.7,(16+droop*.6)*dir,span*0.34,(14+droop*.4)*dir);
  ctx.quadraticCurveTo(span*0.12,12*dir,-4,10*dir); ctx.closePath();
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(18,10,3,.7)'; ctx.lineWidth=1.1; ctx.stroke();
  const n=6;
  for(let i=0;i<n;i++){
    const k=i/(n-1), bx=span*(0.56+k*0.42);
    const by=(-20+droop*1.2+k*10)*dir, len=26*spread+6;
    ctx.beginPath(); ctx.moveTo(bx,by);
    ctx.quadraticCurveTo(bx+len*.6,by-5*dir,bx+len,by+3*dir);
    ctx.strokeStyle='rgba(22,13,4,.62)'; ctx.lineWidth=2.4;
    ctx.lineCap='round'; ctx.stroke();
  }
  for(let i=1;i<=3;i++){
    ctx.beginPath(); ctx.moveTo(span*0.08,(2+i*2)*dir);
    ctx.quadraticCurveTo(span*0.42,(-10+droop+i*4)*dir,span*0.72,(-6+droop+i*5)*dir);
    ctx.strokeStyle='rgba(240,215,180,.10)'; ctx.lineWidth=1.6; ctx.stroke();
  }
  ctx.restore();
}

const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv=document.getElementById('eagle-canvas');
let eagle=null;

if(cv&&!reduced){
  eagle=new Eagle(cv);
  let last=performance.now();
  const loop=now=>{
    const dt=Math.min(0.05,(now-last)/1000); last=now;
    if(!eagle.paused){ eagle.update(dt); eagle.draw(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  let rt;
  window.addEventListener('resize',()=>{ clearTimeout(rt);
    rt=setTimeout(()=>eagle.resize(),120); });
}

(()=>{
  const p=document.getElementById('eagle-test'); if(!p) return;
  const body=document.getElementById('et-body');
  const tg=document.getElementById('et-toggle');
  const oP=document.getElementById('et-prog');
  const oS=document.getElementById('et-state');
  const oA=document.getElementById('et-asset');
  tg.addEventListener('click',()=>{ body.hidden=!body.hidden; });
  p.addEventListener('click',e=>{
    const a=e.target.dataset&&e.target.dataset.et;
    if(!a||!eagle) return;
    if(a==='play') eagle.paused=false;
    if(a==='pause') eagle.paused=true;
    if(a==='reset'){ eagle.paused=false; eagle.reset(); }
    if(a==='land'){ eagle.paused=false; eagle.flyTo('land'); }
    if(a==='takeoff'){ eagle.paused=false; eagle.flyTo('takeoff'); }
  });
  setInterval(()=>{
    if(!eagle){ oS.textContent='disabled'; return; }
    oP.textContent=Math.round(eagle.progress*100)+'%';
    oS.textContent=eagle.state;
    oA.textContent=eagle.asset.mode;
  },120);
})();

(()=>{
  const nav=document.getElementById('nav');
  const on=()=>nav.classList.toggle('is-stuck',window.scrollY>40);
  window.addEventListener('scroll',on,{passive:true}); on();
  const b=document.getElementById('burger');
  b.addEventListener('click',()=>nav.classList.toggle('is-open'));
  nav.querySelectorAll('.nav-links a').forEach(a=>
    a.addEventListener('click',()=>nav.classList.remove('is-open')));
})();

(()=>{
  const RENT=[
    {t:'2 xonali, Chorsu',p:'2 500 000/oy',s:"54 m2 · 3-qavat · mebelli",g:['Oylik','Mebelli']},
    {t:'Hovli, Uychi',p:'3 200 000/oy',s:'120 m2 · 5 sotix · alohida',g:['Oylik','Hovli']},
    {t:'Studiya, markaz',p:'180 000/kun',s:"32 m2 · yangi ta'mir",g:['Kunlik']},
    {t:"4 xonali, Navoiy k.",p:'4 800 000/oy',s:'96 m2 · konditsioner',g:['Oylik']},
    {t:"Ofis, Bobur ko'chasi",p:'5 500 000/oy',s:'78 m2 · alohida kirish',g:['Ofis']},
    {t:'Studentlar uchun',p:'900 000/oy',s:"2 o'rin · universitetga yaqin",g:['Student']}
  ];
  const SALE=[
    {t:'3 xonali, markaz',p:'420 000 000',s:"72 m2 · ta'mirlangan",g:['Kvartira']},
    {t:"Hovli, Chust yo'li",p:'850 000 000',s:'180 m2 · 8 sotix',g:['Hovli']},
    {t:'Yer maydoni, Pop',p:'240 000 000',s:'12 sotix · ruxsat bor',g:['Yer']},
    {t:"Do'kon, Chorsu",p:'1 100 000 000',s:'64 m2 · bozorga 200 m',g:['Tijorat']},
    {t:'5 xonali, yangi uy',p:'1 640 000 000',s:'156 m2 · garaj',g:['Hovli','Garaj']},
    {t:'2 xonali, Uychi',p:'310 000 000',s:'48 m2 · 2-qavat',g:['Kvartira']}
  ];
  const card=(d,i)=>'<article class="card">'+
    '<div class="ph ph-card" data-ph="listing-'+(i+1)+'.jpg"></div>'+
    '<div class="card-body"><div class="card-top"><h3>'+d.t+'</h3>'+
    '<span class="amt">'+d.p+'</span></div>'+
    '<p class="spec">'+d.s+'</p><div class="tagrow">'+
    d.g.map(g=>'<span class="tag">'+g+'</span>').join('')+
    '</div></div></article>';
  const r=document.getElementById('grid-rent');
  const s=document.getElementById('grid-sale');
  if(r) r.innerHTML=RENT.map(card).join('');
  if(s) s.innerHTML=SALE.map((d,i)=>card(d,i+6)).join('');
})();
