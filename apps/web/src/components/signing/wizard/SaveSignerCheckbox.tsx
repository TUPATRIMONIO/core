'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Users } from 'lucide-react'

interface SaveSignerCheckboxProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  type: 'personal' | 'organization'
  onTypeChange: (type: 'personal' | 'organization') => void
  hasOrganization: boolean
}

export function SaveSignerCheckbox({
  enabled,
  onEnabledChange,
  type,
  onTypeChange,
  hasOrganization,
}: SaveSignerCheckboxProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="save-signer"
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
        />
        <Label
          htmlFor="save-signer"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Guardar este firmante para uso futuro
        </Label>
      </div>

      {enabled && (
        <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            ¿Dónde quieres guardarlo?
          </Label>
          <Select
            value={type}
            onValueChange={(val) => onTypeChange(val as 'personal' | 'organization')}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Mis firmantes (Solo yo)</span>
                </div>
              </SelectItem>
              {hasOrganization && (
                <SelectItem value="organization">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Organización (Compartido)</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {type === 'personal'
              ? 'Solo tú podrás ver y seleccionar este firmante en el futuro.'
              : 'Todos los miembros de tu organización podrán usar este firmante.'}
          </p>
        </div>
      )}
    </div>
  )
}

