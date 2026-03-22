let vocabulary = [];
const grid = document.getElementById('vocabulary-grid');
const searchInput = document.getElementById('search');
const levelFilter = document.getElementById('level-filter');
const themaFilter = document.getElementById('thema-filter');
const stats = document.getElementById('stats');

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
    
    const filtered = vocabulary.filter(item => {
        const matchesQuery = !query || 
            item.german.toLowerCase().includes(query) || 
            item.english.toLowerCase().includes(query) || 
            item.ukrainian.toLowerCase().includes(query);
            
        const matchesLevel = level === 'all' || item.level === level;
        const matchesThema = thema === 'all' || item.thema.toString() === thema;
        
        return matchesQuery && matchesLevel && matchesThema;
    });
    
    stats.textContent = `Found ${filtered.length} of ${vocabulary.length} words`;
    
    grid.innerHTML = filtered.map(item => `
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
