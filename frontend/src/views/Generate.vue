<template>
    <div class="generate-page">
        <div class="logo-container">
            <img src="../assets/logo.png" alt="Logo" />
        </div>
        <main class="main-container">
            <div class="glass-container">
                <div class="content">
                    <VideoSelector
                        ref="videoSelector"
                        v-model="selectedVideos"
                        @update:modelValue="updateSelectedVideos"
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
            v-model:selectedVideos="selectedVideos"
            @close="closeSearchModal"
        />

        <MusicSelector
            :show="showMusicModal"
            :searchResults="musicSearchResults"
            @update:show="showMusicModal = $event"
            @selected="handleMusicSelected"
        />
    </div>
</template>

<script setup>
import { ref, watchEffect } from "vue";
import VideoSelector from "../components/VideoSelector.vue";
import SearchModal from "../components/SearchModal.vue";
import MusicSelector from "../components/MusicSelector.vue";

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
    showMusicModal.value = false;
};

const searchMusic = async () => {
    try {
        const response = await fetch(`/api/music/search?q=${encodeURIComponent(musicSearchQuery.value)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        musicSearchResults.value = data;
        showMusicModal.value = true;
    } catch (error) {
        console.error('Error searching music:', error);
    }
};

const downloadVideo = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = 'generated-video.mp4';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading video:', error);
    }
};

const generateVideo = async () => {
    if (!canGenerate.value || generating.value) return;

    generating.value = true;
    generationProgress.value = 0;
    error.value = null;
    generatedVideoUrl.value = "";

    try {
        const videoData = {
            text: text.value,
            language: language.value,
            voice: voice.value,
            videos: selectedVideos.value,
            music: selectedMusic.value
        };

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(videoData),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.progress !== undefined) {
                        generationProgress.value = data.progress;
                    }
                    if (data.step) {
                        generationStep.value = data.step;
                    }
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    if (data.videoUrl) {
                        generatedVideoUrl.value = data.videoUrl;
                        // Avvia il download automatico
                        await downloadVideo(data.videoUrl);
                    }
                } catch (e) {
                    console.error('Error parsing line:', e);
                }
            }
        }
    } catch (err) {
        error.value = err.message;
        console.error('Error generating video:', err);
    } finally {
        generating.value = false;
    }
};
</script>

<style scoped>
.generate-page {
    padding: 20px;
}

.logo-container {
    text-align: center;
    margin-bottom: 20px;
}

.logo-container img {
    max-width: 200px;
}

.main-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.glass-container {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px 0 var(--glass-shadow);
    padding: 20px;
}

.content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.glass-input {
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
}

.glass-button {
    padding: 10px 20px;
    border-radius: 5px;
    border: 1px solid var(--glass-border);
    background: rgba(40, 44, 52, 0.7);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

.glass-button:hover:not(:disabled) {
    background: rgba(40, 44, 52, 0.9);
}

.glass-button:disabled {
    background: rgba(204, 204, 204, 0.7);
    cursor: not-allowed;
}

.music-search {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.search-container {
    display: flex;
    gap: 10px;
}

.selected-music-info {
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 5px;
}

.options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
}

.error {
    color: #dc3545;
    padding: 10px;
    border-radius: 5px;
    background: rgba(220, 53, 69, 0.1);
}

.generation-progress {
    margin-top: 20px;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--primary-color);
    transition: width 0.3s ease;
}

.progress-step {
    margin-top: 10px;
    text-align: center;
    color: var(--text-color);
}

.generated-video-section {
    margin-top: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 10px;
}

.video-preview {
    margin: 20px 0;
}

.preview-player {
    width: 100%;
    border-radius: 5px;
}

.download-button {
    width: 100%;
    margin-top: 10px;
}

@media (max-width: 768px) {
    .main-container {
        padding: 10px;
    }

    .options-grid {
        grid-template-columns: 1fr;
    }
}
</style>
