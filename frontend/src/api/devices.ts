import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";
import type { JudgeDevice } from "../entities/device";

const keys = {
  all: (token: string) => ["devices", token] as const,
  status: (token: string) => [...keys.all(token), "status"] as const,
  healthcheck: (token: string) => [...keys.all(token), "healthcheck"] as const,
};

export const useGetBaseUrl = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.all(props.token),
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
      queryClient.invalidateQueries({ queryKey: keys.status(props.token) });
    },
  });
};

export const useHealthCheck = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.healthcheck(props.token),
    enabled: !!props.token,
    queryFn: () => {
      return fetchClient<string>(`${baseUrl}/api/devices/healthcheck`, {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
      });
    },
    refetchInterval: 2000,
  });
};

export const useJudgeDevices = (props: TokenBase) => {
  return useQuery({
    queryKey: keys.status(props.token),
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
