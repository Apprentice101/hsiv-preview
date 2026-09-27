'use strict';
// Static decorative fabric effect. No animation, external images, or tracking.
// The entire design is warped together so stars follow the same folds as stripes.
function drawFlag(){
  const canvas=document.querySelector('#flag-canvas');
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  ctx.scale(dpr,dpr);
  const angle=-Math.PI/30;
  const padX=h*.065+36,padY=w*.065+40;
  const fw=w+2*padX,fh=h+2*padY;
  const amplitude=Math.min(30,Math.max(14,w*.022));
  const wave=x=>amplitude*Math.sin((x+padX)/fw*Math.PI*3-.6)
    +amplitude*.25*Math.sin((x+padX)/fw*Math.PI*6+.3);
  ctx.translate(w/2,h/2);ctx.rotate(angle);ctx.translate(-w/2,-h/2);
  function band(x0,x1,y0,y1,color){
    ctx.beginPath();
    for(let i=0;i<=100;i++){const x=x0+(x1-x0)*i/100;const y=y0+wave(x);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
    for(let i=100;i>=0;i--){const x=x0+(x1-x0)*i/100;ctx.lineTo(x,y1+wave(x));}
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  for(let stripe=0;stripe<13;stripe++){
    band(-padX,w+padX,-padY+stripe*fh/13,-padY+(stripe+1)*fh/13+.5,stripe%2===0?'#ac3944':'#ffffff');
  }
  const cantonRight=-padX+fw*.4,cantonBottom=-padY+fh*7/13;
  band(-padX,cantonRight,-padY,cantonBottom,'#294c77');
  const starSize=Math.max(4,Math.min(10,fw*.009));
  for(let row=0;row<9;row++){
    const count=row%2===0?6:5;
    for(let col=0;col<count;col++){
      const cx=-padX+fw*.4*((col*2+(row%2===0?1:2))/12);
      const cy=-padY+fh*7/13*((row+1)/10);
      ctx.beginPath();
      for(let point=0;point<10;point++){
        const a=-Math.PI/2+point*Math.PI/5,r=point%2===0?starSize:starSize*.4;
        const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r+wave(x);
        if(point===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();ctx.fillStyle='#fff';ctx.fill();
    }
  }
  // Broad, soft highlights and shadows suggest cloth folds without adding motion.
  for(let x=-padX;x<w+padX;x+=3){
    const fold=Math.cos((x+padX)/fw*Math.PI*3-.6);
    ctx.fillStyle=fold>0?`rgba(255,255,255,${fold*.18})`:`rgba(20,32,48,${-fold*.14})`;
    ctx.fillRect(x,-padY-40,3,fh+80);
  }
}
drawFlag();
let flagResizeFrame;
window.addEventListener('resize',()=>{cancelAnimationFrame(flagResizeFrame);flagResizeFrame=requestAnimationFrame(drawFlag);});
// Layout examples only. No real candidates, source records, analytics, or persistent storage.
const issues = ['Affordability','Climate','Economy','Elections & Democracy','Foreign Policy','Guns','Health Care','Immigration','ProChoice/Right to Life','Technology'];
const states = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};
const tiles = [
['AK',1,1],['ME',12,1],['VT',10,2],['NH',11,2],
['WA',2,3],['ID',3,3],['MT',4,3],['ND',5,3],['MN',6,3],['IL',7,3],['WI',8,3],['MI',9,3],['NY',10,3],['MA',11,3],
['OR',2,4],['NV',3,4],['WY',4,4],['SD',5,4],['IA',6,4],['IN',7,4],['OH',8,4],['PA',9,4],['NJ',10,4],['CT',11,4],['RI',12,4],
['CA',2,5],['UT',3,5],['CO',4,5],['NE',5,5],['MO',6,5],['KY',7,5],['WV',8,5],['VA',9,5],['MD',10,5],['DE',11,5],
['AZ',3,6],['NM',4,6],['KS',5,6],['AR',6,6],['TN',7,6],['NC',8,6],['SC',9,6],
['OK',5,7],['LA',6,7],['MS',7,7],['AL',8,7],['GA',9,7],
['HI',1,8],['TX',5,8],['FL',10,8]
];
const $ = selector => document.querySelector(selector);
const selected = new Set();
let state = 'ME';
let race = 'senate';
let resultsVisible = false;
const raceNames = {senate:'U.S. Senate',house1:'U.S. House · District 1',house2:'U.S. House · District 2'};
$('#issue-buttons').innerHTML = issues.map((issue,i)=>`<button type="button" class="issue-option" data-issue="${i}" aria-label="${issue}" aria-pressed="false">${issue}</button>`).join('');
$('#state-map').innerHTML = tiles.map(([code,col,row])=>`<button type="button" class="state-tile" data-code="${code}" style="grid-column:${col};grid-row:${row}" aria-label="${states[code]}${code==='ME'?', pilot layout':', no preview available'}" aria-pressed="${code==='ME'}" title="${states[code]}">${code}</button>`).join('');
$('#state-select').innerHTML = Object.entries(states).sort((a,b)=>a[1].localeCompare(b[1])).map(([code,name])=>`<option value="${code}" ${code==='ME'?'selected':''}>${name}</option>`).join('');
function updateSelection(){
  document.querySelectorAll('.issue-option').forEach(button=>button.setAttribute('aria-pressed',String(selected.has(issues[Number(button.dataset.issue)]))));
  $('#count').textContent = `${selected.size} of 3 selected`;
  $('#selection-message').textContent = selected.size===3 ? 'Three selected. Remove one to choose another.' : 'Your choices stay in this open page.';
  const view = $('#view');
  if(view) view.disabled = selected.size===0;
  if(resultsVisible) renderResults();
}
$('#issue-buttons').addEventListener('click',event=>{
  const button = event.target.closest('[data-issue]'); if(!button)return;
  const issue = issues[Number(button.dataset.issue)];
  if(selected.has(issue)) selected.delete(issue);
  else if(selected.size<3) selected.add(issue);
  else {$('#selection-message').textContent='You can choose up to three. Remove an issue to add another.';return;}
  updateSelection();
});
$('#clear').addEventListener('click',()=>{selected.clear();updateSelection();});
function chooseState(code){
  state=code;resultsVisible=false;$('#state-select').value=code;
  document.querySelectorAll('.state-tile').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.code===code)));
  renderState();renderResults();
}
$('#state-map').addEventListener('click',event=>{const button=event.target.closest('[data-code]');if(button)chooseState(button.dataset.code);});
$('#state-select').addEventListener('change',event=>chooseState(event.target.value));
function renderState(){
  if(state!=='ME'){
    $('#state-content').innerHTML=`<div class="unavailable"><h3>${states[state]}</h3><p>Candidate information not yet available in this preview.</p><p>In the full site, available voting guides will be listed separately from candidate research.</p><button id="return-maine" type="button" class="text-button">Explore the Maine sample instead</button></div>`;
    $('#return-maine').addEventListener('click',()=>chooseState('ME'));return;
  }
  $('#state-content').innerHTML=`<p class="availability">Maine pilot · layout examples, research pending</p><label for="race-select">Congressional race</label><select id="race-select"><option value="senate">U.S. Senate · sample layout</option><option value="house1">U.S. House · District 1 · sample layout</option><option value="house2">U.S. House · District 2 · sample layout</option></select><p class="micro">Official district-lookup link to be verified before launch. This preview does not collect addresses.</p><button id="view" class="primary" type="button" ${selected.size===0?'disabled':''}>View candidate positions →</button><p class="micro">Choose at least one issue above to open the sample.</p><div class="guide"><a href="https://apprentice101.github.io/me-voter-FAQ/" target="_blank" rel="noopener noreferrer">Voting in Maine ↗</a><p>Open the separate voting guide. No issue selection required.</p></div>`;
  $('#race-select').value=race;
  $('#race-select').addEventListener('change',event=>{race=event.target.value;if(resultsVisible)renderResults();});
  $('#view').addEventListener('click',()=>{resultsVisible=true;renderResults();$('#results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#results-title').setAttribute('tabindex','-1');$('#results-title').focus({preventScroll:true});});
}
function issueBlock(issue,isSelected,variant){
  const summary = variant===0
    ? 'Layout example: a short, neutral summary of the candidate’s documented position will appear here, including any important qualification.'
    : 'Research on this issue is not yet available.';
  return `<section class="issue-block"><div class="issue-label"><h4>${issue}</h4>${isSelected?'<span class="selected-tag">Selected issue</span>':''}</div><p class="summary-copy">${summary}</p>${variant===0?'<details><summary>Read the evidence</summary><div class="evidence"><p><b>Evidence layout only.</b> No statement or source is being attributed to a real candidate.</p><p>A supporting excerpt or precise locator will appear here.</p><p><b>Source:</b> descriptive title and direct link after verification.</p><p><b>Type:</b> campaign statement, legislative action, or attributed reporting, as applicable.</p><p><b>Published:</b> source date, when established.<br><b>Last reviewed:</b> actual editorial review date.</p></div></details>':''}</section>`;
}
function renderResults(){
  if(!resultsVisible||!selected.size||state!=='ME'){
    $('#candidate-content').className='empty';
    $('#candidate-content').innerHTML='<div class="empty-line"></div><h3>Your candidates, your priorities</h3><p>Choose at least one issue and a Maine race, then select<br class="desktop"> “View candidate positions” to explore the card layout.</p>';
    $('#results-subtitle').textContent='Your selected issues will appear first on every card.';return;
  }
  $('#results-subtitle').textContent=`Maine · ${raceNames[race]} · Layout examples, not a ballot roster`;
  $('#candidate-content').className='';
  $('#candidate-content').innerHTML=`<p class="result-note">Two fictional layout examples, not actual candidates. The first shows a summary and evidence pattern; the second shows missing research. Green labels mean “selected topic,” never agreement.</p><div class="cards">${['Alex Example','Jordan Sample'].map((name,index)=>`<article class="candidate"><header class="candidate-header"><div class="sample-tag">Fictional layout example</div><h3>${name}</h3><p class="candidate-meta">[Party / ballot designation]<br>${raceNames[race]} · Maine</p><p class="candidate-meta">[Incumbent label, if applicable]</p><p class="campaign-slot">Campaign website link appears here once verified.</p></header>${issues.filter(issue=>selected.has(issue)).map(issue=>issueBlock(issue,true,index)).join('')}<details class="other"><summary>Other issues <span class="other-count">${issues.length-selected.size} topics</span></summary>${issues.filter(issue=>!selected.has(issue)).map(issue=>issueBlock(issue,false,index)).join('')}</details></article>`).join('')}</div><p class="micro">Missing information reflects the limits of research, not agreement or disagreement with your views. Sample names appear alphabetically by last name.</p>`;
}
const systemDark=matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme=systemDark?'dark':'light';
function themeLabel(){$('#theme').textContent=document.documentElement.dataset.theme==='dark'?'Light view':'Dark view';}
$('#theme').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';themeLabel();});
themeLabel();renderState();
