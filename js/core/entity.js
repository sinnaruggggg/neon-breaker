// 게임 엔티티 기본 클래스
class Entity {
  constructor(x, y, width, height, type = 'entity') {
    this.id = null; // GameEngine에서 설정
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.destroyed = false;
    this.active = true;
    this.visible = true;
    
    // 컴포넌트 시스템
    this.components = new Map();
  }

  // 컴포넌트 추가
  addComponent(name, component) {
    this.components.set(name, component);
    return this;
  }

  // 컴포넌트 제거
  removeComponent(name) {
    const component = this.components.get(name);
    if (component && component.destroy) {
      component.destroy();
    }
    this.components.delete(name);
    return this;
  }

  // 컴포넌트 가져오기
  getComponent(name) {
    return this.components.get(name);
  }

  // 컴포넌트 확인
  hasComponent(name) {
    return this.components.has(name);
  }

  // 위치 설정
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  // 위치 이동
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    return this;
  }

  // 크기 설정
  setSize(width, height) {
    this.width = width;
    this.height = height;
    return this;
  }

  // 경계 체크
  getBounds() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2
    };
  }

  // 충돌 체크 (AABB)
  collidesWith(other) {
    const bounds1 = this.getBounds();
    const bounds2 = other.getBounds();
    
    return !(bounds1.right < bounds2.left || 
             bounds1.left > bounds2.right || 
             bounds1.bottom < bounds2.top || 
             bounds1.top > bounds2.bottom);
  }

  // 원형 충돌 체크
  collidesWithCircle(circleX, circleY, circleRadius) {
    const bounds = this.getBounds();
    
    // 가장 가까운 점 찾기
    const closestX = Utils.clamp(circleX, bounds.left, bounds.right);
    const closestY = Utils.clamp(circleY, bounds.top, bounds.bottom);
    
    // 거리 계산
    const distance = Utils.distance(circleX, circleY, closestX, closestY);
    
    return distance < circleRadius;
  }

  // 업데이트 (기본 구현)
  update(deltaTime, engine) {
    // 하위 클래스에서 오버라이드
  }

  // 렌더링 (기본 구현)
  render(ctx, engine) {
    // 하위 클래스에서 오버라이드
  }

  // 활성화/비활성화
  activate() {
    this.active = true;
    return this;
  }

  deactivate() {
    this.active = false;
    return this;
  }

  // 보이기/숨기기
  show() {
    this.visible = true;
    return this;
  }

  hide() {
    this.visible = false;
    return this;
  }

  // 파괴
  destroy() {
    this.destroyed = true;
    this.active = false;
    
    // 컴포넌트들 파괴
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    
    return this;
  }

  // 리셋
  reset() {
    this.destroyed = false;
    this.active = true;
    this.visible = true;
    return this;
  }

  // 클론
  clone() {
    const cloned = new Entity(this.x, this.y, this.width, this.height, this.type);
    
    // 컴포넌트들도 클론
    this.components.forEach((component, name) => {
      if (component.clone) {
        cloned.addComponent(name, component.clone());
      } else {
        cloned.addComponent(name, component);
      }
    });
    
    return cloned;
  }

  // 디버그 렌더링
  renderDebug(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    
    // 경계 상자
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const bounds = this.getBounds();
    ctx.strokeRect(bounds.left, bounds.top, this.width, this.height);
    
    // 중심점
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(bounds.centerX - 2, bounds.centerY - 2, 4, 4);
    
    // 정보 표시
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`${this.type} (${Math.round(this.x)}, ${Math.round(this.y)})`, this.x, this.y - 5);
    
    ctx.restore();
  }
}

// 전역으로 내보내기
window.Entity = Entity;