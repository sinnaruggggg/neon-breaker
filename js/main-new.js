// 네온 브레이커 메인 진입점 - 버그 수정 버전
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 네온 브레이커 2.0 (버그 수정) 시작 중...');
  
  try {
    // 초기화 순서 - 성능 최적화 추가
    await initializeStorage();
    await initializeInput();
    await initializePerformance();
    await initializeEngine();
    await initializeUI();
    
    // PWA 설치 체크
    initializePWA();
    
    console.log('✅ 게임 초기화 완료');
    
  } catch (error) {
    console.error('❌ 게임 초기화 실패:', error);
    showError('게임 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
  }
});

// 게임 콤보 시스템
window.gameCombo = 0;
window.gameComboTimer = null;

// 콤보 증가
function increaseCombo() {
  window.gameCombo++;
  
  // 타이머 리셋
  if (window.gameComboTimer) {
    clearTimeout(window.gameComboTimer);
  }
  
  // 콤보 UI 업데이트
  if (window.elements && window.elements.comboPopup) {
    const popup = window.elements.comboPopup;
    if (window.gameCombo > 2) {
      popup.textContent = `${window.gameCombo}연속!`;
      popup.style.opacity = '1';
      popup.style.transform = 'translateX(-50%) scale(1.2)';
    }
    
    // 새 타이머 설정
    window.gameComboTimer = setTimeout(() => {
      resetGameCombo();
    }, 2000);
  }
}

// 콤보 리셋
function resetGameCombo() {
  window.gameCombo = 0;
  if (window.gameComboTimer) {
    clearTimeout(window.gameComboTimer);
    window.gameComboTimer = null;
  }
  
  // 콤보 UI 업데이트
  if (window.elements && window.elements.comboPopup) {
    const popup = window.elements.comboPopup;
    popup.style.opacity = '0';
    popup.style.transform = 'translateX(-50%) scale(1)';
  }
}

// 콤보 UI 업데이트
function updateComboUI() {
  if (window.gameEngine && window.elements.comboPopup) {
    window.gameEngine.combo = window.gameCombo;
  }
}

// 스킬 쿨타임 표시
function updateSkillCooldowns(engine) {
  if (!window.elements) return;
  
  const skillCDs = window.gameEngine?.skillCDs || [0, 0, 0];
  
  skillCDs.forEach((cd, index) => {
    const cdElement = document.getElementById(`cd${index + 1}`);
    if (!cdElement) return;
    
    const now = Date.now();
    const elapsed = now - cd;
    const baseCooldowns = [8000, 10000, 12000];
    const cdMultiplier = window.gameData?.hasBuff('cdDown') ? 0.8 : 1;
    const duration = baseCooldowns[index] * cdMultiplier;
    const remaining = Math.max(0, duration - elapsed);
    
    const percentage = remaining > 0 ? (remaining / duration) * 100 : 0;
    cdElement.style.height = `${percentage}%`;
  });
}

// 스토리지 초기화
async function initializeStorage() {
  console.log('📦 스토리지 초기화 중...');
  
  // 스토리지 관리자 초기화
  window.storageManager.init();
  
  // 게임 데이터 초기화
  window.gameData.init();
  
  // 데이터 유효성 검사
  const validation = window.gameData.validate();
  if (!validation.isValid) {
    console.warn('데이터 유효성 문제:', validation.errors);
    // 필수 데이터 복구
    window.gameData.reset('player');
  }
  
  console.log('✅ 스토리지 초기화 완료');
}

// 입력 핸들러 초기화
async function initializeInput() {
  console.log('🎮 입력 시스템 초기화 중...');
  
  // 입력 핸들러는 이미 생성되어 있음
  // 추가 초기화 필요시 여기에 구현
  
  console.log('✅ 입력 시스템 초기화 완료');
}

// 성능 최적화 초기화
async function initializePerformance() {
  console.log('⚡ 성능 최적화 초기화 중...');
  
  // 성능 최적화 도구 생성
  window.performanceOptimizer = new PerformanceOptimizer();
  
  // 기기에 맞는 최적화 레벨 설정
  window.performanceOptimizer.optimizeForDevice();
  
  // 자동 최적화 활성화
  window.performanceOptimizer.beginFrame();
  
  // 주기적 가비지 컬렉션
  setInterval(() => {
    window.performanceOptimizer.garbageCollect();
  }, 30000); // 30초마다
  
  console.log('✅ 성능 최적화 초기화 완료');
}

