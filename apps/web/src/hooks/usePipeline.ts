'use client';

/**
 * usePipeline Hook
 * Hook para cargar y gestionar pipelines
 */

import { useState, useEffect } from 'react';
import { Pipeline, PipelineStage, EntityType } from '@/types/crm';

interface UsePipelineOptions {
  pipelineId?: string;
  entityType?: EntityType;
  includeStages?: boolean;
  autoFetch?: boolean;
}

interface UsePipelineReturn {
  pipeline: Pipeline | null;
  stages: PipelineStage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getStage: (stageId: string) => PipelineStage | undefined;
  getFirstStage: () => PipelineStage | undefined;
  getNextStage: (currentStageId: string) => PipelineStage | undefined;
  getPreviousStage: (currentStageId: string) => PipelineStage | undefined;
}

export function usePipeline({
  pipelineId,
  entityType,
  includeStages = true,
  autoFetch = true
}: UsePipelineOptions): UsePipelineReturn {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = async () => {
    if (!pipelineId) {
      // Si no hay pipelineId pero hay entityType, buscar el default
      if (entityType) {
        await fetchDefaultPipeline();
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/pipelines/${pipelineId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar pipeline');
      }

      const data = await response.json();
      setPipeline(data);
      
      if (data.stages) {
        setStages(data.stages.sort((a: PipelineStage, b: PipelineStage) => 
          a.display_order - b.display_order
        ));
      } else if (includeStages) {
        await fetchStages(pipelineId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultPipeline = async () => {
    if (!entityType) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/crm/pipelines?entity_type=${entityType}&is_active=true&include_stages=true`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar pipeline por defecto');
      }

      const data = await response.json();
      const defaultPipeline = data.find((p: Pipeline) => p.is_default) || data[0];
      
      if (defaultPipeline) {
        setPipeline(defaultPipeline);
        if (defaultPipeline.stages) {
          setStages(defaultPipeline.stages.sort((a: PipelineStage, b: PipelineStage) => 
            a.display_order - b.display_order
          ));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching default pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async (id: string) => {
    try {
      const response = await fetch(`/api/crm/pipelines/${id}/stages`);
      if (!response.ok) throw new Error('Error al cargar stages');
      
      const data = await response.json();
      setStages(data.sort((a: PipelineStage, b: PipelineStage) => 
        a.display_order - b.display_order
      ));
    } catch (err) {
      console.error('Error fetching stages:', err);
    }
  };

  useEffect(() => {
    if (autoFetch && (pipelineId || entityType)) {
      fetchPipeline();
    }
  }, [pipelineId, entityType, includeStages, autoFetch]);

  const getStage = (stageId: string): PipelineStage | undefined => {
    return stages.find(s => s.id === stageId);
  };

  const getFirstStage = (): PipelineStage | undefined => {
    return stages[0];
  };

  const getNextStage = (currentStageId: string): PipelineStage | undefined => {
    const currentIndex = stages.findIndex(s => s.id === currentStageId);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return undefined;
    return stages[currentIndex + 1];
  };

  const getPreviousStage = (currentStageId: string): PipelineStage | undefined => {
    const currentIndex = stages.findIndex(s => s.id === currentStageId);
    if (currentIndex <= 0) return undefined;
    return stages[currentIndex - 1];
  };

  return {
    pipeline,
    stages,
    loading,
    error,
    refresh: fetchPipeline,
    getStage,
    getFirstStage,
    getNextStage,
    getPreviousStage
  };
}


