# 📚 Lumina API Documentation

Welcome to the Lumina API documentation!

## Quick Links

### 🌐 Interactive API Explorer
👉 **[View Swagger UI](http://localhost:3000/api-docs.html)**

Browse all endpoints, view schemas, and test API calls directly in your browser.

### 📄 Documentation Files

- **[API_REFERENCE.md](./API_REFERENCE.md)** - Quick reference guide
- **[openapi.yaml](./openapi.yaml)** - Complete OpenAPI 3.0 specification
- **[MANIM_INTEGRATION.md](./MANIM_INTEGRATION.md)** - Manim rendering architecture
- **[DAYTONA_INTEGRATION.md](./DAYTONA_INTEGRATION.md)** - Daytona cloud setup
- **[LUMINA_REQUIREMENTS.md](./LUMINA_REQUIREMENTS.md)** - Full platform requirements

## Key Endpoints

### 🎬 Animation Generation

```bash
POST /api/lumina/render
POST /api/lumina/render-daytona
```

Generate Manim animations from natural language queries.

### 👤 Users & Groups

```bash
GET  /api/users/{id}
GET  /api/groups
GET  /api/groups/{id}
POST /api/groups/{id}/sessions
```

### 💬 Messaging & Notifications

```bash
GET /api/messages
GET /api/notifications
```

## Usage Examples

### JavaScript (Fetch API)

```javascript
// Render animation
const response = await fetch('/api/lumina/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Show me Newton\'s second law',
    preset: 'newtonSecondLaw'
  })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value)
  // Process SSE events
}
```

### cURL

```bash
# Render animation
curl -X POST http://localhost:3000/api/lumina/render \
  -H "Content-Type: application/json" \
  -d '{"query":"Show projectile motion","preset":"projectileMotion"}' \
  --no-buffer

# Get user profile
curl http://localhost:3000/api/users/usr_abc123

# List groups
curl "http://localhost:3000/api/groups?type=study"
```

### Python

```python
import requests
import json

def render_animation(query):
    url = 'http://localhost:3000/api/lumina/render'
    response = requests.post(url, json={'query': query}, stream=True)
    
    for line in response.iter_lines():
        if line.startswith(b'data: '):
            data = json.loads(line[6:])
            if data['type'] == 'complete':
                return data['videoUrl']
```

## Response Formats

### Success (Lumina Render)

```json
{
  "type": "complete",
  "videoUrl": "/animations/abc123.mp4",
  "duration": 8,
  "metadata": {
    "resolution": "480p",
    "sceneName": "ProjectileMotion"
  }
}
```

### Error

```json
{
  "type": "error",
  "message": "Manim not installed",
  "code": "MANIM_NOT_AVAILABLE"
}
```

## Authentication

Include session cookie in requests:

```javascript
fetch('/api/groups', {
  credentials: 'include'
})
```

## Rate Limits

- **Render API**: 10 requests/minute
- **Other endpoints**: 100 requests/minute

## Testing

### Local Development

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. View API docs:
   ```
   http://localhost:3000/api-docs.html
   ```

3. Test endpoint:
   ```bash
   curl http://localhost:3000/api/groups
   ```

### Daytona Environment

```bash
# Create workspace
daytona create

# Run tests
daytona exec lumina -- pnpm test:api
```

## Tools & SDKs

- **Swagger UI**: http://localhost:3000/api-docs.html
- **OpenAPI Spec**: `/docs/openapi.yaml`
- **Postman Collection**: Import OpenAPI spec
- **Insomnia**: Import OpenAPI spec

## Support

- 📖 **Full Docs**: [lumina.dev/docs](https://lumina.dev/docs)
- 💬 **Discord**: [discord.gg/lumina](https://discord.gg/lumina)
- 🐛 **Issues**: [github.com/lumina/issues](https://github.com/yourusername/lumina/issues)
- 📧 **Email**: support@lumina.dev

---

**Happy coding!** 🚀
