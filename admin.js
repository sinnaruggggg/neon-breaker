// 네온 브레이커 관리자 JavaScript
class AdminPanel {
  constructor() {
    this.currentTab = 'basic';
    this.gameData = {
      coins: 0,
      round: 1,
      stage: 1,
      charStage: 0,
      maxLives: 4,
      speedLevel: 0,
      fireRateLevel: 0,
      bulletCount: 1,
      owned: { w_normal: true, b_white: true },
      equipped: { weapon: 'w_normal', ball: 'b_white' },
      buffs: {},
      passives: {}
    };
    this.STG = {};
    this.SHOP = {};
    this.init();
  }

  init() {
    this.loadGameData();
    this.loadDefaultConfigs();
    this.setupEventListeners();
    this.renderCurrentTab();
    this.updateStatusBar();
  }

  loadGameData() {
    try {
      // localStorage에서 게임 데이터 로드
      this.gameData.coins = parseInt(localStorage.getItem('nb_coins')) || 0;
      this.gameData.round = parseInt(localStorage.getItem('nb_round')) || 1;
      this.gameData.charStage = parseInt(localStorage.getItem('nb_char')) || 0;
      this.gameData.owned = JSON.parse(localStorage.getItem('nb_owned')) || { w_normal: true, b_white: true };
      this.gameData.equipped = JSON.parse(localStorage.getItem('nb_equip')) || { weapon: 'w_normal', ball: 'b_white' };
      this.gameData.buffs = JSON.parse(localStorage.getItem('nb_buffs')) || {};
      this.gameData.passives = JSON.parse(localStorage.getItem('nb_pass')) || {};
      this.gameData.maxLives = parseInt(localStorage.getItem('nb_maxhp')) || 4;
      this.gameData.speedLevel = parseInt(localStorage.getItem('nb_speed')) || 0;
      this.gameData.fireRateLevel = parseInt(localStorage.getItem('nb_firerate')) || 0;
      this.gameData.bulletCount = parseInt(localStorage.getItem('nb_bullets')) || 1;
    } catch (error) {
      console.error('게임 데이터 로드 실패:', error);
    }
  }

