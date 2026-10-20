/**
 * ASTRAL WATERS — HD-2D Diorama & Shader-Style Post-Processing Renderer
 * Combines Nearest-Neighbor 2D Pixel Art with 3D Perspective Projection, Planar Water Reflections,
 * Volumetric God Rays, Dynamic Point Lighting, Weather Particles, and Tilt-Shift Depth of Field.
 */

class HD2DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;   // 1280
    this.H = canvas.height;  // 720
    this.horizonY = 318;     // Waterline horizon

    // Offscreen Scene Buffer used to generate real-time planar water reflections & bloom
    this.upperBuffer = document.createElement('canvas');
    this.upperBuffer.width = this.W;
    this.upperBuffer.height = this.horizonY + 40;
    this.uCtx = this.upperBuffer.getContext('2d');

    // Low-res Bloom Buffer for authentic HD-2D soft glow
    this.bloomBuffer = document.createElement('canvas');
    this.bloomBuffer.width = 320;
    this.bloomBuffer.height = 180;
    this.bCtx = this.bloomBuffer.getContext('2d');

    this.time = 0;

    // Camera Choreography State
    this.cam = {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetX: 0,
      targetY: 0,
      targetZoom: 1.0,
      shake: 0,
      flashAlpha: 0,
      flashColor: '#ffffff'
    };

    // Weather Interpolation State
    this.curWeather = JSON.parse(JSON.stringify(window.GAME_DATA.WEATHERS[0]));
    this.targetWeather = window.GAME_DATA.WEATHERS[0];

    // Environmental Entities
    this.stars = [];
    this.clouds = [];
    this.fireflies = [];
    this.raindrops = [];
    this.ripples = [];
    this.splashes = [];
    this.popups = [];
    this.underwaterFish = [];
    this.foregroundBokeh = [];

    this.initSceneEntities();
  }

  initSceneEntities() {
    // 200 Twinkling Stars
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * 1800 - 260,
        y: Math.random() * (this.horizonY - 35),
        size: Math.random() < 0.2 ? 3 : 2,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 3.0,
        color: i % 5 === 0 ? '#9be8ff' : i % 7 === 0 ? '#ffe6a3' : '#ffffff'
      });
    }

    // Drifting Pixel Clouds
    for (let i = 0; i < 9; i++) {
      this.clouds.push({
        x: i * 240 - 300,
        y: 38 + (i % 3) * 42,
        w: 150 + (i % 4) * 55,
        h: 22 + (i % 2) * 12,
        speed: 4 + (i % 3) * 2.5
      });
    }

    // 80 3D Fireflies / Astral Motes
    for (let i = 0; i < 80; i++) {
      this.fireflies.push({
        x: Math.random() * 1600 - 160,
        y: 150 + Math.random() * 480,
        z: 0.4 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 10,
        phase: Math.random() * Math.PI * 2,
        isAstral: i % 3 === 0
      });
    }

    // 150 Raindrops
    for (let i = 0; i < 150; i++) {
      this.raindrops.push({
        x: Math.random() * 1500 - 100,
        y: Math.random() * 720,
        speed: 540 + Math.random() * 240,
        len: 16 + Math.random() * 14
      });
    }

    // 16 Ambient Underwater Fish Silhouettes across the lake
    for (let i = 0; i < 16; i++) {
      this.underwaterFish.push({
        x: (Math.random() - 0.5) * 900,
        z: 90 + Math.random() * 180,
        angle: Math.random() * Math.PI * 2,
        speed: 14 + Math.random() * 18,
        size: 0.75 + Math.random() * 0.9,
        isRare: i % 5 === 0,
        tailPhase: Math.random() * Math.PI * 2
      });
    }

    // Foreground Out-of-Focus Bokeh Orbs (Tilt-shift DoF signature)
    for (let i = 0; i < 14; i++) {
      this.foregroundBokeh.push({
        x: Math.random() * 1280,
        y: i < 5 ? Math.random() * 90 : 590 + Math.random() * 130,
        r: 22 + Math.random() * 38,
        phase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 12
      });
    }
  }

  setWeather(weatherObj) {
    this.targetWeather = weatherObj;
  }

  addRipple(worldX, worldZ, maxRadius = 46, color = 'rgba(215, 242, 255, 0.75)') {
    this.ripples.push({
      x: worldX,
      z: worldZ,
      r: 3,
      maxR: maxRadius,
      alpha: 0.95,
      color
    });
  }

  addSplash(worldX, worldZ, count = 18, isGold = false) {
    this.addRipple(worldX, worldZ, 68, isGold ? 'rgba(255, 225, 130, 0.9)' : 'rgba(200, 240, 255, 0.85)');
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const spd = 65 + Math.random() * 155;
      this.splashes.push({
        x: worldX,
        z: worldZ,
        yOffset: 0,
        vx: Math.cos(ang) * spd * 0.7,
        vy: Math.sin(ang) * spd,
        gravity: 360,
        size: 2 + Math.floor(Math.random() * 3),
        color: isGold
          ? (i % 2 === 0 ? '#ffd700' : '#6ee7ff')
          : (i % 2 === 0 ? '#ffffff' : '#9be8ff'),
        life: 0.55 + Math.random() * 0.35
      });
    }
  }

  addPopup(text, screenX, screenY, color = '#f4d48c', scale = 1.0) {
    this.popups.push({
      text,
      x: screenX,
      y: screenY,
      vy: -38,
      alpha: 1.0,
      color,
      scale
    });
  }

  triggerFlash(color = '#ffffff', alpha = 0.55, shake = 12) {
    this.cam.flashColor = color;
    this.cam.flashAlpha = alpha;
    this.cam.shake = Math.max(this.cam.shake, shake);
  }

  // Project 3D Lake coordinates (worldX, worldZ) onto 2D screen coordinates
  projectWaterPoint(worldX, worldZ) {
    // worldZ goes from 60 (near shore) to 280 (far water)
    const normZ = Math.max(0.05, Math.min(1.0, (worldZ - 45) / 240));
    // Perspective foreshortening
    const perspectiveY = this.horizonY + Math.pow(normZ, 0.78) * (this.H - this.horizonY - 25);
    const scale = 0.38 + Math.pow(normZ, 0.82) * 0.92;
    const screenX = this.W * 0.5 + (worldX - this.cam.x) * scale;
    return { x: screenX, y: perspectiveY, scale };
  }

  update(dt, gameState) {
    this.time += dt;

    // Smoothly interpolate weather parameters
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpArr = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
    const wt = Math.min(1, dt * 2.2);
    this.curWeather.skyTop = lerpArr(this.curWeather.skyTop, this.targetWeather.skyTop, wt);
    this.curWeather.skyMid = lerpArr(this.curWeather.skyMid, this.targetWeather.skyMid, wt);
    this.curWeather.skyHorizon = lerpArr(this.curWeather.skyHorizon, this.targetWeather.skyHorizon, wt);
    this.curWeather.fogColor = lerpArr(this.curWeather.fogColor, this.targetWeather.fogColor, wt);
    this.curWeather.waterTint = lerpArr(this.curWeather.waterTint, this.targetWeather.waterTint, wt);
    this.curWeather.sunColor = lerpArr(this.curWeather.sunColor, this.targetWeather.sunColor, wt);
    this.curWeather.fogDensity = lerp(this.curWeather.fogDensity, this.targetWeather.fogDensity, wt);
    this.curWeather.godRayAlpha = lerp(this.curWeather.godRayAlpha, this.targetWeather.godRayAlpha, wt);
    this.curWeather.lanternGlow = lerp(this.curWeather.lanternGlow, this.targetWeather.lanternGlow, wt);
    this.curWeather.auroraAlpha = lerp(this.curWeather.auroraAlpha, this.targetWeather.auroraAlpha, wt);
    this.curWeather.sunPos.x = lerp(this.curWeather.sunPos.x, this.targetWeather.sunPos.x, wt);
    this.curWeather.sunPos.y = lerp(this.curWeather.sunPos.y, this.targetWeather.sunPos.y, wt);

    // Camera target choreography based on game phase
    const zone = window.GAME_DATA.ZONES[gameState.currentZone] || window.GAME_DATA.ZONES[1];
    if (gameState.phase === 'title') {
      this.cam.targetX = Math.sin(this.time * 0.22) * 75;
      this.cam.targetY = 0;
      this.cam.targetZoom = 1.03;
    } else if (gameState.phase === 'idle' || gameState.phase === 'charging') {
      this.cam.targetX = zone.cameraOffsetX;
      this.cam.targetY = 0;
      this.cam.targetZoom = gameState.phase === 'charging' ? 1.06 : zone.cameraZoom;
    } else if (gameState.phase === 'waiting' || gameState.phase === 'bite') {
      this.cam.targetX = zone.castTargetX * 0.55;
      this.cam.targetY = 18;
      this.cam.targetZoom = gameState.phase === 'bite' ? 1.16 : 1.09;
    } else if (gameState.phase === 'battle') {
      const b = gameState.battle;
      this.cam.targetX = (b ? b.fishX * 0.48 : 0);
      this.cam.targetY = 24;
      this.cam.targetZoom = (b && b.breakTimer > 0) ? 1.18 : 1.12;
    } else if (gameState.phase === 'catch') {
      this.cam.targetX = -55;
      this.cam.targetY = -8;
      this.cam.targetZoom = 1.10;
    }

    this.cam.x = lerp(this.cam.x, this.cam.targetX, Math.min(1, dt * 3.8));
    this.cam.y = lerp(this.cam.y, this.cam.targetY, Math.min(1, dt * 3.8));
    this.cam.zoom = lerp(this.cam.zoom, this.cam.targetZoom, Math.min(1, dt * 3.5));

    if (this.cam.shake > 0) {
      this.cam.shake = Math.max(0, this.cam.shake - dt * 28);
    }
    if (this.cam.flashAlpha > 0) {
      this.cam.flashAlpha = Math.max(0, this.cam.flashAlpha - dt * 1.9);
    }

    // Update clouds
    this.clouds.forEach((c) => {
      c.x += c.speed * dt;
      if (c.x > 1600) c.x = -350;
    });

    // Update underwater fish silhouettes
    const hasBobber = gameState.phase === 'waiting' || gameState.phase === 'bite';
    this.underwaterFish.forEach((f) => {
      f.tailPhase += dt * (f.isRare ? 9 : 6.5);
      if (hasBobber) {
        const dx = gameState.bobber.x - f.x;
        const dz = gameState.bobber.z - f.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 140 && dist > 10) {
          const targetAng = Math.atan2(dz, dx);
          f.angle = lerp(f.angle, targetAng, dt * 1.8);
        }
      }
      f.x += Math.cos(f.angle) * f.speed * dt;
      f.z += Math.sin(f.angle) * f.speed * 0.45 * dt;

      if (f.x < -420) { f.x = -420; f.angle = 0; }
      if (f.x > 420) { f.x = 420; f.angle = Math.PI; }
      if (f.z < 75) { f.z = 75; f.angle = Math.PI * 0.5; }
      if (f.z > 265) { f.z = 265; f.angle = -Math.PI * 0.5; }
    });

    // Update Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i];
      rp.r += dt * 38;
      rp.alpha -= dt * 0.72;
      if (rp.alpha <= 0 || rp.r >= rp.maxR) {
        this.ripples.splice(i, 1);
      }
    }

    // Update 3D Water Splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.x += sp.vx * dt;
      sp.yOffset += sp.vy * dt;
      sp.vy += sp.gravity * dt;
      sp.life -= dt;
      if (sp.life <= 0 || sp.yOffset > 8) {
        this.splashes.splice(i, 1);
      }
    }

    // Update Floating Popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.y += p.vy * dt;
      p.vy *= 0.94;
      p.alpha -= dt * 0.75;
      if (p.alpha <= 0) {
        this.popups.splice(i, 1);
      }
    }

    // Update Fireflies
    this.fireflies.forEach((ff) => {
      ff.x += ff.vx * dt + Math.sin(this.time * 1.5 + ff.phase) * 10 * dt;
      ff.y += ff.vy * dt + Math.cos(this.time * 1.2 + ff.phase) * 8 * dt;
      if (ff.x < -150) ff.x = 1430;
      if (ff.x > 1430) ff.x = -150;
      if (ff.y < 100) ff.y = 660;
      if (ff.y > 680) ff.y = 120;
    });

    // Update Raindrops & spawn rain ripples
    if (this.targetWeather.rainCount > 0) {
      this.raindrops.forEach((rd) => {
        rd.x -= 95 * dt;
        rd.y += rd.speed * dt;
        if (rd.y > this.H) {
          rd.y = -20;
          rd.x = Math.random() * 1500 - 100;
          if (Math.random() < 0.22 && this.ripples.length < 36) {
            this.addRipple((Math.random() - 0.5) * 650, 75 + Math.random() * 190, 22, 'rgba(180, 225, 245, 0.45)');
          }
        }
      });
    }
  }

  // ==================== MAIN RENDER PASS ====================
  render(gameState) {
    const ctx = this.ctx;
    ctx.save();

    // Apply camera zoom & screen shake
    const shakeX = this.cam.shake > 0 ? (Math.random() - 0.5) * this.cam.shake : 0;
    const shakeY = this.cam.shake > 0 ? (Math.random() - 0.5) * this.cam.shake : 0;

    ctx.translate(this.W * 0.5 + shakeX, this.H * 0.5 + shakeY);
    ctx.scale(this.cam.zoom, this.cam.zoom);
    ctx.translate(-this.W * 0.5, -this.H * 0.5 - this.cam.y * 0.35);

    // 1. Render Sky, Celestial Bodies, Aurora, Mountains & Shoreline Diorama into upperBuffer
    this.renderUpperDiorama(this.uCtx, gameState);

    // Draw upper diorama onto main canvas
    ctx.drawImage(this.upperBuffer, 0, 0);

    // 2. Render 3D Perspective Lake Water with Real-Time Planar Reflection & Wave Distortion
    this.renderReflectiveLakeWater(ctx, gameState);

    // 3. Render Pier, Protagonist Lumina, Companion Poko, Lanterns, Fishing Line & Bobber/Fish Fight
    this.renderMidgroundPierAndCharacters(ctx, gameState);

    // 4. Render Volumetric God Rays & Dynamic Point Light Halos
    this.renderLightingAndGodRays(ctx, gameState);

    // 5. Render Atmospheric Weather Particles (Fireflies, Rain, Mist)
    this.renderWeatherAndParticles(ctx, gameState);

    // 6. Render Tilt-Shift Foreground Silhouette Frame & Soft Bokeh Orbs
    this.renderForegroundTiltShiftDoF(ctx);

    ctx.restore();

    // 7. Screen-Space Post-Processing: Soft Bloom, Popups & Impact Flash
    this.renderPostProcessingAndPopups(ctx, gameState);
  }

  // ==================== PASS 1: SKY, MOUNTAINS & SHORELINE DIORAMA ====================
  renderUpperDiorama(uCtx, gameState) {
    const w = this.curWeather;
    const rgb = (arr, a = 1) => `rgba(${arr[0]},${arr[1]},${arr[2]},${a})`;

    // Sky Gradient
    const skyGrad = uCtx.createLinearGradient(0, 0, 0, this.horizonY);
    skyGrad.addColorStop(0, rgb(w.skyTop));
    skyGrad.addColorStop(0.58, rgb(w.skyMid));
    skyGrad.addColorStop(1, rgb(w.skyHorizon));
    uCtx.fillStyle = skyGrad;
    uCtx.fillRect(0, 0, this.W, this.horizonY + 30);

    // Stars (visible at night, dusk, starfall)
    const starAlpha = this.targetWeather.id === 'starfall' ? 1.0 : this.targetWeather.id === 'night' ? 0.85 : this.targetWeather.id === 'dusk' ? 0.35 : 0;
    if (starAlpha > 0.02) {
      this.stars.forEach((st) => {
        const twinkle = 0.45 + 0.55 * Math.sin(this.time * st.speed + st.phase);
        uCtx.fillStyle = st.color;
        uCtx.globalAlpha = starAlpha * twinkle;
        const sx = st.x - this.cam.x * 0.08;
        uCtx.fillRect(Math.round(sx), Math.round(st.y), st.size, st.size);
      });
      uCtx.globalAlpha = 1.0;
    }

    // Celestial Aurora Curtains (in Starfall weather!)
    if (w.auroraAlpha > 0.02) {
      uCtx.save();
      uCtx.globalCompositeOperation = 'screen';
      for (let band = 0; band < 3; band++) {
        const grad = uCtx.createLinearGradient(0, 20 + band * 25, 0, 195 + band * 25);
        grad.addColorStop(0, 'rgba(110, 231, 255, 0)');
        grad.addColorStop(0.45, band === 1 ? `rgba(195, 125, 255, ${0.32 * w.auroraAlpha})` : `rgba(90, 245, 205, ${0.36 * w.auroraAlpha})`);
        grad.addColorStop(1, 'rgba(244, 212, 140, 0)');
        uCtx.fillStyle = grad;

        uCtx.beginPath();
        for (let x = 0; x <= this.W; x += 16) {
          const waveY = 85 + band * 24 + Math.sin(x * 0.008 + this.time * 0.9 + band * 1.7) * 28 + Math.cos(x * 0.018 - this.time * 0.6) * 14;
          if (x === 0) uCtx.moveTo(x, waveY);
          else uCtx.lineTo(x, waveY);
        }
        uCtx.lineTo(this.W, 230);
        uCtx.lineTo(0, 230);
        uCtx.closePath();
        uCtx.fill();
      }
      uCtx.restore();
    }

    // Celestial Orb (Setting Sun or Luminous Crescent/Full Moon)
    const sunX = this.W * w.sunPos.x - this.cam.x * 0.12;
    const sunY = this.horizonY * w.sunPos.y + 35;
    const sunHalo = uCtx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 135);
    sunHalo.addColorStop(0, rgb(w.sunColor, 0.95));
    sunHalo.addColorStop(0.28, rgb(w.sunColor, 0.38));
    sunHalo.addColorStop(1, rgb(w.sunColor, 0));
    uCtx.fillStyle = sunHalo;
    uCtx.fillRect(sunX - 140, sunY - 140, 280, 280);

    // Crisp Pixel Celestial Disc
    uCtx.fillStyle = '#fffdf2';
    uCtx.beginPath();
    uCtx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    uCtx.fill();

    // Drifting Layered Pixel Clouds
    this.clouds.forEach((c) => {
      const cx = Math.round(c.x - this.cam.x * 0.16);
      const cy = Math.round(c.y);
      uCtx.fillStyle = rgb(w.skyHorizon, 0.22);
      uCtx.fillRect(cx + 18, cy, c.w - 36, c.h);
      uCtx.fillRect(cx + 6, cy + 5, c.w - 12, c.h - 6);
      uCtx.fillRect(cx, cy + 9, c.w, c.h - 11);
      // Sunlit top rim
      uCtx.fillStyle = rgb(w.sunColor, 0.28);
      uCtx.fillRect(cx + 22, cy - 3, c.w - 44, 4);
      uCtx.fillRect(cx + 10, cy + 2, c.w - 24, 3);
    });

    // Layer 1: Far Background Blurred Mountain Silhouettes (Tilt-Shift Depth)
    this.drawMountainRange(uCtx, 0.22, 145, 0.85, [
      Math.round(w.skyMid[0] * 0.45),
      Math.round(w.skyMid[1] * 0.45),
      Math.round(w.skyMid[2] * 0.55)
    ]);

    // Layer 2: Mid-Distance Forested Sanctuary Peaks & Cathedral Ruins
    this.drawMountainRange(uCtx, 0.38, 95, 1.35, [
      Math.round(w.skyTop[0] * 0.7 + 12),
      Math.round(w.skyTop[1] * 0.7 + 18),
      Math.round(w.skyTop[2] * 0.7 + 26)
    ]);

    // Distant Waterfall Cliff (Right side - Zone 2: 翠滝の淵)
    const wfX = 875 - this.cam.x * 0.52;
    const cliffSprite = window.spriteAtlas.sprites['waterfall_cliff'];
    uCtx.imageSmoothingEnabled = false;
    if (cliffSprite) {
      uCtx.drawImage(cliffSprite, Math.round(wfX - 90), 152, 180, 170);
    }

    // Animated Pixel Waterfall Stream & Foaming Base Mist
    for (let wy = 164; wy < this.horizonY + 6; wy += 4) {
      const shimmer = Math.sin(wy * 0.25 - this.time * 14) * 2.5;
      uCtx.fillStyle = (wy + Math.floor(this.time * 24)) % 8 < 4 ? '#88e2ff' : '#e3fbff';
      uCtx.fillRect(Math.round(wfX - 13 + shimmer), wy, 24, 4);
      uCtx.fillStyle = '#ffffff';
      uCtx.fillRect(Math.round(wfX - 6 - shimmer * 0.6), wy, 8, 2);
    }
    // Waterfall base mist puff
    uCtx.fillStyle = 'rgba(210, 245, 255, 0.45)';
    uCtx.fillRect(Math.round(wfX - 28), this.horizonY - 10, 56, 10);
    uCtx.fillRect(Math.round(wfX - 20), this.horizonY - 16, 40, 6);

    // Sunken Ruins Arches in Midground (Left-Center - Zone 3: 水没遺跡)
    const archSprite = window.spriteAtlas.sprites['ruin_arch'];
    if (archSprite) {
      uCtx.imageSmoothingEnabled = false;
      const rx1 = 360 - this.cam.x * 0.58;
      const rx2 = 510 - this.cam.x * 0.52;
      uCtx.drawImage(archSprite, Math.round(rx1), this.horizonY - 96, 96, 104);
      uCtx.drawImage(archSprite, Math.round(rx2), this.horizonY - 82, 82, 90);
    }

    // Horizon Atmospheric Mist Band (HD-2D Depth Fog)
    const mistGrad = uCtx.createLinearGradient(0, this.horizonY - 55, 0, this.horizonY + 12);
    mistGrad.addColorStop(0, rgb(w.fogColor, 0));
    mistGrad.addColorStop(0.7, rgb(w.fogColor, w.fogDensity));
    mistGrad.addColorStop(1, rgb(w.fogColor, w.fogDensity * 1.25));
    uCtx.fillStyle = mistGrad;
    uCtx.fillRect(0, this.horizonY - 55, this.W, 70);

    // Near-Shoreline Trees, Tackle Lodge & Lanterns
    uCtx.imageSmoothingEnabled = false;
    const sway = Math.sin(this.time * 1.6) * 2.5;
    const willow = window.spriteAtlas.sprites['tree_willow'];
    const goldTree = window.spriteAtlas.sprites['tree_gold'];
    const lodge = window.spriteAtlas.sprites['lodge'];
    const lantern = window.spriteAtlas.sprites['lantern'];

    const shoreShift = -this.cam.x * 0.72;
    if (goldTree) {
      uCtx.drawImage(goldTree, Math.round(65 + shoreShift + sway * 0.5), this.horizonY - 128, 120, 140);
      uCtx.drawImage(goldTree, Math.round(990 + shoreShift - sway * 0.5), this.horizonY - 122, 115, 134);
    }
    if (lodge) {
      uCtx.drawImage(lodge, Math.round(145 + shoreShift), this.horizonY - 116, 168, 132);
    }
    if (willow) {
      uCtx.drawImage(willow, Math.round(285 + shoreShift + sway), this.horizonY - 132, 140, 150);
      uCtx.drawImage(willow, Math.round(730 + shoreShift + sway), this.horizonY - 126, 132, 142);
      uCtx.drawImage(willow, Math.round(1080 + shoreShift + sway), this.horizonY - 134, 144, 152);
    }
    if (lantern) {
      uCtx.drawImage(lantern, Math.round(312 + shoreShift), this.horizonY - 48, 32, 56);
      uCtx.drawImage(lantern, Math.round(710 + shoreShift), this.horizonY - 48, 32, 56);
    }

    // Shoreline stone embankment
    uCtx.fillStyle = '#182030';
    uCtx.fillRect(0, this.horizonY - 6, this.W, 12);
    for (let sx = 0; sx < this.W; sx += 24) {
      uCtx.fillStyle = sx % 48 === 0 ? '#2c3852' : '#222b40';
      uCtx.fillRect(sx, this.horizonY - 5, 20, 8);
    }
  }

  drawMountainRange(uCtx, parallax, maxH, freq, rgbArr) {
    uCtx.fillStyle = `rgb(${rgbArr[0]},${rgbArr[1]},${rgbArr[2]})`;
    uCtx.beginPath();
    uCtx.moveTo(0, this.horizonY);
    for (let x = 0; x <= this.W; x += 8) {
      const wx = x + this.cam.x * parallax;
      const h =
        Math.sin(wx * 0.0045 * freq + 1.2) * (maxH * 0.45) +
        Math.cos(wx * 0.011 * freq) * (maxH * 0.28) +
        Math.sin(wx * 0.023 * freq) * (maxH * 0.12) +
        maxH * 0.55;
      // Quantize to 3px steps for crisp pixel-art silhouette
      const qY = Math.round((this.horizonY - Math.max(12, h)) / 3) * 3;
      uCtx.lineTo(x, qY);
    }
    uCtx.lineTo(this.W, this.horizonY);
    uCtx.closePath();
    uCtx.fill();
  }

  // ==================== PASS 2: 3D PERSPECTIVE REFLECTIVE WATER ====================
  renderReflectiveLakeWater(ctx, gameState) {
    const w = this.curWeather;
    const waterH = this.H - this.horizonY;

    // Base deep water gradient
    const waterGrad = ctx.createLinearGradient(0, this.horizonY, 0, this.H);
    waterGrad.addColorStop(0, `rgb(${w.fogColor[0]}, ${w.fogColor[1]}, ${w.fogColor[2]})`);
    waterGrad.addColorStop(0.22, `rgb(${w.waterTint[0] + 16}, ${w.waterTint[1] + 24}, ${w.waterTint[2] + 38})`);
    waterGrad.addColorStop(0.75, `rgb(${w.waterTint[0]}, ${w.waterTint[1]}, ${w.waterTint[2]})`);
    waterGrad.addColorStop(1, '#040710');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, this.horizonY, this.W, waterH + 40);

    // Planar Reflection Pass: Draw horizontal strips of upperBuffer flipped vertically with wave displacement!
    ctx.save();
    for (let y = 0; y < waterH; y += 3) {
      const depthRatio = y / waterH; // 0 at horizon, 1 at bottom foreground
      const srcY = Math.floor(this.horizonY - 2 - y * 0.72);
      if (srcY >= 0 && srcY < this.horizonY) {
        const waveFreq = 0.16 / (0.15 + depthRatio);
        const waveAmp = (2.2 + depthRatio * 14) * (this.targetWeather.id === 'rain' ? 1.45 : 1.0);
        const dx = Math.sin(y * waveFreq + this.time * 4.2) * waveAmp;

        ctx.globalAlpha = Math.max(0.08, 0.56 - depthRatio * 0.45);
        ctx.drawImage(
          this.upperBuffer,
          0, srcY, this.W, 3,
          dx, this.horizonY + y, this.W, 3
        );
      }
    }
    ctx.restore();

    // Sun/Moon Specular Shimmer Path on the Water
    const sunX = this.W * w.sunPos.x - this.cam.x * 0.12;
    ctx.save();
    for (let y = 4; y < waterH; y += 6) {
      const depthRatio = y / waterH;
      const spread = 16 + depthRatio * 120;
      const shimmerX = sunX + Math.sin(y * 0.22 - this.time * 5.5) * spread * 0.45;
      const lineW = 8 + Math.abs(Math.cos(y * 0.31 + this.time * 3.1)) * (18 + depthRatio * 36);
      ctx.fillStyle = `rgba(${w.sunColor[0]}, ${w.sunColor[1]}, ${w.sunColor[2]}, ${0.38 - depthRatio * 0.22})`;
      ctx.fillRect(Math.round(shimmerX - lineW * 0.5), this.horizonY + y, Math.round(lineW), 2);
    }
    ctx.restore();

    // Underwater 3D Fish Silhouettes
    this.underwaterFish.forEach((f) => {
      const pt = this.projectWaterPoint(f.x, f.z);
      if (pt.x < -50 || pt.x > this.W + 50) return;
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.scale(pt.scale * f.size, pt.scale * f.size * 0.52);
      ctx.rotate(Math.cos(f.angle) < 0 ? Math.PI : 0);

      const wag = Math.sin(f.tailPhase) * 3.5;
      ctx.fillStyle = f.isRare ? 'rgba(90, 225, 255, 0.34)' : 'rgba(6, 12, 24, 0.48)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-23, -6 + wag);
      ctx.lineTo(-23, 6 + wag);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Shoreline Crystal Lotus Pads & Reeds
    const lotus = window.spriteAtlas.sprites['lotus'];
    const reeds = window.spriteAtlas.sprites['reeds'];
    ctx.imageSmoothingEnabled = false;
    const lotusCoords = [
      { x: -240, z: 78 }, { x: -195, z: 92 }, { x: -150, z: 84 },
      { x: 185, z: 88 }, { x: 240, z: 96 }, { x: -75, z: 72 }
    ];
    lotusCoords.forEach((lc) => {
      const pt = this.projectWaterPoint(lc.x, lc.z);
      if (lotus) {
        const s = pt.scale * 1.25;
        ctx.drawImage(lotus, Math.round(pt.x - 16 * s), Math.round(pt.y - 10 * s), Math.round(32 * s), Math.round(20 * s));
      }
    });
    const reedCoords = [
      { x: -280, z: 68 }, { x: -250, z: 74 }, { x: -215, z: 66 },
      { x: 260, z: 70 }, { x: 295, z: 78 }
    ];
    reedCoords.forEach((rc) => {
      const pt = this.projectWaterPoint(rc.x, rc.z);
      if (reeds) {
        const s = pt.scale * 1.4;
        ctx.drawImage(reeds, Math.round(pt.x - 24 * s), Math.round(pt.y - 46 * s), Math.round(48 * s), Math.round(52 * s));
      }
    });

    // 3D Perspective Concentric Ripples
    this.ripples.forEach((rp) => {
      const pt = this.projectWaterPoint(rp.x, rp.z);
      ctx.save();
      ctx.strokeStyle = rp.color;
      ctx.globalAlpha = Math.max(0, rp.alpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, rp.r * pt.scale, rp.r * pt.scale * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ==================== PASS 3: PIER, CHARACTERS, ROD, BOBBER & FISH DUEL ====================
  renderMidgroundPierAndCharacters(ctx, gameState) {
    ctx.imageSmoothingEnabled = false;
    const pierScreenX = 365 - this.cam.x * 0.85;
    const pierScreenY = 395;

    // 1. Wooden Pier Reflection in Water
    ctx.fillStyle = 'rgba(10, 12, 20, 0.55)';
    ctx.fillRect(Math.round(pierScreenX - 130), pierScreenY + 28, 220, 48);

    // 2. Wooden Support Pilings & Weathered Cedar Planks
    const postPositions = [-115, -65, -15, 35, 78];
    postPositions.forEach((px) => {
      ctx.fillStyle = '#1d130d';
      ctx.fillRect(Math.round(pierScreenX + px), pierScreenY + 8, 12, 52);
      ctx.fillStyle = '#332218';
      ctx.fillRect(Math.round(pierScreenX + px + 2), pierScreenY + 8, 4, 48);
    });

    // Pier Deck & Planks with Rim Highlight
    ctx.fillStyle = '#291a12';
    ctx.fillRect(Math.round(pierScreenX - 140), pierScreenY - 8, 232, 22);
    for (let kx = -136; kx < 88; kx += 12) {
      ctx.fillStyle = kx % 24 === 0 ? '#4d3322' : '#3d281b';
      ctx.fillRect(Math.round(pierScreenX + kx), pierScreenY - 8, 10, 16);
      // Warm rim light on top plank edge
      ctx.fillStyle = '#7d5638';
      ctx.fillRect(Math.round(pierScreenX + kx), pierScreenY - 8, 10, 3);
    }

    // Pier Lantern Post ("Astral Bell & Lantern")
    const lanternSprite = window.spriteAtlas.sprites['lantern'];
    if (lanternSprite) {
      ctx.drawImage(lanternSprite, Math.round(pierScreenX - 88), pierScreenY - 78, 44, 76);
    }

    // 3. Spirit Fox Companion: Poko
    const pokoKey = gameState.phase === 'bite' || gameState.phase === 'battle'
      ? 'poko_alert'
      : (Math.floor(this.time * 2.2) % 2 === 0 ? 'poko_idle0' : 'poko_idle1');
    const pokoSprite = window.spriteAtlas.sprites[pokoKey];
    if (pokoSprite) {
      const jumpY = gameState.phase === 'catch' ? Math.abs(Math.sin(this.time * 8)) * -10 : 0;
      ctx.drawImage(pokoSprite, Math.round(pierScreenX - 38), Math.round(pierScreenY - 52 + jumpY), 48, 48);
    }

    // 4. Protagonist: Lumina
    let luminaKey = Math.floor(this.time * 2) % 2 === 0 ? 'lumina_idle0' : 'lumina_idle1';
    if (gameState.phase === 'charging') luminaKey = 'lumina_charge';
    else if (gameState.phase === 'waiting' || gameState.phase === 'bite') luminaKey = 'lumina_cast';
    else if (gameState.phase === 'battle') {
      luminaKey = gameState.playerDir < 0 ? 'lumina_fightL' : 'lumina_fightR';
    } else if (gameState.phase === 'catch') {
      luminaKey = 'lumina_triumph';
    }
    const luminaSprite = window.spriteAtlas.sprites[luminaKey];
    const luminaX = pierScreenX + 26;
    const luminaY = pierScreenY - 78;
    if (luminaSprite) {
      ctx.drawImage(luminaSprite, Math.round(luminaX), Math.round(luminaY), 72, 78);
    }

    // 5. Fishing Rod, Glowing Line, Reticle, Bobber & Fighting Fish!
    this.renderRodAndFishingAction(ctx, gameState, luminaX + 46, luminaY + 36);

    // 6. 3D Water Droplet Splashes
    this.splashes.forEach((sp) => {
      const pt = this.projectWaterPoint(sp.x, sp.z);
      ctx.fillStyle = sp.color;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y + sp.yOffset), sp.size, sp.size);
    });
  }

  renderRodAndFishingAction(ctx, gameState, handX, handY) {
    const zone = window.GAME_DATA.ZONES[gameState.currentZone] || window.GAME_DATA.ZONES[1];
    const rodTier = gameState.equip.rod;
    const rodColor = rodTier === 4 ? '#6ee7ff' : rodTier === 3 ? '#e2e8f0' : rodTier === 2 ? '#5be8a6' : '#c89d54';

    // Aiming Target Reticle on Water in Idle/Charging Phase
    if (gameState.phase === 'idle' || gameState.phase === 'charging') {
      const targetPt = this.projectWaterPoint(zone.castTargetX, zone.castTargetZ);
      const pulse = 1 + Math.sin(this.time * 4) * 0.12;
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 212, 140, 0.72)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.ellipse(targetPt.x, targetPt.y, 28 * pulse, 11 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating zone marker label on water
      ctx.fillStyle = 'rgba(244, 212, 140, 0.9)';
      ctx.font = 'bold 11px "Shippori Mincho", serif';
      ctx.textAlign = 'center';
      ctx.fillText(`▼ ${zone.name}`, targetPt.x, targetPt.y - 16);
      ctx.restore();
    }

    // Calculate Rod Tip Position
    let tipX = handX + 52;
    let tipY = handY - 38 + Math.sin(this.time * 2) * 2;
    if (gameState.phase === 'charging') {
      tipX = handX - 28;
      tipY = handY - 46;
    } else if (gameState.phase === 'battle' && gameState.battle) {
      const b = gameState.battle;
      tipX = handX + 42 + gameState.playerDir * 16;
      tipY = handY - 26 + (b.tension / b.maxTension) * 22;
    }

    // Draw Curved Rod with Bezier
    ctx.save();
    ctx.strokeStyle = rodColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo((handX + tipX) * 0.5, tipY - 14, tipX, tipY);
    ctx.stroke();

    // Glowing Rod Tip Gem
    ctx.fillStyle = rodTier >= 3 ? '#6ee7ff' : '#ffd700';
    ctx.fillRect(Math.round(tipX - 2), Math.round(tipY - 2), 4, 4);

    // Draw Fishing Line & Bobber/Fish if Casted
    if (gameState.phase === 'waiting' || gameState.phase === 'bite') {
      const bobPt = this.projectWaterPoint(gameState.bobber.x, gameState.bobber.z);
      const bobDip = gameState.phase === 'bite' ? 9 : Math.sin(this.time * 4.5) * 2.5 + gameState.bobber.dip;

      // Slack curved line to bobber
      ctx.strokeStyle = 'rgba(225, 240, 255, 0.68)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo((tipX + bobPt.x) * 0.5, Math.max(tipY, bobPt.y) + 12, bobPt.x, bobPt.y + bobDip);
      ctx.stroke();

      // Pixel Bobber with Fluorite Glow
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(Math.round(bobPt.x - 4), Math.round(bobPt.y + bobDip - 7), 8, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(bobPt.x - 3), Math.round(bobPt.y + bobDip - 2), 6, 4);
      ctx.fillStyle = '#6ee7ff';
      ctx.fillRect(Math.round(bobPt.x - 1), Math.round(bobPt.y + bobDip - 11), 2, 4);

      if (gameState.phase === 'bite') {
        // Dramatic HIT! Indicator over Bobber
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px "Cinzel", serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ HIT!!', bobPt.x, bobPt.y - 24);
      }
    } else if (gameState.phase === 'battle' && gameState.battle) {
      const b = gameState.battle;
      const fishPt = this.projectWaterPoint(b.fishX, b.fishZ);
      const jumpOffset = b.isJumping ? -Math.abs(Math.sin(b.jumpProgress * Math.PI)) * 68 : 0;

      // Taut Fishing Line (glows gold in optimal tension, crimson in danger!)
      const tRatio = b.tension / b.maxTension;
      ctx.strokeStyle = tRatio > 0.82 ? '#ff5768' : tRatio > 0.35 ? '#ffd700' : '#9be8ff';
      ctx.lineWidth = tRatio > 0.75 ? 2.2 : 1.6;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(fishPt.x, fishPt.y + jumpOffset);
      ctx.stroke();

      // Fighting Fish Silhouette / Leaping Sprite in 3D Water!
      const fishCanvas = window.spriteAtlas.fishCanvases[b.fish.id];
      if (fishCanvas) {
        ctx.save();
        ctx.translate(fishPt.x, fishPt.y + jumpOffset);
        const fScale = fishPt.scale * (b.fish.isBoss ? 1.35 : 0.95);
        if (b.fishDir < 0) ctx.scale(-fScale, fScale);
        else ctx.scale(fScale, fScale);

        if (!b.isJumping && b.breakTimer <= 0) {
          ctx.globalAlpha = 0.78;
        }
        ctx.drawImage(fishCanvas, -48, -32, 96, 64);
        ctx.restore();
      }

      // Stunned Stars when SHIELD BROKEN!
      if (b.breakTimer > 0) {
        for (let s = 0; s < 4; s++) {
          const ang = this.time * 5 + (s * Math.PI) / 2;
          const sx = fishPt.x + Math.cos(ang) * 28;
          const sy = fishPt.y - 18 + Math.sin(ang) * 9;
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(Math.round(sx - 2), Math.round(sy - 2), 5, 5);
        }
      }
    }
    ctx.restore();
  }

  // ==================== PASS 4: VOLUMETRIC GOD RAYS & POINT LIGHT HALOS ====================
  renderLightingAndGodRays(ctx, gameState) {
    const w = this.curWeather;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Volumetric God Rays (Crepuscular Rays from Sun/Moon)
    if (w.godRayAlpha > 0.02) {
      const sunX = this.W * w.sunPos.x - this.cam.x * 0.12;
      const sunY = this.horizonY * w.sunPos.y + 20;
      for (let i = -3; i <= 3; i++) {
        const angleSpread = i * 165 + Math.sin(this.time * 0.4 + i) * 35;
        const rayGrad = ctx.createLinearGradient(sunX, sunY, sunX + angleSpread, this.H * 0.85);
        rayGrad.addColorStop(0, `rgba(${w.sunColor[0]}, ${w.sunColor[1]}, ${w.sunColor[2]}, ${w.godRayAlpha * 0.48})`);
        rayGrad.addColorStop(0.65, `rgba(${w.sunColor[0]}, ${w.sunColor[1]}, ${w.sunColor[2]}, ${w.godRayAlpha * 0.16})`);
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(sunX - 18, sunY);
        ctx.lineTo(sunX + 18, sunY);
        ctx.lineTo(sunX + angleSpread + 95, this.H * 0.88);
        ctx.lineTo(sunX + angleSpread - 95, this.H * 0.88);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. Warm HD-2D Point Lights (Lanterns, Lodge Windows, Poko's Tail, Lumina's Hip Lantern)
    const drawPointLight = (x, y, radius, r, g, b, alpha) => {
      const flicker = 0.92 + 0.08 * Math.sin(this.time * 9 + x * 0.1);
      const grad = ctx.createRadialGradient(x, y, 2, x, y, radius * flicker);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.42})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    const lg = w.lanternGlow;
    const shoreShift = -this.cam.x * 0.72;
    const pierScreenX = 365 - this.cam.x * 0.85;

    // Lodge glowing windows & shore lanterns + water reflections
    drawPointLight(190 + shoreShift, this.horizonY - 45, 78, 255, 175, 75, 0.55 * lg);
    drawPointLight(255 + shoreShift, this.horizonY - 45, 78, 255, 175, 75, 0.55 * lg);
    drawPointLight(328 + shoreShift, this.horizonY - 26, 68, 255, 190, 90, 0.62 * lg);
    drawPointLight(726 + shoreShift, this.horizonY - 26, 68, 255, 190, 90, 0.62 * lg);
    // Water reflection of shore lanterns
    drawPointLight(225 + shoreShift, this.horizonY + 38, 85, 255, 165, 65, 0.35 * lg);
    drawPointLight(328 + shoreShift, this.horizonY + 28, 65, 255, 180, 80, 0.35 * lg);

    // Pier Lantern & Water Glow
    drawPointLight(pierScreenX - 66, 342, 95, 255, 195, 95, 0.72 * lg);
    drawPointLight(pierScreenX - 66, 435, 85, 255, 175, 75, 0.42 * lg);

    // Lumina's Hip Lantern & Poko's Spirit Tail
    drawPointLight(pierScreenX + 52, 365, 58, 255, 210, 115, 0.58);
    drawPointLight(pierScreenX - 28, 362, 46, 110, 231, 255, 0.52);

    ctx.restore();
  }

  // ==================== PASS 5: WEATHER PARTICLES (FIREFLIES, RAIN, MIST) ====================
  renderWeatherAndParticles(ctx, gameState) {
    const tw = this.targetWeather;
    ctx.save();

    // Fireflies & Astral Stardust Motes
    const activeFF = tw.fireflyCount;
    for (let i = 0; i < activeFF && i < this.fireflies.length; i++) {
      const ff = this.fireflies[i];
      const pulse = 0.35 + 0.65 * Math.sin(this.time * 3.5 + ff.phase);
      const fx = ff.x - this.cam.x * (0.4 + ff.z * 0.3);
      const fy = ff.y;

      ctx.globalCompositeOperation = 'screen';
      const r = 8 * ff.z;
      const grad = ctx.createRadialGradient(fx, fy, 1, fx, fy, r);
      if (ff.isAstral || tw.id === 'starfall') {
        grad.addColorStop(0, `rgba(160, 245, 255, ${0.9 * pulse})`);
        grad.addColorStop(1, 'rgba(110, 231, 255, 0)');
      } else {
        grad.addColorStop(0, `rgba(255, 230, 120, ${0.9 * pulse})`);
        grad.addColorStop(1, 'rgba(255, 175, 50, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(fx - r, fy - r, r * 2, r * 2);

      // Crisp pixel core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = pulse;
      ctx.fillRect(Math.round(fx - 1), Math.round(fy - 1), 2, 2);
    }

    // Rain Streaks
    if (tw.rainCount > 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(185, 225, 245, 0.42)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < tw.rainCount && i < this.raindrops.length; i++) {
        const rd = this.raindrops[i];
        ctx.moveTo(rd.x, rd.y);
        ctx.lineTo(rd.x - 4, rd.y + rd.len);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==================== PASS 6: TILT-SHIFT FOREGROUND DOF & BOKEH ====================
  renderForegroundTiltShiftDoF(ctx) {
    ctx.save();

    // Top & Bottom Dark Tilt-Shift Vignette Blur Gradients (Mimics wide-aperture diorama lens)
    const topDoF = ctx.createLinearGradient(0, 0, 0, 88);
    topDoF.addColorStop(0, 'rgba(4, 6, 14, 0.72)');
    topDoF.addColorStop(1, 'rgba(4, 6, 14, 0)');
    ctx.fillStyle = topDoF;
    ctx.fillRect(0, 0, this.W, 88);

    const botDoF = ctx.createLinearGradient(0, this.H - 105, 0, this.H);
    botDoF.addColorStop(0, 'rgba(4, 6, 14, 0)');
    botDoF.addColorStop(1, 'rgba(4, 6, 14, 0.82)');
    ctx.fillStyle = botDoF;
    ctx.fillRect(0, this.H - 105, this.W, 105);

    // Out-of-Focus Foreground Silhouette Reeds & Overhanging Branches at screen corners
    const fgShift = -this.cam.x * 1.35;
    ctx.fillStyle = 'rgba(5, 8, 16, 0.85)';
    // Bottom-left foreground boulder & reeds
    ctx.beginPath();
    ctx.ellipse(90 + fgShift * 0.2, this.H + 10, 165, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bottom-right foreground boulder
    ctx.beginPath();
    ctx.ellipse(this.W - 80 + fgShift * 0.2, this.H + 12, 185, 64, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft Foreground Out-of-Focus Bokeh Light Orbs
    ctx.globalCompositeOperation = 'screen';
    this.foregroundBokeh.forEach((bk) => {
      const bx = (bk.x + Math.sin(this.time * 0.5 + bk.phase) * 28 - this.cam.x * 1.2 + this.W * 2) % this.W;
      const by = bk.y + Math.cos(this.time * 0.4 + bk.phase) * 8;
      const alpha = 0.05 + 0.04 * Math.sin(this.time * 1.1 + bk.phase);
      const grad = ctx.createRadialGradient(bx, by, bk.r * 0.2, bx, by, bk.r);
      grad.addColorStop(0, `rgba(244, 212, 140, ${alpha})`);
      grad.addColorStop(0.75, `rgba(244, 212, 140, ${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(244, 212, 140, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, bk.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // ==================== PASS 7: POST-PROCESSING BLOOM, POPUPS & FLASH ====================
  renderPostProcessingAndPopups(ctx, gameState) {
    // Low-Res Soft Bloom Composite
    this.bCtx.clearRect(0, 0, 320, 180);
    this.bCtx.drawImage(this.canvas, 0, 0, 320, 180);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.18;
    ctx.drawImage(this.bloomBuffer, 0, 0, this.W, this.H);
    ctx.restore();

    // Screen Flash (on HIT!, SHIELD BREAK!, BOOST!)
    if (this.cam.flashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = this.cam.flashColor;
      ctx.globalAlpha = this.cam.flashAlpha;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();
    }

    // Floating Combat / Action Popups
    ctx.save();
    this.popups.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.font = `800 ${Math.round(18 * p.scale)}px "Cinzel", "Shippori Mincho", serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(p.text, p.x + 2, p.y + 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.restore();
  }
}

window.HD2DRenderer = HD2DRenderer;
