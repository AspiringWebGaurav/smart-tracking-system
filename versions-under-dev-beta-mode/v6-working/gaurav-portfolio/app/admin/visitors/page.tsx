"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import {
  showSuccessToast,
  showErrorToast,
  showAdminActionToast,
  showInfoToast,
} from "@/components/ToastSystem";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import EnhancedBanModal from "@/components/admin/EnhancedBanModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import AdminNotesModal from "@/components/admin/AdminNotesModal";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import UnifiedNavbar from "@/components/admin/UnifiedNavbar";
import { formatTimeIST, formatDuration } from "@/utils/timeFormat";

interface Visitor {
  id: string;
  uuid: string;
  status: "active" | "banned";
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
  isOnline?: boolean;
  lastSeen?: string;
  sessionStart?: string;
  sessionDuration?: number;
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
    flag?: string;
  };
  deviceInfo?: {
    type: "mobile" | "tablet" | "desktop";
    browser: string;
    os: string;
    icon?: string;
  };
  referralInfo?: {
    source: string;
    firstPage: string;
    referrer?: string;
  };
  adminNotes?: string;
}

interface VisitorStats {
  total: number;
  active: number;
  banned: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export default function VisitorsPage() {
  const router = useRouter();
  const { checkAuth } = useAdminAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    total: 0,
    active: 0,
    banned: 0,
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
  });
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [visitorFilter, setVisitorFilter] = useState<"all" | "active" | "banned">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{
    type: "visitor";
    items: string[];
    title: string;
    message: string;
  } | null>(null);
  const [notesModalData, setNotesModalData] = useState<{
    uuid: string;
    currentNotes?: string;
  } | null>(null);

  // Real-time listener
  const visitorsUnsubscribeRef = useRef<(() => void) | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVisitors();
      startRealTimeListener();
    }

    return () => {
      if (visitorsUnsubscribeRef.current) {
        visitorsUnsubscribeRef.current();
      }
    };
  }, [isAuthenticated, visitorFilter]);

  const verifyAuth = async () => {
    try {
      const admin = await checkAuth();
      if (admin) {
        setIsAuthenticated(true);
      } else {
        showErrorToast("Authentication required. Redirecting to login...");
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
      showErrorToast("Authentication failed. Please login again.");
      router.push("/admin/login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisitors = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: ((page - 1) * 50).toString(),
        sortBy: "lastVisit",
        sortOrder: "desc",
      });

      if (visitorFilter !== "all") {
        params.append("status", visitorFilter);
      }

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(`/api/visitors/list?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          showErrorToast("Session expired. Please login again.");
          router.push("/admin/login");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setVisitors(Array.isArray(data.visitors) ? data.visitors : []);
      setVisitorStats(
        data.stats || {
          total: 0,
          active: 0,
          banned: 0,
          currentPage: 1,
          totalPages: 1,
          hasMore: false,
        }
      );
    } catch (error) {
      console.error("Error fetching visitors:", error);
      showErrorToast(`Failed to load visitors: ${error instanceof Error ? error.message : "Unknown error"}`);
      setVisitors([]);
      setVisitorStats({
        total: 0,
        active: 0,
        banned: 0,
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
      });
    }
  };

  const startRealTimeListener = () => {
    if (isRealTimeActive) return;

    try {
      const visitorsQuery = query(
        collection(db as any, "visitors"),
        orderBy("lastVisit", "desc")
      );

      const visitorsUnsubscribe = onSnapshot(
        visitorsQuery,
        (snapshot) => {
          if (!snapshot.metadata.fromCache) {
            fetchVisitors();
          }
        },
        (error) => {
          console.error("Visitors listener error:", error);
        }
      );

      visitorsUnsubscribeRef.current = visitorsUnsubscribe;
      setIsRealTimeActive(true);
    } catch (error) {
      console.error("Failed to start real-time listener:", error);
    }
  };

  const handleBulkAction = async (action: "ban" | "unban", reason?: string) => {
    if (selectedVisitors.size === 0) {
      showErrorToast("Please select visitors first");
      return;
    }

    if (action === "ban") {
      setShowBanModal(true);
      return;
    }

    setIsProcessing(true);

    showAdminActionToast(action, selectedVisitors.size, async () => {
      try {
        const response = await fetch("/api/visitors/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action,
            uuids: Array.from(selectedVisitors),
            banReason: reason || `Bulk ${action} by admin`,
            adminId: "gaurav",
          }),
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

  const handleSingleAction = async (uuid: string, action: "ban" | "unban", reason?: string) => {
    try {
      const response = await fetch("/api/visitors/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          uuid,
          status: action === "ban" ? "banned" : "active",
          banReason: reason || `${action} by admin`,
          adminId: "gaurav",
        }),
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

  const handleDeleteVisitors = (uuids: string[]) => {
    setDeleteConfig({
      type: "visitor",
      items: uuids,
      title: "Delete Visitors",
      message: `Are you sure you want to permanently delete ${uuids.length} visitor${
        uuids.length > 1 ? "s" : ""
      }? This will remove all visitor data including tracking history.`,
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfig) return;

    try {
      const deletePromises = deleteConfig.items.map(async (visitorUuid) => {
        const response = await fetch("/api/visitors/list", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            uuid: visitorUuid,
            adminId: "gaurav",
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to delete ${visitorUuid}`);
        }
        return visitorUuid;
      });

      await Promise.all(deletePromises);
      showSuccessToast(`Successfully deleted ${deleteConfig.items.length} visitor${deleteConfig.items.length > 1 ? "s" : ""}`);
      setSelectedVisitors(new Set());
      fetchVisitors();
    } catch (error) {
      console.error("Delete operation failed:", error);
      showErrorToast("Failed to delete visitors. Please try again.");
    }
  };

  const handleEditNotes = (uuid: string, currentNotes?: string) => {
    setNotesModalData({ uuid, currentNotes });
    setShowNotesModal(true);
  };

  const handleNotesUpdated = () => {
    fetchVisitors();
    setShowNotesModal(false);
    setNotesModalData(null);
  };

  const handleBanComplete = () => {
    setSelectedVisitors(new Set());
    fetchVisitors();
  };

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
      setSelectedVisitors(new Set(visitors.map((v) => v.uuid)));
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      visitor.uuid.toLowerCase().includes(query) ||
      visitor.ipAddress.toLowerCase().includes(query) ||
      visitor.location?.city?.toLowerCase().includes(query) ||
      visitor.location?.country?.toLowerCase().includes(query) ||
      visitor.browser.toLowerCase().includes(query) ||
      visitor.os.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading Visitors...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLiveSyncToggle = (enabled: boolean) => {
    setIsRealTimeActive(enabled);
    if (enabled) {
      startRealTimeListener();
      showSuccessToast("Live sync enabled");
    } else {
      if (visitorsUnsubscribeRef.current) {
        visitorsUnsubscribeRef.current();
        visitorsUnsubscribeRef.current = null;
      }
      showInfoToast("Live sync paused");
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 page-container">
        {/* Unified Navbar */}
        <UnifiedNavbar
          visitorStats={visitorStats}
          appealStats={{ total: 0, pending: 0 }}
          aiQuestionCount={0}
          isRealTimeActive={isRealTimeActive}
          onLiveSyncToggle={handleLiveSyncToggle}
        />

        {/* Main Content */}
        <main className="px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-light p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Visitors</p>
                  <p className="text-3xl font-bold text-slate-900">{visitorStats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card-light p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Active Visitors</p>
                  <p className="text-3xl font-bold text-emerald-600">{visitorStats.active}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card-light p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Banned Visitors</p>
                  <p className="text-3xl font-bold text-red-600">{visitorStats.banned}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="card-light p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <select
                  value={visitorFilter}
                  onChange={(e) => setVisitorFilter(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Filter visitors by status"
                  aria-label="Filter visitors by status"
                >
                  <option value="all">All Visitors</option>
                  <option value="active">Active Only</option>
                  <option value="banned">Banned Only</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search visitors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <button
                  onClick={() => fetchVisitors()}
                  className="btn-secondary"
                >
                  Refresh
                </button>
              </div>

              {selectedVisitors.size > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-slate-600 text-sm font-medium">
                    {selectedVisitors.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction("ban")}
                    disabled={isProcessing}
                    className="btn-danger"
                  >
                    Ban Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction("unban")}
                    disabled={isProcessing}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Unban Selected
                  </button>
                  <button
                    onClick={() => handleDeleteVisitors(Array.from(selectedVisitors))}
                    disabled={isProcessing}
                    className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Visitors Table */}
          <div className="card-light overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedVisitors.size === filteredVisitors.length && filteredVisitors.length > 0}
                        onChange={selectAll}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                        title="Select all visitors"
                        aria-label="Select all visitors"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Visitor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Device Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.uuid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedVisitors.has(visitor.uuid)}
                          onChange={() => toggleVisitorSelection(visitor.uuid)}
                          className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                          title={`Select visitor ${visitor.uuid.slice(0, 8)}`}
                          aria-label={`Select visitor ${visitor.uuid.slice(0, 8)}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              visitor.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {visitor.uuid.slice(0, 8)}...
                            </div>
                            <div className="text-sm text-slate-500">{visitor.ipAddress}</div>
                            {visitor.adminNotes && (
                              <div className="text-xs text-blue-600 mt-1">📝 Has notes</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              visitor.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {visitor.status}
                          </span>
                          {visitor.isOnline && <span className="text-xs text-emerald-500">●</span>}
                        </div>
                        {visitor.banReason && (
                          <div className="text-xs text-slate-500 mt-1">{visitor.banReason}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {visitor.location?.flag && (
                            <img
                              src={visitor.location.flag}
                              alt={visitor.location.countryCode}
                              className="w-4 h-3"
                            />
                          )}
                          <div>
                            <div className="text-sm text-slate-900">
                              {visitor.location?.city || "Unknown"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {visitor.location?.country || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {visitor.deviceInfo?.icon ||
                              (visitor.device === "Mobile" ? "📱" : visitor.device === "Tablet" ? "📱" : "💻")}
                          </span>
                          <div>
                            <div className="text-sm text-slate-900">
                              {visitor.deviceInfo?.browser || visitor.browser}
                            </div>
                            <div className="text-xs text-slate-500">
                              {visitor.deviceInfo?.os || visitor.os} • {visitor.deviceInfo?.type || visitor.device}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-slate-900">{visitor.visitCount} visits</div>
                          <div className="text-xs text-slate-500">
                            {visitor.isOnline
                              ? `Online for ${formatDuration(Math.floor((visitor.sessionDuration || 0) / 60))}`
                              : visitor.lastSeen
                              ? `Last seen ${formatTimeIST(visitor.lastSeen)}`
                              : `Last: ${formatTimeIST(visitor.lastVisit)}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-slate-900">
                            {visitor.referralInfo?.source || "Direct"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {visitor.referralInfo?.firstPage || "/"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {visitor.status === "active" ? (
                            <button
                              onClick={() => handleSingleAction(visitor.uuid, "ban", "Banned by admin")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                              Ban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSingleAction(visitor.uuid, "unban")}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                              Unban
                            </button>
                          )}
                          <button
                            onClick={() => handleEditNotes(visitor.uuid, visitor.adminNotes)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Notes
                          </button>
                          <button
                            onClick={() => handleDeleteVisitors([visitor.uuid])}
                            className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVisitors.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-slate-900 text-lg font-medium mb-2">No visitors found</h3>
                <p className="text-slate-500 text-sm">
                  {searchQuery.trim() ? "Try adjusting your search criteria" : "No visitors match the current filter"}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Modals */}
        <EnhancedBanModal
          isOpen={showBanModal}
          onClose={() => setShowBanModal(false)}
          selectedUUIDs={Array.from(selectedVisitors)}
          onBanComplete={handleBanComplete}
        />

        {deleteConfig && (
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeleteConfig(null);
            }}
            onConfirm={handleConfirmDelete}
            title={deleteConfig.title}
            message={deleteConfig.message}
            itemCount={deleteConfig.items.length}
            type={deleteConfig.type}
          />
        )}

        {notesModalData && (
          <AdminNotesModal
            isOpen={showNotesModal}
            onClose={() => {
              setShowNotesModal(false);
              setNotesModalData(null);
            }}
            visitorUuid={notesModalData.uuid}
            currentNotes={notesModalData.currentNotes}
            onNotesUpdated={handleNotesUpdated}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
                  