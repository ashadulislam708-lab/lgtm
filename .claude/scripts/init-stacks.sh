#!/bin/bash
set -e

CLAUDE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_FILE="$CLAUDE_DIR/stack-config.json"

echo "🔍 Checking stack configuration..."

# Check if stack-config.json exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  No stack-config.json found - initializing all submodules"
    cd "$CLAUDE_DIR"
    git submodule update --init --recursive
    exit 0
fi

# Parse enabledStacks from stack-config.json
ENABLED_STACKS=$(jq -r '.enabledStacks[]?' "$CONFIG_FILE" 2>/dev/null)

if [ -z "$ENABLED_STACKS" ]; then
    echo "⚠️  No enabledStacks configured - initializing all submodules"
    cd "$CLAUDE_DIR"
    git submodule update --init --recursive
    exit 0
fi

echo "📦 Enabled stacks: $(echo $ENABLED_STACKS | tr '\n' ' ')"

# Initialize only enabled stacks
cd "$CLAUDE_DIR"
for stack in $ENABLED_STACKS; do
    if [ -d "$stack" ]; then
        # Check if submodule is already initialized
        if [ ! -f "$stack/.git" ] && [ ! -d "$stack/.git" ]; then
            echo "  ⬇️  Initializing $stack..."
            git submodule update --init "$stack"

            # Initialize nested submodules within the stack
            if [ -f "$stack/.gitmodules" ]; then
                cd "$stack"
                git submodule update --init --recursive
                cd "$CLAUDE_DIR"
            fi
        else
            echo "  ✓ $stack already initialized"
        fi
    else
        echo "  ⚠️  $stack not found in .gitmodules"
    fi
done

echo "✅ Stack initialization complete"
