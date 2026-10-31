/* Course library: materials per course, stored on this device (IndexedDB). Files are not part of the JSON backup. */
(function(){
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const db=new Promise((res,rej)=>{try{const q=indexedDB.open('daybook-lib',1);q.onupgradeneeded=()=>{const d=q.result;d.createObjectStore('meta',{keyPath:'id'});d.createObjectStore('blobs',{keyPath:'id'})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}catch(e){rej(e)}});
const tx=(s,m,fn)=>db.then(d=>new Promise((res,rej)=>{const t=d.transaction(s,m),r=fn(t);t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}));
window.LIBMETA=[];let selC=null,q='',msg='';
const load=()=>tx('meta','readonly',t=>t.objectStore('meta').getAll()).then(a=>{window.LIBMETA=a||[]}).catch(()=>{window.LIBMETA=[]});
const sz=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
const cn=id=>{const c=courses.find(x=>x.id===id);return c?c.code+' '+c.name:'Course removed'};
async function openFile(id){try{const r=await tx('blobs','readonly',t=>t.objectStore('blobs').get(id));if(!r)return toast('File not found');const m=LIBMETA.find(x=>x.id===id),u=URL.createObjectURL(r.blob);if(!window.open(u,'_blank')){const a=document.createElement('a');a.href=u;a.download=m?m.name:'file';a.click()}setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e){toast('Could not open the file')}}
window.libOpen=openFile;window.libFor=c=>LIBMETA.filter(x=>x.cid===c).map(x=>`<option value="${x.id}">${E(x.name)}${x.label?' ('+E(x.label)+')':''}</option>`).join('');
async function add(files,cid,label){let n=0;for(const f of files){const m={id:'f'+Date.now()+Math.random().toString(36).slice(2,6),cid,name:f.name,type:f.type||'',size:f.size,label:label||'',added:Date.now()};
  try{await tx(['meta','blobs'],'readwrite',t=>{t.objectStore('meta').put(m);t.objectStore('blobs').put({id:m.id,blob:f})});n++}catch(e){msg='Storage is full or blocked. Remove files you no longer need.';break}}
  await load();if(n)msg=n+' file'+(n===1?'':'s')+' added to '+cn(cid)+'.';render()}
function items(){const k=q.trim().toLowerCase();let L=LIBMETA.filter(x=>x.cid===selC);if(k)L=L.filter(x=>(x.name+' '+x.label).toLowerCase().includes(k));
  return L.sort((a,b)=>b.added-a.added).map(x=>`<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm"><b>${E(x.name)}</b></p><p class="xs mut">${x.label?E(x.label)+' · ':''}${sz(x.size)}</p><div class="row2" style="margin-top:6px"><button class="btn sm" data-lib="open" data-id="${x.id}">Open</button><button class="btn sm" data-lib="lab" data-id="${x.id}">Label</button><button class="btn sm" data-lib="rep" data-id="${x.id}">Replace</button><button class="btn sm" data-lib="del" data-id="${x.id}">Remove</button></div></div>`).join('')||`<p class="sm mut">${k?'No materials match.':'No materials in this course yet.'}</p>`}
window.libCard=function(cid){if(cid!==selC){msg='';q=''}selC=cid;const n=LIBMETA.filter(x=>x.cid===cid).length;
  return `<section class="card db" id="lib-card"><div class="hd"><b>Course materials</b><span class="pill">${n} file${n===1?'':'s'}</span></div><p class="why">Lecture notes, textbooks, handouts and articles for this course only. Files stay on this phone and are not in the backup file, so keep the originals too.</p>
<p class="xs mut" style="margin:8px 0 2px">Topic or chapter for new files (optional)</p><input class="rf" id="lib-l" placeholder="e.g. Chapter 4, Transformers">
<input type="file" id="lib-add" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*" style="margin-top:8px;width:100%">
${msg?`<p class="sm" style="margin-top:6px">${E(msg)}</p>`:''}
<input class="rf" id="lib-q" type="search" placeholder="Search this course’s materials" value="${E(q)}" style="margin-top:10px"><div id="lib-list">${items()}</div></section>`};
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='lib-c'){selC=t.value;q='';render()}
  else if(t.id==='lib-add'&&t.files.length){add([...t.files],selC,(document.getElementById('lib-l')||{}).value.trim());t.value=''}});
document.addEventListener('input',e=>{if(e.target.id==='lib-q'){q=e.target.value;const l=document.getElementById('lib-list');if(l)l.innerHTML=items()}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-lib]');if(!b)return;const a=b.dataset.lib,id=b.dataset.id,m=LIBMETA.find(x=>x.id===id);
  if(a==='open')return openFile(id);
  if(a==='lab'){const v=prompt('Topic or chapter label:',m.label||'');if(v===null)return;m.label=v.trim();await tx('meta','readwrite',t=>t.objectStore('meta').put(m));msg=''}
  else if(a==='del'){if(!confirm('Remove "'+m.name+'" from this course library? This cannot be undone.'))return;await tx(['meta','blobs'],'readwrite',t=>{t.objectStore('meta').delete(id);t.objectStore('blobs').delete(id)});await load();msg='File removed.'}
  else if(a==='rep'){const i=document.createElement('input');i.type='file';i.onchange=async()=>{const f=i.files[0];if(!f)return;try{m.name=f.name;m.type=f.type||'';m.size=f.size;m.added=Date.now();await tx(['meta','blobs'],'readwrite',t=>{t.objectStore('meta').put(m);t.objectStore('blobs').put({id,blob:f})});msg='File replaced.'}catch(x){msg='Could not replace the file.'}render()};i.click();return}
  render()});
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){void e}
load().then(()=>{if(view==='acad'&&ocn>=0)render()});
})();
                     
