# Next.js Best Practices (App Router)

> **Agent Directive**: Read this file completely before creating or modifying any Next.js file. These are enforced constraints, not suggestions.

---

## 1. Project Setup Verification

Before writing code, confirm:
- App Router is active (`src/app/` directory exists).
- `next.config.ts` does NOT have `pages` directory references.
- TypeScript strict mode is enabled in `tsconfig.json`.

---

## 2. File & Folder Conventions

### Route Files (ONLY these are valid in `src/app/`):
| File | Purpose |
|---|---|
| `page.tsx` | UI for a route — renders a page |
| `layout.tsx` | Shared UI wrapping child routes |
| `loading.tsx` | Suspense loading skeleton for a route |
| `error.tsx` | Error boundary for a route (must be `"use client"`) |
| `not-found.tsx` | 404 handler |
| `route.ts` | API endpoint handler (replaces `pages/api/`) |
| `template.tsx` | Like layout but re-mounts on navigation |

### Co-location Rules:
- Components ONLY used in one route → place inside that route's folder.
- Components shared across 2+ routes → place in `src/components/`.
- Utility functions → place in `src/lib/`.
- Types shared across the app → place in `src/types/`.

### Route Groups (use to organize without affecting URL):
```
src/app/
├── (auth)/
│   ├── login/page.tsx       → /login
│   └── register/page.tsx    → /register
└── (dashboard)/
    ├── layout.tsx            → shared dashboard layout
    ├── page.tsx              → /
    └── pathway/page.tsx      → /pathway
```

---

## 3. Server vs. Client Components

### The Golden Rule:
**Default to Server Components. Add `"use client"` only when you need:**
- React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Event handlers (`onClick`, `onChange`, etc.)
- Third-party client-only libraries

### Correct Pattern — Push `"use client"` to the leaves:
```tsx
// ✅ CORRECT: Server Component (no directive needed)
// src/app/pathway/page.tsx
import { PathwayForm } from '@/components/pathway/PathwayForm'
import { getPathways } from '@/lib/pathway'

export default async function PathwayPage() {
  const pathways = await getPathways() // server-side data fetch
  return <PathwayForm initialData={pathways} />
}

// ✅ CORRECT: Client Component only where interaction is needed
// src/components/pathway/PathwayForm.tsx
"use client"
import { useState } from 'react'
export function PathwayForm({ initialData }) { ... }
```

```tsx
// ❌ WRONG: Making the entire page a client component
"use client"
export default function PathwayPage() {
  const [data, setData] = useState([])
  useEffect(() => { fetch('/api/pathway').then(...) }, [])
  ...
}
```

---

## 4. Data Fetching Patterns

### Server Components (preferred):
```tsx
// Fetch directly in server component — no useEffect, no useState
async function PatientPage({ params }: { params: { id: string } }) {
  const patient = await fetchPatient(params.id) // runs on server
  return <PatientDetail patient={patient} />
}
```

### Server Actions for mutations:
```tsx
// src/lib/actions/pathway.ts
"use server"
import { z } from 'zod'
import { PathwaySchema } from '@/lib/validations/pathway'

export async function createPathway(formData: FormData) {
  const validated = PathwaySchema.parse(Object.fromEntries(formData))
  // call your backend or external API here — server-side only
  await db.carePlan.create({ data: validated })
  revalidatePath('/pathway')
}
```

### API Routes (for external webhooks or client-fetches):
```ts
// src/app/api/pathway/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Server-side only logic
  return NextResponse.json({ data: [] })
}
```

---

## 5. Metadata & SEO

**ALWAYS** export metadata from `layout.tsx` or `page.tsx`:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SnapPath System',
  description: 'Manage SnapPath efficiently.',
  openGraph: {
    title: 'SnapPath',
    description: 'SnapPath management system.',
  },
}
```

---

## 6. Environment Variables

| Prefix | Accessible In | Use For |
|---|---|---|
| `NEXT_PUBLIC_` | Browser + Server | Public API URLs, analytics IDs |
| *(no prefix)* | Server ONLY | API secrets, credentials, database URLs |

```env
# .env.local
DB_PASSWORD=xxx                  # ✅ Server-only
API_SECRET_KEY=xxx               # ✅ Server-only
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ✅ OK to be public
```

---

## 7. Error Handling

```tsx
// src/app/pathway/error.tsx
"use client"
export default function PathwayError({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

## 8. Loading States

```tsx
// src/app/pathway/loading.tsx
export default function PathwayLoading() {
  return <div className="skeleton-loader">Loading...</div>
}
```

---

## ❌ Anti-Patterns — Never Do These

```tsx
// ❌ Fetching data in useEffect in a page (use Server Components instead)
// ❌ Storing secrets in NEXT_PUBLIC_ env vars
// ❌ Putting all components in one giant file
// ❌ Using `any` type — always define proper TypeScript types
// ❌ Importing server-only modules in Client Components
// ❌ Using `pages/` directory alongside `app/` directory
// ❌ Direct DOM manipulation — use React state/refs
```
