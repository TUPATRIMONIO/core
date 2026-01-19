'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronsUpDown, Search, User, Users, Star, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatRutOnInput, getRutError, cleanRut } from '@/lib/utils/rut'

const EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]+$/
const SAVED_SIGNER_IDENTIFIER_TYPES = ['rut', 'passport', 'other'] as const
const SAVED_SIGNER_IDENTIFIER_OPTIONS = [
  { value: 'rut', label: 'RUT' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'other', label: 'Otro' },
] as const

function normalizeRutToDb(input: string) {
  const clean = cleanRut(input)
  if (!clean) return ''
  if (clean.length < 2) return clean
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`
}

export interface SavedSigner {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone?: string
  identifier_type: string
  identifier_value: string
  type: 'personal' | 'organization'
  is_favorite: boolean
}

interface SavedSignersSelectorProps {
  onSelect: (signer: SavedSigner) => void
  organizationId?: string
}

export function SavedSignersSelector({ onSelect, organizationId }: SavedSignersSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedSigners, setSavedSigners] = useState<SavedSigner[]>([])
  const [editingSigner, setEditingSigner] = useState<SavedSigner | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editValues, setEditValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    identifier_type: '',
    identifier_value: '',
  })
  const supabase = createClient()

  const loadSavedSigners = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('saved_signers')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('usage_count', { ascending: false })

      if (error) throw error
      setSavedSigners(data || [])
    } catch (error: any) {
      console.error('Error loading saved signers:', error)
      toast.error('Error al cargar firmantes guardados')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadSavedSigners()
  }, [loadSavedSigners])

  const personalSigners = savedSigners.filter(s => s.type === 'personal')
  const organizationSigners = savedSigners.filter(s => s.type === 'organization')

  const handleDeleteSigner = useCallback(
    async (signerId: string) => {
      if (!confirm('¿Eliminar este firmante guardado?')) return
      try {
        const { error } = await supabase
          .from('saved_signers')
          .delete()
          .eq('id', signerId)

        if (error) throw error
        setSavedSigners((prev) => prev.filter((signer) => signer.id !== signerId))
        toast.success('Firmante eliminado')
      } catch (error: any) {
        console.error('Error deleting saved signer:', error)
        toast.error('No se pudo eliminar el firmante')
      }
    },
    [supabase]
  )

  const openEditDialog = useCallback((signer: SavedSigner) => {
    const safeIdentifierType = SAVED_SIGNER_IDENTIFIER_TYPES.includes(
      signer.identifier_type as (typeof SAVED_SIGNER_IDENTIFIER_TYPES)[number]
    )
      ? signer.identifier_type
      : 'other'
    setEditValues({
      first_name: signer.first_name || '',
      last_name: signer.last_name || '',
      email: signer.email || '',
      phone: signer.phone || '',
      identifier_type: safeIdentifierType,
      identifier_value: signer.identifier_value || '',
    })
    setEditingSigner(signer)
  }, [])

  const isRutType = editValues.identifier_type === 'rut'
  const identifierValueLabel = isRutType ? 'RUT' : 'N° Identificador'

  const { nameError, emailError, identifierError } = useMemo(() => {
    const errors = {
      nameError: '',
      emailError: '',
      identifierError: '',
    }

    if (!editValues.first_name.trim() || !editValues.last_name.trim()) {
      errors.nameError = 'Nombre y apellido son obligatorios.'
    }

    if (!editValues.email.trim()) {
      errors.emailError = 'Email es obligatorio.'
    } else if (!EMAIL_REGEX.test(editValues.email.trim())) {
      errors.emailError = 'Email inválido.'
    }

    const identifier = editValues.identifier_value.trim()
    if (!identifier) {
      errors.identifierError = `${identifierValueLabel} es obligatorio.`
    } else if (isRutType) {
      const rutValidationError = getRutError(identifier)
      if (rutValidationError) {
        errors.identifierError = rutValidationError
      }
    } else if (identifier.length < 5) {
      errors.identifierError = 'El identificador debe tener al menos 5 caracteres.'
    }

    return errors
  }, [
    editValues.first_name,
    editValues.last_name,
    editValues.email,
    editValues.identifier_value,
    identifierValueLabel,
    isRutType,
  ])

  const handleUpdateSigner = useCallback(async () => {
    if (!editingSigner) return
    const firstName = editValues.first_name.trim()
    const lastName = editValues.last_name.trim()
    const email = editValues.email.trim()
    const identifierType = editValues.identifier_type.trim()
    const identifierValue = editValues.identifier_value.trim()

    if (nameError || emailError || identifierError || !identifierType) {
      toast.error('Revisa los datos antes de guardar.')
      return
    }

    try {
      setIsUpdating(true)
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: editValues.phone.trim() || null,
        identifier_type: identifierType,
        identifier_value: isRutType ? normalizeRutToDb(identifierValue) : identifierValue,
      }

      const { data, error } = await supabase
        .from('saved_signers')
        .update(payload)
        .eq('id', editingSigner.id)
        .select('*')
        .single()

      if (error) throw error

      setSavedSigners((prev) =>
        prev.map((signer) => (signer.id === editingSigner.id ? { ...signer, ...data } : signer))
      )
      toast.success('Firmante actualizado')
      setEditingSigner(null)
    } catch (error: any) {
      console.error('Error updating saved signer:', error)
      toast.error('No se pudo actualizar el firmante')
    } finally {
      setIsUpdating(false)
    }
  }, [
    editValues,
    editingSigner,
    supabase,
    emailError,
    identifierError,
    isRutType,
    nameError,
  ])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {loading ? 'Cargando firmantes...' : 'Buscar firmante guardado...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nombre o email..." />
          <CommandList>
            <CommandEmpty>No se encontraron firmantes guardados.</CommandEmpty>
            
            {personalSigners.length > 0 && (
              <CommandGroup heading="Mis Firmantes (Personales)">
                {personalSigners.map((signer) => (
                  <CommandItem
                    key={signer.id}
                    value={`${signer.full_name} ${signer.email}`}
                    onSelect={() => {
                      onSelect(signer)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {signer.full_name}
                        {signer.is_favorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          Personal
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleDeleteSigner(signer.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            openEditDialog(signer)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground px-6">
                      {signer.email} • {signer.identifier_value}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {organizationSigners.length > 0 && (
              <CommandGroup heading="Firmantes de Organización">
                {organizationSigners.map((signer) => (
                  <CommandItem
                    key={signer.id}
                    value={`${signer.full_name} ${signer.email}`}
                    onSelect={() => {
                      onSelect(signer)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {signer.full_name}
                        {signer.is_favorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-normal border-[var(--tp-buttons-20)] text-[var(--tp-buttons)]">
                          Organización
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleDeleteSigner(signer.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            openEditDialog(signer)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground px-6">
                      {signer.email} • {signer.identifier_value}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>

      <Dialog open={!!editingSigner} onOpenChange={(nextOpen) => !nextOpen && setEditingSigner(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar firmante guardado</DialogTitle>
            <DialogDescription>
              Actualiza los datos para que siempre estén correctos cuando lo reutilices.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="saved-signer-first-name">Nombre</Label>
              <Input
                id="saved-signer-first-name"
                value={editValues.first_name}
                onChange={(event) =>
                  setEditValues((prev) => ({ ...prev, first_name: event.target.value }))
                }
                className={nameError ? 'border-red-500' : ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="saved-signer-last-name">Apellido</Label>
              <Input
                id="saved-signer-last-name"
                value={editValues.last_name}
                onChange={(event) =>
                  setEditValues((prev) => ({ ...prev, last_name: event.target.value }))
                }
                className={nameError ? 'border-red-500' : ''}
              />
            </div>
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="saved-signer-email">Email</Label>
              <Input
                id="saved-signer-email"
                type="email"
                value={editValues.email}
                onChange={(event) =>
                  setEditValues((prev) => ({ ...prev, email: event.target.value }))
                }
                className={emailError ? 'border-red-500' : ''}
              />
            </div>
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="saved-signer-phone">Teléfono</Label>
              <Input
                id="saved-signer-phone"
                value={editValues.phone}
                onChange={(event) =>
                  setEditValues((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de identificación</Label>
              <Select
                value={editValues.identifier_type}
                onValueChange={(value) =>
                  setEditValues((prev) => ({ ...prev, identifier_type: value, identifier_value: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {SAVED_SIGNER_IDENTIFIER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="saved-signer-id-value">{identifierValueLabel}</Label>
              <Input
                id="saved-signer-id-value"
                value={editValues.identifier_value}
                onChange={(event) =>
                  setEditValues((prev) => ({
                    ...prev,
                    identifier_value: isRutType
                      ? formatRutOnInput(event.target.value)
                      : event.target.value,
                  }))
                }
                placeholder={isRutType ? '12.345.678-9' : 'Ej: AB1234567'}
                className={identifierError ? 'border-red-500' : ''}
              />
            </div>
            {identifierError && <p className="text-xs text-red-500">{identifierError}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSigner(null)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdateSigner}
              disabled={isUpdating}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {isUpdating ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  )
}


