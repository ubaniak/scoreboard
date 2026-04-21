"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Card, type CardStatus } from "../entities/cards";
import { baseUrl } from "./constants";
import type { CardRequestType, TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";

const keys = {
  all: (token: string) => ["cards", token] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
  get: (token: string, id: string) => [...keys.all(token), id] as const,
  officials: (token: string, id: string) => [...keys.all(token), `officials-${id}`] as const,
};

export const useGetCardById = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.get(props.token, props.cardId),
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
    queryKey: keys.list(props.token),
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
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export type UpdateCardsProps = {
  name: string;
  date: string;
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
      queryClient.invalidateQueries({ queryKey: keys.list(r.token) });
    },
  });
};

export const useMutateUpdateCardJudges = (r: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, numberOfJudges }: { id: CardRequestType; numberOfJudges: number }) => {
      return fetchClient(`${baseUrl}/api/cards/${id.cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${r.token}`,
        },
        body: JSON.stringify({ numberOfJudges }),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.get(r.token, id.cardId) });
    },
  });
};

export const useMutateDeleteCard = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) =>
      fetchClient(`${baseUrl}/api/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export const useMutateUploadCardImage = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      return fetchClient(`${baseUrl}/api/cards/${id}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
        body: form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export const useMutateRemoveCardImage = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchClient(`${baseUrl}/api/cards/${id}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${props.token}` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export const useMutateImportCard = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetchClient(`${baseUrl}/api/cards/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
        body: form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.list(r.token) });
      queryClient.invalidateQueries({ queryKey: keys.get(r.token, id.cardId) });
    },
  });
};
