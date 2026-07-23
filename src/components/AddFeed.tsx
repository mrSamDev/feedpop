import { useState, type FormEvent } from "react";
import { normalizeUrl, isValidFeedUrl } from "../lib/url";

interface AddFeedProps {
  isAdding: boolean;
  onAdd: (url: string, title: string) => void;
}

export function AddFeed({ isAdding, onAdd }: AddFeedProps) {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const url = normalizeUrl(input);
    if (!isValidFeedUrl(url)) {
      setError("Enter a valid RSS or Atom feed URL.");
      return;
    }
    setError(null);
    onAdd(url, title.trim());
    setInput("");
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="panel fade-in flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="feed-url-input" className="sr-only">
          Add feed URL
        </label>
        <input
          id="feed-url-input"
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder="Paste an RSS or Atom feed URL…"
          aria-label="Add feed URL"
          aria-invalid={error !== null}
          aria-describedby={error ? "feed-url-error" : undefined}
          className="text-input flex-1"
        />
      </div>
      <div className="flex flex-col gap-1 sm:w-48">
        <label htmlFor="feed-title-input" className="sr-only">
          Custom feed title
        </label>
        <input
          id="feed-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title for sidebar (optional)"
          aria-label="Custom feed title"
          className="text-input sm:w-full"
        />
      </div>
      <button
        type="submit"
        disabled={isAdding}
        aria-label="Add feed"
        className="btn btn-secondary px-4 py-2 sm:shrink-0"
      >
        {isAdding ? "…" : "Add feed"}
      </button>
      {error && (
        <p id="feed-url-error" role="alert" className="w-full text-sm font-bold text-pink-error">
          {error}
        </p>
      )}
    </form>
  );
}