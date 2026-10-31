/* Weekly life review, grounded dashboard insights, and proposals that need your approval. Facts come only from recorded data. */
(function(){
const VK='wt-reviews',DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],BS=[2,4,5];
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const V=()=>{const v=lsGet(VK,null)||{};v.saved=v.saved||{};v.dis=v.dis||[];return v};
const wk0=()=>{const t=new Date();t.setHours(12,0,0,0);t.setDate(t.getDate()-((t.getDay()+6)%7));return t};
const dts=()=>[0,1,2,3,4,5,6].map(i=>{const d=new Date(wk0());d.setDate(d.getDate()+i);return dk(d)});
const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};
const sMins=(id,d)=>lsGet('wt-sessions',[]).filter(s=>s.link&&s.link.startsWith('reading|'+id+'|'+d)).reduce((a,s)=>a+(s.min||0),0);
const rst=(r,it,d)=>(r.log[it.id+'|'+d]||{}).st||(sMins(it.id,d)>0?'ongoing':'');
const act=(it,d)=>{if(it.paused)return false;const w=(new Date(d+'T12:00:00').getDay()+6)%7;return it.days.includes(w)&&d>=it.start&&(!it.end||d<=it.end)};
function facts(){const D=dts(),t=dk(new Date()),ti=D.indexOf(t),F={wk:D[0]};
  let tot=0,dn=0,sk=0;const g={};
  try{DAYS.forEach((dy,i)=>{if(i>ti)return;blocks(dy[0]).forEach(b=>{if(i===ti&&b.e>nowMin())return;tot++;const s=st.c&&st.c[b.id];if(s==='done')dn++;if(s==='skipped')sk++;g[b.g]=g[b.g]||[0,0];g[b.g][1]++;if(s==='done')g[b.g][0]++})})}catch(e){void e}
  F.plan={tot,dn,sk,g};
  const r=lsGet('wt-reading',{items:[],log:{}});F.read=(r.items||[]).map(it=>{let sch=0,c=0,p=0,m=0,u=0;D.forEach(d=>{if(!act(it,d))return;sch++;const s=rst(r,it,d);if(d>t)return;if(s==='completed')c++;else if(s==='partially completed')p++;else if(s==='missed')m++;else if(!s||s==='scheduled')u++});return{id:it.id,n:it.mat,sch,c,p,m,u,mins:it.mins}});
  const dbk=lsGet('wt-daybook',{qt:{},bs:{}});F.qt=D.filter(d=>(dbk.qt||{})[d]).length;F.bs=D.filter((d,i)=>BS.includes(i)&&(dbk.bs||{})[d]).length;
  try{const s=lsGet('wt-plans',null),p=s.plans.find(x=>x.id===s.cur)||s.plans[0],gp=(s.prog[p.id]||{});F.bible=Object.keys(gp).filter(k=>gp[k].done&&D.includes(gp[k].done)).length}catch(e){F.bible=0}
  F.focus=lsGet('wt-sessions',[]).filter(s=>D.includes(dk(new Date(s.d)))).reduce((a,s)=>a+(s.min||0),0);return F}
const pct=F=>F.plan.tot?Math.round(100*F.plan.dn/F.plan.tot):0;
function lines(F){const L=[];L.push(`Planner: ${F.plan.dn} of ${F.plan.tot} blocks marked done so far this week (${pct(F)}%), ${F.plan.sk} skipped.`);
  const gl=Object.keys(F.plan.g).map(k=>k+' '+F.plan.g[k][0]+'/'+F.plan.g[k][1]).join(', ');if(gl)L.push('By group: '+gl+'.');
  F.read.forEach(x=>L.push(`Reading, ${x.n}: ${x.sch} scheduled, ${x.c} completed, ${x.p} partial, ${x.m} marked missed, ${x.u} with no outcome recorded.`));if(!F.read.length)L.push('Reading: no academic reading scheduled.');
  L.push(`Quiet time recorded on ${F.qt} of 7 days. Bible study sessions: ${F.bs} of 3. Bible plan days completed this week: ${F.bible}.`);L.push(`Focus time recorded: ${F.focus} minutes.`);try{const dl=deadlines();if(dl.length)L.push('Deadlines: '+dl.join(' '))}catch(e){void e}try{const W=window.rmapWeek?rmapWeek():[];if(W.length)L.push('Plan reading hours by course (done of planned): '+W.map(x=>x.code+' '+Math.floor(x.done/60)+'h'+(x.done%60)+'m of '+Math.floor(x.plan/60)+'h'+(x.plan%60)+'m').join(', ')+'.')}catch(e){void e}return L}
