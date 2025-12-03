'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SUPPORTED_COUNTRIES } from '@tupatrimonio/location'
import { useMemo } from 'react'

interface CountryMultiSelectProps {
  selectedCountries: string[]
  onChange: (countries: string[]) => void
}

export function CountryMultiSelect({ selectedCountries, onChange }: CountryMultiSelectProps) {
  const countries = useMemo(() => {
    return Object.values(SUPPORTED_COUNTRIES).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }, [])

  const handleToggle = (countryCode: string) => {
    if (selectedCountries.includes(countryCode)) {
      onChange(selectedCountries.filter(c => c !== countryCode))
    } else {
      onChange([...selectedCountries, countryCode])
    }
  }

  return (
    <div className="space-y-3">
      <Label>Países Permitidos</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
        {countries.map((country) => (
          <div key={country.code} className="flex items-center space-x-2">
            <Checkbox
              id={`country-${country.code}`}
              checked={selectedCountries.includes(country.code)}
              onCheckedChange={() => handleToggle(country.code)}
            />
            <Label
              htmlFor={`country-${country.code}`}
              className="text-sm font-normal cursor-pointer flex items-center gap-2"
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </Label>
          </div>
        ))}
      </div>
      {selectedCountries.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Si no seleccionas ningún país, el feature estará disponible en todos los países.
        </p>
      )}
    </div>
  )
}

