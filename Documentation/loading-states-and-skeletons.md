# Loading States and Skeleton Components Implementation

## Enhanced Loading State Management

### 1. Multiple Loading States Hook

```typescript
// hooks/useEnhancedLoading.ts
import { useState, useCallback, useMemo } from 'react';

interface LoadingStates {
  isAuthLoading: boolean;
  isDataLoading: boolean;
  isRefreshing: boolean;
  isLiveSync: boolean;
  isBulkOperation: boolean;
  isSearching: boolean;
  isFiltering: boolean;
}

interface LoadingOptions {
  showSkeletonThreshold?: number; // ms before showing skeleton
  minLoadingTime?: number; // minimum loading time for smooth UX
}

export function useEnhancedLoading(options: LoadingOptions = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    isAuthLoading: true,
    isDataLoading: false,
    isRefreshing: false,
    isLiveSync: false,
    isBulkOperation: false,
    isSearching: false,
    isFiltering: false
  });

  const [loadingTimers, setLoadingTimers] = useState<Map<keyof LoadingStates, number>>(new Map());

  const setLoadingState = useCallback((
    key: keyof LoadingStates, 
    value: boolean,
    minTime?: number
  ) => {
    const actualMinTime = minTime || options.minLoadingTime || 300;
    
    if (value) {
      // Starting loading
      const startTime = Date.now();
      setLoadingTimers(prev => new Map(prev).set(key, startTime));
      setLoadingStates(prev => ({ ...prev, [key]: value }));
    } else {
      // Stopping loading
      const startTime = loadingTimers.get(key);
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, actualMinTime - elapsed);
        
        if (remaining > 0) {
          // Delay stopping to ensure smooth UX
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, [key]: false }));
            setLoadingTimers(prev => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          }, remaining);
        } else {
          setLoadingStates(prev => ({ ...prev, [key]: false }));
          setLoadingTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
        }
      } else {
        setLoadingStates(prev => ({ ...prev, [key]: false }));
      }
    }
  }, [loadingTimers, options.minLoadingTime]);

  // Computed loading states
  const computedStates = useMemo(() => {
    const isAnyLoading = Object.values(loadingStates).some(Boolean);
    const isCriticalLoading = loadingStates.isAuthLoading || loadingStates.isDataLoading;
    const isBackgroundLoading = loadingStates.isLiveSync || loadingStates.isRefreshing;
    const isUserActionLoading = loadingStates.isBulkOperation || loadingStates.isSearching || loadingStates.isFiltering;
    
    return {
      isAnyLoading,
      isCriticalLoading,
      isBackgroundLoading,
      isUserActionLoading,
      shouldShowSkeleton: isCriticalLoading,
      shouldShowSpinner: isUserActionLoading,
      shouldShowProgress: isBackgroundLoading
    };
  }, [loadingStates]);

  return {
    loadingStates,
    setLoadingState,
    ...computedStates
  };
}
```

### 2. Smart "No Data" Logic

```typescript
// hooks/useSmartEmptyState.ts
import { useMemo } from 'react';

interface EmptyStateOptions<T> {
  data: T[];
  isLoading: boolean;
  isSearching: boolean;
  isFiltering: boolean;
  searchQuery?: string;
  activeFilters?: Record<string, any>;
  error?: Error | null;
}

export function useSmartEmptyState<T>({
  data,
  isLoading,
  isSearching,
  isFiltering,
  searchQuery,
  activeFilters,
  error
}: EmptyStateOptions<T>) {
  
  const emptyState = useMemo(() => {
    // Don't show empty state while loading
    if (isLoading || isSearching || isFiltering) {
      return { shouldShow: false, type: 'loading' as const };
    }

    // Show error state if there's an error
    if (error) {
      return { 
        shouldShow: true, 
        type: 'error' as const,
        title: 'Failed to load data',
        message: error.message,
        action: 'retry'
      };
    }

    // No data at all
    if (data.length === 0) {
      // Check if it's due to search/filters
      const hasActiveSearch = searchQuery && searchQuery.trim().length > 0;
      const hasActiveFilters = activeFilters && Object.values(activeFilters).some(v => 
        v !== null && v !== undefined && v !== '' && v !== 'all'
      );

      if (hasActiveSearch || hasActiveFilters) {
        return {
          shouldShow: true,
          type: 'no-results' as const,
          title: 'No results found',
          message: hasActiveSearch 
            ? `No results for "${searchQuery}". Try adjusting your search.`
            : 'No results match your current filters. Try adjusting your filters.',
          action: 'clear-filters'
        };
      }

      // Truly empty - no data exists
      return {
        shouldShow: true,
        type: 'empty' as const,
        title: 'No data available',
        message: 'There is no data to display at this time.',
        action: 'refresh'
      };
    }

    // Has data, don't show empty state
    return { shouldShow: false, type: 'has-data' as const };
  }, [data.length, isLoading, isSearching, isFiltering, searchQuery, activeFilters, error]);

  return emptyState;
}
```

