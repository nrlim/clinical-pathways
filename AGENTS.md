<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🧠 Agent System Instructions — SnapPath

> **CRITICAL**: Before writing a single line of code, you MUST read and internalize all skill files listed below. These are **non-negotiable constraints**, not suggestions.

---

## 📚 Mandatory Skill Files

Read ALL of these before executing ANY task. Failure to follow them is unacceptable:

| Skill | Path | When to Apply |
|---|---|---|
| Next.js Best Practices | [`skills/next-best-practices.md`](skills/next-best-practices.md) | Every file you create or modify |
| React Best Practices | [`skills/vercel-react-best-practices.md`](skills/vercel-react-best-practices.md) | Every component you write |
| Frontend Design Guidelines | [`skills/frontend-design.md`](skills/frontend-design.md) | Every UI element and page |

---

## 🎯 Project Overview

**Product**: SnapPath Management System — a fullstack web application to digitize and manage patient SnapPath.

**Current Phase**: Phase 1 — Manual data entry form (covering future AI OCR input).
**Future Phase**: Phase 2 — AI OCR via **Snaptext** to auto-populate forms from scanned documents.

---

## 🏗️ Architecture Contract

These rules are **absolute**. Do not deviate.

### Directory Structure
```
clinical-pathways/
├── src/
│   ├── app/                    # Next.js App Router (ONLY place for pages/layouts)
│   │   ├── (auth)/             # Route group: auth pages
│   │   ├── (dashboard)/        # Route group: main app
│   │   ├── api/                # API route handlers
│   │   ├── globals.css         # Global styles (Vanilla CSS ONLY)
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Root page
│   ├── components/             # Shared, reusable UI components
│   │   └── ui/                 # Primitive UI components (inputs, buttons, etc.)
│   ├── lib/                    # Utilities, helpers, and third-party configs
│   │   └── validations/        # Zod schemas
│   ├── types/                  # Global TypeScript interfaces and types
│   └── hooks/                  # Custom React hooks
├── skills/                     # Agent skill files (READ-ONLY — do not modify)
├── public/                     # Static assets
└── AGENTS.md                   # This file
```

### Enforced Rules
- **ALWAYS** use `src/app` as the app root — never the legacy `app/` at root level.
- **NEVER** put business logic directly in page components — extract to `lib/` or custom hooks.
- **ALWAYS** prefer Server Components; only add `"use client"` where strictly required (interactivity, hooks, events).
- **NEVER** commit API secrets — use `.env.local` and server-side access only.

---

## 🩺 Domain Knowledge — SnapPath

A **SnapPath** is a structured, multidisciplinary care plan that defines the optimal timing and sequencing of interventions for patients with a specific diagnosis.

Key data entities this system handles:

| Entity | Description |
|---|---|
| **Patient** | Identified by NIK (National ID) |
| **Diagnosis** | Primary ICD-10 code and description |
| **SnapPath** | The care plan document with activities, timeline, and outcomes |
| **Encounter** | A specific patient visit/admission episode |
| **Practitioner** | The attending doctor / clinical staff |
| **Organization** | The hospital or clinic |

---

## 📝 SnapPath Form — Phase 1

The form MUST capture the following fields grouped by section:

### Section 1: Patient Identification
- `patient_name` — Full legal name
- `nik` — 16-digit National ID Number
- `birth_date` — Date of birth
- `gender` — Male / Female

### Section 2: Encounter / Episode
- `encounter_class` — Inpatient / Outpatient / Emergency
- `admission_date` — Date and time of admission
- `discharge_date` — Date and time of discharge (can be empty if ongoing)
- `ward` — Ward / Room
- `practitioner_name` — Attending doctor's name

### Section 3: Clinical Information
- `primary_diagnosis_code` — ICD-10 code (e.g., `J18.9`)
- `primary_diagnosis_name` — Diagnosis description
- `secondary_diagnoses` — Array of secondary ICD-10 codes
- `procedures` — List of clinical procedures performed

### Section 4: Pathway Details
- `pathway_name` — Name of the SnapPath (e.g., "Community-Acquired Pneumonia")
- `expected_los` — Expected length of stay (days)
- `actual_los` — Actual length of stay (computed from admission/discharge)
- `clinical_notes` — Free-text notes from clinician
- `outcome` — Outcome at discharge (Improved / Referred / Deceased / DAMA)

---

## ✅ Agent Execution Checklist

Before submitting any code change, verify:

- [ ] I have read all 3 skill files.
- [ ] All new files are under `src/`.
- [ ] No secrets are in client-side code.
- [ ] All components use Vanilla CSS (no inline Tailwind unless explicitly approved).
- [ ] TypeScript is strictly typed — no `any`.
- [ ] Form fields match the schema defined in this document.
- [ ] The UI meets the premium design standard defined in `skills/frontend-design.md`.

---

> **Remember**: You are building a system that impacts real patient care workflows. Data accuracy, security, and UX clarity are non-negotiable.
