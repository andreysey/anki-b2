if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered!', reg))
            .catch(err => console.log('SW registration failed!', err));
    });
}

const APP_VERSION = 'v2026.03.23.1925';
let vocabulary = [];
let filteredVocabulary = [];
let isStudyMode = false;
let currentStudyIndex = 0;
let isFlipped = false;
let studyDirection = 'DE_TO_UA'; // 'UA_TO_DE' or 'DE_TO_UA'
let isAutoplay = false;
let masteredIds = new Set();
let itemsLimit = 24;
const INITIAL_LIMIT = 24;

const grid = document.getElementById('vocabulary-grid');
const searchInput = document.getElementById('search');
const levelFilter = document.getElementById('level-filter');
const themaFilter = document.getElementById('thema-filter');
const stats = document.getElementById('stats');

// Study Mode Elements
const modeToggleBtn = document.getElementById('mode-toggle');
const studyContainer = document.getElementById('study-container');
const studyCard = document.getElementById('study-card');
const studyFront = document.querySelector('.study-card-front');
const studyBack = document.querySelector('.study-card-back');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const autoplayToggleBtn = document.getElementById('autoplay-toggle');
const masteredBtn = document.getElementById('mastered-btn');
const directionToggleBtn = document.getElementById('direction-toggle');
const progressBar = document.getElementById('progress-bar');
const studyStats = document.getElementById('study-stats');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadMoreContainer = document.getElementById('load-more-container');

async function init() {
    try {
        const response = await fetch('data.json');
        vocabulary = await response.json();
        
        populateThemaFilter();
        document.getElementById('app-version').textContent = APP_VERSION;
        render();
        
        searchInput.addEventListener('input', () => { itemsLimit = INITIAL_LIMIT; render(); });
        levelFilter.addEventListener('change', () => { 
            itemsLimit = INITIAL_LIMIT; 
            populateThemaFilter(); // Refresh themes based on level
            render(); 
        });
        themaFilter.addEventListener('change', () => { itemsLimit = INITIAL_LIMIT; render(); });
        
        loadMoreBtn.addEventListener('click', () => {
            itemsLimit += INITIAL_LIMIT;
            render();
        });
        
    } catch (error) {
        console.error('Error loading vocabulary:', error);
        stats.textContent = 'Error loading data.';
    }
}

function populateThemaFilter() {
    const level = levelFilter.value;
    const currentThema = themaFilter.value;
    
    // Filter vocabulary to find available themes for the selected level
    const relevantVocab = level === 'all' 
        ? vocabulary 
        : vocabulary.filter(item => item.level === level);
        
    const themen = [...new Set(relevantVocab.map(item => item.thema))].sort((a, b) => a - b);
    
    // Keep internal consistency: clear and rebuild options
    themaFilter.innerHTML = '<option value="all">All Themes</option>';
    themen.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = `Theme ${t}`;
        if (t.toString() === currentThema) {
            opt.selected = true;
        }
        themaFilter.appendChild(opt);
    });
}

function render() {
    const query = searchInput.value.toLowerCase();
    const level = levelFilter.value;
    const thema = themaFilter.value;
    
    filteredVocabulary = vocabulary.filter(item => {
        const matchesQuery = !query || 
            item.german.toLowerCase().includes(query) || 
            item.english.toLowerCase().includes(query) || 
            item.ukrainian.toLowerCase().includes(query);
            
        const matchesLevel = level === 'all' || item.level === level;
        const matchesThema = thema === 'all' || item.thema.toString() === thema;
        
        const isMastered = isStudyMode && masteredIds.has(item.id || `${item.german}-${item.thema}`);
        
        return matchesQuery && matchesLevel && matchesThema && !isMastered;
    });
    
    // Sort logic to keep it stable unless shuffled
    // If we wanted to ensure id-less items have a stable key:
    const getItemKey = (item) => item.id || `${item.german}-${item.thema}`;

    stats.textContent = `Found ${filteredVocabulary.length} of ${vocabulary.length} words`;
    
    if (isStudyMode) {
        currentStudyIndex = Math.min(currentStudyIndex, Math.max(0, filteredVocabulary.length - 1));
        isFlipped = false;
        studyCard.classList.remove('is-flipped');
        renderStudyCard();
        loadMoreContainer.classList.add('hidden');
        return;
    }
    
    const visibleVocabulary = filteredVocabulary.slice(0, itemsLimit);
    
    if (filteredVocabulary.length > itemsLimit) {
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
    
    grid.innerHTML = visibleVocabulary.map(item => `
        <div class="card glass">
            <div class="card-header">
                <span class="badge badge-level">${item.level}</span>
                <span class="badge badge-thema">Thema ${item.thema}</span>
            </div>
            <div class="german-word-container">
                <div class="german-word">${item.german}</div>
                <button class="tts-btn" onclick="playAudio('${item.german_audio.replace(/'/g, "\\'")}')" title="Play pronunciation">🔊</button>
            </div>
            <div class="translations">
                <div class="trans-en">${item.english}</div>
                <div class="trans-uk">${item.ukrainian}</div>
            </div>
            ${item.example ? `<div class="example-box">${item.example}</div>` : ''}
        </div>
    `).join('');
}

init();

window.playAudio = function(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 0.85; // slightly slower for language learning
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Your browser does not support text-to-speech.");
    }
};

// --- Study Mode Logic ---

