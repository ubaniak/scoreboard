import { useMutation, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { Login } from "../entities/login";
import { ParseSuccessResponse } from "./types";

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
  const response = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      code,
    }),
  });
  console.log(response);
  if (response.status !== 200) {
    throw new Error("Failed to create card");
  }
  return ParseSuccessResponse<string>(response);
};
