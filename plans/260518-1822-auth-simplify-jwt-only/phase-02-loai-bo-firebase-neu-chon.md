---
phase: 2
title: "Loai bo Firebase (neu chon)"
status: pending
priority: P2
effort: "1d"
dependencies: [1]
---

# Phase 2: Loai bo Firebase (neu chon)

## Overview
Loai bo Firebase auth, giu luong email/password + JWT, don gian hoa middleware.

## Requirements
- Functional: login/register JWT-only hoat dong, Google sign-in removed.
- Non-functional: khong doi API contract cho frontend.

## Architecture
- Xoa firebase-admin, xoa verifyIdToken path trong authMiddleware.

## Related Code Files
- Modify: backend/src/middleware/auth.ts
- Modify: backend/src/lib/firebaseAdmin.ts (remove/retire)
- Modify: backend/package.json
- Modify: frontend/src/lib/firebase.ts
- Modify: frontend/src/pages/Login.tsx
- Modify: frontend/src/pages/Register.tsx

## Implementation Steps
1. Go bo Firebase dependencies va init code.
2. Simplify authMiddleware chi verify JWT.
3. Cap nhat UI: bo Google sign-in button va flow.
4. Cap nhat env doc va .env.example neu can.

## Todo List
- [ ] Remove Firebase deps
- [ ] JWT-only middleware
- [ ] UI login/register update

## Success Criteria
- [ ] Login/register JWT-only hoat dong.
- [ ] Khong con Firebase code path trong backend/frontend.

## Risk Assessment
- User da login bang Google se bi logout neu bo Firebase.

## Security Considerations
- Bat buoc JWT_SECRET, bo fallback secret.

## Next Steps
- Lam avatar upload pipeline (Phase 3).

## Implementation Steps

<!-- Detailed steps -->

## Success Criteria

- [ ] ...
