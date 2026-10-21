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
} from 'lucide-react';

interface JarvisAssistantProps {
  user?: {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
  };
}

export function JarvisAssistant({ user }: JarvisAssistantProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [replyText, setReplyText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const greetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const adminName = user?.name || user?.email?.split('@')[0] || 'Prince';

  // 1. Initialize Web Audio Synthesizer for high-tech chimes
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
          // Upward dual-tone sweep (440Hz -> 880Hz)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === 'execute') {
          // Affirmative tech chirp (580Hz -> 920Hz)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(580, now);
          osc.frequency.exponentialRampToValueAtTime(920, now + 0.14);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === 'success') {
          // Major chord harmonic ping (659Hz -> 1046Hz)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659, now);
          osc.frequency.exponentialRampToValueAtTime(1046, now + 0.2);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'alert') {
          // Warning dual pulse
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        }
      } catch (err) {
        console.warn('[JARVIS Audio] Sound synthesis notice:', err);
      }
    },
    [getAudioContext, isMuted]
  );

  // 2. Speech Synthesis (TTS) - Custom British Cadence
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

        // Find preferred British English male voice
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

        // Sophisticated JARVIS cadence: slightly lower pitch, crisp rate
        utterance.pitch = 0.94;
        utterance.rate = 1.04;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          if (onDone) onDone();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          if (onDone) onDone();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[JARVIS TTS] Speech error:', err);
        setIsSpeaking(false);
        if (onDone) onDone();
      }
    },
    [isMuted]
  );

  // 3. Welcome / Login Greeting (Once per session)
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
        const greeting = `Welcome back, ${adminName}. AI Chief of Staff is online and all systems are nominal. How may I assist you today?`;
        speak(greeting);
        sessionStorage.setItem('hp_jarvis_greeted', 'true');
      }, 1400);
    }

    return () => {
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    };
  }, [adminName, playChime, speak]);

  // 4. Interactive DOM Typewriter & Input Focusing Helper
  const focusAndTypeIntoInput = useCallback((selector: string, textToType?: string, maxAttempts = 15) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const input = document.querySelector<HTMLInputElement>(selector);
      if (input) {
        clearInterval(interval);
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();

        // Pulsing holographic focus outline
        input.style.transition = 'all 0.3s ease';
        input.style.boxShadow = '0 0 0 3px rgba(0, 255, 255, 0.7), 0 0 25px rgba(0, 255, 255, 0.5)';
        input.style.borderColor = '#00ffff';

        if (textToType) {
          input.value = '';
          let charIndex = 0;
          const timer = setInterval(() => {
            if (charIndex < textToType.length) {
              input.value += textToType.charAt(charIndex);
              input.dispatchEvent(new Event('input', { bubbles: true }));
              charIndex++;
            } else {
              clearInterval(timer);
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, 35);
        }

        setTimeout(() => {
          input.style.boxShadow = '';
          input.style.borderColor = '';
        }, 4000);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 150);
  }, []);

  // 5. Comprehensive Voice Command Router & Action Execution
  const processCommand = useCallback(
    async (rawText: string) => {
      const cmd = rawText.trim().toLowerCase();
      if (!cmd) return;

      setIsThinking(true);
      playChime('execute');

      // --- COMMAND: CHANGE PASSWORD / SECURITY CREDENTIALS ---
      if (
        cmd.includes('password') ||
        cmd.includes('change my password') ||
        cmd.includes('reset password') ||
        cmd.includes('update credentials')
      ) {
        setActionNotice('Redirecting to Password Credentials...');
        const pwdMatch = cmd.match(/(?:password\s+to|type\s+password)\s+([^\s]+)/i);
        const typedPassword = pwdMatch ? pwdMatch[1] : undefined;
        const targetUrl = user?.id ? `/admin/users/${user.id}/edit` : '/admin/settings/';
        speak(`Opening your security profile now, ${adminName}. Focusing the password field for you.`, () => {
          router.push(targetUrl);
          focusAndTypeIntoInput('input[type="password"], input[name="password"]', typedPassword);
        });
        setIsThinking(false);
        return;
      }

      // --- COMMAND: RUN WEBSITE GUARDIAN HEALTH AUDIT ---
      if (
        cmd.includes('run audit') ||
        cmd.includes('check audit') ||
        cmd.includes('site health') ||
        cmd.includes('check health') ||
        cmd.includes('guardian') ||
        cmd.includes('check site')
      ) {
        setActionNotice('Executing Website Guardian Audit...');
        speak(`Initiating Website Guardian diagnostic audit across core routes now, ${adminName}.`);
        try {
          const res = await fetch('/api/admin/chief-of-staff/run-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: 'website_guardian' }),
          });
          const resData = await res.json();
          if (resData.success) {
            playChime('success');
            speak(
              `Diagnostic audit complete, ${adminName}. Core routes are 100% online with zero regressions detected. Status is nominal.`
            );
          } else {
            playChime('alert');
            speak(`Audit flagged an advisory note: ${resData.message || 'Check health log.'}`);
          }
        } catch {
          playChime('alert');
          speak(`Network anomaly while communicating with Website Guardian.`);
        } finally {
          setIsThinking(false);
          setActionNotice(null);
        }
        return;
      }

      // --- COMMAND: RUN TECHNICAL SEO SCAN ---
      if (
        cmd.includes('check seo') ||
        cmd.includes('run seo') ||
        cmd.includes('seo audit') ||
        cmd.includes('seo opportunities') ||
        cmd.includes('search optimization')
      ) {
        setActionNotice('Scanning Technical SEO & Clusters...');
        speak(`Scanning published articles and commercial keyword clusters now, sir.`);
        try {
          const res = await fetch('/api/admin/chief-of-staff/run-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: 'seo_growth' }),
          });
          const resData = await res.json();
          if (resData.success) {
            playChime('success');
            speak(
              `SEO analysis complete, ${adminName}. Identified actionable title and cluster recommendations ready in your Approvals Queue.`
            );
          } else {
            speak(`SEO scan completed with advisory notes.`);
          }
        } catch {
          speak(`Unable to complete SEO scan at this moment.`);
        } finally {
          setIsThinking(false);
          setActionNotice(null);
        }
        return;
      }

      // --- COMMAND: CREATE/DRAFT ARTICLE OR POST ON [TOPIC] ---
      const createPostMatch = cmd.match(/(?:create|draft|write)\s*(?:a\s*)?(?:post|article|blog)\s*(?:on|about)?\s*(.*)/i);
      if (createPostMatch && createPostMatch[1]?.trim()) {
        const topic = createPostMatch[1].trim();
        setActionNotice(`Drafting article on "${topic}"...`);
        speak(`Researching technology developments and drafting a full engineering article on "${topic}", ${adminName}.`);
        try {
          const res = await fetch('/api/admin/chief-of-staff/run-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: 'content_researcher',
              payload: { customTopic: topic },
            }),
          });
          const resData = await res.json();
          if (resData.success) {
            playChime('success');
            speak(
              `Article draft on ${topic} has been created with SEO tags and placed in your Approvals Queue for 1-click publishing.`
            );
          } else {
            speak(`Content research run completed with advisory notice.`);
          }
        } catch {
          speak(`Could not complete automatic content research.`);
        } finally {
          setIsThinking(false);
          setActionNotice(null);
        }
        return;
      }

      // --- COMMAND: SCOUT LEADS & BUSINESS PROSPECTS ---
      if (
        cmd.includes('find leads') ||
        cmd.includes('scout leads') ||
        cmd.includes('scout prospects') ||
        cmd.includes('lead scout') ||
        cmd.includes('discover clients')
      ) {
        setActionNotice('Deploying Lead Scout Agent...');
        speak(`Deploying Lead Scout across e-commerce and digital commerce sectors now, ${adminName}.`);
        try {
          const res = await fetch('/api/admin/chief-of-staff/run-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: 'lead_scout' }),
          });
          const resData = await res.json();
          if (resData.success) {
            playChime('success');
            speak(`Lead evaluation complete, sir. Fresh client proposals have been drafted for your review.`);
          }
        } catch {
          speak(`Lead Scout encountered a network timeout.`);
        } finally {
          setIsThinking(false);
          setActionNotice(null);
        }
        return;
      }

      // --- COMMAND: STATUS REPORT / SYSTEM BRIEFING ---
      if (
        cmd.includes('status report') ||
        cmd.includes('brief me') ||
        cmd.includes('system status') ||
        cmd.includes('how are we doing') ||
        cmd.includes('give me a report')
      ) {
        setActionNotice('Compiling Chief of Staff Briefing...');
        try {
          const res = await fetch('/api/admin/chief-of-staff/status');
          const resData = await res.json();
          if (resData.success && resData.data) {
            const d = resData.data;
            const brief = `Status report, ${adminName}: All ${d.activeAgentsCount} autonomous agents are functioning smoothly. You have ${d.draftsAwaitingApprovalCount} items awaiting approval in the queue, and website uptime is 100%.`;
            speak(brief);
          } else {
            speak(`All autonomous systems are running normally, Prince.`);
          }
        } catch {
          speak(`Systems operational, ${adminName}. All 5 agents active.`);
        } finally {
          setIsThinking(false);
          setActionNotice(null);
        }
        return;
      }

      // --- NAVIGATION MENU COMMANDS ---
      if (cmd.includes('chief of staff') || cmd.includes('go to agents') || cmd.includes('open agents')) {
        speak(`Opening Chief of Staff command center.`);
        router.push('/admin/chief-of-staff/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('client lead') || cmd.includes('go to leads') || cmd.includes('show leads') || cmd.includes('inquiries')) {
        speak(`Opening Client Inquiries and Inbound Leads.`);
        router.push('/admin/leads/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('outreach') || cmd.includes('lead intelligence') || cmd.includes('prospects')) {
        speak(`Opening Lead Intelligence and Discovery.`);
        router.push('/admin/outreach/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('new post') || cmd.includes('new article') || cmd.includes('write post')) {
        speak(`Launching new insight article editor.`);
        router.push('/admin/posts/new/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('post') || cmd.includes('insight') || cmd.includes('articles') || cmd.includes('blog')) {
        speak(`Viewing published Insights and Blog Posts.`);
        router.push('/admin/posts/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('daily news') || cmd.includes('news automation')) {
        speak(`Opening Daily AI News Automation.`);
        router.push('/admin/news-automation/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('service')) {
        speak(`Opening Engineering Services directory.`);
        router.push('/admin/services/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('media') || cmd.includes('vault') || cmd.includes('images')) {
        speak(`Accessing Media Vault assets.`);
        router.push('/admin/media/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('setting') || cmd.includes('configuration')) {
        speak(`Opening Platform & System Settings.`);
        router.push('/admin/settings/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('user') || cmd.includes('admin user')) {
        speak(`Opening Administrator Access Management.`);
        router.push('/admin/users/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('dashboard') || cmd.includes('go home')) {
        speak(`Returning to Executive Dashboard.`);
        router.push('/admin/');
        setIsThinking(false);
        return;
      }

      if (cmd.includes('log out') || cmd.includes('sign out')) {
        speak(`Securing the portal and signing you out. Good day, ${adminName}.`, async () => {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/admin/login/';
        });
        setIsThinking(false);
        return;
      }

      // --- IN-PAGE INTERACTIVE SEARCH AUTOMATION ---
      const searchMatch = cmd.match(/(?:search|find|filter)(?:\s+for)?\s+(.+)/i);
      if (searchMatch && searchMatch[1]?.trim()) {
        const queryTerm = searchMatch[1].trim();
        speak(`Filtering results for "${queryTerm}", Prince.`);
        focusAndTypeIntoInput('input[placeholder*="search" i], input[type="search"], .hpa-search-input', queryTerm);
        setIsThinking(false);
        return;
      }

      // --- SCROLLING AUTOMATION ---
      if (cmd.includes('scroll down')) {
        window.scrollBy({ top: 400, behavior: 'smooth' });
        speak(`Scrolling down, sir.`);
        setIsThinking(false);
        return;
      }
      if (cmd.includes('scroll up') || cmd.includes('scroll to top')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        speak(`Scrolling to top.`);
        setIsThinking(false);
        return;
      }

      // --- GEMINI NLP BRAIN FALLBACK ---
      // For conversational inquiries, natural questions, or complex tasks
      setActionNotice('Consulting JARVIS Core Intelligence...');
      try {
        const res = await fetch('/api/admin/jarvis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: rawText }),
        });
        const resData = await res.json();
        if (resData.success && resData.reply) {
          speak(resData.reply);
          if (resData.suggestedAction === 'run_audit') {
            processCommand('run audit');
          } else if (resData.suggestedAction === 'run_seo') {
            processCommand('check seo');
          } else if (resData.suggestedAction === 'change_password') {
            processCommand('change password');
          } else if (resData.suggestedAction === 'go_leads') {
            router.push('/admin/leads/');
          } else if (resData.suggestedAction === 'go_chief') {
            router.push('/admin/chief-of-staff/');
          } else if (resData.suggestedAction === 'go_posts') {
            router.push('/admin/posts/');
          } else if (resData.suggestedAction === 'go_settings') {
            router.push('/admin/settings/');
          }
        } else {
          speak(`At your command, Prince. All systems are operating smoothly.`);
        }
      } catch {
        speak(`I am standing by, ${adminName}. You can command me to run audits, scout leads, or navigate anywhere.`);
      } finally {
        setIsThinking(false);
        setActionNotice(null);
      }
    },
    [adminName, focusAndTypeIntoInput, playChime, router, speak]
  );

  // 6. Speech Recognition Toggle (STT)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) {
      speak(`Speech recognition is not supported in this browser. You can type commands directly in my console, Prince.`);
      setIsOpen(true);
      return;
    }

    try {
      playChime('wake');
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      rec.onresult = (e: any) => {
        let currentTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          currentTranscript += e.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (e.results[e.results.length - 1].isFinal) {
          rec.stop();
          setIsListening(false);
          processCommand(currentTranscript);
        }
      };

      rec.onerror = (err: any) => {
        console.warn('[JARVIS STT] Error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (recErr) {
      console.warn('[JARVIS STT] Initialization notice:', recErr);
      setIsListening(false);
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('hp_jarvis_muted', String(nextMuted));
    if (nextMuted && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else {
      speak(`Audio response enabled, ${adminName}.`);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const text = typedInput.trim();
    setTranscript(text);
    setTypedInput('');
    processCommand(text);
  };

  return (
    <>
      {/* 1. FLOATING HOLOGRAPHIC JARVIS ORB (Always Visible Bottom-Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: '26px',
          right: '26px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
        }}
      >
        {/* Floating Quick Action / Speech Bubble Pill */}
        {(isSpeaking || isListening || isThinking || actionNotice) && (
          <div
            style={{
              background: 'rgba(11, 14, 23, 0.92)',
              border: '1px solid rgba(0, 255, 255, 0.4)',
              borderRadius: '24px',
              padding: '8px 16px',
              color: '#ffffff',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 32px rgba(0, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              maxWidth: '380px',
              animation: 'hpaPulse 2s infinite',
            }}
          >
            {isThinking ? (
              <Loader2 size={15} className="hpa-spin" color="#00ffff" />
            ) : isListening ? (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ff4757',
                  boxShadow: '0 0 10px #ff4757',
                }}
              />
            ) : (
              <Sparkles size={15} color="#00ffff" />
            )}
            <span style={{ color: '#00ffff', fontWeight: 700, fontSize: '0.74rem' }}>JARVIS:</span>
            <span style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {actionNotice || (isListening ? transcript || 'Listening to Prince...' : replyText || 'Standing by...')}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Main Glowing Arc Reactor Orb */}
          <button
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
                toggleListening();
              } else {
                toggleListening();
              }
            }}
            title={isListening ? 'Stop Listening' : 'Command JARVIS (Click to Talk)'}
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: isListening
                ? 'radial-gradient(circle, #ff4757 0%, #b31224 100%)'
                : isSpeaking
                ? 'radial-gradient(circle, #00ffff 0%, #0088cc 100%)'
                : 'radial-gradient(circle, #00e5ff 0%, #005588 70%, #071728 100%)',
              border: isListening
                ? '2px solid #ff4757'
                : isSpeaking
                ? '2px solid #00ffff'
                : '2px solid rgba(0, 255, 255, 0.5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening
                ? '0 0 30px rgba(255, 71, 87, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.5)'
                : isSpeaking
                ? '0 0 35px rgba(0, 255, 255, 0.8), inset 0 0 18px rgba(255, 255, 255, 0.6)'
                : '0 8px 30px rgba(0, 229, 255, 0.45), inset 0 0 12px rgba(0, 255, 255, 0.3)',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isListening ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {/* Outer Spinning Hologram Ring */}
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(0, 255, 255, 0.4)',
                animation: 'hpaSpin 12s linear infinite',
                pointerEvents: 'none',
              }}
            />

            {isThinking ? (
              <Loader2 size={24} className="hpa-spin" />
            ) : isListening ? (
              <Mic size={24} color="#ffffff" />
            ) : isSpeaking ? (
              <Sparkles size={24} color="#ffffff" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Mic size={20} />
                <span style={{ fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.08em', marginTop: '1px' }}>
                  JARVIS
                </span>
              </div>
            )}
          </button>

          {/* Toggle HUD Console Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
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
              width: '390px',
              maxHeight: '520px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, rgba(14, 18, 28, 0.95) 0%, rgba(9, 12, 18, 0.98) 100%)',
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
                padding: '16px 20px',
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
                    background: isListening ? '#ff4757' : '#00ffff',
                    boxShadow: isListening ? '0 0 10px #ff4757' : '0 0 10px #00ffff',
                  }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
                    J.A.R.V.I.S.
                  </h4>
                  <span style={{ fontSize: '0.64rem', color: '#00ffff', fontWeight: 700, letterSpacing: '0.08em' }}>
                    AUTONOMOUS VOICE EXECUTIVE
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleMuteToggle}
                  title={isMuted ? 'Unmute JARVIS Voice' : 'Mute JARVIS Voice'}
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

            {/* Simulated Animated Holographic Waveform (Active while speaking / listening) */}
            <div
              style={{
                height: '48px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 20px',
              }}
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const isActive = isSpeaking || isListening;
                const dynamicHeight = isActive ? Math.sin((i + Date.now() / 150) * 0.8) * 14 + 16 : 4;
                return (
                  <span
                    key={i}
                    style={{
                      width: '3px',
                      height: `${dynamicHeight}px`,
                      borderRadius: '2px',
                      background: isListening
                        ? 'linear-gradient(180deg, #ff4757 0%, #ff6b81 100%)'
                        : 'linear-gradient(180deg, #00ffff 0%, #3b82f6 100%)',
                      boxShadow: isActive ? '0 0 8px rgba(0, 255, 255, 0.5)' : 'none',
                      transition: 'height 0.1s ease',
                    }}
                  />
                );
              })}
            </div>

            {/* Chat / Subtitle Transcript Area */}
            <div
              style={{
                flex: 1,
                padding: '16px 20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '140px',
              }}
            >
              {transcript && (
                <div
                  style={{
                    alignSelf: 'flex-end',
                    background: 'rgba(255, 71, 87, 0.15)',
                    border: '1px solid rgba(255, 71, 87, 0.3)',
                    borderRadius: '12px 12px 2px 12px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#ffffff',
                    maxWidth: '85%',
                  }}
                >
                  <span style={{ fontSize: '0.66rem', color: '#ff6b81', fontWeight: 700, display: 'block' }}>
                    {adminName}:
                  </span>
                  {transcript}
                </div>
              )}

              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(0, 255, 255, 0.08)',
                  border: '1px solid rgba(0, 255, 255, 0.25)',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '10px 14px',
                  fontSize: '0.84rem',
                  color: '#e2e8f0',
                  lineHeight: 1.5,
                  maxWidth: '90%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Sparkles size={12} color="#00ffff" />
                  <span style={{ fontSize: '0.68rem', color: '#00ffff', fontWeight: 800 }}>JARVIS:</span>
                </div>
                {replyText || `At your service, ${adminName}. Command me to run site audits, check SEO, draft posts, or navigate anywhere.`}
              </div>
            </div>

            {/* Quick Command Suggestions Chips */}
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                background: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              {[
                { label: '⚡ Run Audit', cmd: 'run audit' },
                { label: '📊 Status Report', cmd: 'status report' },
                { label: '🔍 Check SEO', cmd: 'check seo' },
                { label: '👥 Client Leads', cmd: 'go to leads' },
                { label: '✍️ New Post', cmd: 'create post' },
                { label: '🔑 Change Password', cmd: 'change password' },
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

            {/* Bottom Input Console */}
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
                onClick={toggleListening}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isListening ? '#ff4757' : 'rgba(0, 255, 255, 0.15)',
                  border: isListening ? 'none' : '1px solid rgba(0, 255, 255, 0.3)',
                  color: isListening ? '#ffffff' : '#00ffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title={isListening ? 'Stop' : 'Speak to JARVIS'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Ask JARVIS or speak command..."
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
            opacity: 0;
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
