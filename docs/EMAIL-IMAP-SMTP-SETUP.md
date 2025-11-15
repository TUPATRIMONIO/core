# 📧 Guía: Conectar Email via IMAP/SMTP

## Resumen

El CRM soporta dos métodos de conexión:

- **OAuth** (Google API) - Para cuentas @tupatrimonio.cl y @tupatrimonio.app
- **IMAP/SMTP** (Protocolo estándar) - Para cualquier otra cuenta (Gmail, Outlook, Yahoo, dominios personalizados)

---

## 🔐 App Passwords: ¿Qué Son?

Las **contraseñas de aplicación** (App Passwords) son contraseñas de un solo uso que permiten que aplicaciones de terceros accedan a tu cuenta de email sin usar tu contraseña principal.

**Ventajas:**
- ✅ Más seguro que compartir tu contraseña real
- ✅ Puedes revocarlas en cualquier momento
- ✅ No da acceso a otras funciones de tu cuenta

---

## 📱 Cómo Generar App Passwords

### **Gmail / Google Workspace**

1. Ve a: https://myaccount.google.com/apppasswords
2. Inicia sesión con tu cuenta de Google
3. **Requisito**: Debes tener verificación en 2 pasos activada
   - Si no la tienes: https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"
4. Click en **"Generar"** o **"Crear contraseña de aplicación"**
5. Nombre: `TuPatrimonio CRM`
6. Click **"Crear"**
7. **Copia la contraseña** de 16 caracteres (formato: `xxxx xxxx xxxx xxxx`)
8. Pégala en el CRM cuando te la pida

**Importante**: Esta contraseña se muestra **una sola vez**. Si la pierdes, genera una nueva.

---

### **Outlook / Hotmail / Live**

1. Ve a: https://account.microsoft.com/security
2. Inicia sesión con tu cuenta de Microsoft
3. Ve a **"Opciones de seguridad avanzadas"**
4. Baja hasta **"Contraseñas de aplicación"**
5. Click en **"Crear una nueva contraseña de aplicación"**
6. Nombre: `TuPatrimonio CRM`
7. **Copia la contraseña** generada
8. Pégala en el CRM

**Nota**: Outlook permite usar tu contraseña normal si NO tienes 2FA. Pero recomendamos usar App Password.

---

### **Yahoo Mail**

1. Ve a: https://login.yahoo.com/account/security
2. Inicia sesión con tu cuenta de Yahoo
3. Baja hasta **"Generar contraseña de aplicación"**
4. Click en **"Generar"**
5. Nombre: `TuPatrimonio CRM`
6. **Copia la contraseña** de 16 caracteres
7. Pégala en el CRM

---

### **iCloud Mail**

1. Ve a: https://appleid.apple.com/account/manage
2. Inicia sesión con tu Apple ID
3. Ve a **"Seguridad"** > **"Contraseñas específicas de app"**
4. Click **"Generar contraseña..."**
5. Nombre: `TuPatrimonio CRM`
6. **Copia la contraseña** generada
7. Pégala en el CRM

---

### **Dominios Personalizados**

Para dominios propios (ej: `info@miempresa.com`):

1. Consulta con tu proveedor de hosting/email
2. Busca la configuración de IMAP y SMTP
3. Usa tu contraseña de email normal o genera App Password si está disponible

**Configuración típica:**
- IMAP: `imap.midominio.com` puerto `993` (TLS)
- SMTP: `smtp.midominio.com` puerto `587` (STARTTLS)

---

## 🚀 Cómo Conectar en el CRM

### **Paso 1: Generar App Password**

Sigue las instrucciones arriba según tu proveedor (Gmail, Outlook, Yahoo).

### **Paso 2: En el CRM**

1. Ve a: **Configuración** > **Cuentas de Email**
2. Click en **"Conectar Cuenta Compartida"** o **"Conectar Mi Cuenta Personal"**
3. **Paso 1 - Email**:
   - Ingresa tu dirección de email completa
   - Ejemplo: `contacto@miempresa.com`
4. **Paso 2 - Credenciales**:
   - Pega la App Password generada
   - El sistema auto-detecta el proveedor (Gmail, Outlook, etc.)
