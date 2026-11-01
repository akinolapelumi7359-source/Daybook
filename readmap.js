/* Connects the screens: quiet time and reading done anywhere ticks the matching Today block, and reading blocks are assigned to courses so weekly hours per course add up. */
(function(){
const MK='wt-rmap',SK='wt-sync',E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const map=()=>lsGet(MK,{}),dur=m=>Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m';
const mins=b=>{const c=st.c[b.id],mn=(st.mn||{})[b.id];return c==='done'?(mn!=null&&mn!==''?+mn:b.e-b.s):c==='partial'?(+mn||0):0};
const rb=()=>{const o=[];DAYS.forEach((d,i)=>blocks(d[0]).filter(b=>b.g==='Reading'&&st.c[b.id]!=='cancelled').forEach(b=>o.push({b,i})));return o};
window.rmapFor=cid=>{const m=map();let done=0,plan=0;rb().forEach(({b})=>{if(m[b.id]===cid){plan+=b.e-b.s;done+=mins(b)}});return{done,plan}};
window.rmapWeek=()=>courses.map(c=>Object.assign({code:c.code,name:c.name},rmapFor(c.id))).filter(x=>x.plan>0);
window.rmapPreset=o=>{const m={};DAYS.forEach((d,i)=>{const L=o[d[0]]||o[d[1]]||[];if(!L.length)return;blocks(d[0]).filter(b=>b.g==='Reading').forEach((b,j)=>{const id=(L[Math.min(j,L.length-1)]||{}).id||L[Math.min(j,L.length-1)];if(id)m[b.id]=id})});lsSet(MK,m)};
function sync(){try{const t=dk(new Date());let S=lsGet(SK,{});if(S.d!==t)S={d:t,ap:[]};S.ap=S.ap||[];
  const tb=blocks(DAYS[todayIdx][0]),qb=tb.find(b=>/^quiet time$/i.test(b.l));
  if(qb){const bd=st.c[qb.id]==='done',dd=!!((lsGet('wt-daybook',{}).qt||{})[t]);
    if(S.qb===undefined){if(bd&&!dd)dbMark('qt',t,true);else if(dd&&!bd){st.c[qb.id]='done';save()}S.qb=S.qd=bd||dd}
    else if(bd!==S.qb){dbMark('qt',t,bd);S.qb=S.qd=bd}
    else if(dd!==S.qd){if(dd){st.c[qb.id]='done'}else if(st.c[qb.id]==='done'){delete st.c[qb.id]}save();S.qb=S.qd=dd}}
  const r=lsGet('wt-reading',{items:[],log:{}}),m=map();
  (r.items||[]).forEach(it=>{if(S.ap.includes(it.id))return;if(((r.log||{})[it.id+'|'+t]||{}).st!=='completed')return;
    const b=tb.filter(x=>x.g==='Reading'&&m[x.id]===it.cid&&st.c[x.id]!=='done'&&st.c[x.id]!=='cancelled').sort((a,c)=>a.s-c.s)[0];
    if(b){st.c[b.id]='done';save();S.ap.push(it.id)}});
  lsSet(SK,S)}catch(e){void e}}
function card(){const m=map(),W=rmapWeek(),un=rb().filter(x=>!m[x.b.id]).length,opt=id=>courses.map(c=>`<option value="${c.id}"${c.id===id?' selected':''}>${E(c.code)}</option>`).join('');
  let h=`<section class="card db" id="rm-card"><div class="hd"><b>Reading hours by course</b><span class="pill">this week</span></div><p class="why">From your plan's reading blocks that you marked done. Choose which course each block is for.</p>`;
  h+=W.length?W.sort((a,b)=>b.plan-a.plan).map(x=>`<p class="sm" style="margin-top:6px"><b>${E(x.code)}</b> ${E(x.name)}: ${dur(x.done)} done of ${dur(x.plan)} planned</p>`).join(''):'<p class="sm mut">No reading blocks are assigned to a course yet.</p>';
  if(un)h+=`<p class="xs mut" style="margin-top:6px">${un} reading block${un===1?'':'s'} this week have no course yet.</p>`;
  h+=`<details style="margin-top:8px"><summary class="sm"><b>Choose the course for each reading block</b></summary>`+DAYS.map((d,i)=>{const L=blocks(d[0]).filter(b=>b.g==='Reading'&&st.c[b.id]!=='cancelled');return L.length?`<p class="sm" style="margin-top:8px"><b>${d[1]}</b></p>`+L.map(b=>`<div class="row2" style="margin-top:4px;align-items:center"><span class="xs" style="flex:1">${fmt(b.s)}–${fmt(b.e)} ${E(b.l)}</span><select class="rf" data-rm="${b.id}" style="max-width:48%"><option value="">No course</option>${opt(m[b.id])}</select></div>`).join(''):''}).join('')+'</details></section>';
  return h}
const DEF={mon:['ELE 407','ELE 409'],tue:['ELE 405','ELE 401'],wed:['ELE 403','ABE 413'],thu:['ABE 443','ELE 403'],fri:['ELE 409','ELE 407'],sat:['ELE 405','ELE 401'],sun:['ABE 413','ABE 443']};
function init(){if(lsGet('wt-rmap-init',0)||Object.keys(map()).length)return;const m={};
  DAYS.forEach(d=>{const L=DEF[d[0]];if(!L)return;const bl=blocks(d[0]).filter(b=>b.g==='Reading').sort((a,b)=>a.s-b.s);
    bl.forEach((b,j)=>{const code=b.s>=1140?L[1]:L[0],c=courses.find(x=>x.code===code);if(c)m[b.id]=c.id})});
  if(Object.keys(m).length){lsSet(MK,m);lsSet('wt-rmap-init',1)}}
function seed(){if(lsGet('wt-rd-init2',0))return;const r=lsGet('wt-reading',null)||{items:[],log:{}};if((r.items||[]).length){lsSet('wt-rd-init2',1);return}
  const m=map();if(!Object.keys(m).length)return;const t=new Date();t.setHours(12,0,0,0);t.setDate(t.getDate()-((t.getDay()+6)%7));const mon=dk(t),items=[];
  DAYS.forEach((d,i)=>{const g={};blocks(d[0]).filter(b=>b.g==='Reading'&&m[b.id]).sort((a,b)=>a.s-b.s).forEach(b=>{(g[m[b.id]]=g[m[b.id]]||[]).push(b)});
    Object.keys(g).forEach(cid=>{const bl=g[cid],tot=bl.reduce((a,b)=>a+b.e-b.s,0),st0=bl[0].s%1440;items.push({id:'rd'+Date.now()+items.length,cid,mat:'Course reading (last hour: past questions)',days:[i],time:String(Math.floor(st0/60)).padStart(2,'0')+':'+String(st0%60).padStart(2,'0'),mins:tot,tt:'time',ta:'',start:mon,end:'',paused:false,lib:'',seed:1})})});
  if(items.length){r.items=items;r.log=r.log||{};lsSet('wt-reading',r);lsSet('wt-rd-init2',1)}}
const o=window.render;window.render=function(){sync();o();o();try{const app=document.getElementById('app');if(view==='acad'&&ocn<0&&app&&!document.getElementById('rm-card')){const g=app.querySelector('.dbgrid');if(g){const hd=g.previousElementSibling;(hd||g).insertAdjacentHTML('beforebegin',card())}}}catch(e){void e}};
document.addEventListener('change',e=>{const id=e.target.dataset&&e.target.dataset.rm;if(!id)return;const m=map();if(e.target.value)m[id]=e.target.value;else delete m[id];lsSet(MK,m);render()});
try{init();seed();render()}catch(e){void e}
})();
