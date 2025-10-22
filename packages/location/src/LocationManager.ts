import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, normalizeCountryCode } from './CountryConfig';

/**
 * Tipo de detección de ubicación
 */
export type LocationSource = 'manual' | 'netlify' | 'browser' | 'fallback';

/**
 * Preferencia del usuario almacenada
 */
interface LocationPreference {
  country: string;
  source: LocationSource;
  timestamp: number;
}

/**
 * Resultado de detección de ubicación
 */
export interface LocationResult {
  country: string;
  source: LocationSource;
  confidence: 'high' | 'medium' | 'low';
  canChange: boolean;
}

/**
 * Manager principal para detección y gestión de ubicación
 */
export class LocationManager {
  private static readonly PREFERENCE_KEY = 'tp_country_preference';
  private static readonly AUTO_CACHE_KEY = 'tp_auto_detected_country';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Obtiene el país actual del usuario
   */
  static async getCurrentCountry(): Promise<LocationResult> {
    try {
      // 1. Verificar preferencia manual del usuario
      const userPreference = this.getUserPreference();
      if (userPreference && userPreference.source === 'manual') {
        return {
          country: userPreference.country,
          source: 'manual',
          confidence: 'high',
          canChange: true
        };
      }

      // 2. Intentar detección automática
      const autoDetected = await this.detectCountryAutomatically();
      if (autoDetected) {
        return {
          country: autoDetected.country,
          source: autoDetected.source,
          confidence: autoDetected.source === 'netlify' ? 'high' : 'medium',
          canChange: true
        };
      }

      // 3. Fallback por defecto
      return {
        country: DEFAULT_COUNTRY,
        source: 'fallback',
        confidence: 'low',
        canChange: true
      };

    } catch (error) {
      console.error('Error getting current country:', error);
      return {
        country: DEFAULT_COUNTRY,
        source: 'fallback',
        confidence: 'low',
        canChange: true
      };
    }
  }

  /**
   * Usuario establece manualmente su país de preferencia
   */
  static setUserPreference(country: string): void {
    const normalizedCountry = normalizeCountryCode(country);
    if (!normalizedCountry) {
      console.warn('País no soportado:', country);
      return;
    }

    const preference: LocationPreference = {
      country: normalizedCountry,
      source: 'manual',
      timestamp: Date.now()
    };

    this.saveToStorage(this.PREFERENCE_KEY, preference);
    this.dispatchCountryChangeEvent(normalizedCountry, 'manual');
  }

  /**
   * Resetea a detección automática
   */
  static resetToAutoDetection(): void {
    this.removeFromStorage(this.PREFERENCE_KEY);
    this.dispatchCountryChangeEvent(null, 'fallback');
  }

  /**
   * Detecta país automáticamente usando múltiples métodos
   */
  private static async detectCountryAutomatically(): Promise<{
    country: string;
    source: LocationSource;
  } | null> {
    
    // Verificar caché de detección automática
    const cached = this.getFromStorage(this.AUTO_CACHE_KEY);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        country: cached.country,
        source: cached.source
      };
    }

    // 1. Intentar detección vía Netlify Functions
    try {
      const netlifyCountry = await this.detectViaNetlify();
      if (netlifyCountry) {
        this.saveToStorage(this.AUTO_CACHE_KEY, {
          country: netlifyCountry,
          source: 'netlify',
          timestamp: Date.now()
        });
        
        return {
          country: netlifyCountry,
          source: 'netlify'
        };
      }
    } catch (error) {
      console.warn('Netlify detection failed:', error);
    }

    // 2. Fallback: detección por navegador
    const browserCountry = this.detectByBrowser();
    if (browserCountry) {
      this.saveToStorage(this.AUTO_CACHE_KEY, {
        country: browserCountry,
        source: 'browser',
        timestamp: Date.now()
      });
      
      return {
        country: browserCountry,
        source: 'browser'
      };
    }

    return null;
  }

  /**
   * Detección vía Netlify Functions
   */
  private static async detectViaNetlify(): Promise<string | null> {
    try {
      const response = await fetch('/.netlify/functions/detect-country', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const country = normalizeCountryCode(data.country);
        return country;
      }
    } catch (error) {
      console.warn('Error fetching from Netlify function:', error);
    }

    return null;
  }

  /**
   * Detección por navegador usando timezone y language
   */
  private static detectByBrowser(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Detección por zona horaria (más precisa)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (timezone.includes('Santiago') || timezone.includes('Chile')) return 'cl';
      if (timezone.includes('Mexico') || timezone.includes('Tijuana')) return 'mx';
      if (timezone.includes('Bogota') || timezone.includes('Colombia')) return 'co';

      // 2. Detección por idioma del navegador
      const language = navigator.language.toLowerCase();
      
      if (language.includes('es-cl')) return 'cl';
      if (language.includes('es-mx')) return 'mx';
      if (language.includes('es-co')) return 'co';

      // 3. Detección por configuración de moneda
      try {
        const currency = new Intl.NumberFormat().resolvedOptions().currency;
        const currencyMap: Record<string, string> = {
          'CLP': 'cl',
          'MXN': 'mx',
          'COP': 'co'
        };
        
        if (currency && currencyMap[currency]) {
          return currencyMap[currency];
        }
      } catch (error) {
        console.warn('Currency detection failed:', error);
      }

    } catch (error) {
      console.warn('Browser detection failed:', error);
    }

    return null;
  }

  /**
   * Obtiene preferencia manual del usuario
   */
  private static getUserPreference(): LocationPreference | null {
    return this.getFromStorage(this.PREFERENCE_KEY);
  }

  /**
   * Dispara evento personalizado cuando cambia el país
   */
  private static dispatchCountryChangeEvent(country: string | null, source: LocationSource): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('tp-country-changed', {
        detail: { country, source }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Guarda datos en localStorage
   */
  private static saveToStorage(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  /**
   * Obtiene datos de localStorage
   */
  private static getFromStorage(key: string): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Could not read from localStorage:', error);
      return null;
    }
  }

  /**
   * Elimina datos de localStorage
   */
  private static removeFromStorage(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Could not remove from localStorage:', error);
    }
  }

  /**
   * Información de debug sobre la detección
   */
  static getDebugInfo() {
    if (typeof window === 'undefined') return null;

    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: navigator.languages,
      userAgent: navigator.userAgent,
      currency: (() => {
        try {
          return new Intl.NumberFormat().resolvedOptions().currency;
        } catch {
          return 'unknown';
        }
      })(),
      localStorage: {
        preference: this.getFromStorage(this.PREFERENCE_KEY),
        autoCache: this.getFromStorage(this.AUTO_CACHE_KEY)
      }
    };
  }
}
