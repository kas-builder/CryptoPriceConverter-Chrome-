#!/bin/bash

# Launch Chrome/Chromium with extension for testing
echo "🚀 Launching Chromium with extension loaded..."

# Get the current directory (extension directory)
EXTENSION_DIR=$(pwd)

# Create a temporary user data directory for testing
USER_DATA_DIR="/tmp/chrome-extension-test"
rm -rf "$USER_DATA_DIR"
mkdir -p "$USER_DATA_DIR"

echo "📁 Extension directory: $EXTENSION_DIR"
echo "📁 User data directory: $USER_DATA_DIR"

# Launch Chromium with extension loaded in developer mode
chromium-browser \
  --user-data-dir="$USER_DATA_DIR" \
  --load-extension="$EXTENSION_DIR" \
  --disable-extensions-except="$EXTENSION_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --disable-default-apps \
  --disable-popup-blocking \
  --new-window \
  "http://localhost:5000/test.html" \
  "http://localhost:5000/extension-test-runner.html" \
  "http://localhost:5000/refresh-test.html" \
  "https://amazon.com" \
  "https://ebay.com" &

CHROME_PID=$!
echo "✅ Chromium launched with PID: $CHROME_PID"
echo "🔧 Extension loaded in developer mode"
echo "📄 Test pages opened:"
echo "   - http://localhost:5000/test.html"
echo "   - http://localhost:5000/extension-test-runner.html"
echo "   - http://localhost:5000/refresh-test.html"
echo "   - https://amazon.com (real-world test)"
echo "   - https://ebay.com (real-world test)"
echo ""
echo "📋 To test the extension:"
echo "1. Click the extension icon (blue 'K') in the toolbar"
echo "2. Switch between Kaspa and Bitcoin modes"
echo "3. Test the refresh button (try rapid clicking)"
echo "4. Check price conversions on the test pages"
echo "5. Verify conversions on Amazon/eBay product pages"
echo ""
echo "Press Ctrl+C to stop Chromium"

# Wait for Chrome to exit or be killed
wait $CHROME_PID
echo "🛑 Chromium closed"