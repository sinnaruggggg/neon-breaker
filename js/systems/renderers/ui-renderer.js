// UI 렌더러
class UIRenderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  // UI 렌더링
  render(entities, engine) {
    // HUD 업데이트
    this.renderHUD(engine);
    
    // 팝업 렌더링
    this.renderPopups(engine);
  }

  // HUD 렌더링
  renderHUD(engine) {
    if (!window.gameData) return;
    
    // 점수 표시
    const hudScore = window.elements.hudScore;
    if (hudScore) {
      hudScore.textContent = Utils.formatNumber(window.gameData.getTotalScore());
    }
    
    // 라운드 표시
    const hudRound = window.elements.hudRound;
    if (hudRound) {
      const round = window.gameData.getCurrentRound();
      const stage = window.gameData.getCurrentStage();
      hudRound.textContent = `${round}-${stage}`;
    }
    
    // 코인 표시
    const hudCoins = window.elements.hudCoins;
    if (hudCoins) {
      hudCoins.textContent = Utils.formatNumber(window.gameData.getCoins());
    }
    
    // 생명력 표시
    this.renderLives(engine);
    
    // 무기 정보 표시
    this.renderWeaponInfo();
  }

  // 생명력 렌더링
  renderLives(engine) {
    if (!window.elements.livesBar) return;
    
    const maxLives = window.gameData?.getMaxLives() || 4;
    const currentLives = window.gameData?.getPlayerData()?.maxLives || maxLives;
    
    let heartsHTML = '';
    for (let i = 0; i < maxLives; i++) {
      heartsHTML += `<div class="heart ${i < currentLives ? '' : 'empty'}"></div>`;
    }
    
    window.elements.livesBar.innerHTML = heartsHTML;
  }

  // 무기 정보 렌더링
  renderWeaponInfo() {
    if (!window.elements.wpnIcon || !window.elements.wpnName) return;
    
    const equippedWeapon = window.gameData?.getEquippedItem('weapon') || 'w_normal';
    const weapons = {
      'w_normal': { icon: '🔫', name: '기본' },
      'w_spread': { icon: '💨', name: '확산' },
      'w_laser': { icon: '⚡', name: '레이저' },
      'w_rapid': { icon: '🔥', name: '속사' },
      'w_missile': { icon: '🚀', name: '미사일' }
    };
    
    const weapon = weapons[equippedWeapon] || weapons['w_normal'];
    
    window.elements.wpnIcon.textContent = weapon.icon;
    window.elements.wpnName.textContent = weapon.name;
  }

  // 팝업 렌더링
  renderPopups(engine) {
    // 콤보 팝업
    this.renderCombo(engine);
    
    // 스테이지 텍스트
    this.renderStageText(engine);
    
    // 스킬 쿨타임
    this.renderSkillCooldowns(engine);
  }

  // 콤보 팝업 렌더링
  renderCombo(engine) {
    if (!window.elements.comboPopup) return;
    if (!engine.combo || engine.combo <= 2) return;
    
    const comboPopup = window.elements.comboPopup;
    comboPopup.textContent = `${engine.combo}연속!`;
    comboPopup.style.opacity = '1';
    comboPopup.style.transform = 'translateX(-50%) scale(1.2)';
    
    // 애니메이션
    setTimeout(() => {
      comboPopup.style.opacity = '0';
      comboPopup.style.transform = 'translateX(-50%) scale(1)';
    }, 1000);
  }

  // 스테이지 텍스트 렌더링
  renderStageText(engine) {
    if (!window.elements.stagePopup || !engine.showStageText) return;
    
    const stagePopup = window.elements.stagePopup;
    const round = window.gameData?.getCurrentRound() || 1;
    const stage = window.gameData?.getCurrentStage() || 1;
    
    stagePopup.textContent = `라운드 ${round} - 스테이지 ${stage}`;
    stagePopup.style.opacity = '1';
    
    setTimeout(() => {
      stagePopup.style.opacity = '0';
      engine.showStageText = false;
    }, 2000);
  }

  // 스킬 쿨타임 렌더링
  renderSkillCooldowns(engine) {
    if (!window.gameData) return;
    
    const skillCDs = engine.skillCDs || [0, 0, 0];
    const baseCooldowns = [8000, 10000, 12000]; // 기본 쿨타임
    
    skillCDs.forEach((cd, index) => {
      const cdElement = document.getElementById(`cd${index + 1}`);
      if (!cdElement) return;
      
      const now = Date.now();
      const elapsed = now - cd;
      
      // 버프 적용
      const cdMultiplier = window.gameData.hasBuff('cdDown') ? 0.8 : 1;
      const duration = baseCooldowns[index] * cdMultiplier;
      
      const remaining = Math.max(0, duration - elapsed);
      const percentage = (remaining / duration) * 100;
      
      cdElement.style.height = `${percentage}%`;
    });
  }

  // 메시지 표시
  showMessage(text, duration = 2000, type = 'info') {
    const toast = window.elements?.toast;
    if (!toast) return;
    
    toast.textContent = text;
    
    // 타입별 색상
    const colors = {
      'info': '#00f0ff',
      'success': '#00ff88',
      'warning': '#ff8800',
      'error': '#ff4466'
    };
    
    toast.style.backgroundColor = `rgba(0, 0, 0, 0.92)`;
    toast.style.borderColor = colors[type] || colors['info'];
    toast.style.color = colors[type] || colors['info'];
    
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // 로딩 애니메이션
  renderLoadingScreen(text = '로딩 중...') {
    if (!this.ctx || !this.canvas) return;
    
    // 반투명 배경
    this.ctx.fillStyle = 'rgba(10, 10, 18, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 로딩 텍스트
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Orbitron';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 깜박이 효과
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00f0ff';
    
    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.shadowBlur = 0;
  }

  // 페이드 효과
  renderFade(type, duration = 500) {
    return new Promise(resolve => {
      const startTime = Date.now();
      
      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.ctx.save();
        
        let color;
        if (type === 'in') {
          color = `rgba(0, 10, 18, ${progress * 0.9})`;
        } else {
          color = `rgba(0, 10, 18, ${(1 - progress) * 0.9})`;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.restore();
        
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          resolve();
        }
      };
      
      fade();
    });
  }

  // 디버그 정보 렌더링
  renderDebugInfo(engine) {
    if (!engine.debugMode) return;
    
    // 디버그 패널
    this.ctx.save();
    
    // 반투명 배경
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 10, 300, 150);
    
    // 테두리
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(10, 10, 300, 150);
    
    // 정보 표시
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    const perf = engine.getPerformanceInfo();
    let y = 15;
    const lineHeight = 15;
    
    this.ctx.fillText(`UI RENDERER DEBUG`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Active Popups: ${this.countActivePopups()}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`HUD Elements: ${this.countHUDElements()}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Screen Width: ${this.canvas.width}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Screen Height: ${this.canvas.height}`, 15, y);
    
    this.ctx.restore();
  }

  // 활성 팝업 수
  countActivePopups() {
    let count = 0;
    const popups = ['comboPopup', 'stagePopup'];
    
    popups.forEach(id => {
      const element = document.getElementById(id);
      if (element && element.style.opacity === '1') {
        count++;
      }
    });
    
    return count;
  }

  // HUD 요소 수
  countHUDElements() {
    let count = 0;
    const hudElements = ['hudScore', 'hudRound', 'hudCoins', 'livesBar', 'wpnIcon', 'wpnName'];
    
    hudElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        count++;
      }
    });
    
    return count;
  }
}

// 전역으로 내보내기
window.UIRenderer = UIRenderer;