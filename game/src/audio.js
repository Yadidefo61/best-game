// Synthesised sound for Emberlight Arena: every effect is a short
// oscillator tone shaped by the Web Audio API, so the game ships no audio
// files at all. The bank stays silent until the player first interacts
// (browsers block audio before a gesture) and never creates an
// AudioContext while a screenshot scene is being staged.
export function createSoundBank() {
  return {
    context: null,
    muted: false,
    silent: false,

    ensure() {
      if (this.silent || this.muted || this.context) return;
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        this.context = new Ctor();
      } catch {
        this.context = null;
      }
    },

    tone(freq, duration, type, volume, slideTo) {
      if (this.silent || this.muted || !this.context) return;
      try {
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      } catch {
        // Sound is garnish: a failure here must never break the game.
      }
    },

    shoot() { this.tone(740, 0.07, 'square', 0.045, 320); },
    enemyHit() { this.tone(220, 0.05, 'triangle', 0.05, 140); },
    enemyDie() { this.tone(330, 0.16, 'sawtooth', 0.06, 60); },
    playerHurt() { this.tone(140, 0.22, 'sawtooth', 0.09, 55); },
    bossRoar() {
      this.tone(90, 0.6, 'sawtooth', 0.12, 42);
      this.tone(135, 0.45, 'square', 0.05, 60);
    },
    comboUp() {
      this.tone(660, 0.07, 'sine', 0.06, 660);
      setTimeout(() => this.tone(990, 0.1, 'sine', 0.06, 990), 70);
    },
    nova() { this.tone(300, 0.18, 'triangle', 0.09, 1200); },
    pickup() { this.tone(880, 0.1, 'sine', 0.07, 1320); },
    heart() { this.tone(520, 0.18, 'sine', 0.08, 780); },
    waveClear() {
      this.tone(523, 0.12, 'sine', 0.07);
      setTimeout(() => this.tone(659, 0.12, 'sine', 0.07), 110);
      setTimeout(() => this.tone(784, 0.2, 'sine', 0.07), 220);
    },
    waveStart() { this.tone(196, 0.2, 'triangle', 0.08, 392); },
    upgrade() { this.tone(660, 0.1, 'sine', 0.07, 990); },
    dash() { this.tone(500, 0.09, 'sine', 0.04, 900); },
    gameOver() {
      this.tone(392, 0.25, 'triangle', 0.08, 196);
      setTimeout(() => this.tone(262, 0.4, 'triangle', 0.08, 98), 240);
    },
    victory() {
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => this.tone(freq, 0.22, 'sine', 0.08), i * 130);
      });
    },
  };
}
