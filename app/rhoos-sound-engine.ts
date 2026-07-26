"use client";

type SupportedWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

const melody = [69, 72, 76, 72, 67, 71, 74, 71, 65, 69, 72, 69, 64, 67, 71, 74];
const bass = [45, 45, 43, 43, 41, 41, 40, 43];

function midi(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

export class RhoosSoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambience: OscillatorNode[] = [];
  private timer: number | null = null;
  private step = 0;
  private muted = false;
  private volume = 0.46;

  async start() {
    if (!this.context) {
      const AudioContextClass =
        window.AudioContext ?? (window as SupportedWindow).webkitAudioContext;
      if (!AudioContextClass) return false;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.master.gain.value = this.volume;
      this.musicBus.gain.value = 0.72;
      this.musicBus.connect(this.master);
      this.master.connect(this.context.destination);
      this.startAmbience();
    }
    await this.context.resume();
    if (this.timer === null) {
      this.tick();
      this.timer = window.setInterval(() => this.tick(), 150);
    }
    return true;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(
      muted ? 0.0001 : this.volume,
      this.context.currentTime,
      0.04,
    );
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (!this.context || !this.master || this.muted) return;
    this.master.gain.setTargetAtTime(
      this.volume,
      this.context.currentTime,
      0.04,
    );
  }

  blip(kind: "interact" | "reward" | "hook" | "error" = "interact") {
    if (!this.context || !this.master || this.muted) return;
    const patterns: Record<typeof kind, number[]> = {
      interact: [660, 880],
      reward: [523, 659, 784, 1047],
      hook: [392, 784, 988],
      error: [220, 174],
    };
    patterns[kind].forEach((frequency, index) => {
      this.tone(
        frequency,
        this.context!.currentTime + index * 0.055,
        0.09,
        kind === "error" ? "sawtooth" : "square",
        0.065,
        this.master!,
      );
    });
  }

  dispose() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    for (const oscillator of this.ambience) {
      try {
        oscillator.stop();
      } catch {
        // Already stopped.
      }
    }
    this.ambience = [];
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.musicBus = null;
  }

  private startAmbience() {
    if (!this.context || !this.musicBus) return;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240;
    filter.Q.value = 0.7;
    const gain = this.context.createGain();
    gain.gain.value = 0.045;
    filter.connect(gain).connect(this.musicBus);
    for (const [frequency, detune] of [
      [55, -5],
      [82.5, 4],
    ]) {
      const oscillator = this.context.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      oscillator.connect(filter);
      oscillator.start();
      this.ambience.push(oscillator);
    }
  }

  private tick() {
    if (!this.context || !this.musicBus || this.muted) {
      this.step += 1;
      return;
    }
    const now = this.context.currentTime;
    const sequenceStep = this.step % 16;
    const melodyNote = melody[sequenceStep];
    this.tone(
      midi(melodyNote),
      now,
      0.115,
      sequenceStep % 4 === 0 ? "square" : "triangle",
      0.045,
      this.musicBus,
    );
    if (sequenceStep % 2 === 1) {
      this.tone(
        midi(melodyNote + 12),
        now + 0.02,
        0.065,
        "square",
        0.018,
        this.musicBus,
      );
    }
    if (sequenceStep % 4 === 0) {
      this.tone(
        midi(bass[Math.floor(this.step / 4) % bass.length]),
        now,
        0.5,
        "sawtooth",
        0.07,
        this.musicBus,
      );
      this.kick(now);
    }
    if (sequenceStep % 2 === 0) this.hat(now + 0.01);
    if (sequenceStep === 4 || sequenceStep === 12) this.snare(now);
    this.step += 1;
  }

  private tone(
    frequency: number,
    start: number,
    duration: number,
    type: OscillatorType,
    level: number,
    destination: AudioNode,
  ) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private kick(start: number) {
    if (!this.context || !this.musicBus) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(120, start);
    oscillator.frequency.exponentialRampToValueAtTime(42, start + 0.14);
    gain.gain.setValueAtTime(0.18, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    oscillator.connect(gain).connect(this.musicBus);
    oscillator.start(start);
    oscillator.stop(start + 0.18);
  }

  private hat(start: number) {
    if (!this.context || !this.musicBus) return;
    const length = Math.floor(this.context.sampleRate * 0.035);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index++) {
      data[index] = Math.random() * 2 - 1;
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6200;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.035, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.034);
    source.connect(filter).connect(gain).connect(this.musicBus);
    source.start(start);
  }

  private snare(start: number) {
    if (!this.context || !this.musicBus) return;
    const length = Math.floor(this.context.sampleRate * 0.1);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index++) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1750;
    const gain = this.context.createGain();
    gain.gain.value = 0.075;
    source.connect(filter).connect(gain).connect(this.musicBus);
    source.start(start);
  }
}
