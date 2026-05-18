---
title: "Chatbot dong bo qua ai_service"
description: "Dong bo chatbot qua ai_service, giu API contract va format Plan/Stage on dinh."
status: pending
priority: P1
effort: "2d"
branch: "devin/1778368468-ux-overhaul"
tags: [chatbot, ai-service, backend, frontend]
blockedBy: []
blocks: []
created: "2026-05-18"
createdBy: "ck:plan"
source: skill
---

# Chatbot dong bo qua ai_service

## Overview
Chuyen chatbot sang ai_service lam source of truth. Backend /api/chat/message
va /api/chat/assist se proxy toi ai_service, dam bao plan markers, stage
transition, va giu API response khong doi cho frontend.

## Constraints
- Khong doi auth/Firebase o dot nay.
- Khong doi DB schema/migration.
- Giu API contract cua /api/chat/* (payload va response).
- Duy tri plan markers va stage transition theo format hien tai.

## Success Criteria
- Stage 1 luon co 3-4 plan options dung tag [PLAN_A/B/C].
- Stage 2 luon co [STAGE_TRANSITION] o cuoi response.
- Stage 3 su dung metrics snapshot neu co.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Can chinh prompt/format AI](./phase-01-can-chinh-prompt-format-ai.md) | Pending |
| 2 | [Proxy backend chat sang ai_service](./phase-02-proxy-backend-chat-sang-ai-service.md) | Pending |
| 3 | [Dong bo frontend + kiem thu](./phase-03-dong-bo-frontend-kiem-thu.md) | Pending |

## Dependencies
- ai_service phai co endpoint tao response dung format (plan tags + stage transition).
