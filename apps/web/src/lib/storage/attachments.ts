/**
 * Servicio de Almacenamiento de Adjuntos
 * Maneja upload/download de archivos en Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'email-attachments';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface AttachmentMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
}

/**
 * Sube un archivo adjunto
 */
export async function uploadAttachment(
  file: File,
  organizationId: string,
  emailId: string
): Promise<AttachmentMetadata> {
  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo es muy grande. Máximo ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
  }

  const supabase = createClient();
  
  // Generar path único
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${organizationId}/${emailId}/${timestamp}-${sanitizedName}`;

  // Subir archivo
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    url: urlData.publicUrl,
    storage_path: storagePath
  };
}

/**
 * Descarga adjunto de email recibido vía Gmail API
 */
export async function saveEmailAttachment(
  attachmentData: {
    filename: string;
    mimeType: string;
    data: string; // Base64
  },
  organizationId: string,
  emailId: string
): Promise<AttachmentMetadata> {
  const supabase = createClient();
  
  // Decodificar base64
  const buffer = Buffer.from(attachmentData.data, 'base64');
  const blob = new Blob([buffer], { type: attachmentData.mimeType });
  
  // Generar path
  const timestamp = Date.now();
  const sanitizedName = attachmentData.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${organizationId}/${emailId}/${timestamp}-${sanitizedName}`;

  // Subir a storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, blob, {
      contentType: attachmentData.mimeType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error saving attachment:', error);
    throw new Error(`Error al guardar adjunto: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    name: attachmentData.filename,
    size: buffer.length,
    type: attachmentData.mimeType,
    url: urlData.publicUrl,
    storage_path: storagePath
  };
}

/**
 * Elimina un adjunto del storage
 */
export async function deleteAttachment(storagePath: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error('Error deleting attachment:', error);
    throw new Error(`Error al eliminar adjunto: ${error.message}`);
  }
}

/**
 * Elimina todos los adjuntos de un email
 */
export async function deleteEmailAttachments(
  organizationId: string,
  emailId: string
): Promise<void> {
  const supabase = createClient();
  
  const prefix = `${organizationId}/${emailId}/`;
  
  // Listar archivos
  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(prefix);

  if (!files || files.length === 0) return;

  // Eliminar todos
  const paths = files.map(f => `${prefix}${f.name}`);
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths);

  if (error) {
    console.error('Error deleting email attachments:', error);
  }
}

/**
 * Obtiene URL firmada (temporal) para un archivo privado
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    throw new Error('Error al generar URL firmada');
  }

  return data.signedUrl;
}

/**
 * Valida tipo de archivo
 */
export function isAllowedFileType(file: File): boolean {
  // Por ahora permitimos todos, pero podrías agregar blacklist
  const blockedExtensions = ['.exe', '.bat', '.sh', '.cmd', '.com', '.scr'];
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  return !blockedExtensions.includes(extension);
}

/**
 * Formatea tamaño de archivo para mostrar
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

