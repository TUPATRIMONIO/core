/**
 * Motor de Templates - Handlebars
 * 
 * Procesa templates de email con variables dinámicas
 * Variables disponibles: {{user.name}}, {{contact.email}}, {{organization.name}}, etc.
 */

import Handlebars from 'handlebars';

// Registrar helpers personalizados de Handlebars
Handlebars.registerHelper('uppercase', (str: string) => {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', (str: string) => {
  return str ? str.toLowerCase() : '';
});

Handlebars.registerHelper('capitalize', (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
});

Handlebars.registerHelper('formatDate', (date: string | Date, format?: string) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'short') {
    return d.toLocaleDateString('es-CL');
  }
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'CLP') => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
});

/**
 * Variables disponibles por defecto en los templates
 */
export interface TemplateVariables {
  // Usuario actual
  user?: {
    name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  
  // Contacto (para emails personalizados)
  contact?: {
    name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    phone?: string;
  };
  
  // Organización
  organization?: {
    name?: string;
    slug?: string;
  };
  
  // Variables personalizadas
  [key: string]: any;
}

/**
 * Compila y renderiza un template con variables
 * 
 * @param template - Template HTML/texto con sintaxis Handlebars
 * @param variables - Variables para reemplazar en el template
 * @returns Template renderizado
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(variables);
  } catch (error: any) {
    throw new Error(`Error al renderizar template: ${error.message}`);
  }
}

/**
 * Valida que un template tenga sintaxis válida de Handlebars
 * 
 * @param template - Template a validar
 * @returns true si es válido, false en caso contrario
 */
export function validateTemplate(template: string): {
  valid: boolean;
  error?: string;
} {
  try {
    Handlebars.compile(template);
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Extrae las variables usadas en un template
 * 
 * @param template - Template HTML/texto
 * @returns Array de nombres de variables encontradas
 */
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const varName = match[1].trim();
    // Limpiar helpers y espacios
    const cleanVarName = varName
      .replace(/\s+/g, ' ')
      .split(' ')[0] // Solo el nombre de la variable, no helpers
      .replace(/^#/, '') // Remover # de helpers
      .replace(/^\/\//, ''); // Remover // de comentarios

    if (cleanVarName && !cleanVarName.startsWith('if') && !cleanVarName.startsWith('each')) {
      variables.add(cleanVarName);
    }
  }

  return Array.from(variables);
}

/**
 * Genera un preview del template con datos de ejemplo
 * 
 * @param template - Template HTML/texto
 * @returns Template renderizado con datos de ejemplo
 */
export function previewTemplate(template: string): string {
  const exampleVariables: TemplateVariables = {
    user: {
      name: 'Juan Pérez',
      email: 'juan@ejemplo.com',
      first_name: 'Juan',
      last_name: 'Pérez',
    },
    contact: {
      name: 'María González',
      email: 'maria@ejemplo.com',
      first_name: 'María',
      last_name: 'González',
      company_name: 'Empresa Ejemplo',
      phone: '+56 9 1234 5678',
    },
    organization: {
      name: 'Mi Empresa',
      slug: 'mi-empresa',
    },
  };

  return renderTemplate(template, exampleVariables);
}

