import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TokenBase } from "./entities";
import { baseUrl } from "./constants";
import type { Official } from "../entities/cards";
import { fetchClient } from "./fetchClient";

const keys = {
  all: (token: string) => ["officials", token] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
};

export const useGetOfficials = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.list(props.token),
    enabled: !!props.token,
    queryFn: async () => {
      return fetchClient<Official[]>(`${baseUrl}/api/officials`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
  });
};

export type CreateOfficialProps = {
  name: string;
  nationality?: string;
  gender?: string;
  yearOfBirth?: number;
  registrationNumber?: string;
  provinceAffiliationId?: number;
  nationAffiliationId?: number;
};

export const useMutateCreateOfficial = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toCreate: CreateOfficialProps) => {
      return fetchClient(`${baseUrl}/api/officials`, {
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

export const useMutateImportOfficials = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetchClient(`${baseUrl}/api/officials/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
        body: form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export type UpdateOfficialProps = {
  name: string;
  nationality?: string;
  gender?: string;
  yearOfBirth?: number;
  registrationNumber?: string;
  provinceAffiliationId?: number;
  nationAffiliationId?: number;
};

export const useMutateUpdateOfficial = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      toUpdate,
      officialId,
    }: {
      toUpdate: UpdateOfficialProps;
      officialId: string;
    }) => {
      return fetchClient(`${baseUrl}/api/officials/${officialId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(toUpdate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export const useMutateDeleteOfficial = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (officialId: string) =>
      fetchClient(`${baseUrl}/api/officials/${officialId}`, {
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
