---
phase: 3
title: "Dong bo frontend + kiem thu"
status: pending
priority: P2
effort: "0.5d"
dependencies: [2]
---

# Phase 3: Dong bo frontend + kiem thu

## Overview
Dong bo frontend neu can (parser/labels) va kiem thu luong Stage 1/2/3
de dam bao chatbot on dinh.

## Requirements
- Functional: parser plan markers khong bi vo; UI khong loi khi response moi.
- Non-functional: khong doi layout/styling.

## Architecture
- Frontend tiep tuc dung planMarkers + stageMachine.

## Related Code Files
- Modify: frontend/src/lib/planMarkers.ts (neu can)
- Modify: frontend/src/lib/stageMachine.ts (neu can)
- Modify: frontend/src/hooks/useApi.ts (neu can)
- Modify: frontend/src/pages/Chat.tsx (neu can)

## Implementation Steps
1. Review parsePlanOptions/cleanStrategyIntroMarkdown voi output moi.
2. Cap nhat UI handling neu ai_service thay doi kind/metadata.
3. Kiem tra Stage 1 (plan cards), Stage 2 (transition), Stage 3 (metrics).
4. (Tuy chon) chay ai_service/scripts/smoke_test.py neu co the.

## Todo List
- [ ] Parser hoat dong voi response moi
- [ ] UI khong bi loi khi fallback
- [ ] Stage 1/2/3 manual check

## Success Criteria
- [ ] Stage 1 luon hien plan cards dung.
- [ ] Stage 2 co nut transition/marker.
- [ ] Stage 3 khong loi khi co/khong co metrics.

## Risk Assessment
- UI phu thuoc format text; neu ai_service thay doi, can cap nhat parser.

## Security Considerations
- Khong hien thi raw tags cho nguoi dung.

## Next Steps
- Neu on dinh, bat dau ke hoach Option 2/3 sau.
