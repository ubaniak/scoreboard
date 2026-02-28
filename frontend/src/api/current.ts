import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "./fetchClient";
import { baseUrl } from "./constants";
import type { Current } from "../entities/current";

const keys = {
  current: ["current"],
};

export const useGetCurrent = () => {
  return useQuery({
    queryKey: keys.current,
    queryFn: async () => {
      return fetchClient<Current>(`${baseUrl}/api/current`, {
        headers: {
          "Content-type": "application/json",
        },
      });
    },
  });
};
