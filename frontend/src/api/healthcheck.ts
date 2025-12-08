'use client";';
import { useQuery } from "@tanstack/react-query";

const HEALTH_CHECK_QUERY_KEY = ["healthCheck"];

export const useHealthCheck = () => {
  return useQuery({
    queryKey: HEALTH_CHECK_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/healthcheck`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });
};
