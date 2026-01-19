"use client"

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DistributionRow {
  notaryId: string
  notaryName: string
  countryCode: string
  productId: string
  productName: string
  weight: number
  proportion: number
  assignedCount: number
}

interface DistributionMeta {
  id: string
  name: string
  countryCode?: string
}

const PIE_COLORS = [
  'var(--tp-buttons)',
  'var(--tp-buttons-hover)',
  'var(--tp-lines)',
  'var(--tp-bg-dark-20)',
  'var(--tp-bg-light-10)',
]

export function NotaryDistributionDashboard({
  rows,
  products,
  countries,
}: {
  rows: DistributionRow[]
  products: DistributionMeta[]
  countries: DistributionMeta[]
}) {
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState('all')

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const countryMatch = selectedCountry === 'all' || row.countryCode === selectedCountry
      const productMatch = selectedProduct === 'all' || row.productId === selectedProduct
      return countryMatch && productMatch
    })
  }, [rows, selectedCountry, selectedProduct])

  const pieData = useMemo(() => {
    if (selectedProduct === 'all') return []

    const grouped = new Map<string, { name: string; value: number }>()
    filteredRows.forEach((row) => {
      const current = grouped.get(row.notaryId)
      if (current) {
        current.value += row.proportion
      } else {
        grouped.set(row.notaryId, { name: row.notaryName, value: row.proportion })
      }
    })

    return Array.from(grouped.values())
  }, [filteredRows, selectedProduct])

  const pieGradient = useMemo(() => {
    if (pieData.length === 0) {
      return 'conic-gradient(var(--tp-lines-30) 0% 100%)'
    }
    let current = 0
    const segments = pieData.map((slice, index) => {
      const start = current
      const end = current + slice.value
      current = end
      return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}% ${end}%`
    })
    return `conic-gradient(${segments.join(', ')})`
  }, [pieData])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <span className="text-sm font-medium">País</span>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los países" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Servicio</span>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los servicios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribución por notaría</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <div
              className="h-40 w-40 rounded-full border border-[var(--tp-lines-30)]"
              style={{ background: pieGradient }}
            />
            <div className="space-y-2">
              {pieData.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Selecciona un servicio para ver la distribución.
                </div>
              ) : (
                pieData.map((slice, index) => (
                  <div key={slice.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{slice.name}</span>
                    <Badge variant="outline">{slice.value.toFixed(1)}%</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por notaría y servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notaría</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Proporción</TableHead>
                <TableHead>Docs 30 días</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay datos para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={`${row.notaryId}-${row.productId}`}>
                    <TableCell className="font-medium">{row.notaryName}</TableCell>
                    <TableCell>{row.countryCode}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>{row.weight}</TableCell>
                    <TableCell>{row.proportion.toFixed(1)}%</TableCell>
                    <TableCell>{row.assignedCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
