#!/bin/bash
# Script to symlink agents from base + enabled stacks into .claude/agents/
# Project-specific agents (real files, not symlinks) are preserved.
# Follows the same pattern as link-commands.sh

CLAUDE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_DIR="$CLAUDE_DIR/agents"
CONFIG_FILE="$CLAUDE_DIR/stack-config.json"

# Create agents directory if it doesn't exist
mkdir -p "$AGENTS_DIR"

# Read enabled stacks from config
if [ -f "$CONFIG_FILE" ]; then
    ENABLED_STACKS=($(jq -r '.enabledStacks[]' "$CONFIG_FILE" 2>/dev/null))
else
    ENABLED_STACKS=("base")
    echo "Warning: stack-config.json not found, using base only"
fi

echo "Linking agents for stacks: ${ENABLED_STACKS[*]}"

# Remove existing symlinks only (preserve real files like ticket-fixer.md)
for file in "$AGENTS_DIR"/*.md; do
    [ -e "$file" ] || continue
    if [ -L "$file" ]; then
        rm "$file"
    fi
done

# Link base agents (always included)
if [ -d "$CLAUDE_DIR/base/agents" ]; then
    for agent in "$CLAUDE_DIR/base/agents"/*.md; do
        [ -f "$agent" ] || continue
        BASENAME=$(basename "$agent")
        [ "$BASENAME" = "README.md" ] && continue
        # Only link if no real file exists with same name
        if [ ! -e "$AGENTS_DIR/$BASENAME" ]; then
            ln -sfn "../base/agents/$BASENAME" "$AGENTS_DIR/$BASENAME"
            echo "  Linked: $BASENAME -> ../base/agents/$BASENAME"
        else
            echo "  Skipped: $BASENAME (project-level file exists)"
        fi
    done
fi

# Link stack-specific agents for each enabled stack
for stack in "${ENABLED_STACKS[@]}"; do
    [ "$stack" = "base" ] && continue
    if [ -d "$CLAUDE_DIR/$stack/agents" ]; then
        for agent in "$CLAUDE_DIR/$stack/agents"/*.md; do
            [ -f "$agent" ] || continue
            BASENAME=$(basename "$agent")
            [ "$BASENAME" = "README.md" ] && continue
            # Skip backup files
            [[ "$BASENAME" == *.backup ]] && continue
            [[ "$BASENAME" == *.bak ]] && continue
            # Real project files take priority, but symlinks get overridden by stack
            if [ -L "$AGENTS_DIR/$BASENAME" ] || [ ! -e "$AGENTS_DIR/$BASENAME" ]; then
                ln -sfn "../$stack/agents/$BASENAME" "$AGENTS_DIR/$BASENAME"
                echo "  Linked: $BASENAME -> ../$stack/agents/$BASENAME"
            else
                echo "  Skipped: $BASENAME (project-level file exists)"
            fi
        done
    fi
done

echo ""
echo "Agent linking complete!"
echo ""
ls -la "$AGENTS_DIR"/*.md 2>/dev/null
