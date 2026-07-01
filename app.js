const DAY_VERSION_MARK = 'DAY9_V8_CLEAN_REBUILD_FROM_LATEST_WORD_20260701_NO_OLD_FILES';
const synth = window.speechSynthesis;
let voices = [];
function loadVoices() { voices = synth.getVoices() || []; }
if ('speechSynthesis' in window) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
function scoreAmericanVoice(v) {
  const name = (v.name || '').toLowerCase(); const lang = (v.lang || '').toLowerCase(); let score = 0;
  if (lang === 'en-us') score += 100;
  if (/en-in|india|indian/.test(lang + ' ' + name)) score -= 300;
  if (/en-gb|en-au|en-ca|en-za|british|australia|canada/.test(lang + ' ' + name)) score -= 80;
  if (/us english|american|united states/.test(name)) score += 60;
  if (/samantha|ava|allison|susan|tom|joelle|jenny|aria|guy|davis|tony|microsoft|google us english/.test(name)) score += 40;
  if (/natural|neural|premium|enhanced/.test(name)) score += 20;
  if (lang.startsWith('en')) score += 10;
  return score;
}
function pickVoice() { loadVoices(); if (!voices.length) return null; const ranked=voices.filter(v=>(v.lang||'').toLowerCase().startsWith('en')).map(v=>({voice:v,score:scoreAmericanVoice(v)})).sort((a,b)=>b.score-a.score); return (ranked.find(x=>x.score>0)||{}).voice || voices.find(v=>(v.lang||'').toLowerCase()==='en-us') || voices[0]; }
function speak(text, rate=0.82) { if (!('speechSynthesis' in window)) { alert('当前浏览器不支持朗读功能，请用 Chrome / Safari / Edge 打开。'); return; } synth.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=rate; u.pitch=1; u.volume=1; const v=pickVoice(); if(v) u.voice=v; synth.speak(u); }
document.querySelectorAll('[data-say]').forEach(btn=>btn.addEventListener('click',()=>speak(btn.dataset.say, btn.classList.contains('sentence')?0.76:0.82)));
document.getElementById('readAll')?.addEventListener('click',()=>{ const words=[...document.querySelectorAll('.word-card')].map(c=>c.dataset.word).join('. '); speak(words,0.72); });
document.getElementById('readExamples')?.addEventListener('click',()=>{ const examples=[...document.querySelectorAll('.word-card .sentence')].map(b=>b.dataset.say).join(' '); speak(examples,0.76); });
for (const id of ['pauseBtn','pauseReading']) document.getElementById(id)?.addEventListener('click',()=>synth.pause());
for (const id of ['resumeBtn','resumeReading']) document.getElementById(id)?.addEventListener('click',()=>synth.resume());
for (const id of ['stopBtn','stopReading']) document.getElementById(id)?.addEventListener('click',()=>synth.cancel());
document.getElementById('printBtn')?.addEventListener('click',()=>window.print());

function setupSentenceControls(){
  document.querySelectorAll('.example-row').forEach((row, i)=>{
    if(row.querySelector('.sentence-controls')) return;
    const group=document.createElement('div');
    group.className='sentence-controls';
    group.innerHTML='<button type="button" class="small sentence-pause">⏸ 暂停</button><button type="button" class="small sentence-resume">▶ 继续</button><button type="button" class="small sentence-stop">■ 停止</button>';
    row.appendChild(group);
    group.querySelector('.sentence-pause').addEventListener('click',()=>synth.pause());
    group.querySelector('.sentence-resume').addEventListener('click',()=>synth.resume());
    group.querySelector('.sentence-stop').addEventListener('click',()=>synth.cancel());
  });
}


