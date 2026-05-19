---
title: "Audit & Cleanup Plan"
status: completed
priority: P1
effort: "9h"
---

# Audit & Cleanup Plan

**Project:** AdVisor AI (GR1)

## Overview
The goal of this plan is to perform a thorough audit of the codebase, identify files that are unused or redundant, detect configuration and runtime errors, and produce a concise report.

## Objectives
- Scan the repository for orphaned files, duplicate code, and unnecessary assets.
- Verify that all environment variables required by the backend and AI service are correctly set.
- Run lint, type‑check and test suites to surface compile‑time errors.
- Produce `audit_report.md` that lists:
  - Redundant / dead files (with suggested deletions).
  - Mis‑configured variables or missing secrets.
  - Runtime / build errors discovered during lint/test runs.

## Acceptance Criteria
- **Report generated** at `./audit_report.md` covering all findings.
- No remaining `401/403` endpoint errors after fixing environment variables.
- All lint and type‑checking steps pass with **0 errors**.
- All identified redundant files are either removed or explicitly marked as `KEEP` with justification.

## Scope (Boundaries)
- **In‑scope:** All source files under `frontend/`, `backend/`, `ai_service/`, configuration files (`Dockerfile`, `.env*`, `README.md`).
- **Out‑of‑scope:** External dependencies (node_modules, Poetry venvs) and third‑party services.

## Non‑Negotiable Constraints
- Must keep the repository structure under `c:/Users/TSC/Desktop/Nothing/GR1`.
- Do **not** modify public API contracts unless a breaking change is explicitly approved.
- All changes must be committed to the `devin/1778368468-ux-overhaul` branch before merging to `main`.

## Touchpoints (Files to be inspected / modified)
- `backend/src/routes/*.ts`
- `backend/src/index.ts`
- `frontend/` source files
- `ai_service/main.py`
- Dockerfiles (`backend/Dockerfile`, `ai_service/Dockerfile`)
- `.gitignore`, `README.md`, `docs/`

## Phases
| Phase | Title | Owner | Estimated Effort |
|-------|-------|-------|-----------------|
| 1 | Scout & Inventory | ☑️ | 2h |
| 2 | Static Analysis & Lint | ☑️ | 2h |
| 3 | Run Tests & Identify Runtime Errors | ☑️ | 3h |
| 4 | Clean‑up & Refactor | ☑️ | 4h |
| 5 | Report Generation & Review | ☑️ | 2h |

---

**Next Step:** Execute phase files in order. Use the generated `phase-*.md` files for detailed tasks.