## Loading Skeleton Components

### 1. Visitor Table Skeleton

```typescript
// components/admin/skeletons/VisitorTableSkeleton.tsx
interface VisitorTableSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

export function VisitorTableSkeleton({ rows = 5, showHeader = true }: VisitorTableSkeletonProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {showHeader && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-slate-200 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-slate-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-6 animate-pulse">
            {/* Checkbox */}
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
            
            {/* Status indicator */}
            <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
            
            {/* Visitor info */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-3 bg-slate-200 rounded w-32"></div>
            </div>
            
            {/* Status badge */}
            <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
            
            {/* Location */}
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 rounded w-20"></div>
              <div className="h-3 bg-slate-200 rounded w-16"></div>
            </div>
            
            {/* Device info */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-slate-200 rounded"></div>
              <div className="space-y-1">
                <div className="h-4 bg-slate-200 rounded w-16"></div>
                <div className="h-3 bg-slate-200 rounded w-20"></div>
              </div>
            </div>
            
            {/* Session info */}
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 rounded w-12"></div>
              <div className="h-3 bg-slate-200 rounded w-16"></div>
            </div>
            
            {/* Source */}
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 rounded w-14"></div>
              <div className="h-3 bg-slate-200 rounded w-8"></div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2">
              <div className="w-12 h-6 bg-slate-200 rounded"></div>
              <div className="w-14 h-6 bg-slate-200 rounded"></div>
              <div className="w-16 h-6 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Analytics Cards Skeleton

```typescript
// components/admin/skeletons/AnalyticsCardsSkeleton.tsx
interface AnalyticsCardsSkeletonProps {
  count?: number;
}

