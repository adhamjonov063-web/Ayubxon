/**
 * Procedural Web Audio Sound Synthesizer for Car Game
 * 100% generated in-memory, zero 404 external audio assets.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Player 1 Engine
  private p1Osc1: OscillatorNode | null = null;
  private p1Osc2: OscillatorNode | null = null;
  private p1Gain: GainNode | null = null;
  private p1Filter: BiquadFilterNode | null = null;

  // Player 2 Engine
  private p2Osc1: OscillatorNode | null = null;
  private p2Osc2: OscillatorNode | null = null;
  private p2Gain: GainNode | null = null;
  private p2Filter: BiquadFilterNode | null = null;

  // Drift Noise
  private driftGain: GainNode | null = null;
  private driftNoiseNode: AudioBufferSourceNode | null = null;
  private driftFilter: BiquadFilterNode | null = null;

  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.isInitialized = true;
      this.setupEngineNodes();
    } catch {
      // AudioContext may be blocked before user gesture
    }
  }

  private ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupEngineNodes() {
    if (!this.ctx) return;

    // Player 1 engine
    this.p1Gain = this.ctx.createGain();
    this.p1Gain.gain.value = 0.08;
    this.p1Filter = this.ctx.createBiquadFilter();
    this.p1Filter.type = 'lowpass';
    this.p1Filter.frequency.value = 400;

    this.p1Osc1 = this.ctx.createOscillator();
    this.p1Osc1.type = 'sawtooth';
    this.p1Osc1.frequency.value = 45;

    this.p1Osc2 = this.ctx.createOscillator();
    this.p1Osc2.type = 'triangle';
    this.p1Osc2.frequency.value = 22.5;

    this.p1Osc1.connect(this.p1Filter);
    this.p1Osc2.connect(this.p1Filter);
    this.p1Filter.connect(this.p1Gain);
    this.p1Gain.connect(this.ctx.destination);

    this.p1Osc1.start();
    this.p1Osc2.start();

    // Player 2 engine
    this.p2Gain = this.ctx.createGain();
    this.p2Gain.gain.value = 0;
    this.p2Filter = this.ctx.createBiquadFilter();
    this.p2Filter.type = 'lowpass';
    this.p2Filter.frequency.value = 350;

    this.p2Osc1 = this.ctx.createOscillator();
    this.p2Osc1.type = 'sawtooth';
    this.p2Osc1.frequency.value = 40;

    this.p2Osc2 = this.ctx.createOscillator();
    this.p2Osc2.type = 'square';
    this.p2Osc2.frequency.value = 20;

    this.p2Osc1.connect(this.p2Filter);
    this.p2Osc2.connect(this.p2Filter);
    this.p2Filter.connect(this.p2Gain);
    this.p2Gain.connect(this.ctx.destination);

    this.p2Osc1.start();
    this.p2Osc2.start();

    // Drift noise setup
    this.setupDriftNoise();
  }

  private setupDriftNoise() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.value = 0;

    this.driftFilter = this.ctx.createBiquadFilter();
    this.driftFilter.type = 'bandpass';
    this.driftFilter.frequency.value = 1100;
    this.driftFilter.Q.value = 2.5;

    this.driftGain.connect(this.ctx.destination);

    const playLoop = () => {
      if (!this.ctx || !this.driftFilter || !this.driftGain) return;
      this.driftNoiseNode = this.ctx.createBufferSource();
      this.driftNoiseNode.buffer = buffer;
      this.driftNoiseNode.loop = true;
      this.driftNoiseNode.connect(this.driftFilter);
      this.driftFilter.connect(this.driftGain);
      this.driftNoiseNode.start();
    };
    playLoop();
  }

  public updateEngine(player: 1 | 2, speedKmH: number, isAccelerating: boolean, isNitro: boolean) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const absSpeed = Math.abs(speedKmH);
    const baseFreq = 42 + Math.min(absSpeed * 2.2, 190) + (isAccelerating ? 30 : 0) + (isNitro ? 70 : 0);
    const filterFreq = 300 + Math.min(absSpeed * 8, 1800) + (isNitro ? 1000 : 0);
    const gainVal = 0.05 + Math.min(absSpeed * 0.0015, 0.07) + (isNitro ? 0.04 : 0);

    if (player === 1 && this.p1Osc1 && this.p1Osc2 && this.p1Filter && this.p1Gain) {
      this.p1Osc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.08);
      this.p1Osc2.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.08);
      this.p1Filter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.08);
      this.p1Gain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.08);
    } else if (player === 2 && this.p2Osc1 && this.p2Osc2 && this.p2Filter && this.p2Gain) {
      this.p2Osc1.frequency.setTargetAtTime(baseFreq * 1.1, this.ctx.currentTime, 0.08);
      this.p2Osc2.frequency.setTargetAtTime(baseFreq * 0.55, this.ctx.currentTime, 0.08);
      this.p2Filter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.08);
      this.p2Gain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.08);
    }
  }

  public updateDrift(driftIntensity: number) {
    if (this.isMuted || !this.ctx || !this.driftGain) return;
    const clamped = Math.max(0, Math.min(driftIntensity, 1));
    const targetGain = clamped > 0.15 ? clamped * 0.12 : 0;
    this.driftGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  public playHorn(pitch = 440) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.value = pitch;
    osc2.frequency.value = pitch * 1.25; // major third

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.46);
    osc2.stop(this.ctx.currentTime + 0.46);
  }

  public playCrash(intensity = 0.5) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const dur = 0.35;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + dur);

    gain.gain.setValueAtTime(Math.min(intensity * 0.35, 0.4), this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  public playRefuelPump() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Liquid bubbling chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playDing() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime); // C6

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  public playPoliceSiren() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    
    // Siren warble 650Hz -> 950Hz -> 650Hz
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  public playCameraShutter() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ctx) {
      if (this.p1Gain) this.p1Gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this.p2Gain) this.p2Gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this.driftGain) this.driftGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
