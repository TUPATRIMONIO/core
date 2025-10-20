# 🔄 Sistema de Workflows - Reemplazo de Make.com

## 📋 Resumen del Proyecto

Este documento detalla la planificación completa para implementar un sistema robusto de workflows que reemplace la funcionalidad de Make.com, utilizando Supabase como backend principal. El sistema permitirá:

- ✅ Ejecutar procesos automatizados step-by-step
- ✅ Manejar errores de servicios externos (500, timeouts, etc.)
- ✅ Reintentos automáticos y manuales
- ✅ Monitoreo en tiempo real
- ✅ Recuperación desde el punto de falla

---

## 🗄️ Arquitectura de Base de Datos

### 1. Tabla: `workflows`
Almacena las definiciones de procesos automatizados.

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único del workflow
- `name`: Nombre descriptivo del proceso
- `description`: Descripción detallada de qué hace
- `is_active`: Si el workflow está habilitado para ejecutarse

### 2. Tabla: `workflow_executions`
Registra cada ejecución individual de un workflow.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')) DEFAULT 'pending',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  priority INTEGER DEFAULT 5, -- 1 = alta, 5 = normal, 10 = baja
  INDEX idx_workflow_executions_status ON workflow_executions(status),
  INDEX idx_workflow_executions_retry ON workflow_executions(next_retry_at, status)
);
```

**Estados posibles:**
- `pending`: Listo para ejecutarse
- `running`: En ejecución actualmente
- `completed`: Completado exitosamente
- `failed`: Fallado definitivamente (agotó reintentos)
- `paused`: Pausado temporalmente (esperando reintento)

### 3. Tabla: `workflow_steps`
Detalla cada paso individual dentro de una ejecución.

```sql
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT CHECK (step_type IN ('api_call', 'database', 'email', 'webhook', 'delay', 'condition')),
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')) DEFAULT 'pending',
  config JSONB, -- Configuración específica del paso (URL, headers, etc.)
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_details JSONB,
  external_service_url TEXT,
  http_status_code INTEGER,
  response_time_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(execution_id, step_number)
);
```

### 4. Tabla: `workflow_templates`
Plantillas reutilizables de workflows.

```sql
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL,
  config JSONB NOT NULL,
  is_critical BOOLEAN DEFAULT false, -- Si el fallo de este paso debe fallar todo el workflow
  retry_strategy JSONB DEFAULT '{"max_retries": 3, "delay_seconds": 300}',
  UNIQUE(workflow_id, step_number)
);
```

---

## ⚡ Edge Functions

### 1. Función Principal: `process-workflow`

**Ruta:** `supabase/functions/process-workflow/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WorkflowRequest {
  executionId: string
  stepNumber?: number
  forceRetry?: boolean
}

export const handler = async (req: Request): Promise<Response> => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { executionId, stepNumber, forceRetry }: WorkflowRequest = await req.json()
    
    // 1. Obtener información de la ejecución
    const execution = await getExecutionDetails(supabase, executionId)
    if (!execution) {
      throw new Error('Execution not found')
    }

    // 2. Determinar qué paso ejecutar
    const currentStep = stepNumber || execution.current_step
    
    // 3. Marcar ejecución como running
    await updateExecutionStatus(supabase, executionId, 'running')
    
    // 4. Ejecutar el paso actual
    const stepResult = await executeStep(supabase, executionId, currentStep)
    
    // 5. Procesar resultado y continuar workflow
    await processStepResult(supabase, executionId, currentStep, stepResult)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        executionId, 
        completedStep: currentStep 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Workflow execution error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Funciones auxiliares
