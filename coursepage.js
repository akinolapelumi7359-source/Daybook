/* Course page: tap a course to see everything for it (materials, reading, topics, AI) on one screen. */
(function(){
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'),DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const o=window.render;
window.render=function(){o();try{if(view==='acad'&&ocn>=0&&courses[ocn])page()}catch(e){void e}};
function page(){const c=courses[ocn],app=document.getElementById('app');if(!app)return;
  const its=(lsGet('wt-reading',{items:[]}).items||[]).filter(x=>x.cid===c.id);
  app.innerHTML=`<button class="btn sm" data-cp="back">‹ All courses</button>
<section class="card" style="margin-top:10px"><p class="lab">${E(c.code)}</p><h2 style="margin:2px 0 4px">${E(c.name||c.code)}</h2><p class="xs mut">${E([c.lecturer,c.semester].filter(Boolean).join(' · '))}</p><div class="row2" style="margin-top:8px"><button class="btn sm" data-ai="open">✦ Ask AI about this course</button></div></section>`
  +(typeof libCard==='function'?libCard(c.id):'')
  +`<section class="card db"><div class="hd"><b>Academic reading</b><span class="pill">${its.length} scheduled</span></div>`+(its.length?its.map(x=>`<div style="border-top:1px solid var(--ln);padding:8px 0"><p class="sm"><b>${E(x.mat)}</b>${x.paused?' (paused)':''}</p><p class="xs mut">${x.days.map(i=>DN[i]).join(', ')} · ${E(x.time)} · ${x.mins} min</p>${x.lib?`<button class="btn sm" data-rd="open" data-id="${x.id}" style="margin-top:6px">Open material</button>`:''}</div>`).join(''):'<p class="sm mut">No reading scheduled for this course yet.</p>')+`<div class="row2" style="margin-top:8px"><button class="btn sm" data-cp="rd">+ Schedule reading for this course</button></div></section>
<section class="card" style="padding:0"><p class="lab" style="padding:12px 14px 0;margin:0">Topics, exams and details</p>${courseBody(c,ocn)}</section>`;
  const t=document.getElementById('title');if(t)t.textContent=c.code}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cp]');if(!b)return;
  if(b.dataset.cp==='back'){ocn=-1;render();window.scrollTo(0,0)}
  else if(b.dataset.cp==='rd'&&window.rdNew){rdNew(courses[ocn].id);window.scrollTo(0,0)}});
})();