const V7_KEY = 'SAT_DAY9_V8_CLEAN_MISTAKE_REVIEW_STATE';
const QUIZ_ANSWERS = ['B', 'C', 'A', 'C', 'A', 'A', 'B', 'A'];
const FILL_ANSWERS = ['conciliatory', 'concise', 'concoct', 'compunction', 'consensus', 'conduit', 'condolence', 'congeal', 'congenial', 'consecrate'];
const READING_ANSWERS = ['concord', 'concise', 'concoct', 'conciliatory', 'consensus', 'congregation', 'conduit', 'conflagration'];
function normalizeAnswer(value) { return (value||'').trim().toLowerCase().replace(/[.,;:!?]+$/g,'').replace(/\s+/g,' '); }
function defaultPracticeState(){ return {quiz:{}, fill:{}, reading:{}, details:{}, mistakes:{}}; }
function loadPracticeState() { try { const s=JSON.parse(localStorage.getItem(V7_KEY)) || defaultPracticeState(); s.quiz=s.quiz||{}; s.fill=s.fill||{}; s.reading=s.reading||{}; s.details=s.details||{}; s.mistakes=s.mistakes||{}; return s; } catch(e) { return defaultPracticeState(); } }
function savePracticeState(state) { localStorage.setItem(V7_KEY, JSON.stringify(state)); const status=document.getElementById('saveStatus'); if(status) status.textContent='已自动保存到本机 '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
let practiceState = loadPracticeState();

/* ==============================
   Day 9 Ultimate V8 自动错题本 + 复习功能
   ============================== */
function getWordCard(word){ return document.querySelector(`.word-card[data-word="${CSS.escape(word)}"]`); }
function getWordInfo(word){
  const card=getWordCard(word);
  if(!card) return {word, num:'', cn:'', en:'', example:''};
  const num=card.querySelector('.num')?.textContent?.trim()||'';
  const ps=[...card.querySelectorAll('p')].map(p=>p.textContent.trim());
  const en=(ps.find(t=>t.startsWith('EN'))||'').replace(/^EN\s*/,'');
  const cn=(ps.find(t=>t.startsWith('中文'))||'').replace(/^中文\s*/,'');
  const example=card.querySelector('.sentence')?.dataset.say || card.querySelector('.example-text')?.textContent.replace(/^Example\s*/,'') || '';
  return {word,num,cn,en,example};
}
function addMistake(word, source, userAnswer){
  if(!word) return;
  practiceState.mistakes=practiceState.mistakes||{};
  const info=getWordInfo(word);
  const old=practiceState.mistakes[word]||{word, count:0, sources:{}, firstAt:Date.now(), mastered:false};
  old.count=(old.count||0)+1;
  old.sources=old.sources||{};
  old.sources[source]=(old.sources[source]||0)+1;
  old.lastSource=source;
  old.lastAnswer=userAnswer||'';
  old.lastAt=Date.now();
  old.mastered=false;
  old.num=info.num; old.cn=info.cn; old.en=info.en; old.example=info.example;
  practiceState.mistakes[word]=old;
  savePracticeState(practiceState);
  renderMistakes();
}
function removeMistake(word){ if(practiceState.mistakes){ delete practiceState.mistakes[word]; savePracticeState(practiceState); renderMistakes(); initSelfReview(); } }
function sourceLabel(s){ return {quiz:'小测选择题',fill:'填空题',reading:'阅读找词'}[s]||s; }
function getActiveMistakes(){ return Object.values(practiceState.mistakes||{}).filter(m=>!m.mastered).sort((a,b)=>(b.count||0)-(a.count||0)); }
function renderMistakes(){
  const list=document.getElementById('mistakeList'); const summary=document.getElementById('mistakeSummary');
  if(!list||!summary) return;
  document.querySelectorAll('.word-card').forEach(c=>c.classList.remove('needs-review'));
  const mistakes=getActiveMistakes();
  if(!mistakes.length){ list.innerHTML=''; summary.textContent='暂无错题记录。做题后，如果答错，系统会自动把相关词加入这里。'; return; }
  summary.innerHTML=`共识别出 <b>${mistakes.length}</b> 个薄弱词；错误总次数 <b>${mistakes.reduce((n,m)=>n+(m.count||0),0)}</b>。错误 2 次以上会标为重点复习词。`;
  list.innerHTML=mistakes.map(m=>{
    const sources=Object.entries(m.sources||{}).map(([k,v])=>`${sourceLabel(k)}×${v}`).join('；');
    const badge=(m.count||0)>=2?'<span class="weak-badge">重点薄弱词</span>':'';
    return `<article class="mistake-card" data-word="${m.word}"><h3>${m.word} ${badge}</h3><div class="mistake-meta">${m.num?`#${m.num} · `:''}${m.cn||''}<br>${m.en||''}<br>来源：${sources||sourceLabel(m.lastSource)}<br>错误次数：${m.count||1}</div>${m.example?`<p class="example"><b>Example</b> ${m.example}</p>`:''}<div class="mistake-actions"><button type="button" class="small speak-mistake" data-word="${m.word}">🔊 单词</button><button type="button" class="small speak-example" data-example="${(m.example||'').replace(/"/g,'&quot;')}">🔊 例句</button><button type="button" class="small mark-mastered" data-word="${m.word}">标为已掌握</button></div></article>`;
  }).join('');
  mistakes.forEach(m=>getWordCard(m.word)?.classList.add('needs-review'));
  list.querySelectorAll('.speak-mistake').forEach(b=>b.addEventListener('click',()=>speak(b.dataset.word,0.82)));
  list.querySelectorAll('.speak-example').forEach(b=>b.addEventListener('click',()=>b.dataset.example&&speak(b.dataset.example,0.76)));
  list.querySelectorAll('.mark-mastered').forEach(b=>b.addEventListener('click',()=>removeMistake(b.dataset.word)));
}
function readMistakeWords(){ const words=getActiveMistakes().map(m=>m.word).join('. '); if(words) speak(words,0.72); else alert('目前还没有错题词。'); }
function readMistakeExamples(){ const examples=getActiveMistakes().map(m=>m.example).filter(Boolean).join(' '); if(examples) speak(examples,0.76); else alert('目前还没有错题例句。'); }
function clearMistakes(){ if(confirm('确定要清空错题本吗？做题记录不会被清除，只清空薄弱词列表。')){ practiceState.mistakes={}; savePracticeState(practiceState); renderMistakes(); document.body.classList.remove('review-active'); } }
function startMistakeReview(){ const mistakes=getActiveMistakes(); if(!mistakes.length){ alert('目前还没有错题词。先完成小测、填空或阅读找词，答错的词会自动出现在这里。'); return; } document.body.classList.add('review-active'); applyPracticeMode('words'); document.getElementById('mistakes')?.scrollIntoView({behavior:'smooth',block:'start'}); }
function exitMistakeReview(){ document.body.classList.remove('review-active'); }
function getQuizCorrectWord(qIndex){ const q=document.querySelectorAll('#quiz .question')[qIndex]; const letter=QUIZ_ANSWERS[qIndex]; const btn=q?.querySelector(`.choice-btn[data-choice="${letter}"]`); return btn?.innerText?.replace(/^[A-D]\s*/, '').trim().split(/\s+/)[0] || ''; }

function setupQuizClickable() { document.querySelectorAll('#quiz .question').forEach((q,qIndex)=>{ const ol=q.querySelector('ol'); if(!ol) return; ol.classList.add('choice-list'); [...ol.querySelectorAll('li')].forEach((li,optIndex)=>{ const letter=String.fromCharCode(65+optIndex); const text=li.textContent.trim().replace(/^([A-D]\.\s*)/,''); li.innerHTML=''; const btn=document.createElement('button'); btn.type='button'; btn.className='choice-btn'; btn.dataset.question=String(qIndex); btn.dataset.choice=letter; btn.innerHTML=`<span class="choice-letter">${letter}</span><span>${text}</span>`; btn.addEventListener('click',()=>{ practiceState.quiz[qIndex]=letter; if(letter!==QUIZ_ANSWERS[qIndex]) addMistake(getQuizCorrectWord(qIndex),'quiz',letter); savePracticeState(practiceState); renderQuizState(qIndex); renderMistakes(); initSelfReview(); }); li.appendChild(btn); }); const feedback=document.createElement('div'); feedback.className='practice-feedback'; feedback.id=`quiz-feedback-${qIndex}`; q.appendChild(feedback); renderQuizState(qIndex); }); }
function renderQuizState(qIndex) { const q=document.querySelectorAll('#quiz .question')[qIndex]; if(!q) return; const selected=practiceState.quiz[qIndex]; const correct=QUIZ_ANSWERS[qIndex]; q.querySelectorAll('.choice-btn').forEach(btn=>{ btn.classList.remove('selected','correct','wrong'); if(btn.dataset.choice===selected) { btn.classList.add('selected'); btn.classList.add(selected===correct?'correct':'wrong'); } }); const fb=document.getElementById(`quiz-feedback-${qIndex}`); if(fb) { if(!selected) fb.textContent=''; else fb.textContent= selected===correct?'✓ 回答正确，已保存。':'✗ 已保存。可以再选一次，或点“显示答案”核对。'; fb.className='practice-feedback '+(selected?(selected===correct?'ok':'no'):''); } }
function addInputPractice(sectionSelector, answers, bucketName, placeholder) { document.querySelectorAll(`${sectionSelector} .question`).forEach((q,i)=>{ if(q.querySelector('.practice-input-row')) return; const row=document.createElement('div'); row.className='practice-input-row'; row.innerHTML=`<input class="practice-input" type="text" autocomplete="off" placeholder="${placeholder}" data-bucket="${bucketName}" data-index="${i}"><button type="button" class="check-one">检查</button><span class="practice-feedback"></span>`; const details=q.querySelector('details.answer'); q.insertBefore(row, details||null); const input=row.querySelector('input'); const btn=row.querySelector('button'); const fb=row.querySelector('.practice-feedback'); input.value=practiceState[bucketName]?.[i]||''; function saveAndMaybeCheck(showFeedback=false) { practiceState[bucketName][i]=input.value; savePracticeState(practiceState); if(showFeedback) { const user=normalizeAnswer(input.value); const correct=normalizeAnswer(answers[i]); const ok=user===correct; if(showFeedback && user && !ok) addMistake(answers[i], bucketName, input.value); input.classList.toggle('correct', ok&&!!user); input.classList.toggle('wrong', !ok&&!!user); fb.textContent=!user?'请输入答案。':(ok?'✓ 回答正确，已保存。':'✗ 已保存。已自动加入错题本，可修改后再检查，或点“显示答案”核对。'); fb.className='practice-feedback '+(ok?'ok':'no'); } else { input.classList.remove('correct','wrong'); fb.textContent=input.value?'已保存':''; fb.className='practice-feedback'; } } input.addEventListener('input',()=>saveAndMaybeCheck(false)); input.addEventListener('keydown',e=>{ if(e.key==='Enter') saveAndMaybeCheck(true); }); btn.addEventListener('click',()=>saveAndMaybeCheck(true)); }); }
function setupDetailsSave() { document.querySelectorAll('details.answer').forEach((d,i)=>{ const key=`answer-${i}`; if(practiceState.details&&practiceState.details[key]) d.open=true; d.addEventListener('toggle',()=>{ practiceState.details=practiceState.details||{}; practiceState.details[key]=d.open; savePracticeState(practiceState); }); }); }
function checkAllPractice() { Object.keys(practiceState.quiz||{}).forEach(k=>renderQuizState(Number(k))); document.querySelectorAll('.practice-input-row .check-one').forEach(btn=>btn.click()); }
function resetPractice() { const ok=confirm('确定要清除 Day9 本机做题记录吗？选择题、输入内容、颜色和已展开答案都会恢复为空白。'); if(!ok) return; localStorage.removeItem(V7_KEY); practiceState=defaultPracticeState(); document.querySelectorAll('.choice-btn').forEach(btn=>btn.classList.remove('selected','correct','wrong')); document.querySelectorAll('.practice-input').forEach(input=>{input.value=''; input.classList.remove('correct','wrong');}); document.querySelectorAll('.practice-feedback').forEach(fb=>{fb.textContent=''; fb.className='practice-feedback';}); document.querySelectorAll('details.answer').forEach(d=>d.open=false); const mode=document.getElementById('practiceMode'); if(mode){mode.value='all'; applyPracticeMode('all');} const status=document.getElementById('saveStatus'); if(status) status.textContent='记录已清除，可以重新开始。'; }
function applyPracticeMode(mode) { if(mode!=='review') exitMistakeReview(); const map={words:'#words', quiz:'#quiz', fill:'#fill', reading:'#reading', review:'#words'}; ['#words','#quiz','#fill','#reading'].forEach(sel=>{ const el=document.querySelector(sel); if(!el) return; if(mode==='all'||map[mode]===sel) el.classList.remove('hidden-section'); else el.classList.add('hidden-section'); }); if(mode!=='all'&&map[mode]) document.querySelector(map[mode])?.scrollIntoView({behavior:'smooth',block:'start'}); }


const REVIEW_KEY = 'SAT_DAY9_V8_CLEAN_SELF_REVIEW_STATE';
function loadSelfReview(){
  try{return JSON.parse(localStorage.getItem(REVIEW_KEY))||{};}catch(e){return {};}
}
function saveSelfReview(){
  const data={
    unknown:document.getElementById('reviewUnknown')?.value||'',
    wrongType:document.getElementById('reviewWrongType')?.value||'',
    reason:document.getElementById('reviewWrongReason')?.value||'',
    twice:document.getElementById('reviewTwice')?.value||'',
    checkWords:!!document.getElementById('reviewCheckWords')?.checked,
    checkExamples:!!document.getElementById('reviewCheckExamples')?.checked,
    checkRedo:!!document.getElementById('reviewCheckRedo')?.checked
  };
  localStorage.setItem(REVIEW_KEY,JSON.stringify(data));
  const status=document.getElementById('reviewStatus');
  if(status) status.textContent='复盘已保存到本机 '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}
function restoreSelfReview(){
  const data=loadSelfReview();
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.value=val||'';};
  set('reviewUnknown',data.unknown); set('reviewWrongType',data.wrongType); set('reviewWrongReason',data.reason); set('reviewTwice',data.twice);
  const cw=document.getElementById('reviewCheckWords'); if(cw) cw.checked=!!data.checkWords;
  const ce=document.getElementById('reviewCheckExamples'); if(ce) ce.checked=!!data.checkExamples;
  const cr=document.getElementById('reviewCheckRedo'); if(cr) cr.checked=!!data.checkRedo;
}
function autoFillSelfReview(){
  const mistakes=getActiveMistakes().sort((a,b)=>(b.count||0)-(a.count||0));
  if(!mistakes.length){ alert('目前还没有错题词。先做题并检查，答错的词会自动进入错题本。'); return; }
  const top=mistakes.slice(0,5).map(m=>m.word);
  const twice=mistakes.filter(m=>(m.count||0)>=2).map(m=>m.word);
  const sourceCount={quiz:0,fill:0,reading:0};
  mistakes.forEach(m=>(m.sources||[]).forEach(s=>{sourceCount[s]=(sourceCount[s]||0)+1;}));
  const maxType=Object.entries(sourceCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
  const typeMap={quiz:'小测选择题',fill:'填空题',reading:'阅读找词题'};
  document.getElementById('reviewUnknown').value=top.join(', ');
  document.getElementById('reviewTwice').value=(twice.length?twice:top).join(', ');
  document.getElementById('reviewWrongType').value=typeMap[maxType]||'多种题型都需要加强';
  document.getElementById('reviewWrongReason').value='根据错题本自动判断：这些词需要再次听发音、朗读例句，并重做相关题型。';
  saveSelfReview();
}
function clearSelfReview(){
  if(!confirm('确定要清空自我复盘栏吗？这不会清除错题本和做题记录。')) return;
  localStorage.removeItem(REVIEW_KEY);
  ['reviewUnknown','reviewWrongType','reviewWrongReason','reviewTwice'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  ['reviewCheckWords','reviewCheckExamples','reviewCheckRedo'].forEach(id=>{const el=document.getElementById(id); if(el) el.checked=false;});
  const status=document.getElementById('reviewStatus'); if(status) status.textContent='复盘栏已清空。';
}
function initSelfReview(){
  restoreSelfReview();
  ['reviewUnknown','reviewWrongType','reviewWrongReason','reviewTwice','reviewCheckWords','reviewCheckExamples','reviewCheckRedo'].forEach(id=>{
    const el=document.getElementById(id); if(el){ el.addEventListener('input',saveSelfReview); el.addEventListener('change',saveSelfReview); }
  });
  document.getElementById('autoFillReview')?.addEventListener('click',autoFillSelfReview);
  document.getElementById('saveReview')?.addEventListener('click',saveSelfReview);
  document.getElementById('clearReview')?.addEventListener('click',clearSelfReview);
}

function initV8Practice() { setupSentenceControls(); setupQuizClickable(); addInputPractice('#fill',FILL_ANSWERS,'fill','输入填空答案'); addInputPractice('#reading',READING_ANSWERS,'reading','输入阅读找词答案'); setupDetailsSave(); document.getElementById('resetPractice')?.addEventListener('click',resetPractice); document.getElementById('checkAllBtn')?.addEventListener('click',checkAllPractice); document.getElementById('practiceMode')?.addEventListener('change',e=>{ if(e.target.value==='review') startMistakeReview(); else applyPracticeMode(e.target.value); }); document.getElementById('refreshMistakes')?.addEventListener('click',renderMistakes); document.getElementById('readMistakeWords')?.addEventListener('click',readMistakeWords); document.getElementById('readMistakeExamples')?.addEventListener('click',readMistakeExamples); document.getElementById('clearMistakes')?.addEventListener('click',clearMistakes); document.getElementById('reviewMistakesBtn')?.addEventListener('click',startMistakeReview); renderMistakes(); initSelfReview(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initV8Practice); else initV8Practice();
