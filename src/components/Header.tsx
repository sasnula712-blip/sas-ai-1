import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  Plus,
  Trash2,
  Globe,
  Download,
  Check,
  ChevronDown,
  FileCode2,
  FileText,
  FileJson,
  Layers,
  LogIn,
  Sliders,
  Music,
  Image as ImageIcon,
  Clapperboard,
  MessageSquare,
} from 'lucide-react';
import { PERSONAS } from '../data/personas';
import { Persona, AppMode } from '../types';
import { User } from '../lib/firebase';

interface HeaderProps {
  currentTitle: string;
  onUpdateTitle: (title: string) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onClearCurrentChat: () => void;
  onExportChat: (format: 'markdown' | 'text' | 'json') => void;
  personaId: string;
  onSelectPersona: (id: string) => void;
  useSearch: boolean;
  onToggleSearch: () => void;
  messageCount: number;
  user: User | null;
  onOpenAuthModal: () => void;
  onOpenPersonaModal: () => void;
  customPersonas: Persona[];
  appMode: AppMode;
  onChangeAppMode: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTitle,
  onUpdateTitle,
  onNewChat,
  onToggleSidebar,
  onClearCurrentChat,
  onExportChat,
  personaId,
  onSelectPersona,
  useSearch,
  onToggleSearch,
  messageCount,
  user,
  onOpenAuthModal,
  onOpenPersonaModal,
  customPersonas,
  appMode,
  onChangeAppMode,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(currentTitle);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  const allPersonas = [...PERSONAS, ...customPersonas];
  const activePersona = allPersonas.find((p) => p.id === personaId) || PERSONAS[0];

