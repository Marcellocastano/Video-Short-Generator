<template>
    <div class="music-selector">
        <!-- Selected Music Display -->
        <div v-if="selectedMusic" class="selected-music glass-panel">
            <div class="music-preview">
                <div class="music-info">
                    <span class="music-title">{{ selectedMusic.title }}</span>
                    <div class="audio-container">
                        <audio
                            :key="'selected-' + selectedMusic.id"
                            :src="selectedMusic.preview_url"
                            controls
                            class="audio-preview"
                            @play="playAudio($event, selectedMusic)"
                        ></audio>
                    </div>
                </div>
                <button @click="clearSelection" class="remove-button">×</button>
            </div>
        </div>

        <!-- Modal -->
        <div v-if="props.show" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
                <div class="music-grid">
                    <div
                        v-for="track in paginatedResults"
                        :key="track.id"
                        class="music-card"
                        :class="{ selected: isSelected(track) }"
                        @click="selectAndClose(track)"
                    >
                        <div class="music-card-content">
                            <div class="music-info">
                                <div class="music-title">{{ track.title }}</div>
                                <div class="music-artist">
                                    {{ track.artist }}
                                </div>
                            </div>
                            <div class="audio-container">
                                <audio
                                    :key="'result-' + track.id"
                                    :src="track.preview_url"
                                    controls
                                    class="audio-preview"
                                    @play="playAudio($event, track)"
                                ></audio>
                            </div>
                            <div class="music-duration">
                                {{ formatDuration(track.duration) }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="pagination">
                    <button
                        class="page-button"
                        :disabled="currentPage === 1"
                        @click.stop="currentPage--"
                    >
                        ←
                    </button>
                    <span class="page-info"
                        >{{ currentPage }} / {{ totalPages }}</span
                    >
                    <button
                        class="page-button"
                        :disabled="currentPage === totalPages"
                        @click.stop="currentPage++"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from "vue";

const props = defineProps({
    show: {
        type: Boolean,
        required: true,
    },
    searchResults: {
        type: Array,
        required: true,
        default: () => [],
    },
});

const selectedMusic = ref(null);
const currentlyPlaying = ref(null);
const audioElements = ref(new Map());
const currentPage = ref(1);
const itemsPerPage = 12;

const emit = defineEmits(["update:show", "selected"]);

// Computed property for paginated results
const paginatedResults = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return props.searchResults.slice(start, end);
});

const totalPages = computed(() => {
    return Math.ceil(props.searchResults.length / itemsPerPage);
});

const closeModal = () => {
    emit("update:show", false);
    currentPage.value = 1;
    stopAllAudio();
};

const selectAndClose = (track) => {
    selectMusic(track);
    closeModal();
};

const selectMusic = (track) => {
    selectedMusic.value = track;
    emit("selected", track);
};

const clearSelection = () => {
    stopAllAudio();
    selectedMusic.value = null;
    emit("selected", null);
};

const isSelected = (track) => {
    return selectedMusic.value?.id === track.id;
};

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const playAudio = async (event, track) => {
    try {
        await stopAllAudio();
        audioElements.value.set(track.id, event.target);
        await event.target.play();
        currentlyPlaying.value = track.id;
    } catch (error) {
        if (error.name !== "AbortError") {
            console.error("Error playing audio:", error);
        }
    }
};

const stopAllAudio = async () => {
    if (currentlyPlaying.value) {
        const currentAudio = audioElements.value.get(currentlyPlaying.value);
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        currentlyPlaying.value = null;
    }
    audioElements.value.clear();
};

onBeforeUnmount(() => {
    stopAllAudio();
});
</script>

<style scoped>
.music-selector {
    width: 100%;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.modal-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(128, 128, 128, 0.4);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);
    border-radius: 30px;
    width: 95vw;
    max-width: 1600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
    box-shadow:
        0 8px 32px -4px var(--glass-shadow),
        inset 0 2px 0 0 var(--glass-highlight);
}

.music-grid {
    display: grid;
    grid-template-columns: repeat(4, 250px);
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    justify-content: center;
}

.music-card {
    padding: 1rem;
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.music-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.1);
}

.music-card.selected {
    background: rgba(var(--accent-color-rgb), 0.2);
    border: 1px solid var(--accent-color);
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(var(--accent-color-rgb), 0.3);
}

.music-info {
    margin-bottom: 0.5rem;
}

.music-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--text-color);
}

.music-artist {
    font-size: 0.9rem;
    opacity: 0.8;
    color: var(--text-color);
}

.audio-container {
    width: 100%;
    margin: 0.5rem 0;
}

.audio-preview {
    width: 100%;
    height: 32px;
    border-radius: 16px;
}

.music-duration {
    font-size: 0.9rem;
    opacity: 0.8;
    text-align: right;
    color: var(--text-color);
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
}

.page-button {
    padding: 0.5rem 1rem;
    font-size: 1.2rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 0.5rem;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.3s ease;
}

.page-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
}

.page-info {
    font-size: 0.9rem;
    color: var(--text-color);
}

.selected-music {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.music-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.remove-button {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    line-height: 1;
    transition: all 0.3s ease;
}

.remove-button:hover {
    color: var(--accent-color);
}

.glass-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-color);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.glass-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
}

.glass-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.glass-panel {
    background: rgba(23, 23, 23, 0.98);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 1200px) {
    .video-grid {
        grid-template-columns: repeat(3, 250px);
    }
}

@media (max-width: 900px) {
    .video-grid {
        grid-template-columns: repeat(2, 250px);
    }
}

@media (max-width: 600px) {
    .video-grid {
        grid-template-columns: repeat(1, 250px);
    }
}
</style>
