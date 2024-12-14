<template>
    <Modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        title="Informazioni Video"
        width="800"
    >
        <div v-if="loading" class="d-flex flex-column align-center pa-4">
            <v-progress-circular
                indeterminate
                color="primary"
                size="32"
            ></v-progress-circular>
            <span class="mt-2">Caricamento informazioni...</span>
        </div>

        <div v-else-if="error" class="pa-4 text-center error--text">
            {{ error }}
        </div>

        <v-container v-else>
            <v-row>
                <v-col cols="12" sm="6">
                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="text-subtitle-1"
                            >Informazioni Base</v-card-title
                        >
                        <v-card-text>
                            <div class="d-flex flex-column gap-2">
                                <div>
                                    <div class="text-caption">Titolo</div>
                                    <div>
                                        {{
                                            videoInfo.title || 'Non specificato'
                                        }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">
                                        Data Creazione
                                    </div>
                                    <div>
                                        {{ formatDate(videoInfo.created_at) }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">Descrizione</div>
                                    <div>
                                        {{
                                            videoInfo.description ||
                                            'Nessuna descrizione'
                                        }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">Stato</div>
                                    <div>
                                        {{
                                            videoInfo.status ||
                                            'Non specificato'
                                        }}
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" sm="6">
                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="text-subtitle-1"
                            >YouTube</v-card-title
                        >
                        <v-card-text>
                            <div class="d-flex flex-column gap-2">
                                <div>
                                    <div class="text-caption">
                                        Pubblicazione
                                    </div>
                                    <div>
                                        {{
                                            videoInfo.publish_status ||
                                            'Non specificato'
                                        }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">
                                        Privacy YouTube
                                    </div>
                                    <div>
                                        {{
                                            videoInfo.youtube_privacy ||
                                            'Non specificato'
                                        }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">ID YouTube</div>
                                    <div>
                                        {{
                                            videoInfo.youtube_id ||
                                            'Non disponibile'
                                        }}
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12">
                    <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1"
                            >Metadati</v-card-title
                        >
                        <v-card-text>
                            <div class="d-flex flex-column gap-2">
                                <div>
                                    <div class="text-caption">Hashtag</div>
                                    <div>
                                        {{
                                            formatHashtags(
                                                videoInfo.metadata?.hashtags
                                            )
                                        }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">Lingua</div>
                                    <div>
                                        {{
                                            videoInfo.metadata?.language ||
                                            'Non specificata'
                                        }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">
                                        Nome Originale
                                    </div>
                                    <div>
                                        {{
                                            videoInfo.metadata?.originalName ||
                                            'Non specificato'
                                        }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-caption">Dimensione</div>
                                    <div>
                                        {{
                                            formatSize(videoInfo.metadata?.size)
                                        }}
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </Modal>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import axios from 'axios';
    import Modal from './Modal.vue';

    // Props definition
    const props = defineProps({
        show: {
            type: Boolean,
            required: true,
        },
        videoId: {
            type: Number,
            required: true,
        },
    });

    // Emits definition
    const emit = defineEmits(['update:show']);

    // State
    const videoInfo = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Methods
    const fetchVideoInfo = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await axios.get(`/api/videos/${props.videoId}`);
            if (response.data) {
                const data = response.data.video;
                console.log('Dati video:', data);
                // Parse metadata if it's a string
                const metadata =
                    typeof data.metadata === 'string'
                        ? JSON.parse(data.metadata)
                        : data.metadata;

                videoInfo.value = {
                    title: data.title || 'Non specificato',
                    created_at: data.created_at,
                    description: data.description || 'Nessuna descrizione',
                    status: data.status || 'Non specificato',
                    publish_status: data.publish_status || 'Non specificato',
                    youtube_privacy: data.youtube_privacy || 'Non specificato',
                    youtube_id: data.youtube_id || 'Non disponibile',
                    metadata: {
                        hashtags: metadata?.hashtags || [],
                        privacy: metadata?.privacy || 'Non specificata',
                        language: metadata?.language || 'Non specificata',
                        originalName:
                            metadata?.originalName || 'Non specificato',
                        size: metadata?.size || 0,
                    },
                };
            } else {
                throw new Error('Dati video non disponibili');
            }
        } catch (err) {
            console.error('Errore nel caricamento delle informazioni:', err);
            error.value = 'Errore nel caricamento delle informazioni del video';
            videoInfo.value = null;
        } finally {
            loading.value = false;
        }
    };

    const formatDate = date => {
        if (!date) return 'Data non disponibile';
        try {
            return new Date(date).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (err) {
            console.error('Errore nella formattazione della data:', err);
            return 'Data non valida';
        }
    };

    const formatHashtags = hashtags => {
        if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
            // Try to extract hashtags from description if available
            if (videoInfo.value?.description) {
                const matches = videoInfo.value.description.match(/#\w+/g);
                if (matches) {
                    return matches.join(' ');
                }
            }
            return 'Nessun hashtag';
        }
        return hashtags.map(tag => `#${tag}`).join(' ');
    };

    const formatSize = bytes => {
        if (!bytes || isNaN(bytes)) return 'Dimensione non disponibile';
        try {
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = parseFloat(bytes);
            let unitIndex = 0;

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            return `${size.toFixed(2)} ${units[unitIndex]}`;
        } catch (err) {
            console.error('Errore nel calcolo della dimensione:', err);
            return 'Dimensione non valida';
        }
    };

    // Watch for show prop changes
    watch(
        () => props.show,
        newVal => {
            if (newVal && props.videoId) {
                fetchVideoInfo();
            } else {
                videoInfo.value = null;
                error.value = null;
            }
        }
    );
</script>
