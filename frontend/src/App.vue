<script setup>
import { ref, watchEffect, computed } from "vue";
import VideoSelector from "./components/VideoSelector.vue";
import SearchModal from "./components/SearchModal.vue";
import MusicSelector from "./components/MusicSelector.vue";

const text = ref("");
const selectedVideos = ref([]);
const language = ref("en-US");
const voice = ref("male");
const generating = ref(false);
const generationProgress = ref(0);
const generationStep = ref("");
const error = ref(null);
const videoSelector = ref(null);
const showSearchModal = ref(false);
const searchResults = ref([]);
const currentSearchQuery = ref("");
const selectedMusic = ref(null);
const showMusicModal = ref(false);
const musicSearchResults = ref([]);
const musicSearchQuery = ref("");
const generatedVideoUrl = ref("");

// Esponiamo le funzioni globalmente per il VideoSelector
window.$app = {
    showSearchResults(query, results) {
        currentSearchQuery.value = query;
        searchResults.value = results;
        showSearchModal.value = true;
    },
};

const handleVideoSelection = (videos) => {
    selectedVideos.value = videos;
};

const updateSelectedVideos = (videos) => {
    selectedVideos.value = videos;
};

const closeSearchModal = () => {
    showSearchModal.value = false;
};

const toggleVideoSelection = (video) => {
    const index = selectedVideos.value.findIndex((v) => v.id === video.id);
    if (index === -1) {
        selectedVideos.value.push(video);
    } else {
        selectedVideos.value.splice(index, 1);
    }
};

const canGenerate = ref(false);

watchEffect(() => {
    canGenerate.value = text.value.trim() && selectedVideos.value.length > 0;
});

const handleMusicSelected = (music) => {
    selectedMusic.value = music;
};

const searchMusic = async () => {
    if (!musicSearchQuery.value.trim()) return;

    try {
        const response = await fetch(
            `/api/music/search?query=${encodeURIComponent(musicSearchQuery.value)}`,
        );
        if (!response.ok) throw new Error("Ricerca musica fallita");

        const data = await response.json();
        musicSearchResults.value = data;
        showMusicModal.value = true;
    } catch (err) {
        console.error("Error searching music:", err);
        error.value = "Errore durante la ricerca della musica";
    }
};

const downloadVideo = (url) => {
    // Creiamo un link nascosto
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "generated-video.mp4"; // Nome del file per il download
    document.body.appendChild(a);
    
    // Scarichiamo il file usando fetch per verificare che esista
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
        })
        .then(blob => {
            // Creiamo un URL oggetto per il blob
            const blobUrl = window.URL.createObjectURL(blob);
            a.href = blobUrl;
            a.click();
            
            // Pulizia
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Error downloading video:', error);
            error.value = "Errore durante il download del video";
        });
};

const generateVideo = async () => {
    if (!text.value.trim() || selectedVideos.value.length === 0) return;

    generating.value = true;
    generationProgress.value = 0;
    generationStep.value = "";
    error.value = null;
    generatedVideoUrl.value = "";

    try {
        const response = await fetch("/api/videos/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text.value,
                videos: selectedVideos.value.map((v) => v.videos.large.url),
                language: language.value,
                voice: voice.value,
                backgroundMusic: selectedMusic.value
                    ? selectedMusic.value.download_url
                    : null,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate video");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            // Split chunk by newlines and process each line
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.progress) {
                        generationProgress.value = data.progress;
                        generationStep.value = data.step;
                    } else if (data.videoUrl) {
                        generatedVideoUrl.value = data.videoUrl;
                        // Download automatico usando la nuova funzione
                        downloadVideo(data.videoUrl);
                    }
                } catch (e) {
                    console.error("Error parsing progress:", e, "Line:", line);
                }
            }
        }
    } catch (err) {
        error.value = err.message;
        console.error("Error generating video:", err);
    } finally {
        generating.value = false;
        generationProgress.value = 0;
        generationStep.value = "";
    }
};
</script>

