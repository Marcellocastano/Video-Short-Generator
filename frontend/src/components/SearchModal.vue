<template>
    <Modal :show="show" @update:show="closeModal" :title="searchQuery">
        <v-container fluid class="pa-8">
            <v-row>
                <v-col
                    v-for="video in videos"
                    :key="video.id"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                    xl="2"
                >
                    <v-card
                        :elevation="isSelected(video) ? 8 : 2"
                        :class="{ 'primary-border': isSelected(video) }"
                        @click="toggleVideoSelection(video)"
                        class="h-100"
                    >
                        <div class="video-preview">
                            <video
                                v-if="video.source === 'pixabay'"
                                :src="video.preview"
                                loop
                                muted
                                height="200"
                                class="video-preview__media"
                                @mouseover="playVideo($event.target)"
                                @mouseout="pauseVideo($event.target)"
                            ></video>
                            <v-img
                                v-else
                                :src="video.preview || video.videos.tiny.url"
                                :alt="'Preview for video ' + video.id"
                                height="200"
                                cover
                            ></v-img>

                            <v-overlay
                                v-if="isSelected(video)"
                                class="align-center justify-center"
                                contained
                                scrim="#primary"
                            >
                                <v-icon color="white" size="large"
                                    >mdi-check-circle</v-icon
                                >
                            </v-overlay>
                        </div>

                        <v-card-text
                            class="d-flex justify-space-between align-center"
                        >
                            <v-chip
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                {{ formatDuration(video.duration) }}
                            </v-chip>
                            <v-chip
                                v-if="video.source"
                                size="small"
                                color="secondary"
                                variant="outlined"
                            >
                                {{ video.source }}
                            </v-chip>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
        <template v-slot:actions>
            <v-btn icon @click="$emit('update:show', false)">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </template>
    </Modal>
</template>

<script setup>
    import { ref } from 'vue';
    import Modal from './Modal.vue';

    const props = defineProps({
        show: Boolean,
        videos: Array,
        searchQuery: String,
        selectedVideos: {
            type: Array,
            default: () => [],
        },
    });

    const emit = defineEmits(['close', 'update:selectedVideos', 'update:show']);

    const formatDuration = seconds => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const isSelected = video => {
        return props.selectedVideos.some(v => v.id === video.id);
    };

    const toggleVideoSelection = video => {
        const newSelectedVideos = [...props.selectedVideos];
        const index = newSelectedVideos.findIndex(v => v.id === video.id);

        if (index === -1) {
            newSelectedVideos.push(video);
        } else {
            newSelectedVideos.splice(index, 1);
        }

        emit('update:selectedVideos', newSelectedVideos);
    };

    const playVideo = video => {
        video.play();
    };

    const pauseVideo = video => {
        video.pause();
        video.currentTime = 0;
    };

    const closeModal = value => {
        emit('update:show', value);
        if (!value) {
            emit('close');
        }
    };
</script>
