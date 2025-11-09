# 🔐 Environment Variables & Security Guide

## 📋 Overview

This project uses multiple `.env` files for different contexts. **NEVER** commit real `.env` files to the repository.

## 📁 Environment Files

### Root Level

- `.env` - Shared variables for Docker Compose (postgres, redis) ❌ NEVER COMMIT
- `.env.example` - Public template without real values ✅ Safe to commit

### Backend

- `backend/.env` - Local development ❌ NEVER COMMIT
- `backend/.env.docker` - Production in Docker ❌ NEVER COMMIT
- `backend/.env.example` - Development template ✅ Safe to commit
- `backend/.env.prod.example` - Production template ✅ Safe to commit

### Analytics

- `analytics/.env` - Analytics service variables ❌ NEVER COMMIT
- `analytics/.env.example` - Public template ✅ Safe to commit

## 🔒 Sensitive Variables (NEVER in .example)

### Database Credentials

- `POSTGRES_PASSWORD` - PostgreSQL password
- `DATABASE_URL` - Complete URL with credentials

### Blockchain & Web3

- `PRIVATE_KEY` - Wallet private keys
- `ETH_RPC_URL` - URLs with API keys (Infura/Alchemy)

### Authentication

- `JWT_SECRET` - Secret for JWT tokens
- `ANALYTICS_WEBHOOK_TOKEN` - Webhook authentication token

### API Keys

- Any API key from external services

## ✅ Non-Sensitive Variables (OK in .example)

- `PORT` - Service ports
- `NODE_ENV` - Environment (development/production)
- `CONFIRMATIONS` - Configuration parameters
- `THROTTLE_TTL`, `THROTTLE_LIMIT` - Rate limiting configs
- `SCHEDULE_MINUTES` - Task intervals
- Feature flags (`USE_IQR`, `USE_ZSCORE`, etc.)

## 🚀 Setup Instructions

### Local Development

1. **Backend**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your real values
```

2. **Analytics**

```bash
cp analytics/.env.example analytics/.env
# Edit analytics/.env with your real values
```

3. **Root**

```bash
cp .env.example .env
# Edit .env with postgres credentials
```

### Production (Docker)

1. **Backend Docker**

```bash
cp backend/.env.prod.example backend/.env.docker
# Edit backend/.env.docker with production values
# IMPORTANT: Use strong passwords different from development
```

2. **Synchronize Tokens**
   Make sure these values match:

- `ANALYTICS_WEBHOOK_TOKEN` in `backend/.env.docker`
- `ANALYTICS_WEBHOOK_TOKEN` in `analytics/.env`

## 🛡️ Protection with .gitignore

The `.gitignore` is configured to **NEVER** commit:

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

But **DOES** allow:

```
!.env.example
!**/.env.example
!.env.prod.example
!**/.env.prod.example
```

## 🐳 Protection with .dockerignore

Each service has `.dockerignore` to exclude secrets from build context:

```
.env
.env.*
*.env
*.pem
*.key
*.crt
secrets.json
```

## ⚠️ Security Checklist

Before committing:

- [ ] Verify there are NO real `.env` files in stage

  ```bash
  git status | grep "\.env"
  ```

- [ ] Confirm that `.env.example` does NOT have real values

  ```bash
  # Search for passwords, API keys, real tokens
  grep -r "18034783\|super-secret\|0x04a7912" backend/.env.example analytics/.env.example .env.example
  # This command should return nothing
  ```

- [ ] Verify that `.gitignore` is working
  ```bash
  git check-ignore backend/.env analytics/.env .env
  # Should return all 3 files
  ```

## 🔄 Secret Rotation

If you accidentally commit a secret:

1. **Immediately** rotate the secret (change passwords, regenerate tokens)
2. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
3. Force push after cleaning history
4. Notify the team to do `git pull --force`

## 📞 Support

If you have doubts about what to commit or not:

- ✅ Example values like `your_password`, `CHANGE_ME`
- ✅ Numeric configuration (ports, timeouts, thresholds)
- ✅ Boolean feature flags
- ❌ Real API keys
- ❌ Real passwords
- ❌ Private keys
- ❌ Authentication tokens

**Golden rule**: If you're not 100% sure, DON'T commit it.
