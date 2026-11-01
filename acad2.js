/* Academics upgrade: clean overview, Study Timetable page (max two courses a day, equal split of available hours, availability read from your plan), assignments and progress. */
(function(){
const CUR=['ELE 401','ELE 403','ELE 405','ELE 407','ELE 409','AB 443','AB 413'];
const NORM=c=>String(c||'').replace(/\s+/g,' ').trim().toUpperCase().replace(/^ABE /,'AB ');
const DEFP={mon:['ELE 407','ELE 409'],tue:['ELE 405','ELE 401'],wed:['ELE 403','AB 413'],thu:['AB 443','ELE 403'],fri:['ELE 409','ELE 407'],sat:['ELE 405','ELE 401'],sun:['ELE 409','AB 443']};
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const TK='wt-tt',DK='wt-ttd',AK='wt-assign';let at='over',wkv=false,ttOpen=false;
const tm=m=>{m=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const hrs=m=>{const h=Math.round(m/6)/10;return h+(h===1?' HOUR':' HOURS')},dur=m=>Math.floor(m/60)+'h '+String(Math.round(m%60)).padStart(2,'0')+'m';
const cur=()=>courses.filter(c=>CUR.includes(NORM(c.code)));
const cfg=()=>Object.assign({pairs:{},brk:10,run:90},lsGet(TK,{}));
const dayDate=i=>{const t=new Date();t.setHours(12,0,0,0);t.setDate(t.getDate()-((t.getDay()+6)%7)+i);return dk(t)};
const merge=L=>{L=L.filter(x=>x[1]>x[0]).sort((a,b)=>a[0]-b[0]);const o=[];L.forEach(x=>{const l=o[o.length-1];if(l&&x[0]<=l[1])l[1]=Math.max(l[1],x[1]);else o.push(x.slice())});return o};
const sub=(A,B)=>{let o=[];A.forEach(a=>{let p=[a.slice()];B.forEach(b=>{p=p.flatMap(x=>{if(b[1]<=x[0]||b[0]>=x[1])return [x];const r=[];if(b[0]>x[0])r.push([x[0],b[0]]);if(b[1]<x[1])r.push([b[1],x[1]]);return r})});o=o.concat(p)});return o};
function avail(k){const c=cfg(),bl=blocks(k).filter(b=>st.c[b.id]!=='cancelled'),S=merge(bl.filter(b=>b.g==='Reading').map(b=>[b.s,b.e])),O=merge(bl.filter(b=>b.g!=='Reading').map(b=>[b.s,b.e]));
  const study=merge(sub(S,O)),free=sub([[300,1440]],merge(bl.map(b=>[b.s,b.e]))).filter(x=>x[1]-x[0]>=30),ch=[];
  study.forEach(([a,b])=>{let p=a;while(p<b){const e=Math.min(p+c.run,b);ch.push([p,e]);p=e;if(p<b)p=Math.min(p+c.brk,b)}});
  return{study,chunks:ch,free,occ:O.reduce((a,x)=>a+x[1]-x[0],0),total:ch.reduce((a,x)=>a+x[1]-x[0],0)}}
function pair(k){const cu=cur(),ids=cu.map(c=>c.id),c=cfg();let p=(c.pairs[k]||[]).filter(x=>ids.includes(x));
  if(!p.length){p=(DEFP[k]||[]).map(code=>(cu.find(x=>NORM(x.code)===NORM(code))||{}).id).filter(Boolean)}
  p=[...new Set(p)].slice(0,2);
  if(p.length<2){const cov={},c2=code=>(cu.find(x=>NORM(x.code)===NORM(code))||{}).id;ids.forEach(i=>cov[i]=0);
    DAYS.forEach(d=>{if(d[0]===k)return;const q=(c.pairs[d[0]]&&c.pairs[d[0]].length)?c.pairs[d[0]]:(DEFP[d[0]]||[]).map(c2);q.filter(Boolean).forEach(i=>{if(i in cov)cov[i]++})});
    ids.filter(i=>!p.includes(i)).sort((a,b)=>cov[a]-cov[b]).slice(0,2-p.length).forEach(i=>p.push(i))}
  return p}
function plan(k){const a=avail(k),pr=pair(k),T=pr.length?Math.floor(a.total/pr.length):0,need=pr.map(()=>T),out=[];let i=0;
  a.chunks.forEach(([s,e])=>{let p=s;while(p<e&&i<pr.length){if(need[i]<=0){i++;continue}const t=Math.min(e-p,need[i]);out.push({cid:pr[i],s:p,e:p+t,plan:t});p+=t;need[i]-=t;if(need[i]<=0)i++}});
  const m=[],bk=cfg().brk;out.forEach(x=>{const l=m[m.length-1];if(l&&l.cid===x.cid&&x.s-l.e<=bk){l.e=x.e;l.plan+=x.plan}else m.push(x)});return{a,pr,T,pieces:m}}
const actual=id=>sessions.filter(x=>x.link==='study|'+id).reduce((a,x)=>a+x.min,0);
const live=id=>fs&&fs.mode==='focus'&&fs.link==='study|'+id?Math.max(0,Math.round((fs.dur-Math.max(0,fLeft()))/60000)):0;
function ensure(i){const k=DAYS[i][0],d=dayDate(i),D=lsGet(DK,{}),P=plan(k),sig=JSON.stringify(P.pieces.map(p=>[p.cid,p.s,p.e])),old=D[d],t=dk(new Date());
  if(d<t&&!old)return {list:[],P};
  const mk=p=>({id:'ss'+d.replace(/-/g,'')+Math.random().toString(36).slice(2,7),cid:p.cid,s:p.s,e:p.e,plan:p.plan,st:'planned',moved:false});
  if(!old){D[d]={sig,list:P.pieces.map(mk)};lsSet(DK,D)}
  else if(old.sig!==sig&&d>=t){const kept=old.list.filter(x=>x.moved||x.st!=='planned'||actual(x.id)>0||(fs&&fs.link==='study|'+x.id));
    if(!kept.length)D[d]={sig,list:P.pieces.map(mk)};
    else{const used={};kept.forEach(x=>used[x.cid]=(used[x.cid]||0)+x.plan);const add=[];
      P.pieces.forEach(p=>{if(kept.some(x=>p.s<x.e&&x.s<p.e))return;const rem=P.T-(used[p.cid]||0);if(rem<=0)return;const t2=Math.min(p.plan,rem);used[p.cid]=(used[p.cid]||0)+t2;add.push(mk({cid:p.cid,s:p.s,e:p.s+t2,plan:t2}))});
      D[d]={sig,list:kept.concat(add).sort((a,b)=>a.s-b.s)}}lsSet(DK,D)}
  return{list:(lsGet(DK,{})[d]||{list:[]}).list,P}}
const cn=id=>{const c=courses.find(x=>x.id===id);return c?c.code:'?'};
const stat=(x,d)=>{if(fs&&fs.link==='study|'+x.id)return 'running';if(x.st!=='planned')return x.st;if(d<dk(new Date())||(d===dk(new Date())&&x.e<=nowMin()&&actual(x.id)===0))return 'not recorded';return 'planned'};
function sesRow(x,d,today){const a=actual(x.id)+live(x.id),s=stat(x,d);return `<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm"><b>${E(cn(x.cid))}</b> · ${tm(x.s)}–${tm(x.e)} · planned ${dur(x.plan)} (breaks not counted) · actual ${dur(a)} · <b>${s}</b></p>`+(today?`<div class="row2" style="margin-top:6px;flex-wrap:wrap"><button class="btn sm" data-ac="start" data-id="${x.id}">Start Study</button><button class="btn sm" data-ac="pause" data-id="${x.id}">Pause Study</button><button class="btn sm" data-ac="done" data-id="${x.id}">Complete Session</button><button class="btn sm" data-ac="rs" data-id="${x.id}" data-d="${d}">Reschedule</button><button class="btn sm" data-ac="miss" data-id="${x.id}">Missed</button></div>`:'')+'</div>'}
function overall(){const cu=cur();let n=0,r=0;cu.forEach(c=>{n+=c.topics.length;r+=c.topics.filter(t=>t.s>=2).length});return n?Math.round(100*r/n):null}
const asg=()=>lsGet(AK,[]);
function upcoming(){const t=dk(new Date()),L=[];asg().filter(x=>!x.done&&x.due>=t).forEach(x=>L.push([x.due,cn(x.cid),x.title,'Assignment']));cur().forEach(c=>(c.exams||[]).forEach(x=>{if(x.date&&x.date>=t&&!x.dbdone)L.push([x.date,c.code,x.name||x.t||'Exam','Exam'])}));return L.sort((a,b)=>a[0]<b[0]?-1:1).slice(0,6)}
function nav(){return `<div class="ai-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${[['over','Overview'],['tt','Study timetable'],['asg','Assignments & exams'],['prog','Progress'],['classic','Classic tools']].map(([k,l])=>`<button class="btn sm" data-ac="pg" data-k="${k}"${at===k?' style="background:var(--ok);color:#fff"':''}>${l}</button>`).join('')}</div>`}
function overview(){const cu=cur(),pc=overall(),i=todayIdx,e=ensure(i),d=dk(new Date()),done=e.list.reduce((a,x)=>a+actual(x.id),0),nx=e.list.filter(x=>x.st==='planned'&&x.e>nowMin()).sort((a,b)=>a.s-b.s)[0],sm=cu.map(c=>c.semester).filter(Boolean)[0],U=upcoming();
  return `<p class="xs mut" style="margin:0 0 10px">Your academic progress at a glance.</p>${nav()}
<section class="card db"><p class="lab">Current semester</p><p class="sm"><b>${E(sm||'Not set yet')}</b></p><p class="xs mut">${sm?'Taken from your course records.':'Set the semester on a course page.'}</p></section>
<div class="row2"><section class="card db" style="flex:1"><p class="lab">Registered courses</p><p class="sm"><b>${cu.length}</b></p></section><section class="card db" style="flex:1"><p class="lab">Overall progress</p><p class="sm"><b>${pc==null?'Not yet':pc+'%'}</b></p><p class="xs mut">${pc==null?'Add topics to a course':'Topics revised'}</p></section></div>
<section class="card db"><p class="lab">My courses</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">${cu.map(c=>{const p=c.topics.length?Math.round(100*c.topics.filter(t=>t.s>=2).length/c.topics.length):null;return `<button class="btn" style="text-align:left;padding:10px" data-a="oc" data-v="${courses.indexOf(c)}"><b>${E(c.code)}</b><br><span class="xs">${E(c.name||'')}</span><br><span class="xs mut">${p==null?'No topics yet':p+'% revised'} ›</span></button>`}).join('')||'<p class="sm mut">None of your current courses are in the list yet.</p>'}</div></section>
<section class="card db"><p class="lab">Upcoming academic activities</p>${U.length?U.map(x=>`<p class="sm" style="margin-top:6px"><b>${E(x[1])}</b> ${E(x[2])} <span class="xs mut">· ${x[3]} · ${x[0]}</span></p>`).join(''):'<p class="sm mut">No upcoming assignments or exams.</p>'}</section>
<section class="card db"><p class="lab">Study overview (today)</p><p class="sm">Available: <b>${dur(e.P.a.total)}</b> · Planned: <b>${dur(e.list.reduce((a,x)=>a+x.plan,0))}</b> · Completed: <b>${dur(done)}</b></p><p class="xs mut">${nx?'Next: '+E(cn(nx.cid))+' at '+tm(nx.s):(e.list.length?'No more sessions today.':'No usable study time today.')}</p><button class="btn sm" style="margin-top:8px" data-ac="pg" data-k="tt">Open Study Timetable</button></section>
<details class="card db"><summary class="sm"><b>Previous courses</b></summary>${courses.filter(c=>!cu.includes(c)).map(c=>`<button class="btn sm" style="margin-top:6px" data-a="oc" data-v="${courses.indexOf(c)}">${E(c.code)} ${E(c.name||'')}</button>`).join('')||'<p class="xs mut">None.</p>'}</details>`}
function timetable(rd,rm){const c=cfg(),ti=todayIdx,e=ensure(ti),d=dk(new Date());let h=`<p class="xs mut" style="margin:0 0 10px">Study timetable: two courses a day, with each day's study hours split equally.</p>${nav()}`;
  h+=`<section class="card db"><p class="lab">Today’s study schedule</p><p class="sm"><b>${DAYS[ti][1].toUpperCase()}: ${hrs(e.P.a.total)} AVAILABLE FOR STUDY.</b></p>`+(e.P.pr.length&&e.P.T?`<p class="sm">${e.P.pr.map(i=>E(cn(i))+': '+dur(e.P.T)).join(' · ')} (equal split)</p>`:'<p class="sm mut">No usable study time today, so no session is planned.</p>')+(e.list.length?e.list.map(x=>sesRow(x,d,true)).join(''):'')+'</section>';
  let tot=0,occ=0,pl=0,ac=0;const rows=DAYS.map((dy,i)=>{const x=ensure(i),a=x.P.a;tot+=a.total;occ+=a.occ;x.list.forEach(s=>{pl+=s.plan;ac+=actual(s.id)});const p=cfg().pairs[dy[0]];
    return `<section class="card db"><p class="sm"><b>${dy[1].toUpperCase()}: ${hrs(a.total)} AVAILABLE FOR STUDY.</b></p><p class="xs mut">Occupied by other activities: ${dur(a.occ)} · Free periods: ${a.free.map(f=>tm(f[0])+'–'+tm(f[1])).join(', ')||'none'}</p><div class="row2" style="margin-top:6px">${[0,1].map(j=>`<select class="rf" data-ac="pr" data-k="${dy[0]}" data-j="${j}"><option value="">${j?'Second':'First'} course</option>${cur().map(c=>`<option value="${c.id}"${x.P.pr[j]===c.id?' selected':''}>${E(c.code)}</option>`).join('')}</select>`).join('')}</div>${x.P.pr.length&&x.P.T?`<p class="xs" style="margin-top:6px">${x.P.pr.map(id=>E(cn(id))+' '+dur(x.P.T)).join(' · ')}</p>`:''}${wkv?x.list.map(s=>sesRow(s,dayDate(i),false)).join(''):''}</section>`});
  h+=`<section class="card db"><p class="lab">This week</p><p class="sm">Total available: <b>${dur(tot)}</b> · Occupied: ${dur(occ)} · Planned: ${dur(pl)} · Actual: ${dur(ac)}</p><div class="row2" style="margin-top:8px;flex-wrap:wrap"><label class="xs">Break (min) <select data-ac="brk">${[0,5,10,15].map(v=>`<option${v===c.brk?' selected':''}>${v}</option>`).join('')}</select></label><label class="xs">Longest study stretch (min) <select data-ac="run">${[45,60,90,120].map(v=>`<option${v===c.run?' selected':''}>${v}</option>`).join('')}</select></label><button class="btn sm" data-ac="wv">${wkv?'Hide':'Show'} sessions</button></div><p class="xs mut">Breaks are separate and not counted as study time. Changing your plan recalculates planned sessions; started, finished and moved sessions are kept.</p></section>`+rows.join('');
  return h+`<details class="card db" id="rd-det"${ttOpen||(window.rdOpen&&rdOpen())?' open':''}><summary class="sm"><b>Reading schedule and hours (classic)</b></summary><div id="rd-slot"></div></details>`}
function asgPage(){const t=dk(new Date()),L=asg().sort((a,b)=>a.due<b.due?-1:1);return `${nav()}<section class="card db"><p class="lab">Assignments and deadlines</p>${L.length?L.map(x=>`<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm"${x.done?' style="text-decoration:line-through"':''}><b>${E(cn(x.cid))}</b> ${E(x.title)}</p><p class="xs mut">Due ${E(x.due)}${!x.done&&x.due<t?' · <b>overdue</b>':''}</p><div class="row2" style="margin-top:6px"><button class="btn sm" data-ac="adone" data-id="${x.id}">${x.done?'Reopen':'Mark done'}</button><button class="btn sm" data-ac="adel" data-id="${x.id}">Delete</button></div></div>`).join(''):'<p class="sm mut">No assignments yet.</p>'}<div class="row2" style="margin-top:8px"><select class="rf" id="ap-c">${cur().map(c=>`<option value="${c.id}">${E(c.code)}</option>`).join('')}</select><input class="rf" id="ap-t" placeholder="Title"><input class="rf" id="ap-d" type="date" value="${t}"></div><button class="btn sm" style="margin-top:6px" data-ac="aadd">+ Add</button></section><section class="card db"><p class="lab">Exams</p>${cur().flatMap(c=>(c.exams||[]).map(x=>[x.date||'',c.code,x.name||x.t||'Exam'])).sort().map(x=>`<p class="sm" style="margin-top:4px"><b>${E(x[1])}</b> ${E(x[2])} <span class="xs mut">${E(x[0])}</span></p>`).join('')||'<p class="sm mut">No exams recorded. Add them in Classic tools.</p>'}</section>`}
function progress(){const D=lsGet(DK,{}),wk=[0,1,2,3,4,5,6].map(dayDate);let h=nav();
  h+=cur().map(c=>{const n=c.topics.length,r=c.topics.filter(t=>t.s>=2).length,ip=c.topics.filter(t=>t.s===1).length;let pl=0,ac=0,dn=0,ms=0;wk.forEach(d=>((D[d]||{}).list||[]).forEach(x=>{if(x.cid===c.id){pl+=x.plan;ac+=actual(x.id);if(x.st==='done')dn++;if(x.st==='missed')ms++}}));
    return `<section class="card db"><p class="sm"><b>${E(c.code)}</b> ${E(c.name||'')}</p><p class="xs mut">${n?r+' of '+n+' topics revised ('+Math.round(100*r/n)+'%), '+ip+' in progress':'No topics yet'}</p><p class="xs mut">This week: planned ${dur(pl)} · actual ${dur(ac)} · ${dn} completed, ${ms} missed</p></section>`}).join('');
  const days=wk.filter(d=>((D[d]||{}).list||[]).some(x=>x.st==='done'||actual(x.id)>0)).length;
  return h+`<section class="card db"><p class="lab">Weekly consistency</p><p class="sm"><b>${days} of 7</b> days with recorded study this week</p></section>`}
window.studyHist=cid=>{const D=lsGet(DK,{}),ids={};Object.values(D).forEach(v=>(v.list||[]).forEach(x=>{if(x.cid===cid)ids['study|'+x.id]=1}));const rd={};(lsGet('wt-reading',{items:[]}).items||[]).forEach(i=>{if(i.cid===cid)rd[i.id]=1});
  const L=sessions.filter(s=>s.link&&(ids[s.link]||(s.link.startsWith('reading|')&&rd[s.link.split('|')[1]]))).slice(-8).reverse();
  return `<section class="card db"><p class="lab">Study history</p>`+(L.length?L.map(s=>`<p class="sm" style="margin-top:4px">${new Date(s.d).toLocaleDateString()} · ${s.min} min measured${s.unc?' (unverified)':''}</p>`).join(''):'<p class="sm mut">No timed study sessions for this course yet.</p>')+'</section>'};
const o=window.render;
window.render=function(){o();try{if(view!=='acad'||ocn>=0)return;const app=document.getElementById('app');if(!app)return;
  if(at==='classic'){if(!document.getElementById('ac-nav'))app.insertAdjacentHTML('afterbegin','<div id="ac-nav">'+nav()+'</div>');return}
  const rd=document.getElementById('rd-card'),rm=document.getElementById('rm-card');
  const html=at==='tt'?timetable():at==='asg'?asgPage():at==='prog'?progress():overview();
  app.innerHTML=html;if(at==='tt'){const s=document.getElementById('rd-slot');if(s){if(rm)s.appendChild(rm);if(rd)s.appendChild(rd)}}
  }catch(e){console.warn(e)}};
document.addEventListener('click',async e=>{const b=e.target.closest('[data-ac]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.ac,id=b.dataset.id;
  if(a==='pg'){at=b.dataset.k;ocn=-1;render();window.scrollTo(0,0);return}
  if(a==='wv'){wkv=!wkv;render();return}
  const find=()=>{const D=lsGet(DK,{});for(const d in D){const x=(D[d].list||[]).find(r=>r.id===id);if(x)return[D,d,x]}return[]};
  if(a==='start'){const[,,x]=find();if(!x)return;if(fs){toast('A focus session is already running');return}const rem=Math.max(5,x.plan-actual(x.id)),ms=rem*60000;fdone=null;fs={dur:ms,left:ms,endAt:Date.now()+ms,topic:'Study: '+cn(x.cid),link:'study|'+id,brk:cfg().brk,mode:'focus',act:'acad'};lsSet('wt-focus',fs);goView('focus');return}
  if(a==='pause'){if(fs&&fs.link==='study|'+id){const t=document.createElement('button');t.dataset.a='fpa';document.body.appendChild(t);t.click();t.remove()}else toast('Start this session first');return}
  if(a==='done'||a==='miss'){const[D,,x]=find();if(!x)return;if(a==='done'&&fs&&fs.link==='study|'+id)logSession(true);x.st=a==='done'?'done':'missed';lsSet(DK,D);render();return}
  if(a==='rs'){const[D,d,x]=find();if(!x)return;const v=prompt('New start time for '+cn(x.cid)+' (HH:MM). The length stays '+dur(x.plan)+':',tm(x.s));if(!v)return;const m=/^(\d{1,2}):(\d{2})$/.exec(v.trim());if(!m){toast('Use HH:MM');return}const ns=+m[1]*60+ +m[2],ne=ns+x.plan;
    if(D[d].list.some(r=>r.id!==id&&ns<r.e&&r.s<ne)){toast('That overlaps another session');return}x.s=ns;x.e=ne;x.moved=true;lsSet(DK,D);render();return}
  if(a==='aadd'){const t=document.getElementById('ap-t').value.trim(),d=document.getElementById('ap-d').value,c=document.getElementById('ap-c').value;if(!t||!d||!c){toast('Add a course, title and date');return}const A=asg();A.push({id:'a'+Date.now(),cid:c,title:t,due:d,done:false});lsSet(AK,A);render();return}
  if(a==='adone'){const A=asg(),x=A.find(r=>r.id===id);if(x){x.done=!x.done;lsSet(AK,A);render()}return}
  if(a==='adel'){if(!confirm('Delete this assignment?'))return;lsSet(AK,asg().filter(r=>r.id!==id));render()}});
document.addEventListener('change',e=>{const t=e.target,a=t.dataset&&t.dataset.ac;if(!a)return;const c=cfg();
  if(a==='pr'){const k=t.dataset.k,j=+t.dataset.j,cur2=pair(k).slice();while(cur2.length<2)cur2.push('');cur2[j]=t.value;c.pairs[k]=[...new Set(cur2.filter(Boolean))].slice(0,2);lsSet(TK,c);render()}
  else if(a==='brk'){c.brk=+t.value;lsSet(TK,c);render()}else if(a==='run'){c.run=+t.value;lsSet(TK,c);render()}});
document.addEventListener('toggle',e=>{if(e.target.id==='rd-det')ttOpen=e.target.open},true);
window.acadTT={avail,plan,pair,ensure,cfg};window.acadGo=k=>{at=k};
})();
    
