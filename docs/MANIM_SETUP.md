# Manim Setup Guide

Lumina now executes Manim **directly on the server** for rendering mathematical animations. No external services required!

## Installation Steps

### 1. Install Python (if not already installed)

```bash
# macOS (using Homebrew)
brew install python@3.11

# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3-pip

# Verify installation
python3 --version
```

### 2. Install Manim

```bash
# Install Manim Community Edition
pip3 install manim

# Verify installation
manim --version
```

### 3. Install System Dependencies

Manim requires some system dependencies:

#### macOS:
```bash
brew install ffmpeg
brew install pango
```

#### Ubuntu/Debian:
```bash
sudo apt install ffmpeg
sudo apt install libcairo2-dev libpango1.0-dev
```

### 4. Set up Gemini API Key

1. Get your API key from: https://makersuite.google.com/app/apikey
2. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
3. Add your API key to `.env.local`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key_here
   ```

### 5. Test Manim Installation

Create a test script:

```python
# test_manim.py
from manim import *

class TestScene(Scene):
    def construct(self):
        text = Text("Manim Works!")
        self.play(Write(text))
        self.wait(1)
```

Render it:

```bash
manim render -ql test_manim.py TestScene
```

If successful, you should see a video file generated in `media/videos/test_manim/480p15/TestScene.mp4`

## Running the Application

1. Install Node.js dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Navigate to the AI page (`/ai`) and try asking for an animation!

## Example Queries

Try these in the Lumina AI chat:

- "Explain Newton's second law with an animation"
- "Show me projectile motion with vectors"
- "Visualize the electric field around a charge"
- "Walk me through solving a quadratic equation"
- "Animate the derivative as the slope of a tangent line"

## How It Works

1. **User Input**: You type a natural language query
2. **Gemini Generation**: Gemini 2.5 Flash generates a valid Manim Python script
3. **Validation**: Script is checked for security (no dangerous imports)
4. **Rendering**: Manim renders the animation (typically 5-8 seconds)
5. **Delivery**: Video is saved to `public/animations/` and streamed to browser
6. **Display**: Video player shows the rendered animation with controls

## Troubleshooting

### "Manim not installed on server"

This means Python Manim is not available. The backend will still generate scripts but cannot render videos. Follow the installation steps above.

### Slow rendering

- Manim rendering can take 5-10 seconds depending on scene complexity
- The `-ql` (low quality) flag is used for speed - you can change this in the API route
- Consider pre-rendering common animations and caching them

### Script generation errors

- Check your Gemini API key is valid and has credits
- Review the generated script in the console logs
- Some complex queries may need more specific prompts

## Performance Optimization

1. **Caching**: Common animations can be pre-rendered and cached
2. **Quality Settings**: Use `-ql` for fast renders, `-qh` for high quality
3. **Template Library**: Pre-built templates in `lib/manim-templates.ts` render faster
4. **Queue System**: For production, implement a queue for concurrent requests

## Development vs Production

### Development (Current Setup)
- Manim runs directly on the server
- Videos stored in `public/animations/`
- No caching or optimization

### Production Recommendations
- Use Docker container with Manim pre-installed
- Implement Redis caching for rendered animations
- Use CDN for video delivery (Cloudflare, AWS CloudFront)
- Add background job queue (Bull, BullMQ)
- Set resource limits and timeouts
- Implement rate limiting per user

## Resources

- **Manim Documentation**: https://docs.manim.community/
- **Manim Examples**: https://docs.manim.community/en/stable/examples.html
- **3Blue1Brown Videos**: https://www.youtube.com/c/3blue1brown
- **Gemini API Docs**: https://ai.google.dev/docs
- **Lumina Architecture**: See `docs/MANIM_INTEGRATION.md`
