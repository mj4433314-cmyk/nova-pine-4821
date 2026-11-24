/* NightDistrict page: the hero film starts only where it is welcome, the player picks a size, the gallery opens a lightbox. */
(function(){
  'use strict';
  var conn=navigator.connection||{};
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches||conn.saveData===true;
  var wide=matchMedia('(min-width:761px)').matches;

  var hero=document.querySelector('.hero video');
  if(hero&&wide&&!calm){
    hero.src=hero.dataset.src;
    var p=hero.play(); if(p&&p.then)p.then(function(){hero.classList.add('on');}).catch(function(){});
  }

  var film=document.getElementById('film-v');
  if(film){ film.src=(!wide&&film.dataset.srcMobile)?film.dataset.srcMobile:film.dataset.src; }

  document.querySelectorAll('.shot').forEach(function(b){b.addEventListener('click',function(){
    var d=document.createElement('div'); d.className='box'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true');
    var img=document.createElement('img'); img.alt=b.querySelector('img').alt; img.src=b.dataset.full;
    var close=document.createElement('button'); close.className='btn'; close.type='button'; close.textContent='إغلاق';
    d.appendChild(img); d.appendChild(close);
    function shut(){d.remove();document.removeEventListener('keydown',k);b.focus();}
    function k(e){if(e.key==='Escape')shut();}
    d.addEventListener('click',function(e){if(e.target===d||e.target===close)shut();});
    document.addEventListener('keydown',k); document.body.appendChild(d); close.focus();
  });});
})();
