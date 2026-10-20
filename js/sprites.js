/**
 * ASTRAL WATERS — Procedural High-Detail Pixel Art Sprite & Texture Generator
 * Renders authentic Nearest-Neighbor pixel-art assets with dithering, rim highlights, and emissive details.
 */

class SpriteAtlas {
  constructor() {
    this.sprites = {};
    this.fishCanvases = {};
  }

  init() {
    this.generateCharacterSprites();
    this.generateCompanionSprites();
    this.generateOrbusPortrait();
    this.generateEnvironmentSprites();
    this.generateAllFishSprites();
  }

  createPixelCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { c, ctx };
  }

  px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // ==================== PROTAGONIST: LUMINA ====================
  generateCharacterSprites() {
    const poses = ['idle0', 'idle1', 'charge', 'cast', 'fightL', 'fightR', 'triumph'];
    poses.forEach((pose) => {
      const { c, ctx } = this.createPixelCanvas(48, 52);
      const bob = pose === 'idle1' ? 1 : 0;
      const leanX = pose === 'charge' ? -2 : pose === 'cast' ? 2 : pose === 'fightL' ? -3 : pose === 'fightR' ? -1 : 0;

      // Drop shadow on pier
      this.px(ctx, 14, 46, 20, 4, 'rgba(0,0,0,0.45)');

      // Boots (Leather with gold buckle)
      this.px(ctx, 18 + leanX, 41, 5, 7, '#3b2314');
      this.px(ctx, 25 + leanX, 41, 5, 7, '#29170c');
      this.px(ctx, 19 + leanX, 43, 2, 1, '#e6b85c');
      this.px(ctx, 26 + leanX, 43, 2, 1, '#e6b85c');

      // Tunic & Skirt under cloak
      this.px(ctx, 17 + leanX, 27 + bob, 14, 15, '#1e2742');
      this.px(ctx, 18 + leanX, 40 + bob, 12, 2, '#d9a74a'); // Gold hem

      // Traveler's Hooded Cloak (Deep Astral Indigo + Rim light + Gold Trim)
      const capeFlutter = (pose === 'fightL' || pose === 'cast') ? -3 : (pose === 'idle1' ? -1 : 0);
      this.px(ctx, 12 + leanX + capeFlutter, 19 + bob, 22, 20, '#162038');
      this.px(ctx, 14 + leanX + capeFlutter, 18 + bob, 19, 19, '#24365e');
      // Cloak highlight & gold trim
      this.px(ctx, 30 + leanX, 19 + bob, 2, 17, '#4c6eb0');
      this.px(ctx, 13 + leanX + capeFlutter, 37 + bob, 20, 2, '#eab657');

      // Glowing Hip Lantern
      this.px(ctx, 14 + leanX, 29 + bob, 5, 6, '#3d2b1f');
      this.px(ctx, 15 + leanX, 30 + bob, 3, 4, '#ffdf78');
      this.px(ctx, 16 + leanX, 31 + bob, 1, 2, '#ffffff');

      // Scarf (Warm Crimson-Gold)
      this.px(ctx, 17 + leanX, 17 + bob, 14, 4, '#b83748');
      this.px(ctx, 15 + leanX + capeFlutter, 19 + bob, 4, 8, '#d94b5c');
      this.px(ctx, 15 + leanX + capeFlutter, 26 + bob, 4, 1, '#f4d48c');

      // Head & Face & Auburn Hair
      this.px(ctx, 17 + leanX, 7 + bob, 14, 11, '#24365e'); // Hood back
      this.px(ctx, 19 + leanX, 9 + bob, 10, 9, '#ffe0c8'); // Face skin
      this.px(ctx, 18 + leanX, 8 + bob, 12, 4, '#8f3d2c'); // Auburn bangs
      this.px(ctx, 18 + leanX, 10 + bob, 3, 7, '#a84a36'); // Side hair lock
      // Eyes (Looking right toward lake)
      this.px(ctx, 26 + leanX, 13 + bob, 2, 2, '#1a2436');
      this.px(ctx, 26 + leanX, 13 + bob, 1, 1, '#6ee7ff'); // Astral eye glint

      // Pointed Traveler Hat / Hood Brim with Gold Star Pin
      this.px(ctx, 15 + leanX, 6 + bob, 18, 4, '#1b294a');
      this.px(ctx, 18 + leanX, 4 + bob, 12, 3, '#283d6b');
      this.px(ctx, 21 + leanX, 2 + bob, 6, 2, '#38548f');
      this.px(ctx, 28 + leanX, 6 + bob, 2, 2, '#ffd700'); // Star brooch

      // Hands / Arms
      if (pose === 'triumph') {
        this.px(ctx, 26 + leanX, 14, 4, 8, '#ffe0c8');
      } else {
        this.px(ctx, 27 + leanX, 22 + bob, 5, 4, '#ffe0c8');
      }

      this.sprites['lumina_' + pose] = c;
    });
  }

  // ==================== COMPANION: POKO (SPIRIT FOX) ====================
  generateCompanionSprites() {
    ['idle0', 'idle1', 'alert'].forEach((state) => {
      const { c, ctx } = this.createPixelCanvas(32, 32);
      const bob = state === 'idle1' ? 1 : state === 'alert' ? -2 : 0;

      // Shadow
      this.px(ctx, 8, 27, 16, 3, 'rgba(0,0,0,0.4)');

      // Fluffy Tail with Glowing Astral Tip
      this.px(ctx, 4, 15 + bob, 8, 9, '#f5efe2');
      this.px(ctx, 3, 13 + bob, 6, 5, '#f4d48c');
      this.px(ctx, 2, 11 + bob, 4, 4, '#6ee7ff'); // Spirit flame tip

      // Fox Body
      this.px(ctx, 11, 18 + bob, 11, 9, '#fff9ed');
      this.px(ctx, 12, 20 + bob, 9, 6, '#e8dcc5');

      // Head & Big Ears
      this.px(ctx, 14, 10 + bob, 10, 9, '#fff9ed');
      this.px(ctx, 15, 6 + bob, 3, 5, '#e8994a'); // Left ear
      this.px(ctx, 21, 6 + bob, 3, 5, '#e8994a'); // Right ear
      this.px(ctx, 16, 7 + bob, 1, 3, '#3b2110');
      this.px(ctx, 22, 7 + bob, 1, 3, '#3b2110');

      // Scarf & Eyes
      this.px(ctx, 13, 18 + bob, 10, 2, '#d94b5c');
      this.px(ctx, 21, 14 + bob, 2, 2, '#1c1624');
      this.px(ctx, 24, 15 + bob, 2, 1, '#ff7b89'); // Nose

      if (state === 'alert') {
        // Exclamation mark above head
        this.px(ctx, 18, 0, 2, 4, '#ffd700');
        this.px(ctx, 18, 5, 2, 1, '#ffd700');
      }

      this.sprites['poko_' + state] = c;
    });
  }

  // ==================== NPC: MASTER ORBUS ====================
  generateOrbusPortrait() {
    const { c, ctx } = this.createPixelCanvas(64, 64);
    // Background frame
    this.px(ctx, 0, 0, 64, 64, '#121829');
    // Shoulders & Apron
    this.px(ctx, 10, 42, 44, 22, '#3d291a');
    this.px(ctx, 16, 44, 32, 20, '#6e4726');
    // Beard (Magnificent Silver-Gold Braided Beard)
    this.px(ctx, 16, 28, 32, 24, '#d9d4c7');
    this.px(ctx, 20, 32, 24, 20, '#f2ede1');
    this.px(ctx, 28, 48, 8, 3, '#d9a74a'); // Beard ring
    // Face & Nose
    this.px(ctx, 18, 16, 28, 16, '#edb99b');
    this.px(ctx, 28, 23, 8, 6, '#d99173');
    // Brass Goggles / Spectacles
    this.px(ctx, 20, 19, 10, 6, '#d9a74a');
    this.px(ctx, 34, 19, 10, 6, '#d9a74a');
    this.px(ctx, 22, 20, 6, 4, '#8ce7ff');
    this.px(ctx, 36, 20, 6, 4, '#8ce7ff');
    // Artisan Cap
    this.px(ctx, 14, 8, 36, 10, '#253452');
    this.px(ctx, 18, 15, 28, 3, '#c89d54');
    this.sprites['orbus'] = c;

    const npcCanvas = document.getElementById('npc-orbus-canvas');
    if (npcCanvas) {
      const nctx = npcCanvas.getContext('2d');
      nctx.imageSmoothingEnabled = false;
      nctx.drawImage(c, 0, 0);
    }
  }

  // ==================== ENVIRONMENT & DIORAMA PROPS ====================
  generateEnvironmentSprites() {
    // 1. Stone Lantern (石灯籠)
    {
      const { c, ctx } = this.createPixelCanvas(36, 64);
      // Base pedestal
      this.px(ctx, 8, 54, 20, 8, '#3b4454');
      this.px(ctx, 10, 52, 16, 3, '#525e73');
      // Pillar
      this.px(ctx, 13, 28, 10, 24, '#455063');
      this.px(ctx, 14, 28, 4, 24, '#62708a'); // Highlight
      this.px(ctx, 13, 40, 6, 5, '#3b7a57'); // Moss patch
      // Fire Chamber
      this.px(ctx, 9, 16, 18, 12, '#363f4f');
      this.px(ctx, 12, 18, 12, 8, '#ffbe55'); // Warm lantern window
      this.px(ctx, 14, 19, 8, 6, '#fff3b8'); // Bright core
      // Pagoda Roof
      this.px(ctx, 4, 12, 28, 5, '#2d3542');
      this.px(ctx, 6, 10, 24, 3, '#4c586e');
      this.px(ctx, 11, 7, 14, 3, '#62708a');
      this.px(ctx, 16, 3, 4, 4, '#8392ab');
      this.px(ctx, 6, 11, 8, 2, '#3b7a57'); // Roof moss
      this.sprites['lantern'] = c;
    }

    // 2. Weeping Astral Willow Tree (柳・幻想樹 — Lush Organic Clustered Pixel Canopy)
    {
      const { c, ctx } = this.createPixelCanvas(148, 156);
      // Gnarled Trunk & Spreading Roots
      this.px(ctx, 64, 72, 18, 76, '#231711');
      this.px(ctx, 67, 72, 8, 74, '#3d281d');
      this.px(ctx, 72, 76, 3, 68, '#593c2b'); // Bark rim highlight
      this.px(ctx, 52, 140, 42, 8, '#1c120d');
      this.px(ctx, 56, 136, 34, 6, '#332118');
      // Branches reaching out
      this.px(ctx, 42, 54, 26, 8, '#2e1e16');
      this.px(ctx, 76, 50, 28, 8, '#2e1e16');

      // Draw organic pixel-dithered leaf spheres
      const drawFoliageCluster = (cx, cy, rx, ry) => {
        for (let y = -ry; y <= ry; y += 2) {
          for (let x = -rx; x <= rx; x += 2) {
            const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (d <= 1.0) {
              const ny = y / ry;
              let col = '#1f544e';
              if (ny < -0.45) col = (x + y) % 4 === 0 ? '#87f5d2' : '#4eb89b';
              else if (ny < 0.05) col = (x + y) % 4 === 0 ? '#4eb89b' : '#2e786b';
              else if (ny > 0.45) col = '#112928';
              this.px(ctx, cx + x, cy + y, 2, 2, col);
            }
          }
        }
      };

      drawFoliageCluster(44, 52, 28, 20);
      drawFoliageCluster(102, 50, 28, 20);
      drawFoliageCluster(72, 36, 38, 24);
      drawFoliageCluster(56, 44, 26, 18);
      drawFoliageCluster(88, 44, 26, 18);

      // Hanging willow curtains with glowing dew tips
      for (let vx = 18; vx <= 126; vx += 5) {
        const distFromCenter = Math.abs(vx - 72);
        const startY = 46 + Math.floor(distFromCenter * 0.22);
        const len = 26 + ((vx * 19) % 36);
        this.px(ctx, vx, startY, 2, len, '#1d524c');
        this.px(ctx, vx, startY + Math.floor(len * 0.5), 2, Math.floor(len * 0.5), '#368a7b');
        this.px(ctx, vx, startY + len - 5, 2, 5, '#64dec4');
        if (vx % 10 === 0) {
          this.px(ctx, vx, startY + len, 2, 2, '#b8fff0');
        }
      }
      this.sprites['tree_willow'] = c;
    }

    // 3. Golden Spirit Maple / Autumn Pine (琥珀紅葉樹 — Layered Dithered Canopy)
    {
      const { c, ctx } = this.createPixelCanvas(128, 148);
      this.px(ctx, 56, 70, 14, 74, '#24160f');
      this.px(ctx, 59, 70, 6, 72, '#42291c');
      this.px(ctx, 48, 138, 30, 6, '#1c110b');

      const drawGoldCluster = (cx, cy, rx, ry) => {
        for (let y = -ry; y <= ry; y += 2) {
          for (let x = -rx; x <= rx; x += 2) {
            const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (d <= 1.0) {
              const ny = y / ry;
              let col = '#8a4219';
              if (ny < -0.45) col = (x + y) % 4 === 0 ? '#ffe48f' : '#f5b642';
              else if (ny < 0.05) col = (x + y) % 4 === 0 ? '#f5b642' : '#cf7125';
              else if (ny > 0.45) col = '#3d1b0a';
              this.px(ctx, cx + x, cy + y, 2, 2, col);
            }
          }
        }
      };

      drawGoldCluster(38, 66, 26, 16);
      drawGoldCluster(88, 66, 26, 16);
      drawGoldCluster(63, 54, 34, 20);
      drawGoldCluster(48, 42, 24, 16);
      drawGoldCluster(78, 42, 24, 16);
      drawGoldCluster(63, 28, 24, 16);
      this.sprites['tree_gold'] = c;
    }

    // 3b. Craggy Mossy Waterfall Cliff & Star-Shrine Promontory
    {
      const { c, ctx } = this.createPixelCanvas(180, 170);
      // Craggy stepped rock formations
      const rocks = [
        { x: 10, y: 40, w: 160, h: 130 },
        { x: 24, y: 20, w: 132, h: 150 },
        { x: 42, y: 8, w: 96, h: 162 }
      ];
      rocks.forEach((rk) => {
        this.px(ctx, rk.x, rk.y, rk.w, rk.h, '#1a2333');
        this.px(ctx, rk.x + 4, rk.y, rk.w - 8, 6, '#2e5948'); // Top moss cap
      });
      // Rock striations & bevel blocks
      for (let ry = 18; ry < 162; ry += 14) {
        for (let rx = 18; rx < 152; rx += 22) {
          if (rx > 68 && rx < 106) continue; // Waterfall channel
          this.px(ctx, rx, ry, 18, 10, (rx + ry) % 4 === 0 ? '#2b3952' : '#222e42');
          this.px(ctx, rx, ry, 18, 2, '#3d4f6e');
        }
      }
      this.sprites['waterfall_cliff'] = c;
    }

    // 4. Tackle Workshop Lodge (星影の釣具工房)
    {
      const { c, ctx } = this.createPixelCanvas(168, 132);
      // Stone foundation
      this.px(ctx, 16, 98, 136, 30, '#2d3442');
      for (let x = 20; x < 146; x += 14) {
        this.px(ctx, x, 102, 11, 8, '#434d61');
        this.px(ctx, x + 4, 112, 11, 8, '#384152');
      }
      // Half-timbered walls
      this.px(ctx, 22, 54, 124, 46, '#d4c5a9');
      this.px(ctx, 22, 54, 6, 46, '#3b2416');
      this.px(ctx, 140, 54, 6, 46, '#3b2416');
      this.px(ctx, 80, 54, 6, 46, '#3b2416');
      this.px(ctx, 22, 76, 124, 5, '#3b2416');
      // Steep Shingled Roof
      for (let r = 0; r < 42; r++) {
        const w = 152 - r * 2.6;
        const col = r % 6 === 0 ? '#1c263b' : '#26344f';
        this.px(ctx, 84 - w / 2, 16 + r, w, 2, col);
      }
      // Chimney
      this.px(ctx, 116, 8, 16, 36, '#464f61');
      this.px(ctx, 114, 6, 20, 4, '#5c677d');
      // Warm Glowing Windows (Octopath trademark warm interior glow!)
      const drawWindow = (wx, wy) => {
        this.px(ctx, wx - 2, wy - 2, 24, 20, '#2e1b0f');
        this.px(ctx, wx, wy, 20, 16, '#ff9d3b');
        this.px(ctx, wx + 3, wy + 3, 14, 10, '#ffe896');
        this.px(ctx, wx + 9, wy, 2, 16, '#2e1b0f');
        this.px(ctx, wx, wy + 7, 20, 2, '#2e1b0f');
      };
      drawWindow(36, 62);
      drawWindow(102, 62);
      // Hanging Sign & Lantern
      this.px(ctx, 62, 66, 16, 32, '#4a2e1b'); // Door
      this.px(ctx, 8, 60, 16, 3, '#3b2416');
      this.px(ctx, 10, 63, 8, 10, '#ffcf66');
      this.sprites['lodge'] = c;
    }

    // 5. Ancient Sunken Ruins Arch (水没遺跡の石門)
    {
      const { c, ctx } = this.createPixelCanvas(120, 130);
      // Pillars
      this.px(ctx, 18, 30, 22, 98, '#394559');
      this.px(ctx, 80, 30, 22, 98, '#2d3747');
      // Highlight bevels
      this.px(ctx, 20, 30, 5, 95, '#627491');
      this.px(ctx, 82, 30, 5, 95, '#52627a');
      // Top Arch
      this.px(ctx, 12, 18, 96, 16, '#394559');
      this.px(ctx, 22, 10, 76, 10, '#4f5f78');
      // Glowing Astral Runes carved into stone
      const runeY = [45, 62, 79, 96];
      runeY.forEach((ry) => {
        this.px(ctx, 26, ry, 6, 6, '#6ee7ff');
        this.px(ctx, 88, ry, 6, 6, '#6ee7ff');
      });
      // Creeping moss
      this.px(ctx, 16, 22, 28, 8, '#2e6e56');
      this.px(ctx, 76, 32, 24, 10, '#2e6e56');
      this.sprites['ruin_arch'] = c;
    }

    // 6. Shoreline Reeds & Glowing Lotus
    {
      const { c, ctx } = this.createPixelCanvas(48, 52);
      const stalks = [8, 14, 21, 27, 34, 40];
      stalks.forEach((sx, i) => {
        const h = 28 + (i % 3) * 7;
        this.px(ctx, sx, 50 - h, 2, h, i % 2 === 0 ? '#3a664c' : '#588547');
        if (i % 2 === 0) {
          this.px(ctx, sx - 1, 50 - h - 6, 4, 8, '#6e4726'); // Cattail head
          this.px(ctx, sx, 50 - h - 7, 2, 2, '#d9a74a');
        }
      });
      this.sprites['reeds'] = c;
    }

    {
      const { c, ctx } = this.createPixelCanvas(32, 20);
      this.px(ctx, 4, 10, 24, 6, '#265c4b');
      this.px(ctx, 6, 9, 20, 5, '#3b856b');
      // Glowing Crystal Lotus Blossom
      this.px(ctx, 11, 5, 10, 6, '#94f0ff');
      this.px(ctx, 13, 3, 6, 6, '#ffffff');
      this.px(ctx, 15, 5, 2, 2, '#ffd700');
      this.sprites['lotus'] = c;
    }
  }

  // ==================== 12 HAND-CRAFTED PIXEL ART FISH ====================
  generateAllFishSprites() {
    window.GAME_DATA.FISH.forEach((fish) => {
      const { c, ctx } = this.createPixelCanvas(96, 64);
      this.drawFishPixelArt(ctx, fish, 96, 64);
      this.fishCanvases[fish.id] = c;
    });
  }

  drawFishPixelArt(ctx, fish, W, H) {
    const p = fish.palette;
    const cx = W * 0.48;
    const cy = H * 0.52;

    let rx = 26, ry = 11;
    if (p.shape === 'slender') { rx = 24; ry = 7; }
    else if (p.shape === 'round') { rx = 22; ry = 14; }
    else if (p.shape === 'stream') { rx = 28; ry = 10; }
    else if (p.shape === 'koi') { rx = 27; ry = 12; }
    else if (p.shape === 'ribbon') { rx = 34; ry = 8; }
    else if (p.shape === 'heavy') { rx = 32; ry = 14; }
    else if (p.shape === 'ray') { rx = 28; ry = 17; }
    else if (p.shape === 'catfish') { rx = 31; ry = 13; }
    else if (p.shape === 'leviathan') { rx = 36; ry = 15; }

    // 1. Caudal (Tail) Fin & Dorsal/Ventral Fins
    for (let x = -18; x <= 0; x++) {
      const spread = Math.abs(x) * (p.shape === 'ribbon' || p.shape === 'leviathan' ? 0.95 : 0.72);
      for (let y = -spread; y <= spread; y++) {
        if (Math.abs(y) > 2 || x > -8) {
          this.px(ctx, cx - rx + x + 3, cy + y, 1, 1, (x + y) % 2 === 0 ? p.fin : p.glow);
        }
      }
    }

    // Dorsal Fin
    const dorsalW = p.shape === 'ribbon' || p.shape === 'leviathan' ? rx * 1.3 : rx * 0.7;
    const dorsalH = p.shape === 'ribbon' || p.shape === 'leviathan' ? 11 : 7;
    for (let dx = -dorsalW / 2; dx < dorsalW / 2; dx++) {
      for (let dy = 0; dy < dorsalH; dy++) {
        const taper = 1 - dy / dorsalH;
        if (Math.abs(dx) <= (dorsalW / 2) * taper) {
          this.px(ctx, cx + dx - 3, cy - ry - dy + 2, 1, 1, dy > dorsalH - 3 ? p.glow : p.fin);
        }
      }
    }

    // Ventral / Pectoral Fins
    for (let fx = 0; fx < 10; fx++) {
      for (let fy = 0; fy < 7; fy++) {
        if (fx + fy < 11) {
          this.px(ctx, cx + 2 - fx, cy + ry * 0.5 + fy, 1, 1, p.fin);
        }
      }
    }

    // 2. Main Pixel-Dithered Body
    for (let x = -rx; x <= rx; x++) {
      const normX = x / rx;
      const halfH = Math.round(ry * Math.sqrt(Math.max(0, 1 - normX * normX)));
      for (let y = -halfH; y <= halfH; y++) {
        const normY = y / (halfH || 1);
        let col = p.body;

        // Dorsal dark back with pixel dithering
        if (normY < -0.35 || (normY < -0.15 && (x + y) % 2 === 0)) {
          col = p.back;
        } else if (normY > 0.42 || (normY > 0.22 && (x + y) % 2 === 0)) {
          col = p.belly;
        }

        // Scale shimmer pattern every 4px
        if (Math.abs(normX) < 0.72 && x % 4 === 0 && y % 3 === 0) {
          col = p.glow;
        }

        // Special Koi markings
        if (p.shape === 'koi' && ((x > -8 && x < 4 && y < 2) || (x > 8 && x < 16 && y < 0))) {
          col = p.back;
        }

        this.px(ctx, cx + x, cy + y, 1, 1, col);
      }
    }

    // 3. Whiskers for Catfish / Leviathan Crystal Horns
    if (p.shape === 'catfish' || p.shape === 'leviathan') {
      for (let w = 0; w < 12; w++) {
        this.px(ctx, cx + rx - 2 + w * 0.8, cy + 3 + w * 0.5, 1, 1, p.fin);
      }
    }
    if (p.shape === 'leviathan') {
      // Majestic Astral Crown Horns
      for (let h = 0; h < 12; h++) {
        this.px(ctx, cx + rx - 6 - h * 0.6, cy - ry + 2 - h * 0.9, 2, 2, '#6ee7ff');
        this.px(ctx, cx + rx - 10 - h * 0.7, cy - ry + 3 - h * 0.7, 2, 2, '#ffd700');
      }
    }

    // 4. Gleaming Eye
    const eyeX = Math.round(cx + rx * 0.62);
    const eyeY = Math.round(cy - ry * 0.22);
    this.px(ctx, eyeX - 2, eyeY - 2, 4, 4, '#ffffff');
    this.px(ctx, eyeX - 1, eyeY - 1, 3, 3, '#0b1021');
    this.px(ctx, eyeX, eyeY - 1, 1, 1, fish.isBoss ? '#6ee7ff' : '#ffd700');
  }

  renderFishToCanvas(fishId, targetCanvas) {
    if (!targetCanvas) return;
    const src = this.fishCanvases[fishId];
    if (!src) return;
    const ctx = targetCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(src, 0, 0, targetCanvas.width, targetCanvas.height);
  }
}

window.spriteAtlas = new SpriteAtlas();
