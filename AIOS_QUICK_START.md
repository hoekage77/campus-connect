# AIOS + Lumina Quick Start

**Status: ✅ Migration Complete**

Your Lumina system now runs on AIOS with enterprise-grade resource management.

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Python 3.10+ 
- Node.js 18+
- Gemini API key

### Setup

```bash
# 1. Run setup script
bash setup-aios.sh

# 2. Configure AIOS kernel
cd aios-kernel
nano .env  # Add GEMINI_API_KEY and DAYTONA_API_KEY
source venv/bin/activate

# 3. Start AIOS kernel
python kernel.py
# Output: 🚀 Starting AIOS Kernel at 0.0.0.0:8000
```

### In Another Terminal

```bash
# 4. Start Next.js app
npm run dev
# Output: ▲ Next.js X.X.X

# 5. Open browser
# http://localhost:3000/lumina/workspace
```

## 📊 System Architecture

```
Frontend (Next.js 3000)
         ↓ HTTP/SSE
    API Route (/api/lumina/query)
         ↓ HTTP
AIOS Kernel (8000)
    ├─ LLM Core (Gemini)
    ├─ Lumina Agent (5 stages)
    ├─ Tool Manager
    ├─ Memory Manager
    └─ Storage Manager
```

## 🔧 Configuration

### AIOS Kernel (`aios-kernel/.env`)
```env
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL_NAME=gemini-2.0-flash-exp
DAYTONA_API_KEY=your-daytona-key
AIOS_PORT=8000
```

### Next.js App (`.env.local`)
```env
AIOS_HOST=localhost
AIOS_PORT=8000
```

## 📝 How It Works

1. **User asks question** → Next.js frontend
2. **API route receives request** → `/api/lumina/query`
3. **Route forwards to AIOS kernel** → HTTP POST
4. **AIOS orchestrates Lumina agent** → 5-stage pipeline
   - Stage 1: Query Processing
   - Stage 2: Lesson Planning
   - Stage 3: Script Generation
   - Stage 4: Animation Synthesis
   - Stage 5: Optimization
5. **Events stream back** → SSE to frontend
6. **Activity stream updates** → Real-time display
7. **Video renders** → Shows in canvas

## 🧪 Testing

### Health Check
```bash
# Check AIOS kernel is running
curl http://localhost:8000/health
# Response: {"status":"ok"}

# Get Lumina agent info
curl http://localhost:8000/api/agent/lumina
```

### Test Query
1. Navigate to workspace
2. Ask: "Why is the sky blue?"
3. Watch activity stream
4. See generated video

## 🆘 Troubleshooting

### Kernel won't start
```bash
# Check Python version
python3 --version  # Must be 3.10+

# Check ports
lsof -i :8000  # AIOS port

# Reinstall dependencies
cd aios-kernel
pip install -r requirements.txt
```

### Connection error
```bash
# Verify kernel is running
curl http://localhost:8000/health

# Check firewall allows port 8000
sudo lsof -i :8000

# Restart kernel
# Ctrl+C to stop, then python kernel.py
```

### API key errors
```bash
# Check .env has keys
cat aios-kernel/.env

# Verify Gemini key is valid
# https://makersuite.google.com/app/apikey
```

## 📦 Deployment

### Local Development (Current)
- AIOS: `localhost:8000`
- Next.js: `localhost:3000`

### Production (Future)

**Option 1: Separate servers**
```
AIOS Kernel Server (AWS/GCP)
     ↓
Next.js Server (Vercel)
```

**Option 2: Single server**
```
Server (Docker container)
├─ AIOS kernel (port 8000)
└─ Next.js app (port 3000)
```

## 🎯 Key Features

✅ **5-stage tutoring pipeline** - Query → Lesson → Script → Animation → Optimize
✅ **Real-time activity stream** - Watch agent reasoning
✅ **Resume capability** - Continue from failed stage
✅ **Retry logic** - Automatic retries on rate limit
✅ **Checkpointing** - State persistence
✅ **Streaming events** - Live updates to frontend
✅ **Video generation** - Manim animations
✅ **Multi-agent ready** - Easy to add more agents

## 📚 Files

| File | Purpose |
|------|---------|
| `aios-kernel/kernel.py` | AIOS server |
| `aios-kernel/agents/lumina_agent.py` | Lumina pipeline |
| `lib/aios-kernel-client.ts` | Next.js client |
| `app/api/lumina/query/route.ts` | API proxy |

## 🔄 Next Steps

### Week 1: Validate
- [ ] Test with various STEM questions
- [ ] Monitor for errors in AIOS kernel
- [ ] Check activity stream accuracy

### Week 2-3: Enhance
- [ ] Add Claude as fallback model
- [ ] Implement provider selection
- [ ] Add more tutoring agents

### Month 2+: Scale
- [ ] Deploy to cloud
- [ ] Multi-tenant support
- [ ] Advanced resource management

## 💡 Pro Tips

### Monitor AIOS Kernel
```bash
# Keep a terminal watching kernel logs
watch -n 1 'curl -s http://localhost:8000/health'

# Or check specific run
curl http://localhost:8000/api/lumina/query?run_id=...
```

### Debug Events
```javascript
// In browser console while query running
const es = new EventSource('/api/lumina/query');
es.addEventListener('message', (e) => {
  const event = JSON.parse(e.data);
  console.log(event);
});
```

### Manually Call Kernel
```bash
curl -X POST http://localhost:8000/api/lumina/query \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "query": "Why is water blue?",
    "mode": "explain"
  }'
```

## 📖 Learn More

See `AIOS_MIGRATION_COMPLETE.md` for:
- Full architecture details
- Performance metrics
- Deployment options
- Troubleshooting guide
- Future roadmap

---

**You're all set! 🎉** Start the kernel and app, then visit the workspace!
