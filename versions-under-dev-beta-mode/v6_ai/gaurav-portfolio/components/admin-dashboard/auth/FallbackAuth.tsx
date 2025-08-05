"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/components/ToastSystem";

interface FallbackAuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (id: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const FallbackAuthContext = createContext<FallbackAuthContextType | undefined>(undefined);

// 🔒 DEEPLY HIDDEN FALLBACK CREDENTIALS - NO UI EXPOSURE
const FALLBACK_CREDENTIALS = {
  id: "gaurav.gaurav.gaurav",
  password: "5737.5737.5737"
};

interface FallbackAuthProviderProps {
  children: ReactNode;
}

export function FallbackAuthProvider({ children }: FallbackAuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const signIn = async (id: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Add delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (id === FALLBACK_CREDENTIALS.id && password === FALLBACK_CREDENTIALS.password) {
        setIsAuthenticated(true);
        console.log("🔒 Fallback Auth: Authentication successful (hidden system)");
        showSuccessToast("Fallback authentication successful");
        return true;
      }
      
      console.log("🔒 Fallback Auth: Invalid credentials");
      showErrorToast("Invalid fallback credentials");
      return false;
    } catch (error) {
      console.error("🔒 Fallback Auth: Error", error);
      showErrorToast("Fallback authentication error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    console.log("🔒 Fallback Auth: Sign out successful");
    showInfoToast("Signed out from fallback system");
  };

  const value: FallbackAuthContextType = {
    isAuthenticated,
    loading,
    signIn,
    signOut
  };

  return (
    <FallbackAuthContext.Provider value={value}>
      {children}
    </FallbackAuthContext.Provider>
  );
}

export function useFallbackAuth(): FallbackAuthContextType {
  const context = useContext(FallbackAuthContext);
  if (context === undefined) {
    throw new Error('useFallbackAuth must be used within a FallbackAuthProvider');
  }
  return context;
}

// 🔒 Hidden function to check if Firebase is down
export async function isFirebaseDown(): Promise<boolean> {
  try {
    // Simple connectivity check
    const response = await fetch('https://firebase.googleapis.com/', { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    return false; // Firebase is up
  } catch (error) {
    console.warn("🔒 Firebase connectivity check failed, may be down");
    return true; // Firebase might be down
  }
}