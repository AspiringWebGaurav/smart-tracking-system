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

export default function UUIDBanPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [uuid, setUuid] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Get UUID from URL params
    const urlUUID = params.uuid as string;
    const reasonParam = searchParams.get("reason") || "Policy violation";
    
    setUuid(urlUUID);
    setBanReason(decodeURIComponent(reasonParam));
    
    console.log("🚫 Ban page loaded for UUID:", urlUUID);
    console.log("🚫 Ban reason:", reasonParam);

    // Start Firebase real-time listener for status changes
    if (urlUUID) {
      startFirebaseListener(urlUUID);
    }

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log("🧹 Cleaning up Firebase listener on ban page");
        unsubscribeRef.current();
      }
    };
  }, [searchParams, params.uuid]);

  const startFirebaseListener = (userUUID: string) => {
    if (isListening) return;

    try {
      const docRef = doc(db as any, "visitors", userUUID);
      
      console.log("👂 Starting Firebase listener on ban page for:", docRef.path);
      
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const currentStatus = data.status;
            
            console.log("📡 Status update received on ban page:", currentStatus);
            
            // If user is unbanned, redirect to portfolio
            if (currentStatus === 'active') {
              console.log("🎉 User unbanned! Redirecting to portfolio...");
              handleUnbanRedirect(userUUID);
            }
          }
        },
        (error) => {
          console.error("❌ Firebase listener error on ban page:", error);
          showErrorToast("Connection lost. Please refresh the page.");
        }
      );

      unsubscribeRef.current = unsubscribe;
      setIsListening(true);
    } catch (error) {
      console.error("❌ Failed to start Firebase listener:", error);
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
    <div className="min-h-screen bg-black-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Real-time status indicator */}
        {isListening && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-sm">
                Monitoring for status changes... You'll be redirected automatically if unbanned.
              </span>
            </div>
          </div>
        )}

        {/* Main ban notice */}
        <div className="bg-black-100/80 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-6 border-b border-red-500/20">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
                <p className="text-red-300">Your access to this portfolio has been temporarily suspended</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Ban details */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Restriction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reason:</span>
                  <span className="text-red-300">{banReason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-red-300">Temporarily Suspended</span>
                </div>
                {uuid && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference ID:</span>
                    <span className="text-gray-300 font-mono text-xs">{uuid.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Information */}
            <div className="text-center space-y-4">
              <p className="text-gray-300">
                If you believe this restriction was applied in error, you can contact the administrator 
                to request a review of your case.
              </p>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-300 space-y-1 text-left">
                  <li>• Your appeal will be reviewed within 24-48 hours</li>
                  <li>• You'll receive an email response if contact information is provided</li>
                  <li>• Access will be restored automatically if the restriction is lifted</li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center">
              <button
                onClick={() => setIsAppealModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-8 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Submit Appeal</span>
              </button>
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
      />
    </div>
  );
}