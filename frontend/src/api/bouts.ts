import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BoutStatus } from "../entities/bouts";
import { type Bout, type RoundDetails } from "../entities/cards";
import type { Corner, FoulTypes } from "../entities/corner";
import { baseUrl } from "./constants";
import type {
  BoutRequestType,
  CardRequestType,
  RoundRequestType,
  TokenBase,
} from "./entities";
import { fetchClient } from "./fetchClient";

const keys = {
  all: (token: string) => ["bouts", token] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
  fouls: (token: string) => [...keys.all(token), "fouls"] as const,
  get: (token: string, id: string) =>
    [...keys.all(token), `get-${id}`] as const,
  round: (token: string, boutId: string, roundNumber: number) =>
    [...keys.all(token), `bout-${boutId}-round-${roundNumber}`] as const,
};

export const useGetBoutById = (
  props: TokenBase & CardRequestType & BoutRequestType,
) => {
  return useQuery({
    queryKey: keys.get(props.token, props.boutId),
    queryFn: async () => {
      return fetchClient<Bout>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}`,
        {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      );
    },
  });
};

export const useGetBouts = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.list(props.token),
    queryFn: () => {
      return fetchClient<Bout[]>(`${baseUrl}/api/cards/${props.cardId}/bouts`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
  });
};

export type CreateBoutProps = {
  boutNumber: number;
  redCorner: string;
  blueCorner: string;
  ageCategory: string;
  gender: string;
  experience: string;
  referee: string;
  boutType: string;
  roundLength: number;
  gloveSize: string;
  redAthleteId?: number;
  blueAthleteId?: number;
};

export const useMutateCreateBout = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toCreate: CreateBoutProps) => {
      return fetchClient(`${baseUrl}/api/cards/${props.cardId}/bouts`, {
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

export type MakeDecisionProps = {
  winner: string;
  decision: string;
  comment: string;
};

export const useMutateMakeDecision = (
  props: TokenBase & CardRequestType & BoutRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MakeDecisionProps) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/decision/make`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.list(props.token),
      });
      queryClient.invalidateQueries({
        queryKey: keys.get(props.token, props.boutId),
      });
    },
  });
};

export type UpdateBoutProps = Partial<Bout>;

export const useMutateUpdateBout = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      toUpdate,
      boutInfo,
    }: {
      toUpdate: UpdateBoutProps;
      boutInfo: BoutRequestType;
    }) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${boutInfo.boutId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(toUpdate),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.list(props.token),
      });
    },
  });
};

export const useMutateImportBouts = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetchClient(`${baseUrl}/api/cards/${props.cardId}/bouts/import`, {
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

export const useMutateDeleteBout = (cardId: string, token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boutId: string) => deleteBout(cardId, token, boutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(token) });
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

export const useMutateCompleteBout = (
  props: TokenBase & CardRequestType & BoutRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
      queryClient.invalidateQueries({
        queryKey: keys.get(props.token, props.boutId),
      });
    },
  });
};

export const useMutateShowDecision = (
  props: TokenBase & CardRequestType & BoutRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/decision/show`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) });
      queryClient.invalidateQueries({
        queryKey: keys.get(props.token, props.boutId),
      });
    },
  });
};

export const useMutateUpdateBoutStatus = (
  props: TokenBase & CardRequestType & BoutRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: BoutStatus }) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.get(props.token, props.boutId),
      });
    },
  });
};

export type MutateHandleFoulProps = {
  corner: Corner;
  type: FoulTypes;
  foul: string;
  action: "add" | "remove";
};

export const useMutateHandleFoul = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MutateHandleFoulProps) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/foul`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.fouls(props.token),
      });
      queryClient.invalidateQueries({
        queryKey: keys.round(props.token, props.boutId, props.roundNumber),
      });
      queryClient.invalidateQueries({
        queryKey: keys.get(props.token, props.boutId),
      });
    },
  });
};

export const useGetFouls = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.fouls(props.token),
    queryFn: () => {
      return fetchClient<string[]>(
        `${baseUrl}/api/cards/${props.cardId}/fouls`,
        {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      );
    },
  });
};

export const useGetRound = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  return useQuery({
    queryKey: keys.round(props.token, props.boutId, props.roundNumber),
    queryFn: () => {
      return fetchClient<RoundDetails>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}`,
        {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      );
    },
  });
};

export type MutateEightCountProps = {
  corner: string;
  direction: "up" | "down";
};
export const useMutateEightCount = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MutateEightCountProps) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/eightcount`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.round(props.token, props.boutId, props.roundNumber),
      });
      queryClient.invalidateQueries({
        queryKey: keys.get(props.token, props.boutId),
      });
    },
  });
};

export const useMutateNextRoundState = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return fetchClient<number>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/next`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.get(props.token, props.boutId),
      });
      queryClient.invalidateQueries({
        queryKey: keys.round(props.token, props.boutId, props.roundNumber),
      });
    },
  });
};
