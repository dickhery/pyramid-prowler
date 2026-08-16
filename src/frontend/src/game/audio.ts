/**
 * Arcade sound effects generated with the Web Audio API.
 * No binary assets and no canister calls — playback stays on the client.
 */

export type SfxName =
  | "hop"
  | "land"
  | "paint"
  | "fall"
  | "hit"
  | "disc"
  | "lure"
  | "freeze"
  | "catch"
  | "hatch"
  | "spawn"
  | "clear"
  | "gameover"
  | "extraLife"
  | "ui";

const MUTE_KEY = "pyramid-prowler-muted";

function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore quota / private-mode failures
  }
}

class ArcadeAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = loadMuted();

  /** Resume the audio context after a user gesture. */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    saveMuted(muted);
    if (this.master) this.master.gain.value = muted ? 0 : 0.22;
  }

  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (ctx.state === "suspended") return;
    const t = ctx.currentTime;
    switch (name) {
      case "hop":
        this.blip(t, 420, 680, 0.09, "triangle", 0.18);
        break;
      case "land":
        this.blip(t, 280, 180, 0.07, "sine", 0.14);
        break;
      case "paint":
        this.blip(t, 520, 880, 0.12, "square", 0.1);
        this.blip(t + 0.06, 880, 1200, 0.1, "triangle", 0.08);
        break;
      case "fall":
        this.blip(t, 500, 80, 0.55, "sawtooth", 0.16);
        break;
      case "hit":
        this.noise(t, 0.16, 0.12);
        this.blip(t, 180, 90, 0.18, "square", 0.16);
        break;
      case "disc":
        this.blip(t, 360, 720, 0.18, "sine", 0.14);
        this.blip(t + 0.12, 720, 1080, 0.22, "triangle", 0.12);
        break;
      case "lure":
        this.blip(t, 200, 90, 0.28, "sawtooth", 0.14);
        this.blip(t + 0.08, 900, 1400, 0.16, "square", 0.08);
        break;
      case "freeze":
        this.blip(t, 980, 1400, 0.2, "sine", 0.1);
        this.blip(t + 0.1, 1400, 980, 0.2, "sine", 0.08);
        break;
      case "catch":
        this.blip(t, 600, 900, 0.08, "square", 0.1);
        this.blip(t + 0.07, 900, 1200, 0.1, "square", 0.08);
        break;
      case "hatch":
        this.blip(t, 140, 260, 0.14, "triangle", 0.16);
        this.blip(t + 0.12, 220, 110, 0.16, "sawtooth", 0.12);
        break;
      case "spawn":
        this.blip(t, 200, 340, 0.08, "square", 0.07);
        break;
      case "clear":
        this.blip(t, 520, 780, 0.12, "square", 0.1);
        this.blip(t + 0.12, 780, 1040, 0.12, "square", 0.1);
        this.blip(t + 0.24, 1040, 1560, 0.2, "triangle", 0.12);
        break;
      case "gameover":
        this.blip(t, 320, 180, 0.22, "square", 0.14);
        this.blip(t + 0.18, 220, 90, 0.4, "sawtooth", 0.14);
        break;
      case "extraLife":
        this.blip(t, 660, 880, 0.1, "triangle", 0.12);
        this.blip(t + 0.1, 880, 1180, 0.14, "triangle", 0.12);
        break;
      case "ui":
        this.blip(t, 640, 800, 0.05, "sine", 0.08);
        break;
    }
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.22;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private dest(): AudioNode {
    return this.master ?? this.ensure().destination;
  }

  private blip(
    when: number,
    from: number,
    to: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 20), when + dur);
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g);
    g.connect(this.dest());
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private noise(when: number, dur: number, gain: number): void {
    const ctx = this.ensure();
    const buffer = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.dest());
    src.start(when);
    src.stop(when + dur);
  }
}

export const arcadeAudio = new ArcadeAudio();
