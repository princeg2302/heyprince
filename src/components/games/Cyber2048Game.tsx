'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaRotateRight,
  FaVolumeHigh,
  FaVolumeXmark,
  FaTrophy,
  FaArrowRotateLeft,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaCrown,
} from 'react-icons/fa6';

type Board = number[][];

export const Cyber2048Game: React.FC = () => {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [prevBoard, setPrevBoard] = useState<Board | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hp_2048_highscore');
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Web Audio Synth
  const playSfx = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'sine') => {
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
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}
    },
    [soundEnabled]
  );

  // Add random tile (2 or 4) to empty spot
  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const val = Math.random() < 0.9 ? 2 : 4;
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[randomCell.r][randomCell.c] = val;
    return newBoard;
  };

  // Start new game
  const initGame = useCallback(() => {
    let b: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setPrevBoard(null);
    setPrevScore(null);
    setGameOver(false);
    setHasWon(false);
    playSfx(520, 0.12, 'triangle');
  }, [playSfx]);

  // Initial startup
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check if moves are possible
  const checkGameOver = (b: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Slide & Merge Row Left
  const slideRow = (row: number[], onMergeScore: (pts: number) => void): number[] => {
    // 1. Filter out zeroes
    const filtered = row.filter((val) => val !== 0);
    const newRow: number[] = [];

    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        newRow.push(mergedVal);
        onMergeScore(mergedVal);
        i += 2;
      } else {
        newRow.push(filtered[i]);
        i++;
      }
    }

    // Fill remaining with 0
    while (newRow.length < 4) {
      newRow.push(0);
    }
    return newRow;
  };

  // Move Board in Direction
  const move = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;

      let moved = false;
      let pointsEarned = 0;
      const boardCopy = board.map((r) => [...r]);

      const onMerge = (pts: number) => {
        pointsEarned += pts;
        if (pts === 2048) {
          setHasWon(true);
        }
      };

      if (direction === 'left') {
        for (let r = 0; r < 4; r++) {
          const original = [...boardCopy[r]];
          boardCopy[r] = slideRow(boardCopy[r], onMerge);
          if (original.some((v, idx) => v !== boardCopy[r][idx])) moved = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < 4; r++) {
          const original = [...boardCopy[r]];
          const reversed = [...boardCopy[r]].reverse();
          const slided = slideRow(reversed, onMerge).reverse();
          boardCopy[r] = slided;
          if (original.some((v, idx) => v !== boardCopy[r][idx])) moved = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < 4; c++) {
          const col = [boardCopy[0][c], boardCopy[1][c], boardCopy[2][c], boardCopy[3][c]];
          const slided = slideRow(col, onMerge);
          for (let r = 0; r < 4; r++) {
            if (boardCopy[r][c] !== slided[r]) moved = true;
            boardCopy[r][c] = slided[r];
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < 4; c++) {
          const col = [
            boardCopy[3][c],
            boardCopy[2][c],
            boardCopy[1][c],
            boardCopy[0][c],
          ];
          const slided = slideRow(col, onMerge).reverse();
          for (let r = 0; r < 4; r++) {
            if (boardCopy[r][c] !== slided[r]) moved = true;
            boardCopy[r][c] = slided[r];
          }
        }
      }

      if (moved) {
        setPrevBoard(board);
        setPrevScore(score);

        const newBoard = addRandomTile(boardCopy);
        setBoard(newBoard);

        const newScore = score + pointsEarned;
        setScore(newScore);

        if (newScore > highScore) {
          setHighScore(newScore);
          try {
            localStorage.setItem('hp_2048_highscore', newScore.toString());
          } catch {}
        }

        if (pointsEarned > 0) {
          playSfx(440 + Math.min(pointsEarned * 4, 600), 0.1, 'triangle');
        } else {
          playSfx(280, 0.04, 'sine');
        }

        if (checkGameOver(newBoard)) {
          setGameOver(true);
          playSfx(160, 0.3, 'sawtooth');
        }
      }
    },
    [board, gameOver, highScore, playSfx, score]
  );

  // Undo Move
  const undoMove = () => {
    if (prevBoard && prevScore !== null) {
      setBoard(prevBoard);
      setScore(prevScore);
      setPrevBoard(null);
      setPrevScore(null);
      setGameOver(false);
      playSfx(360, 0.08, 'sine');
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('left');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('right');
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('up');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('down');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 30;

    if (Math.max(absDx, absDy) > threshold) {
      if (absDx > absDy) {
        if (dx > 0) move('right');
        else move('left');
      } else {
        if (dy > 0) move('down');
        else move('up');
      }
    }
  };

  // Tile styles according to value
  const getTileClass = (val: number): string => {
    if (val === 0) return 'tile-empty';
    if (val <= 2048) return `tile-${val}`;
    return 'tile-super';
  };

  return (
    <div className="cyber-2048-container">
      {/* HUD Header */}
      <div className="game-hud-bar">
        <div className="hud-metric">
          <span className="metric-label">SCORE</span>
          <span className="metric-val score-neon">{score}</span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">BEST</span>
          <span className="metric-val trophy-neon">
            <FaTrophy /> {highScore}
          </span>
        </div>
        <div className="hud-actions">
          {prevBoard && (
            <button
              type="button"
              className="hud-action-btn"
              onClick={undoMove}
              title="Undo last move"
            >
              <FaArrowRotateLeft /> <span>Undo</span>
            </button>
          )}
          <button
            type="button"
            className="hud-btn-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <FaVolumeHigh /> : <FaVolumeXmark />}
          </button>
        </div>
      </div>

      {/* 2048 Grid Board */}
      <div
        className="cyber-2048-board"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {board.map((row, r) => (
          <div key={r} className="board-row">
            {row.map((cell, c) => (
              <div key={`${r}-${c}`} className={`board-cell ${getTileClass(cell)}`}>
                {cell > 0 && <span className="cell-number">{cell}</span>}
              </div>
            ))}
          </div>
        ))}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="game-gameover-overlay">
            <div className="gameover-title">NO MOVES REMAINING</div>
            <p className="gameover-desc">
              Final Matrix Score: <strong>{score}</strong>
            </p>
            <button type="button" className="game-action-btn restart-btn" onClick={initGame}>
              <FaRotateRight /> TRY AGAIN
            </button>
          </div>
        )}

        {/* Win Notification */}
        {hasWon && (
          <div className="game-win-banner">
            <FaCrown className="crown-icon" /> 2048 TILE REACHED! CONTINUE FOR HIGH SCORE!
          </div>
        )}
      </div>

      {/* On-Screen D-Pad / Nav for Touch & Quick Controls */}
      <div className="cyber-2048-controls">
        <div className="dpad-cross">
          <button
            type="button"
            className="dpad-btn btn-up"
            onClick={() => move('up')}
            aria-label="Move Up"
          >
            <FaArrowUp />
          </button>
          <div className="dpad-mid-row">
            <button
              type="button"
              className="dpad-btn btn-left"
              onClick={() => move('left')}
              aria-label="Move Left"
            >
              <FaArrowLeft />
            </button>
            <button
              type="button"
              className="dpad-btn btn-center"
              onClick={initGame}
              aria-label="Restart"
              title="New Game"
            >
              <FaRotateRight />
            </button>
            <button
              type="button"
              className="dpad-btn btn-right"
              onClick={() => move('right')}
              aria-label="Move Right"
            >
              <FaArrowRight />
            </button>
          </div>
          <button
            type="button"
            className="dpad-btn btn-down"
            onClick={() => move('down')}
            aria-label="Move Down"
          >
            <FaArrowDown />
          </button>
        </div>

        <div className="controls-hints">
          <span>⌨️ Arrow Keys or WASD</span>
          <span>👆 Swipe on Grid to Merge</span>
          <span>🎯 Target: 2048</span>
        </div>
      </div>
    </div>
  );
};

