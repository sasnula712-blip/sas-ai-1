export interface ChatImage {
  id: string;
  data: string; // base64 data URL
  mimeType: string;
  name?: string;
  size?: number;
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  images?: ChatImage[];
  groundingLinks?: GroundingLink[];
  isStreaming?: boolean;
  error?: string;
}

export interface Persona {
  id: string;
  name: string;
  roleTag: string;
  iconName: string;
  description: string;
  systemInstruction: string;
  isCustom?: boolean;
  userId?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  messages: Message[];
  personaId: string;
  useSearch: boolean;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StarterPrompt {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  category: 'general' | 'coding' | 'writing' | 'creative' | 'knowledge' | 'business';
  icon: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type AppMode = 'chat' | 'song-studio' | 'image-studio' | 'video-studio';

// Song Studio Types
export interface SongSection {
  section: string; // "Intro" | "Verse 1" | "Chorus" | "Verse 2" | "Bridge" | "Outro"
  chords: string[];
  lyricsSinhala: string;
  lyricsEnglish: string;
  singlishLyrics?: string;
  musicalCue?: string;
}

export interface MelodyNote {
  note: string; // e.g. "C4", "E4", "G4", "A4"
  duration: number; // in seconds
  octave: number;
  timeOffset: number;
}

export interface SongData {
  id: string;
  title: string;
  titleSinhala?: string;
  genre: string;
  mood: string;
  tempoBpm: number;
  key: string;
  timeSignature: string;
  chords: string[];
  melodyNotes: MelodyNote[];
  structure: SongSection[];
  productionNotes: string;
  tags: string[];
  createdAt: number;
  referenceAudioNote?: string;
}

// Image Studio Types
export interface GeneratedImageItem {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  imageUrl: string;
  createdAt: number;
}

// Video Studio Types
export interface StoryboardScene {
  sceneNumber: number;
  durationSeconds: number;
  shotType: string;
  visualPrompt: string;
  actionDescription: string;
  dialogueOrVoiceover: string;
  soundtrackAndAudio: string;
  imageUrl?: string;
}

export interface VideoStoryboard {
  id: string;
  title: string;
  logline: string;
  aspectRatio: string;
  genre: string;
  totalDurationSeconds: number;
  scenes: StoryboardScene[];
  createdAt: number;
}
