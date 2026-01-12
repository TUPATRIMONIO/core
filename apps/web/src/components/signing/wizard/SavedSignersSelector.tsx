'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronsUpDown, Search, User, Users, Star } from 'lucide-react'
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
import { toast } from 'sonner'

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
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Personal
                      </Badge>
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
                      <Badge variant="outline" className="text-[10px] font-normal border-[var(--tp-buttons-20)] text-[var(--tp-buttons)]">
                        Organización
                      </Badge>
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
    </Popover>
  )
}


