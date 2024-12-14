<template>
    <div class="generate-page">
        <div class="logo-container">
            <img src="../assets/logo.png" alt="Logo" />
        </div>
        <main class="main-container">
            <div class="glass-container">
                <div class="content">
                    <div class="generate-container">
                        <div class="form-group">
                            <input
                                v-model="videoTitle"
                                type="text"
                                class="glass-input"
                                placeholder="Titolo del video"
                            />
                        </div>
                        <div class="form-group">
                            <textarea
                                v-model="videoDescription"
                                class="glass-input"
                                placeholder="Descrizione del video"
                                rows="3"
                            ></textarea>
                        </div>

                        <div class="flex-container">
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
                                        Cerca
                                    </button>
                                </div>

                                <div
                                    v-if="selectedMusic"
                                    class="selected-music-info"
                                >
                                    <span>{{ selectedMusic.title }}</span>
                                    <span style="opacity: 0.7">{{
                                        selectedMusic.artist
                                    }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="text-input search-container">
                            <textarea
                                v-model="text"
                                class="glass-input"
                                placeholder="Inserisci il contenuto del video"
                                rows="4"
                            ></textarea>
                        </div>

                        <!-- <div class="voice-options">
                            <div class="options-grid">
                                <div class="option">
                                    <select
                                        v-model="language"
                                        class="glass-input"
                                    >
                                        <option value="en-US">
                                            English (US)
                                        </option>
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
                        </div> -->

                        <div v-if="error" class="error">{{ error }}</div>

                        <div class="center-container">
                            <button
                                @click="generateVideo"
                                class="glass-button generate-button"
                                :disabled="!canGenerate || generating"
                            >
                                {{ generating ? 'Creazione...' : 'Crea' }}
                            </button>
                        </div>

                        <div v-if="generating" class="generation-progress">
                            <div class="progress-bar">
                                <div
                                    class="progress-fill"
                                    :style="{ width: generationProgress + '%' }"
                                ></div>
                            </div>
                            <div class="progress-step">
                                {{ generationStep }}
                            </div>
                        </div>
                    </div>
                    <div class="generated-video-section">
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
                            <div v-if="generatedVideoUrl" class="video-actions">
                                <button
                                    class="glass-button"
                                    @click="downloadVideo(generatedVideoUrl)"
                                >
                                    Scarica
                                </button>
                                <button
                                    class="glass-button"
                                    @click="saveVideoToDb"
                                    :disabled="!videoTitle"
                                >
                                    Salva
                                </button>
                                <button
                                    class="glass-button"
                                    @click="publishVideo"
                                    :disabled="!videoTitle"
                                >
                                    Pubblica
                                </button>
                            </div>
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

        <PublishModal
            v-model="showPublishModal"
            :video="savedVideo"
            @publish="handlePublish"
        />
    </div>
</template>

<script setup>
    import { ref, watchEffect, computed } from 'vue';
    import VideoSelector from '../components/VideoSelector.vue';
    import SearchModal from '../components/SearchModal.vue';
    import MusicSelector from '../components/MusicSelector.vue';
    import PublishModal from '../components/PublishModal.vue';

    // Constants
    const baseUrl = 'http://localhost:3000';

    // Refs for form inputs
    const text = ref('');
    const videoTitle = ref('');
    const videoDescription = ref('');
    const language = ref('en-US');
    const voice = ref('male');
    const musicSearchQuery = ref('');

    // Refs for video selection
    const selectedVideos = ref([]);
    const videoSelector = ref(null);
    const showSearchModal = ref(false);
    const searchResults = ref([]);
    const currentSearchQuery = ref('');

    // Refs for music selection
    const selectedMusic = ref(null);
    const showMusicModal = ref(false);
    const musicSearchResults = ref([]);

    // Refs for video generation and saving
    const generating = ref(false);
    const generationProgress = ref(0);
    const generationStep = ref('');
    const error = ref(null);
    const generatedVideoUrl = ref('');
    const saving = ref(false);
    const savedVideo = ref(null);
    const showPublishModal = ref(false);

    // Computed properties
    const canGenerate = computed(
        () => text.value.trim() && selectedVideos.value.length > 0
    );

    // Global functions for VideoSelector
    window.$app = {
        showSearchResults(query, results) {
            currentSearchQuery.value = query;
            searchResults.value = results;
            showSearchModal.value = true;
        },
    };

    // Video selection handlers
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

    // Music selection handlers
    const handleMusicSelected = music => {
        selectedMusic.value = {
            title: music.title,
            artist: music.artist,
            url: music.audiodownload || music.audio || music.preview_url,
        };
        console.log('Selected music:', selectedMusic.value);
        showMusicModal.value = false;
    };

    const searchMusic = async () => {
        try {
            const response = await fetch(
                `/api/music/search?query=${encodeURIComponent(musicSearchQuery.value)}`
            );
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            musicSearchResults.value = data;
            showMusicModal.value = true;
        } catch (error) {
            console.error('Error searching music:', error);
        }
    };

    // Video download and save handlers
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
        if (!videoTitle.value) {
            alert('Per favore inserisci un titolo per il video');
            return;
        }

        try {
            saving.value = true;

            const response = await fetch(generatedVideoUrl.value);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('video', blob, 'generated-video.mp4');
            formData.append('title', videoTitle.value);
            formData.append('description', videoDescription.value || '');

            const saveResponse = await fetch(`${baseUrl}/api/videos/save`, {
                method: 'POST',
                body: formData,
            });

            if (!saveResponse.ok) {
                throw new Error('Failed to save video');
            }

            const result = await saveResponse.json();
            if (!result.success) {
                throw new Error(result.message || 'Failed to save video');
            }

            const savedVideoData = {
                id: result.videoId,
                title: videoTitle.value,
                description: videoDescription.value,
                file_path: result.filePath,
            };

            alert('Video salvato con successo nella raccolta!');
            return savedVideoData;
        } catch (error) {
            console.error('Errore durante il salvataggio:', error);
            alert('Errore durante il salvataggio del video: ' + error.message);
            throw error;
        } finally {
            saving.value = false;
        }
    };

    // Publishing handlers
    const publishVideo = async () => {
        try {
            if (!savedVideo.value) {
                savedVideo.value = await saveVideoToDb();
            }
            showPublishModal.value = true;
        } catch (error) {
            console.error('Error preparing video for publishing:', error);
            alert(
                'Si è verificato un errore durante la preparazione del video per la pubblicazione.'
            );
        }
    };

    const handlePublish = async publishData => {
        try {
            const response = await fetch(
                `${baseUrl}/api/videos/${savedVideo.value.id}/publish`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(publishData),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to publish video');
            }

            const result = await response.json();
            if (result.success) {
                alert('Video pubblicato con successo su YouTube!');
                showPublishModal.value = false;
            } else {
                throw new Error(result.message || 'Failed to publish video');
            }
        } catch (error) {
            console.error('Error publishing video:', error);
            alert(
                'Errore durante la pubblicazione del video: ' + error.message
            );
        }
    };

    // Video generation handler
    const generateVideo = async () => {
        if (!canGenerate.value || generating.value) return;

        generating.value = true;
        generationProgress.value = 0;
        error.value = null;
        generatedVideoUrl.value = '';

        try {
            const videoData = {
                text: text.value,
                language: language.value,
                voice: voice.value,
                videos: selectedVideos.value.map(
                    video => video.videos.medium.url
                ),
                backgroundMusic: selectedMusic.value?.url,
                title: videoTitle.value,
                description: videoDescription.value,
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
                        console.log('Received data:', data);

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
                            console.log('Video URL received:', data.videoUrl);
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
    }

    .youtube-info-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border-radius: 12px;
    }

    .youtube-info-section h2 {
        color: var(--text-color);
        margin-bottom: 1rem;
        font-size: 1.2rem;
        font-weight: 500;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group:last-child {
        margin-bottom: 0;
    }

    .glass-input {
        width: 100%;
        padding: 0.8rem 1rem;
        border-radius: 8px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        color: var(--text-color);
        transition: all 0.3s ease;
    }

    .glass-input:focus {
        outline: none;
        border-color: var(--glass-highlight);
        box-shadow: 0 0 0 2px var(--glass-highlight);
    }

    textarea.glass-input {
        resize: vertical;
        min-height: 80px;
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

    .download-button:disabled,
    .save-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .video-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .video-actions .glass-button {
        min-width: 120px;
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
    }

    .video-actions .glass-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
