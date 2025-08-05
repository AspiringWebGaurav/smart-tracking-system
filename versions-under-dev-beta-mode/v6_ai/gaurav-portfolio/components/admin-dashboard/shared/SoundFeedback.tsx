"use client";

import { useEffect, useRef } from "react";

interface SoundFeedbackProps {
  enabled?: boolean;
}

// Sound types for different interactions
export type SoundType = 
  | "click" 
  | "success" 
  | "error" 
  | "notification" 
  | "hover" 
  | "swipe" 
  | "toggle"
  | "refresh"
  | "login"
  | "logout";

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
      this.generateSounds();
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn("Audio context not supported:", error);
    }
  }

  private generateSounds() {
    if (!this.audioContext) return;

    // Generate different sound frequencies for different actions
    const soundConfigs: Record<SoundType, { frequency: number; duration: number; type: OscillatorType }> = {
      click: { frequency: 800, duration: 0.1, type: "sine" },
      success: { frequency: 600, duration: 0.2, type: "sine" },
      error: { frequency: 300, duration: 0.3, type: "sawtooth" },
      notification: { frequency: 900, duration: 0.15, type: "triangle" },
      hover: { frequency: 1000, duration: 0.05, type: "sine" },
      swipe: { frequency: 700, duration: 0.08, type: "triangle" },
      toggle: { frequency: 650, duration: 0.12, type: "square" },
      refresh: { frequency: 750, duration: 0.18, type: "sine" },
      login: { frequency: 523, duration: 0.25, type: "sine" }, // C5 note
      logout: { frequency: 440, duration: 0.2, type: "sine" }  // A4 note
    };

    Object.entries(soundConfigs).forEach(([soundType, config]) => {
      const buffer = this.createSoundBuffer(config.frequency, config.duration, config.type);
      if (buffer) {
        this.sounds.set(soundType as SoundType, buffer);
      }
    });
  }

  private createSoundBuffer(frequency: number, duration: number, type: OscillatorType): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case "sine":
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case "triangle":
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
        case "sawtooth":
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case "square":
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
      }

      // Apply envelope (fade in/out)
      const envelope = Math.min(1, Math.min(t * 10, (duration - t) * 10));
      channelData[i] = sample * envelope * 0.1; // Low volume
    }

    return buffer;
  }

  public play(soundType: SoundType, volume: number = 0.3) {
    if (!this.enabled || !this.audioContext || !this.sounds.has(soundType)) return;

    try {
      const buffer = this.sounds.get(soundType);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = Math.min(volume, 0.5); // Cap volume

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn("Failed to play sound:", error);
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Global sound manager instance
let soundManager: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManager) {
    soundManager = new SoundManager();
  }
  return soundManager;
}

// Hook for using sound feedback
export function useSoundFeedback(enabled: boolean = true) {
  const manager = getSoundManager();

  useEffect(() => {
    manager.setEnabled(enabled);
  }, [enabled, manager]);

  return {
    playSound: (type: SoundType, volume?: number) => manager.play(type, volume),
    isEnabled: () => manager.isEnabled(),
    setEnabled: (enabled: boolean) => manager.setEnabled(enabled)
  };
}

// Vibration feedback for mobile devices
export function useHapticFeedback() {
  const vibrate = (pattern: number | number[] = 50) => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn("Vibration not supported:", error);
      }
    }
  };

  return {
    light: () => vibrate(25),
    medium: () => vibrate(50),
    heavy: () => vibrate(100),
    pattern: (pattern: number[]) => vibrate(pattern),
    success: () => vibrate([50, 50, 100]),
    error: () => vibrate([100, 50, 100, 50, 100]),
    notification: () => vibrate([25, 25, 25])
  };
}

// Component for managing sound feedback
export default function SoundFeedback({ enabled = true }: SoundFeedbackProps) {
  const soundManager = useRef<SoundManager | null>(null);

  useEffect(() => {
    soundManager.current = getSoundManager();
    soundManager.current.setEnabled(enabled);
  }, [enabled]);

  return null; // This component doesn't render anything
}

// Utility function to add sound to any element
export function addSoundToElement(
  element: HTMLElement, 
  soundType: SoundType, 
  eventType: string = 'click',
  volume: number = 0.3
) {
  const manager = getSoundManager();
  
  const handleEvent = () => {
    manager.play(soundType, volume);
  };

  element.addEventListener(eventType, handleEvent);

  // Return cleanup function
  return () => {
    element.removeEventListener(eventType, handleEvent);
  };
}

// Higher-order component to add sound feedback to any component
export function withSoundFeedback<T extends object>(
  Component: React.ComponentType<T>,
  soundType: SoundType = 'click',
  volume: number = 0.3
) {
  return function SoundEnhancedComponent(props: T) {
    const { playSound } = useSoundFeedback();

    const handleInteraction = () => {
      playSound(soundType, volume);
    };

    return (
      <div onClick={handleInteraction} onMouseEnter={() => playSound('hover', 0.1)}>
        <Component {...props} />
      </div>
    );
  };
}