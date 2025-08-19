const axios = require('axios');

// 서버 URL 설정
const BASE_URL = 'http://localhost:5678';
const CONCURRENT_USERS = 100;
const TEST_DURATION = 30; // 30초

class ReadLoadTest {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: []
    };
    this.startTime = null;
    this.endTime = null;
  }

  async makeRequest() {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/tournaments`, {
        timeout: 5000
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
        time: Date.now() - start
      });
    }
  }

  async simulateUser(userId) {
    console.log(`👤 User ${userId} started reading tournaments`);
    
    const endTime = Date.now() + (TEST_DURATION * 1000);
    
    while (Date.now() < endTime) {
      await this.makeRequest();
      // 0.5-2초 랜덤 대기 (실제 사용자 패턴 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));
    }
    
    console.log(`👤 User ${userId} finished`);
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
      errors: this.results.errors.slice(0, 5) // 첫 5개 에러만 표시
    };
  }

  async run() {
    console.log(`🚀 Starting READ load test with ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION} seconds`);
    console.log(`📍 Target: ${BASE_URL}/api/tournaments`);
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

    console.log('\n📊 READ LOAD TEST RESULTS');
    console.log('─'.repeat(80));
    console.log(`⏱️  Duration: ${stats.duration}s`);
    console.log(`📈 Total Requests: ${stats.totalRequests}`);
    console.log(`✅ Successful: ${stats.successfulRequests} (${stats.successRate}%)`);
    console.log(`❌ Failed: ${stats.failedRequests}`);
    console.log(`🔥 Requests/sec: ${stats.requestsPerSecond}`);
    console.log(`⚡ Avg Response Time: ${stats.avgResponseTime}ms`);
    console.log(`📊 Min/Max Response Time: ${stats.minResponseTime}ms / ${stats.maxResponseTime}ms`);
    console.log(`📈 95th Percentile: ${stats.p95ResponseTime}ms`);
    console.log(`📈 99th Percentile: ${stats.p99ResponseTime}ms`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Sample Errors:');
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message} (${error.time}ms)`);
      });
    }
    
    console.log('─'.repeat(80));
  }
}

// 테스트 실행
if (require.main === module) {
  const test = new ReadLoadTest();
  test.run().catch(console.error);
}

module.exports = ReadLoadTest;
