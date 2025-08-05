"use client";

import { motion } from "framer-motion";
import { useSoundFeedback, useHapticFeedback } from "../shared/SoundFeedback";

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

interface VisitorTableProps {
  visitors: Visitor[];
  selectedVisitors: Set<string>;
  onToggleSelection: (uuid: string) => void;
  onSelectAll: () => void;
  onSingleAction: (uuid: string, action: "ban" | "unban", reason?: string) => void;
}

export default function VisitorTable({
  visitors,
  selectedVisitors,
  onToggleSelection,
  onSelectAll,
  onSingleAction
}: VisitorTableProps) {
  const { playSound } = useSoundFeedback();
  const haptic = useHapticFeedback();

  const getDeviceIcon = (device: string, deviceType?: string) => {
    if (deviceType === "mobile" || device === "Mobile") return "📱";
    if (deviceType === "tablet" || device === "Tablet") return "📱";
    return "💻";
  };

  const getStatusColor = (status: string) => {
    return status === "active" 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black-100/50 backdrop-blur-md border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-black-100/80 border-b border-white/[0.1]">
            <tr>
              <th className="px-6 py-4 text-left">
                <motion.input
                  type="checkbox"
                  checked={selectedVisitors.size === visitors.length && visitors.length > 0}
                  onChange={() => {
                    onSelectAll();
                    playSound('toggle', 0.1);
                    haptic.light();
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-black-100 text-blue-500 focus:ring-blue-500 focus:ring-2"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                />
              </th>
              {[
                "Visitor",
                "Status", 
                "Location",
                "Device",
                "Session",
                "Source",
                "Actions"
              ].map((header, index) => (
                <th 
                  key={header}
                  className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {header}
                  </motion.span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-white/[0.05]">
            {visitors.map((visitor, index) => (
              <motion.tr
                key={visitor.uuid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="hover:bg-white/[0.02] transition-colors duration-200 group"
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
              >
                {/* Checkbox */}
                <td className="px-6 py-4">
                  <motion.input
                    type="checkbox"
                    checked={selectedVisitors.has(visitor.uuid)}
                    onChange={() => {
                      onToggleSelection(visitor.uuid);
                      playSound('click', 0.1);
                      haptic.light();
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-black-100 text-blue-500 focus:ring-blue-500 focus:ring-2"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                </td>

                {/* Visitor Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {/* Online Status */}
                    <motion.div
                      className={`w-3 h-3 rounded-full ${
                        visitor.isOnline ? "bg-green-400" : "bg-gray-500"
                      }`}
                      animate={visitor.isOnline ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    <div>
                      <div className="text-sm font-medium text-white">
                        {visitor.uuid.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-400">
                        {visitor.ipAddress}
                      </div>
                      {visitor.adminNotes && (
                        <div className="text-xs text-blue-300 mt-1 flex items-center space-x-1">
                          <span>📝</span>
                          <span>Has notes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <motion.span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(visitor.status)}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {visitor.status}
                    </motion.span>
                    {visitor.isOnline && (
                      <motion.span 
                        className="text-xs text-green-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ●
                      </motion.span>
                    )}
                  </div>
                  {visitor.banReason && (
                    <div className="text-xs text-red-300 mt-1 max-w-32 truncate">
                      {visitor.banReason}
                    </div>
                  )}
                </td>

                {/* Location */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {visitor.location?.flag && (
                      <motion.img
                        src={visitor.location.flag}
                        alt={visitor.location.countryCode}
                        className="w-5 h-4 rounded"
                        whileHover={{ scale: 1.2 }}
                      />
                    )}
                    <div>
                      <div className="text-sm text-white">
                        {visitor.location?.city || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {visitor.location?.country || "Unknown"}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Device */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <motion.span 
                      className="text-xl"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                    >
                      {getDeviceIcon(visitor.device, visitor.deviceInfo?.type)}
                    </motion.span>
                    <div>
                      <div className="text-sm text-white">
                        {visitor.deviceInfo?.browser || visitor.browser}
                      </div>
                      <div className="text-xs text-gray-400">
                        {visitor.deviceInfo?.os || visitor.os} • {visitor.deviceInfo?.type || visitor.device}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Session */}
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm text-white">
                      {visitor.visitCount} visits
                    </div>
                    <div className="text-xs text-gray-400">
                      {visitor.isOnline
                        ? `Online ${formatDuration(visitor.sessionDuration)}`
                        : visitor.lastSeen
                        ? `Last seen ${new Date(visitor.lastSeen).toLocaleTimeString()}`
                        : `Last: ${new Date(visitor.lastVisit).toLocaleTimeString()}`}
                    </div>
                  </div>
                </td>

                {/* Source */}
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm text-white">
                      {visitor.referralInfo?.source || "Direct"}
                    </div>
                    <div className="text-xs text-gray-400 max-w-24 truncate">
                      {visitor.referralInfo?.firstPage || "/"}
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {visitor.status === "active" ? (
                      <motion.button
                        onClick={() => {
                          onSingleAction(visitor.uuid, "ban", "Banned by admin");
                          playSound('click', 0.2);
                          haptic.medium();
                        }}
                        className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-xs transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Ban
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => {
                          onSingleAction(visitor.uuid, "unban");
                          playSound('click', 0.2);
                          haptic.medium();
                        }}
                        className="bg-green-500/80 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-xs transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Unban
                      </motion.button>
                    )}
                    
                    <motion.button
                      onClick={() => {
                        // TODO: Implement notes modal
                        playSound('click', 0.1);
                      }}
                      className="bg-blue-500/80 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs transition-all duration-200 flex items-center space-x-1 shadow-lg hover:shadow-blue-500/25"
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Notes</span>
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-black-100/60 border-t border-white/[0.05] px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Showing {visitors.length} visitors</span>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>Real-time updates</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}