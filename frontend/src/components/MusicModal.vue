<template>
    <Modal
        :show="props.show"
        @update:show="$emit('update:show', $event)"
        title="Seleziona Musica"
    >
        <v-container fluid>
            <v-row>
                <v-col
                    v-for="track in paginatedResults"
                    :key="track.id"
                    cols="12"
                    sm="6"
                    md="4"
                >
                    <v-card
                        :elevation="isSelected(track) ? 8 : 2"
                        :class="{ 'primary-border': isSelected(track) }"
                        @click="selectAndClose(track)"
                        class="h-100"
                    >
                        <v-card-text>
                            <div class="d-flex flex-column gap-4">
                                <div>
                                    <div class="text-h6">{{ track.title }}</div>
                                    <div class="text-subtitle-1">
                                        {{ track.artist }}
                                    </div>
                                </div>

                                <audio
                                    :key="'result-' + track.id"
                                    :src="track.preview_url"
                                    controls
                                    class="w-100"
                                    @play="playAudio($event, track)"
                                ></audio>

                                <div class="text-caption">
                                    {{ formatDuration(track.duration) }}
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-row v-if="totalPages > 1" justify="center" class="mt-4">
                <v-col cols="auto">
                    <v-pagination
                        v-model="currentPage"
                        :length="totalPages"
                        :total-visible="7"
                        rounded="circle"
                    ></v-pagination>
                </v-col>
            </v-row>
        </v-container>
    </Modal>
</template>

<script setup>
    import { ref, computed, onBeforeUnmount } from 'vue';
    import Modal from './Modal.vue';

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