// 게임 엔진 초기화
async function initializeEngine() {
  console.log('🚀 게임 엔진 초기화 중...');
  
  // 캔버스 설정
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  if (!canvas || !ctx) {
    throw new Error('캔버스를 찾을 수 없습니다');
  }
  
  // 게임 엔진 생성
  window.gameEngine = new GameEngine(canvas, ctx);
  
  // 충돌 핸들러 등록
  setupCollisionHandlers();
  
  // 엔진 시작
  window.gameEngine.start();
  
  console.log('✅ 게임 엔진 초기화 완료');
}

// 충돌 핸들러 설정
function setupCollisionHandlers() {
  const collisionSystem = window.gameEngine?.systems?.get('collision');
  if (!collisionSystem) return;
  
  // 공-패들 충돌
  collisionSystem.addCollisionHandler('ball', 'paddle', (collision) => {
    const ball = collision.entity1;
    const paddle = collision.entity2;
    
    if (ball && paddle && ball.handlePaddleCollision) {
      const hit = ball.handlePaddleCollision(paddle);
      
      if (hit) {
        // 사운드 재생
        Utils.playSound(330, 50);
      }
    }
  });
  
  // 공-블록 충돌
  collisionSystem.addCollisionHandler('ball', 'brick', (collision) => {
    const ball = collision.entity1;
    const brick = collision.entity2;
    
    if (ball && brick && brick.hit) {
      // 블록 타격
      const destroyed = brick.hit(1);
      
      if (destroyed) {
        // 공 반사
        if (collision.side === 'top' || collision.side === 'bottom') {
          ball.dy = -ball.dy;
        } else if (collision.side === 'left' || collision.side === 'right') {
          ball.dx = -ball.dx;
        }
        
        // 콤보 증가
        increaseCombo();
        
        // 콤보 UI 업데이트
        updateComboUI();
      }
      
      // 점수 및 보상 처리는 GameEngine에서 처리
    }
  });
  
  // 공-벽 충돌
  collisionSystem.addCollisionHandler('ball', 'wall', (collision) => {
    const ball = collision.entity1;
    
    if (ball) {
      if (collision.side === 'left' || collision.side === 'right') {
        ball.dx = -ball.dx;
      } else if (collision.side === 'top') {
        ball.dy = -ball.dy;
      }
      
      // 콤보 리셋
      resetGameCombo();
      updateComboUI();
      
      // 사운드 재생
      Utils.playSound(220, 30);
    }
  });
  
  // 아이템-패들 충돌
  collisionSystem.addCollisionHandler('item', 'paddle', (collision) => {
    const item = collision.entity1;
    const paddle = collision.entity2;
    
    if (item && paddle && item.collect) {
      item.collect(paddle);
      
      // 사운드 재생
      Utils.playSound(550, 100);
      Utils.vibrate([50]);
    }
  });
}

// UI 초기화
async function initializeUI() {
  console.log('🎨 UI 초기화 중...');
  
  // 기본 UI 요소 바인딩
  bindUIElements();
  
  // 이벤트 리스너 설정
  setupUIEventListeners();
  
  // 초기 UI 상태 업데이트
  updateUI();
  
  // 게임 엔진 이벤트 연결
  setupEngineEvents();
  
  console.log('✅ UI 초기화 완료');
}

