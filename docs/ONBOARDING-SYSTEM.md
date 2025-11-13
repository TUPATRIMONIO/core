# Sistema de Onboarding B2C + B2B - TuPatrimonio

## 📋 Overview

Sistema completo de onboarding que crea automáticamente organizaciones personales o empresariales según la elección del usuario al registrarse.

---

## 🏗️ Arquitectura del Flujo

```
Usuario se registra
  ↓
✅ Se crea en auth.users (Supabase Auth)
  ↓
🔄 Redirige a /onboarding
  ↓
┌─────────────────────────────────────┐
│ Pantalla de Selección:              │
│                                     │
│ 🏠 Uso Personal (B2C)              │
│ 🏢 Uso Empresarial (B2B)           │
│ 🔗 Tengo Invitación                │
└─────────────────────────────────────┘
  ↓
Función SQL crea organización + asigna rol
  ↓
Habilita CRM con límites según plan
  ↓
Redirige a /dashboard/crm
  ↓
✅ Usuario puede usar el sistema
```

---

## 📦 Componentes del Sistema

### 1. Migración SQL (Base de Datos)

**Archivo**: `supabase/migrations/20251113002149_creacion-org.sql`

**Funciones creadas**:

#### `create_personal_organization(user_id, user_email, user_first_name)`
Crea organización personal para usuarios B2C:
- Org type: `personal`
- Rol: `org_owner`
- CRM habilitado con límites:
  - 100 contactos
  - 1 usuario
  - Email integration: Sí
  - API access: No

#### `create_business_organization(user_id, user_email, org_name, org_industry, org_size)`
Crea organización empresarial para usuarios B2B:
- Org type: `business`
- Rol: `org_owner`
- CRM habilitado con límites:
  - 1,000 contactos
  - 5 usuarios
  - Email integration: Sí
  - API access: Sí

#### `user_has_organization(user_id)`
Verifica si usuario ya completó onboarding

#### `get_user_active_organization(user_id)`
Obtiene la organización activa del usuario

#### `is_platform_super_admin(user_id)`
Verifica si es super admin de plataforma

**RLS Policies actualizadas**:
- ✅ Super admin puede ver TODOS los datos de TODAS las organizaciones
- ✅ Usuarios normales solo ven datos de SU organización
- ✅ `can_access_crm()` actualizado para permitir `org_owner`

---

### 2. Página de Onboarding (Frontend)

**Archivo**: `apps/web/src/app/onboarding/page.tsx`

**Features**:
- 3 opciones visuales (Personal, Empresarial, Invitación)
- Dialogs para cada tipo
- Form para datos de empresa (B2B)
- Validación y feedback
- Redireccionamiento automático

**UI/UX**:
- Diseño consistente con TuPatrimonio
- Cards interactivas con hover effects
- Badges "Recomendado" en opción Business
- Loading states durante creación

---

### 3. API Routes

#### `/api/onboarding/status`
**GET**: Verifica si usuario completó onboarding

**Response**:
```json
{
  "has_organization": true/false
}
```

#### `/api/onboarding/personal`
**POST**: Crea org personal

**Response**:
```json
{
  "success": true,
  "organization_id": "uuid",
  "type": "personal"
}
```

#### `/api/onboarding/business`
**POST**: Crea org empresarial

**Body**:
```json
{
  "name": "Mi Empresa SpA",
  "industry": "Tecnología",
  "size": "11-50"
}
```

**Response**:
```json
{
  "success": true,
  "organization_id": "uuid",
  "type": "business",
  "name": "Mi Empresa SpA"
}
```

---

### 4. Layout de Onboarding

**Archivo**: `apps/web/src/app/onboarding/layout.tsx`

**Protecciones**:
- Verifica que usuario esté autenticado
- Verifica que NO tenga ya una organización
- Redirige apropiadamente

---

## 🔐 Sistema de Permisos

### Tipos de Usuario

#### **Usuario Personal (B2C)**:
```
Tipo: Personal
Organización: "juan@email.com" (personal)
Rol: org_owner (level 8)
CRM: ✅ Acceso completo a SU CRM
Límites: 
  - 100 contactos
  - 1 usuario (solo él)
  - Email integration
Datos: Solo ve SUS contactos/empresas/deals
```

#### **Usuario Empresarial (B2B)**:
```
Tipo: Business
Organización: "Mi Empresa SpA" (business)
Rol: org_owner (level 8)
CRM: ✅ Acceso completo al CRM de SU EMPRESA
Límites:
  - 1,000 contactos
  - 5 usuarios (puede invitar)
  - Email integration
  - API access
Datos: Ve contactos/empresas/deals de SU EMPRESA
Puede: Invitar otros usuarios (crm_manager, sales_rep)
```

