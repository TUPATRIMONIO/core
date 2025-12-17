/**
 * Email Configuration
 *
 * Defines the sender addresses for different types of emails.
 */

export const EMAIL_CONFIG = {
    /**
     * Newsletter and marketing emails
     * Used for campaigns and general communications
     */
    newsletter: {
        email: "info@news.tupatrimon.io",
        name: "TuPatrimonio News",
    },
    /**
     * Transactional and important notifications
     * Used for order status changes, system notifications, etc.
     */
    transactional: {
        email: "notifications@hub.tupatrimon.io",
        name: "TuPatrimonio Hub",
    },
} as const;

export type EmailType = keyof typeof EMAIL_CONFIG;
