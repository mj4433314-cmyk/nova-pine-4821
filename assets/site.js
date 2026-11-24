/* OPTES shared site chrome: phone menu, the locked sign-in note, the locked download and subscribe buttons, gentle reveal.
   No inline handlers, same-origin only. */
(function(){
'use strict';
var root=document.documentElement;
var en=(root.lang||'').slice(0,2)==='en';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};

/* phone and tablet menu */
var btn=document.querySelector('.sn-menu-btn'), menu=document.getElementById('sn-menu');
if(btn&&menu){
  var others=function(){return $$('body > main, body > footer');};
  var set=function(open){
    root.classList.toggle('menu-open',open);
    btn.setAttribute('aria-expanded',String(open));
    btn.setAttribute('aria-label',open?(btn.getAttribute('data-l-close')||(en?'Close menu':'إغلاق القائمة')):(btn.getAttribute('data-l-open')||(en?'Menu':'القائمة')));
    menu.setAttribute('aria-hidden',String(!open));
    others().forEach(function(el){el.inert=open;});
    if(open){var a=menu.querySelector('a');if(a)a.focus({preventScroll:true});}
  };
  btn.addEventListener('click',function(){set(!root.classList.contains('menu-open'));});
  $$('a',menu).forEach(function(a){a.addEventListener('click',function(){set(false);});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&root.classList.contains('menu-open')){set(false);btn.focus();}});
  matchMedia('(min-width:961px)').addEventListener('change',function(e){if(e.matches)set(false);});
}

/* language menu: closes on a click outside it or on Escape */
$$('details.sn-lang').forEach(function(d){
  document.addEventListener('click',function(e){if(d.open&&!d.contains(e.target))d.open=false;});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&d.open){d.open=false;var s=d.querySelector('summary');if(s)s.focus();}});
});

/* download buttons stay locked until launch; at the launch moment they become real download links
   (the same moment as the home countdown; the file itself is opened on the server at launch) */
var LAUNCH=Date.UTC(2026,9,1,23,0,0);
function unlock(){
  $$('[data-unlock]').forEach(function(b){
    var a=document.createElement('a');
    a.className=b.className; a.href=b.getAttribute('data-unlock'); a.setAttribute('download',''); a.rel='noopener';
    a.innerHTML=b.innerHTML; var s=a.querySelector('.sfx'); if(s) s.parentNode.removeChild(s);
    b.parentNode.replaceChild(a,b);
  });
  /* what is shown only once the download is open (the Linux line under the Windows button, 2026-10-02) */
  $$('[data-dl-after]').forEach(function(e){e.hidden=false;});
}
/* the download has its OWN key since 2026-10-01: the launch moment no longer opens it by itself (the installer must
   carry its runtime first). DOWNLOAD_OPEN: null = locked · 0 = open now · Date.UTC(...) = open at that moment. */
var DOWNLOAD_OPEN=0;   /* open (2026-10-06): the pages already carry real download links; this key only upgrades any leftover [data-unlock] button */

/* subscribe buttons (/plans/, /<lang>/plans/, /developers/pricing/) are locked like the download, but with their OWN key,
   NOT the launch date: payments open by the owner's decision, after Wayl is live on the server.
   THE KEY = PAY_OPEN.  null = locked (default) · 0 = open now · Date.UTC(2026,9,12,9,0,0) = open at that moment.
   After changing it: bump V in site-chrome/build.py and rebuild (SITE-NAV-SPEC.md). Each button carries its own address in
   data-subscribe (made from SUBSCRIBE_URL in site-chrome/plans/build_plans.py: «حسابي» on accounts.optes3.com, where
   the customer signs in with Google and pays through Wayl). */
var PAY_OPEN=0;   /* open (2026-10-06): the plan buttons are real links in the markup; this key only upgrades any leftover [data-subscribe] button */
/* the top-up packs («اشترِ رصيد», data-topup) have their OWN key: a top-up credits the wallet, which is not live yet.
   TOPUP_OPEN: null = locked (default) · 0 = open now · Date.UTC(...) = open at that moment. Keep it null while Wayl is
   live and the wallet is not (the platform refuses top-ups then anyway: OPTES_TOPUP_OPEN). */