function props(F){const v=V(),r=lsGet('wt-reading',{items:[]}),P=[];
  F.read.forEach(x=>{const past=x.c+x.p+x.m+x.u;if(past<3)return;const it=r.items.find(i=>i.id===x.id);if(!it||it.paused)return;
    if(x.c===0&&x.p===0&&past>=5)P.push({k:x.id+'|pause|'+F.wk,t:`Pause "${x.n}": none of its ${past} sessions this week has a completed or partial record.`,a:'pause',id:x.id});
    else if(x.c/past<0.5&&it.mins>20)P.push({k:x.id+'|short|'+F.wk,t:`Shorten "${x.n}" from ${it.mins} to ${Math.max(20,it.mins-15)} minutes: only ${x.c} of ${past} sessions are completed.`,a:'short',id:x.id})});
  return P.filter(p=>!v.dis.includes(p.k))}
let AIr='',busy=false,past=false;
function card(){const F=facts(),L=lines(F),P=props(F),v=V(),sv=Object.keys(v.saved).sort().reverse();
  let h=`<section class="card db" id="rv-card"><div class="hd"><b>Weekly life review</b><span class="pill">week of ${F.wk}</span></div><p class="why">Built only from what you recorded. Blocks with no outcome are not counted as missed.</p>`+L.map(x=>`<p class="sm" style="margin-top:6px">${E(x)}</p>`).join('');
  if(P.length)h+=`<p class="xs mut" style="margin:12px 0 2px"><b>Proposed changes</b> (nothing changes until you approve)</p>`+P.map(p=>`<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm">${E(p.t)}</p><div class="row2"><button class="btn sm" data-rv="yes" data-k="${E(p.k)}">Approve</button><button class="btn sm" data-rv="no" data-k="${E(p.k)}">Not now</button></div></div>`).join('');
  h+=`<div class="row2" style="margin-top:10px"><button class="btn sm" data-rv="ai"${busy?' disabled':''}>${busy?'Thinking…':'Write my review (AI)'}</button><button class="btn sm" data-rv="save">Save this review</button></div>`;
  if(AIr)h+=`<p class="xs mut" style="margin:10px 0 2px">AI review (nothing has been changed)</p><p class="sm" style="white-space:pre-wrap">${E(AIr)}</p>`;
  if(sv.length){h+=`<details${past?' open':''} style="margin-top:12px"><summary class="sm"><b>Past reviews (${sv.length})</b></summary>`;sv.forEach((k,i)=>{const x=v.saved[k],pv=v.saved[sv[i+1]];h+=`<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm"><b>Week of ${k}</b> · planner ${x.pct}% · quiet time ${x.qt}/7${pv?` · vs previous: planner ${x.pct-pv.pct>=0?'+':''}${x.pct-pv.pct}%, quiet time ${x.qt-pv.qt>=0?'+':''}${x.qt-pv.qt}`:''}</p>`+x.lines.map(l=>`<p class="xs mut">${E(l)}</p>`).join('')+(x.ai?`<p class="xs mut" style="margin-top:4px">AI review:</p><p class="xs" style="white-space:pre-wrap">${E(x.ai)}</p>`:'')+'</div>'});h+='</details>'}
  return h+'</section>'}
function deadlines(){const t=dk(new Date()),T=new Date(t+'T12:00:00'),L=[],nm=id=>{const c=(typeof courses!=='undefined'?courses:[]).find(x=>x.id===id);return c?c.code:''};
  const dd=d=>Math.round((new Date(d+'T12:00:00')-T)/864e5);
  lsGet('wt-assign',[]).filter(x=>!x.done).forEach(x=>{const n=dd(x.due);if(n<0)L.push(`${nm(x.cid)} "${x.title}" was due ${-n} day${n===-1?'':'s'} ago and is not marked done.`);else if(n<=7)L.push(`${nm(x.cid)} "${x.title}" is due ${n===0?'today':n===1?'tomorrow':'in '+n+' days'}.`)});
  try{courses.forEach(c=>(c.exams||[]).forEach(x=>{if(x.date&&!x.dbdone){const n=dd(x.date);if(n>=0&&n<=21)L.push(`${c.code} exam in ${n} day${n===1?'':'s'} (${x.date}).`)}}))}catch(e){void e}
  return L}
