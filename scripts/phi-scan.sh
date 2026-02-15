#!/bin/bash
# phi-scan.sh — Scan codebase for potential PHI leaks
#
# Checks for:
#   1. PHI patterns in log statements (console.log, logger.*)
#   2. PHI field names in error responses
#   3. Real-looking patient data in test fixtures
#   4. PHI in URL construction
#
# Exit code 0 = clean, 1 = potential PHI found
#
# Usage:
#   make phi-scan
#   bash scripts/phi-scan.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_DIR/src"
TEST_DIR="$PROJECT_DIR/tests"

RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RESET='\033[0m'

VIOLATIONS=0

echo -e "${CYAN}Neuro Scribe — PHI Leak Scanner${RESET}"
echo "Scanning $SRC_DIR and $TEST_DIR..."
echo ""

# ─── Check 1: PHI field names in log/console statements ──────────────────────

echo -e "${CYAN}[1/5] Checking for PHI fields in log statements...${RESET}"

# These field names should NEVER appear in log/console calls
PHI_FIELDS="patientName|patientId|dateOfBirth|dob|ssn|mrn|socialSecurity|birthDate|firstName|lastName|address|phoneNumber|transcript\.text|note\.content|segments\[|\.text\b"

HITS=$(grep -rn --include="*.ts" -E "(console\.(log|error|warn|info|debug)|logger\.(info|error|warn|debug))\(.*($PHI_FIELDS)" "$SRC_DIR" 2>/dev/null || true)

if [ -n "$HITS" ]; then
  echo -e "${RED}  FAIL: PHI field names found in log statements:${RESET}"
  echo "$HITS" | while IFS= read -r line; do
    echo "    $line"
  done
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}  PASS${RESET}"
fi

# ─── Check 2: PHI in error messages sent to clients ──────────────────────────

echo -e "${CYAN}[2/5] Checking for PHI in error responses...${RESET}"

HITS=$(grep -rn --include="*.ts" -E "res\.(json|send)\(.*($PHI_FIELDS)" "$SRC_DIR" 2>/dev/null || true)

if [ -n "$HITS" ]; then
  echo -e "${RED}  FAIL: PHI field names found in response bodies:${RESET}"
  echo "$HITS" | while IFS= read -r line; do
    echo "    $line"
  done
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}  PASS${RESET}"
fi

# ─── Check 3: Real-looking PHI in test fixtures ─────────────────────────────

echo -e "${CYAN}[3/5] Checking test fixtures for real-looking PHI...${RESET}"

# SSN patterns (xxx-xx-xxxx with plausible values)
# Exclude phi-guard test (intentionally contains PHI patterns to test detection)
SSN_HITS=$(grep -rn --include="*.json" --include="*.ts" -E "\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b" "$TEST_DIR" 2>/dev/null | grep -v "phi-guard.test.ts" || true)

# MRN patterns (labeled)
MRN_HITS=$(grep -rn --include="*.json" --include="*.ts" -iE "(mrn|medical.record)" "$TEST_DIR" 2>/dev/null | grep -v "phi-guard.test.ts" || true)

if [ -n "$SSN_HITS" ] || [ -n "$MRN_HITS" ]; then
  echo -e "${RED}  FAIL: Potential real PHI in test fixtures:${RESET}"
  [ -n "$SSN_HITS" ] && echo "$SSN_HITS" | while IFS= read -r line; do echo "    SSN: $line"; done
  [ -n "$MRN_HITS" ] && echo "$MRN_HITS" | while IFS= read -r line; do echo "    MRN: $line"; done
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}  PASS${RESET}"
fi

# ─── Check 4: PHI in URLs / query strings ───────────────────────────────────

echo -e "${CYAN}[4/5] Checking for PHI in URL construction...${RESET}"

HITS=$(grep -rn --include="*.ts" -E "(url|path|query|param).*($PHI_FIELDS)" "$SRC_DIR" 2>/dev/null || true)

if [ -n "$HITS" ]; then
  echo -e "${RED}  FAIL: PHI field names found in URL construction:${RESET}"
  echo "$HITS" | while IFS= read -r line; do
    echo "    $line"
  done
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}  PASS${RESET}"
fi

# ─── Check 5: Unencrypted PHI storage ───────────────────────────────────────

echo -e "${CYAN}[5/5] Checking for unencrypted PHI in database operations...${RESET}"

# Look for direct transcript/note content insertion without encryption
HITS=$(grep -rn --include="*.ts" -E "(insert|update|set)\(.*\b(transcript|note_content|sections)\b" "$SRC_DIR" 2>/dev/null | grep -v "Encrypted" | grep -v "encrypted" | grep -v "encrypt(" || true)

if [ -n "$HITS" ]; then
  echo -e "${YELLOW}  WARN: Possible unencrypted PHI in database operations:${RESET}"
  echo "$HITS" | while IFS= read -r line; do
    echo "    $line"
  done
  echo -e "${YELLOW}  (Review these manually — may be false positives)${RESET}"
else
  echo -e "${GREEN}  PASS${RESET}"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

echo ""
if [ $VIOLATIONS -gt 0 ]; then
  echo -e "${RED}✗ PHI scan found $VIOLATIONS violation(s). Fix before merging.${RESET}"
  exit 1
else
  echo -e "${GREEN}✓ PHI scan clean — no violations found.${RESET}"
  exit 0
fi
