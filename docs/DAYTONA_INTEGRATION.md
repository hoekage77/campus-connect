# Daytona.io Integration Guide for Lumina

## Overview

Daytona.io provides cloud-based development environments (CDEs) that give you instant access to a full Linux environment with all tools pre-installed. This is perfect for Lumina because:

- ✅ **No local Python setup needed** - Everything runs in the cloud
- ✅ **Pre-configured environment** - Manim, FFmpeg, dependencies already installed
- ✅ **Isolated & secure** - Code execution happens in sandboxed containers
- ✅ **Scalable** - Multiple concurrent renders without local resource limits
- ✅ **Team collaboration** - Share environments with your team
- ✅ **Fast provisioning** - New environments spin up in seconds

---

## Architecture with Daytona

### System Flow

```
User Query → Next.js API → Gemini 2.5 Flash → Manim Script
                                                    ↓
                                            Daytona Workspace
                                            (Linux + Python + Manim)
                                                    ↓
                                            Video Rendering
                                                    ↓
                                            Upload to Storage
                                                    ↓
                                            Return URL to Frontend
```

### Why Daytona for Lumina?

| Feature | Benefit |
|---------|---------|
| **Full Linux OS** | Native Manim support, FFmpeg, LaTeX, all dependencies |
| **Instant Setup** | No manual Python/Manim installation |
| **Reproducible** | Same environment every time, no "works on my machine" |
| **API Access** | Programmatically create workspaces and run commands |
| **Resource Isolation** | Each render runs in its own container |
| **Cost Effective** | Pay only for what you use, auto-scale |

---

## Setup Steps

### 1. Install Daytona CLI

```bash
# macOS/Linux
curl -sf https://download.daytona.io/daytona/install.sh | bash

# Verify installation
daytona version
```

### 2. Create Daytona Account

```bash
# Initialize and login
daytona server

# Follow prompts to create account at https://app.daytona.io
```

### 3. Create Lumina Workspace Configuration

Create a `devcontainer.json` for your Lumina environment:

```bash
mkdir -p .devcontainer
```

**`.devcontainer/devcontainer.json`:**

```json
{
  "name": "Lumina Manim Environment",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/common-utils:2": {}
  },
  "postCreateCommand": "pip install manim && npm install -g pnpm",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  },
  "forwardPorts": [3000, 8000],
  "remoteUser": "vscode"
}
```

### 4. Alternative: Use Pre-built Manim Image

Create a custom `Dockerfile`:

**`.devcontainer/Dockerfile`:**

```dockerfile
FROM manimcommunity/manim:latest

# Install Node.js for Next.js
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Install additional Python packages
RUN pip install --no-cache-dir \
    google-generativeai \
    python-dotenv

# Set working directory
WORKDIR /workspace

# Expose Next.js port
EXPOSE 3000

CMD ["bash"]
```

**`.devcontainer/devcontainer.json`:**

```json
{
  "name": "Lumina Manim Environment",
  "build": {
    "dockerfile": "Dockerfile"
  },
  "forwardPorts": [3000],
  "postCreateCommand": "pnpm install",
  "remoteUser": "root"
}
```

### 5. Launch Daytona Workspace

```bash
# Create workspace from current directory
daytona create

# Or create from Git repository
daytona create https://github.com/yourusername/lumina --devcontainer-path .devcontainer/devcontainer.json

# List workspaces
daytona list

# Access workspace
daytona code lumina
```

---

## API Integration with Daytona

### Option 1: Daytona as Render Worker

Update your render API to use Daytona workspaces:

**`app/api/lumina/render-daytona/route.ts`:**

