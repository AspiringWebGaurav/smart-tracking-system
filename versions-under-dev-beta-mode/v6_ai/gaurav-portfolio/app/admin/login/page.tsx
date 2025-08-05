"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useFirebaseAuth } from "@/components/admin-dashboard/auth/FirebaseAuthProvider";
import { useFallbackAuth, isFirebaseDown } from "@/components/admin-dashboard/auth/FallbackAuth";
import { showErrorToast, showSuccessToast, showInfoToast } from "@/components/ToastSystem";
import AdminDashboardProvider from "@/components/admin-dashboard/AdminDashboardProvider";

interface LoginFormData {
  id: string;
  password: string;
}

function AdminLoginForm() {
  const router = useRouter();
  const firebaseAuth = useFirebaseAuth();
  const fallbackAuth = useFallbackAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authMethod, setAuthMethod] = useState<'firebase' | 'fallback'>('firebase');
  const [showFallback, setShowFallback] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset
  } = useForm<LoginFormData>();

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      // Check Firebase Auth
      if (firebaseAuth.user) {
        router.push('/admin');
        return;
      }

      // Check Fallback Auth
      if (fallbackAuth.isAuthenticated) {
        router.push('/admin');
        return;
      }

      // Check if Firebase is down
      const firebaseIsDown = await isFirebaseDown();
      if (firebaseIsDown) {
        setShowFallback(true);
        setAuthMethod('fallback');
        showInfoToast("Primary authentication unavailable. Using backup system.");
      }
    } catch (error) {
      console.log("Not authenticated, showing login form");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      let success = false;

      if (authMethod === 'firebase') {
        // Try Firebase Auth first
        success = await firebaseAuth.signIn(data.id, data.password);
        
        if (!success) {
          // If Firebase fails, check if it's down and try fallback
          const firebaseIsDown = await isFirebaseDown();
          if (firebaseIsDown) {
            showInfoToast("Primary system unavailable. Trying backup authentication...");
            setShowFallback(true);
            success = await fallbackAuth.signIn(data.id, data.password);
            if (success) {
              setAuthMethod('fallback');
            }
          }
        }
      } else {
        // Use fallback auth directly
        success = await fallbackAuth.signIn(data.id, data.password);
      }
      
      if (success) {
        showSuccessToast("Login successful! Redirecting...");
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        setError("password", { 
          type: "manual", 
          message: "Invalid credentials" 
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      showErrorToast("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchAuthMethod = () => {
    const newMethod = authMethod === 'firebase' ? 'fallback' : 'firebase';
    setAuthMethod(newMethod);
    setShowFallback(newMethod === 'fallback');
    reset();
    
    if (newMethod === 'fallback') {
      showInfoToast("Switched to backup authentication system");
    } else {
      showInfoToast("Switched to primary authentication system");
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-white text-lg mt-4">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto blur-xl opacity-30" />
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            Admin Login
          </h1>
          <p className="text-gray-400">Access the visitor management dashboard</p>
          
          {/* Auth Method Indicator */}
          <motion.div 
            className="mt-4 flex items-center justify-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className={`w-2 h-2 rounded-full ${
              authMethod === 'firebase' ? 'bg-blue-400' : 'bg-orange-400'
            }`} />
            <span className="text-xs text-gray-400">
              {authMethod === 'firebase' ? 'Primary System' : 'Backup System'}
            </span>
          </motion.div>
        </motion.div>

        {/* Login Form */}
        <motion.div 
          className="bg-black-100/80 backdrop-blur-md border border-white/[0.2] rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Glassmorphism effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            {/* Admin ID Field */}
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-300 mb-2">
                {authMethod === 'firebase' ? 'Email Address' : 'Admin ID'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="id"
                  type={authMethod === 'firebase' ? 'email' : 'text'}
                  {...register("id", { 
                    required: `${authMethod === 'firebase' ? 'Email' : 'Admin ID'} is required`,
                    ...(authMethod === 'firebase' && {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder={authMethod === 'firebase' ? 'Enter your email' : 'Enter your admin ID'}
                  autoComplete="username"
                />
              </div>
              {errors.id && (
                <motion.p 
                  className="text-red-400 text-sm mt-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.id.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  {...register("password", { 
                    required: "Password is required"
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <motion.p 
                  className="text-red-400 text-sm mt-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-all duration-300 font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/25"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Auth Method Switch */}
          <div className="mt-6 text-center">
            <button
              onClick={switchAuthMethod}
              className="text-sm text-gray-400 hover:text-white transition-colors underline"
            >
              {authMethod === 'firebase' ? 'Use backup authentication' : 'Use primary authentication'}
            </button>
          </div>

          {/* Demo Credentials Info */}
          <AnimatePresence>
            {process.env.NODE_ENV === 'development' && (
              <motion.div 
                className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="text-sm font-medium text-blue-300 mb-2">Demo Credentials</h3>
                <div className="text-xs text-gray-300 space-y-1">
                  {authMethod === 'firebase' ? (
                    <>
                      <p><span className="font-mono bg-black-100/50 px-2 py-1 rounded">Email:</span> gaurav@admin.kop</p>
                      <p><span className="font-mono bg-black-100/50 px-2 py-1 rounded">Password:</span> 5737.5737</p>
                    </>
                  ) : (
                    <>
                      <p><span className="font-mono bg-black-100/50 px-2 py-1 rounded">ID:</span> gaurav.gaurav.gaurav</p>
                      <p><span className="font-mono bg-black-100/50 px-2 py-1 rounded">Password:</span> 5737.5737.5737</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center space-x-2 mx-auto group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Portfolio</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <AdminDashboardProvider>
      <AdminLoginForm />
    </AdminDashboardProvider>
  );
}