export class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private beep(freq: number, endFreq: number, dur: number, type: OscillatorType, vol = 0.14): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  public tap(): void {
    this.beep(420, 620, 0.06, 'sine', 0.1);
  }

  public score(): void {
    this.beep(580, 960, 0.11, 'triangle', 0.14);
  }

  public hit(): void {
    this.beep(210, 75, 0.14, 'sawtooth', 0.15);
  }

  public explode(): void {
    this.beep(140, 38, 0.28, 'sawtooth', 0.2);
  }

  public win(): void {
    this.beep(523, 784, 0.14, 'triangle', 0.15);
    setTimeout(() => this.beep(784, 1046, 0.18, 'triangle', 0.15), 90);
  }
}