```typescript
import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { GoogleGenerativeAI } from '@google/generative-ai'

const execAsync = promisify(exec)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const { query } = await req.json()

  ;(async () => {
    try {
      // Stage 1: Generate script
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'progress',
            progress: 10,
            message: 'Generating Manim script...',
          })}\n\n`
        )
      )

      const prompt = `Generate a Manim Python script for: "${query}"`
      const result = await model.generateContent(prompt)
      const scriptCode = result.response.text()
        .replace(/```python\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      // Stage 2: Execute in Daytona workspace
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'progress',
            progress: 30,
            message: 'Executing in Daytona workspace...',
          })}\n\n`
        )
      )

      // Get or create Daytona workspace
      const workspaceId = await ensureDaytonaWorkspace()

      // Write script to workspace
      const scriptId = Date.now().toString()
      await execAsync(
        `daytona exec ${workspaceId} -- bash -c "echo '${scriptCode.replace(/'/g, "'\\''")}' > /tmp/scene_${scriptId}.py"`
      )

      // Render in Daytona
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'progress',
            progress: 50,
            message: 'Rendering animation in cloud...',
          })}\n\n`
        )
      )

      const { stdout } = await execAsync(
        `daytona exec ${workspaceId} -- manim render -ql --format=mp4 /tmp/scene_${scriptId}.py`
      )

      // Copy video from workspace
      const videoPath = extractVideoPath(stdout)
      await execAsync(
        `daytona exec ${workspaceId} -- cat ${videoPath} > ./public/animations/${scriptId}.mp4`
      )

      const videoUrl = `/animations/${scriptId}.mp4`

      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'complete',
            videoUrl,
          })}\n\n`
        )
      )

      await writer.close()
    } catch (error: any) {
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'error',
            message: error.message,
          })}\n\n`
        )
      )
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function ensureDaytonaWorkspace(): Promise<string> {
  try {
    // Check if workspace exists
    const { stdout } = await execAsync('daytona list --output json')
    const workspaces = JSON.parse(stdout)
    const existing = workspaces.find((w: any) => w.name === 'lumina-render')

    if (existing) {
      return existing.id
    }

    // Create new workspace
    await execAsync('daytona create --name lumina-render --image manimcommunity/manim:latest')
    const newWorkspaces = JSON.parse((await execAsync('daytona list --output json')).stdout)
    return newWorkspaces.find((w: any) => w.name === 'lumina-render').id
  } catch (error) {
    throw new Error('Failed to provision Daytona workspace')
  }
}

function extractVideoPath(manimOutput: string): string {
  const match = manimOutput.match(/File ready at '(.+\.mp4)'/)
  return match ? match[1] : ''
}
```

### Option 2: Daytona API (Programmatic)

Use Daytona's API for more control:

```typescript
import axios from 'axios'

const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY
const DAYTONA_API_URL = 'https://api.daytona.io/v1'

async function createRenderWorkspace() {
  const response = await axios.post(
    `${DAYTONA_API_URL}/workspaces`,
    {
      name: `lumina-render-${Date.now()}`,
      image: 'manimcommunity/manim:latest',
      resources: {
        cpu: '2',
        memory: '4Gi',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${DAYTONA_API_KEY}`,
      },
    }
  )

  return response.data.id
}

async function executeInWorkspace(workspaceId: string, command: string) {
  const response = await axios.post(
    `${DAYTONA_API_URL}/workspaces/${workspaceId}/exec`,
    {
      command,
      timeout: 30000,
    },
    {
      headers: {
        Authorization: `Bearer ${DAYTONA_API_KEY}`,
      },
    }
  )

  return response.data
}
```

---

## Development Workflow with Daytona

### 1. Local Development (Fast Iteration)

```bash
# Start Daytona workspace
daytona create

# Open in VS Code (automatically connects)
daytona code

# Run dev server (inside Daytona)
pnpm dev

# Access at http://localhost:3000 (port forwarded automatically)
```

### 2. Production Deployment

**Option A: Deploy Daytona Workspace**

```bash
# Create production workspace
daytona create --name lumina-prod --image manimcommunity/manim:latest

# Deploy Next.js app
daytona exec lumina-prod -- pnpm build
daytona exec lumina-prod -- pnpm start

# Keep workspace running for render requests
```

**Option B: Deploy to Vercel + Daytona for Renders**

```bash
# Deploy frontend to Vercel
vercel --prod

