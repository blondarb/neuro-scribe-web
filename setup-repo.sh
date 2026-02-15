#!/bin/bash
# Setup script: Populate neuro-scribe repo from neuro-plans/scribe/
#
# Usage (from your local machine):
#   1. Clone both repos side by side
#   2. Run this script
#
#   git clone https://github.com/blondarb/neuro-plans.git
#   git clone https://github.com/blondarb/neuro-scribe.git
#   cd neuro-plans
#   git checkout claude/explore-ai-codegen-czSXu
#   bash scribe/setup-repo.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"
TARGET_DIR="$(dirname "$SCRIPT_DIR")/../neuro-scribe"

if [ ! -d "$TARGET_DIR/.git" ]; then
  echo "Error: neuro-scribe repo not found at $TARGET_DIR"
  echo "Clone it first: git clone https://github.com/blondarb/neuro-scribe.git"
  exit 1
fi

echo "Copying files from neuro-plans/scribe/ to neuro-scribe/..."

# Copy all files (excluding this script and .git)
for item in "$SOURCE_DIR"/*; do
  basename="$(basename "$item")"
  [ "$basename" = "setup-repo.sh" ] && continue
  cp -r "$item" "$TARGET_DIR/"
done

# Copy hidden files
cp "$SOURCE_DIR/.gitignore" "$TARGET_DIR/"
cp -r "$SOURCE_DIR/.github" "$TARGET_DIR/"

# Fix CLAUDE.md paths (already done in prepared version, but just in case)
echo "Files copied. Now commit and push:"
echo ""
echo "  cd $TARGET_DIR"
echo "  git add -A"
echo "  git commit -m 'Initial project scaffolding for Neuro Scribe'"
echo "  git push -u origin main"
echo ""
echo "Done!"
