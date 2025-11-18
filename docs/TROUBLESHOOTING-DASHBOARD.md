# Troubleshooting Dashboard - Solución de Problemas

## ⚠️ Problema: "Dashboard se ve súper mal"

### Causas Posibles

1. **Estilos no cargados** - Variables CSS faltantes
2. **Dark mode conflicto** - Tema no inicializado
3. **Layout roto** - Sidebar no renderiza bien

---

## ✅ SOLUCIONES RÁPIDAS

### Solución 1: Verificar Archivo de Estilos

Verifica que existe: `apps/web/src/app/globals.css`

Si el dashboard se ve sin estilos, ejecuta:

```bash
# Rebuild
npm run build:web

# Restart dev server
# Ctrl+C (detener)
npm run dev
```

### Solución 2: Forzar Refresh Completo

En el navegador:
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

Esto limpia el caché y recarga todos los estilos.

### Solución 3: Verificar Dark Mode

Si ves colores extraños, puede ser problema de dark mode.

Abre DevTools (F12) → Console → Ejecuta:

```javascript
localStorage.setItem('theme', 'light');
window.location.reload();
```

---

## 🔍 Problema: Error "next/headers" en Navigation

### Error Completo:
```
You're importing a component that needs "next/headers". 
That only works in a Server Component
```

### Causa:
El layout del dashboard es un Server Component, pero algo está intentando usar client-side navigation incorrectamente.

### Solución:

El error debería haberse resuelto con el try-catch que agregué. Si persiste:

1. **Limpia cache de Next.js**:
```bash
# Detener servidor
# Eliminar .next
rm -rf apps/web/.next
# O en Windows:
Remove-Item -Recurse -Force "apps\web\.next"

# Reiniciar
npm run dev
```

2. **Verifica que estás en la carpeta correcta**:
```bash
# El dashboard DEBE estar en:
apps/web/src/app/dashboard/

# NO en:
apps/web/src/pages/dashboard/
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Marca lo que funciona:

```bash
# [ ] 1. Dashboard carga sin error 404
http://localhost:3000/dashboard

# [ ] 2. Sidebar visible con links
# [ ] 3. Sección CRM visible (si tienes acceso)
# [ ] 4. Header con logo y logout funcionan
# [ ] 5. Estilos se ven correctamente (no todo blanco/negro)
# [ ] 6. Puedes navegar entre secciones
```

---

## 🎨 Si el Dashboard se ve Mal Visualmente

### Problema: Todo Blanco o Sin Estilos

**Causa**: Tailwind no compiló o variables CSS no cargadas

**Solución**:
```bash
cd apps/web
npm run build
npm run dev
```

### Problema: Colores Extraños

**Causa**: Dark mode activado pero estilos no adaptados

**Solución**: Cambiar a light mode:
```javascript
// En DevTools Console:
localStorage.setItem('theme', 'light');
location.reload();
```

### Problema: Layout Roto (Sidebar sobre contenido)

**Causa**: Conflicto de estilos flex

**Solución**: Ya está corregido en el layout con `min-h-[calc(100vh-200px)]`

---

## 🔧 Rebuild Completo

Si nada funciona, rebuild completo:

```bash
# 1. Detener servidor (Ctrl+C)

# 2. Limpiar todo
cd "D:\Aplicaciones-Desarrollos\TuPatrimonio Apps\tupatrimonio-app"
Remove-Item -Recurse -Force "apps\web\.next"
Remove-Item -Recurse -Force "apps\web\node_modules\.cache"

# 3. Reinstalar (solo si es necesario)
npm install

# 4. Build
npm run build:web

# 5. Dev
npm run dev
```

---

## 🎯 NAVEGACIÓN CORRECTA

Una vez que el dashboard cargue correctamente:

```
Dashboard Principal
├── /dashboard → Inicio
├── /dashboard/crm → Dashboard CRM
│   ├── /dashboard/crm/contacts → Contactos
│   ├── /dashboard/crm/companies → Empresas
│   ├── /dashboard/crm/deals → Negocios
│   ├── /dashboard/crm/tickets → Tickets
│   ├── /dashboard/crm/products → Productos
│   ├── /dashboard/crm/quotes → Cotizaciones
│   └── /dashboard/crm/emails → Emails
└── /dashboard/blog → Admin Blog (si eres admin)
```

---

## 📸 Cómo Debería Verse

### Sidebar (Lado Izquierdo):
```
┌─────────────────────┐
│ TuPatrimonio        │
│ Dashboard           │
├─────────────────────┤
│ Inicio              │
│                     │
│ CRM (si tienes)     │
│ • Dashboard CRM     │
│ • Contactos [0]     │
│ • Empresas          │
│ • Negocios          │
│ • Tickets           │
│ • Productos         │
│ • Cotizaciones      │
│ • Emails            │
│                     │
│ Administración      │
│ • Blog              │
│ • Páginas           │
└─────────────────────┘
```

### Header (Arriba):
```
TuPatrimonio Dashboard | Ver Sitio → | tu@email.com | Salir
```

---

## 💡 SOLUCIÓN RÁPIDA

Si solo quieres que funcione YA:

```bash
# 1. Detener servidor (Ctrl+C)
# 2. Eliminar cache:
Remove-Item -Recurse -Force "apps\web\.next"
# 3. Reiniciar:
npm run dev
# 4. Ir a: http://localhost:3000/dashboard/crm
# 5. Hard refresh: Ctrl + Shift + R
```

---

## 🆘 Si Nada Funciona

Comparte:
1. Screenshot del dashboard "mal"
2. Mensaje de error completo de la consola
3. URL exacta donde estás

Y te ayudo específicamente con ese problema.

---

**Ejecuta la "Solución Rápida" de arriba y dime si mejora.**









