'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatRutOnInput,
  getRutError,
  cleanRut,
} from '@/lib/utils/rut'

interface Signer {
  id: string
  first_name: string
  last_name: string
  email: string
  rut: string | null
  phone: string | null
  status: string
  signing_order: number
  metadata: any
}

interface SignerEditPanelProps {
  documentId: string
  canEdit: boolean
  onUpdate: () => void
}

function normalizeRutToDb(input: string) {
  const clean = cleanRut(input)
  if (!clean) return ''
  if (clean.length < 2) return clean
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`
}

export function SignerEditPanel({ documentId, canEdit, onUpdate }: SignerEditPanelProps) {
  const supabase = createClient()
  
  const [signers, setSigners] = useState<Signer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Formulario nuevo firmante
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [identifierType, setIdentifierType] = useState('rut')
  const [identifierValue, setIdentifierValue] = useState('')
  const [rutError, setRutError] = useState<string | null>(null)
  
  const isRutType = identifierType === 'rut'

  const loadSigners = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('signing_signers')
        .select('*')
        .eq('document_id', documentId)
        .neq('status', 'removed')
        .order('signing_order', { ascending: true })

      if (error) throw error
      setSigners(data || [])
    } catch (e) {
      console.error('Error loading signers:', e)
      toast.error('Error al cargar firmantes')
    } finally {
      setLoading(false)
    }
  }, [documentId, supabase])

  useEffect(() => {
    loadSigners()
  }, [loadSigners])

  // Handler para RUT
  const handleIdentifierChange = (value: string) => {
    if (isRutType) {
      const formatted = formatRutOnInput(value)
      setIdentifierValue(formatted)
      if (formatted.length >= 3) {
        setRutError(getRutError(formatted))
      } else {
        setRutError(null)
      }
    } else {
      setIdentifierValue(value)
      setRutError(null)
    }
  }

  const handleAddSigner = async () => {
    if (!firstName || !lastName || !email || !identifierValue) {
      toast.error('Todos los campos son requeridos')
      return
    }
    
    if (isRutType && rutError) {
      toast.error('El RUT no es válido')
      return
    }

    try {
      setSaving(true)
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      const rutDb = isRutType ? normalizeRutToDb(identifierValue) : null

      // 1. Llamar RPC para crear (lógica base)
      const { data, error: rpcError } = await supabase.rpc('add_document_signer', {
        p_document_id: documentId,
        p_email: email.trim(),
        p_full_name: fullName,
        p_rut: rutDb,
        p_phone: phone.trim() || null,
        p_is_foreigner: !isRutType,
        p_signing_order: signers.length + 1
      })

      if (rpcError) throw rpcError

      // 2. Actualizar campos específicos
      const { error: updateError } = await supabase
        .from('signing_signers')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          metadata: {
            identifier_type: identifierType,
            identifier_value: isRutType ? normalizeRutToDb(identifierValue) : identifierValue.trim()
          }
        })
        .eq('id', data.id)

      if (updateError) throw updateError

      toast.success('Firmante agregado')
      
      // Reset form
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setIdentifierValue('')
      
      loadSigners()
      onUpdate()
    } catch (e: any) {
      console.error('Error adding signer:', e)
      toast.error(e.message || 'Error al agregar firmante')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSigner = async (signerId: string) => {
    if (!confirm('¿Estás seguro de quitar a este firmante?')) return

    try {
      setSaving(true)
      const { error } = await supabase.rpc('remove_document_signer', {
        p_signer_id: signerId,
        p_reason: 'Removido manualmente por usuario'
      })

      if (error) throw error

      toast.success('Firmante removido')
      loadSigners()
      onUpdate()
    } catch (e: any) {
      console.error('Error removing signer:', e)
      toast.error(e.message || 'Error al remover firmante')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {signers.map((signer, index) => (
          <div key={signer.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div>
              <div className="font-medium">
                {signer.first_name} {signer.last_name}
              </div>
              <div className="text-sm text-muted-foreground">{signer.email}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {signer.rut ? `RUT: ${signer.rut}` : `ID: ${signer.metadata?.identifier_value || 'N/A'}`}
                {' • '}
                <span className={signer.status === 'signed' ? 'text-green-600' : 'text-orange-600'}>
                  {signer.status === 'signed' ? 'Firmado' : 'Pendiente'}
                </span>
              </div>
            </div>
            
            {canEdit && signer.status !== 'signed' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSigner(signer.id)}
                disabled={saving}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        {signers.length === 0 && (
          <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg border-dashed border">
            No hay firmantes asignados
          </div>
        )}
      </div>

      {canEdit && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Agregar Firmante
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombres</Label>
              <Input 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Apellidos</Label>
              <Input 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white"
                placeholder="+569..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo ID</Label>
              <Select value={identifierType} onValueChange={setIdentifierType}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rut">RUT</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                  <SelectItem value="dni">DNI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">N° Identificador</Label>
              <div className="relative">
                <Input 
                  value={identifierValue} 
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  className={`bg-white ${rutError ? 'border-red-500' : ''}`}
                  placeholder={isRutType ? '12.345.678-9' : ''}
                />
                {isRutType && identifierValue.length >= 3 && !rutError && (
                  <CheckCircle2 className="h-3 w-3 text-green-500 absolute right-3 top-3" />
                )}
              </div>
              {rutError && <span className="text-[10px] text-red-500">{rutError}</span>}
            </div>
          </div>

          <Button 
            onClick={handleAddSigner} 
            disabled={saving}
            className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
          </Button>
        </div>
      )}
    </div>
  )
}
