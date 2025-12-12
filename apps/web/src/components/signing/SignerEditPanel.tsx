'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Trash2, Mail, User } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function normalizeRutToDb(input: string) {
  const clean = (input || '').replace(/\./g, '').replace(/\s/g, '').toUpperCase()
  if (!clean) return ''
  return clean.includes('-') ? clean : `${clean.slice(0, -1)}-${clean.slice(-1)}`
}

function validateChileanRUT(rut: string): boolean {
  if (!rut) return false
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '')
  if (cleanRut.length < 8 || cleanRut.length > 9) return false
  const rutRegex = /^[0-9]+[0-9kK]$/
  return rutRegex.test(cleanRut)
}

const baseSchema = z.object({
  first_name: z.string().min(2, 'Nombres requerido'),
  last_name: z.string().min(2, 'Apellidos requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  identifier_type: z.enum(['rut', 'passport', 'dni', 'other']).default('rut'),
  identifier_value: z.string().min(3, 'Identificador requerido'),
})

interface SignerEditPanelProps {
  document: any
  signers: any[]
  onUpdate: () => void
}

export function SignerEditPanel({ document, signers, onUpdate }: SignerEditPanelProps) {
  const [isAdding, setIsAdding] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const signatureIdentifierType =
    (document?.metadata as any)?.signature_product?.identifier_type ||
    (document?.metadata as any)?.signature_identifier_type ||
    null

  const requiresRutOnly = signatureIdentifierType === 'rut_only'

  const signerSchema = useMemo(() => {
    if (!requiresRutOnly) return baseSchema
    return baseSchema.superRefine((val, ctx) => {
      if (!validateChileanRUT(val.identifier_value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['identifier_value'],
          message: 'RUT inválido. Ej: 12345678-9',
        })
      }
    })
  }, [requiresRutOnly])

  const form = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(signerSchema as any),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      identifier_type: 'rut',
      identifier_value: '',
    },
  })

  // Editabilidad: permitir mientras no esté finalizado
  const isEditable = !['signed', 'notarized', 'completed', 'cancelled', 'rejected'].includes(document.status)

  const onSubmit = async (values: z.infer<typeof baseSchema>) => {
    try {
      const identifierType = requiresRutOnly ? 'rut' : values.identifier_type
      const isRut = identifierType === 'rut'
      const rutDb = isRut ? normalizeRutToDb(values.identifier_value) : null

      if (requiresRutOnly && !validateChileanRUT(values.identifier_value)) {
        throw new Error('RUT inválido')
      }

      const fullName = `${values.first_name.trim()} ${values.last_name.trim()}`.trim()

      const { data, error } = await supabase.rpc('add_document_signer', {
        p_document_id: document.id,
        p_email: values.email,
        p_full_name: fullName,
        p_rut: rutDb,
        p_phone: values.phone?.trim() || null,
        p_is_foreigner: !isRut,
        p_signing_order: signers.length + 1,
        p_user_id: null,
      })

      if (error) throw new Error(error.message)
      const signerId = data?.id
      if (!signerId) throw new Error('No se pudo crear el firmante')

      // Guardar first/last + identificador en columnas/metadata
      const { error: updateError } = await supabase
        .from('signing_signers')
        .update({
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          metadata: {
            identifier_type: identifierType,
            identifier_value: isRut ? normalizeRutToDb(values.identifier_value) : values.identifier_value.trim(),
          },
        })
        .eq('id', signerId)

      if (updateError) throw new Error(updateError.message)

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
        p_reason: 'Removido por usuario',
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
            Puedes ajustar firmantes mientras el documento no esté completado.
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombres</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+56 9 1234 5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="identifier_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select
                            value={requiresRutOnly ? 'rut' : field.value}
                            onValueChange={field.onChange}
                            disabled={requiresRutOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="rut">RUT</SelectItem>
                              <SelectItem value="passport">Pasaporte</SelectItem>
                              <SelectItem value="dni">DNI</SelectItem>
                              <SelectItem value="other">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="identifier_value"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>N° Identificador</FormLabel>
                          <FormControl>
                            <Input placeholder={requiresRutOnly ? '12345678-9' : 'Ej: AB1234567'} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                      Guardar
                    </Button>
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
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Identificador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay firmantes asignados aún.
                </TableCell>
              </TableRow>
            ) : (
              signers.map((signer) => (
                <TableRow key={signer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {(signer.first_name || signer.last_name)
                        ? `${signer.first_name || ''} ${signer.last_name || ''}`.trim()
                        : signer.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {signer.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {signer.rut || signer.metadata?.identifier_value || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={signer.status === 'signed' ? 'default' : 'secondary'}>
                      {signer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditable && signer.status !== 'signed' && (
                      <Button
                        size="sm"
                        variant="ghost"
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

