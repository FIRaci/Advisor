---
phase: 1
title: "Inventory & context scan"
status: pending
priority: P2
effort: "2h"
dependencies: []
---

# Phase 1: Inventory & context scan

## Overview
Build a baseline map of services, configs, data stores, and critical flows
(auth, quiz, chat, metrics). Produce an inventory report that anchors the rest
of the review.

## Requirements
- Functional: inventory of services, ports, env vars, auth flows, and data stores.
<!-- Updated: Validation Session 1 - constrain to .env.example and static review -->
- Non-functional: read-only review; no code changes; use .env.example only; no runtime execution.

## Architecture
- Frontend -> Backend -> AI service -> Postgres.
- Auth uses JWT and Firebase token verification with a fallback path.

## Related Code Files
- Create: plans/260518-1743-project-review-audit/reports/review-inventory.md
- Modify: none
- Delete: none

## Implementation Steps
1. Extract service topology and ports from docker-compose.yml.
2. Capture runtime env surface from .env.example, backend/ai_service settings,
   and frontend env usage.
3. Inventory dependencies from package.json and requirements.txt.
4. Document key flows: auth, quiz, chat, metrics.
5. Write inventory report in plans/260518-1743-project-review-audit/reports/review-inventory.md.

## Todo List
- [ ] Service and port inventory
- [ ] Env and dependency inventory
- [ ] Flow map for auth/quiz/chat/metrics

## Success Criteria
- [ ] Inventory report lists services, ports, env vars, and data stores.
- [ ] Flow map covers auth, quiz, chat, and metrics.
- [ ] Open questions captured for Phase 2.

## Risk Assessment
- Missing docs/ folder may hide intended conventions.
- Real env values are sensitive; use redacted inputs.

## Security Considerations
- Do not read .env without approval; use .env.example or redacted lists.

## Next Steps
- Proceed to Phase 2 domain review.
