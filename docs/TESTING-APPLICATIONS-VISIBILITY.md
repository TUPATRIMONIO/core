# Pruebas del Sistema de Visibilidad de Aplicaciones

## Credenciales de Prueba
- Email: felipeleveke@gmail.com
- Contraseña: 123123123

## Checklist de Pruebas

### 1. Migraciones de Base de Datos
- [ ] Ejecutar migración `20251205000000_applications_visibility.sql`
- [ ] Verificar que los campos se agregaron a `core.applications`
- [ ] Verificar que la tabla `core.application_overrides` se creó
- [ ] Verificar que las funciones `can_access_application` y `get_enabled_applications` existen
- [ ] Verificar que las vistas públicas se crearon

### 2. Página de Listado (`/admin/applications`)
- [ ] Acceder a `/admin/applications` como platform admin
- [ ] Verificar que se muestran todas las aplicaciones
- [ ] Verificar que se muestran los badges de visibilidad
- [ ] Verificar que se muestran países y tiers si están configurados
- [ ] Verificar que el botón "Editar Visibilidad" funciona

### 3. Página de Detalle (`/admin/applications/[id]`)
- [ ] Click en "Editar Visibilidad" de cualquier aplicación
- [ ] Verificar que se carga la información correcta
- [ ] Probar cambiar el nivel de visibilidad
- [ ] Probar seleccionar países permitidos
- [ ] Probar seleccionar tiers de suscripción
- [ ] Guardar cambios y verificar que se actualizan

### 4. Overrides por Organización
- [ ] Agregar un override para una organización específica
- [ ] Verificar que se muestra en la lista
- [ ] Probar toggle de habilitar/deshabilitar override
- [ ] Probar agregar fecha de expiración
- [ ] Eliminar un override y verificar que se elimina

### 5. API Routes
- [ ] GET `/api/admin/applications/[id]` - Obtener aplicación
- [ ] PATCH `/api/admin/applications/[id]` - Actualizar aplicación
- [ ] GET `/api/admin/applications/[id]/overrides` - Listar overrides
- [ ] POST `/api/admin/applications/[id]/overrides` - Crear override
- [ ] DELETE `/api/admin/applications/[id]/overrides/[overrideId]` - Eliminar override
- [ ] POST `/api/admin/applications/check` - Verificar acceso

### 6. Funciones SQL
- [ ] Probar `can_access_application('crm_sales', org_id, user_id)`
- [ ] Probar `get_enabled_applications(org_id, user_id)`
- [ ] Verificar que respetan los niveles de visibilidad
- [ ] Verificar que respetan las restricciones por país
- [ ] Verificar que respetan las restricciones por tier

### 7. Hook de Frontend
- [ ] Probar `useApplicationAccess('crm_sales')` en un componente
- [ ] Verificar que retorna `hasAccess` correctamente
- [ ] Probar `useEnabledApplications()` para obtener lista

## Problemas Conocidos y Soluciones

### Si la migración falla:
- Verificar que no existan conflictos con migraciones anteriores
- Verificar que el usuario tenga permisos para crear tablas y funciones

### Si las consultas fallan:
- Verificar que las vistas públicas estén creadas
- Verificar que las relaciones estén correctamente definidas
- Usar `createServiceRoleClient()` para acceso completo

### Si los overrides no se muestran:
- Verificar que la relación con `organizations` esté correcta
- Verificar que las políticas RLS permitan la lectura

## Comandos Útiles

```sql
-- Verificar campos agregados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'core' 
AND table_name = 'applications'
AND column_name IN ('visibility_level', 'allowed_countries', 'required_subscription_tiers');

-- Verificar tabla de overrides
SELECT * FROM core.application_overrides LIMIT 5;

-- Probar función de acceso
SELECT core.can_access_application('crm_sales', 'org-uuid-here', 'user-uuid-here');

-- Ver aplicaciones habilitadas
SELECT * FROM core.get_enabled_applications('org-uuid-here', 'user-uuid-here');
```

