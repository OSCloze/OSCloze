(function () {
  'use strict';

  const STORAGE_KEY_STARS = 'cloze-stars';
  const STORAGE_KEY_CUSTOM = 'cloze-custom-sentences';
  const STORAGE_KEY_EDITS = 'cloze-sentence-edits';
  const STORAGE_KEY_DELETED = 'cloze-deleted-ids';
  const STORAGE_KEY_HIGHLIGHT = 'cloze-highlight-keyword';
  const STORAGE_KEY_THEME = 'cloze-theme';
  const STORAGE_KEY_COLLECTION_NAMES = 'cloze-collection-names';
  const STORAGE_KEY_SHOW_PINYIN = 'cloze-show-pinyin';
  const SESSION_SIZE_OPTIONS = [5, 10, 20];
  const MAX_STARS = 5;
  const BLANK_PLACEHOLDER = '_____';
  const COLLECTION_ALL = '__all__';
  const DEFAULT_SENTENCES = [
    { 
      id: 1, 
      sentence: '你 _____ 吗？', 
      answer: '好', 
      answers: ['好', '好吗'],
      collection: 'HSK 1', 
      nativeSentence: 'How are you?', 
      nativeKeyword: 'How are you', 
      explanation: 'A common greeting. Literally "You good?"',
      pinyin: 'nǐ hǎo ma'
    },
    { 
      id: 2, 
      sentence: '我 _____ 中国。', 
      answer: '爱', 
      answers: ['爱'],
      collection: 'HSK 1', 
      nativeSentence: 'I love China.', 
      nativeKeyword: 'love', 
      explanation: '爱 (ài) means love. Expressing affection for something.',
      pinyin: 'wǒ ài zhōng guó'
    },
    { 
      id: 3, 
      sentence: '今天天气很 _____。', 
      answer: '好', 
      answers: ['好'],
      collection: 'HSK 1', 
      nativeSentence: 'The weather is very good today.', 
      nativeKeyword: 'good', 
      explanation: '很 (hěn) means very, and 好 (hǎo) means good.',
      pinyin: 'jīn tiān tiān qì hěn hǎo'
    },
    { 
      id: 4, 
      sentence: '我 _____ 苹果。', 
      answer: '吃', 
      answers: ['吃'],
      collection: 'HSK 1', 
      nativeSentence: 'I eat apples.', 
      nativeKeyword: 'eat', 
      explanation: '吃 (chī) means "to eat". A basic verb.',
      pinyin: 'wǒ chī píng guǒ'
    },
    { 
      id: 5, 
      sentence: '她 _____ 学生。', 
      answer: '是', 
      answers: ['是'],
      collection: 'HSK 1', 
      nativeSentence: 'She is a student.', 
      nativeKeyword: 'is', 
      explanation: '是 (shì) is the verb "to be". Note Chinese doesn\'t use articles (a/an).',
      pinyin: 'tā shì xué shēng'
    }
  ];

  let allSentences = [];
  let sessionSentences = [];
  let sessionResults = {}; // id -> true (correct) | false (wrong)
  let index = 0;
  let currentAcceptedAnswers = [];

  const el = {
    downloadSaveBtn: document.getElementById('downloadSaveBtn'),
    restoreSaveBtn: document.getElementById('restoreSaveBtn'),
    uploadSaveFile: document.getElementById('uploadSaveFile'),
    restoreConfirm: document.getElementById('restoreConfirm'),
    sentence: document.getElementById('sentence'),
    sentenceNative: document.getElementById('sentenceNative'),
    answer: document.getElementById('answer'),
    check: document.getElementById('check'),
    next: document.getElementById('next'),
    postCheckRow: document.getElementById('postCheckRow'),
    viewExplanation: document.getElementById('viewExplanation'),
    feedback: document.getElementById('feedback'),
    explanation: document.getElementById('explanation'),
    progress: document.getElementById('progress'),
    answerRow: document.getElementById('answerRow'),
    playView: document.getElementById('playView'),
    playContent: document.getElementById('playContent'),
    playGame: document.getElementById('playGame'),
    playReview: document.getElementById('playReview'),
    reviewList: document.getElementById('reviewList'),
    playAgain: document.getElementById('playAgain'),
    playSettingsBtn: document.getElementById('playSettingsBtn'),
    playSettingsModal: document.getElementById('playSettingsModal'),
    playSettingsClose: document.getElementById('playSettingsClose'),
    highlightKeywordPlay: document.getElementById('highlightKeywordPlay'),
    playCount: document.getElementById('playCount'),
    sentencesView: document.getElementById('sentencesView'),
    newCollectionBtn: document.getElementById('newCollectionBtn'),
    newCollectionModal: document.getElementById('newCollectionModal'),
    newCollectionName: document.getElementById('newCollectionName'),
    newCollectionClose: document.getElementById('newCollectionClose'),
    newCollectionCancel: document.getElementById('newCollectionCancel'),
    newCollectionCreate: document.getElementById('newCollectionCreate'),
    lightMode: document.getElementById('lightMode'),
    sentenceList: document.getElementById('sentenceList'),
    openAddSentence: document.getElementById('openAddSentence'),
    sentenceModal: document.getElementById('sentenceModal'),
    modalClose: document.getElementById('modalClose'),
    formSentence: document.getElementById('formSentence'),
    formNativeSentence: document.getElementById('formNativeSentence'),
    formNativeKeyword: document.getElementById('formNativeKeyword'),
    formAnswers: document.getElementById('formAnswers'),
    formExplanation: document.getElementById('formExplanation'),
    insertBlankBtn: document.getElementById('insertBlank'),
    submitSentenceBtn: document.getElementById('submitSentence'),
    cancelEditBtn: document.getElementById('cancelEdit'),
    sentenceFormTitle: document.getElementById('sentenceFormTitle'),
    settingsView: document.getElementById('settingsView'),
    resetProgress: document.getElementById('resetProgress'),
    resetConfirm: document.getElementById('resetConfirm'),
    playConfig: document.getElementById('playConfig'),
    playCollection: document.getElementById('playCollection'),
    playStart: document.getElementById('playStart'),
    filterCollection: document.getElementById('filterCollection'),
    formCollection: document.getElementById('formCollection'),
    formStarRow: document.getElementById('formStarRow'),
    formStarDisplay: document.getElementById('formStarDisplay'),
    resetSingleStar: document.getElementById('resetSingleStar'),
    deleteSentenceBtn: document.getElementById('deleteSentence'),
    navLinks: document.querySelectorAll('.nav-link'),
    formPinyin: document.getElementById('formPinyin')
  };

// Save/Load functionality
function downloadSaveFile() {
  // Collect all localStorage data
  const saveData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      stars: loadStars(),
      customSentences: loadCustomSentences(),
      sentenceEdits: loadSentenceEdits(),
      deletedIds: Array.from(loadDeletedIds()),
      collectionNames: loadCollectionNames(),
      highlightKeyword: getHighlightKeyword(),
      theme: loadTheme(),
      showPinyin: getShowPinyin()
    }
  };
  
  // Convert to JSON string
  const jsonString = JSON.stringify(saveData, null, 2);
  
  // Create download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'oscloze-backup-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function restoreFromFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const saveData = JSON.parse(e.target.result);
      
      // Validate save data format
      if (!saveData.version || !saveData.data) {
        throw new Error('Invalid backup file format');
      }
      
      const data = saveData.data;
      
      // Restore all data
      saveStars(data.stars || {});
      saveCustomSentences(data.customSentences || []);
      saveSentenceEdits(data.sentenceEdits || {});
      saveDeletedIds(new Set(data.deletedIds || []));
      saveCollectionNames(data.collectionNames || []);
      setHighlightKeyword(data.highlightKeyword || false);
      if (data.theme) {
        saveTheme(data.theme);
        applyTheme(data.theme);
        if (el.lightMode) el.lightMode.checked = data.theme === 'light';
      }
      setShowPinyin(data.showPinyin || false);
      
      // Show success message
      if (el.restoreConfirm) {
        el.restoreConfirm.textContent = 'Restore successful! Page will reload...';
        el.restoreConfirm.style.color = 'var(--correct)';
        el.restoreConfirm.hidden = false;
      }
      
      // Refresh the app
      setTimeout(() => {
        location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Restore failed:', error);
      if (el.restoreConfirm) {
        el.restoreConfirm.textContent = 'Restore failed: Invalid file';
        el.restoreConfirm.style.color = 'var(--wrong)';
        el.restoreConfirm.hidden = false;
        setTimeout(() => {
          el.restoreConfirm.hidden = true;
        }, 3000);
      }
    }
  };
  
  reader.readAsText(file);
}

  function loadStars() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STARS);
      if (data) return JSON.parse(data);
    } catch (_) {}
    return {};
  }

  function saveStars(stars) {
    try {
      localStorage.setItem(STORAGE_KEY_STARS, JSON.stringify(stars));
    } catch (_) {}
  }

  function getStarsForId(id) {
    const stars = loadStars();
    const n = parseInt(stars[String(id)], 10);
    return isNaN(n) ? 0 : Math.min(MAX_STARS, Math.max(0, n));
  }

  function addStarForId(id) {
    const stars = loadStars();
    const key = String(id);
    const current = getStarsForId(id);
    if (current < MAX_STARS) {
      stars[key] = current + 1;
      saveStars(stars);
    }
  }

  function clearAllStars() {
    saveStars({});
  }

  function resetStarsForId(id) {
    const stars = loadStars();
    delete stars[String(id)];
    saveStars(stars);
  }

  function renderStars(count) {
    const full = '★';
    const empty = '☆';
    let html = '';
    for (let i = 0; i < MAX_STARS; i++) {
      html += '<span class="star ' + (i < count ? 'filled' : '') + '" aria-hidden="true">' + (i < count ? full : empty) + '</span>';
    }
    return html;
  }

  function normalize(s) {
    return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function getAcceptedAnswers(item) {
    if (item.answers && item.answers.length) return item.answers;
    return [item.answer];
  }

  function isCorrect(given, item) {
    const n = normalize(given);
    const accepted = getAcceptedAnswers(item);
    return accepted.some(function (a) { return normalize(a) === n; });
  }

  function getShowPinyin() {
    try {
      return localStorage.getItem(STORAGE_KEY_SHOW_PINYIN) === 'true';
    } catch (_) {}
    return false; // Default to false
  }
  
  function setShowPinyin(on) {
    try {
      localStorage.setItem(STORAGE_KEY_SHOW_PINYIN, on ? 'true' : 'false');
    } catch (_) {}
  }

  function loadBuiltInSentences() {
    return fetch('sentences.json')
      .then(function (res) {
        if (res.ok) return res.json();
        throw new Error('Not found');
      })
      .catch(function () {
        return DEFAULT_SENTENCES;
      });
  }

  function loadCustomSentences() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  function renderPinyin(item) {
    if (!item || !item.pinyin) return '';
    const showPinyin = getShowPinyin();
    if (!showPinyin) return '';
    return '<div class="sentence-pinyin" aria-label="Pinyin">' + escapeHtml(item.pinyin) + '</div>';
  }

  function saveCustomSentences(list) {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(list));
    } catch (_) {}
  }

  function loadSentenceEdits() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EDITS);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  }

  function saveSentenceEdits(edits) {
    try {
      localStorage.setItem(STORAGE_KEY_EDITS, JSON.stringify(edits));
    } catch (_) {}
  }

  function loadDeletedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED);
      if (raw) return new Set(JSON.parse(raw));
    } catch (_) {}
    return new Set();
  }

  function saveDeletedIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(ids)));
    } catch (_) {}
  }

  function loadCollectionNames() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_COLLECTION_NAMES);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  function saveCollectionNames(names) {
    try {
      localStorage.setItem(STORAGE_KEY_COLLECTION_NAMES, JSON.stringify(names));
    } catch (_) {}
  }

  function addCollectionName(name) {
    var n = (name || '').trim();
    if (!n) return;
    var names = loadCollectionNames();
    if (names.indexOf(n) === -1) {
      names.push(n);
      names.sort();
      saveCollectionNames(names);
    }
  }

  function loadTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY_THEME) || 'light';
    } catch (_) {}
    return 'light';
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (_) {}
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (root) root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  }

  function getHighlightKeyword() {
    try {
      return localStorage.getItem(STORAGE_KEY_HIGHLIGHT) === 'true';
    } catch (_) {}
    return false;
  }

  function setHighlightKeyword(on) {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHT, on ? 'true' : 'false');
    } catch (_) {}
  }

  function renderNativeSentence(item, highlight) {
    const text = item.nativeSentence || '';
    if (!text) return '';
    const kw = (highlight && item.nativeKeyword) ? item.nativeKeyword.trim() : '';
    if (!kw) return escapeHtml(text);
    const idx = text.indexOf(kw);
    if (idx === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx)) + '<span class="keyword-highlight">' + escapeHtml(kw) + '</span>' + escapeHtml(text.slice(idx + kw.length));
  }

  function mergeAllSentences(builtIn, custom, edits) {
    const deleted = loadDeletedIds();
    const merged = builtIn
      .filter(function (s) { return !deleted.has(String(s.id)); })
      .map(function (s) {
        const e = edits[String(s.id)];
        if (e) return { 
          id: s.id, 
          isCustom: false, 
          collection: e.collection != null ? e.collection : (s.collection || ''), 
          sentence: e.sentence || s.sentence, 
          answer: e.answer != null ? e.answer : s.answer, 
          answers: e.answers != null ? e.answers : s.answers, 
          nativeSentence: e.nativeSentence != null ? e.nativeSentence : s.nativeSentence, 
          nativeKeyword: e.nativeKeyword != null ? e.nativeKeyword : s.nativeKeyword, 
          explanation: e.explanation != null ? e.explanation : s.explanation,
          pinyin: e.pinyin != null ? e.pinyin : s.pinyin || ''  // Add pinyin field
        };
        return { ...s, isCustom: false, collection: s.collection || '', pinyin: s.pinyin || '' };
      });
    const customFiltered = custom.filter(function (s) { return !deleted.has(String(s.id)); });
    customFiltered.forEach(function (s) { 
      s.isCustom = true; 
      if (s.collection == null) s.collection = '';
      if (s.pinyin == null) s.pinyin = '';  // Ensure pinyin exists
    });
    return merged.concat(customFiltered);
  }

  function getCollectionDisplay(c) {
    return (c || '').trim() || 'Default';
  }

  function getCollections() {
    var set = new Set(loadCollectionNames());
    allSentences.forEach(function (s) {
      var c = (s.collection || '').trim();
      set.add(c || 'Default');
    });
    return Array.from(set).sort();
  }

  function loadSentences() {
    return loadBuiltInSentences().then(function (builtIn) {
      const custom = loadCustomSentences();
      const edits = loadSentenceEdits();
      allSentences = mergeAllSentences(builtIn, custom, edits);
      return allSentences;
    }).catch(function () {
      const custom = loadCustomSentences();
      const edits = loadSentenceEdits();
      allSentences = mergeAllSentences(DEFAULT_SENTENCES, custom, edits);
      return allSentences;
    });
  }

  function primaryAnswer(item) {
    const a = getAcceptedAnswers(item);
    return a[0] || item.answer || '';
  }

  function showQuestion() {
    console.log('showQuestion called');
    const item = sessionSentences[index];
    if (!item) {
      showSessionReview();
      return;
    }
    
    if (el.playContent) el.playContent.className = 'play-content play-content--game';
    currentAcceptedAnswers = getAcceptedAnswers(item);
    
    // Render pinyin if enabled
    const pinyinHtml = renderPinyin(item);
    
    // Split the sentence at the blank
    const parts = item.sentence.split(/_{2,}/);
    const before = escapeHtml(parts[0] || '');
    const after = escapeHtml(parts[1] || '');
    
    // Calculate input width based on answer length
    const answerLength = Array.from(primaryAnswer(item)).length;
    const inputWidth = Math.max(answerLength, 3); // at least 3em
    
    // Build the sentence with an inline input field
    const sentenceHtml = pinyinHtml + before + 
      '<input type="text" id="inlineAnswerInput" class="inline-answer-input" ' +
      'style="width: ' + inputWidth + 'em;" ' +
      'placeholder="" value="" autocomplete="off">' + 
      after;
    
    el.sentence.innerHTML = sentenceHtml;
    console.log('Sentence HTML set:', sentenceHtml);
    
    // Set native sentence if available
    if (el.sentenceNative) {
      const highlight = getHighlightKeyword();
      el.sentenceNative.innerHTML = renderNativeSentence(item, highlight);
    }
    
    // Hide the original answer input (we won't use it anymore)
    el.answer.style.display = 'none';
    el.answer.value = ''; // clear it
    
    // Get the inline input and set up event listeners
    const inlineInput = document.getElementById('inlineAnswerInput');
    if (inlineInput) {
      console.log('Inline input found, focusing...');
      inlineInput.focus();
      
      // Sync value with hidden input (for backward compatibility)
      inlineInput.addEventListener('input', function(e) {
        el.answer.value = e.target.value;
      });
      
// Handle Enter key
inlineInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation(); // Add this to prevent event from bubbling to document
    onCheck();
  }
});
    } else {
      console.log('ERROR: Inline input not found');
    }
    
    el.check.hidden = false;
    if (el.postCheckRow) el.postCheckRow.hidden = true;
    el.feedback.hidden = true;
    el.feedback.className = 'feedback';
    el.explanation.hidden = true;
    el.progress.textContent = 'Question ' + (index + 1) + ' of ' + sessionSentences.length;
    if (el.answerRow) el.answerRow.hidden = false;
  }

  function fullSentence(item) {
    return item.sentence.replace(/_{2,}/g, primaryAnswer(item));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickSessionSentences(size, collectionFilter) {
    let pool = allSentences;
    if (collectionFilter && collectionFilter !== COLLECTION_ALL) {
      pool = allSentences.filter(function (s) {
        const c = (s.collection || '').trim();
        return (c || 'Default') === collectionFilter;
      });
    }
    if (pool.length === 0) return [];
    if (pool.length <= size) return shuffle(pool);
    return shuffle(pool).slice(0, size);
  }

  function showView(name) {
    document.querySelectorAll('.view').forEach(function (view) {
      view.classList.toggle('is-active', view.getAttribute('data-view') === name);
    });
    el.navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-view') === name);
    });
    if (name === 'sentences') {
      renderSentencesList();
    }
    if (name === 'play') showPlayConfig();
    if (name === 'settings') {
      if (el.resetConfirm) el.resetConfirm.hidden = true;
    }
  }

  function showPlayConfig() {
    if (el.playContent) el.playContent.className = 'play-content play-content--config';
    const collections = getCollections();
    if (el.playCollection) {
      el.playCollection.innerHTML = '<option value="' + COLLECTION_ALL + '">All sentences</option>';
      collections.forEach(function (c) {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        el.playCollection.appendChild(opt);
      });
    }
    if (el.playCount) el.playCount.value = '5';
  }

  function startPlaySession() {
    var size = 5;
    if (el.playCount) size = parseInt(el.playCount.value, 10) || 5;
    var collectionFilter = el.playCollection && el.playCollection.value ? el.playCollection.value : COLLECTION_ALL;
    sessionSentences = pickSessionSentences(size, collectionFilter);
    sessionResults = {};
    index = 0;
    if (el.playContent) el.playContent.className = 'play-content play-content--game';
    if (sessionSentences.length === 0) {
      if (el.sentence) el.sentence.textContent = 'No sentences in this collection. Choose another or add sentences.';
      if (el.sentenceNative) el.sentenceNative.textContent = '';
      if (el.answerRow) el.answerRow.hidden = true;
      return;
    }
    showQuestion();
  }

  // function renderSentenceWithBlank(item) {
  //   const primary = primaryAnswer(item);
    
  //   // Count characters properly (including Chinese)
  //   const charCount = Array.from(primary).length;
    
  //   // Use exact character count for blank size
  //   // Each Chinese character needs about 1.2em width, but we'll use 1em per character
  //   const blankWidth = Math.max(charCount, 1); // At least 1 character wide
    
  //   const parts = item.sentence.split(/_{2,}/);
  //   const before = escapeHtml(parts[0] || '');
  //   const after  = escapeHtml(parts[1] || '');
    
  //   return (
  //     before +
  //     '<span class="inline-blank" id="inlineBlank" tabindex="0" role="textbox" aria-label="Type the missing word" style="min-width:' + blankWidth + 'em; width: auto; display: inline-block;">' +
  //     '<span class="inline-blank-cursor" aria-hidden="true"></span>' +
  //     '</span>' +
  //     after
  //   );
  // }

  // function updateInlineBlank() {
  //   const blank = document.getElementById('inlineBlank');
  //   if (!blank) return;
    
  //   // Get the current cursor position to preserve it
  //   const cursorPos = el.answer.selectionStart;
  //   const val = el.answer.value;
  //   const cursor = '<span class="inline-blank-cursor" aria-hidden="true"></span>';
  
  //   if (!val) {
  //     blank.innerHTML = cursor;
  //     blank.classList.remove('has-text');
  //     return;
  //   }
  
  //   blank.classList.add('has-text');
    
  //   // Simply display the text as-is
  //   blank.innerHTML = escapeHtml(val) + cursor;
    
  //   // Try to restore cursor position (though this is tricky with IME)
  //   // This helps but isn't perfect
  //   setTimeout(function() {
  //     if (document.activeElement === el.answer) {
  //       el.answer.setSelectionRange(cursorPos, cursorPos);
  //     }
  //   }, 0);
  // }

  // function setupInlineBlankFocus() {
  //   // clicking/focusing the blank span focuses the hidden real input
  //   document.addEventListener('click', function (e) {
  //     if (e.target && (e.target.id === 'inlineBlank' || e.target.closest('#inlineBlank'))) {
  //       el.answer.focus();
  //     }
  //   });
  //   document.addEventListener('keydown', function (e) {
  //     if (e.target && (e.target.id === 'inlineBlank')) {
  //       el.answer.focus();
  //     }
  //   });
  //   // When the hidden input is focused, show active state on blank
  //   el.answer.addEventListener('focus', function () {
  //     const blank = document.getElementById('inlineBlank');
  //     if (blank) blank.classList.add('is-focused');
  //   });
  //   el.answer.addEventListener('blur', function () {
  //     const blank = document.getElementById('inlineBlank');
  //     if (blank) blank.classList.remove('is-focused');
  //   });
  // }


  function showSessionReview() {
    if (el.playContent) el.playContent.className = 'play-content play-content--review';
    el.reviewList.innerHTML = '';
    const showPinyin = getShowPinyin();
    
    sessionSentences.forEach(function (item) {
      const wasCorrect = sessionResults[item.id];
      const stars = getStarsForId(item.id);
      const li = document.createElement('li');
      li.className = 'review-item ' + (wasCorrect ? 'review-item--correct' : 'review-item--wrong');
      
      // Get the sentence parts
      const parts = item.sentence.split(/_{2,}/);
      const before = escapeHtml(parts[0] || '');
      const after = escapeHtml(parts[1] || '');
      const answer = escapeHtml(primaryAnswer(item));
      
      // Build the sentence with the answer highlighted
      const sentenceWithHighlight = before + 
        '<span class="review-answer-highlight">' + answer + '</span>' + 
        after;
      
      let reviewHtml = 
        '<div class="review-item-header">' +
          '<span class="review-badge ' + (wasCorrect ? 'review-badge--correct' : 'review-badge--wrong') + '">' +
            (wasCorrect ? '✓ Correct' : '✗ Incorrect') +
          '</span>' +
          '<span class="review-item-stars" aria-label="' + stars + ' of ' + MAX_STARS + ' stars">' + renderStars(stars) + '</span>' +
        '</div>';
      
      // Add pinyin if enabled
      if (showPinyin && item.pinyin) {
        reviewHtml += '<div class="review-pinyin">' + escapeHtml(item.pinyin) + '</div>';
      }
      
      // Add the sentence with highlighted answer
      reviewHtml += '<p class="review-sentence">' + sentenceWithHighlight + '</p>';
      
      // Add native sentence (without keyword highlight)
      if (item.nativeSentence) {
        reviewHtml += '<p class="review-native">' + escapeHtml(item.nativeSentence) + '</p>';
      }
      
      // No explanation shown
      
      li.innerHTML = reviewHtml;
      el.reviewList.appendChild(li);
    });
  }

  function getNextCustomId() {
    const custom = loadCustomSentences();
    let max = 1000;
    custom.forEach(function (s) {
      if (typeof s.id === 'number' && s.id >= max) max = s.id + 1;
    });
    return max;
  }

  function parseAnswersInput(text) {
    return text.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function displayAnswers(item) {
    const a = getAcceptedAnswers(item);
    return a.length > 1 ? a.join(', ') : a[0] || '';
  }

  function openModal() {
    if (el.sentenceModal) el.sentenceModal.hidden = false;
  }

  function closeModal() {
    if (el.sentenceModal) el.sentenceModal.hidden = true;
  }

  function openAddForm() {
    sentenceEditingId = null;
    el.formSentence.value = '';
    el.formNativeSentence.value = '';
    el.formNativeKeyword.value = '';
    el.formAnswers.value = '';
    el.formExplanation.value = '';
    el.formPinyin.value = '';  // Add pinyin field reset
    el.sentenceFormTitle.textContent = 'Add sentence';
    if (el.deleteSentenceBtn) el.deleteSentenceBtn.hidden = true;
    if (el.formStarRow) el.formStarRow.hidden = true;
    populateCollectionSelect('');
    openModal();
  }

  function openEditForm(item) {
    sentenceEditingId = item.id;
    el.formSentence.value = item.sentence || '';
    el.formNativeSentence.value = item.nativeSentence || '';
    el.formNativeKeyword.value = item.nativeKeyword || '';
    el.formAnswers.value = Array.isArray(item.answers) ? item.answers.join(', ') : (item.answer || '');
    el.formExplanation.value = item.explanation || '';
    el.formPinyin.value = item.pinyin || '';  // Add pinyin field
    el.sentenceFormTitle.textContent = 'Edit sentence';
    if (el.deleteSentenceBtn) el.deleteSentenceBtn.hidden = false;
    // Show star display
    if (el.formStarRow) el.formStarRow.hidden = false;
    if (el.formStarDisplay) {
      el.formStarDisplay.innerHTML = renderStars(getStarsForId(item.id));
    }
    populateCollectionSelect((item.collection || '').trim());
    openModal();
  }

  function populateCollectionSelect(selectedValue) {
    if (!el.formCollection) return;
    el.formCollection.innerHTML = '';
    // Blank option for "no collection" / new entry
    var blankOpt = document.createElement('option');
    blankOpt.value = '';
    blankOpt.textContent = '— Select or type new —';
    el.formCollection.appendChild(blankOpt);
    getCollections().forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      el.formCollection.appendChild(opt);
    });
    el.formCollection.value = selectedValue || '';
  }

  function deleteSentenceById(id) {
    if (id == null) return;
    var item = allSentences.find(function (s) { return s.id === id; });
    if (item && item.isCustom) {
      var custom = loadCustomSentences().filter(function (s) { return s.id !== id; });
      saveCustomSentences(custom);
    } else {
      var deleted = loadDeletedIds();
      deleted.add(String(id));
      saveDeletedIds(deleted);
    }
    closeModal();
    sentenceEditingId = null;
    refreshAllSentences();
  }

  function cancelEdit() {
    closeModal();
    sentenceEditingId = null;
  }

  function insertBlankAtCursor() {
    const ta = el.formSentence;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    ta.value = before + BLANK_PLACEHOLDER + after;
    ta.selectionStart = ta.selectionEnd = start + BLANK_PLACEHOLDER.length;
    ta.focus();
  }

  function refreshAllSentences() {
    loadBuiltInSentences().then(function (builtInData) {
      allSentences = mergeAllSentences(builtInData, loadCustomSentences(), loadSentenceEdits());
      renderSentencesList();
    }).catch(function () {
      allSentences = mergeAllSentences(DEFAULT_SENTENCES, loadCustomSentences(), loadSentenceEdits());
      renderSentencesList();
    });
  }

  function saveSentenceFromForm() {
    const sentenceText = el.formSentence.value.trim();
    const nativeSentence = el.formNativeSentence.value.trim();
    const nativeKeyword = el.formNativeKeyword.value.trim();
    const answers = parseAnswersInput(el.formAnswers.value);
    const explanation = el.formExplanation.value.trim();
    const pinyin = el.formPinyin.value.trim();  // Add pinyin field
    
    if (!sentenceText) return;
    if (answers.length === 0) return;
    if (sentenceText.indexOf(BLANK_PLACEHOLDER) === -1) return;
  
    const collection = (el.formCollection && el.formCollection.value) ? el.formCollection.value.trim() : '';
    if (collection) addCollectionName(collection);
    const payload = { 
      collection: collection || '', 
      sentence: sentenceText, 
      nativeSentence: nativeSentence || '', 
      nativeKeyword: nativeKeyword || '', 
      answer: answers[0], 
      answers: answers, 
      explanation: explanation || '',
      pinyin: pinyin || ''  // Add pinyin field
    };
  
    if (sentenceEditingId != null) {
      const item = allSentences.find(function (s) { return s.id === sentenceEditingId; });
      if (item && item.isCustom) {
        const custom = loadCustomSentences();
        const idx = custom.findIndex(function (s) { return s.id === sentenceEditingId; });
        if (idx !== -1) {
          custom[idx] = { id: sentenceEditingId, ...payload };
          saveCustomSentences(custom);
        }
      } else {
        const edits = loadSentenceEdits();
        edits[String(sentenceEditingId)] = payload;
        saveSentenceEdits(edits);
      }
      cancelEdit();
    } else {
      const custom = loadCustomSentences();
      custom.push({ id: getNextCustomId(), ...payload });
      saveCustomSentences(custom);
      closeModal();
      sentenceEditingId = null;
    }
    refreshAllSentences();
  }

  let sentenceEditingId = null;

  function renderSentencesList() {
    // Group sentences by collection
    const collections = {};
    allSentences.forEach(function(item) {
      const collName = getCollectionDisplay(item.collection);
      if (!collections[collName]) {
        collections[collName] = [];
      }
      collections[collName].push(item);
    });
    
    // Sort collection names
    const sortedCollections = Object.keys(collections).sort();
    
    // Clear and rebuild the list
    el.sentenceList.innerHTML = '';
    
    if (sortedCollections.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'sentence-list-empty';
      emptyLi.textContent = 'No sentences yet. Click "Add sentence" to create one.';
      el.sentenceList.appendChild(emptyLi);
      return;
    }
    
    // Create collection accordion
    sortedCollections.forEach(function(collName) {
      const sentences = collections[collName];
      const collectionId = 'coll-' + collName.replace(/\s+/g, '-').toLowerCase();
      
      const collectionLi = document.createElement('li');
      collectionLi.className = 'collection-item';
      collectionLi.dataset.collection = collName;
      
      // Collection header
      const headerDiv = document.createElement('div');
      headerDiv.className = 'collection-header';
      headerDiv.setAttribute('aria-expanded', 'false');
      headerDiv.setAttribute('aria-controls', collectionId + '-sentences');
      
      headerDiv.innerHTML = 
        '<span class="collection-expand-icon">▶</span>' +
        '<span class="collection-name">' + escapeHtml(collName) + '</span>' +
        '<span class="collection-count">' + sentences.length + ' sentence' + (sentences.length !== 1 ? 's' : '') + '</span>';
      
      headerDiv.addEventListener('click', function() {
        const isExpanded = headerDiv.getAttribute('aria-expanded') === 'true';
        const newExpanded = !isExpanded;
        headerDiv.setAttribute('aria-expanded', newExpanded);
        
        // Toggle icon
        const icon = headerDiv.querySelector('.collection-expand-icon');
        if (icon) {
          icon.textContent = newExpanded ? '▼' : '▶';
        }
        
        // Toggle sentences container
        const sentencesContainer = document.getElementById(collectionId + '-sentences');
        if (sentencesContainer) {
          sentencesContainer.hidden = !newExpanded;
        }
      });
      
      collectionLi.appendChild(headerDiv);
      
      // Sentences container
      const sentencesDiv = document.createElement('div');
      sentencesDiv.id = collectionId + '-sentences';
      sentencesDiv.className = 'collection-sentences';
      sentencesDiv.hidden = true;
      
// Add each sentence in this collection
sentences.forEach(function(item) {
  const stars = getStarsForId(item.id);
  const pinyinHtml = item.pinyin ? '<div class="item-pinyin">' + escapeHtml(item.pinyin) + '</div>' : '';
  
  // Create a visual representation of the blank with correct length
  const answer = primaryAnswer(item);
  const blankLength = Array.from(answer).length;
  const blankVisual = '_'.repeat(blankLength); 
  
  // Replace the blank in the sentence with the visual underscores
  let displaySentence = item.sentence;
  if (displaySentence.includes(BLANK_PLACEHOLDER)) {
    displaySentence = displaySentence.replace(BLANK_PLACEHOLDER, 
      '<span class="sentence-blank">' + blankVisual + '</span>');
  }
  
  const sentenceDiv = document.createElement('div');
  sentenceDiv.className = 'collection-sentence-item';
  sentenceDiv.dataset.id = item.id;
  
  sentenceDiv.innerHTML =
    '<div class="item-main">' +
      '<div class="item-meta">' +
        '<span class="item-stars" aria-label="' + stars + ' of ' + MAX_STARS + ' stars">' + renderStars(stars) + '</span>' +
      '</div>' +
      '<p class="item-text">' + displaySentence + '</p>' +
      pinyinHtml +
    '</div>' +
    '<button type="button" class="btn btn-secondary btn-sm item-edit" data-id="' + escapeHtml(String(item.id)) + '">Edit</button>';
  
  sentencesDiv.appendChild(sentenceDiv);
});
      
      collectionLi.appendChild(sentencesDiv);
      el.sentenceList.appendChild(collectionLi);
    });
    
    // Re-attach edit button listeners
    el.sentenceList.querySelectorAll('.item-edit').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent triggering collection header
        var id = btn.getAttribute('data-id');
        var numId = parseInt(id, 10);
        var item = allSentences.find(function (s) { return String(s.id) === id || s.id === numId; });
        if (item) openEditForm(item);
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function onCheck() {
    const item = sessionSentences[index];
    const given = el.answer.value; // value is synced from inline input
    if (!item || given.trim() === '') return;
  
    const correct = isCorrect(given, item);
    if (correct) addStarForId(item.id);
    sessionResults[item.id] = correct;
  
    el.check.hidden = true;
    if (el.answerRow) el.answerRow.hidden = true;
  
    // Build feedback with stars
    const starCount = getStarsForId(item.id);
    const starsHtml = correct
      ? '<span class="feedback-stars" aria-label="' + starCount + ' of ' + MAX_STARS + ' stars">' + renderStars(starCount) + '</span>'
      : '';
    const msg = correct
      ? 'Correct! +1 star ' + starsHtml
      : 'Not quite.';
  
    el.feedback.innerHTML = msg;
    el.feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
    el.feedback.hidden = false;
  
    // Show Next + View Explanation row
    if (el.postCheckRow) el.postCheckRow.hidden = false;
  
    if (el.viewExplanation) {
      el.viewExplanation.hidden = !item.explanation;
      el.viewExplanation.textContent = 'View Explanation';
    }
  
    el.explanation.hidden = true;
    el.explanation.textContent = item.explanation || '';
  
    // Update the sentence to show the result (replace input with answer display)
    const pinyinHtml = renderPinyin(item);
    const parts = item.sentence.split(/_{2,}/);
    const before = escapeHtml(parts[0] || '');
    const after = escapeHtml(parts[1] || '');
    
    if (correct) {
      el.sentence.innerHTML = pinyinHtml + before + 
        '<span class="answer-correct">' + escapeHtml(given) + '</span>' + 
        after;
    } else {
      el.sentence.innerHTML = pinyinHtml + before + 
        '<span class="answer-wrong">' + escapeHtml(given) + '</span>' +
        '<span class="answer-correct">' + escapeHtml(primaryAnswer(item)) + '</span>' + 
        after;
    }
  }

  function onNext() {
    index += 1;
    if (index >= sessionSentences.length) {
      showSessionReview();
      return;
    }
    
    // Reset for next question
    el.answer.value = '';
    el.answer.disabled = false;
    showQuestion();
  }

  function onResetProgress() {
    clearAllStars();
    if (el.resetConfirm) {
      el.resetConfirm.hidden = false;
    }
    renderSentencesList();
  }

  function syncShowPinyinCheckbox() {
    if (el.showPinyinToggle) el.showPinyinToggle.checked = getShowPinyin();
  }

  function syncHighlightPlayCheckbox() {
    if (el.highlightKeywordPlay) el.highlightKeywordPlay.checked = getHighlightKeyword();
  }

  function openPlaySettingsModal() {
    syncHighlightPlayCheckbox();
    if (el.playSettingsModal) el.playSettingsModal.hidden = false;
  }

  function closePlaySettingsModal() {
    if (el.playSettingsModal) el.playSettingsModal.hidden = true;
  }

  function openNewCollectionModal() {
    if (el.newCollectionName) el.newCollectionName.value = '';
    if (el.newCollectionModal) el.newCollectionModal.hidden = false;
    if (el.newCollectionName) el.newCollectionName.focus();
  }

  function closeNewCollectionModal() {
    if (el.newCollectionModal) el.newCollectionModal.hidden = true;
  }

  function createNewCollection() {
    var name = el.newCollectionName && el.newCollectionName.value ? el.newCollectionName.value.trim() : '';
    if (!name) return;
    addCollectionName(name);
    closeNewCollectionModal();
    if (el.filterCollection) el.filterCollection.value = name;
    renderSentencesList();
  }

  function init() {
    applyTheme(loadTheme());
    if (el.lightMode) {
      el.lightMode.checked = loadTheme() === 'light';
      el.lightMode.addEventListener('change', function () {
        var theme = el.lightMode.checked ? 'light' : 'dark';
        saveTheme(theme);
        applyTheme(theme);
      });
    }
    
    // Add pinyin toggle listener
    if (el.showPinyinToggle) {
      el.showPinyinToggle.addEventListener('change', function () {
        setShowPinyin(el.showPinyinToggle.checked);
        // If currently in game view, refresh the current question to show/hide pinyin
        if (el.playContent && el.playContent.classList.contains('play-content--game') && sessionSentences[index]) {
          showQuestion();
        }
        // If in review view, refresh the review
        if (el.playContent && el.playContent.classList.contains('play-content--review')) {
          showSessionReview();
        }
      });
    }
    
    if (el.playSettingsBtn) el.playSettingsBtn.addEventListener('click', openPlaySettingsModal);
    if (el.playSettingsClose) el.playSettingsClose.addEventListener('click', closePlaySettingsModal);
    
// Save/Load functionality
if (el.downloadSaveBtn) {
  el.downloadSaveBtn.addEventListener('click', downloadSaveFile);
}

if (el.restoreSaveBtn) {
  el.restoreSaveBtn.addEventListener('click', function() {
    document.getElementById('uploadSaveFile').click();
  });
}

if (el.uploadSaveFile) {
  el.uploadSaveFile.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      restoreFromFile(e.target.files[0]);
    }
    // Reset file input so same file can be selected again
    e.target.value = '';
  });
}


    // Update play settings modal to include pinyin toggle
    if (el.highlightKeywordPlay) {
      el.highlightKeywordPlay.addEventListener('change', function () {
        setHighlightKeyword(el.highlightKeywordPlay.checked);
        if (el.playContent && el.playContent.classList.contains('play-content--game') && el.sentenceNative && sessionSentences[index]) {
          el.sentenceNative.innerHTML = renderNativeSentence(sessionSentences[index], getHighlightKeyword());
        }
      });
    }
    
    if (el.newCollectionBtn) el.newCollectionBtn.addEventListener('click', openNewCollectionModal);
    if (el.newCollectionClose) el.newCollectionClose.addEventListener('click', closeNewCollectionModal);
    if (el.newCollectionCancel) el.newCollectionCancel.addEventListener('click', closeNewCollectionModal);
    if (el.newCollectionCreate) el.newCollectionCreate.addEventListener('click', createNewCollection);
    if (el.openAddSentence) el.openAddSentence.addEventListener('click', openAddForm);
    if (el.modalClose) el.modalClose.addEventListener('click', closeModal);
    loadSentences().then(function () {
      showView('play');
    });
  
    el.navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showView(link.getAttribute('data-view'));
      });
    });
  
    el.check.addEventListener('click', onCheck);
    el.next.addEventListener('click', onNext);
    if (el.viewExplanation) {
      el.viewExplanation.addEventListener('click', function () {
        el.explanation.hidden = !el.explanation.hidden;
        el.viewExplanation.textContent = el.explanation.hidden ? 'View Explanation' : 'Hide Explanation';
      });
    }
    if (el.playAgain) el.playAgain.addEventListener('click', showPlayConfig);
    if (el.playStart) el.playStart.addEventListener('click', startPlaySession);
    if (el.deleteSentenceBtn) el.deleteSentenceBtn.addEventListener('click', function () { if (sentenceEditingId != null && confirm('Delete this sentence?')) deleteSentenceById(sentenceEditingId); });
    if (el.resetSingleStar) el.resetSingleStar.addEventListener('click', function () {
      if (sentenceEditingId == null) return;
      resetStarsForId(sentenceEditingId);
      if (el.formStarDisplay) el.formStarDisplay.innerHTML = renderStars(0);
      renderSentencesList();
    });
    if (el.resetProgress) el.resetProgress.addEventListener('click', onResetProgress);
    if (el.insertBlankBtn) el.insertBlankBtn.addEventListener('click', insertBlankAtCursor);
    if (el.submitSentenceBtn) el.submitSentenceBtn.addEventListener('click', saveSentenceFromForm);
    if (el.cancelEditBtn) el.cancelEditBtn.addEventListener('click', cancelEdit);
    let isComposing = false;  // Track IME composition state
    
    // Handle input events - but skip during IME composition
    el.answer.addEventListener('input', function (e) {
      // Don't update during IME composition - wait until compositionend
      if (!isComposing) {
        updateInlineBlank();
      }
    });

// Add global Enter key handler
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  
  // If we're in a game session
  if (sessionSentences.length > 0 && index < sessionSentences.length) {
    // Check if the inline input exists (we haven't answered yet)
    const inlineInput = document.getElementById('inlineAnswerInput');
    
    if (inlineInput) {
      // If Enter was pressed in the inline input, let its own handler deal with it
      if (e.target.id === 'inlineAnswerInput') {
        return; // Don't do anything - let the inline input's handler call onCheck()
      }
      
      // Enter pressed elsewhere - trigger check
      e.preventDefault();
      onCheck();
    } else {
      // Input is gone (we've answered) - trigger next
      e.preventDefault();
      onNext();
    }
  }
});
  

    setupInlineBlankFocus();
  }

  init();
})();
