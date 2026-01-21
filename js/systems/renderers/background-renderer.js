// 배경 렌더러
class BackgroundRenderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.backgroundColor = '#08080f';
    this.gridColor = 'rgba(0, 240, 255, 0.03)';
    this.stars = [];
    this.initStars();
  }

  // 별 초기화
  initStars() {
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random()
      });
    }
  }

  // 렌더링
  render(entities, engine) {
    // 배경 그라데이션
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#08080f');
    gradient.addColorStop(0.5, '#0e0e1a');
    gradient.addColorStop(1, '#08080f');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 그리드 렌더링
    this.renderGrid();
    
    // 별 렌더링
    if (engine.optimizeLevel === 'quality') {
      this.renderStars();
    }
  }

  // 그리드 렌더링
  renderGrid() {
    if (engine.optimizeLevel !== 'minimal') return;
    
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

  // 별 렌더링
  renderStars() {
    this.stars.forEach(star => {
      this.ctx.save();
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.8})`;
      this.ctx.beginPath();
      this.ctx.arc(
        star.x % this.canvas.width,
        star.y % this.canvas.height,
        star.size,
        0, Math.PI * 2
      );
      this.ctx.fill();
      
      // 반짖 효과
      if (star.brightness > 0.7) {
        this.ctx.shadowBlur = star.size * 2;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
          star.x % this.canvas.width,
          star.y % this.canvas.height,
          star.size * 1.5,
          0, Math.PI * 2
        );
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }
}

// 전역으로 내보내기
window.BackgroundRenderer = BackgroundRenderer;