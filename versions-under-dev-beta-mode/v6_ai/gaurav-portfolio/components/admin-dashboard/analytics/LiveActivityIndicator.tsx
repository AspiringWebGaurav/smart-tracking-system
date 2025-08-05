"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface LiveActivityIndicatorProps {
  isActive: boolean;
  lastUpdate: Date;
}

export default function LiveActivityIndicator({ isActive, lastUpdate }: LiveActivityIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        setTimeAgo("just now");
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <motion.div
      className="flex items-center space-x-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status Indicator */}
      <div className="relative">
        <motion.div
          className={`w-3 h-3 rounded-full ${
            isActive ? "bg-green-400" : "bg-gray-500"
          }`}
          animate={isActive ? { scale: [1, 1.2, 1] } : {}}
          transition={isActive ? { duration: 2, repeat: Infinity } : {}}
        />
        
        {/* Pulse Ring */}
        {isActive && (
          <motion.div
            className="absolute inset-0 w-3 h-3 rounded-full bg-green-400"
            animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      
      {/* Status Text */}
      <div className="text-sm">
        <span className={`font-medium ${
          isActive ? "text-green-400" : "text-gray-400"
        }`}>
          {isActive ? "Live" : "Offline"}
        </span>
        <span className="text-gray-500 ml-1">• {timeAgo}</span>
      </div>
      
      {/* Activity Bars */}
      {isActive && (
        <div className="flex items-center space-x-0.5">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-green-400 rounded-full"
              animate={{
                height: [4, 12, 4],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}