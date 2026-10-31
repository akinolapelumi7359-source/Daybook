/* Universal Focus Mode upgrade: asks before auto-starting, lets you choose the length, adds session goals, linked context and a post-session summary. */
(function(){
const FK='wt-focus2',GK='wt-ff-goal',AK='wt-ff-asked';
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const cfg=()=>Object.assign({mode:'ask',len:45},lsGet(FK,{}));
const asked=new Set(lsGet(AK,[]));
Object.assign(ACT,{acad:'Academic study',dev:'Personal development',task:'Important task'});
const orig=window.autoFocus;
window.autoFocus=function(){const c=cfg(),a=settings.af;if(!a||!a.on||c.mode==='off'||fs)return;if(c.mode==='auto')return orig();
  if(new Date().toDateString()!==now0.toDateString())return;
  const nm=nowMin(),day=dk(new Date()),b=afCands().find(x=>nm>=x.s&&nm<x.e&&a.groups.includes(x.g)&&!/^wake up$/i.test(x.l)&&!st.c[x.id]&&!asked.has(day+'|'+x.id));
  if(!b)return;asked.add(day+'|'+b.id);lsSet(AK,[...asked].slice(-300));ask(b)};
function ask(b){const left=Math.max(1,Math.min(360,b.e-nowMin())),c=cfg(),opts=[...new Set([25,45,60].filter(m=>m<left).concat([left]))];
  let el=document.getElementById('ff-ask');if(el)el.remove();el=document.createElement('div');el.id='ff-ask';
  el.innerHTML=`<p class="sm"><b>${E(b.l)}</b> is on now. Start a focus session?</p><div class="row2" style="margin:6px 0;flex-wrap:wrap">${opts.map(m=>`<button class="btn sm" data-ff="len" data-m="${m}"${m===(opts.includes(c.len)?c.len:left)?' style="background:var(--ok);color:#fff"':''}>${m===left?'Until block ends ('+m+'m)':m+' min'}</button>`).join('')}</div><div class="row2"><button class="btn sm" data-ff="go" data-id="${E(b.id)}" data-l="${E(b.l)}" data-m="${opts.includes(c.len)?c.len:left}">Start</button><button class="btn sm" data-ff="no">Not now</button></div>`;
  document.body.appendChild(el)}
const css=document.createElement('style');css.textContent='#ff-ask{position:fixed;left:12px;right:12px;bottom:92px;z-index:60;background:var(--sf,#fff);border:1px solid var(--ln,#ddd);border-radius:16px;padding:12px;box-shadow:0 8px 24px rgba(0,0,0,.2)}';document.head.appendChild(css);
const startFs=(id,l,m)=>{const ms=m*60000;fdone=null;fs={dur:ms,left:ms,endAt:Date.now()+ms,topic:l,link:'block|'+id,brk:0,mode:'focus',act:'gen'};lsSet('wt-focus',fs);const e=document.getElementById('ff-ask');if(e)e.remove();render()};
let pend='';
document.addEventListener('click',e=>{const g=e.target.closest('[data-a=fgo]');if(g){const i=document.getElementById('ff-goal');pend=i?i.value.trim():'';setTimeout(()=>{if(fs&&pend&&!fs.goal){fs.goal=pend;lsSet('wt-focus',fs);lsSet(GK,{topic:fs.topic,link:fs.link||null,goal:pend});render()}pend=''},0)}},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-ff]');if(!b)return;const a=b.dataset.ff;
  if(a==='no'){const x=document.getElementById('ff-ask');if(x)x.remove()}
  else if(a==='len'){const go=document.querySelector('#ff-ask [data-ff=go]');if(go)go.dataset.m=b.dataset.m;document.querySelectorAll('#ff-ask [data-ff=len]').forEach(x=>{x.style.background=x===b?'var(--ok)':'';x.style.color=x===b?'#fff':''})}
  else if(a==='go')startFs(b.dataset.id,b.dataset.l,+b.dataset.m);
  else if(a==='out'){const s=sessions.find(y=>y.id===fdone);if(s){s.out=b.dataset.v;lsSet('wt-sessions',sessions);render()}}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='ff-mode'){const c=cfg();c.mode=t.value;lsSet(FK,c)}else if(t.id==='ff-len'){const c=cfg();c.len=+t.value;lsSet(FK,c)}
  else if(t.id==='ff-acc'){const s=sessions.find(y=>y.id===fdone);if(s){s.acc=t.value;lsSet('wt-sessions',sessions)}}});
const o=window.render;window.render=function(){o();try{if(view!=='focus')return;const app=document.getElementById('app');if(!app)return;let h='';
  if(!fs){const c=cfg();h+=`<section class="card db"><p class="lab">Auto focus</p><p class="xs mut">When a block of a type you chose in Settings begins:</p><select class="rf" id="ff-mode"><option value="ask"${c.mode==='ask'?' selected':''}>Ask me first (you pick the length)</option><option value="auto"${c.mode==='auto'?' selected':''}>Start automatically</option><option value="off"${c.mode==='off'?' selected':''}>Do nothing</option></select><p class="xs mut" style="margin-top:6px">Default length when asking</p><select class="rf" id="ff-len">${[15,25,45,60,90].map(m=>`<option value="${m}"${m===c.len?' selected':''}>${m} min</option>`).join('')}</select></section>`;
    const go=app.querySelector('[data-a=fgo]');if(go){go.insertAdjacentHTML('beforebegin',`<label class="f" style="margin-top:10px"><span>Session goal (optional)</span><input id="ff-goal" placeholder="What do you want to finish in this session?"></label>`)}}
  else if(fs.mode==='focus'){const it=fs.link&&fs.link.startsWith('reading|')?(lsGet('wt-reading',{items:[]}).items||[]).find(x=>x.id===fs.link.split('|')[1]):null;
    h+=`<section class="card db"><p class="lab">This session</p><p class="sm"><b>${E(fs.topic||'Focus')}</b></p>${fs.goal?`<p class="sm">Goal: ${E(fs.goal)}</p>`:''}${it?`<p class="xs mut">Reading target: ${E(it.ta?it.ta+' '+it.tt:'none set')}</p>${it.lib?`<button class="btn sm" data-rd="open" data-id="${it.id}">Open material</button>`:''}`:''}<div class="row2" style="margin-top:8px"><button class="btn sm" data-ai="open">✦ Ask AI (only when you tap)</button></div></section>`}
  else if(!fs&&fdone){}
  if(!fs&&fdone){const s=sessions.find(y=>y.id===fdone),g=lsGet(GK,null);if(s){const goal=s.goal||(g&&g.topic===s.topic&&g.link===s.link?g.goal:'');
    h+=`<section class="card db"><p class="lab">Session summary</p><p class="sm">${s.min} min on ${E(s.topic||'focus')}</p>${goal?`<p class="sm">Goal: ${E(goal)}</p><p class="xs mut">Did you reach it? Only you decide.</p><div class="row2">${[['yes','Yes'],['partly','Partly'],['no','Not yet']].map(([v,l])=>`<button class="btn sm" data-ff="out" data-v="${v}"${s.out===v?' style="background:var(--ok);color:#fff"':''}>${l}</button>`).join('')}</div>`:''}<p class="xs mut" style="margin:8px 0 2px">What I accomplished</p><textarea class="rf" id="ff-acc" rows="2">${E(s.acc||'')}</textarea></section>`}}
  if(h)app.insertAdjacentHTML('afterbegin',h)}catch(e){void e}};
window.ffAsk=ask;
})();
  
