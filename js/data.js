/**
 * ASTRAL WATERS — Master Game Data
 * Zones, Weather/Time States, 12 Fish Species, Equipment Upgrades, and Story Chapters
 */

window.GAME_DATA = {
  // 4 Time & Weather States
  WEATHERS: [
    {
      id: 'dusk',
      name: '黄昏 (夕凪)',
      icon: '🌇',
      bonusText: '琥珀・夕マヅメ活性 UP',
      skyTop: [22, 18, 48],
      skyMid: [118, 48, 70],
      skyHorizon: [242, 148, 78],
      fogColor: [185, 105, 72],
      fogDensity: 0.22,
      waterTint: [42, 32, 58],
      sunColor: [255, 195, 110],
      sunPos: { x: 0.68, y: 0.27 },
      godRayAlpha: 0.34,
      lanternGlow: 0.65,
      fireflyCount: 18,
      rainCount: 0,
      starCount: 35,
      auroraAlpha: 0.0
    },
    {
      id: 'night',
      name: '宵闇 (月夜)',
      icon: '🌙',
      bonusText: '夜行・月影系活性 UP',
      skyTop: [6, 9, 24],
      skyMid: [14, 24, 54],
      skyHorizon: [34, 58, 96],
      fogColor: [22, 38, 72],
      fogDensity: 0.26,
      waterTint: [10, 20, 42],
      sunColor: [210, 235, 255],
      sunPos: { x: 0.74, y: 0.19 },
      godRayAlpha: 0.18,
      lanternGlow: 1.0,
      fireflyCount: 55,
      rainCount: 0,
      starCount: 130,
      auroraAlpha: 0.0
    },
    {
      id: 'rain',
      name: '霧雨 (翠雨)',
      icon: '🌧️',
      bonusText: '渓流・雨誘い系活性 UP',
      skyTop: [14, 24, 34],
      skyMid: [28, 48, 64],
      skyHorizon: [58, 92, 108],
      fogColor: [64, 98, 112],
      fogDensity: 0.42,
      waterTint: [16, 36, 48],
      sunColor: [150, 205, 220],
      sunPos: { x: 0.55, y: 0.22 },
      godRayAlpha: 0.10,
      lanternGlow: 0.92,
      fireflyCount: 12,
      rainCount: 140,
      starCount: 0,
      auroraAlpha: 0.0
    },
    {
      id: 'starfall',
      name: '星降り (天河)',
      icon: '🌠',
      bonusText: '神秘・湖主出現条件！',
      skyTop: [8, 6, 26],
      skyMid: [28, 18, 68],
      skyHorizon: [62, 48, 118],
      fogColor: [56, 42, 108],
      fogDensity: 0.28,
      waterTint: [18, 14, 48],
      sunColor: [180, 240, 255],
      sunPos: { x: 0.72, y: 0.18 },
      godRayAlpha: 0.28,
      lanternGlow: 1.0,
      fireflyCount: 75,
      rainCount: 0,
      starCount: 200,
      auroraAlpha: 0.85
    }
  ],

  // 5 Distinct Lake Zones
  ZONES: [
    {
      id: 0,
      name: '浅瀬の葦原',
      fullName: '星影の湖 エロウエン — 浅瀬の葦原',
      depth: 1.5,
      cameraOffsetX: -140,
      cameraZoom: 1.0,
      desc: '黄金の葦と光蓮が揺れる穏やかな浅瀬。小型の魚が群れをなす。',
      castTargetX: -95,
      castTargetZ: 135
    },
    {
      id: 1,
      name: '桟橋の灯影',
      fullName: '星影の湖 エロウエン — 桟橋の灯影',
      depth: 3.0,
      cameraOffsetX: 0,
      cameraZoom: 1.0,
      desc: '石灯籠と工房の暖かな灯りが水面に映る桟橋正面。光に集まる魚が多い。',
      castTargetX: 15,
      castTargetZ: 155
    },
    {
      id: 2,
      name: '翠滝の淵',
      fullName: '星影の湖 エロウエン — 翠滝の淵',
      depth: 4.8,
      cameraOffsetX: 110,
      cameraZoom: 1.03,
      desc: '苔むした岩壁から清水が流れ込む深み。力強い渓流魚や大ナマズが潜む。',
      castTargetX: 115,
      castTargetZ: 170
    },
    {
      id: 3,
      name: '水没遺跡の回廊',
      fullName: '星影の湖 エロウエン — 水没遺跡の回廊',
      depth: 7.2,
      cameraOffsetX: -60,
      cameraZoom: 1.06,
      desc: 'いにしえの石柱とアーチが湖底に沈む神秘の回廊。古代種の縄張り。',
      castTargetX: -55,
      castTargetZ: 205
    },
    {
      id: 4,
      name: '星詠みの深淵',
      fullName: '星影の湖 エロウエン — 星詠みの深淵',
      depth: 12.0,
      cameraOffsetX: 40,
      cameraZoom: 1.10,
      desc: '星見の祠の沖合に広がる最深部。星降りの夜、伝説の『湖主』が姿を現す。',
      castTargetX: 45,
      castTargetZ: 235
    }
  ],

  // 12 Hand-Crafted Fish Species
  FISH: [
    {
      id: 'smelt',
      num: '01',
      name: '星屑ワカサギ',
      enName: 'Stardust Smelt',
      rarity: 1,
      archetype: '疾走型',
      zones: [0, 1],
      weathers: ['dusk', 'night', 'rain', 'starfall'],
      minRodTier: 1,
      baseSize: 12.5,
      baseWeight: 0.08,
      stamina: 55,
      shields: 2,
      pullPower: 0.35,
      speed: 1.1,
      goldReward: 32,
      shardReward: 0,
      palette: { body: '#c8dcff', back: '#4d73a8', belly: '#f2f7ff', fin: '#ffe89e', glow: '#9ae6ff', shape: 'slender' },
      lore: '透き通る銀鱗に星屑のような金色の斑点を持つ小魚。群れで浅瀬を泳ぎ、灯籠の光を浴びると宝石のように煌めく。'
    },
    {
      id: 'crucian',
      num: '02',
      name: '琥珀ブナ',
      enName: 'Amber Crucian',
      rarity: 1,
      archetype: '潜航型',
      zones: [0, 1, 2],
      weathers: ['dusk', 'rain'],
      minRodTier: 1,
      baseSize: 26.0,
      baseWeight: 0.65,
      stamina: 75,
      shields: 2,
      pullPower: 0.45,
      speed: 0.9,
      goldReward: 42,
      shardReward: 0,
      palette: { body: '#e69d45', back: '#7d4314', belly: '#fae0a5', fin: '#c45b24', glow: '#ffcf70', shape: 'round' },
      lore: '夕凪の陽光を閉じ込めたような琥珀色の鱗を持つフナ。葦の根元に身を潜め、穏やかな水底の藻をついばむ。'
    },
    {
      id: 'trout',
      num: '03',
      name: '翠苔マス',
      enName: 'Emerald Moss Trout',
      rarity: 2,
      archetype: '疾走型',
      zones: [0, 2],
      weathers: ['dusk', 'rain'],
      minRodTier: 1,
      baseSize: 38.5,
      baseWeight: 1.4,
      stamina: 105,
      shields: 3,
      pullPower: 0.58,
      speed: 1.35,
      goldReward: 65,
      shardReward: 1,
      palette: { body: '#4eb88a', back: '#1b5442', belly: '#d8f5e5', fin: '#f08c4b', glow: '#75ffbe', shape: 'stream' },
      lore: '翠滝から流れ込む冷たい清水を好む渓流魚。翡翠色の斑紋が美しく、針にかかると左右へ鋭く疾走する。'
    },
    {
      id: 'koi',
      num: '04',
      name: '月影コイ',
      enName: 'Moonshadow Koi',
      rarity: 2,
      archetype: '幻惑型',
      zones: [1, 3],
      weathers: ['night', 'starfall'],
      minRodTier: 1,
      baseSize: 48.0,
      baseWeight: 2.5,
      stamina: 120,
      shields: 3,
      pullPower: 0.62,
      speed: 1.05,
      goldReward: 78,
      shardReward: 1,
      palette: { body: '#e8eef7', back: '#243b6b', belly: '#ffffff', fin: '#68a4ff', glow: '#8cc5ff', shape: 'koi' },
      lore: '水面に映る月や石灯籠の灯影を慕って集まる幻想的な錦鯉。白磁のような肌と群青の模様が夜の湖に映える。'
    },
    {
      id: 'lanternfish',
      num: '05',
      name: '硝子ヒカリメ',
      enName: 'Glass Lanternfish',
      rarity: 2,
      archetype: '跳躍型',
      zones: [1, 3, 4],
      weathers: ['night', 'rain', 'starfall'],
      minRodTier: 1,
      baseSize: 29.0,
      baseWeight: 0.9,
      stamina: 110,
      shields: 3,
      pullPower: 0.55,
      speed: 1.3,
      goldReward: 72,
      shardReward: 1,
      palette: { body: '#76e5fc', back: '#1d688a', belly: '#e3fbff', fin: '#45f0df', glow: '#00ffff', shape: 'slender' },
      lore: '硝子細工のように透き通った体内に蒼い発光器官を持つ神秘の魚。夜霧の中で水面へ跳躍し、蛍火と戯れる。'
    },
    {
      id: 'char',
      num: '06',
      name: '紅蓮ヒメマス',
      enName: 'Crimson Dusk Char',
      rarity: 3,
      archetype: '跳躍型',
      zones: [2, 3],
      weathers: ['dusk'],
      minRodTier: 2,
      baseSize: 54.0,
      baseWeight: 3.1,
      stamina: 165,
      shields: 3,
      pullPower: 0.74,
      speed: 1.4,
      goldReward: 120,
      shardReward: 1,
      palette: { body: '#e84a5f', back: '#6e1423', belly: '#ffd6c9', fin: '#ffb449', glow: '#ff6b7b', shape: 'stream' },
      lore: '夕陽が湖面を紅く染める刻にのみ浮上する希少なヒメマス。燃えるような紅蓮のヒレを持ち、華麗な空中跳躍を見せる。'
    },
    {
      id: 'ribbonfish',
      num: '07',
      name: '霧雨リュウグウ',
      enName: 'Rainveil Ribbonfish',
      rarity: 3,
      archetype: '幻惑型',
      zones: [1, 2, 4],
      weathers: ['rain'],
      minRodTier: 2,
      baseSize: 82.0,
      baseWeight: 4.2,
      stamina: 185,
      shields: 4,
      pullPower: 0.78,
      speed: 1.25,
      goldReward: 145,
      shardReward: 2,
      palette: { body: '#c7b8f5', back: '#543d8a', belly: '#f4f0ff', fin: '#ff75bc', glow: '#d896ff', shape: 'ribbon' },
      lore: '霧雨が湖面を叩く日にだけ深場から姿を現す長大な魚。羽衣のようにたなびく紫銀の背ビレは天女の舞に例えられる。'
    },
    {
      id: 'arapaima',
      num: '08',
      name: '黄金カブト古代魚',
      enName: 'Gilded Armored Arapaima',
      rarity: 4,
      archetype: '剛力型',
      zones: [3],
      weathers: ['dusk', 'night'],
      minRodTier: 2,
      baseSize: 118.0,
      baseWeight: 14.5,
      stamina: 250,
      shields: 4,
      pullPower: 0.92,
      speed: 1.15,
      goldReward: 210,
      shardReward: 2,
      palette: { body: '#dfb14b', back: '#5e4310', belly: '#fff0bd', fin: '#e85d33', glow: '#ffd700', shape: 'heavy' },
      lore: '水没遺跡の石柱群を縄張りとする生ける化石。重厚な黄金の鱗甲に覆われており、並の釣り竿では太刀打ちできない剛力を誇る。'
    },
    {
      id: 'ray',
      num: '09',
      name: '蒼夜光エイ',
      enName: 'Azure Phantom Ray',
      rarity: 4,
      archetype: '潜航型',
      zones: [3, 4],
      weathers: ['night', 'starfall'],
      minRodTier: 2,
      baseSize: 96.0,
      baseWeight: 11.2,
      stamina: 240,
      shields: 4,
      pullPower: 0.88,
      speed: 1.3,
      goldReward: 225,
      shardReward: 2,
      palette: { body: '#28559c', back: '#0d1f47', belly: '#9ee7ff', fin: '#4fd3ff', glow: '#47b8ff', shape: 'ray' },
      lore: '夜空のマントを広げたように湖底を滑空する幻想の淡水エイ。背に浮かぶ星座のような発光紋が深淵を青く照らす。'
    },
    {
      id: 'catfish',
      num: '10',
      name: '翡翠龍ナマズ',
      enName: 'Jade Dragon Catfish',
      rarity: 4,
      archetype: '剛力型',
      zones: [2, 4],
      weathers: ['rain', 'night'],
      minRodTier: 3,
      baseSize: 132.0,
      baseWeight: 19.8,
      stamina: 290,
      shields: 4,
      pullPower: 0.98,
      speed: 1.2,
      goldReward: 260,
      shardReward: 3,
      palette: { body: '#2d8a78', back: '#123d36', belly: '#b8f2e6', fin: '#e6b84c', glow: '#52ffcc', shape: 'catfish' },
      lore: '翠滝の淵の主として畏れられる巨大な龍髭ナマズ。湖底へ一気に潜航する怪力を持ち、水面に大渦を巻き起こす。'
    },
    {
      id: 'salmon',
      num: '11',
      name: '天河ギンザケ',
      enName: 'Celestial Aurora Salmon',
      rarity: 5,
      archetype: '跳躍型',
      zones: [2, 3, 4],
      weathers: ['starfall'],
      minRodTier: 3,
      baseSize: 105.0,
      baseWeight: 12.6,
      stamina: 320,
      shields: 5,
      pullPower: 1.05,
      speed: 1.5,
      goldReward: 340,
      shardReward: 3,
      palette: { body: '#78d5ff', back: '#4a328a', belly: '#ffe8fa', fin: '#ff85d8', glow: '#a6fff2', shape: 'stream' },
      lore: '星降りの夜、空に架かるオーロラの輝きを宿して現れる虹色の大鮭。水面から宙へと舞い上がる姿は流星そのもの。'
    },
    {
      id: 'leviathan',
      num: '12',
      name: '【湖主】星喰らいのレヴィアタン',
      enName: 'Lake Sovereign: Astral Leviathan',
      rarity: 5,
      isBoss: true,
      archetype: '湖主・覇王型',
      zones: [4],
      weathers: ['starfall'],
      minRodTier: 3,
      baseSize: 245.0,
      baseWeight: 68.0,
      stamina: 460,
      shields: 5,
      pullPower: 1.22,
      speed: 1.55,
      goldReward: 800,
      shardReward: 8,
      palette: { body: '#3b2d78', back: '#140d36', belly: '#8ef6ff', fin: '#ffd700', glow: '#6ee7ff', shape: 'leviathan' },
      lore: '太古より星影の湖エロウエンの最深部に君臨する伝説の湖主。結晶の角と銀河を映す蒼銀の巨躯を持ち、星降りの夜に真なる釣り人の前にのみ降臨する。'
    }
  ],

  // 3 Equipment Categories x 4 Tiers
  EQUIPMENT: {
    rod: {
      title: '🎣 釣り竿 (ROD)',
      tiers: [
        {
          tier: 1,
          name: '旅人の木竿',
          reelPower: 28,
          stability: 1.0,
          maxRarity: 2,
          costGold: 0,
          costShards: 0,
          desc: 'しなやかなトネリコの木で作られた旅人用の釣り竿。小型〜中型の魚に対応。'
        },
        {
          tier: 2,
          name: '翠玉の渓流竿',
          reelPower: 44,
          stability: 1.22,
          maxRarity: 4,
          costGold: 80,
          costShards: 1,
          desc: '翡翠の魔石を継ぎ手に嵌め込んだ強化竿。巻き上げ力+55%、★4希少魚まで対応。'
        },
        {
          tier: 3,
          name: '月銀の星紋竿',
          reelPower: 68,
          stability: 1.48,
          maxRarity: 5,
          costGold: 220,
          costShards: 3,
          desc: '月銀（ミスリル）に星紋を刻んだ名竿。巻き上げ力2.4倍、★5及び【湖主】に挑める！'
        },
        {
          tier: 4,
          name: '神具・星詠みの天竿',
          reelPower: 105,
          stability: 1.85,
          maxRarity: 5,
          costGold: 480,
          costShards: 6,
          desc: '星辰の結晶から鍛えられた伝説の天竿。圧倒的な巻き上げ力と開幕BP+1を付与する。'
        }
      ]
    },
    reel: {
      title: '⚙️ リール・糸 (REEL)',
      tiers: [
        {
          tier: 1,
          name: '麻紡ぎの糸車',
          maxTension: 100,
          coolRate: 24,
          bpRate: 1.0,
          costGold: 0,
          costShards: 0,
          desc: '素朴な木製糸車。テンション（糸負荷）の上限と冷却速度は標準的。'
        },
        {
          tier: 2,
          name: '琥珀鋼の精密リール',
          maxTension: 135,
          coolRate: 32,
          bpRate: 1.25,
          costGold: 75,
          costShards: 1,
          desc: '琥珀鋼の歯車で滑らかに回転するリール。糸負荷上限+35%、冷却速度アップ。'
        },
        {
          tier: 3,
          name: '深淵絹の魔導リール',
          maxTension: 175,
          coolRate: 42,
          bpRate: 1.55,
          costGold: 200,
          costShards: 2,
          desc: '強靭な深淵蜘蛛の絹糸を巻いた魔導リール。大物の突進を抑え、BP蓄積が高速化。'
        },
        {
          tier: 4,
          name: '星辰の永久機関リール',
          maxTension: 230,
          coolRate: 56,
          bpRate: 2.0,
          costGold: 440,
          costShards: 5,
          desc: 'オルバス翁の最高傑作。糸負荷上限+130%、危機時に一度だけ糸切れを防ぐ加護を持つ。'
        }
      ]
    },
    lure: {
      title: '🎐 浮き・ルアー (LURE)',
      tiers: [
        {
          tier: 1,
          name: '蛍石の小浮き',
          biteSpeed: 1.0,
          rareBonus: 1.0,
          sweetSpotBonus: 0,
          costGold: 0,
          costShards: 0,
          desc: '淡く光る蛍石を用いた手作りの浮き。水面での視認性に優れる。'
        },
        {
          tier: 2,
          name: '月光蓮の鈴ルアー',
          biteSpeed: 1.38,
          rareBonus: 1.35,
          sweetSpotBonus: 0.05,
          costGold: 70,
          costShards: 1,
          desc: '水中で澄んだ音色を響かせる鈴付きルアー。魚が寄る速度と希少魚率が上昇。'
        },
        {
          tier: 3,
          name: '星霊の共鳴ルアー',
          biteSpeed: 1.75,
          rareBonus: 1.85,
          sweetSpotBonus: 0.10,
          costGold: 190,
          costShards: 2,
          desc: '星の波長を放つ魔導ルアー。大型・希少魚を強く惹きつけ、適正テンション域を拡大。'
        },
        {
          tier: 4,
          name: '王冠の幻影ルアー',
          biteSpeed: 2.25,
          rareBonus: 2.60,
          sweetSpotBonus: 0.16,
          costGold: 420,
          costShards: 5,
          desc: '湖の覇王を誘い出す幻影ルアー。金冠サイズ出現率大幅UP＆『湖主』の出現率最大化！'
        }
      ]
    }
  },

  // 4 Story Chapters (Designed for a crisp, rewarding 10-15 min playthrough)
  CHAPTERS: [
    {
      id: 1,
      tag: '第I章',
      title: '黄昏の旅人と最初の輝き',
      getGoalText: (state) => `湖に竿を振り、魚を2匹釣り上げよう (${Math.min(2, state.totalCatches)}/2)`,
      isComplete: (state) => state.totalCatches >= 2,
      rewardGold: 60,
      rewardShards: 1,
      clearToast: '✨ 第I章達成！報酬として +60 G・星片 +1 を獲得！工房[U]で釣具を強化しよう。'
    },
    {
      id: 2,
      tag: '第II章',
      title: '工房の灯火と装具の鍛錬',
      getGoalText: (state) => {
        const upg = (state.equip.rod > 1 || state.equip.reel > 1 || state.equip.lure > 1) ? 1 : 0;
        const species = Object.keys(state.dex).length;
        return `工房[U]で釣具を強化(${upg}/1)し、図鑑を4種以上埋めよう (${Math.min(4, species)}/4)`;
      },
      isComplete: (state) => (state.equip.rod > 1 || state.equip.reel > 1 || state.equip.lure > 1) && Object.keys(state.dex).length >= 4,
      rewardGold: 140,
      rewardShards: 2,
      clearToast: '✨ 第II章達成！報酬 +140 G・星片 +2！天候切替[T]や水没遺跡にも挑戦しよう。'
    },
    {
      id: 3,
      tag: '第III章',
      title: '移ろう天候と深淵への備え',
      getGoalText: (state) => {
        const rodOk = state.equip.rod >= 3 ? 1 : 0;
        const species = Object.keys(state.dex).length;
        return `釣り竿をTier3『月銀の星紋竿』以上に鍛え(${rodOk}/1)、図鑑を6種集めよう (${Math.min(6, species)}/6)`;
      },
      isComplete: (state) => state.equip.rod >= 3 && Object.keys(state.dex).length >= 6,
      rewardGold: 220,
      rewardShards: 3,
      clearToast: '🌠 第III章達成！ついに『星降り』の深淵で伝説の【湖主】に挑む準備が整った！'
    },
    {
      id: 4,
      tag: '終章',
      title: '星降る湖の主「レヴィアタン」',
      getGoalText: (state) => `天候[T]を『🌠星降り』にし、[5:星詠みの深淵]で【湖主】レヴィアタンを釣り上げよ！`,
      isComplete: (state) => Boolean(state.dex['leviathan'] && state.dex['leviathan'].count > 0),
      rewardGold: 500,
      rewardShards: 5,
      clearToast: '👑 終章完遂！伝説の湖主『星喰らいのレヴィアタン』を制覇した！！'
    }
  ]
};
