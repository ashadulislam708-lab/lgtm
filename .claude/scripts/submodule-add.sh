#!/bin/bash
# submodule-add.sh
# Adds a git submodule with proper .gitmodules registration and branch tracking.
#
# Usage: bash scripts/submodule-add.sh <repo-url> <path> [branch]
#
# What this does:
#   1. Validates the submodule does not already exist
#   2. Runs 'git submodule add -b <branch> <url> <path>'
#   3. Initializes and updates the submodule
#   4. Leaves .gitmodules and gitlink STAGED for commit
#
# The submodule is properly registered in .gitmodules for all collaborators.
# Run 'git submodule update --init --recursive' after cloning to get all submodules.

set -e

REPO_URL="$1"
FRAMEWORK_PATH="$2"
BRANCH="${3:-main}"

if [ -z "$REPO_URL" ] || [ -z "$FRAMEWORK_PATH" ]; then
  echo "Usage: bash scripts/submodule-add.sh <repo-url> <path> [branch]"
  exit 1
fi

# Check if submodule is already registered in .gitmodules
if [ -f .gitmodules ] && git config -f .gitmodules --get "submodule.${FRAMEWORK_PATH}.url" &>/dev/null; then
  echo "Submodule '${FRAMEWORK_PATH}' already registered in .gitmodules."

  # If directory exists with .git, it is already set up
  if [ -d "$FRAMEWORK_PATH" ] && [ -e "$FRAMEWORK_PATH/.git" ]; then
    echo "  Directory exists and is a valid submodule. Skipping."
    exit 0
  fi

  # If registered but directory missing, initialize it
  echo "  Registered but not initialized. Running submodule update..."
  git submodule update --init --recursive "$FRAMEWORK_PATH"
  exit 0
fi

# Check if directory exists but is NOT a submodule
if [ -d "$FRAMEWORK_PATH" ]; then
  if [ -e "$FRAMEWORK_PATH/.git" ]; then
    echo "WARNING: Directory '$FRAMEWORK_PATH' exists with its own .git."
    echo "  This may be a leftover clone. Remove it first:"
    echo "    rm -rf $FRAMEWORK_PATH"
    exit 1
  else
    echo "WARNING: Plain directory '$FRAMEWORK_PATH' exists (not a submodule)."
    echo "  Remove it first: rm -rf $FRAMEWORK_PATH"
    exit 1
  fi
fi

echo "Adding submodule: $FRAMEWORK_PATH -> $REPO_URL (branch: $BRANCH)"

# Add the submodule with branch tracking
git submodule add -b "$BRANCH" "$REPO_URL" "$FRAMEWORK_PATH"

# Initialize and update (clone contents)
git submodule update --init --recursive "$FRAMEWORK_PATH"

echo "  Submodule added and initialized."
echo "  Branch tracking: $BRANCH"
echo "  Registered in .gitmodules (staged for commit)."