  loadDefaultConfigs() {
    // 기본 스테이지 설정
    this.STG = {
      1: { r: 3, c: 5, s: 3.2, str: 0, exp: 0.12 },
      2: { r: 3, c: 6, s: 3.5, str: 0.05, exp: 0.12 },
      3: { r: 4, c: 6, s: 3.8, str: 0.08, exp: 0.1 },
      4: { r: 4, c: 6, s: 4, str: 0.1, exp: 0.1 },
      5: { r: 4, c: 7, s: 4.2, str: 0.12, exp: 0.08 },
      6: { r: 5, c: 7, s: 4.5, str: 0.15, exp: 0.08 },
      7: { r: 5, c: 7, s: 4.8, str: 0.18, exp: 0.06 }
    };

    // 기본 상점 설정
    this.SHOP = {
      weapons: [
        { id: 'w_normal', name: '기본', desc: '기본 발사', price: 0, icon: '🔫' },
        { id: 'w_spread', name: '확산', desc: '3방향 발사', price: 500, icon: '💨', spread: true },
        { id: 'w_laser', name: '레이저', desc: '관통 빔', price: 800, icon: '⚡', laser: true },
        { id: 'w_rapid', name: '속사', desc: '빠른 발사', price: 1200, icon: '🔥', rate: 0.4 },
        { id: 'w_missile', name: '미사일', desc: '유도탄', price: 2000, icon: '🚀', homing: true }
      ],
      skills: [
        { id: 's_bomb', name: '폭탄+', desc: '더 큰 폭발', price: 600, icon: '💥', buff: 'bombUp' },
        { id: 's_bolt', name: '번개+', desc: '더 많은 번개', price: 600, icon: '⚡', buff: 'boltUp' },
        { id: 's_fire', name: '화염+', desc: '더 긴 지속', price: 600, icon: '🔥', buff: 'fireUp' },
        { id: 's_cd', name: '쿨타임', desc: '20% 빠른 충전', price: 1500, icon: '⏱️', buff: 'cdDown' }
      ],
      items: [
        { id: 'i_magnet', name: '자석', desc: '자동 수집', price: 1000, icon: '🧲', passive: 'magnet' },
        { id: 'i_shield', name: '보호막', desc: '추가 생명', price: 800, icon: '🛡️', shield: true },
        { id: 'i_double', name: '더블', desc: '2배 코인', price: 2500, icon: '💎', passive: 'double' }
      ],
      balls: [
        { id: 'b_white', name: '기본', desc: '기본 공', price: 0, icon: '⚪', color: '#fff' },
        { id: 'b_fire', name: '화염', desc: '불꽃 효과', price: 300, icon: '🔥', color: '#f60' },
        { id: 'b_ice', name: '냉기', desc: '얼음 효과', price: 300, icon: '❄️', color: '#0ff' },
        { id: 'b_spark', name: '전기', desc: '전기 효과', price: 500, icon: '⚡', color: '#ff0' }
      ]
    };

    // 저장된 설정 로드
    try {
      const savedStages = localStorage.getItem('nb_stages');
      if (savedStages) {
        this.STG = JSON.parse(savedStages);
      }

      const savedPrices = localStorage.getItem('nb_prices');
      if (savedPrices) {
        const prices = JSON.parse(savedPrices);
        Object.keys(this.SHOP).forEach(category => {
          this.SHOP[category].forEach(item => {
            if (prices[item.id] !== undefined) {
              item.price = prices[item.id];
            }
          });
        });
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  }

  setupEventListeners() {
    // 탭 전환
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    const content = document.getElementById('adminContent');
    
    switch (this.currentTab) {
      case 'basic':
        content.innerHTML = this.renderBasicTab();
        this.setupBasicTabEvents();
        break;
      case 'price':
        content.innerHTML = this.renderPriceTab();
        this.setupPriceTabEvents();
        break;
      case 'stage':
        content.innerHTML = this.renderStageTab();
        this.setupStageTabEvents();
        break;
      case 'data':
        content.innerHTML = this.renderDataTab();
        this.setupDataTabEvents();
        break;
      case 'stats':
        content.innerHTML = this.renderStatsTab();
        this.setupStatsTabEvents();
        break;
    }
  }

  renderBasicTab() {
    return `
      <div class="admin-box">
        <h3>💰 코인 관리</h3>
        <div class="admin-row">
          <label>현재 코인</label>
          <input type="number" class="admin-input" id="adminCoins" value="${this.gameData.coins}">
        </div>
        <div class="button-group">
          <button class="admin-btn" onclick="admin.addCoins(1000)">+1천</button>
          <button class="admin-btn" onclick="admin.addCoins(10000)">+1만</button>
          <button class="admin-btn green" onclick="admin.setCoins()">설정</button>
        </div>
      </div>

      <div class="admin-box">
        <h3>📊 진행도 관리</h3>
        <div class="admin-row">
          <label>라운드</label>
          <input type="number" class="admin-input" id="adminRound" value="${this.gameData.round}" min="1">
        </div>
        <div class="admin-row">
          <label>캐릭터 스테이지</label>
          <input type="number" class="admin-input" id="adminCharStage" value="${this.gameData.charStage}" min="0">
        </div>
        <div class="admin-row">
          <label>최대 생명력</label>
          <input type="number" class="admin-input" id="adminMaxLives" value="${this.gameData.maxLives}" min="1" max="10">
        </div>
        <div class="button-group">
          <button class="admin-btn green" onclick="admin.setProgress()">적용</button>
          <button class="admin-btn" onclick="admin.resetProgress()">초기화</button>
        </div>
      </div>

      <div class="admin-box">
        <h3>⚡ 능력치 설정</h3>
        <div class="admin-row">
          <label>속도 레벨</label>
          <input type="number" class="admin-input" id="adminSpeed" value="${this.gameData.speedLevel}" min="0" max="3">
        </div>
        <div class="admin-row">
          <label>연사 레벨</label>
          <input type="number" class="admin-input" id="adminFireRate" value="${this.gameData.fireRateLevel}" min="0" max="3">
        </div>
        <div class="admin-row">
          <label>탄환 개수</label>
          <input type="number" class="admin-input" id="adminBulletCount" value="${this.gameData.bulletCount}" min="1" max="5">
        </div>
        <div class="button-group">
          <button class="admin-btn blue" onclick="admin.setAbilities()">적용</button>
        </div>
      </div>
    `;
  }

  renderPriceTab() {
    let html = '<div class="admin-box"><h3>🏷️ 가격 설정</h3><div class="admin-list" id="priceList">';
    
    Object.keys(this.SHOP).forEach(category => {
      html += `<div class="category-header">${category.toUpperCase()}</div>`;
      this.SHOP[category].forEach(item => {
        html += `
          <div class="admin-item">
            <span class="item-name">${item.icon} ${item.name}</span>
            <input type="number" class="admin-input price-input" data-id="${item.id}" value="${item.price}" min="0">
          </div>
        `;
      });
    });
    
    html += '</div><div class="button-group">';
    html += '<button class="admin-btn green" onclick="admin.savePrices()">💾 저장</button>';
    html += '<button class="admin-btn" onclick="admin.resetPrices()">기본값</button>';
    html += '</div></div>';
    
    return html;
  }

  renderStageTab() {
    const stages = Object.keys(this.STG).map(Number).sort((a, b) => a - b);
    let html = '<div class="admin-box"><h3>🎮 스테이지 설정</h3>';
    html += '<div class="stage-list" id="stageList">';
    
    stages.forEach(key => {
      const stage = this.STG[key];
      html += `
        <div class="stage-item" data-stage="${key}">
          <label>S${key}</label>
          <input type="number" class="stage-input" data-field="r" value="${stage.r}" min="1" max="10" title="행">
          <input type="number" class="stage-input" data-field="c" value="${stage.c}" min="1" max="10" title="열">
          <input type="number" class="stage-input" data-field="s" value="${stage.s}" step="0.1" title="속도">
          <input type="number" class="stage-input" data-field="str" value="${stage.str}" step="0.01" title="강한%">
          <input type="number" class="stage-input" data-field="exp" value="${stage.exp}" step="0.01" title="폭발%">
          <button class="admin-btn red" onclick="admin.removeStage(${key})">삭제</button>
        </div>
      `;
    });
    
    html += '</div><div class="button-group">';
    html += '<button class="admin-btn blue" onclick="admin.addStage()">+ 추가</button>';
    html += '<button class="admin-btn green" onclick="admin.saveStages()">💾 저장</button>';
    html += '<button class="admin-btn" onclick="admin.resetStages()">기본값</button>';
    html += '</div></div>';
    
    html += `
      <div class="admin-box">
        <h3>📤 내보내기 / 가져오기</h3>
        <textarea id="stageJson" class="json-textarea" placeholder="JSON 데이터"></textarea>
        <div class="button-group">
          <button class="admin-btn blue" onclick="admin.exportData()">내보내기</button>
          <button class="admin-btn green" onclick="admin.importData()">가져오기</button>
        </div>
      </div>
    `;
    
    return html;
  }

  renderDataTab() {
    return `
      <div class="admin-box">
        <h3>🔓 데이터 관리</h3>
        <div class="button-group">
          <button class="admin-btn green" onclick="admin.unlockAll()">전체 해금</button>
          <button class="admin-btn blue" onclick="admin.maxAbilities()">최대 능력</button>
          <button class="admin-btn" onclick="admin.resetAllData()">전체 초기화</button>
        </div>
      </div>
      
      <div class="admin-box">
        <h3>📦 데이터 백업</h3>
        <div class="button-group">
          <button class="admin-btn blue" onclick="admin.backupData()">백업 생성</button>
          <button class="admin-btn green" onclick="admin.restoreData()">백업 복원</button>
        </div>
        <div id="backupInfo" class="info-text"></div>
      </div>
    `;
  }

  renderStatsTab() {
    const ownedItems = Object.keys(this.gameData.owned).length;
    const totalItems = Object.values(this.SHOP).reduce((sum, category) => sum + category.length, 0);
    const completionRate = Math.round((ownedItems / totalItems) * 100);
    
    return `
      <div class="admin-box">
        <h3>📊 플레이어 통계</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">총 코인</span>
            <span class="stat-value">${this.gameData.coins.toLocaleString()}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">현재 라운드</span>
            <span class="stat-value">${this.gameData.round}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">캐릭터 진행</span>
            <span class="stat-value">${this.gameData.charStage}/7</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">아이템 해금률</span>
            <span class="stat-value">${completionRate}%</span>
          </div>
        </div>
      </div>
      
      <div class="admin-box">
        <h3>🎮 시스템 정보</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">스테이지 수</span>
            <span class="stat-value">${Object.keys(this.STG).length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">상점 아이템</span>
            <span class="stat-value">${totalItems}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">보유 아이템</span>
            <span class="stat-value">${ownedItems}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">마지막 저장</span>
            <span class="stat-value" id="lastSaveInfo">없음</span>
          </div>
        </div>
      </div>
    `;
  }

  setupBasicTabEvents() {
    // 기본 탭 이벤트는 renderBasicTab()에서 onclick으로 직접 처리
  }

  setupPriceTabEvents() {
    // 가격 탭 이벤트는 onclick으로 직접 처리
  }

  setupStageTabEvents() {
    // 스테이지 탭 이벤트는 onclick으로 직접 처리
  }

  setupDataTabEvents() {
    // 데이터 탭 이벤트는 onclick으로 직접 처리
  }

  setupStatsTabEvents() {
    // 통계 탭 이벤트는 onclick으로 직접 처리
    this.updateLastSaveInfo();
  }

  // 기능 함수들
  addCoins(amount) {
    this.gameData.coins += amount;
    document.getElementById('adminCoins').value = this.gameData.coins;
    this.saveGameData();
    this.showToast(`+${amount.toLocaleString()} 코인 추가!`);
  }

  setCoins() {
    const input = document.getElementById('adminCoins');
    this.gameData.coins = parseInt(input.value) || 0;
    this.saveGameData();
    this.showToast('코인 설정됨!');
  }

  setProgress() {
    this.gameData.round = parseInt(document.getElementById('adminRound').value) || 1;
    this.gameData.charStage = parseInt(document.getElementById('adminCharStage').value) || 0;
    this.gameData.maxLives = parseInt(document.getElementById('adminMaxLives').value) || 4;
    this.saveGameData();
    this.showToast('진행도 설정됨!');
  }

  resetProgress() {
    this.gameData.round = 1;
    this.gameData.charStage = 0;
    this.gameData.maxLives = 4;
    document.getElementById('adminRound').value = 1;
    document.getElementById('adminCharStage').value = 0;
    document.getElementById('adminMaxLives').value = 4;
    this.saveGameData();
    this.showToast('진행도 초기화됨!');
  }

  setAbilities() {
    this.gameData.speedLevel = parseInt(document.getElementById('adminSpeed').value) || 0;
    this.gameData.fireRateLevel = parseInt(document.getElementById('adminFireRate').value) || 0;
    this.gameData.bulletCount = parseInt(document.getElementById('adminBulletCount').value) || 1;
    this.saveGameData();
    this.showToast('능력치 설정됨!');
  }

  savePrices() {
    const prices = {};
    document.querySelectorAll('.price-input').forEach(input => {
      const id = input.dataset.id;
      const price = parseInt(input.value) || 0;
      prices[id] = price;
      
      // 메모리의 SHOP 데이터 업데이트
      Object.keys(this.SHOP).forEach(category => {
        const item = this.SHOP[category].find(i => i.id === id);
        if (item) item.price = price;
      });
    });
    
    localStorage.setItem('nb_prices', JSON.stringify(prices));
    this.updateLastSaved();
    this.showToast('가격 저장됨!');
  }

  resetPrices() {
    localStorage.removeItem('nb_prices');
    this.loadDefaultConfigs();
    this.renderCurrentTab();
    this.showToast('가격이 기본값으로 초기화됨!');
  }

  addStage() {
    const keys = Object.keys(this.STG).map(Number);
    const newKey = Math.max(...keys) + 1;
    const last = this.STG[Math.max(...keys)];
    
    this.STG[newKey] = {
      r: Math.min(8, last.r + 1),
      c: Math.min(9, last.c),
      s: Math.min(8, parseFloat((last.s + 0.3).toFixed(1))),
      str: Math.min(0.5, parseFloat((last.str + 0.03).toFixed(2))),
      exp: Math.max(0.02, parseFloat((last.exp - 0.01).toFixed(2)))
    };
    
    this.renderCurrentTab();
    this.showToast(`스테이지 ${newKey} 추가됨!`);
  }

  removeStage(key) {
    if (Object.keys(this.STG).length <= 1) {
      this.showToast('최소 1개 스테이지는 필요합니다!');
      return;
    }
    
    delete this.STG[key];
    
    // 재정렬
    const newSTG = {};
    let idx = 1;
    Object.keys(this.STG).map(Number).sort((a, b) => a - b).forEach(k => {
      newSTG[idx] = this.STG[k];
      idx++;
    });
    
    this.STG = newSTG;
    this.renderCurrentTab();
    this.showToast('스테이지 삭제됨!');
  }

  saveStages() {
    const stages = {};
    document.querySelectorAll('.stage-item').forEach(item => {
      const key = parseInt(item.dataset.stage);
      const inputs = item.querySelectorAll('.stage-input');
      
      stages[key] = {};
      inputs.forEach(input => {
        const field = input.dataset.field;
        const value = parseFloat(input.value);
        stages[key][field] = value;
      });
    });
    
    this.STG = stages;
    localStorage.setItem('nb_stages', JSON.stringify(stages));
    this.updateLastSaved();
    this.showToast('스테이지 설정 저장됨!');
  }

  resetStages() {
    localStorage.removeItem('nb_stages');
    this.loadDefaultConfigs();
    this.renderCurrentTab();
    this.showToast('스테이지가 기본값으로 초기화됨!');
  }

  exportData() {
    const data = {
      stages: this.STG,
      prices: this.getPricesObj(),
      timestamp: new Date().toISOString()
    };
    
    document.getElementById('stageJson').value = JSON.stringify(data, null, 2);
    this.showToast('데이터 내보내기 완료!');
  }

  importData() {
    try {
      const jsonText = document.getElementById('stageJson').value;
      const data = JSON.parse(jsonText);
      
      if (data.stages) {
        this.STG = data.stages;
        localStorage.setItem('nb_stages', JSON.stringify(this.STG));
      }
      
      if (data.prices) {
        Object.keys(data.prices).forEach(id => {
          Object.keys(this.SHOP).forEach(category => {
            const item = this.SHOP[category].find(i => i.id === id);
            if (item) item.price = data.prices[id];
          });
        });
        
        const prices = this.getPricesObj();
        localStorage.setItem('nb_prices', JSON.stringify(prices));
      }
      
      this.updateLastSaved();
      this.renderCurrentTab();
      this.showToast('데이터 가져오기 완료!');
    } catch (error) {
      this.showToast('JSON 형식 오류!');
    }
  }

  unlockAll() {
    Object.keys(this.SHOP).forEach(category => {
      this.SHOP[category].forEach(item => {
        this.gameData.owned[item.id] = true;
      });
    });
    
    this.gameData.buffs = { bombUp: true, boltUp: true, fireUp: true, cdDown: true };
    this.gameData.passives = { magnet: true, double: true };
    this.gameData.maxLives = 6;
    this.gameData.speedLevel = 3;
    this.gameData.fireRateLevel = 3;
    this.gameData.bulletCount = 5;
    
    this.saveGameData();
    this.showToast('전체 아이템 해금 완료!');
  }

  maxAbilities() {
    this.gameData.maxLives = 6;
    this.gameData.speedLevel = 3;
    this.gameData.fireRateLevel = 3;
    this.gameData.bulletCount = 5;
    this.saveGameData();
    this.showToast('능력치 최대 설정 완료!');
  }

  resetAllData() {
    if (confirm('정말 모든 데이터를 초기화하시겠습니까? 복구할 수 없습니다!')) {
      localStorage.clear();
      location.reload();
    }
  }

  backupData() {
    const backup = {
      gameData: this.gameData,
      stages: this.STG,
      prices: this.getPricesObj(),
      timestamp: new Date().toISOString()
    };
    
    const backupKey = `nb_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    document.getElementById('backupInfo').textContent = `백업 생성됨: ${new Date().toLocaleString()}`;
    this.showToast('데이터 백업 완료!');
  }

  restoreData() {
    // 최신 백업 찾기
    const keys = Object.keys(localStorage).filter(key => key.startsWith('nb_backup_'));
    if (keys.length === 0) {
      this.showToast('백업이 없습니다!');
      return;
    }
    
    const latestKey = keys.sort().pop();
    const backup = JSON.parse(localStorage.getItem(latestKey));
    
    if (backup.gameData) {
      this.gameData = backup.gameData;
      this.saveGameData();
    }
    
    if (backup.stages) {
      this.STG = backup.stages;
      localStorage.setItem('nb_stages', JSON.stringify(this.STG));
    }
    
    if (backup.prices) {
      localStorage.setItem('nb_prices', JSON.stringify(backup.prices));
    }
    
    this.showToast(`백업 복원 완료! (${new Date(backup.timestamp).toLocaleString()})`);
  }

  getPricesObj() {
    const prices = {};
    Object.keys(this.SHOP).forEach(category => {
      this.SHOP[category].forEach(item => {
        prices[item.id] = item.price;
      });
    });
    return prices;
  }

  saveGameData() {
    localStorage.setItem('nb_coins', this.gameData.coins);
    localStorage.setItem('nb_round', this.gameData.round);
    localStorage.setItem('nb_char', this.gameData.charStage);
    localStorage.setItem('nb_owned', JSON.stringify(this.gameData.owned));
    localStorage.setItem('nb_equip', JSON.stringify(this.gameData.equipped));
    localStorage.setItem('nb_buffs', JSON.stringify(this.gameData.buffs));
    localStorage.setItem('nb_pass', JSON.stringify(this.gameData.passives));
    localStorage.setItem('nb_maxhp', this.gameData.maxLives);
    localStorage.setItem('nb_speed', this.gameData.speedLevel);
    localStorage.setItem('nb_firerate', this.gameData.fireRateLevel);
    localStorage.setItem('nb_bullets', this.gameData.bulletCount);
    
    this.updateLastSaved();
  }

  updateLastSaved() {
    const now = new Date().toLocaleString();
    document.getElementById('lastSaved').textContent = `마지막 저장: ${now}`;
  }

  updateLastSaveInfo() {
    const lastSaved = document.getElementById('lastSaved').textContent.replace('마지막 저장: ', '');
    document.getElementById('lastSaveInfo').textContent = lastSaved || '없음';
  }

  updateStatusBar() {
    this.updateLastSaved();
    // 연결 상태는 항상 '연결됨'으로 표시 (localStorage 기반이므로)
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  backToGame() {
    window.location.href = 'neon-breaker.html';
  }
}

// 전역 변수 및 초기화
let admin;

document.addEventListener('DOMContentLoaded', () => {
  admin = new AdminPanel();
});

function backToGame() {
  admin.backToGame();
}