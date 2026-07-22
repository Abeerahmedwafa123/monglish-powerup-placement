/* =====================================================================
   Monglish Power Up — Adaptive Placement Engine
   ===================================================================== */
(function(){
  "use strict";
  const { CONFIG, TIERS, BANK, SPEAKING_RUBRIC, WRITING_RUBRIC } = window.MPT;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ---------------- global state ---------------- */
  const S = {
    student:{}, startedAt:null,
    rec:{},                       // active receptive staircase
    results:{ listening:null, reading:null }, // {ceiling, tierPct:{}, perObj:[]}
    provisional:null,             // {tier, sublevel, pctAtTier}
    writingText:"", writeTaskTier:null, speakTaskTier:null,
    teacher:{ writing:[0,0,0], speaking:[0,0,0], notes:"" },
    reliability:[], timer:null, remaining:CONFIG.totalMinutes*60,
    answerTimes:[], notPlayed:0
  };

  /* ---------------- screen nav ---------------- */
  function show(id){
    $$(".screen").forEach(s=>s.classList.remove("active"));
    $("#screen-"+id).classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  /* ---------------- speech (listening TTS) ---------------- */
  let voice=null;
  function loadVoice(){
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v=>/en-GB/i.test(v.lang)&&/female|Google UK/i.test(v.name))
         || vs.find(v=>/en-GB/i.test(v.lang))
         || vs.find(v=>/^en/i.test(v.lang)) || vs[0] || null;
  }
  if("speechSynthesis" in window){
    loadVoice(); speechSynthesis.onvoiceschanged = loadVoice;
  }
  function speak(text, cb){
    if(!("speechSynthesis" in window)){ if(cb)cb(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate=0.92; u.pitch=1.02; u.lang="en-GB"; if(voice)u.voice=voice;
    if(cb) u.onend=cb;
    speechSynthesis.speak(u);
  }

  /* ---------------- timer ---------------- */
  function startTimer(){
    S.startedAt = new Date();
    $("#timer").hidden=false;
    S.timer = setInterval(()=>{
      S.remaining--;
      const m=Math.floor(S.remaining/60), s=S.remaining%60;
      const t=$("#timer"); t.textContent=`${m}:${String(s).padStart(2,"0")}`;
      if(S.remaining<=300)t.classList.add("warn");
      if(S.remaining<=0){ clearInterval(S.timer); forceFinish(); }
    },1000);
  }
  function forceFinish(){
    // time up -> jump to teacher scoring with whatever we have
    if(!S.provisional) computeProvisional();
    buildTeacherPanel(); show("teacher");
  }

  /* =====================================================================
     LANDING → registration
     ===================================================================== */
  $("#regForm").addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("#stuName").value.trim();
    const age=parseInt($("#stuAge").value,10);
    const err=$("#regError");
    if(!name){ return fail("Please enter the student's name."); }
    if(isNaN(age)||age<CONFIG.ageMin||age>CONFIG.ageMax){
      return fail(`Please enter an age between ${CONFIG.ageMin} and ${CONFIG.ageMax}.`);
    }
    err.hidden=true;
    S.student={ name, age, school:$("#stuSchool").value.trim(),
      cls:$("#stuClass").value.trim(), date:new Date().toLocaleDateString() };
    show("instructions");
    function fail(m){ err.textContent=m; err.hidden=false; $("#stuName").focus(); return false; }
  });

  /* WATCH-HOW-IT-WORKS video modal (Google Drive embed) */
  const INSTRUCTION_VIDEO="https://drive.google.com/file/d/1Fol1M5tcJjV-37UvS8-iFyF_gyHpQd2H/preview";
  (function(){
    const vm=$("#videoModal"); if(!vm||!vm.showModal) return;
    const fr=$("#introFrame");
    const open=()=>{ if(fr) fr.src=INSTRUCTION_VIDEO; vm.showModal(); };
    const close=()=>{ if(fr) fr.src="about:blank"; if(vm.open) vm.close(); };  // blank src stops playback
    const wb=$("#watchBtn"); if(wb) wb.addEventListener("click",open);
    $("#videoModalClose").addEventListener("click",close);
    vm.addEventListener("click",e=>{ if(e.target===vm) close(); });
    vm.addEventListener("cancel",e=>{ e.preventDefault(); close(); });   // Esc
  })();


  /* SOUND CHECK (on landing) */
  $("#testSoundBtn").addEventListener("click",()=>{
    const st=$("#soundStatus"); st.textContent="Playing… can you hear me?";
    speak("Hello! I'm Mongiz. Can you hear me clearly?",
      ()=>{ st.textContent="Heard that? Great — you're ready!"; });
  });

  /* INSTRUCTIONS → begin */
  $("#beginBtn").addEventListener("click",()=>{
    startTimer();
    startSkill("listening");
    show("question");
  });

  /* =====================================================================
     ADAPTIVE RECEPTIVE STAIRCASE  (listening, then reading)
     ===================================================================== */
  /* FULLY ADAPTIVE: start mid-ladder; all correct -> harder block,
     poor score -> one easier block to confirm, then move on. */
  const SKILL_ORDER=["listening","reading"];
  function startSkill(skill){
    S.rec={ skill, tier:CONFIG.startTier, visited:{}, perObj:[], answered:0 };
    loadTier();
  }
  function loadTier(){
    const r=S.rec;
    r.qIndex=0; r.tierCorrect=0; r.tierTotal=0; r.tierPlayed=false;
    setTabs(r.skill);
    if(r.skill==="listening"){ r.listenTask=BANK[r.tier].listening; renderListeningInteractive(); }
    else { r.block=BANK[r.tier].reading.slice(); r.tierTotal=r.block.length; renderQuestion(); }
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

  function renderQuestion(){
    const r=S.rec, item=r.block[r.qIndex], isL=r.skill==="listening";
    $("#secTitle").textContent = isL?"Listening":"Reading";
    $("#qCounter").textContent = `Question ${r.answered+1} of 10`;
    const ac=$("#audioControls"); ac.hidden=!isL;         // Reading: no audio button
    const visual=$("#qVisual");
    if(item.imageSrc){
      visual.src=item.imageSrc;
      visual.alt=item.imageAlt||"Pictures for this listening activity";
      visual.hidden=false;
    }else{
      visual.hidden=true;
      visual.removeAttribute("src");
      visual.alt="";
    }
    const opts=$("#options"); opts.innerHTML="";
    r.selected=null; r.played=0; r.playedFull=false; r.tStart=Date.now();
    stopAudio();
    $("#nextBtn").disabled=true; $("#nextBtn").textContent="Next →";
    // shuffle the option order so the correct answer is NOT always first
    const order=shuffle(item.options.map((_,i)=>i));
    r.correctIdx=order.indexOf(item.answer);
    const view=order.map(i=>item.options[i]);
    $("#qText").textContent=item.text||(isL?"Listen and choose the correct answer.":"");
    if(isL){ setupAudio(item); buildOptions(view, opts, /*lock only until first play this level*/!r.tierPlayed); }
    else   { buildOptions(view, opts, false); }
    progress();
  }
  function setupAudio(item){
    const info=$("#replayInfo"), btn=$("#playBtn"), r=S.rec, hasFile=!!item.audioSrc;
    if(hasFile){
      S.audioEl=new Audio(item.audioSrc);
      S.audioEl.addEventListener("ended",()=>{ r.playedFull=true; });
    }
    info.textContent=`Press ▶ Play to listen (you can replay ${CONFIG.maxReplays} times).`;
    btn.onclick=()=>{
      if(r.played>=CONFIG.maxReplays+1) return;
      r.played++;
      r.tierPlayed=true;
      if(hasFile){ try{S.audioEl.currentTime=0;}catch(e){} S.audioEl.play().catch(()=>{}); }
      else { speak(item.audio||item.text); r.playedFull=true; }
      info.textContent = r.played>CONFIG.maxReplays ? "No replays left"
        : `Replays left: ${CONFIG.maxReplays-(r.played-1)}`;
      enableOptions();
    };
  }
  function stopAudio(){
    if(S.audioEl){ try{S.audioEl.pause();}catch(e){} S.audioEl=null; }
    if("speechSynthesis" in window) speechSynthesis.cancel();
  }
  function buildOptions(view, opts, locked){
    view.forEach((txt,i)=>{
      const b=document.createElement("button");
      b.className="opt-btn"; b.type="button"; b.setAttribute("role","radio");
      b.setAttribute("aria-checked","false"); b.disabled=locked;
      b.innerHTML=`<span class="letter">${String.fromCharCode(65+i)}</span><span>${txt}</span>`;
      b.onclick=()=>selectOption(i,b);
      opts.appendChild(b);
    });
  }
  function enableOptions(){ $$("#options .opt-btn").forEach(b=>b.disabled=false); }
  function selectOption(i,btn){
    S.rec.selected=i;
    $$("#options .opt-btn").forEach(b=>{b.classList.remove("selected");b.setAttribute("aria-checked","false");});
    btn.classList.add("selected"); btn.setAttribute("aria-checked","true");
    $("#nextBtn").disabled=false;
  }
  $("#nextBtn").addEventListener("click",()=>{
    const r=S.rec;
    if(r.skill==="listening"){ submitListening(); return; }   // interactive listening
    const item=r.block[r.qIndex];
    const correct = r.selected===r.correctIdx;
    S.answerTimes.push(Date.now()-r.tStart);
    if(correct) r.tierCorrect++;
    r.perObj.push({ obj:item.obj, correct, tier:r.tier, skill:r.skill });
    r.answered++; r.qIndex++; stopAudio();
    if(r.qIndex<r.block.length) renderQuestion();
    else evaluateTier();
  });

  /* ---------------- interactive listening (picture worksheet) ---------------- */
  function norm(s){
    return String(s||"").toLowerCase().trim()
      .replace(/[‘’`]/g,"'")     // curly/backtick apostrophes -> straight
      .replace(/[.,!?;:'"]/g,"")                // strip punctuation (apostrophes too: don't == dont)
      .replace(/\s+/g," ");
  }
  function setListenEnabled(on){
    $$("#options .lr-input").forEach(el=>{
      const row=el.closest(".listen-row");
      if(row && row.classList.contains("example")) return;
      el.disabled=!on;
    });
  }
  function setupAudioSimple(src){
    const info=$("#replayInfo"), btn=$("#playBtn"), r=S.rec;
    S.audioEl = src ? new Audio(src) : null;
    if(S.audioEl) S.audioEl.addEventListener("ended",()=>{ r.playedFull=true; });
    info.textContent=`Press ▶ Play to listen (replay up to ${CONFIG.maxReplays} times).`;
    btn.onclick=()=>{
      if(r.played>=CONFIG.maxReplays+1) return;
      r.played++; r.tierPlayed=true;
      if(S.audioEl){ try{S.audioEl.currentTime=0;}catch(e){} S.audioEl.play().catch(()=>{}); }
      info.textContent = r.played>CONFIG.maxReplays ? "No replays left" : `Replays left: ${CONFIG.maxReplays-(r.played-1)}`;
      setListenEnabled(true);
      $("#nextBtn").disabled=false;
    };
  }
  function renderListeningInteractive(){
    const r=S.rec, task=r.listenTask;
    $("#secTitle").textContent="Listening";
    $("#qCounter").textContent=`Exercise ${r.b1?2:1} of 2`;
    $("#audioControls").hidden=false;
    r.played=0; r.playedFull=false; r.tStart=Date.now();
    stopAudio();
    const vis=$("#qVisual");
    if(task.image){ vis.src=task.image; vis.alt=task.imageAlt||"Pictures for this listening activity"; vis.hidden=false; }
    else { vis.hidden=true; vis.removeAttribute("src"); }
    $("#qText").textContent=task.instruction||"Listen and answer.";
    setupAudioSimple(task.audioSrc);
    const box=$("#options"); box.innerHTML="";
    if(task.wordbox && task.wordbox.length){
      const wb=document.createElement("div"); wb.className="wordbox";
      wb.innerHTML=`<span>Word box:</span> ${task.wordbox.map(w=>`<b>${w}</b>`).join(" · ")}`;
      box.appendChild(wb);
    }
    /* matching task: photo gallery pinned beside the questions */
    let rowsBox=box;
    if(task.matchImages){
      const wrap=document.createElement("div"); wrap.className="match-wrap";
      const gal=document.createElement("div"); gal.className="match-gallery";
      task.matchImages.forEach(m=>{
        const card=document.createElement("div"); card.className="g-card"; card.dataset.letter=m.l;
        card.innerHTML=`<span class="g-letter">${m.l}</span><img src="${m.img}" alt="Picture ${m.l}" loading="lazy"><span class="g-chip" hidden></span>`;
        gal.appendChild(card);
      });
      rowsBox=document.createElement("div"); rowsBox.className="match-rows";
      wrap.appendChild(gal); wrap.appendChild(rowsBox); box.appendChild(wrap);
    }
    task.slots.forEach((slot,si)=>{
      const row=document.createElement("div");
      row.className="listen-row"+(slot.example?" example":"");
      if(slot.img){
        const im=document.createElement("img");
        im.src=slot.img; im.alt=""; im.className="lr-img"; im.loading="lazy";
        row.appendChild(im);
      }
      const head=document.createElement("div"); head.className="lr-head";
      head.innerHTML=`<span class="lr-label">${slot.label}</span>`
        +(slot.stem?`<span class="lr-stem">${slot.stem}</span>`:"")
        +(slot.example?`<span class="lr-eg">example</span>`:"");
      row.appendChild(head);
      const fields=document.createElement("div"); fields.className="lr-fields";
      slot.fields.forEach((f,fi)=>{
        const cell=document.createElement("label"); cell.className="lr-field";
        if(f.label){ const sp=document.createElement("span"); sp.className="lr-flabel"; sp.textContent=f.label; cell.appendChild(sp); }
        let ctrl;
        if(f.kind==="select"){
          ctrl=document.createElement("select");
          ctrl.innerHTML=`<option value="">–</option>`+f.options.map(o=>`<option value="${o}">${o}</option>`).join("");
        } else {
          ctrl=document.createElement("input"); ctrl.type="text"; ctrl.placeholder="write…"; ctrl.autocomplete="off";
        }
        ctrl.className="lr-input"; ctrl.dataset.si=si; ctrl.dataset.fi=fi;
        if(slot.example){ ctrl.value = f.kind==="select"?f.answer:((f.accept&&f.accept[0])||""); ctrl.disabled=true; }
        // inputs are interactive immediately (learner is prompted to press Play first)
        cell.appendChild(ctrl); fields.appendChild(cell);
      });
      row.appendChild(fields); rowsBox.appendChild(row);
    });
    if(task.matchImages){
      box.addEventListener("change",refreshMatchGallery);
      refreshMatchGallery();
    }
    $("#nextBtn").textContent="Check & continue →";
    $("#nextBtn").disabled=false;
    progressListening();
  }
  /* highlight each photo with the speaker number(s) that chose it */
  function refreshMatchGallery(){
    const rows=[...document.querySelectorAll("#options .listen-row")];
    const map={};
    rows.forEach((row,idx)=>{
      const sel=row.querySelector('.lr-input[data-fi="0"]');
      if(sel && sel.value) (map[sel.value]=map[sel.value]||[]).push(String(idx+1));
    });
    document.querySelectorAll("#options .g-card").forEach(c=>{
      const picks=map[c.dataset.letter]||[];
      c.classList.toggle("picked",picks.length>0);
      const chip=c.querySelector(".g-chip");
      chip.hidden=!picks.length; chip.textContent=picks.join(",");
    });
  }
  function submitListening(){
    const r=S.rec, task=r.listenTask; let correct=0,total=0;
    task.slots.forEach((slot,si)=>{
      if(slot.example) return;
      slot.fields.forEach((f,fi)=>{
        total++;
        const el=document.querySelector(`#options .lr-input[data-si="${si}"][data-fi="${fi}"]`);
        const val=(el?el.value:"").trim();
        const ok = f.kind==="select" ? (val===f.answer) : f.accept.some(a=>norm(a)===norm(val));
        if(ok) correct++;
        r.perObj.push({ obj:task.obj||"listening", correct:ok, tier:r.tier, skill:"listening" });
      });
    });
    if(r.played===0) S.notPlayed++;
    S.answerTimes.push(Date.now()-r.tStart);
    r.tierCorrect=correct; r.tierTotal=total||1; r.answered+=1;
    stopAudio(); evaluateTier();
  }
  function progressListening(){
    const r=S.rec;
    $("#progressFill").style.width=(5+(r.b1?15:0))+"%";
  }

  function evaluateTier(){
    const r=S.rec, pct=Math.round(r.tierCorrect/(r.tierTotal||1)*100);
    r.visited[r.tier]=pct;
    if(!r.b1){
      // First block (level 2) decides the ONE second block — max 2 per skill:
      //   70-100% -> level 6 · 50-69% -> level 4 · 40-49% -> level 3
      //   below 40% -> no second block: move on (pre-beginner placement)
      r.b1={tier:r.tier,pct};
      if(pct<40){ return finishSkill(); }
      const next = pct>=70?6 : pct>=50?4 : 3;
      r.candidate=next;
      r.tier=next; return loadTier();
    }
    r.b2={tier:r.tier,pct};
    finishSkill();
  }
  function finishSkill(){
    const r=S.rec;
    const secure=Object.keys(r.visited).map(Number).filter(t=>r.visited[t]>=CONFIG.masteryBar);
    const ceiling = secure.length?Math.max(...secure):0;
    S.results[r.skill]={ ceiling, tierPct:r.visited, perObj:r.perObj,
                         b1:r.b1||null, b2:r.b2||null, candidate:r.candidate||null };
    const next=SKILL_ORDER[SKILL_ORDER.indexOf(r.skill)+1];
    if(next) startSkill(next);
    else { computeProvisional(); renderResults(); show("results"); }
  }

  /* ---------------- receptive score screen (auto after L + R) ---------------- */
  function skillPct(skill){
    if(S.provisional) return skill==="listening"?S.provisional.L:S.provisional.R;
    return equivPct(skill);
  }
  function renderResults(){
    $("#resName").textContent = S.student.name ? ", "+S.student.name.split(" ")[0] : "";
    $("#resListen").textContent = skillPct("listening")+"%";
    $("#resRead").textContent   = skillPct("reading")+"%";
  }
  $("#toWritingBtn").addEventListener("click",goWriting);

  /* =====================================================================
     PROVISIONAL PLACEMENT — weighted receptive score (L+R) -> band table
       0–47% PU1 · 48–59% PU2 · 60–71% PU3 · 72–82% PU4 · 83–92% PU5 · 93–100% PU6
     ===================================================================== */
  const BANDS=[[0,47,1],[48,59,2],[60,71,3],[72,82,4],[83,92,5],[93,100,6]];
  function bandOf(score){
    for(const [lo,hi,t] of BANDS) if(score>=lo && score<=hi) return {lo,hi,t};
    return {lo:93,hi:100,t:6};
  }
  /* Two-block adaptive estimate -> equivalent full-test % (lands inside the
     correct band of the placement criteria table). */
  function equivPct(skill){
    const res=S.results[skill];
    if(!res||!res.b1){                       // time-up before any block finished
      if(S.rec&&S.rec.skill===skill&&S.rec.perObj.length){
        const objs=S.rec.perObj;
        return Math.round(objs.filter(o=>o.correct).length/objs.length*100*0.6);
      }
      return 0;
    }
    const b1=res.b1, b2=res.b2, c=res.candidate||1;
    let T,pos;
    if(!b2){                                   // below 40% on block 1 -> pre-beginner
      T=1; pos=Math.max(.05,Math.min(.85,b1.pct/47));
    } else {                                   // jump path (block 2 at level 3, 4 or 6)
      if(b2.pct>=85){ T = c===6?6:Math.min(c+1,6); pos = c===6?.85:.2; }
      else if(b2.pct>=60){ T=c; pos=Math.min(.8,(b2.pct-60)/30); }
      else if(b2.pct>=40){ T=Math.max(c-1,1); pos=.6; }
      else {                                   // failed the jump block
        if(c===6){ T=3; pos=.6; }
        else if(c===4){ T=b1.pct>=60?3:2; pos=.4; }
        else { T=1; pos=.85; }
      }
    }
    const band=BANDS.find(x=>x[2]===T);
    return Math.round(band[0]+pos*(band[1]-band[0]));
  }
  function computeProvisional(){
    const L=equivPct("listening"), R=equivPct("reading");
    const receptive=Math.round((L+R)/2);           // L and R weighted equally (30/30)
    const b=bandOf(receptive);
    const pos=(receptive-b.lo)/Math.max(1,b.hi-b.lo);   // position inside the band
    const sub = pos<1/3?1 : pos<2/3?2 : 3;              // -> x.1 / x.2 / x.3
    S.provisional={ tier:b.t, sub, receptive, L, R, gap:Math.abs(L-R), band:[b.lo,b.hi] };
    S.writeTaskTier=b.t; S.speakTaskTier=b.t;           // adaptive W & S selection
  }

  /* =====================================================================
     WRITING  (task auto-selected at provisional level)
     ===================================================================== */
  function goWriting(){
    setTabs("writing");
    $("#writeScorePill").textContent=`Your score: L ${skillPct("listening")}% · R ${skillPct("reading")}%`;
    const t=S.writeTaskTier, w=BANK[t].writing;
    $("#writeInstruction").textContent=w.instruction;
    $("#writeStarter").textContent=w.starter;
    const ul=$("#writePrompts"); ul.innerHTML="";
    w.prompts.forEach(p=>{const li=document.createElement("li");li.textContent=p;ul.appendChild(li);});
    $("#writeArea").value="";
    $("#wordCount").textContent="0";
    show("writing");
  }
  $("#writeArea").addEventListener("input",e=>{
    const w=e.target.value.trim(); const n=w?w.split(/\s+/).length:0;
    $("#wordCount").textContent=n;
  });
  /* handwritten / file upload for the writing task */
  $("#writeUpload").addEventListener("change",e=>{
    const f=e.target.files && e.target.files[0];
    const pv=$("#uploadPreview");
    if(!f){ S.writingUpload=null; pv.hidden=true; pv.innerHTML=""; return; }
    S.writingUpload={ name:f.name, size:f.size, type:f.type||"", dataUrl:null };
    pv.hidden=false;
    pv.innerHTML=`<span class="file-chip">📄 ${f.name} (${Math.max(1,Math.round(f.size/1024))} KB)</span>`;
    if(f.size<=8*1024*1024){
      const rd=new FileReader();
      rd.onload=()=>{
        S.writingUpload.dataUrl=rd.result;
        if(/^image\//.test(f.type)){
          pv.innerHTML=`<img src="${rd.result}" alt="Uploaded handwriting" class="upload-thumb">
            <span class="file-chip">🖼️ ${f.name} — attached ✓</span>`;
        } else {
          pv.innerHTML=`<span class="file-chip">📄 ${f.name} — attached ✓</span>`;
        }
      };
      rd.readAsDataURL(f);
    }
  });
  $("#writeDone").addEventListener("click",()=>{ S.writingText=$("#writeArea").value.trim(); goSpeaking(); });

  /* SPEAKING */
  function goSpeaking(){
    setTabs("speaking");
    $("#speakScorePill").textContent=`Your score: L ${skillPct("listening")}% · R ${skillPct("reading")}%`;
    const t=S.speakTaskTier, sp=BANK[t].speaking;
    $("#speakIntro").textContent=sp.intro;
    const ol=$("#speakPrompts"); ol.innerHTML="";
    sp.prompts.forEach(p=>{const li=document.createElement("li");li.textContent=p;ol.appendChild(li);});
    show("speaking");
  }
  $("#speakDone").addEventListener("click",()=>{ buildTeacherPanel(); show("teacher"); });

  /* =====================================================================
     TEACHER SCORING PANEL
     ===================================================================== */
  /* Rubric-aligned auto-score for TYPED writing (0-3 per criterion).
     A suggestion only — the teacher can adjust every radio. */
  function autoScoreWriting(text, tier){
    const t=String(text||"").trim();
    if(!t) return [0,0,0];
    const words=t.split(/\s+/).filter(Boolean);
    const sents=t.split(/[.!?\n]+/).map(x=>x.trim()).filter(x=>x.split(/\s+/).length>=2);
    const EXP=(BANK[tier]&&BANK[tier].writing&&BANK[tier].writing.lines)||3;   // expected sentences
    const uniq=new Set(words.map(w=>w.toLowerCase().replace(/[^a-z']/g,"")).filter(Boolean)).size;
    // 1) Task & content — did they produce enough relevant sentences?
    let c1=0;
    if(sents.length>=EXP) c1=3;
    else if(sents.length>=Math.ceil(EXP*0.6)) c1=2;
    else if(sents.length>=1 || words.length>=6) c1=1;
    // 2) Grammar & accuracy proxy — sentence shape + connective/verb range
    let c2=0;
    const avg=words.length/Math.max(1,sents.length||1);
    if(words.length>=5) c2=1;
    if(sents.length>=2 && avg>=4 && avg<=24) c2=2;
    const glue=["and","but","because","so","when","then","is","are","was","were","have","has","can","will","would","like"];
    const used=glue.filter(g=>new RegExp("\\b"+g+"\\b","i").test(t)).length;
    if(c2>=2 && used>=3) c2=3;
    // 3) Vocabulary & organisation — lexical range for the task size
    let c3=0;
    if(uniq>=6) c3=1;
    if(uniq>=EXP*3) c3=2;
    if(uniq>=EXP*4 && uniq/words.length>=0.55) c3=3;
    return [c1,c2,c3];
  }

  function buildTeacherPanel(){
    const t=S.writeTaskTier||1;
    $("#wTaskLevel").textContent = TIERS[t].book+" level task";
    $("#sTaskLevel").textContent = TIERS[t].book+" level task";
    // auto-suggest the writing score from the typed submission
    const note=$("#writeAutoNote");
    if(S.writingText){
      S.teacher.writing=autoScoreWriting(S.writingText, t);
      note.hidden=false; note.className="muted";
      note.textContent=`✨ Suggested score (auto-checked from the typed text): ${S.teacher.writing.reduce((a,b)=>a+b,0)}/9 — adjust any criterion if needed.`;
    } else if(S.writingUpload){
      S.teacher.writing=[0,0,0];
      note.hidden=false; note.className="note";
      note.textContent="📎 Handwritten work uploaded — the app cannot mark handwriting. Please read it below and tick the three Writing criteria (0–3) yourself.";
    } else {
      S.teacher.writing=[0,0,0];
      note.hidden=false; note.className="muted";
      note.textContent="No writing was submitted.";
    }
    const wb=$("#writingResponseBox");
    let html = S.writingText ? `<div>${esc(S.writingText)}</div>` : "";
    if(S.writingUpload){
      if(S.writingUpload.dataUrl && /^image\//.test(S.writingUpload.type))
        html+=`<img src="${S.writingUpload.dataUrl}" alt="Uploaded handwriting" class="upload-thumb">`;
      html+=`<div class="file-chip">📎 Uploaded: ${esc(S.writingUpload.name)}${S.writingUpload.dataUrl&&!/^image\//.test(S.writingUpload.type)?" (open from the exported file)":""}</div>`;
    }
    wb.innerHTML = html || "(no writing submitted)";
    renderRubric("#writeRubric", WRITING_RUBRIC, "writing");
    renderRubric("#speakRubric", SPEAKING_RUBRIC, "speaking");
  }
  function renderRubric(sel, rubric, key){
    const tbl=$(sel); tbl.innerHTML="";
    const head=tbl.insertRow();
    ["Criterion","Score (0–3)"].forEach(h=>{const th=document.createElement("th");th.textContent=h;head.appendChild(th);});
    rubric.forEach((row,ri)=>{
      const tr=tbl.insertRow();
      const c1=tr.insertCell(); c1.innerHTML=`<strong>${row.c}</strong><br><span class="muted" style="font-size:.82rem">0–1: ${row.b[0]} · 2: ${row.b[1]} · 3: ${row.b[2]}</span>`;
      const c2=tr.insertCell(); c2.className="score-cell-wrap";
      const wrap=document.createElement("div"); wrap.className="score-cell";
      [0,1,2,3].forEach(v=>{
        const lab=document.createElement("label");
        lab.innerHTML=`<input type="radio" name="${key}-${ri}" value="${v}">${v}`;
        const inp=lab.querySelector("input");
        inp.onchange=()=>{ S.teacher[key][ri]=v; };
        if(S.teacher[key][ri]===v) inp.checked=true;   // reflect auto-suggested score
        wrap.appendChild(lab);
      });
      c2.appendChild(wrap);
    });
  }
  $("#computeBtn").addEventListener("click",()=>{
    const wSum=S.teacher.writing.reduce((a,b)=>a+b,0);
    const sSum=S.teacher.speaking.reduce((a,b)=>a+b,0);
    const warn=[];
    if(wSum===0 && S.writingUpload && !S.writingText)
      warn.push("Writing was uploaded as a FILE — the app cannot mark handwriting.\nPlease read it and set the three Writing criteria (0–3) yourself");
    else if(wSum===0 && S.writingText)
      warn.push("The typed writing was too short to earn marks — set the Writing criteria yourself if you disagree");
    if(sSum===0) warn.push("Speaking has no score (0/9) — set the three Speaking criteria after the interview");
    if(warn.length && !confirm(warn.join(".\n\n")+".\n\nContinue anyway with these zeros?")) return;
    if(S.timer) clearInterval(S.timer);
    computeFinal(); renderReport(); show("report"); saveLocal();
  });

  /* =====================================================================
     FINAL PLACEMENT + SAFEGUARDS
     ===================================================================== */
  let FINAL={};
  function computeFinal(){
    if(!S.provisional) computeProvisional();
    const P=S.provisional;
    const wSum=S.teacher.writing.reduce((a,b)=>a+b,0);   // /9
    const sSum=S.teacher.speaking.reduce((a,b)=>a+b,0);  // /9
    // per-skill % for the weighted total (L/R = full-ladder receptive scores)
    const Lpct = P.L, Rpct = P.R;
    const Wpct = Math.round(wSum/9*100), Spct=Math.round(sSum/9*100);
    const W=CONFIG.weights;
    const weighted = Math.round(Lpct*W.listening + Rpct*W.reading + Wpct*W.writing + Spct*W.speaking);

    // start from provisional
    let tier=P.tier, sub=P.sub, flags=[], conf="High";

    // Safeguard: productive skills weak -> lower (never raise)
    const prodWeak=(wSum<=3)+(sSum<=3);
    if(prodWeak===2){
      flags.push("Both Writing and Speaking are weak at this level — productive-skills support needed.");
      if(sub>1) sub--; else if(tier>1){ tier--; sub=3; }
      conf="Low";
    } else if(prodWeak===1){
      flags.push("One productive skill (Writing or Speaking) is weaker — consider conditional placement / support.");
      if(sub>1) sub--;
      conf= conf==="High"?"Medium":conf;
    }
    // L vs R gap (percentage points on the receptive ladder)
    if(P.gap>=25){ flags.push(`Listening and Reading differ by ${P.gap} points — targeted confirmation recommended.`); conf="Low"; }
    else if(P.gap>=15){ flags.push("Noticeable Listening/Reading difference — verify with the teacher."); if(conf==="High")conf="Medium"; }
    if(P.receptive<=20){ flags.push("Very limited receptive score — start with strong support."); conf="Low"; }

    // reliability
    const fast=S.answerTimes.filter(t=>t<1500).length;
    if(S.answerTimes.length && fast/S.answerTimes.length>=0.4){ flags.push("Several answers were unusually fast — reliability check advised."); if(conf==="High")conf="Medium"; }
    if(S.notPlayed>0){ flags.push(`${S.notPlayed} listening item(s) answered without playing the audio.`); }

    tier=Math.max(1,Math.min(6,tier));
    const T=TIERS[tier];
    const beyond = (tier===6 && sub===3);

    // strengths & gaps by objective
    const all=[].concat(S.results.listening?S.results.listening.perObj:[], S.results.reading?S.results.reading.perObj:[]);
    const strong=[...new Set(all.filter(o=>o.correct).map(o=>o.obj))];
    const gaps=[...new Set(all.filter(o=>!o.correct).map(o=>o.obj))];

    FINAL={
      student:S.student, weighted,
      scores:{ listening:Lpct, reading:Rpct, writing:Wpct, speaking:Spct, wSum, sSum },
      tier, sub, book:T.book, cefr:T.cefr, stage:T.stage, pos:T.pos, color:T.color,
      provisionalTier:S.provisional.tier, receptive:P.receptive, band:P.band, conf, flags, beyond,
      strong, gaps, notPlayed:S.notPlayed,
      writingUpload: S.writingUpload ? { name:S.writingUpload.name, type:S.writingUpload.type,
        size:S.writingUpload.size, dataUrl:S.writingUpload.dataUrl } : null
    };
  }
  function pctAt(skill,tier){
    const r=S.results[skill]; if(!r)return 0;
    if(r.tierPct[tier]!=null) return r.tierPct[tier];
    // fall back to best visited
    const vals=Object.values(r.tierPct); return vals.length?Math.max(...vals):0;
  }

  /* =====================================================================
     REPORT
     ===================================================================== */
  function renderReport(){
    const F=FINAL, st=F.student;
    const subLabel=`${F.book.replace('Power Up ','')}.${F.sub}`;
    const gapsGrammar=F.gaps.filter(g=>/perfect|conditional|tense|past|present|tag|relative|gerund|reported|reflexive|wish|superlative|comparativ|could|should|have to|might|enough|there is|have got|passive|deduction/i.test(g));
    const gapsVocab=F.gaps.filter(g=>!gapsGrammar.includes(g));
    const revision = F.gaps.length? F.gaps.slice(0,5).join(", ") : "General consolidation at the placed level.";

    $("#reportRoot").innerHTML=`
    <div class="report">
      <div class="rep-header">
        <img src="assets/monglish_coloured.png" alt="Monglish">
        <div style="text-align:right">
          <h2 style="margin:0">Placement Report</h2>
          <div class="muted">${st.date}</div>
        </div>
      </div>

      <table class="rubric" style="margin-top:0">
        <tr><th>Student</th><td>${esc(st.name)}</td><th>Age</th><td>${st.age}</td></tr>
        <tr><th>School / branch</th><td>${esc(st.school||"—")}</td><th>Class</th><td>${esc(st.cls||"—")}</td></tr>
      </table>

      <div class="placement-hero">
        <div class="book-chip" style="background:${F.color}">${F.book}<br><span style="font-size:.9rem;font-weight:700">${subLabel}</span></div>
        <div class="meta">
          <div><b>${F.cefr} · ${F.stage}</b> ${F.pos?("· "+F.pos):""}</div>
          <div class="muted">Recommended sub-level: <b>${subLabel}</b> ${subDesc(F.sub)}</div>
          <div style="margin-top:.4rem">Confidence: <span class="conf ${F.conf}">${F.conf}</span></div>
        </div>
      </div>
      ${F.beyond?`<div class="flag">🎓 Strong across B1 — flag as possibly ready for assessment <b>beyond</b> the Power Up range.</div>`:""}

      <h3>Skill scores</h3>
      <div class="score-grid">
        <div class="score-tile"><div class="v">${F.scores.listening}%</div><div class="l">Listening (30%)</div></div>
        <div class="score-tile"><div class="v">${F.scores.reading}%</div><div class="l">Reading (30%)</div></div>
        <div class="score-tile"><div class="v">${F.scores.wSum}/9</div><div class="l">Writing (20%)</div></div>
        <div class="score-tile"><div class="v">${F.scores.sSum}/9</div><div class="l">Speaking (20%)</div></div>
        <div class="score-tile" style="background:#0f2a47;color:#fff"><div class="v" style="color:#f59e42">${F.weighted}%</div><div class="l" style="color:#cfe0f0">Weighted total</div></div>
      </div>
      <p class="muted">Weighted receptive score (L+R): <b>${F.receptive}%</b> → band ${F.band[0]}–${F.band[1]}% = <b>${TIERS[F.provisionalTier].cefr} (${TIERS[F.provisionalTier].book})</b>. Writing &amp; Speaking confirm the placement (they can lower it, never raise it).</p>

      <div class="rep-cols">
        <div>
          <h3>Strengths</h3>
          <ul>${F.strong.length?F.strong.slice(0,8).map(s=>`<li>${esc(s)}</li>`).join(""):"<li>—</li>"}</ul>
        </div>
        <div>
          <h3>Gaps to revise</h3>
          <ul>${F.gaps.length?F.gaps.slice(0,8).map(s=>`<li>${esc(s)}</li>`).join(""):"<li>None flagged</li>"}</ul>
        </div>
      </div>

      <h3>Recommendation</h3>
      <ul>
        <li><b>Start:</b> ${F.book} — sub-level <b>${subLabel}</b> (${F.cefr} ${F.stage}).</li>
        <li><b>Grammar focus:</b> ${gapsGrammar.length?esc(gapsGrammar.join(", ")):"on track"}.</li>
        <li><b>Vocabulary focus:</b> ${gapsVocab.length?esc(gapsVocab.join(", ")):"on track"}.</li>
        <li><b>Recommended revision:</b> ${esc(revision)}.</li>
        <li><b>Next assessment:</b> re-check after the first sub-level (≈1 month / 12 hours).</li>
      </ul>

      ${F.flags.length?`<h3>Teacher flags</h3>${F.flags.map(f=>`<div class="flag">⚠️ ${esc(f)}</div>`).join("")}`:""}

      <h3 class="no-print">Teacher notes</h3>
      <textarea id="teacherNotes" class="no-print" rows="3" style="width:100%" placeholder="Add any notes…">${esc(S.teacher.notes)}</textarea>
      <div class="print-notes" style="display:none">${esc(S.teacher.notes)}</div>

      <p class="muted" style="margin-top:1.4rem;font-size:.8rem">CEFR-referenced &amp; Cambridge-aligned. Not an official Cambridge English examination. · Monglish International Academy</p>
    </div>`;
    const tn=$("#teacherNotes"); if(tn) tn.addEventListener("input",e=>{S.teacher.notes=e.target.value;});
  }
  function subDesc(s){ return s===1?"(beginning the level)":s===2?"(developing / secure)":"(strong — near ready to move up)"; }
  function esc(x){ return String(x==null?"":x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

  /* ---------------- progress + tabs ---------------- */
  function setTabs(cur){
    const order=["listening","reading","writing","speaking"];
    $$("#sectionTabs span").forEach(sp=>{
      const k=sp.dataset.sec;
      sp.classList.toggle("current",k===cur);
      sp.classList.toggle("done",order.indexOf(k)<order.indexOf(cur));
    });
  }
  function progress(){
    const r=S.rec; let pct=5;
    if(r.skill==="listening") pct=5+(r.b1?15:0);
    if(r.skill==="reading")  pct=35+Math.min(27,(r.answered/10)*27);
    $("#progressFill").style.width=pct+"%";
  }

  /* ---------------- persistence / actions ---------------- */
  function saveLocal(){
    try{
      const key="mpt_results";
      const arr=JSON.parse(localStorage.getItem(key)||"[]");
      const slim={ ...FINAL, notes:S.teacher.notes, savedAt:new Date().toISOString() };
      if(slim.writingUpload) slim.writingUpload={ ...slim.writingUpload, dataUrl:null };  // keep localStorage small
      arr.push(slim);
      localStorage.setItem(key,JSON.stringify(arr));
    }catch(e){/* storage may be disabled */}
  }
  $("#printBtn").addEventListener("click",()=>{
    const pn=document.querySelector(".print-notes"); if(pn) pn.textContent=S.teacher.notes;
    window.print();
  });
  $("#exportBtn").addEventListener("click",()=>{
    const data={...FINAL, notes:S.teacher.notes, exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`placement_${(FINAL.student.name||"student").replace(/\s+/g,"_")}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  });
  $("#restartBtn").addEventListener("click",()=>{ if(confirm("Start a new student? Current result stays saved/exported."))location.reload(); });

})();
