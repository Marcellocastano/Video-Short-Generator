<template>
    <div v-if="show" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h3>Conferma Eliminazione</h3>
                <button class="close-button" @click="closeModal">×</button>
            </div>
            <div class="modal-body">
                <p>Sei sicuro di voler eliminare questo video?</p>
                <p class="video-title">{{ videoTitle }}</p>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn" @click="closeModal">Annulla</button>
                <button
                    class="delete-btn"
                    @click="confirmDelete"
                    :disabled="isDeleting"
                >
                    {{ isDeleting ? 'Eliminazione...' : 'Elimina' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    import axios from 'axios';

    export default {
        name: 'DeleteVideoModal',
        props: {
            show: {
                type: Boolean,
                required: true,
            },
            videoId: {
                type: Number,
                required: true,
            },
            videoTitle: {
                type: String,
                required: true,
            },
        },
        data() {
            return {
                isDeleting: false,
            };
        },
        methods: {
            async confirmDelete() {
                this.isDeleting = true;
                try {
                    await axios.delete(`/api/videos/${this.videoId}`);
                    this.$emit('video-deleted');
                    this.closeModal();
                } catch (error) {
                    console.error(
                        "Errore durante l'eliminazione del video:",
                        error
                    );
                } finally {
                    this.isDeleting = false;
                }
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
        max-width: 500px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
        padding: 1rem;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
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

    .video-title {
        font-weight: 500;
        color: #666;
        margin-top: 0.5rem;
    }

    .modal-footer {
        padding: 1rem;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .cancel-btn,
    .delete-btn {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-weight: 500;
    }

    .cancel-btn {
        background: #f5f5f5;
        color: #333;
    }

    .delete-btn {
        background: #dc3545;
        color: white;
    }

    .delete-btn:disabled {
        background: #e9a0a8;
        cursor: not-allowed;
    }

    .cancel-btn:hover {
        background: #eee;
    }

    .delete-btn:not(:disabled):hover {
        background: #c82333;
    }
</style>
