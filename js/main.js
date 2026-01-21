// 네온 브레이커 메인 진입점
// DOM이 로드된 후 초기화 실행
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 네온 브레이커 시작 중...');
  
  try {
    // 초기화 순서
    await initializeStorage();
    await initializeInput();
    await initializeUI();
    await initializeGame();
    
    // PWA 설치 체크
    initializePWA();
    
    console.log('✅ 게임 초기화 완료');
    
  } catch (error) {
    console.error('❌ 게임 초기화 실패:', error);
    showError('게임 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
  }
});

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

// UI 초기화
async function initializeUI() {
  console.log('🎨 UI 초기화 중...');
  
  // 기본 UI 요소 바인딩
  bindUIElements();
  
  // 이벤트 리스너 설정
  setupUIEventListeners();
  
  // 초기 UI 상태 업데이트
  updateUI();
  
  console.log('✅ UI 초기화 완료');
}

// 게임 초기화
async function initializeGame() {
  console.log('🚀 게임 엔진 초기화 중...');
  
  // 상태 변수들
  window.state = 'menu'; // menu, playing, paused, gameover, stageclear, roundclear
  
  // 캔버스 설정
  setupCanvas();
  
  // 게임 오브젝트들
  initializeGameObjects();
  
  // 게임 루프 시작
  if (window.requestAnimationFrame) {
    window.gameLoop = gameLoop;
    window.requestAnimationFrame(gameLoop);
  }
  
  console.log('✅ 게임 엔진 초기화 완료');
}

// PWA 초기화
function initializePWA() {
  console.log('📱 PWA 초기화 중...');
  
  // 서비스 워커 등록
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ 서비스 워커 등록 성공:', registration);
      })
      .catch(error => {
        console.log('❌ 서비스 워커 등록 실패:', error);
      });
  }
  
  // 설치 프롬프트 (별도 파일 필요)
  // 여기서는 기본 구현만
  
  console.log('✅ PWA 초기화 완료');
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
  
  // 왼쪽 버튼
  if (buttons.left) {
    buttons.left.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.inputHandler.keys['ArrowLeft'] = true;
    });
    
    buttons.left.addEventListener('touchend', (e) => {
      e.preventDefault();
      window.inputHandler.keys['ArrowLeft'] = false;
    });
    
    buttons.left.addEventListener('mousedown', () => {
      window.inputHandler.keys['ArrowLeft'] = true;
    });
    
    buttons.left.addEventListener('mouseup', () => {
      window.inputHandler.keys['ArrowLeft'] = false;
    });
  }
  
  // 오른쪽 버튼
  if (buttons.right) {
    buttons.right.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.inputHandler.keys['ArrowRight'] = true;
    });
    
    buttons.right.addEventListener('touchend', (e) => {
      e.preventDefault();
      window.inputHandler.keys['ArrowRight'] = false;
    });
    
    buttons.right.addEventListener('mousedown', () => {
      window.inputHandler.keys['ArrowRight'] = true;
    });
    
    buttons.right.addEventListener('mouseup', () => {
      window.inputHandler.keys['ArrowRight'] = false;
    });
  }
  
  // 발사 버튼
  if (buttons.fire) {
    buttons.fire.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.inputHandler.keys[' '] = true;
    });
    
    buttons.fire.addEventListener('touchend', (e) => {
      e.preventDefault();
      window.inputHandler.keys[' '] = false;
    });
    
    buttons.fire.addEventListener('mousedown', () => {
      window.inputHandler.keys[' '] = true;
    });
    
    buttons.fire.addEventListener('mouseup', () => {
      window.inputHandler.keys[' '] = false;
    });
  }
}

// 캔버스 설정
function setupCanvas() {
  if (!window.elements.gameCanvas) return;
  
  const canvas = window.elements.gameCanvas;
  const ctx = canvas.getContext('2d');
  
  // 캔버스 크기 설정
  function resizeCanvas() {
    const container = window.elements.gameArea;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // 전역으로 캔버스 설정
  window.canvas = canvas;
  window.ctx = ctx;
}

// 게임 오브젝트 초기화
function initializeGameObjects() {
  // 여기서는 기본 구조만 설정
  // 실제 게임 로직은 기존 코드 사용
  
  window.gameObjects = {
    paddle: null,
    balls: [],
    bricks: [],
    bullets: [],
    items: [],
    particles: [],
    effects: []
  };
}

// 키보드 입력 처리
function handleKeyDown(e) {
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (window.state === 'playing') {
      togglePause();
    }
  }
  
  // 스킬 키
  if (window.state === 'playing') {
    if (e.key === '1') useSkill(1);
    if (e.key === '2') useSkill(2);
    if (e.key === '3') useSkill(3);
  }
}

function handleKeyUp(e) {
  // 키 업 처리
}

// UI 업데이트
function updateUI() {
  if (!window.elements) return;
  
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
}

// 화면 전환
function showScreen(screenId) {
  // 모든 화면 숨기기
  const screens = ['startScreen', 'gameOverScreen', 'stageClearScreen', 'roundClearScreen', 'shopScreen', 'pauseScreen'];
  screens.forEach(id => {
    if (window.elements[id]) {
      window.elements[id].classList.add('hidden');
    }
  });
  
  // 특정 화면 보이기
  if (window.elements[screenId]) {
    window.elements[screenId].classList.remove('hidden');
  }
}

// 기본 게임 함수들 (기존 코드와 호환)
function startGame() {
  showScreen(null); // 모든 화면 숨기기
  window.state = 'playing';
  // 기존 게임 시작 로직 호출
}

function togglePause() {
  if (window.state === 'playing') {
    window.state = 'paused';
    showScreen('pauseScreen');
  } else if (window.state === 'paused') {
    window.state = 'playing';
    showScreen(null);
  }
}

function useSkill(skillNumber) {
  // 기존 스킬 사용 로직
  console.log(`스킬 ${skillNumber} 사용`);
}

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

// 기본 게임 루프 (기존 코드 사용)
function gameLoop() {
  // 여기서는 기본 구조만
  // 실제 게임 로직은 기존 코드 그대로 사용
  
  if (window.state === 'playing') {
    // 기존 게임 업데이트/렌더링 호출
    // update()와 render() 함수는 기존 코드에서 정의
  }
  
  window.requestAnimationFrame(gameLoop);
}

// 데이터 변경 리스너 설정
function setupDataListeners() {
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
}

// 초기화 완료 후 리스너 설정
setTimeout(() => {
  setupDataListeners();
}, 100);

// 전역 함수 (기존 코드와 호환)
window.showScreen = showScreen;
window.showToast = showToast;
window.hideAll = () => showScreen(null);

// 디버깅 정보
console.log('🎮 네온 브레이커 초기화 시스템 로드됨');
console.log('📊 스토리지 상태:', window.storageManager.checkStorageSpace());