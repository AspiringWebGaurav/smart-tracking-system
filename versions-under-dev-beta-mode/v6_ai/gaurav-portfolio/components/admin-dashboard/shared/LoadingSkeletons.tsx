"use client";

import { motion } from "framer-motion";

// Base skeleton component with shimmer effect
function SkeletonBase({ 
  className = "", 
  children 
}: { 
  className?: string; 
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden bg-gray-700/50 rounded ${className}`}>
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      {children}
    </div>
  );
}

// Analytics card skeleton
export function AnalyticsCardSkeleton() {
  return (
    <motion.div
      className="bg-black-100/50 border border-white/[0.1] rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <SkeletonBase className="w-12 h-12 rounded-full" />
        <SkeletonBase className="w-3 h-3 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-8 w-16" />
        <SkeletonBase className="h-3 w-12" />
      </div>
    </motion.div>
  );
}

// Welcome section skeleton
export function WelcomeSectionSkeleton() {
  return (
    <motion.div
      className="bg-black-100/50 border border-white/[0.1] rounded-2xl p-8 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="space-y-3">
          <SkeletonBase className="h-8 w-64" />
          <SkeletonBase className="h-4 w-96" />
        </div>
        <div className="space-y-2">
          <SkeletonBase className="h-6 w-20" />
          <SkeletonBase className="h-4 w-32" />
        </div>
      </div>
    </motion.div>
  );
}

// Navigation tabs skeleton
export function NavigationTabsSkeleton() {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex bg-black-100/50 border border-white/[0.1] rounded-2xl p-2 space-x-2">
          {[...Array(3)].map((_, i) => (
            <SkeletonBase key={i} className="h-12 w-32 rounded-xl" />
          ))}
        </div>
        <div className="flex space-x-2">
          <SkeletonBase className="h-10 w-24 rounded-xl" />
          <SkeletonBase className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </motion.div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <motion.div
      className="bg-black-100/50 border border-white/[0.1] rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-black-100/80 border-b border-white/[0.1] p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, i) => (
            <SkeletonBase key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-white/[0.1]">
        {[...Array(rows)].map((_, rowIndex) => (
          <motion.div
            key={rowIndex}
            className="p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rowIndex * 0.1, duration: 0.3 }}
          >
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <div key={colIndex} className="space-y-2">
                  <SkeletonBase className="h-4 w-full" />
                  {colIndex === 0 && <SkeletonBase className="h-3 w-3/4" />}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Card list skeleton (for appeals, etc.)
export function CardListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {[...Array(items)].map((_, index) => (
        <motion.div
          key={index}
          className="bg-black-100/50 border border-white/[0.1] rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <SkeletonBase className="h-5 w-48" />
              <SkeletonBase className="h-4 w-64" />
              <SkeletonBase className="h-3 w-32" />
            </div>
            <SkeletonBase className="h-6 w-16 rounded-full" />
          </div>
          
          <div className="space-y-3 mb-4">
            <SkeletonBase className="h-4 w-full" />
            <SkeletonBase className="h-4 w-5/6" />
            <SkeletonBase className="h-4 w-4/6" />
          </div>
          
          <div className="flex space-x-2">
            <SkeletonBase className="h-8 w-20 rounded-lg" />
            <SkeletonBase className="h-8 w-20 rounded-lg" />
            <SkeletonBase className="h-8 w-16 rounded-lg" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <motion.div
      className="bg-black-100/50 border border-white/[0.1] rounded-xl p-6 space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {[...Array(4)].map((_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-10 w-full rounded-lg" />
        </div>
      ))}
      
      <div className="flex space-x-3 pt-4">
        <SkeletonBase className="h-10 w-24 rounded-lg" />
        <SkeletonBase className="h-10 w-20 rounded-lg" />
      </div>
    </motion.div>
  );
}

// Dashboard skeleton (full page)
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black-100">
      {/* Header skeleton */}
      <div className="bg-black-100/80 backdrop-blur-md border-b border-white/[0.2] h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SkeletonBase className="w-8 h-8 rounded-lg" />
            <SkeletonBase className="h-6 w-48" />
            <SkeletonBase className="h-6 w-16 rounded-lg" />
          </div>
          <div className="flex items-center space-x-4">
            <SkeletonBase className="w-8 h-8 rounded-full" />
            <SkeletonBase className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeSectionSkeleton />
        
        {/* Analytics grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, index) => (
            <AnalyticsCardSkeleton key={index} />
          ))}
        </div>

        <NavigationTabsSkeleton />
        
        {/* Content skeleton */}
        <TableSkeleton />
      </main>
    </div>
  );
}

// Loading overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black-100/80 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-black-100/90 border border-white/[0.2] rounded-2xl p-8 text-center space-y-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-white text-lg font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
}

// Pulse skeleton for real-time updates
export function PulseSkeleton({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}