  useEffect(() => {
    setTempTitle(currentTitle);
  }, [currentTitle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (personaRef.current && !personaRef.current.contains(event.target as Node)) {
        setShowPersonaMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(currentTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-20 flex flex-col border-b border-neutral-200/80 bg-white/95 backdrop-blur-md select-none"
    >
      {/* Top Main Row */}
      <div className="flex h-14 w-full items-center justify-between px-3 sm:px-5">
        {/* Left section: Sidebar toggle & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-95"
            title="Toggle Sidebar"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <div className="min-w-0 max-w-[120px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-[320px]">
            {isEditingTitle && appMode === 'chat' ? (
              <form onSubmit={handleTitleSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  autoFocus
                  className="w-full rounded-md border border-blue-500 bg-white px-2 py-1 text-xs font-semibold text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"
                >
                  <Check className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div
                onClick={() => {
                  if (appMode === 'chat') {
                    setTempTitle(currentTitle);
                    setIsEditingTitle(true);
                  }
                }}
                className={`group flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 transition ${
                  appMode === 'chat' ? 'cursor-pointer hover:bg-neutral-100/80' : ''
                }`}
                title={appMode === 'chat' ? 'Click to rename chat' : undefined}
              >
                <h1 className="truncate text-xs font-semibold text-neutral-800 sm:text-sm">
                  {appMode === 'chat'
                    ? currentTitle || 'New Conversation'
                    : appMode === 'song-studio'
                    ? '🎵 SAS AI Music & Song Studio'
                    : appMode === 'image-studio'
                    ? '🎨 SAS AI Photo & Art Generator'
                    : '🎬 SAS AI Video Storyboard Studio'}
                </h1>
                {appMode === 'chat' && (
                  <span className="hidden text-[11px] text-neutral-400 group-hover:inline">
                    ✎
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center/Top Studio Tabs (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center gap-1 rounded-xl bg-neutral-100/80 p-1 border border-neutral-200/60 shadow-xs">
          <button
            onClick={() => onChangeAppMode('chat')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              appMode === 'chat'
                ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-black/5'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
            <span>Chat AI</span>
          </button>
          <button
            onClick={() => onChangeAppMode('song-studio')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              appMode === 'song-studio'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-blue-700 hover:bg-white/50'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>Song Maker</span>
          </button>
          <button
            onClick={() => onChangeAppMode('image-studio')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              appMode === 'image-studio'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-purple-700 hover:bg-white/50'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Photo Gen</span>
          </button>
          <button
            onClick={() => onChangeAppMode('video-studio')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
              appMode === 'video-studio'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-rose-700 hover:bg-white/50'
            }`}
          >
            <Clapperboard className="h-3.5 w-3.5" />
            <span>Video Studio</span>
          </button>
        </div>

        {/* Right section: Persona selector, Search toggle, Export & Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Persona Selector Dropdown (Shown in chat mode) */}
          {appMode === 'chat' && (
            <div className="relative" ref={personaRef}>
              <button
                id="btn-persona-dropdown"
                onClick={() => {
                  setShowPersonaMenu(!showPersonaMenu);
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 active:scale-98"
                title="Choose AI Mode"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="hidden sm:inline font-medium">{activePersona.name}</span>
                <span className="inline sm:hidden font-medium">{activePersona.roleTag}</span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>

              {showPersonaMenu && (
                <div
                  id="persona-dropdown-menu"
                  className="absolute right-0 top-full mt-1.5 w-72 origin-top-right rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-30 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    <span>Select Persona</span>
                    <button
                      onClick={() => {
                        setShowPersonaMenu(false);
                        onOpenPersonaModal();
                      }}
                      className="text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <Sliders className="h-2.5 w-2.5" />
                      <span>Custom</span>
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {allPersonas.map((p) => {
                      const isSelected = p.id === personaId;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSelectPersona(p.id);
                            setShowPersonaMenu(false);
                          }}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                            isSelected
                              ? 'bg-blue-50/90 text-blue-900 font-medium ring-1 ring-blue-200'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{p.name}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                            </div>
                            <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                              {p.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Web Search Toggle in Chat mode */}
          {appMode === 'chat' && (
            <button
              id="btn-header-search-toggle"
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition active:scale-98 ${
                useSearch
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
              title={
                useSearch
                  ? 'Web Search is ON (provides live online facts and sources)'
                  : 'Turn on Web Search'
              }
            >
              <Globe
                className={`h-3.5 w-3.5 ${
                  useSearch ? 'text-emerald-600' : 'text-neutral-400'
                }`}
              />
              <span className="hidden md:inline">Web Search</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  useSearch ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'
                }`}
              />
            </button>
          )}

          {/* Clear Current Chat Messages (if messages exist) */}
          {appMode === 'chat' && messageCount > 0 && (
            <button
              id="btn-header-clear-chat"
              onClick={onClearCurrentChat}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              title="Clear / Delete all messages in this chat"
              aria-label="Clear chat messages"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {/* Export Menu in chat mode */}
          {appMode === 'chat' && messageCount > 0 && (
            <div className="relative" ref={exportRef}>
              <button
                id="btn-export-chat"
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowPersonaMenu(false);
                }}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 active:scale-95"
                title="Export Conversation"
                aria-label="Export conversation"
              >
                <Download className="h-4 w-4" />
              </button>

              {showExportMenu && (
                <div
                  id="export-dropdown-menu"
                  className="absolute right-0 top-full mt-1.5 w-48 origin-top-right rounded-xl border border-neutral-200 bg-white p-1 shadow-xl ring-1 ring-black/5 z-30"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Export Chat
                  </div>
                  <button
                    onClick={() => {
                      onExportChat('markdown');
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 transition"
                  >
                    <FileCode2 className="h-3.5 w-3.5 text-neutral-500" />
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => {
                      onExportChat('text');
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 transition"
                  >
                    <FileText className="h-3.5 w-3.5 text-neutral-500" />
                    Plain Text (.txt)
                  </button>
                  <button
                    onClick={() => {
                      onExportChat('json');
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 transition"
                  >
                    <FileJson className="h-3.5 w-3.5 text-neutral-500" />
                    JSON Data (.json)
                  </button>
                  <div className="my-1 border-t border-neutral-100" />
                  <button
                    onClick={() => {
                      onClearCurrentChat();
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Messages
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Auth Login Button in Header for quick access */}
          {!user && (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 shadow-xs"
            >
              <LogIn className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* New Chat Button */}
          {appMode === 'chat' && (
            <button
              id="btn-header-new-chat"
              onClick={onNewChat}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 sm:text-sm"
              title="Start a new chat"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Studio Mode Bar */}
      <div className="flex lg:hidden items-center justify-around border-t border-neutral-100 bg-neutral-50/90 px-2 py-1.5">
        <button
          onClick={() => onChangeAppMode('chat')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            appMode === 'chat'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-200/50'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => onChangeAppMode('song-studio')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            appMode === 'song-studio'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-200/50'
          }`}
        >
          <Music className="h-3.5 w-3.5" />
          <span>Songs</span>
        </button>
        <button
          onClick={() => onChangeAppMode('image-studio')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            appMode === 'image-studio'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-200/50'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Photos</span>
        </button>
        <button
          onClick={() => onChangeAppMode('video-studio')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            appMode === 'video-studio'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-200/50'
          }`}
        >
          <Clapperboard className="h-3.5 w-3.5" />
          <span>Videos</span>
        </button>
      </div>
    </header>
  );
};
