# Mapa de Navegación - Documentación TuPatrimonio

Guía rápida para encontrar cualquier documento en el proyecto.

---

## 🎯 "Necesito..."

### Empezar a Desarrollar
→ **[docs/DEVELOPMENT.md](./DEVELOPMENT.md)**
- Setup del proyecto
- Comandos de desarrollo
- Troubleshooting común

### Entender la Arquitectura
→ **[docs/ARCHITECTURE.md](./ARCHITECTURE.md)**  
→ **[docs/schemas/ARCHITECTURE-SCHEMAS.md](./schemas/ARCHITECTURE-SCHEMAS.md)**
- Decisiones técnicas
- Arquitectura de schemas separados
- Patrones multi-tenant

### Trabajar con la Base de Datos
→ **[docs/schemas/](./schemas/)**
- Schema `core`: Foundation multi-tenant
- Schema `marketing`: Blog, KB, leads
- Schema `crm`: CRM multi-tenant B2B
- Futuros schemas planificados

### Implementar una Feature
→ **[docs/features/](./features/)**
- Sistema de gestión de páginas
- Admin panel setup
- Update notifications
- Ejemplos de implementación

### Diseñar un Componente
→ **[docs/design/](./design/)**
- Checklist de diseño
- Sistema de colores
- Tipografía (3 fuentes)
- Componentes reutilizables

### Usar un Package
→ **[docs/packages/](./packages/)** + READMEs en `/packages/*`
- @tupatrimonio/assets
- @tupatrimonio/ui (iconos, tipografía)
- @tupatrimonio/utils
- @tupatrimonio/location

### Deployar a Producción
→ **[docs/deployment/](./deployment/)**
- Guía general de deployment
- Configuración de Vercel
- Variables de entorno

### Revisar Términos Legales
→ **[docs/legal/](./legal/)**
- Términos y condiciones
- Políticas (futuro)

### Buscar Documentación Histórica
→ **[docs/archived/](./archived/)**
- Roadmap completo (PLAN_DE_ACCION.md)
- Sesiones de desarrollo
- Guías obsoletas

---

## 🗺️ Por Tipo de Documento

### Guías Principales (Leer Primero)
1. `/README.md` - Presentación del proyecto
2. `docs/README.md` - Índice de documentación
3. `docs/DEVELOPMENT.md` - Setup y desarrollo
4. `docs/ARCHITECTURE.md` - Arquitectura general

### Documentación de Schemas (Base de Datos)
- `docs/schemas/README.md` - Overview
- `docs/schemas/ARCHITECTURE-SCHEMAS.md` - Filosofía
- `docs/schemas/crm.md` - Schema CRM
- Futuros: `marketing.md`, `core.md`, etc.

### Guías de Implementación
- `docs/features/page-management.md`
- `docs/features/admin-setup.md`
- `docs/features/USERS-COUNT-IMPLEMENTATION.md`
- `docs/features/update-notifications/`

### Guías de Diseño
- `docs/design/checklist.md` - Checklist
- `docs/design/typography.md` - Tipografía
- `docs/design/improvements.md` - Mejoras
- `packages/ui/ICONS-GUIDE.md` - Iconos
- `packages/ui/TYPOGRAPHY-GUIDE.md` - Tipografía detallada

### Guías de Deployment
- `docs/deployment/guide.md` - General
- `docs/deployment/vercel.md` - Vercel específico

---

## 🔍 Por Pregunta Frecuente

| Pregunta | Documento |
|----------|-----------|
| ¿Cómo inicio el proyecto? | `docs/DEVELOPMENT.md` |
| ¿Qué schema usar para X? | `docs/schemas/ARCHITECTURE-SCHEMAS.md` |
| ¿Cómo implementar el CRM? | `docs/schemas/crm.md` |
| ¿Qué colores usar? | `docs/design/checklist.md` |
| ¿Cómo usar iconos? | `packages/ui/ICONS-GUIDE.md` |
| ¿Cómo deployar? | `docs/deployment/guide.md` |
| ¿Dónde está el roadmap? | `docs/archived/PLAN_DE_ACCION.md` |
| ¿Cómo funciona multi-tenancy? | `docs/schemas/ARCHITECTURE-SCHEMAS.md` |
| ¿Cómo crear un admin? | `docs/features/admin-users-setup.md` |
| ¿Cómo funciona el blog? | `docs/features/admin-setup.md` |

---

## 📱 Por Aplicación

### Marketing App (`apps/marketing`)
- General: `docs/DEVELOPMENT.md`
- Diseño: `docs/design/`
- Componentes específicos: `apps/marketing/src/components/landing-sections/README.md`
- Utils: `apps/marketing/src/lib/README.md`

### Web App (`apps/web`)
- General: `docs/DEVELOPMENT.md`
- PWA: `docs/archived/pwa/`
- Admin: `docs/features/admin-setup.md`
- Icons PWA: `apps/web/public/icons/README.md`

### Packages
- Assets: `packages/assets/README.md` + `docs/packages/assets.md`
- UI: `packages/ui/ICONS-GUIDE.md` + `packages/ui/TYPOGRAPHY-GUIDE.md`
- Utils: `packages/utils/README.md`
- Location: `packages/location/` (usar código como referencia)

---

## 🚀 Shortcuts (Más Usados)

```bash
# Setup proyecto
docs/DEVELOPMENT.md → Sección "Setup"

# Ver estructura de BD
docs/schemas/ARCHITECTURE-SCHEMAS.md → Diagrama de schemas

# Implementar CRM
docs/schemas/crm.md → Guía completa

# Colores y diseño
docs/design/checklist.md → Todo lo visual

# Deploy
docs/deployment/vercel.md → Config Vercel
```

---

## 📞 ¿No Encuentras Algo?

1. Revisa **`docs/README.md`** - Índice completo
2. Busca en **`docs/archived/`** - Puede ser histórico
3. Revisa READMEs de packages - Puede ser específico del package
4. Usa búsqueda global: `grep -r "término" docs/`

---

**Última actualización**: 12 de Noviembre 2025  
**Total de documentos**: 70+ archivos organizados

