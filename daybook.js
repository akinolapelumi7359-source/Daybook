/* Daybook OS layer. Adds separate Quiet time / Bible study records and an exam countdown. Own key only: wt-daybook. */
(()=>{
const K='wt-daybook';let D=lsGet(K,{qt:{},bs:{}});if(!D.qt)D.qt={};if(!D.bs)D.bs={};
const save=()=>lsSet(K,D),today=()=>dk(new Date());
const wkDays=()=>{const o=[],n=new Date();for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);if(d<=n)o.push(dk(d))}return o};
window.dbWeek=(m,only)=>`<div class="wkS" aria-hidden="true">${DAYS.map((d,i)=>{const k=dk(dateOf(i)),on=!!m[k],off=only&&!only.includes(i);return `<div class="wkd${on?' on':''}${i===todayIdx?' td':''}${off?' off':''}"><small>${'MTWTFSS'[i]}</small><span>${on?'✓':''}</span></div>`}).join('')}</div>`;
function card(){D=lsGet(K,{qt:{},bs:{}});D.qt=D.qt||{};D.bs=D.bs||{};
  const t=today(),days=wkDays(),qn=days.filter(d=>D.qt[d]).length,all=[];
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);all.push(dk(d))}
  const bn=all.filter(d=>D.bs[d]).length,tg=3;
  const dots=(m)=>`<span class="dots" aria-hidden="true">${all.map(d=>`<i class="${m[d]?'on':''}"></i>`).join('')}</span>`;
  let ex='';try{const x=nextExam();if(x)ex=`<section class="card db lv"><div class="hd"><b>Next exam · ${esc(x.c.code)}</b><span class="pill">${x.dl===0?'Today':x.dl+' day'+(x.dl===1?'':'s')}</span></div><p class="cd">${x.dl}</p><p class="why">${esc(x.x.date)}${x.x.time?' · '+esc(x.x.time):''}. Open Academics to edit or archive.</p></section>`}catch(e){}
  return ex+`<section class="card db"><div class="hd"><b>Spiritual log</b><small>recorded by you, counted separately</small></div>
  <div class="rw"><div><b class="sm">Quiet time</b><div class="why">${qn} of ${days.length} days this week · target daily</div>${dbWeek(D.qt)}</div><button class="btn sm${D.qt[t]?'':' p'}" data-db="qt">${D.qt[t]?'Logged ✓ Undo':'Log today'}</button></div>
  ${[2,4,5].includes(todayIdx)?`<div class="rw"><div><b class="sm">Bible study</b><div class="why">${bn} of ${tg} sessions this week${D.bs[t]&&D.bs[t].r?' · today: '+esc(D.bs[t].r):''}</div>${dbWeek(D.bs,[2,4,5])}</div><button class="btn sm${D.bs[t]?'':' p'}" data-db="bs">${D.bs[t]?'Logged ✓ Undo':'Log session'}</button></div>`:''}
  ${[2,4,5].includes(todayIdx)?`<input class="rf" id="dbref" placeholder="Passage for today’s Bible study (optional), e.g. John 3:16" value="${esc((D.bs[t]||{}).r||'')}" aria-label="Bible study passage">`:''}
  </section>`;
}

const o=todayView;todayView=function(){o();if(sel===todayIdx)try{const a=document.getElementById('app');const w=document.createElement('div');w.innerHTML=card();const at=a.querySelector('.rgc');const ref=at?at.closest('section'):null;[...w.children].reverse().forEach(n=>ref?ref.after(n):a.prepend(n));home(a)}catch(e){void e}};

