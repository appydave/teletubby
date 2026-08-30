#!/usr/bin/env bash
# Teletubby app control — start the app DETACHED so it outlives the shell that
# launched it (an agent session, a terminal you close).
#
# Why overmind and not `npm run dev &`: overmind runs the process under a tmux
# server that reparents to launchd, so nothing in the launching session's
# process group can take the app down with it. `overmind quit` is the only
# thing that stops it. Verified by reading the ancestry, not by assuming it.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SOCK="./.overmind.sock"
LOG=".logs/app.log"   # the Procfile tees into this; overmind echo blocks forever
READY_TIMEOUT=60   # electron-vite cold build + Electron boot

# The ONLY proof the app is up. control.json survives a crash with a dead pid
# in it, so its existence proves nothing.
healthy() { node bin/teletubby.mjs health >/dev/null 2>&1; }

daemon_up() { [ -S "$SOCK" ] && overmind ps >/dev/null 2>&1; }

clear_stale_socket() {
  if [ -e "$SOCK" ] && ! daemon_up; then
    echo "  (clearing stale $SOCK from a previous run)"
    rm -f "$SOCK"
  fi
}

cmd_start() {
  if healthy; then
    echo "Already running and healthy — nothing to do."
    cmd_status
    return 0
  fi

  clear_stale_socket
  mkdir -p "$(dirname "$LOG")"

  if daemon_up; then
    echo "Overmind is up but the app is not answering yet; waiting."
  else
    echo "Starting Teletubby (detached)…"
    # -N: don't let overmind inject $PORT. This app pins 7110/7111 itself.
    # Its banner is noise; keep it only to explain a failure.
    local banner
    if ! banner=$(overmind start -D -N 2>&1); then
      echo "overmind failed to start:"
      echo "$banner" | sed 's/^/  /'
      return 1
    fi
  fi

  printf "Waiting for the control surface"
  for _ in $(seq 1 "$READY_TIMEOUT"); do
    if healthy; then
      echo " — up."
      cmd_status
      return 0
    fi
    if ! daemon_up; then
      echo
      echo "The process died during startup. Logs:"
      cmd_logs_tail
      return 1
    fi
    printf "."
    sleep 1
  done

  echo
  echo "Started, but did NOT become healthy within ${READY_TIMEOUT}s."
  echo "The process is still running — this is a slow or broken boot, not a clean failure. Logs:"
  cmd_logs_tail
  return 1
}

cmd_stop() {
  if ! daemon_up; then
    clear_stale_socket
    echo "Not running."
    return 0
  fi
  echo "Stopping…"
  overmind quit >/dev/null 2>&1
  for _ in $(seq 1 15); do
    daemon_up || { echo "Stopped."; clear_stale_socket; return 0; }
    sleep 1
  done
  echo "Did not stop gracefully; killing."
  overmind kill >/dev/null 2>&1
  clear_stale_socket
}

cmd_status() {
  if healthy; then
    echo "health: UP"
    node bin/teletubby.mjs health
  else
    echo "health: DOWN (control surface on 7111 is not answering)"
  fi
  if daemon_up; then
    echo "processes:"
    overmind ps
  else
    echo "processes: overmind is not running"
  fi
}

# A SNAPSHOT that returns. Never use `overmind echo` for this: it follows the
# stream forever, and there is no `timeout` on macOS to bound it. The Procfile
# tees into $LOG precisely so a bounded read is possible.
cmd_logs_tail() {
  if [ ! -f "$LOG" ]; then echo "  (no log at $LOG yet)"; return 0; fi
  tail -n 40 "$LOG"
}

case "${1:-start}" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_stop; cmd_start ;;
  status)  cmd_status ;;
  logs)    [ -f "$LOG" ] && tail -f "$LOG" || echo "No log at $LOG — has it been started?" ;;
  tail)    cmd_logs_tail ;;
  *) echo "usage: scripts/app.sh {start|stop|restart|status|logs|tail}"; exit 2 ;;
esac
