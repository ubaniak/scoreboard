import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CardRequestType, TokenBase } from "./entities";
import { baseUrl } from "./constants";
import type { Official } from "../entities/cards";
import { fetchClient } from "./fetchClient";

const keys = {
  all: (token: string) => ["officials", token] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
  get: (token: string, id: string) => [...keys.all(token), id] as const,
};

export const useGetOfficials = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.list(props.token),
    queryFn: async () => {
      return fetchClient<Official[]>(
        `${baseUrl}/api/cards/${props.cardId}/officials`,
        {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        }
      );
    },
  });
};

export type CreateOfficialProps = {
  name: string;
};

export const useMutateCreateOfficial = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toCreate: CreateOfficialProps) => {
      return fetchClient(`${baseUrl}/api/cards/${props.cardId}/officials`, {
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

export const useMutateImportOfficials = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetchClient(`${baseUrl}/api/cards/${props.cardId}/officials/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
        body: form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};

export type UpdateOfficialProps = {
  name: string;
};

export const useMutateUpdateOfficial = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      toUpdate,
      officialId,
    }: {
      toUpdate: UpdateOfficialProps;
      officialId: string;
    }) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/officials/${officialId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(toUpdate),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
    },
  });
};