function setMode(study) {
    isStudyMode = study;
    if (isStudyMode) {
        modeToggleBtn.textContent = '📋 List View';
        grid.classList.add('hidden');
        studyContainer.classList.remove('hidden');
        currentStudyIndex = 0;
        masteredIds.clear(); // Clear mastered cards when re-entering study mode for a fresh session
        render(); // triggers renderStudyCard
    } else {
        modeToggleBtn.textContent = '🎓 Study Mode';
        grid.classList.remove('hidden');
        studyContainer.classList.add('hidden');
        render(); // triggers grid render
    }
}

modeToggleBtn.addEventListener('click', () => setMode(!isStudyMode));

function renderStudyCard() {
    if (filteredVocabulary.length === 0) {
        studyFront.innerHTML = `<h2>No cards found.</h2>`;
        studyBack.innerHTML = `<h2>Adjust filters.</h2>`;
        progressBar.style.width = '0%';
        studyStats.textContent = '';
        return;
    }
    const item = filteredVocabulary[currentStudyIndex];
    studyStats.textContent = `${currentStudyIndex + 1} / ${filteredVocabulary.length}`;
    
    // Update progress bar
    const progress = ((currentStudyIndex + 1) / filteredVocabulary.length) * 100;
    progressBar.style.width = `${progress}%`;

    const showGermanOnFront = studyDirection === 'DE_TO_UA';

    if (showGermanOnFront) {
        studyFront.innerHTML = `
            <h2 style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 1rem;">
                ${item.german}
                <button class="tts-btn" onclick="event.stopPropagation(); playAudio('${item.german_audio.replace(/'/g, "\\'")}')" title="Play pronunciation">🔊</button>
            </h2>
            <div style="margin-top: 2rem; font-size: 0.95rem; color: var(--text-muted);">(Thema ${item.thema})</div>
        `;
        
        studyBack.innerHTML = `
            <div class="translation">${item.ukrainian}</div>
            <div class="translation-en">${item.english}</div>
            ${item.example ? `<div class="example">${item.example}</div>` : ''}
        `;
    } else {
        studyFront.innerHTML = `
            <div class="translation">${item.ukrainian}</div>
            <div class="translation-en">${item.english}</div>
            <div style="margin-top: 2rem; font-size: 0.95rem; color: var(--text-muted);">(Thema ${item.thema})</div>
        `;
        
        studyBack.innerHTML = `
            <h2 style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 1rem;">
                ${item.german}
                <button class="tts-btn" onclick="event.stopPropagation(); playAudio('${item.german_audio.replace(/'/g, "\\'")}')" title="Play pronunciation">🔊</button>
            </h2>
            ${item.example ? `<div class="example">${item.example}</div>` : ''}
        `;
    }

    if (isAutoplay && !isFlipped) {
        if (showGermanOnFront) {
             playAudio(item.german_audio);
        }
    }
}

function flipCard() {
    if (filteredVocabulary.length === 0) return;
    isFlipped = !isFlipped;
    if (isFlipped) {
        studyCard.classList.add('is-flipped');
        const showGermanOnFront = studyDirection === 'DE_TO_UA';
        if (!showGermanOnFront || !isAutoplay) {
             playAudio(filteredVocabulary[currentStudyIndex].german_audio);
        }
    } else {
        studyCard.classList.remove('is-flipped');
    }
}

function nextCard() {
    if (currentStudyIndex < filteredVocabulary.length - 1) {
        currentStudyIndex++;
        isFlipped = false;
        studyCard.classList.remove('is-flipped');
        setTimeout(renderStudyCard, 100);
    }
}

function prevCard() {
    if (currentStudyIndex > 0) {
        currentStudyIndex--;
        isFlipped = false;
        studyCard.classList.remove('is-flipped');
        setTimeout(renderStudyCard, 100);
    }
}

function shuffleCards() {
    // Fisher-Yates shuffle
    for (let i = filteredVocabulary.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredVocabulary[i], filteredVocabulary[j]] = [filteredVocabulary[j], filteredVocabulary[i]];
    }
    currentStudyIndex = 0;
    isFlipped = false;
    studyCard.classList.remove('is-flipped');
    renderStudyCard();
}

function markAsMastered() {
    if (filteredVocabulary.length === 0) return;
    const item = filteredVocabulary[currentStudyIndex];
    const key = item.id || `${item.german}-${item.thema}`;
    masteredIds.add(key);
    
    // Visual feedback could be added here
    render(); // This will re-filter and trigger renderStudyCard
}

studyCard.addEventListener('click', flipCard);
nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextCard(); });
prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevCard(); });

shuffleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shuffleCards();
});

autoplayToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isAutoplay = !isAutoplay;
    autoplayToggleBtn.textContent = isAutoplay ? '🔊 On' : '🔊 Off';
    autoplayToggleBtn.classList.toggle('active', isAutoplay);
});

masteredBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    markAsMastered();
});

directionToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    studyDirection = studyDirection === 'UA_TO_DE' ? 'DE_TO_UA' : 'UA_TO_DE';
    directionToggleBtn.textContent = studyDirection === 'UA_TO_DE' ? '🔄 UA' : '🔄 DE';
    isFlipped = false;
    studyCard.classList.remove('is-flipped');
    renderStudyCard();
});

// Swipe Support
let touchStartX = 0;
let touchEndX = 0;

studyCard.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

studyCard.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) {
        nextCard();
    } else if (touchEndX > touchStartX + threshold) {
        prevCard();
    }
}

document.addEventListener('keydown', (e) => {
    if (!isStudyMode) return;
    if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
    } else if (e.code === 'ArrowRight') {
        nextCard();
    } else if (e.code === 'ArrowLeft') {
        prevCard();
    } else if (e.code === 'KeyS') {
        shuffleCards();
    } else if (e.code === 'KeyM') {
        markAsMastered();
    }
});
