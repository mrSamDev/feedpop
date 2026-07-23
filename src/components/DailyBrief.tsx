import type { DailySummary } from "../types";

interface DailyBriefProps {
  summary: DailySummary | null;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onDismiss: () => void;
}

export function DailyBrief({ summary, isGenerating, error, onGenerate, onDismiss }: DailyBriefProps) {
  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-pink-error/30 bg-pink-error/5 px-4 py-2.5 text-sm font-bold text-pink-error">
        <span>{error}</span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-pink-error hover:opacity-70"
        >
          ✕
        </button>
      </div>
    );
  }

  if (summary) {
    return (
      <div className="panel fade-in flex flex-col gap-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif" }}>
              ☕ Today's Brief
            </span>
            <span className="chip chip-category text-[0.6rem]">{summary.date}</span>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss summary"
            className="btn btn-secondary px-2 py-1 text-xs"
          >
            ✕
          </button>
        </div>

        <p className="text-sm leading-relaxed text-ink-80">{summary.summary}</p>

        {summary.topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.06em] text-ink-60">Topics</span>
            {summary.topics.map((topic) => (
              <span key={topic} className="chip chip-neutral text-[0.6rem]">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="panel fade-in flex items-center justify-between gap-3 px-5 py-3">
      <p className="text-sm font-bold text-ink-60">
        No daily brief yet
      </p>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        aria-label="Generate daily brief"
        className="btn btn-refresh px-4 py-2"
      >
        {isGenerating ? "Thinking…" : "Generate"}
      </button>
    </div>
  );
}
