import React, { useState, useEffect, useRef } from 'react';
import {
  Clapperboard,
  Film,
  Play,
  Square,
  Sparkles,
  Camera,
  Layers,
  Download,
  Copy,
  Check,
  Video,
  Volume2,
  Clock,
  Maximize2,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { VideoStoryboard, StoryboardScene } from '../types';

const PRESET_VIDEO_CONCEPTS = [
  {
    title: 'Sri Lanka 2050 Cyberpunk Lotus',
    concept: 'A cinematic futuristic journey through Neo Colombo with glowing lotus skyscrapers, flying tuk-tuks, and neon monsoon rain',
    genre: 'Cinematic Sci-Fi',
    aspectRatio: '16:9',
  },
  {
    title: 'Sigiriya Ancient Legends',
    concept: 'An epic historical documentary opening revealing King Kashyapa walking upon the Lion Rock fortress in misty sunrise',
    genre: 'Historical Epic / Documentary',
    aspectRatio: '16:9',
  },
  {
    title: 'Tropical Ocean Wildlife Odyssey',
    concept: 'Crystal-clear underwater tracking shots of majestic blue whales gliding past coral reefs off the coast of Mirissa',
    genre: 'Nature Documentary (BBC Earth Style)',
    aspectRatio: '16:9',
  },
  {
    title: 'High-Tech Supercar Commercial',
    concept: 'Sleek electric hypercar speeding through mountain pass turns in Ella with cinematic dynamic drone tracking and tire smoke',
    genre: 'Commercial / Action',
    aspectRatio: '16:9',
  },
];

export const VideoStudio: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [genre, setGenre] = useState('Cinematic Sci-Fi');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [durationSeconds, setDurationSeconds] = useState(60);

  const [isGenerating, setIsGenerating] = useState(false);
  const [storyboard, setStoryboard] = useState<VideoStoryboard | null>(null);

  // Playback & Animation preview state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [copiedScript, setCopiedScript] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Play through scenes in animated timeline preview
  useEffect(() => {
    if (isPlayingPreview && storyboard && storyboard.scenes.length > 0) {
      const currentScene = storyboard.scenes[currentSceneIdx];
      const durationMs = (currentScene?.durationSeconds || 6) * 1000;

      timerRef.current = window.setTimeout(() => {
        if (currentSceneIdx < storyboard.scenes.length - 1) {
          setCurrentSceneIdx((prev) => prev + 1);
        } else {
          setIsPlayingPreview(false);
          setCurrentSceneIdx(0);
        }
      }, durationMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlayingPreview, currentSceneIdx, storyboard]);

  // Generate Storyboard
  const handleGenerateStoryboard = async () => {
    if (!concept.trim()) return;
    setIsGenerating(true);
    setIsPlayingPreview(false);

    try {
      const res = await fetch('/api/video/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: concept.trim(),
          genre,
          aspectRatio,
          durationSeconds,
        }),
      });

      if (!res.ok) throw new Error('Video generation failed');
      const data: VideoStoryboard = await res.json();
      setStoryboard(data);
      setCurrentSceneIdx(0);
    } catch (err) {
      console.error('Video storyboard error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      setIsPlayingPreview(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setIsPlayingPreview(true);
    }
  };

  const handleCopyPrompts = () => {
    if (!storyboard) return;
    const text = storyboard.scenes
      .map(
        (s) =>
          `[Scene ${s.sceneNumber} - ${s.shotType} (${s.durationSeconds}s)]\nVisual Prompt: ${s.visualPrompt}\nAction: ${s.actionDescription}\nVoiceover: ${s.dialogueOrVoiceover}\nAudio: ${s.soundtrackAndAudio}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(
      `${storyboard.title.toUpperCase()}\nLogline: ${storyboard.logline}\n\n${text}`
    );
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const currentScene = storyboard?.scenes?.[currentSceneIdx];

  return (
    <div id="video-studio-root" className="flex h-full w-full flex-col overflow-y-auto bg-neutral-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-rose-200/70 bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 ring-1 ring-rose-400/40 backdrop-blur-md">
            <Clapperboard className="h-5 w-5 text-rose-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              SAS AI Video & Storyboard Studio
            </h1>
            <p className="text-xs text-rose-200/80">
              AI Video & Storyboard Studio • Cinematic Prompts, Camera Shots & Scripts
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Concept & Settings */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Film className="h-4 w-4 text-rose-600" />
              Video Idea & Narrative
            </h2>

            {/* Presets */}
            <div className="mb-3">
              <span className="text-[11px] font-medium text-neutral-400">
                Popular Cinematic Presets:
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {PRESET_VIDEO_CONCEPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setConcept(p.concept);
                      setGenre(p.genre);
                    }}
                    className="truncate max-w-[200px] rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] text-neutral-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Concept Textarea */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Concept & Scene Description:
              </label>
              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. A lush rainforest wildlife documentary with drone tracking over elephants in morning mist..."
                rows={4}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-xs text-neutral-900 outline-none transition focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {/* Genre & Aspect Ratio */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Genre / Mood:
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-800 outline-none focus:border-rose-500"
                >
                  <option value="Cinematic Sci-Fi">Cinematic Sci-Fi</option>
                  <option value="Sri Lankan Travel Documentary">Travel & Culture</option>
                  <option value="Music Video Cinematic">Music Video</option>
                  <option value="Action Thriller">Action & Adrenaline</option>
                  <option value="Commercial Brand Ad">Commercial Ad</option>
                  <option value="Epic Fantasy Adventure">Epic Fantasy</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Aspect Ratio:
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-800 outline-none focus:border-rose-500"
                >
                  <option value="16:9">16:9 Widescreen (YouTube/Film)</option>
                  <option value="9:16">9:16 Vertical (TikTok/Reels/Shorts)</option>
                  <option value="1:1">1:1 Square (Instagram)</option>
                </select>
              </div>
            </div>

            {/* Duration */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1">
                <span>Target Video Length:</span>
                <span className="font-bold text-rose-600">{durationSeconds}s</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Generate Storyboard Button */}
            <button
              id="generate-video-storyboard-btn"
              onClick={handleGenerateStoryboard}
              disabled={isGenerating || !concept.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-rose-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-rose-200" />
                  Directing Scenes & Composing Storyboard...
                </>
              ) : (
                <>
                  <Clapperboard className="h-4 w-4 text-rose-200" />
                  Generate Video Storyboard
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Storyboard & Animated Player */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {storyboard ? (
            <div className="flex flex-col gap-5">
              {/* Animated Scene Player Card */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-950 text-white shadow-lg">
                {/* Cinematic Player Screen */}
                <div className="relative flex aspect-video w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-neutral-950 p-6">
                  {/* Subtle animated particles/gradient glow */}
                  <div
                    className={`absolute inset-0 bg-radial from-rose-500/15 via-transparent to-transparent transition-transform duration-1000 ${
                      isPlayingPreview ? 'scale-125' : 'scale-100'
                    }`}
                  />

                  {/* Top Bar: Scene indicator & Duration */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-rose-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                        Scene {currentScene?.sceneNumber} of {storyboard.scenes.length}
                      </span>
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/80 backdrop-blur-md">
                        {currentScene?.shotType}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">
                      {currentScene?.durationSeconds}s shot
                    </span>
                  </div>

                  {/* Center Visual Action & Camera Movement */}
                  <div className="relative z-10 my-auto text-center px-4">
                    <p className="text-sm font-semibold tracking-wide text-rose-300 uppercase">
                      Action & Camera Movement:
                    </p>
                    <p className="mt-1.5 text-base font-medium text-white leading-relaxed line-clamp-3">
                      "{currentScene?.actionDescription}"
                    </p>
                  </div>

                  {/* Bottom Subtitle / Voiceover & Audio */}
                  <div className="relative z-10 rounded-xl bg-black/60 p-3.5 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold mb-1">
                      <Volume2 className="h-3.5 w-3.5" />
                      Voiceover / Dialogue:
                    </div>
                    <p className="text-xs italic text-neutral-200">
                      "{currentScene?.dialogueOrVoiceover}"
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      🎵 SFX: {currentScene?.soundtrackAndAudio}
                    </p>
                  </div>
                </div>

                {/* Player Timeline Controls */}
                <div className="flex items-center justify-between bg-neutral-900 p-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTogglePreview}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-500 transition"
                    >
                      {isPlayingPreview ? (
                        <Square className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div>
                      <span className="block text-xs font-bold text-white">
                        {isPlayingPreview ? 'Simulating Scene Playback...' : 'Play Storyboard Sequence'}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {storyboard.title} • {storyboard.totalDurationSeconds}s Total
                      </span>
                    </div>
                  </div>

                  {/* Scene Jumper buttons */}
                  <div className="flex items-center gap-1.5">
                    {storyboard.scenes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentSceneIdx(idx);
                          setIsPlayingPreview(false);
                        }}
                        className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                          currentSceneIdx === idx
                            ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scene Breakdown List */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">
                      Scene-by-Scene Cinematic Breakdown
                    </h3>
                    <p className="text-xs text-neutral-500">{storyboard.logline}</p>
                  </div>
                  <button
                    onClick={handleCopyPrompts}
                    className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedScript ? 'Copied' : 'Copy Prompts'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {storyboard.scenes.map((scene, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentSceneIdx(idx)}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        currentSceneIdx === idx
                          ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500'
                          : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                          Scene {scene.sceneNumber}: {scene.shotType}
                        </span>
                        <span className="text-xs font-medium text-neutral-500">
                          {scene.durationSeconds}s
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-semibold text-neutral-700">🎨 Visual Generation Prompt:</span>
                          <p className="mt-0.5 rounded-lg bg-white p-2 text-neutral-800 border border-neutral-200/70 font-mono text-[11px]">
                            {scene.visualPrompt}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-700">🎬 Action:</span>
                          <span className="ml-1 text-neutral-800">{scene.actionDescription}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-700">🗣️ Voiceover:</span>
                          <span className="ml-1 italic text-neutral-800">"{scene.dialogueOrVoiceover}"</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Clapperboard className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-neutral-800">
                Plan & Direct your Cinematic Video
              </h3>
              <p className="mt-1 max-w-md text-xs text-neutral-500">
                Enter your video idea on the left and click <strong>Generate Video Storyboard</strong> to create shot-by-shot visual prompts and voiceovers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
