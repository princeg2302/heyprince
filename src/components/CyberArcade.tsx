import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaPlay,
  FaRotateRight,
  FaVolumeHigh,
  FaVolumeXmark,
  FaTrophy,
  FaBolt,
  FaBug,
  FaTerminal,
  FaAtom,
  FaGamepad,
  FaArrowRight,
  FaCircleCheck,
} from 'react-icons/fa6';

// --- TYPES FOR BUG SMASHER ---
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
  // Navigation between the 3 interactive exploration zones
  const [activeTab, setActiveTab] = useState<'arcade' | 'gravity' | 'terminal'>('arcade');

  // Sound system
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(
    (type: 'zap' | 'powerup' | 'gameover' | 'start' | 'click' | 'supernova') => {
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
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'powerup') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
          gain.gain.setValueAtTime(0.25, now);
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
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.04);
        } else if (type === 'supernova') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        }
      } catch {
        // Audio fallback
      }
    },
    [soundEnabled]
  );

  // ==========================================
  // 1. BUG CRUSHER SPRINT STATE & LOGIC
  // ==========================================
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [bugsSquashed, setBugsSquashed] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('heyprince_arcade_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
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

    const padding = 50;
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

  const startBugGame = () => {
    setGameState('playing');
    setScore(0);
    setCombo(1);
    setTimeLeft(30);
    setBugsSquashed(0);
    targetsRef.current = [];
    particlesRef.current = [];
    floatingScoresRef.current = [];
    playSound('start');

    for (let i = 0; i < 6; i++) {
      spawnTarget();
    }
  };

  const handleHitTarget = (targetId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'playing') return;

    const index = targetsRef.current.findIndex((t) => t.id === targetId);
    if (index === -1) return;

    const target = targetsRef.current[index];
    targetsRef.current.splice(index, 1);

    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 120);

    const earnedPoints = target.points * combo;
    setScore((prev) => prev + earnedPoints);
    setBugsSquashed((prev) => prev + 1);

    setCombo((prev) => Math.min(prev + 1, 5));
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setCombo(1);
    }, 2200);

    spawnExplosion(target.x, target.y, target.color);
    addFloatingScore(
      `+${earnedPoints}${combo > 1 ? ` (x${combo})` : ''}`,
      target.x,
      target.y - 10,
      target.color
    );

    if (target.type === 'coffee') {
      playSound('powerup');
      targetsRef.current.forEach((t) => {
        spawnExplosion(t.x, t.y, t.color);
      });
      const bonus = targetsRef.current.length * 200;
      setScore((prev) => prev + bonus);
      if (bonus > 0) {
        addFloatingScore(`⚡ EMP PURGE +${bonus}!`, target.x, target.y - 30, '#00ff88');
      }
      targetsRef.current = [];
    } else {
      playSound('zap');
    }

    setTimeout(() => {
      if (targetsRef.current.length < 5 && gameState === 'playing') {
        spawnTarget();
        if (Math.random() < 0.4) spawnTarget();
      }
    }, 300);
  };

  // Timer countdown
  useEffect(() => {
    if (activeTab !== 'arcade' || gameState !== 'playing') return;

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
  }, [activeTab, gameState, playSound]);

  // High score update
  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('heyprince_arcade_highscore', score.toString());
      } catch {
        // Storage fallback
      }
    }
  }, [gameState, score, highScore]);

  // Animation loop for Bug Smasher
  useEffect(() => {
    if (activeTab !== 'arcade') return;

    const loop = () => {
      const arena = arenaRef.current;
      if (arena && gameState === 'playing') {
        const width = arena.clientWidth;
        const height = arena.clientHeight;

        targetsRef.current.forEach((t) => {
          t.x += t.vx;
          t.y += t.vy;

          if (t.x < 30) {
            t.x = 30;
            t.vx = Math.abs(t.vx);
          } else if (t.x > width - 30) {
            t.x = width - 30;
            t.vx = -Math.abs(t.vx);
          }
          if (t.y < 30) {
            t.y = 30;
            t.vy = Math.abs(t.vy);
          } else if (t.y > height - 30) {
            t.y = height - 30;
            t.vy = -Math.abs(t.vy);
          }
        });

        if (targetsRef.current.length < 4 && Math.random() < 0.05) {
          spawnTarget();
        }
      }

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      floatingScoresRef.current.forEach((f) => {
        f.y -= 1.2;
        f.opacity -= 0.025;
      });
      floatingScoresRef.current = floatingScoresRef.current.filter((f) => f.opacity > 0);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTab, gameState, spawnTarget]);

  // ==========================================
  // 2. NEON GRAVITY MATRIX CANVAS SANDBOX
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gravityMode, setGravityMode] = useState<'attract' | 'vortex' | 'repel' | 'neural'>('neural');
  const [particlePalette, setParticlePalette] = useState<'cyber' | 'matrix' | 'gold' | 'neon'>('cyber');
  const [nodeCount, setNodeCount] = useState(70);

  useEffect(() => {
    if (activeTab !== 'gravity') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 480;
    };
    window.addEventListener('resize', handleResize);

    const getPaletteColors = () => {
      if (particlePalette === 'matrix') return ['#00ff66', '#00cc44', '#11ff88', '#00ffaa'];
      if (particlePalette === 'gold') return ['#ffd700', '#ffaa00', '#ff8800', '#ffea70'];
      if (particlePalette === 'neon') return ['#ff007f', '#7928ca', '#00f2fe', '#ff3366'];
      return ['#00f2fe', '#4facfe', '#d40027', '#ffffff', '#00ff88'];
    };

    interface SimParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseRadius: number;
      trail: { x: number; y: number }[];
    }

    const particles: SimParticle[] = [];
    const colors = getPaletteColors();

    for (let i = 0; i < nodeCount; i++) {
      const radius = Math.random() * 2.5 + 1.8;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.8,
        vy: (Math.random() - 0.5) * 1.8,
        radius,
        baseRadius: radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
        isHovering = true;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    let simFrame: number;

    const render = () => {
      ctx.fillStyle = 'rgba(10, 12, 18, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // Render connected neural energy webs
      if (gravityMode === 'neural') {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
              const alpha = (1 - dist / 110) * 0.35;
              ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      particles.forEach((p) => {
        if (isHovering) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (gravityMode === 'attract') {
            const force = 40 / (dist + 20);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          } else if (gravityMode === 'repel') {
            if (dist < 180) {
              const force = (180 - dist) / 180;
              p.vx -= (dx / dist) * force * 3;
              p.vy -= (dy / dist) * force * 3;
            }
          } else if (gravityMode === 'vortex') {
            const force = 30 / (dist + 20);
            const perpX = -dy / dist;
            const perpY = dx / dist;
            p.vx += perpX * force * 1.5 + (dx / dist) * force * 0.4;
            p.vy += perpY * force * 1.5 + (dy / dist) * force * 0.4;
          } else if (gravityMode === 'neural') {
            if (dist < 140) {
              const force = (140 - dist) / 140;
              p.vx += (dx / dist) * force * 1.2;
              p.vy += (dy / dist) * force * 1.2;
            }
          }
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        // Screen boundary bounce
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > height) {
          p.y = height;
          p.vy *= -1;
        }

        // Draw particle with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      simFrame = requestAnimationFrame(render);
    };

    simFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(simFrame);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [activeTab, gravityMode, particlePalette, nodeCount]);

  const triggerSupernova = (e: React.MouseEvent) => {
    playSound('supernova');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Shake screen slightly
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 150);
  };

  // ==========================================
  // 3. CYBER CLI HACKER TERMINAL
  // ==========================================
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<
    { type: 'input' | 'output' | 'system' | 'banner'; text: string; link?: string }[]
  >([
    {
      type: 'banner',
      text: `⚡ HEYPRINCE CYBER KERNEL v4.19 (x86_64-prince-enterprise)
Type "help" to list commands or click prompt chips below.
System status: ALL SERVICES OPERATIONAL [OK]`,
    },
  ]);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    playSound('click');

    const newLogs = [...terminalOutput, { type: 'input' as const, text: `$ ${cmd}` }];

    switch (trimmed) {
      case 'help':
        newLogs.push({
          type: 'output',
          text: `AVAILABLE TERMINAL DIRECTIVES:
  • skills       - Display Prince's engineering capabilities & stack meters
  • services     - List tech services (AI Automations, React, PHP, Python, SEO, UI/UX)
  • ai-audit     - Execute high-speed neural diagnostic of web architecture
  • whoami       - System info for Senior Consultant Prince
  • matrix       - Trigger digital rain visualizer mode
  • secret       - Decrypt easter egg clearance logs
  • contact      - Open direct WhatsApp / Inquiry gateway
  • clear        - Wipe terminal buffer`,
        });
        break;

      case 'skills':
        newLogs.push({
          type: 'output',
          text: `[ENGINEERING CAPABILITIES & PROFICIENCY]
  [AI / LLM Pipelines]       ██████████████████ 98% (Gemini, LangChain, Agents, RAG)
  [React / Next.js / TS]     ██████████████████ 99% (Full Stack, Performance, GSAP)
  [Modern PHP 8+ / Laravel]  ████████████████░░ 92% (Scalable REST APIs, Legacy Migrations)
  [Python / Microservices]   ████████████████░░ 94% (FastAPI, Scrapers, Automations)
  [CMS & E-Commerce]         ██████████████████ 96% (WordPress, Shopify, Webflow, Squarespace)
  [Technical SEO & Speed]    ██████████████████ 97% (Core Web Vitals 99+, On-Page)
  [UI/UX & Brand Design]     ███████████████░░░ 90% (Figma, Design Systems, Graphics)`,
        });
        break;

      case 'services':
        newLogs.push({
          type: 'output',
          text: `ACTIVE SERVICE CATALOG:
  1. AI Services & Project Automations [★ FEATURED]
  2. CMS Development (WordPress, Shopify, Webflow, Squarespace)
  3. React & Next.js Modern Web Engineering
  4. PHP Development & Custom APIs
  5. Python Microservices & Data Automations
  6. Technical SEO & Core Web Vitals Optimization
  7. UI/UX & Graphics Design Systems`,
        });
        break;

      case 'ai-audit':
        newLogs.push({
          type: 'output',
          text: `[RUNNING NEURAL INFRASTRUCTURE SCAN...]
  [0.02s] Parsing bundle size... Gzipped JS < 90KB [OPTIMAL]
  [0.08s] Auditing Core Web Vitals... LCP 0.6s | CLS 0.00 | INP 18ms [GRADE A+]
  [0.15s] Checking AI API latency... Gemini 2.0 Flash response time: 240ms [BLAZING]
  [0.22s] Database query indexing... 0 slow queries detected [VERIFIED]
  >> AUDIT STATUS: 100% PRODUCTION READY. NO BOTTLENECKS FOUND.`,
        });
        break;

      case 'whoami':
        newLogs.push({
          type: 'output',
          text: `PRINCE — Senior IT Consultant & Full Stack Web Engineer
  Location: Remote / Global (India origin)
  Specialty: Building high-conversion, speed-optimized digital platforms
  Contact: it@heyprince.in | WhatsApp active`,
        });
        break;

      case 'secret':
        newLogs.push({
          type: 'output',
          text: `🔓 CLASSIFIED LOG DECRYPTED:
  "The best code is not just clean — it drives business growth and eliminates daily headaches."
  Secret bonus code unlocked: Use code "PRINCE_VIP" in your inquiry for an expedited consultation.`,
        });
        break;

      case 'matrix':
        newLogs.push({
          type: 'output',
          text: `🟢 "Wake up, Neo... The Matrix has you." Switching your visual focus to Neon Matrix Sandbox!`,
        });
        setTimeout(() => {
          setActiveTab('gravity');
          setParticlePalette('matrix');
          setGravityMode('vortex');
        }, 1200);
        break;

      case 'contact':
        newLogs.push({
          type: 'output',
          text: `Direct WhatsApp gateway: https://wa.me/ | Email: it@heyprince.in
Opening inquiry form...`,
        });
        window.location.hash = '#contact';
        break;

      case 'clear':
        setTerminalOutput([]);
        setTerminalInput('');
        return;

      default:
        newLogs.push({
          type: 'output',
          text: `Command not recognized: "${cmd}". Type "help" to list available commands.`,
        });
        break;
    }

    setTerminalOutput(newLogs);
    setTerminalInput('');
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(terminalInput);
  };

  const getRank = (scoreVal: number) => {
    if (scoreVal >= 3500) return { title: 'Principal Cyber Architect', color: '#00ff88' };
    if (scoreVal >= 2000) return { title: 'Senior Staff Engineer', color: '#00f2fe' };
    if (scoreVal >= 1000) return { title: 'Full Stack Ninja', color: '#ffbd2e' };
    if (scoreVal >= 400) return { title: 'Bug Hunter Apprentice', color: '#ff5f56' };
    return { title: 'Junior Debugger', color: '#aaaaaa' };
  };

  const rank = getRank(score);

  return (
    <section className="cyber-arcade-section" id="arcade">
      <div className="container">
        {/* Section Heading */}
        <div className="arcade-header-wrap text-center">
          <div className="arcade-badge">
            <span className="live-pulse-dot"></span>
            <span className="badge-text">Interactive Cyber Lab</span>
          </div>
          <h2 className="arcade-glow-title">
            Stay, Play &amp; <span className="text-red">Explore</span>
          </h2>
          <p className="arcade-subtitle">
            Take a breather from regular portfolio scrolling. Squash production bugs, play with
            real-time neon gravitational physics, or fire up the interactive cyber terminal!
          </p>

          {/* Interactive Navigation Mode Switcher */}
          <div className="arcade-tab-switcher">
            <button
              type="button"
              className={`arcade-tab-btn ${activeTab === 'arcade' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('arcade');
                playSound('click');
              }}
            >
              <FaGamepad className="tab-icn" />
              <span>Bug Crusher Arcade</span>
              <span className="tab-pill">30s Sprint</span>
            </button>

            <button
              type="button"
              className={`arcade-tab-btn ${activeTab === 'gravity' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('gravity');
                playSound('click');
              }}
            >
              <FaAtom className="tab-icn" />
              <span>Neon Gravity Matrix</span>
              <span className="tab-pill">Physics Sandbox</span>
            </button>

            <button
              type="button"
              className={`arcade-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('terminal');
                playSound('click');
              }}
            >
              <FaTerminal className="tab-icn" />
              <span>Cyber CLI Console</span>
              <span className="tab-pill">Hacker Mode</span>
            </button>
          </div>
        </div>

        {/* Master Cyber Terminal Enclosure */}
        <div className={`arcade-terminal ${screenShake ? 'screen-shake' : ''}`}>
          {/* Top Bar Header */}
          <div className="terminal-header">
            <div className="terminal-controls">
              <div className="terminal-dots">
                <span className="dot red" title="Close"></span>
                <span className="dot yellow" title="Minimize"></span>
                <span className="dot green" title="Maximize"></span>
              </div>
              <div className="terminal-identity">
                <span className="terminal-prompt">&gt;_</span>
                <span className="terminal-title">
                  {activeTab === 'arcade' && 'bug_crusher_sprint.exe --turbo'}
                  {activeTab === 'gravity' && 'neon_particle_graviton.wasm --60fps'}
                  {activeTab === 'terminal' && 'heyprince_shell_v4.19 (bash)'}
                </span>
                <span className="terminal-status-badge">ONLINE</span>
              </div>
            </div>

            {/* Top Right HUD Controls */}
            <div className="terminal-stats">
              {activeTab === 'arcade' && (
                <>
                  <div className="stat-pill score-pill">
                    <span className="stat-label">SCORE</span>
                    <strong className="stat-val">{score}</strong>
                  </div>
                  {combo > 1 && (
                    <div className="stat-pill combo-pill">
                      <FaBolt size={12} color="#00ff88" />
                      <span className="stat-val text-green">{combo}x COMBO</span>
                    </div>
                  )}
                  <div className={`stat-pill timer-pill ${timeLeft <= 5 ? 'timer-danger' : ''}`}>
                    <span className="stat-label">TIME</span>
                    <strong className="stat-val">{timeLeft}s</strong>
                  </div>
                  {highScore > 0 && (
                    <div className="stat-pill d-none d-sm-flex" title="All-Time High Score">
                      <FaTrophy size={12} color="#ffd700" />
                      <span className="stat-val text-gold">{highScore}</span>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'gravity' && (
                <div className="stat-pill">
                  <span className="stat-label">NODES</span>
                  <strong className="stat-val">{nodeCount}</strong>
                </div>
              )}

              <button
                type="button"
                className="btn-sound-toggle"
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                title={soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
              >
                {soundEnabled ? (
                  <FaVolumeHigh size={15} color="#00ff88" />
                ) : (
                  <FaVolumeXmark size={15} color="#888888" />
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: BUG CRUSHER SPRINT */}
          {activeTab === 'arcade' && (
            <>
              <div className="terminal-timer-bar">
                <div
                  className="timer-fill"
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                ></div>
              </div>

              <div className="terminal-arena" ref={arenaRef}>
                <div className="cyber-grid-overlay"></div>
                <div className="scanlines"></div>

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

                {gameState === 'idle' && (
                  <div className="arena-overlay">
                    <div className="overlay-box text-center">
                      <div className="overlay-icon mb-3">
                        <FaBug size={48} color="#D40027" />
                      </div>
                      <h3>BUG CRUSHER SPRINT</h3>
                      <p>
                        30 seconds. Fast reflexes. Squash as many bugs and memory leaks as you can
                        before the server goes down!
                      </p>
                      <div className="legend-pills mb-4">
                        <span>🐛 Bug +100</span>
                        <span>⚠️ Type Error +150</span>
                        <span>🐞 Memory Leak +200</span>
                        <span>💥 Conflict +300</span>
                        <span>☕ Coffee EMP +500</span>
                      </div>
                      <button
                        type="button"
                        className="portal-btn mx-auto"
                        onClick={startBugGame}
                      >
                        <span className="mr-right">INITIALIZE SPRINT</span>
                        <span className="arrow">
                          <svg
                            width="40"
                            height="40"
                            viewBox="0 0 40 40"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="20" cy="20" r="20" fill="white" />
                            <path
                              d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                              fill="#000"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {gameState === 'gameover' && (
                  <div className="arena-overlay gameover-overlay">
                    <div className="overlay-box text-center">
                      <div className="trophy-wrap mb-3">
                        <FaTrophy size={54} color={rank.color} />
                      </div>
                      <h3>SERVER SECURED!</h3>
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
                        <button
                          type="button"
                          className="btn-arcade-action"
                          onClick={startBugGame}
                        >
                          <FaRotateRight className="me-2" /> Play Again
                        </button>
                        <a href="#contact" className="portal-btn">
                          <span className="mr-right">Build Bug-Free Apps</span>
                          <span className="arrow">
                            <svg
                              width="40"
                              height="40"
                              viewBox="0 0 40 40"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="20" cy="20" r="20" fill="white" />
                              <path
                                d="M24.8218 28L21.652 27.2937C21.7864 25.9354 22.2967 24.6859 23.1832 23.545C24.0696 22.395 25.0725 21.6525 26.1917 21.3175H9V18.6825H26.1917C25.0725 18.3475 24.0696 17.605 23.1832 16.455C22.2967 15.305 21.7864 14.0509 21.652 12.6927L24.8218 12C24.8844 13.9921 25.4575 15.5676 26.541 16.7266C27.6244 17.8766 29.1108 18.5286 31 18.6825V21.3175C29.1108 21.4714 27.6244 22.1279 26.541 23.2869C25.4575 24.4369 24.8844 26.0079 24.8218 28Z"
                                fill="#000"
                              />
                            </svg>
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: NEON GRAVITY MATRIX (PHYSICS SANDBOX) */}
          {activeTab === 'gravity' && (
            <div className="sandbox-wrapper">
              <div className="sandbox-controls-bar">
                <div className="sandbox-options">
                  <span className="sandbox-label">PHYSICS:</span>
                  {(['neural', 'attract', 'vortex', 'repel'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`btn-submode ${gravityMode === m ? 'active' : ''}`}
                      onClick={() => {
                        setGravityMode(m);
                        playSound('click');
                      }}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="sandbox-options">
                  <span className="sandbox-label">NEON:</span>
                  {(['cyber', 'matrix', 'gold', 'neon'] as const).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      className={`btn-submode ${particlePalette === theme ? 'active' : ''}`}
                      onClick={() => {
                        setParticlePalette(theme);
                        playSound('click');
                      }}
                    >
                      {theme.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-supernova"
                  onClick={triggerSupernova}
                  title="Click to blast shockwave"
                >
                  <FaBolt className="me-1" /> SUPERNOVA
                </button>
              </div>

              <div className="sandbox-canvas-container" onClick={triggerSupernova}>
                <canvas ref={canvasRef} className="sandbox-canvas" />
                <div className="sandbox-hint-badge">
                  ✦ Move cursor to bend gravity • Click anywhere for Supernova
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CYBER CLI CONSOLE */}
          {activeTab === 'terminal' && (
            <div className="cyber-cli-wrapper">
              <div className="cli-quick-chips">
                <span className="chips-label">QUICK COMMANDS:</span>
                {['help', 'skills', 'services', 'ai-audit', 'whoami', 'matrix', 'secret', 'contact'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      className="cli-chip-btn"
                      onClick={() => executeCommand(c)}
                    >
                      {c}
                    </button>
                  )
                )}
              </div>

              <div className="cli-terminal-window" ref={terminalScrollRef}>
                {terminalOutput.map((log, idx) => (
                  <div key={idx} className={`cli-log-line log-${log.type}`}>
                    <pre>{log.text}</pre>
                  </div>
                ))}
              </div>

              <form className="cli-input-form" onSubmit={handleTerminalSubmit}>
                <span className="cli-prompt-symbol">prince@heyprince:~$</span>
                <input
                  type="text"
                  className="cli-input-field"
                  placeholder="type directive (e.g. skills, ai-audit, services)..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="submit" className="cli-send-btn">
                  EXECUTE
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CyberArcade;
