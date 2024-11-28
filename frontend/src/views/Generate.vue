<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8 text-center">Genera Video</h1>

        <!-- Video search results -->
        <div
            v-if="videoStore.videos.length > 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            <div
                v-for="video in videoStore.videos"
                :key="video.id"
                class="bg-white rounded-lg shadow-md overflow-hidden"
            >
                <video
                    class="w-full h-48 object-cover"
                    :src="video.video_files[0].link"
                    muted
                    loop
                    @mouseover="$event.target.play()"
                    @mouseleave="$event.target.pause()"
                ></video>
                <div class="p-4">
                    <button
                        @click="selectVideo(video)"
                        class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                    >
                        Seleziona
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="videoStore.loading" class="text-center py-8">
            <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
            ></div>
            <p class="mt-4 text-gray-600">Caricamento in corso...</p>
        </div>

        <!-- Error state -->
        <div
            v-if="videoStore.error"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
        >
            <strong class="font-bold">Errore!</strong>
            <span class="block sm:inline">{{ videoStore.error }}</span>
        </div>
    </div>
</template>

<script setup>
import { useVideoStore } from "../stores/video";
import { useRouter } from "vue-router";

const videoStore = useVideoStore();
const router = useRouter();

function selectVideo(video) {
    // Qui potremmo salvare il video selezionato nello store
    // e poi reindirizzare l'utente alla pagina di generazione
    router.push("/");
}
</script>
