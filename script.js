/*
  WICKETLY - JAVASCRIPT
  This file controls the scoreboard.

  Beginner guide:
  - state stores the current match information.
  - render() updates what appears on the screen.
  - recordDelivery() adds runs, extras or a wicket.
  - persist() saves the match in this browser.
*/

const KEY="crease-studio-v1";
const blankPlayer=(name)=>({name,runs:0,balls:0,fours:0,sixes:0,out:false,dismissal:""});
const blankBowler=(name)=>({name,balls:0,runs:0,wickets:0,maidens:0});
const freshMatch=(teamA="Harbour XI",teamB="Valley CC",overs=20)=>({
 teamA,teamB,oversLimit:overs,inningsNo:1,target:null,first:null,
 innings:{batting:teamA,bowling:teamB,runs:0,wickets:0,balls:0,extras:{wide:0,noBall:0,bye:0,legBye:0},batters:[blankPlayer("Alex Morgan"),blankPlayer("Sam Patel")],striker:0,non:1,bowlers:[blankBowler("Jordan Lee")],bowler:0,deliveries:[],fow:[],completed:false},
 history:[]
});
let state=null, page="live", modalAction=null;
try{state=JSON.parse(localStorage.getItem(KEY)||"null")}catch{}
const app=document.getElementById("app"),$=id=>document.getElementById(id);
const THEME_KEY="crease-theme-v1";
function applyTheme(theme){
 const chosen=theme==="dark"?"dark":"light";
 document.body.dataset.theme=chosen;
 localStorage.setItem(THEME_KEY,chosen);
 $("lightTheme").setAttribute("aria-pressed",String(chosen==="light"));
 $("darkTheme").setAttribute("aria-pressed",String(chosen==="dark"));
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=chosen==="dark"?"#101914":"#f4f3ee";
}
const savedTheme=localStorage.getItem(THEME_KEY)||"light";
document.body.dataset.theme=savedTheme;
$("lightTheme").onclick=()=>applyTheme("light");
$("darkTheme").onclick=()=>applyTheme("dark");
$("lightTheme").setAttribute("aria-pressed",String(savedTheme!=="dark"));
$("darkTheme").setAttribute("aria-pressed",String(savedTheme==="dark"));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const overText=b=>`${Math.floor(b/6)}.${b%6}`;
const rate=(r,b)=>b?(r*6/b).toFixed(2):"0.00";
function persist(){localStorage.setItem(KEY,JSON.stringify(state));$("saveStatus").textContent="Saved on this device"}
function active(){return state.innings}
function snap(){const copy=JSON.parse(JSON.stringify(state));copy.history=[];state.history.push(copy);if(state.history.length>100)state.history.shift()}
function currentBatter(){return active().batters[active().striker]}
function currentBowler(){return active().bowlers[active().bowler]}
function rotate(){const i=active();[i.striker,i.non]=[i.non,i.striker]}
function overEnd(){
 const i=active();
 if(i.balls>0&&i.balls%6===0){
  rotate();
  const b=currentBowler();
  const overBalls=[];
  let legal=0,start=i.deliveries.length;
  for(let x=i.deliveries.length-1;x>=0;x--){
   start=x;
   if(i.deliveries[x].legal&&++legal===6)break;
  }
  overBalls.push(...i.deliveries.slice(start));
  if(overBalls.length&&overBalls.every(d=>d.runs===0))b.maidens++;
  return overBalls;
 }
 return null;
}
function checkComplete(){
 const i=active();
 if(i.wickets>=10||i.balls>=state.oversLimit*6||(state.target!==null&&i.runs>=state.target))i.completed=true;
}
function recordDelivery(label,total,batterRuns,legal,extra=null,wicket=false,note=""){
 const i=active();if(i.completed)return;
 snap();const bat=currentBatter(),bowl=currentBowler();
 i.runs+=total;
 if(extra)i.extras[extra]+=total;
 if(batterRuns){bat.runs+=batterRuns;if(batterRuns===4)bat.fours++;if(batterRuns===6)bat.sixes++}
 if(legal){i.balls++;bat.balls++;bowl.balls++}
 if(extra==="wide"||extra==="noBall")bowl.runs+=total;else if(!extra)bowl.runs+=total;
 if(wicket){bat.out=true;bat.dismissal=note;i.wickets++;bowl.wickets++}
 const d={id:Date.now()+Math.random(),label,runs:total,legal,wicket,note:note||label,overNo:Math.floor((i.balls-(legal?1:0))/6)+1};
 i.deliveries.push(d);
 if(batterRuns%2===1||((extra==="bye"||extra==="legBye")&&total%2===1))rotate();
 const completedOver=overEnd();
 checkComplete();
 persist();
 render();
 if(i.completed){
  if(state.inningsNo===1)showFirstInningsComplete();
 }else if(completedOver){
  showOverComplete(completedOver);
 }
}
function undo(){if(!state.history.length)return;const hist=state.history;const prev=hist.pop();prev.history=hist;state=prev;persist();render()}
function showModal(title,html,action){$("modalTitle").textContent=title;$("modalContent").innerHTML=html;$("modalError").textContent="";modalAction=action;$("modalBackdrop").classList.add("open");const first=$("modalContent").querySelector("input,select");if(first)first.focus()}
function closeModal(){$("modalBackdrop").classList.remove("open");modalAction=null}
$("modalCancel").onclick=closeModal;
$("modalSave").onclick=()=>{
 try{
  const action=modalAction;
  const result=action?.();
  if(result!==false&&modalAction===action)closeModal();
 }catch(e){$("modalError").textContent=e.message||"Please check the details."}
};
function setupView(){app.innerHTML=`
<section class="intro"><div><div class="eyebrow">The scoring desk</div><h1>Keep your eyes<br>on the game.</h1><p>A calm, straightforward cricket scorer for club matches, nets and backyard contests. Set your own overs limit, add the players, then score each delivery.</p></div></section>
<section class="setup"><div class="eyebrow">Start a match</div><h2>Set the teams.</h2><div class="setup-grid">
<label class="field"><input id="teamA" placeholder="Batting team" aria-label="Batting team" maxlength="32"></label>
<label class="field"><input id="teamB" placeholder="Bowling team" aria-label="Bowling team" maxlength="32"></label>
<label class="field"><input id="overs" type="number" min="1" max="1000" step="1" inputmode="numeric" placeholder="Overs per innings (e.g. 20)" aria-label="Overs per innings"><small class="field-help">Choose any whole number from 1 to 1,000 overs.</small></label>
<label class="field"><input id="batterA" placeholder="Opening batter" aria-label="Opening batter" maxlength="32"></label>
<label class="field"><input id="batterB" placeholder="Non-striker" aria-label="Non-striker" maxlength="32"></label>
<label class="field"><input id="bowlerA" placeholder="Opening bowler" aria-label="Opening bowler" maxlength="32"></label>
</div><div class="setup-actions"><span class="hintline">You can edit player names during the match.</span><button class="button primary" id="startMatch">Start scoring</button></div></section>`; 
$("startMatch").onclick=()=>{const a=$("teamA").value.trim(),b=$("teamB").value.trim(),overs=Number($("overs").value);if(!a||!b||a.toLowerCase()===b.toLowerCase()){alert("Enter two different team names.");return}if(!Number.isInteger(overs)||overs<1||overs>1000){alert("Enter a whole number of overs between 1 and 1000.");return}state=freshMatch(a,b,overs);state.innings.batters=[blankPlayer($("batterA").value.trim()||"Batter 1"),blankPlayer($("batterB").value.trim()||"Batter 2")];state.innings.bowlers=[blankBowler($("bowlerA").value.trim()||"Bowler 1")];persist();page="live";render()};
}
function scoreView(){const i=active(),bat=i.batters,bowl=currentBowler(),str=bat[i.striker],non=bat[i.non],cRun=rate(i.runs,i.balls),needed=state.target===null?null:Math.max(0,state.target-i.runs),ballsLeft=state.target===null?null:Math.max(0,state.oversLimit*6-i.balls);
 const overStart=(()=>{let legal=0,k=i.deliveries.length;for(let x=i.deliveries.length-1;x>=0;x--){k=x;if(i.deliveries[x].legal&&++legal===6){k=x+1;break}}return k})();
 const over=i.deliveries.slice(overStart);
 const ballsAvailable=state.oversLimit*6;
 const ballsRemaining=Math.max(0,ballsAvailable-i.balls);
 const matchResult=(()=>{
  if(state.inningsNo!==2||!i.completed||state.target===null)return null;
  if(i.runs>=state.target)return {title:`${i.batting} win!`,detail:`They won by ${10-i.wickets} wicket${10-i.wickets===1?"":"s"}.`};
  const firstScore=state.target-1;
  if(i.runs===firstScore)return {title:"Match tied!",detail:"Both teams finished with the same score."};
  const difference=firstScore-i.runs;
  return {title:`${state.first.batting} win!`,detail:`They won by ${difference} run${difference===1?"":"s"}.`};
 })();
 app.innerHTML=`
<section class="intro"><div><div class="eyebrow">Match in progress · ${state.oversLimit} overs</div><h1>${esc(i.batting)} <span style="color:#929b92">at the crease.</span></h1><p>Record the delivery. Wicketly keeps the innings, player figures and match history together.</p></div><div class="match-meta">INNINGS ${state.inningsNo} OF 2<br>${state.inningsNo===2?"CHASE":"FIRST INNINGS"}</div></section>
<section class="score-hero"><div class="score-main"><div class="score-top"><span class="live-label"><i class="live-dot"></i>${i.completed?"Innings complete":"Scoring live"}</span><span class="innings-label">${esc(i.batting)} batting</span></div><div class="big-score">${i.runs}<span>/${i.wickets}</span></div><div class="score-stats"><div class="score-stat"><label>Overs · Ball</label><b>${overText(i.balls)} · ${i.balls%6===0?6:i.balls%6}</b></div><div class="score-stat"><label>Run rate</label><b>${cRun}</b></div><div class="score-stat"><label>Extras</label><b>${Object.values(i.extras).reduce((a,b)=>a+b,0)}</b></div>${state.target!==null?`<div class="score-stat"><label>Required rate</label><b>${ballsLeft?rate(needed,ballsLeft):"—"}</b></div>`:""}</div></div>
<aside class="score-aside"><div class="teams-line"><span>${esc(state.teamA)}</span><span class="versus">V</span><span>${esc(state.teamB)}</span></div><div class="target-box"><label>${state.target===null?"First innings":"Target"}</label><strong>${state.target===null?"—":state.target}</strong><p>${state.target===null?"The chase target appears after the innings.":`${needed} runs needed · ${ballsRemaining} balls remaining`}</p>${state.target!==null?`<div class="target-details"><div><small>BALLS AVAILABLE</small><strong>${ballsAvailable}</strong></div><div><small>BALLS LEFT</small><strong>${ballsRemaining}</strong></div><div><small>RUNS NEEDED</small><strong>${needed}</strong></div></div>`:""}</div></aside></section>
${state.inningsNo===1?`<div class="innings-action"><button class="button primary" id="endInnings">End first innings & set target</button><p>First-innings score will be saved before the chase begins.</p></div>`:`<div class="innings-action"><span class="draft">First innings saved</span><p>${esc(state.first.batting)} ${state.first.runs}/${state.first.wickets} · Target ${state.target}</p></div>`}
<nav class="tabs"><button class="tab ${page==="live"?"active":""}" data-tab="live">Live scoring</button><button class="tab ${page==="scorecard"?"active":""}" data-tab="scorecard">Scorecard</button><button class="tab ${page==="fow"?"active":""}" data-tab="fow">Fall of wickets</button><button class="tab ${page==="commentary"?"active":""}" data-tab="commentary">Commentary</button></nav>
<div class="content">${page==="live"?liveLayout(i,str,non,bowl,over):page==="scorecard"?scorecardView():page==="fow"?fowView():commentaryView()}</div>${matchResult&&!state.celebrationDismissed?`<div class="win-backdrop" id="winBackdrop"><section class="win-card"><div class="confetti">${Array.from({length:20},()=>"<i></i>").join("")}</div><div class="win-medal">W</div><div class="win-kicker">Match result</div><h2 class="win-title">${esc(matchResult.title)}</h2><div class="win-score">${i.runs}/${i.wickets}</div><p class="win-detail">${esc(matchResult.detail)}</p><button class="button primary" id="closeWin">View match scorecard</button></section></div>`:""}`;
 document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{page=b.dataset.tab;render()});
 $("endInnings")?.addEventListener("click",endInnings);
 $("closeWin")?.addEventListener("click",()=>{state.celebrationDismissed=true;persist();$("winBackdrop")?.remove();page="scorecard";render()});
 bindLive();
}
function liveLayout(i,str,non,bowl,over){return `<div class="layout"><div class="stack">
<section class="panel"><div class="panel-head"><h2>At the crease</h2><small>BATTERS</small></div>${[[str,true],[non,false]].map(([p,is])=>`<div class="player-row"><div><span class="player-name">${esc(p.name)}</span>${is?'<span class="striker-tag">STRIKER</span>':""}<span class="player-role">${p.out?"Dismissed":`${p.fours} fours · ${p.sixes} sixes · SR ${rate(p.runs,p.balls)}`}</span></div><div class="player-score">${p.runs}<small> (${p.balls})</small></div></div>`).join("")}<div class="player-actions"><button class="button" id="editBatters">Edit batter names</button><button class="button" id="swapStrike">Swap strike</button></div></section>
<section class="panel"><div class="panel-head"><h2>Current over</h2><small>${i.balls%6} OF 6 LEGAL BALLS</small></div><div class="over-chips">${over.length?over.map(d=>`<span class="chip ${d.wicket?"wicket":d.runs===4||d.runs===6?"boundary":""}">${esc(d.label)}</span>`).join(""):'<span class="empty">Your deliveries will appear here.</span>'}</div></section>
<section class="panel"><div class="panel-head"><h2>Bowling</h2><small>ACTIVE BOWLER</small></div><div class="bowler-line"><div><div class="bowler-name">${esc(bowl.name)}</div><div class="player-role">${bowl.maidens} maidens · Econ ${rate(bowl.runs,bowl.balls)}</div></div><div class="bowler-fig">${overText(bowl.balls)} <small>ov</small> · ${bowl.runs}/${bowl.wickets}</div></div><div class="player-actions"><button class="button" id="editBowler">Change bowler</button></div></section>
</div><div class="stack"><section class="panel scoring-panel"><div class="panel-head"><h2>Score this ball</h2><small>${i.completed?"INNINGS ENDED":"TAP TO RECORD"}</small></div><div class="run-grid">${[0,1,2,3,4,6].map(n=>`<button class="run-key ${n===4||n===6?"boundary":""}" data-run="${n}" ${i.completed?"disabled":""}>${n}</button>`).join("")}</div><div class="extra-grid"><button class="button" data-extra="wide" ${i.completed?"disabled":""}>Wide +1</button><button class="button" data-extra="noBall" ${i.completed?"disabled":""}>No ball +1</button><button class="button" data-extra="bye" ${i.completed?"disabled":""}>Bye</button><button class="button" data-extra="legBye" ${i.completed?"disabled":""}>Leg bye</button></div><div class="scoring-actions"><button class="button danger" id="wicketBtn" ${i.completed?"disabled":""}>Wicket</button><button class="button" id="undoBtn" ${state.history.length?"":"disabled"}>Undo last action</button></div><p class="hintline">Odd runs rotate strike. Strike also changes after six legal balls.</p></section>
<section class="panel"><div class="panel-head"><h2>Innings figures</h2><small>TEAM TOTAL</small></div><div class="list-row"><span>Wides</span><span>${i.extras.wide}</span></div><div class="list-row"><span>No balls</span><span>${i.extras.noBall}</span></div><div class="list-row"><span>Byes</span><span>${i.extras.bye}</span></div><div class="list-row"><span>Leg byes</span><span>${i.extras.legBye}</span></div></section></div></div>`}
function scorecardView(){const innings=[...(state.first?[state.first]:[]),active()];return `<div class="stack">${innings.map((i,n)=>`<section class="panel"><div class="panel-head"><h2>${esc(i.batting)} batting</h2><small>${i.runs}/${i.wickets} · ${overText(i.balls)} OV</small></div><div class="table-wrap"><table><thead><tr><th>Batter</th><th>Dismissal</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>${i.batters.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.dismissal|| (p.out?"out":"not out"))}</td><td>${p.runs}</td><td>${p.balls}</td><td>${p.fours}</td><td>${p.sixes}</td><td>${rate(p.runs,p.balls)}</td></tr>`).join("")}</tbody></table></div><p class="section-note">Extras: ${Object.values(i.extras).reduce((a,b)=>a+b,0)} (Wd ${i.extras.wide}, Nb ${i.extras.noBall}, B ${i.extras.bye}, Lb ${i.extras.legBye})</p><div class="panel-head" style="margin:22px 0 10px"><h2>Bowling figures</h2></div><div class="table-wrap"><table><thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th></tr></thead><tbody>${i.bowlers.map(b=>`<tr><td>${esc(b.name)}</td><td>${overText(b.balls)}</td><td>${b.runs}</td><td>${b.wickets}</td><td>${rate(b.runs,b.balls)}</td></tr>`).join("")}</tbody></table></div></section>`).join("")}</div>`}
function fowView(){const i=active();return `<section class="panel"><div class="panel-head"><h2>Fall of wickets</h2><small>${esc(i.batting)}</small></div>${i.fow.length?i.fow.map(f=>`<div class="list-row"><span>${f.wicket}. ${esc(f.batter)} · ${f.overs} ov</span><span>${f.score}/${f.wicket}</span></div>`).join(""):'<p class="empty">No wickets have fallen in this innings.</p>'}</section>`}
function commentaryView(){const i=active();return `<section class="panel"><div class="panel-head"><h2>Ball-by-ball</h2><small>LATEST FIRST</small></div>${i.deliveries.length?[...i.deliveries].reverse().map(d=>`<div class="list-row"><span>${esc(d.note)} <span class="player-role">Over ${d.overNo} · ${d.legal?"Legal delivery":"Extra delivery"}</span></span><span>${esc(d.label)}</span></div>`).join(""):'<p class="empty">Commentary will appear after the first delivery.</p>'}</section>`}
function bindLive(){const i=active();document.querySelectorAll("[data-run]").forEach(b=>b.onclick=()=>recordDelivery(b.dataset.run,+b.dataset.run,+b.dataset.run,true));
 document.querySelectorAll("[data-extra]").forEach(b=>b.onclick=()=>{const type=b.dataset.extra;if(type==="wide"||type==="noBall"){recordDelivery(type==="wide"?"Wd":"Nb",1,0,false,type);return}showModal(type==="bye"?"Record byes":"Record leg byes",`<label class="field">RUNS COMPLETED<select id="extraRuns"><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></label>`,()=>{const n=+$("extraRuns").value;recordDelivery((type==="bye"?"B":"Lb")+n,n,0,true,type)})});
 $("undoBtn")?.addEventListener("click",undo);
 $("swapStrike")?.addEventListener("click",()=>{snap();rotate();persist();render()});
 $("editBatters")?.addEventListener("click",()=>{const a=i.batters[i.striker],b=i.batters[i.non];showModal("Edit batter names",`<label class="field">STRIKER<input id="editStriker" value="${esc(a.name)}"></label><label class="field">NON-STRIKER<input id="editNon" value="${esc(b.name)}"></label>`,()=>{if(!$("editStriker").value.trim()||!$("editNon").value.trim())throw Error("Both batter names are required.");snap();a.name=$("editStriker").value.trim();b.name=$("editNon").value.trim();persist();render()})});
 $("editBowler")?.addEventListener("click",()=>{showModal("Change bowler",`<label class="field">NEXT BOWLER NAME<input id="editBowlerName" placeholder="Enter the new bowler"></label>`,()=>{const name=$("editBowlerName").value.trim();if(!name)throw Error("Enter a bowler name.");snap();const existing=active().bowlers.findIndex(b=>b.name.toLowerCase()===name.toLowerCase());if(existing>=0)active().bowler=existing;else{active().bowlers.push(blankBowler(name));active().bowler=active().bowlers.length-1;}persist();render()})});
 $("wicketBtn")?.addEventListener("click",()=>{const p1=i.batters[i.striker],p2=i.batters[i.non];showModal("Record a wicket",`<label class="field">DISMISSED BATTER<select id="outWho"><option value="striker">${esc(p1.name)} (striker)</option><option value="non">${esc(p2.name)} (non-striker)</option></select></label><label class="field">DISMISSAL<select id="dismissal"><option>Bowled</option><option>Caught</option><option>Run out</option><option>LBW</option><option>Stumped</option><option>Hit wicket</option></select></label><label class="field">NEXT BATTER<input id="nextBatter" type="text" placeholder="e.g. Virat Kohli" aria-label="Incoming batter name" maxlength="32" autocomplete="off"></label>`,()=>{const who=$("outWho").value,idx=who==="striker"?i.striker:i.non,name=$("nextBatter").value.trim();if(!name)throw Error("Enter the incoming batter's name.");snap();const out=i.batters[idx],kind=$("dismissal").value;out.out=true;out.dismissal=kind==="Caught"?"c fielder b "+currentBowler().name:kind==="Run out"?"run out":kind.toLowerCase()+" b "+currentBowler().name;i.wickets++;if(kind!=="Run out")currentBowler().wickets++;out.balls++;currentBowler().balls++;i.balls++;i.fow.push({wicket:i.wickets,score:i.runs,overs:overText(i.balls),batter:out.name});i.deliveries.push({id:Date.now(),label:"W",runs:0,legal:true,wicket:true,note:`${kind}: ${out.name} dismissed`,overNo:Math.ceil(i.balls/6)});i.batters.push(blankPlayer(name));const newId=i.batters.length-1;if(who==="striker")i.striker=newId;else i.non=newId;const completedOver=overEnd();checkComplete();persist();render();if(i.completed){if(state.inningsNo===1)showFirstInningsComplete()}else if(completedOver){showOverComplete(completedOver)}})});
}
function showOverComplete(deliveries){
 const i=active();
 const overRuns=deliveries.reduce((sum,d)=>sum+d.runs,0);
 const overNumber=Math.floor(i.balls/6);
 showModal(`Over ${overNumber} completed`,
  `<p class="section-note">Over ${overNumber} is complete. The over's total was <strong>${overRuns} runs</strong>.</p><p class="section-note">Current score: <strong>${i.runs}/${i.wickets}</strong> (${overText(i.balls)} overs)</p><label class="field">NEXT OVER BOWLER<select id="bowlerChoice"><option value="same">Continue with ${esc(currentBowler().name)}</option><option value="change">Change bowler</option></select></label><label class="field">NEW BOWLER NAME<input id="nextBowlerName" placeholder="Enter name if changing bowler"></label><p class="hintline">For formal cricket matches, the same bowler normally cannot bowl consecutive overs.</p>`,
  ()=>{const choice=$("bowlerChoice").value;if(choice==="change"){const name=$("nextBowlerName").value.trim();if(!name)throw Error("Enter the next bowler's name.");const found=i.bowlers.findIndex(b=>b.name.toLowerCase()===name.toLowerCase());if(found>=0)i.bowler=found;else{i.bowlers.push(blankBowler(name));i.bowler=i.bowlers.length-1;}}persist();render();});
}
function showFirstInningsComplete(){
 const i=active();
 showModal("First innings completed",`<p class="section-note"><strong>${esc(i.batting)}</strong> finished on <strong>${i.runs}/${i.wickets}</strong> in ${overText(i.balls)} overs.</p><p class="section-note">The chasing team needs <strong>${i.runs+1} runs</strong> from <strong>${state.oversLimit*6} balls</strong>.</p>`,()=>{startSecondInnings();return false});
}
function startSecondInnings(){
 const i=active();
 snap();
 state.first=JSON.parse(JSON.stringify(i));
 state.target=i.runs+1;
 state.inningsNo=2;
 const old=state.teamA;state.teamA=state.teamB;state.teamB=old;
 state.innings={batting:state.teamA,bowling:state.teamB,runs:0,wickets:0,balls:0,extras:{wide:0,noBall:0,bye:0,legBye:0},batters:[blankPlayer(""),blankPlayer("")],striker:0,non:1,bowlers:[blankBowler("")],bowler:0,deliveries:[],fow:[],completed:false};
 persist();page="live";render();
 showModal("Set the chase line-up",`<p class="section-note">Target: <strong>${state.target}</strong> · Balls available: <strong>${state.oversLimit*6}</strong></p>
 <label class="field">STRIKER<input id="chaseA" placeholder="Enter striker name" aria-label="Striker name" maxlength="32" required></label>
 <label class="field">NON-STRIKER<input id="chaseB" placeholder="Enter non-striker name" aria-label="Non-striker name" maxlength="32" required></label>
 <label class="field">OPENING BOWLER<input id="chaseBowler" placeholder="Enter opening bowler name" aria-label="Opening bowler name" maxlength="32" required></label>`,()=>{
  const x=active();
  const striker=$("chaseA").value.trim();
  const nonStriker=$("chaseB").value.trim();
  const bowler=$("chaseBowler").value.trim();
  if(!striker||!nonStriker||!bowler)throw Error("Please enter all three player names.");
  x.batters[0].name=striker;
  x.batters[1].name=nonStriker;
  x.bowlers[0].name=bowler;
  persist();render();
 });
}
function endInnings(){
 const i=active();if(state.inningsNo!==1)return;
 showModal("End first innings?",`<p class="section-note">Save ${esc(i.batting)} at <strong>${i.runs}/${i.wickets}</strong> in ${overText(i.balls)} overs and set ${esc(i.bowling)} a target of <strong>${i.runs+1}</strong>.</p>`,()=>{startSecondInnings();return false});
}
function legalPage(which){const terms=which==="terms";app.innerHTML=`<article class="legal-page"><div class="eyebrow">Wicketly · ${terms?"Terms of service":"Privacy policy"}</div><h1>${terms?"Terms of service":"Privacy policy"}</h1><span class="draft">Draft · review before publishing</span>${terms?`<p>This draft describes basic use of the Wicketly cricket scoring website. It is not legal advice and must be reviewed for the operator's jurisdiction and business model before publication.</p><h2>Using the scorer</h2><p>Wicketly is a manual scorekeeping tool. The person operating the scorer is responsible for checking entries, player details, match totals and official playing conditions. The app is not an official scoring authority.</p><h2>Availability and accuracy</h2><p>The website is provided as a scoring aid. No uptime, data accuracy, match result or fitness for a particular purpose is promised in this draft.</p><h2>Your responsibilities</h2><p>Use the tool lawfully and do not rely on it as the sole official record of a competition unless the organiser has approved it.</p><h2>Operator details to add</h2><p>Before launch, add the legal operator name, contact details, governing law, dispute process and any applicable consumer terms.</p>`:`<p>This draft reflects the current single-device implementation. It must be checked against the final hosting, analytics and data practices before publication.</p><h2>Match data</h2><p>Match scores, player names and delivery history are stored in your browser's local storage on the device where you use Wicketly. The current version does not send match data to a Wicketly server.</p><h2>What this means</h2><p>Clearing browser data or changing devices may remove access to saved matches. Anyone with access to the same browser profile may be able to view locally saved match information.</p><h2>Third-party services</h2><p>If the site is later connected to analytics, hosting logs, crash reporting or cloud sync, disclose those providers and the data they collect here before enabling them.</p><h2>Contact and retention</h2><p>Add a privacy contact, operator identity and any formal data request process before publishing this policy. Browser-stored match data can be removed using the browser's site data controls.</p>`}<button class="button" id="backToApp" style="margin-top:20px">Back to scorer</button></article>`;$("backToApp").onclick=()=>{page="live";render()}}
function render(){if(!state){setupView();return}if(page==="terms"||page==="privacy"){legalPage(page);return}scoreView()}
$("newMatchBtn").onclick=()=>{if(state&&!confirm("Start a new match? The current match remains saved only until you replace it."))return;state=null;page="live";localStorage.removeItem(KEY);render()};
$("homeLink").onclick=e=>{e.preventDefault();page="live";render()};
document.querySelectorAll("[data-page]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();page=a.dataset.page;render()}));
window.addEventListener("hashchange",()=>{if(location.hash==="#terms"||location.hash==="#privacy"){page=location.hash.slice(1);render()}});
render();
