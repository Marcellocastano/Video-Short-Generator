<template>
    <v-container class="generate-page">
        <h1 class="text-h4 mb-8">Genera Video</h1>
        <v-card class="glass-container">
            <v-card-text class="content">
                <div class="generate-container">
                    <v-form @submit.prevent="generateVideo">
                        <v-text-field
                            v-model="videoTitle"
                            label="Titolo del video"
                            variant="outlined"
                            class="mb-4"
                        />

                        <v-textarea
                            v-model="videoDescription"
                            label="Descrizione del video"
                            variant="outlined"
                            rows="3"
                            class="mb-4"
                        />

                        <div class="flex-container">
                            <VideoSelector
                                ref="videoSelector"
                                v-model="selectedVideos"
                                @update:modelValue="updateSelectedVideos"
                            />

                            <div class="music-search">
                                <v-text-field
                                    v-model="musicSearchQuery"
                                    label="Cerca musica di sottofondo..."
                                    variant="outlined"
                                    @keyup.enter="searchMusic"
                                    :append-inner-icon="'mdi-magnify'"
                                    @click:append-inner="searchMusic"
                                />

                                <v-card
                                    v-if="selectedMusic"
                                    variant="flat"
                                    class="selected-music-info mt-2"
                                >
                                    <v-card-text>
                                        <div class="text-h6">
                                            {{ selectedMusic.title }}
                                        </div>
                                        <div class="text-subtitle-2">
                                            {{ selectedMusic.artist }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </div>

                        <v-textarea
                            v-model="text"
                            label="Inserisci il contenuto del video"
                            variant="outlined"
                            rows="4"
                            class="mb-4"
                        />

                        <v-alert
                            v-if="error"
                            type="error"
                            variant="tonal"
                            class="mb-4"
                        >
                            {{ error }}
                        </v-alert>

                        <div class="text-center">
                            <v-btn
                                color="primary"
                                size="large"
                                :loading="generating"
                                :disabled="!canGenerate || generating"
                                @click="generateVideo"
                            >
                                {{ generating ? 'Creazione...' : 'Crea' }}
                            </v-btn>
                        </div>

                        <v-progress-linear
                            v-if="generating"
                            v-model="generationProgress"
                            height="20"
                            color="primary"
                            class="mt-4"
                        >
                            <template v-slot:default>
                                {{ generationStep }}
                            </template>
                        </v-progress-linear>
                    </v-form>
                </div>

                <div class="generated-video-section mt-6">
                    <video
                        v-if="generatedVideoUrl"
                        :src="generatedVideoUrl"
                        controls
                        class="preview-player"
                    >
                        Il tuo browser non supporta il tag video.
                    </video>

                    <v-card-actions
                        v-if="generatedVideoUrl"
                        class="justify-center mt-4"
                    >
                        <v-btn
                            color="primary"
                            variant="outlined"
                            @click="downloadVideo(generatedVideoUrl)"
                        >
                            Scarica
                        </v-btn>

                        <v-btn
                            color="success"
                            variant="outlined"
                            @click="saveVideoToDb"
                            :disabled="!videoTitle"
                            class="mx-2"
                        >
                            Salva
                        </v-btn>

                        <v-btn
                            color="info"
                            variant="outlined"
                            @click="publishVideo"
                            :disabled="!videoTitle"
                        >
                            Pubblica
                        </v-btn>
                    </v-card-actions>
                </div>
            </v-card-text>
        </v-card>

        <VideoModal
            v-if="showSearchModal"
            :show="showSearchModal"
            :videos="searchResults"
            :searchQuery="currentSearchQuery"
            v-model:selectedVideos="selectedVideos"
            @close="closeSearchModal"
        />

        <MusicModal
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
    </v-container>
</template>

<script setup>
    import { ref, watchEffect, computed } from 'vue';
    import VideoSelector from '../components/VideoSelector.vue';
    import VideoModal from '../components/Modals/VideoModal.vue';
    import MusicModal from '../components/Modals/MusicModal.vue';
    import PublishModal from '../components/Modals/PublishModal.vue';

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

            // Increase timeout to 15 minutes for very long videos
            const response = await fetch('/api/videos/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(videoData),
                signal: AbortSignal.timeout(15 * 60 * 1000), // 15 minutes timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(
                    `Server error: ${response.status} - ${errorText}`
                );
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log('Stream completed successfully');
                        break;
                    }

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
                                console.log('Current step:', data.step);
                            }
                            if (data.error) {
                                throw new Error(data.error);
                            }
                            if (data.videoUrl) {
                                console.log(
                                    'Video URL received:',
                                    data.videoUrl
                                );
                                generatedVideoUrl.value = data.videoUrl;
                                // Successfully received video URL, we can break the stream
                                return;
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                // Log but don't throw for JSON parse errors
                                console.warn('Invalid JSON in stream:', e);
                                continue;
                            }
                            throw e;
                        }
                    }
                }
            } catch (streamError) {
                console.error('Stream error:', streamError);
                if (streamError.name === 'AbortError') {
                    throw new Error(
                        'Video generation is taking longer than expected. Please check the generated video in your profile after a few minutes.'
                    );
                }
                throw streamError;
            }
        } catch (err) {
            error.value = err.message;
            console.error('Error generating video:', err);
        } finally {
            generating.value = false;
        }
    };
</script>
