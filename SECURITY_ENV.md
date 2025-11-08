# 🔐 Environment Variables & Security Guide

## 📋 Overview

Este proyecto usa múltiples archivos `.env` para diferentes contextos. **NUNCA** commitees archivos `.env` reales al repositorio.

## 📁 Archivos de Entorno

### Root Level

- `.env` - Variables compartidas para Docker Compose (postgres, redis) ❌ NEVER COMMIT
- `.env.example` - Template público sin valores reales ✅ Safe to commit

### Backend

- `backend/.env` - Desarrollo local ❌ NEVER COMMIT
- `backend/.env.docker` - Producción en Docker ❌ NEVER COMMIT
- `backend/.env.example` - Template para desarrollo ✅ Safe to commit
- `backend/.env.prod.example` - Template para producción ✅ Safe to commit

### Analytics

- `analytics/.env` - Variables del servicio analytics ❌ NEVER COMMIT
- `analytics/.env.example` - Template público ✅ Safe to commit

## 🔒 Variables Sensibles (NUNCA en .example)

### Credenciales de Base de Datos

- `POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- `DATABASE_URL` - URL completa con credenciales

### Blockchain & Web3

- `PRIVATE_KEY` - Llave privada de wallets
- `ETH_RPC_URL` - URLs con API keys (Infura/Alchemy)

### Autenticación

- `JWT_SECRET` - Secreto para tokens JWT
- `ANALYTICS_WEBHOOK_TOKEN` - Token de autenticación webhooks

### Claves de APIs

- Cualquier API key de servicios externos

## ✅ Variables No Sensibles (OK en .example)

- `PORT` - Puertos de servicios
- `NODE_ENV` - Ambiente (development/production)
- `CONFIRMATIONS` - Parámetros de configuración
- `THROTTLE_TTL`, `THROTTLE_LIMIT` - Rate limiting configs
- `SCHEDULE_MINUTES` - Intervalos de tareas
- Feature flags (`USE_IQR`, `USE_ZSCORE`, etc.)

## 🚀 Setup Instructions

### Desarrollo Local

1. **Backend**

```bash
cp backend/.env.example backend/.env
# Edita backend/.env con tus valores reales
```

2. **Analytics**

```bash
cp analytics/.env.example analytics/.env
# Edita analytics/.env con tus valores reales
```

3. **Root**

```bash
cp .env.example .env
# Edita .env con credenciales de postgres
```

### Producción (Docker)

1. **Backend Docker**

```bash
cp backend/.env.prod.example backend/.env.docker
# Edita backend/.env.docker con valores de producción
# IMPORTANTE: Usa contraseñas fuertes diferentes a desarrollo
```

2. **Sincroniza Tokens**
   Asegúrate que estos valores coincidan:

- `ANALYTICS_WEBHOOK_TOKEN` en `backend/.env.docker`
- `ANALYTICS_WEBHOOK_TOKEN` en `analytics/.env`

## 🛡️ Protección con .gitignore

El `.gitignore` está configurado para **NUNCA** commitear:

```
.env
**/.env
.env.*
**/.env.*
.env.local
**/.env.local
.env.docker
**/.env.docker
```

Pero **SÍ** permite:

```
!.env.example
!**/.env.example
!.env.prod.example
!**/.env.prod.example
```

## 🐳 Protección con .dockerignore

Cada servicio tiene `.dockerignore` para excluir secretos del contexto de build:

```
.env
.env.*
*.env
*.pem
*.key
*.crt
secrets.json
```

## ⚠️ Checklist de Seguridad

Antes de hacer commit:

- [ ] Verifica que NO hay archivos `.env` reales en stage

  ```bash
  git status | grep "\.env"
  ```

- [ ] Confirma que `.env.example` NO tiene valores reales

  ```bash
  # Busca passwords, API keys, tokens reales
  grep -r "18034783\|super-secret\|0x04a7912" backend/.env.example analytics/.env.example .env.example
  # Este comando NO debe retornar nada
  ```

- [ ] Verifica que `.gitignore` está funcionando
  ```bash
  git check-ignore backend/.env analytics/.env .env
  # Debe retornar los 3 archivos
  ```

## 🔄 Rotación de Secretos

Si accidentalmente commiteas un secreto:

1. **Inmediatamente** rota el secreto (cambia contraseñas, regenera tokens)
2. Usa `git filter-branch` o BFG Repo-Cleaner para remover del historial
3. Force push después de limpiar historial
4. Notifica al equipo para que hagan `git pull --force`

## 📞 Soporte

Si tienes dudas sobre qué commitear o no:

- ✅ Valores de ejemplo como `your_password`, `CHANGE_ME`
- ✅ Configuración numérica (puertos, timeouts, thresholds)
- ✅ Feature flags booleanas
- ❌ API keys reales
- ❌ Contraseñas reales
- ❌ Private keys
- ❌ Tokens de autenticación

**Regla de oro**: Si no estás 100% seguro, NO lo commitees.
