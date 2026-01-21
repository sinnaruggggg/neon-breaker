// 공 클래스
class Ball extends Entity {
  constructor(x, y, radius, dx = 0, dy = 0, speed = 4) {
    super(x - radius, y - radius, radius * 2, radius * 2, 'ball');
    
    // 공 고유 속성
    this.radius = radius;
    this.dx = dx;
    this.dy = dy;
    this.speed = speed;
    this.attached = true;
    this.color = '#ffffff';
    this.trail = [];
    this.maxTrailLength = 8;
    
    // 효과
    this.piercing = false;
    this.piercingTime = 0;
    this.rainbow = false;
    this.glowIntensity = 1;
  }

  // 업데이트
  update(deltaTime, engine) {
    if (!this.active) return;

    // 첨부된 상태 업데이트
    if (this.attached) {
      this.updateAttached(engine);
      return;
    }

    // 이동 업데이트
    this.updatePosition(deltaTime);
    
    // 경계 충돌
    this.checkWallCollisions(engine);
    
    // 효과 업데이트
    this.updateEffects(deltaTime);
    
    // 트레일 업데이트
    this.updateTrail();
  }

  // 첨부된 상태 업데이트
  updateAttached(engine) {
    const paddles = engine.getEntitiesByType('paddle');
    if (paddles.length > 0) {
      const paddle = paddles[0];
      this.x = paddle.x + paddle.width / 2 - this.radius;
      this.y = paddle.y - this.radius * 2;
    }
  }

  // 위치 업데이트
  updatePosition(deltaTime) {
    const actualSpeed = this.speed * deltaTime * 60;
    this.x += this.dx * actualSpeed;
    this.y += this.dy * actualSpeed;
  }

  // 벽 충돌 체크
  checkWallCollisions(engine) {
    const canvas = engine.canvas;
    
    // 왼쪽/오른쪽 벽
    if (this.x <= this.radius) {
      this.x = this.radius;
      this.dx = Math.abs(this.dx);
    } else if (this.x >= canvas.width - this.radius) {
      this.x = canvas.width - this.radius;
      this.dx = -Math.abs(this.dx);
    }
    
    // 위쪽 벽
    if (this.y <= this.radius) {
      this.y = this.radius;
      this.dy = Math.abs(this.dy);
    }
  }

  // 효과 업데이트
  updateEffects(deltaTime) {
    // 관통 효과 시간 감소
    if (this.piercing) {
      this.piercingTime -= deltaTime * 1000;
      if (this.piercingTime <= 0) {
        this.piercing = false;
        this.radius = 7;
      }
    }
    
    // 무지개 효과
    if (this.rainbow) {
      const hue = (Date.now() / 10) % 360;
      this.color = `hsl(${hue}, 100%, 60%)`;
    }
  }

  // 트레일 업데이트
  updateTrail() {
    if (!this.attached) {
      this.trail.push({ x: this.x, y: this.y, color: this.color });
      
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    } else {
      this.trail = [];
    }
  }

  // 발사
  launch(dx = null, dy = null) {
    this.attached = false;
    
    if (dx !== null) this.dx = dx;
    if (dy !== null) this.dy = dy;
    
    if (dx === null && dy === null) {
      // 랜덤 발사 각도
      const angle = (Math.random() - 0.5) * Math.PI / 3; // ±30도
      this.dx = Math.sin(angle) * this.speed;
      this.dy = -Math.cos(angle) * this.speed;
    } else {
      // 지정된 방향
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      this.dx = (dx / magnitude) * this.speed;
      this.dy = (dy / magnitude) * this.speed;
    }
    
    // 발사 효과
    this.createLaunchEffect();
  }

  // 발사 효과
  createLaunchEffect() {
    // 파티클 효과 (다른 시스템에서 처리)
    // 여기서는 기본 구현만
    console.log('Ball launched!');
  }

  // 방향 반전
  reverseDirection() {
    this.dy = -this.dy;
  }

  // 각도 설정
  setAngle(angle) {
    this.dx = Math.sin(angle) * this.speed;
    this.dy = Math.cos(angle) * this.speed;
  }

  // 관통 모드
  setPiercing(duration = 5000, radius = 10) {
    this.piercing = true;
    this.piercingTime = duration;
    this.radius = radius;
    this.color = '#ff00ff';
    this.glowIntensity = 2;
  }

  // 무지개 모드
  setRainbow(enabled = true) {
    this.rainbow = enabled;
    if (enabled) {
      this.glowIntensity = 1.5;
    } else {
      this.glowIntensity = 1;
      this.color = '#ffffff';
    }
  }

  // 스피드 설정
  setSpeed(speed) {
    this.speed = speed;
  }

  // 렌더링
  render(ctx, engine) {
    if (!this.visible) return;

    ctx.save();

    // 트레일 렌더링
    this.renderTrail(ctx);

    // 공 렌더링
    this.renderBall(ctx);

    // 디버그 모드
    if (engine.debugMode) {
      this.renderDebug(ctx);
    }

    ctx.restore();
  }

  // 트레일 렌더링
  renderTrail(ctx) {
    this.trail.forEach((point, index) => {
      const alpha = (index / this.trail.length) * 0.5;
      const size = this.radius * (index / this.trail.length) * 0.8;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // 트레일 그리기
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, size
      );
      gradient.addColorStop(0, point.color);
      gradient.addColorStop(1, Utils.rgba(point.color, 0));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  // 공 렌더링
  renderBall(ctx) {
    // 그로우 효과
    ctx.shadowBlur = 15 * this.glowIntensity;
    ctx.shadowColor = this.color;
    
    // 공 그리기
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
      this.x, this.y, this.radius
    );
    
    if (this.piercing) {
      // 관통 모드 - 그라데이션
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, this.color);
      gradient.addColorStop(1, Utils.darkenColor(this.color, 50));
    } else {
      // 일반 모드
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.7, this.color);
      gradient.addColorStop(1, this.color);
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(
      this.x - this.radius * 0.3, 
      this.y - this.radius * 0.3, 
      this.radius * 0.4, 
      0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }

  // 패들 충돌 처리
  handlePaddleCollision(paddle) {
    if (this.attached) return;

    const bounds = paddle.getBounds();
    const ballCenter = this.getBounds().centerY;
    
    // 패들 위에서 충돌했는지 확인
    if (this.y + this.radius >= bounds.top && this.y - this.radius <= bounds.top + paddle.height &&
        this.x >= bounds.left && this.x <= bounds.right) {
      
      // 반사 각도 계산
      const relativeX = (this.x - bounds.centerX) / (paddle.width / 2);
      this.dx = relativeX * this.speed;
      this.dy = -Math.abs(this.dy);
      
      // 콤보 리셋
      this.trail = [];
      
      return true;
    }
    return false;
  }

  // 리셋
  reset() {
    super.reset();
    this.attached = true;
    this.dx = 0;
    this.dy = 0;
    this.piercing = false;
    this.piercingTime = 0;
    this.rainbow = false;
    this.radius = 7;
    this.color = '#ffffff';
    this.glowIntensity = 1;
    this.trail = [];
  }

  // 클론
  clone() {
    const ball = new Ball(
      this.x + this.radius, this.y + this.radius, this.radius,
      this.dx, this.dy, this.speed
    );
    
    ball.attached = this.attached;
    ball.piercing = this.piercing;
    ball.piercingTime = this.piercingTime;
    ball.rainbow = this.rainbow;
    ball.color = this.color;
    ball.glowIntensity = this.glowIntensity;
    
    return ball;
  }
}

// 전역으로 내보내기
window.Ball = Ball;