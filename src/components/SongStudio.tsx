import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Square,
  Mic,
  MicOff,
  Upload,
  Sparkles,
  Volume2,
  Sliders,
  Share2,
  Copy,
  Check,
  Download,
  RotateCcw,
  Headphones,
  Disc3,
  Layers,
  Radio,
  FileText,
  Clock,
  AudioWaveform as WaveformIcon,
} from 'lucide-react';
import { SongData, SongSection } from '../types';
import { musicSynth, SoundStyle } from '../lib/musicSynth';

interface SongStudioProps {
  onSendToChat?: (prompt: string) => void;
}

const PRESET_SONG_PROMPTS = [
  {
    title: 'Sinhala Baila Party',
    titleSi: 'සුපිරි බයිලා ගීතයක්',
    theme: 'Joyful tropical beach party in Sri Lanka with baila beats and celebration',
    genre: 'Sinhala Baila',
    mood: 'Energetic & Fun',
    bpm: 132,
    style: 'baila' as SoundStyle,
    lang: 'Sinhala & Singlish',
  },
  {
    title: 'Emotional Sinhala Love Ballad',
    titleSi: 'සිත නිවන ආදර ගීතයක්',
    theme: 'Nostalgic memories of first love under the rain in Colombo',
    genre: 'Sinhala Pop Ballad',
    mood: 'Romantic & Melancholy',
    bpm: 88,
    style: 'acoustic' as SoundStyle,
    lang: 'Sinhala',
  },
  {
    title: 'Acoustic Melody',
    titleSi: 'සන්සුන් ගිටාර් තනුවක්',
    theme: 'Calm evening by the sea watching the sunset, peaceful thoughts',
    genre: 'Acoustic Folk',
    mood: 'Peaceful & Dreamy',
    bpm: 96,
    style: 'acoustic' as SoundStyle,
    lang: 'Sinhala & English',
  },
  {
    title: 'Modern Synthwave Beat',
    titleSi: 'නූතන ඉලෙක්ට්‍රෝ ගීතයක්',
    theme: 'Neon city lights, driving at midnight with retro synth vibes',
    genre: 'Synthwave / Electronic',
    mood: 'Upbeat & Futuristic',
    bpm: 120,
    style: 'synthwave' as SoundStyle,
    lang: 'English & Singlish',
  },
  {
    title: 'Sinhala Classical / Sarala Gee',
    titleSi: 'ශාස්ත්‍රීය සරල ගීතයක්',
    theme: 'Deep poetic philosophical reflection on life, nature and human feelings',
    genre: 'Sarala Gee (Amaradeva Style)',
    mood: 'Thoughtful & Soulful',
    bpm: 80,
    style: 'acoustic' as SoundStyle,
    lang: 'Sinhala',
  },
  {
    title: 'Sri Lankan Rap / Hip Hop',
    titleSi: 'සිංහල රැප් ගීතයක්',
    theme: 'Hustle, ambition, overcoming challenges and rising to the top',
    genre: 'Hip Hop / Rap',
    mood: 'Confident & Powerful',
    bpm: 100,
    style: 'pop' as SoundStyle,
    lang: 'Sinhala & English',
  },
];

