<template>
  <div class="performance-videos">
    <div class="page-header">
      <h1>연주영상 리스트</h1>
      <p>밴드의 연주 영상을 공유하고 감상하세요</p>
    </div>

    <!-- 검색 및 필터 섹션 -->
    <div class="filter-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-input
              v-model="searchQuery"
              placeholder="제목, 아티스트, 장르로 검색..."
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          
          <el-col :xs="24" :sm="6" :md="4">
            <el-select v-model="selectedGenre" placeholder="장르" clearable @change="handleFilter">
              <el-option label="전체" value="" />
              <el-option label="Rock" value="Rock" />
              <el-option label="Pop" value="Pop" />
              <el-option label="Jazz" value="Jazz" />
              <el-option label="Classical" value="Classical" />
              <el-option label="Blues" value="Blues" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="6" :md="4">
            <el-select v-model="sortBy" placeholder="정렬" @change="handleSort">
              <el-option label="최신순" value="createdAt" />
              <el-option label="조회수순" value="viewCount" />
              <el-option label="좋아요순" value="likeCount" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="8">
            <div class="action-buttons">
              <el-button @click="loadVideos" :loading="loading">
                <el-icon><Refresh /></el-icon>
                새로고침
              </el-button>
              <el-button type="primary" @click="showUploadDialog = true">
                <el-icon><Plus /></el-icon>
                영상 추가
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 영상 목록 -->
    <div class="videos-section">
      <div v-if="loading" class="loading-container">
        <el-row :gutter="20">
          <el-col v-for="n in 6" :key="n" :xs="24" :sm="12" :md="8">
            <el-card>
              <el-skeleton :rows="4" animated />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div v-else-if="filteredVideos.length === 0" class="empty-state">
        <el-empty description="연주영상이 없습니다">
          <el-button type="primary" @click="showUploadDialog = true">
            첫 번째 영상 추가하기
          </el-button>
        </el-empty>
      </div>

      <el-row v-else :gutter="20">
        <el-col 
          v-for="video in filteredVideos" 
          :key="video.id"
          :xs="24" :sm="12" :md="8" :lg="6"
        >
          <el-card class="video-card" shadow="hover">
            <!-- 썸네일 -->
            <div class="video-thumbnail" @click="playVideo(video)">
              <img 
                :src="video.thumbnailUrl || getYoutubeThumbnail(video.videoUrl)" 
                :alt="video.title"
                @error="handleImageError"
              />
              <div class="play-overlay">
                <el-icon class="play-icon"><VideoPlay /></el-icon>
              </div>
              <div class="duration-badge" v-if="video.duration">
                {{ formatDuration(video.duration) }}
              </div>
            </div>

            <!-- 영상 정보 -->
            <div class="video-info">
              <h4 class="video-title" :title="video.title">{{ video.title }}</h4>
              
              <div class="video-meta">
                <div class="meta-item">
                  <el-icon><User /></el-icon>
                  <span>{{ video.uploaderUserName }}</span>
                </div>
                
                <div class="meta-item" v-if="video.artist">
                  <el-icon><Headset /></el-icon>
                  <span>{{ video.artist }}</span>
                </div>
                
                <div class="meta-item" v-if="video.genre">
                  <el-tag size="small" type="info">{{ video.genre }}</el-tag>
                </div>
              </div>

              <div class="video-stats">
                <div class="stat-item">
                  <el-icon><Monitor /></el-icon>
                  <span>{{ formatNumber(video.viewCount) }}</span>
                </div>
                
                <div class="stat-item">
                  <el-icon><Star /></el-icon>
                  <span>{{ formatNumber(video.likeCount) }}</span>
                </div>
                
                <div class="stat-item">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDate(video.createdAt) }}</span>
                </div>
              </div>

              <!-- 태그 -->
              <div class="video-tags" v-if="video.tags && video.tags.length > 0">
                <el-tag 
                  v-for="tag in video.tags.slice(0, 3)" 
                  :key="tag"
                  size="small"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="video.tags.length > 3" class="more-tags">
                  +{{ video.tags.length - 3 }}
                </span>
              </div>

              <!-- 액션 버튼 -->
              <div class="video-actions">
                <el-button size="small" @click="playVideo(video)">
                  <el-icon><VideoPlay /></el-icon>
                  재생
                </el-button>
                <el-button size="small" @click="likeVideo(video)">
                  <el-icon><Star /></el-icon>
                  좋아요
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 영상 업로드 다이얼로그 -->
    <el-dialog v-model="showUploadDialog" title="연주영상 추가" width="600px">
      <el-form :model="newVideo" label-width="120px">
        <el-form-item label="영상 제목" required>
          <el-input v-model="newVideo.title" placeholder="영상 제목을 입력하세요" />
        </el-form-item>
        
        <el-form-item label="영상 URL" required>
          <el-input 
            v-model="newVideo.videoUrl" 
            placeholder="YouTube URL 또는 영상 링크"
            @blur="extractVideoInfo"
          />
        </el-form-item>
        
        <el-form-item label="업로더 이름" required>
          <el-input v-model="newVideo.uploaderUserName" placeholder="당신의 이름" />
        </el-form-item>
        
        <el-form-item label="곡명">
          <el-input v-model="newVideo.songTitle" placeholder="연주한 곡의 제목" />
        </el-form-item>
        
        <el-form-item label="아티스트">
          <el-input v-model="newVideo.artist" placeholder="원곡 아티스트" />
        </el-form-item>
        
        <el-form-item label="장르">
          <el-select v-model="newVideo.genre" placeholder="장르 선택">
            <el-option label="Rock" value="Rock" />
            <el-option label="Pop" value="Pop" />
            <el-option label="Jazz" value="Jazz" />
            <el-option label="Classical" value="Classical" />
            <el-option label="Blues" value="Blues" />
            <el-option label="Folk" value="Folk" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="설명">
          <el-input 
            v-model="newVideo.description" 
            type="textarea" 
            placeholder="영상에 대한 설명"
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item label="태그">
          <el-input 
            v-model="tagInput" 
            placeholder="태그를 입력하고 Enter를 누르세요"
            @keyup.enter="addTag"
          />
          <div class="tag-list" v-if="newVideo.tags.length > 0">
            <el-tag 
              v-for="tag in newVideo.tags" 
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showUploadDialog = false">취소</el-button>
        <el-button type="primary" @click="uploadVideo" :loading="uploading">
          추가하기
        </el-button>
      </template>
    </el-dialog>

    <!-- 영상 재생 다이얼로그 -->
    <el-dialog v-model="showVideoDialog" :title="selectedVideo?.title" width="80%" top="5vh">
      <div class="video-player" v-if="selectedVideo">
        <iframe 
          v-if="isYouTubeUrl(selectedVideo.videoUrl)"
          :src="getYouTubeEmbedUrl(selectedVideo.videoUrl)"
          frameborder="0"
          allowfullscreen
          class="youtube-player"
        ></iframe>
        <video v-else :src="selectedVideo.videoUrl" controls class="video-element">
          브라우저가 비디오를 지원하지 않습니다.
        </video>
        
        <div class="video-details">
          <h3>{{ selectedVideo.title }}</h3>
          <p v-if="selectedVideo.description">{{ selectedVideo.description }}</p>
          <div class="video-meta-detail">
            <span>업로더: {{ selectedVideo.uploaderUserName }}</span>
            <span v-if="selectedVideo.artist">아티스트: {{ selectedVideo.artist }}</span>
            <span>조회수: {{ formatNumber(selectedVideo.viewCount) }}</span>
            <span>좋아요: {{ formatNumber(selectedVideo.likeCount) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { performanceAPI } from '@/services/api'
import { ElMessage } from 'element-plus'

export default {
  name: 'PerformanceVideosPage',
  data() {
    return {
      loading: false,
      uploading: false,
      videos: [],
      filteredVideos: [],
      searchQuery: '',
      selectedGenre: '',
      sortBy: 'createdAt',
      showUploadDialog: false,
      showVideoDialog: false,
      selectedVideo: null,
      tagInput: '',
      newVideo: {
        title: '',
        videoUrl: '',
        uploaderUserName: '',
        uploaderUserId: 'user-' + Date.now(),
        songTitle: '',
        artist: '',
        genre: '',
        description: '',
        tags: []
      }
    }
  },
  async mounted() {
    await this.loadVideos()
  },
  methods: {
    async loadVideos() {
      this.loading = true
      try {
        const response = await performanceAPI.getVideos()
        this.videos = response.data
        this.applyFilters()
      } catch (error) {
        console.error('영상 로드 실패:', error)
        ElMessage.error('영상을 불러오는데 실패했습니다')
      } finally {
        this.loading = false
      }
    },
    
    applyFilters() {
      let filtered = [...this.videos]
      
      // 검색 필터
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(video => 
          video.title?.toLowerCase().includes(query) ||
          video.artist?.toLowerCase().includes(query) ||
          video.genre?.toLowerCase().includes(query) ||
          video.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      // 장르 필터
      if (this.selectedGenre) {
        filtered = filtered.filter(video => video.genre === this.selectedGenre)
      }
      
      // 정렬
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'viewCount':
            return (b.viewCount || 0) - (a.viewCount || 0)
          case 'likeCount':
            return (b.likeCount || 0) - (a.likeCount || 0)
          case 'createdAt':
          default:
            return (b.createdAt || 0) - (a.createdAt || 0)
        }
      })
      
      this.filteredVideos = filtered
    },
    
    handleSearch() {
      this.applyFilters()
    },
    
    handleFilter() {
      this.applyFilters()
    },
    
    handleSort() {
      this.applyFilters()
    },
    
    async uploadVideo() {
      if (!this.newVideo.title || !this.newVideo.videoUrl || !this.newVideo.uploaderUserName) {
        ElMessage.warning('제목, 영상 URL, 업로더 이름은 필수입니다')
        return
      }
      
      this.uploading = true
      try {
        // 현재는 실제 업로드가 구현되지 않았으므로 메시지만 표시
        ElMessage.info('영상 업로드 기능은 추후 구현 예정입니다')
        this.showUploadDialog = false
      } catch (error) {
        console.error('영상 업로드 실패:', error)
        ElMessage.error('영상 업로드에 실패했습니다')
      } finally {
        this.uploading = false
      }
    },
    
    playVideo(video) {
      this.selectedVideo = video
      this.showVideoDialog = true
      
      // 조회수 증가 (실제로는 API 호출)
      video.viewCount = (video.viewCount || 0) + 1
    },
    
    async likeVideo(video) {
      try {
        video.likeCount = (video.likeCount || 0) + 1
        ElMessage.success('좋아요를 눌렀습니다!')
      } catch (error) {
        ElMessage.error('좋아요 처리에 실패했습니다')
      }
    },
    
    addTag() {
      if (this.tagInput.trim() && !this.newVideo.tags.includes(this.tagInput.trim())) {
        this.newVideo.tags.push(this.tagInput.trim())
        this.tagInput = ''
      }
    },
    
    removeTag(tag) {
      const index = this.newVideo.tags.indexOf(tag)
      if (index > -1) {
        this.newVideo.tags.splice(index, 1)
      }
    },
    
    extractVideoInfo() {
      // YouTube URL에서 정보 추출 (간단한 구현)
      if (this.isYouTubeUrl(this.newVideo.videoUrl) && !this.newVideo.title) {
        // 실제로는 YouTube API를 사용해야 함
        this.newVideo.title = 'YouTube 영상'
      }
    },
    
    isYouTubeUrl(url) {
      return url && (url.includes('youtube.com') || url.includes('youtu.be'))
    },
    
    getYouTubeEmbedUrl(url) {
      if (!url) return ''
      
      let videoId = ''
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0]
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]
      }
      
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url
    },
    
    getYoutubeThumbnail(url) {
      if (!this.isYouTubeUrl(url)) return '/placeholder-video.jpg'
      
      let videoId = ''
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0]
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]
      }
      
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '/placeholder-video.jpg'
    },
    
    handleImageError(event) {
      event.target.src = '/placeholder-video.jpg'
    },
    
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },
    
    formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num?.toString() || '0'
    },
    
    formatDate(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return '오늘'
      if (diffDays === 1) return '어제'
      if (diffDays < 7) return `${diffDays}일 전`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`
      return `${Math.floor(diffDays / 365)}년 전`
    }
  }
}
</script>

<style scoped>
.performance-videos {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 1.1rem;
  color: #666;
}

.filter-section {
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.videos-section {
  margin-bottom: 40px;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.video-card {
  margin-bottom: 20px;
  height: 100%;
  overflow: hidden;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 8px;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-thumbnail:hover img {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-thumbnail:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  color: white;
  font-size: 24px;
}

.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.video-info {
  padding: 15px;
}

.video-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  color: #666;
  font-size: 0.9rem;
}

.video-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.8rem;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.video-tags {
  margin-bottom: 15px;
}

.tag-item {
  margin-right: 5px;
  margin-bottom: 5px;
}

.more-tags {
  color: #999;
  font-size: 0.8rem;
}

.video-actions {
  display: flex;
  gap: 10px;
}

.video-player {
  text-align: center;
}

.youtube-player,
.video-element {
  width: 100%;
  height: 400px;
  border-radius: 8px;
}

.video-details {
  margin-top: 20px;
  text-align: left;
}

.video-details h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.video-meta-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #666;
}

.tag-list {
  margin-top: 10px;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .action-buttons {
    justify-content: center;
    margin-top: 15px;
  }
  
  .video-thumbnail {
    height: 200px;
  }
  
  .video-stats {
    flex-direction: column;
    gap: 5px;
  }
  
  .video-actions {
    flex-direction: column;
  }
  
  .youtube-player,
  .video-element {
    height: 250px;
  }
  
  .video-meta-detail {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
