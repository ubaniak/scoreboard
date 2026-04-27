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
  # Disable CGO for cross-compilation to non-native targets
  CGO_ENABLED=0 GOOS="$OS" GOARCH="$ARCH" go build -o "${OUT_DIR}/${BIN}" ./cmd
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
