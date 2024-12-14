<template>
    <Modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        title="Conferma Eliminazione"
        :width="500"
        persistent
    >
        <v-card-text>
            Sei sicuro di voler eliminare questo video?
            <p class="text-subtitle-1 mt-2">{{ videoTitle }}</p>
        </v-card-text>

        <template #footer>
            <v-spacer></v-spacer>
            <v-btn color="error" @click="confirmDelete" :loading="loading">
                Elimina
            </v-btn>
            <v-btn color="default" class="ml-2" @click="closeModal">
                Annulla
            </v-btn>
        </template>
    </Modal>
</template>

<script setup>
    import { ref } from 'vue';
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
        videoTitle: {
            type: String,
            required: true,
        },
    });

    // Emits definition
    const emit = defineEmits(['update:show', 'video-deleted']);

    // State
    const loading = ref(false);

    // Methods
    const closeModal = () => {
        emit('update:show', false);
    };

    const confirmDelete = async () => {
        loading.value = true;
        try {
            await axios.delete(`/api/videos/${props.videoId}`);
            emit('video-deleted');
            closeModal();
        } catch (error) {
            console.error("Errore durante l'eliminazione del video:", error);
        } finally {
            loading.value = false;
        }
    };
</script>
