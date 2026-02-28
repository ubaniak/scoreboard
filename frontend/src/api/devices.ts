import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";
import type { JudgeDevice } from "../entities/device";

const keys = {
  all: ["devices"] as const,
  register: (id: number) => [...keys.all, id] as const,
};

export const useGetBaseUrl = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => {
      return fetchClient<string>(`${baseUrl}/api/devices/baseurl`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
  });
};

export const useMutationGenerateCode = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { role: string }) => {
      return fetchClient<string>(`${baseUrl}/api/devices/code`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-status"] });
    },
  });
};

export const useJudgeDevices = (props: TokenBase) => {
  return useQuery({
    queryKey: ["device-status"],
    queryFn: () => {
      return fetchClient<JudgeDevice[]>(`${baseUrl}/api/devices/judges`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
    refetchInterval: 5000,
  });
};
