import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import { fetchClient } from "./handlers";
import type { DeviceStatus } from "../entities/device";

const keys = {
  all: ["devices"] as const,
  register: (id: number) => [...keys.all, id] as const,
};

export const useGetBaseUrl = (token: string) => {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => getBaseUrl(token),
  });
};

export const getBaseUrl = async (token: string) => {
  return fetchClient<string>(`${baseUrl}/api/devices/baseurl`, {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export const useRegister = (token: string, id: number) => {
  return useQuery({
    queryKey: keys.register(id),
    queryFn: () => getRegister(token, id),
  });
};

export const getRegister = async (token: string, id: number) => {
  return fetchClient<string>(`${baseUrl}/api/devices/register/judge/${id}`, {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export const useDeviceStatus = (token: string) => {
  return useQuery({
    queryKey: [],
    queryFn: () => getDeviceStatus(token),
    refetchInterval: 5000,
  });
};

export const getDeviceStatus = async (token: string) => {
  return fetchClient<DeviceStatus>(`${baseUrl}/api/devices/judge/status`, {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};
