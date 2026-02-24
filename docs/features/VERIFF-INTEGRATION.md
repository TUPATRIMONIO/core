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
7. **Validación de Identidad**:
   - El sistema compara automáticamente los datos del firmante (nombre, RUT) con los datos verificados por Veriff.
   - Si los datos no coinciden, se bloquea el proceso de firma y se instruye al usuario a contactar al gestor.
8. **Finalización**:
   - Si la identidad coincide, la página de firma (`SigningPageClientFES`) permite al usuario continuar con la firma del documento.

## Validación de Identidad (Identity Match)

Para garantizar que la persona que se verifica es efectivamente el firmante designado, implementamos una lógica de comparación estricta pero flexible:

### Algoritmo de Comparación

1. **Nombres (Coincidencia Parcial)**:
   - Se normalizan los nombres (minúsculas, sin acentos).
   - Se verifica que todas las palabras del nombre del firmante estén presentes en el nombre verificado por Veriff.
   - Ejemplo: "Juan Perez" hace match con "Juan Carlos Perez Gonzalez".

2. **Identificador (Coincidencia Exacta)**:
   - Se normalizan los identificadores (solo alfanuméricos, sin puntos ni guiones).
   - Si ambos tienen identificador (RUT/DNI), deben coincidir exactamente.

3. **Regla Global**:
   - Si hay identificador en ambos lados, ambos (nombre e ID) deben coincidir.
   - Si alguno no tiene identificador, solo se valida el nombre.

### Bloqueo por No Coincidencia

Si la validación falla:
- El usuario ve una pantalla de error "No pudimos confirmar tu identidad".
- Se impide continuar con la firma.
- El backend (`execute-fes`) tiene una guardia adicional que rechaza la firma si la identidad no coincide.

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

### Bloqueo de Identidad Incorrecto

Si un usuario legítimo es bloqueado:
1. Verificar los datos ingresados por el gestor en `signing_signers`.
2. Verificar los datos devueltos por Veriff en `identity_verification_sessions.raw_response`.
3. Si hay discrepancias (ej: error de tipeo en el RUT del gestor), corregir los datos del firmante en la base de datos o panel de administración.
