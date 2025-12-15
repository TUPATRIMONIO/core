export interface VariableContext {
    document?: any;
    country_code?: string;
    country_context?: any;
    organization?: any;
    current_date?: string;
    timezone?: string;
}

export function formatDate(date: Date, format: string): string {
    // Implementación simplificada
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return format
        .replace("YYYY", year.toString())
        .replace("MM", month)
        .replace("DD", day);
}

export function getVariableValue(path: string, context: any): any {
    return path.split(".").reduce((obj, key) => obj?.[key], context);
}

export function processPromptVariables(
    template: string,
    context: VariableContext,
): string {
    let processed = template;

    // 1. Variables de fecha
    const now = new Date();
    const tzDate = new Date(
        now.toLocaleString("en-US", {
            timeZone: context.timezone || "America/Santiago",
        }),
    );

    processed = processed
        .replace(/\{\{current_date\}\}/g, formatDate(tzDate, "DD/MM/YYYY"))
        .replace(/\{\{current_datetime\}\}/g, tzDate.toISOString())
        .replace(/\{\{current_year\}\}/g, tzDate.getFullYear().toString());

    // 2. Variables de documento
    if (context.document) {
        processed = processed
            .replace(/\{\{document_id\}\}/g, context.document.id || "")
            .replace(/\{\{document_name\}\}/g, context.document.name || "")
            .replace(
                /\{\{page_count\}\}/g,
                context.document.page_count?.toString() || "0",
            )
            .replace(
                /\{\{has_blank_pages\}\}/g,
                context.document.has_blank_pages?.toString() || "false",
            );
    }

    // 3. Variables de país
    processed = processed
        .replace(/\{\{country_code\}\}/g, context.country_code || "CL")
        .replace(
            /\{\{country_context\}\}/g,
            typeof context.country_context === "string"
                ? context.country_context
                : JSON.stringify(context.country_context || {}),
        );

    // 4. Variables condicionales {{if(...)}}
    const ifRegex = /\{\{if\((.*?);(.*?);(.*?)\)\}\}/g;
    processed = processed.replace(
        ifRegex,
        (match, condition, trueVal, falseVal) => {
            return evaluateCondition(condition.trim(), context)
                ? trueVal.trim()
                : falseVal.trim();
        },
    );

    return processed;
}

function evaluateCondition(
    condition: string,
    context: VariableContext,
): boolean {
    // Evaluar condiciones simples: "has_blank_pages = true"
    const match = condition.match(/(.*?)\s*(=|!=|>|<)\s*(.*)/);
    if (!match) return Boolean(getVariableValue(condition, context));

    const [_, left, operator, right] = match;

    // Obtener valor de la variable
    const leftValue = String(getVariableValue(left.trim(), context));
    const rightValue = right?.trim().replace(/['"]/g, "");

    switch (operator?.trim()) {
        case "=":
            return leftValue == rightValue;
        case "!=":
            return leftValue != rightValue;
        case ">":
            return Number(leftValue) > Number(rightValue);
        case "<":
            return Number(leftValue) < Number(rightValue);
        default:
            return Boolean(leftValue);
    }
}
