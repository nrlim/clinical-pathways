'use client'

export type WorkflowStep = {
  id: string
  label: string
  sublabel: string
}

export type WorkflowStepState = 'waiting' | 'running' | 'done' | 'error'

interface WorkflowProgressTrackerProps {
  steps: WorkflowStep[]
  stepStates: Record<string, WorkflowStepState>
  currentStepIndex: number
  isError?: boolean
  errorMessage?: string
  /** Called when user clicks the Minimize button */
  onMinimize?: () => void
}

const ICONS: Record<WorkflowStepState, string> = {
  waiting: '○',
  running: '◎',
  done: '✓',
  error: '✕',
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export function WorkflowProgressTracker({
  steps,
  stepStates,
  currentStepIndex,
  isError = false,
  errorMessage,
  onMinimize,
}: WorkflowProgressTrackerProps) {
  const doneCount = Object.values(stepStates).filter(s => s === 'done').length
  const totalSteps = steps.length
  const isDone = currentStepIndex >= totalSteps

  return (
    <div className="workflow-tracker animate-in" role="status" aria-live="polite">
      {/* Header row with title + minimize */}
      <div className="workflow-tracker-header">
        <div className="workflow-tracker-header-left">
          {isError ? (
            <>
              <div className="workflow-tracker-icon error" aria-hidden="true">✕</div>
              <div>
                <div className="workflow-tracker-title error">Workflow Gagal</div>
                <div className="workflow-tracker-subtitle">{errorMessage ?? 'Terjadi kesalahan. Silakan coba lagi.'}</div>
              </div>
            </>
          ) : isDone ? (
            <>
              <div className="workflow-tracker-icon done" aria-hidden="true">✓</div>
              <div>
                <div className="workflow-tracker-title done">Selesai!</div>
                <div className="workflow-tracker-subtitle">Semua langkah berhasil diproses.</div>
              </div>
            </>
          ) : (
            <>
              <div className="workflow-tracker-spinner" aria-hidden="true">
                <span /><span /><span />
              </div>
              <div>
                <div className="workflow-tracker-title">Brain AI sedang berjalan</div>
                <div className="workflow-tracker-subtitle">
                  Langkah {Math.min(currentStepIndex + 1, totalSteps)}/{totalSteps} — {steps[currentStepIndex]?.sublabel ?? 'Memproses...'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Minimize button only — no close */}
        <div className="workflow-tracker-actions">
          {onMinimize && (
            <button
              type="button"
              className="workflow-action-btn"
              onClick={onMinimize}
              title="Sembunyikan ke pojok layar"
              aria-label="Sembunyikan progress tracker"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isError && (
        <div className="workflow-progress-bar" role="progressbar" aria-valuenow={doneCount} aria-valuemax={totalSteps}>
          <div
            className="workflow-progress-fill"
            style={{ width: `${(doneCount / totalSteps) * 100}%` }}
          />
        </div>
      )}

      {/* Steps list */}
      <ol className="workflow-tracker-steps" aria-label="Langkah-langkah proses">
        {steps.map((step, idx) => {
          const state: WorkflowStepState = stepStates[step.id] ?? 'waiting'
          const isCurrent = idx === currentStepIndex && !isError

          return (
            <li
              key={step.id}
              className={`workflow-step-item ${state}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className={`workflow-step-icon ${state}`} aria-hidden="true">
                {state === 'running' ? (
                  <span className="workflow-step-pulse" />
                ) : (
                  ICONS[state]
                )}
              </div>
              <div className="workflow-step-text">
                <div className="workflow-step-label">{step.label}</div>
                <div className="workflow-step-sublabel">{step.sublabel}</div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`workflow-step-connector ${state === 'done' ? 'done' : ''}`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ─── Floating Bubble ──────────────────────────────────────────────────────────

interface WorkflowBubbleProps {
  currentStepIndex: number
  totalSteps: number
  stepLabel: string
  isError: boolean
  onExpand: () => void
}

export function WorkflowBubble({
  currentStepIndex,
  totalSteps,
  stepLabel,
  isError,
  onExpand,
}: WorkflowBubbleProps) {
  return (
    <button
      type="button"
      className={`workflow-bubble ${isError ? 'error' : ''}`}
      onClick={onExpand}
      aria-label="Buka progress workflow"
    >
      <div className="workflow-bubble-inner">
        {isError ? (
          <span className="workflow-bubble-icon error">✕</span>
        ) : (
          <span className="workflow-bubble-spinner" aria-hidden="true">
            <span /><span />
          </span>
        )}
        <div className="workflow-bubble-text">
          <span className="workflow-bubble-title">
            {isError ? 'Workflow Gagal' : 'Brain AI Berjalan…'}
          </span>
          <span className="workflow-bubble-sub">
            {isError ? 'Klik untuk detail' : `Langkah ${Math.min(currentStepIndex + 1, totalSteps)}/${totalSteps} — ${stepLabel}`}
          </span>
        </div>
        <span className="workflow-bubble-expand" aria-hidden="true">↗</span>
      </div>
    </button>
  )
}
