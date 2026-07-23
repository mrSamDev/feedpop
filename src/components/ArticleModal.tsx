import { useEffect, useId, useRef } from "react";
import DOMPurify from "dompurify";
import type { Article } from "../types";
import { formatDate } from "../lib/format";

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export function ArticleModal({ article, onClose }: ArticleModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  // Keep the latest onClose without re-triggering the effect on parent re-renders.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Remember the element that had focus before the dialog opened so we can
    // restore it when the dialog closes (SC 2.4.3 Focus Order).
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog on open.
    closeBtnRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        // Trap focus within the dialog (SC 2.4.3).
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, []);

  // RSS content is untrusted HTML from arbitrary sources — strip scripts and
  // event handlers before injecting into the DOM.
  const sanitized = DOMPurify.sanitize(article.content || article.description, {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "style"],
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="panel my-4 flex w-full max-w-2xl flex-col gap-0 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="chip chip-article">Article</span>
              {article.publishedAt && (
                <span className="chip chip-neutral">{formatDate(article.publishedAt)}</span>
              )}
            </div>
            <h2
              id={titleId}
              className="font-display text-2xl font-bold leading-tight text-ink"
            >
              {article.title}
            </h2>
            {article.author && (
              <p className="text-sm font-bold text-ink-muted">By {article.author}</p>
            )}
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close article"
            className="btn btn-secondary shrink-0 px-3 py-2"
          >
            ✕
          </button>
        </header>

        <div
          className="prose-sm max-h-[60vh] overflow-y-auto p-5 text-ink [&_a]:font-bold [&_a]:text-link [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-ink [&_p]:leading-relaxed [&_p]:text-sm [&_h1]:font-extrabold [&_h1]:text-lg [&_h2]:font-extrabold [&_h2]:text-base [&_h3]:font-bold [&_h3]:text-sm"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        <footer className="border-t-2 border-ink p-4">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-open px-4 py-2"
          >
            Read original <span className="sr-only">(opens in a new tab)</span> →
          </a>
        </footer>
      </div>
    </div>
  );
}