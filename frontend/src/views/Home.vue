<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8 text-center">
            YouTube Shorts Generator
        </h1>

        <div class="max-w-2xl mx-auto">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-semibold mb-4">Crea un nuovo video</h2>

                <form @submit.prevent="startGeneration" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700"
                            >Testo del video</label
                        >
                        <textarea
                            v-model="formData.text"
                            rows="4"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Inserisci il testo che vuoi trasformare in video..."
                        ></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700"
                            >Parole chiave per la ricerca video</label
                        >
                        <input
                            v-model="formData.searchQuery"
                            type="text"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="es. natura, città, tecnologia..."
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700"
                                >Lingua</label
                            >
                            <select
                                v-model="formData.language"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="en-US">English</option>
                                <option value="it-IT">Italiano</option>
                            </select>
                        </div>

                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700"
                                >Voce</label
                            >
                            <select
                                v-model="formData.voice"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="male">Maschile</option>
                                <option value="female">Femminile</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        :disabled="loading"
                    >
                        {{
                            loading ? "Generazione in corso..." : "Genera Video"
                        }}
                    </button>
                </form>
            </div>

            <!-- Preview section -->
            <div
                v-if="generatedVideo?.videoPath"
                class="mt-8 bg-white rounded-lg shadow-md p-6"
            >
                <h2 class="text-2xl font-semibold mb-4">Video Generato</h2>
                <div class="aspect-[9/16] relative">
                    <video
                        controls
                        class="absolute inset-0 w-full h-full rounded-lg"
                        :src="generatedVideo.videoPath"
                    ></video>
                </div>
                <div class="mt-4 flex justify-between items-center">
                    <a
                        :href="generatedVideo.videoPath"
                        download
                        class="inline-block bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    >
                        Scarica Video
                    </a>
                    <span class="text-sm text-gray-500">{{
                        generatedVideo.message
                    }}</span>
                </div>
            </div>

            <!-- Error message -->
            <div
                v-if="error"
                class="mt-8 bg-red-50 border border-red-200 rounded-lg shadow-md p-6"
            >
                <h2 class="text-xl font-semibold mb-2 text-red-700">Error</h2>
                <p class="text-red-600">{{ error }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useVideoStore } from "../stores/video";

const videoStore = useVideoStore();

const formData = ref({
    text: "",
    searchQuery: "",
    language: "en-US",
    voice: "male",
});

const loading = computed(() => videoStore.loading);
const generatedVideo = computed(() => videoStore.generatedVideo);
const error = ref(null);

async function startGeneration() {
    error.value = null;
    if (!formData.value.text || !formData.value.searchQuery) {
        error.value = "Please fill in all fields";
        return;
    }

    try {
        console.log("Starting video generation with:", formData.value);
        await videoStore.searchVideos(formData.value.searchQuery);

        if (!videoStore.videos || videoStore.videos.length === 0) {
            error.value = "No videos found for your search query";
            return;
        }

        const selectedVideo = videoStore.videos[0];
        console.log("Selected video:", selectedVideo);

        if (!selectedVideo.videos?.large?.url) {
            error.value = "Invalid video format received";
            return;
        }

        const videoUrl = selectedVideo.videos.large.url;
        console.log("Using video URL:", videoUrl);

        await videoStore.generateVideo({
            videoUrl,
            text: formData.value.text,
            language: formData.value.language,
            voice: formData.value.voice,
        });

        console.log("Generated video:", videoStore.generatedVideo);
    } catch (err) {
        console.error("Error in video generation:", err);
        error.value =
            err.message || "An error occurred during video generation";
    }
}
</script>
