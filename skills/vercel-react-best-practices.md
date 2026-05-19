# React Best Practices (Clinical Pathway App)

> **Agent Directive**: Read this file before writing any React component. Apply every rule listed here — they are enforced constraints.

---

## 1. Component Architecture

### Single Responsibility Principle
Each component must do ONE thing. If a component has more than ~150 lines of JSX, extract sub-components.

```tsx
// ❌ WRONG: Monolithic component
export function PathwayPage() {
  // 300 lines of mixed logic + UI
}

// ✅ CORRECT: Composed from focused components
export function PathwayPage() {
  return (
    <main>
      <PathwayHeader />
      <PatientInfoSection />
      <ClinicalDataSection />
      <PathwayActions />
    </main>
  )
}
```

### Component Naming Conventions:
- `PascalCase` for all React components.
- `camelCase` for custom hooks (must start with `use`).
- Files match the component name exactly: `PatientForm.tsx` exports `PatientForm`.

---

## 2. TypeScript — Strict Typing

**NEVER use `any`.** Every prop, state, and function must be typed.

```tsx
// ✅ Define explicit interfaces
interface Patient {
  id: string
  nik: string
  name: string
  birthDate: string
  gender: 'male' | 'female'
  ihsNumber?: string  // optional on creation
}

interface PatientCardProps {
  patient: Patient
  onSelect: (patient: Patient) => void
  isSelected?: boolean
}

export function PatientCard({ patient, onSelect, isSelected = false }: PatientCardProps) {
  return (
    <div
      role="button"
      aria-selected={isSelected}
      onClick={() => onSelect(patient)}
    >
      {patient.name}
    </div>
  )
}
```

### Use discriminated unions for complex state:
```tsx
type SubmitState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PathwayRecord }
  | { status: 'error'; message: string }

const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
```

---

## 3. State Management

### Decision Hierarchy:
1. **Local state** (`useState`) → Component-scoped, ephemeral data.
2. **Derived state** (computed during render) → Don't store what you can compute.
3. **Lifted state** (parent component) → When siblings need the same data.
4. **React Context** (`useContext`) → Subtree-scoped global data (e.g., auth user, theme).
5. **Server state** (Next.js Server Components/Actions) → Data from the server.

### Avoid Common Mistakes:
```tsx
// ❌ WRONG: Storing derived data in state
const [fullName, setFullName] = useState(`${firstName} ${lastName}`)

// ✅ CORRECT: Compute during render
const fullName = `${firstName} ${lastName}`
```

```tsx
// ❌ WRONG: Syncing props to state (stale data)
const [name, setName] = useState(props.name)

// ✅ CORRECT: Use props directly, or use a controlled pattern
const { name } = props
```

---

## 4. Custom Hooks — Extract Complex Logic

When a component has more than 2-3 `useState`/`useEffect` calls, extract a custom hook:

```tsx
// src/hooks/usePatientLookup.ts
"use client"
import { useState, useCallback } from 'react'
import type { Patient } from '@/types/satu-sehat'

interface UsePatientLookupReturn {
  patient: Patient | null
  isLoading: boolean
  error: string | null
  lookupByNik: (nik: string) => Promise<void>
}

export function usePatientLookup(): UsePatientLookupReturn {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookupByNik = useCallback(async (nik: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/satu-sehat/patient?nik=${nik}`)
      if (!res.ok) throw new Error('Patient not found')
      const data = await res.json()
      setPatient(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { patient, isLoading, error, lookupByNik }
}
```

---

## 5. Form Handling

For complex forms (like Clinical Pathway), use React's controlled component pattern with proper validation:

```tsx
"use client"
import { useState, FormEvent } from 'react'
import { PathwayFormSchema } from '@/lib/validations/pathway'

export function PathwayForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    // Validate with Zod
    const result = PathwayFormSchema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    // Submit via Server Action
    // await createPathwayAction(formData)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* form fields */}
    </form>
  )
}
```

---

## 6. Performance Rules

```tsx
// ✅ useMemo — only for expensive computations
const sortedPathways = useMemo(
  () => pathways.sort((a, b) => a.admissionDate.localeCompare(b.admissionDate)),
  [pathways]
)

// ✅ useCallback — only when passing callbacks to memoized child components
const handleSelect = useCallback((id: string) => {
  setSelectedId(id)
}, [])

// ❌ Do NOT useCallback/useMemo for everything — it adds overhead
```

---

## 7. Accessibility (A11y)

Every interactive element MUST be accessible:

```tsx
// ✅ Use semantic HTML
<button type="submit" aria-disabled={isLoading}>
  {isLoading ? 'Submitting...' : 'Submit Pathway'}
</button>

// ✅ Label all form fields
<label htmlFor="nik">NIK (National ID)</label>
<input id="nik" name="nik" type="text" required aria-describedby="nik-hint" />
<span id="nik-hint">Enter your 16-digit National ID number</span>

// ✅ ARIA roles for dynamic content
<div role="alert" aria-live="polite">{errorMessage}</div>
```

---

## ❌ Anti-Patterns — Hard Stops

```tsx
// ❌ Never mutate state directly
state.items.push(newItem) // WRONG
setItems([...items, newItem]) // CORRECT

// ❌ Never use index as key for dynamic lists
items.map((item, index) => <Item key={index} />) // WRONG
items.map((item) => <Item key={item.id} />) // CORRECT

// ❌ Never fetch in useEffect for initial page data (use Server Components)
// ❌ Never leave console.log in production code
// ❌ Never hardcode environment-specific values
// ❌ Never skip error boundaries on async routes
```
