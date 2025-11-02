# 🔄 Sincronización de Reseñas de Google

Este documento te guía para sincronizar las reseñas de Google Places API con tu base de datos.

## ✅ Pre-requisitos

Asegúrate de tener configuradas estas variables en `.env.local`:

```bash
GOOGLE_PLACES_API_KEY=tu_api_key
GOOGLE_PLACE_ID=tu_place_id
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 🚀 Métodos de Sincronización

### Opción 1: Desde el Navegador (Más Fácil)

1. Asegúrate de que el servidor esté corriendo:
   ```bash
   npm run dev
   ```

2. Abre tu navegador e ingresa a una de estas URLs:

   **Primera sincronización (forzada):**
   ```
   http://localhost:3001/api/reviews/sync?force=true
   ```

   **Sincronizaciones posteriores (solo si han pasado >24h):**
   ```
   http://localhost:3001/api/reviews/sync
   ```

3. Verás una respuesta JSON con el resultado de la sincronización.

### Opción 2: Con Script Node.js

Ejecuta el script desde la carpeta `marketing`:

```bash
# Sincronización normal (respeta el límite de 24h)
node scripts/sync-google-reviews.js

# Sincronización forzada
node scripts/sync-google-reviews.js --force
```

### Opción 3: Con cURL (PowerShell)

```powershell
# Sincronización forzada
Invoke-WebRequest -Uri "http://localhost:3001/api/reviews/sync?force=true" -Method POST | Select-Object -Expand Content | ConvertFrom-Json
```

### Opción 4: Con Fetch en Console del Navegador

Abre la consola del navegador (F12) en cualquier página de tu app y ejecuta:

```javascript
fetch('/api/reviews/sync?force=true', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

## 📊 Ejemplo de Respuesta Exitosa

```json
{
  "success": true,
  "message": "Sync completed successfully. 5 new reviews added.",
  "stats": {
    "reviews_fetched": 5,
    "reviews_new": 5,
    "reviews_updated": 0,
    "reviews_skipped": 0,
    "duration_seconds": 2
  },
  "place_name": "TuPatrimonio",
  "google_rating": 4.9,
  "google_total_reviews": 2847
}
```

## 🔍 Verificar las Reseñas

Después de sincronizar, verifica que las reseñas se guardaron correctamente:

### Desde el Navegador:
```
http://localhost:3001/api/reviews?limit=10
```

### Respuesta esperada:
```json
{
  "success": true,
  "count": 5,
  "reviews": [
    {
      "id": "...",
      "author_name": "María González",
      "rating": 5,
      "text": "Excelente servicio...",
      ...
    }
  ],
  "stats": {
    "total_reviews": 5,
    "average_rating": 4.9,
    "five_star": 5,
    ...
  }
}
```

## ⚙️ Configurar Sincronización Automática

Para sincronizar automáticamente cada 24 horas, puedes:

### 1. Cron Job de Vercel (Recomendado para producción)

Crea un archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/reviews/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Esto ejecutará la sincronización todos los días a las 2 AM.

### 2. GitHub Actions (Alternativa)

Crea `.github/workflows/sync-reviews.yml`:

```yaml
name: Sync Google Reviews

on:
  schedule:
    - cron: '0 2 * * *'  # Diario a las 2 AM UTC
  workflow_dispatch:  # Manual

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST https://tupatrimonio.app/api/reviews/sync
```

## 🐛 Troubleshooting

### Error: "Missing required environment variables"
- Verifica que todas las variables de entorno estén configuradas
- Reinicia el servidor después de agregar variables

### Error: "Google API error"
- Verifica que tu API Key sea válida
- Asegúrate de que Places API esté habilitada en Google Cloud Console
- Verifica que el Place ID sea correcto

### Error: "Supabase configuration missing"
- Verifica las credenciales de Supabase
- Asegúrate de usar el Service Role Key, no la Anon Key

### No se muestran reseñas en el componente
1. Verifica que la sincronización fue exitosa
2. Verifica el endpoint `/api/reviews` directamente
3. Revisa la consola del navegador por errores
4. Verifica que las RLS policies permitan lectura pública

## 📝 Notas

- La API de Google normalmente retorna solo las 5 reseñas más recientes
- El sistema almacena todas las reseñas en tu base de datos
- La sincronización respeta un límite de 24 horas para no hacer llamadas innecesarias
- Usa `?force=true` para forzar la sincronización sin importar el tiempo transcurrido

