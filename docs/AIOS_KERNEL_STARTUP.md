# Starting the Python AIOS Kernel Server

The AIOS Kernel is the backend Python server that powers Lumina. It runs on port 8000 and manages the multi-stage AI tutoring pipeline.

## Prerequisites

✅ Already installed (detected in workspace):
- Python 3.13+
- Manim virtual environment (`manim-venv`)
- AIOS Kernel dependencies (in `aios-kernel/requirements.txt`)

## Quick Start (3 steps)

### 1. Set Up Environment Variables

```bash
cd /Users/macbookpro/Downloads/tv/code/aios-kernel

# Create .env from example
cp .env.example .env

# Edit .env and add your API keys:
# - GEMINI_API_KEY (required - from .env.local)
# - DAYTONA_API_KEY (optional - for sandbox execution)
```

**Get values from:**
- `GEMINI_API_KEY`: Already in `/Users/macbookpro/Downloads/tv/code/.env.local`
- `DAYTONA_API_KEY`: Optional for advanced features

### 2. Activate Virtual Environment

```bash
# Activate the Manim virtual environment (has Python 3.13)
source /Users/macbookpro/Downloads/tv/code/manim-venv/bin/activate

# Install AIOS Kernel dependencies
cd /Users/macbookpro/Downloads/tv/code/aios-kernel
pip install -r requirements.txt
```

### 3. Start the Kernel Server

```bash
# From aios-kernel directory
python kernel.py

# Or use uvicorn directly:
# uvicorn kernel:app --host 0.0.0.0 --port 8000 --reload
```

**Expected output:**
```
🚀 Starting AIOS Kernel at 0.0.0.0:8000
📊 Lumina agent registered and ready
📖 API docs available at http://0.0.0.0:8000/docs
```

## Verification

Once started, verify the server is running:

```bash
# Health check
curl http://localhost:8000/health
# Should return: {"status":"ok","service":"AIOS Kernel"}

# Get Lumina agent info
curl http://localhost:8000/api/agent/lumina
# Should show agent metadata and stages

# View API docs
open http://localhost:8000/docs
```

## Integration with Next.js Frontend

The Next.js dev server (running on port 3000) automatically connects to the AIOS Kernel on port 8000.

**Connection flow:**
```
Browser (localhost:3000)
  ↓
NextJS Frontend
  ↓ (HTTP POST /api/lumina/query)
NextJS API Route
  ↓ (Forwards to)
AIOS Kernel (localhost:8000)
  ↓ (Streams SSE events back)
Frontend displays real-time progress
```

## Terminal Setup (Recommended)

Keep both servers running in separate terminals:

### Terminal 1: Next.js Frontend
```bash
cd /Users/macbookpro/Downloads/tv/code
pnpm dev
# Runs on http://localhost:3000
```

### Terminal 2: Python AIOS Kernel
```bash
source /Users/macbookpro/Downloads/tv/code/manim-venv/bin/activate
cd /Users/macbookpro/Downloads/tv/code/aios-kernel
python kernel.py
# Runs on http://localhost:8000
```

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'aios_sdk'"

**Solution:** Install dependencies
```bash
cd /Users/macbookpro/Downloads/tv/code/aios-kernel
pip install -r requirements.txt
```

### Error: "GEMINI_API_KEY not set"

**Solution:** Add to `aios-kernel/.env`
```bash
# Copy from main .env.local
GEMINI_API_KEY=AIzaSyAKFWsdTyX1N23Tx9rPxmEPQO2ekayO_X4
GEMINI_MODEL_NAME=gemini-2.0-flash-exp
```

### Error: "Port 8000 already in use"

**Solution:** Kill existing process or use different port
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
AIOS_PORT=8001 python kernel.py
```

### Manim rendering fails

**Solution:** Ensure Manim is properly installed
```bash
source /Users/macbookpro/Downloads/tv/code/manim-venv/bin/activate
manim --version
# Should show: Manim Community v0.19.0
```

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│ Browser (Lumina Workspace)                                │
│ http://localhost:3000/lumina/workspace                    │
└──────────────────┬─────────────────────────────────────────┘
                   │ SSE Stream
                   ▼
┌────────────────────────────────────────────────────────────┐
│ Next.js API Route                                          │
│ /api/lumina/query (port 3000)                             │
└──────────────────┬─────────────────────────────────────────┘
                   │ HTTP POST
                   ▼
┌────────────────────────────────────────────────────────────┐
│ AIOS Kernel Server                                         │
│ http://localhost:8000 (THIS PROCESS)                       │
│                                                            │
│ ├─ Query Processing                                        │
│ ├─ Knowledge Retrieval                                     │
│ ├─ Reasoning Engine                                        │
│ ├─ Explanation Generation                                  │
│ ├─ Visual Planning                                         │
│ ├─ Code Generation (Manim Python)                          │
│ ├─ Animation Rendering (Manim Community)                   │
│ └─ Answer Synthesis                                        │
│                                                            │
│ Generates:                                                 │
│ ├─ Text explanation                                        │
│ ├─ Visual plan                                             │
│ ├─ Manim code                                              │
│ └─ MP4 video file                                          │
└────────────────────────────────────────────────────────────┘
```

## Performance Tips

- **First run**: ~5-8s (Gemini + Manim startup overhead)
- **Subsequent runs**: ~3-5s (caching helps)
- **Quality**: Low quality (480p) for speed, can be increased

## Configuration

Edit `aios-kernel/config.yaml` for:
- Animation quality settings
- Timeout limits
- Caching policies
- LLM model parameters
- Agent behavior tuning

## Logs

View detailed logs:
```bash
# With debug logging
AIOS_LOG_LEVEL=DEBUG python kernel.py

# Or tail logs
tail -f aios-kernel.log
```

---

**Next:** Once both servers are running, visit http://localhost:3000/lumina/workspace to test the full pipeline!
