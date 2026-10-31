/* Personal knowledge library: one searchable place for your notes, reflections and saved AI explanations. Categories stay separate and the AI sees only what you allow. */
(function(){
const CATS={acad:'Academic',bible:'Bible study',quiet:'Quiet time',prayer:'Prayer',journal:'Journal',ideas:'Ideas and goals',ai:'Saved AI'};
const DEFCTL={acad:1,bible:0,quiet:0,prayer:0,journal:0,ideas:1,ai:1},KB='wt-kb',KC='wt-kbctl';
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const kb=()=>lsGet(KB,[]),ctl=()=>Object.assign({},DEFCTL,lsGet(KC,{}));
const SVC=[['lect','acad','Lecture notes',['key','unc']],['slog','acad','Study log',['got','unc']],['pray','prayer','Prayer journal',['detail']],['mem','bible','Verse memory',['tr','text']],['goal','ideas','Skills and goals',['ms','ev']]];
function all(){const out=kb().map(x=>({id:x.id,cat:x.cat,title:x.title,body:x.body,src:x.src||'mine',from:x.from||'',ts:x.ts,ed:1,cid:x.cid}));
  SVC.forEach(([k,cat,lab,fs])=>{try{lsGet('wt-'+(k==='lect'?'lect':k==='slog'?'slog':k==='pray'?'pray':k==='mem'?'mem':'goal'),[]).forEach(x=>{const v=x.v||{};const t=v.title||'';if(t)out.push({cat,title:t,body:fs.map(f=>v[f]||'').filter(Boolean).join('\n'),src:'mine',from:lab,ts:x.ts||0})})}catch(e){void e}});
  try{const s=lsGet('wt-plans',null);if(s)s.plans.forEach(p=>{const R=p.days||[],g=s.prog[p.id]||{};Object.keys(g).forEach(n=>{const x=g[n],ref=(R[n-1]||'')||('Day '+n),lab=p.title+', Day '+n;
    const q=[x.learned&&'What I learned: '+x.learned,x.questions&&'Questions: '+x.questions,x.applied&&'How I will apply it: '+x.applied].filter(Boolean).join('\n');if(q)out.push({cat:'quiet',title:ref,body:q,src:'mine',from:lab,ts:0});
    if(x.prayer)out.push({cat:'prayer',title:ref+' (prayer points)',body:x.prayer,src:'mine',from:lab,ts:0})})})}catch(e){void e}
  return out}
window.kbAdd=o=>{const a=kb();a.unshift(Object.assign({id:'k'+Date.now(),ts:Date.now(),src:'mine'},o));lsSet(KB,a)};
window.kbFind=(q,as)=>{const c=ctl(),W=String(q||'').toLowerCase().match(/[a-z0-9]{4,}/g)||[];if(!W.length)return '';
  const ok=as==='academic'?['acad','ideas','ai']:as==='bible'||as==='quiet'?['bible','quiet','prayer','ai']:as==='productivity'?['ideas']:Object.keys(CATS);
  const sc=all().filter(x=>c[x.cat]&&ok.includes(x.cat)).map(x=>{const h=(x.title+' '+x.body).toLowerCase();return[W.filter(w=>h.includes(w)).length,x]}).filter(a=>a[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,3);
  return sc.map(([n,x])=>'['+CATS[x.cat]+(x.src==='ai'?', AI-generated':', user\u2019s own note')+'] '+x.title+': '+x.body.slice(0,300)).join('\n')};
let f=null,cat='',q='';
const list=()=>{const k=q.trim().toLowerCase();return all().filter(x=>(!cat||x.cat===cat)&&(!k||(x.title+' '+x.body+' '+x.from).toLowerCase().includes(k))).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,80).map(x=>`<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm"><b>${E(x.title)}</b></p><p class="xs mut">${E(CATS[x.cat])} · ${x.src==='ai'?'<b>AI-generated, not your words</b>':'Your note'}${x.from?' · from '+E(x.from):''}</p>${x.body?`<details><summary class="xs">Read</summary><p class="sm" style="white-space:pre-wrap">${E(x.body)}</p></details>`:''}${x.ed?`<div class="row2" style="margin-top:6px"><button class="btn sm" data-kb="edit" data-id="${x.id}">Edit</button><button class="btn sm" data-kb="del" data-id="${x.id}">Delete</button></div>`:''}</div>`).join('')||'<p class="sm mut">Nothing saved here yet.</p>'};
function form(){const x=f.id?kb().find(a=>a.id===f.id):{cat:cat&&cat!=='ai'?cat:'acad',title:'',body:'',cid:''};
  return `<section class="card db"><p class="lab">${f.id?'Edit note':'New note'}</p><p class="xs mut">Category</p><select class="rf" id="kb-c">${Object.keys(CATS).filter(k=>k!=='ai').map(k=>`<option value="${k}"${k===x.cat?' selected':''}>${CATS[k]}</option>`).join('')}</select><p class="xs mut">Title</p><input class="rf" id="kb-t" value="${E(x.title)}"><p class="xs mut">Note</p><textarea class="rf" id="kb-b" rows="5">${E(x.body)}</textarea><div class="row2" style="margin-top:8px"><button class="btn sm" data-kb="save">Save</button><button class="btn sm" data-kb="cancel">Cancel</button></div></section>`}
function page(){const c=ctl(),n=all().length;
  return `<section class="card db"><div class="hd"><b>Knowledge library</b><span class="pill">${n} saved</span></div><p class="why">Your notes, reflections and saved AI explanations in one place, kept in separate categories. Your own words are always marked apart from AI text.</p><input class="rf" id="kb-q" type="search" placeholder="Search everything you saved" value="${E(q)}" style="margin-top:8px"><div class="ai-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"><button class="btn sm" data-kb="cat" data-k=""${cat===''?' style="background:var(--ok);color:#fff"':''}>All</button>${Object.keys(CATS).map(k=>`<button class="btn sm" data-kb="cat" data-k="${k}"${cat===k?' style="background:var(--ok);color:#fff"':''}>${CATS[k]}</button>`).join('')}</div><div class="row2" style="margin-top:8px"><button class="btn sm" data-kb="new">+ New note</button></div></section>`
  +(f?form():'')
  +`<section class="card db"><details><summary class="sm"><b>What the AI can use when I ask it</b></summary><p class="xs mut">Off means the AI never sees that category. Private categories start off.</p>${Object.keys(CATS).map(k=>`<label class="sm" style="display:block;margin-top:4px"><input type="checkbox" data-kb="ctl" data-k="${k}"${c[k]?' checked':''}> ${CATS[k]}</label>`).join('')}</details></section><section class="card db" id="kb-list">${list()}</section>`}
const o=window.render;
window.render=function(){if(view==='kb'){SUB.kb='Knowledge library';$('#title').textContent='Knowledge library';$('#date').textContent='Everything you saved';$('#hBack').hidden=false;const a=$('.fab'),b2=$('.fab2');if(a)a.hidden=true;if(b2)b2.hidden=true;document.querySelectorAll('nav.tabs button').forEach(b=>b.dataset.v==='more'?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));$('#app').innerHTML=page();return}
  o();try{if(view==='more'&&!document.getElementById('kb-link'))$('#app').insertAdjacentHTML('afterbegin','<section class="card" id="kb-link"><button class="btn p" style="width:100%" data-a="go" data-v="kb">Knowledge library</button><p class="xs mut" style="margin-top:6px">Notes, reflections and saved AI explanations, searchable.</p></section>')}catch(e){void e}};
document.addEventListener('input',e=>{if(e.target.id==='kb-q'){q=e.target.value;const l=document.getElementById('kb-list');if(l)l.innerHTML=list()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-kb]');if(!b)return;const a=b.dataset.kb,id=b.dataset.id;
  if(a==='cat'){cat=b.dataset.k}else if(a==='new'){f={id:null}}else if(a==='edit'){f={id}}else if(a==='cancel'){f=null}
  else if(a==='ctl'){const c=ctl();c[b.dataset.k]=b.checked?1:0;lsSet(KC,c);return}
  else if(a==='del'){if(!confirm('Delete this note? This cannot be undone.'))return;lsSet(KB,kb().filter(x=>x.id!==id))}
  else if(a==='save'){const t=document.getElementById('kb-t').value.trim(),bd=document.getElementById('kb-b').value.trim(),c=document.getElementById('kb-c').value;if(!t&&!bd){toast('Add a title or a note');return}
    if(f.id){const A=kb(),x=A.find(r=>r.id===f.id);Object.assign(x,{cat:c,title:t||bd.slice(0,50),body:bd});lsSet(KB,A)}else kbAdd({cat:c,title:t||bd.slice(0,50),body:bd});f=null}
  render()});
})();
  
