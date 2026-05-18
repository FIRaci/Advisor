---
title: "Bao cao danh gia tong hop AdVisor"
date: "2026-05-18"
scope: "Local Docker, static review"
sourcePlan: "plans/260518-1743-project-review-audit/plan.md"
---

# Bao cao danh gia tong hop AdVisor

## Tong quan
AdVisor co kien truc ro rang, flow san pham hop ly, nhung dang co mot so rui ro security (CORS, JWT fallback), ops (db push luc start), va maintainability (logic AI trung lap). Can xu ly P1 de tang an toan va on dinh.

## Diem manh noi bat
- Stage machine va plan-marker parsing duoc dong bo giua frontend/back, giam loi UX. (frontend/src/lib/stageMachine.ts, frontend/src/lib/planMarkers.ts, backend/src/routes/chat.ts)
- Zod validation cho nhieu endpoint quan trong. (backend/src/routes/*.ts)
- Healthcheck + docker-compose healthcheck co san. (backend/src/index.ts, ai_service/main.py, docker-compose.yml)
- Prisma schema gon, co index cho Chat theo user/campaign. (backend/prisma/schema.prisma)

## Diem yeu / rui ro chinh
- High: CORS allow all origins + credentials. (backend/src/index.ts)
- High: JWT fallback secret "fallback_secret" neu thieu env. (backend/src/middleware/auth.ts)
- High: Mat khau DB mac dinh trong docker-compose. (docker-compose.yml)
- Medium: db push luc start (production risk). (backend/Dockerfile)
- Medium: AI logic bi trung lap giua backend va ai_service. (backend/src/routes/chat.ts, ai_service/main.py)
- Medium: Khong co test tu dong (chi smoke test). (ai_service/scripts/smoke_test.py)

## Khuyen nghi uu tien

| Uu tien | Hanh dong | Loi ich | Effort |
|---|---|---|---|
| P1 | Gioi han CORS theo FRONTEND_URL, bo origin: true khi dung credentials | Giam CSRF/credential leakage | 0.5-1d |
| P1 | Bo fallback secret, bat buoc JWT_SECRET + rotation | Chan gia mao token | 0.5d |
| P1 | Doi mat khau DB default, dua vao .env.example | Tranh lo thong tin nhay cam | 0.5d |
| P2 | Thay db push bang migration (prisma migrate) | On dinh schema, safe deploy | 1-2d |
| P2 | Chon ai_service lam source of truth (backend goi ai_service), loai bo goi Gemini truc tiep | Giam phuc tap, ep format dong bo | 1-2d |
| P2 | Gioi han kich thuoc avatar + validate content-type | Giam rui ro storage/XSS | 0.5d |
| P3 | Bo sung test (auth, campaign, chat) + e2e smoke | Giam regression | 2-4d |
| P3 | Logging/metrics co cau truc | Quan sat tot hon | 1-2d |

## Quick wins
- Them gioi han kich thuoc message/prompt context truoc khi goi AI.
- Giam limit mac dinh /chat/history, them cursor pagination.

## Cau hoi can xac nhan
1. Auth mode chinh hien tai: Firebase optional; co the bo neu gay phi phuc.
2. AI service la bat buoc de ep format, Gemini chi la API provider.
3. Du kien deploy: frontend Vercel, backend + DB Railway.
