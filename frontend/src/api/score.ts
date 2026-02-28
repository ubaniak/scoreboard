import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BoutRequestType,
  CardRequestType,
  RoundRequestType,
  TokenBase,
} from "./entities";
import { fetchClient } from "./fetchClient";
import { baseUrl } from "./constants";

const keys = {
  all: ["scores"] as const,
};

export const useGetScores = (
  props: TokenBase & CardRequestType & BoutRequestType,
) => {
  return useQuery({
    queryKey: keys.all,
    queryFn: async () => {
      return fetchClient<string>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/scores`,
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

export type ScoreBoutProps = {
  red: number;
  blue: number;
};

export const useMutateScoreBout = (
  props: TokenBase & CardRequestType & BoutRequestType & RoundRequestType,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScoreBoutProps) => {
      return fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${props.boutId}/rounds/${props.roundNumber}/score`,
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
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
};
