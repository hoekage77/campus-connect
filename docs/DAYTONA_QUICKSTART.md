# 🚀 Quick Start with Daytona

Get Lumina running with Manim in under 2 minutes using Daytona!

## Why Daytona?

- ✅ **Zero Setup** - No manual Python/Manim installation needed
- ✅ **Fully Configured** - Everything pre-installed (Manim, FFmpeg, LaTeX, Node.js)
- ✅ **Instant Start** - Workspace ready in 30 seconds
- ✅ **Cloud-Based** - Works on any device, any OS
- ✅ **Team Ready** - Share workspaces with your team

## Prerequisites

None! Daytona handles everything.

## Setup (3 steps)

### 1. Install Daytona CLI

```bash
curl -sf https://download.daytona.io/daytona/install.sh | bash
```

### 2. Start Daytona Server

```bash
daytona server
```

Follow the prompts to create your account at https://app.daytona.io

### 3. Create Lumina Workspace

```bash
# Clone and create workspace in one command
daytona create https://github.com/yourusername/lumina

# Or create from local directory
cd /path/to/lumina
daytona create
```

That's it! Daytona will:
1. Pull the Manim Docker image
2. Install all dependencies
3. Run `pnpm install`
4. Forward port 3000 to your local machine

## Usage

### Open in VS Code

```bash
daytona code
```

This opens VS Code connected to your Daytona workspace. Everything runs in the cloud!

### Start Development Server

Inside the Daytona workspace terminal:

```bash
pnpm dev
```

Access at http://localhost:3000 (automatically port-forwarded)

### Test Manim

```bash
# Check Manim is installed
manim --version

# Render a test animation
manim render -ql tests/test_scene.py TestScene
```

## Environment Variables

Create `.env.local` in your workspace:

```bash
# Inside Daytona workspace
cat > .env.local << EOF
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
EOF
```

## API Endpoint

The application automatically detects it's running in Daytona and uses `/api/lumina/render-daytona` which:

- ✅ Assumes Manim is pre-installed
- ✅ No workspace provisioning needed
- ✅ Faster execution (<7s render time)
- ✅ Better error messages

## Common Commands

```bash
# List workspaces
daytona list

# Stop workspace
daytona stop lumina

# Start workspace
daytona start lumina

# Delete workspace
daytona delete lumina

# Access workspace shell
daytona exec lumina -- bash

# Run command in workspace
daytona exec lumina -- manim --version
```

## Troubleshooting

### "Port 3000 already in use"

```bash
# Stop the workspace
daytona stop lumina

# Start again (will use new port)
daytona start lumina
```

### "Cannot connect to workspace"

```bash
# Restart Daytona server
daytona server restart
```

### "Manim command not found"

The workspace might not be fully initialized. Try:

```bash
# Rebuild workspace
daytona delete lumina
daytona create
```

## Production Deployment

### Option 1: Keep Daytona Workspace Running

```bash
# Create production workspace
daytona create --name lumina-prod

# Build and start
daytona exec lumina-prod -- pnpm build
daytona exec lumina-prod -- pnpm start
```

### Option 2: Deploy Frontend + Daytona for Renders

```bash
# Deploy frontend to Vercel
vercel --prod

# Keep Daytona workspace for Manim renders only
# Update API route to use Daytona CLI/API
```

## Cost

Daytona pricing:
- **Free tier**: 50 hours/month
- **Pro**: $10/month for 100 hours
- **Team**: $25/user/month unlimited

Perfect for development and small-scale production!

## Next Steps

1. ✅ Create Daytona workspace
2. ✅ Set environment variables
3. ✅ Run `pnpm dev`
4. ✅ Navigate to `/ai` page
5. ✅ Click "Explain Newton's second law"
6. ✅ Watch real Manim animation render!

## Resources

- [Daytona Documentation](https://www.daytona.io/docs)
- [Full Integration Guide](./DAYTONA_INTEGRATION.md)
- [Manim Documentation](https://docs.manim.community/)
- [Daytona Discord](https://discord.gg/daytona)

---

**Ready in 2 minutes. No configuration needed. Just works.** 🎉
