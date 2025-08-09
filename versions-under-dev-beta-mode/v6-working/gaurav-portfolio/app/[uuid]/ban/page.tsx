"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  showUnbanToast,
  showProcessingToast,
  showErrorToast
} from '@/components/ToastSystem';
import AppealModal from '@/components/AppealModal';
import { silentLogger, prodLogger } from '@/utils/secureLogger';
import { formatPolicyReferenceForDisplay, generatePolicyReference } from '@/utils/policyReference';

export default function UUIDBanPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [uuid, setUuid] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const [policyReference, setPolicyReference] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Get UUID from URL params
    const urlUUID = params.uuid as string;
    const reasonParam = searchParams.get("reason") || "Policy violation";
    const policyRefParam = searchParams.get("policyRef") || "";
    
    setUuid(urlUUID);
    setBanReason(decodeURIComponent(reasonParam));
    
    // If no policy reference in URL, generate one for display purposes
    if (policyRefParam) {
      setPolicyReference(policyRefParam);
    } else {
      // For existing bans without policy references, generate a display reference
      const displayRef = generatePolicyReference();
      setPolicyReference(displayRef);
    }
    
    silentLogger.silent("Enhanced ban page loaded for visitor");
    silentLogger.silent("Ban reason and policy reference received");

    // Start Firebase real-time listener for status changes
    if (urlUUID) {
      startFirebaseListener(urlUUID);
    }

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        silentLogger.silent("Cleaning up Firebase listener on ban page");
        unsubscribeRef.current();
      }
    };
  }, [searchParams, params.uuid]);

  const startFirebaseListener = (userUUID: string) => {
    if (isListening) return;

    try {
      const docRef = doc(db as any, "visitors", userUUID);
      
      silentLogger.silent("Starting Firebase listener on ban page");
      
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const currentStatus = data.status;
            
            silentLogger.silent("Status update received on ban page");
            
            // If user is unbanned, redirect to portfolio
            if (currentStatus === 'active') {
              silentLogger.silent("User unbanned! Redirecting to portfolio");
              handleUnbanRedirect(userUUID);
            }
          }
        },
        (error) => {
          prodLogger.error("Firebase listener error on ban page", { error: error.message });
          showErrorToast("Connection lost. Please refresh the page.");
        }
      );

      unsubscribeRef.current = unsubscribe;
      setIsListening(true);
    } catch (error) {
      prodLogger.error("Failed to start Firebase listener", { error: error instanceof Error ? error.message : "Unknown error" });
      showErrorToast("Failed to monitor status changes.");
    }
  };

  const handleUnbanRedirect = (userUUID: string) => {
    showUnbanToast(() => {
      showProcessingToast("🔄 Redirecting to your portfolio...", 2000);
      
      setTimeout(() => {
        // Clear any ban-related session data
        sessionStorage.setItem('banCheckDone', 'true');
        sessionStorage.setItem('justUnbanned', 'true');
        
        // Use Next.js router for dynamic redirection (works in both dev and production)
        router.push(`/${userUUID}`);
      }, 2000);
    });
  };

  const handleBackToPortfolio = () => {
    // Use Next.js router for dynamic redirection
    router.push(`/${uuid}`);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:50px_50px]"></div>
      
      {/* Real-time status indicator - Mobile optimized */}
      {isListening && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full px-3 py-1 backdrop-blur-sm z-20">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-300 text-xs font-medium hidden sm:inline">Real-time monitoring active</span>
            <span className="text-blue-300 text-xs font-medium sm:hidden">Monitoring</span>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-7xl h-full flex items-center relative z-10">
        {/* Main ban notice - Mobile optimized */}
        <div className="w-full bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-xl border border-red-500/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Mobile-optimized Header */}
          <div className="relative bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-700/20 p-3 sm:p-6 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500/30 to-red-600/30 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm border border-red-500/20">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white">Access Restricted</h1>
                  <p className="text-red-300 text-sm sm:text-base hidden sm:block">Portfolio access temporarily suspended</p>
                  <p className="text-red-300 text-xs sm:hidden">Access suspended</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-300 font-medium text-xs sm:text-sm">Suspended</span>
                </div>
                <p className="text-slate-400 text-xs">24-48h review</p>
              </div>
            </div>
          </div>

          {/* Mobile-first Content Layout */}
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 h-full">
              
              {/* Policy Reference & Ban Reason - Mobile optimized */}
              <div className="space-y-3 sm:space-y-4">
                {/* Policy Reference - Mobile compact */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-lg font-bold text-white flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Policy Reference</span>
                      <span className="sm:hidden">Policy ID</span>
                    </h3>
                    <div className="px-2 py-1 bg-blue-500/20 rounded-full">
                      <span className="text-blue-300 text-xs font-medium">ID</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 border border-slate-700/50">
                    <div className="font-mono text-sm sm:text-lg text-blue-300 font-bold tracking-wider text-center break-all">
                      {policyReference ? formatPolicyReferenceForDisplay(policyReference) : 'Loading...'}
                    </div>
                    <p className="text-slate-400 text-xs text-center mt-1">
                      <span className="hidden sm:inline">Use for support communications</span>
                      <span className="sm:hidden">For support</span>
                    </p>
                  </div>
                </div>

                {/* Ban Reason - Mobile compact */}
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <h3 className="text-sm sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="hidden sm:inline">Restriction Reason</span>
                    <span className="sm:hidden">Reason</span>
                  </h3>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3">
                    <p className="text-red-200 font-medium text-sm sm:text-base">{banReason}</p>
                  </div>
                </div>
              </div>

              {/* Information - Mobile optimized */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <h4 className="text-white font-bold mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">What happens next?</span>
                  <span className="sm:hidden">Next Steps</span>
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Appeal reviewed within 24-48 hours</span>
                      <span className="sm:hidden">Review: 24-48 hours</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Email response if contact provided</span>
                      <span className="sm:hidden">Email response sent</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Automatic access restoration if approved</span>
                      <span className="sm:hidden">Auto-restore if approved</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Use policy reference for all communications</span>
                      <span className="sm:hidden">Use policy ID for support</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action - Mobile optimized */}
              <div className="flex flex-col justify-center items-center space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="text-center mb-2 sm:mb-4">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">Need Help?</h3>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    <span className="hidden sm:inline">If you believe this restriction was applied in error, submit an appeal for review.</span>
                    <span className="sm:hidden">Submit an appeal if this was an error</span>
                  </p>
                </div>
                
                <button
                  onClick={() => setIsAppealModalOpen(true)}
                  className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 w-full max-w-xs text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Submit Appeal</span>
                </button>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-2 sm:p-3 w-full max-w-xs">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-slate-300 text-xs sm:text-sm font-medium">
                        <span className="hidden sm:inline">Processing Time</span>
                        <span className="sm:hidden">Processing</span>
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      <span className="hidden sm:inline">Standard review: 24-48 hours</span>
                      <span className="sm:hidden">24-48 hours</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appeal Modal */}
      <AppealModal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        uuid={uuid}
        banReason={banReason}
        policyReference={policyReference}
      />
    </div>
  );
}