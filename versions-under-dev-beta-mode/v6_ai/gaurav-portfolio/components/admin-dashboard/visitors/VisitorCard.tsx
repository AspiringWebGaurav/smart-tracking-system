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

interface VisitorCardProps {
  visitor: Visitor;
  isSelected: boolean;
  onToggleSelection: (uuid: string) => void;
  onSingleAction: (uuid: string, action: "ban" | "unban", reason?: string) => void;
  index: number;
}

export default function VisitorCard({
  visitor,
  isSelected,
  onToggleSelection,
  onSingleAction,
  index
}: VisitorCardProps) {
  const { playSound } = useSoundFeedback();
  const haptic = useHapticFeedback();

  const getDeviceIcon = (device: string, deviceType?: string) => {
    if (deviceType === "mobile" || device === "Mobile") return "📱";
    if (deviceType === "tablet" || device === "Tablet") return "📱";
    return "💻";
  };

  const getStatusColor = (status: string) => {
    return status === "active" 
      ? "bg-green-500/20 text-green-400 border-green-500/30" 
      : "bg-red-500/20 text-red-400 border-red-500/30";
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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-black-100/50 backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 hover:bg-black-100/70 hover:shadow-lg hover:shadow-black/20 group cursor-pointer ${
        isSelected 
          ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20" 
          : "border-white/[0.1] hover:border-white/[0.2]"
      }`}
      onClick={() => {
        onToggleSelection(visitor.uuid);
        playSound('click', 0.1);
        haptic.light();
      }}
    >
      {/* Selection Indicator */}
      <div className="absolute top-4 right-4">
        <motion.div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected 
              ? "bg-blue-500 border-blue-500" 
              : "border-gray-600 group-hover:border-gray-400"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSelected && (
            <motion.svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </motion.svg>
          )}
        </motion.div>
      </div>

      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        {/* Online Status & Device Icon */}
        <div className="flex flex-col items-center space-y-2">
          <motion.div
            className={`w-4 h-4 rounded-full ${
              visitor.isOnline ? "bg-green-400" : "bg-gray-500"
            }`}
            animate={visitor.isOnline ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.span 
            className="text-2xl"
            whileHover={{ scale: 1.2, rotate: 5 }}
          >
            {getDeviceIcon(visitor.device, visitor.deviceInfo?.type)}
          </motion.span>
        </div>

        {/* Visitor Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-white">
              {visitor.uuid.slice(0, 8)}...
            </h3>
            <motion.span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(visitor.status)}`}
              whileHover={{ scale: 1.05 }}
            >
              {visitor.status}
            </motion.span>
          </div>
          
          <p className="text-sm text-gray-400 mb-1">{visitor.ipAddress}</p>
          
          {visitor.adminNotes && (
            <div className="flex items-center space-x-1 text-xs text-blue-300">
              <span>📝</span>
              <span>Has admin notes</span>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center space-x-2 mb-3">
        {visitor.location?.flag && (
          <motion.img
            src={visitor.location.flag}
            alt={visitor.location.countryCode || ""}
            className="w-5 h-4 rounded"
            whileHover={{ scale: 1.2 }}
          />
        )}
        <div>
          <span className="text-sm text-white">
            {visitor.location?.city || "Unknown"}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            {visitor.location?.country || "Unknown"}
          </span>
        </div>
      </div>

      {/* Device & Browser Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Browser</p>
          <p className="text-sm text-white">
            {visitor.deviceInfo?.browser || visitor.browser}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">OS</p>
          <p className="text-sm text-white">
            {visitor.deviceInfo?.os || visitor.os}
          </p>
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Visits</p>
          <p className="text-sm text-white">{visitor.visitCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Session</p>
          <p className="text-sm text-white">
            {visitor.isOnline
              ? `Online ${formatDuration(visitor.sessionDuration)}`
              : "Offline"}
          </p>
        </div>
      </div>

      {/* Source */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Source</p>
        <p className="text-sm text-white">
          {visitor.referralInfo?.source || "Direct"}
        </p>
        {visitor.referralInfo?.firstPage && (
          <p className="text-xs text-gray-400 truncate">
            {visitor.referralInfo.firstPage}
          </p>
        )}
      </div>

      {/* Ban Reason */}
      {visitor.banReason && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-300 mb-1">Ban Reason</p>
          <p className="text-sm text-red-200">{visitor.banReason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 pt-4 border-t border-white/[0.05]">
        {visitor.status === "active" ? (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSingleAction(visitor.uuid, "ban", "Banned by admin");
              playSound('click', 0.2);
              haptic.medium();
            }}
            className="flex-1 bg-red-500/80 hover:bg-red-500 text-white py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-red-500/25"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            🚫 Ban Visitor
          </motion.button>
        ) : (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSingleAction(visitor.uuid, "unban");
              playSound('click', 0.2);
              haptic.medium();
            }}
            className="flex-1 bg-green-500/80 hover:bg-green-500 text-white py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-green-500/25"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            ✅ Unban Visitor
          </motion.button>
        )}
        
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement notes modal
            playSound('click', 0.1);
          }}
          className="bg-blue-500/80 hover:bg-blue-500 text-white py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          📝
        </motion.button>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-green-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-green-500/5 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
}