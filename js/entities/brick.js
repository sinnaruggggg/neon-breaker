// 블록 클래스
class Brick extends Entity {
  constructor(x, y, width, height, color, type = 'normal') {
    super(x, y, width, height, 'brick');
    
    // 블록 속성
    this.color = color;
    this.type = type;
    this.maxHp = this.getInitialHp(type);
    this.hp = this.maxHp;
    this.points = this.getInitialPoints(type);
    this.destroyed = false;
    
    // 애니메이션
    this.shakeAmount = 0;
    this.shakeTime = 0;
    this.hitFlash = 0;
    
    // 스페 효과
    this.particles = [];
  }

  // 초기 HP 설정
  getInitialHp(type) {
    switch (type) {
      case 'strong': return 2;
      case 'bomb': return 1;
      case 'metal': return 3;
      case 'glass': return 1;
      default: return 1;
    }
  }

  // 초기 점수 설정
  getInitialPoints(type) {
    switch (type) {
      case 'strong': return 20;
      case 'bomb': return 15;
      case 'metal': return 30;
      case 'glass': return 10;
      case 'bonus': return 50;
      default: return 10;
    }
  }

  // 업데이트
  update(deltaTime, engine) {
    if (!this.active || this.destroyed) return;

    // 애니메이션 업데이트
    this.updateAnimations(deltaTime);
    
    // 파티클 업데이트
    this.updateParticles(deltaTime);
  }

  // 애니메이션 업데이트
  updateAnimations(deltaTime) {
    // 흔들림 애니메이션
    if (this.shakeTime > 0) {
      this.shakeTime -= deltaTime * 1000;
      this.shakeAmount = Math.sin(this.shakeTime * 0.05) * 2 * (this.shakeTime / 500);
    } else {
      this.shakeAmount = 0;
    }
    
    // 타격 플래시
    if (this.hitFlash > 0) {
      this.hitFlash -= deltaTime * 3;
      if (this.hitFlash < 0) this.hitFlash = 0;
    }
  }

