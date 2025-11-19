# 📁 Configuración de Supabase Storage para Adjuntos

## Resumen

Los adjuntos de emails se almacenan en **Supabase Storage** en un bucket privado con políticas RLS para seguridad multi-tenant.

---

## 🚀 Configuración (5 minutos)

### **PASO 1: Crear Bucket**

1. Abre **Supabase Studio**: `http://127.0.0.1:54323` (local) o tu dashboard de Supabase

2. Ve a **Storage** en el menú lateral

3. Click en **"Create bucket"** o **"New bucket"**

4. Configuración:
   ```
   Bucket name: email-attachments
   Public: NO (dejar sin marcar)
   File size limit: 26214400 (25 MB en bytes)
   Allowed MIME types: * (dejar vacío para permitir todos)
   ```

5. Click **"Create bucket"**

---

### **PASO 2: Configurar Políticas RLS**

En Supabase Studio, ve a **SQL Editor** y ejecuta:

```sql
-- ============================================================================
-- Políticas RLS para bucket email-attachments
-- ============================================================================

-- 1. Permitir subir archivos a usuarios de la organización
CREATE POLICY "Users can upload attachments for their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);

-- 2. Permitir ver archivos de la organización
CREATE POLICY "Users can view attachments from their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);

-- 3. Permitir eliminar archivos de la organización
CREATE POLICY "Users can delete their org attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);

-- 4. Permitir actualizar archivos de la organización
CREATE POLICY "Users can update their org attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);
```

---

### **PASO 3: Verificar Configuración**

Ejecuta este SQL para verificar que las políticas se crearon:

```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%attachments%';
```

Deberías ver 4 políticas (INSERT, SELECT, DELETE, UPDATE).

---

## 📂 Estructura de Archivos

Los archivos se organizan así:

```
email-attachments/
├── {organization_id}/
│   ├── temp-{timestamp}/          ← Adjuntos al componer
│   │   ├── 1699999999-archivo.pdf
│   │   └── 1699999999-imagen.jpg
│   ├── {email_id}/                ← Adjuntos de emails guardados
│   │   ├── documento.docx
│   │   └── factura.pdf
```

**Ventajas:**
- ✅ Separado por organización (multi-tenant)
- ✅ Fácil de limpiar emails antiguos
- ✅ No hay conflictos de nombres

---

## 🔒 Seguridad

### **Políticas RLS:**
- ✅ Solo usuarios autenticados pueden acceder
- ✅ Solo ven archivos de SU organización
- ✅ Multi-tenant completamente aislado
- ✅ No pueden acceder a archivos de otras orgs

### **Validaciones en el Frontend:**
- ✅ Máximo 25 MB por archivo
- ✅ Archivos ejecutables bloqueados (.exe, .bat, .sh, etc.)
- ✅ Validación de tipos MIME

### **Seguridad de Preview:**
- ✅ Imágenes: Solo tag `<img>`, no ejecuta código
- ✅ PDFs: iframe con sandbox `allow-same-origin` (bloquea scripts)
- ✅ URLs de Supabase con headers correctos

---

## 💰 Costos

**Supabase Storage:**
- **Gratis**: Primer 1 GB
- **Después**: $0.021 por GB/mes
- **Transferencia**: 100 GB/mes gratis

**Ejemplo:**
- 1,000 adjuntos de 100 KB = 100 MB
- **Costo**: $0/mes (dentro del plan gratuito)

**Escalabilidad:**
- 10,000 adjuntos = 1 GB = $0/mes
- 50,000 adjuntos = 5 GB = $0.10/mes
- 100,000 adjuntos = 10 GB = $0.21/mes

---

## 🧪 Testing

### **Prueba de Upload:**

1. Ve a un contacto en el CRM
2. Sección "Enviar Email"
3. Click en "Adjuntar Archivos"
4. Selecciona un archivo (PDF, imagen, etc.)
5. Verifica que aparece en la lista
6. Envía el email
7. Verifica que llegó con el adjunto

### **Prueba de Preview:**

1. Ve al inbox o abre un email recibido con adjuntos
2. Deberías ver:
   - Lista de adjuntos con nombre y tamaño
   - Imágenes mostradas inline
   - PDFs en viewer
   - Botón de descarga en todos

### **Verificar en Storage:**

1. Supabase Studio > Storage > email-attachments
2. Deberías ver carpetas por `organization_id`
3. Dentro, carpetas por `email_id`
4. Archivos guardados correctamente

---

## 🔄 Limpieza de Archivos

### **Al Eliminar un Email:**

Los archivos se eliminan automáticamente cuando borras un email (CASCADE en BD).

### **Limpieza Manual:**

Si necesitas liberar espacio:

```sql
-- Ver uso de storage por organización
SELECT 
  SPLIT_PART(name, '/', 1) as org_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_bytes
FROM storage.objects
WHERE bucket_id = 'email-attachments'
GROUP BY org_id;

-- Eliminar archivos antiguos (ejemplo: más de 1 año)
DELETE FROM storage.objects
WHERE bucket_id = 'email-attachments'
AND created_at < NOW() - INTERVAL '1 year';
```

---

## ⚙️ Configuración en Producción

### **Variables de Entorno:**

En Vercel/Netlify, asegúrate de tener:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### **Bucket en Supabase Cloud:**

Repetir los mismos pasos (Crear bucket + Políticas RLS) en tu proyecto de Supabase en la nube.

---

## 📊 Tipos de Archivo Soportados

| Categoría | Tipos | Preview |
|-----------|-------|---------|
| **Imágenes** | JPG, PNG, GIF, WebP, SVG | ✅ Inline |
| **PDFs** | PDF | ✅ Viewer |
| **Documentos** | DOC, DOCX, XLS, XLSX, PPT | ❌ Solo descarga |
| **Texto** | TXT, CSV, JSON | ❌ Solo descarga |
| **Otros** | ZIP, RAR, etc. | ❌ Solo descarga |

**Bloqueados:**
- ❌ Ejecutables (.exe, .bat, .sh, .cmd, .com, .scr)

---

## 🎯 Próximos Pasos

1. ✅ Crear bucket `email-attachments`
2. ✅ Aplicar políticas RLS
3. ✅ Verificar que funciona
4. ✅ Probar adjuntar archivos
5. ✅ Probar preview de imágenes y PDFs

---

**Fecha de implementación**: 14 Noviembre 2025  
**Estado**: ✅ Listo para usar

