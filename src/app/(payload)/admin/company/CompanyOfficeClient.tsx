'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  const [newMeetingRoomId, setNewMeetingRoomId] = useState('war_room');
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load
  const fetchCompanyData = async () => {
    try {
      const res = await fetch('/api/admin/company/overview');
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        if (!selectedRoom && json.data.rooms?.length > 0) {
          setSelectedRoom(json.data.rooms[0]);
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

  // 2. Room Selection & Discussion Loading
  useEffect(() => {
    if (!selectedRoom) return;

    const loadRoomDiscussion = async () => {
      try {
        const res = await fetch(`/api/admin/company/discussions?roomId=${selectedRoom.id}`);
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

  // 3. Resilient Real-Time Polling for Active Discussion
  useEffect(() => {
    if (!activeDiscussion || activeDiscussion.status !== 'in_progress') return;

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
  }, [activeDiscussion?.id, activeDiscussion?.status, messages.length]);

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
        if (json.agentResponse) {
          setMessages((prev) => [...prev, json.agentResponse]);
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
      showToast('Please provide a meeting title and objective.', 'error');
      return;
    }

    setCreatingMeeting(true);
    try {
      const res = await fetch('/api/admin/company/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: newMeetingRoomId,
          title: newMeetingTitle,
          objective: newMeetingObjective,
          participantIds: newMeetingParticipants.length > 0 ? newMeetingParticipants : undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.discussion) {
        showToast(`Meeting "${newMeetingTitle}" opened in ${newMeetingRoomId}!`, 'success');
        setNewMeetingModalOpen(false);
        setNewMeetingTitle('');
        setNewMeetingObjective('');
        fetchCompanyData();
      } else {
        showToast(json.error || 'Failed to start meeting', 'error');
      }
    } catch {
      showToast('Network error starting meeting', 'error');
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
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* EXECUTIVE HEADER & METRICS                                          */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-500/20 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wider uppercase">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              HeyPrince Autonomous AI Company
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Executive Virtual Office
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SOVEREIGN WORKFORCE LIVE
              </span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Prince is CEO. Alex Vance (Chief of Staff) orchestrates 6 autonomous specialists across 5 virtual collaboration rooms.
              Internal planning is autonomous; all external and production changes require your direct sign-off.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
              <div className="text-2xl font-black text-white font-mono">{employees.length}</div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">Specialists</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
              <div className="text-2xl font-black text-purple-400 font-mono">{overview?.activeDiscussions?.length || 0}</div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">In Meeting</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
              <div className="text-2xl font-black text-amber-400 font-mono">{overview?.pendingProposalsCount || 0}</div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">CEO Approval</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
              <div className="text-2xl font-black text-emerald-400 font-mono">{overview?.openTasksCount || 0}</div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">Open Tasks</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'office', label: 'Virtual Office & Rooms', icon: Building2 },
            { id: 'workforce', label: 'Employee Identities', icon: Users },
            { id: 'tasks', label: 'Task Matrix', icon: CheckSquare, badge: overview?.openTasksCount },
            { id: 'proposals', label: 'CEO Approval Gate', icon: ShieldCheck, badge: overview?.pendingProposalsCount, badgeColor: 'bg-amber-500 text-black' },
            { id: 'memory', label: 'Company Brain & Memory', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                      tab.badgeColor || 'bg-purple-900 text-purple-200'
                    }`}
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
      {/* TAB 1: VIRTUAL OFFICE FLOOR & LIVE COLLABORATION ROOM                */}
      {/* ==================================================================== */}
      {activeTab === 'office' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Room Selector & Office Floorplan (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Virtual Office Rooms
              </h2>
              <button
                onClick={() => {
                  setNewMeetingRoomId(selectedRoom?.id || 'war_room');
                  setNewMeetingModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Start Meeting
              </button>
            </div>

            <div className="space-y-2.5">
              {rooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                const hasActive = Boolean(room.active_discussion);

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-zinc-900 border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{room.name}</h3>
                          {hasActive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                              IN SESSION
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2">{room.description}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-purple-400 translate-x-1' : 'text-zinc-600'}`} />
                    </div>

                    {/* Room Activity Snapshot */}
                    {hasActive && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span className="truncate max-w-[200px]">"{room.active_discussion?.title}"</span>
                        <span className="text-purple-400 font-bold">Turn {room.active_discussion?.turn_count}/{room.active_discussion?.max_turns}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Live Workforce Status */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Live Agent Presence
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {employees.map((emp) => {
                  const cfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.idle;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployeeDetail(emp)}
                      className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer flex items-center gap-2.5 transition"
                    >
                      <img src={emp.avatar_url} alt={emp.name} className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white truncate">{emp.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className="truncate">{emp.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Meeting Room & Transcript Streamer (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col h-[720px]">
              {/* Meeting Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                      {selectedRoom?.name || 'Collaboration Hub'}
                    </span>
                    {activeDiscussion && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                        ACTIVE DISCUSSION
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-white">
                    {activeDiscussion ? activeDiscussion.title : 'Room is currently quiet'}
                  </h3>
                  {activeDiscussion && (
                    <p className="text-xs text-zinc-400">
                      <strong className="text-zinc-300">Objective:</strong> {activeDiscussion.objective}
                    </p>
                  )}
                </div>

                {/* Turn Controls for Prince (CEO) */}
                {activeDiscussion && activeDiscussion.status === 'in_progress' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAdvanceTurn}
                      disabled={advancingTurn}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition"
                    >
                      {advancingTurn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Advance Turn ({activeDiscussion.turn_count}/{activeDiscussion.max_turns})
                    </button>
                    <button
                      onClick={handleConcludeMeeting}
                      disabled={concludingMeeting}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-bold border border-zinc-700 transition"
                    >
                      {concludingMeeting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      Synthesize & Conclude
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setNewMeetingRoomId(selectedRoom?.id || 'war_room');
                      setNewMeetingModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Open Topic in this Room
                  </button>
                )}
              </div>

              {/* Messages Transcript Scroll Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-8 space-y-3">
                    <MessageSquare className="w-12 h-12 text-zinc-700 stroke-[1.5]" />
                    <p className="text-sm font-medium">No active discussion in this room right now.</p>
                    <p className="text-xs max-w-sm text-zinc-600">
                      Click &quot;Open Topic in this Room&quot; above to convene Alex Vance and your AI specialists.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isModerator = msg.sender_id === 'alex_vance';
                    const isCeo = msg.sender_id === 'prince_ceo';
                    const isSummary = msg.message_type === 'summary';

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3.5 ${
                          isCeo
                            ? 'bg-indigo-950/40 border border-indigo-500/40 p-4 rounded-xl shadow-md'
                            : isSummary
                            ? 'bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl'
                            : 'p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60'
                        }`}
                      >
                        <img
                          src={msg.sender_avatar || `/assets/avatars/${msg.sender_id}.svg`}
                          alt={msg.sender_name || msg.sender_id}
                          className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 object-cover shrink-0"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {msg.sender_name || msg.sender_id}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {msg.sender_role || 'Specialist'}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                                isCeo
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : isModerator
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : msg.message_type === 'challenge'
                                  ? 'bg-red-500/20 text-red-300'
                                  : msg.message_type === 'consensus'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {isCeo ? 'CEO DIRECTIVE' : msg.message_type}
                            </span>
                          </div>

                          <div className="text-sm text-zinc-300 leading-relaxed font-sans select-text">
                            {msg.content}
                          </div>

                          {/* Evidence Drawer if present */}
                          {msg.evidence && Object.keys(msg.evidence).length > 0 && (
                            <div className="mt-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400">
                              <span className="text-purple-400 font-bold block mb-1">CITED EVIDENCE &amp; METRICS:</span>
                              <pre className="overflow-x-auto">{JSON.stringify(msg.evidence, null, 2)}</pre>
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
                <div className="mt-3 p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Meeting Concluded with Strategic Consensus
                    </span>
                    <p className="text-zinc-400">
                      Consensus synthesized. Review proposal in CEO Approval Gate or start the next discussion.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewMeetingRoomId(selectedRoom?.id || 'war_room');
                      setNewMeetingParticipants(employees.filter(e => e.id !== 'prince_ceo').map(e => e.id));
                      setNewMeetingModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition shrink-0 ml-3"
                  >
                    Start Next Topic
                  </button>
                </div>
              )}

              {/* Interactive CEO Directive Input Bar */}
              {activeDiscussion && (
                <form onSubmit={handleSendCeoMessage} className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={ceoInput}
                    onChange={(e) => setCeoInput(e.target.value)}
                    placeholder="Speak directly to the team as Prince (CEO)..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingCeoMessage || !ceoInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    {sendingCeoMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Directive
                  </button>
                </form>
              )}

              {/* Bottom Quick Action Bar */}
              {activeDiscussion && activeDiscussion.status === 'in_progress' && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>
                    Token Budget: <strong className="text-purple-400">{activeDiscussion.tokens_consumed} / {activeDiscussion.token_budget}</strong>
                  </span>
                  <span>
                    Speaker Turn: <strong className="text-purple-400">{activeDiscussion.turn_count} / {activeDiscussion.max_turns}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: WORKFORCE IDENTITIES                                          */}
      {/* ==================================================================== */}
      {activeTab === 'workforce' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Autonomous Workforce Registry</h2>
              <p className="text-xs text-zinc-400">
                Specialists possess distinct psychological archetypes, system prompt overlays, and strict tool permissions.
              </p>
            </div>
            <button
              onClick={() => setNewEmployeeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Propose New AI Employee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employees.map((emp) => {
              const cfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.idle;

              return (
                <div
                  key={emp.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4 hover:border-purple-500/40 transition shadow-lg relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar_url}
                          alt={emp.name}
                          className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-purple-500/30 object-cover shadow-md"
                        />
                        <div>
                          <h3 className="text-base font-bold text-white">{emp.name}</h3>
                          <p className="text-xs text-purple-400 font-semibold">{emp.display_title}</p>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 mt-1 inline-block">
                            {emp.department}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-2 ${cfg.color}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span>{cfg.label}</span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{emp.bio}</p>

                    <div className="space-y-1 text-[11px] text-zinc-400 font-mono pt-2 border-t border-zinc-800">
                      <div>
                        <strong>Archetype:</strong> {emp.personality_archetype}
                      </div>
                      <div>
                        <strong>Model:</strong> {emp.model_preference}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-zinc-400 font-mono">
                      ⭐ <strong>{emp.performance_metrics?.rating || 5.0}</strong> (
                      {emp.performance_metrics?.tasks_completed || 0} tasks)
                    </div>
                    <button
                      onClick={() => setSelectedEmployeeDetail(emp)}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      View Specs <ChevronRight className="w-3.5 h-3.5" />
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Autonomous Task Matrix</h2>
              <p className="text-xs text-zinc-400">
                Tasks created during meetings or assigned by Alex Vance with mandatory independent reviewer verification.
              </p>
            </div>
            <button
              onClick={() => {
                const title = prompt('Enter task title:');
                if (title) {
                  fetch('/api/admin/company/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title,
                      description: 'Manually assigned task from CEO',
                      assignedTo: 'marcus_sterling',
                      priority: 'high',
                      acceptanceCriteria: ['Pass full architectural audit'],
                    }),
                  }).then(() => fetchTasks());
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              Assign Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['pending', 'in_progress', 'review_ready', 'completed'] as const).map((colStatus) => {
              const colTasks = tasks.filter((t) => t.status === colStatus);

              return (
                <div key={colStatus} className="space-y-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 min-h-[500px]">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      {colStatus.replace('_', ' ')}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-10 text-zinc-600 text-xs">No tasks in this lane</div>
                    ) : (
                      colTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 space-y-2.5 shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                                t.priority === 'urgent'
                                  ? 'bg-red-500/20 text-red-400'
                                  : t.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {t.priority}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                              <span className="text-zinc-500">Assignee:</span>
                              <strong className="text-zinc-300">{t.assigned_to}</strong>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-white leading-snug">{t.title}</h4>
                          <p className="text-xs text-zinc-400 line-clamp-2">{t.description}</p>

                          {/* Acceptance Criteria */}
                          {t.acceptance_criteria && t.acceptance_criteria.length > 0 && (
                            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">Acceptance Checklist:</div>
                              {t.acceptance_criteria.map((c, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
                                  <CheckCircle2 className={`w-3.5 h-3.5 ${t.status === 'completed' ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                  <span className="truncate">{c}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Verification Notes */}
                          {t.verification_notes && (
                            <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 font-mono">
                              {t.verification_notes}
                            </div>
                          )}

                          {/* Action Button */}
                          {t.status !== 'completed' && (
                            <button
                              onClick={() => handleExecuteTask(t.id)}
                              disabled={executingTaskId === t.id}
                              className="w-full mt-2 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-bold border border-purple-500/40 transition flex items-center justify-center gap-1.5"
                            >
                              {executingTaskId === t.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                              Execute & Verify
                            </button>
                          )}
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
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              CEO Executive Approval Gate
            </h2>
            <p className="text-xs text-zinc-400">
              Autonomous agents can brainstorm and draft internally, but production database updates, external communications,
              and code deploys are locked until you sign off.
            </p>
          </div>

          <div className="space-y-4">
            {proposals.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 space-y-2">
                <ShieldCheck className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-sm font-medium">All executive proposals have been resolved.</p>
                <p className="text-xs text-zinc-600">New initiatives emerging from virtual meetings will queue here.</p>
              </div>
            ) : (
              proposals.map((p) => {
                const isPending = p.status === 'pending_approval';

                return (
                  <div
                    key={p.id}
                    className={`p-6 rounded-2xl border transition-all space-y-4 ${
                      isPending
                        ? 'bg-zinc-900 border-amber-500/40 shadow-xl shadow-amber-950/20'
                        : 'bg-zinc-900/60 border-zinc-800 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                            {p.proposal_type.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : p.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{p.title}</h3>
                        <p className="text-xs text-zinc-400">
                          <strong>Sponsor:</strong> {p.sponsored_by} • <strong>Estimated Cost:</strong> ${p.estimated_cost_usd || '0.00'}
                        </p>
                      </div>

                      {/* CEO Decision Buttons */}
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleProposalAction(p.id, 'approved')}
                            disabled={approvingProposalId === p.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
                          >
                            {approvingProposalId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Approve & Execute Live
                          </button>
                          <button
                            onClick={() => handleProposalAction(p.id, 'rejected')}
                            disabled={approvingProposalId === p.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-400 text-xs font-bold border border-zinc-700 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                      <div className="text-xs font-bold text-zinc-300">Business Justification & Strategic Impact:</div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{p.business_justification}</p>
                    </div>

                    {/* Action Payload Preview */}
                    {p.action_payload && Object.keys(p.action_payload).length > 0 && (
                      <details className="text-xs text-zinc-400 font-mono">
                        <summary className="cursor-pointer text-purple-400 font-bold hover:underline mb-2">
                          Inspect Execution Payload Parameters
                        </summary>
                        <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 overflow-x-auto text-[11px]">
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
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              Multi-Tier Corporate Memory Store
            </h2>
            <p className="text-xs text-zinc-400">
              Persistent shared knowledge, verified engineering benchmarks, previous decisions, and failed experiment learnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memoryItems.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 transition space-y-2.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                    {mem.scope}
                  </span>
                  <span className="text-zinc-500">{mem.category}</span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed font-sans">{mem.insight}</p>
                <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                  Recorded: {new Date(mem.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: START NEW MEETING                                             */}
      {/* ==================================================================== */}
      {newMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Initialize Virtual Collaboration Meeting
              </h3>
              <button onClick={() => setNewMeetingModalOpen(false)} className="text-zinc-500 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartNewMeeting} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Collaboration Room</label>
                <select
                  value={newMeetingRoomId}
                  onChange={(e) => setNewMeetingRoomId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Meeting Agenda Title</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 16 Edge Rendering & Headless Commerce Blueprint"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Explicit Objective / Deliverable</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Evaluate technical trade-offs, formulate SEO keyword targets, and draft a high-converting service blueprint."
                  value={newMeetingObjective}
                  onChange={(e) => setNewMeetingObjective(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300">
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
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition"
                  >
                    {newMeetingParticipants.length === employees.length ? 'Clear Selection' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
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
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition border ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                            : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <img
                          src={emp.avatar_url || '/assets/cropped-prince-profile.webp'}
                          alt={emp.name}
                          className="w-6 h-6 rounded-full object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="truncate">
                          <div className="font-semibold truncate text-[11px]">{emp.name}</div>
                          <div className="text-[9px] text-zinc-400 truncate">{emp.display_title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNewMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingMeeting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                >
                  {creatingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Open Room
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                AI Workforce Builder: Propose Specialist
              </h3>
              <button onClick={() => setNewEmployeeModalOpen(false)} className="text-zinc-500 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDraftEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Humanoid Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Lucas Sterling"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Department</label>
                  <select
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
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

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Corporate Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Conversion Rate Optimization Specialist"
                  value={newEmpTitle}
                  onChange={(e) => setNewEmpTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Capability Gap to Fill</label>
                <input
                  type="text"
                  placeholder="e.g. Automated checkout funnel A/B testing and checkout drop-off diagnostics"
                  value={newEmpGap}
                  onChange={(e) => setNewEmpGap(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Business Justification & ROI</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Direct upside in client retainer value by delivering quantifiable conversion rate gains."
                  value={newEmpJustification}
                  onChange={(e) => setNewEmpJustification(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNewEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={draftingEmployee}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                >
                  {draftingEmployee ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedEmployeeDetail.avatar_url}
                  alt={selectedEmployeeDetail.name}
                  className="w-12 h-12 rounded-xl bg-zinc-800 border object-cover"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedEmployeeDetail.name}</h3>
                  <p className="text-xs text-purple-400">{selectedEmployeeDetail.display_title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="text-zinc-500 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div>
                <strong className="text-white block mb-1">System Prompt Overlay:</strong>
                <p className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-400 leading-relaxed">
                  {selectedEmployeeDetail.system_prompt_overlay}
                </p>
              </div>

              <div>
                <strong className="text-white block mb-1">Tool Permissions & Safety Guardrails:</strong>
                <div className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] space-y-1">
                  <div>
                    <span className="text-emerald-400">Autonomous Tools:</span>{' '}
                    {selectedEmployeeDetail.tool_permissions?.allowed_tools?.join(', ') || 'None'}
                  </div>
                  <div>
                    <span className="text-amber-400">Requires CEO Approval:</span>{' '}
                    {selectedEmployeeDetail.tool_permissions?.requires_approval?.join(', ') || 'All critical actions'}
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-white block mb-1">Performance Telemetry:</strong>
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <div className="text-base font-bold text-white">
                      {selectedEmployeeDetail.performance_metrics?.tasks_completed || 0}
                    </div>
                    <div className="text-[10px] text-zinc-500">Tasks Completed</div>
                  </div>
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                    <div className="text-base font-bold text-emerald-400">
                      {selectedEmployeeDetail.performance_metrics?.proposals_approved || 0}
                    </div>
                    <div className="text-[10px] text-zinc-500">Proposals Approved</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedEmployeeDetail(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
