import { useQuery } from "@tanstack/react-query";
import type { TokenBase, CardRequestType } from "./entities";
import { fetchClient } from "./fetchClient";
import { baseUrl } from "./constants";
import type { AuditLog } from "../entities/auditLogs";

const keys = {
  all: (token?: string) => ["auditLogs", token] as const,
  card: (token: string, cardId: string) => [...keys.all(token), cardId] as const,
};

export const useGetAuditLogs = (props: TokenBase & CardRequestType) => {
  return useQuery({
    queryKey: keys.card(props.token, props.cardId),
    queryFn: () =>
      fetchClient<AuditLog[]>(`${baseUrl}/api/cards/${props.cardId}/audit-logs`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      }),
  });
};