async function executeStep(supabase: any, executionId: string, stepNumber: number) {
  // Marcar paso como running
  await updateStepStatus(supabase, executionId, stepNumber, 'running')
  
  // Obtener configuración del paso
  const step = await getStepConfig(supabase, executionId, stepNumber)
  
  try {
    let result
    
    switch (step.step_type) {
      case 'api_call':
        result = await executeApiCall(step.config)
        break
      case 'database':
        result = await executeDatabaseOperation(supabase, step.config)
        break
      case 'email':
        result = await sendEmail(step.config)
        break
      case 'webhook':
        result = await sendWebhook(step.config)
        break
      case 'delay':
        result = await executeDelay(step.config)
        break
      default:
        throw new Error(`Unknown step type: ${step.step_type}`)
    }
    
    // Marcar como completado
    await updateStepStatus(supabase, executionId, stepNumber, 'completed', result)
    
    return { success: true, data: result }
    
  } catch (error) {
    // Manejar error del paso
    await handleStepError(supabase, executionId, stepNumber, error)
    throw error
  }
}

async function handleStepError(supabase: any, executionId: string, stepNumber: number, error: any) {
  // Registrar error detallado en el paso
  await supabase
    .from('workflow_steps')
    .update({
      status: 'failed',
      error_message: error.message,
      error_details: {
        stack: error.stack,
        timestamp: new Date().toISOString(),
        http_status: error.status || null
      },
      completed_at: new Date().toISOString()
    })
    .eq('execution_id', executionId)
    .eq('step_number', stepNumber)

  // Obtener información de reintento
  const { data: execution } = await supabase
    .from('workflow_executions')
    .select('retry_count, max_retries, workflow_id')
    .eq('id', executionId)
    .single()

  // Verificar si es un paso crítico
  const { data: template } = await supabase
    .from('workflow_templates')
    .select('is_critical, retry_strategy')
    .eq('workflow_id', execution.workflow_id)
    .eq('step_number', stepNumber)
    .single()

  if (template?.is_critical && execution.retry_count >= execution.max_retries) {
    // Fallar toda la ejecución si es crítico y agotó reintentos
    await updateExecutionStatus(supabase, executionId, 'failed', error.message)
  } else if (execution.retry_count < execution.max_retries) {
    // Programar reintento
    const retryDelay = template?.retry_strategy?.delay_seconds || 300 // 5 minutos default
    const nextRetry = new Date(Date.now() + retryDelay * 1000)
    
    await supabase
      .from('workflow_executions')
      .update({
        status: 'paused',
        retry_count: execution.retry_count + 1,
        next_retry_at: nextRetry.toISOString(),
        error_message: error.message
      })
      .eq('id', executionId)
  } else {
    // Agotar reintentos
    await updateExecutionStatus(supabase, executionId, 'failed', 
      `Failed after ${execution.max_retries} retries: ${error.message}`)
  }
}
```

### 2. Función de Monitoreo: `workflow-monitor`

**Ruta:** `supabase/functions/workflow-monitor/index.ts`

```typescript
// Función para obtener estado de workflows y ejecutar acciones de monitoreo
export const handler = async (req: Request): Promise<Response> => {
  const supabase = createClient(/* credenciales */)
  
  const action = new URL(req.url).searchParams.get('action')
  
  switch (action) {
    case 'retry':
      return await retryExecution(req, supabase)
    case 'cancel':
      return await cancelExecution(req, supabase)
    case 'status':
      return await getExecutionStatus(req, supabase)
    default:
      return await getAllExecutions(req, supabase)
  }
}
```

---

## 🔄 Sistema de Reintentos Automáticos

### 1. Función PostgreSQL para Reintentos

```sql
-- Función que procesa reintentos automáticos
CREATE OR REPLACE FUNCTION process_workflow_retries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    execution_record RECORD;
BEGIN
    -- Buscar ejecuciones listas para reintento
    FOR execution_record IN 
        SELECT id, workflow_id, current_step
        FROM workflow_executions 
        WHERE status = 'paused' 
          AND next_retry_at <= NOW()
          AND retry_count < max_retries
        ORDER BY priority ASC, created_at ASC
        LIMIT 50 -- Procesar máximo 50 por ejecución
    LOOP
        -- Marcar como pending para que sea procesada
        UPDATE workflow_executions 
        SET status = 'pending',
            next_retry_at = NULL,
            updated_at = NOW()
        WHERE id = execution_record.id;
        
        -- Llamar a Edge Function para procesar
        PERFORM net.http_post(
            url := current_setting('app.settings.edge_function_url') || '/process-workflow',
            body := json_build_object(
                'executionId', execution_record.id,
                'stepNumber', execution_record.current_step
            )::text,
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                      current_setting('app.settings.service_role_key') || '"}'::jsonb
        );
    END LOOP;
