---
phase: 2
title: "Proxy backend chat sang ai_service"
status: pending
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Proxy backend chat sang ai_service

## Overview
Backend /api/chat/message va /api/chat/assist se goi ai_service, bo goi Gemini
truc tiep de dong bo format va giam trung lap logic.

## Requirements
- Functional: giu nguyen API request/response cho frontend.
- Non-functional: timeout va fallback giu nhu hien tai.

## Architecture
- Backend proxy: /api/chat/message -> ai_service /chat.
- Backend proxy: /api/chat/assist -> ai_service /assist (endpoint moi).
- Backend van luu Chat vao DB nhu cu.

## Related Code Files
- Modify: backend/src/routes/chat.ts
- Modify: backend/package.json (neu bo @google/generative-ai)
- Modify: ai_service/main.py (them /assist)
- Modify: ai_service/requirements.txt (neu can them dependency)

## Implementation Steps
1. Them endpoint /assist trong ai_service nhan content type + context.
2. Backend thay GoogleGenerativeAI bang fetch HTTP toi ai_service.
3. Mapping context giu nguyen: quizData, strategy, metrics snapshots.
4. Giua nguyen normalizePlanContent va appendPlanOptionsIfMissing (safety).
5. Cap nhat error handling: timeout, fallback message, usedFallback flag.
6. Bo dependencies Gemini trong backend neu khong con dung.

## Todo List
- [ ] Tao /assist o ai_service
- [ ] Proxy /api/chat/message va /assist
- [ ] Remove direct Gemini client backend

## Success Criteria
- [ ] Frontend khong can thay doi API contract.
- [ ] Chat luu DB nhu cu, co kind/metadata dung.
- [ ] usedFallback flag van dung cho UI.

## Risk Assessment
- Sai format response tu ai_service co the lam UI khong parse duoc.
- Timeout cua ai_service lam tre response backend.

## Security Considerations
- Khong log token hay PII trong request/response.

## Next Steps
- Dong bo frontend va kiem thu (Phase 3).
