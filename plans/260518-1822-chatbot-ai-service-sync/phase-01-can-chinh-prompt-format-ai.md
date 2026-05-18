---
phase: 1
title: "Can chinh prompt/format AI"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Can chinh prompt/format AI

## Overview
Chuan hoa prompt va format output trong ai_service de dam bao plan markers
va stage transition dung theo frontend.

## Requirements
- Functional: ai_service tra ve plan options/tag cho Stage 1, stage transition cho Stage 2.
- Non-functional: giu response tieng vi/en theo input nguoi dung.

## Architecture
- ai_service nhan context (quizData, metrics) va tu sinh output.
- Format plan markers dong bo voi frontend/src/lib/planMarkers.ts.

## Related Code Files
- Modify: ai_service/main.py
- Modify: ai_service/examples.py
- Create: ai_service/prompt_helpers.py (neu can tach nho)

## Implementation Steps
1. Them stage-aware instructions trong ai_service (Stage 1/2/3) giong backend.
2. Dam bao Stage 1 luon co 3-4 plan options voi [PLAN_A/B/C] tags.
3. Dam bao Stage 2 luon co [STAGE_TRANSITION] o cuoi response.
4. Neu thieu tags, auto-append fallback block (tai ai_service).
5. Cap nhat few-shot examples neu can de bao format on dinh.

## Todo List
- [ ] Stage instructions co plan markers
- [ ] Fallback append khi thieu tags
- [ ] Review few-shot examples

## Success Criteria
- [ ] ai_service /chat tra ve plan markers dung format cho Stage 1.
- [ ] ai_service /chat tra ve stage transition cho Stage 2.
- [ ] Stage 3 su dung metrics context neu co.

## Risk Assessment
- Format sai co the lam frontend khong parse duoc plan cards.

## Security Considerations
- Tranh log du lieu nhay cam trong prompt/context.

## Next Steps
- Bat dau proxy backend sang ai_service (Phase 2).
