/* Week Tracker v7 stage 2: personal libraries, spaced review, search, backup hooks */
(()=>{
const S='Status';
const SV={
lib:{t:'Reading library',s:'Books and where you stopped',k:'wt-lib',f:[['title','Title'],['author','Author'],['pos','Where I stopped'],['st',S,'sel',['Want to read','Reading','Paused','Completed']],['note','Notes','area']]},
pray:{t:'Prayer journal',s:'Private by default',k:'wt-pray',priv:1,f:[['title','Prayer point'],['detail','Private detail','area'],['st',S,'sel',['Active','Revisit','Answered']],['rev','Review on','date'],['ref','Linked passage']]},
mem:{t:'Verse memory',s:'Recall, then review',k:'wt-mem',rev:1,f:[['title','Reference'],['tr','Translation'],['text','Verse, in the wording you memorise','area']]},
task:{hide:1,t:'Assignments',s:'Due dates and progress',k:'wt-task',f:[['title','Assignment'],['crs','Course','course'],['due','Due','date'],['st',S,'sel',['Not started','In progress','Submitted']],['sub','Next small step']]},
slog:{t:'Study log',s:'What you studied and what is still unclear',k:'wt-slog',f:[['title','Topic studied'],['crs','Course','course'],['min','Minutes spent'],['got','What I understood','area'],['unc','Still unclear','area']]},
lect:{t:'Lecture notes',s:'Capture after class',k:'wt-lect',f:[['title','Topic'],['crs','Course','course'],['key','Key points','area'],['unc','Still unclear','area']]},
chart:{t:'Chart reviews',s:'Study journal, not a trading tool',k:'wt-chart',filt:1,f:[['title','Market and setup'],['ty','Type','sel',['Live','Simulated','Historical','Hypothetical']],['rule','Followed my rules','sel',['Yes','Partly','No']],['risk','Risk and result'],['les','Lesson to carry forward','area']]},
goal:{t:'Skills and goals',s:'Outcome-based milestones',k:'wt-goal',f:[['title','Skill or goal'],['ms','Next milestone'],['ev','Evidence it is done','area'],['st',S,'sel',['Active','Paused','Done']]]}
};
const ICO={slog:'📖',lib:'📚',pray:'🙏',mem:'🧠',task:'📝',lect:'🎓',chart:'📈',goal:'🎯'};
let flt='All',qs='';
const rd=k=>lsGet(SV[k].k,[]),wr=(k,a)=>lsSet(SV[k].k,a);
const dueMem=()=>rd('mem').filter(x=>!x.n||x.n<=Date.now());
const dueTask=()=>[].filter(x=>x.v.due&&x.v.st!=='Submitted'&&daysLeft(x.v.due)<=3);
function field(f,x){const[k,l,t,o]=f;
  if(t==='sel')return `<select id="ux-f-${k}" aria-label="${l}">${o.map(y=>`<option>${y}</option>`).join('')}</select>`;
  if(t==='course')return `<select id="ux-f-${k}" aria-label="${l}"><option value="">${l}</option>${courses.map(c=>`<option>${esc(c.code)}</option>`).join('')}</select>`;
  if(t==='area')return `<textarea id="ux-f-${k}" placeholder="${l}"></textarea>`;
  return `<input id="ux-f-${k}" ${t==='date'?'type="date" aria-label="'+l+'"':'placeholder="'+l+'"'} style="width:100%;margin-top:8px">`}
function item(k,x){const s=SV[k];
  const rows=s.f.slice(1).map(f=>{const v=x.v[f[0]];
    if(f[2]==='sel')return `<select data-x="sel" data-k="${k}" data-i="${x.id}" data-f="${f[0]}" aria-label="${f[1]}" style="margin:4px 4px 0 0">${f[3].map(y=>`<option${y===v?' selected':''}>${y}</option>`).join('')}</select>`;
    return `<button class="info" data-x="edit" data-k="${k}" data-i="${x.id}" data-f="${f[0]}" style="display:block;width:100%;margin-top:4px"><span class="xs mut">${f[1]}: </span><span class="sm">${v?esc(v):'<i class="mut">Add</i>'}</span></button>`}).join('');
  let rv='';if(s.rev){const d=!x.n||x.n<=Date.now();rv=`<details style="margin-top:8px"><summary class="sm">${d?'Due. Recall it, then reveal':'Next review '+new Date(x.n).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</summary><p class="sm" style="margin:6px 0;white-space:pre-wrap">${esc(x.v.text||'')}</p><div class="chips">${[['Again',0],['Hard',1],['Good',2],['Easy',3]].map(r=>`<button data-x="rate" data-i="${x.id}" data-v="${r[1]}">${r[0]}</button>`).join('')}</div></details>`}
  return `<section class="card ${x.v.st==='Completed'||x.v.st==='Answered'||x.v.st==='Submitted'?'g':'n'}"><div style="display:flex;gap:8px;align-items:flex-start"><b class="big" style="flex:1;font-size:1.02rem">${esc(x.v[s.f[0][0]])}</b><button class="btn sm d" data-x="del" data-k="${k}" data-i="${x.id}" aria-label="Delete">Delete</button></div>${x.v.due?`<span class="chip ${daysLeft(x.v.due)<=3?'w':''}">Due ${esc(x.v.due)}</span>`:''}${rows}${rv}</section>`}
function listHtml(k){const s=SV[k];let a=rd(k);
  const types=s.filt?['All'].concat(SV.chart.f[1][3]):[];
  if(s.filt&&flt!=='All')a=a.filter(x=>x.v.ty===flt);
  const note=s.priv?'<p class="xs mut" style="margin-bottom:8px">Prayer details stay on this device. They are left out of backups unless you include private journal text, and never appear in notifications.</p>':k==='chart'?'<p class="xs mut" style="margin-bottom:8px">Live, simulated, historical and hypothetical entries are filtered separately. This is a journal only. It never places trades and is not advice.</p>':'';
  return note+(types.length?`<div class="chips" style="margin-bottom:10px">${types.map(t=>`<button data-x="flt" data-v="${t}" aria-pressed="${flt===t}">${t}</button>`).join('')}</div>`:'')
  +`<details class="card" ${a.length?'':'open'}><summary class="lab" style="margin:0">Add new</summary>${s.f.map(f=>field(f)).join('')}<button class="btn p" style="margin-top:10px" data-x="add" data-k="${k}">Save</button></details>`
  +(a.length?a.map(x=>item(k,x)).join(''):'<p class="sm mut" style="padding:8px 2px">Nothing here yet. Add the first one above.</p>');}
function search(){const q=qs.trim().toLowerCase(),out=[];if(q){
  Object.keys(SV).filter(k=>!SV[k].hide).forEach(k=>rd(k).forEach(x=>{const f=SV[k].f.filter(f=>!(SV[k].priv&&f[0]==='detail')).map(f=>x.v[f[0]]||'').join(' ');if(f.toLowerCase().includes(q))out.push([SV[k].t,x.v[SV[k].f[0][0]],k])}));
  courses.forEach(c=>c.topics.forEach((t,i)=>{if((c.code+' '+t.n).toLowerCase().includes(q))out.push([c.code,t.n,'acad'])}));
  lsGet('wt-inbox',[]).forEach(x=>{if(x.x.toLowerCase().includes(q))out.push(['Inbox',x.x.slice(0,70),'more'])});
  DAYS.forEach(d=>plan[d[0]].forEach(b=>{if(b.l.toLowerCase().includes(q))out.push([d[1],b.l,'plan'])}))}
  return q?(out.slice(0,40).map(o=>`<button class="mn" data-a="go" data-v="${o[2]}"><span><b>${esc(o[1])}</b><small>${esc(o[0])}</small></span><span class="ar">›</span></button>`).join('')||'<p class="sm mut">No matches.</p>'):'<p class="sm mut">Searches plans, topics, books, notes, study logs, memory cards, prayer titles and your inbox. Prayer details are never searched.</p>'}
const o=window.render;
window.render=function(){
  if(SV[view]||view==='srch'){
    const t=view==='srch'?'Search':SV[view].t;SUB[view]=t;
    document.getElementById('title').textContent=t;document.getElementById('date').textContent=view==='srch'?'Everything you have saved':SV[view].s;
    document.getElementById('hBack').hidden=false;const q=$('.fab');if(q)q.hidden=true;const f2=$('.fab2');if(f2)f2.hidden=true;
    document.querySelectorAll('nav.tabs button').forEach(b=>b.dataset.v==='more'?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
    $('#app').innerHTML=view==='srch'?`<input id="ux-q" type="search" placeholder="Search everything" value="${esc(qs)}" style="width:100%;padding:12px;border-radius:14px;border:1px solid var(--ln);background:var(--sf)"><div id="ux-res" style="margin-top:10px">${search()}</div>`:view==='mem'?`<p class="sm mut" style="margin-bottom:8px">${dueMem().length} due for review. Rate how well you recalled it: Again, Hard, Good or Easy. Cards come back sooner or later based on that, not a daily streak.</p>`+listHtml("mem"):listHtml(view);
    return}
  o();
  try{
    const app=$('#app');
    if(view==='more'){app.insertAdjacentHTML('beforeend','<h2>Library and study tools</h2>'+[['srch','🔎','Search','Find anything you saved']].concat(Object.keys(SV).filter(k=>!SV[k].hide).map(k=>[k,ICO[k],SV[k].t,SV[k].s])).map(x=>`<button class="mn" data-a="go" data-v="${x[0]}"><span><b>${x[2]}</b><small>${x[3]}</small></span><span class="ar">›</span></button>`).join(''))}
    if(view==='today'&&sel===todayIdx){
      let h='';const dm=dueMem().length,dt=dueTask();
      if(dm||dt.length)h+=`<section class="card a" id="ux-due"><p class="lab">Due soon</p>${dt.map(x=>`<p class="sm">${esc(x.v.title)} is due ${esc(x.v.due)}${x.v.sub?'. Next: '+esc(x.v.sub):''}</p>`).join('')}${dm?`<button class="btn sm" style="margin-top:6px" data-a="go" data-v="mem">${dm} verse card${dm===1?'':'s'} ready to review</button>`:''}</section>`;
      const cx=blocks(DAYS[todayIdx][0]).filter(b=>b.g==='Classes'&&st.c[b.id]==='cancelled');
      if(cx.length)h+=`<section class="card" id="ux-free"><p class="lab">A class was cancelled</p><p class="sm">${cx.map(b=>esc(b.l)+' ('+dur(b.e-b.s)+')').join(', ')} is now open time. Nothing has been filled in for you.</p><div class="ux-act"><button class="btn sm" data-a="go" data-v="acad">Use a short slot to revise</button><button class="btn sm" data-a="go" data-v="lib">Read</button></div><p class="xs mut" style="margin-top:6px">Or leave it free. Rest counts.</p></section>`;
      const a=app.querySelector('#ux-smart')||app.querySelector('.hero')||app.querySelector('.days');if(a&&h)a.insertAdjacentHTML('afterend',h)}
  }catch(e){console.warn('stage2',e)}
};
// events
document.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b||b.tagName==='SELECT')return;const x=b.dataset.x,k=b.dataset.k,id=b.dataset.i;
  if(x==='add'){const s=SV[k],v={};s.f.forEach(f=>{const el=document.getElementById('ux-f-'+f[0]);v[f[0]]=el?el.value.trim():''});if(!v[s.f[0][0]]){try{toast('Add a title first')}catch(z){}return}const a=rd(k);a.unshift({id:Date.now().toString(36),v,i:1});wr(k,a);render()}
  else if(x==='del'){if(!confirm('Delete this entry?'))return;wr(k,rd(k).filter(y=>y.id!==id));render()}
  else if(x==='edit'){const a=rd(k),y=a.find(z=>z.id===id),f=b.dataset.f,n=prompt(SV[k].f.find(z=>z[0]===f)[1],y.v[f]||'');if(n!==null){y.v[f]=n.trim();wr(k,a);render()}}
  else if(x==='flt'){flt=b.dataset.v;render()}
  else if(x==='rate'){const a=rd('mem'),y=a.find(z=>z.id===id),r=+b.dataset.v;y.i=r===0?1:Math.max(1,Math.round((y.i||1)*[0,1.3,2.2,3.5][r]));y.n=Date.now()+y.i*864e5;wr('mem',a);render()}});
