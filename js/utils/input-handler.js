// 네온 브레이커 입력 처리기
class InputHandler {
  constructor() {
    this.keys = {};
    this.touches = {};
    this.mouse = { x: 0, y: 0, pressed: false };
    this.gestures = {
      swipe: null,
      tap: false
    };
    
    this.callbacks = {
      keydown: [],
      keyup: [],
      touchstart: [],
      touchmove: [],
      touchend: [],
      mousedown: [],
      mousemove: [],
      mouseup: []
    };
    
    this.isMobile = Utils.isMobile();
    this.init();
  }

  // 초기화
  init() {
    this.setupKeyboardEvents();
    this.setupTouchEvents();
    this.setupMouseEvents();
    this.setupGestureEvents();
  }

  // 키보드 이벤트 설정
  setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.emit('keydown', e);
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.emit('keyup', e);
    });
  }

  // 터치 이벤트 설정
  setupTouchEvents() {
    document.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTouchStart(e);
      this.emit('touchstart', e);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleTouchMove(e);
      this.emit('touchmove', e);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleTouchEnd(e);
      this.emit('touchend', e);
    }, { passive: false });

    document.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.handleTouchEnd(e);
    }, { passive: false });
  }

  // 마우스 이벤트 설정
  setupMouseEvents() {
    document.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
      this.emit('mousedown', e);
    });

    document.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
      this.emit('mousemove', e);
    });

    document.addEventListener('mouseup', (e) => {
      this.handleMouseUp(e);
      this.emit('mouseup', e);
    });

    // 마우스 나갔을 때 처리
    document.addEventListener('mouseleave', (e) => {
      this.mouse.pressed = false;
      this.emit('mouseup', e);
    });
  }

  // 제스처 이벤트 설정
  setupGestureEvents() {
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.on('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartTime = Date.now();
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      this.gestures.tap = true;
    });

    this.on('touchend', (e) => {
      const touchEndTime = Date.now();
      const touch = e.changedTouches[0];
      
      // 탭 감지
      const touchDuration = touchEndTime - touchStartTime;
      const touchDistance = Utils.distance(
        touchStartX, touchStartY,
        touch.clientX, touch.clientY
      );
      
      if (touchDuration < 200 && touchDistance < 10) {
        this.gestures.tap = true;
        this.gestures.swipe = null;
      }
      
      // 스와이프 감지
      if (touchDuration < 500 && touchDistance > 50) {
        const angle = Utils.angle(touchStartX, touchStartY, touch.clientX, touch.clientY);
        const swipeAngle = (angle * 180 / Math.PI + 360) % 360;
        
        if (swipeAngle >= 315 || swipeAngle < 45) {
          this.gestures.swipe = 'right';
        } else if (swipeAngle >= 45 && swipeAngle < 135) {
          this.gestures.swipe = 'down';
        } else if (swipeAngle >= 135 && swipeAngle < 225) {
          this.gestures.swipe = 'left';
        } else {
          this.gestures.swipe = 'up';
        }
        
        this.gestures.tap = false;
      }
    });
  }

  // 터치 시작 처리
  handleTouchStart(e) {
    Array.from(e.touches).forEach(touch => {
      this.touches[touch.identifier] = {
        x: touch.clientX,
        y: touch.clientY,
        startTime: Date.now()
      };
    });
  }

  // 터치 이동 처리
  handleTouchMove(e) {
    Array.from(e.touches).forEach(touch => {
      if (this.touches[touch.identifier]) {
        this.touches[touch.identifier].x = touch.clientX;
        this.touches[touch.identifier].y = touch.clientY;
      }
    });
  }

  // 터치 종료 처리
  handleTouchEnd(e) {
    Array.from(e.changedTouches).forEach(touch => {
      delete this.touches[touch.identifier];
    });
  }

  // 마우스 다운 처리
  handleMouseDown(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.pressed = true;
  }

  // 마우스 이동 처리
  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  // 마우스 업 처리
  handleMouseUp(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.pressed = false;
  }

  // 상태 체크 메서드
  isKeyDown(key) {
    return this.keys[key] || false;
  }

  isAnyKeyDown() {
    return Object.values(this.keys).some(pressed => pressed);
  }

  isTouchActive() {
    return Object.keys(this.touches).length > 0;
  }

  isMousePressed() {
    return this.mouse.pressed;
  }

  getTouchPosition(id = 0) {
    const touch = this.touches[id];
    return touch ? { x: touch.x, y: touch.y } : null;
  }

  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  getRelativePosition(element) {
    if (this.isTouchActive()) {
      const touch = this.getTouchPosition();
      if (!touch) return null;
      
      const rect = element.getBoundingClientRect();
      return {
        x: touch.x - rect.left,
        y: touch.y - rect.top
      };
    } else if (this.isMousePressed()) {
      const rect = element.getBoundingClientRect();
      return {
        x: this.mouse.x - rect.left,
        y: this.mouse.y - rect.top
      };
    }
    return null;
  }

  // 제스처 상태
  didTap() {
    const tap = this.gestures.tap;
    this.gestures.tap = false;
    return tap;
  }

  getSwipe() {
    const swipe = this.gestures.swipe;
    this.gestures.swipe = null;
    return swipe;
  }

  // 방향 체크 (게임용)
  isLeftPressed() {
    return this.isKeyDown('ArrowLeft') || 
           this.isKeyDown('a') || 
           this.isKeyDown('A') ||
           this.getSwipe() === 'left';
  }

  isRightPressed() {
    return this.isKeyDown('ArrowRight') || 
           this.isKeyDown('d') || 
           this.isKeyDown('D') ||
           this.getSwipe() === 'right';
  }

  isUpPressed() {
    return this.isKeyDown('ArrowUp') || 
           this.isKeyDown('w') || 
           this.isKeyDown('W') ||
           this.getSwipe() === 'up';
  }

  isDownPressed() {
    return this.isKeyDown('ArrowDown') || 
           this.isKeyDown('s') || 
           this.isKeyDown('S') ||
           this.getSwipe() === 'down';
  }

  isFirePressed() {
    return this.isKeyDown(' ') || 
           this.isKeyDown('z') || 
           this.isKeyDown('Z') ||
           this.didTap();
  }

  isPausePressed() {
    return this.isKeyDown('Escape') || 
           this.isKeyDown('p') || 
           this.isKeyDown('P');
  }

  // 스킬 키 체크
  isSkill1Pressed() {
    return this.isKeyDown('1');
  }

  isSkill2Pressed() {
    return this.isKeyDown('2');
  }

  isSkill3Pressed() {
    return this.isKeyDown('3');
  }

  // 이벤트 리스너
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 리스너 실행 실패 (${event}):`, error);
        }
      });
    }
  }

  // 입력 상태 초기화
  reset() {
    this.keys = {};
    this.touches = {};
    this.mouse = { x: 0, y: 0, pressed: false };
    this.gestures = { swipe: null, tap: false };
  }

  // 일시정지/재개
  pause() {
    // 입력 처리 일시 정지
    this.paused = true;
  }

  resume() {
    // 입력 처리 재개
    this.paused = false;
    this.reset();
  }

  // 디버깅 정보
  debug() {
    console.group('InputHandler Debug Info');
    console.log('Keys:', this.keys);
    console.log('Touches:', this.touches);
    console.log('Mouse:', this.mouse);
    console.log('Gestures:', this.gestures);
    console.log('Is Mobile:', this.isMobile);
    console.groupEnd();
  }

  // 소멸자
  destroy() {
    // 이벤트 리스너 정리
    this.callbacks = {
      keydown: [],
      keyup: [],
      touchstart: [],
      touchmove: [],
      touchend: [],
      mousedown: [],
      mousemove: [],
      mouseup: []
    };
    
    this.reset();
  }
}

// 전역 인스턴스 생성
window.inputHandler = new InputHandler();