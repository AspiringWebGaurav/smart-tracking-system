"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface NavigationTabsProps {
  activeTab: "visitors" | "appeals" | "ai-assistant";
  onTabChange: (tab: "visitors" | "appeals" | "ai-assistant") => void;
  stats: {
    visitors: number;
    appeals: number;
    aiQuestions: number;
  };
  isRealTime?: boolean;
  onLiveSyncToggle?: (enabled: boolean) => void;
}

export default function NavigationTabs({
  activeTab,
  onTabChange,
  stats,
  isRealTime = false,
  onLiveSyncToggle
}: NavigationTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabs = [
    {
      id: "visitors",
      label: "Visitors",
      icon: "👥",
      count: stats.visitors,
      color: "blue",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "appeals",
      label: "Appeals",
      icon: "📨",
      count: stats.appeals,
      color: "yellow",
      gradient: "from-yellow-500 to-yellow-600",
      urgent: stats.appeals > 0
    },
    {
      id: "ai-assistant",
      label: "AI Assistant",
      icon: "🤖",
      count: stats.aiQuestions,
      color: "purple",
      gradient: "from-purple-500 to-purple-600"
    }
  ];

  const handleLiveSyncToggle = () => {
    onLiveSyncToggle?.(!isRealTime);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Desktop Navigation */}
        <div className="hidden sm:flex bg-black-100/50 backdrop-blur-md border border-white/[0.1] rounded-2xl p-2">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`relative px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                activeTab === tab.id
                  ? "text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active Background */}
              {activeTab === tab.id && (
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl shadow-lg`}
                  layoutId="activeTab"
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Hover Background */}
              {hoveredTab === tab.id && activeTab !== tab.id && (
                <motion.div
                  className="absolute inset-0 bg-white/[0.05] rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center space-x-3">
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                
                {/* Count Badge */}
                <motion.div
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-600/50 text-gray-300"
                  } ${tab.urgent ? "animate-pulse" : ""}`}
                  key={tab.count}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.count}
                </motion.div>

                {/* Urgent Indicator */}
                {tab.urgent && tab.count > 0 && (
                  <motion.div
                    className="w-2 h-2 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden bg-black-100/50 backdrop-blur-md border border-white/[0.1] rounded-2xl overflow-hidden">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`flex-1 py-4 px-2 text-center transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {/* Active Background */}
                {activeTab === tab.id && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient}`}
                    layoutId="mobileActiveTab"
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Content */}
                <div className="relative z-10 space-y-1">
                  <div className="text-lg">{tab.icon}</div>
                  <div className="text-xs font-medium">{tab.label}</div>
                  <div className={`text-xs ${
                    activeTab === tab.id ? "text-white/80" : "text-gray-500"
                  }`}>
                    ({tab.count})
                  </div>
                </div>

                {/* Urgent Indicator */}
                {tab.urgent && tab.count > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Live Sync Toggle */}
          <motion.button
            onClick={handleLiveSyncToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              isRealTime
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-2 h-2 rounded-full ${
              isRealTime ? "bg-green-400 animate-pulse" : "bg-gray-400"
            }`} />
            <span className="text-sm font-medium">
              {isRealTime ? "Live Sync" : "Sync Paused"}
            </span>
          </motion.button>

          {/* Refresh Button */}
          <motion.button
            onClick={() => window.location.reload()}
            className="p-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 hover:text-white border border-gray-600/30 rounded-xl transition-all duration-300"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Tab Indicator Line */}
      <div className="hidden sm:block mt-6 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
    </motion.section>
  );
}