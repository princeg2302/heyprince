'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FaGamepad,
  FaPuzzlePiece,
  FaFire,
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaCircleCheck,
  FaShieldHalved,
  FaKey,
  FaRotateRight,
  FaVolumeHigh,
  FaVolumeXmark,
  FaTrophy,
  FaStar,
  FaBurst,
  FaBolt,
  FaBorderAll,
} from 'react-icons/fa6';
import { SudokuGame } from './SudokuGame';
import { RetroSnakeGame, BrickBreakerGame, Cyber2048Game, PixelPlatformerGame } from './games';

type GameKey = 'snake' | 'brick' | 'sudoku' | '2048' | 'classics';

export const GamingZoneView: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameKey>('snake');
  const [classicSubTab, setClassicSubTab] = useState<'mario' | 'contra'>('mario');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- CONTRA KONAMI CODE EASTER EGG ---
  // Sequence: Up, Up, Down, Down, Left, Right, Left, Right, B, A
  const KONAMI_SEQUENCE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  const [konamiProgress, setKonamiProgress] = useState<number>(0);
  const [konamiActivated, setKonamiActivated] = useState<boolean>(false);

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

  const playFanfare = useCallback(() => {
    if (!soundEnabled) return;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playRetroBeep(freq, 0.15, 'triangle');
      }, idx * 100);
    });
  }, [playRetroBeep, soundEnabled]);

  // Handle keyboard listener for Konami code (active when on classics tab)
  useEffect(() => {
    if (selectedGame !== 'classics') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const expectedKey = KONAMI_SEQUENCE[konamiProgress];
      if (
        e.key.toLowerCase() === expectedKey.toLowerCase() ||
        e.code.toLowerCase() === expectedKey.toLowerCase()
      ) {
        const nextProgress = konamiProgress + 1;
        setKonamiProgress(nextProgress);
        playRetroBeep(350 + nextProgress * 40, 0.08, 'square');
        if (nextProgress === KONAMI_SEQUENCE.length) {
          setKonamiActivated(true);
          playFanfare();
          setKonamiProgress(0);
        }
      } else {
        setKonamiProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiProgress, playFanfare, playRetroBeep, selectedGame]);

  const handleManualKonamiPress = (keyName: string) => {
    const expectedKey = KONAMI_SEQUENCE[konamiProgress];
    if (keyName.toLowerCase() === expectedKey.toLowerCase()) {
      const nextProgress = konamiProgress + 1;
      setKonamiProgress(nextProgress);
      playRetroBeep(350 + nextProgress * 40, 0.08, 'square');
      if (nextProgress === KONAMI_SEQUENCE.length) {
        setKonamiActivated(true);
        playFanfare();
        setKonamiProgress(0);
      }
    } else {
      setKonamiProgress(0);
      playRetroBeep(180, 0.1, 'sawtooth');
    }
  };

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

          {/* CARD 5: 8-BIT PIXEL PLATFORMER */}
          <div
            className={`gaming-deck-card card-classics ${selectedGame === 'classics' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('classics');
              playRetroBeep(440, 0.08, 'square');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('classics');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-mario">PLAY LIVE IN BROWSER</span>
              {selectedGame === 'classics' && <span className="deck-active-pill">ACTIVE</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-mario">
                <span className="game-badge-emoji">🍄</span>
              </div>
              <h3 className="deck-game-title">8-Bit Pixel Platformer</h3>
              <p className="deck-game-desc">
                Nostalgic 2D side-scrolling platformer with running, jumping, mystery blocks, coins, powerup mushrooms &amp; enemies.
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
            GAME STAGE VIEW 5: 8-BIT CLASSICS VAULT (MARIO 1985 & CONTRA 1987)
            ========================================================================== */}
        {selectedGame === 'classics' && (
          <div className="gaming-stage-enclosure classics-stage">
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge">RETRO ARCHIVE &amp; VERIFIED PLATFORMS</span>
                <span className="stage-title-text">8-BIT LEGENDS HALL OF FAME</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live">OFFICIAL VERIFIED LINKS</span>
              </div>
            </div>

            {/* Sub-tab switcher */}
            <div className="classics-subtab-bar">
              <button
                type="button"
                className={`classics-subtab-btn ${classicSubTab === 'mario' ? 'active' : ''}`}
                onClick={() => setClassicSubTab('mario')}
              >
                🍄 8-Bit Pixel Platformer (Play Live)
              </button>
              <button
                type="button"
                className={`classics-subtab-btn ${classicSubTab === 'contra' ? 'active' : ''}`}
                onClick={() => setClassicSubTab('contra')}
              >
                🔥 Contra (1987) &amp; Konami Code
              </button>
            </div>

            {/* Sub-view: 8-Bit Pixel Platformer (100% Playable Live in Browser) */}
            {classicSubTab === 'mario' && (
              <div className="platformer-stage-wrapper">
                {/* 100% IN-BROWSER PLAYABLE ORIGINAL 8-BIT PLATFORMER */}
                <div className="game-stage-content platformer-game-content">
                  <PixelPlatformerGame />
                </div>

                {/* Retro Lore & Controller Guide */}
                <div className="mario-showcase-grid platformer-info-grid">
                  <div className="mario-marquee-card">
                    <div className="mario-badge-flag">RETRO GAMING HERITAGE</div>
                    <div className="mario-marquee-header">
                      <span className="mario-icon-large">🍄</span>
                      <div className="mario-title-group">
                        <h2 className="mario-heading">Classic 8-Bit Platformer</h2>
                        <p className="mario-subheading">Inspired by 1985 NES Physics &amp; Mechanics</p>
                      </div>
                    </div>

                    <p className="mario-editorial-text">
                      Experience the foundational mechanics that defined side-scrolling platformers:
                      momentum physics, jumping gravity, mystery blocks with powerup mushrooms and bouncing coins,
                      patrolling enemies, underground caverns, and the iconic finish flagpole. Built entirely in-browser
                      with 100% original pixel art, chiptune sound synthesis, and zero external redirects!
                    </p>

                    <div className="mario-secrets-list">
                      <div className="secret-item">
                        <span className="secret-badge">WORLD 1-1</span>
                        <div className="secret-text">
                          <strong>Sunny Meadow:</strong> Green hills, warp pipes, mystery blocks, and Goomba-style walking minions.
                        </div>
                      </div>

                      <div className="secret-item">
                        <span className="secret-badge">WORLD 1-2</span>
                        <div className="secret-text">
                          <strong>Subterranean Caverns:</strong> Dark blue cavern bricks, stalactite ceilings, cavern beetles, and coin vaults.
                        </div>
                      </div>

                      <div className="secret-item">
                        <span className="secret-badge">WORLD 1-3</span>
                        <div className="secret-text">
                          <strong>Fortress Citadel:</strong> Red volcanic battlements, lava chasms, floating platforms, and the end-game Castle Flagpole.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mario-reference-card">
                    <h3 className="reference-title">
                      <FaGamepad /> Controller &amp; Gameplay Guide
                    </h3>
                    <div className="nes-controller-grid">
                      <div className="nes-ctrl-row">
                        <span className="nes-key">A / D or ◄ ►</span>
                        <span className="nes-action">Run left &amp; right across the kingdom</span>
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
                        <span className="nes-action">Hit from below to collect coins or Super Mushroom</span>
                      </div>
                      <div className="nes-ctrl-row">
                        <span className="nes-key">ESC or P</span>
                        <span className="nes-action">Pause / Resume gameplay action</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Contra (1987) */}
            {classicSubTab === 'contra' && (
              <div className="contra-showcase-grid">
                <div className="contra-hero-card">
                  <div className="contra-badge-flag">KONAMI RUN &amp; GUN (1987)</div>
                  <div className="contra-header-group">
                    <FaFire className="contra-fire-icon" />
                    <div>
                      <h2 className="contra-heading">Contra</h2>
                      <p className="contra-subheading">Konami Industry Standard Run &amp; Gun Action</p>
                    </div>
                  </div>

                  <p className="contra-editorial-text">
                    Set in 2633 A.D. on the fictional Galuga archipelago, special commandos Bill Rizer and Lance Bean
                    (Earth Federation&apos;s Marine Corps) must neutralize the alien terrorist syndicate Red Falcon.
                    Contra defined co-op run-and-gun gaming with eight directional firing, pseudo-3D base infiltration,
                    and pulse-pounding chiptune audio by Hidenori Maezawa.
                  </p>

                  <div className="contra-action-cluster">
                    <a
                      href="https://store.steampowered.com/app/1018020/Contra_Anniversary_Collection/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portal-btn contra-official-btn"
                    >
                      <span className="mr-right">Play on Steam (Anniversary Edition)</span>
                      <span className="arrow">
                        <FaArrowUpRightFromSquare size={13} />
                      </span>
                    </a>

                    <a
                      href="https://www.nintendo.com/us/store/products/contra-anniversary-collection-switch/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contra-secondary-link"
                    >
                      <span>Contra Collection on Nintendo eShop</span>
                      <FaArrowUpRightFromSquare size={12} />
                    </a>
                  </div>

                  <div className="contra-arsenal-box">
                    <h4 className="arsenal-title">
                      <FaBurst /> Red Falcon Weapon Upgrades
                    </h4>
                    <div className="arsenal-grid">
                      <div className="weapon-pill">
                        <span className="weapon-letter letter-s">S</span>
                        <div className="weapon-info">
                          <strong>Spread Gun:</strong> Five expanding projectiles — the ultimate room-clearing weapon.
                        </div>
                      </div>
                      <div className="weapon-pill">
                        <span className="weapon-letter letter-l">L</span>
                        <div className="weapon-info">
                          <strong>Laser Rifle:</strong> Piercing high-voltage beam for melting armored bosses.
                        </div>
                      </div>
                      <div className="weapon-pill">
                        <span className="weapon-letter letter-m">M</span>
                        <div className="weapon-info">
                          <strong>Machine Gun:</strong> Automatic continuous rapid-fire without button mashing.
                        </div>
                      </div>
                      <div className="weapon-pill">
                        <span className="weapon-letter letter-b">B</span>
                        <div className="weapon-info">
                          <strong>Barrier:</strong> Temporary electromagnetic invulnerability shield.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="contra-konami-card">
                  <div className="konami-card-header">
                    <FaKey className="konami-icon" />
                    <div>
                      <h3 className="konami-card-title">Interactive 30-Lives Konami Code</h3>
                      <p className="konami-card-sub">Click the buttons below or enter on your physical keyboard!</p>
                    </div>
                  </div>

                  <div className="konami-sequence-display">
                    {KONAMI_SEQUENCE.map((k, idx) => {
                      const isMatched = idx < konamiProgress;
                      const isCurrent = idx === konamiProgress;
                      const displaySymbol =
                        k === 'ArrowUp'
                          ? '▲'
                          : k === 'ArrowDown'
                          ? '▼'
                          : k === 'ArrowLeft'
                          ? '◄'
                          : k === 'ArrowRight'
                          ? '►'
                          : k.toUpperCase();

                      return (
                        <span
                          key={idx}
                          className={`sequence-key ${isMatched ? 'matched' : ''} ${isCurrent ? 'current' : ''}`}
                        >
                          {displaySymbol}
                        </span>
                      );
                    })}
                  </div>

                  <div className="konami-clickable-pad">
                    <div className="pad-dpad">
                      <button
                        type="button"
                        className="pad-btn btn-up"
                        onClick={() => handleManualKonamiPress('ArrowUp')}
                      >
                        ▲
                      </button>
                      <div className="pad-dpad-middle">
                        <button
                          type="button"
                          className="pad-btn btn-left"
                          onClick={() => handleManualKonamiPress('ArrowLeft')}
                        >
                          ◄
                        </button>
                        <button
                          type="button"
                          className="pad-btn btn-down"
                          onClick={() => handleManualKonamiPress('ArrowDown')}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          className="pad-btn btn-right"
                          onClick={() => handleManualKonamiPress('ArrowRight')}
                        >
                          ►
                        </button>
                      </div>
                    </div>

                    <div className="pad-actions">
                      <button
                        type="button"
                        className="pad-btn action-b"
                        onClick={() => handleManualKonamiPress('b')}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        className="pad-btn action-a"
                        onClick={() => handleManualKonamiPress('a')}
                      >
                        A
                      </button>
                    </div>
                  </div>

                  {konamiActivated ? (
                    <div className="konami-unlocked-banner">
                      <div className="unlocked-header">
                        <FaTrophy className="trophy-icon" />
                        <span>30 LIVES GRANTED!</span>
                      </div>
                      <p className="unlocked-desc">
                        Code successfully authenticated! You are ready to breach Red Falcon headquarters with maximum firepower.
                      </p>
                      <button
                        type="button"
                        className="reset-code-btn"
                        onClick={() => {
                          setKonamiActivated(false);
                          setKonamiProgress(0);
                        }}
                      >
                        <FaRotateRight /> Reset Code Module
                      </button>
                    </div>
                  ) : (
                    <div className="konami-progress-hint">
                      Sequence Progress: <strong>{konamiProgress} / 10</strong> keys. Enter on keyboard or click the pad!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamingZoneView;
