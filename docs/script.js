let vocabulary = [];
let filteredVocabulary = [];
let isStudyMode = false;
let currentStudyIndex = 0;
let isFlipped = false;

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
const flipBtn = document.getElementById('flip-btn');
const studyStats = document.getElementById('study-stats');

async function init() {
    try {
        const response = await fetch('data.json');
        vocabulary = await response.json();
        
        populateThemaFilter();
        render();
        
        searchInput.addEventListener('input', render);
        levelFilter.addEventListener('change', render);
        themaFilter.addEventListener('change', render);
        
    } catch (error) {
        console.error('Error loading vocabulary:', error);
        stats.textContent = 'Error loading data.';
    }
}

function populateThemaFilter() {
    const themen = [...new Set(vocabulary.map(item => item.thema))].sort((a, b) => a - b);
    themen.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = `Theme ${t}`;
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
        
        return matchesQuery && matchesLevel && matchesThema;
    });
    
    stats.textContent = `Found ${filteredVocabulary.length} of ${vocabulary.length} words`;
    
    if (isStudyMode) {
        currentStudyIndex = 0;
        isFlipped = false;
        studyCard.classList.remove('is-flipped');
        renderStudyCard();
        return;
    }
    
    grid.innerHTML = filteredVocabulary.map(item => `
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
        return;
    }
    const item = filteredVocabulary[currentStudyIndex];
    studyStats.textContent = `Card ${currentStudyIndex + 1} of ${filteredVocabulary.length}`;
    
    studyFront.innerHTML = `
        <div class="translation">${item.ukrainian}</div>
        <div class="translation-en">${item.english}</div>
        <div style="margin-top: 2rem; font-size: 0.95rem; color: var(--text-muted);">(Thema ${item.thema})</div>
    `;
    
    studyBack.innerHTML = `
        <h2 style="display:flex; align-items:center; justify-content:center; gap: 1rem;">
            ${item.german}
            <button class="tts-btn" onclick="event.stopPropagation(); playAudio('${item.german_audio.replace(/'/g, "\\'")}')" title="Play pronunciation">🔊</button>
        </h2>
        ${item.example ? `<div class="example">${item.example}</div>` : ''}
    `;
}

function flipCard() {
    isFlipped = !isFlipped;
    if (isFlipped) {
        studyCard.classList.add('is-flipped');
        if (filteredVocabulary.length > 0) {
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
        setTimeout(renderStudyCard, isFlipped ? 300 : 0);
    }
}

function prevCard() {
    if (currentStudyIndex > 0) {
        currentStudyIndex--;
        isFlipped = false;
        studyCard.classList.remove('is-flipped');
        setTimeout(renderStudyCard, isFlipped ? 300 : 0);
    }
}

studyCard.addEventListener('click', flipCard);
flipBtn.addEventListener('click', (e) => { e.stopPropagation(); flipCard(); });
nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextCard(); });
prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevCard(); });

document.addEventListener('keydown', (e) => {
    if (!isStudyMode) return;
    if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
    } else if (e.code === 'ArrowRight') {
        nextCard();
    } else if (e.code === 'ArrowLeft') {
        prevCard();
    }
});
