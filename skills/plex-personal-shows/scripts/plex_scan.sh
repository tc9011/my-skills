#!/bin/bash
# Scan a Plex library section, wait for it to settle, then empty the trash.
#
# Emptying the trash is what actually removes shows whose files moved away —
# a scan alone only marks them deleted.
#
#   export PLEX_URL=http://plex.local:32400
#   export PLEX_TOKEN=your-token
#   ./plex_scan.sh 5
set -euo pipefail

SECTION="${1:?usage: plex_scan.sh <sectionId>}"
HOST="${PLEX_URL:?PLEX_URL is not set}"
TOKEN="${PLEX_TOKEN:?PLEX_TOKEN is not set}"
HOST="${HOST%/}"

curl -s -m 15 "$HOST/library/sections/$SECTION/refresh?X-Plex-Token=$TOKEN" \
  -o /dev/null -w "scan triggered: HTTP %{http_code}\n"

settled=0
for i in $(seq 1 60); do
  sleep 5
  state=$(curl -s -m 15 "$HOST/library/sections?X-Plex-Token=$TOKEN" | python3 -c "
import sys, xml.etree.ElementTree as ET
[print(d.get('refreshing')) for d in ET.fromstring(sys.stdin.read()) if d.get('key')=='$SECTION']
" 2>/dev/null || echo "?")
  printf '  [%3ds] refreshing=%s\n' "$((i * 5))" "$state"
  # Require three consecutive idle polls: Plex reports 0 before it starts.
  if [ "$state" = "0" ]; then
    settled=$((settled + 1))
    [ "$settled" -ge 3 ] && break
  else
    settled=0
  fi
done

curl -s -m 60 -X PUT "$HOST/library/sections/$SECTION/emptyTrash?X-Plex-Token=$TOKEN" \
  -o /dev/null -w "emptyTrash: HTTP %{http_code}\n"

echo "--- shows in section $SECTION ---"
curl -s -m 20 "$HOST/library/sections/$SECTION/all?X-Plex-Token=$TOKEN" | python3 -c "
import sys, xml.etree.ElementTree as ET
for d in ET.fromstring(sys.stdin.read()):
    print(f\"  {d.get('ratingKey'):>6}  {d.get('title')}  |  {d.get('childCount')} seasons / {d.get('leafCount')} episodes\")
"
