/* OPTES home page. Served as a file so the page's CSP needs no inline script.
   The shared chrome (menu, locked sign-in, reveal) lives in /assets/site.js. */
(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(s,r){return (r||document).querySelector(s);};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var clamp = function(x,a,b){return x<a?a:x>b?b:x;};
var mix = function(a,b,t){return a+(b-a)*t;};
var eio = function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
var eout = function(t){return 1-Math.pow(1-t,3);};
var conn = navigator.connection||{};
var lowEnd = (navigator.hardwareConcurrency||8)<=4 || (navigator.deviceMemory||8)<=4;
var light = lowEnd || conn.saveData===true || /(^|-)2g|3g/.test(conn.effectiveType||'');
function loadImg(src){return new Promise(function(res,rej){var i=new Image();i.decoding='async';i.onload=function(){res(i);};i.onerror=rej;i.src=src;});}
/* pixels of a same-origin image; null where the browser refuses (a page opened from disk) */
function pixels(img,w,h){try{var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(img,0,0,w,h);return x.getImageData(0,0,w,h).data;}catch(e){return null;}}
function onResize(el,fn){ /* only when the element itself changes size, not when a phone's toolbar slides */
  var w=0,h=0; var chk=function(){var b=el.getBoundingClientRect();if(Math.abs(b.width-w)>1||Math.abs(b.height-h)>1){var first=!w;w=b.width;h=b.height;if(!first)fn();}};
  if('ResizeObserver' in window) new ResizeObserver(chk).observe(el); else addEventListener('resize',chk);
  chk();
}

/* ───────── the face show: portrait → dust → full figure → dust, at the photographs' own geometry ───────── */
(function(){
  var host=$('#faceStage'); if(!host) return; var paused=false;
  var cv=host.querySelector('canvas'), ctx=cv.getContext('2d');
  var W=0,H=0,dpr=1,cellW=4.4,cellH=7.1,tw=0,th=0,atlas=null,ready=false,imgs=null;
  var M=0, fX,fY,fA,bX,bY,bA,cX,cY,gl,ox,oy,ph;
  var BUCK=16, INK='245,245,245';
  function makeAtlas(){
    tw=Math.max(2,Math.round(cellW*dpr)); th=Math.max(3,Math.round(cellH*dpr));
    atlas=document.createElement('canvas'); atlas.width=tw*10; atlas.height=th*BUCK;
    var a=atlas.getContext('2d'), fp=Math.min(th*.96,tw/.62);
    a.font='600 '+fp.toFixed(1)+'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    a.textAlign='center'; a.textBaseline='middle';
    for(var b=0;b<BUCK;b++){var tone=(b+1)/BUCK;
      for(var g=0;g<10;g++){
        a.globalAlpha=Math.min(.3,tone*.22); a.fillStyle='rgb('+INK+')'; a.fillRect(g*tw,b*th,tw,th);   // the tone under the digit, so the picture holds
        a.globalAlpha=Math.pow(tone,.85); a.fillText(String(g),g*tw+tw/2,b*th+th/2+.5);
      }}
  }
  /* every cell reads its light from the photograph at its own place, in the photograph's own proportions:
     nothing is moved, stretched or drawn in. `fade` only dims the bottom rows of a cropped portrait. */
  function sample(img,rx,ry,rw,rh,fade){
    var cols=Math.max(8,Math.floor(rw/cellW)), rows=Math.max(8,Math.floor(rh/cellH));
    var d=pixels(img,cols,rows); if(!d) return null;
    var pts=[], cw=rw/cols, ch=rh/rows;
    for(var r=0;r<rows;r++)for(var q=0;q<cols;q++){var v=d[(r*cols+q)*4]/255; if(fade)v*=Math.min(1,(rows-1-r)/(rows*.14)); if(v>.075) pts.push([rx+(q+.5)*cw, ry+(r+.5)*ch, v]);}
    return pts;
  }
  function size(){W=host.clientWidth;H=host.clientHeight;dpr=Math.min(devicePixelRatio||1,lowEnd?1.5:2);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  function build(){
    size();
    var small=W<560; cellW=small?(lowEnd?4.2:3.4):(lowEnd?5:4.2); cellH=cellW/.62; makeAtlas();
    var side=Math.min(W*.96,H*.9), fx0=(W-side)/2, fy0=(H-side)/2-H*.02;                  // the portrait is square
    var bh=H*.96, bw=bh*(320/480); if(bw>W*.96){bw=W*.96;bh=bw*1.5;}                       // the figure is 2:3
    var F=sample(imgs[0],fx0,fy0,side,side,true), Bd=sample(imgs[1],(W-bw)/2,(H-bh)/2,bw,bh,false);
    if(!F||!Bd){   // opened from disk: show the portrait's light itself, still at its true geometry
      ready=false; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.globalAlpha=.9; ctx.drawImage(imgs[0],fx0,fy0,side,side); ctx.globalAlpha=1; return; }
    M=Math.max(F.length,Bd.length);
    fX=new Float32Array(M);fY=new Float32Array(M);fA=new Float32Array(M);bX=new Float32Array(M);bY=new Float32Array(M);bA=new Float32Array(M);
    cX=new Float32Array(M);cY=new Float32Array(M);gl=new Uint8Array(M);ox=new Float32Array(M);oy=new Float32Array(M);ph=new Float32Array(M);
    for(var i=0;i<M;i++){
      var fi=Math.floor(i*F.length/M), bi=Math.floor(i*Bd.length/M);
      var f=F[fi], q=Bd[bi], dupF=(i>0&&Math.floor((i-1)*F.length/M)===fi), dupB=(i>0&&Math.floor((i-1)*Bd.length/M)===bi);
      fX[i]=f[0];fY[i]=f[1];fA[i]=dupF?0:f[2];      // a cell shared by two particles is lit once, never twice
      bX[i]=q[0];bY[i]=q[1];bA[i]=dupB?0:q[2];
      cX[i]=W*(.12+.76*Math.random()); cY[i]=H*(.62+.5*Math.random());
      gl[i]=Math.random()*10|0; ph[i]=Math.random()*6.283;
    }
    ready=true;
  }
  /* the loop, in seconds: rise into the face, hold, dissolve, become the figure, hold, dissolve */
  var CYC=26, K=[0,3.4,9.8,12.8,16.2,22.4,25.4];
  var px=-1e4,py=-1e4,pOn=false, scrollAmp=0, lastY=scrollY, start=performance.now(), visible=false, raf=0;
  function ptr(e){var r=host.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;pOn=true;}
  host.addEventListener('pointermove',ptr); host.addEventListener('pointerdown',ptr);
  host.addEventListener('pointerleave',function(){pOn=false;});
  host.addEventListener('pointerup',function(e){if(e.pointerType!=='mouse')pOn=false;});
  host.addEventListener('pointercancel',function(){pOn=false;});
  addEventListener('scroll',function(){var y=scrollY;if(visible)scrollAmp=Math.min(24,scrollAmp+Math.abs(y-lastY)*.05);lastY=y;},{passive:true});
  function draw(now){
    raf=0; if(!ready||!visible||document.hidden) return;
    var t=(reduce||paused)?5:((now-start)/1000)%CYC;
    var r=host.getBoundingClientRect(), shiftY=reduce?0:clamp((r.top+r.height/2-innerHeight/2)/innerHeight,-1,1)*-24;
    scrollAmp*=.94;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
    var R=W<560?56:84, R2=R*R;
    for(var i=0;i<M;i++){
      var x,y,al,sp=(ph[i]/6.283)*.35;
      var cx=cX[i]+Math.sin(t*.35+ph[i])*28, cy=cY[i]+Math.cos(t*.27+ph[i]*1.3)*18;
      if(t<K[1]){var e=eout(clamp((t-sp)/(K[1]-.35),0,1));x=mix(cx,fX[i],e);y=mix(cy,fY[i],e)+Math.sin(Math.PI*e)*(ph[i]-3)*6;al=mix(.18,fA[i],e);}
      else if(t<K[2]){x=fX[i];y=fY[i];al=fA[i];}
      else if(t<K[3]){var e2=eio(clamp((t-K[2]-sp)/(K[3]-K[2]-.35),0,1));x=mix(fX[i],cx,e2);y=mix(fY[i],cy,e2);al=mix(fA[i],.2,e2);}
      else if(t<K[4]){var e3=eio(clamp((t-K[3]-sp)/(K[4]-K[3]-.35),0,1));x=mix(cx,bX[i],e3);y=mix(cy,bY[i],e3)+Math.sin(Math.PI*e3)*(ph[i]-3)*8;al=mix(.2,bA[i],e3);}
      else if(t<K[5]){x=bX[i];y=bY[i];al=bA[i];}
      else if(t<K[6]){var e4=eio(clamp((t-K[5]-sp)/(K[6]-K[5]-.35),0,1));x=mix(bX[i],cx,e4);y=mix(bY[i],cy,e4);al=mix(bA[i],.18,e4);}
      else {x=cx;y=cy;al=.18;}
      if(al<.03) continue;
      /* the pointer parts them; they return to exactly where they were */
      var tx=0,ty=0;
      if(pOn&&!reduce){var dx=x-px,dy=y-py,d2=dx*dx+dy*dy;if(d2<R2){var d=Math.sqrt(d2)||1,k=(1-d/R);k=k*k*R*.95;tx=dx/d*k;ty=dy/d*k;}}
      ox[i]+=(tx-ox[i])*.16; oy[i]+=(ty-oy[i])*.16;
      var jx=0,jy=0; if(scrollAmp>.3){jx=Math.sin(ph[i]*7+t*9)*scrollAmp*.35;jy=Math.cos(ph[i]*5+t*8)*scrollAmp*.35;}
      if(!reduce&&Math.random()<.015) gl[i]=Math.random()*10|0;
      var bk=Math.min(BUCK-1,Math.floor(al*BUCK));
      ctx.drawImage(atlas,gl[i]*tw,bk*th,tw,th,Math.round((x+ox[i]+jx-cellW/2)*dpr),Math.round((y+oy[i]+jy+shiftY-cellH/2)*dpr),tw,th);
    }
    if(!reduce&&!paused) raf=requestAnimationFrame(draw);
  }
  function kick(){ if(!raf&&visible&&ready&&!document.hidden) raf=requestAnimationFrame(draw); }
  var io=new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible){if(!io._s){io._s=1;start=performance.now();}   /* the face rises as you arrive */
    if(!imgs&&!io._l){io._l=1;Promise.all([loadImg('/assets/face-portrait.png'),loadImg('/assets/face-body.png')]).then(function(r){imgs=r;build();kick();}).catch(function(){host.classList.add("face-load-failed");});}kick();}},{rootMargin:'300px 0px'});
  io.observe(host);
  document.addEventListener('optes:motion',function(e){paused=e.detail.paused;cancelAnimationFrame(raf);raf=0;kick();});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',function(e){reduce=e.matches;cancelAnimationFrame(raf);raf=0;kick();});
  document.addEventListener('visibilitychange',function(){if(document.hidden){cancelAnimationFrame(raf);raf=0;}else kick();});
  onResize(host,function(){ready=false;size();if(imgs){build();kick();}});
  host.addEventListener('pointermove',function(){if(reduce&&ready){raf=0;draw(performance.now());}});
})();

/* ───────── the game card plays its film on hover ───────── */
(function(){
  var card=$('#gameCard'); if(!card) return; var v=card.querySelector('video');
  if(reduce||light||!matchMedia('(hover:hover) and (min-width:761px)').matches) return;
  card.addEventListener('mouseenter',function(){var p=v.play();if(p&&p.then)p.then(function(){card.classList.add('playing');}).catch(function(){});});
  card.addEventListener('mouseleave',function(){card.classList.remove('playing');v.pause();});
})();
})();
