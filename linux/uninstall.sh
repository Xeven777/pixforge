#!/usr/bin/env bash
# Removes the Pixforge file-manager integration installed by install.sh.
set -euo pipefail

rm -f "$HOME/.local/share/applications/pixforge.desktop"
rm -f "$HOME/.local/share/kio/servicemenus/pixforge.desktop"
rm -f "$HOME/.local/share/nemo/actions/pixforge-open.nemo_action" \
      "$HOME/.local/share/nemo/actions/pixforge-compress.nemo_action" \
      "$HOME/.local/share/nemo/actions/pixforge-webp.nemo_action"
rm -f "$HOME/.local/share/nautilus/scripts/Open with Pixforge" \
      "$HOME/.local/share/nautilus/scripts/Compress with Pixforge" \
      "$HOME/.local/share/nautilus/scripts/Convert to WebP (Pixforge)"

command -v update-desktop-database >/dev/null 2>&1 && \
  update-desktop-database "$HOME/.local/share/applications" || true

echo "Removed Pixforge file-manager integration."
