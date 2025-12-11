'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Mail, User, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'

const signerSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Nombre requerido'),
  rut: z.string().optional(),
  is_foreigner: z.boolean().default(false),
})

interface SignerManagerProps {
  document: any
  signers: any[]
  onUpdate: () => void
}

export function SignerManager({ document, signers, onUpdate }: SignerManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const supabase = createClient()
  
  const form = useForm<z.infer<typeof signerSchema>>({
    resolver: zodResolver(signerSchema),
    defaultValues: {
      email: '',
      full_name: '',
      rut: '',
      is_foreigner: false,
    },
  })

  // Verificar si el documento es editable
  const isEditable = document.status === 'draft' || document.status === 'pending_review'

  const onSubmit = async (values: z.infer<typeof signerSchema>) => {
    try {
      const { data, error } = await supabase.rpc('add_document_signer', {
        p_document_id: document.id,
        p_email: values.email,
        p_full_name: values.full_name,
        p_rut: values.rut || null,
        p_is_foreigner: values.is_foreigner,
        p_signing_order: signers.length + 1 // Agregar al final
      })

      if (error) throw new Error(error.message)

      toast.success('Firmante agregado')
      setIsAdding(false)
      form.reset()
      onUpdate()

    } catch (error: any) {
      toast.error(error.message || 'Error al agregar firmante')
    }
  }

  const handleRemove = async (signerId: string) => {
    if (!confirm('¿Estás seguro de quitar a este firmante?')) return

    try {
      const { error } = await supabase.rpc('remove_document_signer', {
        p_signer_id: signerId,
        p_reason: 'Removido por usuario'
      })

      if (error) throw new Error(error.message)

      toast.success('Firmante removido')
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || 'Error al remover firmante')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Firmantes</CardTitle>
          <CardDescription>
            Gestiona quién debe firmar este documento y en qué orden.
          </CardDescription>
        </div>
        
        {isEditable && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Firmante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Firmante</DialogTitle>
                <DialogDescription>
                  Ingresa los datos de la persona que firmará el documento.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="juan@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RUT (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678-9" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                     <FormField
                      control={form.control}
                      name="is_foreigner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-end space-x-3 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Es extranjero
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Agregar</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay firmantes asignados aún.
                </TableCell>
              </TableRow>
            ) : (
              signers.map((signer, index) => (
                <TableRow key={signer.id}>
                  <TableCell>
                    {document.signing_order === 'sequential' && (
                      <Badge variant="outline" className="font-mono">
                        {index + 1}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {signer.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {signer.email}
                    </div>
                  </TableCell>
                  <TableCell>{signer.rut || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      signer.status === 'signed' ? 'default' : 
                      signer.status === 'pending' ? 'secondary' : 'outline'
                    }>
                      {signer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemove(signer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
