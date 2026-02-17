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
    *   `/api/signing/execute-fes`: Ejecución de firma FES.
    *   `/api/signing/initiate`: Orquestador del inicio del proceso de firma.

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
    2.  Confirmación de identidad (en desarrollo).
    3.  Estampa inmediata de certificado simple.
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
    *   Si es FES: Presiona "Firmar Documento" y la estampa es inmediata.
4.  **Finalización**:
    *   El PDF firmado se guarda en el bucket `docs-signed`.
    *   Se actualiza el estado del firmante a `signed`.
    *   Si es secuencial, se notifica al siguiente.
    *   Al completar todas las firmas, el documento pasa a `signed` o `completed`.

---

## 🗄️ Estructura de Datos (Schema `signing`)

*   `signing.documents`: Registro principal del documento, rutas de archivos y metadata del producto.
*   `signing.signers`: Datos de los firmantes, tokens de acceso, estados y registros de auditoría de la firma (IP, User Agent).
*   `signing.products`: Catálogo de tipos de firma disponibles por país.

---

## 🛠️ Configuración (Variables de Entorno)

Para el funcionamiento de FES, se requieren los siguientes secrets en Supabase:
*   `FES_API_URL`: URL de la API de estampa.
*   `FES_API_KEY`: Clave de autenticación para la API.

---

**Última actualización**: 17 Febrero 2026
