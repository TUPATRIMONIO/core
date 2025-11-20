# Guía Rápida - TuPatrimonio Web App

## 🚀 Inicio Rápido

### 1. Aplicar Migraciones (SI AÚN NO LO HAS HECHO)

```bash
# Aplicar todas las migraciones nuevas
supabase db push

# O aplicar manualmente
cd supabase/migrations
# Aplicar archivos:
# - 20251119010000_improve-auth-trigger.sql
# - 20251119011000_setup-storage-buckets.sql
# - 20251119012000_verify-rls-policies.sql
# - 20251119013000_seed-initial-data.sql
```

### 2. Verificar que el Servidor Esté Corriendo

El servidor ya debería estar corriendo en:
**http://localhost:3000**

Si no está corriendo:
```bash
cd apps/web
npm run dev
```

### 3. Navegar a la Aplicación

Abre tu navegador en: **http://localhost:3000**

---

## 🧪 FLUJO DE PRUEBAS

### PASO 1: Registro de Usuario ✅

1. Ve a http://localhost:3000
2. Te redirigirá a `/login`
3. Click en "Regístrate"
4. Llena el formulario:
   - Nombre completo: `Test Usuario`
   - Email: `test@tupatrimonio.cl`
   - Contraseña: `Test1234` (mínimo 8 chars, mayúscula, minúscula, número)
   - Confirmar contraseña: `Test1234`
5. Click en "Crear cuenta"

**Resultado esperado:**
- Sistema crea automáticamente:
  - Usuario en `core.users`
  - Organización personal llamada "Test Usuario"
  - Te asigna como owner
  - Crea balance de créditos inicial (0)
- Te redirige a `/dashboard`

### PASO 2: Explorar el Dashboard ✅

En `/dashboard` deberías ver:
- Mensaje de bienvenida con tu nombre
- Nombre de tu organización
- 4 cards de stats (Créditos, Documentos, Solicitudes, Contactos)
- 3 Quick actions

### PASO 3: Comprar Créditos ✅

1. Click en "Créditos" en el sidebar
2. Verás balance: **0 créditos**
3. Click en "Comprar créditos"
4. Cambiar moneda si quieres (selector superior)
5. Seleccionar paquete (ej: "Pro - 550 créditos")
6. Click en "Pagar con Stripe" (simulado)
7. Te redirige al callback
8. Deberías ver mensaje: "Compra exitosa"
9. Balance actualizado a **550 créditos**

### PASO 4: Crear Documento de Firma ✅

1. Click en "Firma Electrónica" en sidebar
2. Click en "Nuevo documento"
3. Llenar formulario:
   - Título: `Contrato de Prueba`
   - Descripción: `Contrato para testing`
   - Proveedor: Seleccionar uno disponible
   - Modo: Paralelo o Secuencial
   - Subir PDF (cualquier PDF)
4. Agregar firmantes:
   - Nombre: `Juan Pérez`
   - Email: `juan@test.com`
   - Rol: `Firmante`
5. Click en "Crear documento"

**Resultado esperado:**
- Documento creado con estado "Borrador"
- Redirige a detalle del documento
- Muestra timeline de eventos
- Lista de firmantes

### PASO 5: Ver Detalle de Documento ✅

En la página de detalle verás:
- Información del documento
- Lista de firmantes con estados
- Timeline de eventos
- Botones de acción (Descargar, Enviar recordatorio, Cancelar)

Prueba:
1. Click en "Enviar recordatorio" a un firmante
2. Verifica que aparece mensaje de éxito
3. Ve que se agrega evento en el timeline

### PASO 6: Crear Nueva Organización ✅

1. Click en el **OrgSwitcher** (parte superior del sidebar)
2. Click en "Crear organización"
3. Llenar:
   - Nombre: `Mi Empresa S.A.`
   - Tipo: `Empresarial`
4. Click en "Crear organización"

**Resultado esperado:**
- Organización creada
- Aparece en el OrgSwitcher
- Puedes cambiar entre organizaciones
- Cada org tiene su propio balance de créditos

### PASO 7: Gestionar Miembros ✅

