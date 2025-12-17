"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Card, type Official } from "../entities/cards";
import { baseUrl } from "./constants";
import { fetchClient } from "./handlers";

const cardKeys = {
  all: ["cards"] as const,
  list: () => [...cardKeys.all, "list"] as const,
  get: (id: string) => [...cardKeys.all, id] as const,
  settings: (id: string) => [...cardKeys.all, `settings-${id}`] as const,
  officials: (id: string) => [...cardKeys.all, `officials-${id}`] as const,
};

export const useGetCardById = (id: string, token: string) => {
  return useQuery({
    queryKey: [id],
    queryFn: async () => {
      return fetchClient<Card>(`${baseUrl}/api/cards/${id}`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });
};

export const useListCards = (token: string) => {
  return useQuery({
    queryKey: cardKeys.list(),
    queryFn: () => listCards(token),
  });
};

export const listCards = async (token: string) => {
  return fetchClient<Card[]>(`${baseUrl}/api/cards`, {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export const useMutateCards = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.list() });
    },
  });
};

export type CreateCardProps = {
  token: string;
  toCreate: {
    name: string;
    date: string;
  };
};

const createCard = async (props: CreateCardProps) => {
  return fetchClient(`${baseUrl}/api/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.token}`,
    },
    body: JSON.stringify(props.toCreate),
  });
};

export const useMutateUpdateCards = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCards,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.list() });
    },
  });
};

export type updateCardsProps = {
  cardId: string;
  token: string;
  toUpdate: {
    name: string;
    date: string;
    status: string;
    numberOfJudges: number;
  };
};

const updateCards = async (props: updateCardsProps) => {
  return fetchClient(`${baseUrl}/api/cards/${props.cardId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.token}`,
    },
    body: JSON.stringify(props.toUpdate),
  });
};

export const useGetOfficials = (cardId: string, token: string) => {
  return useQuery({
    queryKey: cardKeys.officials(cardId),
    queryFn: () => getOfficials(cardId, token),
  });
};

export const getOfficials = async (cardId: string, token: string) => {
  return fetchClient<Official[]>(`${baseUrl}/api/cards/${cardId}/officials`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export type CreateOfficialProps = {
  token: string;
  toCreate: {
    name: string;
  };
};
export const useMutateOfficial = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: CreateOfficialProps) => createOfficial(cardId, props),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.officials(cardId) });
    },
  });
};

const createOfficial = async (cardId: string, props: CreateOfficialProps) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/officials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.token}`,
    },
    body: JSON.stringify(props.toCreate),
  });
};

export const useMutateDeleteOfficial = (cardId: string, token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (officialId: string) =>
      deleteOfficial(cardId, token, officialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.officials(cardId) });
    },
  });
};

const deleteOfficial = async (
  cardId: string,
  token: string,
  officialId: string
) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/officials/${officialId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export type UpdateOfficialProps = {
  token: string;
  toUpdate: {
    name: string;
  };
};

export const useMutateUpdateOfficial = (cardId: string, officialId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: UpdateOfficialProps) =>
      updateOfficial(cardId, officialId, props),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.officials(cardId) });
    },
  });
};

const updateOfficial = async (
  cardId: string,
  officialId: string,
  props: UpdateOfficialProps
) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/officials/${officialId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.token}`,
    },
    body: JSON.stringify(props.toUpdate),
  });
};
