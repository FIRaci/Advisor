---
phase: 1
title: "Quyet dinh auth scope"
status: pending
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 1: Quyet dinh auth scope

## Overview
Chot quyet dinh giu/bo Firebase va chuan hoa luong auth JWT-only neu can.

## Requirements
- Functional: quyet dinh ro auth mode va pham vi thay doi.
- Non-functional: ghi lai decision de dung cho Phase 2/3.

## Architecture
- So do auth: frontend login -> backend /api/auth -> JWT -> authMiddleware.

## Related Code Files
- Review: backend/src/routes/auth.ts
- Review: backend/src/middleware/auth.ts
- Review: frontend/src/pages/Login.tsx
- Review: frontend/src/pages/Register.tsx

## Implementation Steps
1. Tong hop pain points Firebase (config, deploy, bug).
2. Chot co giu Google sign-in hay JWT-only.
3. Xac dinh tac dong den backend/frontend/env.

## Todo List
- [ ] Decision auth scope
- [ ] Impact list

## Success Criteria
- [ ] Co decision ro rang va danh sach file can sua.

## Risk Assessment
- Thay doi auth co the anh huong login cua user hien tai.

## Security Considerations
- JWT secret phai bat buoc, khong fallback.

## Next Steps
- Neu bo Firebase, thuc hien Phase 2.

## Implementation Steps

<!-- Detailed steps -->

## Success Criteria

- [ ] ...
