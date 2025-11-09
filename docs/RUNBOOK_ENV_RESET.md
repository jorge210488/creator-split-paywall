# Runbook: Local Environment Reset

## Goal

Return local environment to a clean baseline (DB, Redis, artifacts).

## Steps

1. Stop all services: `docker-compose down`.
2. Remove volumes (CAUTION – data loss):
   ```bash
   docker volume ls | grep creator-split | awk '{print $2}' | xargs -r docker volume rm
   ```
3. Clear local Redis (if external):
   ```bash
   redis-cli FLUSHALL
   ```
4. Remove generated contract artifacts if needed:
   ```bash
   cd contracts && rm -rf artifacts cache
   npx hardhat compile
   ```
5. Recreate env files from examples (`cp .env.example .env` in each package).
6. Start stack: `docker-compose up --build`.
7. (Optional) Re-run E2E: `bash scripts/test-all.sh http://localhost:3000`.

## Verification

- Backend `/health` returns 200
- Contract events ingest from expected start block
- Analytics begins scheduled anomaly scans
