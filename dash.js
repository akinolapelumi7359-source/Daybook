/* Customize the Today screen: choose which cards to show. */
(function(){
const DK='wt-dashcfg',ITEMS=['Top 3 priorities','Today’s academic reading','From your records','Today’s insights','Needs attention','Upcoming'];
const hid=()=>lsGet(DK,[]);
const lab=n=>((n.querySelector('.lab,.hd b,summary')||{}).textContent||'').replace(/\s+/g,' ').trim();
const o=window.render;
window.render=function(){o();try{if(view!=='today')return;const app=document.getElementById('app');if(!app)return;const H=hid();
  app.querySelectorAll('section,details.card').forEach(n=>{if(n.id==='dash-cfg')return;const l=lab(n);if(ITEMS.includes(l)&&H.includes(l))n.style.display='none'});
  if(!document.getElementById('dash-cfg'))app.insertAdjacentHTML('beforeend',`<details class="card db" id="dash-cfg"><summary class="sm"><b>Customize this screen</b></summary><p class="xs mut">Untick a card to hide it. Nothing is deleted, and you can bring it back any time.</p>${ITEMS.map(i=>`<label class="sm" style="display:block;margin-top:6px"><input type="checkbox" data-dash="${i}"${H.includes(i)?'':' checked'}> ${i}</label>`).join('')}</details>`)}catch(e){void e}};
document.addEventListener('change',e=>{const i=e.target.dataset&&e.target.dataset.dash;if(!i)return;let H=hid().filter(x=>x!==i);if(!e.target.checked)H.push(i);lsSet(DK,H);render();const d=document.getElementById('dash-cfg');if(d)d.open=true});
})();
