(function () {
  'use strict';

  const STORAGE_KEY_STARS = 'cloze-stars';
  const STORAGE_KEY_CUSTOM = 'cloze-custom-sentences';
  const STORAGE_KEY_EDITS = 'cloze-sentence-edits';
  const STORAGE_KEY_DELETED = 'cloze-deleted-ids';
  const STORAGE_KEY_HIGHLIGHT = 'cloze-highlight-keyword';
  const STORAGE_KEY_THEME = 'cloze-theme';
  const STORAGE_KEY_COLLECTION_NAMES = 'cloze-collection-names';
  const SESSION_SIZE_OPTIONS = [5, 10, 20];
  const MAX_STARS = 5;
  const BLANK_PLACEHOLDER = '_____';
  const COLLECTION_ALL = '__all__';
  const DEFAULT_SENTENCES = [
    { id: 1, sentence: 'The capital of France is _____.', answer: 'Paris', collection: 'Default', nativeSentence: 'The capital of France is Paris.', nativeKeyword: 'Paris', explanation: 'Paris is the capital and largest city of France.' },
    { id: 2, sentence: 'Water _____ at 100 degrees Celsius at sea level.', answer: 'boils', collection: 'Default', nativeSentence: 'Water boils at 100 degrees Celsius at sea level.', nativeKeyword: 'boils', explanation: 'At standard atmospheric pressure, water boils at 100°C (212°F).' },
    { id: 3, sentence: 'The _____ is the largest planet in our solar system.', answer: 'Jupiter', collection: 'Default', nativeSentence: 'Jupiter is the largest planet in our solar system.', nativeKeyword: 'Jupiter', explanation: 'Jupiter has more than twice the mass of all other planets combined.' },
    { id: 4, sentence: 'Photosynthesis allows plants to convert _____ into energy.', answer: 'sunlight', collection: 'Default', nativeSentence: 'Photosynthesis allows plants to convert sunlight into energy.', nativeKeyword: 'sunlight', explanation: 'Plants use sunlight, water, and CO₂ to produce glucose and oxygen.' },
    { id: 5, sentence: 'The Great Wall of China was built to _____ against invasions.', answer: 'protect', collection: 'Default', nativeSentence: 'The Great Wall of China was built to protect against invasions.', nativeKeyword: 'protect', explanation: 'It was constructed over centuries to defend northern borders.' }
  ];

  let allSentences = [];
  let sessionSentences = [];
  let index = 0;
  let currentAcceptedAnswers = [];

  const el = {
    sentence: document.getElementById('sentence'),
    sentenceNative: document.getElementById('sentenceNative'),
    answer: document.getElementById('answer'),
    answerOverlay: document.getElementById('answerOverlay'),
    check: document.getElementById('check'),
    next: document.getElementById('next'),
    feedback: document.getElementById('feedback'),
    explanation: document.getElementById('explanation'),
    progress: document.getElementById('progress'),
    sentenceStars: document.getElementById('sentenceStars'),
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
    formCollectionList: document.getElementById('formCollectionList'),
    deleteSentenceBtn: document.getElementById('deleteSentence'),
    navLinks: document.querySelectorAll('.nav-link')
  };

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

  function renderStars(count) {
    const full = '★';
    const empty = '☆';
    let html = '';
    for (let i = 0; i < MAX_STARS; i++) {
      html += '<span class="star ' + (i < count ? 'filled' : '') + '" aria-hidden="true">' + (i < count ? full : empty) + '</span>';
    }
    return html;
  }

  function updateAnswerOverlay() {
    const value = el.answer.value;
    const accepted = currentAcceptedAnswers;
    el.answerOverlay.innerHTML = '';
    if (!value || !accepted.length) return;
    let prefixCorrect = true;
    for (let i = 0; i < value.length; i++) {
      const span = document.createElement('span');
      const charMatch = accepted.some(function (a) {
        return i < a.length && value.charAt(i).toLowerCase() === a.charAt(i).toLowerCase();
      });
      if (!charMatch) prefixCorrect = false;
      span.className = (charMatch && prefixCorrect) ? 'char-correct' : 'char-wrong';
      span.textContent = value.charAt(i);
      el.answerOverlay.appendChild(span);
    }
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
      return localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    } catch (_) {}
    return 'dark';
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
        if (e) return { id: s.id, isCustom: false, collection: e.collection != null ? e.collection : (s.collection || ''), sentence: e.sentence || s.sentence, answer: e.answer != null ? e.answer : s.answer, answers: e.answers != null ? e.answers : s.answers, nativeSentence: e.nativeSentence != null ? e.nativeSentence : s.nativeSentence, nativeKeyword: e.nativeKeyword != null ? e.nativeKeyword : s.nativeKeyword, explanation: e.explanation != null ? e.explanation : s.explanation };
        return { ...s, isCustom: false, collection: s.collection || '' };
      });
    const customFiltered = custom.filter(function (s) { return !deleted.has(String(s.id)); });
    customFiltered.forEach(function (s) { s.isCustom = true; if (s.collection == null) s.collection = ''; });
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

  function showQuestion() {
    const item = sessionSentences[index];
    if (!item) {
      showSessionReview();
      return;
    }
    if (el.playContent) el.playContent.className = 'play-content play-content--game';
    currentAcceptedAnswers = getAcceptedAnswers(item);
    el.sentence.textContent = item.sentence;
    if (el.sentenceNative) {
      const highlight = getHighlightKeyword();
      el.sentenceNative.innerHTML = renderNativeSentence(item, highlight);
    }
    el.sentenceStars.innerHTML = renderStars(getStarsForId(item.id));
    el.sentenceStars.setAttribute('aria-label', 'Stars for this sentence: ' + getStarsForId(item.id) + ' of ' + MAX_STARS);
    el.answer.value = '';
    el.answer.disabled = false;
    el.answerOverlay.textContent = '';
    el.answer.focus();
    el.check.hidden = false;
    el.next.hidden = true;
    el.feedback.hidden = true;
    el.explanation.hidden = true;
    el.feedback.className = 'feedback';
    el.progress.textContent = 'Question ' + (index + 1) + ' of ' + sessionSentences.length;
    if (el.answerRow) el.answerRow.hidden = false;
  }

  function showSessionReview() {
    if (el.playContent) el.playContent.className = 'play-content play-content--review';
    el.reviewList.innerHTML = '';
    const highlight = getHighlightKeyword();
    sessionSentences.forEach(function (item) {
      const li = document.createElement('li');
      li.innerHTML =
        '<p class="review-sentence">' + escapeHtml(fullSentence(item)) + '</p>' +
        '<p class="review-answer">' + escapeHtml(primaryAnswer(item)) + '</p>' +
        (item.nativeSentence ? '<p class="review-native">' + renderNativeSentence(item, highlight) + '</p>' : '') +
        '<p class="review-explanation">' + escapeHtml(item.explanation || '') + '</p>';
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
    if (el.formCollection) el.formCollection.value = '';
    el.formAnswers.value = '';
    el.formExplanation.value = '';
    el.sentenceFormTitle.textContent = 'Add sentence';
    if (el.deleteSentenceBtn) el.deleteSentenceBtn.hidden = true;
    populateCollectionDatalist();
    openModal();
  }

  function openEditForm(item) {
    sentenceEditingId = item.id;
    el.formSentence.value = item.sentence || '';
    el.formNativeSentence.value = item.nativeSentence || '';
    el.formNativeKeyword.value = item.nativeKeyword || '';
    if (el.formCollection) el.formCollection.value = (item.collection || '').trim() || '';
    el.formAnswers.value = Array.isArray(item.answers) ? item.answers.join(', ') : (item.answer || '');
    el.formExplanation.value = item.explanation || '';
    el.sentenceFormTitle.textContent = 'Edit sentence';
    if (el.deleteSentenceBtn) el.deleteSentenceBtn.hidden = false;
    populateCollectionDatalist();
    openModal();
  }

  function populateCollectionDatalist() {
    if (!el.formCollectionList) return;
    el.formCollectionList.innerHTML = '';
    getCollections().forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c;
      el.formCollectionList.appendChild(opt);
    });
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
    if (!sentenceText) return;
    if (answers.length === 0) return;
    if (sentenceText.indexOf(BLANK_PLACEHOLDER) === -1) return;

    const collection = (el.formCollection && el.formCollection.value) ? el.formCollection.value.trim() : '';
    if (collection) addCollectionName(collection);
    const payload = { collection: collection || '', sentence: sentenceText, nativeSentence: nativeSentence || '', nativeKeyword: nativeKeyword || '', answer: answers[0], answers: answers, explanation: explanation || '' };

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
    var filterVal = (el.filterCollection && el.filterCollection.value) ? el.filterCollection.value : '';
    if (el.filterCollection) {
      el.filterCollection.innerHTML = '<option value="">All collections</option>';
      getCollections().forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        el.filterCollection.appendChild(opt);
      });
      el.filterCollection.value = filterVal;
    }
    var list = allSentences;
    if (filterVal) list = allSentences.filter(function (s) { return getCollectionDisplay(s.collection) === filterVal; });
    el.sentenceList.innerHTML = '';
    var highlight = getHighlightKeyword();
    list.forEach(function (item) {
      var stars = getStarsForId(item.id);
      var li = document.createElement('li');
      li.className = 'sentence-list-item';
      li.dataset.id = item.id;
      var collDisplay = getCollectionDisplay(item.collection);
      var nativeHtml = item.nativeSentence ? '<p class="item-native">' + renderNativeSentence(item, highlight) + '</p>' : '';
      li.innerHTML =
        '<div class="item-meta">' +
          '<span class="collection-badge">' + escapeHtml(collDisplay) + '</span>' +
          '<div class="item-stars" aria-label="' + stars + ' of ' + MAX_STARS + ' stars">' + renderStars(stars) + '</div>' +
        '</div>' +
        '<p class="item-text">' + escapeHtml(item.sentence) + '</p>' +
        nativeHtml +
        '<p class="item-answer">Answer(s): ' + escapeHtml(displayAnswers(item)) + '</p>' +
        '<div class="item-actions">' +
          '<button type="button" class="btn btn-secondary btn-sm item-edit" data-id="' + escapeHtml(String(item.id)) + '">Edit</button>' +
        '</div>';
      el.sentenceList.appendChild(li);
    });
    el.sentenceList.querySelectorAll('.item-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
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
    const given = el.answer.value;
    if (!item || given.trim() === '') return;

    const correct = isCorrect(given, item);
    if (correct) addStarForId(item.id);

    el.answer.disabled = true;
    el.check.hidden = true;
    el.feedback.hidden = false;
    el.feedback.textContent = correct ? 'Correct! +1 star' : 'Not quite.';
    el.feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
    el.explanation.hidden = false;
    el.explanation.textContent = item.explanation;
    el.next.hidden = false;
    el.sentenceStars.innerHTML = renderStars(getStarsForId(item.id));
  }

  function onNext() {
    index += 1;
    if (index >= sessionSentences.length) {
      showSessionReview();
      return;
    }
    showQuestion();
  }

  function onResetProgress() {
    clearAllStars();
    if (el.resetConfirm) {
      el.resetConfirm.hidden = false;
    }
    renderSentencesList();
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
    if (el.playSettingsBtn) el.playSettingsBtn.addEventListener('click', openPlaySettingsModal);
    if (el.playSettingsClose) el.playSettingsClose.addEventListener('click', closePlaySettingsModal);
    if (el.playSettingsModal) {
      el.playSettingsModal.addEventListener('click', function (e) {
        if (e.target === el.playSettingsModal) closePlaySettingsModal();
      });
    }
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
    if (el.sentenceModal) {
      el.sentenceModal.addEventListener('click', function (e) {
        if (e.target === el.sentenceModal) closeModal();
      });
    }
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
    if (el.playAgain) el.playAgain.addEventListener('click', showPlayConfig);
    if (el.playStart) el.playStart.addEventListener('click', startPlaySession);
    if (el.deleteSentenceBtn) el.deleteSentenceBtn.addEventListener('click', function () { if (sentenceEditingId != null && confirm('Delete this sentence?')) deleteSentenceById(sentenceEditingId); });
    if (el.filterCollection) el.filterCollection.addEventListener('change', function () { renderSentencesList(); });
    if (el.resetProgress) el.resetProgress.addEventListener('click', onResetProgress);
    if (el.insertBlankBtn) el.insertBlankBtn.addEventListener('click', insertBlankAtCursor);
    if (el.submitSentenceBtn) el.submitSentenceBtn.addEventListener('click', saveSentenceFromForm);
    if (el.cancelEditBtn) el.cancelEditBtn.addEventListener('click', cancelEdit);
    el.answer.addEventListener('input', updateAnswerOverlay);
    el.answer.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (!el.next.hidden) onNext();
      else onCheck();
    });
  }

  init();
})();
