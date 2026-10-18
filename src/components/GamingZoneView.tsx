'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FaGamepad,
  FaPuzzlePiece,
  FaArrowLeft,
  FaCircleCheck,
  FaVolumeHigh,
  FaVolumeXmark,
  FaBolt,
  FaBorderAll,
} from 'react-icons/fa6';
import { SudokuGame } from './SudokuGame';
import { RetroSnakeGame, BrickBreakerGame, Cyber2048Game, PixelPlatformerGame } from './games';

type GameKey = 'snake' | 'brick' | 'sudoku' | '2048' | 'platformer';

export const GamingZoneView: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameKey>('snake');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthetic retro audio bleeps
  const playRetroBeep = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'square') => {
      if (!soundEnabled) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}
    },
    [soundEnabled]
  );

  return (
    <div className="gaming-zone-page">
      {/* Background Cyber Grid Accent */}
      <div className="gaming-ambient-overlay" aria-hidden="true" />

      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="gaming-zone-breadcrumb">
          <Link href="/" className="gaming-back-btn">
            <FaArrowLeft />
            <span>Return to Portfolio</span>
          </Link>
          <div className="gaming-live-pill">
            <span className="live-pulse-dot" />
            <span>Retro Arcade &amp; Cyber Hub • 100% Playable</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="gaming-hero-wrap text-center">
          <h1 className="gaming-main-title">
            HeyPrince <span className="text-red">Gaming Zone</span>
          </h1>
          <p className="gaming-hero-desc">
            Directly playable in-browser retro arcade games &amp; neural logic puzzles. Experience
            high-speed Neon Snake, shatter plasma bricks, crack the Sudoku Matrix, merge the Cyber 2048 grid,
            or inspect the 8-Bit Classics Vault.
          </p>

          {/* Sound Toggle */}
          <div className="gaming-sound-wrap">
            <button
              type="button"
              className={`gaming-sound-toggle ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute retro effects' : 'Enable retro effects'}
            >
              {soundEnabled ? <FaVolumeHigh /> : <FaVolumeXmark />}
              <span>Retro Sound {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* ==========================================================================
            GAME SELECTION DECK (ALL DIRECTLY PLAYABLE)
            ========================================================================== */}
        <div className="gaming-selector-deck">
          {/* CARD 1: RETRO NEON SNAKE */}
          <div
            className={`gaming-deck-card card-snake ${selectedGame === 'snake' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('snake');
              playRetroBeep(520, 0.08, 'triangle');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('snake');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-snake">PLAY LIVE IN BROWSER</span>
              {selectedGame === 'snake' && <span className="deck-active-pill">ACTIVE</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-snake">
                <span className="game-badge-emoji">🐍</span>
              </div>
              <h3 className="deck-game-title">Retro Neon Snake</h3>
              <p className="deck-game-desc">
                Smooth 60fps classic arcade snake with glowing neon energy, speed tiers, golden apples, and audio synth.
              </p>
            </div>
            <div className="deck-card-footer">
              <span className="deck-mode-indicator">
                <FaCircleCheck className="check-icon text-green" /> 100% Playable Now
              </span>
              <span className="deck-arrow-btn">→</span>
            </div>
          </div>

          {/* CARD 2: CYBER BRICK BREAKER */}
          <div
            className={`gaming-deck-card card-brick ${selectedGame === 'brick' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('brick');
              playRetroBeep(480, 0.08, 'square');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('brick');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-brick">PLAY LIVE IN BROWSER</span>
              {selectedGame === 'brick' && <span className="deck-active-pill">ACTIVE</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-brick">
                <FaBolt />
              </div>
              <h3 className="deck-game-title">Cyber Brick Breaker</h3>
              <p className="deck-game-desc">
                High-octane paddle &amp; plasma orb action with particle shatter physics, wave progression, and 3 lives.
              </p>
            </div>
            <div className="deck-card-footer">
              <span className="deck-mode-indicator">
                <FaCircleCheck className="check-icon text-cyan" /> 100% Playable Now
              </span>
              <span className="deck-arrow-btn">→</span>
            </div>
          </div>

          {/* CARD 3: CYBER SUDOKU MATRIX */}
          <div
            className={`gaming-deck-card card-sudoku ${selectedGame === 'sudoku' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('sudoku');
              playRetroBeep(560, 0.08, 'sine');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('sudoku');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-sudoku">PLAY LIVE IN BROWSER</span>
              {selectedGame === 'sudoku' && <span className="deck-active-pill">ACTIVE</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-sudoku">
                <FaPuzzlePiece />
              </div>
              <h3 className="deck-game-title">Cyber Sudoku Matrix</h3>
              <p className="deck-game-desc">
                Interactive 9×9 numerical logic puzzle with real-time error checking, pencil notes, and 4 difficulty tiers.
              </p>
            </div>
            <div className="deck-card-footer">
              <span className="deck-mode-indicator">
                <FaCircleCheck className="check-icon text-cyan" /> 100% Playable Now
              </span>
              <span className="deck-arrow-btn">→</span>
            </div>
          </div>

          {/* CARD 4: CYBER 2048 MATRIX */}
          <div
            className={`gaming-deck-card card-2048 ${selectedGame === '2048' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('2048');
              playRetroBeep(620, 0.08, 'triangle');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('2048');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-2048">PLAY LIVE IN BROWSER</span>
              {selectedGame === '2048' && <span className="deck-active-pill">ACTIVE</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-2048">
                <FaBorderAll />
              </div>
              <h3 className="deck-game-title">Cyber 2048 Matrix</h3>
              <p className="deck-game-desc">
                Addictive sliding number merger with touch swipe, smooth neon tile transitions, undo, and high scores.
              </p>
            </div>
            <div className="deck-card-footer">
              <span className="deck-mode-indicator">
                <FaCircleCheck className="check-icon text-amber" /> 100% Playable Now
              </span>
              <span className="deck-arrow-btn">→</span>
            </div>
          </div>

          {/* CARD 5: PIXEL ADVENTURE (8-BIT ORIGINAL PLATFORMER) */}
          <div
            className={`gaming-deck-card card-platformer ${selectedGame === 'platformer' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('platformer');
              playRetroBeep(440, 0.08, 'square');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('platformer');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-platformer">PLAY LIVE IN BROWSER</span>
              {selectedGame === 'platformer' && <span className="deck-active-pill">ACTIVE</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-platformer">
                <FaGamepad />
              </div>
              <h3 className="deck-game-title">Pixel Adventure (8-Bit)</h3>
              <p className="deck-game-desc">
                Original 2D side-scrolling platformer with running, jumping, mystery blocks, coins, powerups, enemies &amp; 3 distinct worlds.
              </p>
            </div>
            <div className="deck-card-footer">
              <span className="deck-mode-indicator">
                <FaCircleCheck className="check-icon text-red" /> 100% Playable Now
              </span>
              <span className="deck-arrow-btn">→</span>
            </div>
          </div>
        </div>

        {/* ==========================================================================
            GAME STAGE VIEW 1: RETRO NEON SNAKE (100% PLAYABLE)
            ========================================================================== */}
        {selectedGame === 'snake' && (
          <div className="gaming-stage-enclosure snake-stage">
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge badge-snake">CANVAS 60FPS • ARCADE</span>
                <span className="stage-title-text">RETRO NEON SNAKE — CYBER GRID</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live status-green">PLAYABLE LIVE IN BROWSER</span>
              </div>
            </div>

            <div className="game-stage-content">
              <RetroSnakeGame />
            </div>
          </div>
        )}

        {/* ==========================================================================
            GAME STAGE VIEW 2: CYBER BRICK BREAKER (100% PLAYABLE)
            ========================================================================== */}
        {selectedGame === 'brick' && (
          <div className="gaming-stage-enclosure brick-stage">
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge badge-brick">PHYSICS ENGINE • BREAKOUT</span>
                <span className="stage-title-text">CYBER BRICK BREAKER — PLASMA BOUNCE</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live status-cyan">PLAYABLE LIVE IN BROWSER</span>
              </div>
            </div>

            <div className="game-stage-content">
              <BrickBreakerGame />
            </div>
          </div>
        )}

        {/* ==========================================================================
            GAME STAGE VIEW 3: CYBER SUDOKU MATRIX (100% PLAYABLE)
            ========================================================================== */}
        {selectedGame === 'sudoku' && (
          <div className="gaming-stage-enclosure sudoku-stage">
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge badge-sudoku">WASM • LOGIC ENGINE</span>
                <span className="stage-title-text">CYBER SUDOKU MATRIX — 9×9 NEURAL PUZZLE</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live status-cyan">PLAYABLE LIVE IN BROWSER</span>
              </div>
            </div>

            <div className="sudoku-embed-wrapper">
              <SudokuGame />
            </div>
          </div>
        )}

        {/* ==========================================================================
            GAME STAGE VIEW 4: CYBER 2048 MATRIX (100% PLAYABLE)
            ========================================================================== */}
        {selectedGame === '2048' && (
          <div className="gaming-stage-enclosure matrix-2048-stage">
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge badge-2048">TILE MATRIX • PUZZLE</span>
                <span className="stage-title-text">CYBER 2048 — NUMERICAL MERGER</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live status-amber">PLAYABLE LIVE IN BROWSER</span>
              </div>
            </div>

            <div className="game-stage-content">
              <Cyber2048Game />
            </div>
          </div>
        )}

        {/* ==========================================================================
            GAME STAGE VIEW 5: PIXEL ADVENTURE (100% IN-BROWSER PLAYABLE)
            ========================================================================== */}
        {selectedGame === 'platformer' && (
          <div className="gaming-stage-enclosure platformer-stage">
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge badge-platformer">PHYSICS ENGINE • 2D SIDE-SCROLLER</span>
                <span className="stage-title-text">PIXEL ADVENTURE — 8-BIT RETRO QUEST</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live status-red">PLAYABLE LIVE IN BROWSER</span>
              </div>
            </div>

            <div className="platformer-stage-wrapper">
              {/* 100% IN-BROWSER PLAYABLE ORIGINAL 8-BIT PLATFORMER */}
              <div className="game-stage-content platformer-game-content">
                <PixelPlatformerGame />
              </div>

              {/* Retro Lore & Controller Guide */}
              <div className="platformer-showcase-grid platformer-info-grid">
                <div className="platformer-marquee-card">
                  <div className="platformer-badge-flag">ORIGINAL RETRO ADVENTURE</div>
                  <div className="platformer-marquee-header">
                    <span className="platformer-icon-large">🎮</span>
                    <div className="platformer-title-group">
                      <h2 className="platformer-heading">Pixel Adventure (8-Bit)</h2>
                      <p className="platformer-subheading">Original In-Browser Platform Engine with 3 Playable Worlds</p>
                    </div>
                  </div>

                  <p className="platformer-editorial-text">
                    Experience authentic 2D platforming action: momentum physics, jump buffering,
                    mystery item blocks with powerup crystals and bouncing gold coins, patrolling forest minions,
                    subterranean caverns, and the end-game Castle Flagpole. Built entirely in-browser
                    with 100% original pixel art, chiptune sound synthesis, and responsive keyboard and mobile controls!
                  </p>

                  <div className="platformer-secrets-list">
                    <div className="secret-item">
                      <span className="secret-badge">WORLD 1-1</span>
                      <div className="secret-text">
                        <strong>Sunny Meadow:</strong> Green hills, pipe barriers, mystery blocks, and patrolling forest minions.
                      </div>
                    </div>

                    <div className="secret-item">
                      <span className="secret-badge">WORLD 1-2</span>
                      <div className="secret-text">
                        <strong>Subterranean Caverns:</strong> Dark blue cavern bricks, stalactite ceilings, cavern beetles, and hidden coin vaults.
                      </div>
                    </div>

                    <div className="secret-item">
                      <span className="secret-badge">WORLD 1-3</span>
                      <div className="secret-text">
                        <strong>Fortress Citadel:</strong> Red volcanic battlements, lava chasms, floating platforms, and the end-level Citadel Flagpole.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="platformer-reference-card">
                  <h3 className="reference-title">
                    <FaGamepad /> Controller &amp; Gameplay Guide
                  </h3>
                  <div className="nes-controller-grid">
                    <div className="nes-ctrl-row">
                      <span className="nes-key">A / D or ◄ ►</span>
                      <span className="nes-action">Run left &amp; right across the stage</span>
                    </div>
                    <div className="nes-ctrl-row">
                      <span className="nes-key">SPACE or ▲ / W</span>
                      <span className="nes-action">Jump (hold longer for maximum leap height)</span>
                    </div>
                    <div className="nes-ctrl-row">
                      <span className="nes-key">STOMP ENEMY</span>
                      <span className="nes-action">Jump onto enemy heads to defeat them (+200 pts)</span>
                    </div>
                    <div className="nes-ctrl-row">
                      <span className="nes-key">? BLOCKS</span>
                      <span className="nes-action">Hit from below to collect coins or Super Mushroom (+1000 pts)</span>
                    </div>
                    <div className="nes-ctrl-row">
                      <span className="nes-key">ESC or P</span>
                      <span className="nes-action">Pause / Resume gameplay action</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamingZoneView;
