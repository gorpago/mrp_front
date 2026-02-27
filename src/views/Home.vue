<template>
  <div class="home">
    <!-- 헤더 섹션 -->
    <div class="hero-section">
      <el-card class="hero-card" shadow="hover">
        <div class="hero-content">
          <el-icon class="hero-icon"><Headset /></el-icon>
          <h1>Music Rhythm Platform</h1>
          <p>밴드와 함께하는 실시간 메트로놈 공유 플랫폼</p>
        </div>
      </el-card>
    </div>

    <!-- 메뉴 섹션 -->
    <div class="menu-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12">
          <el-card class="menu-card" shadow="hover" @click="goToMetronome">
            <div class="menu-content">
              <el-icon class="menu-icon"><Timer /></el-icon>
              <h3>메트로놈 공유</h3>
              <p>실시간으로 밴드 멤버들과 메트로놈을 공유하세요</p>
              <ul class="feature-list">
                <li>실시간 BPM 동기화</li>
                <li>세션 코드로 간편 참가</li>
                <li>최대 10명까지 참여</li>
                <li>다양한 박자 지원</li>
              </ul>
              <el-button type="primary" size="large" class="menu-button">
                시작하기
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="12">
          <el-card class="menu-card" shadow="hover" @click="goToPerformance">
            <div class="menu-content">
              <el-icon class="menu-icon"><VideoPlay /></el-icon>
              <h3>연주영상 리스트</h3>
              <p>밴드의 연주 영상을 공유하고 관리하세요</p>
              <ul class="feature-list">
                <li>YouTube 연동 지원</li>
                <li>장르별 분류</li>
                <li>태그 시스템</li>
                <li>조회수 및 좋아요</li>
              </ul>
              <el-button type="success" size="large" class="menu-button">
                둘러보기
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 통계 섹션 -->
    <div class="stats-section">
      <el-card class="stats-card">
        <h3>실시간 통계</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <el-icon class="stat-icon"><Connection /></el-icon>
              <div class="stat-number">{{ stats.activeSessions }}</div>
              <div class="stat-label">활성 세션</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <el-icon class="stat-icon"><User /></el-icon>
              <div class="stat-number">{{ stats.totalUsers }}</div>
              <div class="stat-label">총 사용자</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <el-icon class="stat-icon"><VideoPlay /></el-icon>
              <div class="stat-number">{{ stats.totalVideos }}</div>
              <div class="stat-label">연주영상</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script>
import { metronomeAPI, performanceAPI, userAPI } from '@/services/api'

export default {
  name: 'HomePage',
  data() {
    return {
      stats: {
        activeSessions: 0,
        totalUsers: 0,
        totalVideos: 0
      }
    }
  },
  async mounted() {
    await this.loadStats()
  },
  methods: {
    goToMetronome() {
      this.$router.push('/metronome')
    },
    goToPerformance() {
      this.$router.push('/performance')
    },
    async loadStats() {
      try {
        // 활성 세션 수 조회
        const sessionsResponse = await metronomeAPI.getActiveSessions()
        this.stats.activeSessions = sessionsResponse.data.length

        // 총 사용자 수 조회
        const usersResponse = await userAPI.getAllUsers()
        this.stats.totalUsers = usersResponse.data.length

        // 연주영상 수 조회
        const videosResponse = await performanceAPI.getVideos()
        this.stats.totalVideos = videosResponse.data.length
      } catch (error) {
        console.error('통계 로드 실패:', error)
        // 에러 시 기본값 유지
      }
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  margin-bottom: 40px;
}

.hero-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.hero-content {
  padding: 40px 20px;
}

.hero-icon {
  font-size: 64px;
  margin-bottom: 20px;
  display: block;
}

.hero-content h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: 700;
}

.hero-content p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.menu-section {
  margin-bottom: 40px;
}

.menu-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.menu-card:hover {
  transform: translateY(-5px);
}

.menu-content {
  text-align: center;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.menu-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 20px;
}

.menu-content h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.menu-content p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  text-align: left;
}

.feature-list li {
  padding: 5px 0;
  color: #666;
  position: relative;
  padding-left: 20px;
}

.feature-list li:before {
  content: '✓';
  color: #67c23a;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.menu-button {
  margin-top: 20px;
  width: 100%;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-card {
  text-align: center;
}

.stats-card h3 {
  margin-bottom: 30px;
  color: #2c3e50;
}

.stat-item {
  padding: 20px;
}

.stat-icon {
  font-size: 32px;
  color: #667eea;
  margin-bottom: 10px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .hero-content p {
    font-size: 1rem;
  }
  
  .menu-content {
    padding: 15px;
  }
  
  .menu-icon {
    font-size: 36px;
  }
  
  .stat-item {
    padding: 15px 10px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
