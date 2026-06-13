# AdVisor - AI Marketing Platform

AI-powered marketing strategy platform built with React, Express, FastAPI, and PostgreSQL.

## Quick Start

```bash
# Run the application
.\run.bat
```

This will:
1. Build all Docker containers
2. Start the database, backend, AI service, and frontend
3. Open http://localhost in your browser

## Architecture

| Service | Technology | Port |
|---------|------------|------|
| Frontend | React + Vite + TypeScript | 80 |
| Backend | Express + Prisma + TypeScript | 3000 |
| AI Service | FastAPI + Gemini | 8000 |
| Database | PostgreSQL 17 | 5432 |

## Features

- **Advanced Dual-Pane Architecture**: Resizable split-pane chat interface featuring a Strategy Analyst and a dedicated AI Content Writer.
- **Dynamic Conditional Rendering**: Content Writer pane appears intelligently once the user completes the Smart Quiz or engages in the chat.
- **One-Click Strategy Transfer**: Easily push AI-generated marketing strategies to the Content Assistant with an intuitive arrow button, preserving context.
- **Multi-Stage Smart Quiz**: Collects actionable business insights (product, target audience, region, budget) to ground the AI's recommendations.
- **Comprehensive Insights Dashboard**: Features clear summaries of quiz data, active marketing metrics, and a history of previous campaigns.
- **Interactive UI Components**: Includes Marketing Glossary, customizable Quiz inputs, and a seamless bilingual experience (English / Vietnamese).
- **Graceful Error Handling**: Fallbacks are provided when the AI upstream is temporarily unavailable.

## Project Structure

```
GR1/
├── backend/          # Express API
├── ai_service/       # FastAPI AI service
├── frontend/         # React frontend
├── docker-compose.yml
├── run.bat          # Startup script
└── .env             # Environment variables
```

## Environment Variables

The `.env` file contains:
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET` - Secret for JWT tokens

## Development

```bash
# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Access database
docker exec -it ai_marketing_db psql -U admin -d ai_marketing
```

## AI Utilities

```bash
# Smoke-test AI service endpoints
cd ai_service
python scripts/smoke_test.py

# Optional: target a custom base URL
python scripts/smoke_test.py http://localhost:8000
```

Available AI endpoints:
- `GET /health`
- `GET /examples`
- `POST /chat`

## License

MIT

*Last updated: 2026-06-13*
