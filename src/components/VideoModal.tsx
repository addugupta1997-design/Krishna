import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ProductVideoItem } from '../types';

interface VideoModalProps {
  video: ProductVideoItem | null;
  onClose: () => void;
  triggerElementRef?: HTMLElement | null;
}

export function VideoModal({ video, onClose, triggerElementRef }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus close button on open
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Return focus to triggering card
      if (triggerElementRef) {
        triggerElementRef.focus();
      }
    };
  }, [onClose, triggerElementRef]);

  if (!video) return null;

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Playing video: ${video.title}`}
    >
      <div
        className="relative w-full max-w-xl bg-[#FFF8EE] rounded-2xl overflow-hidden shadow-2xl border border-[#B58A42]/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#682D42] text-[#FFF8EE] border-b border-[#B58A42]/30">
          <span className="font-serif text-base font-bold tracking-tight">
            {video.title}
          </span>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-1 rounded-full text-[#FFF8EE]/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DFBE7A]"
            aria-label="Close video dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="w-full aspect-[4/3] sm:aspect-[16/10] bg-black flex items-center justify-center relative">
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.posterImage}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          >
            Your browser does not support HTML5 video.
          </video>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-[#FFF8EE] text-center text-xs text-[#352D2F]/75 border-t border-[#B58A42]/20 font-serif">
          <span>Krishna Tracer Heritage Collection · Crafted with devotion & detail</span>
        </div>
      </div>
    </div>
  );
}
