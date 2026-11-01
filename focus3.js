/* Focus Mode upgrade, phases 2-6: Today's Top Priorities (from existing records), one-task session view, daily review with carry-forward, focus score and weekly focus insights. */
(function(){
const PK='wt-fprio',LV=['Critical','High','Normal','Low'];
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const FP=()=>Object.assign({set:{},pins:{},lv:{},hide:{},hist:{},rev:{}},lsGet(PK,{}));
const today=()=>dk(new Date()),tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return dk(d)};
const dur=m=>Math.floor(m/60)+'h '+String(Math.round(m%60)).padStart(2,'0')+'m';
const ccode=id=>(courses.find(c=>c.id===id)||{}).code||'';
const minsFor=(c,t)=>sessions.filter(s=>!s.unc&&dk(new Date(s.d))===t&&s.link&&s.link.startsWith(c.lk)).reduce((a,s)=>a+s.min,0);
function cands(){const t=today(),out=[],k=DAYS[todayIdx][0],nm=nowMin();
  const sk=lsGet('wt-ttd',{})[t],stu=(sk&&sk.list)||[],studyCids=stu.map(x=>x.cid);
  blocks(k).forEach(b=>{if(b.g==='Meals and breaks'||/wake|sleep|breakfast|lunch|dinner|meal|rest|quiet time|break/i.test(b.l))return;const s=st.c[b.id];if(s==='cancelled'||s==='skipped')return;
    out.push({id:'b|'+b.id,src:'Planner',label:b.l,plan:b.e-b.s,lv:'Normal',done:s==='done',lk:'block|'+b.id,act:'gen',t0:b.s,t1:b.e})});
  stu.forEach(x=>{if(x.st==='missed')return;out.push({id:'s|'+x.id,src:'Study timetable',label:'Study: '+ccode(x.cid),plan:x.plan,lv:'High',done:x.st==='done',lk:'study|'+x.id,act:'acad',t0:x.s,t1:x.e})});
  const r=lsGet('wt-reading',{items:[],log:{}}),w=(new Date().getDay()+6)%7;
  (r.items||[]).filter(i=>!i.paused&&i.days.includes(w)&&i.start<=t&&(!i.end||t<=i.end)&&!studyCids.includes(i.cid)).forEach(i=>out.push({id:'r|'+i.id,src:'Academic reading',label:'Read: '+ccode(i.cid)+' '+i.mat,plan:i.mins,lv:'Normal',done:((r.log||{})[i.id+'|'+t]||{}).st==='completed',lk:'reading|'+i.id+'|'+t,act:'read',t0:null}));
  const T=new Date(t+'T12:00:00');lsGet('wt-assign',[]).filter(x=>!x.done).forEach(x=>{const n=Math.round((new Date(x.due+'T12:00:00')-T)/864e5);if(n<=3)out.push({id:'a|'+x.id,src:'Assignment',label:ccode(x.cid)+' '+x.title,plan:null,lv:n<=0?'Critical':n<=2?'High':'Normal',done:false,lk:'assign|'+x.id,act:'acad',due:x.due,t0:null})});
  try{const s=lsGet('wt-plans',null),p=s.plans.find(x=>x.id===s.cur)||s.plans[0],g=s.prog[p.id]||{},R=p.days||[];let n=1;while(g[n]&&g[n].done&&g[n].done!==t)n++;if(R[n-1]||g[n])out.push({id:'p|'+n,src:'Quiet time',label:'Bible plan Day '+n+(R[n-1]?': '+R[n-1]:''),plan:30,lv:'High',done:!!(g[n]&&g[n].done===t),lk:'plan|'+n,act:'qt',t0:null})}catch(e){void e}
  out.forEach(c=>{c.mins=minsFor(c,t)});return out}
function list(){const t=today(),F=FP(),C=cands(),by={};C.forEach(c=>by[c.id]=c);let ids=(F.set[t]||[]).filter(i=>by[i]);
  const lvl=c=>LV.indexOf(F.lv[c.id]||c.lv),nm=nowMin(),pool=C.filter(c=>!c.done&&!ids.includes(c.id)&&!(F.hide[t]||[]).includes(c.id)).sort((a,b)=>lvl(a)-lvl(b)||((a.t1==null?9999:(a.t1<nm?5000+a.t0:a.t0))-(b.t1==null?9999:(b.t1<nm?5000+b.t0:b.t0)))||(b.plan||0)-(a.plan||0));
  const want=Math.min(5,Math.max(3,ids.length));let guard=0;while(ids.length<Math.max(3,Math.min(5,ids.length))&&pool.length&&guard++<10)ids.push(pool.shift().id);
  if(!F.set[t]&&ids.length<5)while(ids.length<4&&pool.length)ids.push(pool.shift().id);
  const pins=F.pins[t]||[];ids=[...ids.filter(i=>pins.includes(i)),...ids.filter(i=>!pins.includes(i))];
  F.set[t]=ids;const L=ids.map(i=>by[i]);F.hist[t]={n:L.length,d:L.filter(c=>c.done).length};lsSet(PK,F);return L.map(c=>Object.assign({},c,{pin:pins.includes(c.id),level:F.lv[c.id]||c.lv}))}
function setDone(c,on){const t=today(),[ty,id]=c.id.split('|');
  if(ty==='b'){if(on)st.c[id]='done';else if(st.c[id]==='done')delete st.c[id];save()}
  else if(ty==='r'){const r=lsGet('wt-reading',{items:[],log:{}});r.log=r.log||{};const k=id+'|'+t;r.log[k]=r.log[k]||{};if(on)r.log[k].st='completed';else delete r.log[k].st;lsSet('wt-reading',r)}
  else if(ty==='s'){const D=lsGet('wt-ttd',{});for(const d in D){const x=(D[d].list||[]).find(z=>z.id===id);if(x){x.st=on?'done':'planned'}}lsSet('wt-ttd',D)}
  else if(ty==='a'){const A=lsGet('wt-assign',[]),x=A.find(z=>z.id===id);if(x){x.done=on;lsSet('wt-assign',A)}}
  else if(ty==='p'){const s=lsGet('wt-plans',null),p=s.plans.find(x=>x.id===s.cur)||s.plans[0],g=(s.prog[p.id]=s.prog[p.id]||{});g[id]=g[id]||{};g[id].done=on?t:null;lsSet('wt-plans',s);if(typeof dbMark==='function')dbMark('qt',t,on)}}
const score=L=>{const t=today(),P=L.length?L.filter(c=>c.done).length/L.length:null,g=settings.goal||0,G=g?Math.min(1,focusToday()/g):null,ss=sessions.filter(s=>dk(new Date(s.d))===t&&!s.unc),S=ss.length?ss.filter(s=>s.done).length/ss.length:null;
  const wk=[...Array(todayIdx+1).keys()].map(i=>{const d=new Date();d.setDate(d.getDate()-(todayIdx-i));return dk(d)}),C=wk.filter(d=>sessions.some(s=>!s.unc&&s.min>0&&dk(new Date(s.d))===d)).length/wk.length;
  const comp=[['Priorities completed',40,P],['Focus time against your daily goal',30,G],['Sessions finished',15,S],['Days with focus this week',15,C]].filter(x=>x[2]!=null),W=comp.reduce((a,x)=>a+x[1],0);
  return{v:W?Math.round(100*comp.reduce((a,x)=>a+x[1]*x[2],0)/W):0,comp}};
function prio(L){return `<section class="card db" id="f3-pr"><div class="hd"><b>Today’s top priorities</b><span class="pill">${L.filter(c=>c.done).length} of ${L.length} done</span></div><p class="why">Taken from your plan, study timetable, reading, assignments and Bible plan. Nothing here is a new task, and finishing a timer never completes it.</p>`+
  (L.length?L.map((c,i)=>`<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm"><b>${c.level.toUpperCase()}</b> │ ${E(c.label)}${c.done?' ✓':''}</p><p class="xs mut">${E(c.src)}${c.plan?' · Planned: '+dur(c.plan):''}${c.due?' · due '+c.due:''}${c.mins?' · focused '+c.mins+' min':''} · ${c.done?'done':c.mins?'in progress':'not started'}</p><div class="row2" style="margin-top:6px;flex-wrap:wrap"><button class="btn sm" data-f3="go" data-id="${E(c.id)}" style="background:var(--ac,#6b5bd6);color:#fff">Focus on this task</button><button class="btn sm" data-f3="done" data-id="${E(c.id)}">${c.done?'Undo':'Mark done'}</button><button class="btn sm" data-f3="pin" data-id="${E(c.id)}">${c.pin?'★ Pinned':'☆ Pin'}</button><button class="btn sm" data-f3="up" data-id="${E(c.id)}">▲</button><button class="btn sm" data-f3="dn" data-id="${E(c.id)}">▼</button><select data-f3="lv" data-id="${E(c.id)}">${LV.map(l=>`<option${l===c.level?' selected':''}>${l}</option>`).join('')}</select><button class="btn sm" data-f3="rm" data-id="${E(c.id)}">Remove</button></div></div>`).join(''):'<p class="sm mut">Nothing to suggest right now. Add something below.</p>')+
  `<div class="row2" style="margin-top:8px"><select class="rf" id="f3-add"><option value="">+ Choose something to add</option>${cands().filter(c=>!L.some(x=>x.id===c.id)).map(c=>`<option value="${E(c.id)}">${E(c.label)} (${E(c.src)})</option>`).join('')}</select></div></section>`}
function glance(L){const sc=score(L);return `<section class="card db"><p class="lab">Today at a glance</p><div class="row2"><div style="flex:1"><p class="xs mut">Today’s focus</p><p class="sm"><b>${dur(focusToday())}</b></p><p class="xs mut">Measured timer time</p></div><div style="flex:1"><p class="xs mut">Priorities completed</p><p class="sm"><b>${L.filter(c=>c.done).length} of ${L.length}</b></p></div><div style="flex:1"><p class="xs mut">Focus score</p><p class="sm"><b>${sc.v}</b>/100</p></div></div><details style="margin-top:6px"><summary class="xs">How the score works</summary><p class="xs mut">A rough guide, not a grade. It averages these, weighted: ${sc.comp.map(x=>x[0]+' ('+x[1]+'%): '+Math.round(100*x[2])+'%').join('; ')||'nothing recorded yet'}.</p></details></section>`}
function review(L){const t=today(),F=FP(),r=F.rev[t]||{},un=L.filter(c=>!c.done);
  return `<details class="card db" id="f3-rev"><summary class="sm"><b>End-of-day review</b></summary><p class="xs mut">Optional. Your answers stay on this device.</p><p class="xs mut" style="margin:8px 0 2px">What I accomplished</p><textarea class="rf" rows="2" data-f3r="acc">${E(r.acc)}</textarea><p class="xs mut" style="margin:8px 0 2px">What got in the way</p><textarea class="rf" rows="2" data-f3r="obs">${E(r.obs)}</textarea><p class="xs mut" style="margin:8px 0 2px">Next steps</p><textarea class="rf" rows="2" data-f3r="next">${E(r.next)}</textarea>`+
  (un.length?`<p class="sm" style="margin-top:10px"><b>Unfinished priorities</b></p>`+un.map(c=>`<div style="border-top:1px solid var(--ln);padding:6px 0"><p class="sm">${E(c.label)}</p><div class="row2" style="flex-wrap:wrap"><button class="btn sm" data-f3="done" data-id="${E(c.id)}">Mark complete</button><button class="btn sm" data-f3="stay" data-id="${E(c.id)}">Leave unfinished</button>${c.id[0]==='b'?'':`<button class="btn sm" data-f3="car" data-id="${E(c.id)}">Carry forward</button>`}</div>${(F.carried||{})[c.id]===t?'<p class="xs mut">Carried to tomorrow.</p>':''}</div>`).join(''):'<p class="sm mut" style="margin-top:8px">No unfinished priorities.</p>')+'</details>'}
function weekly(){const T=new Date();T.setHours(12,0,0,0);const m0=new Date(T);m0.setDate(T.getDate()-((T.getDay()+6)%7));const days=o=>[...Array(7).keys()].map(i=>{const d=new Date(m0);d.setDate(m0.getDate()+i+o);return dk(d)});
  const agg=ds=>{const ss=sessions.filter(s=>!s.unc&&ds.includes(dk(new Date(s.d))));const tot=ss.reduce((a,s)=>a+s.min,0),by={},ints={};ss.forEach(s=>{const k=ACT[s.act]||'General';by[k]=(by[k]||0)+s.min;(s.ints||[]).forEach(x=>ints[x.k]=(ints[x.k]||0)+1)});
    const dm=ds.map(d=>ss.filter(s=>dk(new Date(s.d))===d).reduce((a,s)=>a+s.min,0)),act=dm.filter(x=>x>0).length,g=settings.goal||120,H=FP().hist;let pn=0,pd=0;ds.forEach(d=>{if(H[d]){pn+=H[d].n;pd+=H[d].d}});
    return{tot,by,ints,act,avg:act?Math.round(tot/act):0,prod:dm.filter(x=>x>=g/2).length,pr:pn?Math.round(100*pd/pn):null}},a=agg(days(0)),b=agg(days(-7));
  const row=o=>Object.keys(o).map(k=>k+' '+(typeof o[k]==='number'?dur(o[k]):o[k])).join(' · ')||'none';const dl=a.tot-b.tot;
  return `<section class="card db" id="f3-wk"><div class="hd"><b>Weekly focus</b><span class="pill">measured time only</span></div><p class="sm">Total <b>${dur(a.tot)}</b> · average ${dur(a.avg)} on ${a.act} active day${a.act===1?'':'s'} · productive days (at least half your goal): ${a.prod}</p><p class="xs mut">By category: ${E(row(a.by))}</p><p class="xs mut">Priority completion: ${a.pr==null?'not enough data yet':a.pr+'%'} · Interruptions: ${Object.keys(a.ints).map(k=>k+' '+a.ints[k]).join(', ')||'none logged'}</p><p class="xs mut">Compared with last week (${dur(b.tot)}): ${dl>=0?'+':'-'}${dur(Math.abs(dl))}</p></section>`}
const o=window.render;
window.render=function(){o();try{const app=document.getElementById('app');if(!app)return;
  if(view==='focus'){if(fs&&fs.mode==='focus'){[...app.children].forEach(n=>{if(!n.querySelector('#clock')&&n.id!=='ff-sess')n.style.display='none'})}
    else if(!fs){const L=list();app.insertAdjacentHTML('afterbegin',glance(L)+prio(L));app.insertAdjacentHTML('beforeend',review(L))}}
  else if(view==='today'&&sel===todayIdx&&!document.getElementById('f3-today')){const L=list(),nx=L.find(c=>!c.done);const h=document.createElement('section');h.className='card';h.id='f3-today';
    h.innerHTML=`<p class="lab">Focus today</p><p class="sm">${dur(focusToday())} measured · ${L.filter(c=>c.done).length} of ${L.length} priorities done</p>${nx?`<p class="xs mut">Next: ${E(nx.label)}</p>`:''}<button class="btn sm" style="margin-top:6px" data-a="go" data-v="focus">Open Focus</button>`;
    const ref=document.getElementById('rv-ins')||document.getElementById('rd-today')||[...app.querySelectorAll('h2,h3,.sec')].find(n=>/Today.s plan/.test(n.textContent));if(ref)ref.before(h);else app.appendChild(h)}
  else if(view==='ins'&&!document.getElementById('f3-wk')){const r=document.getElementById('rv-card'),h=weekly();if(r)r.insertAdjacentHTML('afterend',h);else app.insertAdjacentHTML('afterbegin',h)}}catch(e){console.warn(e)}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-f3]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.f3,id=b.dataset.id,t=today(),F=FP();
  if(a==='go'){const c=cands().find(x=>x.id===id);if(!c)return;if(fs){if(fs.link===c.lk){goView('focus')}else toast('Finish or end the current session first');return}
    const mins=c.plan?Math.max(15,Math.min(90,c.plan)):fm,ms=mins*60000,g=(document.getElementById('ff-goal')||{}).value||'';fdone=null;fs={dur:ms,left:ms,endAt:Date.now()+ms,topic:c.label,link:c.lk,brk:fb,mode:'focus',act:c.act,goal:g.trim()};lsSet('wt-focus',fs);goView('focus');return}
  if(a==='done'){const c=cands().find(x=>x.id===id);if(c){setDone(c,!c.done)}}
  else if(a==='pin'){const p=F.pins[t]=F.pins[t]||[];const i=p.indexOf(id);if(i>=0)p.splice(i,1);else p.push(id);lsSet(PK,F)}
  else if(a==='up'||a==='dn'){const s=F.set[t]||[],i=s.indexOf(id),j=i+(a==='up'?-1:1);if(i>=0&&j>=0&&j<s.length){[s[i],s[j]]=[s[j],s[i]];const p=F.pins[t]||[];F.pins[t]=s.filter(x=>p.includes(x));lsSet(PK,F)}}
  else if(a==='rm'){F.set[t]=(F.set[t]||[]).filter(x=>x!==id);F.hide[t]=(F.hide[t]||[]).concat(id);F.pins[t]=(F.pins[t]||[]).filter(x=>x!==id);lsSet(PK,F)}
  else if(a==='car'){const tm=tomorrow();F.set[tm]=(F.set[tm]||[]);if(!F.set[tm].includes(id))F.set[tm].push(id);F.pins[tm]=(F.pins[tm]||[]).concat(F.pins[tm]&&F.pins[tm].includes(id)?[]:[id]);F.carried=F.carried||{};F.carried[id]=t;lsSet(PK,F);toast('Carried to tomorrow')}
  else if(a==='stay'){toast('Left unfinished')}
  render()});
document.addEventListener('change',e=>{const t=e.target,F=FP(),d=today();
  if(t.dataset&&t.dataset.f3==='lv'){F.lv[t.dataset.id]=t.value;lsSet(PK,F);render()}
  else if(t.id==='f3-add'&&t.value){F.set[d]=(F.set[d]||[]).concat(t.value);F.hide[d]=(F.hide[d]||[]).filter(x=>x!==t.value);F.pins[d]=(F.pins[d]||[]).concat(t.value);lsSet(PK,F);render()}
  else if(t.dataset&&t.dataset.f3r){F.rev[d]=Object.assign(F.rev[d]||{},{[t.dataset.f3r]:t.value});lsSet(PK,F)}});
window.f3={cands,list,score,setDone};
})();
