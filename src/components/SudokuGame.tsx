'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaPlay,
  FaRotateRight,
  FaEraser,
  FaRotateLeft,
  FaTrophy,
  FaLightbulb,
  FaKeyboard,
  FaCheck,
  FaPause,
} from 'react-icons/fa6';

export type SudokuDifficulty = 'easy' | 'medium' | 'hard';

// Verified Seed Boards (Complete valid solutions)
const SEED_SOLUTIONS: number[][][] = [
  [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ],
  [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 1, 5, 6, 4, 8, 9, 7],
    [5, 6, 4, 8, 9, 7, 2, 3, 1],
    [8, 9, 7, 2, 3, 1, 5, 6, 4],
    [3, 1, 2, 6, 4, 5, 9, 7, 8],
    [6, 4, 5, 9, 7, 8, 3, 1, 2],
    [9, 7, 8, 3, 1, 2, 6, 4, 5],
  ],
  [
    [8, 2, 7, 1, 5, 4, 3, 9, 6],
    [9, 6, 5, 3, 2, 7, 1, 4, 8],
    [3, 4, 1, 6, 8, 9, 7, 5, 2],
    [5, 9, 3, 4, 6, 8, 2, 7, 1],
    [4, 7, 2, 5, 1, 3, 6, 8, 9],
    [6, 1, 8, 9, 7, 2, 4, 3, 5],
    [7, 8, 6, 2, 3, 5, 9, 1, 4],
    [1, 5, 4, 7, 9, 6, 8, 2, 3],
    [2, 3, 9, 8, 4, 1, 5, 6, 7],
  ],
];

// Helper: Shuffle array
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate valid puzzle via isomorphic transformation
function generateSudokuPuzzle(diff: SudokuDifficulty): { initial: number[][]; solution: number[][] } {
  const baseSeed = SEED_SOLUTIONS[Math.floor(Math.random() * SEED_SOLUTIONS.length)];
  let board = baseSeed.map((row) => [...row]);

  // 1. Permute digits (1-9 map to random permutation)
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const perm = shuffle(digits);
  const map: Record<number, number> = {};
  for (let i = 0; i < 9; i++) {
    map[digits[i]] = perm[i];
  }
  board = board.map((row) => row.map((cell) => map[cell]));

  // 2. Randomly swap rows within bands
  for (let band = 0; band < 3; band++) {
    if (Math.random() > 0.5) {
      const r1 = band * 3 + Math.floor(Math.random() * 3);
      const r2 = band * 3 + Math.floor(Math.random() * 3);
      if (r1 !== r2) {
        [board[r1], board[r2]] = [board[r2], board[r1]];
      }
    }
  }

  // 3. Randomly swap cols within bands
  for (let band = 0; band < 3; band++) {
    if (Math.random() > 0.5) {
      const c1 = band * 3 + Math.floor(Math.random() * 3);
      const c2 = band * 3 + Math.floor(Math.random() * 3);
      if (c1 !== c2) {
        for (let r = 0; r < 9; r++) {
          const temp = board[r][c1];
          board[r][c1] = board[r][c2];
          board[r][c2] = temp;
        }
      }
    }
  }

  const solution = board.map((r) => [...r]);

  // 4. Determine clues to keep based on difficulty
  // Easy: ~38 clues (remove 43)
  // Medium: ~30 clues (remove 51)
  // Hard: ~24 clues (remove 57)
  const cluesToRemove = diff === 'easy' ? 42 : diff === 'medium' ? 49 : 55;

  const initial = board.map((r) => [...r]);
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = shuffle(positions);

  for (let i = 0; i < cluesToRemove; i++) {
    const [r, c] = shuffledPositions[i];
    initial[r][c] = 0;
  }

  return { initial, solution };
}

