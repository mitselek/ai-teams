#!/bin/bash
# build-menubar.sh -- compile SMMenuBar.swift and assemble the app bundle
# at ~/Applications/SMMenuBar.app. Loud failures (fleet rule).
#
# Rebuild + restart:
#   ./build-menubar.sh
#   launchctl kickstart -k gui/$(id -u)/com.mitselek.sm-menubar
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/SMMenuBar.swift"
APP="$HOME/Applications/SMMenuBar.app"
BIN="$APP/Contents/MacOS/SMMenuBar"

[ -f "$SRC" ] || { echo "build-menubar: source missing: $SRC" >&2; exit 1; }
command -v swiftc >/dev/null || { echo "build-menubar: swiftc not found" >&2; exit 1; }

mkdir -p "$APP/Contents/MacOS"
rm -f "$BIN"   # unlink first: a running instance keeps the old inode alive

echo "compiling $SRC"
swiftc -O -parse-as-library -o "$BIN" "$SRC"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleExecutable</key>
	<string>SMMenuBar</string>
	<key>CFBundleIdentifier</key>
	<string>com.mitselek.sm-menubar</string>
	<key>CFBundleName</key>
	<string>SMMenuBar</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>LSUIElement</key>
	<true/>
	<key>NSPrincipalClass</key>
	<string>NSApplication</string>
</dict>
</plist>
PLIST

echo "built $APP"