  // 파티클 업데이트
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(particle => {
      particle.life -= deltaTime * 1000;
      particle.x += particle.dx * deltaTime * 60;
      particle.y += particle.dy * deltaTime * 60;
      particle.dy += 500 * deltaTime; // 중력
      particle.rotation += particle.rotationSpeed * deltaTime * 60;
      
      return particle.life > 0;
    });
  }

  // 타격 처리
  hit(damage = 1) {
    this.hp -= damage;
    this.hitFlash = 1;
    
    if (this.hp <= 0) {
      this.destroy();
      return true; // 파괴됨
    }
    
    // 타격 효과
    this.createHitEffect();
    this.shakeTime = 200; // 0.2초
    
    return false; // 생존
  }

  // 파괴 처리
  destroy() {
    if (this.destroyed) return;
    
    this.destroyed = true;
    this.active = false;
    
    // 파괴 효과
    this.createDestroyEffect();
    this.createParticles();
    
    // 점수 보상
    this.giveReward();
  }

  // 타격 효과
  createHitEffect() {
    console.log('Brick hit!');
    // 사운드 재생
    Utils.playSound(440, 50);
  }

  // 파괴 효과
  createDestroyEffect() {
    console.log(`Brick destroyed! Type: ${this.type}, Points: ${this.points}`);
    
    // 사운드 재생
    Utils.playSound(220, 100);
  }

  // 파티클 생성
  createParticles() {
    const particleCount = this.type === 'bomb' ? 20 : 8;
    const bounds = this.getBounds();
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Utils.randomRange(50, 150);
      
      this.particles.push({
        x: bounds.centerX,
        y: bounds.centerY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 100,
        size: Utils.randomRange(2, 6),
        color: this.color,
        life: 1000,
        rotation: 0,
        rotationSpeed: Utils.randomRange(-5, 5)
      });
    }
  }

  // 보상 지급
  giveReward() {
    // 점수 추가
    window.gameData?.addScore(this.points);
    
    // 코인 보상 (확률적)
    if (Math.random() < 0.1) { // 10% 확률
      const coinAmount = this.type === 'bonus' ? 50 : 10;
      window.gameData?.addCoins(coinAmount);
    }
    
    // 아이템 드랍 (확률적)
    if (Math.random() < 0.05) { // 5% 확률
      this.dropItem();
    }
  }

  // 아이템 드랍
  dropItem() {
    const bounds = this.getBounds();
    const itemTypes = ['life', 'multiball', 'widen', 'coin'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    const item = new Item(
      bounds.centerX,
      bounds.centerY,
      itemType
    );
    
    // 게임 엔진에 아이템 추가
    if (window.gameEngine) {
      window.gameEngine.addEntity(item);
    }
  }

  // 렌더링
  render(ctx, engine) {
    if (!this.visible || this.destroyed) return;

    ctx.save();

    // 흔들림 적용
    const shakeX = this.shakeAmount * Math.sin(Date.now() * 0.01);
    const shakeY = this.shakeAmount * Math.cos(Date.now() * 0.01);

    const renderX = this.x + shakeX;
    const renderY = this.y + shakeY;

    // 블록 타입별 렌더링
    this.renderByType(ctx, renderX, renderY);

    // 타격 플래시
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.hitFlash})`;
      ctx.fillRect(renderX, renderY, this.width, this.height);
    }

    // 파티클 렌더링
    this.renderParticles(ctx, renderX, renderY);

    // 디버그 모드
    if (engine.debugMode) {
      this.renderDebug(ctx);
    }

    ctx.restore();
  }

  // 타입별 렌더링
  renderByType(ctx, x, y) {
    switch (this.type) {
      case 'strong':
        this.renderStrongBrick(ctx, x, y);
        break;
      case 'bomb':
        this.renderBombBrick(ctx, x, y);
        break;
      case 'metal':
        this.renderMetalBrick(ctx, x, y);
        break;
      case 'glass':
        this.renderGlassBrick(ctx, x, y);
        break;
      case 'bonus':
        this.renderBonusBrick(ctx, x, y);
        break;
      default:
        this.renderNormalBrick(ctx, x, y);
    }
  }

  // 일반 블록
  renderNormalBrick(ctx, x, y) {
    // 그라데이션
    const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, Utils.darkenColor(this.color, 30));
    
    ctx.fillStyle = gradient;
    Utils.roundRect(ctx, x, y, this.width, this.height, 3);
    ctx.fill();
    
    // 테두리
    ctx.strokeStyle = Utils.darkenColor(this.color, 20);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 강한 블록
  renderStrongBrick(ctx, x, y) {
    this.renderNormalBrick(ctx, x, y);
    
    // HP 표시
    if (this.hp > 1) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        this.hp.toString(),
        x + this.width / 2,
        y + this.height / 2
      );
    }
  }

  // 폭탄 블록
  renderBombBrick(ctx, x, y) {
    this.renderNormalBrick(ctx, x, y);
    
    // 폭탄 아이콘
    ctx.fillStyle = '#ff6600';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💥', x + this.width / 2, y + this.height / 2);
  }

  // 금속 블록
  renderMetalBrick(ctx, x, y) {
    // 금속 질감
    const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
    gradient.addColorStop(0, '#888888');
    gradient.addColorStop(0.5, '#cccccc');
    gradient.addColorStop(1, '#666666');
    
    ctx.fillStyle = gradient;
    Utils.roundRect(ctx, x, y, this.width, this.height, 2);
    ctx.fill();
    
    // 금속 광택
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    Utils.roundRect(ctx, x + 2, y + 2, this.width - 4, this.height / 3, 1);
    ctx.fill();
  }

  // 유리 블록
  renderGlassBrick(ctx, x, y) {
    // 유리 질감
    const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(50, 150, 200, 0.8)');
    
    ctx.fillStyle = gradient;
    Utils.roundRect(ctx, x, y, this.width, this.height, 4);
    ctx.fill();
    
    // 깨짐 효과
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 5);
    ctx.lineTo(x + this.width - 5, y + this.height - 10);
    ctx.stroke();
  }

  // 보너스 블록
  renderBonusBrick(ctx, x, y) {
    // 무지개 효과
    const hue = (Date.now() / 10) % 360;
    const rainbowColor = `hsl(${hue}, 100%, 60%)`;
    
    const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
    gradient.addColorStop(0, rainbowColor);
    gradient.addColorStop(1, Utils.darkenColor(rainbowColor, 30));
    
    ctx.fillStyle = gradient;
    Utils.roundRect(ctx, x, y, this.width, this.height, 3);
    ctx.fill();
    
    // 별 표시
    ctx.fillStyle = '#ffff00';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', x + this.width / 2, y + this.height / 2);
  }

  // 파티클 렌더링
  renderParticles(ctx, baseX, baseY) {
    this.particles.forEach(particle => {
      ctx.save();
      
      const alpha = particle.life / 1000;
      ctx.globalAlpha = alpha;
      
      ctx.fillStyle = particle.color;
      ctx.translate(particle.x - baseX, particle.y - baseY);
      ctx.rotate(particle.rotation);
      
      // 사각형 파티클
      ctx.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size
      );
      
      ctx.restore();
    });
  }

  // HP 업데이트 (상태 변경용)
  setHp(hp) {
    this.hp = Math.max(0, hp);
    if (this.hp <= 0) {
      this.destroy();
    }
  }

  // 타입 변경
  setType(type) {
    this.type = type;
    this.maxHp = this.getInitialHp(type);
    this.hp = this.maxHp;
    this.points = this.getInitialPoints(type);
  }

  // 리셋
  reset() {
    super.reset();
    this.hp = this.maxHp;
    this.destroyed = false;
    this.shakeAmount = 0;
    this.shakeTime = 0;
    this.hitFlash = 0;
    this.particles = [];
  }

  // 클론
  clone() {
    const brick = new Brick(
      this.x, this.y, this.width, this.height,
      this.color, this.type
    );
    
    brick.hp = this.hp;
    brick.maxHp = this.maxHp;
    brick.points = this.points;
    
    return brick;
  }
}

// 전역으로 내보내기
window.Brick = Brick;