# Script PowerShell para listar modelos de Claude/Anthropic
# Uso: .\scripts\list-claude-models.ps1

$apiKey = $env:ANTHROPIC_API_KEY

if (-not $apiKey) {
    Write-Host "❌ Error: ANTHROPIC_API_KEY no está configurada" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Configura la variable de entorno:" -ForegroundColor Yellow
    Write-Host '   $env:ANTHROPIC_API_KEY="sk-ant-..."' -ForegroundColor Cyan
    exit 1
}

Write-Host "🔍 Consultando modelos disponibles de Claude..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "x-api-key" = $apiKey
    "anthropic-version" = "2023-06-01"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/models" -Method Get -Headers $headers
    
    Write-Host "✅ Se encontraron $($response.data.Count) modelos" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Modelos disponibles:" -ForegroundColor Yellow
    Write-Host ""
    
    $index = 1
    foreach ($model in $response.data) {
        Write-Host "$index. $($model.display_name)" -ForegroundColor White
        Write-Host "   ID: $($model.id)" -ForegroundColor Gray
        Write-Host "   Tipo: $($model.type)" -ForegroundColor Gray
        $createdDate = [DateTime]::Parse($model.created_at)
        Write-Host "   Creado: $($createdDate.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
        Write-Host ""
        $index++
    }
    
    if ($response.has_more) {
        Write-Host "⚠️  Hay más modelos disponibles (has_more: true)" -ForegroundColor Yellow
        Write-Host "   Usa after_id: `"$($response.last_id)`" para obtener más" -ForegroundColor Gray
    }
    
    Write-Host "📊 Resumen:" -ForegroundColor Yellow
    Write-Host "   Total mostrados: $($response.data.Count)" -ForegroundColor White
    Write-Host "   Primer ID: $($response.first_id)" -ForegroundColor White
    Write-Host "   Último ID: $($response.last_id)" -ForegroundColor White
    Write-Host "   Hay más: $(if ($response.has_more) { 'Sí' } else { 'No' })" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error al consultar modelos:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}


