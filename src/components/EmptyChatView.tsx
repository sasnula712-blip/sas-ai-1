import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Code2,
  Languages,
  PenTool,
  GraduationCap,
  ArrowRight,
  Atom,
  FileText,
  Compass,
  Zap,
  Sliders,
  Music,
  Image as ImageIcon,
  Clapperboard,
  Mic,
} from 'lucide-react';
import { PERSONAS, STARTER_PROMPTS } from '../data/personas';
import { Persona, AppMode } from '../types';

interface EmptyChatViewProps {
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  onSelectPrompt: (prompt: string) => void;
  customPersonas?: Persona[];
  onOpenPersonaModal?: () => void;
  onOpenStudio?: (mode: AppMode) => void;
}

export const EmptyChatView: React.FC<EmptyChatViewProps> = ({
  activePersonaId,
  onSelectPersona,
  onSelectPrompt,
  customPersonas = [],
  onOpenPersonaModal,
  onOpenStudio,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const allPersonas = [...PERSONAS, ...customPersonas];

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'Languages':
        return <Languages className="h-4 w-4" />;
      case 'Code2':
        return <Code2 className="h-4 w-4" />;
      case 'PenTool':
        return <PenTool className="h-4 w-4" />;
      case 'GraduationCap':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getPromptIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom':
        return <Atom className="h-4 w-4" />;
      case 'Code2':
        return <Code2 className="h-4 w-4" />;
      case 'FileText':
        return <FileText className="h-4 w-4" />;
      case 'Compass':
        return <Compass className="h-4 w-4" />;
      case 'Languages':
        return <Languages className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const filteredPrompts =
    activeCategory === 'all'
      ? STARTER_PROMPTS
      : STARTER_PROMPTS.filter((p) => p.category === activeCategory);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center sm:px-6 md:py-10">
      {/* Brand Hero & Creator Badge */}
      <div className="mx-auto mb-6 max-w-2xl">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <Bot className="h-7 w-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-1 text-xs font-semibold text-blue-800 mb-2.5 shadow-xs">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>SAS AI • Created by Sasnula Dilum</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
          What would you like to create today?
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-lg mx-auto">
          Create AI music with voice & audio, generate photorealistic art, compose video storyboards, or converse in Sinhala & English.
        </p>
      </div>

      {/* Primary Studio Quick Launch Hub */}
      {onOpenStudio && (
        <div className="mb-8 w-full max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            {/* Song Maker Card */}
            <button
              id="home-card-song-studio"
              onClick={() => onOpenStudio('song-studio')}
              className="group relative flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-indigo-50/40 to-white p-4.5 shadow-xs transition hover:border-blue-500 hover:shadow-md active:scale-98"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Music className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Featured • Music Studio
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                  AI Song & Music Maker
                </h3>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                  Compose original songs from voice melodies or lyrical themes with chords and synth accompaniment.
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-blue-600">
                <span>Launch Studio</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* Photo Generator Card */}
            <button
              id="home-card-image-studio"
              onClick={() => onOpenStudio('image-studio')}
              className="group relative flex flex-col justify-between rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-500/10 via-indigo-50/40 to-white p-4.5 shadow-xs transition hover:border-purple-500 hover:shadow-md active:scale-98"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  Photo Gen
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 group-hover:text-purple-600 transition-colors">
                  AI Photo & Art Generator
                </h3>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                  Generate photorealistic 8K images, anime artwork, 3D character renders, and cinematic visuals.
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-purple-600">
                <span>Generate Photos</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* Video Storyboard Card */}
            <button
              id="home-card-video-studio"
              onClick={() => onOpenStudio('video-studio')}
              className="group relative flex flex-col justify-between rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-500/10 via-indigo-50/40 to-white p-4.5 shadow-xs transition hover:border-rose-500 hover:shadow-md active:scale-98"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Clapperboard className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  Video Studio
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 group-hover:text-rose-600 transition-colors">
                  Video & Storyboards
                </h3>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                  Plan scene-by-scene camera shots, scripts, voiceovers, and animated timeline previews.
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-rose-600">
                <span>Create Storyboard</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Persona Selection Pills */}
      <div className="mb-6 w-full max-w-2xl">
        <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          <span>AI Assistant Personas</span>
          {onOpenPersonaModal && (
            <button
              onClick={onOpenPersonaModal}
              className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1 font-semibold"
            >
              <Sliders className="h-3 w-3" />
              <span>+ Custom Persona</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {allPersonas.map((p) => {
            const isSelected = p.id === activePersonaId;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition active:scale-98 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-600'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <span className={isSelected ? 'text-blue-600' : 'text-neutral-500'}>
                  {getPersonaIcon(p.iconName)}
                </span>
                <span className="font-semibold">{p.name}</span>
                <span className="text-[10px] text-neutral-400 font-normal">({p.roleTag})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Filter Tabs */}
      <div className="mb-4 flex flex-wrap justify-center gap-1.5">
        {[
          { id: 'all', label: 'All Topics' },
          { id: 'coding', label: 'Coding' },
          { id: 'knowledge', label: 'Science & Math' },
          { id: 'writing', label: 'Writing & Letters' },
          { id: 'creative', label: 'Creative Ideas' },
          { id: 'business', label: 'Business' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              activeCategory === cat.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Starter Prompts Grid */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
        {filteredPrompts.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-xs active:scale-98"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition group-hover:bg-blue-600 group-hover:text-white">
              {getPromptIcon(item.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="truncate text-xs font-bold text-neutral-800 group-hover:text-blue-950">
                  {item.title}
                </h4>
                <ArrowRight className="h-3 w-3 text-neutral-400 opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </div>
              <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                {item.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
