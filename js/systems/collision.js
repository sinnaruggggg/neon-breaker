// 충돌 감지 시스템
class CollisionSystem {
  constructor() {
    this.collisionPairs = [];
    this.collisionHandlers = new Map();
    this.spatialHash = new SpatialHash(100); // 공간 해시
    this.enabled = true;
  }

  // 충돌 핸들러 등록
  addCollisionHandler(type1, type2, handler) {
    const key = `${type1}-${type2}`;
    this.collisionHandlers.set(key, handler);
    
    // 양방향 등록
    const reverseKey = `${type2}-${type1}`;
    this.collisionHandlers.set(reverseKey, handler);
  }

  // 충돌 체크
  checkCollisions(entities) {
    if (!this.enabled) return [];

    // 공간 해시 업데이트
    this.spatialHash.update(entities);
    
    // 충돌 쌍 초기화
    this.collisionPairs = [];
    
    const entityArray = Array.from(entities.values());
    
    // 넓은 범위 충돌 체크
    for (let i = 0; i < entityArray.length; i++) {
      const entity1 = entityArray[i];
      
      if (!entity1.active || entity1.destroyed) continue;
      
      // 공간 해시로 근접 엔티티 가져오기
      const nearbyEntities = this.spatialHash.getNearby(entity1);
      
      for (const entity2 of nearbyEntities) {
        if (entity1 === entity2) continue;
        if (!entity2.active || entity2.destroyed) continue;
        
        // 이미 체크된 쌍인지 확인
        if (this.alreadyChecked(entity1, entity2)) continue;
        
        // 충돌 체크
        const collision = this.checkEntityCollision(entity1, entity2);
        if (collision) {
          this.collisionPairs.push(collision);
          this.markAsChecked(entity1, entity2);
          
          // 충돌 핸들러 호출
          this.handleCollision(collision);
        }
      }
    }
    
    return this.collisionPairs;
  }

  // 엔티티 충돌 체크
  checkEntityCollision(entity1, entity2) {
    const type1 = entity1.type;
    const type2 = entity2.type;
    
    // 타입별 충돌 체크
    switch (type1) {
      case 'ball':
        if (type2 === 'paddle') {
          return this.checkBallPaddleCollision(entity1, entity2);
        } else if (type2 === 'brick') {
          return this.checkBallBrickCollision(entity1, entity2);
        } else if (type2 === 'wall') {
          return this.checkBallWallCollision(entity1, entity2);
        }
        break;
        
      case 'bullet':
        if (type2 === 'brick') {
          return this.checkBulletBrickCollision(entity1, entity2);
        }
        break;
        
      case 'item':
        if (type2 === 'paddle') {
          return this.checkItemPaddleCollision(entity1, entity2);
        }
        break;
    }
    
    // 일반 AABB 충돌
    if (entity1.getBounds && entity2.getBounds) {
      const bounds1 = entity1.getBounds();
      const bounds2 = entity2.getBounds();
      
      if (this.aabbCollision(bounds1, bounds2)) {
        return {
          entity1,
          entity2,
          type: 'aabb',
          penetration: this.calculatePenetration(bounds1, bounds2)
        };
      }
    }
    
    return null;
  }

  // 공-패들 충돌
  checkBallPaddleCollision(ball, paddle) {
    const bounds = paddle.getBounds();
    const ballCenter = ball.getBounds().centerY;
    
    // 패들 위에서 충돌했는지 확인
    if (ball.y + ball.radius >= bounds.top && 
        ball.y - ball.radius <= bounds.top + paddle.height &&
        ball.x >= bounds.left && 
        ball.x <= bounds.right) {
      
      // 반사 각도 계산
      const relativeX = (ball.x - bounds.centerX) / (paddle.width / 2);
      const maxAngle = Math.PI / 3; // 60도
      const angle = relativeX * maxAngle;
      
      return {
        entity1: ball,
        entity2: paddle,
        type: 'ball-paddle',
        angle: angle,
        hitPoint: {
          x: ball.x,
          y: bounds.top
        }
      };
    }
    
    return null;
  }

