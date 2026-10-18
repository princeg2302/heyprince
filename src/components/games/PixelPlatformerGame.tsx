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
  FaArrowUp,
  FaCrown,
  FaGamepad,
} from 'react-icons/fa6';

// --- GAME CONSTANTS ---
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const TILE_SIZE = 24;
const GRAVITY = 0.52;
const MAX_FALL_SPEED = 9.5;
const ACCEL = 0.45;
const FRICTION = 0.82;
const MAX_RUN_SPEED = 3.8;
const JUMP_FORCE = -9.2;
const MIN_JUMP_FORCE = -4.5;

interface Block {
  id: number;
  x: number;
  y: number;
  type: 'ground' | 'brick' | 'question' | 'empty_question' | 'pipe' | 'pipe_top' | 'castle';
  hasMushroom?: boolean;
  bumping?: boolean;
  bumpOffsetY?: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  type: 'goomba' | 'beetle';
  squished: boolean;
  squishTimer: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

export const PixelPlatformerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI state
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isLevelCleared, setIsLevelCleared] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game World Refs
  const playerRef = useRef({
    x: 60,
    y: 200,
    vx: 0,
    vy: 0,
    width: 18,
    height: 24,
    isSuper: false,
    grounded: false,
    facing: 'right' as 'left' | 'right',
    invulnerable: 0,
    walkFrame: 0,
  });

  const cameraXRef = useRef(0);
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean; jumpHeld: boolean }>({
    left: false,
    right: false,
    jump: false,
    jumpHeld: false,
  });

  const blocksRef = useRef<Block[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const powerUpRef = useRef<PowerUp | null>(null);
  const flagYRef = useRef(0);
  const levelEndXRef = useRef(1900);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hp_platformer_highscore');
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Web Audio Synth
  const playSfx = useCallback(
    (type: 'jump' | 'coin' | 'stomp' | 'powerup' | 'damage' | 'clear' | 'bump') => {
      if (!soundEnabled) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'jump') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.14);
          osc.start(now);
          osc.stop(now + 0.14);
        } else if (type === 'coin') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
        } else if (type === 'stomp') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.16);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === 'powerup') {
          osc.type = 'triangle';
          const notes = [330, 392, 659, 523, 587, 784];
          notes.forEach((freq, idx) => {
            const time = now + idx * 0.06;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, time);
            g.gain.setValueAtTime(0.1, time);
            g.gain.linearRampToValueAtTime(0.001, time + 0.09);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(time);
            o.stop(time + 0.09);
          });
        } else if (type === 'bump') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === 'damage') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.linearRampToValueAtTime(70, now + 0.25);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'clear') {
          const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const time = now + idx * 0.08;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, time);
            g.gain.setValueAtTime(0.12, time);
            g.gain.linearRampToValueAtTime(0.001, time + 0.15);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(time);
            o.stop(time + 0.15);
          });
        }
      } catch {}
    },
    [soundEnabled]
  );

  // Spawn visual score text
  const addFloatingText = (x: number, y: number, text: string, color = '#fbbf24') => {
    floatingTextsRef.current.push({ x, y, text, color, life: 30 });
  };

  // Build Level Layout (3 Unique Levels)
  const buildLevel = useCallback((lvl: number) => {
    const blocks: Block[] = [];
    const coinsList: Coin[] = [];
    const enemiesList: Enemy[] = [];
    let blockId = 0;

    const groundY = CANVAS_HEIGHT - TILE_SIZE * 2;

    if (lvl === 1) {
      // LEVEL 1: Sunny Green Meadow (World 1-1)
      levelEndXRef.current = 1800;

      // Ground with a couple gaps
      for (let x = 0; x < 1850; x += TILE_SIZE) {
        if ((x >= 400 && x <= 460) || (x >= 960 && x <= 1040)) continue; // pits
        blocks.push({ id: blockId++, x, y: groundY, type: 'ground' });
        blocks.push({ id: blockId++, x, y: groundY + TILE_SIZE, type: 'ground' });
      }

      // Mystery & Brick cluster 1
      blocks.push({ id: blockId++, x: 200, y: groundY - TILE_SIZE * 3, type: 'question', hasMushroom: false });
      blocks.push({ id: blockId++, x: 224, y: groundY - TILE_SIZE * 3, type: 'brick' });
      blocks.push({ id: blockId++, x: 248, y: groundY - TILE_SIZE * 3, type: 'question', hasMushroom: true });
      blocks.push({ id: blockId++, x: 272, y: groundY - TILE_SIZE * 3, type: 'brick' });
      blocks.push({ id: blockId++, x: 296, y: groundY - TILE_SIZE * 3, type: 'question', hasMushroom: false });

      // Warp Pipes
      const addPipe = (px: number, heightTiles: number) => {
        const topY = groundY - heightTiles * TILE_SIZE;
        blocks.push({ id: blockId++, x: px, y: topY, type: 'pipe_top' });
        for (let h = 1; h < heightTiles; h++) {
          blocks.push({ id: blockId++, x: px, y: topY + h * TILE_SIZE, type: 'pipe' });
        }
      };

      addPipe(340, 2);
      addPipe(540, 3);
      addPipe(780, 4);
      addPipe(1120, 2);

      // Elevated brick staircase
      for (let step = 0; step < 4; step++) {
        for (let col = 0; col <= step; col++) {
          blocks.push({
            id: blockId++,
            x: 1300 + step * TILE_SIZE,
            y: groundY - (col + 1) * TILE_SIZE,
            type: 'brick',
          });
        }
      }

      // Flagpole and Castle
      blocks.push({ id: blockId++, x: 1600, y: groundY - TILE_SIZE * 7, type: 'castle' });

      // Floating Coins
      [150, 174, 380, 600, 624, 648, 850, 874, 1180, 1204, 1228].forEach((cx, idx) => {
        coinsList.push({ id: idx, x: cx, y: groundY - TILE_SIZE * 4, collected: false });
      });

      // Patrol Enemies
      enemiesList.push({
        id: 1,
        x: 280,
        y: groundY - 18,
        vx: -1,
        width: 18,
        height: 18,
        type: 'goomba',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 2,
        x: 620,
        y: groundY - 18,
        vx: -1.1,
        width: 18,
        height: 18,
        type: 'goomba',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 3,
        x: 880,
        y: groundY - 18,
        vx: -1.2,
        width: 18,
        height: 18,
        type: 'goomba',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
    } else if (lvl === 2) {
      // LEVEL 2: Neon Subterranean Caverns (World 1-2)
      levelEndXRef.current = 1900;

      // Cavern ground & ceiling
      for (let x = 0; x < 1950; x += TILE_SIZE) {
        if ((x >= 500 && x <= 620) || (x >= 1150 && x <= 1260)) continue; // cavern chasms
        blocks.push({ id: blockId++, x, y: groundY, type: 'ground' });
        blocks.push({ id: blockId++, x, y: groundY + TILE_SIZE, type: 'ground' });
        // Ceiling stalactite rocks
        if (x < 1650) {
          blocks.push({ id: blockId++, x, y: 0, type: 'brick' });
        }
      }

      // Floating stepping platforms across chasms
      blocks.push({ id: blockId++, x: 530, y: groundY - TILE_SIZE * 2, type: 'brick' });
      blocks.push({ id: blockId++, x: 580, y: groundY - TILE_SIZE * 3, type: 'brick' });

      blocks.push({ id: blockId++, x: 1180, y: groundY - TILE_SIZE * 2, type: 'brick' });
      blocks.push({ id: blockId++, x: 1220, y: groundY - TILE_SIZE * 3, type: 'question', hasMushroom: true });

      // Coin vaults in middle
      for (let i = 0; i < 5; i++) {
        blocks.push({ id: blockId++, x: 800 + i * TILE_SIZE, y: groundY - TILE_SIZE * 4, type: 'brick' });
        coinsList.push({ id: 10 + i, x: 800 + i * TILE_SIZE, y: groundY - TILE_SIZE * 5, collected: false });
      }

      // Exit Pipe to Surface
      blocks.push({ id: blockId++, x: 1720, y: groundY - TILE_SIZE * 4, type: 'pipe_top' });
      blocks.push({ id: blockId++, x: 1720, y: groundY - TILE_SIZE * 3, type: 'pipe' });
      blocks.push({ id: blockId++, x: 1720, y: groundY - TILE_SIZE * 2, type: 'pipe' });
      blocks.push({ id: blockId++, x: 1720, y: groundY - TILE_SIZE * 1, type: 'pipe' });

      // Castle
      blocks.push({ id: blockId++, x: 1800, y: groundY - TILE_SIZE * 7, type: 'castle' });

      // Cavern Beetles
      enemiesList.push({
        id: 11,
        x: 350,
        y: groundY - 18,
        vx: -1.3,
        width: 18,
        height: 18,
        type: 'beetle',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 12,
        x: 750,
        y: groundY - 18,
        vx: -1.4,
        width: 18,
        height: 18,
        type: 'beetle',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 13,
        x: 1050,
        y: groundY - 18,
        vx: -1.5,
        width: 18,
        height: 18,
        type: 'goomba',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 14,
        x: 1450,
        y: groundY - 18,
        vx: -1.3,
        width: 18,
        height: 18,
        type: 'beetle',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
    } else {
      // LEVEL 3: Fortress Citadel (World 1-3)
      levelEndXRef.current = 2000;

      for (let x = 0; x < 2050; x += TILE_SIZE) {
        if ((x >= 350 && x <= 450) || (x >= 800 && x <= 950) || (x >= 1350 && x <= 1500)) continue; // Lava pits
        blocks.push({ id: blockId++, x, y: groundY, type: 'ground' });
        blocks.push({ id: blockId++, x, y: groundY + TILE_SIZE, type: 'ground' });
      }

      // Fortress battlements & high floating blocks
      [380, 420, 840, 890, 930, 1390, 1450].forEach((bx, idx) => {
        blocks.push({
          id: blockId++,
          x: bx,
          y: groundY - TILE_SIZE * (idx % 2 === 0 ? 2 : 3),
          type: idx === 1 ? 'question' : 'brick',
          hasMushroom: idx === 1,
        });
      });

      // Trophy Keep at end
      blocks.push({ id: blockId++, x: 1880, y: groundY - TILE_SIZE * 7, type: 'castle' });

      // Guard minions
      enemiesList.push({
        id: 21,
        x: 250,
        y: groundY - 18,
        vx: -1.5,
        width: 18,
        height: 18,
        type: 'beetle',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 22,
        x: 650,
        y: groundY - 18,
        vx: -1.6,
        width: 18,
        height: 18,
        type: 'beetle',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 23,
        x: 1100,
        y: groundY - 18,
        vx: -1.8,
        width: 18,
        height: 18,
        type: 'beetle',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
      enemiesList.push({
        id: 24,
        x: 1650,
        y: groundY - 18,
        vx: -1.7,
        width: 18,
        height: 18,
        type: 'goomba',
        squished: false,
        squishTimer: 0,
        alive: true,
      });
    }

    blocksRef.current = blocks;
    coinsRef.current = coinsList;
    enemiesRef.current = enemiesList;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    powerUpRef.current = null;
    flagYRef.current = groundY - TILE_SIZE * 6;
  }, []);

  // Reset player to spawn
  const resetPlayer = (keepSuper = false) => {
    playerRef.current = {
      x: 60,
      y: CANVAS_HEIGHT - TILE_SIZE * 2 - 28,
      vx: 0,
      vy: 0,
      width: 18,
      height: keepSuper ? 28 : 22,
      isSuper: keepSuper,
      grounded: false,
      facing: 'right',
      invulnerable: 40,
      walkFrame: 0,
    };
    cameraXRef.current = 0;
  };

  // Start new game
  const startGame = () => {
    setScore(0);
    setCoins(0);
    setLives(3);
    setLevel(1);
    setIsGameOver(false);
    setIsWon(false);
    setIsLevelCleared(false);
    setIsPaused(false);
    setIsPlaying(true);
    buildLevel(1);
    resetPlayer(false);
    playSfx('powerup');
  };

  // Advance level
  const advanceLevel = () => {
    if (level < 3) {
      const nextLvl = level + 1;
      setLevel(nextLvl);
      setIsLevelCleared(false);
      buildLevel(nextLvl);
      resetPlayer(playerRef.current.isSuper);
      playSfx('powerup');
    } else {
      setIsWon(true);
      setIsPlaying(false);
      playSfx('clear');
    }
  };

  // Main 60fps Loop
  useEffect(() => {
    if (!isPlaying || isGameOver || isPaused || isLevelCleared || isWon) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateAndRender = () => {
      const player = playerRef.current;
      const keys = keysRef.current;
      const blocks = blocksRef.current;
      const groundFloorY = CANVAS_HEIGHT - TILE_SIZE * 2;

      // 1. Horizontal Acceleration
      if (keys.left) {
        player.vx = Math.max(player.vx - ACCEL, -MAX_RUN_SPEED);
        player.facing = 'left';
        player.walkFrame++;
      } else if (keys.right) {
        player.vx = Math.min(player.vx + ACCEL, MAX_RUN_SPEED);
        player.facing = 'right';
        player.walkFrame++;
      } else {
        player.vx *= FRICTION;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
      }

      // 2. Jump Handling
      if (keys.jump && player.grounded) {
        player.vy = JUMP_FORCE;
        player.grounded = false;
        keys.jump = false;
        playSfx('jump');
      }

      // Variable jump height
      if (!keys.jumpHeld && player.vy < MIN_JUMP_FORCE) {
        player.vy = MIN_JUMP_FORCE;
      }

      // Gravity
      player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);

      // Invulnerability tick
      if (player.invulnerable > 0) player.invulnerable--;

      // 3. Collision Detection (AABB)
      // Horizontal move & test
      player.x += player.vx;
      blocks.forEach((b) => {
        if (
          player.x < b.x + TILE_SIZE &&
          player.x + player.width > b.x &&
          player.y < b.y + TILE_SIZE &&
          player.y + player.height > b.y
        ) {
          if (player.vx > 0) {
            player.x = b.x - player.width;
            player.vx = 0;
          } else if (player.vx < 0) {
            player.x = b.x + TILE_SIZE;
            player.vx = 0;
          }
        }
      });

      // Vertical move & test
      player.y += player.vy;
      player.grounded = false;

      blocks.forEach((b) => {
        if (
          player.x < b.x + TILE_SIZE &&
          player.x + player.width > b.x &&
          player.y < b.y + TILE_SIZE &&
          player.y + player.height > b.y
        ) {
          if (player.vy > 0) {
            // Landing on top of block
            player.y = b.y - player.height;
            player.vy = 0;
            player.grounded = true;
          } else if (player.vy < 0) {
            // Hitting block from underneath
            player.y = b.y + TILE_SIZE;
            player.vy = 0;

            // Bump block reaction
            if (b.type === 'question' || b.type === 'brick') {
              playSfx('bump');
              b.bumping = true;
              b.bumpOffsetY = -6;

              if (b.type === 'question') {
                b.type = 'empty_question';
                if (b.hasMushroom && !player.isSuper) {
                  // Spawn PowerUp Mushroom
                  powerUpRef.current = {
                    x: b.x,
                    y: b.y - 20,
                    vx: 1.5,
                    vy: -2,
                    active: true,
                  };
                  playSfx('powerup');
                } else {
                  // Spawn bouncing Coin
                  setScore((s) => s + 200);
                  setCoins((c) => c + 1);
                  addFloatingText(b.x, b.y - 10, '+200');
                  playSfx('coin');
                }
              }
            }
          }
        }
      });

      // Easing for bumping blocks
      blocks.forEach((b) => {
        if (b.bumping && b.bumpOffsetY !== undefined) {
          b.bumpOffsetY += 1.2;
          if (b.bumpOffsetY >= 0) {
            b.bumpOffsetY = 0;
            b.bumping = false;
          }
        }
      });

      // Fall off bottom pit check
      if (player.y > CANVAS_HEIGHT + 30) {
        playSfx('damage');
        setLives((l) => {
          const next = l - 1;
          if (next <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
            return 0;
          } else {
            resetPlayer(false);
            return next;
          }
        });
      }

      // 4. Power-Up Mushroom Movement & Collision
      const pu = powerUpRef.current;
      if (pu && pu.active) {
        pu.vy = Math.min(pu.vy + GRAVITY, MAX_FALL_SPEED);
        pu.x += pu.vx;
        pu.y += pu.vy;

        // Ground collision for powerup
        blocks.forEach((b) => {
          if (pu.x < b.x + TILE_SIZE && pu.x + 16 > b.x && pu.y < b.y + TILE_SIZE && pu.y + 16 > b.y) {
            if (pu.vy > 0) {
              pu.y = b.y - 16;
              pu.vy = 0;
            } else if (pu.vx !== 0) {
              pu.vx = -pu.vx; // bounce off walls
            }
          }
        });

        // Player touches mushroom
        if (
          player.x < pu.x + 16 &&
          player.x + player.width > pu.x &&
          player.y < pu.y + 16 &&
          player.y + player.height > pu.y
        ) {
          pu.active = false;
          player.isSuper = true;
          player.height = 28;
          setScore((s) => s + 1000);
          addFloatingText(player.x, player.y - 15, 'SUPER! +1000', '#22c55e');
          playSfx('powerup');
        }
      }

      // 5. Coin Collection
      coinsRef.current.forEach((coin) => {
        if (
          !coin.collected &&
          player.x < coin.x + 16 &&
          player.x + player.width > coin.x &&
          player.y < coin.y + 16 &&
          player.y + player.height > coin.y
        ) {
          coin.collected = true;
          setScore((s) => {
            const next = s + 100;
            if (next > highScore) {
              setHighScore(next);
              try {
                localStorage.setItem('hp_platformer_highscore', next.toString());
              } catch {}
            }
            return next;
          });
          setCoins((c) => c + 1);
          addFloatingText(coin.x, coin.y - 10, '+100', '#fbbf24');
          playSfx('coin');
        }
      });

      // 6. Enemies Movement & Collision
      enemiesRef.current.forEach((enemy) => {
        if (!enemy.alive) return;

        if (enemy.squished) {
          enemy.squishTimer++;
          if (enemy.squishTimer > 25) enemy.alive = false;
          return;
        }

        // Patrol walk
        enemy.x += enemy.vx;

        // Wall & edge collision for enemy
        blocks.forEach((b) => {
          if (
            enemy.x < b.x + TILE_SIZE &&
            enemy.x + enemy.width > b.x &&
            enemy.y < b.y + TILE_SIZE &&
            enemy.y + enemy.height > b.y
          ) {
            enemy.vx = -enemy.vx; // turn around
          }
        });

        // Collision with Player
        if (
          player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y
        ) {
          // Player jumping downward onto enemy head = STOMP!
          if (player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 6) {
            enemy.squished = true;
            player.vy = -6.8; // bounce upward!
            setScore((s) => s + 200);
            addFloatingText(enemy.x, enemy.y - 10, '+200', '#ef4444');
            playSfx('stomp');
          } else if (player.invulnerable <= 0) {
            // Player takes damage from side
            if (player.isSuper) {
              // Shrink back to normal
              player.isSuper = false;
              player.height = 22;
              player.invulnerable = 60;
              playSfx('damage');
            } else {
              // Lose life
              playSfx('damage');
              setLives((l) => {
                const next = l - 1;
                if (next <= 0) {
                  setIsGameOver(true);
                  setIsPlaying(false);
                  return 0;
                } else {
                  resetPlayer(false);
                  return next;
                }
              });
            }
          }
        }
      });

      // 7. Check Level End / Flagpole
      if (player.x >= levelEndXRef.current - 100) {
        setIsLevelCleared(true);
        setScore((s) => s + 2000);
        playSfx('clear');
        return;
      }

      // 8. Camera Tracking (Smooth horizontal follow)
      const targetCamX = Math.max(0, player.x - CANVAS_WIDTH * 0.35);
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;

      // ==========================================
      // RENDERING SECTION
      // ==========================================
      const camX = cameraXRef.current;

      // 1. Sky Background
      if (level === 1) {
        ctx.fillStyle = '#5c94fc'; // Classic NES sky blue
      } else if (level === 2) {
        ctx.fillStyle = '#060a14'; // Underground cavern black/cyan
      } else {
        ctx.fillStyle = '#260a0e'; // Volcanic castle red/dark
      }
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Clouds & Hills (Parallax for Level 1)
      if (level === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 8; i++) {
          const cx = ((i * 260 - camX * 0.25) % (CANVAS_WIDTH + 150)) - 50;
          ctx.beginPath();
          ctx.arc(cx, 55, 18, 0, Math.PI * 2);
          ctx.arc(cx + 18, 50, 24, 0, Math.PI * 2);
          ctx.arc(cx + 36, 55, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        // Green Rolling Hills
        ctx.fillStyle = '#00a800';
        for (let i = 0; i < 6; i++) {
          const hx = ((i * 380 - camX * 0.4) % (CANVAS_WIDTH + 200)) - 100;
          ctx.beginPath();
          ctx.arc(hx, groundFloorY + 30, 90, Math.PI, 0);
          ctx.fill();
        }
      }

      // 2. Draw Blocks & Scenery
      blocks.forEach((b) => {
        const drawX = b.x - camX;
        if (drawX < -TILE_SIZE || drawX > CANVAS_WIDTH) return; // culling

        const offsetY = b.bumpOffsetY || 0;
        const drawY = b.y + offsetY;

        ctx.save();
        if (b.type === 'ground') {
          if (level === 1) {
            // Grass top
            ctx.fillStyle = '#00a800';
            ctx.fillRect(drawX, drawY, TILE_SIZE, 4);
            ctx.fillStyle = '#d89b00';
            ctx.fillRect(drawX, drawY + 4, TILE_SIZE, TILE_SIZE - 4);
          } else if (level === 2) {
            // Cyan cavern brick
            ctx.fillStyle = '#008088';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#004044';
            ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          } else {
            // Fortress dark brick
            ctx.fillStyle = '#802020';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#401010';
            ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          }
        } else if (b.type === 'brick') {
          ctx.fillStyle = level === 2 ? '#007077' : '#b84418';
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#000000';
          // Brick mortar lines
          ctx.fillRect(drawX, drawY + 11, TILE_SIZE, 2);
          ctx.fillRect(drawX + 11, drawY, 2, 11);
          ctx.fillRect(drawX + 6, drawY + 13, 2, 11);
        } else if (b.type === 'question') {
          ctx.fillStyle = '#fcb040';
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#804000';
          ctx.strokeRect(drawX + 1, drawY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.font = 'bold 15px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('?', drawX + 7, drawY + 17);
        } else if (b.type === 'empty_question') {
          ctx.fillStyle = '#8c5b3e';
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          ctx.strokeRect(drawX + 1, drawY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        } else if (b.type === 'pipe_top') {
          ctx.fillStyle = '#00a800';
          ctx.fillRect(drawX - 2, drawY, TILE_SIZE + 4, TILE_SIZE);
          ctx.fillStyle = '#80d010';
          ctx.fillRect(drawX, drawY + 2, 4, TILE_SIZE - 4);
          ctx.strokeStyle = '#004800';
          ctx.strokeRect(drawX - 2, drawY, TILE_SIZE + 4, TILE_SIZE);
        } else if (b.type === 'pipe') {
          ctx.fillStyle = '#00a800';
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#80d010';
          ctx.fillRect(drawX + 2, drawY, 4, TILE_SIZE);
          ctx.strokeStyle = '#004800';
          ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
        } else if (b.type === 'castle') {
          // Castle Keep Flagpole
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 8, drawY, 4, TILE_SIZE * 6);
          // Green flag
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(drawX + 12, drawY + 8);
          ctx.lineTo(drawX + 36, drawY + 18);
          ctx.lineTo(drawX + 12, drawY + 28);
          ctx.fill();

          // Castle body
          ctx.fillStyle = '#a83424';
          ctx.fillRect(drawX + 50, drawY + TILE_SIZE * 2, 70, TILE_SIZE * 4);
          ctx.fillStyle = '#000000';
          ctx.fillRect(drawX + 74, drawY + TILE_SIZE * 4, 22, TILE_SIZE * 2); // doorway
        }
        ctx.restore();
      });

      // 3. Draw Coins
      coinsRef.current.forEach((coin) => {
        if (coin.collected) return;
        const cx = coin.x - camX;
        if (cx < -20 || cx > CANVAS_WIDTH + 20) return;

        ctx.save();
        ctx.fillStyle = '#fcb040';
        ctx.beginPath();
        ctx.ellipse(cx + 8, coin.y + 8, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx + 6, coin.y + 4, 3, 8);
        ctx.restore();
      });

      // 4. Draw PowerUp Mushroom
      if (pu && pu.active) {
        const px = pu.x - camX;
        ctx.save();
        // Red cap with white dots
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px + 8, pu.y + 6, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 6, pu.y + 1, 4, 4);
        // Stem
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 4, pu.y + 6, 8, 8);
        ctx.restore();
      }

      // 5. Draw Enemies
      enemiesRef.current.forEach((enemy) => {
        if (!enemy.alive) return;
        const ex = enemy.x - camX;
        if (ex < -30 || ex > CANVAS_WIDTH + 30) return;

        ctx.save();
        if (enemy.squished) {
          ctx.fillStyle = '#804000';
          ctx.fillRect(ex, enemy.y + 10, enemy.width, 8);
        } else {
          if (enemy.type === 'goomba') {
            ctx.fillStyle = '#804000';
            // Head
            ctx.beginPath();
            ctx.arc(ex + 9, enemy.y + 6, 9, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(ex + 2, enemy.y + 6, 14, 8);
            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ex + 4, enemy.y + 4, 3, 5);
            ctx.fillRect(ex + 11, enemy.y + 4, 3, 5);
            ctx.fillStyle = '#000000';
            ctx.fillRect(ex + 5, enemy.y + 6, 2, 3);
            ctx.fillRect(ex + 11, enemy.y + 6, 2, 3);
          } else {
            // Beetle / Turtle
            ctx.fillStyle = '#00a840';
            ctx.beginPath();
            ctx.arc(ex + 9, enemy.y + 8, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(ex + 4, enemy.y + 5, 10, 4);
          }
        }
        ctx.restore();
      });

      // 6. Draw Player (Original Retro Pixel Hero)
      const px = player.x - camX;
      ctx.save();
      if (player.invulnerable % 4 < 2) {
        const isSuper = player.isSuper;
        const heroHeight = player.height;

        // Cap / Hat (Red)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + (player.facing === 'right' ? 3 : 1), player.y, 14, 6);
        ctx.fillRect(px + (player.facing === 'right' ? 5 : 0), player.y + 4, 16, 3);

        // Face / Skin
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + 4, player.y + 7, 10, 7);

        // Eyes & Hair
        ctx.fillStyle = '#1e1b4b';
        const eyeX = player.facing === 'right' ? px + 10 : px + 5;
        ctx.fillRect(eyeX, player.y + 8, 3, 3);
        ctx.fillRect(px + (player.facing === 'right' ? 2 : 11), player.y + 7, 4, 5);

        // Dungarees / Jumpsuit (Royal Blue)
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(px + 3, player.y + 14, 12, isSuper ? 10 : 6);

        // Shoes (Brown)
        ctx.fillStyle = '#78350f';
        const walkOffset = Math.sin(player.walkFrame * 0.3) * 3;
        ctx.fillRect(px + 2, player.y + heroHeight - 4, 6, 4 + (player.grounded ? walkOffset : 0));
        ctx.fillRect(px + 10, player.y + heroHeight - 4, 6, 4 - (player.grounded ? walkOffset : 0));
      }
      ctx.restore();

      // 7. Draw Floating Points Text
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 0.8;
        ft.life--;
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x - camX, ft.y);
        ctx.restore();
        if (ft.life <= 0) floatingTextsRef.current.splice(i, 1);
      }

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);
    animationFrameRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGameOver, isPaused, isLevelCleared, isWon, level, highScore, playSfx]);

  // Keyboard Event Listeners (Prevents Page Scroll)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = true;
        keysRef.current.jumpHeld = true;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (isPlaying) setIsPaused((p) => !p);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = false;
        keysRef.current.jumpHeld = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  return (
    <div className="platformer-game-container">
      {/* Retro Arcade HUD Bar */}
      <div className="game-hud-bar platformer-hud">
        <div className="hud-metric">
          <span className="metric-label">SCORE</span>
          <span className="metric-val score-neon">{score}</span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">COINS</span>
          <span className="metric-val coins-neon">🪙 × {coins}</span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">WORLD</span>
          <span className="metric-val level-neon">1 - {level}</span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">LIVES</span>
          <span className="metric-val lives-neon">
            {Array.from({ length: 3 }).map((_, i) => (
              <FaHeart key={i} className={`life-heart ${i < lives ? 'active' : 'depleted'}`} />
            ))}
          </span>
        </div>
        <div className="hud-metric">
          <span className="metric-label">TOP SCORE</span>
          <span className="metric-val trophy-neon">
            <FaTrophy /> {highScore}
          </span>
        </div>
        <div className="hud-actions">
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

      {/* 2D Canvas Retro Viewport */}
      <div className="game-canvas-wrap platformer-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="retro-game-canvas platformer-canvas"
          onClick={() => {
            if (!isPlaying) startGame();
          }}
        />

        {/* Start Game Screen Overlay */}
        {!isPlaying && !isGameOver && !isWon && (
          <div className="game-start-overlay">
            <div className="overlay-badge">8-BIT SIDE-SCROLLING PLATFORMER</div>
            <h3 className="overlay-title">Super Pixel Adventure</h3>
            <p className="overlay-instructions">
              Stomp walking minions, bounce off mystery blocks, collect golden coins, grab mushrooms to grow, and sprint to the Castle Flagpole!
            </p>
            <div className="instructions-tags">
              <span>⌨️ A / D or Arrow Keys to Run</span>
              <span>⚡ Space / Up to Jump</span>
              <span>📱 Virtual Touch Controls on Mobile</span>
            </div>
            <button
              type="button"
              className="game-action-btn start-btn platformer-play-btn"
              onClick={startGame}
            >
              <FaPlay /> PLAY LEVEL 1 NOW
            </button>
          </div>
        )}

        {/* Level Cleared Overlay */}
        {isLevelCleared && (
          <div className="game-start-overlay">
            <div className="overlay-badge" style={{ color: '#22c55e', borderColor: '#22c55e' }}>
              FLAGPOLE REACHED!
            </div>
            <h3 className="overlay-title">World 1 - {level} Cleared!</h3>
            <p className="overlay-instructions">
              Bravo! Stage clear bonus +2000 points added. Prepare for the next challenging territory!
            </p>
            <button
              type="button"
              className="game-action-btn start-btn platformer-next-btn"
              onClick={advanceLevel}
            >
              <FaPlay /> ADVANCE TO WORLD 1 - {level + 1}
            </button>
          </div>
        )}

        {/* Game Won Celebration Overlay */}
        {isWon && (
          <div className="game-start-overlay">
            <div className="overlay-badge" style={{ color: '#fbbf24', borderColor: '#fbbf24' }}>
              <FaCrown /> CONGRATULATIONS!
            </div>
            <h3 className="overlay-title">Castle Fortress Conquered!</h3>
            <p className="overlay-instructions">
              You defeated all 3 worlds of the 8-Bit Cyber Kingdom! Final Score: <strong>{score}</strong>
            </p>
            <button
              type="button"
              className="game-action-btn start-btn"
              onClick={startGame}
            >
              <FaRotateRight /> PLAY FROM START
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="game-gameover-overlay">
            <div className="gameover-title">HERO DEFEATED</div>
            <p className="gameover-desc">
              All 3 lives lost. Final Score: <strong>{score}</strong>
            </p>
            <button
              type="button"
              className="game-action-btn restart-btn"
              onClick={startGame}
            >
              <FaRotateRight /> TRY AGAIN
            </button>
          </div>
        )}

        {/* Paused Screen */}
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

      {/* Control Actions & Mobile Touch Controls */}
      <div className="platformer-controls-tray">
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

        {/* Mobile On-Screen Direction & Jump Buttons */}
        <div className="platformer-mobile-pad">
          <button
            type="button"
            className="mobile-pad-btn"
            onTouchStart={() => {
              keysRef.current.left = true;
            }}
            onTouchEnd={() => {
              keysRef.current.left = false;
            }}
            onMouseDown={() => {
              keysRef.current.left = true;
            }}
            onMouseUp={() => {
              keysRef.current.left = false;
            }}
            aria-label="Run Left"
          >
            <FaArrowLeft />
          </button>
          <button
            type="button"
            className="mobile-pad-btn"
            onTouchStart={() => {
              keysRef.current.right = true;
            }}
            onTouchEnd={() => {
              keysRef.current.right = false;
            }}
            onMouseDown={() => {
              keysRef.current.right = true;
            }}
            onMouseUp={() => {
              keysRef.current.right = false;
            }}
            aria-label="Run Right"
          >
            <FaArrowRight />
          </button>
          <button
            type="button"
            className="mobile-pad-btn action-jump-btn"
            onTouchStart={() => {
              keysRef.current.jump = true;
              keysRef.current.jumpHeld = true;
            }}
            onTouchEnd={() => {
              keysRef.current.jump = false;
              keysRef.current.jumpHeld = false;
            }}
            onMouseDown={() => {
              keysRef.current.jump = true;
              keysRef.current.jumpHeld = true;
            }}
            onMouseUp={() => {
              keysRef.current.jump = false;
              keysRef.current.jumpHeld = false;
            }}
            aria-label="Jump"
          >
            <FaArrowUp /> <span>JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixelPlatformerGame;

