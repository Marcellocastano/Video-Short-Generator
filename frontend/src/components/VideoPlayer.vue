<template>
    <v-card class="video-player rounded-lg overflow-hidden" flat>
        <video
            ref="videoRef"
            class="video-element"
            @play="isPlaying = true"
            @pause="isPlaying = false"
            @ended="isPlaying = false"
            @click="togglePlay"
            @loadedmetadata="onLoadedMetadata"
            @error="handleError"
        >
            <source :src="src" type="video/mp4" />
            Il tuo browser non supporta il tag video.
        </video>

        <div
            v-if="showControls"
            class="video-controls d-flex flex-column pa-2 bg-black bg-opacity-50"
        >
            <v-slider
                v-model="progress"
                @click="seek"
                density="compact"
                color="white"
                track-color="grey-darken-2"
                hide-details
                class="mb-1"
            ></v-slider>

            <div class="d-flex align-center">
                <v-btn
                    icon="mdi-play"
                    :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
                    @click="togglePlay"
                    variant="text"
                    color="white"
                    density="comfortable"
                    class="mr-2"
                ></v-btn>

                <div class="time text-white text-caption mr-4">
                    {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                </div>

                <div class="d-flex align-center">
                    <v-btn
                        :icon="volumeIcon"
                        @click="toggleMute"
                        variant="text"
                        color="white"
                        density="comfortable"
                        class="mr-2"
                    ></v-btn>

                    <v-slider
                        v-model="volume"
                        min="0"
                        max="1"
                        step="0.1"
                        class="volume-slider mt-0 pt-0"
                        color="white"
                        track-color="grey-darken-2"
                        hide-details
                        density="compact"
                        style="max-width: 100px"
                    ></v-slider>
                </div>

                <v-spacer></v-spacer>

                <v-btn
                    icon="mdi-fullscreen"
                    @click="toggleFullscreen"
                    variant="text"
                    color="white"
                    density="comfortable"
                ></v-btn>
            </div>
        </div>
    </v-card>
</template>

<script setup>
    import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

    const props = defineProps({
        src: {
            type: String,
            required: true,
        },
        showControls: {
            type: Boolean,
            default: true,
        },
        autoplay: {
            type: Boolean,
            default: false,
        },
    });

    const videoRef = ref(null);
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const volume = ref(1);
    const isMuted = ref(false);
    const progress = ref(0);
    const error = ref(null);

    const volumeIcon = computed(() => {
        if (volume.value === 0 || isMuted.value) return 'mdi-volume-off';
        if (volume.value < 0.5) return 'mdi-volume-medium';
        return 'mdi-volume-high';
    });

    const togglePlay = () => {
        const video = videoRef.value;
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    };

    const toggleMute = () => {
        const video = videoRef.value;
        video.muted = !video.muted;
        isMuted.value = video.muted;
    };

    const seek = event => {
        const video = videoRef.value;
        const rect = event.target.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        video.currentTime = percent * video.duration;
    };

    const toggleFullscreen = () => {
        const video = videoRef.value;
        if (!document.fullscreenElement) {
            video.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = seconds => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const onLoadedMetadata = () => {
        const video = videoRef.value;
        duration.value = video.duration;
        if (props.autoplay) {
            video.play();
        }
    };

    const updateProgress = () => {
        const video = videoRef.value;
        if (video) {
            currentTime.value = video.currentTime;
            progress.value = (video.currentTime / video.duration) * 100;
        }
    };

    const handleError = e => {
        console.error('Errore video:', {
            error: e.target.error,
            src: props.src,
            networkState: e.target.networkState,
            readyState: e.target.readyState,
        });
        error.value = e.target.error;
    };

    watch(volume, newValue => {
        const video = videoRef.value;
        video.volume = newValue;
        isMuted.value = newValue === 0;
    });

    onMounted(() => {
        const video = videoRef.value;
        video.addEventListener('timeupdate', updateProgress);
    });

    onBeforeUnmount(() => {
        const video = videoRef.value;
        video.removeEventListener('timeupdate', updateProgress);
    });
</script>

<style scoped>
    .video-player {
        position: relative;
        width: 100%;
        background: #000;
        height: 300px;
    }

    .video-element {
        width: 100%;
        height: 100%;
        cursor: pointer;
    }

    .video-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .video-player:hover .video-controls {
        opacity: 1;
    }

    :deep(.v-slider .v-slider-track__fill) {
        background-color: white !important;
    }

    :deep(.v-slider .v-slider-thumb) {
        color: white !important;
    }
</style>
