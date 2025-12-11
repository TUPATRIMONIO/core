'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, List, Search, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ViewMode = 'list' | 'kanban';

interface RecordsViewToggleProps {
  /** Currently active view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
  /** Search input value */
  searchValue?: string;
  /** Callback when search value changes */
  onSearchChange?: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Whether the refresh action is in progress */
  isRefreshing?: boolean;
  /** Callback for refresh action */
  onRefresh?: () => void;
  /** Custom filter component */
  filterComponent?: React.ReactNode;
  /** Additional actions to show on the right side */
  actions?: React.ReactNode;
  /** Key for persisting view preference in localStorage */
  persistenceKey?: string;
  /** CSS class for the container */
  className?: string;
}

/**
 * A reusable toolbar component for toggling between list and kanban views,
 * with optional search, filters, and refresh functionality.
 */
export function RecordsViewToggle({
  viewMode,
  onViewModeChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  isRefreshing = false,
  onRefresh,
  filterComponent,
  actions,
  persistenceKey,
  className,
}: RecordsViewToggleProps) {
  // Persist view mode preference
  useEffect(() => {
    if (persistenceKey && typeof window !== 'undefined') {
      localStorage.setItem(`view-mode-${persistenceKey}`, viewMode);
    }
  }, [viewMode, persistenceKey]);

  // Load persisted view mode on mount
  useEffect(() => {
    if (persistenceKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`view-mode-${persistenceKey}`);
      if (saved === 'list' || saved === 'kanban') {
        onViewModeChange(saved);
      }
    }
  }, [persistenceKey]);

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 items-center justify-between mb-4", className)}>
      {/* Left side: Search and Filters */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {onSearchChange && (
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full sm:w-[300px]"
            />
          </div>
        )}
        {filterComponent}
      </div>

      {/* Right side: View Toggle, Refresh, Actions */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-lg p-1 bg-muted/50">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={cn(
              "h-8 px-3",
              viewMode === 'list' 
                ? 'bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white' 
                : 'hover:bg-muted'
            )}
          >
            <List className="h-4 w-4 mr-1" />
            Lista
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('kanban')}
            className={cn(
              "h-8 px-3",
              viewMode === 'kanban' 
                ? 'bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white' 
                : 'hover:bg-muted'
            )}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Kanban
          </Button>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        )}

        {/* Additional Actions */}
        {actions}
      </div>
    </div>
  );
}

export default RecordsViewToggle;
