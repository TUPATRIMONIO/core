# Sistema de Firma Electrónica - TuPatrimonio

Este documento describe la arquitectura y el funcionamiento del sistema de firma electrónica de TuPatrimonio, que soporta tanto Firma Electrónica Avanzada (FEA) como Firma Electrónica Simple (FES).

## 🏗️ Arquitectura General

El sistema está diseñado para ser multi-proveedor y multi-país, operando principalmente a través de Edge Functions de Supabase para interactuar con APIs externas de firma.

### Componentes Clave

1.  **Portal de Firma (`/sign/[token]`)**: Interfaz pública para que los firmantes revisen y firmen documentos sin necesidad de login.
2.  **Edge Functions**:
    *   `cds-signature`: Integración con CDS para Firma Electrónica Avanzada (FEA).
    *   `fes-signature`: Integración con API propia para Firma Electrónica Simple (FES).
    *   `pdf-merge-with-cover`: Generación de portadas con QR y consolidación de PDFs.
3.  **API Routes (Next.js)**:
    *   `/api/signing/execute`: Ejecución de firma FEA.
    *   `/api/signing/execute-fes`: Ejecución de firma FES con validación de identidad.
    *   `/api/signing/initiate`: Orquestador del inicio del proceso de firma.
    *   `/api/signing/client-ip`: Obtención de IP del cliente para auditoría.

---

## ✍️ Tipos de Firma

### 1. Firma Electrónica Avanzada (FEA)
*   **Proveedor**: CDS.
*   **Flujo**:
    1.  Verificación de vigencia del certificado en CDS.
    2.  Enrolamiento (si no tiene certificado vigente).
    3.  Autenticación con clave de certificado.
    4.  Validación de segundo factor (SMS).
    5.  Estampa de firma.
*   **Productos**: `fea_cl`.

### 2. Firma Electrónica Simple (FES)
*   **Proveedor**: API Propia (`cert-fes.tupatrimonio.app`).
*   **Flujo**:
    1.  Revisión del documento.
    2.  **Validación de Identidad**:
        *   Confirmación/Edición de datos (Nombre, RUT/ID).
        *   Captura de firma manuscrita (Dibujo en Canvas o **Subida de Imagen**).
        *   **Persistencia**: La firma se guarda y se precarga automáticamente para futuros documentos del mismo firmante.
        *   Registro de IP.
    3.  Estampa inmediata de certificado simple.
*   **Campos Enviados**:
    *   **Requeridos**: `pdf_base64`, `signer_name`, `signer_email`, `signer_contact_id`, `signer_type_contact_id`.
    *   **Opcionales**: `ip`, `order_number`, `transaction_id`, `url_qr`, `page_sign`, `coords`, `signature_image_base64`.
*   **Productos**: `fes_cl`, `fesb_cl` (Biométrica), `fes_claveunica_cl`.
*   **Ventaja**: Flujo mucho más rápido y directo, sin necesidad de enrolamiento previo en proveedores externos.

---

## 🔄 Proceso de Firma (Step-by-Step)

1.  **Creación**: El documento se crea en estado `draft` con su metadata de producto.
2.  **Iniciación**: Se llama a `initiateSigningProcess`.
    *   Genera portada con QR.
    *   Si es FEA: Verifica vigencia en CDS.
    *   Si es FES: Salta verificación y pone a firmantes en `enrolled`.
    *   Envía notificaciones por email.
3.  **Ejecución**: El firmante accede al portal.
    *   Si es FEA: Sigue flujo de clave + SMS.
    *   Si es FES: 
        *   Revisa el documento.
        *   Confirma sus datos y dibuja su firma.
        *   Presiona "Confirmar y Firmar".
        *   La firma manuscrita se guarda como imagen en Storage (auditoría).
        *   La FES estampa el documento (PDF).
4.  **Finalización**:
    *   El PDF firmado se guarda en el bucket `docs-signed`.
    *   Se actualiza el estado del firmante a `signed` con datos confirmados.
    *   Si es secuencial, se notifica al siguiente.
    *   Al completar todas las firmas, el documento pasa a `signed` o `completed`.

---

## 🗄️ Estructura de Datos (Schema `signing`)

*   `signing.documents`: Registro principal del documento, rutas de archivos y metadata del producto.
*   `signing.signers`: Datos de los firmantes, tokens de acceso, estados y registros de auditoría de la firma (IP, User Agent).
    *   **Nuevos campos de validación**: `confirmed_full_name`, `confirmed_identifier_type`, `confirmed_identifier_value`, `handwritten_signature_path`, `client_ip`.
*   `signing.products`: Catálogo de tipos de firma disponibles por país.

---

## 🛠️ Configuración (Variables de Entorno)

Para el funcionamiento de FES, se requieren los siguientes secrets en Supabase:
*   `FES_API_URL`: URL de la API de estampa.
*   `FES_API_KEY`: Clave de autenticación para la API.

---

**Última actualización**: 17 Febrero 2026
