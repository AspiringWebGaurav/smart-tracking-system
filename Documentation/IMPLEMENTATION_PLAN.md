# Dynamic Ban Pages Implementation Plan

## Implementation Overview

This document provides a step-by-step implementation plan for the 4-category dynamic ban pages system, including detailed component specifications, integration points, and testing strategies.

---

## Phase 1: Foundation & Core Components

### 1.1 TypeScript Interfaces & Types

**File**: `types/banSystem.ts`
```typescript
export type BanCategory = 'normal' | 'medium' | 'danger' | 'severe';

export interface BanPageDesign {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
  theme: BanPageTheme;
  content: BanPageContent;
  layout: BanPageLayout;
  animations: BanPageAnimations;
  responsive: BanPageResponsive;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  changelog: BanPageChangelogEntry[];
}

export interface BanPageTheme {
  primaryColor: string;
  secondaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
}

export interface BanPageContent {
  title: string;
  subtitle: string;
  description: string;
  warningLevel: 'info' | 'warning' | 'danger' | 'critical';
  icon: BanPageIcon;
  processingTime: string;
  appealMessage: string;
  buttonText: string;
  statusBadge: string;
}

export interface BanPageIcon {
  type: 'svg' | 'emoji' | 'icon';
  value: string;
  size: string;
  color: string;
}

export interface BanPageLayout {
  headerHeight: string;
  contentPadding: string;
  borderRadius: string;
  shadowIntensity: 'light' | 'medium' | 'heavy';
  animationStyle: 'subtle' | 'moderate' | 'intense';
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface BanPageAnimations {
  transition: {
    duration: string;
    easing: string;
  };
  pulse: {
    enabled: boolean;
    color: string;
    duration: string;
  };
  entrance: {
    type: 'fade' | 'slide' | 'scale';
    duration: string;
    delay: string;
  };
}

export interface BanPageResponsive {
  mobile: BanPageBreakpoint;
  tablet: BanPageBreakpoint;
  desktop: BanPageBreakpoint;
}

export interface BanPageBreakpoint {
  padding: string;
  fontSize: {
    title: string;
    subtitle: string;
    body: string;
  };
  gridColumns: number;
}

export interface BanPageChangelogEntry {
  version: number;
  changes: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BanCategoryHistory {
  category: BanCategory;
  timestamp: string;
  adminId: string;
  reason: string;
  previousCategory?: BanCategory;
}

export interface BanMetadata {
  severity: number;
  autoCategory: boolean;
  manualOverride: boolean;
  escalationPath: BanEscalation[];
}

export interface BanEscalation {
  fromCategory: BanCategory;
  toCategory: BanCategory;
  timestamp: string;
  adminId: string;
  reason: string;
}
```

### 1.2 Firebase Utilities

