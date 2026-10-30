/* Daybook AI layer. Off by default. Needs your own proxy (see ai-worker.js). Never sends prayer journal text. Nothing is saved or changed without your tap. */
(()=>{
const K='wt-ai',L='wt-ai-log';let A=Object.assign({on:false,url:''},lsGet(K,{})),log=lsGet(L,[]),out=null,busy=false,sel={c:0,t:0};
const sv=()=>lsSet(K,A),addLog=(k,s)=>{log.unshift({d:Date.now(),k,s});log=log.slice(0,40);lsSet(L,log)};
const ready=()=>A.on&&/^https:\/\//.test(A.url);
async function ask(kind){
  const c=courses[sel.c];if(!c)return;const t=(c.topics[sel.t]||{}).n||'';
  const p={explain:`Explain "${t}" from the course ${c.code} ${c.name} in plain language for a final-year electrical engineering student. Say clearly if you are unsure.`,quiz:`Write 5 short quiz questions on "${t}" (${c.code} ${c.name}) with answers after a line break. Say clearly if you are unsure.`}[kind];
  busy=true;out=null;acadView();
  try{const r=await fetch(A.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,prompt:p})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));out={kind,c:c.code,t,x:String(j.text||'')};addLog(kind,c.code+' · '+t+' (sent topic name only)')}
  catch(e){out={err:'AI server problem: '+String((e&&e.message)||e).slice(0,160)+'. The tracker still works without it.'}}
  busy=false;acadView()}
function helper(){
  if(!ready())return `<section class="card db"><b class="sm">Study helper (AI)</b><p class="why">Off. Turn it on in Settings and add your server address. Everything else works without it.</p></section>`;
  const c=courses[sel.c]||{topics:[]};
  return `<section class="card db"><div class="hd"><b>Study helper</b><span class="pill">AI · optional</span></div>
  <select data-ai="c" aria-label="Course">${courses.map((x,i)=>`<option value="${i}"${i===sel.c?' selected':''}>${esc(x.code)}</option>`).join('')}</select>
  <select data-ai="t" aria-label="Topic" style="margin-top:6px">${c.topics.map((x,i)=>`<option value="${i}"${i===sel.t?' selected':''}>${esc(x.n.slice(0,60))}</option>`).join('')||'<option>Add a topic first</option>'}</select>
  <div class="row2"><button class="btn sm" data-ai="explain"${busy||!c.topics.length?' disabled':''}>Explain</button><button class="btn sm" data-ai="quiz"${busy||!c.topics.length?' disabled':''}>Quiz me</button></div>
  ${busy?'<p class="why">Thinking…</p>':''}${out&&out.err?`<p class="why">${esc(out.err)}</p>`:''}${out&&out.x?`<div class="card n" style="margin-top:8px"><p class="xs mut">AI-generated. Check it against your lecture notes.</p><p class="sm" style="white-space:pre-wrap">${esc(out.x)}</p><div class="row2"><button class="btn sm p" data-ai="save">Save to study log</button><button class="btn sm" data-ai="drop">Discard</button></div></div>`:''}
  <p class="why">Only the course code, title and topic name are sent. Your notes and prayer journal never are.</p></section>`}
const oa=acadView;acadView=function(){oa();try{const a=document.getElementById('app'),n=document.createElement('div');n.innerHTML=helper();const f=a.querySelector('.note')||a.querySelector('.dbseg');[...n.children].reverse().forEach(x=>f?f.after(x):a.prepend(x))}catch(e){}};
const os=setView;setView=function(){os();try{const a=document.getElementById('app');a.insertAdjacentHTML('afterbegin',`<h2 style="margin-top:0">AI assistant</h2><section class="card db"><label class="inl" style="margin-top:0">Use AI features<span class="sw"><input type="checkbox" data-ai="on"${A.on?' checked':''}><i></i></span></label><input class="rf" data-ai="url" placeholder="https://your-proxy.workers.dev" value="${esc(A.url)}" aria-label="AI server address"><p class="why">Off by default. The tracker works fully without it. AI only suggests; it never edits your plan, exams or notes. Sends topic names to the server you set.</p>${log.length?`<details><summary class="sm">AI activity (${log.length})</summary>${log.slice(0,10).map(x=>`<p class="why">${new Date(x.d).toLocaleString()} · ${esc(x.k)} · ${esc(x.s)}</p>`).join('')}<button class="btn sm d" data-ai="clr">Clear history</button></details>`:''}</section>`)}catch(e){}};
document.addEventListener('click',e=>{const b=e.target.closest('button[data-ai]');if(!b)return;const k=b.dataset.ai;
  if(k==='explain'||k==='quiz')ask(k);else if(k==='drop'){out=null;acadView()}
  else if(k==='save'&&out&&out.x){const a=lsGet('wt-slog',[]);a.unshift({id:Date.now().toString(36),v:{title:out.t,crs:out.c,min:'',got:'[AI '+out.kind+'] '+out.x,unc:''},i:1});lsSet('wt-slog',a);addLog('saved',out.c+' · '+out.t);out=null;try{toast('Saved to Study log')}catch(z){}acadView()}
  else if(k==='clr'){log=[];lsSet(L,log);setView()}});
