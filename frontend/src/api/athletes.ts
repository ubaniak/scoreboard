import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";

export type Athlete = {
  id: number;
  name: string;
  dateOfBirth: string;
  nationality?: string;
  clubId?: number;
  clubName?: string;
  provinceName?: string;
  provinceImageUrl?: string;
  nationName?: string;
  nationImageUrl?: string;
  imageUrl?: string;
};

const keys = {
  all: (token: string) => ["athletes", token] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
};

export const useListAthletes = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.list(props.token),
    enabled: !!props.token,
    queryFn: () =>
      fetchClient<Athlete[]>(`${baseUrl}/api/athletes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      }),
  });
};

export type CreateAthleteProps = {
  name: string;
  dateOfBirth: string;
  nationality: string;
  clubId?: number;
  provinceName?: string;
  provinceImageUrl?: string;
  nationName?: string;
  nationImageUrl?: string;
};

export const useMutateCreateAthlete = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAthleteProps) =>
      fetchClient(`${baseUrl}/api/athletes`, {
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

export type UpdateAthleteProps = {
  name?: string;
  dateOfBirth?: string;
  nationality?: string;
  clubId?: number;
  clearClub?: boolean;
  provinceName?: string;
  provinceImageUrl?: string;
  nationName?: string;
  nationImageUrl?: string;
};

export const useMutateUpdateAthlete = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, toUpdate }: { id: number; toUpdate: UpdateAthleteProps }) =>
      fetchClient(`${baseUrl}/api/athletes/${id}`, {
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

export const useMutateImportAthletes = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetchClient(`${baseUrl}/api/athletes/import`, {
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

export const useMutateUploadAthleteImage = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      return fetchClient(`${baseUrl}/api/athletes/${id}/image`, {
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

export const useMutateRemoveAthleteImage = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchClient(`${baseUrl}/api/athletes/${id}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${props.token}` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export const useMutateDeleteAthlete = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchClient(`${baseUrl}/api/athletes/${id}`, {
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
