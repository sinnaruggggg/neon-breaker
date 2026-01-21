// 렌더링 시스템
class GameRenderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.backgroundColor = '#08080f';
    this.gridColor = 'rgba(0, 240, 255, 0.03)';
  }

  // 렌더링
  render(entities, engine) {
    // 배경 렌더링
    this.renderBackground();
    
    // 게임 엔티티 렌더링
    this.renderEntities(entities, engine);
    
    // UI 오버레이
    this.renderOverlay(engine);
    
    // 디버그 정보
    if (engine.debugMode) {
      this.renderDebugInfo(engine);
    }
  }

  // 배경 렌더링
  renderBackground() {
    // 그라데이션 배경
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#08080f');
    gradient.addColorStop(0.5, '#0e0e1a');
    gradient.addColorStop(1, '#08080f');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 그리드 효과
    this.renderGrid();
  }

  // 그리드 렌더링
  renderGrid() {
    this.ctx.strokeStyle = this.gridColor;
    this.ctx.lineWidth = 1;
    
    // 수직선
    for (let x = 0; x < this.canvas.width; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // 수평선
    for (let y = 0; y < this.canvas.height; y += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  // 엔티티 렌더링
  renderEntities(entities, engine) {
    // 타입별로 정렬하여 렌더링 순서 결정
    const sortedEntities = Array.from(entities.values()).sort((a, b) => {
      // 렌더링 우선순위: 배경 < 오브젝트 < UI < 이펙트
      const priority = {
        'background': 0,
        'brick': 1,
        'paddle': 2,
        'ball': 3,
        'bullet': 4,
        'item': 5,
        'particle': 6,
        'effect': 7,
        'ui': 8
      };
      
      return (priority[a.type] || 5) - (priority[b.type] || 5);
    });
    
    // 엔티티별 렌더링
    sortedEntities.forEach(entity => {
      if (entity.visible && entity.active && !entity.destroyed) {
        try {
          entity.render(this.ctx, engine);
        } catch (error) {
          console.error(`렌더링 오류 (${entity.type}):`, error);
        }
      }
    });
  }

  // UI 오버레이
  renderOverlay(engine) {
    // 콤보 표시
    this.renderCombo(engine);
    
    // 스테이지 표시
    this.renderStageInfo(engine);
    
    // 스킬 쿨타임 표시
    this.renderSkillCooldowns(engine);
  }

  // 콤보 표시
  renderCombo(engine) {
    if (engine.combo && engine.combo > 2) {
      const comboPopup = document.getElementById('comboPopup');
      if (comboPopup) {
        comboPopup.textContent = `${engine.combo}연속!`;
        comboPopup.style.opacity = '1';
        comboPopup.style.transform = 'translateX(-50%) scale(1.2)';
        
        // 애니메이션
        setTimeout(() => {
          comboPopup.style.opacity = '0';
          comboPopup.style.transform = 'translateX(-50%) scale(1)';
        }, 1000);
      }
    }
  }

  // 스테이지 정보
  renderStageInfo(engine) {
    if (engine.showStageText) {
      const stagePopup = document.getElementById('stagePopup');
      if (stagePopup) {
        const round = window.gameData?.getCurrentRound() || 1;
        const stage = window.gameData?.getCurrentStage() || 1;
        
        stagePopup.textContent = `라운드 ${round} - 스테이지 ${stage}`;
        stagePopup.style.opacity = '1';
        
        setTimeout(() => {
          stagePopup.style.opacity = '0';
          engine.showStageText = false;
        }, 2000);
      }
    }
  }

  // 스킬 쿨타임
  renderSkillCooldowns(engine) {
    const skillCDs = engine.skillCDs || [0, 0, 0];
    
    skillCDs.forEach((cd, index) => {
      const cdElement = document.getElementById(`cd${index + 1}`);
      if (cdElement) {
        const now = Date.now();
        const elapsed = now - cd;
        const duration = [8000, 10000, 12000][index]; // 스킬별 쿨타임
        const remaining = Math.max(0, duration - elapsed);
        
        const percentage = (remaining / duration) * 100;
        cdElement.style.height = `${percentage}%`;
      }
    });
  }

  // 디버그 정보
  renderDebugInfo(engine) {
    const perf = engine.getPerformanceInfo();
    
    // 디버그 패널
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 10, 200, 120);
    
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    let y = 15;
    const lineHeight = 15;
    
    this.ctx.fillText(`FPS: ${perf.fps || 0}`, 15, y);
    y += lineHeight;
    
    this.ctx.fillText(`Entities: ${perf.entities || 0}`, 15, y);
    y += lineHeight;
    
    this.ctx.fillText(`State: ${perf.state || 'unknown'}`, 15, y);
    y += lineHeight;
    
    if (perf.memory) {
      this.ctx.fillText(`Memory: ${perf.memory.used}MB / ${perf.memory.total}MB`, 15, y);
      y += lineHeight;
    }
    
    // 물리 정보
    if (engine.systems?.get('physics')) {
      const physics = engine.systems.get('physics');
      this.ctx.fillText(`Physics Objects: ${physics.getObjectCount()}`, 15, y);
    }
  }

  // 화면 페이드 효과
  renderFade(color, duration) {
    const startTime = Date.now();
    
    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.ctx.save();
      this.ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${progress})`);
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };
    
    fade();
  }

  // 번개 효과
  renderLightning(x, y, targetX, targetY) {
    this.ctx.save();
    
    // 번개 색상
    const gradient = this.ctx.createLinearGradient(x, y, targetX, targetY);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, '#ff8800');
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#ffff00';
    
    // 지그재그 번개
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    
    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const progress = i / segments;
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      
      const lineX = x + (targetX - x) * progress + offsetX;
      const lineY = y + (targetY - y) * progress + offsetY;
      
      if (i === segments) {
        this.ctx.lineTo(targetX, targetY);
      } else {
        this.ctx.lineTo(lineX, lineY);
      }
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  // 폭발 효과
  renderExplosion(x, y, radius, color = '#ff6600') {
    this.ctx.save();
    
    // 폭발 그라데이션
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.6, Utils.rgba(color, 0.6));
    gradient.addColorStop(1, Utils.rgba(color, 0));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  // 셰이크 효과
  renderShockwave(x, y, maxRadius, color = '#00f0ff') {
    this.ctx.save();
    
    const startTime = Date.now();
    const duration = 500; // 0.5초
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        this.ctx.restore();
        return;
      }
      
      const radius = maxRadius * progress;
      const alpha = 1 - progress;
      
      this.ctx.strokeStyle = Utils.rgba(color, alpha * 0.5);
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
}

// 전역으로 내보내기
window.GameRenderer = GameRenderer;