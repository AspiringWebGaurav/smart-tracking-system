"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/admin-dashboard/core/DashboardLayout";
import AnalyticsGrid from "@/components/admin-dashboard/analytics/AnalyticsGrid";
import NavigationTabs from "@/components/admin-dashboard/core/NavigationTabs";
import VisitorsSection from "@/components/admin-dashboard/visitors/VisitorsSection";
import { FirebaseAuthProvider } from "@/components/admin-dashboard/auth/FirebaseAuthProvider";
import { FallbackAuthProvider } from "@/components/admin-dashboard/auth/FallbackAuth";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/components/ToastSystem";

// Import existing components (we'll keep using them for now)
import AdminAITab from "@/components/admin/AdminAITab";
import { AIQuestion, AdminQuestionFormData } from "@/components/ai-assistant/types";

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

interface BanAppeal {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  uuid: string;
  banReason: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface AnalyticsData {
  totalVisitors: number;
  activeVisitors: number;
  bannedVisitors: number;
  pendingAppeals: number;
  todayVisitors: number;
  onlineVisitors: number;
  totalBans: number;
  recentActivity: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"visitors" | "appeals" | "ai-assistant">("visitors");
  const [isLoading, setIsLoading] = useState(true);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  
  // Data states
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalVisitors: 0,
    activeVisitors: 0,
    bannedVisitors: 0,
    pendingAppeals: 0,
    todayVisitors: 0,
    onlineVisitors: 0,
    totalBans: 0,
    recentActivity: 0,
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Fetch initial data
      await Promise.all([
        fetchVisitors(),
        fetchAppeals(),
        fetchAIQuestions()
      ]);
      
      // Start real-time listeners
      startRealTimeListeners();
      
    } catch (error) {
      console.error("Dashboard initialization failed:", error);
      showErrorToast("Failed to initialize dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisitors = async () => {
    try {
      const response = await fetch("/api/visitors/list?limit=100", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setVisitors(Array.isArray(data.visitors) ? data.visitors : []);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      showErrorToast("Failed to load visitors");
      setVisitors([]);
    }
  };

  const fetchAppeals = async () => {
    try {
      const response = await fetch("/api/contact/ban-appeal", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAppeals(Array.isArray(data.appeals) ? data.appeals : []);
    } catch (error) {
      console.error("Error fetching appeals:", error);
      showErrorToast("Failed to load appeals");
      setAppeals([]);
    }
  };

  const fetchAIQuestions = async () => {
    try {
      const response = await fetch('/api/ai-assistant/questions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAiQuestions(Array.isArray(data.data?.questions) ? data.data.questions : []);
    } catch (error) {
      console.error('Error fetching AI questions:', error);
      showErrorToast('Failed to load AI questions');
      setAiQuestions([]);
    }
  };

  const startRealTimeListeners = () => {
    if (isRealTimeActive) return;

    try {
      console.log("🔥 Starting real-time Firebase listeners");

      // Visitors real-time listener
      const visitorsQuery = query(
        collection(db as any, "visitors"),
        orderBy("lastVisit", "desc")
      );

      const visitorsUnsubscribe = onSnapshot(
        visitorsQuery,
        (snapshot) => {
          console.log("📡 Visitors data updated in real-time");
          fetchVisitors(); // Refresh data
          updateAnalytics();
        },
        (error) => {
          console.error("❌ Visitors listener error:", error);
        }
      );

      // Appeals real-time listener
      const appealsQuery = query(
        collection(db as any, "ban_appeals"),
        orderBy("submittedAt", "desc")
      );

      const appealsUnsubscribe = onSnapshot(
        appealsQuery,
        (snapshot) => {
          console.log("📡 Appeals data updated in real-time");
          fetchAppeals(); // Refresh data
          updateAnalytics();
        },
        (error) => {
          console.error("❌ Appeals listener error:", error);
        }
      );

      setIsRealTimeActive(true);
      showSuccessToast("Live sync enabled");

    } catch (error) {
      console.error("❌ Failed to start real-time listeners:", error);
      showErrorToast("Failed to enable live sync");
    }
  };

  const updateAnalytics = () => {
    const totalVisitors = visitors.length;
    const activeVisitors = visitors.filter(v => v.status === "active").length;
    const bannedVisitors = visitors.filter(v => v.status === "banned").length;
    const pendingAppeals = appeals.filter(a => a.status === "pending").length;
    const todayVisitors = Math.floor(totalVisitors * 0.3); // Mock calculation
    const onlineVisitors = visitors.filter(v => v.isOnline).length;
    const totalBans = bannedVisitors;
    const recentActivity = Math.floor(totalVisitors * 0.05); // Mock calculation

    setAnalyticsData({
      totalVisitors,
      activeVisitors,
      bannedVisitors,
      pendingAppeals,
      todayVisitors,
      onlineVisitors,
      totalBans,
      recentActivity,
    });
  };

  const handleLiveSyncToggle = (enabled: boolean) => {
    setIsRealTimeActive(enabled);
    if (enabled) {
      startRealTimeListeners();
    } else {
      showInfoToast("Live sync paused");
    }
  };

  const handleAddAIQuestion = async (data: AdminQuestionFormData) => {
    try {
      const formData = new FormData();
      formData.append('question', data.question);
      formData.append('answer', data.answer);
      if (data.anchorLink) {
        formData.append('anchorLink', data.anchorLink);
      }
      if (data.file?.file) {
        formData.append('file', data.file.file);
      }

      const response = await fetch('/api/ai-assistant/questions', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add question');
      }

      await fetchAIQuestions();
      showSuccessToast("AI question added successfully");
    } catch (error) {
      console.error('Error adding AI question:', error);
      showErrorToast("Failed to add AI question");
      throw error;
    }
  };

  const handleEditAIQuestion = async (id: string, data: AdminQuestionFormData) => {
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('question', data.question);
      formData.append('answer', data.answer);
      if (data.anchorLink) {
        formData.append('anchorLink', data.anchorLink);
      }
      if (data.file?.file) {
        formData.append('file', data.file.file);
      }

      const response = await fetch('/api/ai-assistant/questions', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update question');
      }

      await fetchAIQuestions();
      showSuccessToast("AI question updated successfully");
    } catch (error) {
      console.error('Error updating AI question:', error);
      showErrorToast("Failed to update AI question");
      throw error;
    }
  };

  const handleDeleteAIQuestion = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-assistant/questions?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete question');
      }

      await fetchAIQuestions();
      showSuccessToast("AI question deleted successfully");
    } catch (error) {
      console.error('Error deleting AI question:', error);
      showErrorToast("Failed to delete AI question");
      throw error;
    }
  };

