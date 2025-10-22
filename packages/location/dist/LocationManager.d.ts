/**
 * Tipo de detección de ubicación
 */
export type LocationSource = 'manual' | 'netlify' | 'browser' | 'fallback';
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
export declare class LocationManager {
    private static readonly PREFERENCE_KEY;
    private static readonly AUTO_CACHE_KEY;
    private static readonly CACHE_DURATION;
    /**
     * Obtiene el país actual del usuario
     */
    static getCurrentCountry(): Promise<LocationResult>;
    /**
     * Usuario establece manualmente su país de preferencia
     */
    static setUserPreference(country: string): void;
    /**
     * Resetea a detección automática
     */
    static resetToAutoDetection(): void;
    /**
     * Detecta país automáticamente usando múltiples métodos
     */
    private static detectCountryAutomatically;
    /**
     * Detección vía Netlify Functions
     */
    private static detectViaNetlify;
    /**
     * Detección por navegador usando timezone y language
     */
    private static detectByBrowser;
    /**
     * Obtiene preferencia manual del usuario
     */
    private static getUserPreference;
    /**
     * Dispara evento personalizado cuando cambia el país
     */
    private static dispatchCountryChangeEvent;
    /**
     * Guarda datos en localStorage
     */
    private static saveToStorage;
    /**
     * Obtiene datos de localStorage
     */
    private static getFromStorage;
    /**
     * Elimina datos de localStorage
     */
    private static removeFromStorage;
    /**
     * Información de debug sobre la detección
     */
    static getDebugInfo(): {
        timezone: string;
        language: string;
        languages: readonly string[];
        userAgent: string;
        currency: string | undefined;
        localStorage: {
            preference: any;
            autoCache: any;
        };
    } | null;
}
