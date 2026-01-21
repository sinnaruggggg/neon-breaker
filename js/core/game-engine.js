// 네온 브레이커 게임 엔진
class GameEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.state = 'menu';
    this.lastTime = 0;
    this.fps = 60;
    this.fpsInterval = 1000 / this.fps;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    // 게임 오브젝트 매니저
    this.entities = new Map();
    this.systems = new Map();
    this.renderers = new Map();
    
    this.init();
  }

  // 초기화
  init() {
    this.setupCanvas();
    this.initializeSystems();
    this.setupEventListeners();
  }

  // 캔버스 설정
  setupCanvas() {
    // 고성능 캔버스 설정
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.font = '12px Orbitron';
    
    // 픽셀 완벽 설정
    const dpr = window.devicePixelRatio || 1;
    
    // 성능 최적화를 위해 DPR는 1로 고정
    this.scale = 1;
    
    // 가상 해상도 설정
    this.virtualWidth = this.canvas.width;
    this.virtualHeight = this.canvas.height;
  }

  // 시스템 초기화
  initializeSystems() {
    // 렌더러 시스템
    // 렌더러 시스템
    this.renderers.set('background', new BackgroundRenderer(this.ctx, this.canvas));
    this.renderers.set('game', new GameRenderer(this.ctx, this.canvas));
    this.renderers.set('ui', new UIRenderer(this.ctx, this.canvas));
    
    // 엔티티 시스템
    this.systems.set('physics', new PhysicsSystem());
    this.systems.set('collision', new CollisionSystem());
    this.systems.set('input', new InputControllerSystem());
    this.systems.set('audio', new AudioSystem());
  }

  // 이벤트 리스너
  setupEventListeners() {
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  // 게임 상태 변경
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    // 상태 변경 이벤트
    this.emit('stateChange', { oldState, newState });
    
    // 상태별 초기화
    this.handleStateChange(newState);
  }

  // 상태 변경 처리
  handleStateChange(newState) {
    switch (newState) {
      case 'menu':
        this.enterMenuState();
        break;
      case 'playing':
        this.enterPlayingState();
        break;
      case 'paused':
        this.enterPausedState();
        break;
      case 'gameover':
        this.enterGameOverState();
        break;
      case 'stageclear':
        this.enterStageClearState();
        break;
      case 'roundclear':
        this.enterRoundClearState();
        break;
    }
  }

  // 메뉴 상태
  enterMenuState() {
    // 메뉴 시스템 초기화
    this.clearEntities();
    this.loadMenuEntities();
  }

  // 플레이 상태
  enterPlayingState() {
    // 게임 오브젝트 초기화
    if (!this.hasEntities()) {
      this.initializeGameEntities();
    }
  }

  // 일시정지 상태
  enterPausedState() {
    // 일시정지 처리
    this.emit('pause');
  }

  // 게임 오버 상태
  enterGameOverState() {
    this.emit('gameOver');
  }

  // 스테이지 클리어 상태
  enterStageClearState() {
    this.emit('stageClear');
  }

  // 라운드 클리어 상태
  enterRoundClearState() {
    this.emit('roundClear');
  }

  // 엔티티 관리
  addEntity(entity) {
    if (!entity.id) {
      entity.id = this.generateEntityId();
    }
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(entityId) {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.destroy();
      this.entities.delete(entityId);
    }
    return entity;
  }

  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  getEntitiesByType(type) {
    return Array.from(this.entities.values()).filter(entity => entity.type === type);
  }

  hasEntities() {
    return this.entities.size > 0;
  }

  clearEntities() {
    this.entities.forEach(entity => {
      if (entity.destroy) {
        entity.destroy();
      }
    });
    this.entities.clear();
  }

  // 엔티티 ID 생성
  generateEntityId() {
    return 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 게임 오브젝트 초기화
  initializeGameEntities() {
    // 패들
    const paddle = new Paddle(
      this.canvas.width / 2 - 40,
      this.canvas.height - 30,
      80, 12
    );
    this.addEntity(paddle);

    // 공 (기본 1개)
    const ball = new Ball(
      this.canvas.width / 2,
      this.canvas.height - 50,
      7,
      0, 0, 4.0
    );
    ball.attached = true;
    this.addEntity(ball);

    // 블록들 (기본 3x5)
    this.createBricks(3, 5);

    // 초기 세팅
    this.paddle = paddle;
    this.balls = [ball];
  }

  // 블록 생성
  createBricks(rows, cols) {
    const brickWidth = 60;
    const brickHeight = 20;
    const padding = 5;
    const offsetX = (this.canvas.width - (cols * (brickWidth + padding))) / 2;
    const offsetY = 60;

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * (brickWidth + padding);
        const y = offsetY + r * (brickHeight + padding);
        
        const brick = new Brick(x, y, brickWidth, brickHeight, colors[r % colors.length]);
        this.addEntity(brick);
      }
    }
  }

  // 게임 루프
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // FPS 계산
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.actualFps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    // 고정 deltaTime으로 일관된 게임 속도 보장
    const fixedDelta = Math.min(deltaTime, this.fpsInterval);

    // 업데이트
    this.update(fixedDelta);

    // 렌더링
    this.render();

    this.lastTime = currentTime;

    // 다음 프레임 예약
    requestAnimationFrame(() => this.gameLoop());
  }

  // 업데이트 루프
  update(deltaTime) {
    if (this.state !== 'playing') return;

    // 시스템 업데이트
    this.systems.forEach(system => {
      if (system.update) {
        system.update(this.entities, deltaTime, this);
      }
    });

    // 엔티티별 업데이트
    this.entities.forEach(entity => {
      if (entity.update && !entity.destroyed) {
        entity.update(deltaTime, this);
      }
    });

    // 파괴된 엔티티 제거
    this.removeDestroyedEntities();

    // 충돌 감지
    this.detectCollisions();

    // 게임 상태 체크
    this.checkGameState();
  }

  // 렌더링 루프
  render() {
    // 렌더러별 렌더링
    this.renderers.forEach(renderer => {
      if (renderer.render) {
        renderer.render(this.entities, this);
      }
    });
  }

  // 파괴된 엔티티 제거
  removeDestroyedEntities() {
    const toRemove = [];
    this.entities.forEach((entity, id) => {
      if (entity.destroyed) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => this.removeEntity(id));
  }

  // 충돌 감지
  detectCollisions() {
    const collisionSystem = this.systems.get('collision');
    if (collisionSystem) {
      const collisions = collisionSystem.checkCollisions(this.entities);
      
      // 충돌 처리
      collisions.forEach(collision => {
        this.handleCollision(collision);
      });
    }
  }

  // 충돌 처리
  handleCollision(collision) {
    const { entity1, entity2, type } = collision;

    // 공-패들 충돌
    if (type === 'ball-paddle') {
      const ball = entity1.type === 'ball' ? entity1 : entity2;
      const paddle = entity1.type === 'paddle' ? entity1 : entity2;
      
      if (ball && paddle) {
        // 반사 각도 계산
        const relativeX = (ball.x + ball.radius - paddle.x - paddle.width / 2) / (paddle.width / 2);
        ball.dx = relativeX * 4;
        ball.dy = -Math.abs(ball.dy);
        
        // 사운드
        this.playSound('hit');
      }
    }

    // 공-블록 충돌
    else if (type === 'ball-brick') {
      const ball = entity1.type === 'ball' ? entity1 : entity2;
      const brick = entity1.type === 'brick' ? entity1 : entity2;
      
      if (ball && brick) {
        ball.dy = -ball.dy;
        brick.hit();
        
        // 파티클 효과
        this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
        
        // 사운드
        this.playSound('break');
      }
    }

    // 공-벽 충돌
    else if (type === 'ball-wall') {
      const ball = entity1.type === 'ball' ? entity1 : entity2;
      
      if (ball) {
        if (collision.side === 'left' || collision.side === 'right') {
          ball.dx = -ball.dx;
        }
        if (collision.side === 'top' || collision.side === 'bottom') {
          ball.dy = -ball.dy;
        }
        
        this.playSound('wall');
      }
    }
  }

  // 게임 상태 체크
  checkGameState() {
    const balls = this.getEntitiesByType('ball');
    const bricks = this.getEntitiesByType('brick');

    // 모든 블록 파괴 -> 스테이지 클리어
    if (bricks.length === 0) {
      this.setState('stageclear');
      return;
    }

    // 모든 공 사라짐 -> 라이프 감소
    if (balls.length === 0) {
      const lives = window.gameData.getPlayerData().maxLives;
      if (lives > 0) {
        // 새 공 생성
        const paddle = this.getEntitiesByType('paddle')[0];
        if (paddle) {
          const newBall = new Ball(
            paddle.x + paddle.width / 2,
            paddle.y - 20,
            7,
            0, -4, 4.0
          );
          newBall.attached = true;
          this.addEntity(newBall);
        }
        
        // 라이프 감소
        const currentLives = window.gameData.getPlayerData().maxLives;
        window.gameData.updatePlayerData({ maxLives: currentLives - 1 });
      } else {
        // 게임 오버
        this.setState('gameover');
      }
    }
  }

  // 파티클 효과
  createParticles(x, y, color) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const particle = new Particle(
        x, y,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        color,
        20 // 생명 시간
      );
      this.addEntity(particle);
    }
  }

  // 사운드 재생
  playSound(type) {
    const audioSystem = this.systems.get('audio');
    if (audioSystem) {
      audioSystem.play(type);
    }
  }

  // 이벤트 처리
  on(event, callback) {
    if (!this.listeners) {
      this.listeners = new Map();
    }
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.listeners || !this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`이벤트 리스너 오류 (${event}):`, error);
      }
    });
  }

  // 리사이즈 처리
  handleResize() {
    this.virtualWidth = this.canvas.width;
    this.virtualHeight = this.canvas.height;
    this.emit('resize', { width: this.canvas.width, height: this.canvas.height });
  }

  // 가시성 변경 처리
  handleVisibilityChange() {
    if (document.hidden) {
      this.wasRunning = this.isRunning;
      this.stop();
    } else if (this.wasRunning) {
      this.start();
    }
  }

  // 성능 정보
  getPerformanceInfo() {
    return {
      fps: this.actualFps || 0,
      entities: this.entities.size,
      state: this.state,
      memory: Utils.getMemoryUsage()
    };
  }

  // 디버그 정보
  debug() {
    console.group('GameEngine Debug');
    console.log('State:', this.state);
    console.log('FPS:', this.actualFps);
    console.log('Entities:', this.entities.size);
    console.log('Performance:', this.getPerformanceInfo());
    console.groupEnd();
  }

  // 파괴
  destroy() {
    this.stop();
    this.clearEntities();
    this.systems.clear();
    this.renderers.clear();
    this.listeners = null;
  }
}

// 전역으로 내보내기
window.GameEngine = GameEngine;