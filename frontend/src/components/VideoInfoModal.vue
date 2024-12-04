<template>
    <div v-if="show" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h3>Informazioni Video</h3>
                <button class="close-button" @click="closeModal">×</button>
            </div>
            <div v-if="loading" class="modal-body loading">
                <div class="spinner"></div>
                <p>Caricamento informazioni...</p>
            </div>
            <div v-else-if="error" class="modal-body error">
                <p>{{ error }}</p>
            </div>
            <div v-else class="modal-body">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Titolo</label>
                        <p>{{ videoInfo.title || 'Non specificato' }}</p>
                    </div>
                    <div class="info-item">
                        <label>Data Creazione</label>
                        <p>{{ formatDate(videoInfo.created_at) }}</p>
                    </div>
                    <div class="info-item">
                        <label>Descrizione</label>
                        <p>
                            {{ videoInfo.description || 'Nessuna descrizione' }}
                        </p>
                    </div>
                    <div class="info-item">
                        <label>Hashtag</label>
                        <p>
                            {{ formatHashtags(videoInfo.metadata?.hashtags) }}
                        </p>
                    </div>
                    <div class="info-item">
                        <label>Privacy</label>
                        <p>
                            {{
                                videoInfo.metadata?.privacy || 'Non specificata'
                            }}
                        </p>
                    </div>
                    <div class="info-item">
                        <label>Dimensione</label>
                        <p>{{ formatSize(videoInfo.metadata?.size) }}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="close-btn" @click="closeModal">Chiudi</button>
            </div>
        </div>
    </div>
</template>

<script>
    import axios from 'axios';

    export default {
        name: 'VideoInfoModal',
        props: {
            show: {
                type: Boolean,
                required: true,
            },
            videoId: {
                type: Number,
                required: true,
            },
        },
        data() {
            return {
                videoInfo: null,
                loading: false,
                error: null,
            };
        },
        watch: {
            show(newVal) {
                if (newVal) {
                    this.fetchVideoInfo();
                }
            },
        },
        methods: {
            async fetchVideoInfo() {
                this.loading = true;
                this.error = null;
                try {
                    const response = await axios.get(
                        `/api/videos/${this.videoId}`
                    );
                    this.videoInfo = response.data;
                } catch (error) {
                    console.error(
                        'Errore nel caricamento delle informazioni:',
                        error
                    );
                    this.error =
                        'Errore nel caricamento delle informazioni del video';
                } finally {
                    this.loading = false;
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
            formatHashtags(hashtags) {
                if (!hashtags || !hashtags.length) return 'Nessun hashtag';
                return hashtags.map(tag => `#${tag}`).join(' ');
            },
            formatSize(bytes) {
                if (!bytes) return 'Dimensione non disponibile';
                const units = ['B', 'KB', 'MB', 'GB'];
                let size = bytes;
                let unitIndex = 0;
                while (size >= 1024 && unitIndex < units.length - 1) {
                    size /= 1024;
                    unitIndex++;
                }
                return `${size.toFixed(2)} ${units[unitIndex]}`;
            },
            closeModal() {
                this.$emit('update:show', false);
            },
        },
    };
</script>

<style scoped>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
        padding: 1rem;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        background: white;
        z-index: 1;
    }

    .modal-header h3 {
        margin: 0;
        color: #333;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-body.loading,
    .modal-body.error {
        text-align: center;
        padding: 2rem;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        margin: 0 auto 1rem;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .info-item {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
    }

    .info-item label {
        display: block;
        font-weight: 500;
        color: #666;
        margin-bottom: 0.5rem;
    }

    .info-item p {
        margin: 0;
        color: #333;
        word-break: break-word;
    }

    .modal-footer {
        padding: 1rem;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
    }

    .close-btn {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        background: #f5f5f5;
        color: #333;
        cursor: pointer;
        font-weight: 500;
    }

    .close-btn:hover {
        background: #eee;
    }

    .error {
        color: #dc3545;
    }
</style>
