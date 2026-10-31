/* Central AI: one conversation, six specialised assistants, context from the section you are in. Only runs when you tap Send. */
(function(){
const AS={general:'General',academic:'Academic',bible:'Bible study',quiet:'Quiet time',productivity:'Planner',reflection:'Progress'};
const DEF={acad:'academic',faith:'bible',plan:'productivity',ins:'reflection'};
const SEC={today:'Today',plan:'Planner',focus:'Focus',acad:'Academics',faith:'Faith and growth',ins:'Insights',more:'More',set:'Settings'};
const QA={today:['What should I do next?','Plan the rest of my day','Prioritize my inbox'],plan:['Is my day overloaded?','What could I move or shorten?'],goal:['Break my goal into steps','Which goal needs attention?'],acad:['What should I study next?','Which course needs more attention?'],faith:['Help me catch up on my plan'],ins:['Summarize my week'],focus:['Help me set a goal for this session'],def:['What should I focus on today?']};
const CK='wt-aichat',PK='wt-aictl';
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
let open=false,asst=null,busy=false;
const ctl=()=>Object.assign({plan:1,read:1,bible:1,courses:1,tasks:1,len:'normal'},lsGet(PK,{}));
const chat=()=>lsGet(CK,[]);
function context(a,qq){const c=ctl(),t=dk(new Date()),L=[];
  L.push('Preferred answer length: '+({short:'short, under about 120 words',normal:'normal',detailed:'detailed with examples'})[c.len||'normal']);
  L.push('Now: '+new Date().toLocaleString()+'. Section: '+(SEC[view]||view));
  try{if(c.plan){const bl=blocks(DAYS[todayIdx][0]).slice(0,16);L.push('Today\u2019s plan: '+bl.map(b=>fmt(b.s)+' '+b.l+' ('+((st.c&&st.c[b.id])||'no outcome')+')').join('; '))}}catch(e){void e}
  try{if(c.read){const r=lsGet('wt-reading',{items:[],log:{}}),w=(new Date().getDay()+6)%7,it=(r.items||[]).filter(x=>!x.paused&&x.days.includes(w)&&x.start<=t&&(!x.end||t<=x.end));
    if(it.length)L.push('Academic reading today: '+it.map(x=>x.mat+' ('+((r.log[x.id+'|'+t]||{}).st||'scheduled')+')').join('; '))}}catch(e){void e}
  try{if(c.bible&&(a==='bible'||a==='quiet'||a==='general'||a==='reflection')){const s=lsGet('wt-plans',null);if(s){const p=s.plans.find(x=>x.id===s.cur)||s.plans[0],g=s.prog[p.id]||{},R=p.days||[];let n=1;while(g[n]&&g[n].done)n++;const dn=Object.keys(g).filter(k=>g[k].done).length;L.push('Bible plan "'+p.title+'": '+dn+' days done; next up Day '+n+(R[n-1]?' ('+R[n-1]+')':''))}
    L.push('Quiet time today: '+(((lsGet('wt-daybook',{}).qt||{})[t])?'done':'not recorded'))}}catch(e){void e}
  try{if(c.courses&&(a==='academic'||a==='general'||a==='productivity'))L.push('Courses: '+courses.map(x=>x.code+' '+x.name).join('; '))}catch(e){void e}
  try{if(view==='acad'&&ocn>=0&&courses[ocn]){const k=courses[ocn];L.push('Current course: '+k.code+' '+k.name+'. Topics: '+k.topics.map(t=>t.n||t.name||t.t||'').filter(Boolean).slice(0,30).join(', '));const f=(window.LIBMETA||[]).filter(x=>x.cid===k.id).map(x=>x.name+(x.label?' ('+x.label+')':'')).slice(0,20);if(f.length)L.push('Materials in its library (titles only, contents are not available): '+f.join('; '))}}catch(e){void e}
  try{if(c.tasks&&['productivity','general','reflection'].includes(a)){const t3=blocks(DAYS[todayIdx][0]).filter(b=>st.s&&st.s[b.id]).map(b=>b.l);if(t3.length)L.push('Top priorities today: '+t3.join('; '));
    const ib=lsGet('wt-inbox',[]).slice(0,8).map(x=>String(x.x||'').slice(0,80));if(ib.length)L.push('Inbox items: '+ib.join(' | '));
    const gl=lsGet('wt-goal',[]).map(x=>x.v||{}).filter(v=>v.title&&(v.st||'Active')==='Active').slice(0,6).map(v=>v.title+(v.ms?' (next: '+v.ms+')':''));if(gl.length)L.push('Active goals: '+gl.join('; '))}}catch(e){void e}
  try{const f=window.kbFind?kbFind(qq,a):'';if(f)L.push('Saved notes the AI may use (categories you allowed):\n'+f)}catch(e){void e}
  L.push('Notes from categories you have not allowed are never included.');return L.join('\n')}
function paint(){let el=document.getElementById('ai-sheet');if(!open){if(el)el.remove();return}
  const a=asst||DEF[view]||'general',c=ctl(),m=chat();
  if(!el){el=document.createElement('div');el.id='ai-sheet';document.body.appendChild(el)}
  const keep=(document.getElementById('ai-in')||{}).value||'';
  el.innerHTML=`<div class="ai-top"><b>Ask AI</b> <span class="xs mut">in ${E(SEC[view]||view)}</span><button class="btn sm" data-ai="close" style="margin-left:auto">Close</button></div>
<div class="ai-chips">${Object.keys(AS).map(k=>`<button class="btn sm${k===a?' on':''}" data-ai="as" data-k="${k}"${k===a?' style="background:var(--ok);color:#fff"':''}>${AS[k]}</button>`).join('')}</div>
<div class="ai-chips">${(QA[view]||QA.def).map(q=>`<button class="btn sm" data-ai="qa" data-t="${E(q)}">${E(q)}</button>`).join('')}</div>
<details class="xs"><summary>What the AI can see</summary><label><input type="checkbox" data-ai="ctl" data-k="plan"${c.plan?' checked':''}> Today\u2019s plan</label> <label><input type="checkbox" data-ai="ctl" data-k="read"${c.read?' checked':''}> Reading</label> <label><input type="checkbox" data-ai="ctl" data-k="bible"${c.bible?' checked':''}> Bible plan position</label> <label><input type="checkbox" data-ai="ctl" data-k="courses"${c.courses?' checked':''}> Course names</label> <label><input type="checkbox" data-ai="ctl" data-k="tasks"${c.tasks?' checked':''}> Priorities, inbox and goals</label><p class="xs" style="margin-top:8px">Answer length: <select data-ai="len"><option value="short"${c.len==='short'?' selected':''}>Short</option><option value="normal"${c.len==='normal'?' selected':''}>Normal</option><option value="detailed"${c.len==='detailed'?' selected':''}>Detailed</option></select></p><p class="mut">Notes are sent only from categories you allow in the Knowledge library. The AI answers only when you tap Send.</p></details>
<div class="ai-log" id="ai-log">${m.length?m.map((x,i)=>`<div class="ai-m ${x.r}"><span class="xs mut">${x.r==='user'?'You':'AI · '+E(AS[x.a]||'')}</span><p class="sm" style="white-space:pre-wrap">${E(x.c)}</p>${x.r==='ai'&&!/^(AI is off|AI server)/.test(x.c)?`<button class="btn sm" data-ai="save" data-i="${i}">Save to library</button>`:''}</div>`).join(''):'<p class="sm mut">Ask anything about your courses, reading, plan or Bible study. One conversation is shared across all assistants, so you can switch without losing context.</p>'}</div>
<div class="ai-bar"><textarea class="rf" id="ai-in" rows="2" placeholder="Ask the ${E(AS[a])} assistant…">${E(keep)}</textarea><div class="row2"><button class="btn sm" data-ai="send"${busy?' disabled':''}>${busy?'Thinking…':'Send'}</button><button class="btn sm" data-ai="clear">Clear chat</button></div></div>`;
  const lg=document.getElementById('ai-log');if(lg)lg.scrollTop=lg.scrollHeight}
function fab(){if(document.getElementById('ai-fab'))return;const b=document.createElement('button');b.id='ai-fab';b.textContent='✦ Ask AI';b.dataset.ai='open';document.body.appendChild(b)}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-ai]');if(!b)return;const a=b.dataset.ai;
  if(a==='open'){open=true;paint()}else if(a==='close'){open=false;paint()}
  else if(a==='qa'){const i=document.getElementById('ai-in');if(i){i.value=b.dataset.t;i.focus()}}
  else if(a==='as'){asst=b.dataset.k;paint()}
  else if(a==='ctl'){const c=ctl();c[b.dataset.k]=b.checked?1:0;lsSet(PK,c)}
  else if(a==='save'){const m=chat(),i=+b.dataset.i,x=m[i];let u='';for(let j=i-1;j>=0;j--)if(m[j].r==='user'){u=m[j].c;break}if(x&&window.kbAdd){kbAdd({cat:'ai',title:(u||'AI answer').slice(0,80),body:x.c,src:'ai',from:AS[x.a]+' assistant'});toast('Saved to the knowledge library')}}
  else if(a==='clear'){if(confirm('Clear this conversation?')){lsSet(CK,[]);paint()}}
  else if(a==='send'&&!busy){const i=document.getElementById('ai-in'),q=(i.value||'').trim();if(!q)return;const A=lsGet('wt-ai',{}),k=asst||DEF[view]||'general',m=chat();
    if(!A.on||!/^https:\/\//.test(A.url||'')){m.push({r:'ai',a:k,c:'AI is off. Turn on Use AI features and add your server address in Settings.'});lsSet(CK,m);return paint()}
    m.push({r:'user',a:k,c:q});lsSet(CK,m.slice(-40));i.value='';busy=true;paint();
    try{const h=chat().slice(-8).map(x=>({role:x.r==='user'?'user':'assistant',content:x.c})),r=await fetch(A.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'central',assistant:k,context:context(k,q),messages:h})}),j=await r.json().catch(()=>({}));
      const mm=chat();mm.push({r:'ai',a:k,c:r.ok&&j.text?j.text:'AI server problem: '+(j.error||('HTTP '+r.status))});lsSet(CK,mm.slice(-40))}
    catch(x){const mm=chat();mm.push({r:'ai',a:k,c:'AI server problem: '+String((x&&x.message)||x).slice(0,120)});lsSet(CK,mm.slice(-40))}
    busy=false;paint()}});