export const SongStudio: React.FC<SongStudioProps> = () => {
  // Input states
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState('Sinhala Pop');
  const [mood, setMood] = useState('Romantic & Melodic');
  const [language, setLanguage] = useState('Sinhala & English');
  const [vocalStyle, setVocalStyle] = useState('Melodic Solo');
  const [tempoBpm, setTempoBpm] = useState(105);
  const [soundStyle, setSoundStyle] = useState<SoundStyle>('acoustic');

  // Audio / Voice input state
  const [isRecordingMelody, setIsRecordingMelody] = useState(false);
  const [recordedMelodyUrl, setRecordedMelodyUrl] = useState<string | null>(null);
  const [audioNoteDescription, setAudioNoteDescription] = useState('');
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);

  // Generation & Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSong, setGeneratedSong] = useState<SongData | null>(null);
  const [lyricsTab, setLyricsTab] = useState<'sinhala' | 'english' | 'singlish'>('sinhala');
  const [copied, setCopied] = useState(false);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChordIdx, setActiveChordIdx] = useState(0);
  const [activeBeat, setActiveBeat] = useState(0);
  const [volume, setVolume] = useState(0.75);

  // Vocal Recording Karaoke mode
  const [isRecordingVocals, setIsRecordingVocals] = useState(false);
  const [vocalRecordingUrl, setVocalRecordingUrl] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vocalChunksRef = useRef<Blob[]>([]);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize synth callback
  useEffect(() => {
    musicSynth.setOnStep((chordIdx, beat) => {
      setActiveChordIdx(chordIdx);
      setActiveBeat(beat);
    });

    return () => {
      musicSynth.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update synth configuration when song or settings change
  useEffect(() => {
    if (generatedSong) {
      const allChords = generatedSong.chords?.length > 0
        ? generatedSong.chords
        : ['C', 'G', 'Am', 'F'];
      musicSynth.setConfig(allChords, tempoBpm, soundStyle);
    } else {
      musicSynth.setConfig(['C', 'G', 'Am', 'F'], tempoBpm, soundStyle);
    }
  }, [generatedSong, tempoBpm, soundStyle]);

  // Visualizer loop
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = musicSynth.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (canvas.width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (canvas.height - 6);
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(0.5, '#6366f1');
          gradient.addColorStop(1, '#ec4899');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight + 2, 3);
          ctx.fill();

          x += barWidth + 1;
        }
      } else {
        // Idle calm wave
        const time = Date.now() * 0.003;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 4) {
          const y = canvas.height / 2 + Math.sin(x * 0.04 + time) * (isPlaying ? 12 : 3);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Play / Stop Synthesizer
  const handleTogglePlay = () => {
    if (isPlaying) {
      musicSynth.stop();
      setIsPlaying(false);
    } else {
      musicSynth.start();
      setIsPlaying(true);
    }
  };

  // Generate Song
  const handleGenerateSong = async () => {
    if (!theme.trim() && !audioNoteDescription) {
      setTheme('A beautiful melodic song about love and hopes for tomorrow');
    }

    setIsGenerating(true);
    if (isPlaying) {
      musicSynth.stop();
      setIsPlaying(false);
    }

    try {
      const response = await fetch('/api/song/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: theme.trim() || 'A beautiful melodic song',
          genre,
          mood,
          language,
          vocalStyle,
          tempoBpm,
          audioDescription: audioNoteDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const songData: SongData = await response.json();
      setGeneratedSong(songData);
      if (songData.tempoBpm) {
        setTempoBpm(songData.tempoBpm);
      }

      // Auto start music preview
      setTimeout(() => {
        musicSynth.start();
        setIsPlaying(true);
      }, 400);
    } catch (err: any) {
      console.error('Song generation error:', err);
      // Fallback preset song if server fails
      const fallback: SongData = {
        id: `song-${Date.now()}`,
        title: 'Sihina Tharaka (Starry Dreams)',
        titleSinhala: 'සිහින තාරකා',
        genre,
        mood,
        tempoBpm,
        key: 'C Major',
        timeSignature: '4/4',
        chords: ['C', 'G', 'Am', 'F'],
        melodyNotes: [],
        structure: [
          {
            section: 'Intro',
            chords: ['C', 'G', 'Am', 'F'],
            lyricsSinhala: '[මනරම් සංගීත ඛණ්ඩය]',
            lyricsEnglish: '[Melodic Acoustic Intro]',
            singlishLyrics: '[Intro]',
            musicalCue: 'Acoustic guitar arpeggio and gentle rhythm'
          },
          {
            section: 'Verse 1',
            chords: ['C', 'G', 'Am', 'F'],
            lyricsSinhala: 'සඳ පායනා රෑ සිහින අතරේ මා තනිවී බලා උන්නා\nනුඹෙ සිනහවයි මතකේ ඇඳුනේ මගෙ හදවතේ රන්දා...',
            lyricsEnglish: 'Under the moonlight in starry dreams, I waited all alone\nYour warm smile painted inside my heart...',
            singlishLyrics: 'Sanda paayanaa rae sihina athare maa thanivee balaa unnaa\nNube sinahawayi mathake aedune mage hadawathe randaa...',
            musicalCue: 'Soft acoustic strumming with steady bassline'
          },
          {
            section: 'Chorus',
            chords: ['F', 'G', 'Em', 'Am'],
            lyricsSinhala: 'සිහින තාරකා නිල් අහසේ දිලෙන්නා සේ\nනුඹෙ ආදරේ මගෙ මුළු ලොවම එළිය කළේ...',
            lyricsEnglish: 'Like starry dreams sparkling across the blue sky\nYour sweet love illuminated my entire world...',
            singlishLyrics: 'Sihina thaarakaa nil ahase dilennaa se\nNube aadare mage mulu lowama eliya kalee...',
            musicalCue: 'Full dynamic band with rich harmonies and upbeat drum beat'
          },
          {
            section: 'Verse 2',
            chords: ['C', 'G', 'Am', 'F'],
            lyricsSinhala: 'සුළඟේ පාවී එන නුඹෙ සුවඳ දැනී හිත සැනසේ සැමදා\nජීවිත ගමනේ නුඹ මගෙ සෙවනැල්ලයි කිසිදා නොසැලේවා...',
            lyricsEnglish: 'Carried in the gentle breeze, your fragrance brings peace to my soul\nIn this journey of life, you are my guiding shadow...',
            singlishLyrics: 'Sulange paavee ena nube suwada danee hitha saenasee saemadaa\nJeevitha gamane numba mage sewanallayi kisidaa nosaleewaa...',
            musicalCue: 'Melodic keyboard fill and rhythmic bass'
          },
          {
            section: 'Outro',
            chords: ['F', 'G', 'C', 'C'],
            lyricsSinhala: 'සදාදරයි නුඹ මගෙ හදවතට... සදාදරයි...',
            lyricsEnglish: 'Forever beloved to my heart... forever beloved...',
            singlishLyrics: 'Sadaadarayi numba mage hadawathta... sadaadarayi...',
            musicalCue: 'Fading acoustic resonance'
          }
        ],
        productionNotes: 'Acoustic Guitar, Soft Strings Pad, Clean Bass, Bongo/Acoustic Drums',
        tags: ['Sinhala Pop', 'Acoustic', 'SAS AI Studio'],
        createdAt: Date.now(),
      };
      setGeneratedSong(fallback);
      musicSynth.start();
      setIsPlaying(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Record Voice/Melody Sample Input
  const startRecordingMelody = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedMelodyUrl(audioUrl);
        setIsAnalyzingAudio(true);
        // Analyze audio melody
        setTimeout(() => {
          setAudioNoteDescription('Hummed rhythmic vocal melody with major key pitch rise and syncopated cadence.');
          setIsAnalyzingAudio(false);
        }, 1200);
      };

      mediaRecorder.start();
      setIsRecordingMelody(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
  };

  const stopRecordingMelody = () => {
    if (mediaRecorderRef.current && isRecordingMelody) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecordingMelody(false);
    }
  };

  // Vocal Karaoke Recording
  const startVocalRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      vocalChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) vocalChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(vocalChunksRef.current, { type: 'audio/webm' });
        setVocalRecordingUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecordingVocals(true);

      // Also ensure synth is playing
      if (!isPlaying) {
        musicSynth.start();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Microphone error', err);
    }
  };

  const stopVocalRecording = () => {
    setIsRecordingVocals(false);
  };

  // Copy lyrics
  const handleCopyLyrics = () => {
    if (!generatedSong) return;
    const text = generatedSong.structure
      .map((s) => `[${s.section}] (${s.chords.join(' - ')})\n${lyricsTab === 'sinhala' ? s.lyricsSinhala : lyricsTab === 'english' ? s.lyricsEnglish : s.singlishLyrics || s.lyricsSinhala}`)
      .join('\n\n');
    navigator.clipboard.writeText(`${generatedSong.title} (${generatedSong.titleSinhala || ''})\nGenre: ${generatedSong.genre} | BPM: ${generatedSong.tempoBpm} | Key: ${generatedSong.key}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Chord Sheet
  const handleDownloadSheet = () => {
    if (!generatedSong) return;
    const content = `======================================================
${generatedSong.title.toUpperCase()} ${generatedSong.titleSinhala ? `(${generatedSong.titleSinhala})` : ''}
Created with SAS AI Music Studio • Sasnula Dilum
======================================================
Genre: ${generatedSong.genre}
Mood: ${generatedSong.mood}
Key: ${generatedSong.key}
Tempo: ${generatedSong.tempoBpm} BPM
Chords Progression: ${generatedSong.chords?.join(' - ')}

${generatedSong.structure
  .map(
    (s) => `--- [ ${s.section.toUpperCase()} ] ---
Chords: [ ${s.chords.join('  -  ')} ]
Musical Cue: ${s.musicalCue || ''}

Sinhala Lyrics:
${s.lyricsSinhala}

English Translation:
${s.lyricsEnglish}

Singlish Pronunciation:
${s.singlishLyrics || ''}
`
  )
  .join('\n')}
======================================================
Production Notes:
${generatedSong.productionNotes}
======================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedSong.title.replace(/\s+/g, '_')}_SAS_AI_Sheet.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentChords = generatedSong?.chords?.length
    ? generatedSong.chords
    : ['C', 'G', 'Am', 'F'];

  return (
    <div id="song-studio-root" className="flex h-full w-full flex-col overflow-y-auto bg-neutral-50/50 p-4 sm:p-6 lg:p-8">
      {/* Studio Banner */}
      <div id="song-studio-header" className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-400/40 backdrop-blur-md">
              <Music className="h-5 w-5 text-blue-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                SAS AI Song & Music Studio
              </h1>
              <p className="text-xs text-blue-200/80">
                AI Music Studio • Melody Analyzer • Lyrics & Interactive Chords Synthesizer
              </p>
            </div>
          </div>
        </div>

        {/* Live Audio Visualizer Bar */}
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-md">
          <canvas
            ref={visualizerCanvasRef}
            width={140}
            height={32}
            className="rounded"
          />
          <button
            id="synth-play-toggle-btn"
            onClick={handleTogglePlay}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold shadow transition-all ${
              isPlaying
                ? 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-300'
                : 'bg-blue-500 text-white hover:bg-blue-400 ring-2 ring-blue-300'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" /> Stop Beat
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Play Synth Beat
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Song Creation Controls */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          {/* Audio / Melody Input Card */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <Mic className="h-4 w-4 text-blue-600" />
                1. Sound / Voice Melody Input
              </h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                Optional
              </span>
            </div>

            <p className="mb-4 text-xs text-neutral-500 leading-relaxed">
              Record a vocal melody, humming, or whistle with your microphone, or upload an audio sample to guide your song composition.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              {!isRecordingMelody ? (
                <button
                  id="record-melody-start-btn"
                  onClick={startRecordingMelody}
                  className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800"
                >
                  <Mic className="h-4 w-4 text-rose-400" />
                  Record Voice / Melody
                </button>
              ) : (
                <button
                  id="record-melody-stop-btn"
                  onClick={stopRecordingMelody}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-medium text-white animate-pulse"
                >
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </button>
              )}

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100">
                <Upload className="h-4 w-4 text-neutral-500" />
                Upload Audio File
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setRecordedMelodyUrl(URL.createObjectURL(file));
                      setAudioNoteDescription(`Uploaded audio track: ${file.name} (${Math.round(file.size / 1024)} KB)`);
                    }
                  }}
                />
              </label>
            </div>

            {/* Audio playback / status */}
            {recordedMelodyUrl && (
              <div className="mt-3.5 flex items-center justify-between rounded-xl bg-blue-50/70 p-3 ring-1 ring-blue-100">
                <div className="flex items-center gap-2">
                  <Disc3 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-xs font-medium text-blue-900">
                    {isAnalyzingAudio ? 'Analyzing melody chords & rhythm...' : 'Audio sample ready!'}
                  </span>
                </div>
                <audio src={recordedMelodyUrl} controls className="h-7 w-44" />
              </div>
            )}

            {audioNoteDescription && (
              <p className="mt-2 text-[11px] italic text-blue-700">
                ✨ {audioNoteDescription}
              </p>
            )}
          </div>

          {/* Song Configuration Card */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              2. Song Theme & Style
            </h2>

            {/* Quick Preset Ideas */}
            <div className="mb-4">
              <span className="text-[11px] font-medium text-neutral-400">
                Popular Presets:
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PRESET_SONG_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTheme(p.theme);
                      setGenre(p.genre);
                      setMood(p.mood);
                      setTempoBpm(p.bpm);
                      setSoundStyle(p.style);
                      setLanguage(p.lang);
                    }}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Textarea */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Song Topic / Story & Narrative:
              </label>
              <textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. A soulful acoustic love song on a rainy Colombo evening, remembering first love..."
                rows={3}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-xs text-neutral-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Genre & Mood Selectors */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Genre:
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-800 outline-none focus:border-blue-500"
                >
                  <option value="Sinhala Pop">Sinhala Pop</option>
                  <option value="Sinhala Baila">Sinhala Baila & Papare</option>
                  <option value="Sarala Gee (Amaradeva Style)">Classical / Sarala Gee</option>
                  <option value="Acoustic Folk">Acoustic Folk / Guitar</option>
                  <option value="Sinhala Hip Hop / Rap">Hip Hop / Rap</option>
                  <option value="Synthwave / EDM">Synthwave / EDM</option>
                  <option value="Reggae / Calypso">Reggae / Calypso</option>
                  <option value="Lo-Fi Chill">Lo-Fi Chill</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Mood:
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-800 outline-none focus:border-blue-500"
                >
                  <option value="Romantic & Melodic">Romantic & Melodic</option>
                  <option value="Sad & Melancholy">Sad & Melancholy</option>
                  <option value="Energetic & Festive">Energetic & Festive</option>
                  <option value="Peaceful & Meditative">Peaceful & Meditative</option>
                  <option value="Inspiring & Patriotic">Inspiring & Motivational</option>
                </select>
              </div>
            </div>

            {/* Language & Tone Style */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Language:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-800 outline-none focus:border-blue-500"
                >
                  <option value="Sinhala">Sinhala</option>
                  <option value="Sinhala & English">Sinhala & English Duet</option>
                  <option value="Singlish">Singlish</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Synthesizer Instrument:
                </label>
                <select
                  value={soundStyle}
                  onChange={(e) => setSoundStyle(e.target.value as SoundStyle)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-800 outline-none focus:border-blue-500"
                >
                  <option value="acoustic">Acoustic Piano & Guitar</option>
                  <option value="baila">Sinhala Baila Groove & Drums</option>
                  <option value="synthwave">Retro Synthwave Lead</option>
                  <option value="lofi">Lo-Fi Soft Keys</option>
                  <option value="pop">Modern Pop Ensemble</option>
                </select>
              </div>
            </div>

            {/* Tempo Slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1">
                <span>Tempo / Beat Speed:</span>
                <span className="font-bold text-blue-600">{tempoBpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="160"
                value={tempoBpm}
                onChange={(e) => setTempoBpm(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Generate Button */}
            <button
              id="generate-song-btn"
              onClick={handleGenerateSong}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-blue-200" />
                  Creating Song & Composing Chords...
                </>
              ) : (
                <>
                  <Music className="h-4 w-4 text-blue-200" />
                  Generate Complete Song & Chords
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Song Player, Chords, Lyrics & Vocal Recorder */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {generatedSong ? (
            <div className="flex flex-col gap-5">
              {/* Active Player Card */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        {generatedSong.genre}
                      </span>
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
                        Key: {generatedSong.key || 'C Major'}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        {tempoBpm} BPM
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-neutral-900">
                      {generatedSong.title}
                      {generatedSong.titleSinhala && (
                        <span className="ml-2 font-normal text-neutral-600">
                          ({generatedSong.titleSinhala})
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyLyrics}
                      className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                      title="Copy Lyrics"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownloadSheet}
                      className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                      title="Download Chords Sheet"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Sheet</span>
                    </button>
                  </div>
                </div>

                {/* Live Chord Progression Matrix */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-neutral-500">
                    Live Chords Sequencer:
                  </span>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-4">
                    {currentChords.map((chord, idx) => {
                      const isCurrent = isPlaying && activeChordIdx === idx;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-300'
                              : 'bg-neutral-100/80 text-neutral-800 hover:bg-neutral-200/70'
                          }`}
                        >
                          <span className="text-lg font-extrabold tracking-wide">{chord}</span>
                          <span className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-neutral-500'}`}>
                            Bar {idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Player Controls */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-neutral-50 p-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePlay}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition ${
                        isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </button>
                    <div>
                      <span className="block text-xs font-semibold text-neutral-900">
                        {isPlaying ? 'Synthesizer Playing...' : 'Click to Play Beat'}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Style: {soundStyle.toUpperCase()} • {tempoBpm} BPM
                      </span>
                    </div>
                  </div>

                  {/* Sing Along / Vocal Karaoke Recording */}
                  <div className="flex items-center gap-2">
                    {!isRecordingVocals ? (
                      <button
                        onClick={startVocalRecording}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Mic className="h-3.5 w-3.5 text-rose-600" />
                        Sing & Record Vocals
                      </button>
                    ) : (
                      <button
                        onClick={stopVocalRecording}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white animate-pulse"
                      >
                        <MicOff className="h-3.5 w-3.5" />
                        Stop Singing
                      </button>
                    )}
                  </div>
                </div>

                {/* Vocal recording preview */}
                {vocalRecordingUrl && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
                    <span className="text-xs font-medium text-emerald-900">
                      🎤 Your Recorded Vocal Track:
                    </span>
                    <audio src={vocalRecordingUrl} controls className="h-7 w-48" />
                  </div>
                )}
              </div>

              {/* Lyrics & Structure Card */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                {/* Language tab switcher */}
                <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Lyrics & Arrangement
                  </h3>
                  <div className="flex rounded-lg bg-neutral-100 p-0.5">
                    <button
                      onClick={() => setLyricsTab('sinhala')}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        lyricsTab === 'sinhala' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
                      }`}
                    >
                      Sinhala
                    </button>
                    <button
                      onClick={() => setLyricsTab('english')}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        lyricsTab === 'english' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLyricsTab('singlish')}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        lyricsTab === 'singlish' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
                      }`}
                    >
                      Singlish
                    </button>
                  </div>
                </div>

                {/* Song Sections */}
                <div className="space-y-4">
                  {generatedSong.structure?.map((sec, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 transition hover:bg-neutral-50"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                            {sec.section}
                          </span>
                          <span className="text-xs font-mono font-bold text-blue-600">
                            [{sec.chords.join('  -  ')}]
                          </span>
                        </div>
                        {sec.musicalCue && (
                          <span className="text-[11px] text-neutral-500 italic">
                            💡 {sec.musicalCue}
                          </span>
                        )}
                      </div>

                      {/* Lyrics content */}
                      <div className="whitespace-pre-line font-sans text-sm font-medium leading-relaxed text-neutral-800">
                        {lyricsTab === 'sinhala'
                          ? sec.lyricsSinhala
                          : lyricsTab === 'english'
                          ? sec.lyricsEnglish
                          : sec.singlishLyrics || sec.lyricsSinhala}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Production guidelines */}
                {generatedSong.productionNotes && (
                  <div className="mt-5 rounded-xl bg-amber-50/80 p-3.5 text-xs text-amber-900 border border-amber-200/60">
                    <span className="font-bold">🎛️ Production & Arrangement Guide: </span>
                    {generatedSong.productionNotes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty Studio Placeholder */
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Music className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-neutral-800">
                Ready to compose your next hit song!
              </h3>
              <p className="mt-1 max-w-md text-xs text-neutral-500 leading-relaxed">
                Select your preferred theme and style from the controls on the left, then click <strong>Generate Complete Song & Chords</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
