<template>
    <div v-if="modelValue" class="modal-overlay" @click="closeModal">
        <div class="modal-content glass-panel" @click.stop>
            <div class="modal-header">
                <h2>Pubblica su YouTube</h2>
                <button class="close-button" @click="closeModal">×</button>
            </div>

            <div class="modal-body">
                <div class="form-group">
                    <label>Modalità di pubblicazione</label>
                    <select v-model="publishMode" class="glass-input">
                        <option value="now">Pubblica ora</option>
                        <option value="schedule">
                            Programma pubblicazione
                        </option>
                    </select>
                </div>

                <div v-if="publishMode === 'schedule'" class="form-group">
                    <label>Data e ora di pubblicazione</label>
                    <input
                        v-model="scheduledTime"
                        type="datetime-local"
                        class="glass-input"
                        :min="minDateTime"
                    />
                </div>

                <div class="form-group">
                    <label>Privacy</label>
                    <select v-model="privacy" class="glass-input">
                        <option value="private">Privato</option>
                        <option value="unlisted">Non in elenco</option>
                        <option value="public">Pubblico</option>
                    </select>
                </div>
            </div>

            <div class="modal-footer">
                <button class="glass-button cancel-button" @click="closeModal">
                    Annulla
                </button>
                <button
                    class="glass-button publish-button"
                    @click="handlePublish"
                    :disabled="!isValid"
                >
                    {{ publishMode === 'now' ? 'Pubblica' : 'Programma' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            modelValue: {
                type: Boolean,
                required: true,
            },
            video: {
                type: Object,
                required: true,
            },
        },
        emits: ['update:modelValue', 'publish'],
        data() {
            return {
                publishMode: 'now',
                privacy: 'private',
                scheduledTime: '',
            };
        },
        computed: {
            minDateTime() {
                const now = new Date();
                now.setMinutes(now.getMinutes() + 1);
                return now.toISOString().slice(0, 16);
            },
            isValid() {
                if (this.publishMode === 'schedule') {
                    return (
                        this.scheduledTime &&
                        new Date(this.scheduledTime) > new Date()
                    );
                }
                return true;
            },
        },
        methods: {
            closeModal() {
                this.$emit('update:modelValue', false);
            },
            handlePublish() {
                const publishData = {
                    videoId: this.video.id,
                    publishMode: this.publishMode,
                    privacy: this.privacy,
                    scheduledTime:
                        this.publishMode === 'schedule'
                            ? this.scheduledTime
                            : null,
                };

                this.$emit('publish', publishData);
                this.closeModal();
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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        width: 90%;
        max-width: 500px;
        border-radius: 12px;
        padding: 1.5rem;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .modal-header h2 {
        margin: 0;
        color: var(--text-color);
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-color);
        cursor: pointer;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-color);
    }

    .glass-input {
        width: 100%;
        padding: 0.8rem 1rem;
        border-radius: 8px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        color: var(--text-color);
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .publish-button {
        background: var(--accent-color);
    }

    .publish-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .cancel-button {
        background: rgba(255, 255, 255, 0.1);
    }
</style>
