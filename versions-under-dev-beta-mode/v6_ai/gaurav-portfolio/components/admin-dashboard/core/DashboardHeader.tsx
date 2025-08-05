"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "../auth/FirebaseAuthProvider";
import { useFallbackAuth } from "../auth/FallbackAuth";
import { showSuccessToast, showInfoToast } from "@/components/ToastSystem";

interface DashboardHeaderProps {
  isRealTimeActive?: boolean;
  onLiveSyncToggle?: (enabled: boolean) => void;
}

export default function DashboardHeader({ 
  isRealTimeActive = false, 
  onLiveSyncToggle 
}: DashboardHeaderProps) {
  const router = useRouter();
  const firebaseAuth = useFirebaseAuth();
  const fallbackAuth = useFallbackAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Sign out from both systems
      if (firebaseAuth.user) {
        await firebaseAuth.signOutUser();
      }
      
      if (fallbackAuth.isAuthenticated) {
        fallbackAuth.signOut();
      }
      
      showSuccessToast("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLiveSyncToggle = () => {
    const newState = !isRealTimeActive;
    onLiveSyncToggle?.(newState);
    
    if (newState) {
      showSuccessToast("Live sync enabled");
    } else {
      showInfoToast("Live sync paused");
    }
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-black-100/80 backdrop-blur-md border-b border-white/[0.2] sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Logo & Title */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center space-x-3">
              {/* Elite Logo */}
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                {/* Pulse effect for live sync */}
                {isRealTimeActive && (
                  <div className="absolute -inset-1 bg-green-500/20 rounded-lg animate-pulse"></div>
                )}
              </div>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Smart Tracking Admin
              </h1>
            </div>

            {/* Live Sync Toggle */}
            <motion.button
              onClick={handleLiveSyncToggle}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                isRealTimeActive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-2 h-2 rounded-full ${
                isRealTimeActive ? "bg-green-400 animate-pulse" : "bg-gray-400"
              }`} />
              <span className="text-sm font-medium">
                {isRealTimeActive ? "Live" : "Paused"}
              </span>
            </motion.button>
          </motion.div>

          {/* Right Section - Admin Info & Actions */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Admin Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">Gaurav</p>
                <p className="text-xs text-gray-400 flex items-center space-x-1">
                  <span>Administrator</span>
                  {firebaseAuth.user && (
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" title="Firebase Auth" />
                  )}
                  {fallbackAuth.isAuthenticated && (
                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" title="Fallback Auth" />
                  )}
                </p>
              </div>
              
              {/* Elite Avatar */}
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">G</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black-100 animate-pulse"></div>
              </div>
            </div>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-500/90 hover:bg-red-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-red-500/25"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              )}
              <span className="hidden sm:inline">
                {isLoggingOut ? "Signing out..." : "Logout"}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}