END;
$$;

-- Crear cron job para ejecutar cada 2 minutos
SELECT cron.schedule(
    'workflow-retries',
    '*/2 * * * *', -- Cada 2 minutos
    'SELECT process_workflow_retries();'
);
```

### 2. Configuración de Variables

```sql
-- Configurar variables necesarias para el sistema
ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://tu-proyecto.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.settings.service_role_key = 'tu-service-role-key';
```

---

## 🖥️ Interfaz de Usuario (Frontend)

### 1. Dashboard Principal

**Archivo:** `src/app/workflows/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkflowExecutionCard } from '@/components/workflows/ExecutionCard'
import { WorkflowStats } from '@/components/workflows/Stats'

export default function WorkflowsPage() {
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, running, failed, completed
  
  const supabase = createClient()
  
  useEffect(() => {
    fetchExecutions()
    setupRealtimeSubscription()
  }, [filter])
  
  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('workflow_executions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_executions'
        },
        () => fetchExecutions() // Refrescar cuando haya cambios
      )
      .subscribe()
    
    return () => subscription.unsubscribe()
  }
  
  const retryExecution = async (executionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('workflow-monitor', {
        body: { 
          action: 'retry', 
          executionId 
        }
      })
      
      if (error) throw error
      
      // Refrescar lista
      fetchExecutions()
    } catch (error) {
      console.error('Error retrying execution:', error)
      alert('Error al reintentar la ejecución')
    }
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Workflows Dashboard
        </h1>
        <p className="text-gray-600">
          Monitorea y gestiona tus procesos automatizados
        </p>
      </div>
      
      <WorkflowStats executions={executions} />
      
      <div className="mb-6">
        <div className="flex gap-2">
          {['all', 'running', 'failed', 'completed', 'paused'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === status 
                  ? 'bg-[#800039] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid gap-4">
        {executions.map(execution => (
          <WorkflowExecutionCard
            key={execution.id}
            execution={execution}
            onRetry={retryExecution}
          />
        ))}
      </div>
    </div>
  )
}
```

### 2. Componente de Tarjeta de Ejecución

**Archivo:** `src/components/workflows/ExecutionCard.tsx`

```typescript
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ExecutionCardProps {
  execution: any
  onRetry: (id: string) => void
}

export function WorkflowExecutionCard({ execution, onRetry }: ExecutionCardProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800', 
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      paused: 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }
  
  const progressPercentage = (execution.current_step / execution.total_steps) * 100
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {execution.workflow?.name || 'Workflow Sin Nombre'}
          </h3>
          <p className="text-sm text-gray-600">
            Iniciado {format(new Date(execution.started_at), 'PPp', { locale: es })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(execution.status)}`}>
            {execution.status}
          </span>
          
          {(execution.status === 'failed' || execution.status === 'paused') && (
            <button
              onClick={() => onRetry(execution.id)}
              className="px-3 py-1 bg-[#800039] text-white text-xs rounded-lg hover:bg-[#a50049] transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progreso</span>
          <span>{execution.current_step}/{execution.total_steps} pasos</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#800039] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Información de errores */}
      {execution.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {execution.error_message}
          </p>
          {execution.retry_count > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Intentos: {execution.retry_count}/{execution.max_retries}
            </p>
          )}
        </div>
      )}
      
      {/* Próximo reintento */}
      {execution.next_retry_at && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm text-orange-800">
            <strong>Próximo reintento:</strong> {format(new Date(execution.next_retry_at), 'PPp', { locale: es })}
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## 📊 Métricas y Monitoreo

### 1. Dashboard de Estadísticas

**Archivo:** `src/components/workflows/Stats.tsx`

```typescript
interface StatsProps {
  executions: any[]
}

