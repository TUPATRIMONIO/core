/**
 * Hook para manejo de ubicación en componentes React
 */
export declare function useLocation(): {
    country: string;
    source: import("../LocationManager").LocationSource;
    confidence: "high" | "medium" | "low";
    isLoading: boolean;
    error: string | null;
    countryInfo: import("../CountryConfig").CountryConfig | null;
    isManualSelection: boolean;
    isAutoDetected: boolean;
    canChange: boolean;
    setCountry: (countryCode: string) => void;
    resetToAutoDetection: () => void;
    getDebugInfo: () => {
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
};
/**
 * Hook específico para personalización en web app
 */
export declare function useCountryPersonalization(): {
    formatCurrency: (amount: number) => string;
    formatDate: (date: Date) => string;
    getLocalizedContent: (content: Record<string, any>) => any;
    country: string;
    source: import("../LocationManager").LocationSource;
    confidence: "high" | "medium" | "low";
    isLoading: boolean;
    error: string | null;
    countryInfo: import("../CountryConfig").CountryConfig | null;
    isManualSelection: boolean;
    isAutoDetected: boolean;
    canChange: boolean;
    setCountry: (countryCode: string) => void;
    resetToAutoDetection: () => void;
    getDebugInfo: () => {
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
};
