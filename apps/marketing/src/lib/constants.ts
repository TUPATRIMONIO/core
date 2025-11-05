/**
 * Constantes centralizadas de TuPatrimonio
 */

/**
 * Cantidad de usuarios de la plataforma
 * Actualizar este valor cuando crezca el número de usuarios
 */
export const USERS_COUNT = {
  raw: 160000,
  short: "+160k",
  shortUpper: "+160K",
  full: "+160.000",
  text: "más de 160.000 usuarios",
  textShort: "+160k usuarios"
} as const;

export type UsersCountFormat = keyof typeof USERS_COUNT;

