<template>
    <div class="music-selector">
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
    import { ref, computed, onBeforeUnmount } from 'vue';

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

    const emit = defineEmits(['update:show', 'selected']);

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
        emit('update:show', false);
        currentPage.value = 1;
        stopAllAudio();
    };

    const selectAndClose = track => {
        selectMusic(track);
        closeModal();
    };

    const selectMusic = track => {
        selectedMusic.value = track;
        emit('selected', track);
    };

    const clearSelection = () => {
        stopAllAudio();
        selectedMusic.value = null;
        emit('selected', null);
    };

    const isSelected = track => {
        return selectedMusic.value?.id === track.id;
    };

    const formatDuration = seconds => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const playAudio = async (event, track) => {
        try {
            await stopAllAudio();
            audioElements.value.set(track.id, event.target);
            await event.target.play();
            currentlyPlaying.value = track.id;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error playing audio:', error);
            }
        }
    };

    const stopAllAudio = async () => {
        if (currentlyPlaying.value) {
            const currentAudio = audioElements.value.get(
                currentlyPlaying.value
            );
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
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        padding: 1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .music-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .music-card {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .music-card:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }

    .music-card.selected {
        background: rgba(var(--accent-color-rgb), 0.3);
        border-color: rgba(var(--accent-color-rgb), 0.5);
    }

    .music-info {
        color: white;
        margin-bottom: 0.5rem;
    }

    .music-title {
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .music-artist {
        font-size: 0.9rem;
        opacity: 0.8;
    }

    .audio-container {
        width: 100%;
        margin: 0.5rem 0;
    }

    .audio-preview {
        width: 100%;
        height: 32px;
        filter: opacity(0.7);
    }

    .music-duration {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
        text-align: right;
    }

    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .page-button {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .page-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
    }

    .page-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-info {
        color: white;
        font-size: 0.9rem;
    }

    /* Scrollbar styling */
    .modal-content::-webkit-scrollbar {
        width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
</style>
