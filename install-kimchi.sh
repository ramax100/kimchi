#!/bin/bash
echo "Installing Kimchi CLI..."
curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash || true
# Check common locations
for p in "$HOME/.local/bin/kimchi" "$HOME/.kimchi/bin/kimchi" "/usr/local/bin/kimchi"; do
  if [ -f "$p" ]; then echo "Found: $p"; exit 0; fi
done
echo "Kimchi will be installed on first terminal use"
