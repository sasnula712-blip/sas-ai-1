import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Message, ChatImage } from '../types';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onImageClick?: (image: ChatImage) => void;
  onDeleteMessage?: (id: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onImageClick,
  onDeleteMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group flex w-full gap-3 px-3 py-4 transition-colors sm:px-6 md:px-8 ${
        isUser ? 'bg-transparent' : 'bg-neutral-50/75 border-y border-neutral-200/60'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-xs">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/20">
            <Bot className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Header line: Role and Timestamp */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-900">
            {isUser ? 'You' : 'SAS AI'}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-400">
            <Clock className="h-3 w-3" />
            {formatTime(message.timestamp)}
          </span>
          {!isUser && message.isStreaming && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
              <Sparkles className="h-2.5 w-2.5 animate-spin text-blue-600" />
              Thinking...
            </span>
          )}
        </div>

        {/* Attached Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-1">
            {message.images.map((img) => (
              <div
                key={img.id}
                onClick={() => onImageClick?.(img)}
                className="group/img relative cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-xs transition hover:shadow-md"
              >
                <img
                  src={img.data}
                  alt={img.name || 'User upload'}
                  className="h-28 w-28 object-cover sm:h-36 sm:w-36 transition-transform group-hover/img:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover/img:bg-black/20" />
              </div>
            ))}
          </div>
        )}

        {/* Markdown Text content */}
        {message.text ? (
          <div className="prose prose-neutral max-w-none text-xs sm:text-sm text-neutral-800 leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline) {
                    return (
                      <div className="my-3 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-md">
                        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-3.5 py-1.5 text-xs text-neutral-400">
                          <span className="font-mono uppercase tracking-wider text-[10px] text-blue-400 font-bold">
                            {match ? match[1] : 'code'}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeString);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            }}
                            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-neutral-300 transition hover:bg-neutral-800 hover:text-white text-[11px]"
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="overflow-x-auto p-3.5 font-mono text-xs text-neutral-100">
                          <pre className="!bg-transparent !p-0 !m-0">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <code
                      className="rounded-md bg-neutral-200/80 px-1.5 py-0.5 font-mono text-[11px] sm:text-xs text-neutral-900 font-semibold"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                ul: ({ children }) => <ul className="mb-2.5 list-disc pl-5 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2.5 list-decimal pl-5 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-normal">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold text-neutral-900 mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold text-neutral-900 mt-3 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold text-neutral-900 mt-2 mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 py-1.5 pl-3 pr-2 italic text-neutral-700 my-2 rounded-r">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="min-w-full divide-y divide-neutral-200 text-xs">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-neutral-100 font-semibold">{children}</thead>,
                th: ({ children }) => <th className="px-3 py-2 text-left text-neutral-700">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 border-t border-neutral-100 text-neutral-800">{children}</td>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline underline-offset-2 hover:text-blue-800 font-medium"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        ) : (
          !message.error && message.isStreaming && (
            <div className="flex items-center gap-1.5 py-1 text-xs text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Generating response...</span>
            </div>
          )
        )}

        {/* Error state */}
        {message.error && (
          <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{message.error}</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Grounding Sources */}
        {message.groundingLinks && message.groundingLinks.length > 0 && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
              <span>Web Sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.groundingLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-blue-700 transition hover:bg-blue-50 hover:border-blue-300"
                  title={link.title}
                >
                  <span className="max-w-[200px] truncate">{link.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-neutral-400" />
                </a>
              ))}
            </div>
          </div>
        )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 pt-1">
            {message.text && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-400 transition hover:bg-neutral-200/60 hover:text-neutral-700"
                  title="Copy text"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {'speechSynthesis' in window && (
                  <button
                    onClick={handleSpeak}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${
                      isSpeaking
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700'
                    }`}
                    title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                    <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                  </button>
                )}
              </>
            )}

            {onDeleteMessage && (
              <button
                onClick={() => onDeleteMessage(message.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-400 opacity-60 hover:opacity-100 transition hover:bg-rose-50 hover:text-rose-600"
                title="Delete this message"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden group-hover:inline">Delete</span>
              </button>
            )}
          </div>
      </div>
    </div>
  );
};