  // 공-블록 충돌
  checkBallBrickCollision(ball, brick) {
    const ballBounds = ball.getBounds();
    const brickBounds = brick.getBounds();
    
    // 원-사각형 충돌
    const collision = this.circleRectCollision(ballBounds, brickBounds);
    
    if (collision.collides) {
      // 충돌 방향 결정
      const ballCenter = ballBounds.centerX;
      const brickCenter = brickBounds.centerX;
      
      const dx = ballCenter.x - brickCenter.x;
      const dy = ballCenter.y - brickCenter.y;
      
      let side = 'unknown';
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      
      if (absX > absY) {
        side = dx > 0 ? 'right' : 'left';
      } else {
        side = dy > 0 ? 'bottom' : 'top';
      }
      
      return {
        entity1: ball,
        entity2: brick,
        type: 'ball-brick',
        side: side,
        penetration: collision.distance
      };
    }
    
    return null;
  }

  // 공-벽 충돌
  checkBallWallCollision(ball, wall) {
    const ballBounds = ball.getBounds();
    const canvas = wall.canvas || { width: 800, height: 600 };
    
    let side = null;
    
    // 왼쪽 벽
    if (ballBounds.left <= 0) {
      side = 'left';
    }
    // 오른쪽 벽
    else if (ballBounds.right >= canvas.width) {
      side = 'right';
    }
    // 위쪽 벽
    else if (ballBounds.top <= 0) {
      side = 'top';
    }
    
    if (side) {
      return {
        entity1: ball,
        entity2: wall,
        type: 'ball-wall',
        side: side
      };
    }
    
    return null;
  }

  // 총알-블록 충돌
  checkBulletBrickCollision(bullet, brick) {
    const bulletBounds = bullet.getBounds();
    const brickBounds = brick.getBounds();
    
    if (this.aabbCollision(bulletBounds, brickBounds)) {
      return {
        entity1: bullet,
        entity2: brick,
        type: 'bullet-brick'
      };
    }
    
    return null;
  }

  // 아이템-패들 충돌
  checkItemPaddleCollision(item, paddle) {
    const itemBounds = item.getBounds();
    const paddleBounds = paddle.getBounds();
    
    // 약간 더 큰 히트박스 (수집 용이)
    const expandedItemBounds = {
      left: itemBounds.left - 10,
      top: itemBounds.top - 10,
      right: itemBounds.right + 10,
      bottom: itemBounds.bottom + 10
    };
    
    if (this.aabbCollision(expandedItemBounds, paddleBounds)) {
      return {
        entity1: item,
        entity2: paddle,
        type: 'item-paddle'
      };
    }
    
    return null;
  }

  // AABB 충돌 체크
  aabbCollision(bounds1, bounds2) {
    return !(bounds1.right < bounds2.left || 
             bounds1.left > bounds2.right || 
             bounds1.bottom < bounds2.top || 
             bounds1.top > bounds2.bottom);
  }

  // 원-사각형 충돌
  circleRectCollision(circleBounds, rectBounds) {
    const circleCenterX = circleBounds.centerX;
    const circleCenterY = circleBounds.centerY;
    
    // 가장 가까운 점 찾기
    const closestX = Utils.clamp(circleCenterX, rectBounds.left, rectBounds.right);
    const closestY = Utils.clamp(circleCenterY, rectBounds.top, rectBounds.bottom);
    
    // 거리 계산
    const distance = Utils.distance(circleCenterX, circleCenterY, closestX, closestY);
    
    return {
      collides: distance < circleBounds.centerX - circleBounds.left, // radius
      closestPoint: { x: closestX, y: closestY },
      distance: distance
    };
  }

