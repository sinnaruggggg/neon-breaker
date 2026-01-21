// 네온 브레이커 게임 데이터 모델
class GameData {
  constructor(storageManager) {
    this.storage = storageManager;
    this.data = {
      player: {},
      abilities: {},
      ownedItems: {},
      equippedItems: {},
      buffs: {},
      passives: {},
      settings: {},
      gameConfig: {}
    };
    this.listeners = new Map();
    
    this.init();
  }

  // 초기화
  init() {
    this.loadAll();
    this.setupEventListeners();
  }

  // 모든 데이터 로드
  loadAll() {
    Object.keys(this.data).forEach(category => {
      this.data[category] = this.storage.load(category);
    });
  }

  // 모든 데이터 저장
  saveAll() {
    Object.keys(this.data).forEach(category => {
      this.storage.save(category, this.data[category]);
    });
  }

  // 특정 카테고리 데이터 저장
  saveCategory(category) {
    this.storage.save(category, this.data[category]);
  }

  // 데이터 getter
  getPlayerData() {
    return this.data.player;
  }

  getAbilities() {
    return this.data.abilities;
  }

  getOwnedItems() {
    return this.data.ownedItems;
  }

  getEquippedItems() {
    return this.data.equippedItems;
  }

  getBuffs() {
    return this.data.buffs;
  }

  getPassives() {
    return this.data.passives;
  }

  getSettings() {
    return this.data.settings;
  }

  getGameConfig() {
    return this.data.gameConfig;
  }

  // 플레이어 데이터 업데이트
  updatePlayerData(updates) {
    Object.assign(this.data.player, updates);
    this.saveCategory('player');
    this.emitChange('player', this.data.player);
  }

  // 코인 관리
  addCoins(amount) {
    this.data.player.coins += amount;
    if (this.data.player.coins < 0) {
      this.data.player.coins = 0;
    }
    this.saveCategory('player');
    this.emitChange('coins', this.data.player.coins);
    return this.data.player.coins;
  }

  getCoins() {
    return this.data.player.coins;
  }

  // 라운드 관리
  getCurrentRound() {
    return this.data.player.currentRound;
  }

  setCurrentRound(round) {
    this.data.player.currentRound = round;
    if (round > this.data.player.highestRound) {
      this.data.player.highestRound = round;
    }
    this.saveCategory('player');
    this.emitChange('round', round);
  }

  // 스테이지 관리
  getCurrentStage() {
    return this.data.player.currentStage;
  }

  setCurrentStage(stage) {
    this.data.player.currentStage = stage;
    this.saveCategory('player');
    this.emitChange('stage', stage);
  }

  // 캐릭터 스테이지
  setCharacterStage(stage) {
    this.data.player.characterStage = stage;
    this.saveCategory('player');
    this.emitChange('characterStage', stage);
  }

  getCharacterStage() {
    return this.data.player.characterStage;
  }

  // 생명력 관리
  getMaxLives() {
    return this.data.player.maxLives;
  }

  setMaxLives(lives) {
    this.data.player.maxLives = Math.max(1, Math.min(10, lives));
    this.saveCategory('player');
    this.emitChange('maxLives', this.data.player.maxLives);
  }

  // 능력치 관리
  setSpeedLevel(level) {
    this.data.abilities.speedLevel = Math.max(0, Math.min(3, level));
    this.saveCategory('abilities');
    this.emitChange('speedLevel', this.data.abilities.speedLevel);
  }

  getSpeedLevel() {
    return this.data.abilities.speedLevel;
  }

  setFireRateLevel(level) {
    this.data.abilities.fireRateLevel = Math.max(0, Math.min(3, level));
    this.saveCategory('abilities');
    this.emitChange('fireRateLevel', this.data.abilities.fireRateLevel);
  }

  getFireRateLevel() {
    return this.data.abilities.fireRateLevel;
  }

  setBulletCount(count) {
    this.data.abilities.bulletCount = Math.max(1, Math.min(5, count));
    this.saveCategory('abilities');
    this.emitChange('bulletCount', this.data.abilities.bulletCount);
  }

  getBulletCount() {
    return this.data.abilities.bulletCount;
  }

  // 아이템 관리
  addOwnedItem(type, itemId) {
    if (!this.data.ownedItems[type]) {
      this.data.ownedItems[type] = [];
    }
    
    if (!this.data.ownedItems[type].includes(itemId)) {
      this.data.ownedItems[type].push(itemId);
      this.saveCategory('ownedItems');
      this.emitChange('ownedItem', { type, itemId });
      return true;
    }
    
    return false;
  }

  removeOwnedItem(type, itemId) {
    if (this.data.ownedItems[type]) {
      const index = this.data.ownedItems[type].indexOf(itemId);
      if (index > -1) {
        this.data.ownedItems[type].splice(index, 1);
        this.saveCategory('ownedItems');
        this.emitChange('removedItem', { type, itemId });
        return true;
      }
    }
    return false;
  }

  hasItem(type, itemId) {
    return this.data.ownedItems[type] && 
           this.data.ownedItems[type].includes(itemId);
  }