#### **Platform Super Admin (TÚ)**:
```
Tipo: Platform
Organización: "TuPatrimonio Platform" (platform)
Rol: platform_super_admin (level 10)
CRM: ✅ Acceso TOTAL a TODO
Datos: ✅ Ve TODAS las organizaciones
      ✅ Ve TODOS los contactos
      ✅ Ve TODOS los deals
      ✅ Ve TODOS los tickets
      ✅ De TODAS las organizaciones
Vista: Panel de administración global
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Registro Personal (B2C)

```
1. Ir a /login
2. Click en "Registrarse"
3. Ingresar email y password
4. Click "Crear Cuenta"
   ↓
5. Redirige a /onboarding
6. Seleccionar "🏠 Uso Personal"
7. Click "Confirmar"
   ↓
   API POST /api/onboarding/personal
   ↓
   SQL: create_personal_organization()
   ↓
   Crea:
   - Org personal
   - Asigna como owner
   - Habilita CRM (100 contactos)
   ↓
8. Redirige a /dashboard/crm
9. ✅ Usuario ve su CRM vacío listo para usar
```

### Flujo 2: Registro Empresarial (B2B)

```
1-4. (Mismo que personal)
   ↓
5. Redirige a /onboarding
6. Seleccionar "🏢 Uso Empresarial"
7. Llenar form:
   - Nombre empresa
   - Industria (opcional)
   - Tamaño (opcional)
8. Click "Crear Empresa"
   ↓
   API POST /api/onboarding/business
   ↓
   SQL: create_business_organization()
   ↓
   Crea:
   - Org empresarial
   - Asigna como owner
   - Habilita CRM (1,000 contactos, 5 users)
   ↓
9. Redirige a /dashboard/crm
10. ✅ Usuario ve CRM de su empresa
11. Puede invitar otros usuarios (futuro)
```

### Flujo 3: Login Existente

```
1. Usuario hace login
2. Sistema verifica: user_has_organization()
   ↓
   SI tiene org:
   → Redirige a /dashboard
   ↓
   NO tiene org:
   → Redirige a /onboarding
```

---

## 🎯 Aislamiento Multi-Tenant

### Cada Organización Ve Solo Sus Datos

**RLS Automático**:
```sql
-- Ejemplo en crm.contacts
CREATE POLICY "Users can view own org contacts"
ON crm.contacts FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);
```

**Resultado**:
- Usuario de Org A: Solo ve contactos de Org A
- Usuario de Org B: Solo ve contactos de Org B
- Super Admin: Ve contactos de TODAS las orgs

### Super Admin: Vista Global

**Política Especial**:
```sql
CREATE POLICY "Super admin can view all contacts"
ON crm.contacts FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));
```

**Resultado**:
- ✅ Super admin bypasses el filtro de organization_id
- ✅ Puede ver datos de cualquier organización
- ✅ Puede hacer soporte y auditoría

---

## 📊 Ejemplo con 3 Usuarios

### Usuario 1: Juan (Personal)
```
Email: juan@email.com
Org: "juan@email.com" (personal)
Rol: org_owner
CRM:
  - 5 contactos propios
  - 2 deals propios
  - 1 ticket propio
Vista: Solo VE sus 5 contactos, 2 deals, 1 ticket
```

### Usuario 2: María (Business)
```
Email: maria@empresa.com
Org: "Mi Empresa SpA" (business)
Rol: org_owner
CRM:
  - 150 contactos de la empresa
  - 20 deals de la empresa
  - 10 tickets de la empresa
Vista: Solo VE los 150 contactos, 20 deals, 10 tickets DE SU EMPRESA
Puede: Invitar 4 usuarios más
```

### Usuario 3: TÚ (Super Admin)
```
Email: admin@tupatrimonio.app
Org: "TuPatrimonio Platform" (platform)
Rol: platform_super_admin
CRM:
  - Leads propios de TuPatrimonio
  - + TODOS los contactos de Juan
  - + TODOS los contactos de María
  - + TODOS los contactos de TODAS las orgs
Vista: VE TODO de TODAS las organizaciones
Propósito: Soporte, auditoría, administración global
```

---

## 🔧 Aplicar el Sistema

### Paso 1: Aplicar Migración

```sql
-- En Supabase SQL Editor, ejecutar:
-- supabase/migrations/20251113002149_creacion-org.sql
```

**Resultado esperado**:
```
✅ Funciones creadas
✅ Rol org_owner creado/actualizado
✅ RLS policies para super admin
✅ can_access_crm() actualizado
```

### Paso 2: Verificar que Funciona

```sql
-- Ver funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%organization%';

-- Debería mostrar:
-- create_personal_organization
-- create_business_organization
-- user_has_organization
-- get_user_active_organization
```

### Paso 3: Probar el Flujo

1. Ir a http://localhost:3000/login
2. Registrarse con email nuevo
3. Debería redirigir a /onboarding
4. Seleccionar tipo (Personal o Empresarial)
5. Llenar datos si es empresarial
6. Click confirmar/crear
7. Debería redirigir a /dashboard/crm
8. Ver CRM vacío listo para usar

---

## 🐛 Troubleshooting

### Error: "User already has a personal organization"

**Causa**: Intentó crear segunda org personal

**Solución**: Usuario solo puede tener una org personal. Debe usar la existente.

### Error: user_has_organization is not a function

**Causa**: Migración no aplicada

**Solución**: Aplicar migración SQL

### No redirige a /onboarding después de registro

**Causa**: Cambio en login/actions.ts no aplicado

**Solución**: Verificar que `redirect('/onboarding')` está en signUp()

### Super admin no ve datos de otras orgs

**Causa**: Políticas de super admin no aplicadas

**Solución**: Verificar que políticas "Super admin can view all *" existen

---

## 🎯 Testing

### Test 1: Registro Personal

```bash
# 1. Crear usuario nuevo
Email: test-personal@test.com
Password: test123