document.addEventListener('change',e=>{const t=e.target,k=t.dataset&&t.dataset.ai;if(!k)return;
  if(k==='on'){A.on=t.checked;sv()}else if(k==='url'){A.url=t.value.trim();sv()}
  else if(k==='c'){sel={c:+t.value,t:0};acadView()}else if(k==='t'){sel.t=+t.value}});

/* Passage helper: context, terms and study questions only. Never produces Bible text. Sends the reference you type, nothing else. */
let pb={ref:'',out:null,busy:false};
async function pask(kind){
  const r=pb.ref.trim();if(!r)return;pb.busy=true;pb.out=null;faithView();
  const p=kind==='x'?`Suggest related passages and cross-references for ${r}, with one line on why each connects. Do not quote the passages. Say clearly if you are unsure.`:kind==='ctx'?`Give brief historical and literary context, key terms, and cross-reference suggestions for ${r}. Do not quote the passage. If interpretations differ, say so. Say clearly if you are unsure.`:`Write 5 open study questions for ${r}. Do not quote the passage. Say clearly if you are unsure.`;
  try{const x=await fetch(A.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'bible-'+kind,prompt:p})});const j=await x.json().catch(()=>({}));if(!x.ok)throw new Error(j.error||('HTTP '+x.status));pb.out={x:String(j.text||'')};addLog('passage-'+kind,r+' (reference only)')}
  catch(e){pb.out={err:'AI server problem: '+String((e&&e.message)||e).slice(0,160)+'. Your own notes still work.'}}
  pb.busy=false;faithView()}
const of=faithView;faithView=function(){of();try{if(!ready())return;const a=document.getElementById('app'),n=document.createElement('section');n.className='card db';
  n.innerHTML=`<div class="hd"><b>Ask the Spiritual AI</b><span class="pill">optional</span></div><div class="dbask"><input data-ai="pref" placeholder="Passage, e.g. John 3:16-21" value="${esc(pb.ref)}" aria-label="Passage reference"><button class="send" data-ai="pctx" aria-label="Explain passage"${pb.busy?' disabled':''}>➤</button></div><div class="dbgrid"><button class="dbtile3" data-ai="pctx"${pb.busy?' disabled':''}><b>Bible Reference Support</b><small>Context, terms and background</small></button><button class="dbtile3" data-ai="pq"${pb.busy?' disabled':''}><b>Study Questions</b><small>Discussion and reflection questions</small></button><button class="dbtile3" data-ai="px"${pb.busy?' disabled':''}><b>Passage Connections</b><small>Related passages and cross-references</small></button></div>${pb.busy?'<p class="why">Thinking…</p>':''}${pb.out&&pb.out.err?`<p class="why">${esc(pb.out.err)}</p>`:''}${pb.out&&pb.out.x?`<div class="card n" style="margin-top:8px"><p class="xs mut">AI commentary, not Scripture. Read the passage yourself first; interpretations can differ.</p><p class="sm" style="white-space:pre-wrap">${esc(pb.out.x)}</p><button class="btn sm" data-ai="pcopy">Copy</button></div>`:''}<p class="why">Only the reference you type is sent. Your prayers and notes never are.</p>`;
  const tb=a.querySelector('.dbseg');tb?tb.after(n):a.prepend(n)}catch(e){}};
document.addEventListener('click',e=>{const b=e.target.closest('button[data-ai]');if(!b)return;const k=b.dataset.ai;if(k==='pctx')pask('ctx');else if(k==='pq')pask('q');else if(k==='px')pask('x');else if(k==='pcopy'&&pb.out)try{navigator.clipboard.writeText(pb.out.x);toast('Copied')}catch(z){}});
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.ai==='pref')pb.ref=e.target.value});
})();

try{render()}catch(e){}
                                                                                                                                                            
