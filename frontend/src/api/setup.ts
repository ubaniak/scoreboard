import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import { fetchClient } from "./fetchClient";

type SetupStatus = { required: boolean };
type SetupResponse = { code: string };

export const useSetupStatus = () =>
  useQuery({
    queryKey: ["setup-status"],
    queryFn: () => fetchClient<SetupStatus>(`${baseUrl}/api/setup/status`),
    staleTime: Infinity,
  });

export const useMutateSetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchClient<SetupResponse>(`${baseUrl}/api/setup`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setup-status"] });
    },
  });
};
