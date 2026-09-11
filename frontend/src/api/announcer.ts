import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "./fetchClient";
import { baseUrl } from "./constants";
import type { Current } from "../entities/current";
import type { TokenBase } from "./entities";

const keys = {
  current: (token: string) => ["announcer-current", token] as const,
};

// Announcer-only twin of useGetCurrent — same shape, but winner/decision
// reveal on the admin's independent "Reveal to Announcer" trigger instead of
// the public Scoreboard's "Show Decision" trigger, and it never carries
// live per-round scores.
export const useGetAnnouncerCurrent = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.current(props.token),
    enabled: !!props.token,
    queryFn: async () => {
      return fetchClient<Current>(`${baseUrl}/api/current/announcer`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
  });
};

export const announcerQueryKeys = keys;
