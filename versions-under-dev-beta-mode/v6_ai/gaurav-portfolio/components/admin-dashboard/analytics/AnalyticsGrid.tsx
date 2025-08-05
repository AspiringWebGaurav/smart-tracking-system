"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import MetricsCard from "./MetricsCard";
import LiveActivityIndicator from "./LiveActivityIndicator";

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

interface AnalyticsGridProps {
  data: AnalyticsData;
  isLoading?: boolean;
  isRealTime?: boolean;
}

export default function AnalyticsGrid({ 
  data, 
  isLoading = false, 
  isRealTime = false 
}: AnalyticsGridProps) {
  const [animatedData, setAnimatedData] = useState<AnalyticsData>(data);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!isLoading) {
      animateNumbers();
      setLastUpdate(new Date());
    }
  }, [data, isLoading]);

  const animateNumbers = () => {
    const duration = 1000;
    const steps = 30;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedData({
        totalVisitors: Math.round(animatedData.totalVisitors + (data.totalVisitors - animatedData.totalVisitors) * easeOutQuart),
        activeVisitors: Math.round(animatedData.activeVisitors + (data.activeVisitors - animatedData.activeVisitors) * easeOutQuart),
        bannedVisitors: Math.round(animatedData.bannedVisitors + (data.bannedVisitors - animatedData.bannedVisitors) * easeOutQuart),
        pendingAppeals: Math.round(animatedData.pendingAppeals + (data.pendingAppeals - animatedData.pendingAppeals) * easeOutQuart),
        todayVisitors: Math.round(animatedData.todayVisitors + (data.todayVisitors - animatedData.todayVisitors) * easeOutQuart),
        onlineVisitors: Math.round(animatedData.onlineVisitors + (data.onlineVisitors - animatedData.onlineVisitors) * easeOutQuart),
        totalBans: Math.round(animatedData.totalBans + (data.totalBans - animatedData.totalBans) * easeOutQuart),
        recentActivity: Math.round(animatedData.recentActivity + (data.recentActivity - animatedData.recentActivity) * easeOutQuart),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedData(data);
      }
    }, stepDuration);
  };

  const metrics = [
    {
      id: "total-visitors",
      title: "Total Visitors",
      value: animatedData.totalVisitors,
      icon: "👥",
      color: "blue",
      gradient: "from-blue-500/20 to-blue-600/20",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      textColor: "text-blue-300",
      trend: "+12%",
      trendUp: true
    },
    {
      id: "active-now",
      title: "Active Now",
      value: animatedData.onlineVisitors,
      icon: "🟢",
      color: "green",
      gradient: "from-green-500/20 to-green-600/20",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      textColor: "text-green-300",
      pulse: true,
      trend: "Live",
      trendUp: true
    },
    {
      id: "today-visitors",
      title: "Today's Visitors",
      value: animatedData.todayVisitors,
      icon: "📅",
      color: "purple",
      gradient: "from-purple-500/20 to-purple-600/20",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      textColor: "text-purple-300",
      trend: "+8%",
      trendUp: true
    },
    {
      id: "pending-appeals",
      title: "Pending Appeals",
      value: animatedData.pendingAppeals,
      icon: "📨",
      color: "yellow",
      gradient: "from-yellow-500/20 to-yellow-600/20",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      textColor: "text-yellow-300",
      badge: animatedData.pendingAppeals > 0,
      urgent: animatedData.pendingAppeals > 5
    },
    {
      id: "active-visitors",
      title: "Active Visitors",
      value: animatedData.activeVisitors,
      icon: "✅",
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-600/20",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      textColor: "text-emerald-300",
      trend: "+5%",
      trendUp: true
    },
    {
      id: "banned-visitors",
      title: "Banned Visitors",
      value: animatedData.bannedVisitors,
      icon: "⛔",
      color: "red",
      gradient: "from-red-500/20 to-red-600/20",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      textColor: "text-red-300",
      trend: "-2%",
      trendUp: false
    },
    {
      id: "total-bans",
      title: "Total Bans",
      value: animatedData.totalBans,
      icon: "📊",
      color: "orange",
      gradient: "from-orange-500/20 to-orange-600/20",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      textColor: "text-orange-300"
    },
    {
      id: "recent-activity",
      title: "Recent Activity",
      value: animatedData.recentActivity,
      icon: "⚡",
      color: "indigo",
      gradient: "from-indigo-500/20 to-indigo-600/20",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
      textColor: "text-indigo-300",
      pulse: isRealTime
    }
  ];

  if (isLoading) {
    return <AnalyticsGridSkeleton />;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-8"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-white">Analytics Overview</h2>
          <LiveActivityIndicator isActive={isRealTime} lastUpdate={lastUpdate} />
        </div>
        
        {/* Real-time indicator */}
        {isRealTime && (
          <motion.div
            className="flex items-center space-x-2 text-sm text-green-400"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live Updates</span>
          </motion.div>
        )}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricsCard
            key={metric.id}
            {...metric}
            index={index}
            isRealTime={isRealTime}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <motion.div
        className="mt-6 bg-black-100/30 backdrop-blur-md border border-white/[0.1] rounded-xl p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-400">
          <span>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <span>
            System Status: {isRealTime ? "🟢 Live" : "⏸️ Paused"}
          </span>
          <span>
            Total Events: {animatedData.totalVisitors + animatedData.totalBans + animatedData.pendingAppeals}
          </span>
        </div>
      </motion.div>
    </motion.section>
  );
}

// Loading skeleton component
function AnalyticsGridSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-48 bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-black-100/50 border border-white/[0.1] rounded-xl p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full" />
              <div className="w-3 h-3 bg-gray-700 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-700 rounded" />
              <div className="h-8 w-16 bg-gray-700 rounded" />
              <div className="h-3 w-12 bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}