'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaShieldHalved,
  FaCheck,
  FaArrowsRotate,
  FaVolumeHigh,
  FaCircleNotch,
  FaTriangleExclamation,
} from 'react-icons/fa6';

export interface CustomCaptchaHandle {
  reset: () => void;
}

export interface CustomCaptchaProps {
  purpose: string;
  siteKey?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  onVerified: (proof: string) => void;
  onExpired?: () => void;
  onError?: (errorMessage: string) => void;
  className?: string;
}

interface ChallengeState {
  challengeId: string;
  question: string;
  signedToken: string;
  audioPrompt?: string;
  expiresAt: string;
  ttlSeconds: number;
}

export const CustomCaptcha = React.forwardRef<CustomCaptchaHandle, CustomCaptchaProps>(
  (
    {
      purpose,
      siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || 'hp_site_live_default',
      difficulty = 'easy',
      onVerified,
      onExpired,
      onError,
      className = '',
    },
    ref
  ) => {
    const [challenge, setChallenge] = useState<ChallengeState | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [challengeIssuedAt, setChallengeIssuedAt] = useState<number>(Date.now());
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    const onVerifiedRef = useRef(onVerified);
    const onExpiredRef = useRef(onExpired);
    const onErrorRef = useRef(onError);

    useEffect(() => {
      onVerifiedRef.current = onVerified;
      onExpiredRef.current = onExpired;
      onErrorRef.current = onError;
    });

    // Fetch challenge from server
    const fetchChallenge = useCallback(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setUserAnswer('');
      setIsVerified(false);

      try {
        const response = await fetch('/api/captcha/challenge/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            siteKey,
            purpose,
            difficulty,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setChallenge({
            challengeId: data.challengeId,
            question: data.question,
            signedToken: data.signedToken,
            audioPrompt: data.audioPrompt,
            expiresAt: data.expiresAt,
            ttlSeconds: data.ttlSeconds || 300,
          });
          setChallengeIssuedAt(Date.now());
          setAttemptsLeft(null);
        } else {
          const err = data.error || 'Failed to load security challenge.';
          setErrorMessage(err);
          onErrorRef.current?.(err);
        }
      } catch {
        const networkErr = 'Unable to reach security verification service. Please retry.';
        setErrorMessage(networkErr);
        onErrorRef.current?.(networkErr);
      } finally {
        setIsLoading(false);
      }
    }, [siteKey, purpose, difficulty]);

    // Expose reset to parent component
    React.useImperativeHandle(ref, () => ({
      reset: () => {
        setIsVerified(false);
        setUserAnswer('');
        fetchChallenge();
      },
    }));

    // Initial challenge fetch
    useEffect(() => {
      fetchChallenge();
    }, [fetchChallenge]);

    // Handle verification submission
    const handleVerify = async (e?: React.SyntheticEvent | any) => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
      }
      if (!challenge || !userAnswer.trim() || isVerifying || isVerified) return;

      setIsVerifying(true);
      setErrorMessage(null);

      const elapsedMs = Date.now() - challengeIssuedAt;

      try {
        const response = await fetch('/api/captcha/verify/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            challengeId: challenge.challengeId,
            answer: userAnswer.trim(),
            signedToken: challenge.signedToken,
            purpose,
            siteKey,
            elapsedMs,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success && result.verificationProof) {
          setIsVerified(true);
          setErrorMessage(null);
          onVerifiedRef.current(result.verificationProof);
        } else {
          const err = result.error || 'Verification failed. Please retry.';
          setErrorMessage(err);
          if (result.attemptsLeft !== undefined) {
            setAttemptsLeft(result.attemptsLeft);
          }
          if (result.code === 'TOO_MANY_ATTEMPTS' || result.code === 'CHALLENGE_EXPIRED') {
            onExpiredRef.current?.();
            setTimeout(() => fetchChallenge(), 1000);
          }
          onErrorRef.current?.(err);
        }
      } catch {
        setErrorMessage('Network error during verification. Please retry.');
      } finally {
        setIsVerifying(false);
      }
    };

    // Accessible audio readout via Web Speech API
    const handlePlayAudio = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!challenge) return;

      const text = challenge.audioPrompt || challenge.question;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    };

    return (
      <div
        className={`custom-captcha-container ${className}`}
        role="region"
        aria-label="Security Verification Check"
        style={{
          margin: '16px auto',
          maxWidth: '440px',
          width: '100%',
          background: 'rgba(17, 19, 29, 0.85)',
          backdropFilter: 'blur(12px)',
          border: isVerified
            ? '1px solid rgba(34, 197, 94, 0.4)'
            : errorMessage
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '14px 18px',
          boxShadow: isVerified
            ? '0 0 16px rgba(34, 197, 94, 0.15)'
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            fontSize: '0.8rem',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <FaShieldHalved size={13} color={isVerified ? '#22c55e' : '#38bdf8'} />
            <span style={{ fontWeight: 600, letterSpacing: '0.02em', color: '#e2e8f0' }}>
              Security Check
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Audio Button */}
            {challenge && !isVerified && (
              <button
                type="button"
                onClick={handlePlayAudio}
                title="Listen to challenge (Audio Accessibility)"
                aria-label="Listen to challenge"
                disabled={isPlayingAudio}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isPlayingAudio ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <FaVolumeHigh />
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchChallenge}
              title="Get a new question"
              aria-label="Refresh security challenge"
              disabled={isLoading || isVerifying}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.85rem',
                transform: isLoading ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s ease',
              }}
            >
              <FaArrowsRotate />
            </button>
          </div>
        </div>

        {/* Verified State */}
        {isVerified ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              color: '#4ade80',
              fontWeight: 500,
              fontSize: '0.88rem',
            }}
          >
            <div
              style={{
                background: '#22c55e',
                color: '#000',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
              }}
            >
              <FaCheck />
            </div>
            <span>Verified as human</span>
          </div>
        ) : (
          /* Challenge & Input State */
          <div>
            {isLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                }}
              >
                <FaCircleNotch className="spin" size={14} />
                <span>Loading security challenge...</span>
              </div>
            ) : challenge ? (
              <div style={{ margin: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'nowrap',
                  }}
                >
                  {/* Question Box */}
                  <div
                    style={{
                      flex: '1 1 auto',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.92rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: '#f8fafc',
                      fontWeight: 600,
                      textAlign: 'center',
                      userSelect: 'none',
                    }}
                  >
                    {challenge.question}
                  </div>

                  {/* Answer Input */}
                  <input
                    type="text"
                    name="captcha_answer"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="text"
                    placeholder="Answer"
                    aria-label="Your answer to security question"
                    value={userAnswer}
                    onChange={(e) => {
                      setUserAnswer(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleVerify(e);
                      }
                    }}
                    disabled={isVerifying}
                    style={{
                      width: '90px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />

                  {/* Verify Action Button */}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVerify(e); }}
                    disabled={!userAnswer.trim() || isVerifying}
                    style={{
                      background: userAnswer.trim()
                        ? 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: userAnswer.trim() ? '#000000' : '#64748b',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      cursor: userAnswer.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <FaCircleNotch className="spin" size={12} />
                        <span>Checking</span>
                      </>
                    ) : (
                      <span>Verify</span>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  lineHeight: 1.3,
                }}
              >
                <FaTriangleExclamation size={12} />
                <span>
                  {errorMessage}
                  {attemptsLeft !== null && attemptsLeft > 0
                    ? ` (${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining)`
                    : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

CustomCaptcha.displayName = 'CustomCaptcha';

export default CustomCaptcha;

