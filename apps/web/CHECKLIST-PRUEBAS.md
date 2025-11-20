# Checklist de Pruebas - TuPatrimonio Web App

## ✅ Implementado y Listo para Probar

### FASE 1: Correcciones Críticas ✅
- [x] Nombres de tablas corregidos (organization_members → organization_users)
- [x] Estructura de user_permissions ajustada para JSONB
- [x] Schemas agregados a todas las queries
- [x] Tipos TypeScript actualizados

### FASE 2: Funcionalidades Core ✅

#### 1. Sistema de Créditos
**Archivos:**
- `apps/web/src/app/dashboard/credits/page.tsx` (actualizado)
- `apps/web/src/app/dashboard/credits/buy/page.tsx` (nuevo)
- `apps/web/src/app/api/payments/create-checkout/route.ts` (nuevo)
- `apps/web/src/app/api/payments/callback/route.ts` (nuevo)

**Pruebas:**
1. Ir a `/dashboard/credits`
2. Verificar que muestra el balance actual
3. Verificar que muestra el historial de transacciones
4. Hacer clic en "Comprar créditos"
5. Verificar que carga los paquetes disponibles
6. Verificar que se puede cambiar de moneda
7. Intentar "comprar" un paquete (simulado, redirige a callback)
8. Verificar que muestra mensaje de éxito
9. Verificar que el balance se actualiza

#### 2. Firma Electrónica - Detalle de Documento
**Archivos:**
- `apps/web/src/app/dashboard/signatures/[id]/page.tsx` (nuevo)
- `apps/web/src/app/api/signatures/send-reminder/route.ts` (nuevo)

**Pruebas:**
1. Ir a `/dashboard/signatures`
2. Crear un nuevo documento con firmantes
3. Ver el detalle del documento creado
4. Verificar que muestra:
   - Información del documento
   - Lista de firmantes con estados
   - Timeline de eventos
   - Botones de acciones (descargar, cancelar, recordatorios)
5. Intentar enviar un recordatorio a un firmante
6. Intentar cancelar el documento
7. Verificar que los eventos se registran en el timeline

#### 3. Gestión de Organización
**Archivos:**
- `apps/web/src/app/dashboard/organization/new/page.tsx` (nuevo)

**Pruebas:**
1. Ir a `/dashboard/organization`
2. Hacer clic en el OrgSwitcher (parte superior del sidebar)
3. Hacer clic en "Crear organización"
4. Llenar el formulario con nombre y tipo (personal/empresarial)
5. Crear la organización
6. Verificar que aparece en la lista de organizaciones
7. Cambiar entre organizaciones
8. Verificar que el contenido cambia según la organización activa

### FASE 3: Archivos Modificados ✅
- `apps/web/src/hooks/use-user.ts` - Corregido para usar organization_users
- `apps/web/src/hooks/use-permissions.ts` - Corregido para leer JSONB
- `apps/web/src/hooks/use-credits.ts` - Agregado schema('core')
- `apps/web/src/lib/supabase/middleware.ts` - Corregido nombres de tablas
- `apps/web/src/app/(onboarding)/onboarding/page.tsx` - Corregido para usar organization_users
- `apps/web/src/app/dashboard/signatures/page.tsx` - Agregado schema
- `apps/web/src/app/dashboard/signatures/new/page.tsx` - Agregado schema
- `apps/web/src/app/dashboard/notary/page.tsx` - Agregado schema
- `apps/web/src/app/dashboard/settings/page.tsx` - Agregado schema
- `apps/web/src/app/dashboard/organization/page.tsx` - Agregado schema
- `apps/web/src/components/layout/org-switcher.tsx` - Corregido para nueva estructura
- `apps/web/src/types/database.ts` - Tipos actualizados

---

## 🔍 Checklist de Verificación Manual

### 1. Autenticación y Onboarding
- [ ] Login funciona correctamente
- [ ] Si no hay organizaciones, redirige a onboarding
- [ ] Crear primera organización funciona
- [ ] Después de crear org, redirige a dashboard

### 2. Dashboard Principal
- [ ] Muestra nombre del usuario
- [ ] Muestra nombre de la organización actual
- [ ] Stats cards muestran información correcta
- [ ] Quick actions tienen los permisos correctos

### 3. Sistema de Créditos
- [ ] Balance muestra el saldo correcto
- [ ] Historial de transacciones carga
- [ ] Página de compra muestra paquetes
- [ ] Selector de moneda funciona
- [ ] Proceso de pago (simulado) funciona
- [ ] Callback procesa correctamente
- [ ] Mensaje de éxito se muestra
- [ ] Balance se actualiza en tiempo real

### 4. Firma Electrónica
- [ ] Lista de documentos carga
- [ ] Crear nuevo documento funciona
- [ ] Upload de PDF funciona
- [ ] Agregar firmantes funciona
- [ ] Modo paralelo/secuencial funciona
- [ ] Detalle de documento muestra toda la info
- [ ] Timeline de eventos carga
- [ ] Enviar recordatorio funciona
- [ ] Cancelar documento funciona
- [ ] Botones de descarga funcionan

### 5. Servicios Notariales
- [ ] Lista de solicitudes carga
- [ ] Búsqueda funciona
- [ ] Estados se muestran correctamente

### 6. Gestión de Organización
- [ ] Info de org se muestra
- [ ] Editar nombre de org funciona
- [ ] Crear nueva org funciona
- [ ] OrgSwitcher muestra todas las orgs
- [ ] Cambiar de org actualiza el contenido
- [ ] Rol se muestra correctamente

### 7. Permisos y Roles
- [ ] Sidebar solo muestra opciones permitidas
- [ ] PermissionGate bloquea acceso correcto
- [ ] Diferentes roles ven diferentes menús

### 8. Configuración
- [ ] Editar perfil funciona
- [ ] Campos se guardan correctamente

---

## ⚠️ Problemas Conocidos a Verificar

1. **Base de Datos**
   - Verificar que existen payment_providers (stripe, dlocalgo)
   - Verificar que existen credit_packages
   - Verificar que existen currencies
   - Verificar que existe el rol org_owner

2. **Storage**
   - Verificar que existe el bucket 'signatures'
   - Verificar permisos de lectura/escritura

3. **RLS Policies**
   - Verificar que las policies permiten acceso correcto
   - Verificar aislamiento entre organizaciones

---

## 🚀 Próximas Funcionalidades (Pendientes)

### Alta Prioridad
- [ ] Edge Functions para proveedores de firma
- [ ] Sistema de notificaciones por email
- [ ] Página de gestión de miembros
- [ ] UI para permisos granulares

### Media Prioridad
- [ ] Portal de notarías
- [ ] Páginas de solicitudes notariales
- [ ] Sistema de webhooks
- [ ] Multi-moneda completo

### Baja Prioridad
- [ ] Transferencias de créditos
- [ ] Analytics y reportes

---

## 📝 Notas de Desarrollo

### Comandos Útiles
```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Verificar linting
npm run lint

# Ver logs de Supabase
# (requiere supabase CLI instalado)
supabase status
```

### Variables de Entorno Requeridas
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### Estructura de Base de Datos
- **core**: Usuarios, organizaciones, créditos, pagos
- **signatures**: Documentos, firmantes, proveedores
- **notary**: Solicitudes notariales, notarías
- **crm**: (existente, no modificado)

