import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCachedSummary, generateDailySummary } from "../api/summaryApi";

const SUMMARY_KEY = ["daily-summary"];

export function useDailySummary() {
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
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
    summary: summary ?? null,
    isGenerating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    generate: mutation.mutate,
    dismiss,
  };
}