document.addEventListener('change',e=>{const b=e.target;if(b.dataset.x!=='sel')return;const a=rd(b.dataset.k),y=a.find(z=>z.id===b.dataset.i);y.v[b.dataset.f]=b.value;wr(b.dataset.k,a);render()});
document.addEventListener('input',e=>{if(e.target.id==='ux-q'){qs=e.target.value;$('#ux-res').innerHTML=search()}});
// backups include the new data; private text is left out unless chosen
const mb=window.makeBackup,ab=window.applyBackup;
window.makeBackup=function(j){const d=mb(j);try{const x={ui:lsGet('wt-ui',{}),inbox:lsGet('wt-inbox',[])};Object.keys(SV).forEach(k=>x[k]=rd(k));if(!j){x.pray=x.pray.map(p=>Object.assign({},p,{v:Object.assign({},p.v,{detail:''})}));x.inbox=x.inbox.filter(i=>i.t!=='Prayer point')}d.ux=x}catch(z){}return d};
window.applyBackup=function(d){const r=ab(d);try{if(d&&d.ux){lsSet('wt-ui',d.ux.ui||{});lsSet('wt-inbox',d.ux.inbox||[]);Object.keys(SV).forEach(k=>{if(d.ux[k])wr(k,d.ux[k])})}}catch(z){}return r};
window.render();
})();