// UI 요소 바인딩
function bindUIElements() {
  // 메인 UI 요소들
  window.elements = {
    // 헤더
    hudScore: document.getElementById('hudScore'),
    hudRound: document.getElementById('hudRound'),
    hudCoins: document.getElementById('hudCoins'),
    livesBar: document.getElementById('livesBar'),
    pauseBtn: document.getElementById('pauseBtn'),
    
    // 게임 영역
    gameArea: document.getElementById('gameArea'),
    gameCanvas: document.getElementById('gameCanvas'),
    
    // 컨트롤
    leftBtn: document.getElementById('leftBtn'),
    rightBtn: document.getElementById('rightBtn'),
    fireBtn: document.getElementById('fireBtn'),
    skillBtn1: document.getElementById('skillBtn1'),
    skillBtn2: document.getElementById('skillBtn2'),
    skillBtn3: document.getElementById('skillBtn3'),
    
    // 팝업
    comboPopup: document.getElementById('comboPopup'),
    stagePopup: document.getElementById('stagePopup'),
    
    // 화면들
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    stageClearScreen: document.getElementById('stageClearScreen'),
    roundClearScreen: document.getElementById('roundClearScreen'),
    shopScreen: document.getElementById('shopScreen'),
    pauseScreen: document.getElementById('pauseScreen'),
    
    // 버튼들
    startBtn: document.getElementById('startBtn'),
    adminBtn: document.getElementById('adminBtn'),
    continueBtn: document.getElementById('continueBtn'),
    menuBtn1: document.getElementById('menuBtn1'),
    nextStageBtn: document.getElementById('nextStageBtn'),
    nextRoundBtn: document.getElementById('nextRoundBtn'),
    shopBtn2: document.getElementById('shopBtn2'),
    closeShopBtn: document.getElementById('closeShopBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    restartBtn: document.getElementById('restartBtn'),
    menuBtn2: document.getElementById('menuBtn2')
  };
}

// UI 이벤트 리스너 설정
function setupUIEventListeners() {
  // 게임 컨트롤
  if (window.elements.pauseBtn) {
    window.elements.pauseBtn.addEventListener('click', togglePause);
  }
  
  // 터치 이벤트를 버튼에 추가
  setupButtonControls();
  
  // 메뉴 버튼들
  if (window.elements.startBtn) {
    window.elements.startBtn.addEventListener('click', startGame);
  }
  
  if (window.elements.adminBtn) {
    window.elements.adminBtn.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
  }
  
  // 키보드 입력
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

// 버튼 컨트롤 설정
function setupButtonControls() {
  const buttons = {
    left: window.elements.leftBtn,
    right: window.elements.rightBtn,
    fire: window.elements.fireBtn
  };
  
  // 버튼 상태 관리
  const setButtonState = (button, pressed) => {
    if (button) {
      button.pressed = pressed;
      
      if (pressed) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  };
  
  // 왼쪽 버튼
  if (buttons.left) {
    buttons.left.addEventListener('touchstart', (e) => {
      e.preventDefault();
      setButtonState(buttons.left, true);
      window.inputHandler.keys['ArrowLeft'] = true;
    });
    
    buttons.left.addEventListener('touchend', (e) => {
      e.preventDefault();
      setButtonState(buttons.left, false);
      window.inputHandler.keys['ArrowLeft'] = false;
    });
    
    buttons.left.addEventListener('mousedown', () => {
      setButtonState(buttons.left, true);
      window.inputHandler.keys['ArrowLeft'] = true;
    });
    
    buttons.left.addEventListener('mouseup', () => {
      setButtonState(buttons.left, false);
      window.inputHandler.keys['ArrowLeft'] = false;
    });
  }
  
  // 오른쪽 버튼
  if (buttons.right) {
    buttons.right.addEventListener('touchstart', (e) => {
      e.preventDefault();
      setButtonState(buttons.right, true);
      window.inputHandler.keys['ArrowRight'] = true;
    });
    
    buttons.right.addEventListener('touchend', (e) => {
      e.preventDefault();
      setButtonState(buttons.right, false);
      window.inputHandler.keys['ArrowRight'] = false;
    });
    
    buttons.right.addEventListener('mousedown', () => {
      setButtonState(buttons.right, true);
      window.inputHandler.keys['ArrowRight'] = true;
    });
    
    buttons.right.addEventListener('mouseup', () => {
      setButtonState(buttons.right, false);
      window.inputHandler.keys['ArrowRight'] = false;
    });
  }
  
  // 발사 버튼
  if (buttons.fire) {
    buttons.fire.addEventListener('touchstart', (e) => {
      e.preventDefault();
      setButtonState(buttons.fire, true);
      window.inputHandler.keys[' '] = true;
    });
    
    buttons.fire.addEventListener('touchend', (e) => {
      e.preventDefault();
      setButtonState(buttons.fire, false);
      window.inputHandler.keys[' '] = false;
    });
    
    buttons.fire.addEventListener('mousedown', () => {
      setButtonState(buttons.fire, true);
      window.inputHandler.keys[' '] = true;
    });
    
    buttons.fire.addEventListener('mouseup', () => {
      setButtonState(buttons.fire, false);
      window.inputHandler.keys[' '] = false;
    });
  }
}

// 게임 엔진 이벤트 연결
function setupEngineEvents() {
  if (!window.gameEngine) return;
  
  // 상태 변경 이벤트
  window.gameEngine.on('stateChange', ({ oldState, newState }) => {
    console.log(`State changed: ${oldState} -> ${newState}`);
    handleStateChange(newState);
  });
  
  // 게임 오버 이벤트
  window.gameEngine.on('gameOver', () => {
    console.log('Game Over!');
    showGameOverScreen();
  });
  
  // 스테이지 클리어 이벤트
  window.gameEngine.on('stageClear', () => {
    console.log('Stage Clear!');
    showStageClearScreen();
  });
  
  // 라운드 클리어 이벤트
  window.gameEngine.on('roundClear', () => {
    console.log('Round Clear!');
    showRoundClearScreen();
  });
}

// 상태 변경 처리
function handleStateChange(newState) {
  switch (newState) {
    case 'menu':
      showScreen('startScreen');
      break;
    case 'playing':
      hideAllScreens();
      break;
    case 'paused':
      showScreen('pauseScreen');
      break;
    case 'gameover':
      showGameOverScreen();
      break;
    case 'stageclear':
      showStageClearScreen();
      break;
    case 'roundclear':
      showRoundClearScreen();
      break;
  }
}

// UI 업데이트
function updateUI() {
  if (!window.elements || !window.gameData) return;
  
  // 코인 업데이트
  if (window.elements.hudCoins) {
    window.elements.hudCoins.textContent = Utils.formatNumber(window.gameData.getCoins());
  }
  
  // 라운드 업데이트
  if (window.elements.hudRound) {
    const round = window.gameData.getCurrentRound();
    const stage = window.gameData.getCurrentStage();
    window.elements.hudRound.textContent = `${round}-${stage}`;
  }
  
  // 생명력 업데이트
  updateLivesDisplay();
  
  // 무기 정보 업데이트
  updateWeaponDisplay();
}

// 생명력 표시 업데이트
function updateLivesDisplay() {
  if (!window.elements.livesBar) return;
  
  const maxLives = window.gameData?.getMaxLives() || 4;
  const currentLives = window.gameData?.getPlayerData()?.maxLives || maxLives;
  
  let heartsHTML = '';
  for (let i = 0; i < maxLives; i++) {
    heartsHTML += `<div class="heart ${i < currentLives ? '' : 'empty'}"></div>`;
  }
  
  window.elements.livesBar.innerHTML = heartsHTML;
}

// 무기 정보 업데이트
function updateWeaponDisplay() {
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

// 화면 전환
function showScreen(screenId) {
  hideAllScreens();
  
  if (screenId && window.elements[screenId]) {
    window.elements[screenId].classList.remove('hidden');
  }
}

function hideAllScreens() {
  const screens = [
    'startScreen', 'gameOverScreen', 'stageClearScreen', 
    'roundClearScreen', 'shopScreen', 'pauseScreen'
  ];
  
  screens.forEach(id => {
    if (window.elements[id]) {
      window.elements[id].classList.add('hidden');
    }
  });
}

// 기본 게임 함수들
function startGame() {
  if (!window.gameEngine) return;
  
  console.log('Starting game...');
  
  // 게임 초기화
  window.gameEngine.setState('playing');
  
  // 기존 데이터와 연동
  if (window.gameData) {
    // 데이터 초기화
    const playerData = window.gameData.getPlayerData();
    window.gameEngine.maxLives = playerData.maxLives;
    window.gameEngine.score = playerData.totalScore;
    
    // 기존 데이터 연동
    window.gameEngine.skillCDs = window.gameEngine.skillCDs || [0, 0, 0];
  }
}

function togglePause() {
  if (!window.gameEngine) return;
  
  const currentState = window.gameEngine.state;
  
  if (currentState === 'playing') {
    window.gameEngine.setState('paused');
  } else if (currentState === 'paused') {
    window.gameEngine.setState('playing');
  }
}

function useSkill(skillNumber) {
  console.log(`Skill ${skillNumber} used`);
  
  if (!window.gameEngine) return;
  
  // 스킬 사용은 추후 구현
  const skillCDs = window.gameEngine.skillCDs || [0, 0, 0];
  const baseCooldowns = [8000, 10000, 12000];
  const cdMultiplier = window.gameData?.hasBuff('cdDown') ? 0.8 : 1;
  
  // 스킬 쿨타임 설정
  const now = Date.now();
  skillCDs[skillNumber - 1] = now - (baseCooldowns[skillNumber - 1] * cdMultiplier * 0.5); // 기본 대기 시간의 50%만 기다림
  
  // 스킬 효과는 추후 EffectsRenderer에서 처리
  const effectsRenderer = window.gameEngine?.renderers?.get('effects');
  if (effectsRenderer) {
    switch (skillNumber) {
      case 1: // 폭탄
        effectsRenderer.createExplosion(
          window.gameEngine.canvas.width / 2,
          window.gameEngine.canvas.height / 3,
          2
        );
        break;
      case 2: // 번개
        // 모든 블록에 번개
        const bricks = window.gameEngine.getEntitiesByType('brick');
        bricks.forEach((brick, index) => {
          if (index % 3 === 0) { // 3개 블록마다 번개
            effectsRenderer.createLightning(
              brick.x + brick.width / 2,
              brick.y + brick.height / 2,
              brick.x + brick.width / 2,
              window.gameEngine.canvas.height / 2
            );
          }
        });
        break;
      case 3: // 화염
        const balls = window.gameEngine.getEntitiesByType('ball');
        balls.forEach(ball => {
          effectsRenderer.createFlash('#ff6600', 1000);
          ball.setPiercing(5000, 10); // 5초간 관통, 반지름 10으로 증가
        });
        break;
    }
  }
}

// 화면 표시 함수들
function showGameOverScreen() {
  showScreen('gameOverScreen');
  
  // 최종 점수 표시
  if (window.elements.finalScore && window.gameData) {
    window.elements.finalScore.textContent = Utils.formatNumber(window.gameData.getTotalScore());
  }
}

function showStageClearScreen() {
  showScreen('stageClearScreen');
  
  // 보상 계산
  const stage = window.gameData?.getCurrentStage() || 1;
  const reward = 50 + stage * 20;
  
  if (window.elements.stageReward && window.gameData) {
    window.elements.stageReward.textContent = reward;
    window.gameData.addCoins(reward);
  }
}

function showRoundClearScreen() {
  showScreen('roundClearScreen');
  
  // 라운드 보너스
  const round = window.gameData?.getCurrentRound() || 1;
  const bonus = 500 + round * 200;
  
  if (window.elements.roundBonus && window.gameData) {
    window.elements.roundBonus.textContent = bonus;
    window.gameData.addCoins(bonus);
  }
}

// 토스트 메시지
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

function showError(message) {
  console.error(message);
  showToast(message);
}

// 캔버스 리사이즈
function resizeCanvas() {
  if (!window.gameEngine) return;
  
  const container = window.elements.gameArea;
  if (container && window.gameEngine.canvas) {
    window.gameEngine.canvas.width = container.clientWidth;
    window.gameEngine.canvas.height = container.clientHeight;
  }
}

// PWA 초기화
function initializePWA() {
  console.log('📱 PWA 초기화 중...');
  
  // 서비스 워커 등록
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ 서비스 워커 등록 성공:', registration);
        
        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        });
      })
      .catch(error => {
        console.log('❌ 서비스 워커 등록 실패:', error);
      });
  }
  
  // 설치 프롬프트
  setupInstallPrompt();
  
  console.log('✅ PWA 초기화 완료');
}

