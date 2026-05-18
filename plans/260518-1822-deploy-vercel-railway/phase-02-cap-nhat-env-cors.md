---
phase: 2
title: "Cap nhat env + CORS"
status: pending
priority: P2
effort: "0.5d"
dependencies: [1]
---

# Phase 2: Cap nhat env + CORS

## Overview
Dong bo FRONTEND_URL va CORS backend de cho phep domain Vercel.

## Requirements
- Functional: API tu Railway goi duoc tu Vercel domain.
- Non-functional: khong mo CORS qua rong.

## Architecture
- Backend CORS allowlist: FRONTEND_URL + localhost.

## Related Code Files
- Modify: backend/src/index.ts
- Modify: docker-compose.yml (neu can cap nhat default)
- Modify: .env.example

## Implementation Steps
1. Replace origin: true -> allowlist theo FRONTEND_URL.
2. Them fallback localhost cho dev.
3. Cap nhat .env.example ghi ro FRONTEND_URL.

## Todo List
- [ ] CORS allowlist
- [ ] Env docs cap nhat

## Success Criteria
- [ ] API access tu Vercel domain thanh cong.

## Risk Assessment
- Sai CORS -> frontend bi block.

## Security Considerations
- Khong cho phep wildcard khi credentials = true.

## Next Steps
- Verify deploy end-to-end (Phase 3).

## Implementation Steps

<!-- Detailed steps -->

## Success Criteria

- [ ] ...
