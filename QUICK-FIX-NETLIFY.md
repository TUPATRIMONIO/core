# 🛠️ SOLUCIÓN RÁPIDA - Site 2 (Web App) No Funciona

## ❌ Problema Actual
`app.tupatrimonio.app` está mostrando la marketing app en lugar de la web app.

## ✅ SOLUCIÓN INMEDIATA

### En Netlify Dashboard del Site 2 (app.tupatrimonio.app):

#### 1. Site Settings > Build & deploy
- **Build command**: `npm run build:web`
- **Publish directory**: `apps/web/.next`
- **Base directory**: `/`

#### 2. Environment variables
Agregar esta variable CRÍTICA:
```
CONTEXT=web
```

#### 3. Deploy contexts (Opcional pero recomendado)
- **Branch**: `main` → **Context**: `web`

#### 4. Redeploy
- **Deploys** → **Trigger deploy** → **Deploy site**

## 🔧 ALTERNATIVA: Override Manual

Si lo anterior no funciona, en **Site Settings**:

```
Build command: npm run build:web
Publish directory: apps/web/.next
Functions directory: [vacío - no necesita functions]
```

## 📋 Verificación

Después del deploy, **app.tupatrimonio.app** debe mostrar:
- ✅ `/` → Redirect a `/login`
- ✅ `/login` → Formulario de login
- ✅ `/dashboard` → Dashboard (requiere auth)

**NO debe mostrar** landing pages de marketing.

## ⚡ Por Qué Pasó

El `netlify.toml` tiene configuración por **context**, pero el Site 2 no está usando el context `web`. Por defecto usa la configuración principal (marketing).

---

**La configuración en netlify.toml ya está lista. Solo falta configurar el Site 2 correctamente.** 🎯