  getOwnedItemsByType(type) {
    return this.data.ownedItems[type] || [];
  }

  // 장착 아이템 관리
  equipItem(type, itemId) {
    // 해당 아이템을 소유하고 있는지 확인
    if (!this.hasItem(type, itemId)) {
      return false;
    }
    
    this.data.equippedItems[type] = itemId;
    this.saveCategory('equippedItems');
    this.emitChange('equippedItem', { type, itemId });
    return true;
  }

  getEquippedItem(type) {
    return this.data.equippedItems[type];
  }

  // 버프/패시브 관리
  addBuff(buffId, value = true) {
    this.data.buffs[buffId] = value;
    this.saveCategory('buffs');
    this.emitChange('buff', { id: buffId, value });
  }

  removeBuff(buffId) {
    delete this.data.buffs[buffId];
    this.saveCategory('buffs');
    this.emitChange('removedBuff', buffId);
  }

  hasBuff(buffId) {
    return this.data.buffs.hasOwnProperty(buffId);
  }

  getBuff(buffId) {
    return this.data.buffs[buffId];
  }

  addPassive(passiveId, value = true) {
    this.data.passives[passiveId] = value;
    this.saveCategory('passives');
    this.emitChange('passive', { id: passiveId, value });
  }

  removePassive(passiveId) {
    delete this.data.passives[passiveId];
    this.saveCategory('passives');
    this.emitChange('removedPassive', passiveId);
  }

  hasPassive(passiveId) {
    return this.data.passives.hasOwnProperty(passiveId);
  }

  getPassive(passiveId) {
    return this.data.passives[passiveId];
  }

  // 설정 관리
  updateSettings(updates) {
    Object.assign(this.data.settings, updates);
    this.saveCategory('settings');
    this.emitChange('settings', this.data.settings);
  }

  getSetting(key) {
    return this.data.settings[key];
  }

  setSetting(key, value) {
    this.data.settings[key] = value;
    this.saveCategory('settings');
    this.emitChange('setting', { key, value });
  }

  // 게임 설정 관리
  updateGameConfig(updates) {
    Object.assign(this.data.gameConfig, updates);
    this.saveCategory('gameConfig');
    this.emitChange('gameConfig', this.data.gameConfig);
  }

  getGameConfig() {
    return this.data.gameConfig;
  }

  // 스탯 관리
  getTotalScore() {
    return this.data.player.totalScore;
  }

  addScore(points) {
    this.data.player.totalScore += Math.max(0, points);
    this.saveCategory('player');
    this.emitChange('score', this.data.player.totalScore);
    return this.data.player.totalScore;
  }

  getHighestRound() {
    return this.data.player.highestRound;
  }

  // 플레이타임 관리
  addPlaytime(seconds) {
    this.data.player.totalPlaytime += Math.max(0, seconds);
    this.saveCategory('player');
    this.emitChange('playtime', this.data.player.totalPlaytime);
  }

  getTotalPlaytime() {
    return this.data.player.totalPlaytime;
  }

  // 데이터 유효성 검사
  validate() {
    const errors = [];
    
    // 필수 데이터 확인
    if (typeof this.data.player.coins !== 'number') {
      errors.push('코인 데이터가 유효하지 않습니다');
    }
    
    if (typeof this.data.player.currentRound !== 'number') {
      errors.push('라운드 데이터가 유효하지 않습니다');
    }
    
    // 아이템 배열 확인
    const itemTypes = ['weapons', 'skills', 'items', 'balls'];
    itemTypes.forEach(type => {
      if (!Array.isArray(this.data.ownedItems[type])) {
        errors.push(`${type} 아이템 데이터가 배열이 아닙니다`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 데이터 재설정
  reset(category = null) {
    if (category) {
      this.data[category] = this.storage.dataModel[category];
      this.saveCategory(category);
      this.emitChange('reset', { category });
    } else {
      this.storage.resetAll();
      this.loadAll();
      this.emitChange('resetAll', true);
    }
  }

  // 이벤트 리스너
  onChange(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emitChange(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`리스너 실행 실패 (${event}):`, error);
        }
      });
    }
  }

  // 스토리지 이벤트 연결
  setupEventListeners() {
    this.storage.onChange('all', ({ category, data }) => {
      if (data) {
        this.data[category] = data;
      }
    });
  }

  // 디버깅 정보
  debug() {
    console.group('GameData Debug Info');
    console.log('Player:', this.data.player);
    console.log('Abilities:', this.data.abilities);
    console.log('Owned Items:', this.data.ownedItems);
    console.log('Equipped Items:', this.data.equippedItems);
    console.log('Buffs:', this.data.buffs);
    console.log('Passives:', this.data.passives);
    console.log('Settings:', this.data.settings);
    console.groupEnd();
  }

  // 데이터 내보내기
  export() {
    return this.storage.exportData();
  }

  // 데이터 가져오기
  import(exportedData) {
    if (this.storage.importData(exportedData)) {
      this.loadAll();
      this.emitChange('imported', true);
      return true;
    }
    return false;
  }
}

// 전역 인스턴스
window.gameData = new GameData(window.storageManager);