export function WorkflowStats({ executions }: StatsProps) {
  const stats = {
    total: executions.length,
    running: executions.filter(e => e.status === 'running').length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    paused: executions.filter(e => e.status === 'paused').length,
    successRate: executions.length > 0 
      ? ((executions.filter(e => e.status === 'completed').length / executions.length) * 100).toFixed(1)
      : '0'
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      <StatCard title="Total" value={stats.total} color="gray" />
      <StatCard title="Ejecutándose" value={stats.running} color="blue" />
      <StatCard title="Completados" value={stats.completed} color="green" />
      <StatCard title="Fallidos" value={stats.failed} color="red" />
      <StatCard title="En Pausa" value={stats.paused} color="orange" />
      <StatCard title="Éxito %" value={`${stats.successRate}%`} color="purple" />
    </div>
  )
}

function StatCard({ title, value, color }: { title: string, value: string | number, color: string }) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-900',
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    red: 'bg-red-50 text-red-900',
    orange: 'bg-orange-50 text-orange-900',
    purple: 'bg-purple-50 text-purple-900'
  }
  
  return (
    <div className={`${colorClasses[color]} rounded-lg p-4`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
```

---

## 🚀 Plan de Implementación

### Fase 1: Base de Datos (Semana 1)
- [ ] Crear migraciones para todas las tablas
- [ ] Implementar funciones PostgreSQL básicas
- [ ] Configurar índices para optimización
- [ ] Crear datos de prueba

### Fase 2: Edge Functions (Semana 2)
- [ ] Implementar `process-workflow` function
- [ ] Crear `workflow-monitor` function  
- [ ] Añadir manejo de errores robusto
- [ ] Implementar diferentes tipos de pasos (API, DB, email, etc.)

### Fase 3: Sistema de Reintentos (Semana 3)
- [ ] Configurar cron jobs en Supabase
- [ ] Implementar lógica de reintentos automáticos
- [ ] Crear sistema de prioridades
- [ ] Añadir alertas por email/Slack

### Fase 4: Interfaz de Usuario (Semana 4)
- [ ] Crear dashboard principal
- [ ] Implementar monitoreo en tiempo real
- [ ] Añadir controles manuales (retry, cancel, etc.)
- [ ] Crear vistas detalladas de ejecuciones

### Fase 5: Optimización y Pruebas (Semana 5)
- [ ] Pruebas de carga
- [ ] Optimización de performance
- [ ] Documentación de usuario
- [ ] Migración de workflows existentes

---

## 🛡️ Consideraciones de Seguridad

1. **Autenticación**: Todas las Edge Functions requieren autenticación
2. **RLS**: Configurar Row Level Security en todas las tablas
3. **Rate Limiting**: Implementar límites de ejecución por usuario
4. **Logs Audit**: Registrar todas las acciones administrativas
5. **Secrets**: Usar Vault de Supabase para credenciales sensibles

---

## 📈 Métricas Importantes a Monitorear

1. **Tasa de Éxito**: Porcentaje de workflows completados exitosamente
2. **Tiempo de Ejecución**: Duración promedio de workflows
3. **Errores por Servicio**: Qué servicios externos fallan más
4. **Reintentos**: Cuántos workflows requieren reintentos
5. **Carga del Sistema**: Workflows concurrentes ejecutándose

---

## 🔧 Configuración de Variables de Entorno

```env
# Edge Functions
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Servicios Externos (ejemplo)
SENDGRID_API_KEY=tu-sendgrid-key
SLACK_WEBHOOK_URL=tu-slack-webhook

# Configuración de Reintentos
DEFAULT_MAX_RETRIES=3
DEFAULT_RETRY_DELAY_SECONDS=300
MAX_CONCURRENT_EXECUTIONS=50
```

---

## 📚 Recursos y Referencias

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

*Documento creado el: 2025-01-20*  
*Versión: 1.0*  
*Autor: Sistema de IA TuPatrimonio*