function home(a){
  try{if(!a.querySelector('.dbins')){const T=['This week','Rest and balance','Today at a glance'];
    const S=[...a.querySelectorAll(':scope > section.card')].filter(n=>T.includes(((n.querySelector('.lab')||{}).textContent||'').trim()));
    if(S.length){const d=document.createElement('details');d.className='card db dbins';d.innerHTML='<summary class="lab" style="margin:0">Today’s insights</summary>';S[0].before(d);S.forEach(n=>{n.classList.remove('card');n.style.cssText='padding:10px 0 0;border:0;box-shadow:none';d.appendChild(n)})}}}catch(e){void e}
  const ch=a.querySelector('.gr .chips');if(ch&&!ch.querySelector('[data-v=srch]'))ch.insertAdjacentHTML('afterbegin','<button class="ib" data-a="go" data-v="srch" aria-label="Search everything"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></button>');
  const q=a.querySelector('.qg');if(q){const T=[['go','plan','Daily tracker'],['go','ins','Progress'],['go','acad','Academics'],['go','faith','Faith'],['go','srch','Search'],['cap','','Quick add']];
    q.className='dbt';q.innerHTML=T.map(t=>`<button class="dbtile" data-a="${t[0]==='cap'?'dbcap':t[0]}" data-v="${t[1]}">${t[2]}</button>`).join('')}
  const c=clashes().filter(x=>x.dl<=21);if(c.length&&!a.querySelector('.dbclash')){const h=a.querySelector('.hero');const n=document.createElement('section');n.className='card r db dbclash';n.innerHTML=`<b class="sm">Exam clash to check</b><p class="why">${esc(c[0].msg)}</p>`;h?h.after(n):a.prepend(n)}
}
function clashes(){const L=[];courses.forEach(c=>(c.exams||[]).forEach(x=>{if(x.date&&!x.done)L.push({c,x,dl:daysLeft(x.date)})}));const o=[];
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const A=L[i],B=L[j];if(A.x.date!==B.x.date||A.dl<0)continue;
    const ta=A.x.time,tb=B.x.time,nm=A.c.code+' and '+B.c.code+' on '+A.x.date;
    if(ta&&tb&&ta===tb)o.push({dl:A.dl,sev:'Confirmed clash',msg:nm+' start at the same time ('+ta+'). Check with your department.'});
    else if(ta&&tb&&Math.abs(m(ta)-m(tb))<180)o.push({dl:A.dl,sev:'Warning',msg:nm+' start less than 3 hours apart. Allow for travel and rest.'});
    else if(!ta||!tb)o.push({dl:A.dl,sev:'Warning',msg:nm+' are on the same day but a start time is missing, so overlap cannot be checked.'})}
  return o.sort((a,b)=>a.dl-b.dl)}
const oa=acadView;acadView=function(){oa();try{const c=clashes(),a=document.getElementById('app');if(c.length){const n=document.createElement('section');n.className='card r db';n.innerHTML='<b class="sm">Exam clash check</b>'+c.map(x=>`<p class="why"><b>${x.sev}:</b> ${esc(x.msg)}</p>`).join('');const f=a.querySelector('.note');f?f.after(n):a.prepend(n)}}catch(e){}};
document.addEventListener('click',e=>{if(e.target.closest('[data-a=dbcap]')){const f=document.querySelector('.fab2');f&&f.click()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-db]');if(!b)return;const t=today(),k=b.dataset.db;D=lsGet(K,{qt:{},bs:{}});D.qt=D.qt||{};D.bs=D.bs||{};
  dbMark(k,t,!D[k][t],k==='bs'?(document.getElementById('dbref')||{}).value||'':'');todayView()});
