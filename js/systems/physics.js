// 물리 시스템
class PhysicsSystem {
  constructor() {
    this.gravity = 0; // 브레이커는 중력 없음
    this.friction = 0.98; // 공기 저항
    this.restitution = 1.0; // 반사 계수
    this.maxVelocity = 20; // 최대 속도
    this.objects = new Set();
  }

  // 객체 추가
  addObject(object) {
    this.objects.add(object);
  }

  // 객체 제거
  removeObject(object) {
    this.objects.delete(object);
  }

  // 객체 수
  getObjectCount() {
    return this.objects.size;
  }

  // 업데이트
  update(deltaTime, engine) {
    const fixedDelta = Math.min(deltaTime, 1/60); // 최대 60프레임 고정
    
    this.objects.forEach(object => {
      if (object.active && !object.destroyed) {
        this.updateObject(object, fixedDelta, engine);
      }
    });
    
    // 파괴된 객체 정리
    this.cleanupDestroyedObjects();
  }

  // 객체별 업데이트
  updateObject(object, deltaTime, engine) {
    if (!object.velocity) return;

    // 속도 적용
    object.x += object.velocity.x * deltaTime * 60;
    object.y += object.velocity.y * deltaTime * 60;
    
    // 마찰력 적용
    if (object.applyFriction) {
      object.velocity.x *= this.friction;
      object.velocity.y *= this.friction;
    }
    
    // 최대 속도 제한
    if (object.applyMaxVelocity) {
      const speed = Math.sqrt(object.velocity.x ** 2 + object.velocity.y ** 2);
      if (speed > this.maxVelocity) {
        const scale = this.maxVelocity / speed;
        object.velocity.x *= scale;
        object.velocity.y *= scale;
      }
    }
    
    // 중력 적용
    if (object.applyGravity) {
      object.velocity.y += this.gravity * deltaTime * 60;
    }
    
    // 캔버스 경계 처리
    if (object.constrainToCanvas) {
      this.constrainToCanvas(object, engine.canvas);
    }
  }

  // 캔버스 경계 제한
  constrainToCanvas(object, canvas) {
    if (!object.getBounds) return;
    
    const bounds = object.getBounds();
    
    // 좌우 경계
    if (bounds.left < 0) {
      object.x = -object.x + object.width / 2;
      if (object.velocity) {
        object.velocity.x = Math.abs(object.velocity.x) * this.restitution;
      }
    } else if (bounds.right > canvas.width) {
      object.x = canvas.width - object.width / 2;
      if (object.velocity) {
        object.velocity.x = -Math.abs(object.velocity.x) * this.restitution;
      }
    }
    
    // 상하 경계
    if (bounds.top < 0) {
      object.y = -object.y + object.height / 2;
      if (object.velocity) {
        object.velocity.y = Math.abs(object.velocity.y) * this.restitution;
      }
    } else if (bounds.bottom > canvas.height) {
      object.y = canvas.height - object.height / 2;
      if (object.velocity) {
        object.velocity.y = -Math.abs(object.velocity.y) * this.restitution;
      }
    }
  }

  // 속도 계산
  calculateVelocity(object) {
    if (!object.velocity) {
      object.velocity = { x: 0, y: 0 };
    }
    
    return {
      x: object.velocity.x || 0,
      y: object.velocity.y || 0,
      magnitude: Math.sqrt((object.velocity.x || 0) ** 2 + (object.velocity.y || 0) ** 2)
    };
  }

  // 운동량 계산
  calculateMomentum(object1, object2) {
    const v1 = this.calculateVelocity(object1);
    const v2 = this.calculateVelocity(object2);
    
    const m1 = object1.mass || 1;
    const m2 = object2.mass || 1;
    
    return {
      total: {
        x: v1.x * m1 + v2.x * m2,
        y: v1.y * m1 + v2.y * m2,
        magnitude: Math.sqrt((v1.x * m1 + v2.x * m2) ** 2 + (v1.y * m1 + v2.y * m2) ** 2)
      },
      object1: {
        x: v1.x * m1,
        y: v1.y * m1
      },
      object2: {
        x: v2.x * m2,
        y: v2.y * m2
      }
    };
  }

