# Listar Modelos de Claude/Anthropic

Este directorio contiene scripts para consultar los modelos disponibles en la API de Anthropic.

## 🔑 Configuración Inicial

Primero, configura tu API key de Anthropic:

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**Windows CMD:**
```cmd
set ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

## 📝 Métodos de Uso

### 1. PowerShell (Recomendado para Windows)

```powershell
.\scripts\list-claude-models.ps1
```

### 2. TypeScript/Deno

```bash
deno run --allow-net --allow-env scripts/list-claude-models.ts
```

O con Node.js (si tienes tsx instalado):
```bash
npx tsx scripts/list-claude-models.ts
```

### 3. Bash (Linux/Mac)

```bash
bash scripts/list-claude-models.sh
```

### 4. cURL Directo (Más Simple)

**Windows PowerShell:**
```powershell
$headers = @{
    "x-api-key" = $env:ANTHROPIC_API_KEY
    "anthropic-version" = "2023-06-01"
}
Invoke-RestMethod -Uri "https://api.anthropic.com/v1/models" -Method Get -Headers $headers | ConvertTo-Json -Depth 10
```

**Linux/Mac:**
```bash
curl -X GET "https://api.anthropic.com/v1/models" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" | jq
```

**Con parámetros opcionales:**
```bash
# Limitar a 10 modelos
curl -X GET "https://api.anthropic.com/v1/models?limit=10" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"

# Obtener modelos después de un ID específico
curl -X GET "https://api.anthropic.com/v1/models?after_id=model-id-here" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

## 📋 Respuesta Esperada

La API devuelve un objeto JSON con esta estructura:

```json
{
  "data": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "created_at": "2024-10-22T00:00:00Z",
      "display_name": "Claude 3.5 Sonnet",
      "type": "model"
    }
  ],
  "first_id": "claude-3-5-sonnet-20241022",
  "has_more": false,
  "last_id": "claude-3-5-sonnet-20241022"
}
```

## 🔗 Referencia de la API

- **Endpoint**: `GET https://api.anthropic.com/v1/models`
- **Documentación**: https://docs.anthropic.com/claude/reference/models_list

### Parámetros Opcionales

- `after_id` (string): Obtener modelos después de este ID
- `before_id` (string): Obtener modelos antes de este ID  
- `limit` (number): Número máximo de modelos a devolver

### Headers Requeridos

- `x-api-key`: Tu API key de Anthropic
- `anthropic-version`: Versión de la API (ej: "2023-06-01")