  // 침투 깊이 계산
  calculatePenetration(bounds1, bounds2) {
    const overlapX = Math.min(bounds1.right - bounds2.left, bounds2.right - bounds1.left);
    const overlapY = Math.min(bounds1.bottom - bounds2.top, bounds2.bottom - bounds1.top);
    
    return {
      x: overlapX > 0 ? overlapX : 0,
      y: overlapY > 0 ? overlapY : 0,
      magnitude: Math.sqrt(overlapX * overlapX + overlapY * overlapY)
    };
  }

  // 체크 완료 표시
  markAsChecked(entity1, entity2) {
    const id1 = entity1.id || Math.random();
    const id2 = entity2.id || Math.random();
    
    if (!this.checkedPairs) {
      this.checkedPairs = new Set();
    }
    
    this.checkedPairs.add(`${id1}-${id2}`);
    this.checkedPairs.add(`${id2}-${id1}`);
  }

  // 이미 체크되었는지 확인
  alreadyChecked(entity1, entity2) {
    if (!this.checkedPairs) return false;
    
    const id1 = entity1.id || Math.random();
    const id2 = entity2.id || Math.random();
    
    return this.checkedPairs.has(`${id1}-${id2}`) || 
           this.checkedPairs.has(`${id2}-${id1}`);
  }

  // 충돌 처리
  handleCollision(collision) {
    const key = `${collision.entity1.type}-${collision.entity2.type}`;
    const handler = this.collisionHandlers.get(key);
    
    if (handler) {
      try {
        handler(collision);
      } catch (error) {
        console.error(`충돌 핸들러 오류 (${key}):`, error);
      }
    }
  }

  // 활성화/비활성화
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // 리셋
  reset() {
    this.collisionPairs = [];
    this.checkedPairs = null;
    this.spatialHash.reset();
  }

  // 디버그 정보
  debug() {
    console.group('CollisionSystem Debug');
    console.log('Enabled:', this.enabled);
    console.log('Collision Pairs:', this.collisionPairs.length);
    console.log('Handlers:', this.collisionHandlers.size);
    this.spatialHash.debug();
    console.groupEnd();
  }
}

// 공간 해시 클래스 (성능 최적화)
class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.entities = new Set();
  }

  // 업데이트
  update(entities) {
    this.cells.clear();
    this.entities.clear();
    
    entities.forEach(entity => {
      if (!entity.active || entity.destroyed) return;
      
      this.entities.add(entity);
      
      const bounds = entity.getBounds();
      const startX = Math.floor(bounds.left / this.cellSize);
      const endX = Math.floor(bounds.right / this.cellSize);
      const startY = Math.floor(bounds.top / this.cellSize);
      const endY = Math.floor(bounds.bottom / this.cellSize);
      
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const key = `${x},${y}`;
          if (!this.cells.has(key)) {
            this.cells.set(key, new Set());
          }
          this.cells.get(key).add(entity);
        }
      }
    });
  }

  // 근접 엔티티 가져오기
  getNearby(entity) {
    const nearby = new Set();
    const bounds = entity.getBounds();
    
    const startX = Math.floor(bounds.left / this.cellSize);
    const endX = Math.floor(bounds.right / this.cellSize);
    const startY = Math.floor(bounds.top / this.cellSize);
    const endY = Math.floor(bounds.bottom / this.cellSize);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        const cellEntities = this.cells.get(key);
        if (cellEntities) {
          cellEntities.forEach(e => {
            if (e !== entity) {
              nearby.add(e);
            }
          });
        }
      }
    }
    
    return Array.from(nearby);
  }

  // 리셋
  reset() {
    this.cells.clear();
    this.entities.clear();
  }

  // 디버그
  debug() {
    console.log('SpatialHash Cells:', this.cells.size);
    console.log('SpatialHash Entities:', this.entities.size);
  }
}

// 전역으로 내보내기
window.CollisionSystem = CollisionSystem;
window.SpatialHash = SpatialHash;