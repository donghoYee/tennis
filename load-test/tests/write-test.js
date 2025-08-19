const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:5678';
const CONCURRENT_USERS = 100;
const TEST_DURATION = 30; // 30초

class WriteLoadTest {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      createdTournaments: []
    };
    this.startTime = null;
    this.endTime = null;
  }

  async createTournament(userId) {
    const start = Date.now();
    const tournamentName = `Load Test Tournament ${userId}-${Date.now()}`;
    const teamCount = Math.floor(Math.random() * 3 + 2) * 2; // 2, 4, 6, 8팀
    
    try {
      const response = await axios.post(`${BASE_URL}/api/tournaments`, {
        name: tournamentName,
        teamCount: teamCount
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - start;
      
      this.results.totalRequests++;
      if (response.status === 201) {
        this.results.successfulRequests++;
        this.results.responseTimes.push(responseTime);
        this.results.createdTournaments.push(response.data.id);
      } else {
        this.results.failedRequests++;
      }
      
      return response.data;
    } catch (error) {
      this.results.totalRequests++;
      this.results.failedRequests++;
      this.results.errors.push({
        message: error.message,
        time: Date.now() - start,
        userId: userId
      });
      return null;
    }
  }

  async updateTeamName(tournamentId, userId) {
    if (!tournamentId) return;
    
    const start = Date.now();
    try {
      // 토너먼트 정보 가져오기
      const tournamentResponse = await axios.get(`${BASE_URL}/api/tournaments/${tournamentId}`);
      if (!tournamentResponse.data.teams || tournamentResponse.data.teams.length === 0) {
        return;
      }

      const team = tournamentResponse.data.teams[0];
      const newName = `Updated Team ${userId}-${Date.now()}`;
      
      const response = await axios.put(`${BASE_URL}/api/teams/${team.id}`, {
        name: newName
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - start;
      
      this.results.totalRequests++;
      if (response.status === 200) {
        this.results.successfulRequests++;
        this.results.responseTimes.push(responseTime);
      } else {
        this.results.failedRequests++;
      }
    } catch (error) {
      this.results.totalRequests++;
      this.results.failedRequests++;
      this.results.errors.push({
        message: error.message,
        time: Date.now() - start,
        userId: userId
      });
    }
  }

  async simulateUser(userId) {
    console.log(`👤 User ${userId} started creating tournaments and updating teams`);
    
    const endTime = Date.now() + (TEST_DURATION * 1000);
    let userTournaments = [];
    
    while (Date.now() < endTime) {
      // 70% 확률로 토너먼트 생성, 30% 확률로 팀 이름 업데이트
      if (Math.random() > 0.3 || userTournaments.length === 0) {
        const tournament = await this.createTournament(userId);
        if (tournament) {
          userTournaments.push(tournament.id);
        }
      } else {
        const randomTournament = userTournaments[Math.floor(Math.random() * userTournaments.length)];
        await this.updateTeamName(randomTournament, userId);
      }
      
      // 1-3초 랜덤 대기 (쓰기 작업은 읽기보다 느림)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    }
    
    console.log(`👤 User ${userId} finished (created ${userTournaments.length} tournaments)`);
  }

  calculateStats() {
    const totalTime = this.endTime - this.startTime;
    const avgResponseTime = this.results.responseTimes.length > 0 
      ? this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length 
      : 0;
    
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    return {
      duration: totalTime / 1000,
      totalRequests: this.results.totalRequests,
      successfulRequests: this.results.successfulRequests,
      failedRequests: this.results.failedRequests,
      successRate: (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2),
      requestsPerSecond: (this.results.totalRequests / (totalTime / 1000)).toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      minResponseTime: Math.min(...sortedTimes) || 0,
      maxResponseTime: Math.max(...sortedTimes) || 0,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      createdTournaments: this.results.createdTournaments.length,
      errors: this.results.errors.slice(0, 10) // 첫 10개 에러만 표시
    };
  }

  async cleanup() {
    console.log(`🧹 Cleaning up ${this.results.createdTournaments.length} created tournaments...`);
    
    for (const tournamentId of this.results.createdTournaments) {
      try {
        await axios.delete(`${BASE_URL}/api/tournaments/${tournamentId}`, {
          timeout: 5000
        });
      } catch (error) {
        // 정리 실패는 무시
      }
    }
    
    console.log('✅ Cleanup completed');
  }

  async run() {
    console.log(`🚀 Starting WRITE load test with ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION} seconds`);
    console.log(`📍 Target: ${BASE_URL}/api/tournaments (POST) and /api/teams/:id (PUT)`);
    console.log('─'.repeat(80));

    this.startTime = Date.now();

    // 100명의 사용자를 동시에 시뮬레이션
    const userPromises = [];
    for (let i = 1; i <= CONCURRENT_USERS; i++) {
      userPromises.push(this.simulateUser(i));
    }

    await Promise.all(userPromises);

    this.endTime = Date.now();

    const stats = this.calculateStats();

    console.log('\n📊 WRITE LOAD TEST RESULTS');
    console.log('─'.repeat(80));
    console.log(`⏱️  Duration: ${stats.duration}s`);
    console.log(`📈 Total Requests: ${stats.totalRequests}`);
    console.log(`✅ Successful: ${stats.successfulRequests} (${stats.successRate}%)`);
    console.log(`❌ Failed: ${stats.failedRequests}`);
    console.log(`🔥 Requests/sec: ${stats.requestsPerSecond}`);
    console.log(`🏆 Tournaments Created: ${stats.createdTournaments}`);
    console.log(`⚡ Avg Response Time: ${stats.avgResponseTime}ms`);
    console.log(`📊 Min/Max Response Time: ${stats.minResponseTime}ms / ${stats.maxResponseTime}ms`);
    console.log(`📈 95th Percentile: ${stats.p95ResponseTime}ms`);
    console.log(`📈 99th Percentile: ${stats.p99ResponseTime}ms`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Sample Errors:');
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. User ${error.userId}: ${error.message} (${error.time}ms)`);
      });
    }
    
    console.log('─'.repeat(80));

    // 테스트 후 정리
    await this.cleanup();
  }
}

// 테스트 실행
if (require.main === module) {
  const test = new WriteLoadTest();
  test.run().catch(console.error);
}

module.exports = WriteLoadTest;
