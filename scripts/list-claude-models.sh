#!/bin/bash
# Script bash para listar modelos de Claude/Anthropic
# Uso: bash scripts/list-claude-models.sh

API_KEY="${ANTHROPIC_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY no está configurada"
    echo ""
    echo "💡 Configura la variable de entorno:"
    echo "   export ANTHROPIC_API_KEY=sk-ant-..."
    exit 1
fi

echo "🔍 Consultando modelos disponibles de Claude..."
echo ""

response=$(curl -s -X GET "https://api.anthropic.com/v1/models" \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01")

if [ $? -ne 0 ]; then
    echo "❌ Error al realizar la solicitud"
    exit 1
fi

# Usar jq si está disponible, sino mostrar JSON crudo
if command -v jq &> /dev/null; then
    count=$(echo "$response" | jq '.data | length')
    echo "✅ Se encontraron $count modelos"
    echo ""
    echo "📋 Modelos disponibles:"
    echo ""
    
    echo "$response" | jq -r '.data[] | "\(.display_name // .id)\n   ID: \(.id)\n   Tipo: \(.type)\n   Creado: \(.created_at)\n"'
    
    has_more=$(echo "$response" | jq -r '.has_more')
    if [ "$has_more" = "true" ]; then
        last_id=$(echo "$response" | jq -r '.last_id')
        echo "⚠️  Hay más modelos disponibles (has_more: true)"
        echo "   Usa after_id: \"$last_id\" para obtener más"
    fi
    
    echo ""
    echo "📊 Resumen:"
    echo "$response" | jq -r '"   Total mostrados: \(.data | length)\n   Primer ID: \(.first_id)\n   Último ID: \(.last_id)\n   Hay más: \(.has_more)"'
else
    echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
fi
