import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CardRequestType, TokenBase } from "./entities";
import { baseUrl } from "./constants";
import type { Official } from "../entities/cards";
import { fetchClient } from "./fetchClient";

const keys = {
  all: ["officials"] as const,
  list: () => [...keys.all, "list"] as const,
  get: (id: string) => [...keys.all, id] as const,
};

export const useGetOfficials = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.list(),
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
      queryClient.invalidateQueries({ queryKey: keys.list() });
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
      queryClient.invalidateQueries({ queryKey: keys.list() });
    },
  });
};
