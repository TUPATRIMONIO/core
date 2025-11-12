# Deployment - TuPatrimonio

Documentación de deployment y configuración de producción.

## 📄 Guías

- **[guide.md](./guide.md)** - Guía completa de deployment (Netlify, DNS, variables de entorno)
- **[vercel.md](./vercel.md)** - Configuración específica de Vercel (headers, redirects, middleware)

## 🌐 Ambientes

### Producción

| App | URL | Platform | Status |
|-----|-----|----------|--------|
| Marketing | https://tupatrimonio.app | Vercel | ✅ Live |
| Web App | https://app.tupatrimonio.app | Vercel | ✅ Live |

### Desarrollo

| App | URL | Puerto |
|-----|-----|--------|
| Marketing | http://localhost:3001 | 3001 |
| Web App | http://localhost:3000 | 3000 |

## 🚀 Deploy Rápido

### Marketing Site
```bash
npm run build:marketing
# Vercel deploy automático desde main branch
```

### Web App
```bash
npm run build:web
# Vercel deploy automático desde main branch
```

## 📋 Verificación Post-Deploy

1. ✅ Lighthouse score > 90
2. ✅ Google Search Console sin errores
3. ✅ Analytics tracking funcionando
4. ✅ Formularios funcionando
5. ✅ Autenticación funcionando (web app)

---

**Última actualización**: 12 de Noviembre 2024
