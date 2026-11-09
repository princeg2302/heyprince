'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '@/styles/company-office.css';
import {
  Building2,
  Users,
  MessageSquare,
  CheckSquare,
  ShieldCheck,
  Brain,
  PlusCircle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Send,
  Zap,
  Activity,
  Award,
  Layers,
  Cpu,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Settings,
  Flame,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import {
  CompanyEmployee,
  CompanyRoom,
  CompanyDiscussion,
  CompanyMessage,
  CompanyTask,
  CompanyProposal,
  CompanyMemory,
  CompanyOverviewSummary,
  EmployeeStatus,
} from '@/lib/company/types';

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string; dot: string }> = {
  idle: { label: 'Idle / Available', color: 'text-zinc-400 bg-zinc-800/80 border-zinc-700', dot: 'bg-zinc-400' },
  thinking: { label: 'Thinking', color: 'text-amber-400 bg-amber-950/40 border-amber-800', dot: 'bg-amber-400 animate-pulse' },
  researching: { label: 'Researching', color: 'text-blue-400 bg-blue-950/40 border-blue-800', dot: 'bg-blue-400 animate-pulse' },
  in_meeting: { label: 'In Meeting', color: 'text-purple-400 bg-purple-950/40 border-purple-800', dot: 'bg-purple-400 animate-ping' },
  working: { label: 'Executing Task', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800', dot: 'bg-emerald-400' },
  waiting_for_approval: { label: 'Waiting for CEO', color: 'text-orange-400 bg-orange-950/40 border-orange-800', dot: 'bg-orange-400' },
  blocked: { label: 'Blocked', color: 'text-red-400 bg-red-950/40 border-red-800', dot: 'bg-red-400' },
  reviewing: { label: 'Peer Reviewing', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800', dot: 'bg-cyan-400' },
  offline: { label: 'Draft / Offline', color: 'text-zinc-500 bg-zinc-900 border-zinc-800', dot: 'bg-zinc-600' },
};

export default function CompanyOfficeClient() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'office' | 'workforce' | 'tasks' | 'proposals' | 'memory'>('office');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [overview, setOverview] = useState<CompanyOverviewSummary | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<CompanyRoom | null>(null);
  const [activeDiscussion, setActiveDiscussion] = useState<CompanyDiscussion | null>(null);
  const [messages, setMessages] = useState<CompanyMessage[]>([]);
  const [tasks, setTasks] = useState<CompanyTask[]>([]);
  const [proposals, setProposals] = useState<CompanyProposal[]>([]);
  const [memoryItems, setMemoryItems] = useState<CompanyMemory[]>([]);

  // Action states
  const [advancingTurn, setAdvancingTurn] = useState(false);
  const [concludingMeeting, setConcludingMeeting] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(null);

  // CEO Chat Directive Input
  const [ceoInput, setCeoInput] = useState('');
  const [sendingCeoMessage, setSendingCeoMessage] = useState(false);

  // Modals
  const [newMeetingModalOpen, setNewMeetingModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingObjective, setNewMeetingObjective] = useState('');
  const [newMeetingRoomId, setNewMeetingRoomId] = useState('company_hq');
  const [newMeetingParticipants, setNewMeetingParticipants] = useState<string[]>([]);
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  const [newEmployeeModalOpen, setNewEmployeeModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Growth');
  const [newEmpGap, setNewEmpGap] = useState('');
  const [newEmpJustification, setNewEmpJustification] = useState('');
  const [draftingEmployee, setDraftingEmployee] = useState(false);

  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<CompanyEmployee | null>(null);

  // Clear Chat & Clear Memory Modals & States
  const [clearChatConfirmOpen, setClearChatConfirmOpen] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [clearMemoryConfirmOpen, setClearMemoryConfirmOpen] = useState(false);
  const [clearingMemory, setClearingMemory] = useState(false);

  // Assign Task Modal & States
  const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('marcus_sterling');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [taskAcceptanceCriteria, setTaskAcceptanceCriteria] = useState('Deliver concrete technical analysis, Provide verified production recommendations');
  const [taskExecuteImmediately, setTaskExecuteImmediately] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);

  // Task Detail Modal (view deliverable & findings)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<CompanyTask | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load
  const fetchCompanyData = async () => {
    try {
      const res = await fetch('/api/admin/company/overview');
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        const hqRoom = json.data.rooms?.find((r: CompanyRoom) => r.id === 'company_hq') || json.data.rooms?.[0];
        if (hqRoom) {
          setSelectedRoom(hqRoom);
        }
      }
    } catch {
      showToast('Error loading AI Company overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/company/tasks');
      const json = await res.json();
      if (json.success) setTasks(json.tasks || []);
    } catch {}
  };

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/admin/company/proposals');
      const json = await res.json();
      if (json.success) setProposals(json.proposals || []);
    } catch {}
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/admin/company/memory');
      const json = await res.json();
      if (json.success) setMemoryItems(json.memory || []);
    } catch {}
  };

  useEffect(() => {
    fetchCompanyData();
    fetchTasks();
    fetchProposals();
    fetchMemory();
  }, []);

  // Scroll to bottom of message list when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Room Selection & Discussion Loading (Unified Company Floor)
  useEffect(() => {
    const loadRoomDiscussion = async () => {
      try {
        const roomId = selectedRoom?.id || 'company_hq';
        const res = await fetch(`/api/admin/company/discussions?roomId=${roomId}`);
        const json = await res.json();
        if (json.success && json.discussion) {
          setActiveDiscussion(json.discussion);
          const mRes = await fetch(`/api/admin/company/discussions/${json.discussion.id}`);
          const mJson = await mRes.json();
          if (mJson.success) {
            setMessages(mJson.messages || []);
          }
        } else {
          setActiveDiscussion(null);
          setMessages([]);
        }
      } catch {
        setActiveDiscussion(null);
        setMessages([]);
      }
    };

    loadRoomDiscussion();
  }, [selectedRoom]);

  // 3. Resilient Real-Time Polling for Company Chat
  useEffect(() => {
    if (!activeDiscussion) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/company/discussions/${activeDiscussion.id}`);
        const json = await res.json();
        if (json.success) {
          if (json.discussion) setActiveDiscussion(json.discussion);
          if (json.messages && json.messages.length !== messages.length) {
            setMessages(json.messages);
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [activeDiscussion?.id, messages.length]);

  // 4. Meeting Controls
  const handleAdvanceTurn = async () => {
    if (!activeDiscussion) return;
    setAdvancingTurn(true);
    try {
      const res = await fetch(`/api/admin/company/discussions/${activeDiscussion.id}/turn`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        if (json.message) {
          setMessages((prev) => [...prev, json.message]);
        }
        if (json.status === 'concluded') {
          showToast('Meeting reached consensus and adjourned!', 'success');
          setActiveDiscussion((prev) => (prev ? { ...prev, status: 'concluded' } : null));
          fetchCompanyData();
          fetchProposals();
        }
      } else {
        showToast(json.error || 'Failed to advance turn', 'error');
      }
    } catch {
      showToast('Network error advancing turn', 'error');
    } finally {
      setAdvancingTurn(false);
    }
  };

  const handleConcludeMeeting = async () => {
    if (!activeDiscussion) return;
    setConcludingMeeting(true);
    try {
      const res = await fetch(`/api/admin/company/discussions/${activeDiscussion.id}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'conclude' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Meeting concluded. Executive proposal generated for Prince!', 'success');
        setActiveDiscussion((prev) => (prev ? { ...prev, status: 'concluded' } : null));
        fetchCompanyData();
        fetchProposals();
      }
    } catch {
      showToast('Failed to conclude meeting', 'error');
    } finally {
      setConcludingMeeting(false);
    }
  };

  const handleSendCeoMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDiscussion || !ceoInput.trim() || sendingCeoMessage) return;

    const text = ceoInput.trim();
    setCeoInput('');
    setSendingCeoMessage(true);

    const tempMsg: CompanyMessage = {
      id: Date.now(),
      discussion_id: activeDiscussion.id,
      sender_id: 'prince_ceo',
      sender_name: 'Prince (CEO)',
      sender_role: 'Chief Executive Officer',
      sender_avatar: '/assets/cropped-prince-profile.webp',
      message_type: 'statement',
      content: text,
      evidence: {},
      tokens_used: 10,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/admin/company/discussions/${activeDiscussion.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (json.success) {
        const incoming: CompanyMessage[] = [];
        if (json.agentResponse) incoming.push(json.agentResponse);
        if (Array.isArray(json.additionalResponses)) {
          incoming.push(...json.additionalResponses);
        }
        if (incoming.length > 0) {
          setMessages((prev) => [...prev, ...incoming]);
        }
        fetchCompanyData();
      } else {
        showToast(json.error || 'Failed to deliver directive', 'error');
      }
    } catch {
      showToast('Network error delivering directive', 'error');
    } finally {
      setSendingCeoMessage(false);
    }
  };

  const handleStartNewMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle || !newMeetingObjective) {
      showToast('Please provide an agenda title and strategic objective.', 'error');
      return;
    }

    setCreatingMeeting(true);
    try {
      const res = await fetch('/api/admin/company/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'company_hq',
          title: newMeetingTitle,
          objective: newMeetingObjective,
          participantIds: ['alex_vance', 'elena_rostova', 'marcus_sterling', 'liam_thorne', 'david_chen', 'sophia_reynolds'],
        }),
      });
      const json = await res.json();
      if (json.success && json.discussion) {
        showToast(`Company Floor agenda updated: "${newMeetingTitle}"!`, 'success');
        setActiveDiscussion(json.discussion);
        setNewMeetingModalOpen(false);
        setNewMeetingTitle('');
        setNewMeetingObjective('');
        fetchCompanyData();
      } else {
        showToast(json.error || 'Failed to update agenda', 'error');
      }
    } catch {
      showToast('Network error updating agenda', 'error');
    } finally {
      setCreatingMeeting(false);
    }
  };

  // 5. Task & Proposal Actions
  const handleExecuteTask = async (taskId: string) => {
    setExecutingTaskId(taskId);
    try {
      const res = await fetch(`/api/admin/company/tasks/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        fetchTasks();
        fetchCompanyData();
      } else {
        showToast(json.error || 'Task execution failed', 'error');
      }
    } catch {
      showToast('Network error executing task', 'error');
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleProposalAction = async (proposalId: string, action: 'approved' | 'rejected') => {
    setApprovingProposalId(proposalId);
    try {
      const res = await fetch(`/api/admin/company/proposals/${proposalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, autoExecute: true }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Proposal ${action} successfully!`, 'success');
        fetchProposals();
        fetchCompanyData();
      } else {
        showToast(json.error || 'Failed to update proposal', 'error');
      }
    } catch {
      showToast('Network error updating proposal', 'error');
    } finally {
      setApprovingProposalId(null);
    }
  };

  // 6. Workforce Builder Submit
  const handleDraftEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpTitle || !newEmpGap) {
      showToast('Please fill all required employee fields.', 'error');
      return;
    }
    setDraftingEmployee(true);
    try {
      const res = await fetch('/api/admin/company/workforce-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEmpName,
          displayTitle: newEmpTitle,
          department: newEmpDept,
          capabilityGap: newEmpGap,
          businessJustification: newEmpJustification,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Drafted AI Employee "${newEmpName}". CEO approval proposal queued!`, 'success');
        setNewEmployeeModalOpen(false);
        setNewEmpName('');
        setNewEmpTitle('');
        setNewEmpGap('');
        setNewEmpJustification('');
        fetchCompanyData();
        fetchProposals();
      } else {
        showToast(json.error || 'Failed to draft employee', 'error');
      }
    } catch {
      showToast('Network error drafting employee', 'error');
    } finally {
      setDraftingEmployee(false);
    }
  };

  // 7. Clear Floor Chat
  const handleClearFloorChat = async () => {
    if (!activeDiscussion) return;
    setClearingChat(true);
    try {
      const res = await fetch(`/api/admin/company/discussions/${activeDiscussion.id}/message`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Company Floor chat timeline cleared and synchronized.', 'success');
        setClearChatConfirmOpen(false);
        const mRes = await fetch(`/api/admin/company/discussions/${activeDiscussion.id}`);
        const mJson = await mRes.json();
        if (mJson.success) {
          setMessages(mJson.messages || []);
        }
        fetchCompanyData();
      } else {
        showToast(json.error || 'Failed to clear timeline', 'error');
      }
    } catch {
      showToast('Network error clearing timeline', 'error');
    } finally {
      setClearingChat(false);
    }
  };

  // 8. Delete Individual Memory Entry
  const handleDeleteMemoryItem = async (memoryId: string) => {
    try {
      const res = await fetch(`/api/admin/company/memory?id=${memoryId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setMemoryItems((prev) => prev.filter((m) => m.id !== memoryId));
        showToast('Memory entry removed from Corporate Brain.', 'success');
      } else {
        showToast(json.error || 'Failed to delete memory item', 'error');
      }
    } catch {
      showToast('Network error deleting memory item', 'error');
    }
  };

  // 9. Clear All Memory
  const handleClearAllMemory = async () => {
    setClearingMemory(true);
    try {
      const res = await fetch('/api/admin/company/memory?id=all', {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setMemoryItems([]);
        setClearMemoryConfirmOpen(false);
        showToast('Corporate Brain memory cleared.', 'success');
      } else {
        showToast(json.error || 'Failed to clear memory', 'error');
      }
    } catch {
      showToast('Network error clearing memory', 'error');
    } finally {
      setClearingMemory(false);
    }
  };

  // 10. Assign Task to Specialist with Immediate Execution
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDescription.trim()) {
      showToast('Please provide a task title and detailed point / instructions.', 'error');
      return;
    }

    setSubmittingTask(true);
    try {
      const criteriaList = taskAcceptanceCriteria
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/company/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          assignedTo: taskAssignedTo,
          priority: taskPriority,
          acceptanceCriteria: criteriaList.length > 0 ? criteriaList : ['Execute deliverable to enterprise quality standards', 'Validate output metrics and findings'],
          executeImmediately: taskExecuteImmediately,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const emp = employees.find((e) => e.id === taskAssignedTo);
        const empName = emp ? emp.name : taskAssignedTo;
        if (json.executed) {
          showToast(`Task assigned to ${empName} and executed immediately! Update posted to Company Floor.`, 'success');
        } else {
          showToast(`Task assigned to ${empName}!`, 'success');
        }

        setAssignTaskModalOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskAssignedTo('marcus_sterling');
        setTaskPriority('high');
        setTaskAcceptanceCriteria('Deliver concrete technical analysis, Provide verified production recommendations');
        fetchTasks();
        fetchCompanyData();

        // Refresh Floor messages to display the immediate completion notice
        if (activeDiscussion) {
          const mRes = await fetch(`/api/admin/company/discussions/${activeDiscussion.id}`);
          const mJson = await mRes.json();
          if (mJson.success) {
            setMessages(mJson.messages || []);
          }
        }
      } else {
        showToast(json.error || 'Failed to assign task', 'error');
      }
    } catch {
      showToast('Network error assigning task', 'error');
    } finally {
      setSubmittingTask(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-mono tracking-wide">Syncing HeyPrince Autonomous AI Company...</p>
      </div>
    );
  }

  const employees = overview?.employees || [];
  const rooms = overview?.rooms || [];

  return (
    <div className="co-root">
      {/* ==================================================================== */}
      {/* EXECUTIVE HEADER & METRICS                                          */}
      {/* ==================================================================== */}
      <div className="co-header-banner">
        <div className="co-header-top">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="co-badge-pill">
              <Building2 style={{ width: 14, height: 14, color: '#c084fc' }} />
              HeyPrince Autonomous AI Company
            </div>
            <div className="co-title-row">
              <h1 className="co-title">Executive Virtual Office</h1>
              <span className="co-live-tag">SOVEREIGN WORKFORCE LIVE</span>
            </div>
            <p className="co-subtitle">
              Prince is CEO. Alex Vance (Chief of Staff) orchestrates 6 autonomous specialists on the unified company floor.
              Strategy, opportunity research, and internal planning are continuous in one shared timeline; all external and production changes require your direct sign-off.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="co-stats-grid">
            <div className="co-stat-box">
              <div className="co-stat-num">{employees.length}</div>
              <div className="co-stat-label">Specialists</div>
            </div>
            <div className="co-stat-box">
              <div className="co-stat-num" style={{ color: '#c084fc' }}>{messages.length}</div>
              <div className="co-stat-label">Floor Messages</div>
            </div>
            <div className="co-stat-box">
              <div className="co-stat-num" style={{ color: '#fbbf24' }}>{overview?.pendingProposalsCount || 0}</div>
              <div className="co-stat-label">CEO Approval</div>
            </div>
            <div className="co-stat-box">
              <div className="co-stat-num" style={{ color: '#34d399' }}>{overview?.openTasksCount || 0}</div>
              <div className="co-stat-label">Open Tasks</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="co-tabs-bar">
          {[
            { id: 'office', label: 'Company Floor (All-Hands HQ)', icon: Building2 },
            { id: 'workforce', label: 'Employee Identities', icon: Users },
            { id: 'tasks', label: 'Task Matrix', icon: CheckSquare, badge: overview?.openTasksCount },
            { id: 'proposals', label: 'CEO Approval Gate', icon: ShieldCheck, badge: overview?.pendingProposalsCount, badgeColor: '#f59e0b' },
            { id: 'memory', label: 'Company Brain & Memory', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`co-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon style={{ width: 16, height: 16 }} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="co-tab-badge"
                    style={{ background: tab.badgeColor || 'rgba(0,0,0,0.5)' }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: UNIFIED VIRTUAL OFFICE FLOOR & LIVE ALL-HANDS COLLABORATION  */}
      {/* ==================================================================== */}
      {activeTab === 'office' && (
        <div className="co-office-layout">
          {/* Left Column: Unified Floor Focus & Workforce Roster */}
          <div className="co-sidebar-pane">
            {/* Unified Company Floor Card */}
            <div className="co-floor-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="co-floor-badge">
                  <span className="co-dot co-dot-in_meeting" />
                  All-Hands Unified HQ
                </span>
                <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700, fontFamily: 'monospace' }}>
                  {messages.length} Messages
                </span>
              </div>

              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 2px 0' }}>
                  HeyPrince Company Floor
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--co-text-muted)', margin: 0, lineHeight: 1.45 }}>
                  Unified collaboration space where Prince (CEO) and all 6 AI specialists continuously research opportunities, debate strategy, critique execution, and advance company growth.
                </p>
              </div>

              {/* Current Strategic Focus */}
              <div className="co-floor-objective-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c084fc' }}>
                    Active Strategic Agenda
                  </span>
                  <button
                    onClick={() => {
                      setNewMeetingRoomId('company_hq');
                      setNewMeetingTitle(activeDiscussion?.title || 'HeyPrince Autonomous AI Company Floor');
                      setNewMeetingObjective(activeDiscussion?.objective || 'Continuous all-hands collaboration, strategic growth, technical execution, and CEO directives');
                      setNewMeetingModalOpen(true);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Update Focus
                  </button>
                </div>
                <h3 className="co-floor-objective-title">
                  {activeDiscussion ? activeDiscussion.title : 'HeyPrince Autonomous AI Company Floor'}
                </h3>
                <p className="co-floor-objective-desc">
                  {activeDiscussion?.objective || 'Continuous all-hands collaboration, strategic growth, technical execution, and CEO directives'}
                </p>
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={handleAdvanceTurn}
                  disabled={advancingTurn}
                  className="co-btn co-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {advancingTurn ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Play style={{ width: 14, height: 14 }} />}
                  Hear Next Specialist Perspective
                </button>
                <button
                  onClick={handleConcludeMeeting}
                  disabled={concludingMeeting}
                  className="co-btn co-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {concludingMeeting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 14, height: 14, color: '#34d399' }} />}
                  Synthesize Consensus & Proposals
                </button>
              </div>
            </div>

            {/* Quick Live Workforce Roster */}
            <div className="co-agents-pane">
              <div className="co-pane-header" style={{ marginBottom: '12px' }}>
                <h3 className="co-pane-title">
                  <Users style={{ width: 15, height: 15, color: '#38bdf8' }} />
                  Workforce Roster ({employees.length})
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>
                  Active on Floor
                </span>
              </div>
              <div className="co-roster-list">
                {employees.map((emp) => {
                  const isCeo = emp.id === 'prince_ceo';
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployeeDetail(emp)}
                      className="co-roster-item"
                    >
                      <img
                        src={emp.avatar_url || `/assets/avatars/${emp.id.replace('_', '-')}.svg`}
                        alt={emp.name}
                        className="co-roster-avatar"
                        style={{ width: '34px', height: '34px', minWidth: '34px', maxWidth: '34px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div className="co-roster-info">
                        <div className="co-roster-name-row">
                          <span className="co-roster-name">{emp.name}</span>
                          <span className="co-status-row">
                            <span className={`co-dot co-dot-${emp.status}`} />
                            <span style={{ fontSize: '0.65rem' }}>{emp.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                        <div className="co-roster-title">{emp.display_title || emp.department}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Unified Meeting Room & Unbroken Transcript Streamer */}
          <div className="co-room-stage">
            {/* Floor Stage Header */}
            <div className="co-stage-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', fontWeight: 700 }}>
                    HeyPrince Company Floor (HQ)
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '9999px', background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.3)', fontWeight: 700 }}>
                    ALL-HANDS CONTINUOUS CHAT
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {messages.length} messages in timeline
                  </span>
                </div>
                <h3 className="co-stage-title" style={{ fontSize: '1.2rem' }}>
                  {activeDiscussion ? activeDiscussion.title : 'HeyPrince Autonomous AI Company Floor'}
                </h3>
                {activeDiscussion && (
                  <p className="co-stage-sub">
                    <strong style={{ color: '#ffffff' }}>Focus:</strong> {activeDiscussion.objective}
                  </p>
                )}
              </div>

              {/* Turn Controls for Prince (CEO) */}
              <div className="co-stage-actions">
                <button
                  onClick={handleAdvanceTurn}
                  disabled={advancingTurn}
                  className="co-btn co-btn-primary"
                >
                  {advancingTurn ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Play style={{ width: 14, height: 14 }} />}
                  Hear Next Specialist
                </button>
                <button
                  onClick={handleConcludeMeeting}
                  disabled={concludingMeeting}
                  className="co-btn co-btn-secondary"
                >
                  {concludingMeeting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 14, height: 14, color: '#34d399' }} />}
                  Synthesize Consensus
                </button>
                <button
                  onClick={() => setClearChatConfirmOpen(true)}
                  disabled={clearingChat || !activeDiscussion}
                  className="co-btn co-btn-secondary"
                  style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                  title="Clear Floor Chat History"
                >
                  {clearingChat ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <RotateCcw style={{ width: 14, height: 14 }} />}
                  Clear Floor Chat
                </button>
              </div>
            </div>

            {/* Messages Transcript Scroll Area (Continuous Unbroken History) */}
            <div className="co-transcript-scroll">
              {messages.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#64748b', padding: '32px', gap: '12px' }}>
                  <MessageSquare style={{ width: 44, height: 44, strokeWidth: 1.5, color: '#334155' }} />
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Connecting to the Company Floor...</p>
                  <p style={{ fontSize: '0.8rem', maxWidth: '360px', color: '#64748b', margin: 0 }}>
                    Send a directive below or click "Hear Next Specialist" to start the discussion.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isModerator = msg.sender_id === 'alex_vance';
                  const isCeo = msg.sender_id === 'prince_ceo';
                  const isSummary = msg.message_type === 'summary';

                  // Departmental badge styling
                  let tagLabel = isCeo ? 'CEO DIRECTIVE' : msg.message_type;
                  if (msg.sender_id === 'elena_rostova') tagLabel = 'SEARCH & SEO';
                  else if (msg.sender_id === 'marcus_sterling') tagLabel = 'REVENUE & GROWTH';
                  else if (msg.sender_id === 'liam_thorne') tagLabel = 'CONTENT & EDITORIAL';
                  else if (msg.sender_id === 'david_chen') tagLabel = 'SRE & INFRASTRUCTURE';
                  else if (msg.sender_id === 'sophia_reynolds') tagLabel = 'PRODUCT & UX';
                  else if (msg.sender_id === 'alex_vance') tagLabel = isSummary ? 'EXECUTIVE CONSENSUS' : 'CHIEF OF STAFF';

                  return (
                    <div
                      key={msg.id}
                      className={`co-chat-msg ${isCeo ? 'is-ceo' : ''} ${isSummary ? 'is-summary' : ''}`}
                    >
                      <img
                        src={msg.sender_avatar || `/assets/avatars/${msg.sender_id.replace('_', '-')}.svg`}
                        alt={msg.sender_name || msg.sender_id}
                        className="co-msg-avatar"
                        style={{ width: '38px', height: '38px', minWidth: '38px', maxWidth: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div className="co-msg-body">
                        <div className="co-msg-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="co-msg-author">
                              {msg.sender_name || msg.sender_id}
                            </span>
                            <span className="co-msg-role">
                              {msg.sender_role || 'Specialist'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="co-msg-tag">
                              {tagLabel}
                            </span>
                            {msg.created_at && (
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="co-msg-content">
                          {msg.content}
                        </div>

                        {/* Evidence Drawer if present */}
                        {msg.evidence && Object.keys(msg.evidence).length > 0 && (
                          <div className="co-evidence-box">
                            <span style={{ color: '#c084fc', fontWeight: 700, display: 'block', marginBottom: '4px' }}>VERIFIED EVIDENCE & AUDIT DATA:</span>
                            <pre style={{ margin: 0, overflowX: 'auto' }}>{JSON.stringify(msg.evidence, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Concluded Strategic Consensus Banner */}
            {activeDiscussion && activeDiscussion.status === 'concluded' && (
              <div style={{ marginTop: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(88,28,135,0.25)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: '#34d399' }} />
                    Consensus Synthesized for CEO Review
                  </span>
                  <p style={{ fontSize: '0.76rem', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                    An actionable proposal has been queued in CEO Approval Gate. The floor remains open for ongoing collaboration.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewMeetingRoomId('company_hq');
                    setNewMeetingParticipants(employees.filter(e => e.id !== 'prince_ceo').map(e => e.id));
                    setNewMeetingModalOpen(true);
                  }}
                  className="co-btn co-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', flexShrink: 0 }}
                >
                  Set Next Objective
                </button>
              </div>
            )}

            {/* Interactive CEO Directive Input Bar (Fixed & Always Active) */}
            <form onSubmit={handleSendCeoMessage} className="co-ceo-bar" style={{ alignItems: 'center' }}>
              <img
                src="/assets/cropped-prince-profile.webp"
                alt="Prince (CEO)"
                style={{ width: '36px', height: '36px', minWidth: '36px', maxWidth: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }}
              />
              <input
                type="text"
                value={ceoInput}
                onChange={(e) => setCeoInput(e.target.value)}
                placeholder="Direct your workforce, ask any question, or share an idea..."
                className="co-input"
              />
              <button
                type="submit"
                disabled={sendingCeoMessage || !ceoInput.trim()}
                className="co-btn co-btn-primary"
                style={{ flexShrink: 0 }}
              >
                {sendingCeoMessage ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 14, height: 14 }} />}
                Send Directive
              </button>
            </form>

            {/* Bottom Real-time Notice */}
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--co-text-dim)' }}>
              <span>
                All 6 AI specialists actively collaborate on this floor. Messages auto-sync in real time.
              </span>
              <span style={{ fontFamily: 'monospace' }}>
                Floor: <strong style={{ color: '#c084fc' }}>HeyPrince Company Floor</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: WORKFORCE IDENTITIES                                          */}
      {/* ==================================================================== */}
      {activeTab === 'workforce' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="co-pane-header">
            <div>
              <h2 className="co-stage-title" style={{ fontSize: '1.4rem' }}>Autonomous Workforce Registry</h2>
              <p className="co-stage-sub">
                Specialists possess distinct psychological archetypes, system prompt overlays, and strict tool permissions.
              </p>
            </div>
            <button
              onClick={() => setNewEmployeeModalOpen(true)}
              className="co-btn co-btn-primary"
            >
              <UserPlus style={{ width: 16, height: 16 }} />
              Propose New AI Employee
            </button>
          </div>

          <div className="co-card-grid">
            {employees.map((emp) => {
              const cfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.idle;

              return (
                <div key={emp.id} className="co-generic-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={emp.avatar_url || `/assets/avatars/${emp.id.replace('_', '-')}.svg`}
                        alt={emp.name}
                        style={{ width: '56px', height: '56px', minWidth: '56px', borderRadius: '14px', objectFit: 'cover', background: '#1e1b4b', border: '1px solid var(--co-border)' }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{emp.name}</h3>
                        <p style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 600, margin: '2px 0 0 0' }}>{emp.display_title}</p>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', display: 'inline-block', marginTop: '4px' }}>
                          {emp.department}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--co-border)', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', width: 'fit-content' }}>
                      <span className={`co-dot co-dot-${emp.status}`} />
                      <span>{cfg.label}</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--co-text-muted)', lineHeight: 1.5, margin: 0 }}>{emp.bio}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: 'var(--co-text-dim)', fontFamily: 'monospace', paddingTop: '8px', borderTop: '1px solid var(--co-border)' }}>
                      <div><strong>Archetype:</strong> {emp.personality_archetype}</div>
                      <div><strong>Model:</strong> {emp.model_preference}</div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--co-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--co-text-muted)', fontFamily: 'monospace' }}>
                      ⭐ <strong>{emp.performance_metrics?.rating || 5.0}</strong> ({emp.performance_metrics?.tasks_completed || 0} tasks)
                    </div>
                    <button
                      onClick={() => setSelectedEmployeeDetail(emp)}
                      className="co-btn co-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      View Specs <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TASK MATRIX & KANBAN                                         */}
      {/* ==================================================================== */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="co-pane-header">
            <div>
              <h2 className="co-stage-title" style={{ fontSize: '1.4rem' }}>Autonomous Task Matrix</h2>
              <p className="co-stage-sub">
                Tasks created during meetings or assigned by Alex Vance with mandatory independent reviewer verification.
              </p>
            </div>
            <button
              onClick={() => setAssignTaskModalOpen(true)}
              className="co-btn co-btn-primary"
            >
              <PlusCircle style={{ width: 16, height: 16 }} />
              Assign Task to Specialist
            </button>
          </div>

          <div className="co-kanban-grid">
            {(['pending', 'in_progress', 'review_ready', 'completed'] as const).map((colStatus) => {
              const colTasks = tasks.filter((t) => t.status === colStatus);

              return (
                <div key={colStatus} className="co-kanban-col">
                  <div className="co-kanban-col-header">
                    <h3 className="co-kanban-col-title">
                      {colStatus.replace('_', ' ')}
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {colTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '0.78rem' }}>No tasks in this lane</div>
                    ) : (
                      colTasks.map((t) => (
                        <div
                          key={t.id}
                          style={{ padding: '14px', borderRadius: '12px', background: 'rgba(7,7,10,0.7)', border: '1px solid var(--co-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                fontFamily: 'monospace',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: t.priority === 'urgent' ? 'rgba(239,68,68,0.2)' : t.priority === 'high' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
                                color: t.priority === 'urgent' ? '#f87171' : t.priority === 'high' ? '#fbbf24' : '#94a3b8'
                              }}
                            >
                              {t.priority}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              <span>Assignee: </span>
                              <strong style={{ color: '#ffffff' }}>{t.assigned_to}</strong>
                            </div>
                          </div>

                          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.4 }}>{t.title}</h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--co-text-muted)', margin: 0, lineHeight: 1.4 }}>{t.description}</p>

                          {/* Acceptance Criteria */}
                          {t.acceptance_criteria && t.acceptance_criteria.length > 0 && (
                            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--co-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', textTransform: 'uppercase' }}>Acceptance Checklist:</div>
                              {t.acceptance_criteria.map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                  <CheckCircle2 style={{ width: 14, height: 14, color: t.status === 'completed' ? '#34d399' : '#64748b', flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Verification Notes */}
                          {t.verification_notes && (
                            <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.72rem', color: '#34d399', fontFamily: 'monospace' }}>
                              {t.verification_notes}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            {t.output_result && Object.keys(t.output_result).length > 0 && (
                              <button
                                onClick={() => setSelectedTaskDetail(t)}
                                className="co-btn co-btn-secondary"
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem', padding: '6px' }}
                              >
                                <Eye style={{ width: 14, height: 14 }} />
                                View Deliverables
                              </button>
                            )}
                            {t.status !== 'completed' && (
                              <button
                                onClick={() => handleExecuteTask(t.id)}
                                disabled={executingTaskId === t.id}
                                className="co-btn co-btn-primary"
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem', padding: '6px' }}
                              >
                                {executingTaskId === t.id ? (
                                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <Play style={{ width: 14, height: 14 }} />
                                )}
                                Execute & Verify
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CEO APPROVAL GATE                                             */}
      {/* ==================================================================== */}
      {activeTab === 'proposals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 className="co-stage-title" style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ width: 24, height: 24, color: '#f59e0b' }} />
              CEO Executive Approval Gate
            </h2>
            <p className="co-stage-sub">
              Autonomous agents can brainstorm and draft internally, but production database updates, external communications,
              and code deploys are locked until you sign off.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {proposals.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px', background: 'var(--co-bg-card)', border: '1px solid var(--co-border)', color: '#64748b' }}>
                <ShieldCheck style={{ width: 44, height: 44, color: '#334155', margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>All executive proposals have been resolved.</p>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '6px 0 0 0' }}>New initiatives emerging from virtual meetings will queue here.</p>
              </div>
            ) : (
              proposals.map((p) => {
                const isPending = p.status === 'pending_approval';

                return (
                  <div
                    key={p.id}
                    className="co-generic-card"
                    style={{ borderColor: isPending ? 'rgba(245,158,11,0.4)' : 'var(--co-border)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontWeight: 700 }}>
                            {p.proposal_type.replace('_', ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'monospace',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: isPending ? 'rgba(245,158,11,0.15)' : p.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: isPending ? '#fbbf24' : p.status === 'approved' ? '#34d399' : '#f87171',
                              border: `1px solid ${isPending ? 'rgba(245,158,11,0.3)' : p.status === 'approved' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                            }}
                          >
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{p.title}</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--co-text-muted)', margin: 0 }}>
                          <strong>Sponsor:</strong> {p.sponsored_by} • <strong>Estimated Cost:</strong> ${p.estimated_cost_usd || '0.00'}
                        </p>
                      </div>

                      {/* CEO Decision Buttons */}
                      {isPending && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleProposalAction(p.id, 'approved')}
                            disabled={approvingProposalId === p.id}
                            className="co-btn co-btn-primary"
                            style={{ background: '#10b981', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                          >
                            {approvingProposalId === p.id ? (
                              <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <CheckCircle2 style={{ width: 14, height: 14 }} />
                            )}
                            Approve & Execute Live
                          </button>
                          <button
                            onClick={() => handleProposalAction(p.id, 'rejected')}
                            disabled={approvingProposalId === p.id}
                            className="co-btn co-btn-secondary"
                            style={{ color: '#f87171' }}
                          >
                            <XCircle style={{ width: 14, height: 14 }} />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(7,7,10,0.6)', border: '1px solid var(--co-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1' }}>Business Justification & Strategic Impact:</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--co-text-muted)', lineHeight: 1.5, margin: 0 }}>{p.business_justification}</p>
                    </div>

                    {/* Action Payload Preview */}
                    {p.action_payload && Object.keys(p.action_payload).length > 0 && (
                      <details style={{ fontSize: '0.76rem', color: 'var(--co-text-dim)', fontFamily: 'monospace' }}>
                        <summary style={{ cursor: 'pointer', color: '#c084fc', fontWeight: 700, marginBottom: '6px' }}>
                          Inspect Execution Payload Parameters
                        </summary>
                        <pre style={{ padding: '10px', borderRadius: '8px', background: 'rgba(7,7,10,0.8)', border: '1px solid var(--co-border)', overflowX: 'auto', margin: 0, fontSize: '0.72rem' }}>
                          {JSON.stringify(p.action_payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: COMPANY BRAIN & MEMORY                                        */}
      {/* ==================================================================== */}
      {activeTab === 'memory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="co-pane-header">
            <div>
              <h2 className="co-stage-title" style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain style={{ width: 24, height: 24, color: '#a855f7' }} />
                Multi-Tier Corporate Memory Store
              </h2>
              <p className="co-stage-sub">
                Persistent shared knowledge, verified engineering benchmarks, previous decisions, and failed experiment learnings.
              </p>
            </div>
            {memoryItems.length > 0 && (
              <button
                onClick={() => setClearMemoryConfirmOpen(true)}
                disabled={clearingMemory}
                className="co-btn co-btn-secondary"
                style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {clearingMemory ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
                Clear All Memory
              </button>
            )}
          </div>

          {memoryItems.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px', background: 'var(--co-bg-card)', border: '1px solid var(--co-border)', color: '#64748b' }}>
              <Brain style={{ width: 44, height: 44, color: '#334155', margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Corporate Memory Store is empty.</p>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '6px 0 0 0' }}>Learnings, meeting syntheses, and executed task findings will automatically persist here.</p>
            </div>
          ) : (
            <div className="co-card-grid">
              {memoryItems.map((mem) => (
                <div key={mem.id} className="co-generic-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', fontWeight: 700, border: '1px solid rgba(168,85,247,0.3)' }}>
                        {mem.scope}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--co-text-dim)', textTransform: 'uppercase' }}>{mem.category}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteMemoryItem(mem.id)}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                      title="Delete memory entry"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.55, margin: 0 }}>{mem.insight}</p>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--co-text-dim)', paddingTop: '8px', borderTop: '1px solid var(--co-border)' }}>
                    Recorded: {new Date(mem.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: UPDATE COMPANY FLOOR AGENDA & FOCUS                           */}
      {/* ==================================================================== */}
      {newMeetingModalOpen && (
        <div className="co-modal-overlay">
          <div className="co-modal-card">
            <div className="co-modal-header">
              <h3 className="co-modal-title">
                <MessageSquare style={{ width: 20, height: 20, color: '#a855f7' }} />
                Update Company Floor Agenda & Focus
              </h3>
              <button onClick={() => setNewMeetingModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleStartNewMeeting} className="co-modal-body">
              <div className="co-form-group">
                <label className="co-label">Target Collaboration Space</label>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(7, 7, 10, 0.8)', border: '1px solid var(--co-border)', color: '#d8b4fe', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="co-dot co-dot-in_meeting" />
                  HeyPrince Company Floor (All-Hands Unified HQ)
                </div>
              </div>

              <div className="co-form-group">
                <label className="co-label">Floor Agenda Title</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 16 Edge Rendering & Headless Commerce Blueprint"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  className="co-input"
                  required
                />
              </div>

              <div className="co-form-group">
                <label className="co-label">Explicit Objective / Deliverable</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Evaluate technical trade-offs, formulate SEO keyword targets, and draft a high-converting service blueprint."
                  value={newMeetingObjective}
                  onChange={(e) => setNewMeetingObjective(e.target.value)}
                  className="co-textarea"
                  required
                />
              </div>

              <div className="co-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="co-label">
                    Invited Specialists ({newMeetingParticipants.length === 0 ? 'All Active by Default' : `${newMeetingParticipants.length} Selected`})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (newMeetingParticipants.length === employees.length) {
                        setNewMeetingParticipants([]);
                      } else {
                        setNewMeetingParticipants(employees.map((e) => e.id));
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#c084fc', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    {newMeetingParticipants.length === employees.length ? 'Clear Selection' : 'Select All'}
                  </button>
                </div>
                <div className="co-specialist-picker">
                  {employees.map((emp) => {
                    const isSelected = newMeetingParticipants.length === 0 || newMeetingParticipants.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          if (newMeetingParticipants.length === 0) {
                            setNewMeetingParticipants(employees.filter((e) => e.id !== emp.id).map((e) => e.id));
                          } else if (newMeetingParticipants.includes(emp.id)) {
                            setNewMeetingParticipants(newMeetingParticipants.filter((id) => id !== emp.id));
                          } else {
                            setNewMeetingParticipants([...newMeetingParticipants, emp.id]);
                          }
                        }}
                        className={`co-picker-chip ${isSelected ? 'selected' : ''}`}
                      >
                        <img
                          src={emp.avatar_url || `/assets/avatars/${emp.id.replace('_', '-')}.svg`}
                          alt={emp.name}
                          style={{ width: '24px', height: '24px', minWidth: '24px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{emp.display_title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--co-border)' }}>
                <button
                  type="button"
                  onClick={() => setNewMeetingModalOpen(false)}
                  className="co-btn co-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingMeeting}
                  className="co-btn co-btn-primary"
                >
                  {creatingMeeting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Play style={{ width: 14, height: 14 }} />}
                  Update Floor Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: PROPOSE NEW EMPLOYEE (WORKFORCE BUILDER)                      */}
      {/* ==================================================================== */}
      {newEmployeeModalOpen && (
        <div className="co-modal-overlay">
          <div className="co-modal-card">
            <div className="co-modal-header">
              <h3 className="co-modal-title">
                <UserPlus style={{ width: 20, height: 20, color: '#a855f7' }} />
                AI Workforce Builder: Propose Specialist
              </h3>
              <button onClick={() => setNewEmployeeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleDraftEmployee} className="co-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="co-form-group">
                  <label className="co-label">Humanoid Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Lucas Sterling"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="co-input"
                    required
                  />
                </div>
                <div className="co-form-group">
                  <label className="co-label">Department</label>
                  <select
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="co-select"
                  >
                    <option value="Growth">Growth</option>
                    <option value="Editorial">Editorial</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Sales">Sales</option>
                    <option value="Product">Product</option>
                    <option value="Analytics">Analytics</option>
                  </select>
                </div>
              </div>

              <div className="co-form-group">
                <label className="co-label">Corporate Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Conversion Rate Optimization Specialist"
                  value={newEmpTitle}
                  onChange={(e) => setNewEmpTitle(e.target.value)}
                  className="co-input"
                  required
                />
              </div>

              <div className="co-form-group">
                <label className="co-label">Capability Gap to Fill</label>
                <input
                  type="text"
                  placeholder="e.g. Automated checkout funnel A/B testing and checkout drop-off diagnostics"
                  value={newEmpGap}
                  onChange={(e) => setNewEmpGap(e.target.value)}
                  className="co-input"
                  required
                />
              </div>

              <div className="co-form-group">
                <label className="co-label">Business Justification & ROI</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Direct upside in client retainer value by delivering quantifiable conversion rate gains."
                  value={newEmpJustification}
                  onChange={(e) => setNewEmpJustification(e.target.value)}
                  className="co-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--co-border)' }}>
                <button
                  type="button"
                  onClick={() => setNewEmployeeModalOpen(false)}
                  className="co-btn co-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={draftingEmployee}
                  className="co-btn co-btn-primary"
                >
                  {draftingEmployee ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <UserPlus style={{ width: 14, height: 14 }} />}
                  Submit Proposal to CEO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DRAWER: EMPLOYEE DETAIL                                              */}
      {/* ==================================================================== */}
      {selectedEmployeeDetail && (
        <div className="co-modal-overlay">
          <div className="co-modal-card">
            <div className="co-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={selectedEmployeeDetail.avatar_url || `/assets/avatars/${selectedEmployeeDetail.id.replace('_', '-')}.svg`}
                  alt={selectedEmployeeDetail.name}
                  style={{ width: '48px', height: '48px', minWidth: '48px', borderRadius: '12px', objectFit: 'cover', background: '#1e1b4b', border: '1px solid var(--co-border)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{selectedEmployeeDetail.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600, margin: '2px 0 0 0' }}>{selectedEmployeeDetail.display_title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployeeDetail(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem', color: 'var(--co-text-muted)' }}>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>System Prompt Overlay:</strong>
                <p style={{ padding: '12px', borderRadius: '10px', background: 'rgba(7,7,10,0.8)', border: '1px solid var(--co-border)', fontFamily: 'monospace', fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  {selectedEmployeeDetail.system_prompt_overlay}
                </p>
              </div>

              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>Tool Permissions & Safety Guardrails:</strong>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(7,7,10,0.8)', border: '1px solid var(--co-border)', fontFamily: 'monospace', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>Autonomous Tools:</span>{' '}
                    {selectedEmployeeDetail.tool_permissions?.allowed_tools?.join(', ') || 'None'}
                  </div>
                  <div>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>Requires CEO Approval:</span>{' '}
                    {selectedEmployeeDetail.tool_permissions?.requires_approval?.join(', ') || 'All critical actions'}
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>Performance Telemetry:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(7,7,10,0.8)', border: '1px solid var(--co-border)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                      {selectedEmployeeDetail.performance_metrics?.tasks_completed || 0}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--co-text-dim)', marginTop: '2px' }}>Tasks Completed</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(7,7,10,0.8)', border: '1px solid var(--co-border)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                      {selectedEmployeeDetail.performance_metrics?.proposals_approved || 0}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--co-text-dim)', marginTop: '2px' }}>Proposals Approved</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--co-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedEmployeeDetail(null)}
                className="co-btn co-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ASSIGN TASK TO AI SPECIALIST                                  */}
      {/* ==================================================================== */}
      {assignTaskModalOpen && (
        <div className="co-modal-overlay">
          <div className="co-modal-card" style={{ maxWidth: '620px' }}>
            <div className="co-modal-header">
              <h3 className="co-modal-title">
                <CheckSquare style={{ width: 20, height: 20, color: '#a855f7' }} />
                Assign Task to AI Specialist
              </h3>
              <button
                onClick={() => setAssignTaskModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleAssignTask} className="co-modal-body">
              {/* Specialist Selector Grid */}
              <div className="co-form-group">
                <label className="co-label">Select Assigned Specialist</label>
                <div className="co-specialist-picker" style={{ gridTemplateColumns: '1fr 1fr', maxHeight: '190px' }}>
                  {[
                    { id: 'marcus_sterling', name: 'Marcus Sterling', role: 'Content & Editorial Writer', dept: 'Editorial', avatar: '/assets/avatars/marcus-sterling.webp' },
                    { id: 'elena_rostova', name: 'Elena Rostova', role: 'Head of Search & SEO', dept: 'Growth', avatar: '/assets/avatars/elena-rostova.webp' },
                    { id: 'david_chen', name: 'David Chen', role: 'Site Reliability & SRE', dept: 'Infrastructure', avatar: '/assets/avatars/david-chen.webp' },
                    { id: 'liam_thorne', name: 'Liam Thorne', role: 'Lead Scout & Sales', dept: 'Sales', avatar: '/assets/avatars/liam-thorne.webp' },
                    { id: 'sophia_reynolds', name: 'Sophia Reynolds', role: 'Client Solutions Partner', dept: 'Solutions', avatar: '/assets/avatars/sophia-reynolds.webp' },
                    { id: 'alex_vance', name: 'Alex Vance', role: 'Chief of Staff & Ops', dept: 'Executive', avatar: '/assets/avatars/alex-vance.webp' },
                  ].map((spec) => {
                    const isSelected = taskAssignedTo === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setTaskAssignedTo(spec.id)}
                        className={`co-picker-chip ${isSelected ? 'selected' : ''}`}
                        style={{ padding: '8px 10px' }}
                      >
                        <img
                          src={spec.avatar}
                          alt={spec.name}
                          style={{ width: '28px', height: '28px', minWidth: '28px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{spec.name}</div>
                          <div style={{ fontSize: '0.66rem', color: isSelected ? '#d8b4fe' : '#94a3b8' }}>{spec.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Title */}
              <div className="co-form-group">
                <label className="co-label">Task Title / Deliverable Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 16 Edge Rendering & Headless Commerce Blueprint"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="co-input"
                  required
                />
              </div>

              {/* Task Point / Specific Instructions */}
              <div className="co-form-group">
                <label className="co-label">Specific Point / Topic Directives</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Focus on high-ticket B2B founders, emphasize Next.js App Router performance, zero em-dashes, and include actionable implementation guidelines."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="co-textarea"
                  required
                />
              </div>

              {/* Priority & Acceptance Criteria */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
                <div className="co-form-group">
                  <label className="co-label">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="co-select"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="co-form-group">
                  <label className="co-label">Acceptance Checklist (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Zero em-dashes, Actionable engineering checklist, High-converting CTA"
                    value={taskAcceptanceCriteria}
                    onChange={(e) => setTaskAcceptanceCriteria(e.target.value)}
                    className="co-input"
                  />
                </div>
              </div>

              {/* Execute Immediately Switch */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap style={{ width: 18, height: 18, color: '#c084fc', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>Execute Immediately</div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Assigned agent will work on this point ASAP and post an update to the Company Floor.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={taskExecuteImmediately}
                  onChange={(e) => setTaskExecuteImmediately(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#a855f7', cursor: 'pointer' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--co-border)' }}>
                <button
                  type="button"
                  onClick={() => setAssignTaskModalOpen(false)}
                  className="co-btn co-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="co-btn co-btn-primary"
                >
                  {submittingTask ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Play style={{ width: 14, height: 14 }} />}
                  Assign & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: TASK DETAIL & DELIVERABLE VIEWER                              */}
      {/* ==================================================================== */}
      {selectedTaskDetail && (
        <div className="co-modal-overlay">
          <div className="co-modal-card" style={{ maxWidth: '720px', maxHeight: '88vh' }}>
            <div className="co-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: selectedTaskDetail.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(168,85,247,0.2)',
                    color: selectedTaskDetail.status === 'completed' ? '#34d399' : '#d8b4fe',
                    border: `1px solid ${selectedTaskDetail.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(168,85,247,0.3)'}`,
                  }}
                >
                  {selectedTaskDetail.status.replace('_', ' ')}
                </span>
                <h3 className="co-modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                  {selectedTaskDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div className="co-modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(88vh - 140px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Meta row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'rgba(7,7,10,0.8)', border: '1px solid var(--co-border)', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Assigned Specialist: </span>
                  <strong style={{ color: '#ffffff' }}>{selectedTaskDetail.assigned_to}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Priority: </span>
                  <strong style={{ textTransform: 'uppercase', color: selectedTaskDetail.priority === 'urgent' ? '#f87171' : '#fbbf24' }}>
                    {selectedTaskDetail.priority}
                  </strong>
                </div>
              </div>

              {/* Task Directives */}
              <div>
                <strong style={{ fontSize: '0.78rem', color: '#c084fc', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Task Directives:</strong>
                <p style={{ padding: '12px', borderRadius: '10px', background: 'rgba(7,7,10,0.6)', border: '1px solid var(--co-border)', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                  {selectedTaskDetail.description}
                </p>
              </div>

              {/* Deliverable Output */}
              {selectedTaskDetail.output_result && Object.keys(selectedTaskDetail.output_result).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedTaskDetail.output_result.summary && (
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(88,28,135,0.25)', border: '1px solid rgba(168,85,247,0.3)' }}>
                      <strong style={{ fontSize: '0.74rem', color: '#d8b4fe', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Executive Summary:</strong>
                      <p style={{ color: '#ffffff', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
                        {selectedTaskDetail.output_result.summary}
                      </p>
                    </div>
                  )}

                  {selectedTaskDetail.output_result.details && (
                    <div>
                      <strong style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Verified Deliverable Document:</strong>
                      <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(7,7,10,0.85)', border: '1px solid var(--co-border)', color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif' }}>
                        {selectedTaskDetail.output_result.details}
                      </div>
                    </div>
                  )}

                  {selectedTaskDetail.output_result.keyFindings && Array.isArray(selectedTaskDetail.output_result.keyFindings) && (
                    <div>
                      <strong style={{ fontSize: '0.74rem', color: '#34d399', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Key Findings:</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {selectedTaskDetail.output_result.keyFindings.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Notes */}
              {selectedTaskDetail.verification_notes && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.76rem', color: '#34d399', fontFamily: 'monospace' }}>
                  {selectedTaskDetail.verification_notes}
                </div>
              )}
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--co-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="co-btn co-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CONFIRMATION MODALS: CLEAR CHAT & CLEAR MEMORY                       */}
      {/* ==================================================================== */}
      <ConfirmModal
        isOpen={clearChatConfirmOpen}
        title="Clear Company Floor Chat"
        message="Are you sure you want to clear the Company Floor chat history? All messages in this timeline will be purged and synchronized into a fresh clean state."
        confirmLabel="Clear Floor Chat"
        cancelLabel="Cancel"
        onConfirm={handleClearFloorChat}
        onCancel={() => setClearChatConfirmOpen(false)}
        isLoading={clearingChat}
      />

      <ConfirmModal
        isOpen={clearMemoryConfirmOpen}
        title="Clear Corporate Brain Memory"
        message="Are you sure you want to clear all multi-tier memory entries? This will delete all saved learnings, benchmarks, and task summaries."
        confirmLabel="Clear All Memory"
        cancelLabel="Cancel"
        onConfirm={handleClearAllMemory}
        onCancel={() => setClearMemoryConfirmOpen(false)}
        isLoading={clearingMemory}
      />
    </div>
  );
}
