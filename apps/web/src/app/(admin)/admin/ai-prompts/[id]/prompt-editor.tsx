'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Save, Copy, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PromptData {
  id?: string
  feature_type: string
  country_code: string
  name: string
  system_prompt: string
  user_prompt_template: string
  ai_model: string
  temperature: number
  max_tokens: number
  is_active: boolean
  version: number
  description: string
  output_schema?: any
}

interface PromptEditorProps {
  initialData: PromptData | null
  isNew: boolean
}

export function PromptEditor({ initialData, isNew }: PromptEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<PromptData>(initialData || {
    feature_type: 'document_review',
    country_code: 'CL',
    name: '',
    system_prompt: '',
    user_prompt_template: '',
    ai_model: 'claude-sonnet-4-5-20250929',
    temperature: 0.2,
    max_tokens: 4000,
    is_active: false,
    version: 1,
    description: ''
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleSave = async (asNewVersion = false) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (isNew) {
        const { error: insertError } = await supabase.from('ai_prompts').insert({
          ...formData,
          version: 1,
        })
        if (insertError) throw insertError
        setSuccess('Prompt creado exitosamente')
        setTimeout(() => router.push('/admin/ai-prompts'), 1000)
      } else {
        if (asNewVersion) {
          const { count } = await supabase
            .from('ai_prompts')
            .select('*', { count: 'exact', head: true })
            .eq('feature_type', formData.feature_type)
            .eq('country_code', formData.country_code)

          const nextVersion = (count || 0) + 1
          const { id, ...rest } = formData

          const { error: insertError } = await supabase.from('ai_prompts').insert({
            ...rest,
            version: nextVersion,
            description: formData.description || `Versión ${nextVersion}`,
            is_active: false
          })
          if (insertError) throw insertError
          setSuccess(`Nueva versión v${nextVersion} creada`)
          setTimeout(() => router.push('/admin/ai-prompts'), 1000)
        } else {
          const { error: updateError } = await supabase
            .from('ai_prompts')
            .update({
              name: formData.name,
              system_prompt: formData.system_prompt,
              user_prompt_template: formData.user_prompt_template,
              ai_model: formData.ai_model,
              temperature: formData.temperature,
              max_tokens: formData.max_tokens,
              is_active: formData.is_active,
              description: formData.description,
              output_schema: formData.output_schema
            })
            .eq('id', formData.id)
          if (updateError) throw updateError
          setSuccess('Prompt actualizado')
          router.refresh()
        }
      }
    } catch (e: any) {
      setError(e.message || 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => handleChange('name', e.target.value)} 
                placeholder="Ej: Revisión Legal Chile v1"
              />
            </div>
            <div className="space-y-2">
              <Label>Funcionalidad</Label>
              <Select
                value={formData.feature_type}
                onValueChange={(v) => handleChange('feature_type', v)}
                disabled={!isNew}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document_review">Revisión Documental</SelectItem>
                  <SelectItem value="classification">Clasificación</SelectItem>
                  <SelectItem value="extraction">Extracción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Select
                value={formData.country_code}
                onValueChange={(v) => handleChange('country_code', v)}
                disabled={!isNew}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Global (Todos)</SelectItem>
                  <SelectItem value="CL">Chile</SelectItem>
                  <SelectItem value="PE">Perú</SelectItem>
                  <SelectItem value="MX">México</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modelo IA</Label>
              <Select value={formData.ai_model} onValueChange={(v) => handleChange('ai_model', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</SelectItem>
                  <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(c) => handleChange('is_active', c)}
              />
              <Label>Activo en producción</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>Instrucciones base para el modelo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="font-mono text-sm min-h-[200px]"
              value={formData.system_prompt}
              onChange={(e) => handleChange('system_prompt', e.target.value)}
              placeholder="Eres un analista legal experto..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Prompt Template</CardTitle>
            <CardDescription>Template con variables {'{{variable}}'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="font-mono text-sm min-h-[200px]"
              value={formData.user_prompt_template}
              onChange={(e) => handleChange('user_prompt_template', e.target.value)}
              placeholder="Analiza el documento con fecha {{current_date}}..."
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Variables Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p><code className="bg-muted px-1 rounded">{'{{current_date}}'}</code> - Fecha actual</p>
            <p><code className="bg-muted px-1 rounded">{'{{country_code}}'}</code> - Código de país</p>
            <p><code className="bg-muted px-1 rounded">{'{{document_id}}'}</code> - ID del documento</p>
            <p><code className="bg-muted px-1 rounded">{'{{has_blank_pages}}'}</code> - Tiene páginas en blanco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output Schema (JSON)</CardTitle>
            <CardDescription>
              Define la estructura de respuesta esperada. <strong>Requerido para revisión documental.</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              className="font-mono text-xs min-h-[200px]"
              value={typeof formData.output_schema === 'object' ? JSON.stringify(formData.output_schema, null, 2) : (formData.output_schema || '')}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  handleChange('output_schema', parsed)
                } catch {
                  // Allow invalid JSON while typing
                  handleChange('output_schema', e.target.value)
                }
              }}
              placeholder='{"type": "object", "properties": {...}}'
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                const exampleSchema = {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    resultado_revision: { 
                      type: "string", 
                      enum: ["aprobado", "observado", "rechazado"],
                      description: "Resultado final de la revisión"
                    },
                    tipo_documento: { 
                      type: "string",
                      description: "Tipo de documento identificado" 
                    },
                    resumen: { 
                      type: "string",
                      description: "Resumen del documento en máximo 50 palabras" 
                    },
                    puntos_importantes: {
                      type: "array",
                      items: { type: "string" },
                      description: "Lista de los puntos más importantes"
                    },
                    cantidad_firmantes: { 
                      type: "integer",
                      description: "Número de personas que deben firmar" 
                    },
                    observaciones: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          tipo: { type: "string", enum: ["error", "advertencia", "sugerencia"] },
                          descripcion: { type: "string" },
                          fragmento: { type: "string" }
                        },
                        required: ["tipo", "descripcion"]
                      }
                    },
                    sugerencias_modificacion: {
                      type: "array",
                      items: { type: "string" }
                    },
                    razones_rechazo: {
                      type: "array",
                      items: { type: "string" }
                    },
                    servicio_notarial_sugerido: {
                      type: "string",
                      enum: ["ninguno", "protocolizacion", "firma_autorizada_notario", "copia_legalizada"]
                    },
                    confianza: { 
                      type: "number",
                      description: "Nivel de confianza del análisis (0 a 1)" 
                    }
                  },
                  required: ["resultado_revision", "tipo_documento", "resumen", "puntos_importantes", "cantidad_firmantes", "confianza"]
                }
                handleChange('output_schema', exampleSchema)
              }}
            >
              📋 Cargar ejemplo para Revisión Documental
            </Button>
            <p className="text-xs text-muted-foreground">
              <strong>Importante:</strong> Para que el UI funcione, el schema debe incluir: <code>resultado_revision</code>, <code>tipo_documento</code>, <code>resumen</code>, <code>confianza</code>. Además, todos los objetos requieren <code>additionalProperties: false</code>.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          {!isNew && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={saving} className="w-full">
              <Copy className="mr-2 h-4 w-4" /> Guardar como v{formData.version + 1}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" /> {isNew ? 'Crear Prompt' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
