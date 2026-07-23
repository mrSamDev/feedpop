import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useDailySummary } from "../src/hooks/useDailySummary";
import * as summaryApi from "../src/api/summaryApi";

vi.mock("../src/api/summaryApi", () => ({
  fetchCachedSummary: vi.fn(),
  generateDailySummary: vi.fn(),
}));

function renderHookWithQuery<T>(hook: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return renderHook(hook, { wrapper: Wrapper });
}

beforeEach(() => {
  vi.mocked(summaryApi.fetchCachedSummary).mockReset();
  vi.mocked(summaryApi.generateDailySummary).mockReset();
});

describe("useDailySummary", () => {
  it("surfaces an error when the cached-summary fetch fails", async () => {
    vi.mocked(summaryApi.fetchCachedSummary).mockRejectedValue(new Error("server down"));

    const { result } = renderHookWithQuery(() => useDailySummary());

    await waitFor(() => {
      expect(result.current.error).toBe("server down");
    });
  });

  it("exposes no error when the cached summary loads cleanly", async () => {
    vi.mocked(summaryApi.fetchCachedSummary).mockResolvedValue(null);

    const { result } = renderHookWithQuery(() => useDailySummary());

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.summary).toBeNull();
    });
  });
});