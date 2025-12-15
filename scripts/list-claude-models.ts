/**
 * Script para listar los modelos disponibles de Claude/Anthropic
 * 
 * Uso:
 *   deno run --allow-net --allow-env scripts/list-claude-models.ts
 *   O con Node.js:
 *   npx tsx scripts/list-claude-models.ts
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/models";

interface ModelInfo {
  id: string;
  created_at: string;
  display_name: string;
  type: string;
}

interface ModelsResponse {
  data: ModelInfo[];
  first_id: string;
  has_more: boolean;
  last_id: string;
}

async function listModels(
  apiKey: string,
  options?: {
    after_id?: string;
    before_id?: string;
    limit?: number;
  }
): Promise<ModelsResponse> {
  const url = new URL(ANTHROPIC_API_URL);
  
  if (options?.after_id) {
    url.searchParams.append("after_id", options.after_id);
  }
  if (options?.before_id) {
    url.searchParams.append("before_id", options.before_id);
  }
  if (options?.limit) {
    url.searchParams.append("limit", options.limit.toString());
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

async function main() {
  // Obtener API key de variable de entorno
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || 
                 (typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : null);

  if (!apiKey) {
    console.error("❌ Error: ANTHROPIC_API_KEY no está configurada");
    console.log("\n💡 Configura la variable de entorno:");
    console.log("   export ANTHROPIC_API_KEY=sk-ant-...");
    console.log("   O en Windows PowerShell:");
    console.log("   $env:ANTHROPIC_API_KEY='sk-ant-...'");
    Deno.exit(1);
  }

  try {
    console.log("🔍 Consultando modelos disponibles de Claude...\n");
    
    const result = await listModels(apiKey, { limit: 50 });
    
    console.log(`✅ Se encontraron ${result.data.length} modelos\n`);
    console.log("📋 Modelos disponibles:\n");
    
    result.data.forEach((model, index) => {
      console.log(`${index + 1}. ${model.display_name || model.id}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Tipo: ${model.type}`);
      console.log(`   Creado: ${new Date(model.created_at).toLocaleDateString()}`);
      console.log("");
    });

    if (result.has_more) {
      console.log(`\n⚠️  Hay más modelos disponibles (has_more: true)`);
      console.log(`   Usa after_id: "${result.last_id}" para obtener más`);
    }

    console.log("\n📊 Resumen:");
    console.log(`   Total mostrados: ${result.data.length}`);
    console.log(`   Primer ID: ${result.first_id}`);
    console.log(`   Último ID: ${result.last_id}`);
    console.log(`   Hay más: ${result.has_more ? "Sí" : "No"}`);

  } catch (error) {
    console.error("❌ Error al consultar modelos:", error);
    Deno.exit(1);
  }
}

// Ejecutar solo si es el script principal
if (import.meta.main || require.main === module) {
  main();
}

export { listModels };