// 설치 프롬프트 설정
function setupInstallPrompt() {
  let deferredPrompt = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });
  
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    console.log('✅ PWA 설치 완료');
  });
}

function showInstallButton() {
  // 설치 버튼 UI 생성
  let installBtn = document.getElementById('installBtn');
  
  if (!installBtn) {
    installBtn = document.createElement('button');
    installBtn.id = 'installBtn';
    installBtn.className = 'btn btn-primary';
    installBtn.textContent = '📱 홈 화면에 추가';
    installBtn.style.margin = '10px';
    
    if (window.elements.startScreen) {
      window.elements.startScreen.querySelector('.overlay-inner').appendChild(installBtn);
    }
  }
  
  installBtn.onclick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(result => {
        if (result.outcome === 'accepted') {
          console.log('PWA 설치 수락');
        }
      });
    }
  };
}

function hideInstallButton() {
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.remove();
  }
}

// 전역 함수들
window.showScreen = showScreen;
window.hideAllScreens = hideAllScreens;
window.showToast = showToast;
window.showError = showError;

// 리사이즈 이벤트
window.addEventListener('resize', () => {
  resizeCanvas();
});

// 데이터 변경 리스너 설정
setTimeout(() => {
  if (window.gameData) {
    // 코인 변경 감지
    window.gameData.onChange('coins', (coins) => {
      if (window.elements.hudCoins) {
        window.elements.hudCoins.textContent = Utils.formatNumber(coins);
      }
    });
    
    // 라운드 변경 감지
    window.gameData.onChange('round', (round) => {
      if (window.elements.hudRound) {
        const stage = window.gameData.getCurrentStage();
        window.elements.hudRound.textContent = `${round}-${stage}`;
      }
    });
    
    // 능력치 변경 감지
    window.gameData.onChange('maxLives', () => {
      updateLivesDisplay();
    });
    
    // 장착 무기 변경 감지
    window.gameData.onChange('equippedItem', (data) => {
      if (data.type === 'weapon') {
        updateWeaponDisplay();
      }
    });
  }
}, 100);

// 디버깅 정보
console.log('🎮 네온 브레이커 2.0 (버그 수정) 초기화 시스템 로드됨');
console.log('📊 스토리지 상태:', window.storageManager?.checkStorageSpace());