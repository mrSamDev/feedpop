import { useState, type FormEvent } from "react";
import { normalizeUrl, isValidFeedUrl } from "../url";

interface AddFeedProps {
  isAdding: boolean;
  onAdd: (url: string) => void;
}

export function AddFeed({ isAdding, onAdd }: AddFeedProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const url = normalizeUrl(input);
    if (!isValidFeedUrl(url)) return;
    onAdd(url);
    setInput("");
  }

  return (
    <form onSubmit={handleSubmit} className="panel fade-in flex items-center gap-2 px-4 py-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste an RSS or Atom feed URL…"
        aria-label="Add feed URL"
        className="text-input flex-1"
      />
      <button
        type="submit"
        disabled={isAdding}
        aria-label="Add feed"
        className="btn btn-secondary px-4 py-2"
      >
        {isAdding ? "…" : "Add feed"}
      </button>
    </form>
  );
}