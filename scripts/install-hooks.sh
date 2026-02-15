#!/bin/bash
# install-hooks.sh — Install git pre-commit hook for PHI scanning
#
# Usage:
#   bash scripts/install-hooks.sh
#
# This installs a pre-commit hook that runs the PHI scanner
# before every commit. If PHI patterns are found, the commit is blocked.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
HOOKS_DIR="$PROJECT_DIR/.git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Error: .git/hooks directory not found. Are you in a git repo?"
  exit 1
fi

cat > "$HOOKS_DIR/pre-commit" << 'HOOK'
#!/bin/bash
# Neuro Scribe — Pre-commit PHI scan
# Blocks commits that contain potential PHI leaks.

echo "Running PHI scan..."

# Run the PHI scanner
if bash scripts/phi-scan.sh; then
  echo "PHI scan passed."
  exit 0
else
  echo ""
  echo "COMMIT BLOCKED: PHI scan found potential issues."
  echo "Fix the violations above, then try again."
  echo ""
  echo "To bypass (NOT recommended): git commit --no-verify"
  exit 1
fi
HOOK

chmod +x "$HOOKS_DIR/pre-commit"
echo "Pre-commit hook installed at $HOOKS_DIR/pre-commit"
echo "PHI scanning will run before every commit."
