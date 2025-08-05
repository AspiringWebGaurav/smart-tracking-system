"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSoundFeedback, useHapticFeedback } from "../shared/SoundFeedback";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/components/ToastSystem";
import VisitorTable from "./VisitorTable";
import VisitorCard from "./VisitorCard";
import BulkActions from "./BulkActions";

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

interface VisitorsSectionProps {
  visitors?: Visitor[];
  isRealTime?: boolean;
  onRefresh?: () => Promise<void>;
}

export default function VisitorsSection({
  visitors: externalVisitors,
  isRealTime = false,
  onRefresh
}: VisitorsSectionProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats>({
    total: 0,
    active: 0,
    banned: 0,
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
  });
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const { playSound } = useSoundFeedback();
  const haptic = useHapticFeedback();

  useEffect(() => {
    if (externalVisitors) {
      setVisitors(externalVisitors);
      setIsLoading(false);
    } else {
      fetchVisitors();
    }
  }, [filter, externalVisitors]);

  const fetchVisitors = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: "20",
        offset: ((page - 1) * 20).toString(),
        sortBy: "lastVisit",
        sortOrder: "desc",
      });

      if (filter !== "all") {
        params.append("status", filter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/visitors/list?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setVisitors(Array.isArray(data.visitors) ? data.visitors : []);
      setStats(data.stats || {
        total: 0,
        active: 0,
        banned: 0,
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
      });

      playSound('success', 0.2);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      showErrorToast("Failed to load visitors");
      setVisitors([]);
      playSound('error', 0.3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: "ban" | "unban", reason?: string) => {
    if (selectedVisitors.size === 0) {
      showErrorToast("Please select visitors first");
      haptic.error();
      return;
    }

    setIsProcessing(true);
    playSound('toggle', 0.3);

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
        playSound('success', 0.4);
        haptic.success();
      } else {
        throw new Error(`Failed to ${action} visitors`);
      }
    } catch (error) {
      console.error(`Error ${action}ning visitors:`, error);
      showErrorToast(`Failed to ${action} visitors`);
      playSound('error', 0.3);
      haptic.error();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleAction = async (uuid: string, action: "ban" | "unban", reason?: string) => {
    try {
      playSound('click', 0.2);
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
        playSound('success', 0.3);
        haptic.medium();
      } else {
        throw new Error(`Failed to ${action} visitor`);
      }
    } catch (error) {
      console.error(`Error ${action}ning visitor:`, error);
      showErrorToast(`Failed to ${action} visitor`);
      playSound('error', 0.3);
      haptic.error();
    }
  };

  const toggleVisitorSelection = (uuid: string) => {
    const newSelected = new Set(selectedVisitors);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedVisitors(newSelected);
    playSound('click', 0.1);
    haptic.light();
  };

  const selectAll = () => {
    if (selectedVisitors.size === visitors.length) {
      setSelectedVisitors(new Set());
    } else {
      setSelectedVisitors(new Set(visitors.map(v => v.uuid)));
    }
    playSound('toggle', 0.2);
    haptic.medium();
  };

  const filteredVisitors = visitors.filter(visitor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      visitor.uuid.toLowerCase().includes(query) ||
      visitor.ipAddress.includes(query) ||
      visitor.location?.city?.toLowerCase().includes(query) ||
      visitor.location?.country?.toLowerCase().includes(query) ||
      visitor.browser.toLowerCase().includes(query) ||
      visitor.os.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <motion.h2 
            className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            👥 Visitors Management
          </motion.h2>
          
          {isRealTime && (
            <motion.div
              className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </motion.div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="bg-black-100/50 border border-white/[0.1] rounded-lg p-1 flex">
            <button
              onClick={() => {
                setViewMode("table");
                playSound('click', 0.1);
              }}
              className={`px-3 py-1 rounded text-sm transition-all ${
                viewMode === "table"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📊 Table
            </button>
            <button
              onClick={() => {
                setViewMode("cards");
                playSound('click', 0.1);
              }}
              className={`px-3 py-1 rounded text-sm transition-all ${
                viewMode === "cards"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎴 Cards
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Total Visitors", value: stats.total, icon: "👥", color: "blue" },
          { title: "Active Visitors", value: stats.active, icon: "✅", color: "green" },
          { title: "Banned Visitors", value: stats.banned, icon: "⛔", color: "red" }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            className={`bg-black-100/50 backdrop-blur-md border border-white/[0.1] rounded-xl p-6 hover:bg-black-100/70 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-${stat.color}-500/10 group cursor-pointer`}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                <motion.p 
                  className={`text-3xl font-bold text-white group-hover:text-${stat.color}-300 transition-colors`}
                  key={stat.value}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {stat.value.toLocaleString()}
                </motion.p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-500/20 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              playSound('click', 0.1);
            }}
            className="bg-black-100/50 border border-white/[0.2] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Visitors</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>

          {/* Refresh */}
          <motion.button
            onClick={() => {
              if (onRefresh) {
                onRefresh();
              } else {
                fetchVisitors();
              }
              playSound('refresh', 0.2);
            }}
            className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </motion.button>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedVisitors.size > 0 && (
            <BulkActions
              selectedCount={selectedVisitors.size}
              onBulkAction={handleBulkAction}
              isProcessing={isProcessing}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-black-100/50 border border-white/[0.1] rounded-xl p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredVisitors.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black-100/50 border border-white/[0.1] rounded-xl p-12 text-center"
          >
            <div className="text-6xl mb-4">👻</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Visitors Found</h3>
            <p className="text-gray-400">
              {searchQuery ? "Try adjusting your search query" : "No visitors match the current filter"}
            </p>
          </motion.div>
        ) : viewMode === "table" ? (
          <VisitorTable
            visitors={filteredVisitors}
            selectedVisitors={selectedVisitors}
            onToggleSelection={toggleVisitorSelection}
            onSelectAll={selectAll}
            onSingleAction={handleSingleAction}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisitors.map((visitor, index) => (
              <VisitorCard
                key={visitor.uuid}
                visitor={visitor}
                isSelected={selectedVisitors.has(visitor.uuid)}
                onToggleSelection={toggleVisitorSelection}
                onSingleAction={handleSingleAction}
                index={index}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}