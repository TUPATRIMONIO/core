'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText } from 'lucide-react'

export default function RepositorySearchPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const validateIdentifier = (value: string): boolean => {
    // Formato esperado: DOC-XXXXXXXX-XXXXXXXX (8 o más caracteres hexadecimales)
    const pattern = /^DOC-[0-9A-F]{8,}-[0-9A-F]{8,}$/i
    return pattern.test(value.trim())
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const trimmedIdentifier = identifier.trim().toUpperCase()

    if (!trimmedIdentifier) {
      setError('Por favor ingresa un identificador de documento')
      return
    }

    if (!validateIdentifier(trimmedIdentifier)) {
      setError('Formato inválido. Debe ser DOC-XXXXXXXX-XXXXXXXX')
      return
    }

    setIsSearching(true)
    // Redirigir a la página del documento
    router.push(`/repository/${trimmedIdentifier}`)
  }

  return (
    <div className="min-h-screen bg-[var(--tp-background-light)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-[var(--tp-buttons-20)] p-3">
              <FileText className="h-8 w-8 text-[var(--tp-buttons)]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-quicksand">
            Buscar Documento
          </CardTitle>
          <CardDescription>
            Ingresa el identificador del documento para acceder a su información
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium">
                Identificador del Documento
              </label>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="DOC-64B27817-0415C709"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value.toUpperCase())
                    setError('')
                  }}
                  className="pr-10 font-mono"
                  disabled={isSearching}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                El identificador se encuentra en el código QR de tu documento
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              disabled={isSearching}
            >
              {isSearching ? 'Buscando...' : 'Buscar Documento'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium">¿Dónde encuentro mi identificador?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>En el código QR de la primera página de tu documento</li>
                <li>Debajo del código QR aparece el código DOC-...</li>
                <li>También puedes escanearlo directamente con tu celular</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
