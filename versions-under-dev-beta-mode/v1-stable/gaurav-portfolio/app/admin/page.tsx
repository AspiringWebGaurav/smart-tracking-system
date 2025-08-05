"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import { 
  showSuccessToast, 
  showErrorToast, 
  showAdminActionToast 
} from "@/components/ToastSystem";

interface Visitor {
  id: string;
  uuid: string;
  status: 'active' | 'banned';
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  os: string;
  browser: string;
  device: string;
  ipAddress: string;
  timezone: string;
  language: string;
  screenResolution: string;
  banReason?: string;
  banTimestamp?: string;
  unbanTimestamp?: string;
}

interface VisitorStats {
  total: number;
  active: number;
  banned: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

interface BanAppeal {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  uuid: string;
  banReason: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface VisitorsTabProps {
  visitors: Visitor[];
  stats: VisitorStats;
  selectedVisitors: Set<string>;
  setSelectedVisitors: (visitors: Set<string>) => void;
  filter: 'all' | 'active' | 'banned';
  setFilter: (filter: 'all' | 'active' | 'banned') => void;
  onBulkAction: (action: 'ban' | 'unban', reason?: string) => void;
  onSingleAction: (uuid: string, action: 'ban' | 'unban', reason?: string) => void;
  onRefresh: () => void;
  isProcessing: boolean;
}

interface AppealsTabProps {
  appeals: BanAppeal[];
  stats: { total: number; pending: number };
  onAppealAction: (appealId: string, status: 'approved' | 'rejected', notes?: string) => void;
  onRefresh: () => void;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { checkAuth, logout } = useAdminAuth();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'visitors' | 'appeals'>('visitors');
  
