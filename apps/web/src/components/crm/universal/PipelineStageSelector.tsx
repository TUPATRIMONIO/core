'use client';

/**
 * PipelineStageSelector
 * Selector para cambiar la etapa de una entidad en su pipeline
 */

import { useState, useEffect } from 'react';
import { PipelineStage } from '@/types/crm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface PipelineStageSelectorProps {
  pipelineId: string;
  currentStageId?: string;
  originalStageId?: string; // Para mostrar si hay cambios pendientes
  onChange: (stageId: string) => Promise<void> | void;
  disabled?: boolean;
  showBadge?: boolean;
  className?: string;
}

export function PipelineStageSelector({
  pipelineId,
  currentStageId,
  originalStageId,
  onChange,
  disabled = false,
  showBadge = false,
  className = ''
}: PipelineStageSelectorProps) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  // Verificar si hay cambios pendientes
  const hasChanges = originalStageId && currentStageId && originalStageId !== currentStageId;

  useEffect(() => {
    if (pipelineId) {
      fetchStages();
    }
  }, [pipelineId]);

  const fetchStages = async () => {
    try {
      const response = await fetch(`/api/crm/pipelines/${pipelineId}/stages`);
      if (!response.ok) throw new Error('Error fetching stages');
      const data = await response.json();
      setStages(data);
    } catch (error) {
      console.error('Error fetching stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (stageId: string) => {
    if (stageId === currentStageId) return;
    
    setChanging(true);
    try {
      const result = onChange(stageId);
      // Si es Promise, esperar
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      console.error('Error changing stage:', error);
    } finally {
      setChanging(false);
    }
  };

  const currentStage = stages.find(s => s.id === currentStageId);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando...</div>;
  }

  if (stages.length === 0) {
    return <div className="text-sm text-muted-foreground">Sin pipeline asignado</div>;
  }

  if (showBadge && currentStage) {
    return (
      <Badge 
        style={{ backgroundColor: currentStage.color }}
        className="text-white font-normal"
      >
        {currentStage.is_final && <CheckCircle2 className="w-3 h-3 mr-1" />}
        {currentStage.name}
      </Badge>
    );
  }

  return (
    <div className="relative">
      <Select
        value={currentStageId}
        onValueChange={handleChange}
        disabled={disabled || changing}
      >
        <SelectTrigger className={`${className} ${hasChanges ? 'border-yellow-500 bg-yellow-50' : ''}`}>
          <SelectValue placeholder="Selecciona etapa">
            {currentStage && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: currentStage.color }}
                />
                <span>{currentStage.name}</span>
                {currentStage.is_final && (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                )}
                {hasChanges && (
                  <span className="ml-auto text-xs text-yellow-600 font-medium">
                    Sin guardar
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {stages.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: stage.color }}
                />
                <span>{stage.name}</span>
                {stage.probability !== undefined && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {stage.probability}%
                  </span>
                )}
                {stage.is_final && (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Indicador de cambios pendientes */}
      {hasChanges && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

