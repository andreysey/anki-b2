<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useVocabulary } from './composables/useVocabulary';
import VocabularyCard from './components/VocabularyCard.vue';
import FilterBar from './components/FilterBar.vue';

const {
  vocabulary,
  filteredVocabulary,
  search,
  levelFilter,
  themaFilter,
  isStudyMode,
  currentStudyIndex,
  isFlipped,
  studyDirection,
  isAutoplay,
  init,
  updateSRS,
  nextCard,
  prevCard,
  shuffleCards,
  getItemKey
} = useVocabulary();

onMounted(() => {
  init();
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!isStudyMode.value) return;
  
  if (e.code === 'Space') {
    e.preventDefault();
    isFlipped.value = !isFlipped.value;
  } else if (e.code === 'ArrowRight') {
    nextCard();
  } else if (e.code === 'ArrowLeft') {
    prevCard();
  } else if (isFlipped.value) {
    if (e.key === '1') updateSRS('again');
    else if (e.key === '2') updateSRS('hard');
    else if (e.key === '3') updateSRS('good');
    else if (e.key === '4') updateSRS('easy');
  }
};

const playAudio = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

const appVersion = __APP_VERSION__;
</script>

<template>
  <div class="app-container">
    <header>
      <h1>German B1+/B2 Beruf</h1>
      <p class="subtitle">Interactive Vocabulary Dictionary</p>
      <div class="header-controls">
        <button class="nav-btn mode-toggle" @click="isStudyMode = !isStudyMode">
          {{ isStudyMode ? '📋 List View' : '🎓 Study Mode' }}
        </button>
      </div>
    </header>

    <main>
      <FilterBar 
        :vocabulary="vocabulary"
        v-model:search="search"
        v-model:level="levelFilter"
        v-model:thema="themaFilter"
      />

      <!-- List View -->
      <div v-if="!isStudyMode" class="vocabulary-grid">
        <div v-for="item in filteredVocabulary.slice(0, 50)" :key="getItemKey(item)" class="card glass">
            <div class="card-header">
                <span class="badge badge-level">{{ item.level }}</span>
                <span class="badge badge-thema">Thema {{ item.thema }}</span>
            </div>
            <div class="german-word-container">
                <div class="german-word" v-html="item.german"></div>
                <button class="tts-btn" @click="playAudio(item.german_audio)" title="Play pronunciation">🔊</button>
            </div>
            <div class="translations">
                <div class="trans-en">{{ item.english }}</div>
                <div class="trans-uk">{{ item.ukrainian }}</div>
            </div>
            <div v-if="item.example" class="example-box" v-html="item.example"></div>
        </div>
      </div>

      <!-- Study Mode -->
      <div v-else class="study-container">
        <div class="study-settings-bar">
          <button class="nav-btn small" @click="studyDirection = studyDirection === 'DE_TO_UA' ? 'UA_TO_DE' : 'DE_TO_UA'">
            🔄 {{ studyDirection === 'DE_TO_UA' ? 'DE' : 'UA' }}
          </button>
          <button class="nav-btn small" :class="{ active: isAutoplay }" @click="isAutoplay = !isAutoplay">
            🔊 {{ isAutoplay ? 'On' : 'Off' }}
          </button>
          <button class="nav-btn small" @click="shuffleCards">🔀 Shuffle</button>
        </div>

        <VocabularyCard 
          v-if="filteredVocabulary.length > 0"
          :word="filteredVocabulary[currentStudyIndex]"
          :isFlipped="isFlipped"
          :direction="studyDirection"
          @flip="isFlipped = !isFlipped"
        />

        <div v-if="isFlipped" class="srs-controls">
          <button class="srs-btn again" @click="updateSRS('again')">🔴 Again</button>
          <button class="srs-btn hard" @click="updateSRS('hard')">🟡 Hard</button>
          <button class="srs-btn good" @click="updateSRS('good')">🟢 Good</button>
          <button class="srs-btn easy" @click="updateSRS('easy')">🔵 Easy</button>
        </div>
        
        <div class="study-controls">
          <button class="nav-btn" @click="prevCard">⬅️</button>
          <div class="study-stats">
            {{ currentStudyIndex + 1 }} / {{ filteredVocabulary.length }}
          </div>
          <button class="nav-btn" @click="nextCard">➡️</button>
        </div>
      </div>
    </main>

    <footer>
      <p>Version <span id="app-version">v{{ appVersion }}</span></p>
    </footer>
  </div>
</template>

<style>
@import './assets/base.css';

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.vocabulary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.srs-controls {
    margin-top: 2rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
}

.study-stats {
  font-size: 1.2rem;
  font-weight: bold;
}

.study-controls {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}
</style>
