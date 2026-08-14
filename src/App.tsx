import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyChatView } from './components/EmptyChatView';
import { ImageModal } from './components/ImageModal';
import { AuthModal } from './components/AuthModal';
import { CustomPersonaModal } from './components/CustomPersonaModal';
import { SongStudio } from './components/SongStudio';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import { ChatSession, Message, ChatImage, Persona, AppMode } from './types';
import { PERSONAS } from './data/personas';
import {
  auth,
  db,
  onAuthStateChanged,
  User,
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from './lib/firebase';
import { ArrowDown } from 'lucide-react';

const STORAGE_SESSIONS_KEY = 'sas_ai_sessions_v1';
const STORAGE_CURRENT_KEY = 'sas_ai_current_session_id_v1';
const STORAGE_CUSTOM_PERSONAS_KEY = 'sas_ai_custom_personas_v1';

function createNewSession(personaId = 'general', userId?: string): ChatSession {
  const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || undefined,
    title: 'New Conversation',
    messages: [],
    personaId: persona.id,
    useSearch: false,
    isPinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  const [customPersonas, setCustomPersonas] = useState<Persona[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_PERSONAS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load sessions from storage', e);
    }
    return [createNewSession()];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (savedId && sessions.some((s) => s.id === savedId)) {
        return savedId;
      }
    } catch (e) {}
    return sessions[0]?.id || '';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ChatImage | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Firestore real-time synchronization for Chats
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudChats: ChatSession[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ChatSession;
            cloudChats.push(data);
          });
          cloudChats.sort((a, b) => b.updatedAt - a.updatedAt);
          setSessions(cloudChats);
          if (cloudChats.length > 0 && !cloudChats.some((c) => c.id === currentSessionId)) {
            setCurrentSessionId(cloudChats[0].id);
          }
        }
      },
      (error) => {
        console.error('Firestore sync error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Firestore sync for Custom Personas
  useEffect(() => {
    if (!user) return;

    const personasRef = collection(db, 'customPersonas');
    const q = query(personasRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudPersonas: Persona[] = [];
          snapshot.forEach((docSnap) => {
            cloudPersonas.push(docSnap.data() as Persona);
          });
          setCustomPersonas(cloudPersonas);
        }
      },
      (err) => console.error('Persona sync error:', err)
    );

    return () => unsubscribe();
  }, [user]);

  // Save sessions to localStorage & Firestore if signed in
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  }, [sessions]);

  // Save custom personas locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_PERSONAS_KEY, JSON.stringify(customPersonas));
    } catch (e) {}
  }, [customPersonas]);

  // Save currentSessionId
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(STORAGE_CURRENT_KEY, currentSessionId);
    }
  }, [currentSessionId]);

  const activeSession =
    sessions.find((s) => s.id === currentSessionId) || sessions[0] || createNewSession();

  // Helper to persist single session to Firestore
  const syncSessionToCloud = async (session: ChatSession) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'chats', session.id), {
        ...session,
        userId: user.uid,
      });
    } catch (err) {
      console.error('Failed to sync chat to cloud', err);
    }
  };

  // Scroll detection for "Scroll to bottom" floater
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [currentSessionId]);

  // Session Handlers
  const handleNewChat = (personaId?: string) => {
    const newSession = createNewSession(personaId || activeSession.personaId, user?.uid);
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (user) {
      syncSessionToCloud(newSession);
    }
  };

  const handleSelectSession = (id: string) => {
    if (isGenerating) {
      handleStopGeneration();
    }
    setCurrentSessionId(id);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      try {
        await deleteDoc(doc(db, 'chats', id));
      } catch (err) {
        console.error('Delete cloud session error', err);
      }
    }

    if (sessions.length <= 1) {
      const fresh = createNewSession('general', user?.uid);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      if (user) syncSessionToCloud(fresh);
      return;
    }

    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated[0].id);
    }
  };

  const handleTogglePinSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, isPinned: !s.isPinned, updatedAt: Date.now() };
          if (user) syncSessionToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, title: newTitle, updatedAt: Date.now() };
          if (user) syncSessionToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const handleClearAllSessions = async () => {
    if (window.confirm('Are you sure you want to delete all conversation history?')) {
      if (user) {
        for (const s of sessions) {
          try {
            await deleteDoc(doc(db, 'chats', s.id));
          } catch (e) {}
        }
      }
      const fresh = createNewSession('general', user?.uid);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      if (user) syncSessionToCloud(fresh);
    }
  };

  const handleClearCurrentChat = () => {
    if (window.confirm('Clear all messages in this conversation?')) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            const updated = { ...s, messages: [], updatedAt: Date.now() };
            if (user) syncSessionToCloud(updated);
            return updated;
          }
          return s;
        })
      );
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedMsgs = s.messages.filter((m) => m.id !== messageId);
          const updated = { ...s, messages: updatedMsgs, updatedAt: Date.now() };
          if (user) syncSessionToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const handleSelectPersona = (personaId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updated = { ...s, personaId, updatedAt: Date.now() };
          if (user) syncSessionToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const handleToggleSearch = () => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updated = { ...s, useSearch: !s.useSearch, updatedAt: Date.now() };
          if (user) syncSessionToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const handleSaveCustomPersona = async (personaData: Omit<Persona, 'id'>) => {
    const newPersona: Persona = {
      ...personaData,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user?.uid,
      isCustom: true,
    };

    setCustomPersonas((prev) => [...prev, newPersona]);
    if (user) {
      try {
        await setDoc(doc(db, 'customPersonas', newPersona.id), newPersona);
      } catch (e) {
        console.error('Failed to save persona to cloud', e);
      }
    }
  };

  const handleDeleteCustomPersona = async (id: string) => {
    setCustomPersonas((prev) => prev.filter((p) => p.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'customPersonas', id));
      } catch (e) {}
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        const msgs = [...s.messages];
        if (msgs.length > 0 && msgs[msgs.length - 1].role === 'model') {
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            isStreaming: false,
          };
        }
        return { ...s, messages: msgs };
      })
    );
  };

  // Export chat function
  const handleExportChat = (format: 'markdown' | 'text' | 'json') => {
    if (!activeSession) return;
    let content = '';
    let filename = `${activeSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export`;

    if (format === 'json') {
      content = JSON.stringify(activeSession, null, 2);
      filename += '.json';
    } else if (format === 'markdown') {
      content = `# ${activeSession.title}\n\n`;
      content += `Date: ${new Date(activeSession.createdAt).toLocaleString()}\n\n---\n\n`;
      activeSession.messages.forEach((m) => {
        content += `### ${m.role === 'user' ? 'User' : 'SAS AI'} (${new Date(
          m.timestamp
        ).toLocaleTimeString()})\n\n`;
        content += `${m.text}\n\n`;
      });
      filename += '.md';
    } else {
      content = `${activeSession.title}\n`;
      content += `Date: ${new Date(activeSession.createdAt).toLocaleString()}\n\n`;
      activeSession.messages.forEach((m) => {
        content += `[${m.role === 'user' ? 'User' : 'SAS AI'}]:\n${m.text}\n\n`;
      });
      filename += '.txt';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send message and stream response from SAS AI
  const handleSendMessage = async (text: string, images: ChatImage[] = []) => {
    if ((!text.trim() && images.length === 0) || isGenerating) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      text: text.trim(),
      images,
      timestamp: Date.now(),
    };

    const modelMessageId = `msg-${Date.now() + 1}-${Math.random().toString(36).slice(2, 7)}`;
    const modelPlaceholderMessage: Message = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    const isFirstMessage = activeSession.messages.length === 0;
    let newTitle = activeSession.title;
    if (isFirstMessage && text.trim()) {
      newTitle = text.trim().slice(0, 45) + (text.trim().length > 45 ? '...' : '');
    }

    const updatedMessages = [...activeSession.messages, userMessage, modelPlaceholderMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsGenerating(true);
    setTimeout(() => scrollToBottom(true), 50);

    const allPersonas = [...PERSONAS, ...customPersonas];
    const persona =
      allPersonas.find((p) => p.id === activeSession.personaId) || PERSONAS[0];

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const payloadMessages = [...activeSession.messages, userMessage].map((m) => ({
        role: m.role,
        text: m.text,
        images: m.images?.map((img) => ({
          data: img.data,
          mimeType: img.mimeType,
        })),
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          systemInstruction: persona.systemInstruction,
          useSearch: activeSession.useSearch,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedGroundingLinks: any[] = [];

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') {
                  done = true;
                  break;
                }

                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                  if (parsed.text) {
                    accumulatedText += parsed.text;
                  }
                  if (parsed.groundingLinks) {
                    accumulatedGroundingLinks = parsed.groundingLinks;
                  }

                  setSessions((prev) =>
                    prev.map((s) => {
                      if (s.id !== currentSessionId) return s;
                      const msgs = [...s.messages];
                      const targetIdx = msgs.findIndex((m) => m.id === modelMessageId);
                      if (targetIdx !== -1) {
                        msgs[targetIdx] = {
                          ...msgs[targetIdx],
                          text: accumulatedText,
                          groundingLinks: accumulatedGroundingLinks,
                          isStreaming: true,
                        };
                      }
                      return { ...s, messages: msgs, updatedAt: Date.now() };
                    })
                  );

                  scrollToBottom(true);
                } catch (jsonErr: any) {
                  if (jsonErr.message && !jsonErr.message.includes('JSON')) {
                    throw jsonErr;
                  }
                }
              }
            }
          }
        }
      }

      // Mark model message streaming complete and cloud sync
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const msgs = [...s.messages];
          const targetIdx = msgs.findIndex((m) => m.id === modelMessageId);
          if (targetIdx !== -1) {
            msgs[targetIdx] = {
              ...msgs[targetIdx],
              text: accumulatedText || 'No response received.',
              groundingLinks: accumulatedGroundingLinks,
              isStreaming: false,
            };
          }
          const completedSession = { ...s, messages: msgs, updatedAt: Date.now() };
          if (user) {
            syncSessionToCloud(completedSession);
          }
          return completedSession;
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        console.error('Chat error:', err);
        let errorMsg = err.message || 'Could not connect to SAS AI. Please try again.';
        try {
          if (typeof errorMsg === 'string' && errorMsg.includes('"error":')) {
            const parsed = JSON.parse(errorMsg);
            if (parsed?.error?.message) {
              errorMsg = parsed.error.message;
            }
          }
        } catch (e) {}

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSessionId) return s;
            const msgs = [...s.messages];
            const targetIdx = msgs.findIndex((m) => m.id === modelMessageId);
            if (targetIdx !== -1) {
              msgs[targetIdx] = {
                ...msgs[targetIdx],
                error: errorMsg,
                isStreaming: false,
              };
            }
            return { ...s, messages: msgs };
          })
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryLast = () => {
    if (activeSession.messages.length < 2) return;
    const lastUserIndex = [...activeSession.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');

    if (lastUserIndex !== -1) {
      const actualIdx = activeSession.messages.length - 1 - lastUserIndex;
      const lastUserMsg = activeSession.messages[actualIdx];

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.slice(0, actualIdx),
              }
            : s
        )
      );

      handleSendMessage(lastUserMsg.text, lastUserMsg.images || []);
    }
  };

  return (
    <div
      id="ai-chat-app-root"
      className="flex h-[100dvh] w-full overflow-hidden bg-neutral-100 font-sans text-neutral-900 antialiased"
    >
      {/* Sidebar navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePinSession={handleTogglePinSession}
        onClearAllSessions={handleClearAllSessions}
        activePersonaId={activeSession.personaId}
        onSelectPersona={handleSelectPersona}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        customPersonas={customPersonas}
        appMode={appMode}
        onChangeAppMode={setAppMode}
      />

      {/* Main View Area */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white">
        {/* Top Header with Studios switcher */}
        <Header
          currentTitle={activeSession.title}
          onUpdateTitle={(title) => handleRenameSession(currentSessionId, title)}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onClearCurrentChat={handleClearCurrentChat}
          onExportChat={handleExportChat}
          personaId={activeSession.personaId}
          onSelectPersona={handleSelectPersona}
          useSearch={activeSession.useSearch}
          onToggleSearch={handleToggleSearch}
          messageCount={activeSession.messages.length}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
          customPersonas={customPersonas}
          appMode={appMode}
          onChangeAppMode={setAppMode}
        />

        {/* View Switcher based on appMode */}
        {appMode === 'song-studio' ? (
          <div className="flex-1 overflow-hidden">
            <SongStudio />
          </div>
        ) : appMode === 'image-studio' ? (
          <div className="flex-1 overflow-hidden">
            <ImageStudio />
          </div>
        ) : appMode === 'video-studio' ? (
          <div className="flex-1 overflow-hidden">
            <VideoStudio />
          </div>
        ) : (
          /* Standard SAS AI Chat View */
          <>
            {/* Chat Messages scroll area */}
            <div
              id="chat-scroll-viewport"
              ref={chatScrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto"
            >
              {activeSession.messages.length === 0 ? (
                <EmptyChatView
                  activePersonaId={activeSession.personaId}
                  onSelectPersona={handleSelectPersona}
                  onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                  customPersonas={customPersonas}
                  onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
                  onOpenStudio={setAppMode}
                />
              ) : (
                <div className="mx-auto max-w-4xl divide-y divide-neutral-100/60 pb-6">
                  {activeSession.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onRetry={handleRetryLast}
                      onImageClick={(img) => setSelectedImage(img)}
                      onDeleteMessage={handleDeleteMessage}
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Floating Scroll to Bottom button */}
            {showScrollBottom && activeSession.messages.length > 0 && (
              <button
                id="btn-scroll-bottom"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-24 right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition hover:bg-neutral-50 hover:text-neutral-900 active:scale-95"
                title="Scroll to bottom"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            )}

            {/* Input Bar */}
            <ChatInput
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              isGenerating={isGenerating}
              useSearch={activeSession.useSearch}
              onToggleSearch={handleToggleSearch}
            />
          </>
        )}
      </main>

      {/* Image Preview Modal */}
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Custom Persona Modal */}
      <CustomPersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSavePersona={handleSaveCustomPersona}
        customPersonas={customPersonas}
        onDeletePersona={handleDeleteCustomPersona}
      />
    </div>
  );
}