var TOPUP_OPEN=null;
function openLocked(attr){
  $$('['+attr+']').forEach(function(b){
    var a=document.createElement('a');
    a.className=b.className; a.href=b.getAttribute(attr);
    a.innerHTML=b.innerHTML; $$('.sfx,.pay-lock',a).forEach(function(x){x.parentNode.removeChild(x);});
    b.parentNode.replaceChild(a,b);
  });
}
function openPay(){
  openLocked('data-subscribe');
  /* sentences true only while payments are closed ("the buttons are locked for now") go with them */
  $$('[data-pay-soon]').forEach(function(x){x.parentNode.removeChild(x);});
}
function openTopup(){ openLocked('data-topup'); }
function atKey(key,open){if(typeof key==='number'){var left=key-Date.now(); if(left<=0) open(); else if(left<2147483647) setTimeout(open,left+500);}}
atKey(DOWNLOAD_OPEN,unlock);
atKey(PAY_OPEN,openPay);
atKey(TOPUP_OPEN,openTopup);

/* anything marked data-soon is locked until launch: a click only says so */
var tip=null, tipT=0;
$$('[data-soon]').forEach(function(el){
  el.addEventListener('click',function(e){
    e.preventDefault();
    if(!tip){tip=document.createElement('div');tip.className='tip';tip.setAttribute('role','status');document.body.appendChild(tip);}
    tip.textContent=el.getAttribute('data-soon')||(en?'Opens at launch':'يفتح عند الإطلاق');
    tip.classList.add('show'); clearTimeout(tipT); tipT=setTimeout(function(){tip.classList.remove('show');},2600);
  });
});

/* reveal: elements already on screen stay put; the rest rise once, 80 ms apart among siblings */
if('IntersectionObserver' in window && !reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var t=e.target;t.classList.add('rv-in');t.classList.remove('rv-wait');io.unobserve(t);}});},{rootMargin:'0px 0px -8% 0px'});
  var vh=innerHeight;
  $$('.rv').forEach(function(el){
    if(el.getBoundingClientRect().top<vh*.94) return;
    var i=0,p=el.previousElementSibling;while(p){if(p.classList&&p.classList.contains('rv'))i++;p=p.previousElementSibling;}
    el.style.setProperty('--d',Math.min(i,4)*80+'ms');
    el.classList.add('rv-wait'); io.observe(el);
  });
}
})();

/* maintenance countdown (owner 2026-10-09): shown on every page until the target time, then removes itself. */
(function(){
var T=Date.UTC(2026,9,9,3,30,0); // 2026-10-09 03:30 UTC = 06:30 Baghdad
if(!T||Date.now()>T+3600000) return;
var ar=(document.documentElement.lang||'ar').slice(0,2)==='ar';
var tx=ar?{t:'تحديث كبير لأوبتس بعد',u:['ساعة','دقيقة','ثانية'],n:'نتمنى تقليل حجم أعمالكم وحفظ شغلكم. قد تنقطع الخدمة لدقائق.',d:'التحديث جارٍ الآن، شكراً لصبركم.'}
         :{t:'Big OPTES update in',u:['h','m','s'],n:'Please reduce your workload and save your work. Service may pause for a few minutes.',d:'The update is in progress. Thank you for your patience.'};
var css=document.createElement('style');
css.textContent='.mt-bar{position:sticky;top:0;z-index:60;background:#111418;color:#e8ecef;border-bottom:1px solid #2a3037;font:500 14px/1.5 system-ui,Segoe UI,Tahoma,sans-serif;padding:8px 14px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;text-align:center}.mt-bar b{font-variant-numeric:tabular-nums;letter-spacing:.02em;background:#1c2128;border:1px solid #2f3640;border-radius:8px;padding:2px 10px;direction:ltr;display:inline-block}.mt-bar span.n{color:#aab3bc;font-weight:400}@media(max-width:560px){.mt-bar{font-size:13px}}';
document.head.appendChild(css);
var bar=document.createElement('div');bar.className='mt-bar';bar.setAttribute('role','status');bar.setAttribute('aria-live','off');
var a=document.createElement('span');a.textContent=tx.t;
var c=document.createElement('b');
var n=document.createElement('span');n.className='n';n.textContent=tx.n;
bar.appendChild(a);bar.appendChild(c);bar.appendChild(n);
document.body.insertBefore(bar,document.body.firstChild);
function p(x){return x<10?'0'+x:''+x}
function tick(){
  var s=Math.floor((T-Date.now())/1000);
  if(s<=0){a.textContent=tx.d;c.style.display='none';n.style.display='none';return false}
  c.textContent=p(Math.floor(s/3600))+':'+p(Math.floor(s%3600/60))+':'+p(s%60);
  return true;
}
tick();
var iv=setInterval(function(){if(!tick()){clearInterval(iv);setTimeout(function(){bar.remove()},3600000)}},1000);
})();
