// Web Audio API Synthesizer and Sequencer for SAS AI Song Studio

// Note frequency map
const NOTE_FREQUENCIES: Record<string, number> = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50
};

// Chord note definitions
const CHORD_NOTES: Record<string, string[]> = {
  // Majors
  'C': ['C4', 'E4', 'G4', 'C5'],
  'D': ['D4', 'F#4', 'A4', 'D5'],
  'E': ['E4', 'G#4', 'B4', 'E5'],
  'F': ['F4', 'A4', 'C5', 'F5'],
  'G': ['G4', 'B4', 'D5', 'G5'],
  'A': ['A4', 'C#5', 'E5', 'A5'],
  'B': ['B4', 'D#5', 'F#5', 'B5'],
  'Bb': ['A#4', 'D5', 'F5', 'A#5'],
  'Eb': ['D#4', 'G4', 'A#4', 'D#5'],
  'Ab': ['G#4', 'C5', 'D#5', 'G#5'],
  'Db': ['C#4', 'F4', 'G#4', 'C#5'],
  'F#': ['F#4', 'A#4', 'C#5', 'F#5'],

  // Minors
  'Am': ['A3', 'C4', 'E4', 'A4'],
  'Dm': ['D4', 'F4', 'A4', 'D5'],
  'Em': ['E4', 'G4', 'B4', 'E5'],
  'Fm': ['F4', 'G#4', 'C5', 'F5'],
  'Gm': ['G4', 'A#4', 'D5', 'G5'],
  'Cm': ['C4', 'D#4', 'G4', 'C5'],
  'Bm': ['B3', 'D4', 'F#4', 'B4'],
  'C#m': ['C#4', 'E4', 'G#4', 'C#5'],
  'F#m': ['F#4', 'A4', 'C#5', 'F#5'],
  'G#m': ['G#4', 'B4', 'D#5', 'G#5'],
  'Bbm': ['A#3', 'C#4', 'F4', 'A#4'],
  'Ebm': ['D#4', 'F#4', 'A#4', 'D#5'],

  // 7ths & Sus
  'G7': ['G4', 'B4', 'D5', 'F5'],
  'C7': ['C4', 'E4', 'G4', 'A#4'],
  'D7': ['D4', 'F#4', 'A4', 'C5'],
  'E7': ['E4', 'G#4', 'B4', 'D5'],
  'A7': ['A4', 'C#5', 'E5', 'G5'],
  'B7': ['B4', 'D#5', 'F#5', 'A5'],
  'F7': ['F4', 'A4', 'C5', 'D#5'],
  'Dsus4': ['D4', 'G4', 'A4', 'D5'],
  'Asus4': ['A4', 'D5', 'E5', 'A5'],
};

export type SoundStyle = 'acoustic' | 'synthwave' | 'baila' | 'lofi' | 'pop';

export class MusicSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private tempoBpm = 110;
  private currentStep = 0;
  private timerId: number | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private chords: string[] = ['C', 'G', 'Am', 'F'];
  private soundStyle: SoundStyle = 'pop';
  private onStepCallback?: (chordIndex: number, beat: number) => void;

  constructor() {
    // Lazy AudioContext init on user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setConfig(chords: string[], bpm: number, style: SoundStyle = 'pop') {
    if (chords && chords.length > 0) {
      this.chords = chords;
    }
    if (bpm && bpm > 40 && bpm < 240) {
      this.tempoBpm = bpm;
    }
    this.soundStyle = style;
  }

  public setOnStep(cb: (chordIndex: number, beat: number) => void) {
    this.onStepCallback = cb;
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  // Play a drum kick
  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.35);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  // Play a snare sound
  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.16);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  // Play a crisp hi-hat
  private playHiHat(time: number, isBaila = false) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * (isBaila ? 0.08 : 0.05);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + 0.06);
  }

  // Play chord notes
  private playChord(chordName: string, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const cleanName = chordName.replace(/[^a-zA-Z0-9#b]/g, '');
    const notes = CHORD_NOTES[cleanName] || CHORD_NOTES[chordName.charAt(0)] || ['C4', 'E4', 'G4'];

    notes.forEach((noteName, idx) => {
      const freq = NOTE_FREQUENCIES[noteName] || 440;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      if (this.soundStyle === 'synthwave') {
        osc.type = 'sawtooth';
      } else if (this.soundStyle === 'acoustic') {
        osc.type = 'triangle';
      } else if (this.soundStyle === 'lofi') {
        osc.type = 'sine';
      } else {
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      }

      // Slightly detune for rich ensemble chorus effect
      osc.frequency.setValueAtTime(freq + (idx - 1) * 1.2, time);

      const noteGain = 0.2 / notes.length;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(noteGain, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  // Play Bass note
  private playBass(rootNote: string, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const cleanRoot = rootNote.charAt(0) + (rootNote.includes('#') ? '#' : '') + '2';
    const freq = NOTE_FREQUENCIES[cleanRoot] || NOTE_FREQUENCIES['C2'] || 65.41;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = this.soundStyle === 'baila' ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.28, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Play Melody Arpeggio note
  public playMelodyTone(noteName: string, duration = 0.4) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const freq = NOTE_FREQUENCIES[noteName] || 440;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public start() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    const secondsPerBeat = 60.0 / this.tempoBpm;
    const stepDuration = secondsPerBeat; // 1 beat per step (4 beats per chord bar)

    const scheduleNext = () => {
      if (!this.isPlaying || !this.ctx) return;

      const now = this.ctx.currentTime;
      const beatInBar = this.currentStep % 4;
      const chordIndex = Math.floor(this.currentStep / 4) % this.chords.length;
      const currentChord = this.chords[chordIndex] || 'C';

      // 1. Play Chord on beat 0 and beat 2
      if (beatInBar === 0) {
        this.playChord(currentChord, now, stepDuration * 3.8);
        this.playBass(currentChord, now, stepDuration * 1.8);
      } else if (beatInBar === 2) {
        if (this.soundStyle === 'baila') {
          this.playChord(currentChord, now, stepDuration * 0.8);
        }
        this.playBass(currentChord, now, stepDuration * 1.8);
      }

      // 2. Rhythm drums
      if (this.soundStyle === 'baila') {
        // Sinhala Baila 6/8 or syncopated bounce pattern
        this.playKick(now);
        this.playHiHat(now, true);
        if (beatInBar === 1 || beatInBar === 3) {
          this.playSnare(now);
        }
      } else {
        // Standard 4/4 Pop / Synthwave / Acoustic Beat
        if (beatInBar === 0 || beatInBar === 2) {
          this.playKick(now);
        }
        if (beatInBar === 1 || beatInBar === 3) {
          this.playSnare(now);
        }
        this.playHiHat(now);
        // Off-beat eighth note hi-hat
        this.playHiHat(now + stepDuration * 0.5);
      }

      if (this.onStepCallback) {
        this.onStepCallback(chordIndex, beatInBar);
      }

      this.currentStep++;

      const nextTickMs = (stepDuration * 1000);
      this.timerId = window.setTimeout(scheduleNext, nextTickMs);
    };

    scheduleNext();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const musicSynth = new MusicSynthEngine();
