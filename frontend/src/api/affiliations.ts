import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";

export type AffiliationType = "club" | "province" | "nation" | "other";

export type Affiliation = {
  id: number;
  name: string;
  type: AffiliationType;
  imageUrl?: string;
};

const keys = {
  all: (token: string) => ["affiliations", token] as const,
  list: (token: string, type?: AffiliationType) =>
    [...keys.all(token), "list", type ?? "all"] as const,
};

export const useListAffiliations = (
  props: TokenBase & { type?: AffiliationType },
) => {
  return useQuery({
    queryKey: keys.list(props.token, props.type),
    enabled: !!props.token,
    queryFn: () =>
      fetchClient<Affiliation[]>(
        `${baseUrl}/api/affiliations${props.type ? `?type=${props.type}` : ""}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.token}`,
          },
        },
      ),
  });
};

export type CreateAffiliationProps = {
  name: string;
  type: AffiliationType;
};

export const useMutateCreateAffiliation = (props: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAffiliationProps) =>
      fetchClient(`${baseUrl}/api/affiliations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(props.token) }),
  });
};

export type UpdateAffiliationProps = {
  name?: string;
  type?: AffiliationType;
};

export const useMutateUpdateAffiliation = (props: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, toUpdate }: { id: number; toUpdate: UpdateAffiliationProps }) =>
      fetchClient(`${baseUrl}/api/affiliations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(toUpdate),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(props.token) }),
  });
};

export const useMutateDeleteAffiliation = (props: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchClient(`${baseUrl}/api/affiliations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${props.token}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(props.token) }),
  });
};

export const useMutateUploadAffiliationImage = (props: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      return fetchClient(`${baseUrl}/api/affiliations/${id}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
        body: form,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(props.token) }),
  });
};

export const useMutateRemoveAffiliationImage = (props: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchClient(`${baseUrl}/api/affiliations/${id}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${props.token}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all(props.token) }),
  });
};

export const useMutateImportAffiliations = (props: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetchClient(`${baseUrl}/api/affiliations/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
        body: form,
      });
    },
    onSuccess: () => qc.invalidateQueries(),
  });
};