# Keep Daytona workspace for rendering only
# Frontend calls API which uses Daytona CLI/API
```

### 3. CI/CD Pipeline

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy Lumina

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Daytona CLI
        run: |
          curl -sf https://download.daytona.io/daytona/install.sh | bash

      - name: Setup Daytona
        env:
          DAYTONA_API_KEY: ${{ secrets.DAYTONA_API_KEY }}
        run: |
          daytona server --api-key $DAYTONA_API_KEY

      - name: Create/Update Workspace
        run: |
          daytona create --name lumina-prod || daytona update lumina-prod

      - name: Deploy Application
        run: |
          daytona exec lumina-prod -- git pull
          daytona exec lumina-prod -- pnpm install
          daytona exec lumina-prod -- pnpm build
```

---

## Environment Variables

Update your `.env.local`:

```bash
# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key

# Daytona Configuration
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_WORKSPACE_NAME=lumina-render
DAYTONA_API_URL=https://api.daytona.io/v1

# Optional: S3 for video storage
AWS_S3_BUCKET=lumina-animations
AWS_REGION=us-east-1
```

---

## Cost Optimization

### Workspace Lifecycle

```typescript
// Auto-destroy workspaces after render completes
async function renderWithCleanup(scriptCode: string) {
  const workspaceId = await createRenderWorkspace()

  try {
    const videoUrl = await executeRender(workspaceId, scriptCode)
    return videoUrl
  } finally {
    // Clean up workspace after 5 minutes
    setTimeout(async () => {
      await deleteWorkspace(workspaceId)
    }, 5 * 60 * 1000)
  }
}
```

### Workspace Pooling

```typescript
// Keep pool of 3 warm workspaces
const WORKSPACE_POOL_SIZE = 3
const workspacePool: string[] = []

async function getOrCreateWorkspace() {
  if (workspacePool.length > 0) {
    return workspacePool.pop()!
  }

  return await createRenderWorkspace()
}

async function releaseWorkspace(workspaceId: string) {
  if (workspacePool.length < WORKSPACE_POOL_SIZE) {
    workspacePool.push(workspaceId)
  } else {
    await deleteWorkspace(workspaceId)
  }
}
```

---

## Testing the Integration

### 1. Test Daytona Setup

```bash
# Create test workspace
daytona create --name test-manim --image manimcommunity/manim:latest

# Test Manim
daytona exec test-manim -- manim --version

# Test render
daytona exec test-manim -- bash -c "echo 'from manim import *
class Test(Scene):
    def construct(self):
        text = Text(\"Hello Daytona!\")
        self.play(Write(text))
' > test.py && manim render -ql test.py Test"

# Cleanup
daytona delete test-manim
```

### 2. Test API Integration

```bash
# Set environment variables
export DAYTONA_API_KEY=your_key

# Call render API
curl -X POST http://localhost:3000/api/lumina/render-daytona \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me a circle"}'
```

---

## Advantages Over Local Setup

| Feature | Local Setup | Daytona Setup |
|---------|-------------|---------------|
| **Installation** | Manual, complex | Instant, pre-configured |
| **Dependencies** | Breaks easily | Always consistent |
| **Scalability** | Limited by local CPU | Cloud-scale |
| **Team Sharing** | Hard to replicate | Share workspace URL |
| **Security** | Runs on your machine | Isolated containers |
| **Maintenance** | You manage | Daytona manages |

---

## Next Steps

1. ✅ Install Daytona CLI
2. ✅ Create `.devcontainer` configuration
3. ✅ Test workspace creation
4. ✅ Update API route to use Daytona
5. ✅ Deploy to production
6. ✅ Monitor render performance

## Resources

- **Daytona Docs**: https://www.daytona.io/docs
- **Daytona CLI Reference**: https://www.daytona.io/docs/cli
- **Manim in Daytona**: Use official `manimcommunity/manim` Docker image
- **Support**: https://discord.gg/daytona
