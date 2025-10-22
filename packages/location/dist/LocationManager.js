import { DEFAULT_COUNTRY, normalizeCountryCode } from './CountryConfig';
/**
 * Manager principal para detección y gestión de ubicación
 */
export class LocationManager {
    /**
     * Obtiene el país actual del usuario
     */
    static async getCurrentCountry() {
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
        }
        catch (error) {
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
    static setUserPreference(country) {
        const normalizedCountry = normalizeCountryCode(country);
        if (!normalizedCountry) {
            console.warn('País no soportado:', country);
            return;
        }
        const preference = {
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
    static resetToAutoDetection() {
        this.removeFromStorage(this.PREFERENCE_KEY);
        this.dispatchCountryChangeEvent(null, 'auto');
    }
    /**
     * Detecta país automáticamente usando múltiples métodos
     */
    static async detectCountryAutomatically() {
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
        }
        catch (error) {
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
    static async detectViaNetlify() {
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
        }
        catch (error) {
            console.warn('Error fetching from Netlify function:', error);
        }
        return null;
    }
    /**
     * Detección por navegador usando timezone y language
     */
    static detectByBrowser() {
        if (typeof window === 'undefined')
            return null;
        try {
            // 1. Detección por zona horaria (más precisa)
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezone.includes('Santiago') || timezone.includes('Chile'))
                return 'cl';
            if (timezone.includes('Mexico') || timezone.includes('Tijuana'))
                return 'mx';
            if (timezone.includes('Bogota') || timezone.includes('Colombia'))
                return 'co';
            // 2. Detección por idioma del navegador
            const language = navigator.language.toLowerCase();
            if (language.includes('es-cl'))
                return 'cl';
            if (language.includes('es-mx'))
                return 'mx';
            if (language.includes('es-co'))
                return 'co';
            // 3. Detección por configuración de moneda
            try {
                const currency = new Intl.NumberFormat().resolvedOptions().currency;
                const currencyMap = {
                    'CLP': 'cl',
                    'MXN': 'mx',
                    'COP': 'co'
                };
                if (currencyMap[currency]) {
                    return currencyMap[currency];
                }
            }
            catch (error) {
                console.warn('Currency detection failed:', error);
            }
        }
        catch (error) {
            console.warn('Browser detection failed:', error);
        }
        return null;
    }
    /**
     * Obtiene preferencia manual del usuario
     */
    static getUserPreference() {
        return this.getFromStorage(this.PREFERENCE_KEY);
    }
    /**
     * Dispara evento personalizado cuando cambia el país
     */
    static dispatchCountryChangeEvent(country, source) {
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
    static saveToStorage(key, data) {
        if (typeof window === 'undefined')
            return;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        }
        catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    }
    /**
     * Obtiene datos de localStorage
     */
    static getFromStorage(key) {
        if (typeof window === 'undefined')
            return null;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        catch (error) {
            console.warn('Could not read from localStorage:', error);
            return null;
        }
    }
    /**
     * Elimina datos de localStorage
     */
    static removeFromStorage(key) {
        if (typeof window === 'undefined')
            return;
        try {
            localStorage.removeItem(key);
        }
        catch (error) {
            console.warn('Could not remove from localStorage:', error);
        }
    }
    /**
     * Información de debug sobre la detección
     */
    static getDebugInfo() {
        if (typeof window === 'undefined')
            return null;
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            languages: navigator.languages,
            userAgent: navigator.userAgent,
            currency: (() => {
                try {
                    return new Intl.NumberFormat().resolvedOptions().currency;
                }
                catch {
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
LocationManager.PREFERENCE_KEY = 'tp_country_preference';
LocationManager.AUTO_CACHE_KEY = 'tp_auto_detected_country';
LocationManager.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
