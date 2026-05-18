---
phase: 3
title: "Verify deploy"
status: pending
priority: P2
effort: "0.5d"
dependencies: [2]
---

# Phase 3: Verify deploy

## Overview
Kiem tra frontend Vercel ket noi backend Railway, cac flow chinh khong loi.

## Requirements
- Functional: login, quiz, chat, metrics hoat dong tren production.
- Non-functional: khong xuat hien CORS errors tren browser.

## Architecture
- Frontend Vercel -> Backend Railway -> Postgres Railway.

## Related Code Files
- Review: frontend/src/hooks/useApi.ts
- Review: backend/src/index.ts

## Implementation Steps
1. Xac nhan VITE_API_URL dang dung domain Railway.
2. Test /login, /quiz, /chat, /metrics tren Vercel.
3. Kiem tra console/network xem co CORS errors.

## Todo List
- [ ] Verify core flows
- [ ] Check CORS

## Success Criteria
- [ ] Frontend Vercel hoat dong, goi API thanh cong.

## Risk Assessment
- Env sai se lam fail 1-2 flow quan trong.

## Security Considerations
- Khong expose secrets tren Vercel env.

## Next Steps
- Neu on dinh, dong plan deploy.

## Implementation Steps

<!-- Detailed steps -->

## Success Criteria

- [ ] ...
