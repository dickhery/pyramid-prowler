/**
 * Arcade audio: Web Audio 8-bit cues plus looping stage music from
 * static frontend files. Playback stays in the browser — no canister
 * calls and only one music file is loaded at a time.
 */

import type { ColorRule, GamePhase, Screen } from "./types";

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
  | "ui"
  | "combo"
  | "intro"
  | "warning"
  | "pause"
  | "resume";

export type MusicId = "fast1" | "fast2" | "spooky1" | "spooky2";

const MUTE_KEY = "pyramid-prowler-muted";
const MUSIC_KEY = "pyramid-prowler-music-off";

/** One track per id — served from the frontend public folder. */
const TRACKS: Record<MusicId, string> = {
  fast1: "/assets/audio/Pyramid_Prowler_fast_1.mp3",
  fast2: "/assets/audio/Pyramid_Prowler_fast_2.mp3",
  spooky1: "/assets/audio/Pyramid_Prowler_spooky_1.mp3",
  spooky2: "/assets/audio/Pyramid_Prowler_spooky_2.mp3",
};

const MUSIC_VOLUME = 0.36;
const MUSIC_PAUSED_VOLUME = 0.1;
const SFX_MASTER = 0.22;

function loadFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function saveFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore quota / private-mode failures
  }
}

/**
 * Pick a bed for the current stage.
 * Early one-hop / two-hop rounds stay upbeat; flip-back, late, and
 * finale rounds switch to the spooky beds. The two variants of each
 * mood alternate so a long run does not loop the same file.
 */
export function musicForStage(
  levelNumber: number,
  colorRule: ColorRule,
): MusicId {
  const round = ((Math.max(1, levelNumber) - 1) % 12) + 1;
  const tense =
    colorRule === "flipBack" || colorRule === "twoHopFlip" || round >= 7;
  const alt = (Math.max(1, levelNumber) - 1) % 2 === 1;
  if (tense) return alt ? "spooky2" : "spooky1";
  return alt ? "fast2" : "fast1";
}

class ArcadeAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private currentTrack: MusicId | null = null;
  private wantedTrack: MusicId | null = null;
  private fadeTimer: number | null = null;
  private ducked = false;
  muted = loadFlag(MUTE_KEY);
  musicOff = loadFlag(MUSIC_KEY);

  /** Resume the audio context after a user gesture and retry music. */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    this.applyMusicMute();
    if (this.wantedTrack) this.ensureMusic(this.wantedTrack, false);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    saveFlag(MUTE_KEY, muted);
    if (this.master) this.master.gain.value = muted ? 0 : SFX_MASTER;
    this.applyMusicMute();
  }

  setMusicOff(off: boolean): void {
    this.musicOff = off;
    saveFlag(MUSIC_KEY, off);
    this.applyMusicMute();
    if (off) {
      this.pauseMusicElement();
      return;
    }
    if (this.wantedTrack) this.ensureMusic(this.wantedTrack, false);
  }

  /** Pause the bed when the tab is hidden; resume from the same bar. */
  setBackgrounded(hidden: boolean): void {
    if (hidden) {
      this.pauseMusicElement();
      return;
    }
    if (this.wantedTrack) this.ensureMusic(this.wantedTrack, false);
  }

  /**
   * Keep the looping bed in sync with the current screen / phase.
   * Music plays while hopping, stays ducked on pause, and stops on
   * the menu or game over. Only the active file is requested.
   */
  syncMusic(input: {
    screen: Screen;
    phase: GamePhase;
    levelNumber: number;
    colorRule: ColorRule;
  }): void {
    const playing =
      input.screen === "game" &&
      (input.phase === "playing" ||
        input.phase === "paused" ||
        input.phase === "levelclear");
    this.ducked = input.phase === "paused" || input.phase === "levelclear";
    if (!playing) {
      this.wantedTrack = null;
      this.fadeTo(0, 0.45, true);
      return;
    }
    const track = musicForStage(input.levelNumber, input.colorRule);
    this.wantedTrack = track;
    this.ensureMusic(track, this.currentTrack !== track);
  }

  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (ctx.state === "suspended") return;
    const t = ctx.currentTime;
    switch (name) {
      case "hop":
        this.beep(t, 523, 0.05, "square", 0.12);
        this.blip(t, 523, 784, 0.08, "square", 0.1);
        break;
      case "land":
        this.beep(t, 196, 0.06, "triangle", 0.14);
        this.beep(t + 0.03, 98, 0.05, "triangle", 0.08);
        break;
      case "paint":
        this.arp(t, [523, 659, 784], 0.05, "square", 0.09);
        break;
      case "fall":
        this.blip(t, 392, 70, 0.55, "sawtooth", 0.15);
        this.noise(t + 0.08, 0.28, 0.06);
        break;
      case "hit":
        this.noise(t, 0.14, 0.14);
        this.beep(t, 110, 0.12, "square", 0.16);
        this.beep(t + 0.08, 82, 0.18, "square", 0.12);
        break;
      case "disc":
        this.arp(t, [392, 523, 659, 784, 1047], 0.07, "triangle", 0.11);
        break;
      case "lure":
        this.blip(t, 196, 82, 0.22, "sawtooth", 0.14);
        this.arp(t + 0.1, [1047, 784, 523], 0.06, "square", 0.08);
        break;
      case "freeze":
        this.beep(t, 1319, 0.08, "square", 0.08);
        this.beep(t + 0.08, 1568, 0.1, "triangle", 0.08);
        this.beep(t + 0.18, 1175, 0.14, "sine", 0.07);
        break;
      case "catch":
        this.arp(t, [659, 784, 988, 1319], 0.055, "square", 0.1);
        break;
      case "hatch":
        this.beep(t, 147, 0.1, "square", 0.12);
        this.blip(t + 0.08, 196, 98, 0.18, "sawtooth", 0.12);
        this.noise(t + 0.05, 0.12, 0.08);
        break;
      case "spawn":
        this.beep(t, 220, 0.05, "square", 0.06);
        this.beep(t + 0.05, 277, 0.05, "square", 0.05);
        break;
      case "clear":
        this.arp(t, [523, 659, 784, 1047, 1319], 0.09, "square", 0.11);
        this.beep(t + 0.48, 1568, 0.22, "triangle", 0.1);
        break;
      case "gameover":
        this.beep(t, 311, 0.16, "square", 0.13);
        this.beep(t + 0.16, 262, 0.18, "square", 0.12);
        this.beep(t + 0.34, 196, 0.36, "sawtooth", 0.12);
        break;
      case "extraLife":
        this.arp(t, [523, 659, 784, 1047, 784, 1319], 0.07, "triangle", 0.11);
        break;
      case "ui":
        this.beep(t, 784, 0.04, "square", 0.07);
        this.beep(t + 0.04, 988, 0.05, "square", 0.06);
        break;
      case "combo":
        this.arp(t, [659, 831, 988, 1319], 0.045, "square", 0.09);
        break;
      case "intro":
        this.arp(t, [392, 523, 659, 784], 0.07, "square", 0.1);
        break;
      case "warning":
        this.beep(t, 880, 0.08, "square", 0.1);
        this.beep(t + 0.1, 659, 0.1, "square", 0.09);
        this.beep(t + 0.22, 880, 0.12, "square", 0.1);
        break;
      case "pause":
        this.beep(t, 523, 0.05, "square", 0.06);
        this.beep(t + 0.05, 392, 0.07, "square", 0.05);
        break;
      case "resume":
        this.beep(t, 392, 0.05, "square", 0.06);
        this.beep(t + 0.05, 523, 0.07, "square", 0.05);
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
      this.master.gain.value = this.muted ? 0 : SFX_MASTER;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private dest(): AudioNode {
    return this.master ?? this.ensure().destination;
  }

  private musicAllowed(): boolean {
    return !this.muted && !this.musicOff;
  }

  private targetVolume(): number {
    if (!this.musicAllowed()) return 0;
    return this.ducked ? MUSIC_PAUSED_VOLUME : MUSIC_VOLUME;
  }

  private applyMusicMute(): void {
    if (!this.music) return;
    this.music.muted = !this.musicAllowed();
    if (this.musicAllowed()) {
      this.music.volume = this.targetVolume();
    }
  }

  private ensureMusic(track: MusicId, restart: boolean): void {
    if (!this.musicAllowed()) {
      this.pauseMusicElement();
      this.currentTrack = track;
      return;
    }
    if (!this.music) {
      const el = new Audio();
      el.loop = true;
      el.preload = "none";
      el.setAttribute("playsinline", "true");
      this.music = el;
    }
    const el = this.music;
    const src = TRACKS[track];
    if (restart || this.currentTrack !== track || !el.src.endsWith(src)) {
      el.pause();
      el.src = src;
      el.currentTime = 0;
      this.currentTrack = track;
    }
    el.muted = false;
    const dest = this.targetVolume();
    if (el.paused) {
      el.volume = 0;
      void el.play().then(
        () => this.fadeTo(dest, 0.55, false),
        () => {
          // Autoplay blocked until the next unlock() from a gesture.
        },
      );
      return;
    }
    this.fadeTo(dest, 0.35, false);
  }

  private pauseMusicElement(): void {
    if (this.music && !this.music.paused) this.music.pause();
  }

  private fadeTo(volume: number, seconds: number, stopAtZero: boolean): void {
    const el = this.music;
    if (!el) return;
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    const start = el.volume;
    const from = Number.isFinite(start) ? start : 0;
    const steps = Math.max(4, Math.floor(seconds * 24));
    let i = 0;
    this.fadeTimer = window.setInterval(
      () => {
        i += 1;
        const t = i / steps;
        el.volume = Math.min(1, Math.max(0, from + (volume - from) * t));
        if (i >= steps) {
          if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
          this.fadeTimer = null;
          el.volume = volume;
          if (stopAtZero && volume <= 0.001) {
            el.pause();
            this.currentTrack = null;
          }
        }
      },
      Math.max(16, Math.floor((seconds * 1000) / steps)),
    );
  }

  private beep(
    when: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g);
    g.connect(this.dest());
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private arp(
    when: number,
    notes: number[],
    step: number,
    type: OscillatorType,
    gain: number,
  ): void {
    notes.forEach((freq, i) => {
      this.beep(when + i * step, freq, step * 1.35, type, gain);
    });
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
