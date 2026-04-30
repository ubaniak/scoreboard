import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";
import { fetchClient } from "./fetchClient";

export type BackupConfig = {
  enabled: boolean;
  backupDir: string;
};

export type BackupEntry = {
  filename: string;
  createdAt: string;
};

const keys = {
  all: (token: string) => ["backup", token] as const,
  config: (token: string) => [...keys.all(token), "config"] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
};

export const useGetBackupConfig = ({ token }: TokenBase) =>
  useQuery({
    queryKey: keys.config(token),
    queryFn: () =>
      fetchClient<BackupConfig>(`${baseUrl}/api/backup/config`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  });

export const useMutateBackupConfig = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: BackupConfig) =>
      fetchClient<void>(`${baseUrl}/api/backup/config`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(config),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.config(token) }),
  });
};

export const useListBackups = ({ token }: TokenBase) =>
  useQuery({
    queryKey: keys.list(token),
    queryFn: () =>
      fetchClient<BackupEntry[]>(`${baseUrl}/api/backup/list`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  });

export const useMutateTriggerBackup = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchClient<void>(`${baseUrl}/api/backup/now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(token) }),
  });
};

export const useMutateDeleteBackup = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) =>
      fetchClient<void>(`${baseUrl}/api/backup/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(token) }),
  });
};

export const useMutateDownloadBackup = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(
        `${baseUrl}/api/backup/download?filename=${encodeURIComponent(filename)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

export const useMutateRestoreBackup = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: (filename: string) =>
      fetchClient<void>(`${baseUrl}/api/backup/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      }),
  });

export const useMutatePickBackupDir = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async () => {
      const res = await fetch(`${baseUrl}/api/backup/pick-dir`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) return null;
      if (!res.ok) throw new Error("Picker failed");
      const json = await res.json();
      return (json?.data?.path ?? json?.path ?? null) as string | null;
    },
  });

export const useQuitApp = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: () =>
      fetchClient<void>(`${baseUrl}/api/backup/quit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
  });
