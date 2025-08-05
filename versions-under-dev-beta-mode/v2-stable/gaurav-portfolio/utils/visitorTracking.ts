// utils/visitorTracking.ts
import { v4 as uuidv4 } from 'uuid';

export interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency: number;
  cookieEnabled: boolean;
  doNotTrack: string | null;
}

export interface VisitorData {
  uuid: string;
  deviceFingerprint: DeviceFingerprint;
  ipAddress?: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  status: 'active' | 'banned';
  banReason?: string;
  banTimestamp?: string;
  unbanTimestamp?: string;
}

/**
 * Generate a comprehensive device fingerprint
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const nav = navigator as any;
  
  return {
    userAgent: nav.userAgent || '',
    language: nav.language || nav.userLanguage || '',
    platform: nav.platform || '',
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth || 0,
    deviceMemory: nav.deviceMemory || undefined,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    cookieEnabled: nav.cookieEnabled || false,
    doNotTrack: nav.doNotTrack || null,
  };
}

/**
 * Create a hash from device fingerprint for duplicate detection
 */
export function createFingerprintHash(fingerprint: DeviceFingerprint): string {
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get or create visitor UUID with persistent storage
 * Now prioritizes URL-based UUIDs for incognito compatibility
 */
export function getOrCreateVisitorUUID(urlUUID?: string): string {
  try {
    // If URL UUID is provided and valid, use it and ensure it's stored
    if (urlUUID && isValidUUID(urlUUID)) {
      console.log('🔗 Using URL-based UUID:', urlUUID);
      // Store in storage for persistence
      try {
        localStorage.setItem('visitor_uuid', urlUUID);
        sessionStorage.setItem('visitor_uuid', urlUUID);
        storeInIndexedDB('visitor_uuid', urlUUID);
      } catch (error) {
        console.warn('Storage not available:', error);
      }
      return urlUUID;
    }

    // Check if we have a URL UUID from current page
    const currentUrlUUID = getUUIDFromURL();
    if (currentUrlUUID && isValidUUID(currentUrlUUID)) {
      console.log('🌐 Found UUID in current URL:', currentUrlUUID);
      // Store in storage for persistence
      try {
        localStorage.setItem('visitor_uuid', currentUrlUUID);
        sessionStorage.setItem('visitor_uuid', currentUrlUUID);
        storeInIndexedDB('visitor_uuid', currentUrlUUID);
      } catch (error) {
        console.warn('Storage not available:', error);
      }
      return currentUrlUUID;
    }

    // Try localStorage first
    let uuid = localStorage.getItem('visitor_uuid');
    
    if (!uuid) {
      // Try sessionStorage as fallback
      uuid = sessionStorage.getItem('visitor_uuid');
      
      if (!uuid) {
        // Generate new UUID
        uuid = uuidv4();
        console.log('🆕 Generated new UUID:', uuid);
      }
      
      // Store in both storages
      localStorage.setItem('visitor_uuid', uuid);
      sessionStorage.setItem('visitor_uuid', uuid);
    }
    
    // Also store in IndexedDB for persistence
    storeInIndexedDB('visitor_uuid', uuid);
    
    return uuid;
  } catch (error) {
    console.warn('Storage not available, using session-only UUID:', error);
    // Fallback to session-only UUID
    if (!window.sessionUUID) {
      window.sessionUUID = uuidv4();
    }
    return window.sessionUUID;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extract UUID from current URL path
 */
export function getUUIDFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const potentialUUID = pathSegments[0];
  
  if (potentialUUID && isValidUUID(potentialUUID)) {
    return potentialUUID;
  }
  
  return null;
}

/**
 * Get visitor UUID from URL or storage, prioritizing URL
 */
export function getCurrentVisitorUUID(): string {
  // First try to get from URL
  const urlUUID = getUUIDFromURL();
  if (urlUUID) {
    return urlUUID;
  }
  
  // Fallback to storage-based UUID
  return getOrCreateVisitorUUID();
}

/**
 * Store data in IndexedDB for maximum persistence
 */
export async function storeInIndexedDB(key: string, value: any): Promise<void> {
  try {
    const request = indexedDB.open('VisitorTrackingDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('visitor_data')) {
        db.createObjectStore('visitor_data');
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['visitor_data'], 'readwrite');
      const store = transaction.objectStore('visitor_data');
      store.put(value, key);
    };
  } catch (error) {
    console.warn('IndexedDB not available:', error);
  }
}

/**
 * Retrieve data from IndexedDB
 */
export async function getFromIndexedDB(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('VisitorTrackingDB', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['visitor_data'], 'readonly');
        const store = transaction.objectStore('visitor_data');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
        
        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse user agent to extract device and browser info
 */
export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Detect Browser
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // Detect Device Type
  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  
  return { os, browser, device };
}

/**
 * Get visitor's IP address (client-side approximation)
 */
export async function getVisitorIP(): Promise<string> {
  try {
    // Use a public IP service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    console.warn('Could not fetch IP address:', error);
    return 'Unknown';
  }
}

/**
 * Check if visitor tracking is enabled (respects privacy settings)
 */
export function isTrackingEnabled(): boolean {
  // Check Do Not Track header
  if (navigator.doNotTrack === '1') {
    return false;
  }
  
  // Check if user has opted out
  const optOut = localStorage.getItem('visitor_tracking_opt_out');
  if (optOut === 'true') {
    return false;
  }
  
  return true;
}

/**
 * Opt out of visitor tracking
 */
export function optOutOfTracking(): void {
  localStorage.setItem('visitor_tracking_opt_out', 'true');
  // Clear existing tracking data
  localStorage.removeItem('visitor_uuid');
  sessionStorage.removeItem('visitor_uuid');
}

/**
 * Opt back into visitor tracking
 */
export function optIntoTracking(): void {
  localStorage.removeItem('visitor_tracking_opt_out');
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    sessionUUID?: string;
  }
}