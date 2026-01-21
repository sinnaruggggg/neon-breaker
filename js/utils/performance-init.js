// 성능 최적화 초기화
async function initializePerformance() {
  console.log('⚡ 성능 최적화 초기화 중...');
  
  // 성능 최적화 도구 생성
  window.performanceOptimizer = new PerformanceOptimizer();
  
  // 기기에 맞는 최적화 레벨 설정
  window.performanceOptimizer.optimizeForDevice();
  
  // 자동 최적화 활성화
  window.performanceOptimizer.autoOptimize = Utils.throttle(() => {
    window.performanceOptimizer.autoOptimize();
  }, 5000); // 5초마다 체크
  
  // 성능 모니터링 시작
  window.performanceOptimizer.beginFrame();
  
  // 주기적 가비지 컬렉션
  setInterval(() => {
    window.performanceOptimizer.garbageCollect();
  }, 30000); // 30초마다
  
  console.log('✅ 성능 최적화 초기화 완료');
}