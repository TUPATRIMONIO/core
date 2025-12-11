'use client';

import { cn } from '@/lib/utils';

interface DetailPageLayoutProps {
  /** Main content area (left column on desktop) */
  children: React.ReactNode;
  /** Side panel content (right column on desktop) */
  sidePanel?: React.ReactNode;
  /** Optional className for the main container */
  className?: string;
  /** Width ratio of main content vs side panel (default: '2/3') */
  mainWidth?: 'full' | '2/3' | '3/4';
}

/**
 * A reusable layout component for detail pages with a main content area 
 * and an optional side panel (similar to HubSpot's record detail pages).
 * 
 * On desktop: displays as two columns
 * On mobile: stacks with main content first, then side panel
 */
export function DetailPageLayout({
  children,
  sidePanel,
  className,
  mainWidth = '2/3',
}: DetailPageLayoutProps) {
  const mainWidthClass = {
    'full': 'lg:col-span-1',
    '2/3': 'lg:col-span-2',
    '3/4': 'lg:col-span-3',
  }[mainWidth];

  const gridColsClass = {
    'full': 'lg:grid-cols-1',
    '2/3': 'lg:grid-cols-3',
    '3/4': 'lg:grid-cols-4',
  }[mainWidth];

  if (!sidePanel) {
    return (
      <div className={cn("flex-1 px-4 pb-6", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex-1 px-4 pb-6", className)}>
      <div className={cn("grid grid-cols-1 gap-6", gridColsClass)}>
        {/* Main Content */}
        <div className={cn("space-y-6", mainWidthClass)}>
          {children}
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1 space-y-4">
          {sidePanel}
        </div>
      </div>
    </div>
  );
}

export default DetailPageLayout;
