'use client';

import React, { useEffect } from 'react';
import { FaXmark, FaFilm } from 'react-icons/fa6';

export interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoKey?: string | null;
  movieTitle: string;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  isOpen,
  onClose,
  videoKey,
  movieTitle,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="trailer-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="trailer-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="trailer-modal-header">
          <div className="d-flex align-items-center gap-2">
            <FaFilm className="text-red" />
            <h3 className="trailer-modal-title">
              {movieTitle} — Official Trailer
            </h3>
          </div>
          <button
            type="button"
            className="trailer-close-btn"
            onClick={onClose}
            aria-label="Close trailer"
          >
            <FaXmark size={18} />
          </button>
        </div>

        <div className="trailer-modal-body">
          {videoKey ? (
            <div className="trailer-video-responsive">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
                title={`${movieTitle} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="trailer-iframe"
              />
            </div>
          ) : (
            <div className="trailer-empty-state">
              <p>Official trailer video is currently unavailable for this title.</p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${movieTitle} official trailer`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="portal-btn"
              >
                Search on YouTube ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

