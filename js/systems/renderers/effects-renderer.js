// 이팩트 렌더러
class EffectsRenderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.effects = new Map();
  }

  // 이펙트 추가
  addEffect(type, config) {
    const effectId = this.generateEffectId();
    const effect = {
      id: effectId,
      type: type,
      ...config,
      startTime: Date.now()
    };
    
    this.effects.set(effectId, effect);
    return effect;
  }

  // 이펙트 ID 생성
  generateEffectId() {
    return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 이펙트 제거
  removeEffect(effectId) {
    const effect = this.effects.get(effectId);
    if (effect) {
      effect.active = false;
    }
    this.effects.delete(effectId);
  }

  // 모든 이펙트 렌더링
  render(entities, engine) {
    // 완료된 이펙트 정리
    this.cleanupCompletedEffects();
    
    // 활성 이펙트 렌더링
    this.effects.forEach(effect => {
      if (effect.active && !effect.destroyed) {
        this.renderEffect(effect);
      }
    });
  }

  // 완료된 이펙트 정리
  cleanupCompletedEffects() {
    const toRemove = [];
    
    this.effects.forEach((effect, id) => {
      if (effect.destroyed || this.isEffectExpired(effect)) {
        toRemove.push(id);
      }
    });
    
    toRemove.forEach(id => {
      this.effects.delete(id);
    });
  }

  // 이펙트 만료 확인
  isEffectExpired(effect) {
    const maxDuration = 10000; // 최대 10초
    return Date.now() - effect.startTime > maxDuration;
  }

  // 이펙트 렌더링
  renderEffect(effect) {
    switch (effect.type) {
      case 'explosion':
        this.renderExplosion(effect);
        break;
      case 'lightning':
        this.renderLightning(effect);
        break;
      case 'shockwave':
        this.renderShockwave(effect);
        break;
      case 'particles':
        this.renderParticles(effect);
        break;
      case 'screenShake':
        this.renderScreenShake(effect);
        break;
      case 'flash':
        this.renderFlash(effect);
        break;
    }
  }

  // 폭발 효과
  renderExplosion(effect) {
    const { x, y, radius, color = '#ff6600', intensity = 1 } = effect;
    const progress = this.getEffectProgress(effect);
    
    if (progress >= 1) {
      this.removeEffect(effect.id);
      return;
    }
    
    // 폭발 그라데이션
    this.ctx.save();
    
    // 최대 크기
    const maxRadius = radius * intensity * progress;
    
    // 외부 링
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, maxRadius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * (1 - progress)})`);
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, Utils.rgba(color, 0.6));
    gradient.addColorStop(1, Utils.rgba(color, 0));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, maxRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 내부 링
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - progress)})`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, maxRadius * 0.7, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  // 번개 효과
  renderLightning(effect) {
    const { x, y, targetX, targetY, branches = 5, color = '#ffff00' } = effect;
    const progress = this.getEffectProgress(effect);
    
    if (progress >= 1) {
      this.removeEffect(effect.id);
      return;
    }
    
    // 메인 번개
    this.renderLightningBolt(x, y, targetX, targetY, color, progress);
    
    // 가지 번개들
    for (let i = 0; i < branches; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const distance = Math.random() * 100 + 50;
      const branchX = x + Math.cos(angle) * distance;
      const branchY = y + Math.sin(angle) * distance;
      
      this.renderLightningBolt(x, y, branchX, branchY, color, progress * 0.7);
    }
  }

  // 번개 볼트 렌더링
  renderLightningBolt(x, y, targetX, targetY, color, progress) {
    this.ctx.save();
    
    // 번개 색상
    const gradient = this.ctx.createLinearGradient(x, y, targetX, targetY);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, color);
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3 * progress;
    this.ctx.shadowBlur = 15 * progress;
    this.ctx.shadowColor = color;
    
    // 지그재그 번개
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    
    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const progress = i / segments;
      const offsetX = (Math.random() - 0.5) * 20 * (1 - progress);
      const offsetY = (Math.random() - 0.5) * 20 * (1 - progress);
      
      const lineX = x + (targetX - x) * progress + offsetX;
      const lineY = y + (targetY - y) * progress + offsetY;
      
      if (i === segments) {
        this.ctx.lineTo(targetX, targetY);
      } else {
        this.ctx.lineTo(lineX, lineY);
      }
    }
    
    this.ctx.stroke();
    
    // 플래시 효과
    if (progress > 0.8) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.8) * 2})`;
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${progress - 0.8})`;
      this.ctx.lineWidth = 1;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(targetX, targetY);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  // 충격파 효과
  renderShockwave(effect) {
    const { x, y, maxRadius, color = '#00f0ff' } = effect;
    const progress = this.getEffectProgress(effect);
    
    if (progress >= 1) {
      this.removeEffect(effect.id);
      return;
    }
    
    const radius = maxRadius * progress;
    const alpha = 1 - progress;
    
    this.ctx.save();
    
    // 충격파 링
    for (let i = 0; i < 3; i++) {
      const ringRadius = radius - i * 10;
      const ringAlpha = alpha * (1 - i * 0.3);
      
      this.ctx.strokeStyle = Utils.rgba(color, ringAlpha);
      this.ctx.lineWidth = 2 - i * 0.5;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  // 파티클 효과
  renderParticles(effect) {
    const { particles } = effect;
    
    particles.forEach(particle => {
      this.renderParticle(particle);
    });
  }

  // 단일 파티클 렌더링
  renderParticle(particle) {
    const { x, y, dx, dy, size, color, life, rotation } = particle;
    
    this.ctx.save();
    
    // 파티클 그리기
    this.ctx.fillStyle = color;
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    // 사각형 파티클
    this.ctx.fillRect(-size / 2, -size / 2, size, size);
    
    this.ctx.restore();
  }

  // 화면 흔들림
  renderScreenShake(effect) {
    const { intensity, duration } = effect;
    const progress = this.getEffectProgress(effect);
    
    if (progress >= 1) {
      this.removeEffect(effect.id);
      return;
    }
    
    // 캔버스 흔들림은 메인 게임 엔진에서 처리
    // 여기서는 효과 정보만 업데이트
  }

  // 화면 플래시
  renderFlash(effect) {
    const { color = '#ffffff', duration = 200 } = effect;
    const progress = this.getEffectProgress(effect);
    
    if (progress >= 1) {
      this.removeEffect(effect.id);
      return;
    }
    
    const alpha = (1 - progress) * 0.8;
    
    this.ctx.save();
    this.ctx.fillStyle = Utils.rgba(color, alpha);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  // 이펙트 진행률 계산
  getEffectProgress(effect) {
    const elapsed = Date.now() - effect.startTime;
    const duration = effect.duration || 1000;
    return Math.min(elapsed / duration, 1);
  }

  // 폭발 이펙트 생성
  createExplosion(x, y, intensity = 1) {
    return this.addEffect('explosion', {
      x, y,
      radius: 50 * intensity,
      color: '#ff6600',
      intensity,
      duration: 800
    });
  }

  // 번개 이펙트 생성
  createLightning(x, y, targetX, targetY) {
    return this.addEffect('lightning', {
      x, y, targetX, targetY,
      branches: 5,
      color: '#ffff00',
      duration: 300
    });
  }

  // 충격파 이펙트 생성
  createShockwave(x, y) {
    return this.addEffect('shockwave', {
      x, y,
      maxRadius: 150,
      color: '#00f0ff',
      duration: 500
    });
  }

  // 화면 플래시 이펙트 생성
  createFlash(color = '#ffffff', duration = 200) {
    return this.addEffect('flash', {
      color,
      duration
    });
  }

  // 파티클 이펙트 생성
  createParticles(x, y, count = 10, spread = 30, velocity = 100) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + spread * Math.PI / 180;
      
      particles.push({
        x,
        y,
        dx: Math.cos(angle) * velocity * (0.5 + Math.random() * 0.5),
        dy: Math.sin(angle) * velocity * (0.5 + Math.random() * 0.5),
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
        life: 1000,
        rotation: Math.random() * Math.PI * 2
      });
    }
    
    return this.addEffect('particles', {
      particles,
      duration: 1000
    });
  }

  // 모든 이펙트 제거
  clearAllEffects() {
    this.effects.clear();
  }

  // 디버그 정보
  debug() {
    console.group('EffectsRenderer Debug');
    console.log('Active Effects:', this.effects.size);
    this.effects.forEach((effect, id) => {
      console.log(`  ${id}: ${effect.type} (${this.getEffectProgress(effect).toFixed(2)})`);
    });
    console.groupEnd();
  }
}

// 전역으로 내보내기
window.EffectsRenderer = EffectsRenderer;