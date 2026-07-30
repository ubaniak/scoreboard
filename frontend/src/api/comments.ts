import { useMutation, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { CardRequestType, TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";
import { boutsQueryKeys } from "./bouts";

export type Comment = {
  id: number;
  comment: string;
};

export const useMutateAddBoutComment = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { boutId: string; comment: string }) =>
      fetchClient<{ id: number }>(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${args.boutId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify({ comment: args.comment }),
        },
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: boutsQueryKeys.get(props.token, vars.boutId) });
    },
  });
};

export const useMutateUpdateBoutComment = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { boutId: string; commentId: number; comment: string }) =>
      fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${args.boutId}/comments/${args.commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
          body: JSON.stringify({ comment: args.comment }),
        },
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: boutsQueryKeys.get(props.token, vars.boutId) });
    },
  });
};

export const useMutateDeleteBoutComment = (props: TokenBase & CardRequestType) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { boutId: string; commentId: number }) =>
      fetchClient(
        `${baseUrl}/api/cards/${props.cardId}/bouts/${args.boutId}/comments/${args.commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${props.token}`,
          },
        },
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: boutsQueryKeys.get(props.token, vars.boutId) });
    },
  });
};
