import { PaymentProvider } from './adapters/base';
import { StripeAdapter } from './adapters/stripe';
import { TransbankAdapter } from './adapters/transbank';

/**
 * Factory para obtener proveedores de pago
 * 
 * Centraliza el registro de todos los proveedores disponibles,
 * permitiendo agregar nuevos proveedores sin modificar código existente.
 */
const providers = new Map<string, PaymentProvider>([
  ['stripe', new StripeAdapter()],
  ['transbank', new TransbankAdapter()],
]);

/**
 * Obtiene un proveedor de pago por nombre
 * 
 * @param name - Nombre del proveedor ('stripe', 'transbank', etc.)
 * @returns Instancia del proveedor
 * @throws Error si el proveedor no existe
 */
export function getPaymentProvider(name: string): PaymentProvider {
  const provider = providers.get(name.toLowerCase());
  
  if (!provider) {
    const availableProviders = Array.from(providers.keys()).join(', ');
    throw new Error(
      `Proveedor de pago desconocido: ${name}. Proveedores disponibles: ${availableProviders}`
    );
  }
  
  return provider;
}

/**
 * Obtiene todos los proveedores disponibles
 * 
 * @returns Array con todos los proveedores registrados
 */
export function getAllProviders(): PaymentProvider[] {
  return Array.from(providers.values());
}

/**
 * Verifica si un proveedor está disponible
 * 
 * @param name - Nombre del proveedor
 * @returns true si el proveedor existe, false en caso contrario
 */
export function isProviderAvailable(name: string): boolean {
  return providers.has(name.toLowerCase());
}

/**
 * Registra un nuevo proveedor de pago
 * 
 * Útil para agregar proveedores dinámicamente o en tests
 * 
 * @param name - Nombre del proveedor
 * @param provider - Instancia del proveedor
 */
export function registerProvider(name: string, provider: PaymentProvider): void {
  providers.set(name.toLowerCase(), provider);
}

