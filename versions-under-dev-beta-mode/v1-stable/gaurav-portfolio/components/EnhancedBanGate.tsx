"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateVisitorUUID } from "@/utils/visitorTracking";
import { showErrorToast } from "@/components/ToastSystem";

interface BanGateProps {
  children: React.ReactNode;
}

export default function EnhancedBanGate({ children }: BanGateProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkVisitorStatus();
  }, []);

  const checkVisitorStatus = async () => {
    try {
      // Check if we've already verified this session
      const sessionCheck = sessionStorage.getItem("banCheckDone");
      if (sessionCheck === "true") {
        setAllowed(true);
        setLoading(false);
        return;
      }

      // Get visitor UUID
      const uuid = getOrCreateVisitorUUID();
      if (!uuid) {
        console.warn("⚠️ No UUID available, allowing access");
        setAllowed(true);
        setLoading(false);
        return;
      }

      console.log("🔍 Checking ban status for UUID:", uuid);

      // Check visitor status via API
      const response = await fetch(`/api/visitors/status?uuid=${uuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Visitor not found, allow access (new visitor)
          console.log("👤 New visitor, allowing access");
          sessionStorage.setItem("banCheckDone", "true");
          setAllowed(true);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Visitor status:", data);

      if (data.status === "banned") {
        console.log("🚫 Visitor is banned, redirecting to ban page");
        
        // Redirect to ban page with reason
        const banReason = encodeURIComponent(data.banReason || "Policy violation");
        window.location.href = `/ban?uuid=${uuid}&reason=${banReason}`;
        return;
      }

      // Visitor is active, allow access
      sessionStorage.setItem("banCheckDone", "true");
      setAllowed(true);

    } catch (error) {
      console.error("❌ Error checking visitor status:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      
      // On error, allow access but show warning
      showErrorToast("Unable to verify access status. Please refresh if issues persist.");
      
      // Allow access after a delay to show the error
      setTimeout(() => {
        sessionStorage.setItem("banCheckDone", "true");
        setAllowed(true);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const retryCheck = () => {
    setLoading(true);
    setError(null);
    sessionStorage.removeItem("banCheckDone");
    checkVisitorStatus();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error && !allowed) {
    return <ErrorScreen error={error} onRetry={retryCheck} />;
  }

  return allowed ? <>{children}</> : null;
}

// Loading screen component
function LoadingScreen() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black-100/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated loading spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animation-delay-150"></div>
        </div>

        {/* Loading text */}
        <div className="text-white text-lg font-medium mb-2">
          Verifying Access{dots}
        </div>
        <div className="text-gray-400 text-sm">
          Please wait while we check your permissions
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Error screen component
function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 bg-black-100/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black-100/80 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Connection Error
        </h2>
        
        <p className="text-gray-300 mb-4 text-sm">
          Unable to verify your access status. This might be due to a network issue.
        </p>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
          <p className="text-red-300 text-xs font-mono">
            {error}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom CSS for animation delays (to be added to globals.css)
export const banGateStyles = `
.animation-delay-150 {
  animation-delay: 150ms;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
`;