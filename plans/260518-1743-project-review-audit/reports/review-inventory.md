---
title: "Bao cao inventory he thong AdVisor"
date: "2026-05-18"
scope: "Local Docker, static review"
sourcePlan: "plans/260518-1743-project-review-audit/plan.md"
---

# Bao cao inventory he thong AdVisor

## Summary
- Kien truc 4 dich vu: frontend (Vite/React), backend (Express/Prisma), ai_service (FastAPI/Gemini), db (Postgres).
- Flow chinh: Quiz -> Strategy chat -> Content assist -> Metrics snapshot.
- Du lieu luu tai Postgres, nhieu truong JSON cho quiz/strategy/metrics.

## System topology

| Dich vu | Cong nghe | Port | Ghi chu |
|---|---|---|---|
| frontend | Vite build + Nginx | 80 | Proxy /api sang backend |
| backend | Express + Prisma | 3000 | API chinh, JWT + Firebase token |
| ai_service | FastAPI + google-genai | 8000 | AI chat + examples |
| db | Postgres 17 | 5432 | Luu user/campaign/chat/metrics |

## Config surface (ENV)

**.env.example**
- GEMINI_API_KEY
- JWT_SECRET

**docker-compose.yml**
- DATABASE_URL
- GEMINI_API_KEY
- JWT_SECRET
- FRONTEND_URL (default http://localhost)
- AI_SERVICE_URL (http://ai_service:8000)
- NODE_ENV
- PORT (backend=3000, ai_service=8000)

**Frontend Vite env**
- VITE_API_URL
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

**AI service settings (tu code)**
- BACKEND_URL (default http://backend:3000)
- model_name (gemini-3-flash-preview)

## Data model (Postgres)
- User: id, email, password, name, avatar, role, timestamps
- Campaign: name, status, quizData (JSON), quizProgress (JSON), strategy (JSON)
- Chat: role, pane, kind, metadata (JSON), content, createdAt
- CampaignMetricsSnapshot: periodStart/End, label, metrics (JSON)

## Key flows (API)
- Auth: /api/auth/register, /api/auth/login, /api/auth/me
- User profile: /api/users/me, /api/users/me/password
- Campaign: /api/campaigns, /api/campaigns/:id, /api/campaigns/:id/quiz-progress
- Chat: /api/chat/message, /api/chat/history, /api/chat/assist
- Metrics: /api/campaigns/:id/metrics

## Dependencies (high level)
- Backend: express, prisma, zod, bcryptjs, jsonwebtoken, firebase-admin
- Frontend: react, react-router, i18next, motion, react-markdown
- AI service: fastapi, google-genai, pydantic

## Open questions
1. AI flow chinh: su dung ai_service de ep format, GEMINI chi de goi API.
2. Firebase auth optional; co the go bo neu gay phi phuc. Neu go, can define ro luong auth JWT thuong.
3. Avatar co gioi han kich thuoc; neu bo Google auth thi avatar la upload file.
4. Chua ro yeu cau cache/CDN/log/metrics o production.
