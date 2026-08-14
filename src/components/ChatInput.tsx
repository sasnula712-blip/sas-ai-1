import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Image as ImageIcon,
  Mic,
  MicOff,
  Globe,
  X,
  Sparkles,
} from 'lucide-react';
import { ChatImage } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, images: ChatImage[]) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  useSearch: boolean;
  onToggleSearch: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  useSearch,
  onToggleSearch,
  placeholder = 'Ask anything or type a prompt...',
}) => {
  const [inputText, setInputText] = useState('');
  const [images, setImages] = useState<ChatImage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [inputText]);

  // Voice speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic error:', err);
      }
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const newImage: ChatImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            data: result,
            mimeType: file.type,
            name: file.name,
            size: file.size,
          };
          setImages((prev) => [...prev, newImage]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      pastedFiles.forEach((f) => dataTransfer.items.add(f));
      handleImageUpload(dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && images.length === 0) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(trimmed, images);
    setInputText('');
    setImages([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) {
        handleSend();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      id="chat-input-container"
      className="sticky bottom-0 z-10 border-t border-neutral-200/80 bg-white/95 px-3 py-3 backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto max-w-4xl">
        {/* Drag and drop wrapper */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border transition-all ${
            isDragging
              ? 'border-dashed border-blue-500 bg-blue-50/50 p-2'
              : 'border-neutral-300 bg-white shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15'
          }`}
        >
          {/* Uploaded Images Preview Strip */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2.5 border-b border-neutral-100 bg-neutral-50/80 rounded-t-2xl">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xs"
                >
                  <img
                    src={img.data}
                    alt={img.name || 'Upload'}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-neutral-900/80 text-white transition hover:bg-rose-600"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            id="chat-textarea"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent px-3.5 pt-3 pb-2 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none max-h-44"
          />

          {/* Bottom Bar: Action Buttons and Send */}
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1 select-none">
            {/* Left Tools: Images, Voice, Search toggle */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />

              <button
                type="button"
                id="btn-upload-image"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 active:scale-95"
                title="Attach images (photos, screenshots, diagrams)"
              >
                <ImageIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                id="btn-voice-input"
                onClick={toggleVoiceInput}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition active:scale-95 ${
                  isListening
                    ? 'bg-rose-100 text-rose-600 animate-pulse'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
                title={isListening ? 'Listening (Click to stop)' : 'Voice input (Speech to Text)'}
              >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              <button
                type="button"
                id="btn-input-search-toggle"
                onClick={onToggleSearch}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition active:scale-98 ${
                  useSearch
                    ? 'bg-emerald-100/90 text-emerald-800'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                }`}
                title="Toggle Web Search Grounding"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Web Search</span>
              </button>
            </div>

            {/* Right: Stop or Send */}
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  type="button"
                  id="btn-stop-generation"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 active:scale-95"
                >
                  <Square className="h-3 w-3 fill-current text-rose-400" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-send-message"
                  onClick={handleSend}
                  disabled={!inputText.trim() && images.length === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info and attribution */}
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1 truncate">
            <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
            <span className="truncate">SAS AI • Created by Sasnula Dilum</span>
          </div>
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
