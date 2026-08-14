import React from 'react';
import { X, Download } from 'lucide-react';
import { ChatImage } from '../types';

interface ImageModalProps {
  image: ChatImage | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.name || 'chat-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-4 py-2 text-white">
          <span className="truncate text-xs font-medium text-neutral-300">
            {image.name || 'Image Preview'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700 hover:text-white"
              title="Download image"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex max-h-[80vh] items-center justify-center p-2">
          <img
            src={image.data}
            alt={image.name || 'Preview'}
            className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};