// Find all conflicts in a board
function findConflicts(board: number[][]): Set<string> {
  const conflicts = new Set<string>();

  // Rows & Columns
  for (let i = 0; i < 9; i++) {
    const rowMap: Record<number, number[]> = {};
    const colMap: Record<number, number[]> = {};

    for (let j = 0; j < 9; j++) {
      const rVal = board[i][j];
      if (rVal !== 0) {
        if (!rowMap[rVal]) rowMap[rVal] = [];
        rowMap[rVal].push(j);
      }

      const cVal = board[j][i];
      if (cVal !== 0) {
        if (!colMap[cVal]) colMap[cVal] = [];
        colMap[cVal].push(j);
      }
    }

    Object.values(rowMap).forEach((cols) => {
      if (cols.length > 1) {
        cols.forEach((c) => conflicts.add(`${i}-${c}`));
      }
    });

    Object.values(colMap).forEach((rows) => {
      if (rows.length > 1) {
        rows.forEach((r) => conflicts.add(`${r}-${i}`));
      }
    });
  }

  // 3x3 Boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxMap: Record<number, [number, number][]> = {};
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxRow * 3 + r;
          const col = boxCol * 3 + c;
          const val = board[row][col];
          if (val !== 0) {
            if (!boxMap[val]) boxMap[val] = [];
            boxMap[val].push([row, col]);
          }
        }
      }
      Object.values(boxMap).forEach((coords) => {
        if (coords.length > 1) {
          coords.forEach(([r, c]) => conflicts.add(`${r}-${c}`));
        }
      });
    }
  }

  return conflicts;
}

