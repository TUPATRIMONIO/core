# Troubleshooting - @tupatrimonio/assets

## ❌ Error: "Module not found: Can't resolve '../public/images/logo/...'"

### Problema
```
Build Error
Module not found: Can't resolve '../public/images/logo/Imagotipo.webp'
```

### Causa
Next.js necesita configuración adicional para resolver imports de imágenes desde packages del monorepo.

### Solución

**1. Verificar que el package esté compilado:**
```bash
cd packages/assets
npm run build
```

**2. Configurar Next.js en cada app:**

Agregar a `apps/marketing/next.config.ts` y `apps/web/next.config.ts`:

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Transpilar packages del monorepo
  transpilePackages: ['@tupatrimonio/assets'],
  
  // Configurar webpack para resolver archivos desde packages
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tupatrimonio/assets/public': path.resolve(__dirname, '../../packages/assets/public'),
    };
    return config;
  },
  // ... resto de configuración
};

export default nextConfig;
```

**3. Reinstalar dependencias:**
```bash
# Desde la raíz del proyecto
npm install
```

**4. Limpiar cache de Next.js:**
```bash
cd apps/marketing
rm -rf .next
npm run dev
```

---

## ❌ Error: "Cannot find module '@tupatrimonio/assets'"

### Solución

```bash
# Desde la raíz del proyecto
npm install
```

---

## ❌ Error: TypeScript no reconoce tipos de imágenes

### Problema
```
Cannot find module '../../public/images/logo/Imagotipo.webp' or its corresponding type declarations.
```

### Solución

El package incluye type definitions en `src/types/images.d.ts`. Verifica que el package esté compilado:

```bash
cd packages/assets
npm run build
```

---

## ❌ Imagen no se carga en desarrollo

### Verificar estructura:

```bash
# Verificar que la imagen existe
ls packages/assets/public/images/logo/Imagotipo.webp

# Verificar que el componente está compilado
ls packages/assets/dist/components/ImagotipoImage.js
```

### Verificar configuración:

1. ✅ `transpilePackages` incluye `@tupatrimonio/assets`
2. ✅ `webpack.resolve.alias` apunta a la carpeta public correcta
3. ✅ El import usa el path correcto: `../../public/images/logo/Imagotipo.webp`

---

## 📝 Checklist de Configuración

- [ ] Package compilado (`packages/assets/dist/` existe)
- [ ] Imagen existe en `packages/assets/public/images/logo/`
- [ ] `next.config.ts` incluye `transpilePackages`
- [ ] `next.config.ts` incluye configuración de webpack
- [ ] Dependencias instaladas (`npm install` en raíz)
- [ ] Cache limpiado (`.next/` eliminado)

---

## 🆘 Si nada funciona

1. Eliminar todos los `node_modules` y `.next`:
```bash
# Desde la raíz
rm -rf node_modules packages/*/node_modules apps/*/node_modules apps/*/.next
npm install
```

2. Recompilar el package:
```bash
cd packages/assets
npm run build
```

3. Iniciar en modo desarrollo:
```bash
cd apps/marketing
npm run dev
```

---

## 📚 Recursos

- [Next.js Transpile Packages](https://nextjs.org/docs/app/api-reference/next-config-js/transpilePackages)
- [Next.js Webpack Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [Monorepo with Next.js](https://turbo.build/repo/docs/handbook/sharing-code/internal-packages)

---

**Última actualización**: Noviembre 2024

