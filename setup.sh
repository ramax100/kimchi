#!/bin/bash
# Setup script - runs during build on Render
# Installs Kimchi CLI

echo "=== Installing Kimchi CLI ==="

# Download and install Kimchi
curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash || {
  echo "Kimchi install script failed, trying manual download..."
  
  # Detect architecture
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
  esac
  
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  
  # Try downloading binary directly
  LATEST=$(curl -fsSL https://api.github.com/repos/getkimchi/kimchi/releases/latest | grep tag_name | cut -d '"' -f 4)
  if [ -n "$LATEST" ]; then
    URL="https://github.com/getkimchi/kimchi/releases/download/${LATEST}/kimchi-${OS}-${ARCH}"
    echo "Downloading from: $URL"
    curl -fsSL -o /usr/local/bin/kimchi "$URL" && chmod +x /usr/local/bin/kimchi
  fi
}

# Verify installation
if command -v kimchi &>/dev/null; then
  echo "=== Kimchi installed successfully ==="
  kimchi --version 2>/dev/null || true
else
  echo "=== Kimchi installation failed - will need manual install ==="
  echo "Run: curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash"
fi

# Install npm dependencies
npm install