document.addEventListener('change',e=>{if(e.target.id==='dbref'){const t=today();if(D.bs[t]){D.bs[t].r=e.target.value;save()}}});
document.getElementById('title')&&new MutationObserver(()=>{const h=document.getElementById('title');if(h&&/Week Tracker/.test(h.textContent))h.textContent=h.textContent.replace('Week Tracker','Daybook OS')}).observe(document.getElementById('title'),{childList:true,characterData:true,subtree:true});
})();
/* Next-task suggestion and weekly review. Local rules, no AI needed. Suggestions only: nothing is moved, completed or edited. */
(()=>{
const KD='wt-dbdismiss';
const nextTask=()=>{const N=dayNums(todayIdx),nm=nowMin(),dis=lsGet(KD,{})[today()]||[];let ex=null;try{ex=nextExam()}catch(e){}
  const C=N.bl.filter(b=>!st.c[b.id]&&b.e>nm&&b.g!=='Classes'&&b.g!=='Meals and breaks'&&b.g!=='Wake and quiet time'&&!dis.includes(b.id)).map(b=>{let s=0,w=[];
    if(st.s[b.id]){s+=5;w.push('it is one of your Top 3')}
    if(isMissed(b,todayIdx)){s+=3;w.push('it was missed earlier')}
    if(ex&&ex.dl<=14&&b.l.toLowerCase().includes(ex.c.code.toLowerCase())){s+=4;w.push(ex.c.code+' has an exam in '+ex.dl+' day'+(ex.dl===1?'':'s'))}
    if(b.s<=nm+30&&b.e>nm){s+=2;w.push('it fits the time you have now')}
    return{b,s,w}}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||a.b.s-b.b.s);return C[0]||null};
const o=todayView;todayView=function(){o();try{if(sel!==todayIdx)return;const t=nextTask(),a=document.getElementById('app');if(!t||a.querySelector('.dbnext'))return;
  const n=document.createElement('section');n.className='card db lv dbnext';n.innerHTML=`<div class="hd"><b>Suggested next</b><span class="pill">suggestion</span></div><p class="big" style="margin:6px 0 0">${esc(t.b.l)}</p><p class="why">${fmt(t.b.s)} to ${fmt(t.b.e)}. Suggested because ${t.w.join(', and ')}.</p><div class="row2"><button class="btn sm p" data-a="go" data-v="focus">Start focus</button><button class="btn sm" data-dbx="${esc(t.b.id)}">Not relevant</button></div>`;
  const h=a.querySelector('.hero');h?h.after(n):a.prepend(n)}catch(e){}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-dbx]');if(!b)return;const D=lsGet(KD,{}),t=today();D[t]=(D[t]||[]).concat(b.dataset.dbx);lsSet(KD,D);todayView()});
function review(){const g={};let tot=0,done=0,sk=0,ms=0;
  DAYS.forEach((d,i)=>{if(i>todayIdx)return;(plan[d[0]]||[]).forEach(b=>{const c=st.c[b.id];if(c==='cancelled')return;tot++;const r=g[b.g]||(g[b.g]={n:0,d:0,m:0});r.n++;if(c==='done'){done++;r.d++}else if(c==='skipped'){sk++;r.m++}else if(isMissed(b,i)){ms++;r.m++}})});
  const rows=Object.entries(g).filter(x=>x[1].n>=3&&x[1].m>0).sort((a,b)=>b[1].m/b[1].n-a[1].m/a[1].n).slice(0,3);
  let q=0,bs=0;const D=lsGet('wt-daybook',{qt:{},bs:{}});for(let i=0;i<=todayIdx;i++){const d=dk(dateOf(i));if(D.qt&&D.qt[d])q++;if(D.bs&&D.bs[d])bs++}
  return `<section class="card db"><div class="hd"><b>Weekly review</b><small>plan vs what was recorded</small></div><p class="sm">${done} of ${tot} planned blocks done, ${sk} skipped, ${ms} passed with no outcome. Cancelled blocks are not counted.</p>${rows.length?'<p class="why"><b>Worth a look:</b></p>'+rows.map(x=>`<p class="why">${esc(x[0])}: ${x[1].m} of ${x[1].n} not done. This is a pattern in your records, not a cause.</p>`).join(''):'<p class="why">No group stands out yet.</p>'}<p class="why">Quiet time logged ${q} of ${todayIdx+1} days. Bible study ${bs} of ${3} sessions.</p><p class="why">Suggestion: if one group keeps slipping, try a shorter block or a different time in Plan. Nothing changes unless you edit it.</p></section>`}
const oi=insightsView;insightsView=function(){oi();try{const a=document.getElementById('app'),n=document.createElement('div');n.innerHTML=review();a.prepend(n.firstChild)}catch(e){}};
})();

/* Backup coverage: Daybook records travel with your backup and restore. */
(()=>{const mb=window.makeBackup,ab=window.applyBackup;
window.makeBackup=function(j){const d=mb(j);try{d.ux=d.ux||{};d.ux.db=lsGet('wt-daybook',{qt:{},bs:{}});d.ux.dbdis=lsGet('wt-dbdismiss',{})}catch(e){}return d};
window.applyBackup=function(d){const r=ab(d);try{if(d&&d.ux&&d.ux.db){lsSet('wt-daybook',d.ux.db);if(d.ux.dbdis)lsSet('wt-dbdismiss',d.ux.dbdis);setTimeout(()=>location.reload(),600)}}catch(e){}return r};})();
