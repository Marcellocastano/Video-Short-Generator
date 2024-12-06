<template>
    <div class="video-selector">
        <div class="search-section">
            <div class="search-bar">
                <input
                    v-model="searchQuery"
                    type="text"
                    class="search-input"
                    placeholder="Cerca video inserendo una parola chiave"
                />
                <button
                    @click="performSearch"
                    class="search-button glass-button"
                    :disabled="!searchQuery.trim()"
                >
                    Cerca
                </button>
            </div>
        </div>

        <!-- Selected Videos Preview -->
        <div v-if="selectedVideos.length > 0" class="selected-videos-preview">
            <div class="selected-videos-grid">
                <div
                    v-for="video in selectedVideos"
                    :key="video.id"
                    class="selected-video-item"
                >
                    <div class="video-preview-container">
                        <div v-if="video.source === 'pixabay'">
                            <video
                                :src="video.videos.tiny.url"
                                loop
                                muted
                                class="video-thumbnail"
                                @mouseover="e => e.target.play()"
                                @mouseleave="
                                    e => {
                                        e.target.pause();
                                        e.target.currentTime = 0;
                                    }
                                "
                            ></video>
                        </div>
                        <div v-else>
                            <img
                                :src="video.preview || video.videos.tiny.url"
                                class="video-thumbnail"
                                :alt="'Preview for video ' + video.id"
                            />
                        </div>
                        <button
                            @click="removeVideo(video)"
                            class="remove-video-button"
                            title="Rimuovi video"
                        >
                            ×
                        </button>
                        <span
                            v-if="video.source"
                            :class="`video-source-badge ${video.source}`"
                            >{{ video.source }}</span
                        >
                    </div>
                    <div class="video-duration">
                        {{ formatDuration(video.duration) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, watch } from 'vue';

    const emit = defineEmits(['update:modelValue']);
    const searchQuery = ref('');
    const selectedVideos = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const props = defineProps({
        modelValue: {
            type: Array,
            default: () => [],
        },
    });

    function isImageUrl(url) {
        console.log(url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        return url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    }

    watch(
        () => props.modelValue,
        newValue => {
            selectedVideos.value = newValue;
        },
        { immediate: true }
    );

    async function performSearch() {
        if (!searchQuery.value.trim()) return;

        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(
                `/api/videos/search?query=${encodeURIComponent(searchQuery.value)}`
            );
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            window.$app.showSearchResults(searchQuery.value, data);
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    }

    function removeVideo(video) {
        const index = selectedVideos.value.findIndex(v => v.id === video.id);
        if (index !== -1) {
            selectedVideos.value.splice(index, 1);
            emit('update:modelValue', selectedVideos.value);
        }
    }

    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function toggleVideoSelection(video) {
        const index = selectedVideos.value.findIndex(v => v.id === video.id);
        if (index === -1) {
            selectedVideos.value.push(video);
        } else {
            selectedVideos.value.splice(index, 1);
        }
        emit('update:modelValue', selectedVideos.value);
    }
</script>

<style scoped>
    .video-selector {
        width: 100%;
    }

    .search-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .search-bar {
        width: 100%;
        display: flex;
        gap: 10px;
    }

    .search-input {
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

    .search-input:focus {
        outline: none;
        background: var(--glass-highlight);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow:
            0 0 0 3px var(--glass-highlight),
            inset 0 2px 4px var(--glass-shadow);
    }

    .search-button {
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

    .search-button:hover:not(:disabled) {
        background: var(--glass-highlight);
        transform: translateY(-2px);
        box-shadow:
            0 8px 20px -6px var(--glass-shadow),
            inset 0 1px 0 0 var(--glass-highlight);
    }

    .search-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .selected-videos-preview {
        margin: 1rem 0;
    }

    .selected-videos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }

    .selected-video-item {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
    }

    .video-preview-container {
        position: relative;
        width: 100%;
        padding-top: 56.25%;
        overflow: hidden;
    }

    .video-thumbnail {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .remove-video-button {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.3s ease;
    }

    .remove-video-button:hover {
        background: rgba(255, 0, 0, 1);
        transform: scale(1.1);
    }

    .video-duration {
        position: absolute;
        bottom: 8px;
        right: 8px;
        padding: 2px 6px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border-radius: 4px;
        font-size: 0.8em;
    }

    .video-source-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8em;
        color: white;
        background-color: rgba(0, 0, 0, 0.6);
        text-transform: capitalize;
    }

    .video-source-badge.pixabay {
        background-color: rgba(58, 177, 155, 0.8);
    }

    .video-source-badge.pexels {
        background-color: rgba(5, 255, 161, 0.8);
    }
</style>
