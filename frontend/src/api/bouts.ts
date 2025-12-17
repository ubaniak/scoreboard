import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Bout } from "../entities/cards";
import { baseUrl } from "./constants";
import { fetchClient } from "./handlers";

const boutKeys = {
  all: ["bouts"] as const,
  list: () => [...boutKeys.all, "list"] as const,
  get: (id: string) => [...boutKeys.all, `get-${id}`] as const,
  settings: (id: string) => [...boutKeys.all, `settings-${id}`] as const,
  bouts: (id: string) => [...boutKeys.all, `bouts-${id}`] as const,
};

export const useGetBout = (cardId: string, boutId: string, token: string) => {
  return useQuery({
    queryKey: boutKeys.get(boutId),
    queryFn: () => getBout(cardId, boutId, token),
  });
};

export const getBout = async (
  cardId: string,
  boutId: string,
  token: string
) => {
  return fetchClient<Bout>(`${baseUrl}/api/cards/${cardId}/bouts/${boutId}`, {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export const useListBouts = (cardId: string, token: string) => {
  return useQuery({
    queryKey: boutKeys.list(),
    queryFn: () => listBouts(cardId, token),
  });
};

export const listBouts = async (cardId: string, token: string) => {
  return fetchClient<Bout[]>(`${baseUrl}/api/cards/${cardId}/bouts`, {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export const useMutateBout = (cardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: CreateBoutProps) => createBout(cardId, props),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boutKeys.list() });
    },
  });
};

export type CreateBoutProps = {
  token: string;
  toCreate: {
    boutNumber: number;
    redCorner: string;
    blueCorner: string;
    ageCategory: string;
    gender: string;
    experience: string;
  };
};

const createBout = async (cardId: string, props: CreateBoutProps) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/bouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.token}`,
    },
    body: JSON.stringify(props.toCreate),
  });
};

export type UpdateBoutProps = {
  token: string;
  toUpdate: Partial<Bout>;
};

export const useMutateUpdateBout = (cardId: string, boutId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: UpdateBoutProps) => updateBout(cardId, boutId, props),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boutKeys.get(boutId),
      });
    },
  });
};

const updateBout = async (
  cardId: string,
  boutId: string,
  props: UpdateBoutProps
) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/bouts/${boutId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.token}`,
    },
    body: JSON.stringify(props.toUpdate),
  });
};

export const useMutateDeleteBout = (cardId: string, token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boutId: string) => deleteBout(cardId, token, boutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boutKeys.list() });
    },
  });
};

const deleteBout = async (cardId: string, token: string, boutId: string) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/bouts/${boutId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};
