#!/usr/bin/env bash
# Find the phone's wireless-debugging port by itself and connect to it.
#
# Android rotates the adb-tls-connect port every time wireless debugging
# restarts, so hard-coding it means asking for the port again every session.
# Order of attempts, cheapest first:
#   1. already attached?          -> done
#   2. last known host:port       -> ~/.mitro-adb-target
#   3. mDNS (_adb-tls-connect)    -> adb mdns services
#   4. port sweep on the known IP -> nmap, else a bash /dev/tcp fallback
#
# Prints the connected "host:port" on success; exits 1 if nothing answered.
set -uo pipefail

CACHE="$HOME/.mitro-adb-target"

attached() { adb devices | awk 'NR>1 && $2=="device" {print $1; exit}'; }
save() { printf '%s\n' "$1" > "$CACHE"; }

try() {
  local target="${1:-}"
  [ -z "$target" ] && return 1
  adb connect "$target" >/dev/null 2>&1
  sleep 1
  adb devices | grep -q "^${target}[[:space:]]\+device$"
}

cur="$(attached)"
if [ -n "$cur" ]; then echo "$cur"; save "$cur"; exit 0; fi

if [ -f "$CACHE" ] && try "$(cat "$CACHE")"; then cat "$CACHE"; exit 0; fi

adb mdns check >/dev/null 2>&1
mdns="$(adb mdns services 2>/dev/null | awk '/_adb-tls-connect/ {print $3; exit}')"
if try "$mdns"; then echo "$mdns"; save "$mdns"; exit 0; fi

host="$(sed 's/:.*//' "$CACHE" 2>/dev/null)"
if [ -z "$host" ]; then
  echo "no known phone IP yet — connect once manually and this remembers it" >&2
  exit 1
fi

if command -v nmap >/dev/null 2>&1; then
  for p in $(nmap -Pn -p 30000-49999 --open -T4 "$host" 2>/dev/null |
             awk -F/ '/^[0-9]+\/tcp/ {print $1}'); do
    if try "$host:$p"; then echo "$host:$p"; save "$host:$p"; exit 0; fi
  done
else
  for base in $(seq 30000 500 49500); do
    open=$(
      for p in $(seq "$base" $((base + 499))); do
        ( timeout 0.2 bash -c "exec 3<>/dev/tcp/$host/$p" 2>/dev/null && echo "$p" ) &
      done
      wait
    )
    for p in $open; do
      if try "$host:$p"; then echo "$host:$p"; save "$host:$p"; exit 0; fi
    done
  done
fi

echo "could not reach the phone on $host" >&2
exit 1
