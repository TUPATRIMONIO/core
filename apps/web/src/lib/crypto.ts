/**
 * Librería de Encriptación
 * AES-256-GCM para encriptar credenciales sensibles (IMAP/SMTP passwords)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Deriva una clave de encriptación desde la ENCRYPTION_KEY
 */
function deriveKey(salt: Buffer): Buffer {
  const crypto = require('crypto');
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  
  return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encripta datos usando AES-256-GCM
 */
export function encrypt(text: string): string {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const key = deriveKey(salt);
    const iv = randomBytes(IV_LENGTH);
    
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Formato: salt:iv:encrypted:tag (todo en hex)
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      encrypted,
      tag.toString('hex')
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Descifra datos encriptados con AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltHex, ivHex, encrypted, tagHex] = parts;
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const key = deriveKey(salt);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encripta un objeto (útil para configs IMAP/SMTP)
 */
export function encryptObject(obj: any): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Descifra un objeto
 */
export function decryptObject<T = any>(encryptedText: string): T {
  return JSON.parse(decrypt(encryptedText));
}

/**
 * Hashea una contraseña (one-way, para verificación)
 */
export function hash(text: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(text).digest('hex');
}
