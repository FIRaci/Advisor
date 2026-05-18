---
phase: 1
title: "Cau hinh Vercel frontend"
status: pending
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 1: Cau hinh Vercel frontend

## Overview
Tao config Vercel cho frontend Vite build, set env VITE_API_URL.

## Requirements
- Functional: frontend build thanh cong tren Vercel.
- Non-functional: khong doi code logic.

## Architecture
- Vercel build: npm install -> npm run build -> static output.

## Related Code Files
- Review: frontend/package.json
- Review: frontend/vite.config.ts
- Modify: (neu can) vercel.json

## Implementation Steps
1. Xac dinh command build va output dir (dist).
2. Cau hinh env VITE_API_URL tro ve Railway backend.
3. Neu can, tao vercel.json de set rewrites.

## Todo List
- [ ] Vercel build/output config
- [ ] Env VITE_API_URL

## Success Criteria
- [ ] Frontend deploy len Vercel thanh cong.

## Risk Assessment
- Sai VITE_API_URL -> frontend khong goi duoc API.

## Security Considerations
- Tranh expose secret qua VITE_* env.

## Next Steps
- Cap nhat env + CORS (Phase 2).

## Implementation Steps

<!-- Detailed steps -->

## Success Criteria

- [ ] ...
