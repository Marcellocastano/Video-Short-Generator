import { defineStore } from "pinia";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useVideoStore = defineStore("video", {
    state: () => ({
        videos: [],
        loading: false,
        error: null,
        generatedVideo: null,
    }),

    actions: {
        async searchVideos(query) {
            this.loading = true;
            try {
                const response = await axios.post(`${API_URL}/videos/search`, {
                    query,
                });
                this.videos = response.data.videos;
            } catch (error) {
                this.error = error.message;
                console.error("Error searching videos:", error);
            } finally {
                this.loading = false;
            }
        },

        async generateVideo(params) {
            this.loading = true;
            try {
                const response = await axios.post(
                    `${API_URL}/videos/generate`,
                    params,
                );
                this.generatedVideo = response.data;
            } catch (error) {
                this.error = error.message;
                console.error("Error generating video:", error);
            } finally {
                this.loading = false;
            }
        },
    },
});
