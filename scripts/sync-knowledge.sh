#!/bin/bash
# sync-knowledge.sh — Pull latest knowledge base from neuro-plans
#
# Usage:
#   npm run kb:sync
#   # or
#   bash scripts/sync-knowledge.sh [neuro-plans-path]
#
# If neuro-plans-path is not provided, fetches from GitHub release artifacts.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data"

# Default: look for neuro-plans as a sibling directory
NEURO_PLANS="${1:-$(dirname "$PROJECT_DIR")/neuro-plans}"

mkdir -p "$DATA_DIR"

if [ -d "$NEURO_PLANS/docs/data" ]; then
  echo "Syncing from local neuro-plans: $NEURO_PLANS"
  cp "$NEURO_PLANS/docs/data/plans.json" "$DATA_DIR/plans.json"
  cp "$NEURO_PLANS/docs/data/medications.json" "$DATA_DIR/medications.json"
else
  echo "Error: neuro-plans not found at $NEURO_PLANS"
  echo "Either:"
  echo "  1. Clone neuro-plans next to neuro-scribe"
  echo "  2. Pass the path: bash scripts/sync-knowledge.sh /path/to/neuro-plans"
  exit 1
fi

# Validate JSON
python3 -c "import json; json.load(open('$DATA_DIR/plans.json'))" 2>/dev/null || {
  echo "Error: plans.json is not valid JSON"
  exit 1
}
python3 -c "import json; json.load(open('$DATA_DIR/medications.json'))" 2>/dev/null || {
  echo "Error: medications.json is not valid JSON"
  exit 1
}

# Count entries
PLANS=$(python3 -c "import json; print(len(json.load(open('$DATA_DIR/plans.json'))))" 2>/dev/null || echo "?")
MEDS=$(python3 -c "import json; d=json.load(open('$DATA_DIR/medications.json')); print(len(d.get('medications', d)))" 2>/dev/null || echo "?")

echo "Synced: $PLANS plans, $MEDS medications"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$DATA_DIR/.sync-timestamp"
echo "Done."
