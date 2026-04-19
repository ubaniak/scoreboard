import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BoutRequestType,
  CardRequestType,
  RoundRequestType,
  TokenBase,
} from "./entities";
import { fetchClient } from "./fetchClient";
import { baseUrl } from "./constants";
import type { ScoresByRound } from "../entities/scores";

const keys = {
  all: (token?: string) => ["scores", token] as const,
  bout: (token: string, cardId: string, boutId: string) =>
    ["scores", token, cardId, boutId] as const,
};

export const useGetScores = (
  props: Partial<TokenBase> & CardRequestType & BoutRequestType,
) => {
  return useQuery({
    queryKey: keys.all(props.token),
    queryFn: async () => {
      return fetchClient<ScoresByRound>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/scores`,
        {
          headers: {
            "Content-type": "application/json",
            ...(props.token && { Authorization: `Bearer ${props.token}` }),
          },
        },
      );
    },
  });
};

export const useMutateReadyScore = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/score/ready`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify({ name }),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all(props.token) });
    },
  });
};

export type ScoreRoundProps = {
  red: number;
  blue: number;
};

export const useMutateScoreRound = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScoreRoundProps) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all(props.token) });
    },
  });
};

export const useMutateCompleteScoreRound = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/score/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all(props.token) });
    },
  });
};

export const useMutateOverallWinner = (
  props: TokenBase & CardRequestType & BoutRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (winner: "red" | "blue") => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/overall-winner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify({ winner }),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all(props.token) });
    },
  });
};

export const useGetAllBoutScores = (props: TokenBase & CardRequestType & { boutIds: string[] }) => {
  return useQueries({
    queries: props.boutIds.map((boutId) => ({
      queryKey: keys.bout(props.token, props.cardId, boutId),
      queryFn: () =>
        fetchClient<ScoresByRound>(
          `${baseUrl}/api/cards/${props.cardId}/bouts/${boutId}/scores`,
          {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${props.token}`,
            },
          }
        ),
    })),
    combine: (results) => ({
      data: Object.fromEntries(
        props.boutIds.map((id, i) => [id, results[i].data ?? {}])
      ) as Record<string, ScoresByRound>,
      isLoading: results.some((r) => r.isLoading),
    }),
  });
};
