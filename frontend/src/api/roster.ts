import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { CardRequestType, TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";

export type RosterEntry = {
  athleteId: number;
  name: string;
  gender?: string;
  ageCategory?: string;
  experience?: string;
  weightClass?: number;
  available: boolean;
};

const keys = {
  all: (token: string) => ["roster", token] as const,
  list: (token: string, cardId: string) => [...keys.all(token), "list", cardId] as const,
};

export const useListRoster = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.list(props.token, props.cardId),
    enabled: !!props.token && !!props.cardId,
    queryFn: () =>
      fetchClient<RosterEntry[]>(`${baseUrl}/api/cards/${props.cardId}/roster`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      }),
  });
};

export const useMutateAddToRoster = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (athleteId: number) =>
      fetchClient(`${baseUrl}/api/cards/${props.cardId}/roster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify({ athleteId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token, props.cardId) });
    },
  });
};

export const useMutateRemoveFromRoster = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (athleteId: number) =>
      fetchClient(`${baseUrl}/api/cards/${props.cardId}/roster/${athleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token, props.cardId) });
    },
  });
};

export const useMutateSetRosterAvailable = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ athleteId, available }: { athleteId: number; available: boolean }) =>
      fetchClient(`${baseUrl}/api/cards/${props.cardId}/roster/${athleteId}/available`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify({ available }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token, props.cardId) });
    },
  });
};
