'use client'

import { User, MapPin, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Signer {
  email: string
  full_name: string
  rut: string | null
  signing_order: number
}

interface OrderDetailsCollapsibleProps {
  productData: any
  productType: string
  signers: Signer[]
  signingDocument: {
    title: string | null
    send_to_signers_on_complete: boolean
  } | null
  billingData: any
  currency: string
}

export function OrderDetailsCollapsible({
  productData,
  productType,
  signers,
  signingDocument,
  billingData,
  currency,
}: OrderDetailsCollapsibleProps) {
  // Solo mostrar si es un pedido de firma electrónica
  if (productType !== 'electronic_signature' && !signingDocument) {
    return null
  }

  const signatureProduct = productData.signature_product
  const notaryProduct = productData.notary_product

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'boleta_electronica':
        return 'Boleta'
      case 'factura_electronica':
        return 'Factura'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Detalles del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
          {/* Producto de Firma */}
          {signatureProduct && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Firma Electrónica Avanzada
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>{signatureProduct.name}</span>
                  <span className="font-semibold">{formatMoney(signatureProduct.subtotal)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Cant.: {signatureProduct.quantity}, Precio: {formatMoney(signatureProduct.unit_price)}
                </div>
              </div>
            </div>
          )}

          {/* Servicio Notarial */}
          {notaryProduct && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Servicio Notarial
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>{notaryProduct.name}</span>
                    <span className="font-semibold">{formatMoney(notaryProduct.subtotal)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cant.: {notaryProduct.quantity}, Precio: {formatMoney(notaryProduct.unit_price)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Información adicional del producto */}
          {productData.document_id && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Documento
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">Identificador Interno:</div>
                  <div className="font-semibold">{productData.document_id.slice(0, 8)}</div>
                </div>
                {signingDocument?.title && (
                  <div className="text-sm mt-1">
                    <div className="text-muted-foreground">Título:</div>
                    <div className="font-semibold">{signingDocument.title}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Cantidad de firmantes */}
          {productData.signers_count !== undefined && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Cantidad de firmantes
                </div>
                <div className="text-sm font-semibold">{productData.signers_count}</div>
              </div>
            </>
          )}

          {/* Lista de Firmantes */}
          {signers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Firmantes
                </div>
                <div className="space-y-2">
                  {signers.map((signer, index) => (
                    <div key={`${signer.email}-${index}`} className="text-sm">
                      <div className="font-semibold">
                        Firmante {signer.signing_order + 1}:
                      </div>
                      <div className="text-muted-foreground ml-2">
                        {signer.email}
                        {signer.rut && `, ${signer.rut}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Configuración */}
          {signingDocument && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Configuración
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Enviar documento finalizado a firmantes:</span>
                    <span className="font-semibold">
                      {signingDocument.send_to_signers_on_complete ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Datos de Facturación */}
          {billingData && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Dirección de facturación
                </div>
                <div className="text-sm space-y-1">
                  {billingData.name && (
                    <div className="flex items-start gap-2">
                      <User className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                      <span className="font-semibold">{billingData.name}</span>
                    </div>
                  )}
                  {billingData.tax_id && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground w-20 shrink-0">Rut:</span>
                      <span>{billingData.tax_id}</span>
                    </div>
                  )}
                  {billingData.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                      <span>{billingData.email}</span>
                    </div>
                  )}
                  {billingData.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                      <span>{billingData.phone}</span>
                    </div>
                  )}
                  {(billingData.address || billingData.city || billingData.state) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex flex-col">
                        {billingData.address && <span>{billingData.address}</span>}
                        {(billingData.city || billingData.state) && (
                          <span className="text-muted-foreground">
                            {[billingData.city, billingData.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {billingData.document_type && (
                    <div className="flex items-start gap-2 pt-1">
                      <span className="text-muted-foreground">Tipo DTE:</span>
                      <span className="font-semibold">{getDocumentTypeLabel(billingData.document_type)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
      </CardContent>
    </Card>
  )
}

