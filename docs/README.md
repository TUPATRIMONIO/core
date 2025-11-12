# Documentación TuPatrimonio

Bienvenido a la documentación técnica del ecosistema TuPatrimonio. Esta documentación está organizada por temas para facilitar la navegación.

> 💡 **¿Perdido?** Ver [NAVIGATION-MAP.md](./NAVIGATION-MAP.md) para encontrar rápidamente cualquier documento.

## 📚 Índice de Documentación

### 🚀 Inicio Rápido

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Guía principal de desarrollo, setup y comandos
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura general del proyecto

### 🏗️ Arquitectura de Base de Datos

- **[schemas/](./schemas/)** - Documentación de todos los schemas de PostgreSQL
  - [README](./schemas/README.md) - Overview de arquitectura de schemas
  - [ARCHITECTURE-SCHEMAS](./schemas/ARCHITECTURE-SCHEMAS.md) - Filosofía y patrones
  - [crm.md](./schemas/crm.md) - Schema CRM multi-tenant B2B

### 🎨 Sistema de Diseño

- **[design/](./design/)** - Guías de diseño y sistema visual
  - checklist.md - Checklist de diseño
  - improvements.md - Mejoras implementadas
  - typography.md - Sistema de tipografía
  - stats-section.md - Componente de estadísticas

### 📦 Packages Compartidos

- **[packages/](./packages/)** - Documentación de packages del monorepo
  - assets.md - Package @tupatrimonio/assets

### ⚙️ Features y Funcionalidades

- **[features/](./features/)** - Implementaciones específicas
  - page-management.md - Sistema de gestión de páginas
  - pages-config-api.md - API de configuración
  - admin-setup.md - Setup centralizado del admin
  - update-notifications/ - Sistema de notificaciones de actualización

### 🚀 Deployment y Configuración

- **[deployment/](./deployment/)** - Guías de deploy y configuración
  - guide.md - Guía general de deployment
  - vercel.md - Configuración específica de Vercel

### ⚖️ Documentos Legales

- **[legal/](./legal/)** - Términos, políticas y documentos legales
  - terminos-condiciones-v1.5.md - Términos y condiciones

### 📁 Archivos Históricos

- **[archived/](./archived/)** - Documentación histórica y obsoleta
  - PLAN_DE_ACCION.md - Roadmap completo del proyecto
  - Sesiones y pendientes antiguos
  - Guías obsoletas reemplazadas

---

## 🗺️ Navegación Rápida

### Para Desarrolladores Nuevos

1. Empieza con [DEVELOPMENT.md](./DEVELOPMENT.md) - Setup y comandos básicos
2. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) - Estructura del proyecto
3. Revisa [schemas/README.md](./schemas/README.md) - Entender la base de datos

### Para Trabajar en Features Específicos

- **CRM**: Ver [schemas/crm.md](./schemas/crm.md)
- **Blog/Marketing**: Ver [schemas/](./schemas/) (pendiente crear marketing.md)
- **Diseño**: Ver [design/](./design/)
- **Deploy**: Ver [deployment/](./deployment/)

### Para Decisiones Arquitectónicas

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Decisiones generales
- [schemas/ARCHITECTURE-SCHEMAS.md](./schemas/ARCHITECTURE-SCHEMAS.md) - Arquitectura de DB

---

## 📋 Estado de la Documentación

| Categoría | Estado | Archivos |
|-----------|--------|----------|
| Development | ✅ Completo | 1 |
| Architecture | ✅ Completo | 2 |
| Schemas | 🔄 En progreso | 2 de 8 |
| Design | ✅ Completo | 4 |
| Packages | 🔄 Parcial | 1 de 4 |
| Features | ✅ Completo | 4 |
| Deployment | ✅ Completo | 2 |
| Legal | ✅ Completo | 1 |

---

## 🔄 Mantener Actualizada

Al agregar nuevos features o schemas:

1. **Nuevo schema**: Crear `schemas/<nombre>.md` con documentación completa
2. **Nueva feature**: Crear `features/<nombre>.md` si es compleja
3. **Nuevo package**: Crear `packages/<nombre>.md`
4. **Actualizar roadmap**: Mantener `archived/PLAN_DE_ACCION.md` actualizado

---

## 📞 Convenciones

- **Archivos en raíz**: Solo guías principales (DEVELOPMENT, ARCHITECTURE)
- **Carpetas por tema**: Organización lógica
- **Nombres lowercase**: Usar kebab-case en URLs, snake_case en código
- **README por carpeta**: Siempre incluir overview
- **Archived**: Mover docs obsoletos, no eliminar

---

**Última actualización**: 12 de Noviembre 2024

