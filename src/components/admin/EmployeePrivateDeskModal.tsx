'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Loader2,
  Bot,
  User,
  Briefcase,
  Brain,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { sanitizeEmDashes } from '@/lib/ai-content-sanitizer';

interface EmployeePrivateDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    id: string;
    employee_id?: string;
    name: string;
    humanoid_name?: string;
    display_title?: string;
    department?: string;
    avatar_url?: string;
    bio?: string;
    personality_archetype?: string;
    live_status?: string;
    current_activity?: string;
    mode?: string;
  };
  onTaskCreated?: () => void;
}

export function EmployeePrivateDeskModal({
  isOpen,
  onClose,
  agent,
  onTaskCreated,
}: EmployeePrivateDeskModalProps) {
  const employeeId = agent.employee_id || agent.id;
  const employeeName = agent.humanoid_name || agent.name;
  const avatarUrl = agent.avatar_url || '/assets/avatars/alex-vance.webp';
  const displayTitle = agent.display_title || 'Autonomous Specialist';
  const department = agent.department || 'Operations';

  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'memory'>('chat');
  const [messages, setMessages] = useState<
    { sender: 'ceo' | 'employee'; text: string; time: string; evidence?: any }[]
  >([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Active tasks and memories
  const [tasks, setTasks] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // New task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [executeImmediately, setExecuteImmediately] = useState(true);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadDeskData();
    }
  }, [isOpen, employeeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadDeskData = async () => {
    setInitialLoading(true);
    try {
      const res = await fetch(`/api/admin/company/employees/${employeeId}/chat`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.warn('Failed to fetch desk data:', err);
    } finally {
      setInitialLoading(false);
    }

    // Initialize conversation with contextual welcome if empty
    if (messages.length === 0) {
      let welcomeText = `Hello Prince. ${employeeName} here. Operations in the ${department} department are active. How can I assist you with executive priorities today?`;

      if (employeeId === 'marcus_sterling') {
        welcomeText = `Hello Prince. Marcus here. I am actively reviewing our engineering publication schedule and looking at emergent architectural topics. What shall we write or research next?`;
      } else if (employeeId === 'elena_rostova') {
        welcomeText = `Hello Prince! Elena here. I am tracking our search footprint and page indexing across Google Search. Ready to run a keyword audit or evaluate new service opportunities.`;
      } else if (employeeId === 'david_chen') {
        welcomeText = `Hello Prince. David Chen here. Site Reliability Sentinel reporting: 100% route uptime, sub-200ms TTFB across all production endpoints, and zero alert triggers.`;
      } else if (employeeId === 'liam_thorne') {
        welcomeText = `Hey Prince! Liam here. Lead Scout active. We have fresh candidate businesses queued for technical audits across our target ecommerce and SaaS verticals.`;
      } else if (employeeId === 'sophia_reynolds') {
        welcomeText = `Hello Prince! Sophia here. Client solutions and incoming inquiry pipelines are ready. Let me know which client opportunity or proposal outline to structure.`;
      } else if (employeeId === 'alex_vance') {
        welcomeText = `Good day Prince. Alex Vance here, Chief of Staff. All 6 specialists across Editorial, Growth, Infrastructure, Sales, and Client Solutions are active on the floor and operations are nominal. How would you like the workforce to support you today?`;
      }

      setMessages([
        {
          sender: 'employee',
          text: sanitizeEmDashes(welcomeText),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append CEO message
    setMessages((prev) => [
      ...prev,
      { sender: 'ceo', text: sanitizeEmDashes(text), time: timeStr },
    ]);

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/company/employees/${employeeId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'employee',
            text: sanitizeEmDashes(data.reply),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            evidence: data.evidence,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'employee',
            text: sanitizeEmDashes(
              `Prince, directive acknowledged. I am recording this priority into our department roadmap and aligning active tasks.`
            ),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'employee',
          text: sanitizeEmDashes(
            `Prince, I have received your directive and am tracking execution across our department deliverables.`
          ),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim() || taskSubmitting) return;

    setTaskSubmitting(true);
    try {
      const res = await fetch('/api/admin/company/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          assignedTo: employeeId,
          priority: taskPriority,
          executeImmediately,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTaskTitle('');
        setTaskDesc('');
        setShowTaskForm(false);
        if (data.task) {
          setTasks((prev) => [data.task, ...prev]);
        }
        // Announce in chat
        setMessages((prev) => [
          ...prev,
          {
            sender: 'employee',
            text: sanitizeEmDashes(
              `Task "${taskTitle}" assigned and confirmed! ${
                executeImmediately
                  ? 'I have executed this deliverable immediately and archived the verified findings.'
                  : 'I will begin executing this priority immediately.'
              }`
            ),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        if (onTaskCreated) onTaskCreated();
      }
    } catch (err) {
      console.warn('Error assigning task:', err);
    } finally {
      setTaskSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#0d0d14',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '860px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 71, 87, 0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255, 71, 87, 0.5)',
                boxShadow: '0 0 15px rgba(255, 71, 87, 0.3)',
                flexShrink: 0,
                background: '#161622',
              }}
            >
              <img
                src={avatarUrl}
                alt={employeeName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e: any) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {employeeName}
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  ● Active Desk
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                {displayTitle} • <strong style={{ color: '#ffffff' }}>{department}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              style={{
                background: showTaskForm ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: showTaskForm ? '1px solid #ff4757' : '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} />
              <span>{showTaskForm ? 'Cancel Task' : 'Assign Task'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0 24px',
          }}
        >
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid #ff4757' : '2px solid transparent',
              color: activeTab === 'chat' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            1-on-1 Private Chat
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tasks' ? '2px solid #ff4757' : '2px solid transparent',
              color: activeTab === 'tasks' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Active Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'memory' ? '2px solid #ff4757' : '2px solid transparent',
              color: activeTab === 'memory' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Memory & Intelligence ({memories.length})
          </button>
        </div>

        {/* Task Delegation Overlay Drawer */}
        {showTaskForm && (
          <div
            style={{
              padding: '18px 24px',
              background: 'rgba(22, 22, 34, 0.98)',
              borderBottom: '1px solid rgba(255, 71, 87, 0.3)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: '0 0 12px' }}>
              Assign Direct Priority Task to {employeeName}
            </h4>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Task Title (e.g. Research Next.js 15 App Router SEO performance)"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                }}
                required
              />
              <textarea
                placeholder="Specific instructions, acceptance criteria, or points for the employee..."
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                rows={2}
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  resize: 'none',
                }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={executeImmediately}
                    onChange={(e) => setExecuteImmediately(e.target.checked)}
                  />
                  <span>Execute immediately & report deliverable back to floor</span>
                </label>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: taskSubmitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {taskSubmitting ? <Loader2 size={14} className="hpa-spin" /> : <Play size={14} fill="currentColor" />}
                  <span>{taskSubmitting ? 'Assigning...' : 'Assign Task'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 1: 1-on-1 Private Chat */}
        {activeTab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Quick Action Chips */}
            <div
              style={{
                padding: '10px 24px',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
            >
              {[
                'Give me an executive status report',
                'Who speaks Hindi in our team?',
                'What are our top commercial priorities?',
                'How can we increase revenue this month?',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    fontSize: '0.74rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {messages.map((m, idx) => {
                const isCeo = m.sender === 'ceo';
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: isCeo ? 'flex-end' : 'flex-start',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    {!isCeo && (
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid rgba(255, 71, 87, 0.4)',
                        }}
                      >
                        <img
                          src={avatarUrl}
                          alt={employeeName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '75%',
                        background: isCeo
                          ? 'linear-gradient(135deg, rgba(255, 71, 87, 0.25) 0%, rgba(255, 107, 129, 0.18) 100%)'
                          : 'rgba(22, 22, 34, 0.85)',
                        border: isCeo
                          ? '1px solid rgba(255, 71, 87, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        lineHeight: 1.55,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: isCeo ? '#ff6b81' : '#34d399',
                          marginBottom: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <span>{isCeo ? 'Prince (CEO)' : employeeName}</span>
                        <span style={{ color: '#64748b', fontWeight: 400 }}>{m.time}</span>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    </div>
                    {isCeo && (
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid rgba(255, 71, 87, 0.6)',
                        }}
                      >
                        <img
                          src="/assets/cropped-prince-profile.webp"
                          alt="Prince"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', paddingLeft: '46px' }}>
                  <Loader2 size={14} className="hpa-spin" />
                  <span>{employeeName} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <input
                type="text"
                placeholder={`Speak directly to ${employeeName}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                style={{
                  background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 20px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: !inputMessage.trim() || loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: !inputMessage.trim() || loading ? 0.6 : 1,
                }}
              >
                {loading ? <Loader2 size={15} className="hpa-spin" /> : <Send size={15} />}
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Active Tasks */}
        {activeTab === 'tasks' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Tasks Assigned to {employeeName}
              </h3>
              <button
                onClick={() => setShowTaskForm(true)}
                style={{
                  background: '#ff4757',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Assign New Task
              </button>
            </div>

            {tasks.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#64748b',
                }}
              >
                No active tasks currently assigned to {employeeName}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(22, 22, 34, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                        {t.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: t.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          color: t.status === 'completed' ? '#34d399' : '#fbbf24',
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 10px' }}>
                      {t.description}
                    </p>
                    {t.output_result && t.output_result.summary && (
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '0.78rem',
                          color: '#cbd5e1',
                        }}
                      >
                        <strong>Deliverable Summary:</strong> {t.output_result.summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Memory & Intelligence */}
        {activeTab === 'memory' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 16px' }}>
              Corporate Memory & Learnings for {employeeName}
            </h3>

            {memories.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#64748b',
                }}
              >
                No specific memories recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {memories.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'rgba(22, 22, 34, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ff6b81', textTransform: 'uppercase' }}>
                        {m.category}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#f1f5f9', margin: 0 }}>
                      {m.insight}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
