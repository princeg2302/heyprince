'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { PostRecord } from '@/lib/admin-db';
import { LinkedInPublishModal } from './LinkedInPublishModal';

interface LinkedInPostDetailButtonProps {
  post: PostRecord;
}

export function LinkedInPostDetailButton({ post }: LinkedInPostDetailButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hpa-btn hpa-btn-secondary"
        style={{ color: '#0a66c2', borderColor: 'rgba(10, 102, 194, 0.4)' }}
        title="Publish Article to Personal LinkedIn Profile"
      >
        <Share2 size={15} />
        <span>Publish to LinkedIn</span>
      </button>

      <LinkedInPublishModal
        post={post}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
