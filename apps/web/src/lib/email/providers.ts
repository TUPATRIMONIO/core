/**
 * Configuraciones de Proveedores de Email
 * Configuración predefinida para Gmail, Outlook, Yahoo, iCloud y otros
 */

export interface EmailProviderConfig {
  name: string;
  domains: string[];
  imap: {
    host: string;
    port: number;
    tls: boolean;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean; // true = implicit TLS (465), false = STARTTLS (587)
  };
  appPasswordUrl?: string;
  instructions?: string;
}

export const EMAIL_PROVIDERS: Record<string, EmailProviderConfig> = {
  gmail: {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    imap: {
      host: 'imap.gmail.com',
      port: 993,
      tls: true
    },
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false // STARTTLS
    },
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    instructions: 'Debes activar la verificación en 2 pasos y luego generar una contraseña de aplicación.'
  },
  
  outlook: {
    name: 'Outlook / Hotmail',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      tls: true
    },
    smtp: {
      host: 'smtp.office365.com',
      port: 587,
      secure: false
    },
    instructions: 'Usa tu contraseña normal de Outlook. Si tienes 2FA habilitado, genera una contraseña de aplicación.'
  },
  
  yahoo: {
    name: 'Yahoo Mail',
    domains: ['yahoo.com', 'ymail.com', 'rocketmail.com'],
    imap: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      tls: true
    },
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false
    },
    appPasswordUrl: 'https://login.yahoo.com/account/security',
    instructions: 'Debes generar una contraseña de aplicación desde la configuración de seguridad de Yahoo.'
  },
  
  icloud: {
    name: 'iCloud Mail',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    imap: {
      host: 'imap.mail.me.com',
      port: 993,
      tls: true
    },
    smtp: {
      host: 'smtp.mail.me.com',
      port: 587,
      secure: false
    },
    appPasswordUrl: 'https://appleid.apple.com/account/manage',
    instructions: 'Genera una contraseña específica de la app desde tu ID de Apple.'
  }
};

/**
 * Detecta el proveedor a partir del dominio del email
 */
export function detectProvider(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) return 'custom';
  
  for (const [key, provider] of Object.entries(EMAIL_PROVIDERS)) {
    if (provider.domains.includes(domain)) {
      return key;
    }
  }
  
  return 'custom';
}

/**
 * Obtiene la configuración de un proveedor
 */
export function getProviderConfig(provider: string): EmailProviderConfig | null {
  return EMAIL_PROVIDERS[provider] || null;
}

/**
 * Obtiene configuración basada en el email
 */
export function getConfigFromEmail(email: string): EmailProviderConfig | null {
  const provider = detectProvider(email);
  return getProviderConfig(provider);
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Configuración custom para dominios no reconocidos
 */
export function createCustomConfig(
  imapHost: string,
  imapPort: number,
  smtpHost: string,
  smtpPort: number
): EmailProviderConfig {
  return {
    name: 'Custom',
    domains: [],
    imap: {
      host: imapHost,
      port: imapPort,
      tls: true
    },
    smtp: {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465
    }
  };
}
