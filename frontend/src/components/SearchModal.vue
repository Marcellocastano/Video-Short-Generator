<template>
    <div v-if="show" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
            <!-- <div class="modal-header">
        <h2>{{ searchQuery }}</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div> -->

            <div class="video-grid">
                <div
                    v-for="video in videos"
                    :key="video.id"
                    class="video-card"
                    :class="{ selected: isSelected(video) }"
                    @click="toggleVideoSelection(video)"
                >
                    <div class="video-preview">
                        <video
                            v-if="video.source === 'pixabay'"
                            :src="video.preview"
                            loop
                            muted
                            @mouseover="playVideo($event.target)"
                            @mouseout="pauseVideo($event.target)"
                        ></video>
                        <img
                            v-else
                            :src="video.preview || video.videos.tiny.url"
                            class="video-thumbnail"
                            :alt="'Preview for video ' + video.id"
                        />
                        <div v-if="isSelected(video)" class="check-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path
                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                />
                            </svg>
                        </div>
                        <div class="video-info">
                            <div class="video-duration">
                                {{ formatDuration(video.duration) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'SearchModal',
        props: {
            show: Boolean,
            videos: Array,
            searchQuery: String,
            selectedVideos: {
                type: Array,
                default: () => [],
            },
        },
        emits: ['close', 'update:selectedVideos'],
        data() {
            return {
                videoRefs: {},
            };
        },
        methods: {
            closeModal() {
                this.$emit('close');
            },
            formatDuration(seconds) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            },
            isSelected(video) {
                return this.selectedVideos.some(v => v.id === video.id);
            },
            toggleVideoSelection(video) {
                const newSelectedVideos = [...this.selectedVideos];
                const index = newSelectedVideos.findIndex(
                    v => v.id === video.id
                );

                if (index === -1) {
                    newSelectedVideos.push(video);
                } else {
                    newSelectedVideos.splice(index, 1);
                }

                this.$emit('update:selectedVideos', newSelectedVideos);
            },
            playVideo(video) {
                video.play();
            },
            pauseVideo(video) {
                video.pause();
                video.currentTime = 0;
            },
        },
    };
</script>

<style scoped>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
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

    .video-grid {
        display: grid;
        grid-template-columns: repeat(4, 250px);
        gap: 2rem;
        padding: 1rem;
        justify-content: center;
    }

    .video-card {
        width: 250px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
    }

    .video-preview {
        position: relative;
        width: 100%;
        height: 445px;
        overflow: hidden;
    }

    .video-preview video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .video-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1.5rem;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
        border-radius: 0 0 12px 12px;
        z-index: 2;
    }

    .video-duration {
        display: inline-block;
        background: var(--glass-bg);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        color: black;
        padding: 0.5rem 1rem;
        border-radius: 12px;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .video-card.selected {
        border: 2px solid #4caf50;
        transform: scale(1.02);
        box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
    }

    .check-icon {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 32px;
        height: 32px;
        background: #4caf50;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .check-icon svg {
        width: 24px;
        height: 24px;
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
