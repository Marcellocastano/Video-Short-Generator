<template>
  <div class="video-collection">
    <h1>Raccolta Video</h1>
    
    <div class="video-grid">
      <div v-for="video in videos" :key="video.id" class="video-card">
        <div class="video-thumbnail">
          <img :src="video.thumbnail || '/placeholder.png'" :alt="video.title">
          <div class="video-duration">{{ formatDuration(video.duration) }}</div>
        </div>
        <div class="video-info">
          <h3>{{ video.title }}</h3>
          <p class="video-description">{{ video.description }}</p>
          <div class="video-metadata">
            <span><i class="fas fa-calendar"></i> {{ formatDate(video.publishAt) }}</span>
            <span><i class="fas fa-hashtag"></i> {{ video.metadata?.hashtags?.join(', ') }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)"
        class="page-btn"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <span class="page-info">Pagina {{ currentPage }} di {{ totalPages }}</span>
      
      <button 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)"
        class="page-btn"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'VideoCollection',
  data() {
    return {
      videos: [],
      currentPage: 1,
      totalPages: 1,
      pageSize: 12
    }
  },
  methods: {
    async fetchVideos() {
      try {
        const response = await axios.get(`/api/videos?page=${this.currentPage}&pageSize=${this.pageSize}`);
        this.videos = response.data.videos;
        this.totalPages = Math.ceil(response.data.total / this.pageSize);
      } catch (error) {
        console.error('Errore nel caricamento dei video:', error);
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    formatDuration(duration) {
      if (!duration) return '00:00';
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    async changePage(page) {
      this.currentPage = page;
      await this.fetchVideos();
    }
  },
  mounted() {
    this.fetchVideos();
  }
}
</script>

<style scoped>
.video-collection {
  padding: 20px;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.3s ease;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.video-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: transform 0.2s ease;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.video-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}

.video-info {
  padding: 15px;
}

.video-info h3 {
  margin: 0 0 10px 0;
  font-size: 1.1em;
  color: var(--text-color);
}

.video-description {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-metadata {
  display: flex;
  gap: 15px;
  font-size: 0.8em;
  color: #888;
}

.video-metadata i {
  margin-right: 5px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  gap: 15px;
}

.page-btn {
  background: rgba(40, 44, 52, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:disabled {
  background: rgba(204, 204, 204, 0.7);
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background: rgba(40, 44, 52, 0.9);
}

.page-info {
  font-size: 0.9em;
  color: #666;
}

/* Responsive design */
@media (max-width: 768px) {
  .video-collection {
    margin-left: var(--sidebar-width-collapsed);
  }
  
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}
</style>
