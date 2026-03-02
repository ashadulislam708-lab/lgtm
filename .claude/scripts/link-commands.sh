#!/bin/bash
# Script to create symlinks for all submodule commands
# This makes commands from submodules accessible at .claude/commands/

CLAUDE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMMANDS_DIR="$CLAUDE_DIR/commands"

# Create commands directory if it doesn't exist
mkdir -p "$COMMANDS_DIR"

# Link base command categories
for category in design dev git operation utility; do
    if [ -d "$CLAUDE_DIR/base/commands/$category" ]; then
        ln -sfn "../base/commands/$category" "$COMMANDS_DIR/$category"
        echo "Linked: $category -> ../base/commands/$category"
    fi
done

# Link react-native commands as a category
if [ -d "$CLAUDE_DIR/react-native/commands" ]; then
    ln -sfn "../react-native/commands" "$COMMANDS_DIR/react-native"
    echo "Linked: react-native -> ../react-native/commands"
fi

# Link other framework commands if they exist
for framework in nestjs django react; do
    if [ -d "$CLAUDE_DIR/$framework/commands" ]; then
        ln -sfn "../$framework/commands" "$COMMANDS_DIR/$framework"
        echo "Linked: $framework -> ../$framework/commands"
    fi
done

echo ""
echo "Commands linked successfully!"
echo ""
ls -la "$COMMANDS_DIR"
