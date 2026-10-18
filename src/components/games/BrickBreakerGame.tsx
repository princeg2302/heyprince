'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaPlay,
  FaPause,
  FaRotateRight,
  FaVolumeHigh,
  FaVolumeXmark,
  FaTrophy,
  FaHeart,
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
} from 'react-icons/fa6';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  maxHits: number;
  color: string;
  points: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export const BrickBreakerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game physics state refs
  const paddleRef = useRef({
    x: 200,
    y: 450,
    width: 90,
    height: 12,
    speed: 8,
    isMovingLeft: false,
    isMovingRight: false,
  });

  const ballRef = useRef({
    x: 240,
    y: 435,
    radius: 7,
    dx: 3.5,
    dy: -3.5,
    speed: 5,
    stuckToPaddle: true,
  });

  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hp_brick_highscore');
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Web Audio Synth
  const playSfx = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'square') => {
      if (!soundEnabled) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}
    },
    [soundEnabled]
  );

  // Build Bricks grid for current level
  const initBricks = useCallback((lvl: number) => {
    const rows = 4 + Math.min(lvl, 3);
    const cols = 8;
    const brickWidth = 52;
    const brickHeight = 18;
    const padding = 6;
    const offsetTop = 45;
    const offsetLeft = 14;

    const colors = [
      { color: '#ef4444', pts: 40, hits: lvl > 1 ? 2 : 1 }, // red
      { color: '#f59e0b', pts: 30, hits: 1 }, // amber
      { color: '#10b981', pts: 20, hits: 1 }, // emerald
      { color: '#06b6d4', pts: 15, hits: 1 }, // cyan
      { color: '#8b5cf6', pts: 10, hits: 1 }, // purple
      { color: '#ec4899', pts: 25, hits: lvl > 2 ? 2 : 1 }, // pink
      { color: '#3b82f6', pts: 20, hits: 1 }, // blue
    ];

    const newBricks: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      const colorScheme = colors[r % colors.length];
      for (let c = 0; c < cols; c++) {
        newBricks.push({
          x: offsetLeft + c * (brickWidth + padding),
          y: offsetTop + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          hits: colorScheme.hits,
          maxHits: colorScheme.hits,
          color: colorScheme.color,
          points: colorScheme.pts,
          alive: true,
        });
      }
    }
    bricksRef.current = newBricks;
  }, []);

  // Spawn particle effect
  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0,
        maxLife: Math.random() * 20 + 15,
        size: Math.random() * 3 + 2,
      });
    }
  };

  // Reset ball on paddle
  const resetBall = () => {
    const paddle = paddleRef.current;
    ballRef.current = {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - 8,
      radius: 7,
      dx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
      dy: -4,
      speed: 4.8 + level * 0.4,
      stuckToPaddle: true,
    };
  };

  // Launch ball
  const launchBall = () => {
    if (ballRef.current.stuckToPaddle) {
      ballRef.current.stuckToPaddle = false;
      playSfx(480, 0.1, 'triangle');
    }
  };

  // Start / Restart game
  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setIsGameOver(false);
    setIsWon(false);
    setIsPaused(false);
    setIsPlaying(true);

    paddleRef.current = {
      x: 195,
      y: 450,
      width: 90,
      height: 12,
      speed: 8,
      isMovingLeft: false,
      isMovingRight: false,
    };
    initBricks(1);
    particlesRef.current = [];
    resetBall();
    playSfx(580, 0.15, 'square');
  };

  // Next level transition
  const handleLevelWin = useCallback(() => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    initBricks(nextLvl);
    resetBall();
    playSfx(880, 0.3, 'triangle');
  }, [initBricks, level, playSfx]);

  // Main animation / physics loop
  useEffect(() => {
    if (!isPlaying || isGameOver || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateAndDraw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const paddle = paddleRef.current;
      const ball = ballRef.current;

      // 1. Clear background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Cyber grid background lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Move Paddle
      if (paddle.isMovingLeft && paddle.x > 0) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
      }
      if (paddle.isMovingRight && paddle.x + paddle.width < width) {
        paddle.x = Math.min(width - paddle.width, paddle.x + paddle.speed);
      }

      // If ball is stuck, stick to paddle center
      if (ball.stuckToPaddle) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 1;
      } else {
        // Move Ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Bounce left/right walls
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.dx = Math.abs(ball.dx);
          playSfx(300, 0.05, 'square');
        } else if (ball.x + ball.radius >= width) {
          ball.x = width - ball.radius;
          ball.dx = -Math.abs(ball.dx);
          playSfx(300, 0.05, 'square');
        }

        // Bounce top wall
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.dy = Math.abs(ball.dy);
          playSfx(300, 0.05, 'square');
        }

        // Ball falls off bottom
        if (ball.y - ball.radius > height) {
          playSfx(140, 0.25, 'sawtooth');
          setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setIsGameOver(true);
              setIsPlaying(false);
              return 0;
            } else {
              resetBall();
              return newLives;
            }
          });
        }

        // Paddle Collision
        if (
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.height &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.width &&
          ball.dy > 0
        ) {
          // Calculate bounce angle based on where ball hits paddle (-1 to 1)
          const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          const angle = hitPos * (Math.PI / 3); // Max 60 deg angle
          const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

          ball.dx = Math.sin(angle) * currentSpeed;
          ball.dy = -Math.cos(angle) * currentSpeed;
          ball.y = paddle.y - ball.radius;
          playSfx(420, 0.07, 'triangle');
        }

        // Brick Collisions
        let activeBricksCount = 0;
        bricksRef.current.forEach((brick) => {
          if (!brick.alive) return;
          activeBricksCount++;

          // AABB Collision test
          if (
            ball.x + ball.radius >= brick.x &&
            ball.x - ball.radius <= brick.x + brick.width &&
            ball.y + ball.radius >= brick.y &&
            ball.y - ball.radius <= brick.y + brick.height
          ) {
            // Determine hit side
            const prevX = ball.x - ball.dx;
            const prevY = ball.y - ball.dy;

            if (prevX + ball.radius <= brick.x || prevX - ball.radius >= brick.x + brick.width) {
              ball.dx = -ball.dx;
            } else {
              ball.dy = -ball.dy;
            }

            brick.hits -= 1;
            createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);

            if (brick.hits <= 0) {
              brick.alive = false;
              playSfx(550, 0.08, 'square');
              setScore((prev) => {
                const updated = prev + brick.points;
                if (updated > highScore) {
                  setHighScore(updated);
                  try {
                    localStorage.setItem('hp_brick_highscore', updated.toString());
                  } catch {}
                }
                return updated;
              });
            } else {
              playSfx(380, 0.06, 'sine');
            }
          }
        });

        // Level Cleared
        if (activeBricksCount === 0 && bricksRef.current.length > 0) {
          handleLevelWin();
        }
      }

      // 3. Draw Bricks
      bricksRef.current.forEach((brick) => {
        if (!brick.alive) return;
        ctx.save();
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = brick.hits > 1 ? '#ffffff' : brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Inner bevel / accent
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);

        if (brick.hits > 1) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(brick.x + 3, brick.y + 3, brick.width - 6, brick.height - 6);
        }
        ctx.restore();
      });

      // 4. Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 5. Draw Paddle (Glowing Cyber Paddle)
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(paddle.x + 4, paddle.y + 3, paddle.width - 8, paddle.height - 6);
      ctx.restore();

      // 6. Draw Ball (Energy Orb)
      ctx.save();
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Loop
      animId = requestAnimationFrame(updateAndDraw);
    };

    animId = requestAnimationFrame(updateAndDraw);
    animationFrameRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGameOver, isPaused, highScore, handleLevelWin, playSfx]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddleRef.current.isMovingLeft = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddleRef.current.isMovingRight = true;
      }
      if (e.key === ' ') {
        if (!isPlaying) {
          startGame();
        } else if (ballRef.current.stuckToPaddle) {
          launchBall();
        } else {
          setIsPaused((p) => !p);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddleRef.current.isMovingLeft = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddleRef.current.isMovingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  // Mouse & Touch paddle movement on canvas
  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const relX = (clientX - rect.left) * scale;
    const paddle = paddleRef.current;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, relX - paddle.width / 2));
  };

  return (
    <div className="brick-breaker-container">
      {/* HUD Header */}
      <div className="game-hud-bar">
        <div className="hud-metric">
          <span className="metric-label">SCORE</span>
          <span className="metric-val score-neon">{score}</span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">LEVEL</span>
          <span className="metric-val level-neon">WAVE {level}</span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">LIVES</span>
          <span className="metric-val lives-neon">
            {Array.from({ length: 3 }).map((_, i) => (
              <FaHeart
                key={i}
                className={`life-heart ${i < lives ? 'active' : 'depleted'}`}
              />
            ))}
          </span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">HIGH SCORE</span>
          <span className="metric-val trophy-neon">
            <FaTrophy /> {highScore}
          </span>
        </div>
        <div className="hud-actions">
          <button
            type="button"
            className="hud-btn-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <FaVolumeHigh /> : <FaVolumeXmark />}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="game-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          className="retro-game-canvas"
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onTouchMove={(e) => {
            if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX);
          }}
          onClick={() => {
            if (!isPlaying) startGame();
            else if (ballRef.current.stuckToPaddle) launchBall();
          }}
        />

        {/* OVERLAYS */}
        {!isPlaying && !isGameOver && (
          <div className="game-start-overlay">
            <div className="overlay-badge">RETRO BREAKOUT</div>
            <h3 className="overlay-title">Cyber Brick Breaker</h3>
            <p className="overlay-instructions">
              Shatter neon energy bricks, bounce plasma orbs, and advance through cyber waves.
            </p>
            <div className="instructions-tags">
              <span>🎮 Mouse / Touch to Slide</span>
              <span>⚡ Space to Launch</span>
              <span>⌨️ A / D or Arrow Keys</span>
            </div>
            <button type="button" className="game-action-btn start-btn" onClick={startGame}>
              <FaPlay /> START GAME
            </button>
          </div>
        )}

        {isPlaying && ballRef.current.stuckToPaddle && (
          <div className="ball-launch-hint" onClick={launchBall}>
            <span>TAP CANVAS OR CLICK LAUNCH TO FIRE PLASMA ORB</span>
          </div>
        )}

        {isGameOver && (
          <div className="game-gameover-overlay">
            <div className="gameover-title">GRID BREACHED</div>
            <p className="gameover-desc">
              All 3 plasma shields expired. Final Score: <strong>{score}</strong>
            </p>
            <button type="button" className="game-action-btn restart-btn" onClick={startGame}>
              <FaRotateRight /> PLAY AGAIN
            </button>
          </div>
        )}

        {isPaused && (
          <div className="game-paused-overlay">
            <div className="paused-title">SYSTEM PAUSED</div>
            <button
              type="button"
              className="game-action-btn resume-btn"
              onClick={() => setIsPaused(false)}
            >
              <FaPlay /> RESUME
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS BAR */}
      <div className="game-controls-tray">
        <div className="tray-left">
          {isPlaying && (
            <button
              type="button"
              className="tray-btn"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <FaPlay /> : <FaPause />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}
          <button type="button" className="tray-btn" onClick={startGame}>
            <FaRotateRight />
            <span>Restart</span>
          </button>
          {isPlaying && ballRef.current.stuckToPaddle && (
            <button type="button" className="tray-btn btn-highlight" onClick={launchBall}>
              <FaBolt />
              <span>Launch Orb</span>
            </button>
          )}
        </div>

        {/* Mobile touch controls */}
        <div className="mobile-touch-buttons">
          <button
            type="button"
            className="mobile-pad-btn"
            onTouchStart={() => {
              paddleRef.current.isMovingLeft = true;
            }}
            onTouchEnd={() => {
              paddleRef.current.isMovingLeft = false;
            }}
            onMouseDown={() => {
              paddleRef.current.isMovingLeft = true;
            }}
            onMouseUp={() => {
              paddleRef.current.isMovingLeft = false;
            }}
            aria-label="Move Left"
          >
            <FaArrowLeft />
          </button>
          <button
            type="button"
            className="mobile-pad-btn action-center"
            onClick={launchBall}
            aria-label="Launch Ball"
          >
            <FaBolt />
          </button>
          <button
            type="button"
            className="mobile-pad-btn"
            onTouchStart={() => {
              paddleRef.current.isMovingRight = true;
            }}
            onTouchEnd={() => {
              paddleRef.current.isMovingRight = false;
            }}
            onMouseDown={() => {
              paddleRef.current.isMovingRight = true;
            }}
            onMouseUp={() => {
              paddleRef.current.isMovingRight = false;
            }}
            aria-label="Move Right"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

