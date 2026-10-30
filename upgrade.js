/* Week Tracker v7 upgrade layer. Loads after app.js; never edits your data except the new inbox and appearance keys. */
(()=>{
const KU='wt-ui',KI='wt-inbox';
const PAL={
daybook:{n:'Daybook',l:{'--ac':'#1F5A3F','--acs':'#E3EEE4','--bg':'#F7F3EA','--ln':'#DDE3D5','--hero':'#1F4B36','--eb':'#8B7FD1'},d:{'--ac':'#8FD1A5','--acs':'#1C3226','--bg':'#0E1612','--sf':'#16221B','--ln':'#2A3F33','--nav':'#131E18','--hero':'#1F4B36','--onac':'#0B1C12','--eb':'#B3A9F0'}},
harbour:{n:'Harbour',l:{},d:{'--ac':'#5CCDC4','--acs':'#123B3B','--bg':'#091514','--sf':'#10231F','--ln':'#21403B','--nav':'#0E1F1D','--hero':'#0E4F52','--onac':'#05211F'}},
dusk:{n:'Dusk',l:{'--ac':'#4C45B5','--acs':'#E4E2FA','--bg':'#F1F0F9','--ln':'#DAD8EE','--hero':'#2F2A7A','--eb':'#E8A33D'},d:{'--ac':'#A5A0F5','--acs':'#26224F','--bg':'#0F0E1F','--sf':'#1A1836','--ln':'#322F63','--nav':'#161430','--hero':'#2F2A7A','--onac':'#13112E'}},
ember:{n:'Ember',l:{'--ac':'#B4471C','--acs':'#FBE6DC','--bg':'#F8F2EE','--ln':'#E8D9D0','--hero':'#7A2E12','--eb':'#F0B54A'},d:{'--ac':'#F09468','--acs':'#43241A','--bg':'#171009','--sf':'#251912','--ln':'#47301F','--nav':'#1F150E','--hero':'#7A2E12','--onac':'#2A1105'}},
classic:{n:'Classic blue',l:{'--ac':'#2B69DC','--acs':'#E1EDFF','--bg':'#F4F8FF','--ln':'#DBE4F0','--hero':'#1F3F86','--eb':'#E69D28'},d:{}}};
const FONTS={jak:['Jakarta',"'Plus Jakarta Sans',system-ui,sans-serif"],sys:['System',"system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"],serif:['Serif',"Georgia,'Times New Roman',serif"]};
const CARDS={smart:'Smart next step',inbox:'Inbox',close:'Evening wrap-up'};
let U=Object.assign({pal:'daybook',font:'jak',lh:'1.4',hc:false,rm:false,hide:[]},lsGet(KU,{}));
let inbox=lsGet(KI,[]);const saveU=()=>lsSet(KU,U),saveI=()=>lsSet(KI,inbox);
const R=document.documentElement;let setKeys=[];
function apply(){
  const dk=th==='dark'||(th==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches);
  setKeys.forEach(k=>R.style.removeProperty(k));setKeys=[];
  const p=(PAL[U.pal]||PAL.harbour)[dk?'d':'l'];
  for(const k in p){R.style.setProperty(k,p[k]);setKeys.push(k)}
  R.style.setProperty('--font',FONTS[U.font][1]);R.style.setProperty('--lh',U.lh);
  R.toggleAttribute('data-dk',dk);R.toggleAttribute('data-hc',!!U.hc);R.toggleAttribute('data-rm',!!U.rm);
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=(p['--ac']||PAL.harbour.l['--ac']||'#0E6B6B');
}
const chip=(a,v,t,on)=>`<button data-u="${a}" data-v="${v}" aria-pressed="${!!on}">${t}</button>`;
function personalise(){
  return `<h2 style="margin-top:0">Make it yours</h2><section class="card n" id="ux-pers">
  <p class="lab">Colour</p><div class="chips">${Object.keys(PAL).map(k=>chip('pal',k,PAL[k].n,U.pal===k)).join('')}</div>
  <p class="lab" style="margin-top:14px">Font</p><div class="chips">${Object.keys(FONTS).map(k=>chip('font',k,FONTS[k][0],U.font===k)).join('')}</div>
  <p class="lab" style="margin-top:14px">Line spacing</p><div class="chips">${[['1.3','Tight'],['1.4','Normal'],['1.6','Relaxed']].map(x=>chip('lh',x[0],x[1],U.lh===x[0])).join('')}</div>
  <p class="lab" style="margin-top:14px">Accessibility</p><div class="chips">${chip('hc','',' High contrast',U.hc)}${chip('rm','','Reduce motion',U.rm)}</div>
  <p class="lab" style="margin-top:14px">Home cards</p><div class="chips">${Object.keys(CARDS).map(k=>chip('card',k,CARDS[k],!U.hide.includes(k))).join('')}</div>
  <p class="xs mut" style="margin-top:10px">Text size and light or dark mode are in Appearance below. Everything here is saved on this device.</p>
  <button class="btn sm" style="margin-top:8px" data-u="reset">Restore appearance defaults</button></section>`;
}
function smart(){
  const nm=nowMin(),bl=blocks(DAYS[todayIdx][0]).filter(b=>!st.c[b.id]);
  const cur=bl.find(b=>nm>=b.s&&nm<b.e),nxt=bl.filter(b=>b.s>nm).sort((a,b)=>a.s-b.s)[0];
  const free=cur?cur.e-nm:nxt?nxt.s-nm:0;
  if(!courses.length)return '';
  let pick=null,why='';const ne=nextExam();
  if(ne&&ne.dl<=21){const i=courses.indexOf(ne.c),t=ne.c.topics.findIndex(t=>t.s<=1);if(t>=0){pick={i,t:ne.c.topics[t]};why=ne.c.code+' has an exam in '+ne.dl+' day'+(ne.dl===1?'':'s')+' and this topic is '+(ne.c.topics[t].s?'still Learning':'not started')+'.'}}
  if(!pick){for(let i=0;i<courses.length&&!pick;i++){const t=courses[i].topics.find(t=>t.s===1);if(t){pick={i,t};why='You marked it Learning. Finishing it moves it towards Revised.'}}}
  if(!pick)return '';
  const m=Math.max(10,Math.min(free>0?free:25,free>=60?45:25));
  return `<section class="card" id="ux-smart"><p class="lab">Smart next step</p><p class="big">${esc(pick.t.n)}</p><p class="sm mut">${esc(courses[pick.i].code)} · about ${dur(m)}${free>0?' · you have '+dur(free)+' free':''}</p><p class="xs mut ux-why">Why: ${esc(why)}</p><div class="ux-act"><button class="btn p sm" data-a="cont" data-v="${pick.i}">Open topic</button><button class="btn sm" data-a="go" data-v="acad">Choose something else</button></div></section>`;
}
function inboxCard(){
  if(!inbox.length)return '';
  return `<section class="card n" id="ux-inbox"><details><summary class="lab" style="margin:0">Inbox · ${inbox.length} to sort</summary>${inbox.map(x=>`<div class="ux-item"><div><span class="chip">${esc(x.t)}</span><span class="xs mut">${new Date(x.d).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</span></div><p class="sm">${esc(x.x)}</p><button class="btn sm" data-u="idel" data-v="${x.id}" aria-label="Delete note">Delete</button></div>`).join('')}<p class="xs mut" style="margin-top:6px">Notes stay on this device and are not sent anywhere.</p></details></section>`;
}
function closeout(){
  if(new Date().getHours()<19)return '';
  const N=dayNums(todayIdx),nb=blocks(DAYS[(todayIdx+1)%7][0]).filter(b=>b.g!=='Wake and quiet time')[0];
  return `<section class="card g" id="ux-close"><p class="lab">Evening wrap-up</p><p class="sm">${N.done} of ${N.el.length} blocks done today. Anything unfinished can be moved, shortened or marked not applicable. It is not a failure.</p>${nb?`<p class="xs mut" style="margin-top:6px">Tomorrow starts with <b>${esc(nb.l)}</b> at ${fmt(nb.s)}.</p>`:''}</section>`;
}
function enhance(){
  try{
    apply();
    const app=document.getElementById('app');
    if(view==='set')app.insertAdjacentHTML('afterbegin',personalise());
    if(view==='today'&&sel===todayIdx){
      let h='';if(!U.hide.includes('smart'))h+=smart();if(!U.hide.includes('inbox'))h+=inboxCard();if(!U.hide.includes('close'))h+=closeout();
      const hero=app.querySelector('.hero'),days=app.querySelector('.days');
      const anchor=hero||days;if(anchor&&h)anchor.insertAdjacentHTML('afterend',h);
    }
    const f=document.querySelector('.fab2');if(f)f.hidden=!(view==='today'||view==='plan'||view==='more');
  }catch(e){console.warn('upgrade layer',e)}
}
const o=window.render;window.render=function(){o();enhance()};
// quick capture sheet
document.body.insertAdjacentHTML('beforeend',`<button class="fab2" aria-label="Quick capture">✎</button><div class="ux-sheet" hidden role="dialog" aria-label="Quick capture"><div><p class="big">Quick capture</p><select id="ux-t" aria-label="Type">${['Thought','Question','Prayer point','Class note','Reading note','Chart lesson','Task'].map(t=>`<option>${t}</option>`).join('')}</select><textarea id="ux-x" placeholder="Write it down. Sort it later."></textarea><div class="ux-act"><button class="btn p" id="ux-save">Save to inbox</button><button class="btn" id="ux-cancel">Cancel</button></div><p class="xs mut" style="margin-top:8px">Private by default. Saved only on this device.</p></div></div>`);
const sh=document.querySelector('.ux-sheet'),tx=document.getElementById('ux-x');
const openS=()=>{sh.hidden=false;setTimeout(()=>tx.focus(),50)},closeS=()=>{sh.hidden=true};
document.querySelector('.fab2').onclick=openS;document.getElementById('ux-cancel').onclick=closeS;
sh.addEventListener('click',e=>{if(e.target===sh)closeS()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sh.hidden)closeS()});
document.getElementById('ux-save').onclick=()=>{const x=tx.value.trim();if(!x)return;inbox.unshift({id:Date.now().toString(36),t:document.getElementById('ux-t').value,x,d:Date.now()});saveI();tx.value='';closeS();try{toast('Saved to inbox')}catch(e){}render()};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-u]');if(!b)return;const a=b.dataset.u,v=b.dataset.v;
  if(a==='pal')U.pal=v;else if(a==='font')U.font=v;else if(a==='lh')U.lh=v;else if(a==='hc')U.hc=!U.hc;else if(a==='rm')U.rm=!U.rm;
  else if(a==='card')U.hide=U.hide.includes(v)?U.hide.filter(x=>x!==v):U.hide.concat(v);
  else if(a==='reset')U={pal:'harbour',font:'jak',lh:'1.4',hc:false,rm:false,hide:[]};
  else if(a==='idel'){inbox=inbox.filter(x=>x.id!==v);saveI()}
  saveU();render();
});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',apply);
render();
})();
