const ReadLoadTest = require('./read-test');
const WriteLoadTest = require('./write-test');
const SocketLoadTest = require('./socket-test');

const TOTAL_USERS = 100;
const READ_USERS = 50;    // 50% 읽기 작업
const WRITE_USERS = 30;   // 30% 쓰기 작업
const SOCKET_USERS = 20;  // 20% 실시간 모니터링

class MixedLoadTest {
  constructor() {
    this.readTest = new ReadLoadTest();
    this.writeTest = new WriteLoadTest();
    this.socketTest = new SocketLoadTest();
    
    // 사용자 수 조정
    this.readTest.constructor.prototype.CONCURRENT_USERS = READ_USERS;
    this.writeTest.constructor.prototype.CONCURRENT_USERS = WRITE_USERS;
    this.socketTest.constructor.prototype.CONCURRENT_USERS = SOCKET_USERS;
  }

  async run() {
    console.log(`🚀 Starting MIXED LOAD TEST with ${TOTAL_USERS} total users`);
    console.log(`📖 Read Users: ${READ_USERS} (${(READ_USERS/TOTAL_USERS*100).toFixed(1)}%)`);
    console.log(`✏️  Write Users: ${WRITE_USERS} (${(WRITE_USERS/TOTAL_USERS*100).toFixed(1)}%)`);
    console.log(`🔌 Socket Users: ${SOCKET_USERS} (${(SOCKET_USERS/TOTAL_USERS*100).toFixed(1)}%)`);
    console.log('='.repeat(80));

    const startTime = Date.now();

    // 모든 테스트를 동시에 실행
    const promises = [
      this.runReadTest(),
      this.runWriteTest(),
      this.runSocketTest()
    ];

    await Promise.all(promises);

    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;

    console.log('\n🎯 MIXED LOAD TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}s`);
    console.log(`👥 Total Users: ${TOTAL_USERS}`);
    console.log('='.repeat(80));
  }

  async runReadTest() {
    console.log('\n📖 STARTING READ TEST COMPONENT...');
    
    // ReadLoadTest 클래스를 상속받아 사용자 수 조정
    class AdjustedReadTest extends ReadLoadTest {
      constructor() {
        super();
        this.CONCURRENT_USERS = READ_USERS;
      }

      async run() {
        this.startTime = Date.now();

        const userPromises = [];
        for (let i = 1; i <= READ_USERS; i++) {
          userPromises.push(this.simulateUser(i));
        }

        await Promise.all(userPromises);
        this.endTime = Date.now();

        const stats = this.calculateStats();
        
        console.log('\n📊 READ COMPONENT RESULTS');
        console.log('─'.repeat(50));
        console.log(`📈 Total Requests: ${stats.totalRequests}`);
        console.log(`✅ Success Rate: ${stats.successRate}%`);
        console.log(`🔥 Requests/sec: ${stats.requestsPerSecond}`);
        console.log(`⚡ Avg Response: ${stats.avgResponseTime}ms`);
        console.log(`📈 95th Percentile: ${stats.p95ResponseTime}ms`);
      }
    }

    const readTest = new AdjustedReadTest();
    await readTest.run();
  }

  async runWriteTest() {
    console.log('\n✏️  STARTING WRITE TEST COMPONENT...');
    
    class AdjustedWriteTest extends WriteLoadTest {
      constructor() {
        super();
        this.CONCURRENT_USERS = WRITE_USERS;
      }

      async run() {
        this.startTime = Date.now();

        const userPromises = [];
        for (let i = 1; i <= WRITE_USERS; i++) {
          userPromises.push(this.simulateUser(i));
        }

        await Promise.all(userPromises);
        this.endTime = Date.now();

        const stats = this.calculateStats();
        
        console.log('\n📊 WRITE COMPONENT RESULTS');
        console.log('─'.repeat(50));
        console.log(`📈 Total Requests: ${stats.totalRequests}`);
        console.log(`✅ Success Rate: ${stats.successRate}%`);
        console.log(`🔥 Requests/sec: ${stats.requestsPerSecond}`);
        console.log(`🏆 Tournaments Created: ${stats.createdTournaments}`);
        console.log(`⚡ Avg Response: ${stats.avgResponseTime}ms`);
        console.log(`📈 95th Percentile: ${stats.p95ResponseTime}ms`);

        // 정리 작업
        await this.cleanup();
      }
    }

    const writeTest = new AdjustedWriteTest();
    await writeTest.run();
  }

  async runSocketTest() {
    console.log('\n🔌 STARTING SOCKET TEST COMPONENT...');
    
    class AdjustedSocketTest extends SocketLoadTest {
      constructor() {
        super();
        this.CONCURRENT_USERS = SOCKET_USERS;
      }

      async run() {
        this.startTime = Date.now();

        // 백그라운드에서 Socket 이벤트 생성
        this.generateSocketEvents();

        const userPromises = [];
        for (let i = 1; i <= SOCKET_USERS; i++) {
          userPromises.push(this.simulateUser(i));
        }

        await Promise.all(userPromises);
        this.endTime = Date.now();

        const stats = this.calculateStats();
        
        console.log('\n📊 SOCKET COMPONENT RESULTS');
        console.log('─'.repeat(50));
        console.log(`🔌 Connections: ${stats.successfulConnections}/${stats.totalConnections}`);
        console.log(`✅ Success Rate: ${stats.connectionSuccessRate}%`);
        console.log(`📨 Messages Received: ${stats.messagesReceived}`);
        console.log(`⚡ Avg Connection: ${stats.avgConnectionTime}ms`);
        console.log(`📡 Avg Message Latency: ${stats.avgMessageLatency}ms`);

        // 정리 작업
        await this.cleanup();
      }
    }

    const socketTest = new AdjustedSocketTest();
    await socketTest.run();
  }
}

// 테스트 실행
if (require.main === module) {
  const test = new MixedLoadTest();
  test.run().catch(console.error);
}

module.exports = MixedLoadTest;
