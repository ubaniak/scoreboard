"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Card, type CardStatus } from "../entities/cards";
import { baseUrl } from "./constants";
import type { CardRequestType, TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";

// TODO: Add token to all the keys
const keys = {
  all: ["cards"] as const,
  list: () => [...keys.all, "list"] as const,
  get: (id: string) => [...keys.all, id] as const,
  settings: (id: string) => [...keys.all, `settings-${id}`] as const,
  officials: (id: string) => [...keys.all, `officials-${id}`] as const,
};

export const useGetCardById = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: [props.cardId],
    queryFn: async () => {
      return fetchClient<Card>(`${baseUrl}/api/cards/${props.cardId}`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
  });
};

export const useListCards = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.list(),
    enabled: !!props.token,
    queryFn: async () => {
      return await fetchClient<Card[]>(`${baseUrl}/api/cards`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
  });
};

export type CreateCardProps = {
  name: string;
  date: string;
};

export const useMutateCreateCards = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (toCreate: CreateCardProps) => {
      return fetchClient(`${baseUrl}/api/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(toCreate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list() });
    },
  });
};

export type UpdateCardsProps = {
  name: string;
  date: string;
  numberOfJudges: number;
};

export const useMutateUpdateCards = (r: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      toUpdate,
    }: {
      id: CardRequestType;
      toUpdate: UpdateCardsProps;
    }) => {
      return fetchClient(`${baseUrl}/api/cards/${id.cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${r.token}`,
        },
        body: JSON.stringify(toUpdate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list() });
    },
  });
};

export const useMutateUpdateCardStatus = (r: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: CardRequestType;
      status: CardStatus;
    }) => {
      return fetchClient(`${baseUrl}/api/cards/${id.cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${r.token}`,
        },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list() });
    },
  });
};
