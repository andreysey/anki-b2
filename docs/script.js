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
        stats.textContent = 'Помилка завантаження даних.';
    }
}

function populateThemaFilter() {
    const themen = [...new Set(vocabulary.map(item => item.thema))].sort((a, b) => a - b);
    themen.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = `Thema ${t}`;
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
    
    stats.textContent = `Знайдено ${filtered.length} з ${vocabulary.length} слів`;
    
    grid.innerHTML = filtered.map(item => `
        <div class="card glass">
            <div class="card-header">
                <span class="badge badge-level">${item.level}</span>
                <span class="badge badge-thema">Thema ${item.thema}</span>
            </div>
            <div class="german-word">${item.german}</div>
            <div class="translations">
                <div class="trans-en">${item.english}</div>
                <div class="trans-uk">${item.ukrainian}</div>
            </div>
            ${item.example ? `<div class="example-box">${item.example}</div>` : ''}
        </div>
    `).join('');
}

init();
