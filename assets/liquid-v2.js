/* OPTES «ماء حي» v2 (2026-11-07, preview only). Decorative: no network beyond loading its own WebGL file from this
   site, no storage, no tracking. Sections flow in, cards follow the pointer, headings catch the light; on the home the
   live water (liquid-v2-gl.js) starts after the page has painted, and only on devices that can afford it. */
(function(){'use strict';
var d=document,root=d.documentElement,w=window;
var mm=function(q){return w.matchMedia&&w.matchMedia(q).matches;};
var still=mm('(prefers-reduced-motion: reduce)');
root.classList.add('lq2-js');

/* sections: the ones already on screen stay as they are; the rest flow in when reached */
var secs=[].slice.call(d.querySelectorAll('main>.nx-section'));
var vh=w.innerHeight||800;
secs.forEach(function(s){if(still||s.getBoundingClientRect().top<vh*0.98){s.classList.add('lq2-in','lq2-done');}});
var cards=[].slice.call(d.querySelectorAll('.nx-product,.nx-plan,.nx-downloads article,main.for .mcard,main.for .pcard,.plans .plan'));
if('IntersectionObserver' in w){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    var t=e.target;
    if(t.classList.contains('nx-section')){if(e.isIntersecting){t.classList.add('lq2-in');setTimeout(function(){t.classList.add('lq2-done');},1500);io.unobserve(t);}return;}
    t.classList.toggle('lq2-in',e.isIntersecting);
  });},{rootMargin:'0px 0px -8% 0px'});
  secs.forEach(function(s){if(!s.classList.contains('lq2-in'))io.observe(s);});
  cards.forEach(function(c){io.observe(c);});
}else{secs.forEach(function(s){s.classList.add('lq2-in','lq2-done');});}

/* pointer: the light band on headings and the highlight on the card under the pointer (one write per frame) */
if(!still&&mm('(hover: hover) and (pointer: fine)')){
  var px=0,py=0,pend=false,card=null,h1=d.querySelector('.nx-hero h1');
  var paint=function(){pend=false;
    if(h1)h1.style.setProperty('--lq2-x',(px/(w.innerWidth||1)*100).toFixed(1)+'%');
    if(card){var r=card.getBoundingClientRect();card.style.setProperty('--lq2-mx',((px-r.left)/r.width*100*1.25-12.5).toFixed(1)+'%');card.style.setProperty('--lq2-my',((py-r.top)/r.height*100*1.25-12.5).toFixed(1)+'%');}};
  d.addEventListener('pointermove',function(e){px=e.clientX;py=e.clientY;
    card=e.target&&e.target.closest?e.target.closest('.nx-product,.nx-plan,.nx-downloads article,main.for .mcard,main.for .pcard,.plans .plan'):null;
    if(!pend){pend=true;w.requestAnimationFrame(paint);}},{passive:true});
}

/* the live water: home hero only, after first paint, never on reduced motion / data saver / very small devices */
var hero=d.querySelector('.nx-home .nx-hero');
if(!hero||still||mm('(prefers-reduced-transparency: reduce)'))return;
var c=navigator.connection;
if(c&&(c.saveData||/2g/.test(c.effectiveType||'')))return;
if(navigator.deviceMemory&&navigator.deviceMemory<2)return;
var src=(d.currentScript&&d.currentScript.src||'').replace(/liquid-v2\.js/,'liquid-v2-gl.js');
if(!src)return;
var go=function(){var s=d.createElement('script');s.src=src;s.async=true;d.head.appendChild(s);};
var later=function(){(w.requestIdleCallback||function(f){return setTimeout(f,1);})(function(){setTimeout(go,1200);},{timeout:3000});};
if(d.readyState==='complete')later();else w.addEventListener('load',later,{once:true});
})();
