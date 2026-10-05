'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface LetsTalkBannerProps {
  onNavigateContact?: () => void;
}

export const LetsTalkBanner: React.FC<LetsTalkBannerProps> = ({ onNavigateContact }) => {
  const router = useRouter();

  const handleContactClick = () => {
    if (onNavigateContact) {
      onNavigateContact();
    } else {
      router.push('/contact');
    }
  };

  return (
    <section className="lets-talk">
      <div className="container">
        <div className="section-heading-group text-center text-white">
          <h2>
            Just Me, <br /> No{' '}
            <span className="text-red word">
              <span>Fi</span>
              <span>L</span>
              <span>T</span>
              <span>e</span>
              <span>R</span>
            </span>
          </h2>
          <p>
            I’m Prince — a passionate Web Developer &amp; IT Professional who loves building clean, fast, and modern websites. I focus on creating designs that look premium, work smoothly on every device, and help businesses grow online.
          </p>
          <a
            className="portal-btn mx-auto"
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              handleContactClick();
            }}
          >
            <span className="mr-right">Let’s Talk About It</span>
            <span className="arrow">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="white" />
                <path
                  d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                  fill="#000"
                />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default LetsTalkBanner;

