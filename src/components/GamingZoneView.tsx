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
} from 'react-icons/fa6';
import { SudokuGame } from './SudokuGame';

export const GamingZoneView: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<'mario' | 'sudoku' | 'contra'>('mario');
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
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  // Handle keyboard listener for Konami code
  useEffect(() => {
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
  }, [konamiProgress, playFanfare, playRetroBeep]);

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
            <span>8-Bit Retro Vault &amp; Cyber Hub</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="gaming-hero-wrap text-center">
          <h1 className="gaming-main-title">
            HeyPrince <span className="text-red">Gaming Zone</span>
          </h1>
          <p className="gaming-hero-desc">
            Where legendary childhood classics meet modern web engineering logic. Experience the original
            1985 Super Mario Bros., solve the Cyber Sudoku Matrix, and trigger the 30-Lives Contra Code —
            built with 100% legal integrity, official platform links, and zero unauthorized piracy ROMs.
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

        {/* Game Selection Cards (Consistent with HeyPrince Dark Cyber Aesthetic) */}
        <div className="gaming-selector-deck">
          {/* CARD 1: SUPER MARIO BROS (1985) */}
          <div
            className={`gaming-deck-card card-mario ${selectedGame === 'mario' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('mario');
              playRetroBeep(440, 0.1, 'square');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('mario');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-mario">NINTENDO NES • 1985</span>
              {selectedGame === 'mario' && <span className="deck-active-pill">ACTIVE SELECTION</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-mario">
                <span className="mario-mushroom-icon">🍄</span>
              </div>
              <h3 className="deck-game-title">Super Mario Bros.</h3>
              <p className="deck-game-desc">
                The original 1985 masterpiece by Shigeru Miyamoto &amp; Koji Kondo that shaped video game history.
              </p>
            </div>
            <div className="deck-card-footer">
              <span className="deck-mode-indicator">
                <FaStar className="star-icon text-red" /> Official Classic Showcase
              </span>
              <span className="deck-arrow-btn">→</span>
            </div>
          </div>

          {/* CARD 2: CYBER SUDOKU MATRIX (IN-BROWSER PLAYABLE) */}
          <div
            className={`gaming-deck-card card-sudoku ${selectedGame === 'sudoku' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('sudoku');
              playRetroBeep(520, 0.1, 'triangle');
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
              <span className="deck-tag tag-sudoku">IN-BROWSER PLAYABLE</span>
              {selectedGame === 'sudoku' && <span className="deck-active-pill">ACTIVE SELECTION</span>}
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

          {/* CARD 3: CONTRA (1987) */}
          <div
            className={`gaming-deck-card card-contra ${selectedGame === 'contra' ? 'is-selected' : ''}`}
            onClick={() => {
              setSelectedGame('contra');
              playRetroBeep(330, 0.1, 'sawtooth');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedGame('contra');
              }
            }}
          >
            <div className="deck-card-top">
              <span className="deck-tag tag-contra">KONAMI 8-BIT • 1987</span>
              {selectedGame === 'contra' && <span className="deck-active-pill">ACTIVE SELECTION</span>}
            </div>
            <div className="deck-card-body">
              <div className="deck-icon-badge badge-contra">
                <FaFire />
              </div>
              <h3 className="deck-game-title">Contra (1987)</h3>
              <p className="deck-game-desc">
                The high-octane Konami run-and-gun arcade legend featuring Bill &amp; Lance and the immortal 30-Lives code.
              </p>
            </div>
            <div className="deck-card-footer">
              <span className="deck-mode-indicator">
                <FaKey className="key-icon text-orange" /> Konami Code Interactive
              </span>
              <span className="deck-arrow-btn">→</span>
            </div>
          </div>
        </div>

        {/* ==========================================================================
            GAME STAGE VIEW 1: SUPER MARIO BROS (1985)
            ========================================================================== */}
        {selectedGame === 'mario' && (
          <div className="gaming-stage-enclosure mario-stage">
            {/* Top Cabinet Header */}
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge">FAMICOM / NES 1985</span>
                <span className="stage-title-text">SUPER MARIO BROS. — WORLD 1-1 ARCHIVE</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live">NINTENDO OFFICIAL PLATFORM</span>
              </div>
            </div>

            {/* Arcade Showcase Window */}
            <div className="mario-showcase-grid">
              {/* Left Column: Arcade Hero Marquee */}
              <div className="mario-marquee-card">
                <div className="mario-badge-flag">ORIGINAL 1985 CLASSIC</div>
                <div className="mario-marquee-header">
                  <span className="mario-icon-large">🍄</span>
                  <div className="mario-title-group">
                    <h2 className="mario-heading">Super Mario Bros.</h2>
                    <p className="mario-subheading">Nintendo Entertainment System (1985)</p>
                  </div>
                </div>

                <p className="mario-editorial-text">
                  On September 13, 1985, Nintendo released <em>Super Mario Bros.</em>, directed by Shigeru Miyamoto
                  and Takashi Tezuka with musical direction by Koji Kondo. It rescued the North American video game
                  industry from the 1983 crash and established the foundational grammar of side-scrolling platformers:
                  momentum physics, power-up progression, hidden warp pipes, and emergent level design.
                </p>

                {/* Primary Launch Action linking directly to official Nintendo verified platforms */}
                <div className="mario-action-cluster">
                  <a
                    href="https://www.nintendo.com/us/store/products/nintendo-entertainment-system-nintendo-switch-online-switch/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn mario-official-btn"
                  >
                    <span className="mr-right">Play on Nintendo Switch Online</span>
                    <span className="arrow">
                      <FaArrowUpRightFromSquare size={13} />
                    </span>
                  </a>

                  <a
                    href="https://mario.nintendo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mario-secondary-link"
                  >
                    <span>Visit Official Super Mario Portal (Nintendo)</span>
                    <FaArrowUpRightFromSquare size={12} />
                  </a>
                </div>

                {/* Legal & Copyright Transparency Box */}
                <div className="legal-compliance-card">
                  <div className="legal-card-header">
                    <FaShieldHalved className="legal-icon" />
                    <h4>Official IP &amp; DMCA Compliance Notice</h4>
                  </div>
                  <p className="legal-card-body">
                    <strong>Why HeyPrince.in links to Nintendo instead of embedding an unauthorized ROM mirror:</strong>{' '}
                    The original <em>Super Mario Bros. (1985)</em> ROM, compiled assembly code, sound effects, sprite
                    sheets, and musical scores are the strictly protected intellectual property of{' '}
                    <strong>Nintendo Co., Ltd.</strong> Nintendo does not offer an authorized public web embedding API
                    or open web license. In accordance with strict legal standards and respect for original creators,
                    HeyPrince.in does not bundle or mirror unauthorized third-party emulator ROMs. We direct you
                    exclusively to Nintendo&apos;s verified official platforms.
                  </p>
                </div>
              </div>

              {/* Right Column: NES Manual & Secret Guide */}
              <div className="mario-reference-card">
                <h3 className="reference-title">
                  <FaGamepad /> NES Controller Operations Guide
                </h3>
                <div className="nes-controller-grid">
                  <div className="nes-ctrl-row">
                    <span className="nes-key">D-PAD ◄ ►</span>
                    <span className="nes-action">Move Mario left &amp; right across the Mushroom Kingdom</span>
                  </div>
                  <div className="nes-ctrl-row">
                    <span className="nes-key">D-PAD ▼</span>
                    <span className="nes-action">Crouch / Duck (Super &amp; Fire Mario) or enter downward Pipes</span>
                  </div>
                  <div className="nes-ctrl-row">
                    <span className="nes-key">A BUTTON</span>
                    <span className="nes-action">Jump (hold longer for maximum height) / Swim in water stages</span>
                  </div>
                  <div className="nes-ctrl-row">
                    <span className="nes-key">B BUTTON</span>
                    <span className="nes-action">Sprint / Dash (hold while walking) or launch Fireballs</span>
                  </div>
                  <div className="nes-ctrl-row">
                    <span className="nes-key">START</span>
                    <span className="nes-action">Pause / Resume gameplay action</span>
                  </div>
                </div>

                <h3 className="reference-title secrets-title">
                  <FaStar /> Legendary 1985 Secrets &amp; Warp Zones
                </h3>
                <div className="mario-secrets-list">
                  <div className="secret-item">
                    <span className="secret-badge">WORLD 1-2</span>
                    <div className="secret-text">
                      <strong>Warp Zone to Worlds 2, 3, &amp; 4:</strong> At the very end of World 1-2, jump onto the
                      elevator platform and run along the top ceiling past the exit pipe.
                    </div>
                  </div>

                  <div className="secret-item">
                    <span className="secret-badge">WORLD 4-2</span>
                    <div className="secret-text">
                      <strong>Warp Zone to Worlds 6, 7, &amp; 8:</strong> Climb the hidden beanstalk vine at the start
                      of World 4-2 to skip straight to Bowser&apos;s final worlds.
                    </div>
                  </div>

                  <div className="secret-item">
                    <span className="secret-badge">WORLD 3-1</span>
                    <div className="secret-text">
                      <strong>Infinite 1-UP Shell Trick:</strong> Trap a Koopa Troopa shell on the staircase at the
                      end of World 3-1 and continuously stomp it for unlimited extra lives.
                    </div>
                  </div>

                  <div className="secret-item">
                    <span className="secret-badge">WORLD 1-2 GLITCH</span>
                    <div className="secret-text">
                      <strong>The Minus World (World -1):</strong> Duck-jump backward through the solid brick wall at
                      the pipe exit of World 1-2 to enter the infinite underwater void.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
            GAME STAGE VIEW 2: CYBER SUDOKU MATRIX (IN-BROWSER PLAYABLE)
            ========================================================================== */}
        {selectedGame === 'sudoku' && (
          <div className="gaming-stage-enclosure sudoku-stage">
            {/* Top Cabinet Header */}
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

            {/* Embedded Active Sudoku Component */}
            <div className="sudoku-embed-wrapper">
              <SudokuGame />
            </div>
          </div>
        )}

        {/* ==========================================================================
            GAME STAGE VIEW 3: CONTRA (1987)
            ========================================================================== */}
        {selectedGame === 'contra' && (
          <div className="gaming-stage-enclosure contra-stage">
            {/* Top Cabinet Header */}
            <div className="stage-top-bar">
              <div className="stage-retro-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="stage-title-wrap">
                <span className="stage-system-badge badge-contra">KONAMI ARCADE / NES 1987</span>
                <span className="stage-title-text">CONTRA — OPERATION RED FALCON</span>
              </div>
              <div className="stage-status-wrap">
                <span className="status-indicator-live status-orange">KONAMI CODE MODULE ACTIVE</span>
              </div>
            </div>

            {/* Contra Showcase Grid */}
            <div className="contra-showcase-grid">
              {/* Left Column: Arcade Narrative & Official Sources */}
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

                {/* Official Konami Platforms */}
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

                {/* Arsenal Breakdown */}
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

              {/* Right Column: Interactive Konami Code Module */}
              <div className="contra-konami-card">
                <div className="konami-card-header">
                  <FaKey className="konami-icon" />
                  <div>
                    <h3 className="konami-card-title">Interactive 30-Lives Konami Code</h3>
                    <p className="konami-card-sub">Click the buttons below or enter on your physical keyboard!</p>
                  </div>
                </div>

                {/* Konami Code Input Sequence Display */}
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

                {/* On-Screen Clickable Pad */}
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

                {/* Status Celebration Banner */}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default GamingZoneView;
