/**
 * Página de Configuración del CRM
 * Redirige automáticamente a la configuración de Gmail
 */

import { redirect } from 'next/navigation';

export default function CRMSettingsPage() {
  redirect('/dashboard/crm/settings/gmail');
}

