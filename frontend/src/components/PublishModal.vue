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
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: white;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: white;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .modal-body {
        padding: 1rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: white;
        font-weight: 500;
    }

    select,
    input {
        width: 100%;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: white;
        font-size: 1rem;
        backdrop-filter: blur(4px);
    }

    select:focus,
    input:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
    }

    select option {
        background: rgba(0, 0, 0, 0.9);
        color: white;
    }

    .modal-footer {
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        backdrop-filter: blur(4px);
    }

    .cancel-button {
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .publish-button {
        background: rgba(var(--accent-color-rgb), 0.8);
        border: 1px solid rgba(var(--accent-color-rgb), 0.4);
    }

    .publish-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
    }

    .publish-button:hover:not(:disabled) {
        background: rgba(var(--accent-color-rgb), 1);
    }
</style>
