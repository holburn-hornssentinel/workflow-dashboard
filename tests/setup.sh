#!/bin/bash
# Setup QA Test Agent

echo "🚀 Setting up QA Test Agent..."

# Install Python dependencies
echo "📦 Installing Python packages..."
pip3 install -r tests/requirements.txt

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
playwright install chromium

# Create directories
mkdir -p tests/screenshots tests/videos

echo "✅ Setup complete!"
echo ""
echo "Run tests with:"
echo "  python3 tests/qa_agent.py"
echo ""
echo "Optional environment variables:"
echo "  TEST_URL=http://localhost:3004     # Change target URL"
echo "  HEADLESS=true                      # Run without browser UI"
echo "  RECORD_VIDEO=true                  # Record test videos"
echo "  GEMINI_API_KEY=your_key           # Enable AI validation"
