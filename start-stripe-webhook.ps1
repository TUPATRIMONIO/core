# Script para iniciar Stripe CLI Webhook Listener
# Uso: .\start-stripe-webhook.ps1

$stripeExe = Get-ChildItem -Path "$env:TEMP\stripe-cli" -Recurse -Filter "stripe.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName

if (-not $stripeExe) {
    Write-Host "❌ Stripe CLI no encontrado. Por favor, ejecuta primero la instalación." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Iniciando Stripe Webhook Listener..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Reenviando eventos a: http://localhost:3000/api/stripe/webhook" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   1. Busca la línea que dice 'Your webhook signing secret is whsec_...'" -ForegroundColor Yellow
Write-Host "   2. Copia ese secret (whsec_...)" -ForegroundColor Yellow
Write-Host "   3. Agrégalo a tu .env.local como: STRIPE_WEBHOOK_SECRET=whsec_..." -ForegroundColor Yellow
Write-Host "   4. Reinicia tu servidor de desarrollo para que cargue la nueva variable" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Para detener el listener, presiona Ctrl+C" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

& $stripeExe listen --forward-to localhost:3000/api/stripe/webhook

