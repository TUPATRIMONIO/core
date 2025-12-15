import { useState, useEffect } from 'react'

/**
 * Hook para generar URLs firmadas de Supabase Storage via backend
 * @param bucket - Nombre del bucket de Storage (o lista de buckets para fallback)
 * @param path - Ruta del archivo en el bucket
 * @param expiresIn - Tiempo de expiración en segundos (default: 3600 = 1 hora)
 */
export function useSignedUrl(
  bucket: string | string[],
  path: string | null | undefined,
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [bucketUsed, setBucketUsed] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!path) {
      setSignedUrl(null)
      setBucketUsed(null)
      return
    }

    let cancelled = false

    const generateSignedUrl = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const buckets = Array.isArray(bucket) ? bucket : [bucket]

        // Llamar al endpoint backend que usa service_role
        const response = await fetch('/api/storage/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucket: buckets,
            path,
            expiresIn
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Error ${response.status}`)
        }

        const data = await response.json()

        if (cancelled) return

        if (data.signedUrl) {
          setSignedUrl(data.signedUrl)
          setBucketUsed(data.bucket || null)
        } else {
          throw new Error('No se recibió URL firmada')
        }

      } catch (err) {
        console.error('Error generating signed URL:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Error desconocido'))
          setSignedUrl(null)
          setBucketUsed(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    generateSignedUrl()
    return () => {
      cancelled = true
    }
  }, [bucket, path, expiresIn])

  return { signedUrl, bucketUsed, isLoading, error }
}
