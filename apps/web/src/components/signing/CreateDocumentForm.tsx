'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'

const formSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  signingOrder: z.enum(['simultaneous', 'sequential']),
  notaryService: z.enum(['none', 'legalized_copy', 'protocolization', 'authorized_signature']),
  requiresApproval: z.boolean().default(false),
  requiresAiReview: z.boolean().default(true),
  file: z.any()
    .refine((file) => !!file, 'Debes seleccionar un archivo')
    .refine((file) => {
      if (typeof FileList !== 'undefined' && file instanceof FileList) return file.length > 0
      if (typeof File !== 'undefined' && file instanceof File) return true
      return false
    }, 'Debes seleccionar un archivo')
    .transform((file) => (typeof FileList !== 'undefined' && file instanceof FileList) ? file[0] : file)
    .refine((file) => file?.type === 'application/pdf', 'El archivo debe ser un PDF')
    .refine((file) => file?.size <= 50 * 1024 * 1024, 'El archivo no debe superar los 50MB'),
})

interface CreateDocumentFormProps {
  basePath?: string
}

export function CreateDocumentForm({ basePath = '/dashboard/signing/documents' }: CreateDocumentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [selectedFile])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      signingOrder: 'simultaneous',
      notaryService: 'none',
      requiresApproval: false,
      requiresAiReview: true,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // 1. Obtener usuario y organización
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast.error('No estás autenticado')
        return
      }

      const { data: orgUser, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      
      if (orgError) {
        console.error('Error fetching organization:', orgError)
        toast.error('Error al verificar organización')
        return
      }

      if (!orgUser) {
        toast.error('No tienes una organización activa')
        return
      }

      // 2. Crear documento en BD (sin archivo aún)
      const { data: newDoc, error: createError } = await supabase.rpc('create_signing_document', {
        p_organization_id: orgUser.organization_id,
        p_title: values.title,
        p_description: values.description || null,
        p_signing_order: values.signingOrder,
        p_notary_service: values.notaryService,
        p_requires_approval: values.requiresApproval,
        p_requires_ai_review: values.requiresAiReview
      })

      if (createError) {
        console.error('RPC Error:', createError)
        throw new Error(createError.message)
      }
      if (!newDoc) throw new Error('No se pudo crear el documento')

      // 3. Subir archivo a Storage (docs-originals)
      const filePath = `${orgUser.organization_id}/${newDoc.id}/v1/original.pdf`

      const { error: uploadError } = await supabase.storage
        .from('docs-originals')
        .upload(filePath, values.file)

      if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`)

      // 4. Actualizar referencia en BD
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          original_file_path: filePath,
          original_file_name: values.file.name,
          original_file_size: values.file.size,
          status: 'draft'
        })
        .eq('id', newDoc.id)

      if (updateError) throw new Error(`Error actualizando documento: ${updateError.message}`)
      
      // 5. Crear primera versión
      const { error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: newDoc.id,
          version_number: 1,
          version_type: 'original',
          file_path: filePath,
          file_name: values.file.name,
          file_size: values.file.size,
          created_by: user.id
        })
      
      if (versionError) console.error('Error creating version:', versionError) // No bloqueante

      toast.success('Documento creado exitosamente')
      
      // Redirigir a la página de detalle/edición para agregar firmantes
      router.push(`${basePath}/${newDoc.id}`)
      router.refresh()

    } catch (error: any) {
      console.error('Error creating document:', error)
      toast.error(error.message || 'Ocurrió un error al crear el documento')
    } finally {
      setIsLoading(false)
    }
  }

  const onInvalid = (errors: any) => {
    console.log('Validation errors:', errors)
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      toast.error(`Por favor revisa los campos: ${errorKeys.join(', ')}`)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Contrato de Arrendamiento 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Breve descripción del propósito de este documento..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="signingOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden de Firma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un orden" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="simultaneous">Simultáneo (Todos pueden firmar a la vez)</SelectItem>
                        <SelectItem value="sequential">Secuencial (Orden estricto)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determina si los firmantes deben esperar su turno.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notaryService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servicio Notarial</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Ninguno (Solo firma electrónica)</SelectItem>
                        <SelectItem value="legalized_copy">Copia Legalizada</SelectItem>
                        <SelectItem value="protocolization">Protocolización</SelectItem>
                        <SelectItem value="authorized_signature">Firma Autorizada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Requiere trámite posterior en notaría.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
               <FormField
                control={form.control}
                name="requiresAiReview"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Revisión por IA</FormLabel>
                      <FormDescription>
                        Analizar el documento en busca de cláusulas peligrosas o errores.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiresApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Flujo de Aprobación</FormLabel>
                      <FormDescription>
                        Requiere aprobación interna antes de enviar a firmar.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Archivo PDF</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="dropzone-file"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                           {selectedFile ? (
                             <div className="flex items-center gap-2 text-primary">
                               <FileText className="w-8 h-8" />
                               <span className="font-medium">{selectedFile.name}</span>
                               <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                             </div>
                           ) : (
                             <>
                               <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                               <p className="text-sm text-muted-foreground">
                                 <span className="font-semibold">Click para subir</span> o arrastra un archivo
                               </p>
                               <p className="text-xs text-muted-foreground">PDF (MAX. 50MB)</p>
                             </>
                           )}
                        </div>
                        <Input
                          id="dropzone-file"
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setSelectedFile(file)
                              onChange(e.target.files)
                            }
                          }}
                          {...field}
                        />
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewUrl && (
              <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                <FormLabel>Vista Previa del Documento</FormLabel>
                <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-muted/20 relative">
                  <iframe 
                    src={previewUrl} 
                    className="w-full h-full" 
                    title="Vista previa del documento"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Esta es una vista previa local. El archivo se subirá cuando crees el documento.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Documento
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
