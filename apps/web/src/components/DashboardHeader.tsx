'use client'

import React from 'react';
import { CountrySelector } from '../../../../packages/location/src/components/CountrySelector';
import { useLocationContext } from './LocationProvider';
import { Button } from "@/components/ui/button";
import { Icon } from '@tupatrimonio/ui';
import { Bell, Settings, User } from "lucide-react";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title = "Dashboard" }: DashboardHeaderProps) {
  const { country, countryInfo, source, isManualSelection } = useLocationContext();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-md bg-background/95">
      <div className="tp-container py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              <span className="text-[var(--tp-brand)]">{title}</span>
            </h1>
            
            {/* Country info badge */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-1.5 text-xs border border-border">
                <span>{countryInfo?.flag}</span>
                <span className="font-medium">{countryInfo?.name}</span>
              </div>
              
              {/* Detection source indicator */}
              {source === 'netlify' && (
                <span className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 font-medium">
                  Detectado por IP
                </span>
              )}
              {source === 'browser' && (
                <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 font-medium">
                  Detectado por navegador
                </span>
              )}
              {isManualSelection && (
                <span className="text-xs bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 font-medium">
                  Selección manual
                </span>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Country selector */}
            <div className="hidden md:block">
              <CountrySelector variant="minimal" showLabel={false} />
            </div>
            
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)]"
            >
              <Icon icon={Bell} size="md" variant="inherit" />
            </Button>
            
            {/* Settings */}
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)]"
            >
              <Icon icon={Settings} size="md" variant="inherit" />
            </Button>
            
            {/* User menu */}
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)]"
            >
              <Icon icon={User} size="md" variant="inherit" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