export const SudokuGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy');
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [solutionBoard, setSolutionBoard] = useState<number[][]>([]);
  const [currentBoard, setCurrentBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  // History for Undo & Redo
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Game stats
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [moveCount, setMoveCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Board container ref for keyboard focus
  const boardContainerRef = useRef<HTMLDivElement>(null);

  // Initialize or start new game
  const startNewGame = useCallback((diff: SudokuDifficulty = difficulty) => {
    const { initial, solution } = generateSudokuPuzzle(diff);
    setDifficulty(diff);
    setInitialBoard(initial.map((r) => [...r]));
    setSolutionBoard(solution.map((r) => [...r]));
    const initialClone = initial.map((r) => [...r]);
    setCurrentBoard(initialClone);
    setHistory([initialClone]);
    setHistoryIndex(0);
    setSelectedCell(null);
    setSeconds(0);
    setMoveCount(0);
    setIsRunning(true);
    setIsCompleted(false);
  }, [difficulty]);

  useEffect(() => {
    startNewGame('easy');
  }, [startNewGame]);

  // Timer interval
  useEffect(() => {
    if (!isRunning || isCompleted) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isCompleted]);

  // Restart current puzzle
  const handleRestart = () => {
    const reset = initialBoard.map((r) => [...r]);
    setCurrentBoard(reset);
    setHistory([reset]);
    setHistoryIndex(0);
    setSelectedCell(null);
    setMoveCount(0);
    setSeconds(0);
    setIsRunning(true);
    setIsCompleted(false);
  };

  // Format timer (mm:ss)
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check board completion
  const checkCompletion = useCallback(
    (board: number[][]) => {
      // 1. Must have zero empty cells
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === 0) return false;
        }
      }
      // 2. Must have zero conflicts
      const conflicts = findConflicts(board);
      if (conflicts.size > 0) return false;

      // 3. Must match solution or satisfy all Sudoku invariants
      return true;
    },
    []
  );

  // Set number in selected cell
  const handleInputNumber = useCallback(
    (num: number) => {
      if (!selectedCell || isCompleted) return;
      const [r, c] = selectedCell;

      // Cannot modify fixed clue cells
      if (initialBoard[r][c] !== 0) return;

      const currentVal = currentBoard[r][c];
      if (currentVal === num) return; // No change

      const newBoard = currentBoard.map((row, ri) =>
        row.map((val, ci) => (ri === r && ci === c ? num : val))
      );

      // Slice forward history on new move
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newBoard);

      setCurrentBoard(newBoard);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setMoveCount((prev) => prev + 1);

      if (checkCompletion(newBoard)) {
        setIsCompleted(true);
        setIsRunning(false);
      }
    },
    [selectedCell, isCompleted, initialBoard, currentBoard, history, historyIndex, checkCompletion]
  );

  // Erase selected cell
  const handleErase = useCallback(() => {
    if (!selectedCell || isCompleted) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;
    if (currentBoard[r][c] === 0) return;

    const newBoard = currentBoard.map((row, ri) =>
      row.map((val, ci) => (ri === r && ci === c ? 0 : val))
    );

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBoard);

    setCurrentBoard(newBoard);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setMoveCount((prev) => prev + 1);
  }, [selectedCell, isCompleted, initialBoard, currentBoard, history, historyIndex]);

  // Undo move
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCurrentBoard(history[prevIndex]);
      setMoveCount((prev) => prev + 1);
    }
  }, [historyIndex, history]);

  // Redo move
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentBoard(history[nextIndex]);
      setMoveCount((prev) => prev + 1);
    }
  }, [historyIndex, history]);

  // Keyboard navigation & number input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a form or input elsewhere
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleInputNumber(parseInt(e.key, 10));
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        handleErase();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Arrow navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (!prev) return [0, 0];
          const [r, c] = prev;
          if (e.key === 'ArrowUp') return [Math.max(0, r - 1), c];
          if (e.key === 'ArrowDown') return [Math.min(8, r + 1), c];
          if (e.key === 'ArrowLeft') return [r, Math.max(0, c - 1)];
          if (e.key === 'ArrowRight') return [r, Math.min(8, c + 1)];
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputNumber, handleErase, handleUndo, handleRedo]);

  if (currentBoard.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Loading Sudoku Matrix...
      </div>
    );
  }

  const conflicts = findConflicts(currentBoard);
  const selectedValue = selectedCell ? currentBoard[selectedCell[0]][selectedCell[1]] : 0;

  return (
    <div className="sudoku-container" ref={boardContainerRef} tabIndex={0}>
      {/* Top Header Controls Bar */}
      <div className="sudoku-hud-bar">
        {/* Difficulty Selector */}
        <div className="sudoku-diff-group">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`sudoku-diff-btn ${difficulty === d ? 'active' : ''}`}
              onClick={() => startNewGame(d)}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Stats: Timer & Moves */}
        <div className="sudoku-stats-group">
          <div className="sudoku-stat-badge" title="Elapsed Time">
            <span className="stat-label">TIME</span>
            <span className="stat-val">{formatTime(seconds)}</span>
          </div>
          <div className="sudoku-stat-badge" title="Total Moves">
            <span className="stat-label">MOVES</span>
            <span className="stat-val">{moveCount}</span>
          </div>
          {conflicts.size > 0 && (
            <div className="sudoku-conflict-badge" title="Duplicate number conflicts detected">
              {conflicts.size} CONFLICTS
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sudoku-actions-group">
          <button
            type="button"
            className="sudoku-btn-action"
            onClick={handleRestart}
            title="Restart current board"
          >
            <FaRotateRight size={13} />
            <span>Restart</span>
          </button>
          <button
            type="button"
            className="sudoku-btn-action primary"
            onClick={() => startNewGame(difficulty)}
            title="Generate a new puzzle"
          >
            <FaPlay size={11} />
            <span>New Game</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="sudoku-arena-layout">
        {/* 9x9 Board */}
        <div className="sudoku-board-wrapper">
          <div className="sudoku-grid" role="grid" aria-label="Sudoku 9x9 puzzle grid">
            {currentBoard.map((row, r) =>
              row.map((val, c) => {
                const isFixed = initialBoard[r][c] !== 0;
                const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                const isPeer =
                  selectedCell !== null &&
                  (selectedCell[0] === r ||
                    selectedCell[1] === c ||
                    (Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
                      Math.floor(selectedCell[1] / 3) === Math.floor(c / 3)));
                const isSameValue = selectedValue > 0 && val === selectedValue && !isSelected;
                const isConflicted = conflicts.has(`${r}-${c}`);

                // Box boundaries for thick grid styling
                const isRightBoxBorder = c === 2 || c === 5;
                const isBottomBoxBorder = r === 2 || r === 5;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`sudoku-cell ${isFixed ? 'fixed' : 'editable'} ${
                      isSelected ? 'selected' : ''
                    } ${isPeer ? 'peer' : ''} ${isSameValue ? 'same-val' : ''} ${
                      isConflicted ? 'conflict' : ''
                    } ${isRightBoxBorder ? 'box-border-right' : ''} ${
                      isBottomBoxBorder ? 'box-border-bottom' : ''
                    }`}
                    onClick={() => setSelectedCell([r, c])}
                    aria-label={`Row ${r + 1}, Column ${c + 1}: ${
                      val === 0 ? 'empty' : val
                    }${isFixed ? ' (fixed clue)' : ''}`}
                  >
                    {val !== 0 ? val : ''}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Side Controls & Number Keypad */}
        <div className="sudoku-keypad-panel">
          <div className="keypad-title">
            <span>INPUT CONTROLS</span>
            <span className="keypad-sub">1-9 OR KEYBOARD</span>
          </div>

          <div className="sudoku-keypad-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              // Count remaining of this number
              let count = 0;
              currentBoard.forEach((row) =>
                row.forEach((v) => {
                  if (v === n) count++;
                })
              );
              const isExhausted = count >= 9;

              return (
                <button
                  key={n}
                  type="button"
                  className={`sudoku-key-btn ${isExhausted ? 'exhausted' : ''}`}
                  onClick={() => handleInputNumber(n)}
                  disabled={isExhausted}
                >
                  <span className="key-num">{n}</span>
                  <span className="key-count">{9 - count} left</span>
                </button>
              );
            })}
          </div>

          <div className="sudoku-tool-buttons">
            <button
              type="button"
              className="sudoku-tool-btn"
              onClick={handleErase}
              title="Erase cell (Backspace/Delete)"
            >
              <FaEraser size={14} />
              <span>Erase</span>
            </button>
            <button
              type="button"
              className="sudoku-tool-btn"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo move (Ctrl+Z)"
            >
              <FaRotateLeft size={14} />
              <span>Undo</span>
            </button>
            <button
              type="button"
              className="sudoku-tool-btn"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo move (Ctrl+Y)"
            >
              <FaRotateRight size={14} />
              <span>Redo</span>
            </button>
          </div>

          {/* Quick Helper Tips */}
          <div className="sudoku-tips-box">
            <div className="tips-header" onClick={() => setShowInstructions(!showInstructions)}>
              <span className="d-flex align-items-center gap-2">
                <FaKeyboard size={13} style={{ color: '#00f2fe' }} />
                <strong>Desktop Keyboard Active</strong>
              </span>
              <button type="button" className="tips-toggle-btn">
                {showInstructions ? 'Hide Tips' : 'Rules'}
              </button>
            </div>
            {showInstructions && (
              <p className="tips-content">
                Use <strong>Arrow Keys</strong> to navigate the 9×9 grid, <strong>1-9</strong> to enter
                numbers, and <strong>Backspace/Del</strong> to erase. Every row, column, and 3×3 square
                must contain digits 1 through 9 with zero repeats!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal / Celebration Overlay */}
      {isCompleted && (
        <div className="sudoku-win-overlay">
          <div className="sudoku-win-modal">
            <div className="win-icon-ring">
              <FaTrophy size={36} color="#ffd700" />
            </div>
            <h3>Puzzle Solved!</h3>
            <p className="win-subtitle">
              Outstanding work! You completely mastered the {difficulty.toUpperCase()} Sudoku puzzle.
            </p>

            <div className="win-stats-grid">
              <div className="win-stat-card">
                <span className="label">TIME TAKEN</span>
                <strong className="val">{formatTime(seconds)}</strong>
              </div>
              <div className="win-stat-card">
                <span className="label">TOTAL MOVES</span>
                <strong className="val">{moveCount}</strong>
              </div>
              <div className="win-stat-card">
                <span className="label">DIFFICULTY</span>
                <strong className="val">{difficulty.toUpperCase()}</strong>
              </div>
            </div>

            <div className="win-actions">
              <button
                type="button"
                className="btn-play-again"
                onClick={() => startNewGame(difficulty)}
              >
                <FaPlay size={13} className="me-2" />
                Play Next Puzzle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SudokuGame;

