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
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

    // Food
    const food = foodRef.current;
    ctx.save();
    if (food.isGolden) {
      ctx.fillStyle = '#ffbd2e';
      ctx.shadowColor = '#ffbd2e';
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = '#ff2d55';
      ctx.shadowColor = '#ff2d55';
      ctx.shadowBlur = 12;
    }
    const foodPad = cellSize * 0.18;
    ctx.beginPath();
    ctx.roundRect(
      food.x * cellSize + foodPad,
      food.y * cellSize + foodPad,
      cellSize - foodPad * 2,
      cellSize - foodPad * 2,
      food.isGolden ? 6 : 4
    );
    ctx.fill();
    ctx.restore();

    // Snake
    const snake = snakeRef.current;
    snake.forEach((seg, idx) => {
      ctx.save();
      const isHead = idx === 0;
      if (isHead) {
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 12;
      } else {
        const alpha = Math.max(0.35, 1 - idx / snake.length);
        ctx.fillStyle = `rgba(0, 242, 254, ${alpha})`;
      }
      const pad = 1.5;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * cellSize + pad,
        seg.y * cellSize + pad,
        cellSize - pad * 2,
        cellSize - pad * 2,
        isHead ? 5 : 3
      );
      ctx.fill();

      // Eye details on head
      if (isHead) {
        ctx.fillStyle = '#000000';
        const eyeSize = cellSize * 0.16;
        const offset = cellSize * 0.3;
        ctx.beginPath();
        ctx.arc(seg.x * cellSize + offset, seg.y * cellSize + offset, eyeSize, 0, Math.PI * 2);
        ctx.arc(seg.x * cellSize + cellSize - offset, seg.y * cellSize + offset, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }, []);

  // Main step
  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const curDir = dirRef.current;
    const snake = [...snakeRef.current];
    const head = { x: snake[0].x + curDir.x, y: snake[0].y + curDir.y };

    // Wall collision (wrap around or die)
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setIsGameOver(true);
      setIsPlaying(false);
      playBeep(160, 0.35, 'sawtooth');
      return;
    }

    // Self collision
    if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      setIsGameOver(true);
      setIsPlaying(false);
      playBeep(160, 0.35, 'sawtooth');
      return;
    }

    snake.unshift(head);

    // Check food eaten
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      const addedPoints = food.isGolden ? 50 : 10;
      setScore((prev) => {
        const nextScore = prev + addedPoints;
        if (nextScore > highScore) {
          setHighScore(nextScore);
          try {
            localStorage.setItem('hp_snake_highscore', String(nextScore));
          } catch {}
        }
        return nextScore;
      });
      playBeep(food.isGolden ? 680 : 520, 0.1, 'triangle');
      spawnFood(snake);
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
    drawGame();
  }, [drawGame, highScore, playBeep, spawnFood]);

  // Game loop trigger
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    const intervalSpeed = difficulty === 'hard' ? 70 : difficulty === 'normal' ? 95 : 130;
    gameLoopRef.current = setInterval(tick, intervalSpeed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isPaused, isGameOver, difficulty, tick]);

  // Redraw on load
  useEffect(() => {
    drawGame();
  }, [drawGame]);

  // Start new game
  const startGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    snakeRef.current = initialSnake;
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    spawnFood(initialSnake);
    setIsPlaying(true);
    playBeep(440, 0.15, 'sine');
  };

  // Change direction safely
  const changeDirection = useCallback((newDir: { x: number; y: number }) => {
    const cur = dirRef.current;
    // Disallow reverse
    if (cur.x + newDir.x === 0 && cur.y + newDir.y === 0) return;
    nextDirRef.current = newDir;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPaused((p) => !p);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
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
      <div className="snake-hud-bar">
        <div className="snake-stat-pill">
          <span className="stat-label">SCORE</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="snake-stat-pill high-score">
          <FaTrophy className="trophy-icn" />
          <span className="stat-label">BEST</span>
          <span className="stat-value">{highScore}</span>
        </div>

        <div className="snake-difficulty-tabs">
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

        <button
          type="button"
          className="snake-audio-btn"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? <FaVolumeHigh /> : <FaVolumeXmark />}
        </button>
      </div>

      {/* Canvas Viewport Enclosure */}
      <div className="snake-viewport-wrap">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="snake-canvas"
        />

        {/* Overlay when game over or not started */}
        {!isPlaying && (
          <div className="snake-overlay">
            {isGameOver ? (
              <div className="snake-overlay-card">
                <span className="gameover-tag">SYSTEM COLLISION</span>
                <h3 className="gameover-title">Game Over!</h3>
                <p className="gameover-score">Final Score: <strong>{score}</strong></p>
                <button type="button" className="btn-arcade-action" onClick={startGame}>
                  <FaRotateRight /> Try Again
                </button>
              </div>
            ) : (
              <div className="snake-overlay-card">
                <span className="ready-tag">8-BIT CYBER PROTOCOL</span>
                <h3 className="ready-title">Retro Neon Snake</h3>
                <p className="ready-desc">Use arrow keys or WASD to navigate. Collect neon cores &amp; golden bonus modules!</p>
                <button type="button" className="btn-arcade-action" onClick={startGame}>
                  <FaPlay /> Start Game
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pause Overlay */}
        {isPlaying && isPaused && (
          <div className="snake-overlay">
            <div className="snake-overlay-card">
              <span className="ready-tag">GAME PAUSED</span>
              <button
                type="button"
                className="btn-arcade-action"
                onClick={() => setIsPaused(false)}
              >
                <FaPlay /> Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Mobile & Touch Virtual Directional Pad */}
      <div className="snake-virtual-controls">
        <button
          type="button"
          className="v-pad-btn v-up"
          onClick={() => changeDirection({ x: 0, y: -1 })}
          aria-label="Up"
        >
          <FaArrowUp />
        </button>
        <div className="v-pad-middle">
          <button
            type="button"
            className="v-pad-btn v-left"
            onClick={() => changeDirection({ x: -1, y: 0 })}
            aria-label="Left"
          >
            <FaArrowLeft />
          </button>
          {isPlaying && (
            <button
              type="button"
              className="v-pad-btn v-pause"
              onClick={() => setIsPaused((p) => !p)}
              aria-label="Pause"
            >
              {isPaused ? <FaPlay /> : <FaPause />}
            </button>
          )}
          <button
            type="button"
            className="v-pad-btn v-right"
            onClick={() => changeDirection({ x: 1, y: 0 })}
            aria-label="Right"
          >
            <FaArrowRight />
          </button>
        </div>
        <button
          type="button"
          className="v-pad-btn v-down"
          onClick={() => changeDirection({ x: 0, y: 1 })}
          aria-label="Down"
        >
          <FaArrowDown />
        </button>
      </div>
    </div>
  );
};

export default RetroSnakeGame;

