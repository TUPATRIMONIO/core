/**
 * Módulo de Encriptación - AES-256-GCM
 * 
 * Encriptación segura para credenciales sensibles (API keys, passwords, etc.)
 * Usa AES-256-GCM con PBKDF2 para derivación de clave
 * 
 * Compatible con el patrón usado en email_accounts (IMAP/SMTP)
 */

import crypto from 'crypto';

// Clave de encriptación desde variable de entorno
// En producción, debe ser una clave fuerte de 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Variable para rastrear si ya se mostró el warning
let encryptionKeyWarningShown = false;

// Función para mostrar warning solo cuando se use (runtime)
function checkEncryptionKey() {
  if (!process.env.ENCRYPTION_KEY && !encryptionKeyWarningShown && typeof window === 'undefined') {
    console.warn('⚠️  ENCRYPTION_KEY no configurada. Usando clave temporal (NO SEGURO PARA PRODUCCIÓN)');
    encryptionKeyWarningShown = true;
  }
}

// Derivar clave de 32 bytes desde ENCRYPTION_KEY usando PBKDF2
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encripta un texto usando AES-256-GCM
 * 
 * @param text - Texto a encriptar
 * @returns Objeto con texto encriptado, IV, salt y authTag (todo en base64)
 */
export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  salt: string;
  authTag: string;
} {
  // Verificar clave solo cuando se use la función
  checkEncryptionKey();
  
  // Generar salt único
  const salt = crypto.randomBytes(16);
  
  // Derivar clave desde password + salt
  const key = deriveKey(ENCRYPTION_KEY, salt);
  
  // Generar IV aleatorio
  const iv = crypto.randomBytes(16);
  
  // Crear cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encriptar
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Obtener auth tag (integridad)
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Desencripta un texto usando AES-256-GCM
 * 
 * @param encryptedData - Objeto con datos encriptados
 * @returns Texto desencriptado
 */
export function decrypt(encryptedData: {
  encrypted: string;
  iv: string;
  salt: string;
  authTag: string;
}): string {
  // Verificar clave solo cuando se use la función
  checkEncryptionKey();
  
  try {
    // Convertir de base64 a buffers
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    
    // Derivar clave desde password + salt
    const key = deriveKey(ENCRYPTION_KEY, salt);
    
    // Crear decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Desencriptar
    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Error al desencriptar: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Encripta y serializa a JSON string para guardar en BD
 * 
 * @param text - Texto a encriptar
 * @returns JSON string con datos encriptados
 */
export function encryptToJson(text: string): string {
  const encrypted = encrypt(text);
  return JSON.stringify(encrypted);
}

/**
 * Desencripta desde JSON string guardado en BD
 * 
 * @param jsonString - JSON string con datos encriptados
 * @returns Texto desencriptado
 */
export function decryptFromJson(jsonString: string): string {
  try {
    const encryptedData = JSON.parse(jsonString);
    return decrypt(encryptedData);
  } catch (error) {
    throw new Error('Error al parsear JSON encriptado: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

