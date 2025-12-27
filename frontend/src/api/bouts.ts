import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BoutStatus } from "../entities/bouts";
import { type Bout, type Round, type RoundDetails } from "../entities/cards";
import { baseUrl } from "./constants";
import { fetchClient } from "./handlers";

const boutKeys = {
  all: ["bouts"] as const,
  list: () => [...boutKeys.all, "list"] as const,
  fouls: ["fouls"],
  get: (id: string) => [...boutKeys.all, `get-${id}`] as const,
  settings: (id: string) => [...boutKeys.all, `settings-${id}`] as const,
  bouts: (id: string) => [...boutKeys.all, `bouts-${id}`] as const,
  rounds: (id: string) => [...boutKeys.all, `rounds-${id}`] as const,
  round: (boutId: string, roundNumber: number) =>
    [...boutKeys.all, `bout-${boutId}-round-${roundNumber}`] as const,
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

export const useMutateBoutStatus = (
  cardId: string,
  boutId: string,
  token: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: BoutStatus) =>
      updateBoutStatus(cardId, boutId, token, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boutKeys.get(boutId) });
    },
  });
};

const updateBoutStatus = async (
  cardId: string,
  boutId: string,
  token: string,
  status: BoutStatus
) => {
  return fetchClient(`${baseUrl}/api/cards/${cardId}/bouts/${boutId}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
};

export const useGetRounds = (cardId: string, boutId: string, token: string) => {
  return useQuery({
    queryKey: boutKeys.rounds(boutId),
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

export const useMutateAddFoul = (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      corner,
      type,
      foul,
    }: {
      corner: string;
      type: string;
      foul: string;
    }) => addFoul(cardId, boutId, roundNumber, token, corner, type, foul),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: boutKeys.fouls,
      });
      queryClient.invalidateQueries({
        queryKey: boutKeys.round(boutId, roundNumber),
      });
    },
  });
};

const addFoul = async (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string,
  corner: string,
  type: string,
  foul: string
) => {
  return fetchClient(
    `${baseUrl}/api/cards/${cardId}/bouts/${boutId}/rounds/${roundNumber}/foul`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ corner, type, foul }),
    }
  );
};

export const useGetFouls = (token: string) => {
  return useQuery({
    queryKey: boutKeys.fouls,
    queryFn: () => getFouls(token),
  });
};

export const getFouls = async (token: string) => {
  return fetchClient<string[]>(`${baseUrl}/api/cards/0/fouls`, {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export const useGetRound = (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string
) => {
  return useQuery({
    queryKey: boutKeys.round(boutId, roundNumber),
    queryFn: () => getRound(cardId, boutId, roundNumber, token),
  });
};

export const getRound = async (
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string
) => {
  return fetchClient<RoundDetails>(
    `${baseUrl}/api/cards/${cardId}/bouts/${boutId}/rounds/${roundNumber}`,
    {
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
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
        queryKey: boutKeys.fouls,
      });
      queryClient.invalidateQueries({
        queryKey: boutKeys.round(boutId, roundNumber),
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
  cardId: string,
  boutId: string,
  roundNumber: number,
  token: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return fetchClient(
        `${baseUrl}/api/cards/${cardId}/bouts/${boutId}/rounds/${roundNumber}/start`,
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
      queryClient.invalidateQueries({ queryKey: boutKeys.rounds(boutId) });
      queryClient.invalidateQueries({
        queryKey: boutKeys.round(boutId, roundNumber),
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
      queryClient.invalidateQueries({ queryKey: boutKeys.rounds(boutId) });
      queryClient.invalidateQueries({
        queryKey: boutKeys.round(boutId, roundNumber),
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
      queryClient.invalidateQueries({ queryKey: boutKeys.bouts(boutId) });
      queryClient.invalidateQueries({ queryKey: boutKeys.rounds(boutId) });
      queryClient.invalidateQueries({
        queryKey: boutKeys.round(boutId, roundNumber),
      });
    },
  });
};