  // 탄성 충돌 계산
  calculateElasticCollision(object1, object2) {
    const v1 = this.calculateVelocity(object1);
    const v2 = this.calculateVelocity(object2);
    const m1 = object1.mass || 1;
    const m2 = object2.mass || 1;
    
    // 충돌 각도 계산
    const dx = object2.x - object1.x;
    const dy = object2.y - object1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / distance;
    const ny = dy / distance;
    
    // 속도를 충돌 방향으로 투영
    const v1n = v1.x * nx + v1.y * ny;
    const v2n = v2.x * nx + v2.y * ny;
    
    // 탄성 충돌 후 속도 계산
    const v1n_new = ((m1 - m2) * v1n + 2 * m2 * v2n) / (m1 + m2);
    const v2n_new = ((m2 - m1) * v2n + 2 * m1 * v1n) / (m1 + m2);
    
    // 새 속도 계산
    const dv1x = v1n_new * nx - v1n * nx;
    const dv1y = v1n_new * ny - v1n * ny;
    const dv2x = v2n_new * nx - v2n * nx;
    const dv2y = v2n_new * ny - v2n * ny;
    
    return {
      object1: {
        vx: v1.x + dv1x * this.restitution,
        vy: v1.y + dv1y * this.restitution
      },
      object2: {
        vx: v2.x + dv2x * this.restitution,
        vy: v2.y + dv2y * this.restitution
      }
    };
  }

  // 원과 사각형 충돌
  circleRectCollision(circle, rect) {
    const bounds = rect.getBounds();
    
    // 가장 가까운 점 찾기
    const closestX = Utils.clamp(circle.x, bounds.left, bounds.right);
    const closestY = Utils.clamp(circle.y, bounds.top, bounds.bottom);
    
    // 거리 계산
    const distance = Utils.distance(circle.x, circle.y, closestX, closestY);
    
    return {
      collides: distance < circle.radius,
      closestPoint: { x: closestX, y: closestY },
      distance: distance,
      normal: {
        x: (circle.x - closestX) / distance,
        y: (circle.y - closestY) / distance
      }
    };
  }

  // 사각형과 사각형 충돌
  rectRectCollision(rect1, rect2) {
    const bounds1 = rect1.getBounds();
    const bounds2 = rect2.getBounds();
    
    return {
      collides: !(bounds1.right < bounds2.left || 
                   bounds1.left > bounds2.right || 
                   bounds1.bottom < bounds2.top || 
                   bounds1.top > bounds2.bottom),
      overlap: {
        x: Math.max(bounds1.left, bounds2.left),
        y: Math.max(bounds1.top, bounds2.top),
        width: Math.min(bounds1.right, bounds2.right) - Math.max(bounds1.left, bounds2.left),
        height: Math.min(bounds1.bottom, bounds2.bottom) - Math.max(bounds1.top, bounds2.top)
      }
    };
  }

  // 선분과 원 충돌
  lineCircleCollision(x1, y1, x2, y2, circleX, circleY, circleRadius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - circleX;
    const fy = y1 - circleY;
    
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - circleRadius * circleRadius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return null; // 충돌 없음
    }
    
    discriminant = Math.sqrt(discriminant);
    
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    
    const points = [];
    
    if (t1 >= 0 && t1 <= 1) {
      points.push({
        x: x1 + t1 * dx,
        y: y1 + t1 * dy,
        t: t1
      });
    }
    
    if (t2 >= 0 && t2 <= 1) {
      points.push({
        x: x1 + t2 * dx,
        y: y1 + t2 * dy,
        t: t2
      });
    }
    
    return points.length > 0 ? points : null;
  }

  // 파괴된 객체 정리
  cleanupDestroyedObjects() {
    const toRemove = [];
    
    this.objects.forEach(object => {
      if (object.destroyed) {
        toRemove.push(object);
      }
    });
    
    toRemove.forEach(object => {
      this.removeObject(object);
    });
  }

  // 리셋
  reset() {
    this.objects.clear();
  }

  // 디버그 정보
  debug() {
    console.group('PhysicsSystem Debug');
    console.log('Objects:', this.objects.size);
    console.log('Gravity:', this.gravity);
    console.log('Friction:', this.friction);
    console.log('Restitution:', this.restitution);
    console.groupEnd();
  }
}

// 전역으로 내보내기
window.PhysicsSystem = PhysicsSystem;