  // Visitors state
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    total: 0,
    active: 0,
    banned: 0,
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  });
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [visitorFilter, setVisitorFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Appeals state
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [appealStats, setAppealStats] = useState({ total: 0, pending: 0 });

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'visitors') {
        fetchVisitors();
      } else {
        fetchAppeals();
      }
    }
  }, [isAuthenticated, activeTab, visitorFilter]);

  const verifyAuth = async () => {
    try {
      const admin = await checkAuth();
      if (admin) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisitors = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString(),
        sortBy: 'lastVisit',
        sortOrder: 'desc'
      });

      if (visitorFilter !== 'all') {
        params.append('status', visitorFilter);
      }

      const response = await fetch(`/api/visitors/list?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors);
        setVisitorStats(data.stats);
      } else {
        throw new Error('Failed to fetch visitors');
      }
    } catch (error) {
      console.error("Error fetching visitors:", error);
      showErrorToast("Failed to load visitors");
    }
  };

  const fetchAppeals = async () => {
    try {
      const response = await fetch('/api/contact/ban-appeal', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAppeals(data.appeals);
        setAppealStats(data.stats);
      } else {
        throw new Error('Failed to fetch appeals');
      }
    } catch (error) {
      console.error("Error fetching appeals:", error);
      showErrorToast("Failed to load appeals");
    }
  };

  const handleBulkAction = async (action: 'ban' | 'unban', reason?: string) => {
    if (selectedVisitors.size === 0) {
      showErrorToast("Please select visitors first");
      return;
    }

    setIsProcessing(true);
    
    showAdminActionToast(action, selectedVisitors.size, async () => {
      try {
        const response = await fetch('/api/visitors/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            action,
            uuids: Array.from(selectedVisitors),
            banReason: reason || `Bulk ${action} by admin`,
            adminId: 'gaurav'
          })
        });

        if (response.ok) {
          const data = await response.json();
          showSuccessToast(`Successfully ${action}ned ${data.processedCount} visitors`);
          setSelectedVisitors(new Set());
          fetchVisitors();
        } else {
          throw new Error(`Failed to ${action} visitors`);
        }
      } catch (error) {
        console.error(`Error ${action}ning visitors:`, error);
        showErrorToast(`Failed to ${action} visitors`);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleSingleAction = async (uuid: string, action: 'ban' | 'unban', reason?: string) => {
    try {
      const response = await fetch('/api/visitors/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          uuid,
          status: action === 'ban' ? 'banned' : 'active',
          banReason: reason || `${action} by admin`,
          adminId: 'gaurav'
        })
      });

      if (response.ok) {
        showSuccessToast(`Visitor ${action}ned successfully`);
        fetchVisitors();
      } else {
        throw new Error(`Failed to ${action} visitor`);
      }
    } catch (error) {
      console.error(`Error ${action}ning visitor:`, error);
      showErrorToast(`Failed to ${action} visitor`);
    }
  };

  const handleAppealAction = async (appealId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const response = await fetch('/api/contact/ban-appeal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          appealId,
          status,
          reviewNotes: notes,
          reviewedBy: 'gaurav'
        })
      });

      if (response.ok) {
        showSuccessToast(`Appeal ${status} successfully`);
        fetchAppeals();
        if (status === 'approved') {
          fetchVisitors(); // Refresh visitors list as user might be unbanned
        }
      } else {
        throw new Error(`Failed to ${status} appeal`);
      }
    } catch (error) {
      console.error(`Error ${status}ing appeal:`, error);
      showErrorToast(`Failed to ${status} appeal`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black-100">
      {/* Header */}
      <header className="bg-black-100/80 backdrop-blur-md border-b border-white/[0.2] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <div className="hidden sm:flex space-x-1">
                <button
                  onClick={() => setActiveTab('visitors')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'visitors'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Visitors ({visitorStats.total})
                </button>
                <button
                  onClick={() => setActiveTab('appeals')}
                  className={`px-4 py-2 rounded-lg transition-colors relative ${
                    activeTab === 'appeals'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Appeals ({appealStats.total})
                  {appealStats.pending > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {appealStats.pending}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">Welcome, Gaurav</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile tab selector */}
      <div className="sm:hidden bg-black-100/50 border-b border-white/[0.1]">
        <div className="flex">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === 'visitors'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Visitors ({visitorStats.total})
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`flex-1 py-3 text-center transition-colors relative ${
              activeTab === 'appeals'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Appeals ({appealStats.total})
            {appealStats.pending > 0 && (
              <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {appealStats.pending}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'visitors' ? (
          <VisitorsTab
            visitors={visitors}
            stats={visitorStats}
            selectedVisitors={selectedVisitors}
            setSelectedVisitors={setSelectedVisitors}
            filter={visitorFilter}
            setFilter={setVisitorFilter}
            onBulkAction={handleBulkAction}
            onSingleAction={handleSingleAction}
            onRefresh={fetchVisitors}
            isProcessing={isProcessing}
          />
        ) : (
          <AppealsTab
            appeals={appeals}
            stats={appealStats}
            onAppealAction={handleAppealAction}
            onRefresh={fetchAppeals}
          />
        )}
      </main>
    </div>
  );
}

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading Admin Dashboard...</p>
      </div>
    </div>
  );
}

// Visitors tab component
function VisitorsTab({
  visitors,
  stats,
  selectedVisitors,
  setSelectedVisitors,
  filter,
  setFilter,
  onBulkAction,
  onSingleAction,
  onRefresh,
  isProcessing
}: VisitorsTabProps) {
  const toggleVisitorSelection = (uuid: string) => {
    const newSelected = new Set(selectedVisitors);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedVisitors(newSelected);
  };

  const selectAll = () => {
    if (selectedVisitors.size === visitors.length) {
      setSelectedVisitors(new Set());
    } else {
      setSelectedVisitors(new Set(visitors.map((v: Visitor) => v.uuid)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Visitors</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Visitors</p>
              <p className="text-3xl font-bold text-green-400">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Banned Visitors</p>
              <p className="text-3xl font-bold text-red-400">{stats.banned}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-black-100/50 border border-white/[0.2] rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Visitors</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>
          
          <button
            onClick={onRefresh}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {selectedVisitors.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-300 text-sm">
              {selectedVisitors.size} selected
            </span>
            <button
              onClick={() => onBulkAction('ban', 'Bulk ban by admin')}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Ban Selected
            </button>
            <button
              onClick={() => onBulkAction('unban')}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Unban Selected
            </button>
          </div>
        )}
      </div>

      {/* Visitors table */}
      <div className="bg-black-100/50 border border-white/[0.2] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black-100/80 border-b border-white/[0.1]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedVisitors.size === visitors.length && visitors.length > 0}
                    onChange={selectAll}
                    className="rounded border-gray-600 bg-black-100 text-blue-500 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Visitor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Device Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Visits
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.1]">
              {visitors.map((visitor: Visitor) => (
                <tr key={visitor.uuid} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVisitors.has(visitor.uuid)}
                      onChange={() => toggleVisitorSelection(visitor.uuid)}
                      className="rounded border-gray-600 bg-black-100 text-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {visitor.uuid.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-400">
                        {visitor.ipAddress}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      visitor.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {visitor.status}
                    </span>
                    {visitor.banReason && (
                      <div className="text-xs text-gray-400 mt-1">
                        {visitor.banReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">
                      {visitor.os} • {visitor.browser}
                    </div>
                    <div className="text-sm text-gray-400">
                      {visitor.device} • {visitor.screenResolution}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">
                      {visitor.visitCount}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">
                      {new Date(visitor.lastVisit).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(visitor.lastVisit).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {visitor.status === 'active' ? (
                        <button
                          onClick={() => onSingleAction(visitor.uuid, 'ban', 'Banned by admin')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          onClick={() => onSingleAction(visitor.uuid, 'unban')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Unban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Appeals tab component
function AppealsTab({ appeals, stats, onAppealAction, onRefresh }: AppealsTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Appeals</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Appeals</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Appeals list */}
      <div className="bg-black-100/50 border border-white/[0.2] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.1] flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Ban Appeals</h3>
          <button
            onClick={onRefresh}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="divide-y divide-white/[0.1]">
          {appeals.map((appeal: BanAppeal) => (
            <div key={appeal.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-white">{appeal.subject}</h4>
                  <p className="text-sm text-gray-400">
                    From: {appeal.name} ({appeal.email})
                  </p>
                  <p className="text-sm text-gray-400">
                    UUID: {appeal.uuid} • Submitted: {new Date(appeal.submittedAt).toLocaleString()}
                  </p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  appeal.status === 'approved' ? 'bg-green-100 text-green-800' :
                  appeal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appeal.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Original ban reason:</p>
                <p className="text-sm text-red-300 bg-red-500/10 p-2 rounded">
                  {appeal.banReason}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Appeal message:</p>
                <p className="text-sm text-white bg-black-100/50 p-3 rounded">
                  {appeal.message}
                </p>
              </div>

              {appeal.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAppealAction(appeal.id, 'approved', 'Appeal approved by admin')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onAppealAction(appeal.id, 'rejected', 'Appeal rejected by admin')}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}

              {appeal.reviewedAt && (
                <div className="mt-4 text-sm text-gray-400">
                  Reviewed by {appeal.reviewedBy} on {new Date(appeal.reviewedAt).toLocaleString()}
                  {appeal.reviewNotes && (
                    <div className="mt-1 text-xs">
                      Notes: {appeal.reviewNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
