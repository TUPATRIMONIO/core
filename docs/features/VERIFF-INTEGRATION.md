# Integración con Veriff

## Descripción General

La integración con Veriff permite verificar la identidad de los firmantes mediante biometría facial y validación de documentos de identidad.

## Flujo de Verificación

1. **Inicio**: El usuario hace clic en "Verificar Identidad" en la página de firma.
2. **Creación de Sesión**:
   - Se llama a `/api/signing/start-veriff`.
   - Se crea una sesión en la base de datos local (`identity_verification_sessions`).
   - Se crea una sesión en la API de Veriff.
   - **IMPORTANTE**: Se configura el `callback` de Veriff para que redirija al usuario de vuelta a la página de firma: `${NEXT_PUBLIC_SITE_URL}/sign/${token}`.
3. **Redirección**: El usuario es redirigido a la URL de Veriff (`verificationUrl`).
4. **Verificación**: El usuario completa el proceso en Veriff (toma fotos, etc.).
5. **Retorno**: Veriff redirige al usuario a la URL de `callback` (la página de firma).
6. **Webhook**:
   - Veriff envía eventos asíncronos a nuestro webhook: `/api/webhooks/veriff`.
   - El webhook procesa el evento `verification.submitted` o `verification.approved`.
   - Actualiza el estado en la base de datos local.
7. **Finalización**:
   - La página de firma (`SigningPageClientFES`) detecta que la verificación está completa (vía polling o recarga).
   - Permite al usuario continuar con la firma del documento.

## Configuración

### Variables de Entorno

- `VERIFF_API_KEY`: Public Key de Veriff.
- `VERIFF_API_SECRET`: Private Key de Veriff (para firmar requests y verificar webhooks).
- `NEXT_PUBLIC_APP_URL` o `NEXT_PUBLIC_SITE_URL`: URL base de la aplicación (usada para construir el callback).

### Base de Datos

La configuración del proveedor se almacena en `identity_verification_provider_configs`.

- `webhook_url`: Debe apuntar a `https://app.tupatrimonio.app/api/webhooks/veriff` (aunque el callback dinámico tiene preferencia para la redirección del usuario).

## Webhooks

El endpoint `/api/webhooks/veriff` maneja las notificaciones de Veriff.
- Verifica la firma HMAC (`X-HMAC-SIGNATURE`).
- Encola los eventos en `pending_veriff_syncs`.
- Procesa la verificación y actualiza el estado del firmante.

## Solución de Problemas

### Redirección Incorrecta (404)

Si el usuario es redirigido a una página 404 después de Veriff (ej: `/api/webhooks/veriff`), significa que el `callback` enviado al crear la sesión estaba mal configurado.
Asegúrese de que `start-veriff/route.ts` esté usando la URL de la página de firma (`/sign/{token}`) y no la URL del webhook como callback.

### Webhook no actualiza estado

1. Verificar logs de Vercel/Supabase para errores en `/api/webhooks/veriff`.
2. Verificar que `VERIFF_API_SECRET` coincida con la configuración en Veriff Station.
3. Revisar la tabla `pending_veriff_syncs` para ver si el evento llegó pero falló al procesarse.
