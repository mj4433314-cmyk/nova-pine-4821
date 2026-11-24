/* OPTES 1.5 «زجاج سائل» on optes3.com: the header turns to glass once the page moves, and a press leaves a small
   ripple (the app's press-ripple). Decorative only: no network, storage or tracking; off under reduced motion. */
(function(){'use strict';
var sn=document.querySelector('header.sn');
if(sn){var on=false,tick=function(){var s=window.scrollY>8;if(s!==on){on=s;sn.classList.toggle('lq-scrolled',s);}};
 window.addEventListener('scroll',tick,{passive:true});tick();}
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('pointerdown',function(e){
 if(reduce&&reduce.matches)return;
 var b=e.target&&e.target.closest&&e.target.closest('.btn');
 if(!b||b.getAttribute('aria-disabled')==='true')return;
 var r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2.2,i=document.createElement('span');
 i.className='lq-ripple';i.setAttribute('aria-hidden','true');
 i.style.width=i.style.height=d+'px';i.style.left=(e.clientX-r.left-d/2)+'px';i.style.top=(e.clientY-r.top-d/2)+'px';
 b.appendChild(i);setTimeout(function(){i.remove();},800);
},{passive:true});
})();
