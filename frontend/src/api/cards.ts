"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Official } from "../entities/cards";
import { baseUrl } from "./constants";
import { fetchClient } from "./handlers";

const cardKeys = {
  all: ["cards"] as const,
  list: () => [...cardKeys.all, "list"] as const,
  get: (id: string) => [...cardKeys.all, id] as const,
  settings: (id: string) => [...cardKeys.all, `settings-${id}`] as const,
  officials: (id: string) => [...cardKeys.all, `officials-${id}`] as const,
};

export const useGetById = (id: string, token: string) => {
  return useQuery({
    queryKey: [id],
    queryFn: async () => {
      return fetchClient(`${baseUrl}/api/cards/${id}`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });
};

export const useGetCards = (token: string) => {
  return useQuery({
    queryKey: cardKeys.list(),
    queryFn: () => getCards(token),
  });
};

export const getCards = async (token: string) => {
  return fetchClient(`${baseUrl}/api/cards`, {
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

const createCard = async (newCard: { name: string; date: string }) => {
  return fetchClient(`${baseUrl}/api/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newCard),
  });
};

export const useMutateUpdateSettings = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [cardId] });
    },
  });
};

export type updateSettingsProps = {
  cardId: string;
  settings: {
    numberOfJudges: number;
  };
};

const updateSettings = async ({ cardId, settings }: updateSettingsProps) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
};

export const useGetOfficials = (cardId: string) => {
  return useQuery({
    queryKey: cardKeys.officials(cardId),
    queryFn: () => getOfficials(cardId),
  });
};

export const getOfficials = async (cardId: string) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/officials`);
};

export const useMutateOfficial = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (official: Official) => createOfficial(cardId, official),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.officials(cardId) });
    },
  });
};

const createOfficial = async (cardId: string, official: Official) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/officials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(official),
  });
};

export const useMutateDeleteOfficial = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (officialId: string) => deleteOfficial(cardId, officialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.officials(cardId) });
    },
  });
};

const deleteOfficial = async (cardId: string, officialId: string) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/officials/${officialId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const useMutateUpdateOfficial = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (official: Official) => updateOfficial(cardId, official),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.officials(cardId) });
    },
  });
};

const updateOfficial = async (cardId: string, official: Official) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/officials`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(official),
  });
};
