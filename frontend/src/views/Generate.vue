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
                            placeholder="Inserisci il contenuto del video"
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
                        {{ generating ? 'Creazione...' : 'Crea' }}
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
                    <div
                        v-if="generatedVideoUrl"
                        class="generated-video-section"
                    >
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
                                Scarica Video
                            </button>
                            <button
                                @click="saveVideoToDb"
                                class="glass-button save-button"
                                :disabled="saving"
                            >
                                {{
                                    saving
                                        ? 'Salvataggio...'
                                        : 'Salva in Raccolta'
                                }}
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
    import { ref, watchEffect } from 'vue';
    import VideoSelector from '../components/VideoSelector.vue';
    import SearchModal from '../components/SearchModal.vue';
    import MusicSelector from '../components/MusicSelector.vue';

    const text = ref('');
    const selectedVideos = ref([]);
    const language = ref('en-US');
    const voice = ref('male');
    const generating = ref(false);
    const generationProgress = ref(0);
    const generationStep = ref('');
    const error = ref(null);
    const videoSelector = ref(null);
    const showSearchModal = ref(false);
    const searchResults = ref([]);
    const currentSearchQuery = ref('');
    const selectedMusic = ref(null);
    const showMusicModal = ref(false);
    const musicSearchResults = ref([]);
    const musicSearchQuery = ref('');
    const generatedVideoUrl = ref('');
    const saving = ref(false);

    // Esponiamo le funzioni globalmente per il VideoSelector
    window.$app = {
        showSearchResults(query, results) {
            currentSearchQuery.value = query;
            searchResults.value = results;
            showSearchModal.value = true;
        },
    };

    const handleVideoSelection = videos => {
        selectedVideos.value = videos;
    };

    const updateSelectedVideos = videos => {
        selectedVideos.value = videos;
    };

    const closeSearchModal = () => {
        showSearchModal.value = false;
    };

    const toggleVideoSelection = video => {
        const index = selectedVideos.value.findIndex(v => v.id === video.id);
        if (index === -1) {
            selectedVideos.value.push(video);
        } else {
            selectedVideos.value.splice(index, 1);
        }
    };

    const canGenerate = ref(false);

    watchEffect(() => {
        canGenerate.value =
            text.value.trim() && selectedVideos.value.length > 0;
    });

    const handleMusicSelected = music => {
        selectedMusic.value = {
            title: music.title,
            artist: music.artist,
            url: music.audio, // Modificato da music.url a music.audio
        };
        showMusicModal.value = false;
    };

    const searchMusic = async () => {
        try {
            const response = await fetch(
                `/api/music/search?query=${encodeURIComponent(musicSearchQuery.value)}`
            );
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

    const downloadVideo = async url => {
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

    const saveVideoToDb = async () => {
        if (saving.value) return;

        saving.value = true;
        try {
            // Prima scarichiamo il video
            const videoResponse = await fetch(generatedVideoUrl.value);
            const videoBlob = await videoResponse.blob();

            // Creiamo un nuovo Blob con il tipo MIME corretto
            const videoWithMimeType = new Blob([videoBlob], {
                type: 'video/mp4',
            });

            // Creiamo un FormData e aggiungiamo tutti i dati necessari
            const formData = new FormData();
            formData.append('video', videoWithMimeType, 'generated-video.mp4');
            formData.append('title', text.value.slice(0, 100));
            formData.append('description', text.value);
            formData.append('language', language.value);

            // Aggiungiamo i metadata come JSON stringificato
            const metadata = {
                voice: voice.value,
                backgroundMusic: selectedMusic.value
                    ? {
                          title: selectedMusic.value.title,
                          artist: selectedMusic.value.artist,
                          url: selectedMusic.value.url,
                      }
                    : null,
                sourceVideos: selectedVideos.value.map(video => ({
                    url: video.videos.large.url,
                    thumbnail: video.thumbnail,
                })),
            };
            formData.append('hashtags', JSON.stringify([])); // Array vuoto per ora
            formData.append('metadata', JSON.stringify(metadata));

            console.log('Saving video with data:', {
                title: text.value.slice(0, 100),
                description: text.value,
                language: language.value,
                metadata,
            });

            const response = await fetch('/api/videos/save', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage;

                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage =
                        errorData.message ||
                        'Errore durante il salvataggio del video';
                } else {
                    const textError = await response.text();
                    console.error('Error response:', textError);
                    errorMessage = 'Errore durante il salvataggio del video';
                }

                throw new Error(errorMessage);
            }

            // Mostra un messaggio di successo
            alert('Video salvato con successo nella raccolta!');
        } catch (error) {
            console.error('Errore durante il salvataggio:', error);
            alert('Errore durante il salvataggio del video: ' + error.message);
        } finally {
            saving.value = false;
        }
    };

    const generateVideo = async () => {
        if (!canGenerate.value || generating.value) return;

        generating.value = true;
        generationProgress.value = 0;
        error.value = null;
        generatedVideoUrl.value = ''; // Reset dell'URL del video

        try {
            const videoData = {
                text: text.value,
                language: language.value,
                voice: voice.value,
                videos: selectedVideos.value.map(
                    video => video.videos.large.url
                ),
                backgroundMusic: selectedMusic.value?.url,
            };

            console.log('Sending video data:', videoData);

            const response = await fetch('/api/videos/generate', {
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
                        console.log('Received data:', data); // Aggiungiamo un log per debug
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
                            console.log('Video URL received:', data.videoUrl); // Log per debug
                            generatedVideoUrl.value = data.videoUrl;
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
        padding: 2rem;
        min-height: 100vh;
        background: var(--background-gradient);
    }

    /* Stili per la sezione del video generato */
    .generated-video-section {
        margin-top: 2rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .generated-video-section h3 {
        color: var(--text-color);
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }

    .video-preview {
        width: 100%;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .preview-player {
        width: 100%;
        max-height: 400px;
        object-fit: contain;
        background: rgba(0, 0, 0, 0.2);
    }

    .download-section {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1rem;
    }

    .download-button,
    .save-button {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-color);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .download-button:hover,
    .save-button:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .save-button {
        background: rgba(var(--accent-color-rgb), 0.2);
    }

    .save-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
