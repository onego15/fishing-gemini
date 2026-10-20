/**
 * ASTRAL WATERS — WebAudio Dynamic Soundtrack & Tactile SFX Engine
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    this.mode = 'peace'; // 'peace' | 'battle' | 'boss'
    this.weather = 'dusk';
    this.stepIndex = 0;
    this.seqTimer = null;
    this.noiseBuffer = null;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);

      // Create 2-second white/pink noise buffer for water/rain/splash SFX
      const sr = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, sr * 2, sr);
      const out = this.noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < out.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        out[i] = (b0 + b1 + b2 + white * 0.18) * 0.35;
      }

      this.initialized = true;
      this.startSequencer();
    } catch (e) {
      console.warn('WebAudio init skipped:', e);
    }
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime, 0.08);
    }
    return this.muted;
  }

  setMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.stepIndex = 0;
    }
  }

  setWeather(weatherId) {
    this.weather = weatherId;
  }

  startSequencer() {
    if (this.seqTimer) clearInterval(this.seqTimer);
    // 220ms tick (~136 BPM eighth notes)
    this.seqTimer = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      this.tickMusic();
    }, 230);
  }

  tickMusic() {
    const s = this.stepIndex++;
    if (this.mode === 'peace') {
      // Serene D-dorian / F-maj7 HD-2D chamber harp & flute
      const arpNotes = [
        293.66, 349.23, 440.00, 523.25, 659.25, 523.25, 440.00, 349.23,
        261.63, 329.63, 392.00, 493.88, 587.33, 493.88, 392.00, 329.63,
        220.00, 261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63,
        246.94, 293.66, 369.99, 440.00, 523.25, 440.00, 369.99, 293.66
      ];
      if (s % 2 === 0) {
        const note = arpNotes[(s / 2) % arpNotes.length];
        this.playTone(note, 'triangle', 0.045, 0.55, 0.01);
      }
      // Expressive flute melody every 8 steps
      const melody = [587.33, 0, 659.25, 523.25, 440.00, 0, 523.25, 392.00];
      if (s % 4 === 0) {
        const mNote = melody[(s / 4) % melody.length];
        if (mNote > 0) {
          this.playTone(mNote, 'sine', 0.055, 0.9, 0.08);
        }
      }
      // Subtle rain or water wash
      if (this.weather === 'rain' && s % 3 === 0) {
        this.playNoiseBurst(0.015, 0.25, 1600);
      }
    } else if (this.mode === 'battle' || this.mode === 'boss') {
      const isBoss = this.mode === 'boss';
      const bassLine = isBoss
        ? [146.83, 146.83, 174.61, 164.81, 130.81, 130.81, 196.00, 185.00]
        : [146.83, 220.00, 146.83, 220.00, 130.81, 196.00, 164.81, 220.00];
      const bass = bassLine[s % bassLine.length];
      this.playTone(bass, 'sawtooth', 0.04, 0.18, 0.005, 650);

      const leadScale = isBoss
        ? [587.33, 698.46, 880.00, 830.61, 698.46, 659.25, 587.33, 554.37]
        : [440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 392.00];
      if (s % 2 === 0) {
        const ln = leadScale[(s / 2) % leadScale.length];
        this.playTone(ln, 'triangle', 0.06, 0.28, 0.01);
      }
    }
  }

  playTone(freq, type = 'sine', vol = 0.1, duration = 0.25, attack = 0.01, filterFreq = 0) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      if (filterFreq > 0) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, now);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }

  playNoiseBurst(vol = 0.1, duration = 0.2, bandpassFreq = 900) {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    try {
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(bandpassFreq, now);
      filter.Q.value = 1.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(now);
      src.stop(now + duration);
    } catch (e) {}
  }

  // --- Specific Game SFX ---
  sfxClick() {
    this.init();
    this.playTone(740, 'triangle', 0.08, 0.07, 0.004);
    this.playTone(1110, 'sine', 0.05, 0.09, 0.01);
  }

  sfxCast(isPerfect = false) {
    this.init();
    this.playNoiseBurst(0.18, 0.22, 1200);
    if (isPerfect) {
      this.playTone(587.33, 'triangle', 0.12, 0.25, 0.01);
      setTimeout(() => this.playTone(880, 'sine', 0.14, 0.35, 0.01), 65);
      setTimeout(() => this.playTone(1174.66, 'sine', 0.12, 0.4, 0.01), 130);
    }
  }

  sfxWaterPlop() {
    this.init();
    this.playTone(220, 'sine', 0.14, 0.16, 0.005);
    setTimeout(() => this.playTone(360, 'sine', 0.11, 0.18, 0.005), 45);
    this.playNoiseBurst(0.14, 0.24, 650);
  }

  sfxTwitch() {
    this.init();
    this.playTone(480, 'sine', 0.07, 0.12, 0.005);
    this.playNoiseBurst(0.06, 0.12, 850);
  }

  sfxNibble() {
    this.init();
    this.playTone(520, 'triangle', 0.09, 0.08, 0.003);
  }

  sfxHit() {
    this.init();
    this.playNoiseBurst(0.26, 0.32, 800);
    [440, 554.37, 659.25, 880].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.12, 0.32, 0.005, 2200), idx * 35);
    });
  }

  sfxShieldCrack() {
    this.init();
    this.playNoiseBurst(0.2, 0.15, 2400);
    this.playTone(987.77, 'sine', 0.15, 0.18, 0.003);
    setTimeout(() => this.playTone(1318.5, 'triangle', 0.15, 0.24, 0.003), 45);
  }

  sfxShieldBreak() {
    this.init();
    // Iconic HD-2D crystalline glass shatter + low impact boom
    this.playNoiseBurst(0.35, 0.45, 2800);
    this.playTone(110, 'sawtooth', 0.24, 0.55, 0.005, 400);
    [1174.66, 1396.91, 1760, 2093].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.16, 0.45, 0.003), i * 40);
    });
  }

  sfxBoost() {
    this.init();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.14, 0.38, 0.01), i * 38);
    });
  }

  sfxReelTick(tensionRatio = 0.3) {
    if (this.muted || !this.ctx) return;
    const freq = 300 + tensionRatio * 620;
    this.playTone(freq, 'triangle', 0.035, 0.045, 0.002);
  }

  sfxCatchFanfare(isRare = false) {
    this.init();
    const notes = isRare
      ? [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5, 1318.5]
      : [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.15, 0.45, 0.01), i * 95);
    });
  }

  sfxUpgrade() {
    this.init();
    this.playNoiseBurst(0.18, 0.14, 1900);
    [587.33, 880, 1174.66].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.14, 0.3, 0.005), i * 70);
    });
  }

  sfxBellChime() {
    this.init();
    this.playTone(783.99, 'sine', 0.14, 0.85, 0.01);
    this.playTone(1567.98, 'sine', 0.07, 0.65, 0.01);
  }
}

window.audioEngine = new AudioEngine();
