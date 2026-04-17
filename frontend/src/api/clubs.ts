import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";

export type Club = {
  id: number;
  name: string;
  location: string;
  imageUrl?: string;
};

const keys = {
  all: (token: string) => ["clubs", token] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
};

export const useListClubs = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.list(props.token),
    enabled: !!props.token,
    queryFn: () =>
      fetchClient<Club[]>(`${baseUrl}/api/clubs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      }),
  });
};

export type CreateClubProps = { name: string; location: string };

export const useMutateCreateClub = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateClubProps) =>
      fetchClient(`${baseUrl}/api/clubs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export type UpdateClubProps = { name?: string; location?: string };

export const useMutateUpdateClub = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, toUpdate }: { id: number; toUpdate: UpdateClubProps }) =>
      fetchClient(`${baseUrl}/api/clubs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(toUpdate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export const useMutateImportClubs = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetchClient(`${baseUrl}/api/clubs/import`, {
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

export const useMutateUploadClubImage = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      return fetchClient(`${baseUrl}/api/clubs/${id}/image`, {
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

export const useMutateRemoveClubImage = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchClient(`${baseUrl}/api/clubs/${id}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${props.token}` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export const useMutateDeleteClub = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchClient(`${baseUrl}/api/clubs/${id}`, {
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
