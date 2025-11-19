'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Plus, Trash2, GripVertical } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import type { SignatureProvider } from '@/types/database'

interface Signer {
  id: string
  email: string
  name: string
  role: string
}

export default function NewSignaturePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, user } = useAuthStore()

  const [providers, setProviders] = useState<SignatureProvider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [providerId, setProviderId] = useState('')
  const [signingMode, setSigningMode] = useState<'parallel' | 'sequential'>('parallel')
  const [file, setFile] = useState<File | null>(null)
  const [signers, setSigners] = useState<Signer[]>([
    { id: crypto.randomUUID(), email: '', name: '', role: 'Firmante' },
  ])

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('providers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setProviders(data || [])
      if (data && data.length > 0) {
        setProviderId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading providers:', error)
    } finally {
      setIsLoadingProviders(false)
    }
  }

  const addSigner = () => {
    setSigners([
      ...signers,
      { id: crypto.randomUUID(), email: '', name: '', role: 'Firmante' },
    ])
  }

  const removeSigner = (id: string) => {
    if (signers.length > 1) {
      setSigners(signers.filter(s => s.id !== id))
    }
  }

  const updateSigner = (id: string, field: keyof Signer, value: string) => {
    setSigners(signers.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: 'Error',
          description: 'Solo se permiten archivos PDF',
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentOrganization || !user || !file) {
      toast({
        title: 'Error',
        description: 'Faltan datos requeridos',
        variant: 'destructive',
      })
      return
    }

    // Validate signers
    const validSigners = signers.filter(s => s.email && s.name)
    if (validSigners.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un firmante',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Upload file
      const fileName = `${currentOrganization.id}/${crypto.randomUUID()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error('Error al subir el archivo')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName)

      // Create document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          organization_id: currentOrganization.id,
          provider_id: providerId,
          title,
          description: description || null,
          file_url: publicUrl,
          status: 'draft',
          signing_mode: signingMode,
          created_by: user.id,
        })
        .select()
        .single()

      if (docError || !document) {
        throw new Error('Error al crear el documento')
      }

      // Create signers
      const signersToInsert = validSigners.map((s, index) => ({
        document_id: document.id,
        email: s.email,
        name: s.name,
        role: s.role,
        signing_order: signingMode === 'sequential' ? index + 1 : 1,
        status: 'pending',
      }))

      const { error: signersError } = await supabase
        .from('document_signers')
        .insert(signersToInsert)

      if (signersError) {
        throw new Error('Error al agregar firmantes')
      }

      toast({
        title: 'Documento creado',
        description: 'El documento se ha creado correctamente',
      })

      router.push(`/dashboard/signatures/${document.id}`)
    } catch (error) {
      console.error('Error creating document:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear el documento',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/signatures">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo documento</h1>
          <p className="text-muted-foreground">
            Crea un documento para firma electrónica
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del documento</CardTitle>
            <CardDescription>
              Datos básicos del documento a firmar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Contrato de servicios"
                required
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional del documento"
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="provider" className="text-sm font-medium">
                  Proveedor *
                </label>
                <select
                  id="provider"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  required
                  disabled={isLoadingProviders}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="mode" className="text-sm font-medium">
                  Modo de firma *
                </label>
                <select
                  id="mode"
                  value={signingMode}
                  onChange={(e) => setSigningMode(e.target.value as 'parallel' | 'sequential')}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="parallel">Paralelo (todos a la vez)</option>
                  <option value="sequential">Secuencial (en orden)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Archivo PDF *</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {file ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Haz clic para subir o arrastra un archivo PDF
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signers */}
        <Card>
          <CardHeader>
            <CardTitle>Firmantes</CardTitle>
            <CardDescription>
              Agrega las personas que deben firmar el documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signers.map((signer, index) => (
              <div key={signer.id} className="flex gap-4 items-start">
                {signingMode === 'sequential' && (
                  <div className="flex items-center justify-center w-8 h-10 text-sm text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    {index + 1}
                  </div>
                )}
                <div className="flex-1 grid gap-4 sm:grid-cols-3">
                  <input
                    type="text"
                    value={signer.name}
                    onChange={(e) => updateSigner(signer.id, 'name', e.target.value)}
                    placeholder="Nombre completo"
                    className="px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="email"
                    value={signer.email}
                    onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={signer.role}
                    onChange={(e) => updateSigner(signer.id, 'role', e.target.value)}
                    placeholder="Rol (ej: Arrendador)"
                    className="px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSigner(signer.id)}
                  disabled={signers.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addSigner}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar firmante
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/signatures">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading || !file || !title}>
            {isLoading ? 'Creando...' : 'Crear documento'}
          </Button>
        </div>
      </form>
    </div>
  )
}
