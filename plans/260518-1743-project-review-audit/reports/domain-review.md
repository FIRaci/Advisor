---
title: "Danh gia theo tung mang"
date: "2026-05-18"
scope: "Local Docker, static review"
sourcePlan: "plans/260518-1743-project-review-audit/plan.md"
---

# Danh gia theo tung mang

## 1) Security / Auth

### Diem manh
- Zod validation bao phu endpoints chinh (auth, campaign, chat, user). (backend/src/routes/auth.ts, backend/src/routes/campaign.ts, backend/src/routes/chat.ts, backend/src/routes/user.ts)
- Rate limiting cho /api va auth routes. (backend/src/index.ts)

### Diem yeu / rui ro
- High: CORS cho phep moi origin + credentials (origin: true). Co nguy co CSRF va token leakage. (backend/src/index.ts)
- High: authMiddleware fallback secret "fallback_secret" neu thieu JWT_SECRET -> de bi gia mao token. (backend/src/middleware/auth.ts)
- Medium: Firebase Admin init khong dung service account; verifyIdToken co the fail, lam fallback JWT path hoat dong khong kiem soat. (backend/src/lib/firebaseAdmin.ts)
- Medium: Firebase user duoc upsert voi password chuoi plain "firebase_auth_no_password". Nen hash hoac luu authProvider. (backend/src/middleware/auth.ts, backend/prisma/schema.prisma)
- Medium: Firebase optional -> can quyet dinh co giu Google auth hay don gian hoa JWT-only de giam mat cong bao tri.
- Medium: Token luu trong localStorage -> rui ro XSS. (frontend/src/store/authStore.ts)
- Medium: Avatar la data URL tu client, backend khong gioi han kich thuoc. (frontend/src/pages/Settings.tsx, backend/src/routes/user.ts)
- Medium: Prompt injection risk (user input chen thang vao prompt). (backend/src/routes/chat.ts, ai_service/main.py)

## 2) Performance / Scalability

### Diem manh
- Vite manual chunks cho vendor libs. (frontend/vite.config.ts)
- Nginx gzip, caching cho static assets (firebase.json + frontend/nginx.conf).
- Timeout 12s cho AI request, co fallback. (backend/src/routes/chat.ts)

### Diem yeu / rui ro
- Medium: Prompt context co the phinh to (JSON.stringify) khong co gioi han kich thuoc -> latency/timeout. (backend/src/routes/chat.ts)
- Medium: /chat/history cho phep limit toi 500, khong co cursor pagination. (backend/src/routes/chat.ts)
- Medium: Container backend chay "prisma db push" luc start, co the lam cham startup va drift schema. (backend/Dockerfile)
- Low: ai_service chay uvicorn single worker (khong scale ngang). (ai_service/Dockerfile)

## 3) Reliability / Ops

### Diem manh
- Healthcheck cho backend/ai_service va docker-compose. (docker-compose.yml, backend/src/index.ts, ai_service/main.py)
- AI service co mock fallback khi key khong hop le. (ai_service/main.py)

### Diem yeu / rui ro
- High: Mat khau DB trong docker-compose la gia tri mac dinh "password". (docker-compose.yml)
- Medium: Neu frontend deploy Vercel, can dong bo CORS/FRONTEND_URL theo domain Vercel va VITE_API_URL tro ve Railway.
- Medium: Chua co migrations chinh thuc, db push tu container. (backend/Dockerfile)
- Low: Logging don gian, chua co structured logging/metrics. (backend/src/index.ts, ai_service/main.py)

## 4) UX / Product Flow

### Diem manh
- Stage machine ro rang, tu dong kiem tra trang thai chien dich. (frontend/src/lib/stageMachine.ts)
- Plan markers robust, frontend + backend dong bo parser. (frontend/src/lib/planMarkers.ts, backend/src/routes/chat.ts)
- Quiz flow chi tiet, co metrics snapshot cho Stage 3. (frontend/src/pages/Quiz.tsx, frontend/src/pages/Chat.tsx)

### Diem yeu / rui ro
- Medium: Google login set token xong chuyen trang, khong verify voi backend ngay; neu Firebase config sai, API se tu choi va UI chi biet khi goi API tiep theo. (frontend/src/pages/Login.tsx, frontend/src/pages/Register.tsx)
- Low: Avatar upload chi la data URL, khong co gioi han kich thuoc/loai file -> UX va storage. (frontend/src/pages/Settings.tsx)

## 5) Maintainability / Code Quality

### Diem manh
- Service tach rieng ro rang (frontend/back/ai_service).
- Prisma schema tap trung, co index chat theo campaignId/userId. (backend/prisma/schema.prisma)

### Diem yeu / rui ro
- Medium: Chat route qua lon va tron logic (prompt + fallback + parsing) -> kho bao tri. (backend/src/routes/chat.ts)
- Medium: AI logic bi trung lap giua backend va ai_service; chua ro "source of truth". (backend/src/routes/chat.ts, ai_service/main.py)
- Medium: Thieu test tu dong, chi co smoke_test. (ai_service/scripts/smoke_test.py)
- Low: Khong co docs/ folder (khong co dev rules, standards). (repo root)
