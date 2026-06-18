#!/bin/bash
# Setup script - runs during Render build
# Installs Kimchi CLI

set -e
echo "=== Kimchi Terminal Setup ==="

# Create bin directory
mkdir -p $HOME/.local/bin
export PATH="$HOME/.local/bin:$HOME/.kimchi/bin:/usr/local/bin:$PATH"

echo "=== Downloading Kimchi CLI ==="

# Try install script first
curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh -o /tmp/install-kimchi.sh 2>/dev/null && {
  chmod +x /tmp/install-kimchi.sh
  bash /tmp/install-kimchi.sh || echo "Install script had issues, trying alternative..."
}

# Check if kimchi is available
if ! command -v kimchi &>/dev/null; then
  echo "Trying alternative install method..."
  
  # Try downloading from SourceForge mirror
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) ARCH_NAME="amd64" ;;
    aarch64) ARCH_NAME="arm64" ;;
    *) ARCH_NAME="amd64" ;;
  esac
  
  # Try GitHub API for latest release
  LATEST_URL=$(curl -fsSL https://api.github.com/repos/getkimchi/kimchi/releases/latest 2>/dev/null | grep "browser_download_url.*linux.*${ARCH_NAME}" | head -1 | cut -d '"' -f 4)
  
  if [ -n "$LATEST_URL" ]; then
    echo "Downloading: $LATEST_URL"
    curl -fsSL -o /tmp/kimchi-download "$LATEST_URL"
    
    # Check if it's a tar.gz or binary
    if file /tmp/kimchi-download | grep -q "gzip"; then
      mkdir -p /tmp/kimchi-extract
      tar -xzf /tmp/kimchi-download -C /tmp/kimchi-extract/
      find /tmp/kimchi-extract -name "kimchi" -type f -exec chmod +x {} \; -exec cp {} $HOME/.local/bin/kimchi \;
    else
      cp /tmp/kimchi-download $HOME/.local/bin/kimchi
      chmod +x $HOME/.local/bin/kimchi
    fi
  fi
fi

# Final check
if command -v kimchi &>/dev/null; then
  echo "=== Kimchi installed: $(kimchi --version 2>/dev/null || echo 'OK') ==="
else
  echo "=== Kimchi not pre-installed. Users can install via terminal button ==="
fi

echo "=== Setup complete ==="
