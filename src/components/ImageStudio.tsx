import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  Sliders,
  Palette,
  Wand2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { GeneratedImageItem } from '../types';

const IMAGE_STYLES = [
  { id: 'Cinematic 8K', label: 'Cinematic Movie Still', tag: '8K, dramatic lighting, photorealistic' },
  { id: 'Anime Studio Ghibli', label: 'Anime / Ghibli Style', tag: 'hand-drawn anime, aesthetic scenery' },
  { id: '3D Pixar Animation', label: '3D Character Render', tag: 'Pixar style, soft shadows, vibrant' },
  { id: 'Cyberpunk Neon', label: 'Cyberpunk & Sci-Fi', tag: 'neon glowing lights, night cityscape' },
  { id: 'Sri Lankan Cultural Art', label: 'Sri Lankan Heritage', tag: 'Sigiriya frescoes, rich tropical colors' },
  { id: 'Fantasy Digital Art', label: 'Epic Fantasy Realm', tag: 'magical glowing aura, detailed concept art' },
  { id: 'Vintage 90s Film', label: 'Retro Film Photo', tag: 'grainy 35mm photography, analog warmth' },
  { id: 'Watercolor Impressionism', label: 'Watercolor Painting', tag: 'soft watercolor brushstrokes, paper texture' },
];

const PRESET_IMAGE_PROMPTS = [
  'A mystical ancient temple in the clouds of Sri Lanka surrounded by glowing floating lotuses at sunset',
  'Futuristic cyber detective in neon Colombo rain holding a glowing digital umbrella',
  'Cute fluffy baby lion cub wearing a tiny astronaut helmet on a miniature planet',
  'Cinematic portrait of a wise Sri Lankan village elder smiling warmly in golden morning sunlight',
  'Cozy wooden coffee shop on a rainy evening with warm ambient lights and steam rising from a cup',
  'An epic fantasy dragon carved from crystal overlooking a waterfall of starlight',
];

export const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(IMAGE_STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImageItem | null>(null);
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Enhance prompt with AI
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              text: `Expand and enhance this prompt into a vivid, highly detailed, visually descriptive art prompt for image generation (maximum 2 sentences, include atmosphere, lighting, camera shot and color palette): "${prompt}"`,
            },
          ],
          systemInstruction: 'You are a master visual prompt engineer for AI image synthesis.',
        }),
      });
      const data = await res.json();
      if (data.text) {
        setPrompt(data.text.replace(/["\n]/g, '').trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Image
  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio,
        }),
      });

      if (!response.ok) {
        throw new Error('Image generation failed');
      }

      const imgItem: GeneratedImageItem = await response.json();
      setCurrentImage(imgItem);
      setGallery((prev) => [imgItem, ...prev.slice(0, 11)]);
    } catch (err) {
      console.error('Image creation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Image
  const handleDownload = (imgUrl: string, promptText: string) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `SAS_AI_${promptText.slice(0, 20).replace(/\s+/g, '_')}.svg`;
    a.click();
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div id="image-studio-root" className="flex h-full w-full flex-col overflow-y-auto bg-neutral-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-purple-200/70 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-400/40 backdrop-blur-md">
            <ImageIcon className="h-5 w-5 text-purple-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              SAS AI Photo & Art Studio
            </h1>
            <p className="text-xs text-purple-200/80">
              AI Art Studio • Photorealistic, Anime, 3D & Cinematic Visual Art
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Prompt and Configuration */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Image Prompt & Description
            </h2>

            {/* Prompt presets */}
            <div className="mb-3">
              <span className="text-[11px] font-medium text-neutral-400">
                Inspiration ideas:
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {PRESET_IMAGE_PROMPTS.slice(0, 3).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(p)}
                    className="truncate max-w-[200px] rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] text-neutral-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative mb-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A magical floating lotus palace glowing at sunset over tropical mountains, 8k resolution, volumetric light..."
                rows={4}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-xs text-neutral-900 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />
              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-200 transition disabled:opacity-40"
              >
                <Wand2 className={`h-3.5 w-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
              </button>
            </div>

            {/* Visual Style Selector */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-neutral-700">
                Artistic Style:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                      selectedStyle === style.id
                        ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600'
                        : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-100/70'
                    }`}
                  >
                    <span className="text-xs font-bold text-neutral-900">{style.label}</span>
                    <span className="text-[10px] text-neutral-500 truncate w-full">{style.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Aspect Ratio:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1:1', label: '1:1 Square' },
                  { id: '16:9', label: '16:9 Cinema' },
                  { id: '9:16', label: '9:16 Story' },
                  { id: '4:3', label: '4:3 Classic' },
                ].map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id as any)}
                    className={`rounded-xl border py-2 text-center text-xs font-semibold transition ${
                      aspectRatio === ar.id
                        ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              id="generate-image-btn"
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-purple-200" />
                  Generating Masterpiece Art...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 text-purple-200" />
                  Generate Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Image View & Gallery */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-neutral-800">
              Generated Artwork (නිර්මාණය වූ පින්තූරය)
            </h2>

            {currentImage ? (
              <div className="flex flex-col gap-3">
                <div className="relative group overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 flex items-center justify-center">
                  <img
                    src={currentImage.imageUrl}
                    alt={currentImage.prompt}
                    className="max-h-[440px] w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                    <button
                      onClick={() => setModalImage(currentImage.imageUrl)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow hover:bg-white"
                      title="View Fullscreen"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(currentImage.imageUrl, currentImage.prompt)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow hover:bg-white"
                      title="Download Image"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Info and Actions */}
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
                  <div className="max-w-[70%]">
                    <p className="text-xs font-semibold text-neutral-900 line-clamp-1">
                      {currentImage.prompt}
                    </p>
                    <span className="text-[11px] text-neutral-500">
                      Style: {currentImage.style} • Aspect Ratio: {currentImage.aspectRatio}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyPrompt(currentImage.prompt)}
                      className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-white"
                    >
                      {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedPrompt ? 'Copied' : 'Prompt'}</span>
                    </button>
                    <button
                      onClick={() => handleDownload(currentImage.imageUrl, currentImage.prompt)}
                      className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-80 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-6 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  No image generated yet
                </h3>
                <p className="mt-1 max-w-sm text-xs text-neutral-500">
                  Enter an image prompt on the left and click <strong>Generate Image</strong> to create AI art.
                </p>
              </div>
            )}
          </div>

          {/* History Gallery */}
          {gallery.length > 1 && (
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Recent Creations ({gallery.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentImage(item)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 aspect-square hover:ring-2 hover:ring-purple-500"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                      <p className="text-[10px] text-white line-clamp-2 leading-tight">
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={modalImage}
              alt="Fullscreen artwork"
              className="max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
