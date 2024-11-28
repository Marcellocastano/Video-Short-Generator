<!-- VideoSelector.vue -->
<template>
    <div class="video-selector">
        <div class="search-section">
            <div class="search-bar">
                <input
                    v-model="searchQuery"
                    type="text"
                    class="search-input"
                    placeholder="Cerca video inserendo una parola chiave"
                />
                <button
                    @click="performSearch"
                    class="search-button glass-button"
                    :disabled="!searchQuery.trim()"
                >
                    Cerca
                </button>
            </div>
        </div>

        <div v-if="selectedVideos.length > 0" class="selected-videos">
            <div
                v-for="video in selectedVideos"
                :key="video.id"
                class="selected-video-chip"
            >
                <span>Video {{ video.id }}</span>
                <button
                    @click="() => toggleVideoSelection(video)"
                    class="remove-button"
                >
                    ×
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["selected"]);
const searchQuery = ref("");
const selectedVideos = ref([]);
const loading = ref(false);
const error = ref(null);

async function performSearch() {
    if (!searchQuery.value.trim()) return;

    loading.value = true;
    error.value = null;

    try {
        const response = await fetch(
            `/api/videos/search?query=${encodeURIComponent(searchQuery.value)}`,
        );
        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();
        window.$app.showSearchResults(searchQuery.value, data);
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
}

function toggleVideoSelection(video) {
    const index = selectedVideos.value.findIndex((v) => v.id === video.id);
    if (index === -1) {
        selectedVideos.value.push(video);
    } else {
        selectedVideos.value.splice(index, 1);
    }
    emit("selected", selectedVideos.value);
}
</script>

<style scoped>
.video-selector {
    width: 100%;
}

.search-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.search-bar {
    width: 100%;
    display: flex;
    gap: 10px;
}

.search-input {
    color: var(--text-color);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    padding: 1rem;
    border-radius: 12px;
    width: 100%;
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    background: var(--glass-highlight);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow:
        0 0 0 3px var(--glass-highlight),
        inset 0 2px 4px var(--glass-shadow);
}

.search-button {
    color: var(--text-color);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.search-button:hover:not(:disabled) {
    background: var(--glass-highlight);
    transform: translateY(-2px);
    box-shadow:
        0 8px 20px -6px var(--glass-shadow),
        inset 0 1px 0 0 var(--glass-highlight);
}

.search-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.selected-videos {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
}

.selected-video-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    color: var(--text-color);
    box-shadow:
        0 4px 16px -2px var(--glass-shadow),
        inset 0 1px 0 0 var(--glass-highlight);
}

.remove-button {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 0.3rem;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.remove-button:hover {
    background: rgba(255, 255, 255, 0.1);
}
</style>
