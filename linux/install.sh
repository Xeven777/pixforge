#!/usr/bin/env bash
# Installs Pixforge file-manager integration (app launcher + Nautilus / Dolphin /
# Nemo right-click actions) into the current user's ~/.local/share directories.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PIXFORGE_BIN="${PIXFORGE_BIN:-$(command -v pixforge || true)}"
if [[ -z "$PIXFORGE_BIN" ]]; then
  echo "Could not find a 'pixforge' binary on PATH." >&2
  echo "Set PIXFORGE_BIN to the executable and re-run, e.g.:" >&2
  echo "  PIXFORGE_BIN=\"\$HOME/Documents/github/pixforge/src-tauri/target/release/pixforge\" $0" >&2
  exit 1
fi
echo "Using pixforge binary: $PIXFORGE_BIN"

subst() { sed "s|__PIXFORGE_EXEC__|${PIXFORGE_BIN//|/\\|}|g" "$1"; }

# App launcher + MIME handler (gives every file manager an "Open With > Pixforge").
APP_DIR="$HOME/.local/share/applications"
mkdir -p "$APP_DIR"
subst "$SCRIPT_DIR/pixforge.desktop" > "$APP_DIR/pixforge.desktop"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APP_DIR" || true
echo "  - app launcher: $APP_DIR/pixforge.desktop"

# Dolphin / KDE service menu.
KDE_DIR="$HOME/.local/share/kio/servicemenus"
mkdir -p "$KDE_DIR"
subst "$SCRIPT_DIR/dolphin-servicemenu.desktop" > "$KDE_DIR/pixforge.desktop"
chmod +x "$KDE_DIR/pixforge.desktop" || true
echo "  - Dolphin service menu"

# Nemo actions.
NEMO_DIR="$HOME/.local/share/nemo/actions"
mkdir -p "$NEMO_DIR"
for f in "$SCRIPT_DIR"/nemo/*.nemo_action; do
  subst "$f" > "$NEMO_DIR/$(basename "$f")"
done
echo "  - Nemo actions"

# Nautilus scripts.
NAUT_DIR="$HOME/.local/share/nautilus/scripts"
mkdir -p "$NAUT_DIR"
for f in "$SCRIPT_DIR"/nautilus/*; do
  dest="$NAUT_DIR/$(basename "$f")"
  subst "$f" > "$dest"
  chmod +x "$dest"
done
echo "  - Nautilus scripts"

echo
echo "Done. Restart your file manager to see the new entries:"
echo "  Nautilus: nautilus -q     Nemo: nemo -q     Dolphin: kbuildsycoca6 (or re-login)"
