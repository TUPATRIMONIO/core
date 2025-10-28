# 🏗️ Decisiones Arquitectónicas - TuPatrimonio

## Monorepo Structure

### ¿Por qué Monorepo?
- **Código compartido**: Packages de location y UI reutilizables
- **Consistencia**: Same stack en marketing y web app
- **Deployment simplificado**: Una configuración para todo
- **Desarrollo eficiente**: Cambios en packages afectan ambas apps

### Apps Separation
```
apps/marketing/    # SEO, landing pages, blog (público)
apps/web/         # Dashboard, auth, funcionalidad (privado)
```

**Ventajas:**
- **SEO independiente**: Marketing optimizado para conversión
- **Performance**: Web app optimizada para funcionalidad
- **Deploy independiente**: Diferentes estrategias si se necesita
- **Teams**: Equipos pueden trabajar independientemente

## 🌍 Sistema de Ubicación

### Sistema de Detección de Ubicación
**Alternativas evaluadas:**
- ❌ **APIs terceros**: Límites, costos, dependencias
- ❌ **Solo navegador**: Menos preciso (~70%)
- ✅ **Vercel Edge + Browser**: Preciso y sin límites

### Estrategia Híbrida
```
1. Vercel Geo Detection (headers automáticos)
   ↓ fallback si falla
2. Browser Detection (zona horaria, idioma)
   ↓ fallback si falla  
3. Default to Chile
```

### URLs por País en Marketing
**¿Por qué?**
- **SEO**: Cada país tiene metadata específica
- **Localización**: Precios, regulaciones, contenido local
- **Analytics**: Segmentación clara por país
- **UX**: Usuario sabe inmediatamente su contexto

**Alternativas descartadas:**
- Query params (`?country=cl`) - Peor SEO
- Subdomains (`cl.tupatrimonio.app`) - Más complejo
- Single page con detección - Menos localizable

## 🎨 Design System

### ¿Por qué Sistema Dual de Colores?
**Problema original:** Todo en vino (#800039) → Sobresaturación visual

**Solución implementada:**
- **Gris neutro** (#404040) para botones funcionales
- **Vino de marca** (#800039) para elementos de identidad

**Resultado:**
- ✅ **Jerarquía clara**: Usuario sabe qué es importante
- ✅ **Marca reforzada**: Vino solo en elementos clave
- ✅ **UX mejorada**: Botones menos agresivos visualmente

### ¿Por qué Centralizar globals.css?
**Antes:** 2 archivos idénticos (494 líneas duplicadas)
**Después:** 1 archivo centralizado en `packages/ui/`

**Ventajas:**
- **Single source of truth**
- **Cambios automáticos** en ambas apps
- **Imposible desincronización**
- **Mantenimiento simplificado**

## 📦 Package Strategy

### packages/location
**Responsabilidad:** Todo lo relacionado con ubicación
```typescript
LocationManager      # Detección híbrida
useLocation         # Hook React
CountrySelector     # UI component
CountryConfig       # Configuración países
```

**¿Por qué separado?**
- Lógica compleja y específica
- Reutilizable entre apps
- Testing independiente
- Escalable para nuevos países

### packages/ui  
**Responsabilidad:** Estilos y sistema de diseño
```
globals.css         # Variables CSS centralizadas
index.js           # Future: componentes UI compartidos
```

**Futuro:** Componentes UI compartidos (Button, Input, etc.)

## 🔄 Deployment Strategy

### ¿Por qué Vercel?
- **Edge Functions integradas** con Next.js
- **Headers automáticos** de geolocalización
- **Deploy automático** desde GitHub
- **CDN global** con baja latencia
- **Build automático** desde git
- **Preview deploys** para branches

### Build Process
```
1. npm run build:location     # Compila packages TypeScript
2. npm run build:marketing    # Next.js build con packages
3. Vercel deploys             # Edge + Middleware + Static
```

## 🎯 Performance Considerations

### Code Splitting
- **Marketing app**: Optimizada para SEO y conversión
- **Web app**: Optimizada para interactividad y funcionalidad
- **Packages**: Solo cargan cuando se necesitan

### Caching Strategy  
- **Edge Functions**: Cero latencia adicional
- **IP Detection**: Cacheada 5 minutos
- **Country preference**: Persistent en localStorage 24h
- **Static assets**: CDN caching automático

## 🔮 Future Considerations

### Scaling to More Countries
- Agregar en `CountryConfig.ts`
- Crear páginas específicas
- Actualizar Edge Functions
- Traducir contenido

### Potential Optimizations
- **Server Components**: Migrar location detection a server
- **Streaming**: Progressive rendering por país
- **A/B Testing**: Different layouts por país
- **Analytics**: Enhanced tracking per location

### Technical Debt
- **Workspace setup**: Mejorar configuración npm workspaces
- **Build optimization**: Parallel building de packages
- **Type safety**: Strict TypeScript en packages

---

**Arquitectura diseñada para escalar internacionalmente mientras mantiene performance y UX óptimas** 🚀