# 2. Debería redirigir a /onboarding
# 3. Seleccionar "Uso Personal"
# 4. Debería crear org y redirigir a CRM

# 5. Verificar en BD:
SELECT o.name, o.org_type, r.slug
FROM core.organization_users ou
JOIN core.organizations o ON o.id = ou.organization_id
JOIN core.roles r ON r.id = ou.role_id
WHERE ou.user_id = (SELECT id FROM auth.users WHERE email = 'test-personal@test.com');

# Debería mostrar:
# name: test-personal@test.com
# org_type: personal
# slug: org_owner
```

### Test 2: Registro Empresarial

```bash
# 1. Crear usuario nuevo
Email: test-business@test.com
Password: test123

# 2. En /onboarding seleccionar "Uso Empresarial"
# 3. Llenar:
   Nombre: Test Company SpA
   Industria: Tecnología
   Tamaño: 11-50

# 4. Verificar en BD:
SELECT o.name, o.org_type, o.industry
FROM core.organizations o
JOIN core.organization_users ou ON ou.organization_id = o.id
WHERE ou.user_id = (SELECT id FROM auth.users WHERE email = 'test-business@test.com');

# Debería mostrar:
# name: Test Company SpA
# org_type: business
# industry: Tecnología
```

### Test 3: Super Admin Ve Todo

```bash
# 1. Login como super admin
# 2. Ir a /dashboard/crm/contacts
# 3. Debería ver:
   - Contactos de TuPatrimonio Platform
   - + Contactos de test-personal@test.com
   - + Contactos de Test Company SpA
   - + Todos los contactos de TODAS las orgs
```

---

## 📝 Archivos Creados

```
✅ supabase/migrations/20251113002149_creacion-org.sql
✅ apps/web/src/app/onboarding/page.tsx
✅ apps/web/src/app/onboarding/layout.tsx
✅ apps/web/src/app/api/onboarding/status/route.ts
✅ apps/web/src/app/api/onboarding/personal/route.ts
✅ apps/web/src/app/api/onboarding/business/route.ts
✅ apps/web/src/app/login/actions.ts (modificado)
✅ docs/ONBOARDING-SYSTEM.md (este archivo)
```

---

## 🚀 Ventajas del Sistema

### Para Usuarios Finales

✅ **Experiencia clara**: Saben desde el inicio qué tipo de cuenta tienen  
✅ **Configuración automática**: No necesitan hacer nada manual  
✅ **Límites claros**: Cada plan tiene sus límites definidos  
✅ **Upgrade path**: Pueden cambiar de plan después  

### Para TuPatrimonio

✅ **Multi-tenant nativo**: Cada org aislada desde día 1  
✅ **Escalable**: Soporta miles de organizaciones  
✅ **Monetizable**: Límites por plan para upselling  
✅ **Seguro**: RLS garantiza aislamiento  
✅ **Auditable**: Super admin ve todo para soporte  

---

## 🔮 Futuras Mejoras

### Sistema de Invitaciones (Próximamente)

```
Org owner → Invitar usuario
  ↓
Se genera token: INV-XXXXXXXX
  ↓
Email enviado al invitado
  ↓
Invitado hace click en link
  ↓
Si no tiene cuenta: Registrarse
  ↓
Redirige a /onboarding
  ↓
Selecciona "Tengo Invitación"
  ↓
Ingresa código INV-XXXXXXXX
  ↓
Se valida y une a la org
  ↓
Asigna rol definido por quien invitó
```

### Auto-Upgrade de Personal → Business

```
Usuario personal crece
  ↓
Necesita más contactos o usuarios
  ↓
Settings → Cambiar a Plan Business
  ↓
Org cambia de personal → business
  ↓
Límites se actualizan
```

---

## ✅ Estado Actual

**Implementado** (100%):
- ✅ Migración SQL completa
- ✅ Funciones de creación de org
- ✅ Página de onboarding
- ✅ API routes
- ✅ RLS policies para super admin
- ✅ Flujo de registro modificado
- ✅ Protecciones y validaciones

**Pendiente** (Futuro):
- [ ] Sistema de invitaciones
- [ ] Upgrade de planes
- [ ] Gestión de equipos (agregar/remover usuarios)
- [ ] Transferencia de ownership

---

**Sistema de onboarding B2C + B2B completo y funcional!** ✨

**Última actualización**: 13 de Noviembre 2025