export function AnalyticsCardsSkeleton({ count = 8 }: AnalyticsCardsSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3. Dashboard Overview Skeleton

```typescript
// components/admin/skeletons/DashboardSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="px-6 lg:px-8 py-8 space-y-8">
      {/* Analytics Cards Skeleton */}
      <AnalyticsCardsSkeleton />
      
      {/* Quick Actions Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="h-6 bg-slate-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-3 bg-slate-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="h-6 bg-slate-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-48"></div>
                <div className="h-3 bg-slate-200 rounded w-32"></div>
              </div>
              <div className="h-3 bg-slate-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4. Smart Empty State Component

```typescript
// components/admin/EmptyState.tsx
interface EmptyStateProps {
  type: 'loading' | 'error' | 'no-results' | 'empty' | 'has-data';
  title?: string;
  message?: string;
  action?: 'retry' | 'clear-filters' | 'refresh' | 'custom';
  onAction?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  type,
  title,
  message,
  action,
  onAction,
  actionLabel,
  icon
}: EmptyStateProps) {
  if (type === 'has-data' || type === 'loading') {
    return null;
  }

  const getDefaultIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'no-results':
        return (
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'empty':
      default:
        return (
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
    }
  };

  const getDefaultActionLabel = () => {
    switch (action) {
      case 'retry': return 'Try Again';
      case 'clear-filters': return 'Clear Filters';
      case 'refresh': return 'Refresh';
      default: return actionLabel || 'Action';
    }
  };

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon || getDefaultIcon()}
      </div>
      <h3 className="text-slate-900 text-lg font-medium mb-2">
        {title || 'No data available'}
      </h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
        {message || 'There is no data to display at this time.'}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            type === 'error'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {getDefaultActionLabel()}
        </button>
      )}
    </div>
  );
}
```

## Usage in Visitors Page

```typescript
// app/admin/visitors/page.tsx - Enhanced with new loading states
export default function VisitorsPage() {
  // Enhanced loading management
  const {
    loadingStates,
    setLoadingState,
    shouldShowSkeleton,
    shouldShowSpinner,
    isAnyLoading
  } = useEnhancedLoading();

  // Smart empty state logic
  const emptyState = useSmartEmptyState({
    data: filteredVisitors,
    isLoading: loadingStates.isDataLoading,
    isSearching: loadingStates.isSearching,
    isFiltering: loadingStates.isFiltering,
    searchQuery,
    activeFilters: { status: visitorFilter },
    error: dataError
  });

  // Enhanced search with loading state
  const handleSearch = useCallback(
    debounce((query: string) => {
      setLoadingState('isSearching', true);
      setSearchQuery(query);
      // Simulate search processing time
      setTimeout(() => setLoadingState('isSearching', false), 200);
    }, 300),
    [setLoadingState]
  );

  // Enhanced filter with loading state
  const handleFilterChange = (filter: "all" | "active" | "banned") => {
    setLoadingState('isFiltering', true);
    setVisitorFilter(filter);
    setTimeout(() => setLoadingState('isFiltering', false), 150);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 page-container">
        <UnifiedNavbar
          visitorStats={visitorStats}
          appealStats={{ total: 0, pending: 0 }}
          aiQuestionCount={0}
          isRealTimeActive={!dataError}
          onLiveSyncToggle={handleLiveSyncToggle}
        />

        <main className="px-6 lg:px-8 py-8">
          {/* Live sync progress indicator */}
          {loadingStates.isLiveSync && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 text-sm font-medium">Syncing data...</span>
            </div>
          )}

          {/* Stats Cards with skeleton */}
          {shouldShowSkeleton ? (
            <AnalyticsCardsSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Actual stats cards */}
            </div>
          )}

          {/* Controls with loading indicators */}
          <div className="card-light p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <select
                    value={visitorFilter}
                    onChange={(e) => handleFilterChange(e.target.value as any)}
                    disabled={loadingStates.isFiltering}
                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="all">All Visitors</option>
                    <option value="active">Active Only</option>
                    <option value="banned">Banned Only</option>
                  </select>
                  {loadingStates.isFiltering && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search visitors..."
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={loadingStates.isSearching}
                    className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 disabled:opacity-50"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {loadingStates.isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visitors Table with smart loading */}
          <div className="card-light overflow-hidden">
            {shouldShowSkeleton ? (
              <VisitorTableSkeleton rows={10} />
            ) : emptyState.shouldShow ? (
              <EmptyState
                type={emptyState.type}
                title={emptyState.title}
                message={emptyState.message}
                action={emptyState.action}
                onAction={() => {
                  if (emptyState.action === 'clear-filters') {
                    setVisitorFilter('all');
                    setSearchQuery('');
                  } else if (emptyState.action === 'refresh') {
                    refreshVisitors();
                  } else if (emptyState.action === 'retry') {
                    refreshVisitors();
                  }
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table content */}
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
```

## Key Benefits

1. **Smooth Loading Transitions**: No more jarring "no data" flashes
2. **Progressive Loading**: Different loading states for different operations
3. **Smart Empty States**: Context-aware empty state messages
4. **Loading Skeletons**: Better perceived performance
5. **Debounced Operations**: Smooth search and filter interactions
6. **Minimum Loading Times**: Prevents flickering for fast operations
7. **Error Recovery**: Graceful error handling with retry options

This implementation provides a professional, responsive admin interface that gives users clear feedback about what's happening at all times.