/* Daybook OS screens from the presentation: Academic Workspace (Courses / Exam timetable / Study), Spiritual Workspace, Upcoming card. */
(()=>{
let tab='courses',sub='up',cm=new Date().getMonth(),cy=new Date().getFullYear();
const sv=()=>lsSet('wt-courses',courses);
const pct=c=>c.topics.length?Math.round(c.topics.filter(t=>t.s>=2).length/c.topics.length*100):0;
const exams=()=>courses.flatMap((c,ci)=>(c.exams||[]).map((x,xi)=>({c,ci,x,xi,dl:x.date?daysLeft(x.date):null}))).filter(e=>e.x.date);
const fd=s=>new Date(s+'T00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const clashSet=()=>{const s=new Set();exams().filter(e=>!e.x.dbdone).forEach((a,i,L)=>L.forEach((b,j)=>{if(j>i&&a.x.date===b.x.date&&(!a.x.time||!b.x.time||Math.abs(m(a.x.time)-m(b.x.time))<180)){s.add(a.x.id);s.add(b.x.id)}}));return s};
const tabs=()=>`<div class="dbseg" role="tablist">${[['courses','Courses'],['exams','Exam timetable'],['study','Study & revision']].map(t=>`<button data-dbt="${t[0]}" aria-pressed="${tab===t[0]}">${t[1]}</button>`).join('')}</div>`;
let rng='day';
const bm=b=>{const c=st.c[b.id],mn=(st.mn||{})[b.id];return c==='done'?(mn!=null&&mn!==''?+mn:b.e-b.s):c==='partial'?(+mn||0):0};
function hours(){const idx=rng==='day'?[todayIdx]:DAYS.map((d,i)=>i).filter(i=>i<=todayIdx),g={};
  idx.forEach(i=>(plan[DAYS[i][0]]||[]).forEach(b=>{if(st.c[b.id]==='cancelled')return;const r=g[b.g]||(g[b.g]={p:0,d:0});r.p+=b.e-b.s;r.d+=bm(b)}));
  const sd=(g[R]||{d:0}).d+(g[PR]||{d:0}).d,sp=(g[R]||{p:0}).p+(g[PR]||{p:0}).p;
  return {g,sd,sp}}
function hoursCard(){const h=hours(),G=[[R,'Reading'],[PR,'Class prep'],[K,'Classes'],[C,'Charts'],[F,'Reflection and prayer']];
  return `<section class="card db"><div class="hd"><b>Study hours</b><span class="dbseg sm2" style="margin:0"><button data-dbr="day" aria-pressed="${rng==='day'}">Today</button><button data-dbr="week" aria-pressed="${rng==='week'}">This week</button></span></div>
  <p class="cd" style="margin-top:8px">${dur(h.sd)}</p><p class="why">studied (Reading + Class prep) of ${dur(h.sp)} planned in your daily template. Counts only blocks you marked Done, or the minutes you entered.</p>
  ${G.map(x=>{const r=h.g[x[0]];if(!r||!r.p)return '';const p=Math.min(100,Math.round(r.d/r.p*100));return `<div class="dbhr"><span>${x[1]}</span><span class="pb"><i style="width:${p}%"></i></span><span class="pc">${dur(r.d)} / ${dur(r.p)}</span></div>`}).join('')}</section>`}
function cMin(c){const code=c.code.toLowerCase(),wk=new Date(mon).getTime();let t=0,w=0;
  sessions.forEach(x=>{if(((x.topic||'')+' '+(x.note||'')).toLowerCase().includes(code)){t+=x.min;if(new Date(x.d).getTime()>=wk)w+=x.min}});
  lsGet('wt-slog',[]).forEach(x=>{if(x.v&&x.v.crs===c.code){const n=+x.v.min||0,d=parseInt(x.id,36);t+=n;if(d>=wk)w+=n}});
  DAYS.forEach((d,i)=>(plan[d[0]]||[]).forEach(b=>{if(b.l.toLowerCase().includes(code)&&st.c[b.id]!=='cancelled'){const n=bm(b);t+=n;w+=n}}));
  return{t,w}}
function coursesTab(){const hue=i=>(i*47+140)%360,ex=exams().filter(e=>!e.x.dbdone&&e.dl>=0);
  const tile=(c,ci)=>{const m=cMin(c),e=ex.filter(x=>x.ci===ci).sort((a,b)=>a.dl-b.dl)[0],p=pct(c);
    return `<button class="dbtile2${ocn===ci?' on':''}" style="--h:${hue(ci)}" data-a="oc" data-v="${ci}" aria-expanded="${ocn===ci}"><span class="ct">${esc(c.code)}</span><span class="cn2">${esc(c.name)}</span><span class="hr">${dur(m.t)}</span><span class="why" style="margin:0">studied · ${dur(m.w)} this week</span><span class="pb"><i style="width:${p}%"></i></span><span class="why" style="margin:0">${c.topics.length?c.topics.filter(t=>t.s>=2).length+'/'+c.topics.length+' topics revised':'No topics yet'}</span>${e?`<span class="chip2">Exam in ${e.dl} day${e.dl===1?'':'s'}</span>`:''}</button>`};
  const open=ocn>=0&&courses[ocn]?`<section class="card db">${courseBody(courses[ocn],ocn)}</section>`:'';
  return hoursCard()+`<div class="hd" style="margin:6px 2px"><b>My Courses</b><button class="btn sm p" data-a="addc">+ Add Course</button></div><div class="dbgrid">${courses.map(tile).join('')}</div>${open}<p class="why">Studied time = focus sessions, study-log entries and plan blocks that name the course (for example revision blocks). Percent = topics Revised or Confident. Neither is a grade.</p>`}
function examTab(){const E=exams().sort((a,b)=>a.x.date.localeCompare(b.x.date)||(a.x.time||'').localeCompare(b.x.time||'')),cl=clashSet();
  const up=E.filter(e=>!e.x.dbdone&&e.dl>=0),dn=E.filter(e=>e.x.dbdone||e.dl<0),nx=up[0];
  let h=`<div class="dbseg sm2">${[['up','Upcoming'],['cal','Calendar'],['done','Completed']].map(t=>`<button data-dbs="${t[0]}" aria-pressed="${sub===t[0]}">${t[1]}</button>`).join('')}<button class="btn sm p" style="margin-left:auto" data-a="go" data-v="acad" data-dbadd="1">+ Add Exam</button></div>`;
  const row=e=>`<div class="dbtr"><b>${esc(e.c.code)}</b><span>${fd(e.x.date)}</span><span>${esc(e.x.time||'–')}</span><span>${esc(e.x.venue||'–')}</span><span class="st ${cl.has(e.x.id)?'cx':e.x.dbdone||e.dl<0?'dn':''}">${cl.has(e.x.id)?'Check clash':e.x.dbdone||e.dl<0?'Completed':'Upcoming'}</span><button class="xs" data-dbdone="${e.ci}|${e.xi}">${e.x.dbdone?'Reopen':'Mark done'}</button></div>`;
  const head='<div class="dbtr hd2"><b>Course</b><span>Date</span><span>Time</span><span>Venue</span><span>Status</span><span></span></div>';
  if(sub==='cal'){const f=new Date(cy,cm,1),n=new Date(cy,cm+1,0).getDate(),o=(f.getDay()+6)%7,td=dk(new Date());
    const ds=new Set(E.map(e=>e.x.date));let g=['M','T','W','T','F','S','S'].map(x=>`<i class="dw">${x}</i>`).join('')+'<i></i>'.repeat(o);
    for(let d=1;d<=n;d++){const k=cy+'-'+String(cm+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');g+=`<i class="${ds.has(k)?'ex':''} ${k===td?'td':''}">${d}</i>`}
    h+=`<section class="card db"><div class="hd"><button class="btn sm" data-dbm="-1" aria-label="Previous month">‹</button><b>${f.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b><button class="btn sm" data-dbm="1" aria-label="Next month">›</button></div><div class="dbcal">${g}</div><p class="why">Filled days have an exam.</p></section>`}
  else h+=`<section class="card db">${head}${(sub==='done'?dn:up).map(row).join('')||'<p class="why">Nothing here yet. Add an exam from its course; dates are never invented.</p>'}</section>`;
  h+=`<section class="card db lv"><div class="hd"><b>Exam Countdown</b></div>${nx?`<p class="sm"><b>${esc(nx.c.code)}</b> · ${fd(nx.x.date)}</p><p class="cd">${nx.dl} day${nx.dl===1?'':'s'}</p>`:'<p class="why">No upcoming exam dates set.</p>'}</section><p class="why">To add or edit an exam, open its course under Courses.</p>`;return h}
const oa=acadView;
acadView=function(){if(tab==='study'){oa();const a=document.getElementById('app');a.insertAdjacentHTML('afterbegin',tabs());return}
  document.getElementById('app').innerHTML=tabs()+(tab==='courses'?coursesTab():examTab())};
const ot=todayView;
todayView=function(){ot();try{if(sel!==todayIdx)return;const a=document.getElementById('app');if(a.querySelector('.dbup'))return;const nm=nowMin(),N=dayNums(todayIdx),L=N.bl.filter(b=>b.e>nm&&!st.c[b.id]).slice(0,3),ex=exams().filter(e=>!e.x.dbdone&&e.dl>=0).sort((p,q)=>p.dl-q.dl)[0];
  if(!L.length&&!ex)return;const n=document.createElement('section');n.className='card db dbup';n.innerHTML=`<div class="hd"><b>Upcoming</b></div>${L.map(b=>`<div class="rw"><span class="sm">${esc(b.l)}</span><span class="why">${fmt(b.s)}</span></div>`).join('')}${ex?`<div class="rw"><span class="sm"><b>${esc(ex.c.code)}</b> exam</span><span class="why">${ex.dl} day${ex.dl===1?'':'s'}</span></div>`:''}`;const p=a.querySelector('.rgc'),ref=p?p.closest('section'):null;ref?ref.after(n):a.prepend(n)}catch(e){}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-dbt],[data-dbs],[data-dbm],[data-dbdone],[data-dbr]');if(!t)return;const d=t.dataset;
  if(d.dbr){rng=d.dbr;acadView()}else if(d.dbt){tab=d.dbt;acadView()}else if(d.dbs){sub=d.dbs;acadView()}
  else if(d.dbm){cm+=+d.dbm;if(cm>11){cm=0;cy++}if(cm<0){cm=11;cy--}acadView()}
  else if(d.dbdone){const[ci,xi]=d.dbdone.split('|').map(Number),x=courses[ci].exams[xi];x.dbdone=!x.dbdone;sv();acadView()}});
})();
