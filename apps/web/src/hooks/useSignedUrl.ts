import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook para generar URLs firmadas de Supabase Storage
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
        
        const supabase = createClient()
        const buckets = Array.isArray(bucket) ? bucket : [bucket]

        // Fallbacks comunes (para transición de buckets)
        const fallbackBuckets =
          Array.isArray(bucket)
            ? []
            : bucket === 'signing-documents'
              ? ['docs-originals', 'docs-signed', 'docs-notarized']
              : bucket === 'docs-originals'
                ? ['signing-documents']
                : []

        const candidates = [...buckets, ...fallbackBuckets].filter((b, idx, arr) => arr.indexOf(b) === idx)

        let lastErr: any = null
        for (const b of candidates) {
          const { data, error: urlError } = await supabase.storage.from(b).createSignedUrl(path, expiresIn)
          if (urlError || !data?.signedUrl) {
            lastErr = urlError || new Error('No se pudo generar la URL firmada')
            continue
          }

          if (cancelled) return
          setSignedUrl(data.signedUrl)
          setBucketUsed(b)
          return
        }

        throw lastErr || new Error('No se pudo generar la URL firmada')
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

