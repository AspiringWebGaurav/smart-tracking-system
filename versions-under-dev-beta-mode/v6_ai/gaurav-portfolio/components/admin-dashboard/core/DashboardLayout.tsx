"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "./DashboardHeader";
import WelcomeSection from "./WelcomeSection";
import { AuthGuard } from "../auth/AuthGuard";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black-100">
        {/* Elite Header */}
        <DashboardHeader />
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <WelcomeSection />
          
          {/* Dashboard Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  );
}