// 패들 클래스
class Paddle extends Entity {
  constructor(x, y, width, height) {
    super(x, y, width, height, 'paddle');
    
    // 패들 고유 속성
    this.speed = 2.5;
    this.targetX = x;
    this.color = '#00f0ff';
    this.glowColor = '#00f0ff';
    
    // 능력치 보너스
    this.speedBonus = 0;
    this.sizeBonus = 0;
  }

  // 업데이트
  update(deltaTime, engine) {
    if (!this.active) return;

    // 입력 처리
    this.handleInput(engine);
    
    // 부드러운 이동 (lerp)
    const moveSpeed = (this.speed + this.speedBonus + (window.gameData?.getSpeedLevel() * 2 || 0)) * deltaTime * 60;
    const dx = (this.targetX - this.x) * 0.2; // 부드러움
    
    this.x += dx;
    
    // 경계 제한
    this.constrainToCanvas(engine);
  }

  // 입력 처리
  handleInput(engine) {
    const inputSystem = engine.systems.get('input');
    if (!inputSystem) return;

    let moveDirection = 0;

    // 키보드 입력
    if (inputSystem.isLeftPressed()) {
      moveDirection -= 1;
    }
    if (inputSystem.isRightPressed()) {
      moveDirection += 1;
    }

    // 터치 입력
    if (inputSystem.isTouchActive()) {
      const touchPos = inputSystem.getTouchPosition(0);
      if (touchPos) {
        const paddleCenter = this.x + this.width / 2;
        moveDirection = touchPos.x - paddleCenter > 0 ? 1 : -1;
        this.targetX = touchPos.x - this.width / 2;
      }
    }

    // 마우스 입력
    if (inputSystem.isMousePressed()) {
      const mousePos = inputSystem.getMousePosition();
      if (mousePos) {
        this.targetX = mousePos.x - this.width / 2;
      }
    }

    // 버튼 입력 (게임 컨트롤러)
    if (engine.elements?.leftBtn?.pressed) {
      moveDirection -= 1;
    }
    if (engine.elements?.rightBtn?.pressed) {
      moveDirection += 1;
    }

    // 목표 위치 업데이트
    if (moveDirection !== 0) {
      const moveSpeed = this.speed + this.speedBonus + (window.gameData?.getSpeedLevel() * 2 || 0);
      this.targetX += moveDirection * moveSpeed;
    }
  }

  // 캔버스 경계 제한
  constrainToCanvas(engine) {
    const bounds = this.getBounds();
    const canvas = engine.canvas;
    
    if (bounds.left < 0) {
      this.x = 0;
      this.targetX = 0;
    } else if (bounds.right > canvas.width) {
      this.x = canvas.width - this.width;
      this.targetX = canvas.width - this.width;
    }
  }

  // 렌더링
  render(ctx, engine) {
    if (!this.visible) return;

    ctx.save();

    // 패들 그리기
    this.drawPaddle(ctx);

    // 디버그 모드
    if (engine.debugMode) {
      this.renderDebug(ctx);
    }

    ctx.restore();
  }

  // 패들 그리기
  drawPaddle(ctx) {
    const actualWidth = this.width + this.sizeBonus;
    const actualX = this.x - this.sizeBonus / 2;
    
    // 그로우 효과
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.glowColor;
    
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(
      actualX, this.y,
      actualX, this.y + this.height
    );
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(0.5, '#0088aa');
    gradient.addColorStop(1, '#004466');
    
    ctx.fillStyle = gradient;
    
    // 둥근 사각형 그리기
    Utils.roundRect(ctx, actualX, this.y, actualWidth, this.height, 6);
    ctx.fill();
    
    // 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    Utils.roundRect(ctx, actualX + 4, this.y + 2, actualWidth - 8, 4, 2);
    ctx.fill();
    
    // 그로우 리셋
    ctx.shadowBlur = 0;
  }

  // 패들 확대
  widen(amount = 1.2) {
    this.sizeBonus = Math.min(40, this.sizeBonus + 10);
    this.glowColor = '#ffff00'; // 확대 시 노란색
    
    // 타이머로 원래 크기로 복귀
    setTimeout(() => {
      this.sizeBonus = 0;
      this.glowColor = '#00f0ff';
    }, 5000);
  }

  // 속도 증가
  boostSpeed(amount = 1.5) {
    this.speedBonus = this.speed * (amount - 1);
    this.color = '#ff00ff'; // 속도 증가 시 보라색
    
    // 타이머로 원래 속도로 복귀
    setTimeout(() => {
      this.speedBonus = 0;
      this.color = '#00f0ff';
    }, 5000);
  }

  // 활성화 효과
  activate() {
    super.activate();
    
    // 활성화 애니메이션
    this.glowColor = '#00ff00';
    setTimeout(() => {
      this.glowColor = '#00f0ff';
    }, 500);
  }

  // 파워업 효과
  applyPowerUp(type) {
    switch (type) {
      case 'widen':
        this.widen();
        break;
      case 'speed':
        this.boostSpeed();
        break;
      default:
        this.activate();
    }
  }

  // 리셋
  reset() {
    super.reset();
    this.speedBonus = 0;
    this.sizeBonus = 0;
    this.color = '#00f0ff';
    this.glowColor = '#00f0ff';
  }

  // 클론
  clone() {
    const paddle = new Paddle(this.x, this.y, this.width, this.height);
    paddle.speed = this.speed;
    paddle.speedBonus = this.speedBonus;
    paddle.sizeBonus = this.sizeBonus;
    paddle.color = this.color;
    paddle.glowColor = this.glowColor;
    return paddle;
  }
}

// 전역으로 내보내기
window.Paddle = Paddle;