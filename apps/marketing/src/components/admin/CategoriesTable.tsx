'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Category {
  id: string
  name: string
  slug: string
  color: string
  is_active: boolean
  sort_order: number
}

interface CategoriesTableProps {
  categories: Category[]
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500">No hay categorías todavía</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Orden</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">
                {category.name}
              </TableCell>
              <TableCell className="text-gray-600">
                {category.slug}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-gray-600">{category.color}</span>
                </div>
              </TableCell>
              <TableCell>
                {category.is_active ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Activa
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Inactiva
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-gray-600">
                {category.sort_order}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

