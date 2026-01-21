// 성능 모니터링 및 최적화 도구
class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      fps: 60,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      entityCount: 0,
      physicsTime: 0,
      renderTime: 0
    };
    
    this.fpsHistory = [];
    this.maxHistoryLength = 60;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.optimizeLevel = 'balanced'; // minimal, balanced, quality
    
    // 캔버스 최적화
    this.useOffscreenCanvas = this.isOffscreenCanvasSupported();
    this.offscreenCanvas = null;
    this.setupOffscreenCanvas();
    
    // 오브젝트 풀링
    this.objectPool = new Map();
    this.setupObjectPools();
    
    // 렌더링 최적화
    this.useDirtyRectangles = true;
    this.dirtyRegions = [];
  }

  // 오프스크린 캔버스 지원 확인
  isOffscreenCanvasSupported() {
    return typeof OffscreenCanvas !== 'undefined';
  }

  // 오프스크린 캔버스 설정
  setupOffscreenCanvas() {
    if (this.useOffscreenCanvas && window.canvas) {
      try {
        this.offscreenCanvas = new OffscreenCanvas(window.canvas.width, window.canvas.height);
        console.log('✅ 오프스크린 캔버스 활성화');
      } catch (error) {
        console.log('⚠️ 오프스크린 캔버스 비활성화:', error);
        this.useOffscreenCanvas = false;
      }
    }
  }

  // 오브젝트 풀 설정
  setupObjectPools() {
    // 파티클 풀
    this.objectPool.set('particle', {
      pool: [],
      create: () => ({
        x: 0, y: 0, dx: 0, dy: 0,
        color: '#ffffff', size: 3,
        life: 1000, active: false
      }),
      reset: (obj) => {
        obj.x = 0; obj.y = 0; obj.dx = 0; obj.dy = 0;
        obj.color = '#ffffff'; obj.size = 3;
        obj.life = 1000; obj.active = false;
      }
    });
    
    // 총알 풀
    this.objectPool.set('bullet', {
      pool: [],
      create: () => ({
        x: 0, y: 0, dx: 0, dy: -10,
        width: 4, height: 4,
        color: '#00ffff', active: false,
        damage: 1, piercing: false
      }),
      reset: (obj) => {
        obj.x = 0; obj.y = 0; obj.dx = 0; obj.dy = -10;
        obj.active = false;
      }
    });
  }

  // 오브젝트 풀에서 가져오기
  getFromPool(type) {
    const pool = this.objectPool.get(type);
    if (!pool) return null;
    
    let obj = pool.pool.find(o => !o.active);
    if (!obj) {
      obj = pool.create();
      pool.pool.push(obj);
    }
    
    obj.active = true;
    return obj;
  }

  // 오브젝트 풀로 반환
  returnToPool(type, obj) {
    const pool = this.objectPool.get(type);
    if (pool && obj) {
      pool.reset(obj);
    }
  }

  // 프레임 시작
  beginFrame() {
    const now = performance.now();
    this.frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // 메트릭스 초기화
    this.metrics.drawCalls = 0;
    this.metrics.physicsTime = 0;
    this.metrics.renderTime = 0;
    this.frameCount++;
  }

  // 프레임 종료
  endFrame() {
    // FPS 계산
    if (this.frameCount % 10 === 0) { // 10프레임마다 계산
      const fps = 1000 / this.frameTime;
      this.fpsHistory.push(fps);
      
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
      
      this.metrics.fps = this.calculateAverageFPS();
    }
    
    // 메모리 사용량 체크
    this.updateMemoryUsage();
  }

  // 평균 FPS 계산
  calculateAverageFPS() {
    if (this.fpsHistory.length === 0) return 60;
    
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  // 메모리 사용량 업데이트
  updateMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      this.metrics.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };
    }
  }

  // 최적화 레벨 설정
  setOptimizationLevel(level) {
    this.optimizeLevel = level;
    this.applyOptimizations();
  }

  // 최적화 적용
  applyOptimizations() {
    switch (this.optimizeLevel) {
      case 'minimal':
        // 최소 성능
        this.setQualitySettings(0.5, false);
        this.maxEntities = 50;
        this.maxParticles = 10;
        break;
        
      case 'balanced':
        // 균형
        this.setQualitySettings(0.8, true);
        this.maxEntities = 100;
        this.maxParticles = 25;
        break;
        
      case 'quality':
        // 최고 품질
        this.setQualitySettings(1.0, true);
        this.maxEntities = 200;
        this.maxParticles = 50;
        break;
    }
  }

  // 품질 설정
  setQualitySettings(scale, effects) {
    // 이미지 스케일링
    this.imageScale = scale;
    this.enableEffects = effects;
    
    // 안티앨리어싱
    this.enableAntialiasing = scale > 0.8;
  }

  // 지역 최적화
  optimizeForDevice() {
    const isMobile = Utils.isMobile();
    const isLowEnd = this.detectLowEndDevice();
    
    if (isMobile) {
      this.setOptimizationLevel('minimal');
    } else if (isLowEnd) {
      this.setOptimizationLevel('balanced');
    } else {
      this.setOptimizationLevel('quality');
    }
  }

  // 저성능 기기 감지
  detectLowEndDevice() {
    // 메모리 기준
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return true;
    }
    
    // CPU 코어 수 기준
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }
    
    // 캔버스 성능 테스트
    return this.testCanvasPerformance();
  }

  // 캔버스 성능 테스트
  testCanvasPerformance() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 간단한 그리기 테스트
    const iterations = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      ctx.fillRect(0, 0, 10, 10);
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;
    
    // 1ms 이상 걸리면 저성능으로 간주
    return avgTime > 1.0;
  }

  // 더티 사각형 관리
  markDirtyRegion(x, y, width, height) {
    if (!this.useDirtyRectangles) return;
    
    this.dirtyRegions.push({
      x, y, width, height,
      timestamp: performance.now()
    });
    
    // 오래된 영역 정리
    const now = performance.now();
    this.dirtyRegions = this.dirtyRegions.filter(region => 
      now - region.timestamp < 100 // 100ms 이내 영역만 유지
    );
  }

  // 더티 영역 확인
  isDirtyRegion(x, y, width, height) {
    if (!this.useDirtyRectangles) return true;
    
    return this.dirtyRegions.some(region => 
      x < region.x + region.width &&
      x + width > region.x &&
      y < region.y + region.height &&
      y + height > region.y
    );
  }

  // 렌더링 최적화
  optimizeRendering(ctx, renderFunction) {
    this.metrics.renderTime = performance.now();
    
    // 상태 저장
    ctx.save();
    
    // 최적화 레벨별 설정
    switch (this.optimizeLevel) {
      case 'minimal':
        ctx.imageSmoothingEnabled = false;
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 'balanced':
        ctx.imageSmoothingEnabled = this.enableAntialiasing;
        break;
      case 'quality':
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        break;
    }
    
    // 렌더링 실행
    renderFunction(ctx);
    
    // 상태 복원
    ctx.restore();
    
    this.metrics.renderTime = performance.now() - this.metrics.renderTime;
    this.metrics.drawCalls++;
  }

  // 물리 최적화
  optimizePhysics(updateFunction) {
    this.metrics.physicsTime = performance.now();
    
    updateFunction();
    
    this.metrics.physicsTime = performance.now() - this.metrics.physicsTime;
  }

  // 객체 수 제한
  limitEntities(entities) {
    if (!this.maxEntities) return entities;
    
    const filtered = Array.from(entities).slice(0, this.maxEntities);
    this.metrics.entityCount = filtered.length;
    
    return filtered;
  }

  // 파티클 수 제한
  limitParticles(particles) {
    if (!this.maxParticles) return particles;
    
    return particles.slice(0, this.maxParticles);
  }

  // 메트릭스 가져오기
  getMetrics() {
    return {
      ...this.metrics,
      optimizeLevel: this.optimizeLevel,
      maxEntities: this.maxEntities,
      maxParticles: this.maxParticles,
      averageFPS: this.calculateAverageFPS(),
      fpsStability: this.calculateFPSStability()
    };
  }

  // FPS 안정성 계산
  calculateFPSStability() {
    if (this.fpsHistory.length < 30) return 1.0;
    
    const mean = this.calculateAverageFPS();
    const variance = this.fpsHistory.reduce((sum, fps) => {
      return sum + Math.pow(fps - mean, 2);
    }, 0) / this.fpsHistory.length;
    
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;
    
    // 변동계수가 낮을수록 안정적
    return Math.max(0, 1 - coefficientOfVariation);
  }

  // 자동 최적화
  autoOptimize() {
    const currentFPS = this.metrics.fps;
    const targetFPS = 60;
    
    if (currentFPS < 45) {
      console.log('🔽 FPS 낮음 -> 최소 성능 모드로 전환');
      this.setOptimizationLevel('minimal');
    } else if (currentFPS < 55) {
      console.log('⚖️ FPS 중간 -> 균형 모드로 전환');
      this.setOptimizationLevel('balanced');
    } else if (currentFPS >= 58) {
      console.log('🎨 FPS 양호 -> 최고 품질 모드로 전환');
      this.setOptimizationLevel('quality');
    }
  }

  // 가비지 컬렉션
  garbageCollect() {
    // 객체 풀 정리
    this.objectPool.forEach((pool, type) => {
      pool.pool = pool.pool.filter(obj => !obj.active).slice(-20); // 최대 20개 유지
    });
    
    // 더티 영역 정리
    this.dirtyRegions = [];
    
    // 브라우저 가비지 컬렉션 제안
    if (window.gc) {
      window.gc();
    }
  }

  // 디버그 정보
  debug() {
    console.group('PerformanceOptimizer Debug');
    console.log('Metrics:', this.getMetrics());
    console.log('Optimization Level:', this.optimizeLevel);
    console.log('Object Pools:', this.objectPool.size);
    console.log('Dirty Regions:', this.dirtyRegions.length);
    console.log('Offscreen Canvas:', this.useOffscreenCanvas);
    console.groupEnd();
  }

  // 성능 보고서
  getPerformanceReport() {
    const metrics = this.getMetrics();
    
    return {
      summary: {
        fps: Math.round(metrics.averageFPS),
        stability: Math.round(metrics.fpsStability * 100) + '%',
        memory: `${metrics.memoryUsage.used}MB / ${metrics.memoryUsage.total}MB`,
        level: metrics.optimizeLevel
      },
      details: {
        frameTime: Math.round(metrics.frameTime * 100) / 100,
        renderTime: Math.round(metrics.renderTime * 100) / 100,
        physicsTime: Math.round(metrics.physicsTime * 100) / 100,
        drawCalls: metrics.drawCalls,
        entities: metrics.entityCount,
        maxEntities: metrics.maxEntities,
        particles: metrics.maxParticles
      },
      recommendations: this.getRecommendations()
    };
  }

  // 최적화 추천
  getRecommendations() {
    const recommendations = [];
    const fps = this.metrics.averageFPS;
    const memoryUsage = this.metrics.memoryUsage.used || 0;
    
    if (fps < 30) {
      recommendations.push('성능이 매우 낮습니다. 최소 성능 모드를 고려하세요.');
    }
    
    if (memoryUsage > 100) {
      recommendations.push('메모리 사용량이 높습니다. 객체 풀링을 최적화하세요.');
    }
    
    if (fps < 45 && this.optimizeLevel !== 'minimal') {
      recommendations.push('최소 성능 모드로 전환을 권장합니다.');
    }
    
    if (fps > 55 && this.optimizeLevel !== 'quality') {
      recommendations.push('최고 품질 모드를 사용할 수 있습니다.');
    }
    
    return recommendations;
  }
}

// 전역으로 내보내기
window.PerformanceOptimizer = PerformanceOptimizer;