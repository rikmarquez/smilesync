# SmileSync - Información Crítica para Claude

⚠️ **IMPORTANTE**: Lee el archivo STATUS.md al inicio de cada sesión para conocer el estado actual del proyecto.

## Información del Proyecto

**Nombre**: SmileSync  
**Propósito**: Sistema de gestión de citas dentales multi-clínica con recordatorios automatizados  
**Objetivo**: Reducir no-shows mediante confirmaciones por WhatsApp/SMS  

## Configuración Técnica

### Base de Datos
- **Proveedor**: Railway PostgreSQL
- **URL**: `postgresql://postgres:myZKEVDbnppIZINvbSEyWWlPRsKQgeDH@trolley.proxy.rlwy.net:31671/smilesync`
- **ORM**: Prisma
- **Arquitectura**: Multi-tenant (campo `organizationId` en todas las tablas)

### Deployment
- **Plataforma**: Railway
- **Tipo**: Monorepo fullstack (Next.js)
- **Build Command**: `prisma generate && prisma db push && next build`
- **Start Command**: `next start`
- **Requiere**: Código precompilado

### Stack Tecnológico
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Autenticación**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI
- **Validación**: Zod
- **Notificaciones**: Twilio/WhatsApp Business API

## Comandos Importantes

```bash
# Desarrollo
npm run dev

# Build para Railway
npm run build

# Base de datos
npx prisma generate
npx prisma db push
npx prisma studio

# Linting (buscar en package.json si existe)
npm run lint
npm run typecheck
```

## Variables de Entorno Necesarias
```
DATABASE_URL=postgresql://postgres:myZKEVDbnppIZINvbSEyWWlPRsKQgeDH@trolley.proxy.rlwy.net:31671/smilesync
NEXTAUTH_SECRET=<generar_random>
NEXTAUTH_URL=https://smilesync.railway.app
TWILIO_ACCOUNT_SID=<twilio_sid>
TWILIO_AUTH_TOKEN=<twilio_token>
```