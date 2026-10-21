'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Play,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Key,
  Users,
  FileText,
  Mail,
  Zap,
  Globe,
  Radio,
  Eye,
  BookOpen,
  Brain,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface JarvisAssistantProps {
  user?: {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
  };
}

interface JarvisAction {
  type:
    | 'navigate'
    | 'click_button'
    | 'focus_and_type'
    | 'run_agent'
    | 'change_password'
    | 'scroll'
    | 'select_tab'
    | 'batch_agents'
    | 'toast';
  url?: string;
  targetText?: string;
  fieldName?: string;
  value?: string;
  agentId?: string;
  quantifier?: 'all' | 'first_three' | 'first_two' | 'first_one';
  mode?: 'observe' | 'prepare' | 'auto';
  status?: 'enabled' | 'paused';
  direction?: 'down' | 'up' | 'top';
  message?: string;
}

interface MemoryItem {
  id: string;
  category: 'teaching' | 'self_study' | 'rule' | 'preference';
  title: string;
  content: string;
  source: 'prince' | 'autonomous_study';
  tags: string[];
  importance: number;
  created_at: string;
}

export function JarvisAssistant({ user }: JarvisAssistantProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Assistant UI States
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'memory'>('console');
  const [isListening, setIsListening] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [replyText, setReplyText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [learnedSummary, setLearnedSummary] = useState<string>('Learned active screen elements.');

  // Memory Vault States
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Engine Refs
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const continuousListeningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  const adminName = user?.name || user?.email?.split('@')[0] || 'Prince';
  const userId = user?.id || 1;

  // 1. Web Audio Synthesizer (Zero-dependency acoustic signals)
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playChime = useCallback(
    (type: 'wake' | 'execute' | 'success' | 'alert') => {
      if (isMuted) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'wake') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === 'execute') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(580, now);
          osc.frequency.exponentialRampToValueAtTime(920, now + 0.14);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659, now);
          osc.frequency.exponentialRampToValueAtTime(1046, now + 0.2);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'alert') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        }
      } catch (err) {
        console.warn('[JARVIS Audio] Sound notice:', err);
      }
    },
    [getAudioContext, isMuted]
  );

  // 2. Speech Synthesis (TTS) - British Male Cadence with Echo Protection
  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      setReplyText(text);

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onDone) onDone();
        return;
      }

      if (isMuted) {
        if (onDone) onDone();
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();

        const preferredVoice =
          voices.find(
            (v) =>
              (v.lang.startsWith('en-GB') || v.lang.includes('GB')) &&
              (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Oliver'))
          ) ||
          voices.find((v) => v.lang.startsWith('en-GB')) ||
          voices.find((v) => v.name.includes('Google UK English Male')) ||
          voices.find((v) => v.name.includes('Natural')) ||
          voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.pitch = 0.94;
        utterance.rate = 1.04;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
        };

        const handleFinish = () => {
          setIsSpeaking(false);
          setTimeout(() => {
            isSpeakingRef.current = false;
          }, 350);
          if (onDone) onDone();
        };

        utterance.onend = handleFinish;
        utterance.onerror = handleFinish;

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[JARVIS TTS] Speech error:', err);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onDone) onDone();
      }
    },
    [isMuted]
  );

  // 3. Welcome / Login Executive Briefing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mutedStored = localStorage.getItem('hp_jarvis_muted');
    if (mutedStored === 'true') {
      setIsMuted(true);
    }

    const hasGreeted = sessionStorage.getItem('hp_jarvis_greeted');
    if (!hasGreeted) {
      greetingTimeoutRef.current = setTimeout(() => {
        playChime('wake');
        const greeting = `Welcome back, ${adminName}. AI Chief of Staff is online. Memory vault and continuous voice executive are ready.`;
        speak(greeting);
        sessionStorage.setItem('hp_jarvis_greeted', 'true');
      }, 1400);
    }

    return () => {
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    };
  }, [adminName, playChime, speak]);

  // 4. Memory Vault Management
  const fetchMemories = useCallback(async () => {
    setLoadingMemories(true);
    try {
      const res = await fetch('/api/admin/jarvis/memory');
      const data = await res.json();
      if (data.success && Array.isArray(data.memories)) {
        setMemories(data.memories);
      }
    } catch (e) {
      console.warn('[JARVIS Memory Fetch Error]', e);
    } finally {
      setLoadingMemories(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'memory') {
      fetchMemories();
    }
  }, [isOpen, activeTab, fetchMemories]);

  const triggerSelfStudy = async (customTopic?: string) => {
    setIsStudying(true);
    setActionNotice('JARVIS is conducting autonomous technical self-study...');
    playChime('wake');

    try {
      const res = await fetch('/api/admin/jarvis/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'study', topic: customTopic }),
      });
      const data = await res.json();
      if (data.success && data.memory) {
        playChime('success');
        speak(`Self-study complete on ${data.memory.title}, Prince. Key takeaways have been stored in my permanent memory.`);
        fetchMemories();
      } else {
        playChime('alert');
        speak(`Self-study completed with an advisory notice.`);
      }
    } catch {
      playChime('alert');
      speak(`Could not complete self-study at this moment.`);
    } finally {
      setIsStudying(false);
      setActionNotice(null);
    }
  };

  const teachRule = async (ruleText: string) => {
    if (!ruleText.trim()) return;
    setActionNotice('Saving lesson to Memory Vault...');
    playChime('execute');

    try {
      const res = await fetch('/api/admin/jarvis/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'teach',
          title: `Rule: ${ruleText.slice(0, 45)}`,
          content: ruleText.trim(),
          category: 'teaching',
        }),
      });
      const data = await res.json();
      if (data.success) {
        playChime('success');
        speak(`Committed to memory: ${ruleText}. I will apply this rule to all operations, Prince.`);
        setNewRuleInput('');
        fetchMemories();
      }
    } catch {
      playChime('alert');
      speak(`Failed to commit rule to database.`);
    } finally {
      setActionNotice(null);
    }
  };

  // 5. Autonomous DOM Inspector: "Learns Dashboard" in Real Time
  const learnCurrentDashboard = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>('button, a.hpa-btn, .hpa-btn, [role="button"]')
    )
      .map((b) => (b.innerText || b.getAttribute('aria-label') || b.getAttribute('title') || '').trim())
      .filter((t) => t.length > 1 && t.length < 50 && !t.includes('\n'));

    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input, textarea, select'
      )
    )
      .map((i) => {
        const id = i.id;
        const label = id ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim() : null;
        const placeholder = 'placeholder' in i ? (i as HTMLInputElement).placeholder : '';
        return label || placeholder || i.name || i.id || '';
      })
      .filter((t) => t.length > 0 && t.length < 50);

    const tabs = Array.from(
      document.querySelectorAll<HTMLElement>('[role="tab"], .hpa-tab, .cos-tab-btn, [data-tab]')
    )
      .map((t) => t.innerText.trim())
      .filter((t) => t.length > 0);

    const heading = document.querySelector('h1')?.innerText?.trim() || document.title;
    const uniqueButtons = Array.from(new Set(buttons)).slice(0, 25);
    const uniqueInputs = Array.from(new Set(inputs)).slice(0, 15);
    const uniqueTabs = Array.from(new Set(tabs));

    setLearnedSummary(
      `Learned: ${uniqueButtons.length} buttons, ${uniqueInputs.length} inputs, ${uniqueTabs.length} tabs on "${heading}"`
    );

    return {
      route: window.location.pathname,
      heading,
      visibleButtons: uniqueButtons,
      visibleInputs: uniqueInputs,
      visibleTabs: uniqueTabs,
      userId,
    };
  }, [userId]);

  // 6. DOM Execution Engine (Highlighting, Clicking, Typing)
  const highlightElement = useCallback((el: HTMLElement) => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const originalShadow = el.style.boxShadow;
    const originalBorder = el.style.borderColor;
    const originalTransition = el.style.transition;

    el.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    el.style.boxShadow = '0 0 0 3px #00ffff, 0 0 25px rgba(0, 255, 255, 0.7)';
    el.style.borderColor = '#00ffff';

    setTimeout(() => {
      el.style.boxShadow = originalShadow;
      el.style.borderColor = originalBorder;
      el.style.transition = originalTransition;
    }, 3500);
  }, []);

  const findAndClickButton = useCallback(
    (targetText: string): boolean => {
      const lowerTarget = targetText.toLowerCase().trim();
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('button, a.hpa-btn, .hpa-btn, [role="button"], [role="tab"]')
      );

      let matched = candidates.find((b) => (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim() === lowerTarget);
      if (!matched) {
        matched = candidates.find((b) => {
          const text = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase();
          return text.includes(lowerTarget);
        });
      }

      if (matched) {
        highlightElement(matched);
        playChime('execute');
        matched.focus();
        matched.click();
        return true;
      }
      return false;
    },
    [highlightElement, playChime]
  );

  const findAndTypeIntoInput = useCallback(
    (fieldNameOrSelector: string, textToType?: string, maxAttempts = 15) => {
      let attempts = 0;
      const lowerField = fieldNameOrSelector.toLowerCase().trim();

      const interval = setInterval(() => {
        attempts++;

        let input: HTMLInputElement | HTMLTextAreaElement | null = null;
        try {
          input = document.querySelector<HTMLInputElement>(fieldNameOrSelector);
        } catch {}

        if (!input) {
          const allInputs = Array.from(
            document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
          );
          input =
            allInputs.find((i) => {
              const name = (i.name || '').toLowerCase();
              const ph = (i.placeholder || '').toLowerCase();
              const id = (i.id || '').toLowerCase();
              const label = id ? (document.querySelector(`label[for="${id}"]`)?.textContent || '').toLowerCase() : '';
              return name.includes(lowerField) || ph.includes(lowerField) || id.includes(lowerField) || label.includes(lowerField);
            }) || null;
        }

        if (input) {
          clearInterval(interval);
          highlightElement(input);
          input.focus();

          if (textToType) {
            input.value = '';
            let charIndex = 0;
            const timer = setInterval(() => {
              if (charIndex < textToType.length) {
                input!.value += textToType.charAt(charIndex);
                input!.dispatchEvent(new Event('input', { bubbles: true }));
                charIndex++;
              } else {
                clearInterval(timer);
                input!.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }, 35);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 150);
    },
    [highlightElement]
  );

  // 7. Action Sequence Executor
  const executeActions = useCallback(
    async (actions: JarvisAction[]) => {
      for (const act of actions) {
        if (act.type === 'navigate' && act.url) {
          playChime('execute');
          router.push(act.url);
          await new Promise((r) => setTimeout(r, 400));
        } else if (act.type === 'click_button' && act.targetText) {
          findAndClickButton(act.targetText);
        } else if (act.type === 'select_tab' && act.targetText) {
          findAndClickButton(act.targetText);
        } else if (act.type === 'focus_and_type') {
          findAndTypeIntoInput(act.fieldName || 'input', act.value);
        } else if (act.type === 'change_password') {
          const editUrl = act.url || `/admin/users/${userId}/edit`;
          router.push(editUrl);
          findAndTypeIntoInput('input[type="password"]', act.value);
        } else if (act.type === 'batch_agents') {
          try {
            setActionNotice(`Updating ${act.quantifier || 'all'} agents to ${act.mode || act.status}...`);
            await fetch('/api/admin/chief-of-staff/agent-toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quantifier: act.quantifier,
                mode: act.mode,
                status: act.status,
              }),
            });
            playChime('success');

            // If on the Chief of Staff page, click the buttons on cards for immediate visual feedback
            const modeTarget = act.mode === 'prepare' ? 'Mode B' : act.mode === 'observe' ? 'Mode A' : 'Mode C';
            const cards = Array.from(document.querySelectorAll('.cos-agent-card, [data-agent-card]'));
            let targetCards = cards;
            if (act.quantifier === 'first_three') targetCards = cards.slice(0, 3);
            else if (act.quantifier === 'first_two') targetCards = cards.slice(0, 2);
            else if (act.quantifier === 'first_one') targetCards = cards.slice(0, 1);

            for (const c of targetCards) {
              const btn = Array.from(c.querySelectorAll('button')).find(
                (b) => b.innerText.includes(modeTarget) || b.innerText.includes(act.mode || '')
              );
              if (btn) {
                highlightElement(btn as HTMLElement);
                (btn as HTMLElement).click();
              }
            }
          } catch {
            playChime('alert');
          } finally {
            setActionNotice(null);
          }
        } else if (act.type === 'run_agent' && act.agentId) {
          try {
            setActionNotice(`Executing Agent ${act.agentId}...`);
            const res = await fetch('/api/admin/chief-of-staff/run-task', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ agentId: act.agentId, payload: act.value ? { customTopic: act.value } : undefined }),
            });
            const data = await res.json();
            if (data.success) {
              playChime('success');
            } else {
              playChime('alert');
            }
          } catch {
            playChime('alert');
          } finally {
            setActionNotice(null);
          }
        } else if (act.type === 'scroll') {
          if (act.direction === 'down') {
            window.scrollBy({ top: 450, behavior: 'smooth' });
          } else if (act.direction === 'up') {
            window.scrollBy({ top: -450, behavior: 'smooth' });
          } else if (act.direction === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
    },
    [findAndClickButton, findAndTypeIntoInput, highlightElement, playChime, router, userId]
  );

  // 8. Full Voice Command Router
  const processCommand = useCallback(
    async (rawText: string) => {
      if (isProcessingRef.current) return;
      const cmd = rawText.trim().toLowerCase();
      if (!cmd || cmd.length < 2) return;

      isProcessingRef.current = true;
      setIsThinking(true);
      playChime('execute');

      // --- COMMAND: STOP / PAUSE LISTENING ---
      if (cmd === 'stop listening' || cmd === 'pause listening' || cmd === 'jarvis sleep' || cmd === 'mute jarvis') {
        continuousListeningRef.current = false;
        setIsContinuous(false);
        setIsListening(false);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }
        speak(`Voice recognition paused. Click my Arc Reactor anytime you need me, Prince.`);
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      // --- COMMAND: DIRECT TEACHING & MEMORY COMMIT ---
      const teachMatch = cmd.match(/(?:remember|learn|note|memorize)\s+(?:that\s+)?(.+)/i) ||
        cmd.match(/teaching(?:\s+you)?(?:\s+that)?[:\s]+(.+)/i);
      if (teachMatch && teachMatch[1]?.trim()) {
        const rule = teachMatch[1].trim();
        await teachRule(rule);
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      // --- COMMAND: AUTONOMOUS SELF-STUDY & READING BOOKS ---
      const studyMatch = cmd.match(/(?:study|read(?:\s+a)?\s+book\s+on|learn\s+about)\s+(.+)/i);
      if (studyMatch && studyMatch[1]?.trim()) {
        const topic = studyMatch[1].trim();
        await triggerSelfStudy(topic);
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      // --- COMMAND: QUANTIFIER AGENT BATCH EXECUTION ("all means all, first three means first three") ---
      const batchAgentMatch = cmd.match(
        /(?:turn|set|switch|change)\s*(all|every|first\s*three|first\s*3|first\s*two|first\s*2|first\s*one|first|one)?\s*agents?\s*(?:to|in)?\s*(mode\s*[abc]|prepare|observe|auto|paused?|active|enabled?)/i
      );
      if (batchAgentMatch) {
        const quantRaw = (batchAgentMatch[1] || 'all').toLowerCase().trim();
        const modeRaw = batchAgentMatch[2].toLowerCase().trim();

        let quantifier: 'all' | 'first_three' | 'first_two' | 'first_one' = 'all';
        if (quantRaw.includes('three') || quantRaw.includes('3')) quantifier = 'first_three';
        else if (quantRaw.includes('two') || quantRaw.includes('2')) quantifier = 'first_two';
        else if (quantRaw.includes('one') || quantRaw === 'first') quantifier = 'first_one';
        else if (quantRaw === 'all' || quantRaw === 'every') quantifier = 'all';

        let targetMode: 'observe' | 'prepare' | 'auto' | undefined;
        let targetStatus: 'enabled' | 'paused' | undefined;

        if (modeRaw.includes('b') || modeRaw.includes('prepare')) targetMode = 'prepare';
        else if (modeRaw.includes('a') || modeRaw.includes('observe')) targetMode = 'observe';
        else if (modeRaw.includes('c') || modeRaw.includes('auto')) targetMode = 'auto';
        else if (modeRaw.includes('pause')) targetStatus = 'paused';
        else if (modeRaw.includes('active') || modeRaw.includes('enable')) targetStatus = 'enabled';

        const quantLabels = {
          all: 'all 5 autonomous agents',
          first_three: 'the first three agents (Content Researcher, Website Guardian, and SEO Growth)',
          first_two: 'the first two agents',
          first_one: 'the first agent (Content Researcher)',
        };

        const modeLabels = {
          prepare: 'Mode B (Prepare / Approval Required)',
          observe: 'Mode A (Observe & Telemetry)',
          auto: 'Mode C (Autonomous Live Publishing)',
        };

        const reply = `Following your rule that one means one and all means all: I have updated ${quantLabels[quantifier]} to ${targetMode ? modeLabels[targetMode] : targetStatus}, ${adminName}.`;
        speak(reply);

        await executeActions([
          {
            type: 'batch_agents',
            quantifier,
            mode: targetMode,
            status: targetStatus,
          },
        ]);

        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      // --- COMMAND: CHANGE PASSWORD & CREDENTIALS ---
      if (
        cmd.includes('password') ||
        cmd.includes('change my password') ||
        cmd.includes('reset password') ||
        cmd.includes('update credentials')
      ) {
        setActionNotice('Redirecting to Password Credentials...');
        const pwdMatch = cmd.match(/(?:password\s+to|type\s+password)\s+([^\s]+)/i);
        const typedPassword = pwdMatch ? pwdMatch[1] : undefined;
        const targetUrl = `/admin/users/${userId}/edit`;

        speak(`Opening your security profile now, ${adminName}. Focusing the password field for you.`, () => {
          router.push(targetUrl);
          findAndTypeIntoInput('input[type="password"]', typedPassword);
        });
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      // --- FAST DOM ACTION: "CLICK [BUTTON]" ---
      const clickMatch = cmd.match(/^click\s+(.+)/i);
      if (clickMatch && clickMatch[1]) {
        const btnQuery = clickMatch[1].trim();
        const clicked = findAndClickButton(btnQuery);
        if (clicked) {
          speak(`Clicking ${btnQuery} now, ${adminName}.`);
          setIsThinking(false);
          isProcessingRef.current = false;
          return;
        }
      }

      // --- FAST DOM ACTION: "TYPE [TEXT] IN [FIELD]" ---
      const typeMatch = cmd.match(/^(?:type|enter|fill)\s+(.+?)\s+(?:in|into)\s+(.+)/i);
      if (typeMatch && typeMatch[1] && typeMatch[2]) {
        const textVal = typeMatch[1].trim();
        const fieldTarget = typeMatch[2].trim();
        findAndTypeIntoInput(fieldTarget, textVal);
        speak(`Entered "${textVal}" into ${fieldTarget}, Prince.`);
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      // --- FAST NAVIGATION MENU COMMANDS ---
      if (cmd.includes('chief of staff') || cmd.includes('go to agents') || cmd.includes('open agents') || cmd.includes('command center')) {
        speak(`Opening Chief of Staff command center.`);
        router.push('/admin/chief-of-staff/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('client lead') || cmd.includes('go to leads') || cmd.includes('show leads') || cmd.includes('inquiries')) {
        speak(`Opening Client Inquiries and Leads.`);
        router.push('/admin/leads/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('outreach') || cmd.includes('lead intelligence') || cmd.includes('prospects')) {
        speak(`Opening Lead Intelligence and Discovery.`);
        router.push('/admin/outreach/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('new post') || cmd.includes('new article') || cmd.includes('write post')) {
        speak(`Launching new insight article editor.`);
        router.push('/admin/posts/new/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('post') || cmd.includes('insight') || cmd.includes('articles') || cmd.includes('blog')) {
        speak(`Viewing published Insights and Blog Posts.`);
        router.push('/admin/posts/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('daily news') || cmd.includes('news automation')) {
        speak(`Opening Daily AI News Automation.`);
        router.push('/admin/news-automation/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('service')) {
        speak(`Opening Engineering Services directory.`);
        router.push('/admin/services/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('media') || cmd.includes('vault') || cmd.includes('images')) {
        speak(`Accessing Media Vault assets.`);
        router.push('/admin/media/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('setting') || cmd.includes('configuration')) {
        speak(`Opening Platform & System Settings.`);
        router.push('/admin/settings/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('user') || cmd.includes('admin user') || cmd.includes('team')) {
        speak(`Opening Administrator Access Management.`);
        router.push('/admin/users/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('dashboard') || cmd.includes('go home')) {
        speak(`Returning to Executive Dashboard.`);
        router.push('/admin/');
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('run audit') || cmd.includes('check health') || cmd.includes('website guardian')) {
        speak(`Initiating Website Guardian diagnostic audit across core routes now, ${adminName}.`);
        executeActions([{ type: 'run_agent', agentId: 'website_guardian' }]);
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('check seo') || cmd.includes('run seo') || cmd.includes('seo audit')) {
        speak(`Scanning published articles and commercial keyword clusters now, sir.`);
        executeActions([{ type: 'run_agent', agentId: 'seo_growth' }]);
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('find leads') || cmd.includes('scout leads') || cmd.includes('lead scout')) {
        speak(`Deploying Lead Scout across e-commerce and digital commerce sectors now, ${adminName}.`);
        executeActions([{ type: 'run_agent', agentId: 'lead_scout' }]);
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      if (cmd.includes('log out') || cmd.includes('sign out')) {
        speak(`Securing the portal and signing you out. Good day, ${adminName}.`, async () => {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/admin/login/';
        });
        setIsThinking(false);
        isProcessingRef.current = false;
        return;
      }

      // --- COGNITIVE REASONING VIA GEMINI WITH SCREEN CONTEXT & MEMORY VAULT ---
      setActionNotice('Consulting JARVIS Core Intelligence & Memory...');
      try {
        const pageContext = learnCurrentDashboard();
        const res = await fetch('/api/admin/jarvis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: rawText, pageContext }),
        });
        const resData = await res.json();
        if (resData.success) {
          if (resData.reply) {
            speak(resData.reply);
          }
          if (Array.isArray(resData.actions) && resData.actions.length > 0) {
            await executeActions(resData.actions);
          }
        } else {
          speak(`At your command, Prince. All systems operational.`);
        }
      } catch (err) {
        speak(`Systems operational, ${adminName}. Standing by.`);
      } finally {
        setIsThinking(false);
        setActionNotice(null);
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 500);
      }
    },
    [adminName, executeActions, findAndClickButton, findAndTypeIntoInput, learnCurrentDashboard, playChime, router, speak, userId]
  );

  // 9. Always-On Continuous Speech Recognition Engine
  const startListeningEngine = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) {
      speak(`Speech recognition is not supported in this browser. You can type commands in my console, Prince.`);
      setIsOpen(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      rec.onresult = (e: any) => {
        if (isSpeakingRef.current) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const item = e.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setTranscript(interim);
        }

        if (final.trim()) {
          const cleaned = final.trim();
          setTranscript(cleaned);
          processCommand(cleaned);
        }
      };

      rec.onerror = (event: any) => {
        console.log('[JARVIS STT Notice]', event.error);
        if (event.error === 'not-allowed') {
          continuousListeningRef.current = false;
          setIsContinuous(false);
          setIsListening(false);
          isListeningRef.current = false;
          speak(`Microphone access was denied. Please allow microphone permissions in your browser.`);
        }
      };

      rec.onend = () => {
        isListeningRef.current = false;
        if (continuousListeningRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (continuousListeningRef.current && !isListeningRef.current) {
              try {
                rec.start();
              } catch {
                startListeningEngine();
              }
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('[JARVIS STT Setup Notice]', err);
    }
  }, [processCommand, speak]);

  const toggleContinuousListening = () => {
    if (isContinuous || isListening) {
      continuousListeningRef.current = false;
      setIsContinuous(false);
      setIsListening(false);
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      playChime('alert');
      speak(`Always-on voice paused.`);
    } else {
      continuousListeningRef.current = true;
      setIsContinuous(true);
      playChime('wake');
      speak(`Always-on continuous listening active, ${adminName}. I am listening to all your commands.`);
      startListeningEngine();
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('hp_jarvis_muted', nextMuted ? 'true' : 'false');
    if (nextMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const q = typedInput.trim();
    setTypedInput('');
    setTranscript(q);
    processCommand(q);
  };

  return (
    <>
      {/* PERSISTENT FLOATING JARVIS HUD */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
          fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
        }}
      >
        {/* Floating Mini Status Pill */}
        {actionNotice && (
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(0, 255, 255, 0.15)',
              border: '1px solid rgba(0, 255, 255, 0.4)',
              color: '#00ffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'hpaPulse 1.8s ease-in-out infinite',
            }}
          >
            <Loader2 size={12} className="hpa-spin" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 1. ARC REACTOR ORB CONTROLLER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleContinuousListening}
            title={
              isContinuous
                ? 'Always-On Voice ACTIVE (Click to Pause)'
                : 'Click once to activate Always-On Voice'
            }
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: isListening
                ? 'radial-gradient(circle, #00ffff 0%, #0088cc 70%, #031422 100%)'
                : 'radial-gradient(circle, #00e5ff 0%, #005588 70%, #071728 100%)',
              border: isContinuous
                ? '2px solid #00ffff'
                : '2px solid rgba(0, 255, 255, 0.5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isContinuous
                ? '0 0 35px rgba(0, 255, 255, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.6)'
                : '0 8px 30px rgba(0, 229, 255, 0.45), inset 0 0 12px rgba(0, 255, 255, 0.3)',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isContinuous ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            {/* Outer Spinning Hologram Ring */}
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(0, 255, 255, 0.5)',
                animation: isContinuous ? 'hpaSpin 4s linear infinite' : 'hpaSpin 14s linear infinite',
                pointerEvents: 'none',
              }}
            />

            {/* Glowing Active Status Beacon */}
            {isContinuous && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #090c12',
                  boxShadow: '0 0 10px #10b981',
                }}
              />
            )}

            {isThinking ? (
              <Loader2 size={24} className="hpa-spin" />
            ) : isSpeaking ? (
              <Sparkles size={24} color="#ffffff" />
            ) : isContinuous ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Mic size={20} color="#ffffff" />
                <span style={{ fontSize: '0.48rem', fontWeight: 900, letterSpacing: '0.06em', color: '#ffffff' }}>
                  ACTIVE
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Mic size={20} />
                <span style={{ fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.08em', marginTop: '1px' }}>
                  JARVIS
                </span>
              </div>
            )}
          </button>

          {/* Toggle HUD Window */}
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              learnCurrentDashboard();
            }}
            title={isOpen ? 'Collapse JARVIS HUD' : 'Open JARVIS Console'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(15, 20, 30, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        {/* 2. EXPANDABLE JARVIS HOLOGRAPHIC HUD WINDOW */}
        {isOpen && (
          <div
            style={{
              width: '420px',
              maxHeight: '580px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, rgba(14, 18, 28, 0.96) 0%, rgba(9, 12, 18, 0.99) 100%)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginTop: '8px',
              animation: 'hpaFadeUp 0.25s ease-out',
            }}
          >
            {/* Top Holographic Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 255, 255, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: isContinuous ? '#10b981' : '#00ffff',
                    boxShadow: isContinuous ? '0 0 10px #10b981' : '0 0 10px #00ffff',
                  }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
                    J.A.R.V.I.S.
                  </h4>
                  <span style={{ fontSize: '0.64rem', color: isContinuous ? '#10b981' : '#00ffff', fontWeight: 700, letterSpacing: '0.08em' }}>
                    {isContinuous ? '● ALWAYS LISTENING ACTIVE' : 'AUTONOMOUS EXECUTIVE & MEMORY'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleMuteToggle}
                  title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isMuted ? '#64748b' : '#00ffff',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Mode & Tab Switcher Bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              <button
                onClick={() => setActiveTab('console')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: 'none',
                  background: activeTab === 'console' ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                  borderBottom: activeTab === 'console' ? '2px solid #00ffff' : '2px solid transparent',
                  color: activeTab === 'console' ? '#00ffff' : '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Zap size={13} />
                <span>Console</span>
              </button>

              <button
                onClick={() => setActiveTab('memory')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: 'none',
                  background: activeTab === 'memory' ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                  borderBottom: activeTab === 'memory' ? '2px solid #00ffff' : '2px solid transparent',
                  color: activeTab === 'memory' ? '#00ffff' : '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Brain size={13} />
                <span>Memory & Self-Study ({memories.length})</span>
              </button>
            </div>

            {/* TAB 1: CONSOLE VIEW */}
            {activeTab === 'console' && (
              <>
                {/* Continuous Voice Mode Toggle Banner */}
                <div
                  style={{
                    padding: '8px 16px',
                    background: isContinuous ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 255, 255, 0.04)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={14} color={isContinuous ? '#10b981' : '#00ffff'} />
                    <span style={{ fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 600 }}>
                      {isContinuous ? 'Continuous Voice: ON' : 'Always-on Voice: OFF'}
                    </span>
                  </div>

                  <button
                    onClick={toggleContinuousListening}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isContinuous ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 255, 255, 0.2)',
                      border: isContinuous ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 255, 255, 0.4)',
                      color: isContinuous ? '#fca5a5' : '#00ffff',
                    }}
                  >
                    {isContinuous ? 'Pause Voice' : 'Activate Always-On'}
                  </button>
                </div>

                {/* Learned Screen Status Banner */}
                <div
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                  }}
                >
                  <Eye size={12} color="#00ffff" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {learnedSummary}
                  </span>
                </div>

                {/* Waveform & Speech Dialogue */}
                <div
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    overflowY: 'auto',
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(0, 255, 255, 0.03)',
                      border: '1px solid rgba(0, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '0 12px',
                    }}
                  >
                    {[...Array(24)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '3px',
                          height: isListening
                            ? `${Math.max(14, Math.sin((i + Date.now() / 150) * 0.5) * 32)}px`
                            : isSpeaking
                            ? `${Math.max(18, Math.sin((i + Date.now() / 100) * 0.8) * 36)}px`
                            : '5px',
                          borderRadius: '2px',
                          background: isListening
                            ? '#00ffff'
                            : isSpeaking
                            ? 'linear-gradient(180deg, #00ffff 0%, #3b82f6 100%)'
                            : 'rgba(255, 255, 255, 0.15)',
                          transition: 'height 0.1s ease',
                        }}
                      />
                    ))}
                  </div>

                  {replyText && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(0, 255, 255, 0.06)',
                        border: '1px solid rgba(0, 255, 255, 0.2)',
                        fontSize: '0.84rem',
                        color: '#e2e8f0',
                        lineHeight: 1.45,
                      }}
                    >
                      <div style={{ fontSize: '0.66rem', color: '#00ffff', fontWeight: 800, marginBottom: '4px' }}>
                        JARVIS RESPONSE
                      </div>
                      {replyText}
                    </div>
                  )}

                  {transcript && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '0.8rem',
                        color: '#94a3b8',
                        fontStyle: 'italic',
                      }}
                    >
                      <span style={{ color: '#00ffff', fontWeight: 700, fontStyle: 'normal' }}>Heard: </span>
                      &ldquo;{transcript}&rdquo;
                    </div>
                  )}
                </div>

                {/* Quick Action Chips */}
                <div
                  style={{
                    padding: '8px 16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                  }}
                >
                  {[
                    { label: '🤖 All Agents Mode B', cmd: 'turn all agents to mode b' },
                    { label: '3️⃣ First 3 to Mode B', cmd: 'turn first three agents to mode b' },
                    { label: '⚡ Run Audit', cmd: 'run audit' },
                    { label: '🔑 Change Password', cmd: 'change password' },
                    { label: '📚 Study Books', cmd: 'study software architecture and clean code' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => {
                        setTranscript(chip.cmd);
                        processCommand(chip.cmd);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '5px 10px',
                        color: '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Input Console */}
                <form
                  onSubmit={handleTextSubmit}
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(8, 10, 16, 0.98)',
                  }}
                >
                  <button
                    type="button"
                    onClick={toggleContinuousListening}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isContinuous ? '#10b981' : 'rgba(0, 255, 255, 0.15)',
                      border: isContinuous ? 'none' : '1px solid rgba(0, 255, 255, 0.3)',
                      color: isContinuous ? '#ffffff' : '#00ffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    title={isContinuous ? 'Pause Always-On Voice' : 'Activate Always-On Voice'}
                  >
                    {isContinuous ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>

                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="Command JARVIS or teach him a rule..."
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />

                  <button
                    type="submit"
                    disabled={!typedInput.trim()}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: typedInput.trim() ? '#00ffff' : 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      color: typedInput.trim() ? '#000000' : 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: typedInput.trim() ? 'pointer' : 'default',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: MEMORY VAULT & AUTONOMOUS SELF-STUDY */}
            {activeTab === 'memory' && (
              <div
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                {/* Header Action: Trigger Autonomous Self-Study */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    border: '1px solid rgba(0, 255, 255, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={17} color="#00ffff" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                        Autonomous Self-Study Engine
                      </span>
                    </div>

                    <button
                      onClick={() => triggerSelfStudy()}
                      disabled={isStudying}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#00ffff',
                        border: 'none',
                        color: '#000000',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: isStudying ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isStudying ? (
                        <>
                          <Loader2 size={12} className="hpa-spin" />
                          <span>Reading & Learning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          <span>Study Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    When you are away, JARVIS studies computer science books, TypeScript architecture, and Next.js optimization, storing actionable takeaways in permanent memory.
                  </p>
                </div>

                {/* Teach JARVIS Input Form */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="Teach JARVIS: e.g. One means one, always verify..."
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => teachRule(newRuleInput)}
                    disabled={!newRuleInput.trim()}
                    style={{
                      padding: '0 14px',
                      borderRadius: '8px',
                      background: newRuleInput.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      color: newRuleInput.trim() ? '#ffffff' : '#64748b',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: newRuleInput.trim() ? 'pointer' : 'default',
                    }}
                  >
                    Teach
                  </button>
                </div>

                {/* Stored Memories List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#00ffff', letterSpacing: '0.04em' }}>
                      LONG-TERM MEMORY ENTRIES ({memories.length})
                    </span>
                    <button
                      onClick={fetchMemories}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      title="Refresh"
                    >
                      <RotateCw size={12} className={loadingMemories ? 'hpa-spin' : ''} />
                    </button>
                  </div>

                  {loadingMemories && memories.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                      <Loader2 size={16} className="hpa-spin" style={{ margin: '0 auto 6px' }} />
                      Loading memory vault...
                    </div>
                  ) : (
                    memories.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          background:
                            m.category === 'teaching'
                              ? 'rgba(16, 185, 129, 0.06)'
                              : 'rgba(59, 130, 246, 0.06)',
                          border:
                            m.category === 'teaching'
                              ? '1px solid rgba(16, 185, 129, 0.25)'
                              : '1px solid rgba(59, 130, 246, 0.25)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: m.category === 'teaching' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                              color: m.category === 'teaching' ? '#34d399' : '#60a5fa',
                            }}
                          >
                            {m.category === 'teaching' ? "👑 Prince's Rule" : '📚 Self-Study'}
                          </span>
                          <span style={{ fontSize: '0.64rem', color: '#64748b' }}>
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h5 style={{ margin: '0 0 6px 0', fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                          {m.title}
                        </h5>

                        <p style={{ margin: 0, fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                          {m.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scoped CSS animations for JARVIS */}
      <style jsx global>{`
        @keyframes hpaSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes hpaPulse {
          0%,
          100% {
            opacity: 1;
            transform: translateY(0);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-2px);
          }
        }
        @keyframes hpaFadeUp {
          from {
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default JarvisAssistant;
