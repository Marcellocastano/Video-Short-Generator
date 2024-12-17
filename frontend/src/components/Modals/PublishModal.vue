<template>
    <Modal
        :show="modelValue"
        @update:show="$emit('update:modelValue', $event)"
        title="Pubblica su YouTube"
        width="600"
    >
        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-select
                        v-model="publishMode"
                        label="Modalità di pubblicazione"
                        :items="[
                            { title: 'Pubblica ora', value: 'now' },
                            {
                                title: 'Programma pubblicazione',
                                value: 'schedule',
                            },
                        ]"
                        variant="outlined"
                        density="comfortable"
                    ></v-select>
                </v-col>

                <v-col v-if="publishMode === 'schedule'" cols="12">
                    <v-text-field
                        v-model="scheduledTime"
                        type="datetime-local"
                        label="Data e ora di pubblicazione"
                        :min="minDateTime"
                        variant="outlined"
                        density="comfortable"
                    ></v-text-field>
                </v-col>

                <v-col cols="12">
                    <v-select
                        v-model="privacy"
                        label="Privacy"
                        :items="[
                            { title: 'Privato', value: 'private' },
                            { title: 'Non in elenco', value: 'unlisted' },
                            { title: 'Pubblico', value: 'public' },
                        ]"
                        variant="outlined"
                        density="comfortable"
                    ></v-select>
                </v-col>
            </v-row>
        </v-container>

        <template #footer>
            <v-row justify="end" class="px-4">
                <v-col cols="auto">
                    <v-btn
                        variant="outlined"
                        @click="$emit('update:modelValue', false)"
                    >
                        Annulla
                    </v-btn>
                </v-col>
                <v-col cols="auto">
                    <v-btn
                        color="primary"
                        :disabled="!isValid"
                        @click="handlePublish"
                    >
                        {{ publishMode === 'now' ? 'Pubblica' : 'Programma' }}
                    </v-btn>
                </v-col>
            </v-row>
        </template>
    </Modal>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import Modal from './Modal.vue';

    // Props definition
    const props = defineProps({
        modelValue: {
            type: Boolean,
            required: true,
        },
        video: {
            type: Object,
            required: true,
        },
    });

    // Emits definition
    const emit = defineEmits(['update:modelValue', 'publish']);

    // State
    const publishMode = ref('now');
    const privacy = ref('private');
    const scheduledTime = ref('');

    // Computed properties
    const minDateTime = computed(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        return now.toISOString().slice(0, 16);
    });

    const isValid = computed(() => {
        if (publishMode.value === 'schedule') {
            return (
                scheduledTime.value &&
                new Date(scheduledTime.value) > new Date()
            );
        }
        return true;
    });

    // Methods
    const handlePublish = () => {
        const publishData = {
            videoId: props.video.id,
            publishMode: publishMode.value,
            privacy: privacy.value,
            scheduledTime:
                publishMode.value === 'schedule' ? scheduledTime.value : null,
        };

        emit('publish', publishData);
        emit('update:modelValue', false);
    };
</script>
