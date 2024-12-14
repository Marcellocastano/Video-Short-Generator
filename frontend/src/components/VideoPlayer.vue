<template>
    <div class="video-player" :class="{ 'is-playing': isPlaying }">
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

        <div class="video-controls" v-if="showControls">
            <div class="progress-bar" @click="seek">
                <div class="progress" :style="{ width: progress + '%' }"></div>
            </div>

            <div class="controls-buttons">
                <button class="control-btn" @click="togglePlay">
                    <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
                </button>

                <div class="time">
                    {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                </div>

                <div class="volume-control">
                    <button class="control-btn" @click="toggleMute">
                        <i :class="volumeIcon"></i>
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        v-model="volume"
                        class="volume-slider"
                    />
                </div>

                <button class="control-btn" @click="toggleFullscreen">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

    // Props definition
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

    // Refs
    const videoRef = ref(null);
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const volume = ref(1);
    const isMuted = ref(false);
    const progress = ref(0);
    const error = ref(null);

    // Computed
    const volumeIcon = computed(() => {
        if (volume.value === 0 || isMuted.value) return 'fas fa-volume-mute';
        if (volume.value < 0.5) return 'fas fa-volume-down';
        return 'fas fa-volume-up';
    });

    // Methods
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

    // Watch
    watch(volume, newValue => {
        const video = videoRef.value;
        video.volume = newValue;
        isMuted.value = newValue === 0;
    });

    // Lifecycle hooks
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
        border-radius: 8px;
        overflow: hidden;
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
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        padding: 10px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .video-player:hover .video-controls {
        opacity: 1;
    }

    .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        cursor: pointer;
        border-radius: 2px;
        margin-bottom: 10px;
    }

    .progress {
        height: 100%;
        background: #3498db;
        border-radius: 2px;
        transition: width 0.1s linear;
    }

    .controls-buttons {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .control-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        font-size: 1.2em;
        transition: transform 0.2s ease;
    }

    .control-btn:hover {
        transform: scale(1.1);
    }

    .time {
        color: white;
        font-size: 0.9em;
        min-width: 100px;
    }

    .volume-control {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .volume-slider {
        width: 60px;
        height: 4px;
        /* -webkit-appearance: none; */
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        transition: width 0.2s ease;
    }

    .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
    }

    .volume-control:hover .volume-slider {
        width: 100px;
    }
</style>
