// 네온 브레이커 로컬 저장소 관리자
class StorageManager {
  constructor() {
    this.prefix = 'neon_breaker_';
    this.version = '2.0';
    this.listeners = new Map();
    this.migrationMap = new Map();
  }

  // 데이터 모델 정의
  get dataModel() {
    return {
      // 플레이어 데이터
      player: {
        coins: 0,
        currentRound: 1,
        currentStage: 1,
        characterStage: 0,
        maxLives: 4,
        totalScore: 0,
        highestRound: 1,
        totalPlaytime: 0
      },
      
      // 능력치
      abilities: {
        speedLevel: 0,
        fireRateLevel: 0,
        bulletCount: 1
      },
      
      // 소유 아이템
      ownedItems: {
        weapons: ['w_normal'],
        skills: [],
        items: [],
        balls: ['b_white']
      },
      
      // 장착 아이템
      equippedItems: {
        weapon: 'w_normal',
        ball: 'b_white'
      },
      
      // 버프/패시브
      buffs: {},
      passives: {},
      
      // 설정
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        autoFire: false,
        showTutorial: true
      },
      
      // 게임 설정 (기존 nb_stages, nb_prices 호환)
      gameConfig: {
        stages: {},
        prices: {}
      }
    };
  }

  // 초기화
  init() {
    this.migrateData();
    this.setupEventListeners();
  }

  // 데이터 저장
  save(category, data) {
    try {
      const key = this.prefix + category;
      const value = JSON.stringify(data);
      
      localStorage.setItem(key, value);
      this.emitChangeEvent(category, data);
      
      console.log(`데이터 저장됨: ${category}`, data);
      return true;
    } catch (error) {
      this.handleStorageError(error);
      return false;
    }
  }

  // 데이터 로드
  load(category) {
    try {
      const key = this.prefix + category;
      const data = localStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data);
      }
      
      // 기본값 반환
      return this.dataModel[category] || null;
    } catch (error) {
      console.error(`데이터 로드 실패: ${category}`, error);
      return this.dataModel[category] || null;
    }
  }

  // 데이터 삭제
  delete(category) {
    try {
      const key = this.prefix + category;
      localStorage.removeItem(key);
      this.emitChangeEvent(category, null);
      return true;
    } catch (error) {
      console.error(`데이터 삭제 실패: ${category}`, error);
      return false;
    }
  }

  // 모든 데이터 로드
  loadAll() {
    const allData = {};
    Object.keys(this.dataModel).forEach(category => {
      allData[category] = this.load(category);
    });
    return allData;
  }

  // 전체 데이터 초기화
  resetAll() {
    Object.keys(this.dataModel).forEach(category => {
      this.save(category, this.dataModel[category]);
    });
    this.emitChangeEvent('all', this.dataModel);
  }

  // 데이터 마이그레이션
  migrateData() {
    const currentVersion = this.load('version');
    console.log('데이터 마이그레이션:', currentVersion, '->', this.version);
    
    if (!currentVersion || currentVersion !== this.version) {
      this.performMigration(currentVersion, this.version);
      this.save('version', this.version);
    }
  }

  // 마이그레이션 수행
  performMigration(fromVersion, toVersion) {
    console.log('마이그레이션 수행:', fromVersion, '->', toVersion);
    
    // 기존 데이터 마이그레이션
    this.migrateLegacyData();
    
    // 버전별 마이그레이션 로직
    if (!fromVersion) {
      this.save('version', toVersion);
    }
  }

  // 기존 데이터 마이그레이션
  migrateLegacyData() {
    // 기존 nb_* 키들을 새로운 구조로 마이그레이션
    const legacyKeys = {
      'nb_coins': 'player.coins',
      'nb_round': 'player.currentRound',
      'nb_char': 'player.characterStage',
      'nb_maxhp': 'player.maxLives',
      'nb_speed': 'abilities.speedLevel',
      'nb_firerate': 'abilities.fireRateLevel',
      'nb_bullets': 'abilities.bulletCount',
      'nb_owned': 'ownedItems',
      'nb_equip': 'equippedItems',
      'nb_buffs': 'buffs',
      'nb_pass': 'passives',
      'nb_prices': 'gameConfig.prices',
      'nb_stages': 'gameConfig.stages'
    };

    Object.keys(legacyKeys).forEach(legacyKey => {
      const value = localStorage.getItem(legacyKey);
      if (value) {
        const [category, field] = legacyKeys[legacyKey].split('.');
        let data = this.load(category);
        
        if (field) {
          if (category === 'ownedItems' || category === 'equippedItems' || 
              category === 'buffs' || category === 'passives') {
            // JSON 형식으로 처리
            try {
              data[field] = JSON.parse(value);
            } catch (e) {
              data[field] = {};
            }
          } else {
            data[field] = isNaN(value) ? value : parseInt(value);
          }
        } else {
          data = isNaN(value) ? value : parseInt(value);
        }
        
        this.save(category, data);
        // 기존 키 삭제 (선택적)
        // localStorage.removeItem(legacyKey);
      }
    });
  }

  // 저장소 공간 관리
  checkStorageSpace() {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // 약 5MB 가정
      const remaining = 5 * 1024 * 1024 - used;
      const percentage = (used / (5 * 1024 * 1024)) * 100;
      
      return {
        used: Math.round(used / 1024), // KB
        remaining: Math.round(remaining / 1024), // KB
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      console.error('저장소 공간 확인 실패:', error);
      return { used: 0, remaining: 0, percentage: 0 };
    }
  }

  // 데이터 백업
  exportData() {
    const allData = {};
    Object.keys(this.dataModel).forEach(category => {
      allData[category] = this.load(category);
    });
    
    return {
      version: this.version,
      timestamp: Date.now(),
      data: allData
    };
  }

  // 데이터 복구
  importData(exportedData) {
    try {
      if (!exportedData.data) {
        throw new Error('잘못된 데이터 형식');
      }
      
      // 백업 데이터 유효성 검사
      Object.keys(exportedData.data).forEach(category => {
        if (this.dataModel[category]) {
          this.save(category, exportedData.data[category]);
        }
      });
      
      // 버전 정보 저장
      if (exportedData.version) {
        this.save('version', exportedData.version);
      }
      
      return true;
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      return false;
    }
  }

  // 이벤트 리스너
  onChange(category, callback) {
    if (!this.listeners.has(category)) {
      this.listeners.set(category, []);
    }
    this.listeners.get(category).push(callback);
  }

  removeListener(category, callback) {
    if (this.listeners.has(category)) {
      const callbacks = this.listeners.get(category);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emitChangeEvent(category, data) {
    if (this.listeners.has(category)) {
      this.listeners.get(category).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('리스너 실행 실패:', error);
        }
      });
    }
    
    // 'all' 리스너에게도 알림
    if (this.listeners.has('all')) {
      this.listeners.get('all').forEach(callback => {
        try {
          callback({ category, data });
        } catch (error) {
          console.error('전체 리스너 실행 실패:', error);
        }
      });
    }
  }

  // 네트워크 이벤트 리스너
  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('온라인 상태');
      this.emitChangeEvent('network', { online: true });
    });

    window.addEventListener('offline', () => {
      console.log('오프라인 상태');
      this.emitChangeEvent('network', { online: false });
    });

    // 저장소 이벤트 (다른 탭과의 동기화)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(this.prefix)) {
        const category = e.key.replace(this.prefix, '');
        const data = e.newValue ? JSON.parse(e.newValue) : null;
        this.emitChangeEvent(category, data);
      }
    });
  }

  // 저장소 에러 처리
  handleStorageError(error) {
    console.error('저장소 에러:', error);
    
    if (error.name === 'QuotaExceededError') {
      this.emitChangeEvent('error', {
        type: 'QUOTA_EXCEEDED',
        message: '저장 공간이 부족합니다'
      });
    } else if (error.name === 'SecurityError') {
      this.emitChangeEvent('error', {
        type: 'SECURITY',
        message: '저장소 접근이 차단되었습니다'
      });
    } else {
      this.emitChangeEvent('error', {
        type: 'UNKNOWN',
        message: error.message
      });
    }
  }

  // 데이터 정리
  cleanup() {
    // 손상된 데이터 확인 및 정리
    Object.keys(this.dataModel).forEach(category => {
      try {
        this.load(category);
      } catch (error) {
        console.warn(`손상된 데이터 정리: ${category}`);
        this.save(category, this.dataModel[category]);
      }
    });
  }

  // 로깅
  logStorageInfo() {
    const space = this.checkStorageSpace();
    console.log('저장소 정보:', space);
    
    // 모든 데이터 키 출력
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    console.log('저장된 카테고리:', keys.map(k => k.replace(this.prefix, '')));
  }
}

// 전역 인스턴스 생성
window.storageManager = new StorageManager();