/* Decorative, bounded particles. No dependencies, network, storage or tracking. */
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const host=document.querySelector('.nx-orbit');
let paused=false;
if(host){const button=document.createElement('button');button.type='button';button.className='nx-motion-toggle';const ar=document.documentElement.lang==='ar';button.textContent=ar?'إيقاف الحركة':'Pause motion';button.setAttribute('aria-pressed','false');host.insertAdjacentElement('afterend',button);button.addEventListener('click',()=>{paused=!paused;button.setAttribute('aria-pressed',String(paused));button.textContent=paused?(ar?'تشغيل الحركة':'Play motion'):(ar?'إيقاف الحركة':'Pause motion');host.classList.toggle('motion-paused',paused);setup();});}
let stop=()=>{};
function setup(){
 stop();
 document.dispatchEvent(new CustomEvent('optes:motion',{detail:{paused}}));
 if(!host||reduced.matches||paused)return;
 const canvas=document.createElement('canvas');canvas.className='nx-particles';canvas.setAttribute('aria-hidden','true');host.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
 const sample=document.createElement('canvas');sample.width=600;sample.height=600;
 const sc=sample.getContext('2d');if(!sc){canvas.remove();return;}
 const face=host.classList.contains('nx-with-face');
 sc.font=face?'600 62px Arial':'600 115px Arial';sc.textAlign='center';sc.textBaseline='middle';sc.fillText('OPTES',300,face?530:300);
 const pixels=sc.getImageData(0,0,600,600).data,points=[];
 for(let y=face?480:220;y<(face?580:365);y+=face?3:4)for(let x=70;x<530;x+=face?3:4)if(pixels[(y*600+x)*4+3]>110)points.push({x,y,seed:Math.random()*6.283,drift:Math.random()});
 let raf=0,visible=true,frame=0,start=performance.now(),burst=-1e5,pointer=null;
 const resize=()=>{const dpr=Math.min(devicePixelRatio||1,1.5),size=host.clientWidth;canvas.width=canvas.height=Math.round(size*dpr);};
 const ro=new ResizeObserver(resize);ro.observe(host);resize();
 function draw(t){
  if(!visible||document.hidden||reduced.matches){raf=0;return;}
  raf=requestAnimationFrame(draw);if(t-frame<33)return;frame=t;
  const age=(t-start)/1000,cycle=age%11;
  const auto=cycle>6?Math.sin((cycle-6)/5*Math.PI):0;
  const tap=Math.max(0,1-(t-burst)/2400);
  const amount=Math.max(auto*.85,tap),scale=canvas.width/600;
  ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,600,600);
  for(const p of points){
   let x=p.x+Math.sin(p.seed+age*.45)*amount*(35+p.drift*110),y=p.y-amount*(40+p.drift*130);
   if(pointer){const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy);if(d<95&&d>0){const force=(1-d/95)*32;x+=dx/d*force;y+=dy/d*force;}}
   ctx.fillStyle=`rgba(245,245,250,${.95-amount*p.drift*.6})`;ctx.beginPath();ctx.arc(x,y,1.4+amount*.3,0,Math.PI*2);ctx.fill();
  }
 }
 const resume=()=>{if(!raf&&visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(draw);};
 const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)resume();else{cancelAnimationFrame(raf);raf=0;}},{threshold:.05});io.observe(host);
 const move=e=>{const r=host.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*600};host.style.setProperty('--light-x',`${pointer.x/6}%`);host.style.setProperty('--light-y',`${pointer.y/6}%`);};
 const leave=()=>{pointer=null;host.style.removeProperty('--light-x');host.style.removeProperty('--light-y');};const tap=()=>{burst=performance.now();};
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else resume();};
 host.addEventListener('pointermove',move,{passive:true});host.addEventListener('pointerleave',leave);host.addEventListener('pointerdown',tap,{passive:true});document.addEventListener('visibilitychange',visibility);
 host.classList.add('particles-ready');resume();
 stop=()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();canvas.remove();host.classList.remove('particles-ready');host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);host.removeEventListener('pointerdown',tap);document.removeEventListener('visibilitychange',visibility);};
}
/* 2026-11-07 (liquid v2): start after the page has painted and the main thread is idle, not in the load task */
const idle=window.requestIdleCallback||(f=>setTimeout(f,200));
idle(()=>{setup();reduced.addEventListener('change',setup);},{timeout:2500});
/* Progressive enhancement: text stays visible if script/observers are unavailable. */
if(!reduced.matches&&'IntersectionObserver'in window){
 const targets=document.querySelectorAll('.nx-heading,.nx-product,.nx-workflow,.nx-dev,.nx-downloads article,.nx-research-card,main.for .fsec');
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('motion-section','motion-seen');io.unobserve(e.target);}}),{threshold:.08});
 /* only what reaches the screen gets the class, when it gets there: no restyle of the whole page in one task */
 idle(()=>{const vh=innerHeight;targets.forEach(el=>{if(el.getBoundingClientRect().top>vh)io.observe(el);});},{timeout:2500});
}
})();
