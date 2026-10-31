/* Goals screen: AI helpers that only fill in a question; nothing is sent until you tap Send. */
(function(){
const o=window.render;
window.render=function(){o();try{if(view!=='goal'||document.getElementById('goal-ai'))return;const app=document.getElementById('app');if(!app)return;
  app.insertAdjacentHTML('afterbegin','<section class="card db" id="goal-ai"><p class="lab">Ask AI about my goals</p><p class="xs mut">Fills in a question for the Ask AI panel. Nothing is sent until you tap Send, and nothing is changed for you.</p><div class="row2" style="margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-ga="steps">Break a goal into steps</button><button class="btn sm" data-ga="attn">Which goal needs attention?</button></div></section>')}catch(e){void e}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-ga]');if(!b||!window.aiPrefill)return;aiPrefill('productivity',b.dataset.ga==='steps'?'Pick my most important active goal and break it into small, realistic steps with a first action I can do this week.':'Looking at my active goals and what is recorded, which one needs attention first, and why?')});
})();
