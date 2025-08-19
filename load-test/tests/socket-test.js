const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:5678';
const SOCKET_URL = 'http://localhost:5678';
const CONCURRENT_USERS = 100;
const TEST_DURATION = 30; // 30초

class SocketLoadTest {
  constructor() {
    this.results = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      messagesReceived: 0,
      connectionTimes: [],
      messageLatencies: [],
      errors: []
    };
    this.startTime = null;
    this.endTime = null;
    this.activeSockets = [];
  }

  async simulateUser(userId) {
    return new Promise((resolve, reject) => {
      console.log(`👤 User ${userId} connecting via Socket.IO`);
      
      const connectionStart = Date.now();
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      let userStats = {
        connected: false,
        messagesReceived: 0,
        connectionTime: 0
      };

      socket.on('connect', () => {
        userStats.connected = true;
        userStats.connectionTime = Date.now() - connectionStart;
        
        this.results.totalConnections++;
        this.results.successfulConnections++;
        this.results.connectionTimes.push(userStats.connectionTime);
        this.activeSockets.push(socket);
        
        console.log(`👤 User ${userId} connected (${userStats.connectionTime}ms)`);

        // 랜덤한 토너먼트에 조인
        const randomTournamentId = `tournament-${Math.floor(Math.random() * 10) + 1}`;
        socket.emit('join_tournament', randomTournamentId);
      });

      socket.on('connect_error', (error) => {
        this.results.totalConnections++;
        this.results.failedConnections++;
        this.results.errors.push({
          userId: userId,
          message: error.message,
          time: Date.now() - connectionStart
        });
        console.log(`❌ User ${userId} connection failed: ${error.message}`);
        resolve(userStats);
      });

      // 다양한 이벤트 리스너 설정
      socket.on('tournament_created', (data) => {
        const latency = Date.now() - (data.timestamp || Date.now());
        userStats.messagesReceived++;
        this.results.messagesReceived++;
        this.results.messageLatencies.push(Math.max(0, latency));
      });

      socket.on('match_updated', (data) => {
        const latency = Date.now() - (data.timestamp || Date.now());
        userStats.messagesReceived++;
        this.results.messagesReceived++;
        this.results.messageLatencies.push(Math.max(0, latency));
      });

      socket.on('team_updated', (data) => {
        const latency = Date.now() - (data.timestamp || Date.now());
        userStats.messagesReceived++;
        this.results.messagesReceived++;
        this.results.messageLatencies.push(Math.max(0, latency));
      });

      socket.on('tournament_deleted', (data) => {
        const latency = Date.now() - (data.timestamp || Date.now());
        userStats.messagesReceived++;
        this.results.messagesReceived++;
        this.results.messageLatencies.push(Math.max(0, latency));
      });

      socket.on('disconnect', (reason) => {
        console.log(`👤 User ${userId} disconnected: ${reason}`);
        resolve(userStats);
      });

      // 테스트 종료 시간 설정
      setTimeout(() => {
        socket.disconnect();
        resolve(userStats);
      }, TEST_DURATION * 1000);
    });
  }

  async generateSocketEvents() {
    // Socket 이벤트를 발생시키기 위해 백그라운드에서 API 호출
    console.log('🔥 Generating socket events...');
    
    const eventInterval = setInterval(async () => {
      try {
        // 토너먼트 생성 (socket 이벤트 발생)
        const tournamentResponse = await axios.post(`${BASE_URL}/api/tournaments`, {
          name: `Socket Test Tournament ${Date.now()}`,
          teamCount: 4
        }, { timeout: 5000 });

        if (tournamentResponse.data.id) {
          // 1초 후 토너먼트 삭제 (추가 socket 이벤트 발생)
          setTimeout(async () => {
            try {
              await axios.delete(`${BASE_URL}/api/tournaments/${tournamentResponse.data.id}`, {
                timeout: 5000
              });
            } catch (error) {
              // 삭제 실패는 무시
            }
          }, 1000);
        }
      } catch (error) {
        // API 호출 실패는 무시
      }
    }, 2000); // 2초마다 이벤트 생성

    // 테스트 종료 시 이벤트 생성 중단
    setTimeout(() => {
      clearInterval(eventInterval);
    }, TEST_DURATION * 1000);
  }

  calculateStats() {
    const totalTime = this.endTime - this.startTime;
    const avgConnectionTime = this.results.connectionTimes.length > 0 
      ? this.results.connectionTimes.reduce((a, b) => a + b, 0) / this.results.connectionTimes.length 
      : 0;
    
    const avgMessageLatency = this.results.messageLatencies.length > 0
      ? this.results.messageLatencies.reduce((a, b) => a + b, 0) / this.results.messageLatencies.length
      : 0;

    const sortedConnectionTimes = this.results.connectionTimes.sort((a, b) => a - b);
    const sortedLatencies = this.results.messageLatencies.sort((a, b) => a - b);
    
    const p95ConnectionIndex = Math.floor(sortedConnectionTimes.length * 0.95);
    const p95LatencyIndex = Math.floor(sortedLatencies.length * 0.95);
    
    return {
      duration: totalTime / 1000,
      totalConnections: this.results.totalConnections,
      successfulConnections: this.results.successfulConnections,
      failedConnections: this.results.failedConnections,
      connectionSuccessRate: (this.results.successfulConnections / this.results.totalConnections * 100).toFixed(2),
      messagesReceived: this.results.messagesReceived,
      avgMessagesPerUser: (this.results.messagesReceived / this.results.successfulConnections).toFixed(2),
      avgConnectionTime: avgConnectionTime.toFixed(2),
      avgMessageLatency: avgMessageLatency.toFixed(2),
      p95ConnectionTime: sortedConnectionTimes[p95ConnectionIndex] || 0,
      p95MessageLatency: sortedLatencies[p95LatencyIndex] || 0,
      errors: this.results.errors.slice(0, 5)
    };
  }

  async cleanup() {
    console.log(`🧹 Disconnecting ${this.activeSockets.length} remaining sockets...`);
    
    this.activeSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    
    console.log('✅ Socket cleanup completed');
  }

  async run() {
    console.log(`🚀 Starting SOCKET.IO load test with ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION} seconds`);
    console.log(`📍 Target: ${SOCKET_URL}`);
    console.log('─'.repeat(80));

    this.startTime = Date.now();

    // 백그라운드에서 Socket 이벤트 생성
    this.generateSocketEvents();

    // 100명의 사용자를 동시에 시뮬레이션
    const userPromises = [];
    for (let i = 1; i <= CONCURRENT_USERS; i++) {
      userPromises.push(this.simulateUser(i));
    }

    await Promise.all(userPromises);

    this.endTime = Date.now();

    const stats = this.calculateStats();

    console.log('\n📊 SOCKET.IO LOAD TEST RESULTS');
    console.log('─'.repeat(80));
    console.log(`⏱️  Duration: ${stats.duration}s`);
    console.log(`🔌 Total Connections: ${stats.totalConnections}`);
    console.log(`✅ Successful: ${stats.successfulConnections} (${stats.connectionSuccessRate}%)`);
    console.log(`❌ Failed: ${stats.failedConnections}`);
    console.log(`📨 Messages Received: ${stats.messagesReceived}`);
    console.log(`📊 Avg Messages/User: ${stats.avgMessagesPerUser}`);
    console.log(`⚡ Avg Connection Time: ${stats.avgConnectionTime}ms`);
    console.log(`📡 Avg Message Latency: ${stats.avgMessageLatency}ms`);
    console.log(`📈 95th Percentile Connection: ${stats.p95ConnectionTime}ms`);
    console.log(`📈 95th Percentile Message Latency: ${stats.p95MessageLatency}ms`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Sample Errors:');
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. User ${error.userId}: ${error.message} (${error.time}ms)`);
      });
    }
    
    console.log('─'.repeat(80));

    // 정리
    await this.cleanup();
  }
}

// 테스트 실행
if (require.main === module) {
  const test = new SocketLoadTest();
  test.run().catch(console.error);
}

module.exports = SocketLoadTest;
