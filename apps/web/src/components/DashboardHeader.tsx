'use client'

import React from 'react';
import { CountrySelector } from '../../../../packages/location/src/components/CountrySelector';
import { useLocationContext } from './LocationProvider';
import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title = "Dashboard" }: DashboardHeaderProps) {
  const { country, countryInfo, source, isManualSelection } = useLocationContext();

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        {/* Left side - Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          
          {/* Country info badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs">
              <span>{countryInfo?.flag}</span>
              <span className="font-medium">{countryInfo?.name}</span>
            </div>
            
            {/* Detection source indicator */}
            {source === 'netlify' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Detectado por IP
              </span>
            )}
            {source === 'browser' && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Detectado por navegador
              </span>
            )}
            {isManualSelection && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Selección manual
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Country selector */}
          <CountrySelector variant="minimal" showLabel={false} />
          
          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="w-4 h-4" />
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          
          {/* User menu */}
          <Button variant="ghost" size="sm">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
