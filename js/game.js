/**
 * ASTRAL WATERS — Core Game State Machine, Fishing Duel Mechanics, UI & Progression
 */

class AstralFishingGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = null;

    // Persistent Player State
    this.state = {
      phase: 'title', // 'title' | 'idle' | 'charging' | 'waiting' | 'bite' | 'battle' | 'catch' | 'modal'
      weatherIndex: 0,
      currentZone: 1, // Default: 桟橋の灯影
      gold: 120,
      shards: 2,
      chapterIndex: 0, // 0..3 (4 chapters)
      endingShown: false,
      totalCatches: 0,
      playTimeSeconds: 0,
      equip: {
        rod: 1,
        reel: 1,
        lure: 1
      },
      owned: {
        rod: [1],
        reel: [1],
        lure: [1]
      },
      dex: {}, // { [fishId]: { count, maxSize, maxRank } }
      // Transient fishing state
      castPower: 0,
      castDir: 1,
      isPerfectCast: false,
      bobber: { x: 15, z: 155, dip: 0 },
      waitTimer: 0,
      biteTimer: 0,
      nibbleCount: 0,
      hookedFish: null,
      playerDir: 0,
      isReeling: false,
      battle: null
    };

    this.lastTimestamp = performance.now();
    this.reelSoundTimer = 0;
  }

  init() {
    window.spriteAtlas.init();
    this.renderer = new window.HD2DRenderer(this.canvas);
    this.loadSaveData();
    this.bindEvents();
    this.updateHUD();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  // ==================== SAVE / LOAD ====================
  loadSaveData() {
    try {
      const raw = localStorage.getItem('astral_waters_save_v1');
      if (raw) {
        const saved = JSON.parse(raw);
        this.state.gold = saved.gold ?? 120;
        this.state.shards = saved.shards ?? 2;
        this.state.chapterIndex = saved.chapterIndex ?? 0;
        this.state.endingShown = saved.endingShown ?? false;
        this.state.totalCatches = saved.totalCatches ?? 0;
        this.state.playTimeSeconds = saved.playTimeSeconds ?? 0;
        if (saved.equip) this.state.equip = saved.equip;
        if (saved.owned) this.state.owned = saved.owned;
        if (saved.dex) this.state.dex = saved.dex;

        const contBtn = document.getElementById('btn-continue-game');
        if (contBtn && this.state.totalCatches > 0) {
          contBtn.style.display = 'inline-flex';
        }
      }
    } catch (e) {
      console.warn('Save load skipped:', e);
    }
  }

  saveGame() {
    try {
      const payload = {
        gold: this.state.gold,
        shards: this.state.shards,
        chapterIndex: this.state.chapterIndex,
        endingShown: this.state.endingShown,
        totalCatches: this.state.totalCatches,
        playTimeSeconds: Math.floor(this.state.playTimeSeconds),
        equip: this.state.equip,
        owned: this.state.owned,
        dex: this.state.dex
      };
      localStorage.setItem('astral_waters_save_v1', JSON.stringify(payload));
    } catch (e) {}
  }

  // ==================== INPUT & UI EVENTS ====================
  bindEvents() {
    // Title Screen Buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      window.audioEngine.sfxClick();
      this.startGame(false);
    });
    document.getElementById('btn-continue-game').addEventListener('click', () => {
      window.audioEngine.sfxClick();
      this.startGame(true);
    });

    // Top HUD Navigation
    document.getElementById('weather-cycle-btn').addEventListener('click', () => this.cycleWeather());
    document.getElementById('btn-open-dex').addEventListener('click', () => this.openDexModal());
    document.getElementById('btn-close-dex').addEventListener('click', () => this.closeModals());
    document.getElementById('btn-open-shop').addEventListener('click', () => this.openShopModal());
    document.getElementById('btn-close-shop').addEventListener('click', () => this.closeModals());
    document.getElementById('btn-open-help').addEventListener('click', () => this.openHelpModal());
    document.getElementById('btn-close-help').addEventListener('click', () => this.closeModals());

    document.getElementById('btn-toggle-audio').addEventListener('click', () => {
      const muted = window.audioEngine.toggleMute();
      document.getElementById('hud-audio-icon').textContent = muted ? '🔇' : '🔊';
    });

    // Zone Tabs
    document.querySelectorAll('.zone-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const z = parseInt(btn.getAttribute('data-zone'), 10);
        this.selectZone(z);
      });
    });

    // Catch Modal Continue
    document.getElementById('btn-catch-continue').addEventListener('click', () => {
      window.audioEngine.sfxClick();
      document.getElementById('catch-modal').classList.add('hidden');
      this.enterIdlePhase();
      this.checkChapterProgression();
    });

    // Ending Modal Continue
    document.getElementById('btn-ending-continue').addEventListener('click', () => {
      window.audioEngine.sfxClick();
      document.getElementById('ending-modal').classList.add('hidden');
      this.enterIdlePhase();
    });

    // Battle Counter & Reel Buttons
    document.getElementById('btn-counter-left').addEventListener('click', () => this.performCounter(-1));
    document.getElementById('btn-counter-up').addEventListener('click', () => this.performCounter(0));
    document.getElementById('btn-counter-right').addEventListener('click', () => this.performCounter(1));
    document.getElementById('btn-battle-boost').addEventListener('click', () => this.activateBoost());

    const reelBtn = document.getElementById('btn-reel-hold');
    reelBtn.addEventListener('mousedown', () => { this.state.isReeling = true; reelBtn.classList.add('active'); });
    reelBtn.addEventListener('mouseup', () => { this.state.isReeling = false; reelBtn.classList.remove('active'); });
    reelBtn.addEventListener('mouseleave', () => { this.state.isReeling = false; reelBtn.classList.remove('active'); });

    // Canvas Mouse Interaction
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.handlePrimaryPress();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      this.handlePrimaryRelease();
    });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (e.repeat && (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'KeyW' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp')) {
        return;
      }

      if (this.state.phase === 'title') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.startGame(true);
        }
        return;
      }

      // Close modals on Escape or Space in Catch Modal
      if (!document.getElementById('catch-modal').classList.contains('hidden')) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
          e.preventDefault();
          document.getElementById('btn-catch-continue').click();
        }
        return;
      }
      if (!document.getElementById('ending-modal').classList.contains('hidden')) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
          e.preventDefault();
          document.getElementById('btn-ending-continue').click();
        }
        return;
      }
      if (this.state.phase === 'modal') {
        if (e.code === 'Escape' || e.code === 'KeyJ' || e.code === 'KeyU' || e.code === 'KeyH') {
          this.closeModals();
        }
        return;
      }

      // Global Shortcuts in Idle/Waiting
      if (e.code === 'KeyT') {
        this.cycleWeather();
      } else if (e.code === 'KeyJ') {
        this.openDexModal();
      } else if (e.code === 'KeyU') {
        this.openShopModal();
      } else if (e.code === 'KeyH') {
        this.openHelpModal();
      } else if (e.code === 'KeyM') {
        document.getElementById('btn-toggle-audio').click();
      }

      // Zone selection [1..5]
      if (this.state.phase === 'idle') {
        if (e.code === 'Digit1') this.selectZone(0);
        if (e.code === 'Digit2') this.selectZone(1);
        if (e.code === 'Digit3') this.selectZone(2);
        if (e.code === 'Digit4') this.selectZone(3);
        if (e.code === 'Digit5') this.selectZone(4);
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.selectZone((this.state.currentZone + 4) % 5);
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.selectZone((this.state.currentZone + 1) % 5);
        }
      }

      // Spacebar primary action
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) this.handlePrimaryPress();
      }

      // Waiting phase twitch or cancel
      if (this.state.phase === 'waiting') {
        if (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
          this.twitchBobber();
        } else if (e.code === 'Escape' || e.code === 'KeyR') {
          this.enterIdlePhase();
        }
      }

      // Battle phase directional counters & Boost
      if (this.state.phase === 'battle') {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.performCounter(-1);
        else if (e.code === 'KeyW' || e.code === 'ArrowUp') this.performCounter(0);
        else if (e.code === 'KeyD' || e.code === 'ArrowRight') this.performCounter(1);
        else if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.activateBoost();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handlePrimaryRelease();
      }
    });
  }

  // ==================== GAME FLOW & PHASES ====================
  startGame(continueSave = false) {
    window.audioEngine.init();
    if (!continueSave && this.state.totalCatches === 0) {
      // Fresh start defaults
      this.state.gold = 120;
      this.state.shards = 2;
    }
    const titleEl = document.getElementById('title-screen');
    titleEl.style.opacity = '0';
    setTimeout(() => titleEl.classList.add('hidden'), 550);

    document.getElementById('top-hud').classList.remove('hud-hidden');
    document.getElementById('zone-selector-bar').classList.remove('hud-hidden');
    document.getElementById('equip-status-bar').classList.remove('hud-hidden');
    document.getElementById('action-prompt-box').classList.remove('hud-hidden');

    this.enterIdlePhase();
    this.showToast('✨ 星影の湖エロウエンへようこそ。[SPACE] または画面クリック長押しで竿を振りましょう。');
  }

  enterIdlePhase() {
    this.state.phase = 'idle';
    this.state.isReeling = false;
    this.state.playerDir = 0;
    window.audioEngine.setMode('peace');

    document.getElementById('cast-gauge-overlay').classList.add('hidden');
    document.getElementById('waiting-overlay').classList.add('hidden');
    document.getElementById('battle-hud').classList.add('hidden');
    document.getElementById('zone-selector-bar').classList.remove('hud-hidden');
    document.getElementById('equip-status-bar').classList.remove('hud-hidden');
    document.getElementById('action-prompt-box').classList.remove('hud-hidden');

    document.getElementById('prompt-key-badge').textContent = 'SPACE / CLICK';
    document.getElementById('prompt-text-label').textContent = '長押しでキャスト力を溜め、離して投擲';
    this.updateHUD();
  }

  selectZone(zoneIndex) {
    if (this.state.phase !== 'idle') return;
    this.state.currentZone = zoneIndex;
    window.audioEngine.sfxClick();
    document.querySelectorAll('.zone-tab').forEach((tab, idx) => {
      tab.classList.toggle('active', idx === zoneIndex);
    });
    const zone = window.GAME_DATA.ZONES[zoneIndex];
    document.getElementById('hud-zone-name').textContent = zone.fullName;
  }

  cycleWeather(targetId = null) {
    if (this.state.phase === 'battle') return;
    const weathers = window.GAME_DATA.WEATHERS;
    if (targetId) {
      const idx = weathers.findIndex((w) => w.id === targetId);
      if (idx >= 0) this.state.weatherIndex = idx;
    } else {
      this.state.weatherIndex = (this.state.weatherIndex + 1) % weathers.length;
    }
    const w = weathers[this.state.weatherIndex];
    this.renderer.setWeather(w);
    window.audioEngine.setWeather(w.id);
    window.audioEngine.sfxBellChime();
    this.updateHUD();
    this.showToast(`${w.icon} 星見の鐘が響き、景色が『${w.name}』へと移ろいました。`);
  }

  handlePrimaryPress() {
    if (this.state.phase === 'idle') {
      // Begin charging cast
      this.state.phase = 'charging';
      this.state.castPower = 0;
      this.state.castDir = 1;
      document.getElementById('cast-gauge-overlay').classList.remove('hidden');
      document.getElementById('action-prompt-box').classList.add('hidden');
      document.getElementById('zone-selector-bar').classList.add('hud-hidden');
    } else if (this.state.phase === 'waiting') {
      this.twitchBobber();
    } else if (this.state.phase === 'bite') {
      this.hookFishAndStartBattle();
    } else if (this.state.phase === 'battle') {
      this.state.isReeling = true;
      document.getElementById('btn-reel-hold').classList.add('active');
    }
  }

  handlePrimaryRelease() {
    if (this.state.phase === 'charging') {
      this.executeCast();
    } else if (this.state.phase === 'battle') {
      this.state.isReeling = false;
      document.getElementById('btn-reel-hold').classList.remove('active');
    }
  }

  executeCast() {
    const p = this.state.castPower; // 0..100
    const isPerfect = p >= 70 && p <= 92;
    this.state.isPerfectCast = isPerfect;

    const zone = window.GAME_DATA.ZONES[this.state.currentZone];
    const distScale = 0.65 + (p / 100) * 0.45;
    this.state.bobber.x = zone.castTargetX + (Math.random() - 0.5) * 18;
    this.state.bobber.z = Math.min(260, Math.max(80, zone.castTargetZ * distScale));
    this.state.bobber.dip = 0;

    document.getElementById('cast-gauge-overlay').classList.add('hidden');
    document.getElementById('waiting-overlay').classList.remove('hidden');
    document.getElementById('waiting-status-text').textContent = isPerfect
      ? '✨ PERFECT CAST! 希少な魚が気配に気づいている…'
      : '水面を見つめている… 波紋で魚を誘おう';

    window.audioEngine.sfxCast(isPerfect);
    setTimeout(() => {
      window.audioEngine.sfxWaterPlop();
      const pt = this.renderer.projectWaterPoint(this.state.bobber.x, this.state.bobber.z);
      this.renderer.addSplash(this.state.bobber.x, this.state.bobber.z, isPerfect ? 22 : 12, isPerfect);
      if (isPerfect) {
        this.renderer.addPopup('✨ PERFECT CAST!!', pt.x, pt.y - 28, '#ffd700', 1.15);
      }
    }, 180);

    // Determine time until bite based on Lure tier
    const lureObj = window.GAME_DATA.EQUIPMENT.lure.tiers[this.state.equip.lure - 1];
    this.state.phase = 'waiting';
    this.state.waitTimer = (3.2 - (isPerfect ? 0.8 : 0)) / lureObj.biteSpeed;
    this.state.nibbleCount = 1 + Math.floor(Math.random() * 2);
  }

  twitchBobber() {
    if (this.state.phase !== 'waiting') return;
    window.audioEngine.sfxTwitch();
    this.state.bobber.dip = 4.5;
    this.state.waitTimer = Math.max(0.25, this.state.waitTimer - 0.65);
    this.renderer.addRipple(this.state.bobber.x, this.state.bobber.z, 54, 'rgba(110, 231, 255, 0.85)');
    const pt = this.renderer.projectWaterPoint(this.state.bobber.x, this.state.bobber.z);
    this.renderer.addPopup('♪ 誘い波紋', pt.x, pt.y - 18, '#6ee7ff', 0.85);
  }

  triggerBite() {
    this.state.phase = 'bite';
    this.state.biteTimer = 1.65; // Generous window + auto-hook assist
    this.state.hookedFish = this.selectFishForCurrentConditions();

    window.audioEngine.sfxHit();
    this.renderer.triggerFlash('#fff6cc', 0.38, 10);
    this.renderer.addSplash(this.state.bobber.x, this.state.bobber.z, 24, true);

    const pt = this.renderer.projectWaterPoint(this.state.bobber.x, this.state.bobber.z);
    this.renderer.addPopup('⚡ HIT!! [SPACE / CLICK]', pt.x, pt.y - 36, '#ffd700', 1.3);
    document.getElementById('waiting-status-text').textContent = '⚡ HIT!! 今すぐ [SPACE / クリック] でフッキング！！';
  }

  selectFishForCurrentConditions() {
    const zoneId = this.state.currentZone;
    const weatherId = window.GAME_DATA.WEATHERS[this.state.weatherIndex].id;
    const rodObj = window.GAME_DATA.EQUIPMENT.rod.tiers[this.state.equip.rod - 1];
    const lureObj = window.GAME_DATA.EQUIPMENT.lure.tiers[this.state.equip.lure - 1];

    // Filter eligible fish
    let pool = window.GAME_DATA.FISH.filter((f) => {
      const zoneMatch = f.zones.includes(zoneId);
      const weatherMatch = f.weathers.includes(weatherId);
      const rodMatch = f.minRodTier <= this.state.equip.rod && f.rarity <= rodObj.maxRarity;
      return zoneMatch && weatherMatch && rodMatch;
    });

    // Fallback if pool is empty
    if (pool.length === 0) {
      pool = window.GAME_DATA.FISH.filter((f) => f.zones.includes(zoneId) && f.minRodTier <= this.state.equip.rod);
    }
    if (pool.length === 0) {
      pool = [window.GAME_DATA.FISH[0], window.GAME_DATA.FISH[1]];
    }

    // If in Zone 4 + Starfall + Rod Tier >= 3 and Leviathan not yet caught, boost Leviathan weight!
    const weights = pool.map((f) => {
      let w = 10;
      if (f.rarity >= 3) w *= lureObj.rareBonus * (this.state.isPerfectCast ? 1.5 : 1.0);
      if (!this.state.dex[f.id]) w *= 1.65; // Favor uncaught species for great 10-15 min pacing!
      if (f.isBoss) w *= 3.2;
      return w;
    });

    const totalW = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalW;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  // ==================== OCTOPATH-INSPIRED SHIELD & BOOST DUEL ====================
  hookFishAndStartBattle() {
    const fish = this.state.hookedFish || this.selectFishForCurrentConditions();
    this.state.phase = 'battle';
    this.state.isReeling = false;

    document.getElementById('waiting-overlay').classList.add('hidden');
    document.getElementById('cast-gauge-overlay').classList.add('hidden');
    document.getElementById('action-prompt-box').classList.add('hidden');
    document.getElementById('zone-selector-bar').classList.add('hud-hidden');
    document.getElementById('equip-status-bar').classList.add('hud-hidden');
    document.getElementById('battle-hud').classList.remove('hidden');

    const reelObj = window.GAME_DATA.EQUIPMENT.reel.tiers[this.state.equip.reel - 1];
    const startBp = this.state.equip.rod >= 4 ? 2 : 1;

    this.state.battle = {
      fish,
      maxStamina: fish.stamina,
      stamina: fish.stamina,
      maxShields: fish.shields,
      shields: fish.shields,
      tension: 28,
      maxTension: reelObj.maxTension,
      distance: 14 + fish.rarity * 3.5,
      bp: startBp,
      bpCharge: 0,
      boostTimer: 0,
      breakTimer: 0,
      fishX: this.state.bobber.x,
      fishZ: this.state.bobber.z,
      fishDir: -1, // -1 (Left), 0 (Jump/Center), 1 (Right)
      stanceTimer: 2.2,
      counteredThisStance: false,
      isJumping: false,
      jumpProgress: 0,
      secondChanceUsed: false
    };

    window.audioEngine.setMode(fish.isBoss ? 'boss' : 'battle');
    window.spriteAtlas.renderFishToCanvas(fish.id, document.getElementById('battle-fish-icon'));

    document.getElementById('battle-fish-type').textContent = fish.archetype;
    document.getElementById('battle-fish-name').textContent = fish.name;
    this.pickNextFishStance();
    this.updateBattleHUD();
  }

  pickNextFishStance() {
    const b = this.state.battle;
    if (!b || b.breakTimer > 0) return;

    const dirs = [-1, 0, 1];
    b.fishDir = dirs[Math.floor(Math.random() * dirs.length)];
    b.stanceTimer = Math.max(1.5, 2.7 - b.fish.speed * 0.45);
    b.counteredThisStance = false;

    if (b.fishDir === 0) {
      b.isJumping = true;
      b.jumpProgress = 0;
      this.renderer.addSplash(b.fishX, b.fishZ, 18, b.fish.isBoss);
    } else {
      b.isJumping = false;
    }

    // Highlight matching counter button
    document.getElementById('btn-counter-left').classList.toggle('highlight', b.fishDir === -1);
    document.getElementById('btn-counter-up').classList.toggle('highlight', b.fishDir === 0);
    document.getElementById('btn-counter-right').classList.toggle('highlight', b.fishDir === 1);

    const arrowEl = document.getElementById('battle-stance-arrow');
    const textEl = document.getElementById('battle-stance-text');
    if (b.fishDir === -1) {
      arrowEl.textContent = '◀';
      textEl.textContent = '左へ疾走！ [A / ◀] カウンターでシールド破壊！';
    } else if (b.fishDir === 1) {
      arrowEl.textContent = '▶';
      textEl.textContent = '右へ疾走！ [D / ▶] カウンターでシールド破壊！';
    } else {
      arrowEl.textContent = '▲';
      textEl.textContent = '水面跳躍・急潜航！ [W / ▲] 合わせでシールド破壊！';
    }
  }

  performCounter(dir) {
    const b = this.state.battle;
    if (!b || this.state.phase !== 'battle') return;
    this.state.playerDir = dir;

    const pt = this.renderer.projectWaterPoint(b.fishX, b.fishZ);

    if (b.breakTimer <= 0 && !b.counteredThisStance && dir === b.fishDir) {
      // Successful Counter! Shatter 1 Shield!
      b.counteredThisStance = true;
      b.shields = Math.max(0, b.shields - 1);
      b.tension = Math.max(10, b.tension - 16);
      b.bpCharge += 0.45;
      if (b.bpCharge >= 1.0 && b.bp < 3) {
        b.bp++;
        b.bpCharge -= 1.0;
      }

      if (b.shields === 0) {
        this.triggerShieldBreak();
      } else {
        window.audioEngine.sfxShieldCrack();
        this.renderer.addSplash(b.fishX, b.fishZ, 14, true);
        this.renderer.addPopup(`🛡️ SHIELD CRACK! (${b.shields})`, pt.x, pt.y - 32, '#6ee7ff', 1.1);
      }
    } else {
      // Partial guard
      window.audioEngine.sfxTwitch();
      b.tension = Math.max(5, b.tension - 5);
    }
    this.updateBattleHUD();
  }

  triggerShieldBreak() {
    const b = this.state.battle;
    if (!b) return;
    b.breakTimer = 4.2;
    b.isJumping = false;
    b.tension = Math.max(18, b.tension * 0.45);

    window.audioEngine.sfxShieldBreak();
    this.renderer.triggerFlash('#6ee7ff', 0.55, 16);
    this.renderer.addSplash(b.fishX, b.fishZ, 32, true);

    const pt = this.renderer.projectWaterPoint(b.fishX, b.fishZ);
    this.renderer.addPopup('💥 SHIELD BREAK!! 無防備状態！', pt.x, pt.y - 44, '#ffd700', 1.45);

    document.getElementById('btn-counter-left').classList.remove('highlight');
    document.getElementById('btn-counter-up').classList.remove('highlight');
    document.getElementById('btn-counter-right').classList.remove('highlight');
    this.updateBattleHUD();
  }

  activateBoost() {
    const b = this.state.battle;
    if (!b || this.state.phase !== 'battle' || b.bp <= 0) return;

    const spentBp = b.bp;
    b.bp = 0;
    b.boostTimer = 2.8 + spentBp * 1.1;
    b.tension = Math.max(15, b.tension - 42 * spentBp);

    window.audioEngine.sfxBoost();
    this.renderer.triggerFlash('#ffd700', 0.45, 12);

    const pt = this.renderer.projectWaterPoint(b.fishX, b.fishZ);
    this.renderer.addPopup(`✨ 星凪ブースト MAX!! (BP x${spentBp})`, pt.x, pt.y - 48, '#ffd700', 1.35);

    // Strip Shields immediately!
    if (b.breakTimer <= 0 && b.shields > 0) {
      b.shields = Math.max(0, b.shields - spentBp);
      if (b.shields === 0) {
        this.triggerShieldBreak();
      }
    }
    this.updateBattleHUD();
  }

  updateBattle(dt) {
    const b = this.state.battle;
    if (!b) return;

    const rodObj = window.GAME_DATA.EQUIPMENT.rod.tiers[this.state.equip.rod - 1];
    const reelObj = window.GAME_DATA.EQUIPMENT.reel.tiers[this.state.equip.reel - 1];
    const lureObj = window.GAME_DATA.EQUIPMENT.lure.tiers[this.state.equip.lure - 1];

    // Charge BP over time
    b.bpCharge += dt * 0.18 * reelObj.bpRate;
    if (b.bpCharge >= 1.0 && b.bp < 3) {
      b.bp++;
      b.bpCharge -= 1.0;
    }

    if (b.boostTimer > 0) {
      b.boostTimer = Math.max(0, b.boostTimer - dt);
    }

    // Handle Stun / Shield Break Timer
    if (b.breakTimer > 0) {
      b.breakTimer -= dt;
      if (b.breakTimer <= 0) {
        b.shields = b.maxShields;
        this.pickNextFishStance();
      }
    } else {
      // Normal fish movement & stance switching
      b.stanceTimer -= dt;
      if (b.stanceTimer <= 0) {
        this.pickNextFishStance();
      }
      if (b.isJumping) {
        b.jumpProgress = Math.min(1, b.jumpProgress + dt * 1.6);
        if (b.jumpProgress >= 1) b.isJumping = false;
      }
      // Fish swims left/right in 3D lake
      const moveDir = b.fishDir === 0 ? Math.sin(this.renderer.time * 4) : b.fishDir;
      b.fishX = Math.max(-240, Math.min(240, b.fishX + moveDir * 55 * b.fish.speed * dt));
    }

    // Tension & Stamina Physics
    const tRatio = b.tension / b.maxTension;
    const sweetMin = 0.30 - lureObj.sweetSpotBonus * 0.5;
    const sweetMax = 0.76 + lureObj.sweetSpotBonus * 0.5;
    const inSweetZone = tRatio >= sweetMin && tRatio <= sweetMax;

    const activelyReeling = this.state.isReeling || b.boostTimer > 0;

    if (activelyReeling) {
      // Reel sound tick
      this.reelSoundTimer -= dt;
      if (this.reelSoundTimer <= 0) {
        window.audioEngine.sfxReelTick(tRatio);
        this.reelSoundTimer = 0.09;
      }

      // Calculate Stamina Damage
      let dps = rodObj.reelPower;
      if (inSweetZone) dps *= 1.35;
      if (b.breakTimer > 0) dps *= 2.4;
      if (b.boostTimer > 0) dps *= 1.75;

      b.stamina = Math.max(0, b.stamina - dps * dt);
      b.distance = Math.max(0.5, (b.stamina / b.maxStamina) * (14 + b.fish.rarity * 3.5));

      // Tension build-up while reeling
      let tensionGain = (34 * b.fish.pullPower) / rodObj.stability;
      if (b.breakTimer > 0) tensionGain *= 0.25;
      if (b.boostTimer > 0) tensionGain *= 0.35;
      if (!b.counteredThisStance && b.breakTimer <= 0) tensionGain *= 1.25;

      b.tension += tensionGain * dt;
    } else {
      // Cooling tension when not reeling
      b.tension = Math.max(8, b.tension - reelObj.coolRate * dt);
      // Fish pulls back slightly if not broken
      if (b.breakTimer <= 0) {
        b.tension += b.fish.pullPower * 9 * dt;
      }
    }

    // Periodic water splashes during fight
    if (Math.random() < dt * 3.5) {
      this.renderer.addRipple(b.fishX, b.fishZ, 38);
    }

    // Check Win Condition (Fish Stamina depleted!)
    if (b.stamina <= 0) {
      this.completeCatch(b.fish);
      return;
    }

    // Check Line Break Condition
    if (b.tension >= b.maxTension) {
      if (this.state.equip.reel >= 4 && !b.secondChanceUsed) {
        b.secondChanceUsed = true;
        b.tension = b.maxTension * 0.55;
        this.renderer.addPopup('🛡️ 星辰リールの加護！糸切れ回避！', 640, 260, '#6ee7ff', 1.25);
      } else {
        this.showToast('💥 糸のテンションが限界を超え、魚に逃げられてしまった…！[A/W/D]カウンターとブーストを活用しよう。');
        this.enterIdlePhase();
        return;
      }
    }

    this.updateBattleHUD();
  }

  updateBattleHUD() {
    const b = this.state.battle;
    if (!b) return;

    const stamPct = Math.max(0, (b.stamina / b.maxStamina) * 100);
    document.getElementById('battle-stamina-fill').style.width = `${stamPct}%`;
    document.getElementById('battle-stamina-trail').style.width = `${stamPct}%`;
    document.getElementById('battle-distance-val').textContent = b.distance.toFixed(1);

    // Shield Badge
    const shieldBadge = document.getElementById('battle-shield-badge');
    document.getElementById('battle-shield-count').textContent = b.breakTimer > 0 ? 'BREAK' : b.shields;
    shieldBadge.classList.toggle('broken', b.breakTimer > 0);

    // Stance vs Break Banner
    document.getElementById('battle-stance-box').classList.toggle('hidden', b.breakTimer > 0);
    document.getElementById('battle-break-banner').classList.toggle('hidden', b.breakTimer <= 0);

    // Tension Bar
    const tPct = Math.min(100, Math.max(0, (b.tension / b.maxTension) * 100));
    document.getElementById('battle-tension-fill').style.width = `${tPct}%`;
    document.getElementById('battle-tension-needle').style.left = `${tPct}%`;

    const tLabel = document.getElementById('tension-state-label');
    if (tPct > 82) {
      tLabel.textContent = '⚠️ DANGER!! リールを緩めるかカウンター/ブーストを！';
      tLabel.className = 'danger';
    } else if (tPct >= 28 && tPct <= 78) {
      tLabel.textContent = '✨ OPTIMAL TENSION (黄金域ボーナス発動中)';
      tLabel.className = 'optimal';
    } else {
      tLabel.textContent = 'REELING — [SPACE / 左クリック長押し] で巻き上げ';
      tLabel.className = '';
    }

    // BP Diamonds
    const gems = document.querySelectorAll('#battle-bp-diamonds .bp-gem');
    gems.forEach((g, idx) => g.classList.toggle('active', idx < b.bp));
    document.getElementById('btn-battle-boost').disabled = b.bp <= 0;
  }

  // ==================== CATCH SHOWCASE & PROGRESSION ====================
  completeCatch(fish) {
    this.state.phase = 'catch';
    this.state.isReeling = false;
    document.getElementById('battle-hud').classList.add('hidden');
    window.audioEngine.setMode('peace');
    window.audioEngine.sfxCatchFanfare(fish.rarity >= 3);

    this.renderer.triggerFlash('#fff8d6', 0.45, 8);
    this.renderer.addSplash(0, 120, 30, true);

    // Calculate Size, Weight & Rank
    const lureObj = window.GAME_DATA.EQUIPMENT.lure.tiers[this.state.equip.lure - 1];
    const sizeMult = 0.88 + Math.random() * 0.34 + (this.state.isPerfectCast ? 0.08 : 0) + (lureObj.rareBonus - 1) * 0.06;
    const sizeCm = +(fish.baseSize * sizeMult).toFixed(1);
    const weightKg = +(fish.baseWeight * Math.pow(sizeMult, 2.6)).toFixed(2);

    const isCrown = sizeMult >= 1.18 || fish.isBoss;
    const rankStr = isCrown ? '👑 GOLD CROWN' : sizeMult >= 1.05 ? 'S (大物)' : 'A (良型)';

    const isNew = !this.state.dex[fish.id];
    const goldEarned = Math.round(fish.goldReward * (isCrown ? 1.35 : 1.0));
    const shardsEarned = fish.shardReward + (isNew ? 1 : 0) + (isCrown ? 1 : 0);

    // Update Player State
    this.state.totalCatches++;
    this.state.gold += goldEarned;
    this.state.shards += shardsEarned;

    if (!this.state.dex[fish.id]) {
      this.state.dex[fish.id] = { count: 1, maxSize: sizeCm, crown: isCrown };
    } else {
      this.state.dex[fish.id].count++;
      if (sizeCm > this.state.dex[fish.id].maxSize) {
        this.state.dex[fish.id].maxSize = sizeCm;
      }
      if (isCrown) this.state.dex[fish.id].crown = true;
    }

    // Populate Catch Showcase Modal
    document.getElementById('catch-new-badge').classList.toggle('hidden', !isNew);
    document.getElementById('catch-crown-badge').classList.toggle('hidden', !isCrown);
    document.getElementById('catch-fish-name').textContent = fish.name;
    document.getElementById('catch-fish-stars').textContent = '★'.repeat(fish.rarity) + '☆'.repeat(5 - fish.rarity);
    document.getElementById('catch-size-val').textContent = `${sizeCm} cm`;
    document.getElementById('catch-weight-val').textContent = `${weightKg} kg`;
    document.getElementById('catch-rank-val').textContent = rankStr;
    document.getElementById('catch-reward-val').textContent = `+${goldEarned} G / +${shardsEarned} ✦`;
    document.getElementById('catch-fish-lore').textContent = fish.lore;

    window.spriteAtlas.renderFishToCanvas(fish.id, document.getElementById('catch-fish-canvas'));
    document.getElementById('catch-modal').classList.remove('hidden');

    // Gentle natural time progression every 3 catches
    if (this.state.totalCatches % 3 === 0 && !fish.isBoss) {
      this.state.weatherIndex = (this.state.weatherIndex + 1) % window.GAME_DATA.WEATHERS.length;
      const nw = window.GAME_DATA.WEATHERS[this.state.weatherIndex];
      this.renderer.setWeather(nw);
      window.audioEngine.setWeather(nw.id);
    }

    this.saveGame();
    this.updateHUD();
  }

  checkChapterProgression() {
    const chapters = window.GAME_DATA.CHAPTERS;
    while (this.state.chapterIndex < chapters.length) {
      const ch = chapters[this.state.chapterIndex];
      if (ch.isComplete(this.state)) {
        this.state.gold += ch.rewardGold;
        this.state.shards += ch.rewardShards;
        this.showToast(ch.clearToast);
        this.state.chapterIndex++;
        this.saveGame();
        this.updateHUD();

        // Check if Final Chapter (Lake Sovereign) was just completed!
        if (this.state.chapterIndex >= chapters.length && !this.state.endingShown) {
          this.state.endingShown = true;
          this.saveGame();
          this.showEndingModal();
          return;
        }
      } else {
        break;
      }
    }
  }

  showEndingModal() {
    this.state.phase = 'modal';
    const mins = Math.floor(this.state.playTimeSeconds / 60);
    const secs = Math.floor(this.state.playTimeSeconds % 60);
    const caughtSpecies = Object.keys(this.state.dex).length;
    const rate = Math.round((caughtSpecies / window.GAME_DATA.FISH.length) * 100);

    document.getElementById('end-playtime').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('end-dex-rate').textContent = `${rate}% (${caughtSpecies}/12種)`;
    document.getElementById('end-total-fish').textContent = `${this.state.totalCatches}匹`;
    document.getElementById('end-title-rank').textContent = caughtSpecies >= 12 ? '👑 星影の湖の神話釣師' : '🌟 星辰を統べる大釣師';

    document.getElementById('ending-modal').classList.remove('hidden');
    window.audioEngine.sfxCatchFanfare(true);
  }

  // ==================== MODALS: ENCYCLOPEDIA & WORKSHOP ====================
  openDexModal() {
    if (this.state.phase === 'battle') return;
    window.audioEngine.sfxClick();
    this.closeModals();
    this.state.phase = 'modal';

    const grid = document.getElementById('dex-list-grid');
    grid.innerHTML = '';
    const fishList = window.GAME_DATA.FISH;
    const caughtSpecies = Object.keys(this.state.dex).length;
    const rate = Math.round((caughtSpecies / fishList.length) * 100);

    document.getElementById('dex-completion-rate').textContent = `${rate}%`;
    document.getElementById('dex-caught-species').textContent = caughtSpecies;
    document.getElementById('dex-total-catches').textContent = this.state.totalCatches;

    let defaultSelectedFish = fishList[0];
    const firstCaught = fishList.find((f) => Boolean(this.state.dex[f.id]));
    if (firstCaught) defaultSelectedFish = firstCaught;

    fishList.forEach((f) => {
      const rec = this.state.dex[f.id];
      const slot = document.createElement('div');
      slot.className = `dex-slot ${rec ? 'caught' : 'uncaught'}`;
      if (f.id === defaultSelectedFish.id) slot.classList.add('selected');

      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 64;
      window.spriteAtlas.renderFishToCanvas(f.id, c);

      const nameEl = document.createElement('div');
      nameEl.className = 'dex-slot-name';
      nameEl.textContent = rec ? `${rec.crown ? '👑 ' : ''}${f.name}` : `No.${f.num} ？？？`;

      const subEl = document.createElement('div');
      subEl.className = 'dex-slot-sub';
      subEl.textContent = rec ? `最大 ${rec.maxSize}cm` : '未発見';

      slot.appendChild(c);
      slot.appendChild(nameEl);
      slot.appendChild(subEl);

      slot.addEventListener('click', () => {
        document.querySelectorAll('.dex-slot').forEach((s) => s.classList.remove('selected'));
        slot.classList.add('selected');
        this.renderDexDetail(f);
      });

      grid.appendChild(slot);
    });

    this.renderDexDetail(defaultSelectedFish);
    document.getElementById('dex-modal').classList.remove('hidden');
  }

  renderDexDetail(fish) {
    const rec = this.state.dex[fish.id];
    const dCanvas = document.getElementById('dex-detail-canvas');
    window.spriteAtlas.renderFishToCanvas(fish.id, dCanvas);
    dCanvas.style.filter = rec ? 'none' : 'brightness(0) invert(0.15) sepia(1) hue-rotate(180deg)';

    document.getElementById('dex-d-num').textContent = `SPECIMEN No.${fish.num}`;
    document.getElementById('dex-d-name').textContent = rec ? `${rec.crown ? '👑 ' : ''}${fish.name}` : '？？？ (未発見)';
    document.getElementById('dex-d-stars').textContent = '★'.repeat(fish.rarity) + '☆'.repeat(5 - fish.rarity);

    const zoneNames = fish.zones.map((z) => window.GAME_DATA.ZONES[z].name).join('・');
    const weatherNames = fish.weathers.map((wid) => {
      const wObj = window.GAME_DATA.WEATHERS.find((w) => w.id === wid);
      return wObj ? wObj.name.split(' ')[0] : wid;
    }).join('・');

    document.getElementById('dex-d-zone').textContent = `生息：${zoneNames}`;
    document.getElementById('dex-d-weather').textContent = `出現：${weatherNames}`;
    document.getElementById('dex-d-type').textContent = `性質：${fish.archetype} (🛡️${fish.shields})`;

    document.getElementById('dex-d-count').textContent = rec ? rec.count : 0;
    document.getElementById('dex-d-max').textContent = rec ? `${rec.maxSize} cm` : '— cm';
    document.getElementById('dex-d-desc').textContent = rec
      ? fish.lore
      : `【ヒント】『${zoneNames}』にて、天候が『${weatherNames}』の時に出現する気配がある（必要竿Tier: ${fish.minRodTier}以上）。`;
  }

  openShopModal() {
    if (this.state.phase === 'battle') return;
    window.audioEngine.sfxClick();
    this.closeModals();
    this.state.phase = 'modal';
    this.renderShopItems();
    document.getElementById('shop-modal').classList.remove('hidden');
  }

  renderShopItems() {
    document.getElementById('shop-gold-val').textContent = this.state.gold;
    document.getElementById('shop-shards-val').textContent = this.state.shards;

    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    ['rod', 'reel', 'lure'].forEach((catKey) => {
      const cat = window.GAME_DATA.EQUIPMENT[catKey];
      const col = document.createElement('div');
      col.className = 'shop-category-col';

      const title = document.createElement('div');
      title.className = 'shop-cat-title';
      title.textContent = cat.title;
      col.appendChild(title);

      cat.tiers.forEach((item) => {
        const isOwned = this.state.owned[catKey].includes(item.tier);
        const isEquipped = this.state.equip[catKey] === item.tier;
        const canAfford = this.state.gold >= item.costGold && this.state.shards >= item.costShards;

        const card = document.createElement('div');
        card.className = `shop-tier-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;

        const head = document.createElement('div');
        head.className = 'st-head';
        head.innerHTML = `<span>Tier ${item.tier}: ${item.name}</span><span>${isOwned ? (isEquipped ? '★装備中' : '所持') : `${item.costGold}G / ${item.costShards}✦`}</span>`;

        const desc = document.createElement('div');
        desc.className = 'st-desc';
        desc.textContent = item.desc;

        const act = document.createElement('div');
        act.className = 'st-action';

        if (!isOwned) {
          const buyBtn = document.createElement('button');
          buyBtn.className = 'ornate-btn primary small';
          buyBtn.disabled = !canAfford;
          buyBtn.style.opacity = canAfford ? '1' : '0.45';
          buyBtn.textContent = `⚒️ 鍛造する (${item.costGold}G + ${item.costShards}✦)`;
          buyBtn.addEventListener('click', () => this.buyOrEquip(catKey, item));
          act.appendChild(buyBtn);
        } else if (!isEquipped) {
          const eqBtn = document.createElement('button');
          eqBtn.className = 'ornate-btn small';
          eqBtn.textContent = '装備する';
          eqBtn.addEventListener('click', () => this.buyOrEquip(catKey, item));
          act.appendChild(eqBtn);
        }

        card.appendChild(head);
        card.appendChild(desc);
        card.appendChild(act);
        col.appendChild(card);
      });

      container.appendChild(col);
    });
  }

  buyOrEquip(catKey, item) {
    const isOwned = this.state.owned[catKey].includes(item.tier);
    if (!isOwned) {
      if (this.state.gold < item.costGold || this.state.shards < item.costShards) return;
      this.state.gold -= item.costGold;
      this.state.shards -= item.costShards;
      this.state.owned[catKey].push(item.tier);
      this.state.equip[catKey] = item.tier;
      window.audioEngine.sfxUpgrade();
      document.getElementById('orbus-dialogue-text').textContent = `「おお、『${item.name}』が見事に鍛え上がったぞ！これでさらに手強い大物とも渡り合えるはずじゃ！」`;
      this.showToast(`⚒️ 新装備『${item.name}』を鍛造・装備しました！`);
    } else {
      this.state.equip[catKey] = item.tier;
      window.audioEngine.sfxClick();
    }

    this.saveGame();
    this.renderShopItems();
    this.updateHUD();
    this.checkChapterProgression();
  }

  openHelpModal() {
    if (this.state.phase === 'battle') return;
    window.audioEngine.sfxClick();
    this.closeModals();
    this.state.phase = 'modal';
    document.getElementById('help-modal').classList.remove('hidden');
  }

  closeModals() {
    document.getElementById('dex-modal').classList.add('hidden');
    document.getElementById('shop-modal').classList.add('hidden');
    document.getElementById('help-modal').classList.add('hidden');
    if (this.state.phase === 'modal') {
      this.enterIdlePhase();
    }
  }

  // ==================== HUD & TOASTS ====================
  updateHUD() {
    const w = window.GAME_DATA.WEATHERS[this.state.weatherIndex];
    document.getElementById('hud-weather-icon').textContent = w.icon;
    document.getElementById('hud-weather-name').textContent = w.name;
    document.getElementById('hud-weather-bonus').textContent = w.bonusText;

    document.getElementById('hud-gold').textContent = this.state.gold;
    document.getElementById('hud-shards').textContent = this.state.shards;
    document.getElementById('hud-dex-count').textContent = `${Object.keys(this.state.dex).length}/12`;

    // Equipment Status Chips
    const rodObj = window.GAME_DATA.EQUIPMENT.rod.tiers[this.state.equip.rod - 1];
    const reelObj = window.GAME_DATA.EQUIPMENT.reel.tiers[this.state.equip.reel - 1];
    const lureObj = window.GAME_DATA.EQUIPMENT.lure.tiers[this.state.equip.lure - 1];
    document.getElementById('hud-rod-name').textContent = rodObj.name;
    document.getElementById('hud-reel-name').textContent = reelObj.name;
    document.getElementById('hud-lure-name').textContent = lureObj.name;

    // Chapter Banner
    const chapters = window.GAME_DATA.CHAPTERS;
    if (this.state.chapterIndex < chapters.length) {
      const ch = chapters[this.state.chapterIndex];
      document.getElementById('hud-chapter-num').textContent = ch.tag;
      document.getElementById('hud-chapter-goal').textContent = ch.getGoalText(this.state);
    } else {
      document.getElementById('hud-chapter-num').textContent = 'FREE PLAY';
      document.getElementById('hud-chapter-goal').textContent = `全12種の魚図鑑コンプリートを目指そう (${Object.keys(this.state.dex).length}/12種)`;
    }

    // Check if any upgrade is affordable to show alert dot on Workshop button
    let canBuyAny = false;
    ['rod', 'reel', 'lure'].forEach((catKey) => {
      window.GAME_DATA.EQUIPMENT[catKey].tiers.forEach((t) => {
        if (!this.state.owned[catKey].includes(t.tier) && this.state.gold >= t.costGold && this.state.shards >= t.costShards) {
          canBuyAny = true;
        }
      });
    });
    document.getElementById('hud-shop-alert').classList.toggle('hidden', !canBuyAny);
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.4s ease';
      setTimeout(() => el.remove(), 420);
    }, 3800);
  }

  // ==================== MAIN GAME LOOP ====================
  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    if (this.state.phase !== 'title') {
      this.state.playTimeSeconds += dt;
    }

    // Phase-Specific Logic Updates
    if (this.state.phase === 'charging') {
      this.state.castPower += this.state.castDir * 115 * dt;
      if (this.state.castPower >= 100) {
        this.state.castPower = 100;
        this.state.castDir = -1;
      } else if (this.state.castPower <= 0) {
        this.state.castPower = 0;
        this.state.castDir = 1;
      }
      document.getElementById('cast-bar-fill').style.width = `${this.state.castPower}%`;
      document.getElementById('cast-bar-marker').style.left = `${this.state.castPower}%`;
    } else if (this.state.phase === 'waiting') {
      this.state.bobber.dip *= 0.88;
      this.state.waitTimer -= dt;
      if (this.state.waitTimer <= 0) {
        if (this.state.nibbleCount > 0) {
          // Fish nibble!
          this.state.nibbleCount--;
          this.state.waitTimer = 0.85 + Math.random() * 0.6;
          this.state.bobber.dip = 6.5;
          window.audioEngine.sfxNibble();
          this.renderer.addRipple(this.state.bobber.x, this.state.bobber.z, 32);
          document.getElementById('waiting-status-text').textContent = '…ちょん！ 魚が浮きをつついている…！';
        } else {
          this.triggerBite();
        }
      }
    } else if (this.state.phase === 'bite') {
      this.state.biteTimer -= dt;
      // Auto-hook assist after 0.65s so players never miss a bite due to reaction lag!
      if (this.state.biteTimer <= 0.85) {
        this.hookFishAndStartBattle();
      }
    } else if (this.state.phase === 'battle') {
      this.updateBattle(dt);
    }

    this.renderer.update(dt, this.state);
    this.renderer.render(this.state);

    requestAnimationFrame((ts) => this.loop(ts));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new AstralFishingGame();
  window.game.init();
});
