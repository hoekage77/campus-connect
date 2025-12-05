#!/bin/bash

# AIOS + Lumina Setup Script
# Automated setup for both AIOS kernel and Next.js app

set -e

echo "🚀 Setting up AIOS + Lumina System"
echo "====================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${BLUE}📦 Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

if ! python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then
    echo "❌ Python 3.10+ required. Current: $python_version"
    exit 1
fi

# Setup AIOS Kernel
echo -e "\n${BLUE}📦 Setting up AIOS Kernel...${NC}"

if [ ! -d "aios-kernel" ]; then
    echo "❌ aios-kernel directory not found"
    exit 1
fi

cd aios-kernel

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate || . venv/Scripts/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Setup .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env${NC}"
    echo "⚠️  IMPORTANT: Edit aios-kernel/.env and add your API keys:"
    echo "   - GEMINI_API_KEY"
    echo "   - DAYTONA_API_KEY"
fi

cd ..

# Setup Next.js App
echo -e "\n${BLUE}📦 Setting up Next.js App...${NC}"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    pnpm install
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local 2>/dev/null || {
        echo "Creating .env.local..."
        cat > .env.local << EOF
# AIOS Kernel Configuration
AIOS_HOST=localhost
AIOS_PORT=8000

# Gemini API (for local development)
GEMINI_API_KEY=your-key-here
GEMINI_MODEL_NAME=gemini-2.0-flash-exp

# Daytona (if using locally)
DAYTONA_API_KEY=your-key-here
DAYTONA_SERVER_URL=https://api.daytona.io
DAYTONA_TARGET=docker
EOF
    }
    echo -e "${GREEN}✓ Created .env.local${NC}"
fi

echo -e "\n${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Start AIOS Kernel:"
echo "   cd aios-kernel"
echo "   source venv/bin/activate"
echo "   python kernel.py"
echo ""
echo "2️⃣  In another terminal, start Next.js app:"
echo "   npm run dev"
echo ""
echo "3️⃣  Open http://localhost:3000/lumina/workspace"
echo ""
echo "📚 For more info, see AIOS_MIGRATION_COMPLETE.md"
