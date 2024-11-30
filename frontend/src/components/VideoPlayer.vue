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

<script>
    export default {
        name: 'VideoPlayer',
        props: {
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
        },
        data() {
            return {
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                volume: 1,
                isMuted: false,
                progress: 0,
                error: null,
            };
        },
        computed: {
            volumeIcon() {
                if (this.volume === 0 || this.isMuted)
                    return 'fas fa-volume-mute';
                if (this.volume < 0.5) return 'fas fa-volume-down';
                return 'fas fa-volume-up';
            },
        },
        methods: {
            togglePlay() {
                const video = this.$refs.videoRef;
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            },
            toggleMute() {
                const video = this.$refs.videoRef;
                video.muted = !video.muted;
                this.isMuted = video.muted;
            },
            seek(event) {
                const video = this.$refs.videoRef;
                const rect = event.target.getBoundingClientRect();
                const percent = (event.clientX - rect.left) / rect.width;
                video.currentTime = percent * video.duration;
            },
            toggleFullscreen() {
                const video = this.$refs.videoRef;
                if (!document.fullscreenElement) {
                    video.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            },
            formatTime(seconds) {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            },
            onLoadedMetadata() {
                const video = this.$refs.videoRef;
                this.duration = video.duration;
                if (this.autoplay) {
                    video.play();
                }
            },
            updateProgress() {
                const video = this.$refs.videoRef;
                if (video) {
                    this.currentTime = video.currentTime;
                    this.progress = (video.currentTime / video.duration) * 100;
                }
            },
            handleError(e) {
                console.error('Errore video:', {
                    error: e.target.error,
                    src: this.src,
                    networkState: e.target.networkState,
                    readyState: e.target.readyState,
                });
                this.error = e.target.error;
            },
        },
        watch: {
            volume(newValue) {
                const video = this.$refs.videoRef;
                video.volume = newValue;
                this.isMuted = newValue === 0;
            },
        },
        mounted() {
            const video = this.$refs.videoRef;
            video.addEventListener('timeupdate', this.updateProgress);
        },
        beforeUnmount() {
            const video = this.$refs.videoRef;
            video.removeEventListener('timeupdate', this.updateProgress);
        },
    };
</script>

<style scoped>
    .video-player {
        position: relative;
        width: 100%;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
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
        -webkit-appearance: none;
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
