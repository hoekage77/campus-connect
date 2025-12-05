FROM manimcommunity/manim:latest

# Install Node.js 20 for Next.js
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install additional Python packages
RUN pip install --no-cache-dir \
    google-generativeai \
    python-dotenv

# Create workspace directory
WORKDIR /workspace

# Expose Next.js development port
EXPOSE 3000

# Default command
CMD ["bash"]
