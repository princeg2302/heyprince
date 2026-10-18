'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaPlay,
  FaPause,
  FaRotateRight,
  FaVolumeHigh,
  FaVolumeXmark,
  FaTrophy,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
} from 'react-icons/fa6';

const GRID_SIZE = 20;

export const RetroSnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  // Snake state refs for the requestAnimationFrame / interval loop
  const snakeRef = useRef<Array<{ x: number; y: number }>>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const dirRef = useRef<{ x: number; y: number }>({ x: 0, y: -1 });
  const nextDirRef = useRef<{ x: number; y: number }>({ x: 0, y: -1 });
  const foodRef = useRef<{ x: number; y: number; isGolden: boolean }>({ x: 5, y: 5, isGolden: false });
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hp_snake_highscore');
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Retro audio synth
  const playBeep = useCallback(
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

  // Spawn random food
  const spawnFood = useCallback((currentSnake: Array<{ x: number; y: number }>) => {
    let newX: number;
    let newY: number;
    let collision: boolean;
    do {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      collision = currentSnake.some((seg) => seg.x === newX && seg.y === newY);
    } while (collision);

    const isGolden = Math.random() < 0.2; // 20% chance of golden food
    foodRef.current = { x: newX, y: newY, isGolden };
  }, []);

  // Render canvas frame
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / GRID_SIZE;

    // Background
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 0, width, height);

    // Cyber grid lines
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food
    const food = foodRef.current;
    ctx.save();
    if (food.isGolden) {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14;
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
    }
    const foodPadding = cellSize * 0.15;
    ctx.beginPath();
    ctx.roundRect(
      food.x * cellSize + foodPadding,
      food.y * cellSize + foodPadding,
      cellSize - foodPadding * 2,
      cellSize - foodPadding * 2,
      6
    );
    ctx.fill();
    ctx.restore();

    // Draw Snake
    const snake = snakeRef.current;
    snake.forEach((seg, index) => {
      ctx.save();
      const isHead = index === 0;
      if (isHead) {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
      } else {
        const ratio = 1 - index / snake.length;
        ctx.fillStyle = `rgba(34, 197, 94, ${0.4 + ratio * 0.6})`;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
      }

      const segPadding = isHead ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * cellSize + segPadding,
        seg.y * cellSize + segPadding,
        cellSize - segPadding * 2,
        cellSize - segPadding * 2,
        isHead ? 6 : 4
      );
      ctx.fill();

      // Eyes on head
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        const eyeSize = 2.5;
        const headX = seg.x * cellSize;
        const headY = seg.y * cellSize;
        const dir = dirRef.current;

        let eye1 = { x: headX + 6, y: headY + 6 };
        let eye2 = { x: headX + cellSize - 8, y: headY + 6 };

        if (dir.x === 1) {
          eye1 = { x: headX + cellSize - 6, y: headY + 5 };
          eye2 = { x: headX + cellSize - 6, y: headY + cellSize - 7 };
        } else if (dir.x === -1) {
          eye1 = { x: headX + 5, y: headY + 5 };
          eye2 = { x: headX + 5, y: headY + cellSize - 7 };
        } else if (dir.y === 1) {
          eye1 = { x: headX + 6, y: headY + cellSize - 6 };
          eye2 = { x: headX + cellSize - 8, y: headY + cellSize - 6 };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }, []);

  // Update Game Physics Step
  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const currentSnake = [...snakeRef.current];
    const head = currentSnake[0];
    const dir = dirRef.current;

    const newHead = {
      x: head.x + dir.x,
      y: head.y + dir.y,
    };

    // Wall collision check
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      setIsGameOver(true);
      setIsPlaying(false);
      playBeep(140, 0.35, 'sawtooth');
      return;
    }

    // Self collision check
    if (currentSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      setIsGameOver(true);
      setIsPlaying(false);
      playBeep(140, 0.35, 'sawtooth');
      return;
    }

    currentSnake.unshift(newHead);

    // Food check
    const food = foodRef.current;
    if (newHead.x === food.x && newHead.y === food.y) {
      const pts = food.isGolden ? 50 : 10;
      setScore((prev) => {
        const next = prev + pts;
        if (next > highScore) {
          setHighScore(next);
          try {
            localStorage.setItem('hp_snake_highscore', next.toString());
          } catch {}
        }
        return next;
      });

      if (food.isGolden) {
        playBeep(880, 0.15, 'triangle');
      } else {
        playBeep(587.33, 0.08, 'square');
      }

      spawnFood(currentSnake);
    } else {
      currentSnake.pop();
    }

    snakeRef.current = currentSnake;
    drawGame();
  }, [drawGame, highScore, playBeep, spawnFood]);

  // Difficulty speed mapping (ms per tick)
  const getSpeed = useCallback(() => {
    switch (difficulty) {
      case 'easy':
        return 135;
      case 'hard':
        return 65;
      case 'normal':
      default:
        return 95;
    }
  }, [difficulty]);

  // Main Loop Manager
  useEffect(() => {
    if (isPlaying && !isPaused && !isGameOver) {
      gameLoopRef.current = setInterval(tick, getSpeed());
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isPaused, isGameOver, tick, getSpeed]);

  // Initial draw
  useEffect(() => {
    drawGame();
  }, [drawGame]);

  // Start / Restart game
  const startGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    snakeRef.current = initialSnake;
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    spawnFood(initialSnake);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    playBeep(440, 0.1, 'triangle');
  };

  // Change direction with reverse guard
  const changeDirection = useCallback(
    (newDir: { x: number; y: number }) => {
      const currentDir = dirRef.current;
      if (currentDir.x + newDir.x === 0 && currentDir.y + newDir.y === 0) return;
      nextDirRef.current = newDir;
      playBeep(330, 0.04, 'sine');
    },
    [playBeep]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        if (!isPlaying) {
          startGame();
        } else {
          setIsPaused((p) => !p);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          changeDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          changeDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          changeDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          changeDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, changeDirection]);

  return (
    <div className="retro-snake-container">
      {/* HUD Header */}
      <div className="game-hud-bar">
        <div className="hud-metric">
          <span className="metric-label">SCORE</span>
          <span className="metric-val score-neon">{score}</span>
        </div>

        <div className="hud-metric">
          <span className="metric-label">SPEED TIER</span>
          <div className="hud-difficulty-selector">
            {(['easy', 'normal', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`diff-btn ${difficulty === lvl ? 'active' : ''}`}
                onClick={() => {
                  if (!isPlaying) setDifficulty(lvl);
                }}
                disabled={isPlaying}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>
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
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <FaVolumeHigh /> : <FaVolumeXmark />}
          </button>
        </div>
      </div>

      {/* Canvas Viewport Enclosure */}
      <div className="game-canvas-wrap snake-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          className="retro-game-canvas"
          onClick={() => {
            if (!isPlaying) startGame();
          }}
        />

        {/* Start Game Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="game-start-overlay">
            <div className="overlay-badge">8-BIT ARCADE ENGINE</div>
            <h3 className="overlay-title">Retro Neon Snake</h3>
            <p className="overlay-instructions">
              Glide the glowing cyber snake, gobble neon nodes &amp; bonus golden cores (+50 pts). Avoid perimeter walls and self collision!
            </p>
            <div className="instructions-tags">
              <span>⌨️ Arrow Keys or WASD</span>
              <span>⚡ Space to Pause / Resume</span>
              <span>📱 Virtual D-Pad on Mobile</span>
            </div>
            <button
              type="button"
              className="game-action-btn start-btn snake-start-btn"
              onClick={startGame}
            >
              <FaPlay /> START GAME
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="game-gameover-overlay">
            <div className="gameover-title">SYSTEM COLLISION</div>
            <p className="gameover-desc">
              Perimeter or body breach detected. Final Score: <strong>{score}</strong>
            </p>
            <button
              type="button"
              className="game-action-btn restart-btn snake-restart-btn"
              onClick={startGame}
            >
              <FaRotateRight /> PLAY AGAIN
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {isPlaying && isPaused && (
          <div className="game-paused-overlay">
            <div className="paused-title">GAME PAUSED</div>
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

      {/* Controls Tray Bar */}
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
        </div>

        <div className="controls-hints">
          <span>⌨️ Arrow Keys / WASD</span>
          <span>⚡ Space to Pause</span>
        </div>
      </div>

      {/* Mobile Virtual 3x3 Symmetrical Directional Pad */}
      <div className="snake-mobile-controls">
        <div className="snake-dpad">
          <span className="snake-pad-spacer" />
          <button
            type="button"
            className="snake-pad-btn btn-up"
            onClick={() => changeDirection({ x: 0, y: -1 })}
            aria-label="Move Up"
          >
            <FaArrowUp />
          </button>
          <span className="snake-pad-spacer" />

          <button
            type="button"
            className="snake-pad-btn btn-left"
            onClick={() => changeDirection({ x: -1, y: 0 })}
            aria-label="Move Left"
          >
            <FaArrowLeft />
          </button>
          <button
            type="button"
            className="snake-pad-btn btn-center"
            onClick={() => {
              if (!isPlaying) startGame();
              else setIsPaused((p) => !p);
            }}
            aria-label={isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Start'}
            title={isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Start Game'}
          >
            {isPlaying ? (isPaused ? <FaPlay /> : <FaPause />) : <FaPlay />}
          </button>
          <button
            type="button"
            className="snake-pad-btn btn-right"
            onClick={() => changeDirection({ x: 1, y: 0 })}
            aria-label="Move Right"
          >
            <FaArrowRight />
          </button>

          <span className="snake-pad-spacer" />
          <button
            type="button"
            className="snake-pad-btn btn-down"
            onClick={() => changeDirection({ x: 0, y: 1 })}
            aria-label="Move Down"
          >
            <FaArrowDown />
          </button>
          <span className="snake-pad-spacer" />
        </div>
      </div>
    </div>
  );
};

export default RetroSnakeGame;