**File**: `utils/banPageDesigns.ts`
```typescript
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { BanPageDesign, BanCategory } from '@/types/banSystem';

export class BanPageDesignService {
  private static cache = new Map<BanCategory, BanPageDesign>();
  private static cacheExpiry = new Map<BanCategory, number>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get design configuration for a specific category
   */
  static async getDesign(category: BanCategory): Promise<BanPageDesign | null> {
    try {
      // Check cache first
      const cached = this.getCachedDesign(category);
      if (cached) return cached;

      const docRef = doc(db, 'banPageDesigns', category);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const design = docSnap.data() as BanPageDesign;
        this.setCachedDesign(category, design);
        return design;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching design for category ${category}:`, error);
      return null;
    }
  }

  /**
   * Get all active design configurations
   */
  static async getAllDesigns(): Promise<BanPageDesign[]> {
    try {
      const q = query(
        collection(db, 'banPageDesigns'),
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as BanPageDesign);
    } catch (error) {
      console.error('Error fetching all designs:', error);
      return [];
    }
  }

  /**
   * Subscribe to design changes for real-time updates
   */
  static subscribeToDesign(
    category: BanCategory,
    callback: (design: BanPageDesign | null) => void
  ): () => void {
    const docRef = doc(db, 'banPageDesigns', category);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const design = doc.data() as BanPageDesign;
        this.setCachedDesign(category, design);
        callback(design);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error in design subscription for ${category}:`, error);
      callback(null);
    });
  }

  /**
   * Get cached design if still valid
   */
  private static getCachedDesign(category: BanCategory): BanPageDesign | null {
    const cached = this.cache.get(category);
    const expiry = this.cacheExpiry.get(category);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Clean up expired cache
    this.cache.delete(category);
    this.cacheExpiry.delete(category);
    return null;
  }

  /**
   * Set cached design with expiry
   */
  private static setCachedDesign(category: BanCategory, design: BanPageDesign): void {
    this.cache.set(category, design);
    this.cacheExpiry.set(category, Date.now() + this.CACHE_TTL);
  }

  /**
   * Clear all cached designs
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}
```

**File**: `utils/banCategorySync.ts`
```typescript
import { db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { BanCategory, BanCategoryHistory } from '@/types/banSystem';

export class BanCategorySync {
  private static listeners = new Map<string, () => void>();

  /**
   * Update visitor's ban category
   */
  static async updateCategory(
    uuid: string,
    category: BanCategory,
    adminId: string,
    reason: string,
    previousCategory?: BanCategory
  ): Promise<void> {
    try {
      const visitorRef = doc(db, 'visitors', uuid);
      
      const historyEntry: BanCategoryHistory = {
        category,
        timestamp: new Date().toISOString(),
        adminId,
        reason,
        previousCategory
      };

      await updateDoc(visitorRef, {
        banCategory: category,
        banCategoryHistory: arrayUnion(historyEntry),
        updatedAt: serverTimestamp(),
        lastCategoryChange: serverTimestamp()
      });

      console.log(`✅ Updated ban category for ${uuid} to ${category}`);
    } catch (error) {
      console.error(`❌ Error updating ban category for ${uuid}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to category changes for a visitor
   */
  static subscribeToCategory(
    uuid: string,
    callback: (category: BanCategory | null) => void
  ): () => void {
    // Clean up existing listener if any
    const existingListener = this.listeners.get(uuid);
    if (existingListener) {
      existingListener();
    }

    const docRef = doc(db, 'visitors', uuid);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const category = data.banCategory as BanCategory | null;
        callback(category);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error in category subscription for ${uuid}:`, error);
      callback(null);
    });

    // Store listener for cleanup
    this.listeners.set(uuid, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(uuid);
    };
  }

  /**
   * Get current category for a visitor
   */
  static async getCurrentCategory(uuid: string): Promise<BanCategory | null> {
    try {
      const docRef = doc(db, 'visitors', uuid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.banCategory as BanCategory || 'normal';
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting current category for ${uuid}:`, error);
      return null;
    }
  }

  /**
   * Cleanup all listeners
   */
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
```

### 1.3 Category Mapping Utility

**File**: `utils/banCategoryMapper.ts`
```typescript
import { BanCategory } from '@/types/banSystem';

export class BanCategoryMapper {
  private static readonly reasonToCategory: Record<string, BanCategory> = {
    'spam': 'normal',
    'inappropriate': 'medium',
    'harassment': 'danger',
    'abuse': 'severe',
    'security': 'severe',
    'terms': 'medium',
    'custom': 'normal'
  };

  private static readonly severityToCategory: Record<number, BanCategory> = {
    1: 'normal',
    2: 'normal',
    3: 'medium',
    4: 'medium',
    5: 'medium',
    6: 'danger',
    7: 'danger',
    8: 'danger',
    9: 'severe',
    10: 'severe'
  };

  /**
   * Suggest category based on ban reason
   */
  static suggestCategoryFromReason(reason: string): BanCategory {
    const normalizedReason = reason.toLowerCase();
    
    // Check for exact matches first
    for (const [key, category] of Object.entries(this.reasonToCategory)) {
      if (normalizedReason.includes(key)) {
        return category;
      }
    }

    // Check for severity keywords
    if (this.containsSevereKeywords(normalizedReason)) {
      return 'severe';
    }
    
    if (this.containsDangerKeywords(normalizedReason)) {
      return 'danger';
    }
    
    if (this.containsMediumKeywords(normalizedReason)) {
      return 'medium';
    }

    // Default to normal
    return 'normal';
  }

