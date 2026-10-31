/* Customize the Today screen: choose which cards to show. */
(function(){
const DK='wt-dashcfg',ITEMS=['Top 3 priorities','Today’s academic reading','From your records','Today’s insights','Needs attention','Upcoming'];
const hid=()=>lsGet(DK,[]),OK='wt-dashord',ord=()=>{const o=lsGet(OK,[]).filter(x=>ITEMS.includes(x));ITEMS.forEach(i=>{if(!o.includes(i))o.push(i)});return o};
const lab=n=>((n.querySelector('.lab,.hd b,summary')||{}).textContent||'').replace(/\s+/g,' ').trim();
const o=window.render;
window.render=function(){o();try{if(view!=='today')return;const app=document.getElementById('app');if(!app)return;const H=hid();
  app.querySelectorAll('section,details.card').forEach(n=>{if(n.id==='dash-cfg')return;const l=lab(n);if(ITEMS.includes(l)&&H.includes(l))n.style.display='none'});
  const ns=[...app.querySelectorAll('section,details.card')].filter(n=>n.id!=='dash-cfg'&&ITEMS.includes(lab(n))),O=ord(),sn=ns.slice().sort((a,b)=>O.indexOf(lab(a))-O.indexOf(lab(b)));
  if(ns.some((n,i)=>n!==sn[i])){const mk=ns.map(n=>{const c=document.createComment('');n.before(c);return c});sn.forEach((n,i)=>mk[i].after(n));mk.forEach(c=>c.remove())}
  if(!document.getElementById('dash-cfg'))app.insertAdjacentHTML('beforeend',`<details class="card db" id="dash-cfg"><summary class="sm"><b>Customize this screen</b></summary><p class="xs mut">Untick a card to hide it, or use the arrows to reorder. Nothing is deleted, and you can bring it back any time.</p>${ord().map(i=>`<div class="row2" style="margin-top:6px;align-items:center"><label class="sm" style="flex:1"><input type="checkbox" data-dash="${i}"${H.includes(i)?'':' checked'}> ${i}</label><button class="btn sm" data-dm="-1" data-i="${i}">▲</button><button class="btn sm" data-dm="1" data-i="${i}">▼</button></div>`).join('')}</details>`)}catch(e){void e}};
document.addEventListener('change',e=>{const i=e.target.dataset&&e.target.dataset.dash;if(!i)return;let H=hid().filter(x=>x!==i);if(!e.target.checked)H.push(i);lsSet(DK,H);render();const d=document.getElementById('dash-cfg');if(d)d.open=true});
document.addEventListener('click',e=>{const b=e.target.closest('[data-dm]');if(!b)return;const O=ord(),i=O.indexOf(b.dataset.i),j=i+(+b.dataset.dm);if(i<0||j<0||j>=O.length)return;[O[i],O[j]]=[O[j],O[i]];lsSet(OK,O);render();const c=document.getElementById('dash-cfg');if(c)c.open=true});
})();