  // Update analytics when data changes
  useEffect(() => {
    updateAnalytics();
  }, [visitors, appeals]);

  return (
    <FirebaseAuthProvider>
      <FallbackAuthProvider>
        <DashboardLayout>
          {/* Compact Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Analytics */}
            <div className="xl:col-span-1">
              <AnalyticsGrid
                data={analyticsData}
                isLoading={isLoading}
                isRealTime={isRealTimeActive}
              />
            </div>

            {/* Right Column - Main Content */}
            <div className="xl:col-span-2">
              {/* Navigation Tabs */}
              <NavigationTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                stats={{
                  visitors: analyticsData.totalVisitors,
                  appeals: analyticsData.pendingAppeals,
                  aiQuestions: aiQuestions.length
                }}
                isRealTime={isRealTimeActive}
                onLiveSyncToggle={handleLiveSyncToggle}
              />

              {/* Tab Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                {activeTab === "visitors" && (
                  <VisitorsSection
                    visitors={visitors}
                    isRealTime={isRealTimeActive}
                    onRefresh={fetchVisitors}
                  />
                )}

                {activeTab === "appeals" && (
                  <div className="bg-black-100/50 backdrop-blur-md border border-white/[0.1] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-white">Ban Appeals</h2>
                      <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg text-sm transition-colors">
                        🗑️ Delete All
                      </button>
                    </div>
                    <p className="text-gray-400">
                      Appeals management interface will be implemented here with the existing functionality.
                    </p>
                  </div>
                )}

                {activeTab === "ai-assistant" && (
                  <AdminAITab
                    questions={aiQuestions}
                    onAddQuestion={handleAddAIQuestion}
                    onEditQuestion={handleEditAIQuestion}
                    onDeleteQuestion={handleDeleteAIQuestion}
                    onRefresh={fetchAIQuestions}
                    isLoading={isLoading}
                  />
                )}
              </motion.div>
            </div>
          </div>
        </DashboardLayout>
      </FallbackAuthProvider>
    </FirebaseAuthProvider>
  );
}