function insights(){const F=facts(),t=dk(new Date()),L=[],r=lsGet('wt-reading',{items:[],log:{}});
  (r.items||[]).filter(i=>act(i,t)).forEach(i=>{const s=rst(r,i,t);if(s!=='completed')L.push(`Academic reading "${i.mat}" is scheduled today${s==='ongoing'?' and you have focused on it, but it is not marked complete':''}.`)});
  try{if(!((lsGet('wt-daybook',{}).qt||{})[t])&&new Date().getHours()>=6){const s=lsGet('wt-plans',null),p=s.plans.find(x=>x.id===s.cur)||s.plans[0],g=s.prog[p.id]||{},R=p.days||[];let n=1;while(g[n]&&g[n].done)n++;L.push('Quiet time is not recorded today.'+(R[n-1]?` Your Bible plan is at Day ${n}.`:''))}}catch(e){void e}
  const un=F.plan.tot-F.plan.dn-F.plan.sk;if(un>=3&&F.plan.tot>0)L.push(`${un} blocks so far this week have no outcome recorded. Open the weekly review to see the breakdown.`);
  F.read.forEach(x=>{const pst=x.c+x.p+x.m+x.u;if(pst>=3&&x.c===0&&x.p===0)L.push(`"${x.n}" has no completed record on its ${pst} sessions this week.`)});
  return deadlines().concat(L).slice(0,5)}
const o=window.render;window.render=function(){o();try{const app=document.getElementById('app');if(!app)return;
  if(view==='ins'&&!document.getElementById('rv-card'))app.insertAdjacentHTML('afterbegin',card());
  if(view==='today'&&sel===todayIdx&&!document.getElementById('rv-ins')){const L=insights();if(L.length){const h=document.createElement('section');h.className='card';h.id='rv-ins';h.innerHTML='<p class="lab">From your records</p>'+L.map(x=>`<p class="sm" style="margin-top:6px">${E(x)}</p>`).join('')+'<button class="btn sm" style="margin-top:8px" data-a="go" data-v="ins">Open weekly review</button>';
    const ref=document.getElementById('rd-today')||[...app.querySelectorAll('h2,h3,.sec')].find(n=>/Today.s plan/.test(n.textContent));if(ref)ref.before(h);else app.appendChild(h)}}}catch(e){void e}};
document.addEventListener('click',async e=>{const b=e.target.closest('[data-rv]');if(!b)return;const a=b.dataset.rv,k=b.dataset.k,v=V();
  if(a==='no'){v.dis.push(k);lsSet(VK,v)}
  else if(a==='yes'){const P=props(facts()).find(p=>p.k===k);if(!P)return;const r=lsGet('wt-reading',{items:[],log:{}}),it=r.items.find(i=>i.id===P.id);if(!it)return;if(P.a==='pause')it.paused=true;else it.mins=Math.max(20,it.mins-15);lsSet('wt-reading',r);v.dis.push(k);lsSet(VK,v);toast('Change applied')}
  else if(a==='save'){const F=facts();v.saved[F.wk]={lines:lines(F),ai:AIr,pct:pct(F),qt:F.qt,savedAt:Date.now()};lsSet(VK,v);past=true;toast('Review saved')}
  else if(a==='ai'&&!busy){const A=lsGet('wt-ai',{});if(!A.on||!/^https:\/\//.test(A.url||'')){AIr='AI is off. Turn on Use AI features in Settings.';return render()}
    busy=true;render();const F=facts();
    try{const q=await fetch(A.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'weekly-review',assistant:'reflection',context:'Recorded facts for this week:\n'+lines(F).join('\n'),messages:[{role:'user',content:'Write my weekly review: achievements, incomplete items, patterns, and realistic suggestions for next week. Use only the recorded facts. Keep it encouraging and honest, and do not claim anything was changed.'}]})}),j=await q.json().catch(()=>({}));AIr=q.ok&&j.text?j.text:'AI server problem: '+(j.error||('HTTP '+q.status))}
    catch(x){AIr='AI server problem: '+String((x&&x.message)||x).slice(0,120)}busy=false}
  render()});
})();
  