<template>
    <div class="app">
        <div class="logo-container">
            <img src="./assets/logo.png" alt="Logo" />
        </div>
        <main class="main-container">
            <div class="glass-container">
                <div class="content">
                    <VideoSelector
                        ref="videoSelector"
                        @selected="updateSelectedVideos"
                    />

                    <!-- Music Search Input -->
                    <div class="music-search">
                        <div class="search-container">
                            <input
                                v-model="musicSearchQuery"
                                @keyup.enter="searchMusic"
                                type="text"
                                class="glass-input"
                                placeholder="Cerca musica di sottofondo..."
                            />
                            <button
                                @click="searchMusic"
                                class="glass-button"
                                :disabled="!musicSearchQuery.trim()"
                            >
                                Cerca Musica
                            </button>
                        </div>

                        <div v-if="selectedMusic" class="selected-music-info">
                            <span>{{ selectedMusic.title }}</span>
                            <span style="opacity: 0.7">{{
                                selectedMusic.artist
                            }}</span>
                        </div>
                    </div>

                    <div class="text-input">
                        <textarea
                            v-model="text"
                            class="glass-input"
                            placeholder="Enter your text here..."
                            rows="4"
                        ></textarea>
                    </div>

                    <div class="voice-options">
                        <div class="options-grid">
                            <div class="option">
                                <select v-model="language" class="glass-input">
                                    <option value="en-US">English (US)</option>
                                    <option value="it-IT">Italian</option>
                                </select>
                            </div>

                            <div class="option">
                                <select v-model="voice" class="glass-input">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div v-if="error" class="error">{{ error }}</div>

                    <button
                        @click="generateVideo"
                        class="glass-button generate-button"
                        :disabled="!canGenerate || generating"
                    >
                        {{ generating ? "Creazione..." : "Crea" }}
                    </button>

                    <div v-if="generating" class="generation-progress">
                        <div class="progress-bar">
                            <div
                                class="progress-fill"
                                :style="{ width: generationProgress + '%' }"
                            ></div>
                        </div>
                        <div class="progress-step">{{ generationStep }}</div>
                    </div>

                    <!-- Sezione Video Generato -->
                    <div v-if="generatedVideoUrl" class="generated-video-section">
                        <h3>Video Generato</h3>
                        <div class="video-preview">
                            <video 
                                :src="generatedVideoUrl" 
                                controls
                                class="preview-player"
                            >
                                Il tuo browser non supporta il tag video.
                            </video>
                        </div>
                        <div class="download-section">
                            <button 
                                @click="downloadVideo(generatedVideoUrl)"
                                class="glass-button download-button"
                            >
                                Scarica Nuovamente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Modals -->
        <SearchModal
            v-if="showSearchModal"
            :show="showSearchModal"
            :videos="searchResults"
            :searchQuery="currentSearchQuery"
            :selectedVideos="selectedVideos"
            @close="closeSearchModal"
            @toggle-selection="toggleVideoSelection"
        />

        <MusicSelector
            :show="showMusicModal"
            :searchResults="musicSearchResults"
            @update:show="showMusicModal = $event"
            @selected="handleMusicSelected"
        />
    </div>
</template>

<style>
:root {
    --gradient-start: #f07167;
    --gradient-middle: #fed9b7;
    --gradient-end: #00afb9;
    --glass-bg: rgba(255, 255, 255, 0.4);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-highlight: rgba(255, 255, 255, 0.12);
    --glass-shadow: rgba(0, 0, 0, 0.15);
    --text-color: #0081a7;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    color: var(--text-color);
}

body {
    min-height: 100vh;
    background: linear-gradient(
        135deg,
        var(--gradient-start),
        var(--gradient-middle),
        var(--gradient-end)
    );
    font-family: "Inter", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

input,
textarea,
select,
button {
    color: var(--text-color);
}

input::placeholder,
textarea::placeholder {
    color: var(--text-color);
    opacity: 0.7;
}

.glass-container {
    background: var(--glass-bg);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);
    border-radius: 30px;
    padding: 3rem;
    box-shadow:
        0 8px 32px -4px var(--glass-shadow),
        inset 0 2px 0 0 var(--glass-highlight);
    position: relative;
    overflow: hidden;
}

.glass-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(to bottom, var(--glass-highlight), transparent);
    border-radius: 30px 30px 0 0;
    pointer-events: none;
}

.glass-container::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.03), transparent);
    border-radius: 0 0 30px 30px;
    pointer-events: none;
}

.glass-input {
    color: var(--text-color);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    padding: 1rem;
    border-radius: 12px;
    width: 100%;
    transition: all 0.3s ease;
}

