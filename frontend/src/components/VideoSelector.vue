<template>
    <div class="w-100">
        <div>
            <v-text-field
                v-model="searchQuery"
                label="Cerca video inserendo una parola chiave"
                variant="outlined"
                :append-inner-icon="'mdi-magnify'"
                @click:append-inner="performSearch"
            />
        </div>

        <!-- Selected Videos Preview -->
        <v-container v-if="selectedVideos.length > 0" class="pa-0">
            <v-row>
                <v-col
                    v-for="video in selectedVideos"
                    :key="video.id"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                    class="d-flex"
                >
                    <v-card class="flex-grow-1" variant="flat">
                        <div class="position-relative">
                            <div v-if="video.source === 'pixabay'">
                                <video
                                    :src="video.videos.tiny.url"
                                    loop
                                    muted
                                    width="100%"
                                    height="auto"
                                    class="rounded"
                                    @mouseover="e => e.target.play()"
                                    @mouseleave="
                                        e => {
                                            e.target.pause();
                                            e.target.currentTime = 0;
                                        }
                                    "
                                ></video>
                            </div>
                            <div v-else>
                                <v-img
                                    :src="
                                        video.preview || video.videos.tiny.url
                                    "
                                    :alt="'Preview for video ' + video.id"
                                    cover
                                    height="200"
                                ></v-img>
                            </div>

                            <v-btn
                                icon="mdi-close"
                                size="small"
                                color="error"
                                variant="flat"
                                class="position-absolute top-0 right-0 ma-2"
                                @click="removeVideo(video)"
                            ></v-btn>

                            <v-chip
                                v-if="video.source"
                                :color="
                                    video.source === 'pixabay'
                                        ? 'primary'
                                        : 'secondary'
                                "
                                size="small"
                                class="position-absolute bottom-0 left-0 ma-2"
                            >
                                {{ video.source }}
                            </v-chip>
                        </div>
                        <v-card-text class="pt-2 pb-2 text-center">
                            {{ formatDuration(video.duration) }}
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
    import { ref, watch } from 'vue';

    const emit = defineEmits(['update:modelValue']);
    const searchQuery = ref('');
    const selectedVideos = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const props = defineProps({
        modelValue: {
            type: Array,
            default: () => [],
        },
    });

    function isImageUrl(url) {
        console.log(url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        return url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    }

    watch(
        () => props.modelValue,
        newValue => {
            selectedVideos.value = newValue;
        },
        { immediate: true }
    );

    async function performSearch() {
        if (!searchQuery.value.trim()) return;

        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(
                `/api/videos/search?query=${encodeURIComponent(searchQuery.value)}`
            );
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            window.$app.showSearchResults(searchQuery.value, data);
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    }

    function removeVideo(video) {
        const index = selectedVideos.value.findIndex(v => v.id === video.id);
        if (index !== -1) {
            selectedVideos.value.splice(index, 1);
            emit('update:modelValue', selectedVideos.value);
        }
    }

    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function toggleVideoSelection(video) {
        const index = selectedVideos.value.findIndex(v => v.id === video.id);
        if (index === -1) {
            selectedVideos.value.push(video);
        } else {
            selectedVideos.value.splice(index, 1);
        }
        emit('update:modelValue', selectedVideos.value);
    }
</script>
