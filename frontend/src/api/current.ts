import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "./fetchClient";
import { baseUrl } from "./constants";
import type { Current, Schedule } from "../entities/current";

const keys = {
  current: ["current"],
  schedule: ["schedule"],
};

export const useGetCurrent = (options?: { refetchInterval?: number }) => {
  return useQuery({
    queryKey: keys.current,
    queryFn: async () => {
      return fetchClient<Current>(`${baseUrl}/api/current`, {
        headers: {
          "Content-type": "application/json",
        },
      });
    },
    refetchInterval: options?.refetchInterval,
  });
};

export const useGetSchedule = () => {
  return useQuery({
    queryKey: keys.schedule,
    queryFn: async () => {
      return fetchClient<Schedule>(`${baseUrl}/api/current/schedule`, {
        headers: {
          "Content-type": "application/json",
        },
      });
    },
  });
};
