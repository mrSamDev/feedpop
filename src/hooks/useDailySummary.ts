import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCachedSummary, generateDailySummary } from "../api/summaryApi";

const SUMMARY_KEY = ["daily-summary"];

export function useDailySummary() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: fetchCachedSummary,
    staleTime: 24 * 60 * 60_000,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (feeds: string[]) => generateDailySummary(feeds),
    onSuccess: (result) => {
      queryClient.setQueryData(SUMMARY_KEY, result);
    },
  });

  const dismiss = useCallback(() => {
    queryClient.setQueryData(SUMMARY_KEY, null);
  }, [queryClient]);

  return {
    summary: query.data ?? null,
    isGenerating: mutation.isPending,
    // Mutation errors take precedence (most recent user action); fall back to the
    // background cache-fetch error so it is never silently swallowed.
    error: errorMessage(mutation.error) ?? errorMessage(query.error),
    generate: mutation.mutate,
    dismiss,
  };
}

function errorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  return error.message;
}
