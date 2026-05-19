# Frontend Design Guidelines (Clinical Pathway)

> **Agent Directive**: Every UI element you create MUST pass the "premium feel" bar. Bland, generic, or default-browser-styled UIs are UNACCEPTABLE. Apply every section here before submitting.

---

## 1. Design System — Professional & Human-Centric

### Visual Excellence & Aesthetic
- **Avoid AI Clichés**: NEVER use excessive emojis, overused purple/blue gradients, or overly dramatic glassmorphism. The design should look like a professional enterprise application, not an AI playground.
- **Light & Warm Theme**: Prioritize light themes with warm, easy-on-the-eyes colors (e.g., warm off-whites, subtle earth tones, soft grays). Avoid harsh pure whites (#FFFFFF) or pure blacks (#000000).
- **Clean Professionalism**: Use flat or very subtly elevated surfaces. Keep borders clean and typography sharp. Focus on usability and readability, especially for healthcare professionals looking at screens all day.
  --color-success-500: hsl(142, 72%, 42%);
  --color-warning-500: hsl(38, 92%, 50%);
  --color-danger-500:  hsl(0, 84%, 60%);

  /* === NEUTRALS (dark theme base) === */
  --color-neutral-50:  hsl(210, 40%, 98%);
  --color-neutral-100: hsl(210, 40%, 96%);
  --color-neutral-200: hsl(214, 32%, 91%);
  --color-neutral-400: hsl(215, 20%, 65%);
  --color-neutral-600: hsl(215, 25%, 35%);
  --color-neutral-800: hsl(217, 33%, 17%);
  --color-neutral-900: hsl(222, 47%, 11%);
  --color-neutral-950: hsl(229, 84%, 5%);

  /* === SEMANTIC TOKENS === */
  --bg-base:       var(--color-neutral-950);
  --bg-surface:    hsl(222, 47%, 13%);
  --bg-elevated:   hsl(222, 47%, 16%);
  --bg-glass:      rgba(15, 23, 42, 0.7);

  --text-primary:  var(--color-neutral-50);
  --text-secondary: var(--color-neutral-400);
  --text-muted:    var(--color-neutral-600);

  --border-subtle:  rgba(255, 255, 255, 0.08);
  --border-default: rgba(255, 255, 255, 0.12);
  --border-focus:   var(--color-primary-500);

  /* === SPACING SCALE === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* === TYPOGRAPHY === */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;

  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
  --font-extrabold: 800;

  /* === RADIUS === */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;

  /* === SHADOWS === */
  --shadow-glow-primary: 0 0 24px rgba(99, 102, 241, 0.35);
  --shadow-card:         0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-elevated:     0 8px 32px rgba(0, 0, 0, 0.5);

  /* === TRANSITIONS === */
  --transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base:   250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow:   400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Typography

Import Inter from Google Fonts in `layout.tsx`:
```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
```

### Type Scale Rules:
- Page titles: `--text-3xl` to `--text-4xl`, `--font-extrabold`
- Section headers: `--text-xl` to `--text-2xl`, `--font-bold`
- Labels: `--text-sm`, `--font-semibold`, `letter-spacing: 0.05em`, UPPERCASE
- Body: `--text-base`, `--font-normal`
- Captions/hints: `--text-sm`, `--text-muted`

---

## 3. Color Usage

### Background Hierarchy (dark-first):
```
Page background    → var(--bg-base)       /* Darkest */
Card/Surface       → var(--bg-surface)    /* Slightly lighter */
Elevated elements  → var(--bg-elevated)   /* Inputs, dropdowns */
Glassmorphism      → var(--bg-glass) + backdrop-filter: blur(20px)
```

### Gradient Patterns:
```css
/* Page gradient accent */
.page-bg {
  background:
    radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
    var(--bg-base);
}

/* Text gradient for headings */
.gradient-text {
  background: linear-gradient(135deg, hsl(240, 95%, 75%) 0%, hsl(200, 89%, 65%) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Primary CTA button */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
  box-shadow: var(--shadow-glow-primary);
}
```

---

## 4. Component Recipes

### Glassmorphism Card:
```css
.card-glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}
```

### Premium Form Input:
```css
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.form-input::placeholder {
  color: var(--text-muted);
}
```

### Primary Button:
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-8);
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
  color: white;
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-glow-primary);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 32px rgba(99, 102, 241, 0.5);
}

.btn-primary:active {
  transform: translateY(0px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
```

---

## 5. Micro-Animations & Motion

Apply these subtly — every interactive element should provide tactile feedback:

```css
/* Entrance animation for cards/modals */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeSlideUp var(--transition-slow) ease-out forwards;
}

/* Stagger children animations */
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 60ms; }
.stagger-children > *:nth-child(3) { animation-delay: 120ms; }
.stagger-children > *:nth-child(4) { animation-delay: 180ms; }

/* Shimmer loading state */
@keyframes shimmer {
  to { background-position: 200% center; }
}

.skeleton {
  background: linear-gradient(90deg,
    var(--bg-elevated) 25%,
    var(--bg-glass) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% auto;
  animation: shimmer 1.5s linear infinite;
  border-radius: var(--radius-md);
}
```

---

## 6. Layout Patterns

### Responsive Form Grid:
```css
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
}

.form-grid .col-span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
```

### Section Divider with label:
```css
.section-divider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: var(--space-8) 0 var(--space-6);
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

.section-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
}
```

---

## 7. Status & Feedback States

Every form/action must show clear status:
```css
/* Error state on input */
.form-input.is-error {
  border-color: var(--color-danger-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

/* Success indicator */
.form-input.is-success {
  border-color: var(--color-success-500);
}

/* Field error message */
.field-error {
  font-size: var(--text-sm);
  color: var(--color-danger-500);
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
```

---

## ❌ Design Anti-Patterns — Hard Stops

```
❌ Using raw color values (#ff0000) — always use CSS variables.
❌ Default browser button styles — always override fully.
❌ Layouts without max-width constraints — always set a container max-width.
❌ Missing hover/focus/active states on interactive elements.
❌ Text directly on busy backgrounds without sufficient contrast.
❌ Forms without visible labels (placeholder-only is not accessible).
❌ Missing loading states for async operations.
❌ Static, unanimated page entries — always add entrance animations.
❌ Using Tailwind utility classes unless explicitly approved by the user.
```
