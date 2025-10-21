# 🏢 TuPatrimonio - Ecosistema de Servicios Legales Digitales

Plataforma multi-tenant B2C + B2B que combina servicios legales tradicionales con IA avanzada.

## 🎯 Características Principales

- **🏠 B2C**: Usuarios individuales con organizaciones personales
- **🏢 B2B**: Empresas con gestión de equipos y colaboración
- **🤖 IA Integrada**: Chatbot inteligente + análisis automático de documentos
- **✍️ Servicios Core**: Firmas electrónicas, verificación de identidad, notaría digital

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router) + TailwindCSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + pgvector)
- **Deploy**: Netlify (automático)
- **IA**: Anthropic Claude + OpenAI (secondary)

## 🚀 Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build
npm run build
```

## 📁 Estructura del Proyecto

```
/src
├── /app            # App Router (Next.js 14+)
├── /components     # Componentes UI (Shadcn/UI)
├── /lib            # Utilidades y configuraciones
└── /hooks          # React hooks personalizados

/supabase
├── /migrations     # Migraciones de base de datos
└── config.toml     # Configuración de Supabase
```

## 📚 Documentación

- **[PLAN_DE_ACCION.md](./PLAN_DE_ACCION.md)**: Plan completo del proyecto, roadmap y estado actual
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**: Variables CSS, paleta de colores y componentes

## 🌐 URLs

- **Marketing**: `https://tupatrimonio.app`
- **Aplicación**: `https://app.tupatrimonio.app`

## ⚙️ Configuración

Ver `PLAN_DE_ACCION.md` para:
- Setup de Supabase
- Variables de entorno
- Configuración de deploy
- Estado actual del desarrollo
