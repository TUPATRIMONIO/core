import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicSigningClient } from '@/components/signing/PublicSigningClient'
import { Metadata } from 'next'

interface PageProps {
  params: {
    token: string
  }
}

export const metadata: Metadata = {
  title: 'Firmar Documento - TuPatrimonio',
  description: 'Portal de firma electrónica segura',
}

export default async function PublicSigningPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { token } = resolvedParams;

  const supabase = await createClient()

  // 1. Validar token y obtener datos del documento usando la RPC segura
  // Esta RPC verifica el token y devuelve datos limitados del documento y del firmante
  const { data: signingData, error } = await supabase.rpc('get_document_for_signing', {
    p_token: token
  })

  if (error || !signingData) {
    console.error('Error fetching document for signing:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido o expirado</h1>
          <p className="text-gray-600 mb-6">
            El enlace para firmar este documento no es válido, ha expirado o el documento ya ha sido completado.
          </p>
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta al remitente del documento.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PublicSigningClient 
      signingData={signingData} 
      token={token}
    />
  )
}