  /**
   * Get category from severity score (1-10)
   */
  static getCategoryFromSeverity(severity: number): BanCategory {
    const clampedSeverity = Math.max(1, Math.min(10, Math.round(severity)));
    return this.severityToCategory[clampedSeverity] || 'normal';
  }

  /**
   * Get severity score from category
   */
  static getSeverityFromCategory(category: BanCategory): number {
    const categoryToSeverity: Record<BanCategory, number> = {
      'normal': 2,
      'medium': 5,
      'danger': 7,
      'severe': 9
    };
    
    return categoryToSeverity[category] || 2;
  }

  /**
   * Get display information for category
   */
  static getCategoryDisplayInfo(category: BanCategory) {
    const displayInfo = {
      normal: {
        name: 'Normal',
        description: 'Standard policy violation',
        color: '#3B82F6',
        icon: 'info',
        urgency: 'low'
      },
      medium: {
        name: 'Medium',
        description: 'Moderate policy violation',
        color: '#F59E0B',
        icon: 'warning',
        urgency: 'medium'
      },
      danger: {
        name: 'Danger',
        description: 'Serious policy violation',
        color: '#F97316',
        icon: 'shield',
        urgency: 'high'
      },
      severe: {
        name: 'Severe',
        description: 'Critical security violation',
        color: '#DC2626',
        icon: 'ban',
        urgency: 'critical'
      }
    };

    return displayInfo[category];
  }

  private static containsSevereKeywords(reason: string): boolean {
    const severeKeywords = [
      'threat', 'violence', 'illegal', 'criminal', 'fraud',
      'identity theft', 'doxxing', 'stalking', 'malware'
    ];
    
    return severeKeywords.some(keyword => reason.includes(keyword));
  }

  private static containsDangerKeywords(reason: string): boolean {
    const dangerKeywords = [
      'harassment', 'bullying', 'hate speech', 'discrimination',
      'explicit content', 'privacy violation', 'impersonation'
    ];
    
    return dangerKeywords.some(keyword => reason.includes(keyword));
  }

  private static containsMediumKeywords(reason: string): boolean {
    const mediumKeywords = [
      'repeated violation', 'suspicious activity', 'policy breach',
      'terms violation', 'community guidelines'
    ];
    
    return mediumKeywords.some(keyword => reason.includes(keyword));
  }
}
```

---

## Phase 2: Core Components

### 2.1 Dynamic Ban Page Component

**File**: `components/ban/DynamicBanPage.tsx`
```typescript
"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { BanPageDesign, BanCategory } from '@/types/banSystem';
import { BanPageDesignService } from '@/utils/banPageDesigns';
import { BanCategorySync } from '@/utils/banCategorySync';
import { BanPageRenderer } from './BanPageRenderer';
import { CategoryTransition } from './CategoryTransition';
import { LoadingSkeleton } from './LoadingSkeleton';
import AppealModal from '@/components/AppealModal';
import { showUnbanToast, showProcessingToast, showErrorToast } from '@/components/ToastSystem';
import { silentLogger, prodLogger } from '@/utils/secureLogger';

interface DynamicBanPageProps {
  uuid?: string;
  banReason?: string;
  policyReference?: string;
  initialCategory?: BanCategory;
}

