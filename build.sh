#!/bin/bash
set -e

# Build frontend
cd frontend && rm -rf dist && npm run build && cd ..
rm -rf cmd/frontend/dist
mkdir -p cmd/frontend
cp -r frontend/dist cmd/frontend/dist

# Cross-compile for all platforms/architectures
TARGETS=(
  "darwin/amd64"
  "darwin/arm64"
  "linux/amd64"
  "linux/arm64"
  "linux/arm"
  "windows/amd64"
  "windows/arm64"
)

rm -rf build
mkdir -p build

for TARGET in "${TARGETS[@]}"; do
  OS="${TARGET%/*}"
  ARCH="${TARGET#*/}"
  OUT_DIR="build/${OS}_${ARCH}"
  mkdir -p "$OUT_DIR"

  BIN="scoreboard"
  if [ "$OS" = "windows" ]; then
    BIN="scoreboard.exe"
  fi

  echo "Building ${OS}/${ARCH}..."
  GOOS="$OS" GOARCH="$ARCH" go build -o "${OUT_DIR}/${BIN}" ./cmd
done

echo ""
echo "Builds complete:"
for TARGET in "${TARGETS[@]}"; do
  OS="${TARGET%/*}"
  ARCH="${TARGET#*/}"
  BIN="scoreboard"
  [ "$OS" = "windows" ] && BIN="scoreboard.exe"
  echo "  build/${OS}_${ARCH}/${BIN}"
done

# macOS: create .app bundle and .dmg (only works on macOS)
create_mac_installer() {
  local OS=$1
  local ARCH=$2
  local OUT_DIR="build/${OS}_${ARCH}"
  local APP_DIR="${OUT_DIR}/Scoreboard.app"

  mkdir -p "${APP_DIR}/Contents/MacOS"
  mkdir -p "${APP_DIR}/Contents/Resources"

  cp "${OUT_DIR}/scoreboard" "${APP_DIR}/Contents/MacOS/scoreboard"
  chmod +x "${APP_DIR}/Contents/MacOS/scoreboard"

  cat > "${APP_DIR}/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>scoreboard</string>
  <key>CFBundleIdentifier</key>
  <string>com.ubaniak.scoreboard</string>
  <key>CFBundleName</key>
  <string>Scoreboard</string>
  <key>CFBundleDisplayName</key>
  <string>Scoreboard</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.15</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
PLIST

  local DMG_NAME="scoreboard_${OS}_${ARCH}.dmg"
  echo "Creating ${DMG_NAME}..."
  hdiutil create \
    -volname "Scoreboard" \
    -srcfolder "${APP_DIR}" \
    -ov \
    -format UDZO \
    "build/${DMG_NAME}" \
    > /dev/null
  echo "  build/${DMG_NAME}"
}

# Windows: create .zip installer
create_windows_installer() {
  local OS=$1
  local ARCH=$2
  local OUT_DIR="${OS}_${ARCH}"
  local ZIP_NAME="scoreboard_${OS}_${ARCH}.zip"

  echo "Creating ${ZIP_NAME}..."
  (cd build && zip -q -j "${ZIP_NAME}" "${OUT_DIR}/scoreboard.exe")
  echo "  build/${ZIP_NAME}"
}

echo ""
echo "Creating installers:"

if [[ "$(uname)" == "Darwin" ]]; then
  create_mac_installer darwin amd64
  create_mac_installer darwin arm64
else
  echo "  Skipping macOS DMG (requires macOS build host)"
fi

create_windows_installer windows amd64
create_windows_installer windows arm64
