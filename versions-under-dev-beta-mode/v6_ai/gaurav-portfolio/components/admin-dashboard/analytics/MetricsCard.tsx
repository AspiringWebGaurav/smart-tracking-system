"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface MetricsCardProps {
  id: string;
  title: string;
  value: number;
  icon: string;
  color: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  index: number;
  isRealTime?: boolean;
  pulse?: boolean;
  badge?: boolean;
  urgent?: boolean;
  trend?: string;
  trendUp?: boolean;
}

export default function MetricsCard({
  id,
  title,
  value,
  icon,
  color,
  gradient,
  iconBg,
  iconColor,
  textColor,
  index,
  isRealTime = false,
  pulse = false,
  badge = false,
  urgent = false,
  trend,
  trendUp
}: MetricsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.5,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group cursor-pointer ${
        urgent ? 'animate-pulse' : ''
      }`}
    >
      {/* Main Card */}
      <div className="relative bg-black-100/50 backdrop-blur-md border border-white/[0.1] rounded-xl p-6 h-full overflow-hidden transition-all duration-300 hover:bg-black-100/70 hover:border-white/[0.2] hover:shadow-lg hover:shadow-black/20">
        
        {/* Background Gradient Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        
        {/* Glassmorphism Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {/* Icon */}
            <motion.div 
              className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center text-2xl ${
                pulse ? 'animate-pulse' : ''
              }`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
            
            {/* Indicators */}
            <div className="flex items-center space-x-2">
              {/* Badge for urgent items */}
              {badge && value > 0 && (
                <motion.div 
                  className={`w-3 h-3 rounded-full ${
                    urgent ? 'bg-red-500 animate-bounce' : 'bg-yellow-500 animate-pulse'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                />
              )}
              
              {/* Real-time indicator */}
              {isRealTime && pulse && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
              )}
            </div>
          </div>
          
          {/* Metrics */}
          <div className="space-y-2">
            {/* Title */}
            <p className="text-gray-400 text-sm font-medium group-hover:text-gray-300 transition-colors">
              {title}
            </p>
            
            {/* Value */}
            <div className="flex items-baseline space-x-2">
              <motion.p 
                className={`text-3xl font-bold text-white group-hover:${textColor} transition-colors duration-300`}
                key={value} // Re-animate when value changes
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {value.toLocaleString()}
              </motion.p>
              
              {/* Trend Indicator */}
              {trend && (
                <motion.div 
                  className={`flex items-center text-xs font-medium ${
                    trendUp ? 'text-green-400' : 'text-red-400'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <svg 
                    className={`w-3 h-3 mr-1 ${trendUp ? '' : 'rotate-180'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  {trend}
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hover Border Effect */}
        <motion.div
          className={`absolute inset-0 rounded-xl border-2 border-${color}-500/0 group-hover:border-${color}-500/30 transition-all duration-300`}
          initial={false}
          animate={{
            borderColor: isHovered ? `rgb(var(--${color}-500) / 0.3)` : 'transparent'
          }}
        />
        
        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </div>
      
      {/* Floating Elements for Special Cards */}
      {urgent && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-white text-xs">!</span>
        </motion.div>
      )}
      
      {/* Glow Effect for Active Cards */}
      {pulse && isRealTime && (
        <div className={`absolute inset-0 rounded-xl bg-${color}-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
      )}
    </motion.div>
  );
}