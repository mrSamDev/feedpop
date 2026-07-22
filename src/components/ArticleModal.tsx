import { useEffect } from "react";
import DOMPurify from "dompurify";
import type { Article } from "../types";
import { formatDate } from "../format";

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
}

export function ArticleModal({ article, onClose }: ArticleModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
              className="text-2xl font-bold leading-tight text-ink"
              style={{ fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif" }}
            >
              {article.title}
            </h2>
            {article.author && (
              <p className="text-sm font-bold text-ink-60">By {article.author}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close article"
            className="btn btn-secondary shrink-0 px-3 py-2"
          >
            ✕
          </button>
        </header>

        <div
          className="prose-sm max-h-[60vh] overflow-y-auto p-5 text-ink [&_a]:font-bold [&_a]:text-pink-cta-deep [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-ink [&_p]:leading-relaxed [&_p]:text-sm [&_h1]:font-extrabold [&_h1]:text-lg [&_h2]:font-extrabold [&_h2]:text-base [&_h3]:font-bold [&_h3]:text-sm"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        <footer className="border-t-2 border-ink p-4">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-open px-4 py-2"
          >
            Read original →
          </a>
        </footer>
      </div>
    </div>
  );
}