5. **Paso 3 - Validación**:
   - El CRM prueba la conexión IMAP y SMTP
   - Si todo está bien, la cuenta se conecta ✅

### **Paso 3: Empezar a Usar**

- La cuenta aparece en la lista de "Cuentas Conectadas"
- Puedes enviar emails desde ella
- Se sincroniza automáticamente cada 5 minutos

---

## 🔍 Solución de Problemas

### **Error: "IMAP connection failed"**

**Causa**: Credenciales incorrectas o IMAP no habilitado

**Soluciones:**
1. Verifica que copiaste bien la App Password (sin espacios)
2. Gmail: Asegúrate de tener 2FA activado
3. Gmail: Habilita IMAP en Configuración > Reenvío y correo POP/IMAP
4. Outlook: Verifica que IMAP esté habilitado en configuración

### **Error: "SMTP connection failed"**

**Causa**: Configuración SMTP incorrecta

**Soluciones:**
1. Verifica que uses la misma App Password
2. Verifica que el email sea exactamente el mismo
3. Algunos proveedores requieren configuración adicional

### **Error: "Authentication failed"**

**Causa**: App Password inválida o expirada

**Soluciones:**
1. Genera una nueva App Password
2. Revoca la anterior si es posible
3. Intenta conectar de nuevo

### **No recibo emails en el inbox**

**Causa**: Sincronización no ejecutada

**Soluciones:**
1. Click en botón 🔄 junto a la cuenta
2. Espera 5-10 segundos
3. Ve al Inbox y verifica

---

## ⚙️ Configuración Manual (Dominios Custom)

Si tu proveedor no está en la lista (Gmail, Outlook, Yahoo), necesitas configuración manual:

1. Contacta a tu proveedor de hosting/email
2. Solicita:
   - Servidor IMAP (host y puerto)
   - Servidor SMTP (host y puerto)
   - Si usa TLS/SSL
3. En el wizard del CRM, el sistema intentará auto-configurar
4. Si falla, necesitarás configuración manual (próximamente)

**Configuraciones comunes:**
- **cPanel/WHM**: `mail.tudominio.com` (IMAP 993, SMTP 587)
- **Zoho Mail**: `imap.zoho.com` / `smtp.zoho.com`
- **ProtonMail**: `127.0.0.1` (requiere ProtonMail Bridge)

---

## 🔐 Seguridad

### **¿Es seguro guardar App Passwords?**

**SÍ**, las App Passwords se guardan **encriptadas** usando AES-256-GCM.

- ✅ Encriptación en reposo (base de datos)
- ✅ Encriptación en tránsito (HTTPS)
- ✅ Solo se descifran cuando se usan
- ✅ Nunca se muestran en la UI

### **¿Cómo revocar acceso?**

1. **Gmail**: https://myaccount.google.com/apppasswords > Eliminar contraseña
2. **Outlook**: Configuración de seguridad > Eliminar App Password
3. **En el CRM**: Click en 🗑️ junto a la cuenta

---

## 🎯 Diferencia: OAuth vs IMAP/SMTP

| Característica | OAuth (Gmail API) | IMAP/SMTP |
|----------------|-------------------|-----------|
| **Cuentas soportadas** | Solo @tupatrimonio.* | Cualquier email |
| **Configuración** | Automática | App Password |
| **Verificación de Google** | Requerida | No requerida |
| **Límite de usuarios** | 100 en testing | Ilimitado |
| **Proveedores** | Solo Gmail | Gmail, Outlook, Yahoo, etc. |
| **Seguridad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Facilidad** | Click → Autorizar | Generar App Password |

---

## ✅ Checklist de Conexión

- [ ] Generar App Password en tu proveedor
- [ ] Guardar la contraseña (se muestra una sola vez)
- [ ] Ir a Configuración > Cuentas de Email en el CRM
- [ ] Click en "Conectar Cuenta"
- [ ] Ingresar email
- [ ] Pegar App Password
- [ ] Esperar validación
- [ ] ¡Listo! Cuenta conectada

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que IMAP esté habilitado en tu proveedor
2. Genera una nueva App Password
3. Consulta la documentación de tu proveedor de email
4. Contacta a soporte de TuPatrimonio

---

**Sistema implementado: 14 Noviembre 2025**

