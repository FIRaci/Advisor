---
phase: 2
title: "Deep review by domain"
status: pending
priority: P2
effort: "4h"
dependencies: [1]
---

# Phase 2: Deep review by domain

## Overview
Perform a domain-by-domain review focused on security/auth, performance,
reliability/ops, UX/product flow, and maintainability. Capture evidence-backed
strengths, weaknesses, and risks.

## Requirements
- Functional: findings list per domain with evidence and severity.
<!-- Updated: Validation Session 1 - Docker-only scope and static review -->
- Non-functional: read-only review; no code changes; assume local Docker deployment only.

## Architecture
- Validate data flow from UI -> API -> AI service -> database.
- Inspect auth boundaries and token verification paths.
- Review timeout, fallback, and error handling patterns.

## Related Code Files
- Create: plans/260518-1743-project-review-audit/reports/domain-review.md
- Modify: none
- Delete: none

## Implementation Steps
1. Backend review: routes, auth middleware, rate limits, error handling,
	Prisma schema, and data access patterns.
2. AI service review: CORS rules, prompt construction, model selection,
	mock fallback behavior, and logging.
3. Frontend review: auth/session handling, API error handling, chat and quiz
	flows, rendering performance, and accessibility.
4. Cross-service review: timeouts, retries, data validation boundaries,
	and PII handling in logs.
5. Record findings in plans/260518-1743-project-review-audit/reports/domain-review.md.

## Todo List
- [ ] Backend domain review notes
- [ ] AI service domain review notes
- [ ] Frontend domain review notes
- [ ] Cross-service risks and gaps

## Success Criteria
- [ ] Findings log with strengths and weaknesses per domain.
- [ ] Each finding has severity, impact, and evidence notes.

## Risk Assessment
- Large UI modules (e.g., Chat) may hide edge-case defects.
- Lack of automated tests reduces confidence in behavior.

## Security Considerations
- Verify token handling, fallback secrets, and CORS scope.
- Assess prompt injection exposure and sensitive logging.

## Next Steps
- Proceed to Phase 3 synthesis.
