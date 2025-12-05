#!/bin/bash

# Command Reference for Lumina + AIOS

echo "🚀 Lumina + AIOS Command Reference"
echo "===================================="
echo ""

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

# Functions for each command

show_setup() {
    echo -e "${BLUE}📦 SETUP${NC}"
    echo ""
    echo "1️⃣  Quick automatic setup:"
    echo "   bash setup-aios.sh"
    echo ""
    echo "2️⃣  Manual setup - AIOS Kernel:"
    echo "   cd aios-kernel"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate  # (or venv\\Scripts\\activate on Windows)"
    echo "   pip install -r requirements.txt"
    echo "   cp .env.example .env"
    echo "   # Edit .env with your API keys"
    echo ""
    echo "3️⃣  Manual setup - Next.js:"
    echo "   pnpm install"
    echo "   cp .env.local.example .env.local"
    echo ""
}

show_dev() {
    echo -e "${BLUE}▲ DEVELOPMENT${NC}"
    echo ""
    echo "Terminal 1 - Start AIOS Kernel:"
    echo "   cd aios-kernel"
    echo "   source venv/bin/activate"
    echo "   python kernel.py"
    echo ""
    echo "Terminal 2 - Start Next.js:"
    echo "   npm run dev"
    echo ""
    echo "Terminal 3 - Access workspace:"
    echo "   curl http://localhost:3000/lumina/workspace"
    echo ""
}

show_test() {
    echo -e "${BLUE}🧪 TESTING${NC}"
    echo ""
    echo "Check AIOS kernel health:"
    echo "   curl http://localhost:8000/health"
    echo ""
    echo "Get Lumina agent info:"
    echo "   curl http://localhost:8000/api/agent/lumina"
    echo ""
    echo "Test query (manual):"
    echo "   curl -X POST http://localhost:8000/api/lumina/query \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"user_id\":\"test\",\"query\":\"Why is the sky blue?\",\"mode\":\"explain\"}'"
    echo ""
    echo "Watch kernel logs:"
    echo "   tail -f aios-kernel/kernel.log"
    echo ""
}

show_debug() {
    echo -e "${BLUE}🔧 DEBUGGING${NC}"
    echo ""
    echo "Check Python version:"
    echo "   python3 --version"
    echo ""
    echo "Check port usage:"
    echo "   lsof -i :8000  # AIOS port"
    echo "   lsof -i :3000  # Next.js port"
    echo ""
    echo "View AIOS kernel config:"
    echo "   cat aios-kernel/config.yaml"
    echo ""
    echo "Check environment variables:"
    echo "   echo \$GEMINI_API_KEY"
    echo "   cat .env.local"
    echo ""
    echo "Restart everything:"
    echo "   killall python3  # Kill AIOS"
    echo "   killall node     # Kill Next.js"
    echo "   # Then restart both"
    echo ""
}

show_deploy() {
    echo -e "${BLUE}📤 DEPLOYMENT${NC}"
    echo ""
    echo "Build Next.js:"
    echo "   npm run build"
    echo ""
    echo "Run production:"
    echo "   npm run start"
    echo ""
    echo "Build AIOS Docker image:"
    echo "   docker build -t lumina-aios ./aios-kernel"
    echo "   docker run -p 8000:8000 lumina-aios"
    echo ""
    echo "Deploy to Vercel (frontend only):"
    echo "   vercel deploy"
    echo ""
    echo "Deploy to AWS (full stack):"
    echo "   # See AIOS_MIGRATION_COMPLETE.md for details"
    echo ""
}

show_docs() {
    echo -e "${BLUE}📚 DOCUMENTATION${NC}"
    echo ""
    echo "AIOS_MIGRATION_SUMMARY.md"
    echo "   → Complete overview of what changed"
    echo ""
    echo "AIOS_QUICK_START.md"
    echo "   → 5-minute quick start guide"
    echo ""
    echo "AIOS_MIGRATION_COMPLETE.md"
    echo "   → Detailed architecture & deployment"
    echo ""
    echo "VERCEL_AI_QUICK_START.md"
    echo "   → Vercel AI SDK reference"
    echo ""
}

show_troubleshoot() {
    echo -e "${BLUE}🆘 TROUBLESHOOTING${NC}"
    echo ""
    echo "Problem: AIOS kernel won't start"
    echo "   → Check Python version: python3 --version (needs 3.10+)"
    echo "   → Reinstall deps: cd aios-kernel && pip install -r requirements.txt"
    echo ""
    echo "Problem: Connection refused"
    echo "   → Check kernel is running: curl http://localhost:8000/health"
    echo "   → Check port: lsof -i :8000"
    echo ""
    echo "Problem: API key errors"
    echo "   → Check .env files have keys"
    echo "   → Verify key is valid: https://makersuite.google.com/app/apikey"
    echo ""
    echo "Problem: Next.js can't find AIOS"
    echo "   → Check AIOS_HOST and AIOS_PORT in .env.local"
    echo "   → Verify kernel is running"
    echo ""
}

# Show all sections
if [ $# -eq 0 ]; then
    show_setup
    show_dev
    show_test
    show_debug
    show_docs
    show_troubleshoot
else
    case "$1" in
        setup)
            show_setup
            ;;
        dev)
            show_dev
            ;;
        test)
            show_test
            ;;
        debug)
            show_debug
            ;;
        deploy)
            show_deploy
            ;;
        docs)
            show_docs
            ;;
        troubleshoot)
            show_troubleshoot
            ;;
        *)
            echo "Usage: $0 [setup|dev|test|debug|deploy|docs|troubleshoot]"
            echo ""
            show_setup
            ;;
    esac
fi

echo -e "${GREEN}✓ For more info, see the documentation files${NC}"
