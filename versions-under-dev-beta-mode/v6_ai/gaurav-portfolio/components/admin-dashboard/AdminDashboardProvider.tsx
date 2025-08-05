"use client";

import { ReactNode } from "react";
import { FirebaseAuthProvider } from "./auth/FirebaseAuthProvider";
import { FallbackAuthProvider } from "./auth/FallbackAuth";
import SoundFeedback from "./shared/SoundFeedback";
import ToastProvider from "@/components/ToastProvider";

interface AdminDashboardProviderProps {
  children: ReactNode;
}

export default function AdminDashboardProvider({ children }: AdminDashboardProviderProps) {
  return (
    <>
      <ToastProvider />
      <FirebaseAuthProvider>
        <FallbackAuthProvider>
          <SoundFeedback enabled={true} />
          {children}
        </FallbackAuthProvider>
      </FirebaseAuthProvider>
    </>
  );
}