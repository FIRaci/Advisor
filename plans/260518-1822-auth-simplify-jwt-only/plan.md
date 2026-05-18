---
title: "Auth don gian hoa (JWT-only, optional Firebase)"
description: "Danh gia va (neu chon) loai bo Firebase, don gian hoa JWT, them avatar upload."
status: pending
priority: P2
effort: "2d"
branch: "devin/1778368468-ux-overhaul"
tags: [auth, backend, frontend]
blockedBy: []
blocks: []
created: "2026-05-18"
createdBy: "ck:plan"
source: skill
---

# Auth don gian hoa (JWT-only, optional Firebase)

## Overview
Don gian hoa auth neu Firebase gay phi phuc: giu JWT email/password, loai bo
Google sign-in, va bo sung avatar upload theo han muc kich thuoc.

## Constraints
- Khong doi DB schema neu co the (dung avatar field hien tai).
- Giu API contract cua /api/auth/* va /api/users/me.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Quyet dinh auth scope](./phase-01-quyet-dinh-auth-scope.md) | Pending |
| 2 | [Loai bo Firebase (neu chon)](./phase-02-loai-bo-firebase-neu-chon.md) | Pending |
| 3 | [Avatar upload pipeline](./phase-03-avatar-upload-pipeline.md) | Pending |

## Dependencies

<!-- Cross-plan dependencies -->
