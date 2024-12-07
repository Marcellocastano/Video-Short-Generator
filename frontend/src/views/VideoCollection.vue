<template>
    <div class="video-collection">
        <h1>Raccolta Video</h1>

        <div class="video-grid">
            <div v-for="video in videos" :key="video.id" class="video-card">
                <div class="video-thumbnail">
                    <VideoPlayer
                        :src="video.file_path"
                        :show-controls="false"
                    />
                    <div class="video-actions">
                        <button
                            class="action-menu"
                            @click="toggleMenu(video.id)"
                        >
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div
                            v-if="activeMenu === video.id"
                            class="action-dropdown"
                        >
                            <button @click="showVideoInfo(video)">
                                <i class="fas fa-info-circle"></i> Info
                            </button>
                            <button
                                v-if="!isPublished(video)"
                                @click="showPublishModal(video)"
                            >
                                <i class="fab fa-youtube"></i> Pubblica
                            </button>
                            <button
                                class="delete-btn"
                                @click="showDeleteConfirm(video)"
                            >
                                <i class="fas fa-trash"></i> Elimina
                            </button>
                        </div>
                    </div>
                </div>
                <div class="video-info">
                    <h3>{{ video.title || 'Video senza titolo' }}</h3>
                    <p>{{ video.description || 'Nessuna descrizione' }}</p>
                    <div class="video-metadata">
                        <span
                            ><i class="fas fa-calendar"></i>
                            {{ formatDate(video.created_at) }}</span
                        >
                    </div>
                </div>
            </div>
        </div>

        <div v-if="totalVideos > 8" class="pagination">
            <button
                :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
                class="page-btn"
            >
                <i class="fas fa-chevron-left"></i>
            </button>

            <span class="page-info"
                >Pagina {{ currentPage }} di {{ totalPages }}</span
            >

            <button
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
                class="page-btn"
            >
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>

        <!-- Modali -->
        <DeleteVideoModal
            v-model:show="showDeleteModal"
            :video-id="selectedVideo?.id"
            :video-title="selectedVideo?.title || 'Video senza titolo'"
            @video-deleted="fetchVideos"
        />

        <VideoInfoModal
            v-model:show="showInfoModal"
            :video-id="selectedVideo?.id"
        />

        <PublishModal
            v-model="isPublishModalVisible"
            :video="selectedVideo"
            @publish="handlePublish"
        />
    </div>
</template>

<script>
    import axios from 'axios';
    import DeleteVideoModal from '../components/DeleteVideoModal.vue';
    import VideoInfoModal from '../components/VideoInfoModal.vue';
    import VideoPlayer from '../components/VideoPlayer.vue';
    import PublishModal from '../components/PublishModal.vue';

    export default {
        name: 'VideoCollection',
        components: {
            DeleteVideoModal,
            VideoInfoModal,
            VideoPlayer,
            PublishModal,
        },
        data() {
            return {
                videos: [],
                activeMenu: null,
                isPublishModalVisible: false,
                selectedVideo: null,
                showDeleteModal: false,
                showInfoModal: false,
                currentPage: 1,
                totalPages: 1,
                pageSize: 8,
                totalVideos: 0,
                baseUrl: 'http://localhost:3000', // URL base senza /api
            };
        },
        methods: {
            async fetchVideos() {
                try {
                    const apiUrl = `${this.baseUrl}/api/videos?page=${this.currentPage}&pageSize=${this.pageSize}`;
                    const response = await axios.get(apiUrl);

                    this.videos = response.data.videos.map(video => {
                        const cleanPath = video.file_path
                            .replace(/^\/uploads\/?/, '')
                            .replace(/\/+/g, '/');

                        return {
                            ...video,
                            file_path: `${this.baseUrl}/uploads/${cleanPath}`,
                        };
                    });

                    this.totalVideos = response.data.total;
                    this.totalPages = Math.ceil(
                        this.totalVideos / this.pageSize
                    );
                } catch (error) {
                    console.error('Errore nel caricamento dei video:', error);
                }
            },
            formatDate(date) {
                if (!date) return 'Data non disponibile';
                return new Date(date).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            },
            toggleMenu(videoId) {
                this.activeMenu = this.activeMenu === videoId ? null : videoId;
            },
            showVideoInfo(video) {
                this.selectedVideo = video;
                this.showInfoModal = true;
                this.activeMenu = null;
            },
            showPublishModal(video) {
                this.selectedVideo = video;
                this.isPublishModalVisible = true;
            },
            async handlePublish(publishData) {
                try {
                    const response = await fetch(
                        `${this.baseUrl}/api/videos/${publishData.videoId}/publish`,
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

                    // Aggiorna la lista dei video
                    await this.fetchVideos();
                } catch (error) {
                    console.error('Error publishing video:', error);
                    // TODO: Mostrare un messaggio di errore all'utente
                }
            },
            isPublished(video) {
                return video.publish_status === 'published';
            },
            showDeleteConfirm(video) {
                this.selectedVideo = video;
                this.showDeleteModal = true;
                this.activeMenu = null;
            },
            async deleteVideo(videoId) {
                if (confirm('Sei sicuro di voler eliminare questo video?')) {
                    try {
                        await axios.delete(
                            `${this.baseUrl}/api/videos/${videoId}`
                        );
                        await this.fetchVideos();
                    } catch (error) {
                        console.error(
                            "Errore durante l'eliminazione del video:",
                            error
                        );
                    }
                }
                this.activeMenu = null;
            },
            async changePage(page) {
                this.currentPage = page;
                await this.fetchVideos();
            },
        },
        mounted() {
            this.fetchVideos();
            // Chiudi il menu quando si clicca fuori
            document.addEventListener('click', e => {
                if (!e.target.closest('.video-actions')) {
                    this.activeMenu = null;
                }
            });
        },
    };
</script>

<style scoped>
    .video-collection {
        padding: 20px;
        margin-left: var(--sidebar-width);
        transition: margin-left 0.3s ease;
    }

    .video-grid {
        display: flex;
        gap: 20px;
        margin-top: 20px;
        flex-wrap: wrap;
    }

    .video-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        transition: transform 0.2s ease;
        width: 350px;
    }

    .video-card:hover {
        transform: translateY(-5px);
    }

    .video-thumbnail {
        position: relative;
        width: 100%;
    }

    .video-actions {
        position: absolute;
        top: 8px;
        right: 8px;
    }

    .action-menu {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .action-dropdown {
        position: absolute;
        top: 40px;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        z-index: 1000;
    }

    .action-dropdown button {
        display: block;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        white-space: nowrap;
    }

    .action-dropdown button:hover {
        background: #f5f5f5;
    }

    .action-dropdown .delete-btn {
        color: #dc3545;
    }

    .action-dropdown .delete-btn:hover {
        background: #ffebee;
    }

    .video-info {
        padding: 15px;
    }

    .video-info h3 {
        margin: 0 0 10px 0;
        font-size: 1.1em;
        color: var(--text-color);
    }

    .video-metadata {
        display: flex;
        gap: 15px;
        font-size: 0.8em;
        color: #888;
    }

    .video-metadata i {
        margin-right: 5px;
    }

    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 30px;
        gap: 15px;
    }

    .page-btn {
        background: rgba(40, 44, 52, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .page-btn:disabled {
        background: rgba(204, 204, 204, 0.7);
        cursor: not-allowed;
    }

    .page-btn:not(:disabled):hover {
        background: rgba(40, 44, 52, 0.9);
    }
</style>
