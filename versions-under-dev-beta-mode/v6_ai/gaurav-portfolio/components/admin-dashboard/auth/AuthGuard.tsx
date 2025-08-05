"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useFallbackAuth, isFirebaseDown } from "./FallbackAuth";
import { showErrorToast, showInfoToast } from "@/components/ToastSystem";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const firebaseAuth = useFirebaseAuth();
  const fallbackAuth = useFallbackAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [authMethod, setAuthMethod] = useState<'firebase' | 'fallback' | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, [firebaseAuth.user, fallbackAuth.isAuthenticated]);

  const checkAuthentication = async () => {
    try {
      // Check Firebase Auth first
      if (firebaseAuth.user) {
        console.log("🔐 AuthGuard: Firebase authentication verified");
        setAuthMethod('firebase');
        setIsChecking(false);
        return;
      }

      // Check fallback auth
      if (fallbackAuth.isAuthenticated) {
        console.log("🔐 AuthGuard: Fallback authentication verified");
        setAuthMethod('fallback');
        setIsChecking(false);
        return;
      }

      // If Firebase is loading, wait
      if (firebaseAuth.loading) {
        return;
      }

      // Check if Firebase is down and show fallback option
      const firebaseIsDown = await isFirebaseDown();
      if (firebaseIsDown) {
        console.warn("🔐 AuthGuard: Firebase appears to be down, fallback available");
        showInfoToast("Primary authentication unavailable. Checking alternatives...");
      }

      // No authentication found, redirect to login
      console.log("🔐 AuthGuard: No authentication found, redirecting to login");
      // Don't show error toast on manual logout
      if (!sessionStorage.getItem('manual-logout')) {
        showErrorToast("Authentication required. Redirecting to login...");
      } else {
        sessionStorage.removeItem('manual-logout');
      }
      router.push("/admin/login");
      
    } catch (error) {
      console.error("🔐 AuthGuard: Authentication check failed", error);
      showErrorToast("Authentication check failed. Please try again.");
      router.push("/admin/login");
    } finally {
      setIsChecking(false);
    }
  };

  // Loading state
  if (isChecking || firebaseAuth.loading) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-white text-lg font-medium">Verifying Authentication</p>
            <p className="text-gray-400 text-sm">
              {authMethod === 'firebase' ? 'Firebase Auth' : 
               authMethod === 'fallback' ? 'Fallback System' : 
               'Checking credentials...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!firebaseAuth.user && !fallbackAuth.isAuthenticated) {
    return null; // Will redirect to login
  }

  // Authenticated - show dashboard
  return (
    <div className="relative">
      {/* Auth method indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black-100/90 backdrop-blur-md border border-white/[0.2] rounded-lg px-3 py-1 text-xs text-gray-300">
          Auth: {authMethod === 'firebase' ? '🔥 Firebase' : '🔒 Fallback'}
        </div>
      )}
      {children}
    </div>
  );
}