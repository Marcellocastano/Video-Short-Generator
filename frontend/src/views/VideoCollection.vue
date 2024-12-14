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
                    <div class="video-header">
                        <h3>{{ video.title || 'Video senza titolo' }}</h3>
                        <div
                            class="status-tag"
                            :class="getStatusClass(video)"
                            :data-tooltip="getStatusTooltip(video)"
                        >
                            {{ getStatusText(video) }}
                        </div>
                    </div>
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

<script setup>
    import { ref, onMounted } from 'vue';
    import axios from 'axios';
    import DeleteVideoModal from '../components/DeleteVideoModal.vue';
    import VideoInfoModal from '../components/VideoInfoModal.vue';
    import VideoPlayer from '../components/VideoPlayer.vue';
    import PublishModal from '../components/PublishModal.vue';

    // Stato
    const videos = ref([]);
    const activeMenu = ref(null);
    const isPublishModalVisible = ref(false);
    const selectedVideo = ref(null);
    const showDeleteModal = ref(false);
    const showInfoModal = ref(false);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const pageSize = ref(8);
    const totalVideos = ref(0);
    const baseUrl = 'http://localhost:3000';

    // Metodi
    const fetchVideos = async () => {
        try {
            const apiUrl = `${baseUrl}/api/videos?page=${currentPage.value}&pageSize=${pageSize.value}`;
            const response = await axios.get(apiUrl);

            videos.value = response.data.videos.map(video => {
                const cleanPath = video.file_path
                    .replace(/^\/uploads\/?/, '')
                    .replace(/\/+/g, '/');

                return {
                    ...video,
                    file_path: `${baseUrl}/uploads/${cleanPath}`,
                };
            });

            totalVideos.value = response.data.total;
            totalPages.value = Math.ceil(totalVideos.value / pageSize.value);
        } catch (error) {
            console.error('Errore nel caricamento dei video:', error);
        }
    };

    const formatDate = date => {
        if (!date) return 'Data non disponibile';
        return new Date(date).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const toggleMenu = videoId => {
        activeMenu.value = activeMenu.value === videoId ? null : videoId;
    };

    const showVideoInfo = video => {
        selectedVideo.value = video;
        showInfoModal.value = true;
        activeMenu.value = null;
    };

    const showPublishModal = video => {
        selectedVideo.value = video;
        isPublishModalVisible.value = true;
    };

    const handlePublish = async publishData => {
        try {
            const response = await fetch(
                `${baseUrl}/api/videos/${publishData.videoId}/publish`,
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

            await fetchVideos();
        } catch (error) {
            console.error('Error publishing video:', error);
        } finally {
            isPublishModalVisible.value = false;
        }
    };

    const isPublished = video => {
        return video.youtube_id && video.publish_status === 'published';
    };

    const showDeleteConfirm = video => {
        selectedVideo.value = video;
        showDeleteModal.value = true;
        activeMenu.value = null;
    };

    const changePage = page => {
        currentPage.value = page;
        fetchVideos();
    };

    const getStatusClass = video => {
        if (video.youtube_id) {
            if (video.publish_status === 'published') {
                return 'status-published';
            } else if (video.publish_status === 'scheduled') {
                return 'status-scheduled';
            }
        }
        return 'status-draft';
    };

    const getStatusText = video => {
        if (video.youtube_id) {
            if (video.publish_status === 'published') {
                return 'Pubblicato';
            } else if (video.publish_status === 'scheduled') {
                return 'Programmato';
            }
        }
        return 'Bozza';
    };

    const getStatusTooltip = video => {
        if (video.publish_status === 'scheduled' && video.publish_at) {
            return `Programmato per: ${formatDate(video.publish_at)}`;
        }
        return '';
    };

    // Lifecycle hooks
    onMounted(() => {
        fetchVideos();
        // Chiudi il menu quando si clicca fuori
        document.addEventListener('click', e => {
            if (!e.target.closest('.video-actions')) {
                activeMenu.value = null;
            }
        });
    });
</script>

<style scoped>
    .video-collection {
        padding: 2rem;
    }

    .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }

    .video-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }

    .video-card:hover {
        transform: translateY(-2px);
    }

    .video-thumbnail {
        position: relative;
        width: 100%;
        background: #f0f0f0;
    }

    .video-info {
        padding: 1rem;
    }

    .video-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
    }

    .video-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
        flex: 1;
        margin-right: 1rem;
    }

    .video-metadata {
        margin-top: 1rem;
        font-size: 0.9rem;
        color: #666;
    }

    .video-metadata span {
        margin-right: 1rem;
    }

    .video-metadata i {
        margin-right: 0.5rem;
    }

    .video-actions {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        z-index: 10;
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
        transition: background-color 0.2s;
    }

    .action-menu:hover {
        background: rgba(0, 0, 0, 0.7);
    }

    .action-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        min-width: 150px;
    }

    .action-dropdown button {
        display: block;
        width: 100%;
        padding: 0.75rem 1rem;
        text-align: left;
        border: none;
        background: none;
        cursor: pointer;
        color: #333;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .action-dropdown button:hover {
        background-color: #f5f5f5;
    }

    .action-dropdown button.delete-btn {
        color: #dc3545;
    }

    .action-dropdown button.delete-btn:hover {
        background-color: #fff5f5;
    }

    .action-dropdown button i {
        margin-right: 0.5rem;
        width: 16px;
    }

    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 2rem;
        gap: 1rem;
    }

    .page-btn {
        background: #f0f0f0;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-btn:not(:disabled):hover {
        background: #e0e0e0;
    }

    .page-info {
        font-size: 0.9rem;
        color: #666;
    }

    .status-tag {
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-weight: 500;
        position: relative;
    }

    .status-draft {
        background-color: #f0f0f0;
        color: #666;
    }

    .status-published {
        background-color: #d4edda;
        color: #155724;
    }

    .status-scheduled {
        background-color: #fff3cd;
        color: #856404;
    }

    [data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        white-space: nowrap;
        z-index: 1000;
        margin-bottom: 5px;
    }
</style>
