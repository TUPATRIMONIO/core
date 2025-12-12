/**
 * Utilidades para validación y formateo de RUT chileno
 */

/**
 * Limpia un RUT removiendo puntos, guiones y espacios
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase()
}

/**
 * Calcula el dígito verificador de un RUT
 */
export function calculateDv(rutBody: string): string {
  const cleanBody = rutBody.replace(/\D/g, '')
  if (!cleanBody) return ''

  let sum = 0
  let multiplier = 2

  for (let i = cleanBody.length - 1; i >= 0; i--) {
    sum += parseInt(cleanBody[i], 10) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const dv = 11 - remainder

  if (dv === 11) return '0'
  if (dv === 10) return 'K'
  return dv.toString()
}

/**
 * Valida si un RUT es válido (formato y dígito verificador)
 */
export function isValidRut(rut: string): boolean {
  const cleaned = cleanRut(rut)
  if (cleaned.length < 2) return false

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  // Validar que el cuerpo solo tenga números
  if (!/^\d+$/.test(body)) return false

  // Validar que el DV sea válido (número o K)
  if (!/^[0-9K]$/.test(dv)) return false

  // Validar dígito verificador
  return calculateDv(body) === dv
}

/**
 * Obtiene información sobre el error del RUT
 */
export function getRutError(rut: string): string | null {
  const cleaned = cleanRut(rut)
  
  if (!cleaned) return null
  if (cleaned.length < 2) return 'RUT muy corto'

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  if (!/^\d+$/.test(body)) return 'El RUT solo debe contener números'
  if (!/^[0-9K]$/.test(dv)) return 'Dígito verificador inválido'

  const expectedDv = calculateDv(body)
  if (expectedDv !== dv) {
    return `Dígito verificador incorrecto (debería ser ${expectedDv})`
  }

  return null
}

/**
 * Formatea un RUT con puntos y guión (ej: 12.345.678-9)
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut)
  if (!cleaned) return ''

  // Separar cuerpo y dígito verificador
  if (cleaned.length === 1) return cleaned

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  // Formatear cuerpo con puntos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedBody}-${dv}`
}

/**
 * Formatea el RUT mientras el usuario escribe
 * Mantiene solo números y K, y aplica formato automáticamente
 */
export function formatRutOnInput(value: string): string {
  // Limpiar todo excepto números y K
  let cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase()

  // Limitar a 9 caracteres (8 números + 1 dv)
  if (cleaned.length > 9) {
    cleaned = cleaned.slice(0, 9)
  }

  // Si tiene menos de 2 caracteres, no formatear aún
  if (cleaned.length < 2) return cleaned

  // Separar cuerpo y dígito verificador
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  // Formatear cuerpo con puntos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedBody}-${dv}`
}

/**
 * Extrae el RUT sin formato (solo números y DV)
 */
export function extractRutValue(formattedRut: string): string {
  return cleanRut(formattedRut)
}