const st0=document.createElement('style');st0.textContent='#ai-fab{position:fixed;left:14px;bottom:96px;z-index:40;border:0;border-radius:22px;padding:10px 14px;background:var(--ok,#1F5A3F);color:#fff;font-weight:700;box-shadow:0 6px 16px rgba(0,0,0,.2)}#ai-sheet{position:fixed;inset:0;z-index:90;background:var(--bg,#fff);display:flex;flex-direction:column;padding:12px;padding-top:max(12px,env(safe-area-inset-top));gap:8px}.ai-top{display:flex;align-items:center;gap:8px}.ai-chips{display:flex;flex-wrap:wrap;gap:6px}.ai-log{flex:1;overflow:auto;display:flex;flex-direction:column;gap:8px}.ai-m{padding:8px 10px;border-radius:12px;background:var(--sf,#f3f3f3)}.ai-m.user{align-self:flex-end;max-width:90%}.ai-bar{padding-bottom:max(8px,env(safe-area-inset-bottom))}';document.head.appendChild(st0);
window.aiPrefill=(a,t)=>{asst=a;open=true;paint();const i=document.getElementById('ai-in');if(i){i.value=t;i.focus()}};
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.ai==='len'){const c=ctl();c.len=t.value;lsSet(PK,c)}});
fab();
})();
                                                                                                                                          
