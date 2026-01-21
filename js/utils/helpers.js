// 네온 브레이커 유틸리티 함수들
class Utils {
  // 수학 유틸리티
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  static lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  static distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  static angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  static randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  static randomInt(min, max) {
    return Math.floor(this.randomRange(min, max + 1));
  }

  // 색상 유틸리티
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  static rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  static darkenColor(color, amount) {
    if (color.indexOf('hsl') === 0) return color;
    
    const rgb = this.hexToRgb(color) || { r: 255, g: 255, b: 255 };
    rgb.r = Math.max(0, rgb.r - amount);
    rgb.g = Math.max(0, rgb.g - amount);
    rgb.b = Math.max(0, rgb.b - amount);
    
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  static rgba(color, alpha) {
    if (color.indexOf('hsl') === 0) {
      return color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
    }
    
    if (color.indexOf('rgb') === 0) {
      return color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    }
    
    const rgb = this.hexToRgb(color) || { r: 255, g: 255, b: 255 };
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  // 배열 유틸리티
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static remove(array, item) {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
      return true;
    }
    return false;
  }

  static last(array) {
    return array[array.length - 1];
  }

  // 시간 유틸리티
  static formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  }

  static formatNumber(num) {
    return num.toLocaleString();
  }

  // 디바운스
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 스로틀
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // DOM 유틸리티
  static createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }

  static addClass(element, className) {
    element.classList.add(className);
  }

  static removeClass(element, className) {
    element.classList.remove(className);
  }

  static toggleClass(element, className) {
    element.classList.toggle(className);
  }

  static hasClass(element, className) {
    return element.classList.contains(className);
  }

  // 터치/마우스 이벤트 유틸리티
  static getEventPosition(event) {
    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
    return {
      x: event.clientX,
      y: event.clientY
    };
  }

  // 게임 관련 유틸리티
  static roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  // 애니메이션 유틸리티
  static animate(duration, callback, easing = 'linear') {
    const startTime = performance.now();
    
    const animateFrame = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      let easedProgress;
      switch (easing) {
        case 'easeInOut':
          easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          break;
        case 'easeOut':
          easedProgress = 1 - Math.pow(1 - progress, 2);
          break;
        case 'easeIn':
          easedProgress = progress * progress;
          break;
        default:
          easedProgress = progress;
      }
      
      callback(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      }
    };
    
    requestAnimationFrame(animateFrame);
  }

  // 사운드 유틸리티 (향후 확장용)
  static playSound(frequency, duration = 100) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('사운드 재생 실패:', error);
    }
  }

  // 진동 유틸리티
  static vibrate(pattern = [100]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // 디바이스 감지
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isTablet() {
    return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768;
  }

  static isDesktop() {
    return !this.isMobile() && !this.isTablet();
  }

  // 로컬스토리지 유틸리티
  static isLocalStorageAvailable() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // URL 파라미터 유틸리티
  static getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // 복사 유틸리티
  static copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // 폴백
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      return new Promise((resolve, reject) => {
        try {
          document.execCommand('copy');
          resolve();
        } catch (err) {
          reject(err);
        }
        document.body.removeChild(textArea);
      });
    }
  }

  // 성능 측정 유틸리티
  static measureTime(fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    return {
      result,
      time: end - start
    };
  }

  // 메모리 사용량 확인
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }

  // 콘솔 스타일링
  static logStyled(message, style = 'color: #00f0ff; font-weight: bold;') {
    console.log('%c' + message, style);
  }
}

// 전역으로 내보내기
window.Utils = Utils;