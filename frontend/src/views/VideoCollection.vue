<template>
    <v-container fluid class="pa-4">
        <v-row>
            <v-col cols="12">
                <h1 class="text-h4 mb-6">Raccolta Video</h1>
            </v-col>
        </v-row>

        <v-row>
            <v-col
                v-for="video in videos"
                :key="video.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
            >
                <v-card class="h-100">
                    <div class="position-relative">
                        <VideoPlayer
                            :src="video.file_path"
                            :show-controls="false"
                            class="rounded-t"
                        />
                        <v-menu location="end">
                            <template v-slot:activator="{ props }">
                                <v-btn
                                    icon="mdi-dots-vertical"
                                    variant="text"
                                    v-bind="props"
                                    class="position-absolute top-0 end-0 ma-2 right-0"
                                    color="white"
                                ></v-btn>
                            </template>

                            <v-list>
                                <v-list-item @click="showVideoInfo(video)">
                                    <template v-slot:prepend>
                                        <v-icon>mdi-information</v-icon>
                                    </template>
                                    <v-list-item-title>Info</v-list-item-title>
                                </v-list-item>

                                <v-list-item
                                    v-if="!isPublished(video)"
                                    @click="showPublishModal(video)"
                                >
                                    <template v-slot:prepend>
                                        <v-icon>mdi-youtube</v-icon>
                                    </template>
                                    <v-list-item-title
                                        >Pubblica</v-list-item-title
                                    >
                                </v-list-item>

                                <v-list-item
                                    @click="showDeleteConfirm(video)"
                                    color="error"
                                >
                                    <template v-slot:prepend>
                                        <v-icon>mdi-delete</v-icon>
                                    </template>
                                    <v-list-item-title
                                        >Elimina</v-list-item-title
                                    >
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </div>

                    <v-card-text>
                        <div
                            class="d-flex align-center justify-space-between mb-2"
                        >
                            <div class="text-h6 text-truncate">
                                {{ video.title || 'Video senza titolo' }}
                            </div>
                            <v-chip
                                :color="getStatusColor(video)"
                                size="small"
                                :title="getStatusTooltip(video)"
                            >
                                {{ getStatusText(video) }}
                            </v-chip>
                        </div>
                        <p class="text-body-2 text-truncate mb-2">
                            {{ video.description || 'Nessuna descrizione' }}
                        </p>
                        <div class="d-flex align-center">
                            <v-icon size="small" class="me-1"
                                >mdi-calendar</v-icon
                            >
                            <span class="text-caption">{{
                                formatDate(video.created_at)
                            }}</span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row v-if="totalVideos > 8" justify="center" class="mt-6">
            <v-col cols="auto">
                <v-pagination
                    v-model="currentPage"
                    :length="totalPages"
                    :total-visible="5"
                    @update:model-value="changePage"
                ></v-pagination>
            </v-col>
        </v-row>

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
    </v-container>
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import axios from 'axios';
    import DeleteVideoModal from '../components/Modals/DeleteVideoModal.vue';
    import VideoInfoModal from '../components/Modals/VideoInfoModal.vue';
    import VideoPlayer from '../components/VideoPlayer.vue';
    import PublishModal from '../components/Modals/PublishModal.vue';

    // Stato
    const videos = ref([]);
    const selectedVideo = ref(null);
    const showDeleteModal = ref(false);
    const showInfoModal = ref(false);
    const isPublishModalVisible = ref(false);
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

    const showVideoInfo = video => {
        selectedVideo.value = video;
        showInfoModal.value = true;
    };

    const showPublishModal = video => {
        selectedVideo.value = video;
        isPublishModalVisible.value = true;
    };

    const showDeleteConfirm = video => {
        selectedVideo.value = video;
        showDeleteModal.value = true;
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

    const changePage = page => {
        currentPage.value = page;
        fetchVideos();
    };

    const isPublished = video => {
        return video.youtube_id && video.youtube_privacy !== 'private';
    };

    const getStatusText = video => {
        if (video.youtube_id) {
            return video.youtube_privacy === 'private'
                ? 'Non Pubblicato'
                : 'Pubblicato';
        }
        return 'In Locale';
    };

    const getStatusColor = video => {
        if (video.youtube_id) {
            return video.youtube_privacy === 'private' ? 'warning' : 'success';
        }
        return 'info';
    };

    const getStatusTooltip = video => {
        if (video.youtube_id) {
            return video.youtube_privacy === 'private'
                ? 'Video caricato su YouTube ma non pubblicato'
                : 'Video pubblicato su YouTube';
        }
        return 'Video presente solo in locale';
    };

    onMounted(fetchVideos);
</script>