export default function DynamicBanPage({
  uuid: propUuid,
  banReason: propBanReason,
  policyReference: propPolicyReference,
  initialCategory
}: DynamicBanPageProps) {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  // State management
  const [uuid, setUuid] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const [policyReference, setPolicyReference] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<BanCategory>('normal');
  const [design, setDesign] = useState<BanPageDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Refs for cleanup
  const categoryUnsubscribeRef = useRef<(() => void) | null>(null);
  const designUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initializePage();
    
    return () => {
      cleanup();
    };
  }, [searchParams, params.uuid]);

  const initializePage = async () => {
    try {
      // Get UUID from props or URL params
      const pageUuid = propUuid || (params.uuid as string);
      const reasonParam = propBanReason || searchParams.get("reason") || "Policy violation";
      const policyRefParam = propPolicyReference || searchParams.get("policyRef") || "";
      const categoryParam = initialCategory || (searchParams.get("category") as BanCategory) || 'normal';

      setUuid(pageUuid);
      setBanReason(decodeURIComponent(reasonParam));
      setPolicyReference(policyRefParam);
      setCurrentCategory(categoryParam);

      silentLogger.silent("Dynamic ban page initialized", { uuid: pageUuid, category: categoryParam });

      // Load initial design
      await loadDesign(categoryParam);

      // Start real-time listeners
      if (pageUuid) {
        startCategoryListener(pageUuid);
        startDesignListener(categoryParam);
      }

    } catch (error) {
      prodLogger.error("Error initializing dynamic ban page", { error });
      showErrorToast("Failed to load ban page. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDesign = async (category: BanCategory) => {
    try {
      const designConfig = await BanPageDesignService.getDesign(category);
      if (designConfig) {
        setDesign(designConfig);
        silentLogger.silent("Design loaded for category", { category });
      } else {
        // Fallback to normal category if design not found
        if (category !== 'normal') {
          const fallbackDesign = await BanPageDesignService.getDesign('normal');
          setDesign(fallbackDesign);
          silentLogger.silent("Fallback to normal design", { requestedCategory: category });
        }
      }
    } catch (error) {
      prodLogger.error("Error loading design", { category, error });
    }
  };

  const startCategoryListener = (visitorUuid: string) => {
    if (categoryUnsubscribeRef.current) {
      categoryUnsubscribeRef.current();
    }

    const unsubscribe = BanCategorySync.subscribeToCategory(
      visitorUuid,
      async (newCategory) => {
        if (newCategory && newCategory !== currentCategory) {
          silentLogger.silent("Category change detected", { 
            from: currentCategory, 
            to: newCategory 
          });
          
          await handleCategoryChange(newCategory);
        }
        
        // Check if user was unbanned
        if (!newCategory) {
          handleUnbanRedirect(visitorUuid);
        }
      }
    );

    categoryUnsubscribeRef.current = unsubscribe;
    setIsListening(true);
  };

  const startDesignListener = (category: BanCategory) => {
    if (designUnsubscribeRef.current) {
      designUnsubscribeRef.current();
    }

    const unsubscribe = BanPageDesignService.subscribeToDesign(
      category,
      (updatedDesign) => {
        if (updatedDesign) {
          setDesign(updatedDesign);
          silentLogger.silent("Design updated via real-time sync", { category });
        }
      }
    );

    designUnsubscribeRef.current = unsubscribe;
  };

  const handleCategoryChange = async (newCategory: BanCategory) => {
    setIsTransitioning(true);
    
    try {
      // Load new design
      await loadDesign(newCategory);
      
      // Update category state
      setCurrentCategory(newCategory);
      
      // Update design listener
      startDesignListener(newCategory);
      
      silentLogger.silent("Category transition completed", { 
        from: currentCategory, 
        to: newCategory 
      });
      
    } catch (error) {
      prodLogger.error("Error during category transition", { 
        from: currentCategory, 
        to: newCategory, 
        error 
      });
    } finally {
      // Add delay to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleUnbanRedirect = (userUUID: string) => {
    showUnbanToast(() => {
      showProcessingToast("🔄 Redirecting to your portfolio...", 2000);
      
      setTimeout(() => {
        sessionStorage.setItem('banCheckDone', 'true');
        sessionStorage.setItem('justUnbanned', 'true');
        router.push(`/${userUUID}`);
      }, 2000);
    });
  };

  const cleanup = () => {
    if (categoryUnsubscribeRef.current) {
      categoryUnsubscribeRef.current();
      categoryUnsubscribeRef.current = null;
    }
    
    if (designUnsubscribeRef.current) {
      designUnsubscribeRef.current();
      designUnsubscribeRef.current = null;
    }
    
    setIsListening(false);
    silentLogger.silent("Dynamic ban page cleanup completed");
  };

  if (isLoading || !design) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Real-time status indicator */}
      {isListening && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full px-3 py-1 backdrop-blur-sm z-20">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-300 text-xs font-medium hidden sm:inline">
              Real-time monitoring active
            </span>
            <span className="text-blue-300 text-xs font-medium sm:hidden">
              Monitoring
            </span>
          </div>
        </div>
      )}

      {/* Category transition wrapper */}
      <CategoryTransition
        isTransitioning={isTransitioning}
        category={currentCategory}
        design={design}
      >
        <BanPageRenderer
          design={design}
          category={currentCategory}
          uuid={uuid}
          banReason={banReason}
          policyReference={policyReference}
          onAppealClick={() => setIsAppealModalOpen(true)}
        />
      </CategoryTransition>

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
```

### 2.2 Ban Page Renderer Component

**File**: `components/ban/BanPageRenderer.tsx`
```typescript
"use client";

import { BanPageDesign, BanCategory } from '@/types/banSystem';
import { formatPolicyReferenceForDisplay } from '@/utils/policyReference';

interface BanPageRendererProps {
  design: BanPageDesign;
  category: BanCategory;
  uuid: string;
  banReason: string;
  policyReference: string;
  onAppealClick: () => void;
}

export function BanPageRenderer({
  design,
  category,
  uuid,
  banReason,
  policyReference,
  onAppealClick
}: BanPageRendererProps) {
  const { theme, content, layout, responsive } = design;

  return (
    <div 
      className={`h-screen bg-gradient-to-br ${theme.backgroundColor} flex items-center justify-center p-2 sm:p-4 relative overflow-hidden`}
      style={{
        '--primary-color': theme.primaryColor,
        '--secondary-color': theme.secondaryColor,
        '--accent-color': theme.accentColor,
      } as React.CSSProperties}
    >
      {/* Background Effects */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-current/20 via-transparent to-transparent"
        style={{ color: theme.primaryColor }}
      />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:50px_50px]" />
      
      <div className="w-full max-w-7xl h-full flex items-center relative z-10">
        {/* Main ban notice */}
        <div className={`w-full bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-xl ${theme.borderColor} ${layout.borderRadius} shadow-2xl overflow-hidden`}>
          
          {/* Header */}
          <div 
            className={`relative bg-gradient-to-r ${theme.borderColor} ${layout.contentPadding} border-b`}
            style={{
              background: `linear-gradient(to right, ${theme.primaryColor}20, ${theme.secondaryColor}20)`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div 
                  className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm ${theme.borderColor}`}
                  style={{
                    background: `linear-gradient(to bottom right, ${theme.primaryColor}30, ${theme.secondaryColor}30)`
                  }}
                >
                  <svg 
                    className={`${content.icon.size} ${content.icon.color}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d={content.icon.value} 
                    />
                  </svg>
                </div>
                <div>
                  <h1 className={`${responsive.mobile.fontSize.title} sm:${responsive.tablet.fontSize.title} lg:${responsive.desktop.fontSize.title} font-bold text-white`}>
                    {content.title}
                  </h1>
                  <p className={`${content.icon.color} ${responsive.mobile.fontSize.subtitle} sm:${responsive.tablet.fontSize.subtitle} hidden sm:block`}>
                    {content.subtitle}
                  </p>
                  <p className={`${content.icon.color} text-xs sm:hidden`}>
                    {content.subtitle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <div 
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span 
                    className={`font-medium text-xs sm:text-sm`}
                    style={{ color: theme.accentColor }}
                  >
                    {content.statusBadge}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{content.processingTime}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={layout.contentPadding}>
            <div className={`grid grid-cols-1 sm:grid-cols-${responsive.tablet.gridColumns} lg:grid-cols-${responsive.desktop.gridColumns} gap-3 sm:gap-6 h-full`}>
              
              {/* Policy Reference */}
              <div className="space-y-3 sm:space-y-4">
                <div 
                  className={`bg-gradient-to-r ${theme.borderColor} ${layout.borderRadius} ${layout.contentPadding} backdrop-blur-sm`}
                  style={{
                    background: `linear-gradient(to right, ${theme.primaryColor}10, ${theme.secondaryColor}10)`
                  }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className={`${responsive.mobile.fontSize.subtitle} sm:${responsive.tablet.fontSize.subtitle} font-bold text-white flex items-center`}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" style={{ color: theme.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Policy Reference</span>
                      <span className="sm:hidden">Policy ID</span>
                    </h3>
                    <div 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${theme.primaryColor}20