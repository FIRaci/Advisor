---
phase: 3
title: "Avatar upload pipeline"
status: pending
priority: P2
effort: "0.5d"
dependencies: [2]
---

# Phase 3: Avatar upload pipeline

## Overview
Bo sung upload avatar co gioi han kich thuoc va loai file, luu URL vao user.

## Requirements
- Functional: upload avatar, luu URL vao user.avatar.
- Non-functional: gioi han kich thuoc file (vi du 2MB), chi chap nhan image/*.

## Architecture
- Backend endpoint nhan multipart, luu file (Cloudinary/S3) va cap nhat user.

## Related Code Files
- Modify: backend/src/routes/user.ts
- Modify: frontend/src/pages/Settings.tsx
- Modify: frontend/src/hooks/useApi.ts

## Implementation Steps
1. Chon storage (Cloudinary/S3/local temp) va chuan bi secret env.
2. Them endpoint upload avatar + validation kich thuoc/type.
3. Cap nhat Settings upload thay vi data URL.

## Todo List
- [ ] Storage decision
- [ ] Upload endpoint + validation
- [ ] Settings UI upload

## Success Criteria
- [ ] Avatar upload thanh cong, luu URL.
- [ ] Gioi han file duoc enforce.

## Risk Assessment
- Storage config sai se lam upload fail.

## Security Considerations
- Validate file type, kich thuoc; tranh SSRF.

## Next Steps
- Hoan tat va test auth + avatar flows.

## Implementation Steps

<!-- Detailed steps -->

## Success Criteria

- [ ] ...
