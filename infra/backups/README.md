# Postgres Backups

This directory stores database backups created by `scripts/pg-backup.sh`.

## Usage

### Create a Backup

```bash
# Auto-generated name with timestamp
./scripts/pg-backup.sh

# Custom name
./scripts/pg-backup.sh my-backup-name
```

### Restore a Backup

```bash
./scripts/pg-restore.sh postgres-backup-20250109-123456.sql.gz
```

## Backup Strategy

- **Frequency**: Manual or scheduled via cron
- **Retention**: Keep at least 7 days of daily backups
- **Format**: `.sql.gz` (compressed SQL dump)
- **Location**: This directory (`infra/backups/`)

## Automated Backups (Optional)

Add to crontab for daily backups at 2 AM:

```bash
0 2 * * * cd /path/to/creator-split-paywall && ./scripts/pg-backup.sh >> /var/log/pg-backup.log 2>&1
```

## Storage Management

Delete old backups manually:

```bash
# Keep only last 7 backups
ls -t infra/backups/*.sql.gz | tail -n +8 | xargs rm -f
```

## Notes

- Backups use `pg_dump` with `--clean` and `--if-exists` flags
- Restores will **drop and recreate** all database objects
- Services (backend/analytics) are stopped during restore to prevent connection conflicts
