# Integración con Veriff

## Descripción General

La integración con Veriff permite verificar la identidad de los firmantes mediante biometría facial y validación de documentos de identidad. Se utiliza el **InContext SDK** para ofrecer una experiencia fluida dentro de la aplicación, sin redirigir al usuario a una página externa.

## Flujo de Verificación

1. **Inicio**: El usuario hace clic en "Iniciar Verificación Facial" en la página de firma.
2. **Creación de Sesión**:
   - Se llama a `/api/signing/start-veriff`.
   - Se crea una sesión en la base de datos local (`identity_verification_sessions`).
   - Se crea una sesión en la API de Veriff.
   - Se configura el `callback` de Veriff como fallback (por si el SDK falla).
3. **Apertura del Modal (InContext SDK)**:
   - La aplicación abre un modal seguro (`iframe`) proporcionado por el SDK de Veriff.
   - **En Mobile**: El usuario accede directamente a la cámara para realizar la verificación.
   - **En Desktop**: El usuario ve opciones para continuar en el móvil (QR, SMS) o usar la cámara web.
4. **Verificación**: El usuario completa el proceso dentro del modal.
5. **Finalización**:
   - El SDK emite un evento `FINISHED` al frontend.
   - El modal se cierra automáticamente.
   - La aplicación pasa al estado `veriff_processing`.
6. **Procesamiento y Polling**:
   - La aplicación consulta periódicamente (`/api/signing/verification-status`) el estado de la verificación.
   - Paralelamente, Veriff envía un webhook asíncrono a `/api/webhooks/veriff`.
7. **Webhook**:
   - El webhook procesa el evento `verification.submitted` o `verification.approved`.
   - Actualiza el estado en la base de datos local.
8. **Validación de Identidad**:
   - El sistema compara automáticamente los datos del firmante (nombre, RUT) con los datos verificados por Veriff.
   - Si los datos no coinciden, se bloquea el proceso de firma y se instruye al usuario a contactar al gestor.
9. **Continuación**:
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
- `NEXT_PUBLIC_APP_URL` o `NEXT_PUBLIC_SITE_URL`: URL base de la aplicación.

### Base de Datos

La configuración del proveedor se almacena en `identity_verification_provider_configs`.

- `webhook_url`: Debe apuntar a `https://app.tupatrimonio.app/api/webhooks/veriff`.

## Webhooks

El endpoint `/api/webhooks/veriff` maneja las notificaciones de Veriff.
- Verifica la firma HMAC (`X-HMAC-SIGNATURE`).
- Encola los eventos en `pending_veriff_syncs`.
- Procesa la verificación y actualiza el estado del firmante.

## Solución de Problemas

### El modal no se abre
- Verificar que la API Key sea correcta.
- Revisar la consola del navegador para errores de CSP (Content Security Policy).
- Asegurarse de que el dominio esté permitido en la configuración de Veriff Station.

### Webhook no actualiza estado
1. Verificar logs de Vercel/Supabase para errores en `/api/webhooks/veriff`.
2. Verificar que `VERIFF_API_SECRET` coincida con la configuración en Veriff Station.
3. Revisar la tabla `pending_veriff_syncs` para ver si el evento llegó pero falló al procesarse.

### Bloqueo de Identidad Incorrecto
Si un usuario legítimo es bloqueado:
1. Verificar los datos ingresados por el gestor en `signing_signers`.
2. Verificar los datos devueltos por Veriff en `identity_verification_sessions.raw_response`.
3. Si hay discrepancias (ej: error de tipeo en el RUT del gestor), corregir los datos del firmante en la base de datos o panel de administración.