1. Ve a "Organización" en sidebar
2. Click en el card "Miembros" → "Administrar"
3. Click en "Invitar miembro"
4. Ingresar email de un usuario existente
5. Seleccionar rol (Miembro, Admin, Owner)
6. Click en "Enviar invitación"

**Resultado esperado:**
- Si el usuario existe, se agrega inmediatamente
- Si no existe, se envía invitación (estructura lista)
- Lista de miembros se actualiza

### PASO 8: Editar Permisos Granulares ✅

1. En la lista de miembros
2. Click en menú (⋮) de un miembro
3. "Editar permisos"
4. Activar/desactivar permisos específicos
5. Click en "Guardar permisos"

**Resultado esperado:**
- Permisos guardados en `core.user_permissions`
- El usuario ve/no ve módulos según permisos

### PASO 9: Solicitar Servicio Notarial ✅

1. Click en "Servicios Notariales" en sidebar
2. Click en "Nueva solicitud"
3. Seleccionar servicio (ej: "Copia Certificada")
4. Llenar título del documento
5. Opcionalmente vincular documento firmado
6. O subir PDF nuevo
7. Click en "Crear solicitud"

**Resultado esperado:**
- Solicitud creada con estado "Pendiente"
- Asignada a notaría disponible
- Puedes ver el seguimiento

### PASO 10: Portal de Notarías (Bonus) ✅

Para probar el portal de notarías necesitas:
1. Crear una organización tipo "notary" manualmente en BD
2. O usar la notaría de ejemplo que se creó con los datos iniciales

Luego:
1. Ve a `/notary/dashboard`
2. Verás solicitudes asignadas
3. Acepta una solicitud
4. Sube documento procesado
5. Marca como completado

---

## 🐛 TROUBLESHOOTING

### Error: "organization_users not found"
**Solución:** Aplica las migraciones. La tabla fue renombrada de `organization_members` a `organization_users`.

### Error: "No hay paquetes disponibles"
**Solución:** Aplica la migración `20251119013000_seed-initial-data.sql` que crea los paquetes.

### Error: "payment_providers not found"
**Solución:** Aplica la migración de datos iniciales que crea Stripe y DLocalGo.

### Error al subir archivo: "Storage bucket not found"
**Solución:** Aplica `20251119011000_setup-storage-buckets.sql`.

### No puedo comprar créditos
**Verificar:**
1. Que existan `payment_providers` en la BD
2. Que existan `credit_packages` en la BD
3. Que existan `credit_package_prices` en la BD

### RLS no funciona correctamente
**Solución:** Ejecuta:
```sql
SELECT * FROM verify_rls_status();
```
Y verifica que todas las tablas tengan políticas.

---

## 💡 TIPS

### Cambiar de Organización
- Click en el nombre de la org (sidebar superior)
- Selecciona otra org de la lista
- El contenido cambia automáticamente

### Ver Balance de Créditos
- Siempre visible en TopMenu (esquina superior derecha)
- Click para ir a página detallada

### Selector de Moneda
- Disponible en TopMenu (ícono de globo)
- Click para cambiar moneda preferida
- Los precios se actualizan automáticamente

### Permisos
- Los elementos del menú se ocultan si no tienes permiso
- Usa `PermissionGate` en componentes para validar acceso

---

## 📞 SOPORTE

### Archivos de Referencia
- **Implementación completa**: `apps/web/IMPLEMENTACION-COMPLETA.md`
- **Checklist de pruebas**: `apps/web/CHECKLIST-PRUEBAS.md`
- **Resumen de sesión**: `apps/web/RESUMEN-SESION.md`

### Comandos Útiles
```bash
# Ver logs del servidor
# (en la terminal donde corre npm run dev)

# Verificar migraciones aplicadas
supabase migration list

# Ver logs de Supabase
supabase logs

# Reiniciar servidor
# Ctrl+C y luego npm run dev
```

---

## ✅ TODO ESTÁ LISTO

La aplicación está **100% funcional** para testing local.

**Próximo paso:** Aplicar las 4 nuevas migraciones y empezar a probar!

```bash
supabase db push
```

¡Disfruta probando! 🎉