.glass-input:focus {
    outline: none;
    background: var(--glass-highlight);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow:
        0 0 0 3px var(--glass-highlight),
        inset 0 2px 4px var(--glass-shadow);
}

.glass-button {
    color: var(--text-color);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.glass-button:hover {
    background: var(--glass-highlight);
    transform: translateY(-2px);
    box-shadow:
        0 8px 20px -6px var(--glass-shadow),
        inset 0 1px 0 0 var(--glass-highlight);
}

.generate-button {
    background: linear-gradient(135deg, #00afb9 0%, #0081a7 100%);
    color: white;
    border: none;
    padding: 12px 32px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 129, 167, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.generate-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 129, 167, 0.6);
    background: linear-gradient(135deg, #02c3ce 0%, #0095c1 100%);
}

.generate-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
    box-shadow: none;
}

.generate-button:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(0, 129, 167, 0.3);
}

.floating-circles {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 0;
    overflow: hidden;
}

.circle {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(
        circle at center,
        var(--glass-highlight),
        transparent
    );
    animation: float 20s infinite linear;
    opacity: 0.5;
}

.circle:nth-child(1) {
    width: 400px;
    height: 400px;
    top: -100px;
    left: 10%;
    animation-duration: 25s;
    background: radial-gradient(
        circle at center,
        var(--gradient-start),
        transparent
    );
}

.circle:nth-child(2) {
    width: 500px;
    height: 500px;
    bottom: -200px;
    right: 15%;
    animation-duration: 30s;
    animation-delay: -5s;
    background: radial-gradient(
        circle at center,
        var(--gradient-end),
        transparent
    );
}

.circle:nth-child(3) {
    width: 300px;
    height: 300px;
    top: 40%;
    left: -100px;
    animation-duration: 20s;
    animation-delay: -10s;
    background: radial-gradient(
        circle at center,
        var(--gradient-middle),
        transparent
    );
}

@keyframes float {
    0% {
        transform: rotate(0deg) translate(0, 0) scale(1);
    }
    33% {
        transform: rotate(120deg) translate(30px, 30px) scale(1.1);
    }
    66% {
        transform: rotate(240deg) translate(-30px, 50px) scale(0.9);
    }
    100% {
        transform: rotate(360deg) translate(0, 0) scale(1);
    }
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    background: linear-gradient(45deg, #2c3e50, #3498db);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
}

h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
    opacity: 0.9;
}

.options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
}

.option {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.option label {
    font-weight: 500;
    color: #2c3e50;
    opacity: 0.8;
}

.text-input,
.voice-options {
    margin-bottom: 2rem;
}

.error {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.2);
    color: #d63031;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.app {
    min-height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.main-container {
    width: 100%;
    min-width: 800px;
    max-width: 90vw;
    margin: 30px auto 0;
    padding: 0 1rem;
    position: relative;
}

.logo-container {
    display: flex;
    justify-content: center;
}

.logo-container img {
    max-width: 300px;
    height: auto;
}

.generation-progress {
    margin-top: 20px;
    width: 100%;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #00afb9 0%, #0081a7 100%);
    transition: width 0.3s ease;
    border-radius: 4px;
}

.progress-step {
    margin-top: 8px;
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-color);
    opacity: 0.8;
}

.music-search {
    margin-bottom: 2rem;
}

.search-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.search-container input {
    flex: 1;
}

.search-container button {
    white-space: nowrap;
}

.selected-music-info {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.selected-music-info::before {
    content: "♪";
    font-size: 1.2rem;
    color: var(--accent-color);
}

.generated-video-section {
    margin-top: 2rem;
    padding: 2rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 1rem;
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
}

.generated-video-section h3 {
    margin-bottom: 1rem;
    color: var(--text-color);
    font-size: 1.2rem;
}

.video-preview {
    width: 100%;
    margin-bottom: 1rem;
    border-radius: 0.5rem;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.1);
}

.preview-player {
    width: 100%;
    max-height: 500px;
    object-fit: contain;
}

.download-section {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.download-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.5rem;
    font-weight: 500;
}

.download-button:before {
    content: "⬇️";
}

@media (max-width: 840px) {
    .main-container {
        min-width: unset;
        width: 100%;
        padding: 0 0.5rem;
    }
}
</style>
