#!/bin/bash
# Compares critical shared environment values between backend/.env.docker and analytics/.env
# Ensures ANALYTICS_WEBHOOK_TOKEN and DATABASE_URL are aligned.
# Usage: ./scripts/validate-env-alignment.sh

set -e

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_ENV="$ROOT_DIR/backend/.env.docker"
ANALYTICS_ENV="$ROOT_DIR/analytics/.env"

if [ ! -f "$BACKEND_ENV" ] || [ ! -f "$ANALYTICS_ENV" ]; then
  echo "Missing env files. Backend: $BACKEND_ENV, Analytics: $ANALYTICS_ENV" >&2
  exit 1
fi

get_val() {
  local file=$1
  local key=$2
  # Grep line starting with key= ignoring comments, then cut
  grep -E "^${key}=" "$file" | tail -n 1 | cut -d '=' -f2-
}

BK_TOKEN=$(get_val "$BACKEND_ENV" ANALYTICS_WEBHOOK_TOKEN)
AN_TOKEN=$(get_val "$ANALYTICS_ENV" ANALYTICS_WEBHOOK_TOKEN)
BK_DB=$(get_val "$BACKEND_ENV" DATABASE_URL)
AN_DB=$(get_val "$ANALYTICS_ENV" DATABASE_URL)

STATUS=0

echo "== Environment Alignment Check =="
echo "Backend token:    ${BK_TOKEN:-<empty>}"
echo "Analytics token:  ${AN_TOKEN:-<empty>}"
if [ "$BK_TOKEN" != "$AN_TOKEN" ]; then
  echo "❌ ANALYTICS_WEBHOOK_TOKEN mismatch"
  STATUS=1
else
  echo "✅ Token matches"
fi

echo "Backend DB URL:   ${BK_DB:-<empty>}"
echo "Analytics DB URL: ${AN_DB:-<empty>}"
if [ "$BK_DB" != "$AN_DB" ]; then
  echo "❌ DATABASE_URL mismatch"
  STATUS=1
else
  echo "✅ Database URL matches"
fi

if [ $STATUS -eq 0 ]; then
  echo "All checked env variables are aligned."
else
  echo "Environment alignment FAILED." >&2
fi

exit $STATUS
