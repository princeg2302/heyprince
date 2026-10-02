import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaRotateRight, FaVolumeHigh, FaVolumeXmark, FaTrophy, FaBolt, FaBug } from 'react-icons/fa6';

interface Target {
  id: number;
  type: 'bug404' | 'typeError' | 'memoryLeak' | 'mergeConflict' | 'coffee';
  label: string;
  points: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
}

const TARGET_TYPES = [
  { type: 'bug404', label: '🐛 404 Bug', points: 100, color: '#ff3366' },
  { type: 'typeError', label: '⚠️ Type Error', points: 150, color: '#ffaa00' },
  { type: 'memoryLeak', label: '🐞 Memory Leak', points: 200, color: '#00f2fe' },
  { type: 'mergeConflict', label: '💥 Conflict', points: 300, color: '#b537f2' },
  { type: 'coffee', label: '☕ Clean Coffee', points: 500, color: '#00ff88' },
];

export const CyberArcade: React.FC = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bugsSquashed, setBugsSquashed] = useState(0);
  const [screenShake, setScreenShake] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const targetsRef = useRef<Target[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const animFrameRef = useRef<number>(0);
  const targetIdCounter = useRef(0);
  const particleIdCounter = useRef(0);
  const floatingIdCounter = useRef(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synthesize dynamic retro sound effects with Web Audio API
  const playSound = useCallback((type: 'zap' | 'powerup' | 'gameover' | 'start') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'zap') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'powerup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'gameover') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio safety fallback
    }
  }, [soundEnabled]);

  // Spawn a target inside arena bounds
  const spawnTarget = useCallback(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const width = arena.clientWidth;
    const height = arena.clientHeight;

    const isCoffee = Math.random() < 0.1;
    const isConflict = Math.random() < 0.2;
    let template = TARGET_TYPES[0];
    if (isCoffee) {
      template = TARGET_TYPES[4];
    } else if (isConflict) {
      template = TARGET_TYPES[3];
    } else {
      template = TARGET_TYPES[Math.floor(Math.random() * 3)];
    }

    const padding = 60;
    const x = Math.random() * (width - padding * 2) + padding;
    const y = Math.random() * (height - padding * 2) + padding;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 1.5;

    const newTarget: Target = {
      id: ++targetIdCounter.current,
      type: template.type as any,
      label: template.label,
      points: template.points,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: template.type === 'coffee' ? 44 : 38,
      color: template.color,
    };

    targetsRef.current.push(newTarget);
  }, []);

  // Explode target into glowing neon particles
  const spawnExplosion = (x: number, y: number, color: string) => {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        id: ++particleIdCounter.current,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 3 + Math.random() * 4,
      });
    }
  };

  // Add floating points indicator
  const addFloatingScore = (text: string, x: number, y: number, color: string) => {
    floatingScoresRef.current.push({
      id: ++floatingIdCounter.current,
      text,
      x,
      y,
      color,
      opacity: 1,
    });
  };

  // Start game session
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCombo(1);
    setTimeLeft(30);
    setBugsSquashed(0);
    targetsRef.current = [];
    particlesRef.current = [];
    floatingScoresRef.current = [];
    playSound('start');

    // Initial bug spawns
    for (let i = 0; i < 6; i++) {
      spawnTarget();
    }
  };

  // Hit target logic
  const handleHitTarget = (targetId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'playing') return;

    const index = targetsRef.current.findIndex((t) => t.id === targetId);
    if (index === -1) return;

    const target = targetsRef.current[index];
    targetsRef.current.splice(index, 1);

    // Screen hit shake
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 120);

    // Combo system
    const earnedPoints = target.points * combo;
    setScore((prev) => prev + earnedPoints);
    setBugsSquashed((prev) => prev + 1);

    setCombo((prev) => Math.min(prev + 1, 5));
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setCombo(1);
    }, 2200);

    // Particles and sound
    spawnExplosion(target.x, target.y, target.color);
    addFloatingScore(`+${earnedPoints}${combo > 1 ? ` (x${combo})` : ''}`, target.x, target.y - 10, target.color);

    if (target.type === 'coffee') {
      playSound('powerup');
      // Clear all other bugs on screen in an EMP blast
      targetsRef.current.forEach((t) => {
        spawnExplosion(t.x, t.y, t.color);
      });
      const bonus = targetsRef.current.length * 200;
      setScore((prev) => prev + bonus);
      if (bonus > 0) {
        addFloatingScore(`EMP OVERLOAD +${bonus}!`, target.x, target.y - 30, '#00ff88');
      }
      targetsRef.current = [];
    } else {
      playSound('zap');
    }

    // Immediately replace with new targets
    setTimeout(() => spawnTarget(), 200);
    if (Math.random() < 0.35) {
      setTimeout(() => spawnTarget(), 600);
    }
  };

  // Main 60fps render loop
  useEffect(() => {
    let lastSpawn = Date.now();

    const loop = () => {
      const arena = arenaRef.current;
      if (arena) {
        const width = arena.clientWidth;
        const height = arena.clientHeight;

        // Move targets
        targetsRef.current.forEach((target) => {
          target.x += target.vx;
          target.y += target.vy;

          // Bounce off arena walls
          const r = target.size / 2;
          if (target.x - r < 0 || target.x + r > width) {
            target.vx *= -1;
            target.x = Math.max(r, Math.min(width - r, target.x));
          }
          if (target.y - r < 0 || target.y + r > height) {
            target.vy *= -1;
            target.y = Math.max(r, Math.min(height - r, target.y));
          }
        });

        // Update particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.alpha -= 0.035;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Update floating scores
        for (let i = floatingScoresRef.current.length - 1; i >= 0; i--) {
          const f = floatingScoresRef.current[i];
          f.y -= 1.2;
          f.opacity -= 0.025;
          if (f.opacity <= 0) {
            floatingScoresRef.current.splice(i, 1);
          }
        }

        // Spawn targets to maintain minimum count when playing
        if (gameState === 'playing') {
          if (targetsRef.current.length < 5 && Date.now() - lastSpawn > 500) {
            spawnTarget();
            lastSpawn = Date.now();
          }
        } else if (gameState === 'idle') {
          // Idle floating targets
          if (targetsRef.current.length < 4) {
            spawnTarget();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, spawnTarget]);

  // 30s Game Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('gameover');
          playSound('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, playSound]);

  // Determine Developer Rank based on score
  const getRank = (pts: number) => {
    if (pts >= 8000) return { title: 'Prince’s Tech Partner 👑', color: '#ff2d55' };
    if (pts >= 5500) return { title: '10x Lead Architect 🚀', color: '#00f2fe' };
    if (pts >= 3500) return { title: 'Senior Bug Crusher ⚡', color: '#00ff88' };
    if (pts >= 1800) return { title: 'Full-Stack Developer 💻', color: '#ffaa00' };
    return { title: 'Junior Debugger 🐛', color: '#888888' };
  };

  const rank = getRank(score);

  return (
    <section className="cyber-arcade-section" id="arcade">
      <div className="container">
        {/* Section Heading with Glowing Badge and Modern Cyber Title */}
        <div className="arcade-header-wrap text-center">
          <div className="arcade-badge">
            <span className="live-pulse-dot"></span>
            <span className="badge-text">PRINCE CYBER ARCADE // MINI-GAME</span>
          </div>

          <h2 className="arcade-glow-title">
            Take a Breather: <br />
            Debug The{' '}
            <span className="text-red word">
              <span>M</span>
              <span>a</span>
              <span>T</span>
              <span>r</span>
              <span>i</span>
              <span>X</span>
            </span>
          </h2>
          <p className="arcade-subtitle">
            Rogue production bugs are invading the server! Zap the bugs, trigger neon particle explosions, build combo
            multipliers, and earn your developer rank.
          </p>
        </div>

        {/* The Cyberpunk Terminal Container */}
        <div className={`arcade-terminal ${screenShake ? 'screen-shake' : ''}`}>
          {/* Terminal Top Bar */}
          <div className="terminal-header">
            <div className="terminal-controls">
              <div className="terminal-dots">
                <span className="dot red" title="Close Session"></span>
                <span className="dot yellow" title="Minimize"></span>
                <span className="dot green" title="Maximize"></span>
              </div>
              <div className="terminal-identity">
                <span className="terminal-prompt">$</span>
                <span className="terminal-title">PRINCE_DEV_DEBUGGER_v2.6.sh</span>
                <span className="terminal-status-badge">LIVE 60FPS</span>
              </div>
            </div>

            <div className="terminal-stats">
              <div className="stat-pill score-pill">
                <span className="stat-icon">💎</span>
                <span className="stat-label">SCORE</span>
                <span className="stat-value">{score.toLocaleString()}</span>
              </div>

              <div className={`stat-pill combo-pill ${combo > 1 ? 'combo-active' : ''}`}>
                <span className="stat-icon">{combo > 1 ? '🔥' : '⚡'}</span>
                <span className="stat-label">COMBO</span>
                <span className="stat-value">x{combo}</span>
              </div>

              <div className={`stat-pill time-pill ${timeLeft <= 10 ? 'time-urgent' : ''}`}>
                <span className="stat-icon">⏱️</span>
                <span className="stat-label">TIME</span>
                <span className="stat-value">{timeLeft}s</span>
              </div>

              <button
                type="button"
                className={`sound-toggle-btn ${soundEnabled ? 'sound-on' : 'sound-off'}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
                aria-label="Toggle Sound"
              >
                {soundEnabled ? <FaVolumeHigh /> : <FaVolumeXmark />}
                <span className="sound-label">{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
              </button>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="terminal-timer-bar">
            <div className="timer-fill" style={{ width: `${(timeLeft / 30) * 100}%` }}></div>
          </div>

          {/* Interactive Arena */}
          <div className="terminal-arena" ref={arenaRef}>
            {/* Background Grid & Scanlines */}
            <div className="cyber-grid-overlay"></div>
            <div className="scanlines"></div>

            {/* Active Floating Bug Targets */}
            {targetsRef.current.map((target) => (
              <button
                key={target.id}
                type="button"
                className={`cyber-target target-${target.type}`}
                style={{
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  borderColor: target.color,
                  boxShadow: `0 0 16px ${target.color}66, inset 0 0 8px ${target.color}33`,
                }}
                onClick={(e) => handleHitTarget(target.id, e)}
                aria-label={`Squash ${target.label}`}
              >
                <span className="target-pulse" style={{ backgroundColor: target.color }}></span>
                <span className="target-text">{target.label}</span>
              </button>
            ))}

            {/* Neon Particle Explosions */}
            {particlesRef.current.map((p) => (
              <div
                key={p.id}
                className="neon-particle"
                style={{
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                  opacity: p.alpha,
                }}
              />
            ))}

            {/* Floating Point Popups */}
            {floatingScoresRef.current.map((f) => (
              <div
                key={f.id}
                className="floating-score"
                style={{
                  left: `${f.x}px`,
                  top: `${f.y}px`,
                  color: f.color,
                  opacity: f.opacity,
                  textShadow: `0 0 8px ${f.color}`,
                }}
              >
                {f.text}
              </div>
            ))}

            {/* Idle Overlay (Start Screen) */}
            {gameState === 'idle' && (
              <div className="arena-overlay">
                <div className="overlay-box text-center">
                  <div className="overlay-icon mb-3">
                    <FaBug size={48} color="#D40027" />
                  </div>
                  <h3>BUG HUNT SPRINT</h3>
                  <p>
                    30 seconds. Fast reflexes. Click as many bugs as you can before the server crashes!
                  </p>
                  <div className="legend-pills mb-4">
                    <span>🐛 Bug +100</span>
                    <span>⚠️ Type Error +150</span>
                    <span>🐞 Memory Leak +200</span>
                    <span>💥 Conflict +300</span>
                    <span>☕ Coffee EMP +500</span>
                  </div>
                  <button type="button" className="portal-btn mx-auto" onClick={startGame}>
                    <span className="mr-right">INITIALIZE SPRINT</span>
                    <span className="arrow">
                      <FaPlay size={16} color="#000" />
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'gameover' && (
              <div className="arena-overlay gameover-overlay">
                <div className="overlay-box text-center">
                  <div className="trophy-wrap mb-3">
                    <FaTrophy size={54} color={rank.color} />
                  </div>
                  <h3>SERVER DEPLOYED!</h3>
                  <div className="score-summary my-3">
                    <div className="final-score">
                      <span>FINAL SCORE</span>
                      <strong>{score.toLocaleString()}</strong>
                    </div>
                    <div className="final-rank" style={{ color: rank.color }}>
                      <span>ENGINEER RANK</span>
                      <h4>{rank.title}</h4>
                    </div>
                    <div className="final-squashed">
                      <span>BUGS DESTROYED</span>
                      <p>{bugsSquashed} bugs squashed</p>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
                    <button type="button" className="btn-arcade-action" onClick={startGame}>
                      <FaRotateRight className="me-2" /> Play Again
                    </button>
                    <a href="#contact" className="portal-btn">
                      <span className="mr-right">Build Bug-Free Apps</span>
                      <span className="arrow">
                        <FaBolt size={16} color="#000" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CyberArcade;
