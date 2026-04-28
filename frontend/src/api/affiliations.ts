import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "./fetchClient";

export type Affiliation = {
  id: number;
  name: string;
  type: "club" | "province" | "nation" | "other";
  imageUrl?: string;
};

export type CreateAffiliationProps = {
  name: string;
  type: "club" | "province" | "nation" | "other";
};

export type UpdateAffiliationProps = {
  name?: string;
  type?: "club" | "province" | "nation" | "other";
};

export const useListAffiliations = (type?: string) => {
  const query = type ? `?type=${type}` : "";
  return useQuery<Affiliation[]>({
    queryKey: ["affiliations", type],
    queryFn: () => fetchClient(`/affiliations${query}`),
  });
};

export const useMutateCreateAffiliation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: CreateAffiliationProps) =>
      fetchClient("/affiliations", {
        method: "POST",
        body: JSON.stringify(props),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliations"] });
    },
  });
};

export const useMutateUpdateAffiliation = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: UpdateAffiliationProps) =>
      fetchClient(`/affiliations/${id}`, {
        method: "PUT",
        body: JSON.stringify(props),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliations"] });
    },
  });
};

export const useMutateDeleteAffiliation = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchClient(`/affiliations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliations"] });
    },
  });
};

export const useMutateUploadAffiliationImage = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return fetchClient(`/affiliations/${id}/image`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliations"] });
    },
  });
};

export const useMutateRemoveAffiliationImage = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchClient(`/affiliations/${id}/image`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliations"] });
    },
  });
};

export const useMutateImportAffiliations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return fetchClient("/affiliations/import", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliations"] });
    },
  });
};
