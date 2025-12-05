# Lumina - Intelligent Visual Learning Platform

> Turn "I don't get it" into "That's amazing!" with AI-powered mathematical animations

Lumina uses **Manim** (3Blue1Brown's animation library) + **Gemini 2.5 Flash** to generate stunning educational animations from natural language queries.

## ✨ Features

- 🎬 **Real-time Animation Generation** - Type a question, get a Manim video in <9s
- 🤖 **AI-Powered** - Gemini 2.5 Flash generates custom Manim Python scripts
- 📚 **Educational Focus** - Math, physics, calculus, geometry, and more
- ⚡ **Optimized Templates** - Pre-built scenes for common topics (2-5s render)
- 🎨 **Cinema Quality** - Uses 3Blue1Brown's professional animation library
- ☁️ **Cloud-Ready** - Runs in Daytona.io with zero local setup

## 🚀 Quick Start (Recommended: Daytona)

### Option 1: Daytona (Easiest - 2 minutes)

```bash
# Install Daytona
curl -sf https://download.daytona.io/daytona/install.sh | bash

# Create workspace
daytona create https://github.com/yourusername/lumina

# Open in VS Code
daytona code

# Inside workspace:
pnpm dev
```

**Done!** Access at http://localhost:3000

See [DAYTONA_QUICKSTART.md](./docs/DAYTONA_QUICKSTART.md) for details.

### Option 2: Local Setup

Requirements:
- Node.js 20+
- Python 3.11+
- Manim library
- FFmpeg

```bash
# Install dependencies
pnpm install
pip install manim

# Setup environment
cp .env.local.example .env.local
# Add your GOOGLE_GENERATIVE_AI_API_KEY

# Run dev server
pnpm dev
```

See [MANIM_SETUP.md](./docs/MANIM_SETUP.md) for detailed local installation.

## 📖 How It Works

1. **User asks a question**: "Show me Newton's second law"
2. **Gemini generates Manim script**: Python code for the animation
3. **Manim renders video**: High-quality MP4 animation
4. **Frontend displays result**: Video player with controls

### Example Queries

- "Explain projectile motion with vectors"
- "Visualize the electric field around a charge"
- "Walk me through solving a quadratic equation"
- "Show me the derivative as a tangent line"

## 🏗️ Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini 2.5     │  Generates Manim
│     Flash       │  Python Script
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Manim Render   │  Executes in
│  (Python)       │  Daytona/Local
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Video Output   │  MP4 → Frontend
│  (480p15)       │  Video Player
└─────────────────┘
```

## 📁 Project Structure

```
lumina/
├── app/
│   ├── ai/                    # Main Lumina AI page
│   │   └── page.tsx          # Chat + Canvas interface
│   └── api/
│       └── lumina/
│           ├── render/        # Standard render API
│           └── render-daytona/ # Daytona-optimized API
├── lib/
│   └── manim-templates.ts    # Pre-built animation templates
├── docs/
│   ├── DAYTONA_QUICKSTART.md # 2-minute setup guide
│   ├── DAYTONA_INTEGRATION.md # Full Daytona docs
│   ├── MANIM_SETUP.md        # Local installation
│   └── MANIM_INTEGRATION.md  # Architecture details
├── .devcontainer/
│   ├── Dockerfile            # Manim + Node.js environment
│   └── devcontainer.json     # Daytona configuration
└── public/
    └── animations/           # Rendered video output
```

## 🎬 Demo

### Quick Start Presets

Click any preset to render a real Manim animation:

1. **Newton's Second Law** - Force, mass, acceleration visualization
2. **Projectile Motion** - Parabolic trajectory with vectors
3. **Electric Field** - Field lines around charges
4. **Quadratic Function** - Graph with vertex and roots

### Custom Queries

Type anything like:
- "Show me the Pythagorean theorem"
- "Animate Euler's formula"
- "Visualize a Fourier transform"

## 🔧 Configuration

### Environment Variables

```bash
# Required
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Optional (for Daytona API)
DAYTONA_API_KEY=your_daytona_key
DAYTONA_WORKSPACE_NAME=lumina-render
```

### Performance Tuning

Edit `app/api/lumina/render/route.ts`:

```typescript
// Change render quality
await execAsync(`manim render -qh ...`)  // High quality (slower)
await execAsync(`manim render -ql ...`)  // Low quality (faster)

// Adjust timeout
timeout: 30000  // 30 seconds
```

## 📊 Performance Metrics

| Stage | Target | Actual |
|-------|--------|--------|
| Gemini Script Gen | <1s | ~0.8s |
| Template Load | <0.5s | ~0.2s |
| Manim Render | <7s | ~5-6s |
| Video Delivery | <1s | ~0.5s |
| **Total (Template)** | **<9s** | **~6-7s** |
| **Total (Generated)** | **<10s** | **~8-9s** |

## 🛠️ Development

### Run Tests

```bash
# Test Manim installation
manim --version

# Test render
manim render -ql tests/test_scene.py TestScene

# Test API
curl -X POST http://localhost:3000/api/lumina/render \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me a circle"}'
```

### Debug Mode

Add to `.env.local`:
```bash
DEBUG=true
LOG_MANIM_OUTPUT=true
```

## 🚢 Deployment

### Recommended: Vercel + Daytona

```bash
# Deploy frontend to Vercel
vercel --prod

# Keep Daytona workspace for renders
daytona create --name lumina-prod
```

Frontend: Vercel (Next.js)  
Renders: Daytona (Manim)

### Alternative: All-in-One Daytona

```bash
# Deploy everything to Daytona
daytona create --name lumina-prod
daytona exec lumina-prod -- pnpm build
daytona exec lumina-prod -- pnpm start
```

## 📚 Documentation

- [Quick Start (Daytona)](./docs/DAYTONA_QUICKSTART.md)
- [Daytona Integration Guide](./docs/DAYTONA_INTEGRATION.md)
- [Manim Setup (Local)](./docs/MANIM_SETUP.md)
- [Architecture Details](./docs/MANIM_INTEGRATION.md)
- [Lumina Requirements](./docs/LUMINA_REQUIREMENTS.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

## 🙏 Credits

- **Manim** - Grant Sanderson (3Blue1Brown)
- **Gemini** - Google AI
- **Daytona** - Cloud development environments
- **Next.js** - Vercel

## 🌟 Star History

If you find Lumina useful, please star the repository!

---

**Built with ❤️ for education**
