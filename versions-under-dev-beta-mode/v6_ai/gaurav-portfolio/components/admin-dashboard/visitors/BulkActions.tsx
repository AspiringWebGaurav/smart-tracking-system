"use client";

import { motion } from "framer-motion";
import { useSoundFeedback, useHapticFeedback } from "../shared/SoundFeedback";

interface BulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: "ban" | "unban", reason?: string) => void;
  isProcessing: boolean;
}

export default function BulkActions({
  selectedCount,
  onBulkAction,
  isProcessing
}: BulkActionsProps) {
  const { playSound } = useSoundFeedback();
  const haptic = useHapticFeedback();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center space-x-4 bg-black-100/80 backdrop-blur-md border border-white/[0.2] rounded-xl px-6 py-3 shadow-lg"
    >
      {/* Selection Count */}
      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{selectedCount}</span>
        </div>
        <span className="text-gray-300 text-sm font-medium">
          {selectedCount} visitor{selectedCount > 1 ? "s" : ""} selected
        </span>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Ban Selected */}
        <motion.button
          onClick={() => {
            onBulkAction("ban", "Bulk ban by admin");
            playSound('click', 0.3);
            haptic.medium();
          }}
          disabled={isProcessing}
          className="bg-red-500/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-red-500/25"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              <span>Ban Selected</span>
            </>
          )}
        </motion.button>

        {/* Unban Selected */}
        <motion.button
          onClick={() => {
            onBulkAction("unban");
            playSound('click', 0.3);
            haptic.medium();
          }}
          disabled={isProcessing}
          className="bg-green-500/80 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-green-500/25"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Unban Selected</span>
        </motion.button>

        {/* Delete Selected */}
        <motion.button
          onClick={() => {
            // TODO: Implement delete functionality
            playSound('click', 0.2);
            haptic.light();
          }}
          disabled={isProcessing}
          className="bg-gray-600/80 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-gray-500/25"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
        </motion.button>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}