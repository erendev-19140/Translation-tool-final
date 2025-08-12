// New, refactored translator code (logic unchanged, names different)
(function(){
  const srcInput = document.querySelector('.input-area');
  const tgtOutput = document.querySelector('.output-area');
  const swapBtn  = document.querySelector('.swap-btn');
  const srcSel   = document.querySelector('.src-select');
  const tgtSel   = document.querySelector('.tgt-select');
  const translateBtn = document.querySelector('.action-translate');
  const voiceBtn = document.getElementById('voice-toggle');

  const speakButtons = document.querySelectorAll('.speaker');
  const copyButtons = document.querySelectorAll('.copy');

  // populate selects
  (function fillLanguages(){
    Object.keys(LANGUAGES).forEach(code => {
      const label = LANGUAGES[code];
      const optSrc = document.createElement('option');
      const optTgt = document.createElement('option');
      optSrc.value = code; optSrc.textContent = label;
      optTgt.value = code; optTgt.textContent = label;
      // defaults: source = en-GB, target = hi-IN
      if(code === 'en-GB') optSrc.selected = true;
      if(code === 'hi-IN') optTgt.selected = true;
      srcSel.appendChild(optSrc);
      tgtSel.appendChild(optTgt);
    });
  })();

  // swap action
  swapBtn.addEventListener('click', () => {
    const tmpText = srcInput.value;
    const tmpSel  = srcSel.value;
    srcInput.value = tgtOutput.value;
    tgtOutput.value = tmpText;
    srcSel.value = tgtSel.value;
    tgtSel.value = tmpSel;
  });

  // clear output when input emptied
  srcInput.addEventListener('input', () => {
    if(!srcInput.value.trim()){
      tgtOutput.value = '';
    }
  });

  // translate using MyMemory API
  translateBtn.addEventListener('click', () => {
    const q = srcInput.value.trim();
    const from = srcSel.value;
    const to = tgtSel.value;
    if(!q) return;
    tgtOutput.setAttribute('placeholder','Translating...');
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${from}|${to}`;
    fetch(url).then(r => r.json()).then(resp => {
      const primary = resp && resp.responseData && resp.responseData.translatedText;
      tgtOutput.value = primary || '';
      if(Array.isArray(resp.matches)){
        resp.matches.forEach(m => {
          if(m && m.id === 0 && m.translation) tgtOutput.value = m.translation;
        });
      }
      tgtOutput.setAttribute('placeholder','Translation');
    }).catch(()=> {
      tgtOutput.setAttribute('placeholder','Translation');
      tgtOutput.value = '';
      alert('Translation failed. Check your connection.');
    });
  });

  // copy and speak handlers
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const side = btn.dataset.side;
      const text = (side === 'src') ? srcInput.value : tgtOutput.value;
      if(!text) return;
      navigator.clipboard.writeText(text).catch(()=>{/*ignore*/});
    });
  });

  speakButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const side = btn.dataset.side;
      const text = (side === 'src') ? srcInput.value : tgtOutput.value;
      if(!text) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = (side === 'src') ? srcSel.value : tgtSel.value;
      speechSynthesis.speak(utter);
    });
  });

  /* ===== Desktop Speech-to-Text (Web Speech API) ===== */
  function isSpeechRecogAvailable(){
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  if(voiceBtn && isSpeechRecogAvailable()){
    // prefer standard if available
    const Recognizer = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new Recognizer();
    recog.interimResults = true;

    voiceBtn.addEventListener('click', () => {
      // restartable: set language from select
      recog.lang = srcSel.value || 'en-GB';
      srcInput.value = '';
      try{
        recog.start();
        voiceBtn.textContent = '🎙 Listening...';
      }catch(e){}
    });

    recog.onresult = (evt) => {
      const parts = Array.from(evt.results).map(r => r[0].transcript);
      srcInput.value = parts.join('');
    };

    recog.onend = () => {
      voiceBtn.textContent = '🎤 Speak';
    };

    recog.onerror = () => {
      voiceBtn.textContent = '🎤 Speak';
    };
  } else {
    // if not supported, keep button hidden visually is handled by CSS but add fallback text
    if(voiceBtn) voiceBtn.style.display = 'none';
  }
})();