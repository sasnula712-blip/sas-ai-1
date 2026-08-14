import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Bot,
  Globe2,
  Info,
  Check,
  Zap,
  Code2,
  LogIn,
  LogOut,
  User as UserIcon,
  Pin,
  Sliders,
  Cloud,
  Music,
  Image as ImageIcon,
  Clapperboard,
} from 'lucide-react';
import { ChatSession, Persona, AppMode } from '../types';
import { PERSONAS } from '../data/personas';
import { User, signOut, auth } from '../lib/firebase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string, e: React.MouseEvent) => void;
  onClearAllSessions: () => void;
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  user: User | null;
  onOpenAuthModal: () => void;
  onOpenPersonaModal: () => void;
  customPersonas: Persona[];
  appMode?: AppMode;
  onChangeAppMode?: (mode: AppMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onClearAllSessions,
  activePersonaId,
  onSelectPersona,
  user,
  onOpenAuthModal,
  onOpenPersonaModal,
  customPersonas,
  appMode = 'chat',
  onChangeAppMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const allPersonas = [...PERSONAS, ...customPersonas];

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort pinned chats to top
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingText(session.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingText.trim()) {
      onRenameSession(id, editingText.trim());
    }
    setEditingId(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error', e);
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-neutral-900/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar drawer container */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-full max-h-[100dvh] w-72 sm:w-80 flex-col border-r border-neutral-200 bg-neutral-50 backdrop-blur-md shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out lg:static lg:w-72 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Fixed Top Brand Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white/70 px-3.5 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-neutral-900 tracking-tight text-sm">SAS AI</span>
                <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-medium">Smart AI Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-200/60 lg:hidden active:scale-95"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Drawer Body - 100% reachable on all screen sizes */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
          {/* User Profile / Login Card */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-2.5 shadow-xs">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-7 w-7 rounded-full object-cover border border-neutral-200"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <Cloud className="h-2.5 w-2.5" />
                      <span>Cloud Sync Active</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 active:scale-98"
              >
                <LogIn className="h-3.5 w-3.5 text-blue-400" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

          {/* New Chat Button */}
          <button
            id="btn-sidebar-new-chat"
            onClick={() => {
              if (onChangeAppMode) onChangeAppMode('chat');
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>

          {/* Creative Studios Hub Switcher */}
          {onChangeAppMode && (
            <div className="rounded-xl border border-neutral-200/80 bg-white p-1.5 shadow-xs space-y-1">
              <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Creative Studios
              </div>
              <button
                onClick={() => {
                  onChangeAppMode('chat');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                  appMode === 'chat'
                    ? 'bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-200'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="truncate">SAS AI Chat Assistant</span>
              </button>
              <button
                onClick={() => {
                  onChangeAppMode('song-studio');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                  appMode === 'song-studio'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Music className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Song & Music Maker</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${appMode === 'song-studio' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  Music
                </span>
              </button>
              <button
                onClick={() => {
                  onChangeAppMode('image-studio');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                  appMode === 'image-studio'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-purple-600'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Photo & Art Generator</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${appMode === 'image-studio' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
                  Photo
                </span>
              </button>
              <button
                onClick={() => {
                  onChangeAppMode('video-studio');
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                  appMode === 'video-studio'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-rose-600'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clapperboard className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Video Storyboard Studio</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${appMode === 'video-studio' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'}`}>
                  Video
                </span>
              </button>
            </div>
          )}

          {/* Search Conversations */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-1.5 pl-8 pr-7 text-xs text-neutral-800 placeholder-neutral-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Conversations List Section */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-xs space-y-1">
            <div className="px-1 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Conversations ({sessions.length})</span>
              <div className="flex items-center gap-1.5">
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={onClearAllSessions}
                    className="text-neutral-400 hover:text-rose-600 transition flex items-center gap-0.5 lowercase first-letter:uppercase text-[10px] font-medium"
                    title="Clear all conversations"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    <span>Clear</span>
                  </button>
                )}
                {user && <span className="text-emerald-600 text-[9px] font-semibold">SYNCED</span>}
              </div>
            </div>

            {sortedSessions.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                {searchTerm ? 'No chats match your search.' : 'No conversations yet.'}
              </div>
            ) : (
              <div className="space-y-0.5 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                {sortedSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const isEditing = editingId === session.id;

                  return (
                    <div
                      key={session.id}
                      id={`chat-item-${session.id}`}
                      onClick={() => {
                        if (!isEditing) {
                          onSelectSession(session.id);
                          if (window.innerWidth < 1024) onClose();
                        }
                      }}
                      className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs transition ${
                        isActive
                          ? 'bg-blue-50/80 font-semibold text-blue-950 shadow-xs ring-1 ring-blue-200'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2 flex-1">
                        {session.isPinned ? (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500 rotate-45" />
                        ) : (
                          <MessageSquare
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isActive ? 'text-blue-600' : 'text-neutral-400 group-hover:text-neutral-600'
                            }`}
                          />
                        )}

                        {isEditing ? (
                          <form
                            onSubmit={(e) => handleSaveRename(session.id, e)}
                            className="flex-1 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={(e) => handleSaveRename(session.id, e)}
                              autoFocus
                              className="w-full rounded border border-blue-400 bg-white px-1.5 py-0.5 text-xs text-neutral-800 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </form>
                        ) : (
                          <span className="truncate">{session.title || 'Untitled Chat'}</span>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
                          <button
                            onClick={(e) => onTogglePinSession(session.id, e)}
                            className={`rounded p-1 transition ${
                              session.isPinned ? 'text-amber-500' : 'text-neutral-400 hover:text-neutral-700'
                            }`}
                            title={session.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleStartRename(session, e)}
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700"
                            title="Rename"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => onDeleteSession(session.id, e)}
                            className="rounded p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personas management */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-2.5 shadow-xs space-y-2">
            <div className="px-0.5 flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <span>Assistants</span>
              <button
                onClick={onOpenPersonaModal}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition lowercase first-letter:uppercase text-[10px] font-bold"
              >
                <Sliders className="h-3 w-3" />
                <span>Customize</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {allPersonas.slice(0, 4).map((p) => {
                const isSelected = p.id === activePersonaId;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPersona(p.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-left text-[11px] transition truncate ${
                      isSelected
                        ? 'bg-blue-100 text-blue-900 font-bold'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    title={`${p.name} - ${p.description}`}
                  >
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Created by Sasnula Dilum Attribution & Footer Actions */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-2.5 shadow-xs space-y-2 pb-6">
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition"
              >
                <Info className="h-3.5 w-3.5" />
                <span>About</span>
              </button>

              {sessions.length > 1 && (
                <button
                  onClick={onClearAllSessions}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                  title="Delete all chat history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Designer attribution badge */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-2 text-center">
              <p className="text-[11px] font-medium text-neutral-700">
                Created by <span className="font-bold text-neutral-900">Sasnula Dilum</span>
              </p>
              <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-neutral-400">
                <span>Next-Gen Intelligence</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">About SAS AI</h3>
                  <p className="text-[11px] text-neutral-500">Created by Sasnula Dilum</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-neutral-600">
              <div className="rounded-xl bg-blue-50/80 p-3 text-blue-900">
                <p className="font-semibold mb-1">⚡ Next-Gen Intelligence Engine</p>
                <p>
                  <strong>SAS AI</strong> provides high-speed multimodal understanding, cloud chat synchronization with Firebase, custom persona design, and real-time streaming with web grounding.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Globe2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-800">Web Search Grounding:</span>{' '}
                    Enable real-time search to retrieve live web data with direct source citations.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Cloud className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-800">Cloud Sync & Security:</span>{' '}
                    Sign in with Email or Google to sync all conversations securely across devices.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-800">Custom Personas:</span>{' '}
                    Build your own specialized assistant experts with dedicated prompt guidelines.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Code2 className="h-4 w-4 shrink-0 text-neutral-700 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-800">Author & Creator:</span>{' '}
                    Proudly designed and engineered by <strong>Sasnula Dilum</strong>.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
