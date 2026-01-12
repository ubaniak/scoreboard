import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BoutStatus } from "../entities/bouts";
import { type Bout, type Round, type RoundDetails } from "../entities/cards";
import { baseUrl } from "./constants";
import type {
  BoutRequestType,
  CardRequestType,
  RoundRequestType,
  TokenBase,
} from "./entities";
import type { Corner, FoulTypes } from "../entities/corner";
import { fetchClient } from "./fetchClient";

const keys = {
  all: ["bouts"] as const,
  list: () => [...keys.all, "list"] as const,
  fouls: ["fouls"],
  get: (id: string) => [...keys.all, `get-${id}`] as const,
  settings: (id: string) => [...keys.all, `settings-${id}`] as const,
  bouts: (id: string) => [...keys.all, `bouts-${id}`] as const,
  rounds: (id: string) => [...keys.all, `rounds-${id}`] as const,
  round: (boutId: string, roundNumber: number) =>
    [...keys.all, `bout-${boutId}-round-${roundNumber}`] as const,
};

export const useGetBoutById = (
  props: TokenBase & CardRequestType & BoutRequestType
) => {
  return useQuery({
    queryKey: keys.get(props.boutId),
    queryFn: async () => {
      return fetchClient<Bout>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}`,
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

export const useGetBouts = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.list(),
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
      queryClient.invalidateQueries({ queryKey: keys.list() });
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
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.list(),
      });
    },
  });
};

export const useMutateDeleteBout = (cardId: string, token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boutId: string) => deleteBout(cardId, token, boutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list() });
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

export const useMutateUpdateBoutStatus = (
  props: TokenBase & CardRequestType & BoutRequestType
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
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.get(props.boutId) });
    },
  });
};

export const useGetRounds = (cardId: string, boutId: string, token: string) => {
  return useQuery({
    queryKey: keys.rounds(boutId),
    queryFn: () => getRounds(cardId, boutId, token),
  });
};

export const getRounds = async (
  cardId: string,
  boutId: string,
  token: string
) => {
  return fetchClient<Round[]>(
    `${baseUrl}/api/cards/${cardId}/bouts/${boutId}/rounds`,
    {
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export type MutateAddFoulProps = {
  corner: Corner;
  type: FoulTypes;
  foul: string;
};

export const useMutateAddFoul = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MutateAddFoulProps) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/foul`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify(body),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.fouls,
      });
      queryClient.invalidateQueries({
        queryKey: keys.round(props.boutId, props.roundNumber),
      });
    },
  });
};

export const useGetFouls = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.fouls,
    queryFn: () => {
      return fetchClient<string[]>(`${baseUrl}/api/cards/0/fouls`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
  });
};

export const useGetRound = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType
) => {
  return useQuery({
    queryKey: keys.round(props.boutId, props.roundNumber),
    queryFn: () => {
      return fetchClient<RoundDetails>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}`,
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

export const useMutateEightCount = (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      corner,
      direction,
    }: {
      corner: string;
      direction: string;
    }) => eightCount(cardId, boutId, roundNumber, token, corner, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.fouls,
      });
      queryClient.invalidateQueries({
        queryKey: keys.round(boutId, roundNumber),
      });
    },
  });
};

const eightCount = async (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string,
  corner: string,
  direction: string
) => {
  return fetchClient(
    `${baseUrl}/api/cards/${cardId}/bouts/${boutId}/rounds/${roundNumber}/eightcount`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ corner, direction }),
    }
  );
};

export const useMutateStartRound = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rounds(props.boutId) });
      queryClient.invalidateQueries({
        queryKey: keys.round(props.boutId, props.roundNumber),
      });
    },
  });
};

export const useMutateScoreRound = (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return fetchClient(
        `${baseUrl}/api/cards/${cardId}/bouts/${boutId}/rounds/${roundNumber}/score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rounds(boutId) });
      queryClient.invalidateQueries({
        queryKey: keys.round(boutId, roundNumber),
      });
    },
  });
};

export const useMutateEndRound = (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: { decision: string }) => {
      return fetchClient(
        `${baseUrl}/api/cards/${cardId}/bouts/${boutId}/rounds/${roundNumber}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(props),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.bouts(boutId) });
      queryClient.invalidateQueries({ queryKey: keys.rounds(boutId) });
      queryClient.invalidateQueries({
        queryKey: keys.round(boutId, roundNumber),
      });
    },
  });
};
