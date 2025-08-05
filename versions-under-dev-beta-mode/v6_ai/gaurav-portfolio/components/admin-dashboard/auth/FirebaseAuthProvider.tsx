"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/components/ToastSystem";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  createAdminUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Elite admin credentials
const ADMIN_EMAIL = "gaurav@admin.kop";
const ADMIN_PASSWORD = "5737.5737";

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user && !hasShownWelcome) {
        console.log("🔥 Firebase Auth: User authenticated", user.email);
        setHasShownWelcome(true);
      } else if (!user) {
        setHasShownWelcome(false);
      }
    });

    return () => unsubscribe();
  }, [auth, hasShownWelcome]);

  const createAdminUser = async (): Promise<boolean> => {
    try {
      console.log("🔥 Creating Firebase admin user...");
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        ADMIN_EMAIL, 
        ADMIN_PASSWORD
      );
      
      console.log("✅ Firebase admin user created:", userCredential.user.email);
      showSuccessToast("Admin user created successfully!");
      return true;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log("ℹ️ Admin user already exists");
        return true; // User exists, that's fine
      }
      
      console.error("❌ Failed to create admin user:", error);
      showErrorToast(`Failed to create admin user: ${error.message}`);
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // First, try to sign in
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Firebase Auth: Sign in successful", userCredential.user.email);
        showSuccessToast("Welcome back, Gaurav! 🎉");
        setHasShownWelcome(true);
        return true;
      } catch (signInError: any) {
        // If user doesn't exist and we're trying with admin credentials, create the user
        if (signInError.code === 'auth/user-not-found' &&
            email === ADMIN_EMAIL &&
            password === ADMIN_PASSWORD) {
          
          showInfoToast("Creating admin user...");
          const created = await createAdminUser();
          
          if (created) {
            // Try signing in again after creation
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("✅ Firebase Auth: Sign in successful after user creation", userCredential.user.email);
            showSuccessToast("Admin user created and signed in! 🎉");
            setHasShownWelcome(true);
            return true;
          }
        }
        
        throw signInError; // Re-throw if it's not a user-not-found error
      }
    } catch (error: any) {
      console.error("❌ Firebase Auth: Sign in failed", error);
      
      let errorMessage = "Authentication failed";
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "User not found";
          break;
        case 'auth/wrong-password':
          errorMessage = "Invalid password";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = error.message || "Authentication failed";
      }
      
      showErrorToast(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      // Set manual logout flag to prevent "auth required" toast
      sessionStorage.setItem('manual-logout', 'true');
      await signOut(auth);
      console.log("✅ Firebase Auth: Sign out successful");
      showSuccessToast("Logged out successfully");
      setHasShownWelcome(false);
    } catch (error) {
      console.error("❌ Firebase Auth: Sign out failed", error);
      showErrorToast("Sign out failed");
      sessionStorage.removeItem('manual-logout');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOutUser,
    createAdminUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

// Check if user is admin
export function isAdminUser(user: User | null): boolean {
  return user?.email === ADMIN_EMAIL;
}