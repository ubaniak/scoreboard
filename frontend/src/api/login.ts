import { useMutation, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { Login } from "../entities/login";
import { fetchClient } from "./fetchClient";

export const useMutateLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (login: Login) => loginFn(login.role, login.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["login"] });
    },
  });
};

const loginFn = async (role: string, code: string) => {
  return fetchClient<string>(`${baseUrl}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      code,
    }),
  });
};
