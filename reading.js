/* Academic Reading Timetable: academic reading only. Focus time and completion are separate records; only you mark a reading complete. */
(function(){
const RK='wt-reading',DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],TT={time:'minutes',pages:'pages',chapters:'chapters',sections:'sections',topics:'topics',goal:'learning goal'};
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const R=()=>{const r=lsGet(RK,null)||{};r.items=r.items||[];r.log=r.log||{};return r},sv=r=>lsSet(RK,r);
const wi=d=>(d.getDay()+6)%7,dayDate=i=>{const t=new Date();t.setDate(t.getDate()-wi(t)+i);return dk(t)};
let F=null,AIo='';
const cname=id=>{const c=(typeof courses!=='undefined'?courses:[]).find(x=>x.id===id);return c?c.code+' '+c.name:'Course removed'};
const active=(it,d)=>{if(it.paused)return false;const w=wi(new Date(d+'T12:00:00'));return it.days.includes(w)&&d>=it.start&&(!it.end||d<=it.end)};
const mins=(id,d)=>lsGet('wt-sessions',[]).filter(s=>s.link&&s.link.startsWith('reading|'+id+'|'+d)).reduce((a,s)=>a+(s.min||0),0);
const stOf=(it,d)=>{const l=R().log[it.id+'|'+d]||{},m=mins(it.id,d),t=dk(new Date());
  if(l.st)return l.st;if(m>0)return 'ongoing';return d>=t?'scheduled':'not recorded'};
const tgt=it=>it.ta?it.ta+' '+TT[it.tt]:'';
const row=(it,d,full)=>{const st=stOf(it,d),m=mins(it.id,d),l=R().log[it.id+'|'+d]||{};
  return `<div class="blk" style="padding:10px 0;border-top:1px solid var(--ln)"><p class="sm"><b>${E(it.mat)}</b> · ${E(cname(it.cid))}</p><p class="xs mut">${full?DN[wi(new Date(d+'T12:00:00'))]+' · ':''}${E(it.time)} · ${it.mins} min${tgt(it)?' · target '+E(tgt(it)):''} · <b>${st}</b>${m?' · '+m+' min focused':''}${l.prog?' · progress: '+E(l.prog):''}</p>
<div class="row2" style="margin-top:6px"><button class="btn sm" data-rd="focus" data-id="${it.id}" data-d="${d}">Start focus</button>${it.lib?`<button class="btn sm" data-rd="open" data-id="${it.id}">Open material</button>`:''}<button class="btn sm" data-rd="done" data-id="${it.id}" data-d="${d}">I finished it</button><button class="btn sm" data-rd="part" data-id="${it.id}" data-d="${d}">Partly</button><button class="btn sm" data-rd="miss" data-id="${it.id}" data-d="${d}">Missed</button></div></div>`};
const form=()=>{const it=F.id?R().items.find(x=>x.id===F.id):null,v=it||{cid:F.cid||'',mat:'',days:[],time:'18:00',mins:45,tt:'time',ta:'',start:dk(new Date()),end:''};
  return `<div style="margin-top:10px"><p class="xs mut">Course</p><select class="rf" id="rd-c">${courses.map(c=>`<option value="${c.id}"${c.id===v.cid?' selected':''}>${E(c.code+' '+c.name)}</option>`).join('')}</select>
<p class="xs mut">Pick from this course's library (optional)</p><select class="rf" id="rd-lib"><option value="">Not from the library</option>${typeof libFor==='function'?libFor(v.cid||(courses[0]||{}).id).replace('value="'+(v.lib||'')+'"','value="'+(v.lib||'')+'" selected'):''}</select>
<p class="xs mut">Reading material (textbook, notes, handout, article)</p><input class="rf" id="rd-m" value="${E(v.mat)}" placeholder="e.g. Power Systems textbook, Chapter 3">
<p class="xs mut">Days</p><div class="row2" style="flex-wrap:wrap">${DN.map((n,i)=>`<label class="sm"><input type="checkbox" class="rd-d" value="${i}"${v.days.includes(i)?' checked':''}> ${n}</label>`).join('')}</div>
<p class="xs mut">Start time and length (minutes)</p><div class="row2"><input class="rf" id="rd-t" type="time" value="${v.time}"><input class="rf" id="rd-l" type="number" min="5" value="${v.mins}"></div>
<p class="xs mut">Target</p><div class="row2"><select class="rf" id="rd-tt">${Object.keys(TT).map(k=>`<option value="${k}"${k===v.tt?' selected':''}>${TT[k]}</option>`).join('')}</select><input class="rf" id="rd-ta" value="${E(v.ta)}" placeholder="amount or goal"></div>
<p class="xs mut">Start date and end date (optional)</p><div class="row2"><input class="rf" id="rd-s" type="date" value="${v.start}"><input class="rf" id="rd-e" type="date" value="${v.end||''}"></div>
<div class="row2" style="margin-top:8px"><button class="btn sm" data-rd="save">Save</button><button class="btn sm" data-rd="cancel">Cancel</button></div></div>`};
const card=()=>{const r=R(),t=dk(new Date());let h=`<section class="card db" id="rd-card"><div class="hd"><b>Academic reading timetable</b><span class="pill">${r.items.filter(i=>!i.paused).length} active</span></div><p class="why">Academic reading only. Starting a focus timer never marks a reading complete; you decide that.</p>`;
  h+=F?form():`<div class="row2" style="margin-top:8px"><button class="btn sm" data-rd="new">+ Schedule reading</button><button class="btn sm" data-rd="ai">Suggest improvements (AI)</button></div>`;
  h+=`<p class="xs mut" style="margin:12px 0 2px"><b>This week</b></p>`;let any=0;
  for(let i=0;i<7;i++){const d=dayDate(i),L=r.items.filter(x=>active(x,d)).sort((a,b)=>a.time<b.time?-1:1);if(!L.length)continue;any=1;h+=`<p class="sm" style="margin-top:8px"><b>${DN[i]}${d===t?' (today)':''}</b></p>`+L.map(x=>row(x,d)).join('')}
  if(!any)h+='<p class="sm mut">Nothing scheduled this week yet.</p>';
  if(r.items.length)h+=`<details style="margin-top:12px"><summary class="sm"><b>Manage schedules</b></summary>`+r.items.map(x=>`<div style="margin-top:8px;border-top:1px solid var(--ln);padding-top:8px"><p class="sm"><b>${E(x.mat)}</b> · ${E(cname(x.cid))}${x.paused?' (paused)':''}</p><p class="xs mut">${x.days.map(i=>DN[i]).join(', ')} · ${E(x.time)} · ${x.mins} min · from ${x.start}${x.end?' to '+x.end:''}</p><div class="row2" style="margin-top:6px"><button class="btn sm" data-rd="edit" data-id="${x.id}">Edit</button><button class="btn sm" data-rd="pause" data-id="${x.id}">${x.paused?'Resume':'Pause'}</button><button class="btn sm" data-rd="del" data-id="${x.id}">Delete</button></div></div>`).join('')+'</details>';
  if(AIo)h+=`<p class="xs mut" style="margin:12px 0 2px">AI suggestion (nothing has been changed)</p><p class="sm" style="white-space:pre-wrap">${E(AIo)}</p>`;
  return h+'</section>'};
const o=window.render;window.render=function(){o();try{const app=document.getElementById('app');if(!app)return;
  if(view==='acad'&&!document.getElementById('rd-card'))app.insertAdjacentHTML('afterbegin',card());
  if(view==='today'&&sel===todayIdx&&!document.getElementById('rd-today')){const r=R(),t=dk(new Date()),L=r.items.filter(x=>active(x,t)).sort((a,b)=>a.time<b.time?-1:1);
    if(L.length){const h=document.createElement('section');h.className='card';h.id='rd-today';h.innerHTML=`<p class="lab">Today’s academic reading</p>`+L.map(x=>row(x,t)).join('')+`<button class="btn sm" style="margin-top:8px" data-a="go" data-v="acad">Open reading timetable</button>`;
      const hd=[...app.querySelectorAll('h2,h3,.sec')].find(n=>/Today.s plan/.test(n.textContent));if(hd)hd.before(h);else app.appendChild(h)}}}catch(e){void e}};
window.rdNew=c=>{F={id:null,cid:c};ocn=-1;render()};
document.addEventListener('change',e=>{const t=e.target;if(t.id==='rd-c'&&typeof libFor==='function'){const l=document.getElementById('rd-lib');if(l)l.innerHTML='<option value="">Not from the library</option>'+libFor(t.value)}
  else if(t.id==='rd-lib'&&t.value&&typeof LIBMETA!=='undefined'){const f=LIBMETA.find(x=>x.id===t.value),m=document.getElementById('rd-m');if(f&&m&&!m.value.trim())m.value=f.name}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-rd]');if(!b)return;const a=b.dataset.rd,id=b.dataset.id,d=b.dataset.d,r=R();
  if(a==='open'){const x=r.items.find(i=>i.id===id);if(x&&x.lib&&window.libOpen)window.libOpen(x.lib);return}
  if(a==='new'){F={id:null}}else if(a==='cancel'){F=null}else if(a==='edit'){F={id}}
  else if(a==='save'){const days=[...document.querySelectorAll('.rd-d:checked')].map(x=>+x.value),m=document.getElementById('rd-m').value.trim();
    if(!m||!days.length){toast('Add the material and at least one day');return}
    const v={cid:document.getElementById('rd-c').value,mat:m,days,time:document.getElementById('rd-t').value||'18:00',mins:Math.max(5,+document.getElementById('rd-l').value||45),tt:document.getElementById('rd-tt').value,ta:document.getElementById('rd-ta').value.trim(),start:document.getElementById('rd-s').value||dk(new Date()),end:document.getElementById('rd-e').value||'',lib:(document.getElementById('rd-lib')||{}).value||''};
    if(F.id)Object.assign(r.items.find(x=>x.id===F.id),v);else r.items.push(Object.assign({id:'rd'+Date.now(),paused:false},v));sv(r);F=null}
  else if(a==='pause'){const x=r.items.find(i=>i.id===id);x.paused=!x.paused;sv(r)}
  else if(a==='del'){if(!confirm('Delete this reading schedule? Its logged history stays saved.'))return;r.items=r.items.filter(i=>i.id!==id);sv(r)}
  else if(a==='done'||a==='miss'||a==='part'){const k=id+'|'+d;r.log[k]=r.log[k]||{};r.log[k].st=a==='done'?'completed':a==='miss'?'missed':'partially completed';
    if(a==='part'){const p=prompt('How far did you get? (for example: 12 pages, or Section 2.1)',r.log[k].prog||'');if(p===null)return;r.log[k].prog=p.trim()}sv(r)}
  else if(a==='focus'){const x=r.items.find(i=>i.id===id);fdone=null;fs={dur:x.mins*60000,left:x.mins*60000,endAt:Date.now()+x.mins*60000,topic:'Reading: '+x.mat,link:'reading|'+id+'|'+d,brk:0,mode:'focus',act:'Reading'};lsSet('wt-focus',fs);goView('focus');return}
  else if(a==='ai'){const A=lsGet('wt-ai',{});if(!A.on||!/^https:\/\//.test(A.url||'')){AIo='AI is off. Turn on Use AI features in Settings.';return render()}
    const t=new Date(),lines=r.items.map(x=>{let s=0,m=0,p=0,n=0;for(let i=0;i<14;i++){const dd=new Date(t);dd.setDate(t.getDate()-i);const k=dk(dd);if(active(x,k)){n++;const st=(r.log[x.id+'|'+k]||{}).st;if(st==='missed')m++;if(st==='completed')s++;if(st==='partially completed')p++}}return cname(x.cid)+' / '+x.mat+': '+x.days.length+' days a week, '+x.mins+' min, target '+(tgt(x)||'none')+'; last 14 days: '+n+' scheduled, '+s+' completed, '+p+' partial, '+m+' missed'}).join('\n');
    if(!lines){AIo='Schedule some reading first.';return render()}
    AIo='Thinking…';render();
    try{const q=await fetch(A.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'reading-review',prompt:'Here is my academic reading timetable and recent records. Suggest realistic improvements as proposals only, using just these facts:\n'+lines})});const j=await q.json().catch(()=>({}));AIo=q.ok&&j.text?j.text:'AI server problem: '+(j.error||('HTTP '+q.status))}catch(x){AIo='AI server problem: '+String((x&&x.message)||x).slice(0,120)}}
  render()});
})();
  
