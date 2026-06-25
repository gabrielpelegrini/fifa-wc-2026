#!/bin/bash
# cron-daemon.sh — Roda o cron de manutenção em loop
# Uso: bash scripts/cron-daemon.sh [intervalo_em_minutos]
# Exemplo: bash scripts/cron-daemon.sh 360  (a cada 6 horas)
#
# Em produção, substituir por crontab:
#   0 */6 * * * cd /path/to/project && python3 scripts/cron-maintenance.py >> /var/log/cron-maintenance.log 2>&1

set -euo pipefail

INTERVAL_MINUTES="${1:-360}"
INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/scripts/cron-daemon.log"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

log "Cron daemon iniciado. Intervalo: ${INTERVAL_MINUTES}min (${INTERVAL_SECONDS}s)"
log "Para parar: kill $$"

while true; do
  log "=== Ciclo de manutenção ==="
  
  cd "$PROJECT_ROOT"
  python3 scripts/cron-maintenance.py >> "$LOG_FILE" 2>&1
  exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    log "ERRO: cron-maintenance.py saiu com código $exit_code"
  else
    log "Ciclo concluído com sucesso"
  fi
  
  log "Próximo ciclo em ${INTERVAL_MINUTES} minutos..."
  sleep "$INTERVAL_SECONDS"
done