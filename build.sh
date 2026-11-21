#!/bin/bash
set -e

# Optional environment overrides (used by CI):
#   TARGETS        space-separated os/arch list (default: all platforms below)
#   PKG_VERSION    version stamped into the .deb and macOS bundle (default 1.0.0)
#   SKIP_FRONTEND  set to 1 to reuse an existing frontend/dist
PKG_VERSION="${PKG_VERSION:-1.0.0}"

# Build frontend
if [ "${SKIP_FRONTEND:-0}" != "1" ]; then
  (cd frontend && rm -rf dist && npm run build)
fi
rm -rf cmd/frontend/dist
mkdir -p cmd/frontend
cp -r frontend/dist cmd/frontend/dist

# Cross-compile for all platforms/architectures
# Note: darwin builds must match native arch due to systray C bindings
NATIVE_ARCH=$(uname -m)
if [[ "$NATIVE_ARCH" == "arm64" ]] || [[ "$NATIVE_ARCH" == "aarch64" ]]; then
  DARWIN_ARCH="arm64"
else
  DARWIN_ARCH="amd64"
fi

if [ -n "${TARGETS:-}" ]; then
  read -r -a TARGETS <<< "$TARGETS"
else
  TARGETS=(
    "darwin/${DARWIN_ARCH}"
    "linux/amd64"
    "linux/arm64"
    "linux/arm"
    "windows/amd64"
    "windows/arm64"
  )
fi

has_target() {
  local t
  for t in "${TARGETS[@]}"; do [ "$t" = "$1" ] && return 0; done
  return 1
}

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
  # darwin native build needs CGO (systray + native dialog); other targets cross-compile without CGO
  if [ "$OS" = "darwin" ]; then
    CGO=1
  else
    CGO=0
  fi
  CGO_ENABLED=$CGO GOOS="$OS" GOARCH="$ARCH" go build -o "${OUT_DIR}/${BIN}" ./cmd
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

  cat > "${APP_DIR}/Contents/Info.plist" << PLIST
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
  <string>${PKG_VERSION}</string>
  <key>CFBundleVersion</key>
  <string>${PKG_VERSION}</string>
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

# Windows: create .zip with binary + PowerShell install script
create_windows_installer() {
  local OS=$1
  local ARCH=$2
  local OUT_DIR="${OS}_${ARCH}"
  local ZIP_NAME="scoreboard_${OS}_${ARCH}.zip"

  echo "Creating ${ZIP_NAME}..."
  cp installers/windows/install.ps1 "build/${OUT_DIR}/install.ps1"
  (cd build && zip -q -j "${ZIP_NAME}" "${OUT_DIR}/scoreboard.exe" "${OUT_DIR}/install.ps1")
  echo "  build/${ZIP_NAME}"

  # Setup .exe (requires NSIS's makensis; available on Linux, macOS and Windows)
  if command -v makensis &> /dev/null; then
    local SETUP_NAME="scoreboard_${OS}_${ARCH}_setup.exe"
    echo "Creating ${SETUP_NAME}..."
    makensis -V2 \
      -DVERSION="${PKG_VERSION}" \
      -DARCH="${ARCH}" \
      -DSRC="$(pwd)/build/${OUT_DIR}" \
      -DOUTFILE="$(pwd)/build/${SETUP_NAME}" \
      installers/windows/scoreboard.nsi
    echo "  build/${SETUP_NAME}"
  else
    echo "  Skipping Windows setup .exe (makensis not found — install NSIS)"
  fi
}

# Linux: create .deb package (requires dpkg-deb, only works on Linux)
create_linux_deb() {
  local ARCH=$1
  local DEB_ARCH
  case "$ARCH" in
    amd64) DEB_ARCH="amd64" ;;
    arm64) DEB_ARCH="arm64" ;;
    arm)   DEB_ARCH="armhf" ;;
    *)     DEB_ARCH="$ARCH" ;;
  esac

  local PKG_DIR="build/deb_pkg_linux_${ARCH}"
  rm -rf "$PKG_DIR"
  mkdir -p "${PKG_DIR}/DEBIAN"
  mkdir -p "${PKG_DIR}/usr/local/bin"
  mkdir -p "${PKG_DIR}/usr/share/applications"

  cp "build/linux_${ARCH}/scoreboard" "${PKG_DIR}/usr/local/bin/"
  chmod +x "${PKG_DIR}/usr/local/bin/scoreboard"
  cp installers/linux/scoreboard.desktop "${PKG_DIR}/usr/share/applications/"

  cat > "${PKG_DIR}/DEBIAN/control" << EOF
Package: scoreboard
Version: ${PKG_VERSION}
Architecture: ${DEB_ARCH}
Maintainer: Ubaniak <maintainer@ubaniak.com>
Description: Boxing tournament scoreboard
 A self-contained real-time scoring application for boxing tournaments.
 Judges score bouts via a web UI; admins manage cards, bouts, and rounds.
EOF

  local DEB_NAME="scoreboard_linux_${DEB_ARCH}.deb"
  dpkg-deb --build "$PKG_DIR" "build/${DEB_NAME}"
  rm -rf "$PKG_DIR"
  echo "  build/${DEB_NAME}"
}

echo ""
echo "Creating installers:"

for ARCH in amd64 arm64; do
  has_target "darwin/${ARCH}" || continue
  if [[ "$(uname)" == "Darwin" ]]; then
    create_mac_installer darwin "${ARCH}"
  else
    echo "  Skipping macOS DMG (requires macOS build host)"
  fi
done

for ARCH in amd64 arm64; do
  has_target "windows/${ARCH}" && create_windows_installer windows "${ARCH}"
done

for ARCH in amd64 arm64 arm; do
  has_target "linux/${ARCH}" || continue
  if command -v dpkg-deb &> /dev/null; then
    create_linux_deb "${ARCH}"
  else
    echo "  Skipping Linux .deb (dpkg-deb not found — run on a Linux host)"
  fi
done
